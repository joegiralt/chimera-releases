-- SPDX-License-Identifier: GPL-3.0-or-later


module Tape.Reply exposing (PutError(..), Reply(..), parse, sayError)

{-| The unit's lines while a TAPE source goes onto its card (ADR 0106's
`put`), each parsed once into what it means. Anything else is
`Unexpected`, never a guess.
-}


type Reply
    = Ready
      -- The same source, sealed, is on the card: nothing is sent.
    | Present
      -- A chunk taken: the bytes so far.
    | Ack Int
      -- Read back and sealed.
    | Done
      -- The console has card work pending: try again.
    | Busy
    | Refused PutError
    | Unexpected String


{-| `ERR put: <why>` (and the console's own refusals of the line).
-}
type PutError
    = TooBig
    | Timeout
    | Stalled
    | Aborted
    | BadData
    | TooLong
    | BadCrc
    | Damaged
    | ChunkCrc
    | NotInBuild
    | Usage
    | Other String


parse : String -> Reply
parse raw =
    let
        line : String
        line =
            String.trim raw
    in
    case line of
        "READY" ->
            Ready

        "OK PRESENT" ->
            Present

        "OK" ->
            Done

        "ERR busy" ->
            Busy

        "ERR put is not in this build" ->
            Refused NotInBuild

        _ ->
            if String.startsWith "ACK " line then
                ack (String.dropLeft 4 line) |> Maybe.map Ack |> Maybe.withDefault (Unexpected line)

            else if String.startsWith "ERR put: " line then
                Refused (putError (String.dropLeft 9 line))

            else if String.startsWith "ERR put takes " line then
                Refused Usage

            else
                Unexpected line


{-| Digits only, at most 10, and inside a `u32`: the unit's `ACK <bytes>`.
-}
ack : String -> Maybe Int
ack digits =
    if digits /= "" && String.length digits <= 10 && String.all Char.isDigit digits then
        String.toInt digits |> Maybe.andThen (inRange 0 4294967295)

    else
        Nothing


inRange : Int -> Int -> Int -> Maybe Int
inRange low high value =
    if value >= low && value <= high then
        Just value

    else
        Nothing


putError : String -> PutError
putError message =
    case message of
        "over 1 MiB" ->
            TooBig

        "timeout" ->
            Timeout

        "no block for 500 ms" ->
            Stalled

        "aborted" ->
            Aborted

        "bad data line" ->
            BadData

        "more data than its size" ->
            TooLong

        "CRC mismatch" ->
            BadCrc

        "damaged" ->
            Damaged

        "chunk" ->
            ChunkCrc

        _ ->
            Other message


{-| What the user is told of a refusal.
-}
sayError : PutError -> String
sayError error =
    case error of
        TooBig ->
            "the unit takes sources up to 1 MiB"

        Timeout ->
            "the unit timed out waiting for the data"

        Stalled ->
            "the data stalled on the way (no block for 500 ms)"

        Aborted ->
            "the copy was stopped"

        BadData ->
            "a data line arrived damaged"

        TooLong ->
            "more data arrived than the file's size"

        BadCrc ->
            "the file arrived damaged (CRC mismatch)"

        Damaged ->
            "a sealed copy of this audio on the card is damaged, and the unit never writes over a sealed file; change the rate or the length to send it as a new source"

        ChunkCrc ->
            "a chunk arrived damaged"

        NotInBuild ->
            "this firmware can't take files over USB"

        Usage ->
            "this firmware doesn't take TAPE sources over USB"

        Other message ->
            message
