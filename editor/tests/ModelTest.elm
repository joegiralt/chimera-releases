-- SPDX-License-Identifier: GPL-3.0-or-later


module ModelTest exposing (suite)

import Addr exposing (Addr)
import Dict
import Expect
import Fixture
import FixtureData
import Flow
import Hash
import Links
import Model exposing (Effect(..), Msg(..), Notice(..))
import Protocol exposing (Clock(..), Command(..), Learn(..), MapCommand(..), MapInput(..), MapKind(..), MapRow(..), OnOff(..), OptIndex, OrbitCommand(..), Playback(..), RowStatus(..), SaveInto(..), SchemaId(..), SlotState(..), Value(..))
import Schema
import Test exposing (Test, describe, test)
import Time
import Transport exposing (Link(..))
import Unit exposing (Engine(..))
import Wire exposing (addr, page)


at : Int -> Time.Posix
at =
    Time.millisToPosix


feed : List String -> Model.Model -> Model.Model
feed ls m =
    List.foldl (\l -> Model.step (Line l) >> Tuple.first) m ls


{-| The variant the model holds for a panel, as the unit names it.
-}
variantOf : String -> Model.Model -> Maybe String
variantOf name m =
    Dict.get name m.variants |> Maybe.map Protocol.variantText


{-| The lines to the unit among a step's effects.
-}
sends : List Effect -> List Command
sends =
    List.filterMap
        (\e ->
            case e of
                Send o ->
                    Just (Protocol.outgoingCommand o)

                Recall _ ->
                    Nothing

                Keep _ _ ->
                    Nothing
        )


{-| A step, and the lines it sends.
-}
stepSends : Msg -> Model.Model -> ( Model.Model, List Command )
stepSends msg =
    Model.step msg >> Tuple.mapSecond sends


tick : Int -> Model.Model -> ( Model.Model, List Command )
tick ms =
    stepSends (Tick (at ms))


{-| The hash the unit's `ed schema` gives a schema that describes as `ls`.
-}
hashOf : List String -> String
hashOf ls =
    Hash.toHex (Hash.ofLines ls)


algoHash : String
algoHash =
    hashOf algoPage


mixerHash : String
mixerHash =
    hashOf mixerPage


mtxHash : String
mtxHash =
    hashOf mtxPage


settingsHash : String
settingsHash =
    hashOf settingsPage


settingsPage : List String
settingsPage =
    [ "page 0 THM of 1"
    , "crumb \"PERSONAL\" \"THEME\""
    , "panel THM -"
    , "param THEME.ACCENT \"ACCENT\" choice lin 0 4 1 0 -"
    , "opt THEME.ACCENT 0 \"TEAL\""
    , "opt THEME.ACCENT 1 \"AMBER\""
    , "param PART3.SNAP \"SNAP\" choice lin 0 2 1 0 -"
    ]


mapHash : String
mapHash =
    hashOf mapPage


mapPage : List String
mapPage =
    [ "page 0 MAP of 1"
    , "input CC JUMP PICKUP SCALE TWOS-COMP OFFSET SIGNED SIGNED-2 MOMENTARY TOGGLE"
    , "input CC14 JUMP PICKUP SCALE"
    , "kind JUMP \"ABSOLUTE · JUMPS TO THE KNOB\" \"\""
    , "kind TWOS-COMP \"RELATIVE · TWOS COMPLEMENT\" \"+1 = 1  -1 = 127\""
    , "ccs 1 2 74"
    , "msbs 1 2 31"
    , "span 0 255"
    , "rows 16"
    , "maprows 90"
    ]


orbitHash : String
orbitHash =
    hashOf orbitPage


orbitPage : List String
orbitPage =
    [ "page 0 ORB of 1"
    , "panel ORB -"
    , "act \"RING\" RING"
    , "param ORBIT.KEY \"KEY\" choice lin 0 11 1 0 -"
    , "opt ORBIT.KEY 0 \"C\""
    , "opt ORBIT.KEY 1 \"C#\""
    , "act \"SCENE\" SCENE"
    , "param TEMPO.BPM \"BPM\" cont lin 30 300 1 120 -"
    , "param RING1.HITS \"HITS\" cont lin 0 32 1 4 m"
    ]


mtxPage : List String
mtxPage =
    [ "page 0 MTX of 1"
    , "src ENV1 \"ENV1\""
    , "src OP5 \"OP 5\""
    , "col FREQ FILTER.CUTOFF"
    , "amount -127 127"
    , "dests 16"
    ]


{-| The cache had nothing for the schema being recalled.
-}
missed : SchemaId -> String -> Model.Model -> Model.Model
missed s h m =
    m |> Model.step (Recalled { key = key s h, lines = Nothing }) |> Tuple.first


key : SchemaId -> String -> String
key s h =
    "4/" ++ Protocol.schemaToken s ++ "/" ++ h


algoPage : List String
algoPage =
    [ "page 0 ALG of 1"
    , "panel ALG -"
    , "param FILTER.CUTOFF \"CUTOFF\" cont oct 20 20000 1 1000 md"
    , "param ENV1.HOLD \"HOLD\" choice lin 0 2 1 0 -"
    , "opt ENV1.HOLD 0 \"OFF\""
    , "opt ENV1.HOLD 2 \"GATE EXT\""
    ]


vaPage : List String
vaPage =
    [ "page 0 VA of 1", "panel VA -", "param FILTER.CUTOFF \"CUTOFF\" cont oct 20 20000 1 1000 md" ]


mixerPage : List String
mixerPage =
    [ "page 0 REV of 1"
    , "panel REV -"
    , "param PART3.LEVEL \"LEVEL\" cont lin 0 1 0.0078125 0.75 m"
    , "panel REVERB HALL"
    , "param REVERB.SIZE \"SIZE\" cont lin 0 1 0.0078125 0.5 m"
    , "panel DELAY FREE"
    , "param DELAY.TIME \"TIME\" cont lin 10 500 8 375 m"
    , "panel DELAY SYNC"
    , "param DELAY.NOTE \"TIME\" cont lin 0 1 0.1 0.9 m"
    ]


{-| Said hello: about to ask for the followed engine's schema.
-}
greeted : Model.Model
greeted =
    Model.init
        |> Model.step (LinkChanged Open)
        |> Tuple.first
        |> tick 0
        |> Tuple.first
        |> feed [ "ed hello 4 0.3.0-dev part 1 ALGO", "OK" ]


gen : Int -> Maybe Unit.Gen
gen =
    Unit.genFromInt


cutoff : Addr
cutoff =
    addr "FILTER.CUTOFF"


{-| Every schema read but MAP's last `OK`.
-}
describingMap : Model.Model
describingMap =
    greeted
        |> tick 33
        |> Tuple.first
        |> feed [ "schema ALGO 1 " ++ algoHash, "OK" ]
        |> missed (EngineSchema Algo) algoHash
        |> tick 66
        |> Tuple.first
        |> feed (algoPage ++ [ "OK" ])
        |> tick 99
        |> Tuple.first
        |> feed [ "schema MIXER 1 " ++ mixerHash, "OK" ]
        |> missed MixerSchema mixerHash
        |> tick 132
        |> Tuple.first
        |> feed (mixerPage ++ [ "OK" ])
        |> tick 133
        |> Tuple.first
        |> feed [ "schema MTX-ALGO 1 " ++ mtxHash, "OK" ]
        |> missed (MatrixSchema Algo) mtxHash
        |> tick 134
        |> Tuple.first
        |> feed (mtxPage ++ [ "OK" ])
        |> tick 135
        |> Tuple.first
        |> feed [ "schema SETTINGS 1 " ++ settingsHash, "OK" ]
        |> missed SettingsSchema settingsHash
        |> tick 136
        |> Tuple.first
        |> feed (settingsPage ++ [ "OK" ])
        |> tick 137
        |> Tuple.first
        |> feed [ "schema MAP 1 " ++ mapHash, "OK" ]
        |> missed MapSchema mapHash
        |> tick 138
        |> Tuple.first
        |> feed mapPage


{-| Every schema read but ORBIT's last `OK`.
-}
describingOrbit : Model.Model
describingOrbit =
    describingMap
        |> feed [ "OK" ]
        |> tick 139
        |> Tuple.first
        |> feed [ "schema ORBIT 1 " ++ orbitHash, "OK" ]
        |> missed OrbitSchema orbitHash
        |> tick 140
        |> Tuple.first
        |> feed orbitPage


