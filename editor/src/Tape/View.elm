-- SPDX-License-Identifier: GPL-3.0-or-later


module Tape.View exposing (kib, rootName, view)

{-| TAPE import's page: a WAV dropped or chosen, the choices for the
source, the source as the unit will hold it (size, where it plays from,
the room left), its preview, and its copy onto the card.
-}

import Html exposing (Html, button, div, input, label, option, p, select, span, text)
import Html.Attributes exposing (attribute, class, disabled, id, maxlength, selected, style, type_, value)
import Html.Events exposing (onClick, onInput)
import Tape.Reply as Reply
import Tape.Report as Report exposing (Fit(..), LoadRefusal(..), Problem(..), Refusal, Shape(..), Source, Take)
import Tape.Settings as Settings exposing (Form(..), Settings, Top(..))
import Tape.Step as Step
import Tape.Types exposing (Console(..), Dropped(..), Failure(..), Hand(..), Held, Link(..), Model(..), Msg(..), Outcome(..), Playback(..), Send(..), Stage(..), Work(..))
import Ui.Chip as Chip
import Ui.Module as Module
import Ui.Page as Page


view : (Page.Msg -> msg) -> (Msg -> msg) -> Page.State -> Model -> Html msg
view pageMsg toMsg page (Model fields) =
    Page.view pageMsg
        page
        (Page.new "TAPE IMPORT"
            |> Page.meta (meta fields.stage)
            |> Page.link (Page.Linked "UNIT · TAPE IMPORT")
            |> Page.modules
                [ Module.new Chip.Unit "IMPORT"
                    |> Module.full
                    |> Module.body [ Html.map (Hand >> toMsg) (div [ class "upd tape", id "tape-drop" ] (body fields.link fields.console fields.stage)) ]
                ]
        )


meta : Stage -> String
meta stage =
    case stage of
        Opening ->
            "OPENING"

        Empty _ ->
            "DROP A WAV"

        Reading _ ->
            "READING"

        Holding held ->
            case held.work of
                Unmade ->
                    "CHOOSE"

                Making _ ->
                    "CONVERTING"

                Made _ _ ->
                    "READY TO SEND"

                Unmakeable _ ->
                    "CAN'T MAKE IT"

                Sending _ _ ->
                    "COPYING"

                Sent _ Landed ->
                    "ON THE CARD"

                Sent _ AlreadyThere ->
                    "ON THE CARD"

                Sent _ (Failed _) ->
                    "NOT COPIED"

        Closing ->
            "CLOSING"


fact : String -> String -> Html msg
fact key shown =
    div [ class "uline" ] [ span [ class "k" ] [ text key ], span [ class "v" ] [ text shown ] ]


btn : String -> Hand -> Html Hand
btn caption msg =
    button [ class "hbtn", onClick msg ] [ text caption ]


btnIf : Bool -> String -> Hand -> Html Hand
btnIf enabled caption msg =
    button [ class "hbtn", onClick msg, disabled (not enabled) ] [ text caption ]


buttons : List (Html Hand) -> Html Hand
buttons =
    div [ class "connect" ]


say : String -> Html msg
say line =
    p [] [ text line ]


{-| A pick among a few: each a button, the chosen one pressed.
-}
picks : String -> List ( String, Hand, Bool ) -> Html Hand
picks key options =
    div [ class "uline" ]
        [ span [ class "k" ] [ text key ]
        , div [ class "tpicks" ]
            (List.map
                (\( caption, msg, chosen ) ->
                    button
                        [ class "hbtn"
                        , onClick msg
                        , attribute "aria-pressed"
                            (if chosen then
                                "true"

                             else
                                "false"
                            )
                        ]
                        [ text caption ]
                )
                options
            )
        ]


field : String -> String -> String -> (String -> Hand) -> List (Html.Attribute Hand) -> Html Hand
field key name typed toMsg extra =
    label [ class "uline" ]
        [ span [ class "k" ] [ text key ]
        , input ([ type_ "text", class "tfield", attribute "data-tape" name, value typed, onInput toMsg ] ++ extra) []
        ]


