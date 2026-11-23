-- SPDX-License-Identifier: GPL-3.0-or-later


port module Contract exposing (main)

{-| The editor's own reading of what the unit says, for e2e/contract.mjs:
each line through `Protocol.parse`, and each schema's describe text through
`Schema.add`. Built without --optimize: `Debug.toString` names what a line
parsed as.
-}

import Addr
import Protocol exposing (Line(..))
import Schema


port lines : ({ kind : String, lines : List String } -> msg) -> Sub msg


port read : { kind : String, parsed : List String, addresses : List String, pages : Int } -> Cmd msg


main : Program () () { kind : String, lines : List String }
main =
    Platform.worker
        { init = \_ -> ( (), Cmd.none )
        , update = \m _ -> ( (), read (reading m) )
        , subscriptions = \_ -> lines identity
        }


reading : { kind : String, lines : List String } -> { kind : String, parsed : List String, addresses : List String, pages : Int }
reading m =
    let
        parsed : List Line
        parsed =
            List.map Protocol.parse m.lines

        schema : Schema.Schema
        schema =
            List.foldl
                (\l s ->
                    case l of
                        Answer a ->
                            Schema.add a s

                        _ ->
                            s
                )
                Schema.empty
                parsed
    in
    { kind = m.kind
    , parsed = List.map Debug.toString parsed
    , addresses = List.map Addr.key (Schema.addresses schema)
    , pages = Schema.pageCount schema |> Maybe.withDefault 0
    }
