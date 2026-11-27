-- SPDX-License-Identifier: GPL-3.0-or-later


module Tape.Step exposing (chunkBytes, chunks, drainMs, hand, replyWaitMs, step, timedOut)

{-| Every transition of TAPE import, pure: an event from `tape.js` (`step`),
a hand on the page (`hand`) or a wait run out (`timedOut`) gives the next
model and what to ask.

The `put` is ADR 0106's: the request line; on `READY` the 256 KiB chunks
one at a time, each sent only once the one before it is `ACK`ed with the
bytes so far; after the last, the unit's `OK` once it has read the file
back and sealed it. `OK PRESENT` in place of `READY` is the same source
already on the card. A reply out of turn, or none within `replyWaitMs`,
aborts: the chunk being written stops, `abort` goes, and the console is
`Draining` until the old `put`'s own answer comes (or `drainMs` pass), so a
new SEND never meets it.

-}

import Tape.Reply exposing (Reply(..))
import Tape.Report exposing (Shape(..), Source, remotePath)
import Tape.Settings as Settings exposing (Form(..), Settings)
import Tape.Types exposing (Console(..), Dropped(..), Event(..), Failure(..), Hand(..), Held, Js(..), Link(..), Model(..), Outcome(..), Playback(..), Request(..), Send(..), Stage(..), Work(..))


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


{-| An aborted `put` drains the host for up to 5 s (`DRAIN_MS`) before its
`ERR`: a second more, and the console is taken as quiet without it.
-}
drainMs : Int
drainMs =
    6000


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


{-| The tick moved on: only the newest wait can time out.
-}
ticked : Model -> ( Model, Int )
ticked (Model fields) =
    ( Model { fields | tick = fields.tick + 1 }, fields.tick + 1 )


{-| The source being sent, and where its `put` is.
-}
sendingOf : Work -> Maybe ( Source, Send )
sendingOf work =
    case work of
        Sending source send ->
            Just ( source, send )

        Unmade ->
            Nothing

        Making _ ->
            Nothing

        Made _ _ ->
            Nothing

        Unmakeable _ ->
            Nothing

        Sent _ _ ->
            Nothing


sending : Stage -> Bool
sending stage =
    case stage of
        Holding held ->
            sendingOf held.work /= Nothing

        Opening ->
            False

        Empty _ ->
            False

        Reading _ ->
            False

        Closing ->
            False


{-| A source made and not being sent, and whether its preview plays.
-}
madeOf : Work -> Maybe ( Source, Playback )
madeOf work =
    case work of
        Made source playback ->
            Just ( source, playback )

        Unmade ->
            Nothing

        Making _ ->
            Nothing

        Unmakeable _ ->
            Nothing

        Sending _ _ ->
            Nothing

        Sent _ _ ->
            Nothing


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
            case held.work of
                Making asked ->
                    if asked /= number then
                        ( model, [] )

                    else
                        case result of
                            Ok source ->
                                ( holding { held | work = Made source Silent } model, [] )

                            Err refusal ->
                                ( holding { held | work = Unmakeable refusal } model, [] )

                Unmade ->
                    ( model, [] )

                Made _ _ ->
                    ( model, [] )

                Unmakeable _ ->
                    ( model, [] )

                Sending _ _ ->
                    ( model, [] )

                Sent _ _ ->
                    ( model, [] )

        ( Converted _ _, _ ) ->
            ( model, [] )

        ( PlayEnded, Holding held ) ->
            case madeOf held.work of
                Just ( source, Playing ) ->
                    ( holding { held | work = Made source Silent } model, [] )

                Just ( _, Silent ) ->
                    ( model, [] )

                Nothing ->
                    ( model, [] )

        ( PlayEnded, _ ) ->
            ( model, [] )

        ( Line reply, Holding held ) ->
            case sendingOf held.work of
                Just ( source, send ) ->
                    sendStep reply source send held model

                Nothing ->
                    ( quieted reply model, [] )

        ( Line reply, _ ) ->
            ( quieted reply model, [] )

        ( LinkLost, Holding held ) ->
            case sendingOf held.work of
                Just ( source, _ ) ->
                    ( Model { fields | link = Unlinked, console = Idle, stage = Holding { held | work = Sent source (Failed LinkGone) } }, [] )

                Nothing ->
                    ( Model { fields | link = Unlinked, console = Idle }, [] )

        ( LinkLost, _ ) ->
            ( Model { fields | link = Unlinked, console = Idle }, [] )

        ( Garbled what, Holding held ) ->
            case sendingOf held.work of
                Just ( source, _ ) ->
                    abort (OutOfTurn what) source held model

                Nothing ->
                    ( model, [] )

        ( Garbled _, _ ) ->
            ( model, [] )

        ( Ended _, _ ) ->
            ( model, [] )


{-| A line with no `put` out: the end of an aborted one, if it is its
answer (an `OK` or an `ERR`), quiets a draining console; any other is
dropped.
-}
quieted : Reply -> Model -> Model
quieted reply ((Model fields) as model) =
    let
        ends : Bool
        ends =
            case reply of
                Refused _ ->
                    True

                Done ->
                    True

                Present ->
                    True

                Busy ->
                    True

                Ready ->
                    False

                Ack _ ->
                    False

                Unexpected _ ->
                    False
    in
    case ( fields.console, ends ) of
        ( Draining, True ) ->
            Model { fields | console = Idle }

        ( Draining, False ) ->
            model

        ( Idle, _ ) ->
            model


