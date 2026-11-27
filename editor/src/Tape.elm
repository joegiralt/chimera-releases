-- SPDX-License-Identifier: GPL-3.0-or-later


port module Tape exposing (begin, subscriptions, update)

{-| TAPE import from the browser: a WAV made into a TAPE source by the
firmware's own converter (`tape.wasm`, `chimera-import tape` built for the
browser, in the editor kit), heard at 12 bits, then copied onto the unit's
card over the console's `put` (ADR 0106). Every step is decided here
(`Tape.Step`); `tape.js` only carries each request out: the file chosen or
dropped, the converter, the preview, the console's lines and the chunks.

While the panel is open it holds the link, as the update does: the editor
sends nothing else, so no poll lands inside a copy.

The types are in `Tape.Types`, the choices in `Tape.Settings`, what the
converter says in `Tape.Report`, the unit's lines in `Tape.Reply`, the JSON
in `Tape.Wire`, the page in `Tape.View`.

-}

import Json.Decode as D
import Json.Encode as E
import Process
import Tape.Step exposing (drainMs, drainOver, hand, replyWaitMs, step, timedOut)
import Tape.Types exposing (Console(..), Event(..), Js(..), Link(..), Model(..), Msg(..), Request(..), Stage(..))
import Tape.Wire exposing (decode, encode)
import Task


port tapeOut : E.Value -> Cmd msg


port tapeIn : (D.Value -> msg) -> Sub msg


{-| The panel opening: the link taken from the editor.
-}
begin : ( Model, Cmd Msg )
begin =
    ( Model { stage = Opening, link = Unlinked, console = Idle, tick = 0, drains = 0 }, send [ ToJs Begin ] )


subscriptions : Sub Msg
subscriptions =
    tapeIn FromJs


{-| A message in; the model, what to send, and the link's state once the
panel has given it back (the editor then starts over on it).
-}
update : Msg -> Model -> ( Model, Cmd Msg, Maybe String )
update msg model =
    case msg of
        FromJs value ->
            let
                event : Event
                event =
                    decode value

                ( next, reqs ) =
                    step event model
            in
            ( next, send reqs, ended event )

        Hand pressed ->
            let
                ( next, reqs ) =
                    hand pressed model
            in
            ( next, send reqs, Nothing )

        TimedOut tick ->
            let
                ( next, reqs ) =
                    timedOut tick model
            in
            ( next, send reqs, Nothing )

        QuietOver drain ->
            ( drainOver drain model, Cmd.none, Nothing )


ended : Event -> Maybe String
ended event =
    case event of
        Ended link ->
            Just link

        Begun _ ->
            Nothing

        Picked _ ->
            Nothing

        PickCancelled ->
            Nothing

        Loaded _ _ ->
            Nothing

        Converted _ _ ->
            Nothing

        PlayEnded ->
            Nothing

        Line _ ->
            Nothing

        LinkLost ->
            Nothing

        Garbled _ ->
            Nothing


send : List Request -> Cmd Msg
send reqs =
    Cmd.batch (List.map one reqs)


one : Request -> Cmd Msg
one request =
    case request of
        ToJs ask ->
            tapeOut (encode ask)

        Await tick ->
            Process.sleep (toFloat replyWaitMs) |> Task.perform (\_ -> TimedOut tick)

        AwaitQuiet drain ->
            Process.sleep (toFloat drainMs) |> Task.perform (\_ -> QuietOver drain)
