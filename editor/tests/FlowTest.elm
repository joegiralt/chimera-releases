-- SPDX-License-Identifier: GPL-3.0-or-later


module FlowTest exposing (suite)

import Addr exposing (Addr)
import Expect
import Flow exposing (Edit(..), Expiry(..))
import Protocol exposing (Command(..), Value(..))
import Test exposing (Test, describe, test)
import Time
import Wire exposing (addr)


at : Int -> Time.Posix
at =
    Time.millisToPosix


suite : Test
suite =
    let
        a : Addr
        a =
            addr "FILTER.CUTOFF"

        b : Addr
        b =
            addr "FILTER.RESO"

        busy : Flow.Flow
        busy =
            Flow.idle |> Flow.want (at 0) (SetTo a (Num 1)) |> Tuple.first |> Flow.want (at 5) (SetTo a (Num 2)) |> Tuple.first
    in
    describe "Flow"
        [ test "an_idle_window_sends_at_once" <|
            \_ -> Expect.equal (Just (Set a (Num 1))) (Flow.want (at 0) (SetTo a (Num 1)) Flow.idle |> Tuple.second)
        , test "a_busy_window_holds" <|
            \_ -> Expect.equal Nothing (Flow.want (at 5) (SetTo b (Num 1)) busy |> Tuple.second)
        , test "back_to_what_is_on_the_wire_waits_for_nothing" <|
            \_ ->
                busy
                    |> Flow.want (at 9) (SetTo a (Num 1))
                    |> Tuple.first
                    |> Flow.acked (at 10)
                    |> Tuple.mapFirst Flow.inFlight
                    |> Expect.equal ( Nothing, Nothing )
        , test "an_answered_edit_is_the_target_until_the_unit_reports_it" <|
            \_ ->
                let
                    landed : Flow.Flow
                    landed =
                        Flow.idle |> Flow.want (at 0) (SetTo a (Num 1)) |> Tuple.first |> Flow.acked (at 5) |> Tuple.first
                in
                ( Flow.target (SetTo a (Num 0)) landed
                , Flow.target (SetTo a (Num 0)) (Flow.heard (SetTo a (Num 1)) ((==) (SetTo a (Num 1))) landed)
                , Flow.target (SetTo a (Num 0)) (Flow.expire (at 1005) 1000 landed |> Tuple.first)
                )
                    |> Expect.equal ( Just (SetTo a (Num 1)), Nothing, Nothing )
        , test "the_target_is_the_waiting_want_then_the_wire" <|
            \_ ->
                ( Flow.target (SetTo a (Num 0)) busy, Flow.target (SetTo a (Num 0)) (Flow.acked (at 10) busy |> Tuple.first), Flow.target (SetTo b (Num 0)) busy )
                    |> Expect.equal ( Just (SetTo a (Num 2)), Just (SetTo a (Num 2)), Nothing )
        , test "in_time_nothing_expires" <|
            \_ -> Expect.equal Fresh (Flow.expire (at 999) 1000 busy |> Tuple.second)
        , test "a_late_set_goes_again_with_its_latest_value" <|
            \_ -> Expect.equal (Resent (Set a (Num 1)) (Set a (Num 2))) (Flow.expire (at 1000) 1000 busy |> Tuple.second)
        , test "late_twice_it_is_given_up_and_the_window_frees" <|
            \_ ->
                Flow.expire (at 1000) 1000 busy
                    |> Tuple.first
                    |> Flow.expire (at 2000) 1000
                    |> Tuple.mapFirst Flow.inFlight
                    |> Expect.equal ( Nothing, GaveUp (Set a (Num 2)) Nothing )
        , test "err_busy_shuts_the_window_and_the_latest_goes_when_it_opens" <|
            \_ ->
                let
                    shut : Flow.Flow
                    shut =
                        Flow.busy (at 10) busy |> Tuple.first
                in
                ( ( Flow.inFlight shut, Flow.target (SetTo a (Num 0)) shut )
                , Flow.expire (at 40) 1000 shut |> Tuple.second
                , Flow.expire (at 60) 1000 shut |> Tuple.second
                )
                    |> Expect.equal ( ( Nothing, Just (SetTo a (Num 2)) ), Fresh, Reopened (Just (Set a (Num 2))) )
        , test "a_want_while_shut_waits_for_the_window" <|
            \_ ->
                Flow.busy (at 10) busy
                    |> Tuple.first
                    |> Flow.want (at 20) (SetTo b (Num 1))
                    |> Tuple.second
                    |> Expect.equal Nothing
        , test "busy_again_and_again_it_is_given_up" <|
            \_ ->
                let
                    again : Int -> Flow.Flow -> ( Flow.Flow, Maybe Command )
                    again n f =
                        let
                            ( f1, gave ) =
                                Flow.busy (at (n * 2000)) f
                        in
                        case gave of
                            Just c ->
                                ( f1, Just c )

                            Nothing ->
                                case Flow.expire (at (n * 2000 + 1500)) 100000 f1 of
                                    ( f2, Reopened _ ) ->
                                        again (n + 1) f2

                                    ( f2, _ ) ->
                                        ( f2, Nothing )
                in
                again 1 (Flow.idle |> Flow.want (at 0) (SetTo a (Num 1)) |> Tuple.first)
                    |> Tuple.second
                    |> Expect.equal (Just (Set a (Num 1)))
        , test "a_want_the_unit_has_answered_and_not_yet_reported_is_not_sent_again" <|
            \_ ->
                Flow.idle
                    |> Flow.want (at 0) (SetTo a (Num 1))
                    |> Tuple.first
                    |> Flow.acked (at 5)
                    |> Tuple.first
                    |> Flow.want (at 6) (SetTo a (Num 1))
                    |> Tuple.second
                    |> Expect.equal Nothing
        , test "a_want_answered_and_since_reported_otherwise_is_sent_again" <|
            \_ ->
                Flow.idle
                    |> Flow.want (at 0) (SetTo a (Num 1))
                    |> Tuple.first
                    |> Flow.acked (at 5)
                    |> Tuple.first
                    |> Flow.heard (SetTo a (Num 1)) (\_ -> False)
                    |> Flow.want (at 6) (SetTo a (Num 1))
                    |> Tuple.second
                    |> Expect.equal (Just (Set a (Num 1)))
        , test "an_answer_lost_is_late_at_once" <|
            \_ -> Expect.equal (Resent (Set a (Num 1)) (Set a (Num 2))) (Flow.expire (at 20) 1000 (Flow.answerLost busy) |> Tuple.second)
        , test "waiting_wants_go_in_the_order_they_first_waited" <|
            \_ ->
                Flow.idle
                    |> Flow.want (at 0) (SetTo a (Num 1))
                    |> Tuple.first
                    |> Flow.want (at 1) (SetTo b (Num 1))
                    |> Tuple.first
                    |> Flow.want (at 2) (SetTo (addr "ENV1.HOLD") (Num 1))
                    |> Tuple.first
                    |> Flow.acked (at 3)
                    |> Tuple.second
                    |> Expect.equal (Just (Set b (Num 1)))
        , test "a_landed_edit_the_unit_never_spoke_of_is_untaken" <|
            \_ ->
                let
                    landed : Flow.Flow
                    landed =
                        Flow.idle |> Flow.want (at 0) (SetTo a (Num 1)) |> Tuple.first |> Flow.acked (at 5) |> Tuple.first
                in
                ( Flow.untaken (at 1005) 1000 landed
                , Flow.untaken (at 1005) 1000 (Flow.heard (SetTo a (Num 1)) (\_ -> False) landed)
                , Flow.untaken (at 1005) 1000 (Flow.forget (SetTo a (Num 0)) landed)
                )
                    |> Expect.equal ( [ SetTo a (Num 1) ], [], [] )
        ]
