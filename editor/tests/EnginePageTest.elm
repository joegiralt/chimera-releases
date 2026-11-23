-- SPDX-License-Identifier: GPL-3.0-or-later


module EnginePageTest exposing (suite)

import Addr exposing (Addr)
import Contract exposing (opt)
import Dict
import Expect
import Fixture
import FixtureData
import Hash
import Html.Attributes exposing (attribute)
import Json.Encode as Encode
import Layout.Algo
import Layout.Page exposing (DrawnPage(..), PadDrawn(..))
import Layout.Shared as Shared
import Model
import Protocol exposing (Value(..))
import Schema
import Test exposing (Test, describe, test)
import Test.Html.Event as Event
import Test.Html.Query as Query
import Test.Html.Selector as Sel
import Time
import Transport exposing (Link(..))
import Ui.Chip as Chip
import Ui.Control as Control exposing (Direction(..), Travel(..))
import Ui.Pad as Pad
import Ui.PadStrip as PadStrip exposing (Tab(..))
import Ui.Page
import Ui.PatchBay as PatchBay
import Ui.Routes as Routes
import Ui.Screen as Screen
import Ui.Tokens exposing (Theme(..))
import Unit
import View.EnginePage as Page exposing (BayId(..), Msg(..))
import Wire exposing (addr)


feed : List String -> Model.Model -> Model.Model
feed ls m =
    List.foldl (\l -> Model.step (Model.Line l) >> Tuple.first) m ls


tick : Int -> Model.Model -> Model.Model
tick ms =
    Model.step (Model.Tick (Time.millisToPosix ms)) >> Tuple.first


{-| The fixture's answer split at each OK: one chunk a page.
-}
pagesOf : List String -> List (List String)
pagesOf ls =
    List.foldl
        (\l ( cur, out ) ->
            if l == "OK" then
                ( [], out ++ [ cur ++ [ l ] ] )

            else
                ( cur ++ [ l ], out )
        )
        ( [], [] )
        ls
        |> Tuple.second


{-| Connected over a link, greeted, and the engine's, the MIXER's, a
one-page matrix schema, SETTINGS', a one-page MAP schema and ORBIT's read the
way the model reads them (no cache), then one `since` answer: following Part 1.
-}
connected : List String -> String -> Model.Model
connected =
    connectedWith [ "page 0 MTX of 1", "OK" ]


{-| LFO1's route into FREQ, keyed as its cable is: by its cell.
-}
lfoCell : Addr
lfoCell =
    addr "LFO1:FILTER.CUTOFF"


{-| A route amount's place on the attenuverter, −127 at 0, and back.
-}
normOfBox : Int -> Float
normOfBox n =
    (toFloat n / 127 + 1) / 2


boxAt : Float -> Int
boxAt t =
    clamp -127 127 (round ((clamp 0 1 t * 2 - 1) * 127))


routeTo : String -> Int -> List Model.Msg
routeTo cell n =
    Maybe.map2 (\c a -> [ Model.EditRoute c (Protocol.RouteAmount a) ]) (Protocol.cell cell) (Protocol.amount n) |> Maybe.withDefault []


{-| What a patch from source `from` to destination `to` on the Part's bay
asks of the unit; and an unpatch.
-}
patchOn : Model.Model -> String -> String -> List Model.Msg
patchOn =
    onBay PatchBay.Connect


unpatchOn : Model.Model -> String -> String -> List Model.Msg
unpatchOn =
    onBay PatchBay.Unpatch


onBay : (Routes.Source -> Routes.Dest -> PatchBay.Msg) -> Model.Model -> String -> String -> List Model.Msg
onBay msg unit from to =
    let
        routes : Routes.Routes
        routes =
            Page.partBay unit
    in
    case ( routes |> Routes.sources |> List.filter (Routes.sourceName >> (==) from) |> List.head, routes |> Routes.dests |> List.filter (Routes.destName >> (==) to) |> List.head ) of
        ( Just s, Just d ) ->
            Page.update (BayMsg PartBay (msg s d)) unit (Page.init Day) |> (\( _, out, _ ) -> out)

        _ ->
            []


{-| `connected`, the engine's matrix described as `mtx`.
-}
connectedWith : List String -> List String -> String -> Model.Model
connectedWith mtx answer engine =
    Model.init
        |> Model.step (Model.LinkChanged Open)
        |> Tuple.first
        |> tick 0
        |> feed [ "ed hello 4 b part 1 " ++ engine, "OK" ]
        |> readSchema 1 engine answer
        |> readSchema 2 "MIXER" FixtureData.mixer
        |> readSchema 3 ("MTX-" ++ engine) mtx
        |> readSchema 4 "SETTINGS" FixtureData.settings
        |> readSchema 5 "MAP" FixtureData.map
        |> readSchema 6 "ORBIT" FixtureData.orbit
        |> tick 50000


{-| `ed schema` answered with the hash of the answer's own text, the cache
missing, then every page described.
-}
readSchema : Int -> String -> List String -> Model.Model -> Model.Model
readSchema k token answer m0 =
    let
        hash : String
        hash =
            Hash.toHex (Hash.ofLines (List.filter (\l -> l /= "OK") answer))

        pages : List (List String)
        pages =
            pagesOf answer
    in
    List.foldl (\( i, chunk ) m -> m |> tick (10000 * k + 33 * (i + 1)) |> feed chunk)
        (m0
            |> tick (10000 * k)
            |> feed [ "schema " ++ token ++ " " ++ String.fromInt (List.length pages) ++ " " ++ hash, "OK" ]
            |> Model.step (Model.Recalled { key = "4/" ++ token ++ "/" ++ hash, lines = Nothing })
            |> Tuple.first
        )
        (List.indexedMap Tuple.pair pages)


