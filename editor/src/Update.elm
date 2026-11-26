-- SPDX-License-Identifier: GPL-3.0-or-later


port module Update exposing
    ( askLatest
    , begin
    , beginStuck
    , holding
    , latestSub
    , press
    , stage
    , subscriptions
    , update
    )

{-| The update from the browser: what `chimera-usb.py update` does, as a
state machine. Every step is decided here; `update.js` only carries each
request out (the console's answers, the put, the DFU write) and says what
came of it.

  - **Checking:** `status`; a project with unsaved changes stops it, nothing written.
  - **Copying:** `CHIMERA.BK2` put onto the card (`/CHIMERA/SYSTEM/BANK2.BK2`).
    Firmware from before bank 2 refuses the path: the .bk2 then goes after the flash.
  - **Restarting into update mode:** `dfu`; the one STM32 DFU device that
    comes up after it (never one that was there before).
  - **Writing:** `CHIMERA.BIN` at 0x08020000 (`dfu.js`), then the leave that starts it.
  - **Installing:** the console back, the new firmware running, bank 2 open
    with this release's seal; else `bank2 install` (the .bk2 put first,
    after an older firmware), its restart, and `status` once more.

Whether the write has started is in the type: a `Run` is `Pre` (nothing
written to the flash), `Writing`, or `Post` (the firmware area written),
and a stop is a `PreFail` or a `PostFail`. Only a `PreFail` can say
nothing was flashed; a `PostFail`'s way on always asks the unit what it
runs now.

The types are in `Update.Types`, what the unit's answers mean in
`Update.Read`, the steps in `Update.Step` and `Update.Hand`, the JSON to and
from `update.js` in `Update.Wire`, the page in `Update.View`.

-}

import Json.Decode as D
import Json.Encode as E
import Update.Hand exposing (hand)
import Update.Step exposing (step)
import Update.Types exposing (Event(..), Mode(..), Model(..), Msg(..), PreRun(..), Request(..), Run(..), Stage(..), runningOf)
import Update.Wire exposing (decode, encode)



-- PORTS


port updateOut : E.Value -> Cmd msg


port updateIn : (D.Value -> msg) -> Sub msg



-- STEPS


{-| The panel opening on a connected unit: the link taken from the editor,
`status`, and the site's latest release.
-}
begin : ( Model, Cmd msg )
begin =
    ( Model { stage = Opening, windows = False, webusb = True, mode = Connected }, send [ Begin ] )


{-| For a unit already in update mode: the release only; its DFU device
is picked by hand, then the normal install once the console comes back.
-}
beginStuck : ( Model, Cmd msg )
beginStuck =
    ( Model { stage = Opening, windows = False, webusb = True, mode = Stuck }, send [ Begin ] )


stage : Model -> Stage
stage (Model fields) =
    fields.stage


subscriptions : Sub Msg
subscriptions =
    updateIn FromJs


{-| The site's latest release, asked for the offer on connect (its manifest only).
-}
askLatest : Cmd msg
askLatest =
    updateOut (E.object [ ( "op", E.string "latest" ) ])


{-| The latest release's version (`0.4.1 abcd1234`), or Nothing when the site has none.
Every other answer is ignored.
-}
latestSub : (Maybe String -> msg) -> msg -> Sub msg
latestSub toMsg ignored =
    updateIn
        (\value ->
            case D.decodeValue (D.field "op" D.string) value of
                Ok "latest" ->
                    toMsg (D.decodeValue (D.field "version" D.string) value |> Result.toMaybe)

                _ ->
                    ignored
        )


{-| A message in; the model, what to send, and the link's state once the
update has given it back (the editor then starts over). The tab is held
(the browser asks before a close or reload) while an update writes or
waits on a restart.
-}
update : Msg -> Model -> ( Model, Cmd Msg, Maybe String )
update msg model =
    let
        event : Maybe Event
        event =
            case msg of
                FromJs value ->
                    Just (decode value)

                Choose ->
                    Nothing

                Start ->
                    Nothing

                Go ->
                    Nothing

                Cancel ->
                    Nothing

                Pick ->
                    Nothing

                WriteAgain ->
                    Nothing

                CheckAgain ->
                    Nothing

                TryAgain ->
                    Nothing

                ConnectPort ->
                    Nothing

                SaveAndUpdate ->
                    Nothing

                DiscardAndUpdate ->
                    Nothing

                UseDfu ->
                    Nothing

                Close ->
                    Nothing

        ( next, reqs ) =
            case event of
                Just ev ->
                    step ev model

                Nothing ->
                    hand msg model

        held : List Request
        held =
            if holding next /= holding model then
                [ Hold (holding next) ]

            else
                []
    in
    ( next, send (held ++ reqs), Maybe.andThen endedLink event )


endedLink : Event -> Maybe String
endedLink event =
    case event of
        Ended link ->
            Just link

        Begun _ ->
            Nothing

        ReleaseIs _ ->
            Nothing

        ReleaseCancelled ->
            Nothing

        Answered _ _ ->
            Nothing

        Copied _ ->
            Nothing

        Written _ ->
            Nothing

        DeviceIs _ ->
            Nothing

        WriteDone _ ->
            Nothing

        BackDone _ ->
            Nothing

        Mismatch _ ->
            Nothing

        Garbled _ ->
            Nothing

        Unrelated ->
            Nothing

        Unsent _ ->
            Nothing

        OtherOnLink _ ->
            Nothing


{-| Whether the tab is held: while anything past CHECKING runs.
-}
holding : Model -> Bool
holding (Model fields) =
    case runningOf fields.stage of
        Just ( _, _, Pre Checking ) ->
            False

        Just ( _, _, Pre (ReadingProject _) ) ->
            False

        Just ( _, _, Pre (Saving _) ) ->
            True

        Just ( _, _, Pre Discarding ) ->
            True

        Just ( _, _, Pre (Settling _) ) ->
            True

        Just ( _, _, Pre (Copying _) ) ->
            True

        Just ( _, _, Pre (CopyingBin _) ) ->
            True

        Just ( _, _, Pre InstallingSelf ) ->
            True

        Just ( _, _, Pre (EnteringDfu _) ) ->
            True

        Just ( _, _, Pre (FindingDevice _) ) ->
            True

        Just ( _, _, Pre (PickingDevice _) ) ->
            True

        Just ( _, _, Writing _ _ ) ->
            True

        Just ( _, _, Post _ _ ) ->
            True

        Nothing ->
            False


send : List Request -> Cmd msg
send reqs =
    Cmd.batch (List.map (encode >> updateOut) reqs)


{-| A hand on the panel: the model and the requests it sends (`update`'s
pure half, as `step` is for what comes back).
-}
press : Msg -> Model -> ( Model, List Request )
press =
    hand
