-- SPDX-License-Identifier: GPL-3.0-or-later


module Tape.Report exposing
    ( Fit(..)
    , Problem(..)
    , Refusal
    , Shape(..)
    , Source
    , Stem
    , Take
    , parseSource
    , parseTake
    , problemOf
    , remotePath
    )

{-| What `tape.wasm` (the firmware's own `chimera-import tape`) says of a
WAV it read and of the source it made, parsed once from its `<key>
<value>` lines into records that can only hold sane values. Its refusals
are a status, typed here, with its message as the detail.
-}

import Dict exposing (Dict)


{-| A WAV held: its rate, its frames (mixed to mono), and the name the
importer gives it from the file's name.
-}
type alias Take =
    { file : String
    , rate : Int
    , frames : Int
    , name : String
    }


{-| The source's file name on the card: its CRC, eight upper-case hex digits.
-}
type Stem
    = Stem String


type Shape
    = Plain
    | Transwave


{-| Where a project of NEW plays it from (the firmware's `load_kind`):
whole in memory, streamed from the card (a plain source too big for
memory), or not at all (a transwave too big for memory).
-}
type Fit
    = Whole
    | Streams
    | WontLoad


{-| A source made: the file (`bytes`, `crc` as `put` names them) and its
head; `cost` on the memory meter against the `free` a project of NEW
leaves; `limit`, the most `put` takes.
-}
type alias Source =
    { stem : Stem
    , bytes : Int
    , crc : String
    , name : String
    , shape : Shape
    , rate : Int
    , frames : Int
    , count : Int
    , root : Int
    , period : Int
    , cost : Int
    , free : Int
    , fit : Fit
    , limit : Int
    }


{-| Why `tape.wasm` refused, by its status (`chimera-tape-wasm`'s `Status`).
`Trapped` is the module stopping (a fault in it, never a status).
-}
type Problem
    = NotWav
    | BadRate
    | NotAudio
    | WavTooBig
    | NoSound
    | TooShort
    | Resample
    | NoCycles
    | TooBig
    | BadArgs
    | BadRange
    | NoWav
    | BadText
    | Unwritten
    | Trapped
    | UnknownStatus Int


type alias Refusal =
    { problem : Problem
    , detail : String
    }


problemOf : Int -> Problem
problemOf status =
    case negate status of
        1 ->
            NotWav

        2 ->
            BadRate

        3 ->
            NotAudio

        4 ->
            WavTooBig

        5 ->
            NoSound

        6 ->
            TooShort

        7 ->
            Resample

        8 ->
            NoCycles

        9 ->
            TooBig

        10 ->
            BadArgs

        11 ->
            BadRange

        12 ->
            NoWav

        13 ->
            BadText

        14 ->
            Unwritten

        _ ->
            UnknownStatus status


{-| Where `put` writes it: `/CHIMERA/TAPES/<stem>.SRC`.
-}
remotePath : Stem -> String
remotePath (Stem stem) =
    "/CHIMERA/TAPES/" ++ stem ++ ".SRC"


{-| Each `<key> <value>` line; a key twice, or a line without a space, is no report.
-}
fields : String -> Result String (Dict String String)
fields report =
    String.lines report
        |> List.filter (String.trim >> (/=) "")
        |> List.foldl
            (\line result ->
                Result.andThen
                    (\dict ->
                        case String.indexes " " line of
                            at :: _ ->
                                let
                                    key : String
                                    key =
                                        String.left at line
                                in
                                if Dict.member key dict then
                                    Err ("twice: " ++ key)

                                else
                                    Ok (Dict.insert key (String.dropLeft (at + 1) line) dict)

                            [] ->
                                Err ("no value: " ++ line)
                    )
                    result
            )
            (Ok Dict.empty)


text : String -> Dict String String -> Result String String
text key dict =
    Dict.get key dict |> Result.fromMaybe ("no " ++ key)


{-| A whole number from 0 to 2^31 - 1, digits only.
-}
count : String -> Dict String String -> Result String Int
count key dict =
    text key dict
        |> Result.andThen
            (\value ->
                if value /= "" && String.length value <= 10 && String.all Char.isDigit value then
                    case String.toInt value of
                        Just number ->
                            if number <= 2147483647 then
                                Ok number

                            else
                                Err ("too big: " ++ key)

                        Nothing ->
                            Err ("not a number: " ++ key)

                else
                    Err ("not a number: " ++ key)
            )


positive : String -> Dict String String -> Result String Int
positive key dict =
    count key dict
        |> Result.andThen
            (\number ->
                if number > 0 then
                    Ok number

                else
                    Err ("zero: " ++ key)
            )


hex8 : String -> Dict String String -> Result String String
hex8 key dict =
    text key dict
        |> Result.andThen
            (\value ->
                if String.length value == 8 && String.all Char.isHexDigit value then
                    Ok (String.toUpper value)

                else
                    Err ("not eight hex digits: " ++ key)
            )


{-| The importer's names: 1 to 16 characters, printable.
-}
name : Dict String String -> Result String String
name dict =
    text "name" dict
        |> Result.andThen
            (\value ->
                if value /= "" && String.length value <= 16 then
                    Ok value

                else
                    Err "a name of 1 to 16"
            )


{-| `load`'s report, for the file `file`.
-}
parseTake : String -> String -> Result String Take
parseTake file report =
    fields report
        |> Result.andThen
            (\dict ->
                Result.map3 (Take file)
                    (positive "rate" dict)
                    (positive "frames" dict)
                    (name dict)
            )


shape : Dict String String -> Result String Shape
shape dict =
    case Dict.get "shape" dict of
        Just "plain" ->
            Ok Plain

        Just "transwave" ->
            Ok Transwave

        _ ->
            Err "shape: plain or transwave"


fit : Dict String String -> Result String Fit
fit dict =
    case Dict.get "fit" dict of
        Just "whole" ->
            Ok Whole

        Just "streams" ->
            Ok Streams

        Just "refused" ->
            Ok WontLoad

        _ ->
            Err "fit: whole, streams or refused"


{-| `convert`'s report.
-}
parseSource : String -> Result String Source
parseSource report =
    fields report
        |> Result.andThen
            (\dict ->
                Ok Source
                    |> andMap (hex8 "stem" dict |> Result.map Stem)
                    |> andMap (positive "bytes" dict)
                    |> andMap (hex8 "crc" dict)
                    |> andMap (name dict)
                    |> andMap (shape dict)
                    |> andMap (positive "rate" dict)
                    |> andMap (positive "frames" dict)
                    |> andMap (positive "count" dict)
                    |> andMap (count "root" dict)
                    |> andMap (count "period" dict)
                    |> andMap (positive "cost" dict)
                    |> andMap (count "free" dict)
                    |> andMap (fit dict)
                    |> andMap (positive "limit" dict)
            )


andMap : Result String field -> Result String (field -> built) -> Result String built
andMap value function =
    Result.andThen (\apply -> Result.map apply value) function
