-- SPDX-License-Identifier: GPL-3.0-or-later


module FlowTest exposing (suite)

import Addr exposing (Addr)
import Expect
import Flow exposing (Expiry(..))
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
            Flow.idle |> Flow.want (at 0) a (Num 1) |> Tuple.first |> Flow.want (at 5) a (Num 2) |> Tuple.first
    in
    describe "Flow"
        [ test "an_idle_window_sends_at_once" <|
            \_ -> Expect.equal (Just (Set a (Num 1))) (Flow.want (at 0) a (Num 1) Flow.idle |> Tuple.second)
        , test "a_busy_window_holds" <|
            \_ -> Expect.equal Nothing (Flow.want (at 5) b (Num 1) busy |> Tuple.second)
        , test "back_to_what_is_on_the_wire_waits_for_nothing" <|
            \_ ->
                busy
                    |> Flow.want (at 9) a (Num 1)
                    |> Tuple.first
                    |> Flow.acked (at 10)
                    |> Expect.equal ( Flow.idle, Nothing )
        , test "the_target_is_the_waiting_want_then_the_wire" <|
            \_ ->
                ( Flow.target a busy, Flow.target a (Flow.acked (at 10) busy |> Tuple.first), Flow.target b busy )
                    |> Expect.equal ( Just (Num 2), Just (Num 2), Nothing )
        , test "in_time_nothing_expires" <|
            \_ -> Expect.equal Fresh (Flow.expire (at 999) 1000 busy |> Tuple.second)
        , test "a_late_set_goes_again_with_its_latest_value" <|
            \_ -> Expect.equal (Resent (Set a (Num 1)) (Set a (Num 2))) (Flow.expire (at 1000) 1000 busy |> Tuple.second)
        , test "late_twice_it_is_given_up_and_the_window_frees" <|
            \_ ->
                Flow.expire (at 1000) 1000 busy
                    |> Tuple.first
                    |> Flow.expire (at 2000) 1000
                    |> Expect.equal ( Flow.idle, GaveUp (Set a (Num 2)) Nothing )
        ]
