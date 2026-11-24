-- SPDX-License-Identifier: GPL-3.0-or-later


port module Cache exposing (Recalled, decode, got, keep, recall)

{-| The editor's schema cache: IndexedDB through `ports.js`, keyed by the
protocol, the schema and its hash. A miss, or any failure of
the browser's store, answers `Nothing`: the editor describes the schema
again. What comes back is JavaScript's, so it is decoded here, strictly:
lines that are not a list of strings are a miss, and an answer with no key
is no answer (`decode` says `Nothing`), which the model takes as a miss too.
-}

import Json.Decode as Decode exposing (Decoder)


type alias Recalled =
    { key : String, lines : Maybe (List String) }


port recall : String -> Cmd msg


port keep : { key : String, lines : List String } -> Cmd msg


port got : (Decode.Value -> msg) -> Sub msg


decode : Decode.Value -> Maybe Recalled
decode v =
    Decode.decodeValue answer v |> Result.toMaybe


answer : Decoder Recalled
answer =
    Decode.map2 Recalled
        (Decode.field "key" Decode.string)
        (Decode.oneOf
            [ Decode.field "lines" (Decode.nullable (Decode.list Decode.string))
            , Decode.succeed Nothing
            ]
        )