{-| The copy stopped for `failure`: the chunk being written stopped and
`abort` sent; the console drains until the old `put`'s answer.
-}
abort : Failure -> Source -> Held -> Model -> ( Model, List Request )
abort failure source held model =
    let
        ( Model fields, tick ) =
            ticked (holding { held | work = Sent source (Failed failure) } model)
    in
    ( Model { fields | console = Draining }, [ ToJs Abort, AwaitQuiet tick ] )


{-| The choices made into a source, if they are whole; else the work
waits on them (the page says what is wrong).
-}
make : Held -> Model -> ( Model, List Request )
make held model =
    case Settings.args held.take held.settings of
        Ok made ->
            let
                ( Model fields, number ) =
                    ticked model
            in
            ( Model { fields | stage = Holding { held | work = Making number } }, [ ToJs (Convert number made) ] )

        Err _ ->
            ( holding { held | work = Unmade } model, [] )


{-| A reply while `send` is out.
-}
sendStep : Reply -> Source -> Send -> Held -> Model -> ( Model, List Request )
sendStep reply source send held model =
    let
        stop : Outcome -> ( Model, List Request )
        stop outcome =
            ( holding { held | work = Sent source outcome } model, [] )

        outOfTurn : ( Model, List Request )
        outOfTurn =
            abort (OutOfTurn (replyWord reply)) source held model

        next : Send -> List Request -> ( Model, List Request )
        next to reqs =
            let
                ( waited, tick ) =
                    ticked (holding { held | work = Sending source to } model)
            in
            ( waited, reqs ++ [ Await tick ] )
    in
    case send of
        Asking ->
            case reply of
                Ready ->
                    next (Chunk 0) [ ToJs (SendChunk 0) ]

                Present ->
                    stop AlreadyThere

                Busy ->
                    stop (Failed UnitBusy)

                Refused error ->
                    stop (Failed (UnitRefused error))

                Ack _ ->
                    outOfTurn

                Done ->
                    outOfTurn

                Unexpected _ ->
                    outOfTurn

        Chunk index ->
            case reply of
                Ack bytes ->
                    let
                        end : Int
                        end =
                            min source.bytes ((index + 1) * chunkBytes)
                    in
                    if bytes /= end then
                        outOfTurn

                    else if end == source.bytes then
                        next Sealing []

                    else
                        next (Chunk (index + 1)) [ ToJs (SendChunk (index + 1)) ]

                Refused error ->
                    stop (Failed (UnitRefused error))

                Ready ->
                    outOfTurn

                Present ->
                    outOfTurn

                Done ->
                    outOfTurn

                Busy ->
                    outOfTurn

                Unexpected _ ->
                    outOfTurn

        Sealing ->
            case reply of
                Done ->
                    stop Landed

                Refused error ->
                    stop (Failed (UnitRefused error))

                Ready ->
                    outOfTurn

                Present ->
                    outOfTurn

                Ack _ ->
                    outOfTurn

                Busy ->
                    outOfTurn

                Unexpected _ ->
                    outOfTurn


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
            case madeOf held.work of
                Just ( source, Silent ) ->
                    ( holding { held | work = Made source Playing } model, [ ToJs StartPlay ] )

                Just ( _, Playing ) ->
                    ( model, [] )

                Nothing ->
                    ( model, [] )

        ( Stop, Holding held ) ->
            case madeOf held.work of
                Just ( source, Playing ) ->
                    ( holding { held | work = Made source Silent } model, [ ToJs StopPlay ] )

                Just ( _, Silent ) ->
                    ( model, [] )

                Nothing ->
                    ( model, [] )

        ( SendIt, Holding held ) ->
            case ( sendable held.work, fields.link, fields.console ) of
                ( Just ( source, playback ), Linked, Idle ) ->
                    let
                        ( waited, tick ) =
                            ticked (holding { held | work = Sending source Asking } model)
                    in
                    ( waited, stopping playback ++ [ ToJs (SendLine (putLine source)), Await tick ] )

                _ ->
                    ( model, [] )

        ( _, Holding held ) ->
            case ( sendingOf held.work, setting msg held.settings ) of
                ( Nothing, Just settings ) ->
                    ( holding { held | settings = settings, work = Unmade } model, [] )
                        |> stopFirst held

                _ ->
                    ( model, [] )

        _ ->
            ( model, [] )


{-| What SEND sends: a source made, or one sent before (again).
-}
sendable : Work -> Maybe ( Source, Playback )
sendable work =
    case work of
        Made source playback ->
            Just ( source, playback )

        Sent source _ ->
            Just ( source, Silent )

        Unmade ->
            Nothing

        Making _ ->
            Nothing

        Unmakeable _ ->
            Nothing

        Sending _ _ ->
            Nothing


{-| A wait run out: if it is the newest, a `put` with no reply aborts, and
a drain with no answer is taken as over.
-}
timedOut : Int -> Model -> ( Model, List Request )
timedOut tick ((Model fields) as model) =
    if tick /= fields.tick then
        ( model, [] )

    else
        case fields.stage of
            Holding held ->
                case sendingOf held.work of
                    Just ( source, _ ) ->
                        abort NoAnswer source held model

                    Nothing ->
                        ( Model { fields | console = Idle }, [] )

            Opening ->
                ( Model { fields | console = Idle }, [] )

            Empty _ ->
                ( Model { fields | console = Idle }, [] )

            Reading _ ->
                ( Model { fields | console = Idle }, [] )

            Closing ->
                ( Model { fields | console = Idle }, [] )


{-| A change to what's held stops a preview of the old source first.
-}
stopFirst : Held -> ( Model, List Request ) -> ( Model, List Request )
stopFirst held ( model, reqs ) =
    case madeOf held.work of
        Just ( _, Playing ) ->
            ( model, ToJs StopPlay :: reqs )

        Just ( _, Silent ) ->
            ( model, reqs )

        Nothing ->
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