model : Model.Model
model =
    connected FixtureData.lines "ALGO"
        |> feed [ "val FILTER.CUTOFF 0.5 632.4555 \"632 Hz\"", "val FILTER.KIND 0 0 \"CLEAN\"", "panel FILTER CLEAN", "panel OP1 TABLE", "panel ENV1 A-FAST", "OK 1" ]


cutoff : Addr
cutoff =
    addr "FILTER.CUTOFF"


cutoffParam : Schema.Param
cutoffParam =
    Fixture.param "FILTER.CUTOFF"


run : List Page.Msg -> List Model.Msg
run =
    runOn model


runOn : Model.Model -> List Page.Msg -> List Model.Msg
runOn unit =
    List.foldl
        (\msg ( s, out ) ->
            Page.update msg unit s |> (\( s1, m, _ ) -> ( s1, out ++ m ))
        )
        ( Page.init Day, [] )
        >> Tuple.second


{-| Cutoff `n` wheel notches up from where the unit has it, each notch from
where the last one asked it to go.
-}
notches : Int -> Float
notches n =
    let
        notch : Float -> Float
        notch from =
            Control.nudged cutoffParam { from = from, by = 1, wheel = Control.wheelNorm cutoffParam }
    in
    List.foldl (\_ v -> notch (Control.normOf cutoffParam v)) (notch 0.5) (List.range 2 n)


{-| The page and the model together, as `Main` runs them, the unit saying
nothing back: the model after, and the edits the page asked for. A `Frame`
comes only when the page's subscriptions would deliver one (`framed`).
-}
live : List Page.Msg -> Model.Model -> ( Model.Model, List Model.Msg )
live msgs unit0 =
    List.foldl
        (\msg ( unit, s, out ) ->
            let
                -- A frame arrives only while the page's subscriptions ask for one.
                ( s1, asks, _ ) =
                    if msg == Frame && not (Page.framed s) then
                        ( s, [], Nothing )

                    else
                        Page.update msg unit s
            in
            ( List.foldl (\e u -> Model.step e u |> Tuple.first) unit asks, s1, out ++ asks )
        )
        ( unit0, Page.init Day, [] )
        msgs
        |> (\( u, _, out ) -> ( u, out ))


{-| Each engine followed, every param at its default, as the unit reports
it after loading INIT.
-}
engines : List ( String, Model.Model )
engines =
    [ ( "ALGO", model |> reported )
    , ( "VA", connected FixtureData.va "VA" |> feed [ "panel FILTER SEM", "OK 1" ] |> reported )
    , ( "MODAL", connected FixtureData.modal "MODAL" |> feed [ "panel RESONATOR SYMP", "OK 1" ] |> reported )
    , ( "TAPE", connected FixtureData.tape "TAPE" |> feed [ "panel MACHINE STRCH", "OK 1" ] |> reported )
    ]


{-| Every param the schema holds, reported at its default.
-}
reported : Model.Model -> Model.Model
reported m =
    let
        line : Schema.Param -> String
        line p =
            "val "
                ++ Addr.key p.addr
                ++ " "
                ++ String.fromFloat
                    (if p.max > p.min then
                        clamp 0 1 ((p.default - p.min) / (p.max - p.min))

                     else
                        0
                    )
                ++ " "
                ++ String.fromFloat p.default
                ++ " \"x\""
    in
    feed (List.filterMap (\a -> Schema.param a m.schema |> Maybe.map line) (Schema.addresses m.schema) ++ [ "OK 2" ]) m


grab : Page.Msg
grab =
    Hand (Control.Grab cutoff Hero 300)


pick : String -> Int -> List Model.Msg
pick a i =
    Protocol.optIndex i |> Maybe.map (\o -> [ Model.Pick (addr a) o ]) |> Maybe.withDefault []


