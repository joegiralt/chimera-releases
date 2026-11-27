-- SPDX-License-Identifier: GPL-3.0-or-later


module Tape.Settings exposing
    ( Args
    , Form(..)
    , Rate(..)
    , Settings
    , Top(..)
    , allRates
    , args
    , argsFrom
    , argsLines
    , argsTo
    , cycleDefault
    , defaults
    , maxSeconds
    , rateLabel
    , seconds
    )

{-| What the user chooses for a source, as typed, and the one way to turn
it into what `tape.wasm` takes: `just tape`'s own flags (`--rate`,
`--name`, `--transwave`, `--frames`, `--top`) and the input frames to
convert. An `Args` exists only for choices that are whole.
-}

import Tape.Name as Name
import Tape.Report exposing (Take)


{-| A plain source's rate (the importer's `Rate`: the S950's choices).
-}
type Rate
    = K48
    | K32
    | K24
    | K16
    | K12
    | K8


{-| A sample (a plain source), or a wavetable for the WAVE machine: single-cycle
frames of `cycle` input samples, at most `frames` of them, its top level
512 or 1024.
-}
type Form
    = Sample
    | Wavetable { cycle : String, frames : Int, top : Top }


type Top
    = Top512
    | Top1024


{-| Start and end in seconds of the take, and the name, as typed.
-}
type alias Settings =
    { rate : Rate
    , start : String
    , end : String
    , name : String
    , form : Form
    }


type Args
    = Args { lines : List String, from : Int, to : Int }


nextRate : Rate -> Maybe Rate
nextRate rate =
    case rate of
        K48 ->
            Just K32

        K32 ->
            Just K24

        K24 ->
            Just K16

        K16 ->
            Just K12

        K12 ->
            Just K8

        K8 ->
            Nothing


allRates : List Rate
allRates =
    let
        walk : Rate -> List Rate -> List Rate
        walk rate acc =
            case nextRate rate of
                Just next ->
                    walk next (rate :: acc)

                Nothing ->
                    List.reverse (rate :: acc)
    in
    walk K48 []


rateHz : Rate -> Int
rateHz rate =
    case rate of
        K48 ->
            48000

        K32 ->
            32000

        K24 ->
            24000

        K16 ->
            16000

        K12 ->
            12000

        K8 ->
            8000


rateLabel : Rate -> String
rateLabel rate =
    String.fromInt (rateHz rate // 1000) ++ " kHz"


{-| A single-cycle frame's usual length (Serum's, and most wavetable packs').
-}
cycleDefault : String
cycleDefault =
    "2048"


{-| The take at 24 kHz, a plain source, under the importer's name: all of
it, or as much from its start as one copy holds at 24 kHz.
-}
defaults : Take -> Settings
defaults take =
    let
        most : Int
        most =
            floor (maxSeconds 1048576 K24 * toFloat take.rate)
    in
    { rate = K24, start = "0", end = seconds (min take.frames most) take.rate, name = take.name, form = Sample }


{-| Frames at a rate as seconds, to the millisecond.
-}
seconds : Int -> Int -> String
seconds frames rate =
    let
        millis : Int
        millis =
            round (toFloat frames * 1000 / toFloat rate)
    in
    String.fromInt (millis // 1000) ++ "." ++ String.padLeft 3 '0' (String.fromInt (modBy 1000 millis))


{-| A little under the longest plain source `put` takes at `rate`: two
frames in three bytes, under `limit` less the file's framing (a record head
every 504 bytes, the header, head and trailer), with 1 KiB to spare for the
resampler's rounding.
-}
maxSeconds : Int -> Rate -> Float
maxSeconds limit rate =
    toFloat (limit - 1024) * (504 / 508) * 2 / 3 / toFloat (rateHz rate)


{-| Seconds as typed, inside the take: a frame number.
-}
frameAt : Take -> String -> Result String Int
frameAt take typed =
    case String.toFloat (String.trim typed) of
        Just secs ->
            if isNaN secs || secs < 0 then
                Err "a time from 0"

            else
                Ok (min take.frames (round (secs * toFloat take.rate)))

        Nothing ->
            Err "a time in seconds"


{-| The choices made whole, or what is wrong with them.
-}
args : Take -> Settings -> Result String Args
args take settings =
    Result.map3
        (\from to nameLines ->
            Args { lines = formLines settings ++ nameLines, from = from, to = to }
        )
        (frameAt take settings.start |> Result.mapError ((++) "START: "))
        (frameAt take settings.end |> Result.mapError ((++) "END: "))
        (Name.fromString settings.name
            |> Result.map (\named -> [ "--name", Name.toString named ])
            |> Result.mapError nameIssue
        )
        |> Result.andThen
            (\(Args made) ->
                if made.to > made.from then
                    Result.map (\_ -> Args made) (cycleOk settings.form)

                else
                    Err "END must come after START"
            )


nameIssue : Name.NameProblem -> String
nameIssue problem =
    case problem of
        Name.NoName ->
            "NAME: give it one"

        Name.TooLong ->
            "NAME: 16 characters at most"

        Name.BadCharacter char ->
            "NAME: A-Z, 0-9, space and - only, not " ++ String.fromChar char

        Name.EdgeSpace ->
            "NAME: no space at either end"


cycleOk : Form -> Result String ()
cycleOk form =
    case form of
        Sample ->
            Ok ()

        Wavetable table ->
            case String.toInt (String.trim table.cycle) of
                Just samples ->
                    if samples >= 2 && samples <= 65536 then
                        Ok ()

                    else
                        Err "CYCLE: 2 to 65536 samples"

                Nothing ->
                    Err "CYCLE: a whole number of samples"


formLines : Settings -> List String
formLines settings =
    case settings.form of
        Sample ->
            [ "--rate", String.fromInt (rateHz settings.rate // 1000) ++ "k" ]

        Wavetable table ->
            [ "--transwave", String.trim table.cycle, "--frames", String.fromInt table.frames ]
                ++ (case table.top of
                        Top512 ->
                            []

                        Top1024 ->
                            [ "--top", "1024" ]
                   )


argsLines : Args -> List String
argsLines (Args made) =
    made.lines


argsFrom : Args -> Int
argsFrom (Args made) =
    made.from


argsTo : Args -> Int
argsTo (Args made) =
    made.to