{-| A connected editor that has said hello and read a one-page schema of
each kind (the engine's, MIXER's, the matrix's, SETTINGS', MAP's and
ORBIT's), none cached: following, nothing asked yet.
-}
following : Model.Model
following =
    feed [ "OK" ] describingOrbit


cutoffLine : String -> String
cutoffLine v =
    "val FILTER.CUTOFF 0.5 " ++ v ++ " \"" ++ v ++ " Hz\""


{-| Each kept notice as the UI says it, newest first.
-}
said : Model.Model -> List String
said m =
    Model.notices m |> List.map (.notice >> Model.noticeText)


isUnread : Notice -> Bool
isUnread n =
    case n of
        Unread _ ->
            True

        Unsendable _ ->
            False

        Unsent _ ->
            False

        NoAnswer _ ->
            False

        BusyGaveUp _ ->
            False

        RefusedUnnamed _ ->
            False

        NotSent _ ->
            False

        LeftPart _ ->
            False

        Untaken _ ->
            False

        Declined _ ->
            False

        Refusal _ ->
            False


isRefusalOrUnread : Notice -> Bool
isRefusalOrUnread n =
    case n of
        Unread _ ->
            True

        Refusal _ ->
            True

        Unsendable _ ->
            False

        Unsent _ ->
            False

        NoAnswer _ ->
            False

        BusyGaveUp _ ->
            False

        RefusedUnnamed _ ->
            True

        NotSent _ ->
            False

        LeftPart _ ->
            False

        Untaken _ ->
            False

        Declined _ ->
            False


shown : Model.Model -> Maybe String
shown m =
    Model.shown cutoff m |> Maybe.map .text


{-| Option `n` as a set's value; a negative `n` is no option at all.
-}



-- A pick of option `n`, as a hand's reaches the model.


pick : Addr -> Int -> Model.Model -> List Command
pick a n m =
    Protocol.optIndex n
        |> Maybe.map (\i -> stepSends (Pick a i) m |> Tuple.second)
        |> Maybe.withDefault []


idx : Int -> Value
idx n =
    case Protocol.optIndex n of
        Just i ->
            Index i

        Nothing ->
            Name "no option"


suite : Test
suite =
    describe "Model"
        [ test "a_choice_pick_uses_the_active_variants_names" <|
            \_ ->
                let
                    under : List ( String, String ) -> String -> Int -> List Command
                    under v a i =
                        pick (addr a) i { following | schema = Fixture.schema, variants = Dict.fromList (List.filterMap (\( n, w ) -> Protocol.variantName w |> Maybe.map (Tuple.pair n)) v) }
                in
                Expect.all
                    [ \_ -> Expect.equal [ Set (addr "FILTER.MODE") (idx 1) ] (under [ ( "FILTER", "LADDER" ) ] "FILTER.MODE" 1)
                    , \_ -> Expect.equal [ Set (addr "ENV1.FORM") (idx 0) ] (under [ ( "ENV1", "B-LFO" ) ] "ENV1.FORM" 0)
                    ]
                    ()
        , test "every_choice_under_every_variant_sends_an_option_that_variant_lists" <|
            \_ ->
                let
                    bad : List ( String, String, OptIndex )
                    bad =
                        Schema.pages Fixture.schema
                            |> List.concatMap .panels
                            |> List.filterMap (\pn -> pn.variant |> Maybe.map (\v -> { name = pn.name, variant = v, params = pn.params }))
                            |> List.concatMap
                                (\pn ->
                                    pn.params
                                        |> List.filter (\p -> not (List.isEmpty p.options))
                                        |> List.concatMap
                                            (\p ->
                                                p.options
                                                    |> List.filterMap
                                                        (\( i, name ) ->
                                                            let
                                                                sent : List Command
                                                                sent =
                                                                    { following | schema = Fixture.schema, variants = Dict.fromList [ ( pn.name, pn.variant ) ] }
                                                                        |> stepSends (Pick p.addr i)
                                                                        |> Tuple.second
                                                            in
                                                            if name /= "" && sent == [ Set p.addr (Index i) ] then
                                                                Nothing

                                                            else
                                                                Just ( pn.name, Protocol.variantText pn.variant, i )
                                                        )
                                            )
                                )
                in
                Expect.equal [] bad
        , test "a_val_the_schema_does_not_list_is_dropped" <|
            \_ ->
                Expect.equal Nothing
                    (following |> feed [ "val OUT.PAN 0.5 0 \"C\"" ] |> Model.shown (addr "OUT.PAN"))
        , describe "a unit without `ed` (0.3): its version asked, and what to do said"
            (let
                hailed : Model.Model
                hailed =
                    Model.init |> Model.step (LinkChanged Open) |> Tuple.first |> tick 0 |> Tuple.first

                ( refused, asked ) =
                    hailed |> stepSends (Line "ERR unknown command ed, try help")

                -- 0.3's `status`, as its console writes it.
                told : Model.Model
                told =
                    refused |> feed [ "firmware 0.3.0 release", "build 2c8c47aa2", "protocol 3", "project NEW PROJECT", "state new", "part 1", "at PART 1 > ALGORITHM", "sram4 ok", "OK" ]
             in
             [ test "it_asks_status_and_nothing_else" <|
                \_ -> Expect.equal ( [ AskStatus ], [] ) ( asked, (tick 33 told |> Tuple.second) ++ (tick 2000 refused |> Tuple.second) )
             , test "the_status_names_its_version" <|
                \_ -> Expect.equal (Just "THIS EDITOR NEEDS CHIMERA 0.4 OR LATER. THIS UNIT IS RUNNING 0.3.0.") (Model.notice told)
             , test "a_status_with_no_firmware_line_names_none" <|
                \_ -> Expect.equal (Just "THIS EDITOR NEEDS CHIMERA 0.4 OR LATER.") (feed [ "ERR unknown command status, try help" ] refused |> Model.notice)
             , test "before_the_status_answers_it_says_so_without_the_version" <|
                \_ -> Expect.equal (Just "THIS EDITOR NEEDS CHIMERA 0.4 OR LATER.") (Model.notice refused)
             , test "the_download_page_is_given_with_it" <|
                \_ -> Expect.equal ( Just Links.downloadUrl, Nothing ) ( Model.download told, Model.download following )
             , test "nothing_the_status_says_is_a_notice_of_its_own" <|
                \_ -> Expect.equal 0 (List.length (Model.notices told))
             ]
            )
        , test "the_status_names_the_link_part_and_engine_once_following" <|
            \_ ->
                let
                    sim : Model.Model
                    sim =
                        following |> Model.update (Connect Model.ViaSimulator) |> Tuple.first
                in
                Expect.all
                    [ \_ -> Expect.equal (Just "SIMULATOR · PART 1 · ALGO") (Model.status sim)
                    , \_ -> Expect.equal (Just "UNIT · PART 1 · ALGO") (Model.status (Model.update (Connect Model.ViaUnit) following |> Tuple.first))
                    , \_ -> Expect.equal Nothing (Model.status Model.init)
                    ]
                    ()
        , test "connect_runs_hello_describe_then_since_0" <|
            \_ ->
                let
                    ( m, c ) =
                        following |> tick 99
                in
                Expect.all
                    [ \_ -> Expect.equal [ Since Nothing ] c
                    , \_ -> Expect.equal [ Hello ] (Model.init |> Model.step (LinkChanged Open) |> Tuple.first |> tick 0 |> Tuple.second)
                    , \_ -> Expect.equal 1 (List.length (Schema.pages m.schema))
                    , \_ -> Expect.equal (Just "CUTOFF") (Schema.param cutoff m.schema |> Maybe.map .label)
                    ]
                    ()
        , test "describe_walks_every_page_before_following" <|
            \_ ->
                let
                    ( _, c ) =
                        greeted
                            |> tick 33
                            |> Tuple.first
                            |> feed [ "schema ALGO 2 " ++ algoHash, "OK" ]
                            |> missed (EngineSchema Algo) algoHash
                            |> tick 66
                            |> Tuple.first
                            |> feed [ "page 0 A of 2", "panel A -", "OK" ]
                            |> tick 99
                in
                Expect.equal [ Describe (EngineSchema Algo) (page 1) ] c
        , test "shows_only_the_units_value" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> feed [ cutoffLine "1000", "OK 1" ]
                            |> Model.step (Edit cutoff (Num 5000))
                            |> Tuple.first
                in
                Expect.all
                    [ \_ -> Expect.equal (Just "1000 Hz") (shown m)
                    , \_ -> Expect.equal (Just "1000 Hz") (m |> feed [ "OK queued" ] |> shown)
                    , \_ -> Expect.equal (Just "1000 Hz") (m |> feed [ "ERR busy" ] |> shown)
                    , \_ -> Expect.equal (Just "5000 Hz") (m |> feed [ cutoffLine "5000" ] |> shown)
                    ]
                    ()
        , test "an_edit_sends_set" <|
            \_ ->
                Expect.equal [ Set cutoff (Num 5000) ]
                    (following |> stepSends (Edit cutoff (Num 5000)) |> Tuple.second)
        , test "a_refusal_from_since_shows_the_units_reason_until_its_next_value" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> feed [ cutoffLine "1000", "OK 1" ]
                            |> Model.step (Edit cutoff (Num 5000))
                            |> Tuple.first
                            |> feed [ "OK queued", "refused FILTER.CUTOFF \"NOT ON THIS MACHINE\"", "OK 2" ]
                in
                Expect.all
                    [ \_ -> Expect.equal (Just "NOT ON THIS MACHINE") (Model.refusal cutoff m)
                    , \_ -> Expect.equal (Just "1000 Hz") (shown m)
                    , \_ -> Expect.equal Nothing (Model.refusal cutoff (feed [ cutoffLine "1200", "OK 3" ] m))
                    , \_ -> Expect.equal (Just "NOT ON THIS MACHINE") (Model.refusal cutoff (feed [ "val ENV1.HOLD 0 0 \"OFF\"", "OK 3" ] m))
                    ]
                    ()
        , test "an_err_to_a_set_shows_the_same_way" <|
            \_ ->
                following
                    |> feed [ cutoffLine "1000", "OK 1" ]
                    |> Model.step (Edit cutoff (Num 5000))
                    |> Tuple.first
                    |> feed [ "ERR ed set FILTER.CUTOFF takes a number" ]
                    |> Expect.all
                        [ Model.refusal cutoff >> Expect.equal (Just "takes a number")
                        , shown >> Expect.equal (Just "1000 Hz")
                        , Model.notice >> Expect.equal Nothing
                        ]
        , test "no_value_is_guessed_an_edit_shows_nothing_until_the_unit_reports" <|
            \_ ->
                following
                    |> feed [ cutoffLine "1000", "OK 1" ]
                    |> Model.step (Edit cutoff (Num 5000))
                    |> Tuple.first
                    |> Model.step (Tick (at 5000))
                    |> Tuple.first
                    |> shown
                    |> Expect.equal (Just "1000 Hz")
        , test "a_new_part_drops_its_refusals" <|
            \_ ->
                following
                    |> feed [ "refused FILTER.CUTOFF \"NO\"", "OK 1", "part 2 ALGO", "OK 2" ]
                    |> Model.refusal cutoff
                    |> Expect.equal Nothing
        , test "a_whole_answer_says_no_refusal_part_2_never_shows_part_1s" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> feed [ "part 1 ALGO", cutoffLine "1000", "OK 1", "refused FILTER.CUTOFF \"PART 1'S\"", "OK 2" ]
                            |> feed [ "", "part 2 ALGO", cutoffLine "1000", "refused FILTER.CUTOFF \"PART 1'S\"", "OK 3" ]
                in
                Expect.all
                    [ \_ -> Expect.equal Nothing (Model.refusal cutoff m)
                    , \_ -> Expect.equal (Just "1000 Hz") (shown m)

                    -- A diff after it says Part 2's own.
                    , \_ -> Expect.equal (Just "PART 2'S") (Model.refusal cutoff (feed [ "refused FILTER.CUTOFF \"PART 2'S\"", "OK 4" ] m))
                    ]
                    ()
        , test "since_0_is_whole_its_refusals_stale" <|
            \_ ->
                following
                    |> feed [ "part 1 ALGO", "refused FILTER.CUTOFF \"OLD\"", "OK 1" ]
                    |> Model.refusal cutoff
                    |> Expect.equal Nothing
        , test "a_refusal_of_an_address_not_in_the_schema_is_ignored" <|
            \_ ->
                following
                    |> feed [ "part 1 ALGO", "OK 1", "refused PAD3.CHOKE \"9 GROUPS · KIT HOLDS 8\"", "OK 2" ]
                    |> Model.refusal (addr "PAD3.CHOKE")
                    |> Expect.equal Nothing
        , test "since_answer_replaces_values_and_gen" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> feed [ "part 1 ALGO", "panel FILTER CLEAN", cutoffLine "1000", "OK 5" ]
                            |> feed [ cutoffLine "2000", "panel FILTER 2040", "OK 6" ]
                in
                Expect.all
                    [ \_ -> Expect.equal (Just "2000 Hz") (shown m)
                    , \_ -> Expect.equal (gen 6) m.gen
                    , \_ -> Expect.equal (Just "2040") (variantOf "FILTER" m)
                    ]
                    ()
        , test "a_stale_answer_number_is_never_zero" <|
            \_ ->
                Expect.equal Nothing (following |> feed [ "OK 0" ]).gen
        , test "one_since_in_flight" <|
            \_ ->
                let
                    ( m1, c1 ) =
                        following |> tick 99

                    ( m2, c2 ) =
                        m1 |> tick 132

                    ( m3, c3 ) =
                        m2 |> feed [ "OK 4" ] |> tick 165

                    ( _, c4 ) =
                        m3 |> tick 198
                in
                Expect.equal [ [ Since Nothing ], [], [ Since (gen 4) ], [] ] [ c1, c2, c3, c4 ]
        , test "a_hello_timeout_halts_and_a_late_ok_never_reaches_following" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        Model.init
                            |> Model.step (LinkChanged Open)
                            |> Tuple.first
                            |> tick 0
                            |> Tuple.first
                            |> tick 1000
                            |> Tuple.first
                            |> feed [ "ed hello 4 b part 1 ALGO", "OK" ]
                in
                Expect.all
                    [ \x -> Expect.equal (Just "THE UNIT STOPPED ANSWERING") (Model.notice x)
                    , \x -> Expect.equal [] (tick 1033 x |> Tuple.second)
                    , \x -> Expect.equal [] (tick 5000 x |> Tuple.second)
                    ]
                    m
        , test "a_describe_timeout_halts_the_same_way" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        Model.init
                            |> Model.step (LinkChanged Open)
                            |> Tuple.first
                            |> tick 0
                            |> Tuple.first
                            |> feed [ "ed hello 4 b part 1 ALGO", "OK" ]
                            |> tick 33
                            |> Tuple.first
                            |> feed [ "schema ALGO 2 " ++ algoHash, "OK" ]
                            |> missed (EngineSchema Algo) algoHash
                            |> tick 66
                            |> Tuple.first
                            |> feed [ "page 0 A of 2", "panel A -" ]
                            |> tick 1066
                            |> Tuple.first
                            |> feed [ "OK" ]
                in
                Expect.all
                    [ \x -> Expect.equal (Just "THE UNIT STOPPED ANSWERING") (Model.notice x)
                    , \x -> Expect.equal [] (tick 1099 x |> Tuple.second)
                    ]
                    m
        , test "a_since_timeout_re_asks_once_and_no_third_goes_out_until_the_re_asks_answer" <|
            \_ ->
                let
                    ( m1, c1 ) =
                        following |> tick 99

                    ( m2, c2 ) =
                        m1 |> tick 1099

                    -- the late answer to the first ask
                    ( m3, c3 ) =
                        m2 |> feed [ "OK 4" ] |> tick 1132

                    -- the re-ask's answer
                    ( _, c4 ) =
                        m3 |> feed [ "OK 5" ] |> tick 1165
                in
                Expect.equal [ [ Since Nothing ], [ Since Nothing ], [], [ Since (gen 5) ] ] [ c1, c2, c3, c4 ]
        , test "a_busy_since_is_asked_again_quietly_later_each_time" <|
            \_ ->
                let
                    -- Following asks at 99; the unit busy: `ERR busy`.
                    ( m1, _ ) =
                        following |> tick 99

                    busy1 : Model.Model
                    busy1 =
                        m1 |> feed [ "ERR busy" ]

                    -- Not at the next clock: after the busy wait (50 ms).
                    ( _, early ) =
                        busy1 |> tick 132

                    ( m2, again ) =
                        busy1 |> tick 150

                    -- Busy again: the wait doubles (100 ms).
                    busy2 : Model.Model
                    busy2 =
                        m2 |> feed [ "ERR busy" ]

                    ( _, early2 ) =
                        busy2 |> tick 200

                    ( m3, again2 ) =
                        busy2 |> tick 250

                    -- Taken: the next goes at the next clock.
                    ( _, next ) =
                        m3 |> feed [ cutoffLine "777", "OK 7" ] |> tick 283
                in
                Expect.all
                    [ \_ -> Expect.equal [] (Model.notices busy2 |> List.map .notice)
                    , \_ -> Expect.equal ( [], [ Since Nothing ] ) ( early, again )
                    , \_ -> Expect.equal ( [], [ Since Nothing ] ) ( early2, again2 )
                    , \_ -> Expect.equal [ Since (gen 7) ] next
                    ]
                    ()
        , describe "any read answered `ERR busy` is asked again quietly, and said only when given up"
            (let
                -- The project list asked at 99 (no poll owed), the unit busy.
                asked : Model.Model
                asked =
                    following |> Model.step AskProjects |> Tuple.first

                busyOnce : Model.Model
                busyOnce =
                    asked |> feed [ "ERR busy" ]

                -- Busy `n` times in a row, asked again each time its wait is past.
                busyTimes : Int -> Model.Model
                busyTimes n =
                    List.foldl (\i m -> m |> tick (1100 * i) |> Tuple.first |> feed [ "ERR busy" ]) busyOnce (List.range 1 (n - 1))

                lists : List Command -> List Command
                lists =
                    List.filter ((==) ListProjects)

                -- `ed schema VA` asked while the box's new engine is read, the unit busy.
                checking : Model.Model
                checking =
                    following |> feed [ "OK 1", "part 2 VA", "OK 2" ] |> tick 99 |> Tuple.first |> feed [ "ERR busy" ]
             in
             [ test "a_busy_project_list_is_no_refusal_and_goes_again_after_its_wait" <|
                \_ ->
                    Expect.all
                        [ \_ -> Expect.equal [] (Model.notices busyOnce |> List.map .notice)
                        , \_ -> Expect.equal [] (busyOnce |> tick 132 |> Tuple.second |> lists)
                        , \_ -> Expect.equal [ ListProjects ] (busyOnce |> tick 1000 |> Tuple.second |> lists)
                        ]
                        ()
             , test "busy_past_its_tries_it_is_given_up_and_said" <|
                \_ ->
                    Expect.all
                        [ \_ -> Expect.equal [] (busyTimes (Flow.busyTries - 1) |> Model.notices |> List.map .notice)
                        , \_ -> Expect.equal [ BusyGaveUp ListProjects ] (busyTimes Flow.busyTries |> Model.notices |> List.map .notice)
                        ]
                        ()
             , test "a_busy_schema_ask_while_reading_halts_nothing_and_is_asked_again" <|
                \_ ->
                    Expect.all
                        [ \_ -> Expect.equal Nothing (Model.notice checking)
                        , \_ -> Expect.equal [] (checking |> tick 132 |> Tuple.second)
                        , \_ -> Expect.equal [ AskSchema (EngineSchema Va) ] (checking |> tick 1000 |> Tuple.second)
                        ]
                        ()
             ]
            )
        , test "following_never_halts_a_lost_answer_is_asked_for_again" <|
            \_ ->
                let
                    ( m1, _ ) =
                        following |> tick 99

                    ( m2, c2 ) =
                        m1 |> tick 1099

                    ( m3, c3 ) =
                        m2 |> tick 2099

                    m4 : Model.Model
                    m4 =
                        m3 |> feed [ cutoffLine "777", "OK 7" ]

                    ( _, c4 ) =
                        m4 |> tick 2132
                in
                Expect.all
                    [ \_ -> Expect.equal [ [ Since Nothing ], [ Since Nothing ] ] [ c2, c3 ]
                    , \_ -> Expect.equal Nothing (Model.notice m3)
                    , \_ -> Expect.equal (Just "777 Hz") (shown m4)
                    , \_ -> Expect.equal (gen 7) m4.gen
                    , \_ -> Expect.equal [ Since (gen 7) ] c4
                    ]
                    ()
        , test "only_the_re_asks_ok_arrives_and_following_goes_on" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> tick 99
                            |> Tuple.first
                            |> tick 1099
                            |> Tuple.first
                            |> feed [ "OK 5" ]
                in
                Expect.all
                    [ \x -> Expect.equal [] (tick 1500 x |> Tuple.second)
                    , \x -> Expect.equal [ Since (gen 5) ] (tick 2100 x |> Tuple.second)
                    , \x -> Expect.equal Nothing (Model.notice (tick 2100 x |> Tuple.first))
                    ]
                    m
        , test "a_refused_first_since_is_settled_the_same_way" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> tick 99
                            |> Tuple.first
                            |> feed [ "ERR busy" ]
                            |> tick 1099
                            |> Tuple.first
                            |> feed [ "OK 5" ]
                in
                Expect.equal [ Since (gen 5) ] (tick 2100 m |> Tuple.second)
        , test "a_lost_link_clears_the_values" <|
            \_ ->
                Expect.equal Nothing
                    (following |> feed [ cutoffLine "1000", "OK 1" ] |> Model.step (LinkChanged Lost) |> Tuple.first |> shown)
        , test "part_change_follows_the_box" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> feed [ cutoffLine "1000", "OK 1" ]
                            |> Model.step (Edit (addr "ENV1.HOLD") (Num 1))
                            |> Tuple.first
                            |> feed [ "part 3 ALGO", cutoffLine "300", "OK 2" ]
                in
                Expect.all
                    [ \_ -> Expect.equal (Unit.partFromInt 3) m.part
                    , \_ -> Expect.equal (Just "300 Hz") (shown m)
                    , \_ -> Expect.equal Nothing (Model.notice m)
                    ]
                    ()
        , test "a_new_part_drops_the_old_parts_values" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> feed [ cutoffLine "1000", "panel FILTER CLEAN", "OK 1" ]
                            |> Model.step (Edit cutoff (Num 5))
                            |> Tuple.first
                            |> feed [ "part 2 VA", "OK 2" ]
                in
                Expect.equal ( Nothing, Dict.empty ) ( Model.shown cutoff m, m.variants )
        , test "a_part_on_another_engine_is_described_afresh" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following |> feed [ cutoffLine "1000", "OK 1", "part 2 VA", "OK 2" ]
                in
                Expect.all
                    [ \_ -> Expect.equal Nothing (Model.notice m)
                    , \_ -> Expect.equal (Just Va) m.engine
                    , \_ -> Expect.equal [ AskSchema (EngineSchema Va) ] (tick 99 m |> Tuple.second)
                    , \_ -> Expect.equal Nothing (Model.status m)
                    ]
                    ()
        , test "the_old_page_stays_up_while_the_new_engine_is_read" <|
            \_ ->
                following
                    |> feed [ cutoffLine "1000", "OK 1", "part 2 VA", "OK 2" ]
                    |> Expect.all
                        [ .described >> Expect.equal (Just Algo)
                        , .schema >> Schema.pages >> List.length >> Expect.equal 1
                        ]
        , test "an_edit_waits_for_the_engine_the_box_is_on_to_be_read" <|
            -- During an engine change FILTER.CUTOFF is ALGO's no longer:
            -- nothing goes out against the old schema.
            \_ ->
                let
                    switched : Model.Model
                    switched =
                        following |> feed [ cutoffLine "1000", "OK 1", "part 2 VA" ]
                in
                Expect.all
                    [ \_ -> Expect.equal [] (stepSends (Edit cutoff (Num 5000)) switched |> Tuple.second)
                    , \_ -> Expect.equal [] (stepSends (Edit cutoff (Num 5000)) (feed [ "OK 2" ] switched) |> Tuple.second)
                    , \_ -> Expect.equal [] (pick (addr "ENV1.HOLD") 2 switched)
                    , \_ -> Expect.equal False (Model.takesEdits switched)
                    ]
                    ()
        , describe "a hand during a read is held, and goes once the page is the unit's"
            (let
                hold : Addr
                hold =
                    addr "ENV1.HOLD"

                -- Every step in turn, and every line they send.
                through : List Msg -> Model.Model -> ( Model.Model, List Command )
                through msgs m0 =
                    List.foldl (\msg ( m, out ) -> stepSends msg m |> Tuple.mapSecond (\cs -> out ++ cs)) ( m0, [] ) msgs

                lines : List String -> List Msg
                lines =
                    List.map Line

                -- VA read: its schema, its matrix's, then following.
                readVa : List Msg
                readVa =
                    Tick (at 99)
                        :: lines [ "schema VA 1 " ++ hashOf vaPage, "OK" ]
                        ++ [ Recalled { key = key (EngineSchema Va) (hashOf vaPage), lines = Nothing }, Tick (at 132) ]
                        ++ lines (vaPage ++ [ "OK" ])
                        ++ [ Tick (at 165) ]
                        ++ lines [ "schema MTX-VA 1 " ++ hashOf [ "page 0 MTX of 1" ], "OK" ]
                        ++ [ Recalled { key = key (MatrixSchema Va) (hashOf [ "page 0 MTX of 1" ]), lines = Nothing }, Tick (at 198) ]
                        ++ lines [ "page 0 MTX of 1", "OK" ]
                        ++ [ Tick (at 231) ]

                -- Part 1's Sound loaded as VA: the same Part, another engine read.
                ( after, sent ) =
                    following
                        |> feed [ "OK 1", "part 1 VA", "OK 2" ]
                        |> through ([ Edit cutoff (Num 5000), Edit cutoff (Num 6000), Edit hold (Num 1) ] ++ readVa)

                -- The box on Part 2 meanwhile: Part 1's hand is not Part 2's.
                ( elsewhere, sentElsewhere ) =
                    following
                        |> feed [ "OK 1", "part 1 VA", "OK 2" ]
                        |> through (Edit cutoff (Num 5000) :: Line "part 2 VA" :: Line "OK 3" :: readVa)

                sets : List Command -> List Command
                sets =
                    List.filter (Protocol.sketch >> String.startsWith "ed set ")
             in
             [ test "the_latest_turn_of_an_address_the_new_page_has_goes_once_it_is_read" <|
                \_ -> Expect.equal [ Set cutoff (Num 6000) ] (sets sent)
             , test "a_turn_of_an_address_the_new_page_lacks_is_said_once" <|
                \_ -> Expect.equal [ "THE TURN OF ENV1.HOLD WAS NOT SENT: THE UNIT'S PAGE HAS NO ENV1.HOLD NOW" ] (said after)
             , test "a_turn_held_for_a_part_the_box_left_is_said_not_sent" <|
                \_ ->
                    Expect.equal ( [], [ "THE TURN OF FILTER.CUTOFF WAS NOT SENT: THE BOX TOOK ANOTHER PART" ] ) ( sets sentElsewhere, said elsewhere )
             ]
            )
        , test "a_new_part_is_a_new_seat" <|
            \_ ->
                Expect.notEqual (Model.seat following) (Model.seat (feed [ "part 3 ALGO" ] following))
        , test "hello_says_which_engine_to_read" <|
            \_ ->
                Model.init
                    |> Model.step (LinkChanged Open)
                    |> Tuple.first
                    |> tick 0
                    |> Tuple.first
                    |> feed [ "ed hello 4 b part 4 MODAL", "OK" ]
                    |> tick 33
                    |> Tuple.second
                    |> Expect.equal [ AskSchema (EngineSchema Modal) ]
        , test "the_same_engine_on_another_part_keeps_its_schema" <|
            \_ ->
                following
                    |> feed [ "OK 1", "part 3 ALGO", "OK 2" ]
                    |> tick 99
                    |> Tuple.second
                    |> Expect.equal [ Since (gen 2) ]
        , test "a_redescribed_engine_follows_from_nothing_and_takes_edits" <|
            \_ ->
                let
                    described : Model.Model
                    described =
                        following
                            |> feed [ "OK 1", "part 2 VA", "OK 2" ]
                            |> tick 99
                            |> Tuple.first
                            |> feed [ "schema VA 1 " ++ hashOf vaPage, "OK" ]
                            |> missed (EngineSchema Va) (hashOf vaPage)
                            |> tick 132
                            |> Tuple.first
                            |> feed (vaPage ++ [ "OK" ])
                            |> tick 165
                            |> Tuple.first
                            |> feed [ "schema MTX-VA 1 " ++ hashOf [ "page 0 MTX of 1" ], "OK" ]
                            |> missed (MatrixSchema Va) (hashOf [ "page 0 MTX of 1" ])
                            |> tick 198
                            |> Tuple.first
                            |> feed [ "page 0 MTX of 1", "OK" ]

                    ( _, asked ) =
                        tick 231 described
                in
                Expect.all
                    [ \_ -> Expect.equal [ Since Nothing ] asked
                    , \_ -> Expect.equal [ Set cutoff (Num 1000) ] (stepSends (Edit cutoff (Num 1000)) described |> Tuple.second)
                    ]
                    ()
        , test "a_choice_is_sent_by_its_number" <|
            \_ ->
                Expect.equal [ Set (addr "ENV1.HOLD") (idx 0) ]
                    (following |> pick (addr "ENV1.HOLD") 0)
        , test "a_choice_name_with_a_space_is_sent_by_its_number" <|
            \_ ->
                -- GATE EXT is two words: its number is one (a label is not split on its space).
                let
                    ( _, c ) =
                        Protocol.optIndex 2
                            |> Maybe.map (\i -> following |> stepSends (Pick (addr "ENV1.HOLD") i))
                            |> Maybe.withDefault ( following, [] )
                in
                Expect.equal [ Set (addr "ENV1.HOLD") (idx 2) ] c
        , test "an_option_the_schema_lacks_sends_nothing" <|
            \_ ->
                Expect.equal [] (following |> pick (addr "ENV1.HOLD") 1)
        , test "an_engine_the_editor_does_not_know_says_update_the_editor" <|
            \_ ->
                Expect.equal (Just "UPDATE THE EDITOR") (following |> feed [ "part 2 GRANULAR", "OK 1" ] |> Model.notice)
        , test "every_engine_is_named_as_the_unit_names_it" <|
            \_ ->
                Expect.equal (List.map Just [ Algo, Modal, Va, Tape, Drum ])
                    (List.map Unit.engineFromName [ "ALGO", "MODAL", "VA", "TAPE", "DRUM" ])
        , test "a_since_too_large_says_so_and_stops_asking" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following |> feed [ "ERR ed since too large" ]
                in
                Expect.all
                    [ \x -> Expect.equal (Just "THE UNIT'S ANSWER IS TOO LARGE FOR ONE READ") (Model.notice x)
                    , \x -> Expect.equal [] (tick 33 x |> Tuple.second)
                    , \x -> Expect.equal [] (tick 5000 x |> Tuple.second)
                    ]
                    m
        , test "tapes_source_text_is_kept_while_following" <|
            \_ ->
                Expect.equal (Just "KICK 909") (following |> feed [ "source \"KICK 909\"", "OK 1" ] |> .source)
        , test "hello_with_the_same_protocol_runs" <|
            \_ ->
                Expect.equal Nothing (Model.notice following)
        , test "unit_newer_than_the_editor_says_update_the_editor_and_stops" <|
            \_ ->
                let
                    ( m, _ ) =
                        Model.init |> Model.step (LinkChanged Open) |> Tuple.first |> tick 0
                in
                Expect.all
                    [ \x -> Expect.equal (Just "UPDATE THE EDITOR: THE UNIT SPEAKS PROTOCOL 5, THIS EDITOR 4") (Model.notice x)
                    , \x -> Expect.equal [] (tick 33 x |> Tuple.second)
                    , \x -> Expect.equal [] (tick 5000 x |> Tuple.second)
                    ]
                    (feed [ "ed hello 5 x part 1 ALGO", "OK" ] m)
        , describe "a part past six halts and says so, never a part of nothing"
            (List.map
                (\( name, lines ) ->
                    test name <|
                        \_ ->
                            let
                                ( m, _ ) =
                                    Model.init |> Model.step (LinkChanged Open) |> Tuple.first |> tick 0
                            in
                            Expect.all
                                [ \x -> Expect.equal (Just "THE UNIT NAMED PART 7: THIS EDITOR KNOWS PARTS 1 TO 6") (Model.notice x)
                                , \x -> Expect.equal [] (tick 5000 x |> Tuple.second)
                                ]
                                (feed lines m)
                )
                [ ( "in_hello", [ "ed hello 4 x part 7 ALGO", "OK" ] )
                , ( "in_a_since", [ "ed hello 4 x part 1 ALGO", "OK", "part 7 ALGO" ] )
                , ( "in_a_sound_line", [ "ed hello 4 x part 1 ALGO", "OK", "sound 7 \"BASS\" stale" ] )
                ]
            )
        , test "a_part_line_naming_part_zero_halts" <|
            \_ ->
                following
                    |> feed [ "part 0 ALGO", "OK 3" ]
                    |> Model.notice
                    |> Expect.equal (Just "THE UNIT NAMED PART 0: THIS EDITOR KNOWS PARTS 1 TO 6")
        , test "unit_older_than_the_editor_says_update_the_unit_and_stops" <|
            \_ ->
                let
                    ( m, _ ) =
                        Model.init |> Model.step (LinkChanged Open) |> Tuple.first |> tick 0
                in
                Expect.all
                    [ \x -> Expect.equal (Just "THIS EDITOR NEEDS CHIMERA 0.4 OR LATER.") (Model.notice x)
                    , \x -> Expect.equal (Just Links.downloadUrl) (Model.download x)
                    , \x -> Expect.equal [] (tick 33 x |> Tuple.second)
                    ]
                    (feed [ "ed hello 3 x part 1 ALGO", "OK" ] m)
        , test "a_refusal_while_connecting_stops_with_its_text" <|
            \_ ->
                let
                    ( m, _ ) =
                        Model.init |> Model.step (LinkChanged Open) |> Tuple.first |> tick 0
                in
                Expect.equal (Just "THE UNIT REFUSED: ed takes hello") (Model.notice (feed [ "ERR ed takes hello" ] m))
        , test "a_lost_link_shows_its_text_and_stops_asking" <|
            \_ ->
                let
                    ( m, _ ) =
                        following |> Model.step (LinkChanged Lost)
                in
                Expect.all
                    [ \_ -> Expect.equal (Just "THE UNIT WAS DISCONNECTED") (Model.notice m)
                    , \_ -> Expect.equal [] (tick 5000 m |> Tuple.second)
                    ]
                    ()
        , test "reconnecting_starts_again_from_hello" <|
            \_ ->
                let
                    ( m, _ ) =
                        following |> feed [ cutoffLine "1000", "OK 9" ] |> Model.step (LinkChanged Lost)
                in
                Expect.equal ( [ Hello ], Nothing )
                    (m
                        |> Model.step (LinkChanged Open)
                        |> Tuple.first
                        |> (\x -> ( tick 6000 x |> Tuple.second, x.gen ))
                    )
        , test "a_part_button_asks_the_box_and_waits_for_it" <|
            \_ ->
                case Unit.partFromInt 2 of
                    Just p2 ->
                        let
                            ( m, cs ) =
                                following |> stepSends (FollowPart p2)
                        in
                        Expect.all
                            [ \_ -> Expect.equal [ Follow p2 ] cs
                            , -- Never guessed: the mark moves when `since` says so.
                              \_ -> Expect.equal (Unit.partFromInt 1) m.part
                            , \_ -> Expect.equal (Just p2) (feed [ "part 2 VA", "OK 2" ] m).part
                            ]
                            ()

                    Nothing ->
                        Expect.fail "no Part 2"
        , test "a_part_button_before_following_sends_nothing" <|
            \_ ->
                case Unit.partFromInt 2 of
                    Just p2 ->
                        Model.init
                            |> Model.step (LinkChanged Open)
                            |> Tuple.first
                            |> stepSends (FollowPart p2)
                            |> Tuple.second
                            |> Expect.equal []

                    Nothing ->
                        Expect.fail "no Part 2"
        , test "the_connect_walk_asks_each_schema_and_keeps_what_it_described" <|
            \_ ->
                let
                    ( m1, c1 ) =
                        greeted |> tick 33

                    ( m2, e2 ) =
                        m1 |> feed [ "schema ALGO 1 " ++ algoHash ] |> Model.step (Line "OK")

                    ( m3, e3 ) =
                        m2 |> missed (EngineSchema Algo) algoHash |> tick 66 |> Tuple.first |> feed algoPage |> Model.step (Line "OK")
                in
                Expect.all
                    [ \_ -> Expect.equal [ AskSchema (EngineSchema Algo) ] c1
                    , \_ -> Expect.equal [ Recall (key (EngineSchema Algo) algoHash) ] e2
                    , \_ -> Expect.equal [ Keep (key (EngineSchema Algo) algoHash) algoPage ] e3
                    , \_ -> Expect.equal [ AskSchema MixerSchema ] (tick 99 m3 |> Tuple.second)
                    ]
                    ()
        , test "a_cached_schema_is_used_without_describing_it" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        greeted
                            |> tick 33
                            |> Tuple.first
                            |> feed [ "schema ALGO 1 " ++ algoHash, "OK" ]
                            |> Model.step (Recalled { key = key (EngineSchema Algo) algoHash, lines = Just algoPage })
                            |> Tuple.first
                in
                Expect.all
                    [ \_ -> Expect.equal (Just "CUTOFF") (Schema.param cutoff m.schema |> Maybe.map .label)
                    , \_ -> Expect.equal [ AskSchema MixerSchema ] (tick 66 m |> Tuple.second)
                    ]
                    ()
        , test "a_cached_copy_that_isnt_the_pages_the_unit_said_is_described_again" <|
            \_ ->
                greeted
                    |> tick 33
                    |> Tuple.first
                    |> feed [ "schema ALGO 2 " ++ algoHash, "OK" ]
                    |> Model.step (Recalled { key = key (EngineSchema Algo) algoHash, lines = Just algoPage })
                    |> Tuple.first
                    |> tick 66
                    |> Tuple.second
                    |> Expect.equal [ Describe (EngineSchema Algo) (page 0) ]
        , test "a_recall_for_another_key_is_ignored" <|
            \_ ->
                greeted
                    |> tick 33
                    |> Tuple.first
                    |> feed [ "schema ALGO 1 " ++ algoHash, "OK" ]
                    |> Model.step (Recalled { key = key (EngineSchema Algo) "ffffffffffffffff", lines = Nothing })
                    |> Tuple.first
                    |> tick 66
                    |> Tuple.second
                    |> Expect.equal []
        , test "a_cache_answer_that_is_no_answer_is_a_miss" <|
            \_ ->
                greeted
                    |> tick 33
                    |> Tuple.first
                    |> feed [ "schema ALGO 1 " ++ algoHash, "OK" ]
                    |> Model.step RecallGarbled
                    |> Tuple.first
                    |> tick 66
                    |> Tuple.second
                    |> Expect.equal [ Describe (EngineSchema Algo) (page 0) ]
        , test "a_cache_that_never_answers_is_a_miss_after_the_timeout" <|
            \_ ->
                let
                    recalling : Model.Model
                    recalling =
                        greeted
                            |> tick 33
                            |> Tuple.first
                            |> feed [ "schema ALGO 1 " ++ algoHash, "OK" ]
                in
                Expect.all
                    [ \m -> Expect.equal [] (tick 999 m |> Tuple.second)
                    , \m -> Expect.equal [ Describe (EngineSchema Algo) (page 0) ] (tick 1033 m |> Tuple.first |> tick 1066 |> Tuple.second)
                    , \m -> Expect.equal Nothing (tick 1033 m |> Tuple.first |> Model.notice)
                    ]
                    recalling
        , test "an_ok_with_no_schema_line_says_update_the_editor" <|
            \_ ->
                greeted
                    |> tick 33
                    |> Tuple.first
                    |> feed [ "OK" ]
                    |> Model.notice
                    |> Expect.equal (Just "UPDATE THE EDITOR")
        , test "a_new_engine_is_read_once_the_since_answer_ends" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following |> tick 165 |> Tuple.first |> feed [ "part 2 VA", "OK 3" ]
                in
                Expect.all
                    [ \_ -> Expect.equal [ AskSchema (EngineSchema Va) ] (tick 198 m |> Tuple.second)
                    , \_ -> Expect.equal Nothing m.gen
                    , -- An engine already read is used again with no ask.
                      \_ ->
                        m
                            |> tick 198
                            |> Tuple.first
                            |> feed [ "schema VA 1 " ++ hashOf [ "page 0 OSC of 1", "panel OSC -" ], "OK" ]
                            |> missed (EngineSchema Va) (hashOf [ "page 0 OSC of 1", "panel OSC -" ])
                            |> tick 231
                            |> Tuple.first
                            |> feed [ "page 0 OSC of 1", "panel OSC -", "OK" ]
                            |> tick 250
                            |> Tuple.first
                            |> feed [ "schema MTX-VA 1 " ++ hashOf [ "page 0 MTX of 1" ], "OK" ]
                            |> missed (MatrixSchema Va) (hashOf [ "page 0 MTX of 1" ])
                            |> tick 255
                            |> Tuple.first
                            |> feed [ "page 0 MTX of 1", "OK" ]
                            |> tick 264
                            |> Tuple.first
                            |> feed [ "part 1 ALGO", "OK 4" ]
                            |> tick 297
                            |> Tuple.second
                            -- Held, but asked again: the unit may have other firmware now.
                            |> Expect.equal [ AskSchema (EngineSchema Algo) ]
                    ]
                    ()
        , test "a_whole_answer_for_the_same_part_keeps_the_seat" <|
            \_ ->
                Model.seat (following |> tick 165 |> Tuple.first |> feed [ "part 1 ALGO", "OK 3" ])
                    |> Expect.equal (Model.seat following)
        , test "the_units_number_running_backwards_greets_it_again" <|
            \_ ->
                following
                    |> tick 165
                    |> Tuple.first
                    |> feed [ "OK 500" ]
                    |> tick 198
                    |> Tuple.first
                    |> feed [ "OK 2" ]
                    |> tick 231
                    |> Tuple.second
                    |> Expect.equal [ Hello ]
        , test "ok_more_asks_again_at_once_with_its_number" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following |> tick 165 |> Tuple.first |> feed [ "part 1 ALGO", cutoffLine "1000", "OK 7 more" ]
                in
                Expect.all
                    [ \_ -> Expect.equal (gen 7) m.gen
                    , \_ -> Expect.equal [ Since (gen 7) ] (tick 198 m |> Tuple.second)
                    , \_ -> Expect.equal (Just "1000 Hz") (shown m)
                    ]
                    ()
        , test "the_mixers_values_are_kept_and_its_header_drops_only_its_own" <|
            \_ ->
                let
                    level : Addr
                    level =
                        addr "PART3.LEVEL"

                    m : Model.Model
                    m =
                        following
                            |> feed [ "part 1 ALGO", cutoffLine "1000", "mixer", "panel REVERB HALL", "val PART3.LEVEL 0.5 0.5 \"64\"", "OK 2" ]
                in
                Expect.all
                    [ \_ -> Expect.equal (Just "64") (Model.shown level m |> Maybe.map .text)
                    , \_ -> Expect.equal (Just "HALL") (variantOf "REVERB" m)
                    , -- A new Part: PART's whole, the mixer's kept.
                      \_ ->
                        feed [ "part 2 ALGO", "OK 3" ] m
                            |> (\x -> ( Model.shown level x |> Maybe.map .text, shown x, variantOf "REVERB" x ))
                            |> Expect.equal ( Just "64", Nothing, Just "HALL" )
                    , -- The mixer whole: the Part's kept, the mixer's dropped.
                      \_ ->
                        feed [ "mixer", "panel REVERB QUAD", "OK 3" ] m
                            |> (\x -> ( Model.shown level x, shown x, variantOf "REVERB" x ))
                            |> Expect.equal ( Nothing, Just "1000 Hz", Just "QUAD" )
                    ]
                    ()
        , test "the_delays_time_panel_follows_sync_and_outlives_a_part_switch" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> feed [ "part 1 ALGO", cutoffLine "1000", "mixer", "panel REVERB HALL", "panel DELAY SYNC", "val DELAY.NOTE 0.7 0.7 \"1/8\"", "OK 2" ]
                in
                Expect.all
                    [ \_ -> Expect.equal (Just "SYNC") (variantOf "DELAY" m)
                    , \_ -> Expect.equal (Just "1/8") (Model.shown (addr "DELAY.NOTE") m |> Maybe.map .text)
                    , \_ ->
                        feed [ "part 2 ALGO", "OK 3" ] m
                            |> (\x -> ( variantOf "DELAY" x, variantOf "REVERB" x ))
                            |> Expect.equal ( Just "SYNC", Just "HALL" )
                    , \_ ->
                        feed [ "mixer", "panel REVERB HALL", "panel DELAY FREE", "OK 3" ] m
                            |> (\x -> variantOf "DELAY" x)
                            |> Expect.equal (Just "FREE")
                    ]
                    ()
        , test "a_mixer_address_is_edited_like_any_other" <|
            \_ ->
                following
                    |> stepSends (Edit (addr "PART3.LEVEL") (Num 0.25))
                    |> Tuple.second
                    |> Expect.equal [ Set (addr "PART3.LEVEL") (Num 0.25) ]
        , test "the_matrix_schema_is_read_after_the_mixers" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                in
                Expect.all
                    [ \_ -> Expect.equal [ ( "ENV1", "ENV1" ), ( "OP5", "OP 5" ) ] (Schema.matrix m.matrix).sources
                    , \_ -> Expect.equal (Just 16) (Schema.matrix m.matrix).dests
                    , \_ -> Expect.equal (Just ( -127, 127 )) (Schema.matrix m.matrix).range
                    ]
                    ()
        , test "routes_are_kept_from_since_whole_and_diffed" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> feed [ "part 1 ALGO", "routes 1", "route ENV1:FILTER.CUTOFF 64 \"+64\"", "route LFO1:OP_C.LEVEL -3 \"-3\"", "OK 2" ]

                    after : Model.Model
                    after =
                        m |> feed [ "route ENV1:FILTER.CUTOFF 70 \"+70\"", "unroute LFO1:OP_C.LEVEL", "OK 3" ]
                in
                Expect.all
                    [ \_ -> Expect.equal [ "ENV1:FILTER.CUTOFF", "LFO1:OP_C.LEVEL" ] (Dict.keys m.routes)
                    , \_ -> Expect.equal [ ( "ENV1:FILTER.CUTOFF", { amount = 70, text = "+70" } ) ] (Dict.toList after.routes)
                    , -- Whole again: what isn't repeated is gone.
                      \_ -> Expect.equal [] (feed [ "routes 1", "OK 4" ] after |> .routes |> Dict.toList)
                    , \_ -> Expect.equal [] (feed [ "part 2 ALGO", "OK 4" ] after |> .routes |> Dict.toList)
                    ]
                    ()
        , test "a_route_edit_sends_ed_route" <|
            \_ ->
                case ( Protocol.amount -40, Protocol.cell "FM3IN" ) of
                    ( Just a, Just fm3in ) ->
                        Expect.all
                            [ \_ ->
                                following
                                    |> stepSends (EditRoute fm3in (Protocol.RouteAmount a))
                                    |> Tuple.second
                                    |> Expect.equal [ SetRoute fm3in (Protocol.RouteAmount a) ]
                            , \_ ->
                                Model.init
                                    |> stepSends (EditRoute fm3in Protocol.RouteOff)
                                    |> Tuple.second
                                    |> Expect.equal []
                            ]
                            ()

                    _ ->
                        Expect.fail "-40 is an amount and FM3IN a cell"
        , test "the_settings_schema_is_read_after_the_matrix_with_its_crumbs" <|
            \_ ->
                Expect.all
                    [ \_ -> Expect.notEqual Nothing (Model.status following)
                    , \_ -> Expect.equal [ Just { list = "PERSONAL", row = "THEME" } ] (List.map .crumb (Schema.pages following.settings))
                    , \_ -> Expect.notEqual Nothing (Schema.param (addr "THEME.ACCENT") following.settings)
                    ]
                    ()
        , test "a_settings_value_is_kept_edited_and_picked_like_any_other" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following |> feed [ "part 1 ALGO", "settings", "val THEME.ACCENT 0 0 \"TEAL\"", "OK 2" ]
                in
                Expect.all
                    [ \_ -> Expect.equal (Just "TEAL") (Model.shown (addr "THEME.ACCENT") m |> Maybe.map .text)
                    , \_ -> Expect.equal [ Set (addr "THEME.ACCENT") (idx 1) ] (pick (addr "THEME.ACCENT") 1 m)
                    , \_ -> Expect.equal [ Set (addr "PART3.SNAP") (Num 1) ] (stepSends (Edit (addr "PART3.SNAP") (Num 1)) m |> Tuple.second)
                    , -- A new Part: PART's whole; SETTINGS' values kept.
                      \_ ->
                        feed [ "part 2 ALGO", "OK 3" ] m
                            |> Model.shown (addr "THEME.ACCENT")
                            |> Maybe.map .text
                            |> Expect.equal (Just "TEAL")
                    ]
                    ()
        , test "the_settings_section_carries_the_project_the_sounds_the_toast_and_the_listing" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> feed
                                [ "settings"
                                , "project \"MY SONG\" 10 edited gen 2"
                                , "sound 3 \"BASS\" stale"
                                , "toast \"SAVED\""
                                , "projects 2"
                                , "proj 10 \"MY SONG\" ok gen 2"
                                , "proj 11 \"\" bad gen -"
                                , "OK 2"
                                ]

                    whole : Model.Model
                    whole =
                        m |> feed [ "settings", "projects 0", "OK 3" ]
                in
                Expect.all
                    [ \_ -> Expect.equal (Just ( "MY SONG", Protocol.Edited )) (m.project |> Maybe.map (\p -> ( p.name, p.edits )))
                    , \_ -> Expect.equal (Just { name = "BASS", status = Protocol.SoundStale }) (Dict.get 3 m.sounds)
                    , \_ -> Expect.equal (Just "SAVED") m.toast
                    , \_ -> Expect.equal (Just [ 10, 11 ]) (m.listing |> Maybe.map (.projects >> List.map (.id >> Protocol.projectIdToInt)))
                    , -- Whole again: what isn't repeated is gone.
                      \_ -> Expect.equal ( Nothing, Dict.empty, Just [] ) ( whole.project, whole.sounds, whole.listing |> Maybe.map .projects )
                    ]
                    ()
        , test "the_project_commands_go_out_typed_while_following" <|
            \_ ->
                case ( Protocol.projectName "MY SONG", Protocol.projectId 10, Protocol.generation 2 ) of
                    ( Just n, Just i, Just g ) ->
                        Expect.all
                            [ \_ -> Expect.equal [ ListProjects ] (stepSends AskProjects following |> Tuple.second)
                            , \_ -> Expect.equal [ SaveProject ] (stepSends SaveOwn following |> Tuple.second)
                            , \_ -> Expect.equal [ SaveProjectAs n ] (stepSends (SaveNew n) following |> Tuple.second)
                            , \_ -> Expect.equal [ LoadProject i g Protocol.DiscardEdits ] (stepSends (LoadListed i g Protocol.DiscardEdits) following |> Tuple.second)
                            , -- Not yet following: nothing.
                              \_ -> Expect.equal [] (stepSends AskProjects greeted |> Tuple.second)
                            ]
                            ()

                    _ ->
                        Expect.fail "a name, an id and a generation"
        , test "the_map_schema_is_read_after_settings_and_kept_under_its_hash" <|
            \_ ->
                let
                    kept : List Effect
                    kept =
                        describingMap |> Model.step (Line "OK") |> Tuple.second

                    mm : Schema.MidiMap
                    mm =
                        Schema.midiMap following.midiMap
                in
                Expect.all
                    [ \_ -> Expect.notEqual Nothing (Model.status following)
                    , \_ -> Expect.equal [ Keep (key MapSchema mapHash) mapPage ] kept
                    , \_ -> Expect.equal [ { form = Protocol.FormCc14, kinds = [ Jump, Pickup, ScaleTo ] } ] (List.drop 1 mm.inputs)
                    , \_ -> Expect.equal [ { kind = TwosComp, head = "RELATIVE · TWOS COMPLEMENT", tail = "+1 = 1  -1 = 127" } ] (List.drop 1 mm.kinds)
                    , \_ -> Expect.equal ( Just 16, Just 90 ) ( mm.rows, mm.mapRows )
                    , \_ -> Expect.equal ( 3, 3, mm.span /= Nothing ) ( List.length mm.ccs, List.length mm.msbs, True )
                    ]
                    ()
        , test "a_whole_map_section_fills_the_map_state" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following |> feed (mapSection ++ [ "OK 2" ])
                in
                Expect.all
                    [ \_ -> Expect.equal (Just ( 2, Just "KEYSTEP", On )) (m.mapHeader |> Maybe.map (\h -> ( Unit.partNumber h.part, h.name, h.keep )))
                    , \_ -> Expect.equal [ ( 1, Live ), ( 2, Dead ) ] (m.soundRows |> Dict.toList |> List.map (Tuple.mapSecond .status))
                    , \_ -> Expect.equal [ ( 1, Shadowed ) ] (m.mapRows |> Dict.toList |> List.map (Tuple.mapSecond .status))
                    , \_ -> Expect.equal (Just (Armed (Just cutoff))) (m.learn |> Maybe.map .learn)
                    , \_ -> Expect.equal ( Just cutoff, Nothing ) ( Model.armedOn m, Model.sensingRow m )
                    , \_ -> Expect.equal ( Nothing, Just 3 ) (feed [ "learn sensing S3 \"CC74\"", "OK 3" ] m |> (\x -> ( Model.armedOn x, Model.sensingRow x )))
                    , \_ -> Expect.equal [ "KEYSTEP", "BEATSTEP PRO" ] m.mapFiles
                    , \_ -> Expect.equal (Just ( TwosComp, Nothing )) (Dict.get 2 m.soundRows |> Maybe.map (\r -> ( r.kind, r.addr )))
                    ]
                    ()
        , test "a_map_header_drops_what_the_section_does_not_repeat" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> feed (mapSection ++ [ "OK 2" ])
                            |> feed [ "map 3 none keep off", "row S1 CC1 JUMP FILTER.CUTOFF 0 255 off live", "learn off \"\"", "OK 3" ]
                in
                Expect.all
                    [ \_ -> Expect.equal (Just ( 3, Nothing, Off )) (m.mapHeader |> Maybe.map (\h -> ( Unit.partNumber h.part, h.name, h.keep )))
                    , \_ -> Expect.equal [ 1 ] (Dict.keys m.soundRows)
                    , \_ -> Expect.equal [] (Dict.keys m.mapRows)
                    , \_ -> Expect.equal [] m.mapFiles
                    , \_ -> Expect.equal (Just NotLearning) (m.learn |> Maybe.map .learn)
                    ]
                    ()
        , test "a_diff_learn_line_alone_replaces_only_learn" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> feed (mapSection ++ [ "OK 2" ])
                            |> feed [ "learn pointing \"TURN A KNOB\"", "OK 3" ]
                in
                Expect.all
                    [ \_ -> Expect.equal (Just { learn = Pointing, note = "TURN A KNOB" }) m.learn
                    , \_ -> Expect.equal [ 1, 2 ] (Dict.keys m.soundRows)
                    , \_ -> Expect.equal [ 1 ] (Dict.keys m.mapRows)
                    , \_ -> Expect.equal [ "KEYSTEP", "BEATSTEP PRO" ] m.mapFiles
                    , \_ -> Expect.notEqual Nothing m.mapHeader
                    , -- A new Part's PART section leaves MAP's alone.
                      \_ -> Expect.equal [ 1, 2 ] (feed [ "part 2 ALGO", "OK 4" ] m |> .soundRows |> Dict.keys)
                    ]
                    ()
        , test "the_map_commands_go_out_typed" <|
            \_ ->
                case Protocol.mapName "MY KEYS" of
                    Just n ->
                        Expect.all
                            [ \_ -> Expect.equal [ MapCmd ListMaps ] (stepSends (MapAct ListMaps) following |> Tuple.second)
                            , \_ -> Expect.equal [ MapCmd (SaveMap (Just n)) ] (stepSends (MapAct (SaveMap (Just n))) following |> Tuple.second)
                            , \_ -> Expect.equal [ MapCmd (LearnAt cutoff) ] (stepSends (MapAct (LearnAt cutoff)) following |> Tuple.second)
                            , -- Not yet following: nothing.
                              \_ -> Expect.equal [] (stepSends (MapAct ListMaps) greeted |> Tuple.second)
                            ]
                            ()

                    Nothing ->
                        Expect.fail "a map name"
        , test "the_orbit_schema_is_read_after_map_and_kept_under_its_hash" <|
            \_ ->
                let
                    kept : List Effect
                    kept =
                        describingOrbit |> Model.step (Line "OK") |> Tuple.second
                in
                Expect.all
                    [ \_ -> Expect.notEqual Nothing (Model.status following)
                    , \_ -> Expect.equal [ Keep (key OrbitSchema orbitHash) orbitPage ] kept
                    , \_ -> Expect.equal [ [ ( "RING", Protocol.ActRing ), ( "SCENE", Protocol.ActScene ) ] ] (Schema.pages following.orbit |> List.map (.acts >> List.map (\a -> ( a.label, a.cell ))))
                    ]
                    ()
        , test "a_build_without_orbit_reads_no_orbit_pages" <|
            \_ ->
                let
                    ( m, effects ) =
                        describingMap
                            |> feed [ "OK" ]
                            |> tick 139
                            |> Tuple.first
                            |> feed [ "schema ORBIT 0 " ++ orbitHash ]
                            |> Model.step (Line "OK")
                in
                Expect.all
                    [ \_ -> Expect.equal [] effects
                    , \_ -> Expect.notEqual Nothing (Model.status m)
                    , \_ -> Expect.equal [] (Schema.pages m.orbit)
                    , \_ -> Expect.equal [ Since Nothing ] (tick 141 m |> Tuple.second)
                    ]
                    ()
        , test "a_whole_orbit_section_fills_the_orbit_state" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following |> feed (orbitSection ++ [ "OK 2" ])
                in
                Expect.all
                    [ \_ -> Expect.equal (Just ( Playing, ClockInt, ( 3, Nothing, Protocol.Edited ) )) (m.song |> Maybe.map (\g -> ( g.playback, g.clock, ( Protocol.sceneNoToInt g.scene, g.queued, g.edits ) )))
                    , \_ -> Expect.equal [ ( 1, ( SlotSaved, 4 ) ), ( 3, ( SlotNeutral, 0 ) ) ] (m.slots |> Dict.toList |> List.map (Tuple.mapSecond (\x -> ( x.state, Protocol.revToInt x.rev ))))
                    , \_ -> Expect.equal [ Just "C#", Just "120", Just "8" ] (List.map (\a -> Model.shown (addr a) m |> Maybe.map .text) [ "ORBIT.KEY", "TEMPO.BPM", "RING1.HITS" ])
                    , \_ -> Expect.equal [ ( 1, 1 ), ( 2, 5 ) ] (m.chords |> Dict.toList |> List.map (Tuple.mapSecond Protocol.degreeToInt))
                    , \_ -> Expect.equal (Just 2741) (m.scale |> Maybe.map Protocol.scaleMaskToInt)
                    , \_ -> Expect.equal [ ( ( 1, 1 ), 60 ), ( ( 2, 32 ), 67 ) ] (m.steps |> Dict.toList |> List.map (Tuple.mapSecond Protocol.noteToInt))
                    , \_ -> Expect.equal [ ( 1, [ 60, 64, 67 ] ) ] (m.pools |> Dict.toList |> List.map (Tuple.mapSecond (Protocol.poolNotes >> List.map Protocol.noteToInt)))
                    ]
                    ()
        , test "an_orbit_header_drops_what_the_section_does_not_repeat" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> feed ("val PART3.LEVEL 0.5 0.5 \"64\"" :: orbitSection ++ [ "OK 2" ])
                            |> feed [ "orbit", "song stopped clock EXT scene 1 queued 2 edited no", "slot 2 saved rev 1", "OK 3" ]
                in
                Expect.all
                    [ \_ -> Expect.equal (Just ( Stopped, ClockExt, Just 2 )) (m.song |> Maybe.map (\g -> ( g.playback, g.clock, Maybe.map Protocol.sceneNoToInt g.queued )))
                    , \_ -> Expect.equal [ 2 ] (Dict.keys m.slots)
                    , \_ -> Expect.equal ( Dict.isEmpty m.chords, m.scale == Nothing ) ( True, True )
                    , \_ -> Expect.equal ( Dict.isEmpty m.steps, Dict.isEmpty m.pools ) ( True, True )
                    , \_ -> Expect.equal [ Nothing, Nothing, Nothing ] (List.map (\a -> Model.shown (addr a) m) [ "ORBIT.KEY", "TEMPO.BPM", "RING1.HITS" ])
                    , -- Another section's values stay.
                      \_ -> Expect.equal (Just "64") (Model.shown (addr "PART3.LEVEL") m |> Maybe.map .text)
                    ]
                    ()
        , test "an_orbit_diff_replaces_only_its_entries" <|
            \_ ->
                let
                    m : Model.Model
                    m =
                        following
                            |> feed (orbitSection ++ [ "OK 2" ])
                            |> feed [ "slot 1 saved rev 5", "step 1 1 62", "chord 2 4", "pool 1 48", "val RING1.HITS 0.5 16 \"16\"", "OK 3" ]
                in
                Expect.all
                    [ \_ -> Expect.equal [ ( 1, 5 ), ( 3, 0 ) ] (m.slots |> Dict.toList |> List.map (Tuple.mapSecond (.rev >> Protocol.revToInt)))
                    , \_ -> Expect.equal [ ( ( 1, 1 ), 62 ), ( ( 2, 32 ), 67 ) ] (m.steps |> Dict.toList |> List.map (Tuple.mapSecond Protocol.noteToInt))
                    , \_ -> Expect.equal [ ( 1, 1 ), ( 2, 4 ) ] (m.chords |> Dict.toList |> List.map (Tuple.mapSecond Protocol.degreeToInt))
                    , \_ -> Expect.equal [ ( 1, [ 48 ] ) ] (m.pools |> Dict.toList |> List.map (Tuple.mapSecond (Protocol.poolNotes >> List.map Protocol.noteToInt)))
                    , \_ -> Expect.equal [ Just "C#", Just "16" ] (List.map (\a -> Model.shown (addr a) m |> Maybe.map .text) [ "ORBIT.KEY", "RING1.HITS" ])
                    , \_ -> Expect.equal ( True, Just 2741 ) ( m.song /= Nothing, m.scale |> Maybe.map Protocol.scaleMaskToInt )
                    , -- A new Part's PART section leaves ORBIT's alone.
                      \_ -> Expect.equal (Just "C#") (feed [ "part 2 ALGO", "OK 4" ] m |> Model.shown (addr "ORBIT.KEY") |> Maybe.map .text)
                    ]
                    ()
        , test "the_orbit_values_are_set_and_picked" <|
            \_ ->
                Expect.all
                    [ \_ -> Expect.equal [ Set (addr "TEMPO.BPM") (Num 128) ] (stepSends (Edit (addr "TEMPO.BPM") (Num 128)) following |> Tuple.second)
                    , \_ -> Expect.equal [ Set (addr "ORBIT.KEY") (idx 1) ] (pick (addr "ORBIT.KEY") 1 following)
                    ]
                    ()
        , test "the_orbit_commands_go_out_typed_while_following" <|
            \_ ->
                case ( Protocol.sceneNo 2, Protocol.rev 7 ) of
                    ( Just n, Just r ) ->
                        Expect.all
                            [ \_ -> Expect.equal [ OrbitCmd PlaySong ] (stepSends (OrbitAct PlaySong) following |> Tuple.second)
                            , \_ -> Expect.equal [ OrbitCmd (SaveScene n (Over r)) ] (stepSends (OrbitAct (SaveScene n (Over r))) following |> Tuple.second)
                            , \_ -> Expect.equal [ OrbitCmd (ClearScene n r) ] (stepSends (OrbitAct (ClearScene n r)) following |> Tuple.second)
                            , -- Not yet following: nothing.
                              \_ -> Expect.equal [] (stepSends (OrbitAct StopSong) greeted |> Tuple.second)
                            ]
                            ()

                    _ ->
                        Expect.fail "a scene and a rev"
        , describe "the edits' window: one set on the wire"
            (let
                reso : Addr
                reso =
                    addr "ENV1.HOLD"

                sets : List Command -> List Command
                sets =
                    List.filter (Protocol.sketch >> String.startsWith "ed set ")

                -- Steps in order: the model after, and the sets they sent.
                run : List Msg -> Model.Model -> ( Model.Model, List Command )
                run msgs m0 =
                    List.foldl (\msg ( m, out ) -> stepSends msg m |> Tuple.mapSecond (\cs -> out ++ sets cs)) ( m0, [] ) msgs

                now : Int
                now =
                    Time.posixToMillis following.now

                busy : ( Model.Model, List Command )
                busy =
                    run [ Edit cutoff (Num 100), Edit cutoff (Num 200), Edit reso (Num 1), Edit cutoff (Num 300) ] following

                inFlight : Model.Model -> Int
                inFlight m =
                    m.awaiting |> sets |> List.length
             in
             [ test "never_more_than_one_set_in_flight" <|
                \_ ->
                    Expect.all
                        [ \_ -> Expect.equal [ Set cutoff (Num 100) ] (Tuple.second busy)
                        , \_ -> Expect.equal 1 (inFlight (Tuple.first busy))
                        ]
                        ()

             -- What waits goes in the order it first waited, each address's latest value once.
             , test "the_latest_want_wins_and_nothing_is_lost_after_the_ok" <|
                \_ ->
                    run [ Line "OK", Line "OK", Line "OK" ] (Tuple.first busy)
                        |> Tuple.second
                        |> Expect.equal [ Set cutoff (Num 300), Set reso (Num 1) ]
             , test "each_ok_sends_one_more_and_keeps_one_in_flight" <|
                \_ ->
                    let
                        ( m, sent ) =
                            run [ Line "OK" ] (Tuple.first busy)
                    in
                    Expect.all
                        [ \_ -> Expect.equal [ Set cutoff (Num 300) ] sent
                        , \_ -> Expect.equal 1 (inFlight m)
                        ]
                        ()
             , test "a_refusal_frees_the_window_too" <|
                \_ ->
                    run [ Line "ERR ed set FILTER.CUTOFF out of range" ] (Tuple.first busy)
                        |> Tuple.second
                        |> Expect.equal [ Set cutoff (Num 300) ]
             , test "a_hand_sees_where_it_asked_to_go" <|
                \_ ->
                    ( Model.pending cutoff (Tuple.first busy), Model.pending reso (Tuple.first busy) )
                        |> Expect.equal ( Just (Num 300), Just (Num 1) )
             , test "an_unanswered_set_is_sent_once_more_then_given_up_and_the_window_moves_on" <|
                \_ ->
                    let
                        ( again, resent ) =
                            run [ Tick (at (now + 1000)) ] (Tuple.first busy)

                        ( gaveUp, next ) =
                            run [ Tick (at (now + 2000)), Tick (at (now + 6000)) ] again
                    in
                    Expect.all
                        [ \_ -> Expect.equal [ Set cutoff (Num 300) ] resent
                        , \_ -> Expect.equal 1 (inFlight again)
                        , \_ -> Expect.equal [ Set reso (Num 1) ] next
                        , \_ -> Expect.equal 1 (inFlight gaveUp)
                        , \_ -> Expect.equal [ NoAnswer (Set cutoff (Num 300)) ] (Model.notices gaveUp |> List.map .notice |> List.filter (not << isRefusalOrUnread))
                        ]
                        ()
             , test "sent_again_and_its_answer_late_past_the_timeout_a_busy_unit_it_lands_unsaid" <|
                \_ ->
                    run [ Tick (at (now + 1000)), Tick (at (now + 2500)), Line "OK" ] (Tuple.first busy)
                        |> Tuple.first
                        |> Model.notices
                        |> List.map .notice
                        |> List.filter (not << isRefusalOrUnread)
                        |> Expect.equal []
             , test "a_routes_amount_goes_through_the_same_window_latest_wins" <|
                \_ ->
                    case ( Protocol.cell "LFO1:FILTER.CUTOFF", Protocol.amount 10, Protocol.amount 20 ) of
                        ( Just c, Just ten, Just twenty ) ->
                            let
                                wire : List Command -> List Command
                                wire =
                                    List.filter (Protocol.sketch >> (\l -> String.startsWith "ed set " l || String.startsWith "ed route " l))

                                go : List Msg -> Model.Model -> ( Model.Model, List Command )
                                go msgs m0 =
                                    List.foldl (\msg ( m, out ) -> stepSends msg m |> Tuple.mapSecond (\cs -> out ++ wire cs)) ( m0, [] ) msgs

                                ( held, first ) =
                                    go [ EditRoute c (Protocol.RouteAmount ten), EditRoute c (Protocol.RouteAmount twenty), Edit cutoff (Num 300) ] following
                            in
                            Expect.all
                                [ \_ -> Expect.equal [ SetRoute c (Protocol.RouteAmount ten) ] first
                                , \_ -> Expect.equal (Just (Protocol.RouteAmount twenty)) (Model.pendingRoute c held)
                                , \_ -> Expect.equal [ SetRoute c (Protocol.RouteAmount twenty), Set cutoff (Num 300) ] (go [ Line "OK", Line "OK", Line "OK" ] held |> Tuple.second)
                                ]
                                ()

                        _ ->
                            Expect.fail "no cell"
             , describe "an answered set stays the base until the unit reports it"
                (let
                    queued : Model.Model
                    queued =
                        run [ Edit cutoff (Num 300), Line "OK queued" ] following |> Tuple.first
                 in
                 [ test "after_ok_queued_the_hand_still_counts_from_what_it_asked" <|
                    \_ -> Expect.equal (Just (Num 300)) (Model.pending cutoff queued)
                 , test "a_stale_report_keeps_it" <|
                    \_ -> Expect.equal (Just (Num 300)) (Model.pending cutoff (feed [ cutoffLine "1000", "OK 3" ] queued))
                 , test "the_report_of_it_ends_it" <|
                    \_ -> Expect.equal Nothing (Model.pending cutoff (feed [ cutoffLine "300", "OK 3" ] queued))
                 , test "a_timeout_ends_it" <|
                    \_ -> Expect.equal Nothing (Model.pending cutoff (run [ Tick (at (now + 1000)) ] queued |> Tuple.first))
                 ]
                )
             , describe "a route the unit queued and never made is said"
                (case ( Protocol.cell "LFO1:FILTER.CUTOFF", Protocol.amount 10 ) of
                    ( Just c, Just ten ) ->
                        let
                            queued : Model.Model
                            queued =
                                run [ EditRoute c (Protocol.RouteAmount ten), Line "OK queued" ] following |> Tuple.first

                            later : Model.Model -> List Notice
                            later m =
                                run [ Tick (at (now + 1000)) ] m |> Tuple.first |> Model.notices |> List.map .notice
                        in
                        [ test "not_taken_when_the_routes_never_show_it" <|
                            \_ -> Expect.equal [ Untaken (SetRoute c (Protocol.RouteAmount ten)) ] (later (feed [ "OK 3" ] queued))
                        , test "nothing_said_when_the_routes_show_it" <|
                            \_ -> Expect.equal [] (later (feed [ "route LFO1:FILTER.CUTOFF 10 \"+10\"", "OK 3" ] queued))
                        , test "refusals_no_line_names_are_said_as_a_count" <|
                            \_ ->
                                feed [ "refused FILTER.CUTOFF \"MATRIX FULL\"", "refused more 5", "OK 3" ] following
                                    |> Model.notices
                                    |> List.map (.notice >> Model.noticeText)
                                    |> Expect.equal [ "THE UNIT REFUSED 5 MORE EDITS", "THE UNIT REFUSED: FILTER.CUTOFF: MATRIX FULL" ]
                        , test "a_capped_count_says_or_more" <|
                            \_ ->
                                feed [ "refused more 31", "OK 3" ] following
                                    |> Model.notices
                                    |> List.map (.notice >> Model.noticeText)
                                    |> Expect.equal [ "THE UNIT REFUSED AT LEAST 31 MORE EDITS" ]
                        , test "its_refusal_said_once_and_not_again_as_not_taken" <|
                            \_ ->
                                later (feed [ "refused FILTER.CUTOFF \"MATRIX FULL\"", "OK 3" ] queued)
                                    |> Expect.equal [ Refusal { sent = Nothing, why = "FILTER.CUTOFF: MATRIX FULL" } ]
                        ]

                    _ ->
                        [ test "a_cell_and_an_amount" <| \_ -> Expect.fail "no cell" ]
                )
             , test "a_set_the_unit_cant_read_is_said_never_sent" <|
                \_ ->
                    let
                        ( m, sent ) =
                            run [ Edit cutoff (Num 1.0e-7) ] following
                    in
                    Expect.all
                        [ \_ -> Expect.equal [] sent
                        , \_ -> Expect.equal 1 (Model.notices m |> List.map .notice |> List.filter (not << isRefusalOrUnread) |> List.length)
                        ]
                        ()
             , test "a_line_the_link_dropped_is_said" <|
                \_ ->
                    Model.step (WriteFailed "ed set FILTER.CUTOFF 300") following
                        |> Tuple.first
                        |> said
                        |> Expect.equal [ "THE LINK DROPPED A LINE: ed set FILTER.CUTOFF 300" ]
             ]
            )
        , describe "what the unit refused or the editor couldn't read is kept"
            [ test "a_stale_witness_refusal_is_kept_with_the_command_it_answers" <|
                \_ ->
                    case ( Protocol.rowIndex 1, Protocol.controlNo 74 ) of
                        ( Just i, Just cc ) ->
                            let
                                rm : MapCommand
                                rm =
                                    RemoveRow (SoundRow i) (InCc cc) (Just cutoff)

                                m : Model.Model
                                m =
                                    following
                                        |> Model.step (MapAct rm)
                                        |> Tuple.first
                                        |> feed [ "ERR ed map rm S1 is not that row: ed since" ]
                            in
                            Expect.all
                                [ \_ -> Expect.equal [ { notice = Refusal { sent = Just (MapCmd rm), why = "ed map rm S1 is not that row: ed since" }, times = 1 } ] (Model.notices m)
                                , \_ -> Expect.equal [ "THE UNIT REFUSED ed map rm S1 CC74 FILTER.CUTOFF: ed map rm S1 is not that row: ed since" ] (said m)
                                ]
                                ()

                        _ ->
                            Expect.fail "a row and a control"
            , test "err_busy_on_a_set_is_no_refusal_and_the_set_goes_again" <|
                \_ ->
                    let
                        m : Model.Model
                        m =
                            following |> Model.step (Edit cutoff (Num 1000)) |> Tuple.first |> feed [ "ERR busy" ]

                        after : Int -> Model.Model -> List Command
                        after t mm =
                            stepSends (Tick (Time.millisToPosix (Time.posixToMillis following.now + t))) mm |> Tuple.second
                    in
                    Expect.all
                        [ \_ -> Expect.equal Nothing (Model.lastRefusal m)
                        , \_ -> Expect.equal Nothing (Model.refusal cutoff m)
                        , \_ -> Expect.equal [] (said m)
                        , \_ -> Expect.equal (Just (Num 1000)) (Model.pending cutoff m)
                        , \_ -> Expect.equal True (List.member (Set cutoff (Num 1000)) (after 60 m))
                        , \_ -> Expect.equal False (List.member (Set cutoff (Num 1000)) (after 10 m))
                        ]
                        ()
            , test "a_load_over_unsaved_edits_is_kept_with_its_load" <|
                \_ ->
                    case ( Protocol.projectId 10, Protocol.generation 2 ) of
                        ( Just i, Just g ) ->
                            following
                                |> Model.step (LoadListed i g Protocol.RefuseOverEdits)
                                |> Tuple.first
                                |> feed [ "ERR ed project load over unsaved edits: discard" ]
                                |> Expect.all
                                    [ Model.lastRefusal >> Expect.equal (Just { sent = Just (LoadProject i g Protocol.RefuseOverEdits), why = "ed project load over unsaved edits: discard" })
                                    , said >> Expect.equal [ "THE UNIT REFUSED ed project load 10 2: ed project load over unsaved edits: discard" ]
                                    ]

                        _ ->
                            Expect.fail "an id and a generation"
            , test "a_route_to_a_cell_the_unit_lacks_is_kept_with_its_route" <|
                \_ ->
                    case Protocol.cell "OP5:FILTER.CUTOFF" of
                        Just c ->
                            following
                                |> Model.step (EditRoute c Protocol.RouteOff)
                                |> Tuple.first
                                |> feed [ "ERR ed route has no OP5:FILTER.CUTOFF here" ]
                                |> Expect.all
                                    [ Model.lastRefusal >> Expect.equal (Just { sent = Just (SetRoute c Protocol.RouteOff), why = "ed route has no OP5:FILTER.CUTOFF here" })
                                    , said >> Expect.equal [ "THE UNIT REFUSED ed route OP5:FILTER.CUTOFF off: ed route has no OP5:FILTER.CUTOFF here" ]
                                    ]

                        Nothing ->
                            Expect.fail "a cell"
            , test "a_line_the_editor_cant_read_is_kept_as_the_unit_wrote_it" <|
                \_ ->
                    following
                        |> feed [ "wibble 1 \"two" ]
                        |> Expect.all
                            [ Model.notices >> Expect.equal [ { notice = Unread "wibble 1 \"two", times = 1 } ]
                            , said >> Expect.equal [ "THE UNIT SAID A LINE THIS EDITOR CAN'T READ: wibble 1 \"two" ]
                            , -- Not a refusal.
                              Model.lastRefusal >> Expect.equal Nothing
                            ]
            , test "a_value_that_is_no_number_is_kept_as_the_unit_wrote_it" <|
                \_ ->
                    following
                        |> feed [ "val FILTER.CUTOFF 0.5 nan \"?\"" ]
                        |> Model.notices
                        |> Expect.equal [ { notice = Unread "val FILTER.CUTOFF 0.5 nan \"?\"", times = 1 } ]
            , test "a_blank_line_says_nothing_and_is_no_notice" <|
                \_ -> following |> feed [ "", "  ", "\u{000D}" ] |> Model.notices |> Expect.equal []
            , test "answers_tie_to_commands_in_the_order_sent" <|
                \_ ->
                    case Unit.partFromInt 2 of
                        Just p2 ->
                            let
                                m : Model.Model
                                m =
                                    following
                                        |> tick 165
                                        |> Tuple.first
                                        |> Model.step SaveOwn
                                        |> Tuple.first
                                        |> Model.step (FollowPart p2)
                                        |> Tuple.first
                                        |> feed [ "OK 1", "ERR ed project save has no file of its own: saveas", "ERR busy" ]
                            in
                            Expect.equal
                                [ Refusal { sent = Just (Follow p2), why = "busy" }
                                , Refusal { sent = Just SaveProject, why = "ed project save has no file of its own: saveas" }
                                ]
                                (Model.notices m |> List.map .notice)

                        Nothing ->
                            Expect.fail "no Part 2"
            , test "a_refused_since_names_its_since" <|
                \_ ->
                    following
                        |> tick 165
                        |> Tuple.first
                        |> feed [ "ERR ed since is not in this build" ]
                        |> Model.lastRefusal
                        |> Expect.equal (Just { sent = Just (Since Nothing), why = "ed since is not in this build" })
            , test "an_err_no_command_waits_for_is_kept_without_one" <|
                \_ ->
                    following
                        |> feed [ "ERR busy" ]
                        |> Expect.all
                            [ Model.lastRefusal >> Expect.equal (Just { sent = Nothing, why = "busy" })
                            , said >> Expect.equal [ "THE UNIT REFUSED: busy" ]
                            ]
            , test "a_commands_ok_ends_it_so_a_later_err_is_not_tied_to_it" <|
                \_ ->
                    following
                        |> Model.step SaveOwn
                        |> Tuple.first
                        |> feed [ "OK queued" ]
                        |> Model.step AskProjects
                        |> Tuple.first
                        |> feed [ "OK", "ERR busy" ]
                        |> Model.lastRefusal
                        |> Expect.equal (Just { sent = Nothing, why = "busy" })
            , test "a_lost_answer_does_not_shift_the_refusals_after_it" <|
                \_ ->
                    -- The save's answer never comes; the since after it is
                    -- answered, so the save is given up and the load's
                    -- refusal is the load's.
                    case ( Protocol.projectId 10, Protocol.generation 2 ) of
                        ( Just i, Just g ) ->
                            following
                                |> Model.step SaveOwn
                                |> Tuple.first
                                |> tick 165
                                |> Tuple.first
                                |> feed [ "OK 1" ]
                                |> Model.step (LoadListed i g Protocol.RefuseOverEdits)
                                |> Tuple.first
                                |> feed [ "ERR ed project load has no such id at that gen: ed projects" ]
                                |> Model.lastRefusal
                                |> Expect.equal (Just { sent = Just (LoadProject i g Protocol.RefuseOverEdits), why = "ed project load has no such id at that gen: ed projects" })

                        _ ->
                            Expect.fail "an id and a generation"
            , test "a_set_refused_by_its_address_ends_the_set" <|
                \_ ->
                    following
                        |> Model.step (Edit cutoff (Num 99999))
                        |> Tuple.first
                        |> Model.step SaveOwn
                        |> Tuple.first
                        |> feed [ "ERR ed set FILTER.CUTOFF takes 20..20000", "ERR busy" ]
                        |> Expect.all
                            [ Model.refusal cutoff >> Expect.equal (Just "takes 20..20000")
                            , Model.lastRefusal >> Expect.equal (Just { sent = Just SaveProject, why = "busy" })
                            ]
            , test "a_later_success_erases_nothing_the_user_has_not_seen" <|
                \_ ->
                    following
                        |> Model.step SaveOwn
                        |> Tuple.first
                        |> feed [ "ERR busy" ]
                        |> Model.step SaveOwn
                        |> Tuple.first
                        |> feed [ "OK queued" ]
                        |> tick 165
                        |> Tuple.first
                        |> feed [ cutoffLine "440", "toast \"SAVED\"", "OK 2" ]
                        |> Model.lastRefusal
                        |> Expect.equal (Just { sent = Just SaveProject, why = "busy" })
            , test "only_the_users_seeing_them_drops_the_notices" <|
                \_ ->
                    let
                        m : Model.Model
                        m =
                            following |> feed [ "ERR busy", "wibble" ]
                    in
                    Expect.all
                        [ \_ -> Expect.equal 2 (List.length (Model.notices m))
                        , \_ -> Expect.equal [] (m |> Model.step SeenNotices |> Tuple.first |> Model.notices)
                        , -- A lost link and the next one keep them: they were not seen.
                          \_ -> Expect.equal 2 (m |> Model.step (LinkChanged Lost) |> Tuple.first |> Model.step (LinkChanged Open) |> Tuple.first |> Model.notices |> List.length)
                        ]
                        ()
            , test "the_same_notice_again_is_counted_not_repeated_and_comes_first" <|
                \_ ->
                    following
                        |> feed [ "ERR busy", "wibble", "ERR busy" ]
                        |> Model.notices
                        |> Expect.equal
                            [ { notice = Refusal { sent = Nothing, why = "busy" }, times = 2 }
                            , { notice = Unread "wibble", times = 1 }
                            ]
            , test "past_sixteen_the_oldest_notice_falls_off_and_is_counted" <|
                \_ ->
                    let
                        m : Model.Model
                        m =
                            following |> feed (List.range 1 18 |> List.map (\n -> "wibble " ++ String.fromInt n))
                    in
                    Expect.all
                        [ \_ -> Expect.equal 16 (List.length (Model.notices m))
                        , \_ -> Expect.equal (Just (Unread "wibble 18")) (Model.notices m |> List.head |> Maybe.map .notice)
                        , \_ -> Expect.equal 2 (Model.noticesLost m)
                        , \_ -> Expect.equal 0 (m |> Model.step SeenNotices |> Tuple.first |> Model.noticesLost)
                        ]
                        ()
            , test "a_full_list_drops_its_oldest_unread_before_any_refusal" <|
                \_ ->
                    let
                        m : Model.Model
                        m =
                            following |> feed ([ "ERR r 0", "wibble 1", "wibble 2" ] ++ (List.range 1 14 |> List.map (\n -> "ERR r " ++ String.fromInt n)))
                    in
                    Expect.all
                        [ \_ -> Expect.equal 16 (List.length (Model.notices m))
                        , \_ -> Expect.equal [ Unread "wibble 2" ] (Model.notices m |> List.map .notice |> List.filter isUnread)
                        , \_ -> Expect.equal (Just (Refusal { sent = Nothing, why = "r 0" })) (Model.notices m |> List.reverse |> List.head |> Maybe.map .notice)
                        , \_ -> Expect.equal 1 (Model.noticesLost m)
                        ]
                        ()
            , test "an_unread_line_never_pushes_a_refusal_off_a_full_list" <|
                \_ ->
                    let
                        m : Model.Model
                        m =
                            following |> feed ((List.range 1 16 |> List.map (\n -> "ERR r " ++ String.fromInt n)) ++ [ "wibble" ])
                    in
                    Expect.all
                        [ \_ -> Expect.equal (List.range 1 16 |> List.reverse |> List.map (\n -> Refusal { sent = Nothing, why = "r " ++ String.fromInt n })) (Model.notices m |> List.map .notice)
                        , \_ -> Expect.equal 1 (Model.noticesLost m)
                        ]
                        ()
            , test "with_no_unread_kept_the_oldest_refusal_falls_off" <|
                \_ ->
                    let
                        m : Model.Model
                        m =
                            following |> feed (List.range 1 17 |> List.map (\n -> "ERR r " ++ String.fromInt n))
                    in
                    Expect.all
                        [ \_ -> Expect.equal (List.range 2 17 |> List.reverse |> List.map (\n -> Refusal { sent = Nothing, why = "r " ++ String.fromInt n })) (Model.notices m |> List.map .notice)
                        , \_ -> Expect.equal 1 (Model.noticesLost m)
                        ]
                        ()
            , test "a_set_refused_by_its_address_is_kept_with_its_set_too" <|
                \_ ->
                    following
                        |> Model.step (Edit cutoff (Num 99999))
                        |> Tuple.first
                        |> feed [ "ERR ed set FILTER.CUTOFF takes 20..20000" ]
                        |> Expect.all
                            [ Model.refusal cutoff >> Expect.equal (Just "takes 20..20000")
                            , Model.notices >> Expect.equal [ { notice = Refusal { sent = Just (Set cutoff (Num 99999)), why = "takes 20..20000" }, times = 1 } ]
                            , said >> Expect.equal [ "THE UNIT REFUSED ed set FILTER.CUTOFF 99999: takes 20..20000" ]
                            ]
            , test "a_set_refusal_no_set_waits_for_is_kept_naming_its_address" <|
                \_ ->
                    following
                        |> feed [ "ERR ed set FILTER.CUTOFF takes a number", "ERR ed set has no CHORUS.MODE here" ]
                        |> said
                        |> Expect.equal [ "THE UNIT REFUSED: has no CHORUS.MODE here", "THE UNIT REFUSED: FILTER.CUTOFF: takes a number" ]
            , test "a_refusal_from_since_is_kept_after_its_control_has_a_value_again" <|
                \_ ->
                    following
                        |> feed [ cutoffLine "1000", "OK 1" ]
                        |> Model.step (Edit cutoff (Num 5000))
                        |> Tuple.first
                        |> feed [ "OK queued", "refused FILTER.CUTOFF \"NOT ON THIS MACHINE\"", "OK 2", cutoffLine "1200", "OK 3" ]
                        |> Expect.all
                            [ Model.refusal cutoff >> Expect.equal Nothing
                            , Model.notices >> Expect.equal [ { notice = Refusal { sent = Nothing, why = "FILTER.CUTOFF: NOT ON THIS MACHINE" }, times = 1 } ]
                            , said >> Expect.equal [ "THE UNIT REFUSED: FILTER.CUTOFF: NOT ON THIS MACHINE" ]
                            ]
            , test "a_refusal_from_since_the_control_does_not_show_is_no_notice" <|
                \_ ->
                    -- A whole answer's is stale, and another engine's address is not this Part's.
                    following
                        |> feed [ "part 1 ALGO", "refused FILTER.CUTOFF \"OLD\"", "OK 1", "refused PAD3.CHOKE \"9 GROUPS · KIT HOLDS 8\"", "OK 2" ]
                        |> Model.notices
                        |> Expect.equal []
            , test "a_set_refusal_after_a_halt_is_kept" <|
                \_ ->
                    greeted
                        |> tick 33
                        |> Tuple.first
                        |> feed [ "OK", "ERR ed set FILTER.CUTOFF takes a number" ]
                        |> Model.notices
                        |> List.map .notice
                        |> Expect.equal [ Refusal { sent = Nothing, why = "FILTER.CUTOFF: takes a number" } ]
            , test "an_unread_line_while_connecting_is_kept" <|
                \_ -> greeted |> feed [ "wibble" ] |> Model.notices |> List.map .notice |> Expect.equal [ Unread "wibble" ]
            , test "an_err_or_unread_line_after_a_halt_is_kept" <|
                \_ ->
                    greeted
                        |> tick 33
                        |> Tuple.first
                        |> feed [ "OK", "ERR busy", "wibble" ]
                        |> Expect.all
                            [ Model.notice >> Expect.equal (Just "UPDATE THE EDITOR")
                            , Model.notices >> List.map .notice >> Expect.equal [ Unread "wibble", Refusal { sent = Nothing, why = "busy" } ]
                            ]
            , test "a_new_engine_is_read_only_once_every_command_sent_is_answered" <|
                \_ ->
                    -- The save went out after the since: its `OK` comes after
                    -- the since's, and must not be read as `ed schema`'s.
                    let
                        m : Model.Model
                        m =
                            following
                                |> tick 165
                                |> Tuple.first
                                |> Model.step SaveOwn
                                |> Tuple.first
                                |> feed [ "part 2 VA", "OK 3" ]

                        ( m1, asked ) =
                            tick 198 m
                    in
                    Expect.all
                        [ \_ -> Expect.equal [ Since (gen 3) ] asked
                        , \_ -> Expect.equal [ AskSchema (EngineSchema Va) ] (m1 |> feed [ "OK queued", "OK 4" ] |> tick 231 |> Tuple.second)
                        , \_ -> Expect.equal Nothing (m1 |> feed [ "OK queued", "OK 4" ] |> Model.notice)
                        ]
                        ()
            ]
        , describe "a schema is the text its hash names"
            [ test "a_cached_copy_that_doesnt_hash_to_the_units_hash_is_described_again" <|
                \_ ->
                    -- One page, as the unit said, but not its text.
                    greeted
                        |> tick 33
                        |> Tuple.first
                        |> feed [ "schema ALGO 1 " ++ algoHash, "OK" ]
                        |> Model.step (Recalled { key = key (EngineSchema Algo) algoHash, lines = Just (List.map (String.replace "CUTOFF\"" "CUTOFG\"") algoPage) })
                        |> Tuple.first
                        |> Expect.all
                            [ tick 66 >> Tuple.second >> Expect.equal [ Describe (EngineSchema Algo) (page 0) ]
                            , .schema >> Schema.pages >> List.length >> Expect.equal 0
                            ]
            , test "a_cached_copy_missing_a_line_is_described_again" <|
                \_ ->
                    greeted
                        |> tick 33
                        |> Tuple.first
                        |> feed [ "schema ALGO 1 " ++ algoHash, "OK" ]
                        |> Model.step (Recalled { key = key (EngineSchema Algo) algoHash, lines = Just (List.take 5 algoPage) })
                        |> Tuple.first
                        |> tick 66
                        |> Tuple.second
                        |> Expect.equal [ Describe (EngineSchema Algo) (page 0) ]
            , test "a_cached_line_that_doesnt_parse_marks_the_schema_bad" <|
                \_ ->
                    let
                        lines : List String
                        lines =
                            algoPage ++ [ "knob FILTER.CUTOFF 3" ]
                    in
                    greeted
                        |> tick 33
                        |> Tuple.first
                        |> feed [ "schema ALGO 1 " ++ hashOf lines, "OK" ]
                        |> Model.step (Recalled { key = key (EngineSchema Algo) (hashOf lines), lines = Just lines })
                        |> Tuple.first
                        |> Expect.all
                            [ Model.notice >> Expect.equal (Just "THE UNIT'S ALGO SCHEMA HAS A LINE THIS EDITOR CAN'T READ: knob FILTER.CUTOFF 3")
                            , tick 66 >> Tuple.second >> Expect.equal []
                            , .schema >> Schema.pages >> List.length >> Expect.equal 0
                            ]
            , test "a_described_line_that_doesnt_parse_marks_the_schema_bad_and_keeps_nothing" <|
                \_ ->
                    let
                        ( m, effects ) =
                            greeted
                                |> tick 33
                                |> Tuple.first
                                |> feed [ "schema ALGO 1 " ++ algoHash, "OK" ]
                                |> missed (EngineSchema Algo) algoHash
                                |> tick 66
                                |> Tuple.first
                                |> feed (List.take 2 algoPage ++ [ "knob FILTER.CUTOFF 3" ] ++ List.drop 2 algoPage)
                                |> Model.step (Line "OK")
                    in
                    Expect.all
                        [ \_ -> Expect.equal (Just "THE UNIT'S ALGO SCHEMA HAS A LINE THIS EDITOR CAN'T READ: knob FILTER.CUTOFF 3") (Model.notice m)
                        , \_ -> Expect.equal [] effects
                        , \_ -> Expect.equal 0 (List.length (Schema.pages m.schema))
                        ]
                        ()
            , test "a_described_schema_that_isnt_the_text_its_hash_names_is_bad_and_not_kept" <|
                \_ ->
                    let
                        ( m, effects ) =
                            greeted
                                |> tick 33
                                |> Tuple.first
                                |> feed [ "schema ALGO 1 ffffffffffffffff", "OK" ]
                                |> missed (EngineSchema Algo) "ffffffffffffffff"
                                |> tick 66
                                |> Tuple.first
                                |> feed algoPage
                                |> Model.step (Line "OK")
                    in
                    Expect.all
                        [ \_ -> Expect.equal (Just ("THE UNIT'S ALGO SCHEMA IS NOT THE TEXT ITS HASH NAMES: ffffffffffffffff, READ " ++ algoHash)) (Model.notice m)
                        , \_ -> Expect.equal [] effects
                        , \_ -> Expect.equal 0 (List.length (Schema.pages m.schema))
                        ]
                        ()
            , test "a_line_that_is_no_schema_line_in_a_describe_answer_moves_its_hash" <|
                \_ ->
                    greeted
                        |> tick 33
                        |> Tuple.first
                        |> feed [ "schema ALGO 1 " ++ algoHash, "OK" ]
                        |> missed (EngineSchema Algo) algoHash
                        |> tick 66
                        |> Tuple.first
                        |> feed (algoPage ++ [ cutoffLine "440", "OK" ])
                        |> Model.notice
                        |> Expect.equal (Just ("THE UNIT'S ALGO SCHEMA IS NOT THE TEXT ITS HASH NAMES: " ++ algoHash ++ ", READ " ++ hashOf (algoPage ++ [ cutoffLine "440" ])))
            , test "the_units_own_mixer_text_describes_and_is_kept_under_the_hash_of_its_bytes" <|
                \_ ->
                    let
                        hash : String
                        hash =
                            FixtureData.schemaHashes |> List.filter (\( n, _ ) -> n == "mixer") |> List.map Tuple.second |> String.concat

                        ( m, effects ) =
                            greeted
                                |> tick 33
                                |> Tuple.first
                                |> feed [ "schema ALGO 1 " ++ algoHash, "OK" ]
                                |> Model.step (Recalled { key = key (EngineSchema Algo) algoHash, lines = Just algoPage })
                                |> Tuple.first
                                |> tick 66
                                |> Tuple.first
                                |> feed [ "schema MIXER 34 " ++ hash, "OK" ]
                                |> missed MixerSchema hash
                                |> feed (List.take (List.length FixtureData.mixer - 1) FixtureData.mixer)
                                |> Model.step (Line "OK")
                    in
                    Expect.all
                        [ \_ -> Expect.equal Nothing (Model.notice m)
                        , \_ -> Expect.equal [ Keep (key MixerSchema hash) (List.filter (\l -> l /= "OK") FixtureData.mixer) ] effects
                        , \_ -> Expect.equal 34 (List.length (Schema.pages m.mixer))
                        , -- And recalled, it is the same schema with no describe.
                          \_ ->
                            greeted
                                |> tick 33
                                |> Tuple.first
                                |> feed [ "schema ALGO 1 " ++ algoHash, "OK" ]
                                |> Model.step (Recalled { key = key (EngineSchema Algo) algoHash, lines = Just algoPage })
                                |> Tuple.first
                                |> tick 66
                                |> Tuple.first
                                |> feed [ "schema MIXER 34 " ++ hash, "OK" ]
                                |> Model.step (Recalled { key = key MixerSchema hash, lines = Just (List.filter (\l -> l /= "OK") FixtureData.mixer) })
                                |> Tuple.first
                                |> .mixer
                                |> Expect.equal m.mixer
                        ]
                        ()
            ]
        ]


{-| A whole ORBIT section: playing scene 3, two slots, ORBIT's values, two
chords, the CUSTOM scale, two steps and a pool.
-}
orbitSection : List String
orbitSection =
    [ "orbit"
    , "song playing clock INT scene 3 queued - edited yes"
    , "slot 1 saved rev 4"
    , "slot 3 neutral rev 0"
    , "val ORBIT.KEY 0.0909 1 \"C#\""
    , "val TEMPO.BPM 0.33 120 \"120\""
    , "val RING1.HITS 0.25 8 \"8\""
    , "chord 1 1"
    , "chord 2 5"
    , "scale 2741"
    , "step 1 1 60"
    , "step 2 32 67"
    , "pool 1 60 64 67"
    ]


{-| A whole MAP section: Part 2 on map KEYSTEP, two Sound rows, a map row,
learn armed, the card's maps.
-}
mapSection : List String
mapSection =
    [ "map 2 \"KEYSTEP\" keep on"
    , "row S1 CC74 JUMP FILTER.CUTOFF 0 255 off live"
    , "row S2 CC75 TWOS-COMP - 0 255 off dead"
    , "row M1 CC74 PICKUP PART1.LEVEL 255 0 on shadowed"
    , "learn armed FILTER.CUTOFF \"MOVE A CONTROL\""
    , "mapfile \"KEYSTEP\""
    , "mapfile \"BEATSTEP PRO\""
    ]