suite : Test
suite =
    describe "View.EnginePage"
        [ describe "a hand reaches the unit as the old face's did"
            [ test "a_drag_asks_nothing_until_the_frame" <|
                \_ ->
                    run [ grab, Hand (Control.Moved 290), Hand (Control.Moved 280) ]
                        |> Expect.equal []
            , test "a_whole_drag_in_one_frame_sends_one_set_for_the_control" <|
                \_ ->
                    run [ grab, Hand (Control.Moved 290), Hand (Control.Moved 280), Hand (Control.Moved 270), Frame ]
                        |> List.length
                        |> Expect.equal 1
            , test "that_one_set_is_the_last_position" <|
                \_ ->
                    -- 0.5 + 60 / 240 = 0.75 of ten octaves above 20 Hz
                    run [ grab, Hand (Control.Moved 290), Hand (Control.Moved 240), Frame ]
                        |> Expect.equal [ Model.Edit cutoff (Num (Control.atNorm cutoffParam 0.75)) ]
            , test "the_next_frame_sends_nothing_new" <|
                \_ ->
                    run [ grab, Hand (Control.Moved 290), Frame, Frame ]
                        |> List.length
                        |> Expect.equal 1
            , test "a_released_drag_still_flushes_its_last_want" <|
                \_ ->
                    run [ grab, Hand (Control.Moved 250), Hand Control.Released, Frame ]
                        |> List.length
                        |> Expect.equal 1
            , test "a_choice_click_sends_a_pick_once_per_frame" <|
                \_ ->
                    case ( Protocol.optIndex 1, Protocol.optIndex 2 ) of
                        ( Just one, Just two ) ->
                            run [ Hand (Control.Pick (addr "FILTER.KIND") one), Hand (Control.Pick (addr "FILTER.KIND") two), Frame ]
                                |> Expect.equal (pick "FILTER.KIND" 2)

                        _ ->
                            Expect.fail "no option"
            , test "a_wheel_notch_steps_by_the_params_own_step" <|
                \_ ->
                    run [ Hand (Control.Step cutoff Up), Frame ]
                        |> Expect.equal [ Model.Edit cutoff (Num (Control.atNorm cutoffParam (0.5 + Control.wheelNorm cutoffParam))) ]
            , test "two_notches_in_a_frame_count_twice" <|
                \_ ->
                    run [ Hand (Control.Step cutoff Up), Hand (Control.Step cutoff Up), Frame ]
                        |> Expect.equal [ Model.Edit cutoff (Num (notches 2)) ]
            , test "notches_faster_than_the_units_answers_accumulate" <|
                \_ ->
                    let
                        ( unit, edits ) =
                            live [ Hand (Control.Step cutoff Up), Frame, Hand (Control.Step cutoff Up), Frame, Hand (Control.Step cutoff Up), Frame ] model

                        third : Model.Msg
                        third =
                            Model.Edit cutoff (Num (notches 3))
                    in
                    Expect.all
                        [ \_ -> Expect.equal (Just third) (List.head (List.reverse edits))
                        , \_ -> Expect.equal (Just (Num (notches 3))) (Model.pending cutoff unit)
                        ]
                        ()
            , test "a_double_click_restores_the_units_default" <|
                \_ ->
                    run [ Hand (Control.Reset cutoff), Frame ]
                        |> Expect.equal [ Model.Edit cutoff (Num cutoffParam.default) ]
            , describe "every shown control answers a hand with the unit's edit"
                (List.map
                    (\( name, unit ) ->
                        test name <|
                            \_ ->
                                Shared.active unit.schema unit.variants
                                    |> List.filter (\i -> runOn unit (hands i) /= expected unit i)
                                    |> List.map (.param >> .addr)
                                    |> Expect.equal []
                    )
                    engines
                )
            ]
        , describe "a hand lets go when the box takes another Part"
            [ test "a_held_drag_writes_nothing_after_the_part_changes" <|
                \_ ->
                    let
                        ( held, _, _ ) =
                            Page.update grab model (Page.init Day)

                        ( after, moved, _ ) =
                            Page.update (Hand (Control.Moved 250)) elsewhere held

                        ( _, flushed, _ ) =
                            Page.update Frame elsewhere after
                    in
                    Expect.equal [] (moved ++ flushed)
            , test "wants_made_before_the_part_changed_are_dropped" <|
                \_ ->
                    let
                        ( held, _, _ ) =
                            Page.update grab model (Page.init Day)

                        ( wanting, _, _ ) =
                            Page.update (Hand (Control.Moved 250)) model held

                        ( _, flushed, _ ) =
                            Page.update Frame elsewhere wanting
                    in
                    Expect.equal [] flushed
            , test "the_page_follows_the_box_through_the_model_alone" <|
                \_ ->
                    let
                        ( held, _, _ ) =
                            Page.update grab model (Page.init Day)

                        ( wanting, _, _ ) =
                            Page.update (Hand (Control.Moved 250)) model held
                    in
                    Page.follow elsewhere wanting
                        |> .wanted
                        |> Control.isEmpty
                        |> Expect.equal True
            ]
        , describe "every control shows the unit's value, never a guess"
            [ test "a_drag_moves_nothing_on_the_page_until_the_unit_reports" <|
                \_ ->
                    let
                        ( held, _, _ ) =
                            Page.update grab model (Page.init Day)

                        ( wanting, _, _ ) =
                            Page.update (Hand (Control.Moved 200)) model held
                    in
                    Page.view model wanting
                        |> Query.fromHtml
                        |> Query.find [ Sel.attribute (attribute "role" "slider"), Sel.attribute (attribute "aria-label" "FREQ") ]
                        |> Query.has [ Sel.attribute (attribute "aria-valuetext" "632 Hz") ]
            , test "a_refusal_shows_on_its_control_with_the_units_reason" <|
                \_ ->
                    Page.view (feed [ "refused FILTER.CUTOFF \"FILTER IS OFF\"", "OK 2" ] model) (Page.init Day)
                        |> Query.fromHtml
                        |> Query.find [ Sel.class "c", Sel.class "refused", Sel.containing [ Sel.text "FREQ" ] ]
                        |> Query.has [ Sel.attribute (attribute "title" "THE UNIT REFUSED: FILTER IS OFF"), Sel.text "632 Hz" ]
            , test "an_err_to_a_set_shows_on_its_control_the_same_way" <|
                \_ ->
                    Page.view (feed [ "ERR ed set FILTER.CUTOFF takes a number" ] model) (Page.init Day)
                        |> Query.fromHtml
                        |> Query.findAll [ Sel.class "c", Sel.class "refused", Sel.containing [ Sel.text "FREQ" ] ]
                        |> Query.count (Expect.equal 1)
            , test "a_refusal_that_is_no_controls_is_said_on_the_page_in_the_units_words" <|
                \_ ->
                    Page.view (feed [ "ERR busy", "ERR busy", "wibble 3" ] model) (Page.init Day)
                        |> Query.fromHtml
                        |> Query.find [ Sel.class "said" ]
                        |> Query.has [ Sel.text "THE UNIT REFUSED: busy", Sel.text "×2", Sel.text "THE UNIT SAID A LINE THIS EDITOR CAN'T READ: wibble 3" ]
            , test "seeing_the_notices_tells_the_model" <|
                \_ ->
                    Page.view (feed [ "ERR busy" ] model) (Page.init Day)
                        |> Query.fromHtml
                        |> Query.find [ Sel.class "said" ]
                        |> Query.find [ Sel.tag "button" ]
                        |> Event.simulate Event.click
                        |> Event.expect (Unit Model.SeenNotices)
            , test "nothing_kept_says_nothing" <|
                \_ ->
                    Page.view model (Page.init Day)
                        |> Query.fromHtml
                        |> Query.findAll [ Sel.class "said" ]
                        |> Query.count (Expect.equal 0)
            , test "a_notice_is_said_on_the_connect_page_too_with_how_many_were_lost" <|
                \_ ->
                    Page.view (feed (List.range 1 17 |> List.map (\n -> "wibble " ++ String.fromInt n)) Model.init) (Page.init Day)
                        |> Query.fromHtml
                        |> Query.find [ Sel.class "said" ]
                        |> Query.has [ Sel.text "THE UNIT SAID A LINE THIS EDITOR CAN'T READ: wibble 17", Sel.text "AND 1 MORE NO LONGER KEPT" ]
            , test "the_next_value_clears_the_refusal" <|
                \_ ->
                    Page.view (feed [ "refused FILTER.CUTOFF \"FILTER IS OFF\"", "OK 2", "val FILTER.CUTOFF 0.5 632.4555 \"632 Hz\"", "OK 3" ] model) (Page.init Day)
                        |> Query.fromHtml
                        |> Query.findAll [ Sel.class "refused" ]
                        |> Query.count (Expect.equal 0)
            , test "a_value_not_reported_is_a_missing_cell" <|
                \_ ->
                    Page.view model (Page.init Day)
                        |> Query.fromHtml
                        |> Query.find [ Sel.attribute (attribute "role" "slider"), Sel.attribute (attribute "aria-label" "Q") ]
                        |> Query.has [ Sel.attribute (attribute "aria-valuetext" "--") ]
            , test "a_value_not_reported_cannot_be_dragged" <|
                \_ ->
                    run [ Hand (Control.Grab (addr "FILTER.RESO") Knob 300), Hand (Control.Moved 250), Frame ]
                        |> Expect.equal []
            , test "a_choice_off_its_list_says_so" <|
                \_ ->
                    Page.view (feed [ "val FILTER.KIND 1 99 \"??\"", "OK 2" ] model) (Page.init Day)
                        |> Query.fromHtml
                        |> Query.findAll [ Sel.class "hmn", Sel.containing [ Sel.text "??" ] ]
                        |> Query.count (Expect.equal 1)
            ]
        , describe "the screens' spec"
            [ test "the_algo_chart_is_drawn_with_morphs_cell_in_focus" <|
                \_ ->
                    Shared.screen algorithmModule
                        |> Maybe.andThen (Page.screenSpec model Unit.Algo)
                        |> Maybe.andThen Screen.spec
                        |> Maybe.andThen .focus
                        |> Expect.equal (Just Layout.Algo.chartFocus)
            , test "the_chart_focus_is_never_alg_a_or_b" <|
                \_ ->
                    List.member Layout.Algo.chartFocus [ Screen.CellA, Screen.CellB ] |> Expect.equal False
            , test "a_screen_carries_only_its_pages_addresses_and_selectors_in_describe_order" <|
                \_ ->
                    Shared.screen algorithmModule
                        |> Maybe.andThen (Page.screenSpec (reported model) Unit.Algo)
                        |> Maybe.andThen Screen.spec
                        |> Maybe.map (.vals >> List.map (Tuple.first >> Addr.key))
                        |> Expect.equal (Just [ "ALGO.ALG_A", "ALGO.ALG_B", "ALGO.MORPH", "ALGO.TRNSP", "OUT.LEVEL", "ALGO.VOWEL" ])
            , test "a_variant_pages_screen_carries_its_selector" <|
                \_ ->
                    Page.screenSpec (reported model) Unit.Algo (Shared.tall Flt)
                        |> Maybe.andThen Screen.spec
                        |> Maybe.map (.vals >> List.map (Tuple.first >> Addr.key) >> List.member "FILTER.KIND")
                        |> Expect.equal (Just True)
            , describe "every engine's screens hold nothing from another page but what their art reads"
                (List.map
                    (\( name, unit ) ->
                        test name <|
                            \_ ->
                                (Page.layout (engineOf name) Kit).every
                                    |> List.filterMap Shared.screen
                                    |> List.filterMap (\sc -> Page.screenSpec unit (engineOf name) sc |> Maybe.andThen Screen.spec |> Maybe.map (Tuple.pair (Shared.screenReads sc)))
                                    |> List.concatMap (\( reads, sp ) -> List.filter (\( a, _ ) -> not (onPage unit sp.page a || List.member a reads)) sp.vals)
                                    |> List.map (Tuple.first >> Addr.key)
                                    |> Expect.equal []
                    )
                    engines
                )
            , test "the_pad_strip_draws_each_pads_own_machine_icon" <|
                \_ ->
                    Page.view drum (Page.init Day)
                        |> Query.fromHtml
                        |> Query.find [ Sel.class "padstrip" ]
                        |> Query.findAll [ Sel.tag "chimera-screen" ]
                        |> Query.index 2
                        |> Query.has [ Sel.attribute (attribute "spec" "{\"engine\":\"DRUM\",\"page\":37,\"region\":\"padicon\",\"focus\":null,\"pad\":3,\"vals\":[[\"PAD3.MACHINE\",4]]}") ]
            , describe "VA's oscillators draw the VA page's WAVE morph gauge, with their SHAPE"
                (List.map
                    (\( title, cell, shape ) ->
                        test title <|
                            \_ ->
                                let
                                    va : Model.Model
                                    va =
                                        engines |> List.filter (\( n, _ ) -> n == "VA") |> List.head |> Maybe.map Tuple.second |> Maybe.withDefault model
                                in
                                Page.layout Unit.Va Kit
                                    |> .every
                                    |> List.filter (\md -> Shared.title md == title)
                                    |> List.filterMap Shared.screen
                                    |> List.filterMap (Page.screenSpec va Unit.Va >> Maybe.andThen Screen.spec)
                                    |> List.map (\sp -> ( Encode.encode 0 (Screen.encodeSpec { sp | vals = [] }), List.member shape (List.map (Tuple.first >> Addr.key) sp.vals) ))
                                    |> Expect.equal [ ( "{\"engine\":\"VA\",\"page\":0,\"region\":\"gauge\",\"focus\":" ++ cell ++ ",\"pad\":null,\"vals\":[]}", True ) ]
                    )
                    [ ( "OSC 1", "0", "VA.SHAPE1" ), ( "OSC 2", "1", "VA.SHAPE2" ) ]
                )
            , test "a_kit_screen_draws_for_its_own_pad" <|
                \_ ->
                    Page.screenSpec drum Unit.Drum (Shared.strip (PadDrawn Pad.Pad7 PadKit))
                        |> Maybe.andThen Screen.spec
                        |> Maybe.andThen .pad
                        |> Expect.equal (Just Pad.Pad7)
            ]
        , describe "the Part's mod matrix"
            (let
                -- ALGO's matrix as firmware 0.4 describes it (`ed describe
                -- MTX-ALGO 0`, console/ed/route.rs), cut to two sources,
                -- and a `since` whose ROUTES section holds two routes.
                routed : Model.Model
                routed =
                    connectedWith
                        [ "page 0 MTX of 1"
                        , "src LFO1 \"LFO1\""
                        , "src ENV2 \"ENV2\""
                        , "src OP5 \"OP5\""
                        , "col FREQ FILTER.CUTOFF"
                        , "col Q FILTER.RESO"
                        , "amount -127 127"
                        , "dests 16"
                        , "OK"
                        ]
                        FixtureData.lines
                        "ALGO"
                        |> feed [ "routes 1", "route LFO1:FILTER.CUTOFF 64 \"+64\"", "route ENV2:OP_C.CRSE -127 \"-127\"", "OK 2" ]

                bay : Query.Single Page.Msg
                bay =
                    Page.view routed (Page.init Day) |> Query.fromHtml |> Query.find [ Sel.class "bay" ]
             in
             [ test "the_units_routes_are_drawn_as_cables" <|
                \_ ->
                    bay
                        |> Expect.all
                            [ Query.findAll [ Sel.class "att" ] >> Query.count (Expect.equal 2)
                            , Query.find [ Sel.class "att", Sel.class "adds" ] >> Query.has [ Sel.text "+50" ]
                            , Query.find [ Sel.class "att", Sel.class "subtracts" ] >> Query.has [ Sel.text "-100" ]
                            ]
             , test "its_jacks_are_the_matrix_sources_and_the_routed_destinations" <|
                \_ ->
                    bay
                        |> Expect.all
                            [ Query.find [ Sel.class "srcs" ] >> Query.has [ Sel.text "LFO1", Sel.text "ENV2", Sel.text "OP5" ]
                            , Query.find [ Sel.class "dsts" ] >> Query.has [ Sel.text "FREQ", Sel.text "Q", Sel.text "OP_C.CRSE" ]
                            ]
             , test "no_note_says_the_unit_doesnt_describe_it" <|
                \_ ->
                    Page.view routed (Page.init Day) |> Query.fromHtml |> Query.hasNot [ Sel.text "THE UNIT DOESN'T DESCRIBE ITS MOD MATRIX YET" ]
             , test "dragging_a_cables_attenuverter_sets_its_amount" <|
                \_ ->
                    live
                        [ BayMsg PartBay (PatchBay.Hand (Control.Grab lfoCell Control.Attenuverter 300))
                        , BayMsg PartBay (PatchBay.Hand (Control.Moved 276))
                        , Frame
                        ]
                        routed
                        |> Tuple.second
                        |> Expect.equal (routeTo "LFO1:FILTER.CUTOFF" (boxAt (normOfBox 64 + 24 / 240)))
             , test "notches_on_an_attenuverter_accumulate_from_the_pending_amount" <|
                \_ ->
                    let
                        ( unit, asks ) =
                            live
                                [ BayMsg PartBay (PatchBay.Hand (Control.Step lfoCell Up))
                                , Frame
                                , BayMsg PartBay (PatchBay.Hand (Control.Step lfoCell Up))
                                , Frame
                                ]
                                routed

                        once : Int
                        once =
                            boxAt (normOfBox 64 + 1 / 64)

                        twice : Int
                        twice =
                            boxAt (normOfBox once + 1 / 64)
                    in
                    Expect.all
                        [ \_ -> Expect.equal (routeTo "LFO1:FILTER.CUTOFF" once ++ routeTo "LFO1:FILTER.CUTOFF" twice) asks
                        , \_ ->
                            Expect.equal
                                (Protocol.cell "LFO1:FILTER.CUTOFF" |> Maybe.andThen (\c -> Model.pendingRoute c unit))
                                (Protocol.amount twice |> Maybe.map Protocol.RouteAmount)
                        ]
                        ()
             , test "patching_sends_the_route_and_unpatching_removes_it" <|
                \_ ->
                    case ( Protocol.cell "ENV2:FILTER.RESO", Protocol.cell "LFO1:FILTER.CUTOFF", Protocol.amount 64 ) of
                        ( Just new, Just old, Just half ) ->
                            Expect.all
                                [ \_ ->
                                    patchOn routed "ENV2" "Q"
                                        |> Expect.equal [ Model.EditRoute new (Protocol.RouteAmount half) ]
                                , \_ ->
                                    unpatchOn routed "LFO1" "FREQ"
                                        |> Expect.equal [ Model.EditRoute old Protocol.RouteOff ]
                                ]
                                ()

                        _ ->
                            Expect.fail "no cell"
             ]
            )
        , describe "the MIXER"
            (let
                mixed : Model.Model
                mixed =
                    model |> feed [ "mixer", "val PART1.LEVEL 0.5 0.5 \"50\"", "val PART1.PAN 0.5 0 \"C\"", "OK 2" ]

                onMixer : Page.State
                onMixer =
                    Page.update (Show Page.MixerScreen) mixed (Page.init Day) |> (\( st, _, _ ) -> st)

                level : Addr
                level =
                    addr "PART1.LEVEL"
             in
             [ test "the_unit_tab_row_has_mixer_when_the_unit_describes_it" <|
                \_ ->
                    Page.view mixed (Page.init Day)
                        |> Query.fromHtml
                        |> Query.findAll [ Sel.class "tab", Sel.containing [ Sel.text "MIXER" ] ]
                        |> Query.count (Expect.equal 1)
             , test "no_mixer_tab_without_its_description" <|
                \_ ->
                    Page.view { mixed | mixer = Schema.empty } (Page.init Day)
                        |> Query.fromHtml
                        |> Query.findAll [ Sel.class "tab", Sel.containing [ Sel.text "MIXER" ] ]
                        |> Query.count (Expect.equal 0)
             , test "the_mixer_is_a_desk_a_strip_a_part_and_out" <|
                \_ ->
                    Page.view mixed onMixer
                        |> Query.fromHtml
                        |> Expect.all
                            [ Query.find [ Sel.tag "h1" ] >> Query.has [ Sel.text "MIXER" ]
                            , Query.findAll [ Sel.class "strip" ] >> Query.count (Expect.equal 7)
                            , Query.find [ Sel.attribute (attribute "data-strip" "PART3") ] >> Query.findAll [ Sel.attribute (attribute "data-addr" "PART3.LEVEL"), Sel.attribute (attribute "role" "slider") ] >> Query.count (Expect.equal 1)
                            , Query.find [ Sel.attribute (attribute "data-strip" "PART3") ] >> Query.findAll [ Sel.class "send" ] >> Query.count (Expect.equal 3)
                            , Query.find [ Sel.attribute (attribute "data-strip" "OUT") ] >> Query.findAll [ Sel.attribute (attribute "data-addr" "COMP.VOL") ] >> Query.count (Expect.equal 1)
                            ]
             , test "the_effects_chain_is_a_tab_bar_its_first_open" <|
                \_ ->
                    Page.view mixed onMixer
                        |> Query.fromHtml
                        |> Expect.all
                            [ Query.findAll [ Sel.class "fxtab" ] >> Query.count (Expect.equal 4)
                            , Query.find [ Sel.class "fxtab", Sel.class "on" ] >> Query.has [ Sel.text "CHORUS" ]
                            , Query.find [ Sel.class "fxbar" ] >> Query.findAll [ Sel.attribute (attribute "data-addr" "CHORUS.RATE") ] >> Query.count (Expect.equal 1)
                            ]
             , test "a_tab_shows_that_effects_controls" <|
                \_ ->
                    Page.view mixed (Page.update (MixFx "DELAY") mixed onMixer |> (\( st, _, _ ) -> st))
                        |> Query.fromHtml
                        |> Query.find [ Sel.class "fxbar" ]
                        |> Expect.all
                            [ Query.findAll [ Sel.attribute (attribute "data-addr" "DELAY.FDBK") ] >> Query.count (Expect.equal 1)
                            , Query.findAll [ Sel.attribute (attribute "data-addr" "CHORUS.RATE") ] >> Query.count (Expect.equal 0)
                            ]
             , test "a_send_picks_its_effects_tab" <|
                \_ ->
                    Page.view mixed onMixer
                        |> Query.fromHtml
                        |> Query.find [ Sel.attribute (attribute "data-strip" "PART2") ]
                        |> Query.findAll [ Sel.class "send" ]
                        |> Query.index 2
                        |> Event.simulate Event.click
                        |> Event.expect (MixFx "REVERB")
             , test "its_values_are_the_units_from_since" <|
                \_ ->
                    Page.view mixed onMixer
                        |> Query.fromHtml
                        |> Query.find [ Sel.attribute (attribute "data-addr" "PART1.LEVEL"), Sel.attribute (attribute "role" "slider") ]
                        |> Query.has [ Sel.attribute (attribute "aria-valuetext" "50") ]
             , test "a_hand_on_a_mixer_control_sends_its_ed_set_through_the_window" <|
                \_ ->
                    let
                        ( unit, asks ) =
                            live [ Show Page.MixerScreen, Hand (Control.Step level Up), Frame ] mixed

                        lp : Schema.Param
                        lp =
                            Fixture.paramIn unit.mixer "PART1.LEVEL"

                        want : Float
                        want =
                            Control.nudged lp { from = 0.5, by = 1, wheel = Control.wheelNorm lp }
                    in
                    Expect.all
                        [ \_ -> Expect.equal [ Model.Edit level (Num want) ] asks
                        , \_ -> Expect.equal (Just (Num want)) (Model.pending level unit)
                        ]
                        ()
             , test "a_part_tab_goes_back_to_the_parts_engine" <|
                \_ ->
                    case Unit.partFromInt 1 of
                        Just p1 ->
                            Page.update (GoPart p1) mixed onMixer
                                |> (\( st, out, _ ) -> ( Page.view mixed st |> Query.fromHtml |> Query.find [ Sel.tag "h1" ] |> Query.has [ Sel.text "ALGO" ], out ))
                                |> (\( has, out ) -> Expect.all [ \_ -> has, \_ -> Expect.equal [ Model.FollowPart p1 ] out ] ())

                        Nothing ->
                            Expect.fail "no part 1"
             ]
            )
        , describe "the page"
            [ test "the_hero_cutoff_knob_grabs_with_the_hero_travel" <|
                \_ ->
                    Page.view model (Page.init Day)
                        |> Query.fromHtml
                        |> Query.find [ Sel.attribute (attribute "role" "slider"), Sel.attribute (attribute "aria-label" "FREQ") ]
                        |> Event.simulate (Event.custom "mousedown" (Encode.object [ ( "clientY", Encode.float 300 ) ]))
                        |> Event.expect (Hand (Control.Grab cutoff Hero 300))
            , test "a_part_tab_asks_the_box_to_follow_it" <|
                \_ ->
                    case Unit.partFromInt 3 of
                        Just p3 ->
                            Page.view model (Page.init Day)
                                |> Query.fromHtml
                                |> Query.find [ Sel.tag "button", Sel.containing [ Sel.text "P3" ] ]
                                |> Event.simulate Event.click
                                |> Event.expect (GoPart p3)

                        Nothing ->
                            Expect.fail "no part 3"
            , test "the_screens_are_the_units_pages_by_number" <|
                \_ ->
                    Page.screenSpec model Unit.Algo (Shared.tall Flt)
                        |> Maybe.andThen Screen.spec
                        |> Maybe.map (.page >> Protocol.pageNoToInt)
                        |> Expect.equal (Just 22)
            , test "the_algo_page_stays_in_params_order_whatever_the_units_algo_pages_setting" <|
                \_ ->
                    -- PERSONALIZE › ALGO PAGES (THEME.ALGO_FIRST) orders the
                    -- unit's own page walk; the editor's is PARAMS first by design.
                    let
                        opsFirst : Model.Model
                        opsFirst =
                            feed [ "settings", "val THEME.ALGO_FIRST 1 1 \"OPS\"", "OK 2" ] model
                    in
                    Expect.all
                        [ \_ -> Expect.equal (Just [ "PARAMS", "OPS" ]) (Schema.param (addr "THEME.ALGO_FIRST") opsFirst.settings |> Maybe.map (.options >> List.map Tuple.second))
                        , \_ -> Expect.equal (Just "OPS") (Model.shown (addr "THEME.ALGO_FIRST") opsFirst |> Maybe.map .text)
                        , \_ ->
                            Page.view opsFirst (Page.init Day)
                                |> Query.fromHtml
                                |> Query.findAll [ Sel.tag "h2" ]
                                |> Expect.all
                                    [ Query.index 0 >> Query.has [ Sel.text "ALGORITHM" ]
                                    , Query.index 1 >> Query.has [ Sel.text "PITCH" ]
                                    , Query.index 2 >> Query.has [ Sel.text "OP 1" ]
                                    ]
                        ]
                        ()
            , test "before_following_it_offers_the_links" <|
                \_ ->
                    Page.view Model.init (Page.init Night)
                        |> Query.fromHtml
                        |> Query.find [ Sel.tag "button", Sel.containing [ Sel.text "CONNECT SIMULATOR" ] ]
                        |> Event.simulate Event.click
                        |> Event.expect (Unit (Model.Connect Model.ViaSimulator))
            , test "the_schema_is_all_on_the_page_nothing_in_other" <|
                \_ ->
                    Page.view model (Page.init Day)
                        |> Query.fromHtml
                        |> Query.findAll [ Sel.tag "h2", Sel.containing [ Sel.text "OTHER" ] ]
                        |> Query.count (Expect.equal 0)
            ]
        , test "tapes_source_is_printed_read_only" <|
            \_ ->
                Page.view (connected FixtureData.tape "TAPE" |> feed [ "source CHOIR", "panel MACHINE WALK", "OK 1" ]) (Page.init Day)
                    |> Query.fromHtml
                    |> Query.has [ Sel.text "CHOIR" ]
        , test "a_module_with_nothing_for_this_type_says_so" <|
            \_ ->
                Page.view (connected FixtureData.modal "MODAL" |> feed [ "panel RESONATOR BOWED", "OK 1" ]) (Page.init Day)
                    |> Query.fromHtml
                    |> Query.has [ Sel.text "NOTHING TO SET FOR THIS TYPE" ]
        , describe "DRUM"
            [ test "the_pad_strip_opens_a_pads_view" <|
                \_ ->
                    let
                        ( s, _, _ ) =
                            Page.update (PadMsg (PadStrip.Select (PadTab Pad.Pad5))) drum (Page.init Day)
                    in
                    Page.view drum s
                        |> Query.fromHtml
                        |> Query.findAll [ Sel.attribute (attribute "aria-label" "LEVEL") ]
                        |> Query.count (Expect.equal 1)
            , test "the_kit_view_shows_every_pads_level" <|
                \_ ->
                    Page.view drum (Page.init Day)
                        |> Query.fromHtml
                        |> Query.findAll [ Sel.attribute (attribute "role" "slider"), Sel.attribute (attribute "aria-label" "LEVEL") ]
                        |> Query.count (Expect.equal 12)
            , test "a_patched_route_is_a_cable" <|
                \_ ->
                    Page.view drum (onPad Pad.Pad1)
                        |> Query.fromHtml
                        |> Query.findAll [ Sel.attribute (attribute "aria-label" "LFO to RESO") ]
                        |> Query.count (Expect.equal 1)
            , test "patching_takes_the_first_free_route" <|
                \_ ->
                    runOn drum [ BayMsg (PadBay Pad.Pad1) (PatchBay.Connect (Routes.source ( opt 2, "VEL" )) (Routes.dest ( opt 2, "VOLUME" ))), Frame ]
                        |> Expect.equal
                            (Model.Edit (addr "PAD1_RT2.AMOUNT") (Num (Control.atNorm (Fixture.paramIn drumSchema "PAD1_RT2.AMOUNT") 0.75))
                                :: pick "PAD1_RT2.DEST" 2
                                ++ pick "PAD1_RT2.SOURCE" 2
                            )
            , test "unpatching_sets_the_amount_to_nothing" <|
                \_ ->
                    runOn drum [ BayMsg (PadBay Pad.Pad1) (PatchBay.Unpatch (Routes.source ( opt 1, "LFO" )) (Routes.dest ( opt 1, "RESO" ))), Frame ]
                        |> Expect.equal [ Model.Edit (addr "PAD1_RT1.AMOUNT") (Num 0) ]
            , test "a_cables_attenuverter_turns_its_amount" <|
                \_ ->
                    runOn drum [ BayMsg (PadBay Pad.Pad1) (PatchBay.Hand (Control.Grab (addr "PAD1_RT1.AMOUNT") Attenuverter 300)), Hand (Control.Moved 276), Frame ]
                        |> Expect.equal [ Model.Edit (addr "PAD1_RT1.AMOUNT") (Num (Control.atNorm (Fixture.paramIn drumSchema "PAD1_RT1.AMOUNT") 0.85)) ]
            ]
        , test "the_folds_and_chips_are_the_pages_own" <|
            \_ ->
                Page.update (PageMsg (Ui.Page.ToggleChip Chip.Mod)) model (Page.init Day)
                    |> (\( _, out, _ ) -> out)
                    |> Expect.equal []
        , test "the_theme_switch_is_stored" <|
            \_ ->
                Page.update (PageMsg (Ui.Page.ChoseTheme Night)) model (Page.init Day)
                    |> (\( _, _, store ) -> store)
                    |> Expect.equal (Just Night)
        , test "values_of_another_part_are_not_shown" <|
            \_ ->
                Dict.size model.values |> Expect.equal 2
        ]


{-| The box on Part 2, the same engine: a new seat.
-}
elsewhere : Model.Model
elsewhere =
    model |> feed [ "part 2 ALGO", "val FILTER.CUTOFF 0.5 632.4555 \"632 Hz\"", "OK 2" ]


algorithmModule : Shared.Module
algorithmModule =
    Layout.Algo.modules |> List.filter (\md -> Shared.title md == "ALGORITHM") |> List.head |> Maybe.withDefault Shared.mod


engineOf : String -> Unit.Engine
engineOf name =
    Unit.engineFromName name |> Maybe.withDefault Unit.Algo


{-| Whether `a` is on page `n`, or picks a variant of a panel there.
-}
onPage : Model.Model -> Protocol.PageNo -> Addr -> Bool
onPage unit n a =
    List.member a (Schema.pageAddresses n unit.schema)
        || (Schema.pages unit.schema
                |> List.filter (\pg -> pg.n == n)
                |> List.concatMap .panels
                |> List.filterMap (.name >> Layout.Page.variantSelector)
                |> List.member a
           )


drumSchema : Schema.Schema
drumSchema =
    Fixture.schemaFor Unit.Drum


{-| DRUM followed: pad 1's route 1 patched LFO to RESO at +64 (norm 0.75).
-}
drum : Model.Model
drum =
    connected FixtureData.drum "DRUM"
        |> feed
            [ "val PAD1_RT1.SOURCE 0.2 1 \"LFO\""
            , "val PAD1_RT1.DEST 0.25 1 \"RESO\""
            , "val PAD1_RT1.AMOUNT 0.75 63.5 \"+64\""
            , "val PAD1_RT2.AMOUNT 0.5 0 \"0\""
            , "val PAD3.MACHINE 0.2 4 \"TONE CLAP\""
            , "OK 1"
            ]


onPad : Pad.Pad -> Page.State
onPad p =
    Page.update (PadMsg (PadStrip.Select (PadTab p))) drum (Page.init Day) |> (\( s, _, _ ) -> s)


{-| A hand on item `i`: a choice picks its last option; a value drags up 30
pixels at the knob's travel.
-}
hands : Shared.Item -> List Page.Msg
hands i =
    case List.reverse i.param.options of
        ( o, _ ) :: _ ->
            [ Hand (Control.Pick i.param.addr o), Frame ]

        [] ->
            [ Hand (Control.Grab i.param.addr Knob 300), Hand (Control.Moved 270), Frame ]


expected : Model.Model -> Shared.Item -> List Model.Msg
expected unit i =
    case List.reverse i.param.options of
        ( o, _ ) :: _ ->
            [ Model.Pick i.param.addr o ]

        [] ->
            [ Model.Edit i.param.addr (Num (Control.atNorm i.param ((Model.shown i.param.addr unit |> Maybe.map .norm |> Maybe.withDefault 0) + 30 / 150))) ]