body : Link -> Console -> Stage -> List (Html Hand)
body link console stage =
    case stage of
        Opening ->
            [ say "Getting ready…" ]

        Empty Fresh ->
            [ say "Drop a WAV on this page, or choose one: 16- or 24-bit, mono or stereo (folded to mono), at any common rate. The editor makes it a TAPE source here, with the firmware's own converter, and copies it onto the unit's card over USB, ready to pick on TAPE's SOURCE."
            , buttons [ btn "CHOOSE A WAV" Choose, btn "CLOSE" Close ]
            ]

        Empty (Unread file refusal) ->
            [ fact "FILE" file
            , say (problemText refusal)
            , buttons [ btn "CHOOSE ANOTHER WAV" Choose, btn "CLOSE" Close ]
            ]

        Reading file ->
            [ fact "FILE" file, say "Reading the WAV…" ]

        Holding held ->
            takeFacts held.take :: choices held ++ work link console held

        Closing ->
            [ say "Closing…" ]


takeFacts : Take -> Html msg
takeFacts take =
    div []
        [ fact "FILE" take.file
        , fact "TAKE" (hz take.rate ++ " · " ++ Settings.seconds take.frames take.rate ++ " s")
        ]


hz : Int -> String
hz rate =
    if modBy 1000 rate == 0 then
        String.fromInt (rate // 1000) ++ " kHz"

    else
        String.fromFloat (toFloat rate / 1000) ++ " kHz"


{-| The choices: kind, its rate or its frames, start and end, name. Locked while a copy runs.
-}
choices : Held -> List (Html Hand)
choices held =
    let
        settings : Settings
        settings =
            held.settings

        shapeIs : Shape -> Bool
        shapeIs wanted =
            case ( settings.form, wanted ) of
                ( Sample, Plain ) ->
                    True

                ( Wavetable _, Transwave ) ->
                    True

                ( Sample, Transwave ) ->
                    False

                ( Wavetable _, Plain ) ->
                    False

        kind : Html Hand
        kind =
            picks "KIND" [ ( "SAMPLE", SetShape Plain, shapeIs Plain ), ( "WAVETABLE", SetShape Transwave, shapeIs Transwave ) ]

        form : List (Html Hand)
        form =
            case settings.form of
                Sample ->
                    [ picks "RATE" (List.map (\rate -> ( Settings.rateLabel rate, SetRate rate, rate == settings.rate )) Settings.allRates)
                    , say ("At " ++ Settings.rateLabel settings.rate ++ " a source holds up to about " ++ String.fromInt (floor (Settings.maxSeconds 1048576 settings.rate)) ++ " s: a lower rate holds longer, and sounds darker (S950-style).")
                    ]

                Wavetable table ->
                    [ say "A wavetable for the WAVE machine: the WAV cut into single-cycle frames of CYCLE samples each (from across the take when it holds more), each frame band-limited at every octave."
                    , field "CYCLE" "cycle" table.cycle SetCycle [ maxlength 5 ]
                    , label [ class "uline" ]
                        [ span [ class "k" ] [ text "FRAMES" ]
                        , select [ class "tfield", attribute "data-tape" "frames", onInput SetFrames ]
                            (List.map
                                (\frames -> option [ value (String.fromInt frames), selected (frames == table.frames) ] [ text (String.fromInt frames) ])
                                (List.range 1 32)
                            )
                        ]
                    , picks "TOP" [ ( "512", SetTop Top512, table.top == Top512 ), ( "1024", SetTop Top1024, table.top == Top1024 ) ]
                    ]

        issue : List (Html Hand)
        issue =
            case Settings.args held.take settings of
                Ok _ ->
                    []

                Err why ->
                    [ p [ class "tissue" ] [ text why ] ]
    in
    case held.work of
        Sending _ _ ->
            []

        Unmade ->
            kind
                :: form
                ++ [ field "START (S)" "start" settings.start SetStart [ maxlength 10 ]
                   , field "END (S)" "end" settings.end SetEnd [ maxlength 10 ]
                   , field "NAME" "name" settings.name SetName [ maxlength 16 ]
                   ]
                ++ issue

        Making _ ->
            kind
                :: form
                ++ [ field "START (S)" "start" settings.start SetStart [ maxlength 10 ]
                   , field "END (S)" "end" settings.end SetEnd [ maxlength 10 ]
                   , field "NAME" "name" settings.name SetName [ maxlength 16 ]
                   ]
                ++ issue

        Made _ _ ->
            kind
                :: form
                ++ [ field "START (S)" "start" settings.start SetStart [ maxlength 10 ]
                   , field "END (S)" "end" settings.end SetEnd [ maxlength 10 ]
                   , field "NAME" "name" settings.name SetName [ maxlength 16 ]
                   ]
                ++ issue

        Unmakeable _ ->
            kind
                :: form
                ++ [ field "START (S)" "start" settings.start SetStart [ maxlength 10 ]
                   , field "END (S)" "end" settings.end SetEnd [ maxlength 10 ]
                   , field "NAME" "name" settings.name SetName [ maxlength 16 ]
                   ]
                ++ issue

        Sent _ _ ->
            kind
                :: form
                ++ [ field "START (S)" "start" settings.start SetStart [ maxlength 10 ]
                   , field "END (S)" "end" settings.end SetEnd [ maxlength 10 ]
                   , field "NAME" "name" settings.name SetName [ maxlength 16 ]
                   ]
                ++ issue


work : Link -> Console -> Held -> List (Html Hand)
work link console held =
    let
        canMake : Bool
        canMake =
            case Settings.args held.take held.settings of
                Ok _ ->
                    True

                Err _ ->
                    False

        another : Html Hand
        another =
            btn "CHOOSE ANOTHER WAV" Choose

        unlinked : List (Html Hand)
        unlinked =
            case ( link, console ) of
                ( Unlinked, _ ) ->
                    [ say "Connect a unit to send it: the editor's link is closed." ]

                ( Linked, Draining _ ) ->
                    [ say "Waiting for the unit to finish the stopped copy…" ]

                ( Linked, Idle ) ->
                    []

        sendButton : String -> Html Hand
        sendButton caption =
            btnIf (link == Linked && console == Idle) caption SendIt
    in
    case held.work of
        Unmade ->
            [ buttons [ btnIf canMake "MAKE THE SOURCE" Make, another, btn "CLOSE" Close ] ]

        Making _ ->
            [ say "Converting…" ]

        Unmakeable refusal ->
            [ p [ class "tissue" ] [ text (problemText refusal) ], buttons [ btnIf canMake "MAKE THE SOURCE" Make, another, btn "CLOSE" Close ] ]

        Made source playback ->
            sourceFacts source
                ++ unlinked
                ++ [ buttons
                        [ case playback of
                            Silent ->
                                btn "PLAY" Play

                            Playing ->
                                btn "STOP" Stop
                        , sendButton "SEND TO THE UNIT"
                        , another
                        , btn "CLOSE" Close
                        ]
                   ]

        Sending source send ->
            sourceFacts source ++ copying source send

        Sent source outcome ->
            sourceFacts source
                ++ (case outcome of
                        Landed ->
                            [ say ("On the card as " ++ Report.remotePath source.stem ++ ". Pick it on TAPE's SOURCE."), buttons [ another, btn "CLOSE" Close ] ]

                        AlreadyThere ->
                            [ say ("The same audio was already on the card (" ++ Report.remotePath source.stem ++ "): nothing was copied. Pick it on TAPE's SOURCE."), buttons [ another, btn "CLOSE" Close ] ]

                        Failed failure ->
                            p [ class "tissue" ] [ text ("Not copied: " ++ failureText failure ++ ". Nothing half-written stays on the card.") ]
                                :: unlinked
                                ++ [ buttons [ sendButton "SEND AGAIN", another, btn "CLOSE" Close ] ]
                   )


copying : Source -> Send -> List (Html msg)
copying source send =
    let
        done : Int
        done =
            case send of
                Asking ->
                    0

                Chunk index ->
                    index * Step.chunkBytes

                Sealing ->
                    source.bytes

        words : String
        words =
            case send of
                Asking ->
                    "Asking the unit…"

                Chunk index ->
                    "Copying part " ++ String.fromInt (index + 1) ++ " of " ++ String.fromInt (Step.chunks source.bytes) ++ "…"

                Sealing ->
                    "The unit is reading it back and sealing it…"

        percent : Int
        percent =
            done * 100 // max 1 source.bytes
    in
    [ say words
    , div [ class "ubar" ] [ div [ style "width" (String.fromInt percent ++ "%") ] [] ]
    ]


sourceFacts : Source -> List (Html msg)
sourceFacts source =
    [ fact "NAME" source.name
    , fact "FILE" (Report.remotePath source.stem)
    , fact "SIZE" (kib source.bytes ++ " of the " ++ kib source.limit ++ " a copy takes")
    , fact "SOURCE"
        (case source.shape of
            Plain ->
                Settings.seconds source.frames source.rate ++ " s at " ++ hz source.rate ++ " · 12-BIT"

            Transwave ->
                String.fromInt source.count ++ " FRAMES · WAVETABLE · 12-BIT"
        )
    , fact "ROOT"
        (case ( source.shape, source.period ) of
            ( Transwave, _ ) ->
                "THE NOTE'S"

            ( Plain, 0 ) ->
                rootName source.root ++ " · UNPITCHED"

            ( Plain, _ ) ->
                rootName source.root
        )
    , fact "MEMORY" (memory source)
    ]


{-| Where it plays from in a project of NEW, and the room it leaves.
-}
memory : Source -> String
memory source =
    case source.fit of
        Whole ->
            "FITS IN MEMORY: " ++ kib source.cost ++ " of the " ++ kib source.free ++ " a project of NEW leaves · " ++ kib (source.free - source.cost) ++ " left"

        Streams ->
            "STREAMS FROM THE CARD: " ++ kib source.cost ++ ", past the " ++ kib source.free ++ " a project of NEW leaves in memory. PLAY, TRON and REEL stream it; KIT, SCRUB, STRETCH and WAVE need it in memory."

        WontLoad why ->
            "WON'T LOAD: " ++ kib source.cost ++ ", past the " ++ kib source.free ++ " a project of NEW leaves in memory, " ++ loadRefusalText why


loadRefusalText : LoadRefusal -> String
loadRefusalText why =
    case why of
        NeedsRam ->
            "and a neutral TAPE Sound plays it a way that needs it in memory."

        WavetableTooBig ->
            "and a wavetable doesn't stream. Fewer frames, or TOP 512, make it smaller."

        ZoneSetTooBig ->
            "and a zone set doesn't stream."

        TooShortToStream ->
            "and too short past START to stream."

        BankClosed ->
            "and streaming needs bank 2 open."


kib : Int -> String
kib bytes =
    let
        tenths : Int
        tenths =
            round (toFloat bytes * 10 / 1024)
    in
    String.fromInt (tenths // 10) ++ "." ++ String.fromInt (modBy 10 tenths) ++ " KiB"


{-| MIDI cents as the nearest note and the cents off it: `A4`, `A#2 +12`.
-}
rootName : Int -> String
rootName cents =
    let
        note : Int
        note =
            (cents + 50) // 100

        off : Int
        off =
            cents - note * 100

        names : List String
        names =
            [ "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" ]

        letter : String
        letter =
            List.drop (modBy 12 note) names |> List.head |> Maybe.withDefault "C"

        offText : String
        offText =
            if off > 0 then
                " +" ++ String.fromInt off

            else if off < 0 then
                " " ++ String.fromInt off

            else
                ""
    in
    letter ++ String.fromInt (note // 12 - 1) ++ offText


problemText : Refusal -> String
problemText refusal =
    let
        said : String
        said =
            case refusal.problem of
                NotWav ->
                    "Not a WAV the editor reads: it takes PCM (8 to 32-bit) or 32-bit float WAVs."

                BadRate ->
                    "Its sample rate is outside 1 kHz to 768 kHz: not audio the editor reads."

                NotAudio ->
                    "Its samples aren't audio (NaN, infinite or far past full scale)."

                WavTooBig ->
                    "Too big: the editor reads WAVs up to 64 MiB (about 6 minutes of 44.1 kHz stereo)."

                NoSound ->
                    "Nothing to hear: it is empty or silent."

                TooShort ->
                    "Too short to play at this rate: keep more of the take, or a higher rate."

                Resample ->
                    "It can't be converted from its rate."

                NoCycles ->
                    "Not one whole cycle of that length fits in the take: a shorter CYCLE, or more of the take."

                TooBig ->
                    "Too big for one copy (the unit takes up to 1 MiB): a lower rate, a shorter piece, or fewer frames."

                BadArgs ->
                    "The choices weren't taken."

                BadRange ->
                    "START and END aren't inside the take."

                NoWav ->
                    "No WAV is held: choose it again."

                BadText ->
                    "The file's name or the choices aren't text it reads."

                Unwritten ->
                    "The source didn't come out whole."

                WavetableTooLong ->
                    "A wavetable is cut from a minute of the take at most: a shorter piece (START and END)."

                Trapped ->
                    "The converter stopped on this file: it is damaged, or not a WAV."

                UnknownStatus status ->
                    "The converter said something this editor doesn't know (status " ++ String.fromInt status ++ ")."
    in
    if refusal.detail == "" then
        said

    else
        said ++ " (" ++ refusal.detail ++ ")"


failureText : Failure -> String
failureText failure =
    case failure of
        UnitRefused error ->
            Reply.sayError error

        UnitBusy ->
            "the unit was busy with its card; try again in a moment"

        NoAnswer ->
            "the unit didn't answer in time"

        LinkGone ->
            "the link to the unit closed"

        OutOfTurn line ->
            "the unit said something out of turn (" ++ line ++ ")"
