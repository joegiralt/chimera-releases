-- SPDX-License-Identifier: GPL-3.0-or-later


module Tape.Step exposing (chunkBytes, chunks, hand, replyWaitMs, step, timedOut)

{-| Every transition of TAPE import, pure: an event from `tape.js` (`step`)
or a hand on the page (`hand`) gives the next model and what to ask of
`tape.js`.

The `put` is ADR 0106's: the request line; on `READY` the 256 KiB chunks
one at a time, each sent only once the one before it is `ACK`ed with the
bytes so far; after the last, the unit's `OK` once it has read the file
back and sealed it. `OK PRESENT` in place of `READY` is the same source
already on the card. A reply out of turn, or none within
`replyWaitMs`, sends `abort` (the line that ends a transfer early) and
stops.

-}

import Tape.Reply exposing (Reply(..))
import Tape.Report exposing (Shape(..), Source, remotePath)
import Tape.Settings as Settings exposing (Form(..), Settings)
import Tape.Types exposing (Dropped(..), Event(..), Failure(..), Hand(..), Held, Js(..), Link(..), Model(..), Outcome(..), Playback(..), Request(..), Send(..), Stage(..), Work(..))


{-| `PUT_CHUNK_BYTES`.
-}
chunkBytes : Int
chunkBytes =
    256 * 1024


{-| The unit gives each chunk 30 s, and the read back and seal 30 s: a
reply is waited for 35 s, as `chimera-usb.py` waits.
-}
replyWaitMs : Int
replyWaitMs =
    35000


