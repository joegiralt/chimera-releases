-- SPDX-License-Identifier: GPL-3.0-or-later


module Tape.Wire exposing (decode, encode)

{-| TAPE import's requests to `tape.js` as JSON, and its answers read back
strictly: `tape.wasm`'s reports are parsed here (`Tape.Report`), the
unit's lines too (`Tape.Reply`), and anything else is `Garbled`.
-}

import Json.Decode as D exposing (Decoder)
import Json.Encode as E
import Tape.Reply as Reply
import Tape.Report as Report exposing (Problem(..), Refusal)
import Tape.Settings as Settings
import Tape.Types exposing (Event(..), Js(..))


{-| A request to `tape.js` as JSON.
-}
encode : Js -> E.Value
encode request =
    let
        op : String -> List ( String, E.Value ) -> E.Value
        op name rest =
            E.object (( "op", E.string name ) :: rest)
    in
    case request of
        Begin ->
            op "begin" []

        ChooseFile ->
            op "choose" []

        ReadFile ->
            op "read" []

        Convert number made ->
            op "convert"
                [ ( "id", E.int number )
                , ( "args", E.list E.string (Settings.argsLines made) )
                , ( "from", E.int (Settings.argsFrom made) )
                , ( "to", E.int (Settings.argsTo made) )
                ]

        StartPlay ->
            op "play" []

        StopPlay ->
            op "stop" []

        SendLine line ->
            op "line" [ ( "line", E.string line ) ]

        SendChunk index ->
            op "chunk" [ ( "index", E.int index ) ]

        End ->
            op "end" []


decode : D.Value -> Event
decode value =
    case D.decodeValue (D.field "op" D.string |> D.andThen event) value of
        Ok decoded ->
            decoded

        Err error ->
            Garbled (D.errorToString error)


event : String -> Decoder Event
event op =
    case op of
        "begun" ->
            D.map Begun (D.field "open" D.bool)

        "picked" ->
            D.map Picked (D.field "file" D.string)

        "cancelled" ->
            D.succeed PickCancelled

        "loaded" ->
            D.field "file" D.string
                |> D.andThen
                    (\file ->
                        D.map (Loaded file) (answer (Report.parseTake file))
                    )

        "converted" ->
            D.map2 Converted (D.field "id" D.int) (answer Report.parseSource)

        "played" ->
            D.succeed PlayEnded

        "line" ->
            D.map (Reply.parse >> Line) (D.field "line" D.string)

        "lost" ->
            D.succeed LinkLost

        "ended" ->
            D.map Ended (D.field "link" D.string)

        other ->
            D.fail ("no such op: " ++ other)


{-| A status and its report: the report parsed on 0, else the status a
`Problem` and the report its detail; `trapped` when the module stopped.
-}
answer : (String -> Result String parsed) -> Decoder (Result Refusal parsed)
answer parse =
    D.oneOf
        [ D.field "trapped" D.string |> D.map (\detail -> Err { problem = Trapped, detail = detail })
        , D.map2
            (\status report ->
                if status == 0 then
                    parse report |> Result.mapError (\why -> { problem = UnknownStatus 0, detail = "a report it can't read: " ++ why })

                else
                    Err { problem = Report.problemOf status, detail = report }
            )
            (D.field "status" D.int)
            (D.field "report" D.string)
        ]