{-| How many chunks a file of `bytes` goes in.
-}
chunks : Int -> Int
chunks bytes =
    max 1 ((bytes + chunkBytes - 1) // chunkBytes)


with : Stage -> Model -> Model
with stage (Model fields) =
    Model { fields | stage = stage }


holding : Held -> Model -> Model
holding held =
    with (Holding held)


{-| An `Await`: the tick moves on, so only the newest wait can time out.
-}
await : Model -> ( Model, Request )
await (Model fields) =
    ( Model { fields | tick = fields.tick + 1 }, Await (fields.tick + 1) )


step : Event -> Model -> ( Model, List Request )
step event ((Model fields) as model) =
    case ( event, fields.stage ) of
        ( Begun open, _ ) ->
            ( Model
                { fields
                    | stage = Empty Fresh
                    , link =
                        if open then
                            Linked

                        else
                            Unlinked
                }
            , []
            )

        ( Picked file, Empty _ ) ->
            ( with (Reading file) model, [ ToJs ReadFile ] )

        ( Picked file, Holding held ) ->
            if sending fields.stage then
                ( model, [] )

            else
                ( with (Reading file) model, [ ToJs ReadFile ] ) |> stopFirst held

        ( Picked _, _ ) ->
            ( model, [] )

        ( PickCancelled, _ ) ->
            ( model, [] )

        ( Loaded file (Err refusal), Reading _ ) ->
            ( with (Empty (Unread file refusal)) model, [] )

        ( Loaded _ (Ok take), Reading _ ) ->
            make { take = take, settings = Settings.defaults take, work = Unmade } model

        ( Loaded _ _, _ ) ->
            ( model, [] )

        ( Converted number result, Holding held ) ->
            case ( held.work, result ) of
                ( Making asked, Ok source ) ->
                    if asked == number then
                        ( holding { held | work = Made source Silent } model, [] )

                    else
                        ( model, [] )

                ( Making asked, Err refusal ) ->
                    if asked == number then
                        ( holding { held | work = Unmakeable refusal } model, [] )

                    else
                        ( model, [] )

                _ ->
                    ( model, [] )

        ( Converted _ _, _ ) ->
            ( model, [] )

        ( PlayEnded, Holding held ) ->
            case held.work of
                Made source Playing ->
                    ( holding { held | work = Made source Silent } model, [] )

                _ ->
                    ( model, [] )

        ( PlayEnded, _ ) ->
            ( model, [] )

        ( Line reply, Holding held ) ->
            case held.work of
                Sending source send ->
                    sendStep reply source send held model

                Unmade ->
                    ( model, [] )

                Making _ ->
                    ( model, [] )

                Made _ _ ->
                    ( model, [] )

                Unmakeable _ ->
                    ( model, [] )

                Sent _ _ ->
                    ( model, [] )

        ( Line _, _ ) ->
            ( model, [] )

        ( LinkLost, Holding held ) ->
            case held.work of
                Sending source _ ->
                    ( Model { fields | link = Unlinked, stage = Holding { held | work = Sent source (Failed LinkGone) } }, [] )

                Unmade ->
                    ( Model { fields | link = Unlinked }, [] )

                Making _ ->
                    ( Model { fields | link = Unlinked }, [] )

                Made _ _ ->
                    ( Model { fields | link = Unlinked }, [] )

                Unmakeable _ ->
                    ( Model { fields | link = Unlinked }, [] )

                Sent _ _ ->
                    ( Model { fields | link = Unlinked }, [] )

        ( LinkLost, _ ) ->
            ( Model { fields | link = Unlinked }, [] )

        ( Garbled what, Holding held ) ->
            case held.work of
                Sending source _ ->
                    ( holding { held | work = Sent source (Failed (OutOfTurn what)) } model, [ ToJs (SendLine "abort") ] )

                Unmade ->
                    ( model, [] )

                Making _ ->
                    ( model, [] )

                Made _ _ ->
                    ( model, [] )

                Unmakeable _ ->
                    ( model, [] )

                Sent _ _ ->
                    ( model, [] )

        ( Garbled _, _ ) ->
            ( model, [] )

        ( Ended _, _ ) ->
            ( model, [] )


sending : Stage -> Bool
sending stage =
    case stage of
        Holding held ->
            case held.work of
                Sending _ _ ->
                    True

                Unmade ->
                    False

                Making _ ->
                    False

                Made _ _ ->
                    False

                Unmakeable _ ->
                    False

                Sent _ _ ->
                    False

        Opening ->
            False

        Empty _ ->
            False

        Reading _ ->
            False

        Closing ->
            False


{-| The choices made into a source, if they are whole; else the work
waits on them (the page says what is wrong).
-}
make : Held -> Model -> ( Model, List Request )
make held ((Model fields) as model) =
    case Settings.args held.take held.settings of
        Ok made ->
            let
                number : Int
                number =
                    fields.tick + 1
            in
            ( Model { fields | tick = number, stage = Holding { held | work = Making number } }, [ ToJs (Convert number made) ] )

        Err _ ->
            ( holding { held | work = Unmade } model, [] )


{-| A reply while `send` is out.
-}
sendStep : Reply -> Source -> Send -> Held -> Model -> ( Model, List Request )
sendStep reply source send held model =
    let
        stop : Outcome -> List Request -> ( Model, List Request )
        stop outcome reqs =
            ( holding { held | work = Sent source outcome } model, reqs )

        out : List Request
        out =
            [ ToJs (SendLine "abort") ]

        next : Send -> List Request -> ( Model, List Request )
        next to reqs =
            let
                ( waited, wait ) =
                    await (holding { held | work = Sending source to } model)
            in
            ( waited, reqs ++ [ wait ] )
    in
    case ( send, reply ) of
        ( _, Refused error ) ->
            stop (Failed (UnitRefused error)) []

        ( Asking, Ready ) ->
            next (Chunk 0) [ ToJs (SendChunk 0) ]

        ( Asking, Present ) ->
            stop AlreadyThere []

        ( Asking, Busy ) ->
            stop (Failed UnitBusy) []

        ( Chunk index, Ack bytes ) ->
            let
                end : Int
                end =
                    min source.bytes ((index + 1) * chunkBytes)
            in
            if bytes /= end then
                stop (Failed (OutOfTurn ("ACK " ++ String.fromInt bytes))) out

            else if end == source.bytes then
                next Sealing []

            else
                next (Chunk (index + 1)) [ ToJs (SendChunk (index + 1)) ]

        ( Sealing, Done ) ->
            stop Landed []

        ( _, Unexpected line ) ->
            stop (Failed (OutOfTurn line)) out

        ( _, other ) ->
            stop (Failed (OutOfTurn (replyWord other))) out


replyWord : Reply -> String
replyWord reply =
    case reply of
        Ready ->
            "READY"

        Present ->
            "OK PRESENT"

        Ack bytes ->
            "ACK " ++ String.fromInt bytes

        Done ->
            "OK"

        Busy ->
            "ERR busy"

        Refused _ ->
            "ERR put"

        Unexpected line ->
            line


hand : Hand -> Model -> ( Model, List Request )
hand msg ((Model fields) as model) =
    case ( msg, fields.stage ) of
        ( Choose, stage ) ->
            if sending stage then
                ( model, [] )

            else
                ( model, [ ToJs ChooseFile ] )

        ( Close, stage ) ->
            if sending stage then
                ( model, [] )

            else
                ( with Closing model, [ ToJs StopPlay, ToJs End ] )

        ( Make, Holding held ) ->
            if sending fields.stage then
                ( model, [] )

            else
                make held model |> stopFirst held

        ( Play, Holding held ) ->
            case held.work of
                Made source Silent ->
                    ( holding { held | work = Made source Playing } model, [ ToJs StartPlay ] )

                _ ->
                    ( model, [] )

        ( Stop, Holding held ) ->
            case held.work of
                Made source Playing ->
                    ( holding { held | work = Made source Silent } model, [ ToJs StopPlay ] )

                _ ->
                    ( model, [] )

        ( SendIt, Holding held ) ->
            case ( held.work, fields.link ) of
                ( Made source playback, Linked ) ->
                    let
                        ( waited, wait ) =
                            await (holding { held | work = Sending source Asking } model)
                    in
                    ( waited, stopping playback ++ [ ToJs (SendLine (putLine source)), wait ] )

                ( Sent source _, Linked ) ->
                    let
                        ( waited, wait ) =
                            await (holding { held | work = Sending source Asking } model)
                    in
                    ( waited, [ ToJs (SendLine (putLine source)), wait ] )

                _ ->
                    ( model, [] )

        ( _, Holding held ) ->
            case held.work of
                Sending _ _ ->
                    ( model, [] )

                Unmade ->
                    case setting msg held.settings of
                        Just settings ->
                            ( holding { held | settings = settings, work = Unmade } model, [] )
                                |> stopFirst held

                        Nothing ->
                            ( model, [] )

                Making _ ->
                    case setting msg held.settings of
                        Just settings ->
                            ( holding { held | settings = settings, work = Unmade } model, [] )
                                |> stopFirst held

                        Nothing ->
                            ( model, [] )

                Made _ _ ->
                    case setting msg held.settings of
                        Just settings ->
                            ( holding { held | settings = settings, work = Unmade } model, [] )
                                |> stopFirst held

                        Nothing ->
                            ( model, [] )

                Unmakeable _ ->
                    case setting msg held.settings of
                        Just settings ->
                            ( holding { held | settings = settings, work = Unmade } model, [] )
                                |> stopFirst held

                        Nothing ->
                            ( model, [] )

                Sent _ _ ->
                    case setting msg held.settings of
                        Just settings ->
                            ( holding { held | settings = settings, work = Unmade } model, [] )
                                |> stopFirst held

                        Nothing ->
                            ( model, [] )

        _ ->
            ( model, [] )


{-| No reply to the newest wait: the copy stops, and the unit is told so.
-}
timedOut : Int -> Model -> ( Model, List Request )
timedOut tick ((Model fields) as model) =
    case fields.stage of
        Holding held ->
            case held.work of
                Sending source _ ->
                    if tick == fields.tick then
                        ( holding { held | work = Sent source (Failed NoAnswer) } model, [ ToJs (SendLine "abort") ] )

                    else
                        ( model, [] )

                Unmade ->
                    ( model, [] )

                Making _ ->
                    ( model, [] )

                Made _ _ ->
                    ( model, [] )

                Unmakeable _ ->
                    ( model, [] )

                Sent _ _ ->
                    ( model, [] )

        Opening ->
            ( model, [] )

        Empty _ ->
            ( model, [] )

        Reading _ ->
            ( model, [] )

        Closing ->
            ( model, [] )


{-| A change to what's held stops a preview of the old source first.
-}
stopFirst : Held -> ( Model, List Request ) -> ( Model, List Request )
stopFirst held ( model, reqs ) =
    case held.work of
        Made _ Playing ->
            ( model, ToJs StopPlay :: reqs )

        _ ->
            ( model, reqs )


stopping : Playback -> List Request
stopping playback =
    case playback of
        Playing ->
            [ ToJs StopPlay ]

        Silent ->
            []


{-| `put /CHIMERA/TAPES/<stem>.SRC <size> <crc32>`.
-}
putLine : Source -> String
putLine source =
    String.join " " [ "put", remotePath source.stem, String.fromInt source.bytes, source.crc ]


{-| A choice changed, or Nothing for a hand that isn't one.
-}
setting : Hand -> Settings -> Maybe Settings
setting msg settings =
    case msg of
        SetRate rate ->
            Just { settings | rate = rate }

        SetStart typed ->
            Just { settings | start = typed }

        SetEnd typed ->
            Just { settings | end = typed }

        SetName typed ->
            Just { settings | name = String.toUpper typed }

        SetShape Plain ->
            Just { settings | form = Sample }

        SetShape Transwave ->
            case settings.form of
                Sample ->
                    Just { settings | form = Wavetable { cycle = Settings.cycleDefault, frames = 32, top = Settings.Top512 } }

                Wavetable _ ->
                    Nothing

        SetCycle typed ->
            wavetable settings (\table -> { table | cycle = typed })

        SetFrames typed ->
            String.toInt typed
                |> Maybe.andThen
                    (\frames ->
                        if frames >= 1 && frames <= 32 then
                            wavetable settings (\table -> { table | frames = frames })

                        else
                            Nothing
                    )

        SetTop top ->
            wavetable settings (\table -> { table | top = top })

        Choose ->
            Nothing

        Make ->
            Nothing

        Play ->
            Nothing

        Stop ->
            Nothing

        SendIt ->
            Nothing

        Close ->
            Nothing


wavetable : Settings -> ({ cycle : String, frames : Int, top : Settings.Top } -> { cycle : String, frames : Int, top : Settings.Top }) -> Maybe Settings
wavetable settings change =
    case settings.form of
        Wavetable table ->
            Just { settings | form = Wavetable (change table) }

        Sample ->
            Nothing
