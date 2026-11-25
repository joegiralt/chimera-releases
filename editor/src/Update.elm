-- SPDX-License-Identifier: GPL-3.0-or-later


port module Update exposing
    ( Answer(..)
    , Bk2(..)
    , Device(..)
    , Event(..)
    , Flash(..)
    , InDfu
    , Loaded
    , Model
    , Msg(..)
    , Offer(..)
    , PostFail(..)
    , PostRun(..)
    , PreFail(..)
    , PreRun(..)
    , Progress
    , Release
    , ReleaseState(..)
    , Request(..)
    , Run(..)
    , SelfUpdate
    , Source(..)
    , Stage(..)
    , Ticket(..)
    , UnitNow
    , Verdict(..)
    , Version
    , WriteResult(..)
    , askLatest
    , begin
    , beginStuck
    , decode
    , holding
    , latestSub
    , offer
    , offerFor
    , parseVersion
    , press
    , readStatus
    , stage
    , step
    , subscriptions
    , update
    , verdict
    , view
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

-}

import Html exposing (Html, a, button, div, li, ol, p, span, text)
import Html.Attributes exposing (attribute, class, href, rel, style, target)
import Html.Events exposing (onClick)
import Json.Decode as D exposing (Decoder)
import Json.Encode as E
import Ui.Chip as Chip
import Ui.Module as Module
import Ui.Page as Page



-- PORTS


port updateOut : E.Value -> Cmd msg


port updateIn : (D.Value -> msg) -> Sub msg



-- WHAT THE UNIT AND THE RELEASE ARE


{-| The unit as `status` says it: its `build` line (`0.4.0 de07edf9`),
whether the project has unsaved changes, its bank 2 line (`open 0.4.0
de07edf9 seal=…`). A unit that didn't answer says none.
-}
type alias UnitNow =
    { build : Maybe String
    , modified : Bool
    , bank2 : Maybe String
    , selfUpdate : Maybe SelfUpdate

    -- Which unit: `status`'s `unit <24 hex>` (the chip's UID; bank 2 open,
    -- 0.4.1 on). None means it can't say, never that it is another.
    , unit : Maybe String
    }


{-| A unit that writes its own firmware from the card (ADR 0344, 0.4.1 on):
`status` says `selfupdate <n>`. With it the update is `put` CHIMERA.BK2
(skipped when its seal is the one installed), `put /CHIMERA.BIN`, `bank1
install <size> <crc>`, the restart and `status`: no DFU, no device to pick,
no Windows driver. Without it (0.4.0, or bank 2 closed), the DFU path.
-}
type alias SelfUpdate =
    { version : Int }


selfUpdateOf : List String -> Maybe SelfUpdate
selfUpdateOf lines =
    lines
        |> List.filterMap
            (\l ->
                case String.words l of
                    [ "selfupdate", n ] ->
                        String.toInt n
                            |> Maybe.andThen
                                (\v ->
                                    if v >= 1 then
                                        Just { version = v }

                                    else
                                        Nothing
                                )

                    _ ->
                        Nothing
            )
        |> List.head


{-| Where CHIMERA.BIN goes for the unit's own install: the card's root.
-}
binRemote : String
binRemote =
    "/CHIMERA.BIN"


{-| A unit's identity: 24 lowercase hex digits, the H750's 96-bit UID.
-}
unitId : String -> Maybe String
unitId s =
    if String.length s == 24 && String.all Char.isHexDigit s then
        Just (String.toLower s)

    else
        Nothing


{-| The unit that answered after a restart isn't the one being updated:
both said who they are, and they differ. A unit that can't say is not
another.
-}
otherUnit : UnitNow -> Answer -> Maybe String
otherUnit u a =
    case a of
        Said lines _ ->
            case ( u.unit, (readStatus lines).unit ) of
                ( Just was, Just now ) ->
                    if was /= now then
                        Just now

                    else
                        Nothing

                ( Just _, Nothing ) ->
                    Nothing

                ( Nothing, _ ) ->
                    Nothing

        NoAnswer ->
            Nothing

        Gone ->
            Nothing


{-| The loaded project, as `ed since` names it: its id and generation, the
witness an `ed project load … discard` takes.
-}
type alias Loaded =
    { id : Int, gen : Int }


{-| A version as a release names it, `0.4.1 abcd1234`: compared by its
numbers, its build hash telling two builds of one version apart.
-}
type alias Version =
    { major : Int, minor : Int, patch : Int, build : String }


parseVersion : String -> Maybe Version
parseVersion s =
    case String.words (trimPlus s) of
        [ numbers, build ] ->
            case List.map String.toInt (String.split "." numbers) of
                [ Just major, Just minor, Just patch ] ->
                    Just { major = major, minor = minor, patch = patch, build = build }

                _ ->
                    Nothing

        [] ->
            Nothing

        [ _ ] ->
            Nothing

        _ :: _ :: _ :: _ ->
            Nothing


type Source
    = Latest
    | Chosen


{-| A pair checked against its SHA256SUMS and as one build (`update.js`):
the .bk2's version (`0.4.1 abcd1234`), its seal, its format, the sizes,
and each file's SHA-256, which every write names so the bytes written are
the ones confirmed.
-}
type alias Release =
    { version : String
    , seal : String
    , format : Int
    , binSize : Int
    , bk2Size : Int
    , binSha : String
    , bk2Sha : String
    , binCrc : String
    , source : Source
    }


type ReleaseState
    = Fetching
    | Got Release
    | Missing String


{-| Where CHIMERA.BK2 is: on the card before the flash, or still to go after it.
-}
type Bk2
    = Staged
    | AfterFlash


type alias Progress =
    { done : Int, total : Int }


{-| Whether the firmware area has been touched: an earlier write was cut
off (WRITE AGAIN), or the unit was found sitting in update mode (FINISH
THE UPDATE), and so may hold half an image. Only `Untouched` may say
nothing was written, or that unplugging starts the old firmware again.
-}
type Flash
    = Untouched
    | Touched


{-| The unit in update mode: where CHIMERA.BK2 is, and the firmware area's state.
-}
type alias InDfu =
    { bk2 : Bk2, flash : Flash }


{-| Before this write.
-}
type PreRun
    = Checking
      -- Unsaved changes: the loaded project read (`ed since`, paged), then saved or dropped.
    | ReadingProject
    | Saving Bool
    | Discarding
    | Settling Int
    | Copying Progress
      -- The self-update path: CHIMERA.BIN onto the card, then the unit's own install.
    | CopyingBin Progress
    | InstallingSelf
    | EnteringDfu Bk2
    | FindingDevice Bk2
      -- The browser asks which device: a click.
    | PickingDevice InDfu


{-| After the firmware area was written.
-}
type PostRun
    = Restarting
      -- The unit writing its own bank 1, restarting, installing bank 2.
    | RestartingSelf
    | CopyingLate Progress
    | Installing Int
    | RestartingAfterInstall
    | Verifying


type Run
    = Pre PreRun
    | Writing InDfu Progress
    | Post Bk2 PostRun


{-| A stop before the write: the flash is as it was.
-}
type PreFail
    = Unsaved (Maybe Loaded)
    | NothingFlashed String
      -- `dfu` unanswered: the unit may be in update mode, its screen dark.
    | DfuSilent Bk2
      -- In update mode, nothing written: no device picked, the wrong one, one that won't open, a guard.
    | PickCancelled InDfu
    | WrongDevice InDfu String
    | CantOpen InDfu
    | Guarded InDfu String
    | GarbledBefore String
      -- The self-update path: `bank1 install` refused (nothing written), or
      -- the unit back on its old firmware after aborting the install.
    | SelfRefused String
    | SelfAborted String


{-| A stop once the write started: the firmware area is not what it was.
-}
type PostFail
    = WriteCut String
    | LeaveFailed String
    | NotBack String
    | Unfinished String
    | GarbledAfter String
      -- The self-update's restart not back in three minutes.
    | SelfNotBack String
      -- Another unit answered after the restart (its `unit`).
    | OtherUnit String


type Stage
    = Opening
    | Reading (Maybe UnitNow) ReleaseState
    | Ready UnitNow ReleaseState
      -- CHOOSE FILES' chooser open; what was there before, for a cancel.
    | Choosing UnitNow ReleaseState
    | Confirm UnitNow Release
    | Running UnitNow Release Run
    | Done UnitNow Release UnitNow
    | StoppedBefore UnitNow Release PreFail
    | StoppedAfter UnitNow Release Bk2 PostFail
    | NoLink
    | Closing


{-| Opened on a connected unit, or for a unit already sitting in update
mode (the connect page's FINISH THE UPDATE): no console to ask first.
-}
type Mode
    = Connected
    | Stuck


type alias Fields =
    { stage : Stage, windows : Bool, webusb : Bool, mode : Mode }


type Model
    = Model Fields



-- WHAT GOES TO update.js, AND WHAT COMES BACK


{-| Which request a console answer belongs to.
-}
type Ticket
    = TStatus
    | TProject
    | TSave
    | TPut
    | TPutBin
    | TSelf
    | TDfu
    | TInstall
    | TVerify


type Request
    = Begin
    | FetchLatest
    | ChooseFiles
      -- The ticket, the line, the first byte's wait (ms), a delay before it (ms).
    | Ask Ticket String Int Int
    | Put Release
    | PutBin Release String
    | Dfu
    | FindDevice Int
    | PickDevice
    | Write Release
      -- The wait for the console: its seconds, whether a restart comes first,
      -- and the unit's identity (`status`'s `unit`) to pick its port by.
    | Back Int Bool (Maybe String)
    | PickPort
    | Hold Bool
    | End


{-| A console answer: its body and its OK or ERR line; none in time; or the link gone.
-}
type Answer
    = Said (List String) String
    | NoAnswer
    | Gone


type Device
    = Found
    | NotFound
    | Cancelled
    | Wrong String
    | NoWebUsb


{-| A write's outcome; `Bool`: whether it had started (an erase sent).
-}
type WriteResult
    = WriteOk
    | Unopenable
    | Cut Bool String
    | Refused Bool String
    | GuardRefused String
    | LeaveFail String


type Event
    = Begun { open : Bool, webusb : Bool, windows : Bool }
    | ReleaseIs (Result String Release)
    | ReleaseCancelled
    | Answered Ticket Answer
    | Copied Progress
    | Written Progress
    | DeviceIs Device
    | WriteDone WriteResult
    | BackDone (Result String Answer)
    | Mismatch String
    | Ended String
      -- What `update.js` said and this editor can't read.
    | Garbled String
      -- An answer for the offer on connect, not for an update: changes nothing here.
    | Unrelated


type Msg
    = FromJs D.Value
    | Choose
    | Start
    | Go
    | Cancel
    | Pick
    | WriteAgain
    | CheckAgain
    | TryAgain
    | ConnectPort
    | SaveAndUpdate
    | DiscardAndUpdate
    | UseDfu
    | Close



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
stage (Model m) =
    m.stage


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
        (\v ->
            case D.decodeValue (D.field "op" D.string) v of
                Ok "latest" ->
                    toMsg (D.decodeValue (D.field "version" D.string) v |> Result.toMaybe)

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
        e : Maybe Event
        e =
            case msg of
                FromJs v ->
                    Just (decode v)

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
            case e of
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
    ( next, send (held ++ reqs), Maybe.andThen endedLink e )


endedLink : Event -> Maybe String
endedLink e =
    case e of
        Ended l ->
            Just l

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


{-| Whether the tab is held: while anything past CHECKING runs.
-}
holding : Model -> Bool
holding (Model m) =
    case runningOf m.stage of
        Just ( _, _, Pre Checking ) ->
            False

        Just ( _, _, Pre ReadingProject ) ->
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


hand : Msg -> Model -> ( Model, List Request )
hand msg ((Model m) as model) =
    let
        ignore : ( Model, List Request )
        ignore =
            ( model, [] )

        go : Stage -> List Request -> ( Model, List Request )
        go s reqs =
            ( Model { m | stage = s }, reqs )

        pickAgain : ( UnitNow, Release, PreFail ) -> ( Model, List Request )
        pickAgain ( u, r, f ) =
            case inUpdateMode f of
                Just d ->
                    go (Running u r (Pre (PickingDevice d))) [ PickDevice ]

                Nothing ->
                    ignore
    in
    case msg of
        FromJs _ ->
            ignore

        Choose ->
            case readyOf m.stage of
                Just ( u, rel ) ->
                    go (Choosing u rel) [ ChooseFiles ]

                Nothing ->
                    ignore

        Start ->
            case readyOf m.stage of
                Just ( u, Got r ) ->
                    go (Confirm u r) []

                Just ( _, Fetching ) ->
                    ignore

                Just ( _, Missing _ ) ->
                    ignore

                Nothing ->
                    ignore

        Go ->
            case confirmOf m.stage of
                Just ( u, r ) ->
                    case m.mode of
                        Connected ->
                            go (Running u r (Pre Checking)) [ status TStatus 0 ]

                        -- Already in update mode: the device first (a click).
                        -- It may hold half an image: touched until written whole.
                        Stuck ->
                            go (Running u r (Pre (PickingDevice { bk2 = AfterFlash, flash = Touched }))) []

                Nothing ->
                    ignore

        Cancel ->
            case ( confirmOf m.stage, pickingOf m.stage, unsavedOf m.stage ) of
                ( Just ( u, r ), _, _ ) ->
                    go (Ready u (Got r)) []

                ( Nothing, Just ( u, r, b ), _ ) ->
                    go (StoppedBefore u r (PickCancelled b)) []

                -- Unsaved changes, and the user keeps them: back to the offer.
                ( Nothing, Nothing, Just ( u, r, _ ) ) ->
                    go (Ready u (Got r)) []

                ( Nothing, Nothing, Nothing ) ->
                    ignore

        SaveAndUpdate ->
            case unsavedOf m.stage of
                Just ( u, r, _ ) ->
                    go (Running u r (Pre (Saving False))) [ Ask TSave "ed project save" 15000 0 ]

                Nothing ->
                    ignore

        DiscardAndUpdate ->
            case unsavedOf m.stage of
                Just ( u, r, Just l ) ->
                    go (Running u r (Pre Discarding)) [ Ask TSave ("ed project load " ++ String.fromInt l.id ++ " " ++ String.fromInt l.gen ++ " discard") 15000 0 ]

                Just ( _, _, Nothing ) ->
                    ignore

                Nothing ->
                    ignore

        Pick ->
            case ( pickingOf m.stage, stoppedBeforeOf m.stage ) of
                ( Just _, _ ) ->
                    ( model, [ PickDevice ] )

                ( Nothing, Just stopped ) ->
                    pickAgain stopped

                ( Nothing, Nothing ) ->
                    ignore

        -- The click is the chooser's gesture: the device is picked again.
        WriteAgain ->
            case ( stoppedBeforeOf m.stage, stoppedAfterOf m.stage ) of
                ( Just stopped, _ ) ->
                    pickAgain stopped

                ( Nothing, Just ( u, r, ( b, WriteCut _ ) ) ) ->
                    go (Running u r (Pre (PickingDevice { bk2 = b, flash = Touched }))) [ PickDevice ]

                ( Nothing, Just ( _, _, ( _, LeaveFailed _ ) ) ) ->
                    ignore

                ( Nothing, Just ( _, _, ( _, NotBack _ ) ) ) ->
                    ignore

                ( Nothing, Just ( _, _, ( _, Unfinished _ ) ) ) ->
                    ignore

                ( Nothing, Just ( _, _, ( _, GarbledAfter _ ) ) ) ->
                    ignore

                ( Nothing, Just ( _, _, ( _, SelfNotBack _ ) ) ) ->
                    ignore

                ( Nothing, Just ( _, _, ( _, OtherUnit _ ) ) ) ->
                    ignore

                ( Nothing, Nothing ) ->
                    ignore

        -- After the write, both ask the unit what it runs now: the link
        -- opened again, `status`, and the install from there.
        CheckAgain ->
            afterAgain m.stage |> Maybe.map (\( s, reqs ) -> go s reqs) |> Maybe.withDefault ignore

        TryAgain ->
            case stoppedBeforeOf m.stage of
                Just ( u, r, f ) ->
                    case f of
                        Unsaved _ ->
                            go (Running u r (Pre Checking)) [ status TStatus 0 ]

                        NothingFlashed _ ->
                            go (Running u r (Pre Checking)) [ status TStatus 0 ]

                        GarbledBefore _ ->
                            go (Running u r (Pre Checking)) [ status TStatus 0 ]

                        DfuSilent _ ->
                            go (Running u r (Pre Checking)) [ status TStatus 0 ]

                        SelfRefused _ ->
                            go (Running u r (Pre Checking)) [ status TStatus 0 ]

                        SelfAborted _ ->
                            go (Running u r (Pre Checking)) [ status TStatus 0 ]

                        PickCancelled _ ->
                            ignore

                        WrongDevice _ _ ->
                            ignore

                        CantOpen _ ->
                            ignore

                        Guarded _ _ ->
                            ignore

                Nothing ->
                    afterAgain m.stage |> Maybe.map (\( s, reqs ) -> go s reqs) |> Maybe.withDefault ignore

        ConnectPort ->
            case stoppedAfterOf m.stage of
                Just ( u, r, ( b, _ ) ) ->
                    go (Running u r (Post b Restarting)) [ PickPort, Back 120 False u.unit ]

                Nothing ->
                    ignore

        -- The self-update refused or undone: the same update by DFU instead.
        UseDfu ->
            case stoppedBeforeOf m.stage of
                Just ( u, r, SelfRefused _ ) ->
                    go (Running { u | selfUpdate = Nothing } r (Pre Checking)) [ status TStatus 0 ]

                Just ( u, r, SelfAborted _ ) ->
                    go (Running { u | selfUpdate = Nothing } r (Pre Checking)) [ status TStatus 0 ]

                Just ( _, _, Unsaved _ ) ->
                    ignore

                Just ( _, _, NothingFlashed _ ) ->
                    ignore

                Just ( _, _, DfuSilent _ ) ->
                    ignore

                Just ( _, _, PickCancelled _ ) ->
                    ignore

                Just ( _, _, WrongDevice _ _ ) ->
                    ignore

                Just ( _, _, CantOpen _ ) ->
                    ignore

                Just ( _, _, Guarded _ _ ) ->
                    ignore

                Just ( _, _, GarbledBefore _ ) ->
                    ignore

                Nothing ->
                    ignore

        Close ->
            let
                closing : ( Model, List Request )
                closing =
                    go Closing [ End ]
            in
            case m.stage of
                -- Never mid-update: the page has no CLOSE then.
                Running _ _ _ ->
                    ignore

                Closing ->
                    ignore

                Choosing _ _ ->
                    ignore

                Opening ->
                    closing

                Reading _ _ ->
                    closing

                Ready _ _ ->
                    closing

                Confirm _ _ ->
                    closing

                Done _ _ _ ->
                    closing

                StoppedBefore _ _ _ ->
                    closing

                StoppedAfter _ _ _ _ ->
                    closing

                NoLink ->
                    closing


{-| A stop after the write, asked again: the unit's own state decides.
-}
afterAgain : Stage -> Maybe ( Stage, List Request )
afterAgain s =
    stoppedAfterOf s
        |> Maybe.andThen
            (\( u, r, ( b, f ) ) ->
                case f of
                    WriteCut _ ->
                        Nothing

                    LeaveFailed _ ->
                        Just ( Running u r (Post b Restarting), [ Back 120 False u.unit ] )

                    NotBack _ ->
                        Just ( Running u r (Post b Restarting), [ Back 120 False u.unit ] )

                    Unfinished _ ->
                        Just ( Running u r (Post b Restarting), [ Back 120 False u.unit ] )

                    GarbledAfter _ ->
                        Just ( Running u r (Post b Restarting), [ Back 120 False u.unit ] )

                    SelfNotBack _ ->
                        Just ( Running u r (Post b RestartingSelf), [ Back 180 False u.unit ] )

                    OtherUnit _ ->
                        Just ( Running u r (Post b Restarting), [ Back 120 False u.unit ] )
            )


{-| A stop that left the unit in update mode with nothing written: its DFU
device can be picked again.
-}
inUpdateMode : PreFail -> Maybe InDfu
inUpdateMode f =
    case f of
        DfuSilent b ->
            Just { bk2 = b, flash = Untouched }

        PickCancelled d ->
            Just d

        WrongDevice d _ ->
            Just d

        CantOpen d ->
            Just d

        Guarded d _ ->
            Just d

        Unsaved _ ->
            Nothing

        NothingFlashed _ ->
            Nothing

        GarbledBefore _ ->
            Nothing

        SelfRefused _ ->
            Nothing

        SelfAborted _ ->
            Nothing


{-| A stop on unsaved changes: the loaded project, if it can be reloaded.
-}
unsavedOf : Stage -> Maybe ( UnitNow, Release, Maybe Loaded )
unsavedOf s =
    case stoppedBeforeOf s of
        Just ( u, r, Unsaved l ) ->
            Just ( u, r, l )

        Just ( _, _, NothingFlashed _ ) ->
            Nothing

        Just ( _, _, DfuSilent _ ) ->
            Nothing

        Just ( _, _, PickCancelled _ ) ->
            Nothing

        Just ( _, _, WrongDevice _ _ ) ->
            Nothing

        Just ( _, _, CantOpen _ ) ->
            Nothing

        Just ( _, _, Guarded _ _ ) ->
            Nothing

        Just ( _, _, GarbledBefore _ ) ->
            Nothing

        Just ( _, _, SelfRefused _ ) ->
            Nothing

        Just ( _, _, SelfAborted _ ) ->
            Nothing

        Nothing ->
            Nothing


readyOf : Stage -> Maybe ( UnitNow, ReleaseState )
readyOf s =
    case s of
        Ready u rel ->
            Just ( u, rel )

        Opening ->
            Nothing

        Reading _ _ ->
            Nothing

        Choosing _ _ ->
            Nothing

        Confirm _ _ ->
            Nothing

        Running _ _ _ ->
            Nothing

        Done _ _ _ ->
            Nothing

        StoppedBefore _ _ _ ->
            Nothing

        StoppedAfter _ _ _ _ ->
            Nothing

        NoLink ->
            Nothing

        Closing ->
            Nothing


confirmOf : Stage -> Maybe ( UnitNow, Release )
confirmOf s =
    case s of
        Confirm u r ->
            Just ( u, r )

        Opening ->
            Nothing

        Reading _ _ ->
            Nothing

        Ready _ _ ->
            Nothing

        Choosing _ _ ->
            Nothing

        Running _ _ _ ->
            Nothing

        Done _ _ _ ->
            Nothing

        StoppedBefore _ _ _ ->
            Nothing

        StoppedAfter _ _ _ _ ->
            Nothing

        NoLink ->
            Nothing

        Closing ->
            Nothing


pickingOf : Stage -> Maybe ( UnitNow, Release, InDfu )
pickingOf s =
    case runningOf s of
        Just ( u, r, Pre (PickingDevice b) ) ->
            Just ( u, r, b )

        Just ( _, _, Pre Checking ) ->
            Nothing

        Just ( _, _, Pre ReadingProject ) ->
            Nothing

        Just ( _, _, Pre (Saving _) ) ->
            Nothing

        Just ( _, _, Pre Discarding ) ->
            Nothing

        Just ( _, _, Pre (Settling _) ) ->
            Nothing

        Just ( _, _, Pre (Copying _) ) ->
            Nothing

        Just ( _, _, Pre (CopyingBin _) ) ->
            Nothing

        Just ( _, _, Pre InstallingSelf ) ->
            Nothing

        Just ( _, _, Pre (EnteringDfu _) ) ->
            Nothing

        Just ( _, _, Pre (FindingDevice _) ) ->
            Nothing

        Just ( _, _, Writing _ _ ) ->
            Nothing

        Just ( _, _, Post _ _ ) ->
            Nothing

        Nothing ->
            Nothing


runningOf : Stage -> Maybe ( UnitNow, Release, Run )
runningOf s =
    case s of
        Running u r run ->
            Just ( u, r, run )

        Opening ->
            Nothing

        Reading _ _ ->
            Nothing

        Ready _ _ ->
            Nothing

        Choosing _ _ ->
            Nothing

        Confirm _ _ ->
            Nothing

        Done _ _ _ ->
            Nothing

        StoppedBefore _ _ _ ->
            Nothing

        StoppedAfter _ _ _ _ ->
            Nothing

        NoLink ->
            Nothing

        Closing ->
            Nothing


stoppedBeforeOf : Stage -> Maybe ( UnitNow, Release, PreFail )
stoppedBeforeOf s =
    case s of
        StoppedBefore u r f ->
            Just ( u, r, f )

        Opening ->
            Nothing

        Reading _ _ ->
            Nothing

        Ready _ _ ->
            Nothing

        Choosing _ _ ->
            Nothing

        Confirm _ _ ->
            Nothing

        Running _ _ _ ->
            Nothing

        Done _ _ _ ->
            Nothing

        StoppedAfter _ _ _ _ ->
            Nothing

        NoLink ->
            Nothing

        Closing ->
            Nothing


stoppedAfterOf : Stage -> Maybe ( UnitNow, Release, ( Bk2, PostFail ) )
stoppedAfterOf s =
    case s of
        StoppedAfter u r b f ->
            Just ( u, r, ( b, f ) )

        Opening ->
            Nothing

        Reading _ _ ->
            Nothing

        Ready _ _ ->
            Nothing

        Choosing _ _ ->
            Nothing

        Confirm _ _ ->
            Nothing

        Running _ _ _ ->
            Nothing

        Done _ _ _ ->
            Nothing

        StoppedBefore _ _ _ ->
            Nothing

        NoLink ->
            Nothing

        Closing ->
            Nothing


{-| An event, as one record of what it carries: each step reads only the
field it waits for, so an answer it isn't waiting for changes nothing.
-}
type alias In =
    { begun : Maybe { open : Bool, webusb : Bool, windows : Bool }
    , release : Maybe (Result String Release)
    , cancelled : Bool
    , answer : Maybe ( Ticket, Answer )
    , copied : Maybe Progress
    , written : Maybe Progress
    , device : Maybe Device
    , write : Maybe WriteResult
    , back : Maybe (Result String Answer)
    , broken : Maybe String
    }


classify : Event -> In
classify e =
    let
        none : In
        none =
            { begun = Nothing, release = Nothing, cancelled = False, answer = Nothing, copied = Nothing, written = Nothing, device = Nothing, write = Nothing, back = Nothing, broken = Nothing }
    in
    case e of
        Begun b ->
            { none | begun = Just b }

        ReleaseIs r ->
            { none | release = Just r }

        ReleaseCancelled ->
            { none | cancelled = True }

        Answered t a ->
            { none | answer = Just ( t, a ) }

        Copied p ->
            { none | copied = Just p }

        Written p ->
            { none | written = Just p }

        DeviceIs d ->
            { none | device = Just d }

        WriteDone w ->
            { none | write = Just w }

        BackDone b ->
            { none | back = Just b }

        Mismatch why ->
            { none | broken = Just why }

        Garbled why ->
            { none | broken = Just why }

        Ended _ ->
            none

        Unrelated ->
            none


answerFor : Ticket -> In -> Maybe Answer
answerFor t i =
    i.answer
        |> Maybe.andThen
            (\( got, a ) ->
                if got == t then
                    Just a

                else
                    Nothing
            )


{-| What came back from `update.js`, against where the update is.
-}
step : Event -> Model -> ( Model, List Request )
step e ((Model m) as model) =
    let
        i : In
        i =
            classify e

        ignore : ( Model, List Request )
        ignore =
            ( model, [] )

        to : Stage -> ( Model, List Request )
        to s =
            ( Model { m | stage = s }, [] )
    in
    case m.stage of
        Opening ->
            case i.begun of
                Just b ->
                    let
                        fields : Fields
                        fields =
                            { m | windows = b.windows, webusb = b.webusb }
                    in
                    case ( m.mode, b.open ) of
                        ( Stuck, _ ) ->
                            ( Model { fields | stage = Reading (Just (readStatus [])) Fetching }, [ FetchLatest ] )

                        ( Connected, True ) ->
                            ( Model { fields | stage = Reading Nothing Fetching }, [ status TStatus 0, FetchLatest ] )

                        ( Connected, False ) ->
                            ( Model { fields | stage = NoLink }, [] )

                Nothing ->
                    ignore

        Reading u rel ->
            case ( answerFor TStatus i, i.release ) of
                ( Just a, _ ) ->
                    reading (Just (unitOf a)) rel m

                ( Nothing, Just r ) ->
                    reading u (releaseState r) m

                ( Nothing, Nothing ) ->
                    ignore

        Choosing u prev ->
            case ( i.release, i.cancelled ) of
                ( Just r, _ ) ->
                    to (Ready u (releaseState r))

                -- A cancelled chooser keeps what was there.
                ( Nothing, True ) ->
                    to (Ready u prev)

                ( Nothing, False ) ->
                    ignore

        Running u r run ->
            case i.broken of
                Just why ->
                    -- Fail closed: a step that can't read its answer stops,
                    -- on the side of the write it is on.
                    case run of
                        Pre _ ->
                            to (StoppedBefore u r (GarbledBefore why))

                        Writing at _ ->
                            to (StoppedAfter u r at.bk2 (GarbledAfter why))

                        Post b _ ->
                            to (StoppedAfter u r b (GarbledAfter why))

                Nothing ->
                    running i u r run m

        Ready _ _ ->
            ignore

        Confirm _ _ ->
            ignore

        Done _ _ _ ->
            ignore

        StoppedBefore _ _ _ ->
            ignore

        StoppedAfter _ _ _ _ ->
            ignore

        NoLink ->
            ignore

        Closing ->
            ignore


status : Ticket -> Int -> Request
status t delay =
    Ask t "status" 2000 delay


install : Int -> Request
install delay =
    Ask TInstall "bank2 install" 120000 delay


{-| A step, unless the console that answered after a restart is another
unit's (both said who they are): then it stops, whatever the step.
-}
running : In -> UnitNow -> Release -> Run -> Fields -> ( Model, List Request )
running i u r run m =
    let
        answered : Maybe Answer
        answered =
            case ( i.back, answerFor TVerify i ) of
                ( Just (Ok a), _ ) ->
                    Just a

                ( Just (Err _), v ) ->
                    v

                ( Nothing, v ) ->
                    v

        after : Maybe Bk2
        after =
            case run of
                Post b _ ->
                    Just b

                Pre _ ->
                    Nothing

                Writing _ _ ->
                    Nothing
    in
    case ( after, answered |> Maybe.andThen (otherUnit u) ) of
        ( Just b, Just id ) ->
            ( Model { m | stage = StoppedAfter u r b (OtherUnit id) }, [] )

        ( Just _, Nothing ) ->
            runningOn i u r run m

        ( Nothing, _ ) ->
            runningOn i u r run m


runningOn : In -> UnitNow -> Release -> Run -> Fields -> ( Model, List Request )
runningOn i u r run m =
    let
        ignore : ( Model, List Request )
        ignore =
            ( Model m, [] )

        to : Run -> List Request -> ( Model, List Request )
        to next reqs =
            ( Model { m | stage = Running u r next }, reqs )

        before : PreFail -> ( Model, List Request )
        before f =
            ( Model { m | stage = StoppedBefore u r f }, [] )

        after : Bk2 -> PostFail -> ( Model, List Request )
        after b f =
            ( Model { m | stage = StoppedAfter u r b f }, [] )

        -- The self-update's bar counts both files.
        both : Int
        both =
            r.bk2Size + r.binSize

        -- The first copy: CHIMERA.BK2, unless a self-updating unit already has
        -- its seal open (then CHIMERA.BIN straight away).
        copyFirst : ( Model, List Request )
        copyFirst =
            case ( u.selfUpdate, sealOpen r u ) of
                ( Just _, True ) ->
                    to (Pre (CopyingBin { done = r.bk2Size, total = both })) [ PutBin r binRemote ]

                ( Just _, False ) ->
                    to (Pre (Copying { done = 0, total = both })) [ Put r ]

                ( Nothing, _ ) ->
                    to (Pre (Copying { done = 0, total = r.bk2Size })) [ Put r ]

        device : InDfu -> Device -> ( Model, List Request )
        device at d =
            case d of
                Found ->
                    to (Writing at { done = 0, total = 1 }) [ Write r ]

                NotFound ->
                    to (Pre (PickingDevice at)) []

                Cancelled ->
                    before (PickCancelled at)

                Wrong why ->
                    before (WrongDevice at why)

                NoWebUsb ->
                    before (CantOpen at)
    in
    case run of
        -- CHECKING: unsaved changes stop it; a unit too old to say goes on, as the script does.
        Pre Checking ->
            case answerFor TStatus i of
                Just Gone ->
                    before (NothingFlashed "The unit isn't connected")

                Just ((Said _ _) as a) ->
                    if (unitOf a).modified then
                        to (Pre ReadingProject) [ Ask TProject "ed since 0" 2000 0 ]

                    else
                        copyFirst

                Just NoAnswer ->
                    copyFirst

                Nothing ->
                    ignore

        -- The project line may be on a later page of `ed since`.
        Pre ReadingProject ->
            case answerFor TProject i of
                Just (Said lines end) ->
                    case ( loadedOf lines, String.words end ) of
                        ( Just l, _ ) ->
                            before (Unsaved l)

                        ( Nothing, [ "OK", next, "more" ] ) ->
                            to (Pre ReadingProject) [ Ask TProject ("ed since " ++ next) 2000 0 ]

                        ( Nothing, _ ) ->
                            before (Unsaved Nothing)

                Just NoAnswer ->
                    before (Unsaved Nothing)

                Just Gone ->
                    before (NothingFlashed "The unit isn't connected")

                Nothing ->
                    ignore

        -- A project never saved has no file of its own: saved as BEFORE_UPDATE.
        Pre (Saving asNew) ->
            case answerFor TSave i of
                Just (Said _ end) ->
                    if isOk end then
                        to (Pre (Settling 0)) [ status TStatus 500 ]

                    else if not asNew && String.contains "no file of its own" end then
                        to (Pre (Saving True)) [ Ask TSave "ed project saveas BEFORE_UPDATE" 15000 0 ]

                    else
                        before (NothingFlashed ("The project couldn't be saved: " ++ end))

                Just NoAnswer ->
                    before (NothingFlashed "The unit didn't answer the save")

                Just Gone ->
                    before (NothingFlashed "The unit was disconnected during the save")

                Nothing ->
                    ignore

        Pre Discarding ->
            case answerFor TSave i of
                Just (Said _ end) ->
                    if isOk end then
                        to (Pre (Settling 0)) [ status TStatus 500 ]

                    else
                        before (NothingFlashed ("The changes couldn't be discarded: " ++ end))

                Just NoAnswer ->
                    before (NothingFlashed "The unit didn't answer the reload")

                Just Gone ->
                    before (NothingFlashed "The unit was disconnected during the reload")

                Nothing ->
                    ignore

        -- The save or reload is the unit's card work: `status` until the project is clean.
        Pre (Settling n) ->
            case answerFor TStatus i of
                Just ((Said _ _) as a) ->
                    if not (unitOf a).modified then
                        copyFirst

                    else if n < 20 then
                        to (Pre (Settling (n + 1))) [ status TStatus 500 ]

                    else
                        before (Unsaved Nothing)

                Just NoAnswer ->
                    if n < 20 then
                        to (Pre (Settling (n + 1))) [ status TStatus 500 ]

                    else
                        before (NothingFlashed "The unit stopped answering after the save")

                Just Gone ->
                    before (NothingFlashed "The unit was disconnected after the save")

                Nothing ->
                    ignore

        Pre (Copying _) ->
            case ( i.copied, answerFor TPut i ) of
                ( Just p, _ ) ->
                    to (Pre (Copying { p | total = Maybe.withDefault p.total (Maybe.map (\_ -> both) u.selfUpdate) })) []

                ( Nothing, Just a ) ->
                    case ( staging r a, u.selfUpdate ) of
                        -- A unit that writes its own firmware: CHIMERA.BIN onto the card next.
                        ( Ok Staged, Just _ ) ->
                            to (Pre (CopyingBin { done = r.bk2Size, total = both })) [ PutBin r binRemote ]

                        ( Ok b, _ ) ->
                            to (Pre (EnteringDfu b)) [ Dfu ]

                        ( Err why, _ ) ->
                            before (NothingFlashed why)

                ( Nothing, Nothing ) ->
                    ignore

        Pre (CopyingBin _) ->
            case ( i.copied, answerFor TPutBin i ) of
                ( Just p, _ ) ->
                    to (Pre (CopyingBin { done = r.bk2Size + p.done, total = both })) []

                ( Nothing, Just (Said _ end) ) ->
                    if isOk end then
                        to (Pre InstallingSelf) [ Ask TSelf ("bank1 install " ++ String.fromInt r.binSize ++ " " ++ r.binCrc) 120000 0 ]

                    else
                        before (NothingFlashed ("The unit refused CHIMERA.BIN: " ++ end))

                ( Nothing, Just NoAnswer ) ->
                    before (NothingFlashed "The unit stopped answering while CHIMERA.BIN was copied")

                ( Nothing, Just Gone ) ->
                    before (NothingFlashed "The unit was disconnected while CHIMERA.BIN was copied")

                ( Nothing, Nothing ) ->
                    ignore

        -- `bank1 install`: verified and restarting (the unit writes its own
        -- bank 1, restarts, installs bank 2: up to three minutes), already
        -- installed, or refused with nothing written.
        Pre InstallingSelf ->
            case answerFor TSelf i of
                Just (Said _ end) ->
                    if String.startsWith "OK bank1 verified " end then
                        to (Post Staged RestartingSelf) [ Back 180 True u.unit ]

                    else if end == "OK already installed" then
                        to (Post Staged Verifying) [ status TVerify 0 ]

                    else if isOk end then
                        to (Post Staged RestartingSelf) [ Back 180 True u.unit ]

                    else
                        before (SelfRefused end)

                Just Gone ->
                    to (Post Staged RestartingSelf) [ Back 180 True u.unit ]

                Just NoAnswer ->
                    after Staged (SelfNotBack "it didn't answer bank1 install")

                Nothing ->
                    ignore

        -- Back as the new firmware: bank 1 written and checked (`bank1 last
        -- ok <crc>`), the build, bank 2 open; or the old firmware, untouched.
        Post b RestartingSelf ->
            case i.back of
                Just (Err cause) ->
                    after b (SelfNotBack cause)

                Just (Ok ((Said lines _) as a)) ->
                    case bank1Last lines of
                        Just ( "aborted", why ) ->
                            before (SelfAborted why)

                        Just ( "ok", crc ) ->
                            if crcEq crc r.binCrc then
                                case verdict r a of
                                    Installed now ->
                                        ( Model { m | stage = Done u r now }, [] )

                                    NeedsInstall _ ->
                                        to (Post b (Installing 1)) [ install 0 ]

                                    NotFinished why ->
                                        after b (Unfinished why)

                            else
                                after b (Unfinished ("The unit says bank1 last ok " ++ crc ++ ", not this release's CHIMERA.BIN (" ++ r.binCrc ++ ")"))

                        Just ( word, rest ) ->
                            after b (Unfinished ("The unit says bank1 last " ++ word ++ " " ++ rest))

                        Nothing ->
                            after b (Unfinished "The unit's status has no bank1 line")

                Just (Ok a) ->
                    after b (Unfinished (Maybe.withDefault "no status" (verdictWhy (verdict r a))))

                Nothing ->
                    ignore

        Pre (EnteringDfu b) ->
            case answerFor TDfu i of
                Just (Said _ end) ->
                    if isOk end then
                        to (Pre (FindingDevice b)) [ FindDevice 10 ]

                    else
                        before (NothingFlashed ("The unit refused update mode: " ++ end))

                -- Sent: the OK was lost to the reset, not refused.
                Just Gone ->
                    to (Pre (FindingDevice b)) [ FindDevice 10 ]

                Just NoAnswer ->
                    before (DfuSilent b)

                Nothing ->
                    ignore

        Pre (FindingDevice b) ->
            i.device |> Maybe.map (device { bk2 = b, flash = Untouched }) |> Maybe.withDefault ignore

        Pre (PickingDevice at) ->
            i.device |> Maybe.map (device at) |> Maybe.withDefault ignore

        Writing at _ ->
            let
                -- A write that erased, or one over an area already touched, is past "nothing written".
                cut : Bool -> String -> ( Model, List Request )
                cut started why =
                    if started || at.flash == Touched then
                        after at.bk2 (WriteCut why)

                    else
                        before (Guarded at why)
            in
            case ( i.written, i.write ) of
                ( Just p, _ ) ->
                    to (Writing at p) []

                ( Nothing, Just w ) ->
                    case w of
                        WriteOk ->
                            to (Post at.bk2 Restarting) [ Back 120 False u.unit ]

                        Unopenable ->
                            before (CantOpen at)

                        GuardRefused why ->
                            before (Guarded at why)

                        Cut started why ->
                            cut started why

                        Refused started why ->
                            cut started why

                        LeaveFail why ->
                            after at.bk2 (LeaveFailed why)

                ( Nothing, Nothing ) ->
                    ignore

        Post b Restarting ->
            case i.back of
                Just (Err cause) ->
                    after b (NotBack cause)

                Just (Ok a) ->
                    case verdict r a of
                        Installed now ->
                            ( Model { m | stage = Done u r now }, [] )

                        -- A difference from the script, kept on purpose: where
                        -- `chimera-usb.py update` stops on a staged .bk2 its first boot
                        -- didn't install, this sends `bank2 install` (the unit
                        -- installs the staged file, or says why not).
                        NeedsInstall _ ->
                            case b of
                                Staged ->
                                    to (Post b (Installing 1)) [ install 0 ]

                                AfterFlash ->
                                    to (Post b (CopyingLate { done = 0, total = r.bk2Size })) [ Put r ]

                        NotFinished why ->
                            after b (Unfinished why)

                Nothing ->
                    ignore

        Post b (CopyingLate _) ->
            case ( i.copied, answerFor TPut i ) of
                ( Just p, _ ) ->
                    to (Post b (CopyingLate p)) []

                ( Nothing, Just (Said _ end) ) ->
                    if String.startsWith "OK staged:" end then
                        after b (Unfinished (String.dropLeft 3 end ++ later))

                    else if isOk end then
                        to (Post b (Installing 1)) [ install 0 ]

                    else
                        after b (Unfinished ("Copying CHIMERA.BK2 after the flash: " ++ end))

                ( Nothing, Just NoAnswer ) ->
                    after b (Unfinished "The unit stopped answering while CHIMERA.BK2 was copied")

                ( Nothing, Just Gone ) ->
                    after b (Unfinished "The unit was disconnected while CHIMERA.BK2 was copied")

                ( Nothing, Nothing ) ->
                    ignore

        Post b (Installing tries) ->
            case answerFor TInstall i of
                Just (Said _ end) ->
                    if String.startsWith "OK bank2 open " end then
                        to (Post b RestartingAfterInstall) [ Back 60 True u.unit ]

                    else if isOk end then
                        to (Post b Verifying) [ status TVerify 0 ]

                    else if end == "ERR bank2: busy" && tries < 5 then
                        -- 0.2 s between tries, as the script waits.
                        to (Post b (Installing (tries + 1))) [ install 200 ]

                    else
                        after b (Unfinished (installRefusal end))

                -- The install may have opened the door and restarted the unit.
                Just Gone ->
                    to (Post b RestartingAfterInstall) [ Back 60 True u.unit ]

                Just NoAnswer ->
                    after b (Unfinished "The unit didn't answer bank2 install")

                Nothing ->
                    ignore

        Post b RestartingAfterInstall ->
            case i.back of
                Just (Err cause) ->
                    after b (NotBack cause)

                Just (Ok a) ->
                    finish u r b a m

                Nothing ->
                    ignore

        Post b Verifying ->
            case answerFor TVerify i of
                Just a ->
                    finish u r b a m

                Nothing ->
                    ignore


reading : Maybe UnitNow -> ReleaseState -> Fields -> ( Model, List Request )
reading u rel m =
    case ( u, rel ) of
        ( Just unit, Got _ ) ->
            ( Model { m | stage = Ready unit rel }, [] )

        ( Just unit, Missing _ ) ->
            ( Model { m | stage = Ready unit rel }, [] )

        ( Just _, Fetching ) ->
            ( Model { m | stage = Reading u rel }, [] )

        ( Nothing, _ ) ->
            ( Model { m | stage = Reading u rel }, [] )


releaseState : Result String Release -> ReleaseState
releaseState r =
    case r of
        Ok rel ->
            Got rel

        Err why ->
            Missing why


{-| The last `status`: done, or what it says instead.
-}
finish : UnitNow -> Release -> Bk2 -> Answer -> Fields -> ( Model, List Request )
finish u r b a m =
    case verdict r a of
        Installed now ->
            ( Model { m | stage = Done u r now }, [] )

        NeedsInstall said ->
            ( Model { m | stage = StoppedAfter u r b (Unfinished ("The unit says " ++ said ++ ", not bank2 open " ++ r.version ++ " seal=" ++ r.seal ++ " (a staged CHIMERA.BK2 stays on the card for the next start)")) }, [] )

        NotFinished why ->
            ( Model { m | stage = StoppedAfter u r b (Unfinished why) }, [] )


{-| Bank 2 already open with this release's seal: its .bk2 needn't go again.
-}
sealOpen : Release -> UnitNow -> Bool
sealOpen r u =
    case u.bank2 of
        Just b ->
            String.startsWith "open " b && String.endsWith (" seal=" ++ r.seal) b

        Nothing ->
            False


{-| `status`'s `bank1 last <ok|aborted|…> <rest>`.
-}
bank1Last : List String -> Maybe ( String, String )
bank1Last lines =
    lines
        |> List.filterMap
            (\l ->
                case String.words l of
                    "bank1" :: "last" :: word :: rest ->
                        Just ( word, String.join " " rest )

                    _ ->
                        Nothing
            )
        |> List.head


{-| Two CRC-32s in hex, whatever their case or leading zeros.
-}
crcEq : String -> String -> Bool
crcEq a b =
    let
        norm : String -> String
        norm =
            String.toLower >> String.trim >> dropZeros

        dropZeros : String -> String
        dropZeros x =
            if String.startsWith "0" x && String.length x > 1 then
                dropZeros (String.dropLeft 1 x)

            else
                x
    in
    norm a == norm b


verdictWhy : Verdict -> Maybe String
verdictWhy v =
    case v of
        Installed _ ->
            Nothing

        NeedsInstall why ->
            Just why

        NotFinished why ->
            Just why


later : String
later =
    " (it installs at that firmware's next start)"


installRefusal : String -> String
installRefusal end =
    case foreignSlot end of
        Just f ->
            f

        Nothing ->
            if String.contains "staged: needs firmware" end then
                String.dropLeft 4 end ++ later

            else
                "bank2 install: " ++ end


isOk : String -> Bool
isOk l =
    l == "OK" || String.startsWith "OK " l



-- WHAT THE UNIT'S ANSWERS MEAN


{-| `status`'s lines as a `UnitNow`.
-}
readStatus : List String -> UnitNow
readStatus lines =
    let
        after : String -> Maybe String
        after key =
            lines
                |> List.filter (String.startsWith (key ++ " "))
                |> List.head
                |> Maybe.map (String.dropLeft (String.length key + 1) >> String.trim)
    in
    { build = after "build"
    , modified = List.member "state MODIFIED" lines
    , bank2 = after "bank2"
    , selfUpdate = selfUpdateOf lines
    , unit = after "unit" |> Maybe.andThen unitId
    }


{-| `ed since`'s `project "<name>" <id|new> <clean|edited> gen <g|->` line
as the loaded project's id and generation; none for a project never saved.
-}
loadedOf : List String -> Maybe (Maybe Loaded)
loadedOf lines =
    lines
        |> List.filter (String.startsWith "project \"")
        |> List.head
        |> Maybe.map
            (\l ->
                case String.words (String.dropLeft (Maybe.withDefault 0 (List.head (List.reverse (String.indexes "\"" l))) + 1) l) of
                    [ id, _, "gen", g ] ->
                        Maybe.map2 Loaded (String.toInt id) (String.toInt g)

                    _ ->
                        Nothing
            )


unitOf : Answer -> UnitNow
unitOf a =
    case a of
        Said lines end ->
            if isOk end then
                readStatus lines

            else
                readStatus []

        NoAnswer ->
            readStatus []

        Gone ->
            readStatus []


{-| The put's answer before the flash: where CHIMERA.BK2 is, or why it
stopped (nothing flashed). Firmware from before bank 2 refuses the path
with its `put` usage line (0.2, 0.3 word it otherwise: any `put takes`
naming BANK2.BK2 for a .bk2 over 512 KB), and a newer firmware judges an
older format's .bk2 not a bank-2 image: both take it after the flash.
-}
staging : Release -> Answer -> Result String Bk2
staging r a =
    case a of
        Said _ end ->
            if isOk end then
                Ok Staged

            else if oldPutRefusal end r.bk2Size then
                Ok AfterFlash

            else if String.contains "not a bank-2 image" end && r.format /= 2 then
                Ok AfterFlash

            else
                Err ("The unit refused CHIMERA.BK2: " ++ end)

        NoAnswer ->
            Err "The unit stopped answering while CHIMERA.BK2 was copied"

        Gone ->
            Err "The unit was disconnected while CHIMERA.BK2 was copied"


oldPutRefusal : String -> Int -> Bool
oldPutRefusal end bk2Size =
    List.member end
        [ "ERR put takes /CHIMERA/PROJECTS/P#######.A, /CHIMERA/SOUNDS/S#######.A [--over] or /CHIMERA/TAPES/<CRC>.SRC, its size and CRC-32 in hex"
        , "ERR put takes /CHIMERA/PROJECTS/P#######.A or /CHIMERA/SOUNDS/S#######.A [--over], its size and CRC-32 in hex"
        ]
        || (String.startsWith "ERR put takes" end && String.contains "BANK2.BK2" end && bk2Size > 512 * 1024)


type Verdict
    = Installed UnitNow
    | NeedsInstall String
    | NotFinished String


{-| chimera-usb.py's `updated`: the new firmware running (its build line's
hash, the .bk2 version's) and bank 2 open with this release's seal.
-}
verdict : Release -> Answer -> Verdict
verdict r a =
    case a of
        Said lines end ->
            if not (isOk end) then
                NotFinished ("The unit answered status with " ++ end)

            else
                let
                    u : UnitNow
                    u =
                        readStatus lines

                    hash : Maybe String
                    hash =
                        lastWord r.version

                    runs : Maybe String
                    runs =
                        u.build |> Maybe.andThen (trimPlus >> lastWord)
                in
                if hash == Nothing || runs /= hash then
                    NotFinished ("The unit says build " ++ Maybe.withDefault "(none)" u.build ++ ": the new firmware (" ++ r.version ++ ") isn't the one running")

                else
                    case u.bank2 of
                        Just b ->
                            case foreignSlot ("bank2 " ++ b) of
                                Just f ->
                                    NotFinished f

                                Nothing ->
                                    if String.startsWith "open " b && String.endsWith (" seal=" ++ r.seal) b then
                                        Installed u

                                    else
                                        NeedsInstall ("bank2 " ++ b)

                        Nothing ->
                            NeedsInstall "no bank2 line"

        NoAnswer ->
            NotFinished "The unit didn't answer status"

        Gone ->
            NotFinished "The unit was disconnected"


trimPlus : String -> String
trimPlus s =
    if String.endsWith "+" s then
        String.dropRight 1 s

    else
        s


lastWord : String -> Maybe String
lastWord s =
    String.words s |> List.reverse |> List.head


foreignSlot : String -> Maybe String
foreignSlot line =
    if String.contains "slot foreign" line then
        case lastWord line of
            Just "mixer" ->
                Just "The unit's MIXER slot (0x08180000) holds other code; bank 2 not installed"

            Just "edit" ->
                Just "The unit's EDIT slot (0x081C0000) holds other code; bank 2 not installed"

            _ ->
                Nothing

    else
        Nothing


{-| The unit's version against the release's, by their numbers.
-}
type Offer
    = Newer
    | OtherBuild
    | Same
    | Older
    | Unknown


{-| `offer` for two versions as text: the unit's (`status`'s `0.4.0 de07edf9`
or `ed hello`'s `0.4.0-de07edf9`) and a release's.
-}
offerFor : String -> String -> Offer
offerFor unitBuild version =
    offer { build = Just (String.replace "-" " " unitBuild), modified = False, bank2 = Nothing, selfUpdate = Nothing, unit = Nothing } { version = version, seal = "", format = 0, binSize = 0, bk2Size = 0, binSha = "", bk2Sha = "", binCrc = "", source = Latest }


offer : UnitNow -> Release -> Offer
offer u r =
    case ( u.build |> Maybe.andThen parseVersion, parseVersion r.version ) of
        ( Just have, Just want ) ->
            case compare ( want.major, want.minor, want.patch ) ( have.major, have.minor, have.patch ) of
                GT ->
                    Newer

                LT ->
                    Older

                EQ ->
                    if want.build == have.build then
                        Same

                    else
                        OtherBuild

        ( Nothing, _ ) ->
            Unknown

        ( Just _, Nothing ) ->
            Unknown



-- THE WIRE


ticketId : Ticket -> String
ticketId t =
    case t of
        TStatus ->
            "status"

        TProject ->
            "project"

        TSave ->
            "save"

        TPutBin ->
            "putbin"

        TSelf ->
            "self"

        TPut ->
            "put"

        TDfu ->
            "dfu"

        TInstall ->
            "install"

        TVerify ->
            "verify"


encode : Request -> E.Value
encode r =
    let
        op : String -> List ( String, E.Value ) -> E.Value
        op name rest =
            E.object (( "op", E.string name ) :: rest)
    in
    case r of
        Begin ->
            op "begin" []

        FetchLatest ->
            op "release" [ ( "how", E.string "latest" ) ]

        ChooseFiles ->
            op "release" [ ( "how", E.string "choose" ) ]

        Ask t line wait delay ->
            op "ask" [ ( "id", E.string (ticketId t) ), ( "line", E.string line ), ( "wait", E.int wait ), ( "delay", E.int delay ) ]

        Put rel ->
            op "put" [ ( "id", E.string (ticketId TPut) ), ( "file", E.string "bk2" ), ( "seal", E.string rel.seal ), ( "sha", E.string rel.bk2Sha ) ]

        PutBin rel remote ->
            op "put" [ ( "id", E.string (ticketId TPutBin) ), ( "file", E.string "bin" ), ( "remote", E.string remote ), ( "seal", E.string rel.seal ), ( "sha", E.string rel.binSha ) ]

        Dfu ->
            op "dfu" [ ( "id", E.string (ticketId TDfu) ) ]

        FindDevice secs ->
            op "findDevice" [ ( "secs", E.int secs ) ]

        PickDevice ->
            op "pickDevice" []

        Write rel ->
            op "write" [ ( "seal", E.string rel.seal ), ( "sha", E.string rel.binSha ) ]

        Back secs restart unit ->
            op "back" [ ( "secs", E.int secs ), ( "restart", E.bool restart ), ( "unit", Maybe.map E.string unit |> Maybe.withDefault E.null ) ]

        PickPort ->
            op "pickPort" []

        Hold on ->
            op "hold" [ ( "on", E.bool on ) ]

        End ->
            op "end" []


{-| What `update.js` said, read strictly: anything malformed is `Garbled`
with the reason, never a missing answer.
-}
decode : D.Value -> Event
decode v =
    case D.decodeValue event v of
        Ok e ->
            e

        Err err ->
            Garbled ("an answer the editor can't read (" ++ String.left 160 (D.errorToString err) ++ ")")


event : Decoder Event
event =
    D.field "op" D.string
        |> D.andThen
            (\op ->
                case op of
                    "begun" ->
                        D.map3 (\o w win -> Begun { open = o, webusb = w, windows = win })
                            (D.field "open" D.bool)
                            (D.field "webusb" D.bool)
                            (D.field "windows" D.bool)

                    "release" ->
                        D.oneOf
                            [ D.field "release" release |> D.map (Ok >> ReleaseIs)
                            , D.field "cancelled" (exactly True) |> D.map (\_ -> ReleaseCancelled)
                            , D.field "detail" D.string |> D.map (Err >> ReleaseIs)
                            ]

                    "answer" ->
                        D.map2 Answered (D.field "id" ticket) answer

                    "copied" ->
                        D.map Copied (progress "sent")

                    "written" ->
                        D.map Written (progress "done")

                    "device" ->
                        D.oneOf
                            [ D.field "found" (exactly True) |> D.map (\_ -> DeviceIs Found)
                            , D.field "unsupported" (exactly True) |> D.map (\_ -> DeviceIs NoWebUsb)
                            , D.field "cancelled" (exactly True) |> D.map (\_ -> DeviceIs Cancelled)
                            , D.field "problem" D.string |> D.map (problem >> Wrong >> DeviceIs)
                            , D.field "found" (exactly False) |> D.map (\_ -> DeviceIs NotFound)
                            ]

                    "write" ->
                        D.oneOf
                            [ D.field "ok" (exactly True) |> D.map (\_ -> WriteDone WriteOk)
                            , D.map3 writeFault
                                (D.field "fault" D.string)
                                (D.field "detail" D.string)
                                (D.field "started" D.bool)
                                |> D.andThen identity
                            ]

                    "back" ->
                        D.oneOf
                            [ D.field "cause" D.string |> D.map (backCause >> Err >> BackDone)
                            , answer |> D.map (Ok >> BackDone)
                            ]

                    "mismatch" ->
                        D.map Mismatch (D.field "detail" D.string)

                    "ended" ->
                        D.map Ended (D.field "link" D.string)

                    "latest" ->
                        D.succeed Unrelated

                    _ ->
                        D.fail ("not an update event: " ++ op)
            )


writeFault : String -> String -> Bool -> Decoder Event
writeFault kind detail started =
    case kind of
        "unopenable" ->
            D.succeed (WriteDone Unopenable)

        "refused" ->
            D.succeed (WriteDone (Refused started detail))

        "guard" ->
            D.succeed (WriteDone (GuardRefused detail))

        "lost" ->
            D.succeed (WriteDone (Cut started detail))

        "leave" ->
            D.succeed (WriteDone (LeaveFail detail))

        _ ->
            D.fail ("not a write fault: " ++ kind)


exactly : Bool -> Decoder Bool
exactly want =
    D.bool
        |> D.andThen
            (\b ->
                if b == want then
                    D.succeed b

                else
                    D.fail "not this one"
            )


ticket : Decoder Ticket
ticket =
    D.string
        |> D.andThen
            (\s ->
                case s of
                    "status" ->
                        D.succeed TStatus

                    "project" ->
                        D.succeed TProject

                    "save" ->
                        D.succeed TSave

                    "putbin" ->
                        D.succeed TPutBin

                    "self" ->
                        D.succeed TSelf

                    "put" ->
                        D.succeed TPut

                    "dfu" ->
                        D.succeed TDfu

                    "install" ->
                        D.succeed TInstall

                    "verify" ->
                        D.succeed TVerify

                    _ ->
                        D.fail ("not a request id: " ++ s)
            )


{-| A console answer: its lines and end, the link gone, or no answer in
time; each said outright (`gone`, `noAnswer`), never assumed.
-}
answer : Decoder Answer
answer =
    D.oneOf
        [ D.map2 Said (D.field "lines" (D.list D.string)) (D.field "end" D.string)
        , D.field "gone" (exactly True) |> D.map (\_ -> Gone)
        , D.field "noAnswer" (exactly True) |> D.map (\_ -> NoAnswer)
        ]


problem : String -> String
problem p =
    case p of
        "several" ->
            "More than one new STM32 DFU device is on USB: unplug the others, then press WRITE AGAIN"

        "stale" ->
            "That DFU device was already there before the unit restarted into update mode, so it isn't this unit: press WRITE AGAIN and pick the new one"

        _ ->
            "No new STM32 DFU device came up (" ++ p ++ ")"


backCause : String -> String
backCause c =
    case c of
        "several" ->
            "more than one unit's console is on USB, and the editor can't tell which is this one: unplug the others"

        "other" ->
            "no console on USB is this unit's: unplug the other units"

        "busy" ->
            "it still answers busy"

        "silent" ->
            "its console doesn't answer"

        _ ->
            "its console is not on USB"


progress : String -> Decoder Progress
progress key =
    D.map2 Progress (D.field key D.int) (D.field "total" D.int)


release : Decoder Release
release =
    D.map7 (\v seal format binSize bk2Size binSha bk2Sha -> \binCrc src -> Release v seal format binSize bk2Size binSha bk2Sha binCrc src)
        (D.field "version" D.string)
        (D.field "seal" D.string)
        (D.field "format" D.int)
        (D.field "binSize" D.int)
        (D.field "bk2Size" D.int)
        (D.field "binSha" D.string)
        (D.field "bk2Sha" D.string)
        |> D.andThen (\mk -> D.map2 mk (D.field "binCrc" D.string) source)


source : Decoder Source
source =
    D.field "source" D.string
        |> D.andThen
            (\s ->
                case s of
                    "chosen" ->
                        D.succeed Chosen

                    "latest" ->
                        D.succeed Latest

                    _ ->
                        D.fail ("not a source: " ++ s)
            )



-- VIEW


{-| The update's page: the editor's own frame (its top bar and theme), one
UPDATE module that says where the update is and what to do.
-}
view : (Page.Msg -> msg) -> (Msg -> msg) -> Page.State -> Model -> Html msg
view pageMsg toMsg page (Model m) =
    Page.view pageMsg
        page
        (Page.new "UPDATE"
            |> Page.meta (meta m.stage)
            |> Page.link (Page.Linked "UNIT · UPDATE")
            |> Page.modules
                [ Module.new Chip.Unit "UPDATE"
                    |> Module.full
                    |> Module.body [ Html.map toMsg (div [ class "upd" ] (body m)) ]
                ]
        )


meta : Stage -> String
meta s =
    case s of
        Opening ->
            "CHECKING"

        Reading _ _ ->
            "CHECKING"

        Ready _ _ ->
            "READY"

        Choosing _ _ ->
            "READY"

        Confirm _ _ ->
            "READY"

        Running _ r run ->
            runTitle r run

        Done _ _ _ ->
            "DONE"

        StoppedBefore _ _ _ ->
            "STOPPED"

        StoppedAfter _ _ _ _ ->
            "STOPPED"

        NoLink ->
            "NOT CONNECTED"

        Closing ->
            "CLOSING"


runTitle : Release -> Run -> String
runTitle r run =
    case run of
        Pre Checking ->
            "CHECKING"

        Pre ReadingProject ->
            "CHECKING"

        Pre (Saving _) ->
            "SAVING THE PROJECT"

        Pre Discarding ->
            "DROPPING THE CHANGES"

        Pre (Settling _) ->
            "CHECKING"

        Pre (Copying _) ->
            "COPYING BANK 2"

        -- The self-update, as the owner's screen says it.
        Pre (CopyingBin _) ->
            "INSTALLING " ++ showVersion (Just r.version)

        Pre InstallingSelf ->
            "INSTALLING " ++ showVersion (Just r.version)

        Pre (EnteringDfu _) ->
            "RESTARTING INTO UPDATE MODE"

        Pre (FindingDevice _) ->
            "RESTARTING INTO UPDATE MODE"

        Pre (PickingDevice _) ->
            "CHOOSE THE UPDATE DEVICE"

        Writing _ _ ->
            "WRITING FIRMWARE"

        Post _ (CopyingLate _) ->
            "COPYING BANK 2"

        Post _ Restarting ->
            "INSTALLING"

        Post _ RestartingSelf ->
            "RESTARTING · INSTALLING BANK 2"

        Post _ (Installing _) ->
            "INSTALLING"

        Post _ RestartingAfterInstall ->
            "INSTALLING"

        Post _ Verifying ->
            "INSTALLING"


showVersion : Maybe String -> String
showVersion v =
    case v |> Maybe.map (trimPlus >> String.words) of
        Just [ number, hash ] ->
            number ++ " (" ++ hash ++ ")"

        Just ws ->
            String.join " " ws

        Nothing ->
            "UNKNOWN"


fact : String -> String -> Html msg
fact k v =
    div [ class "uline" ] [ span [ class "k" ] [ text k ], span [ class "v" ] [ text v ] ]


btn : String -> Msg -> Html Msg
btn label msg =
    button [ class "hbtn", onClick msg ] [ text label ]


buttons : List (Html Msg) -> Html Msg
buttons =
    div [ class "connect" ]


say : String -> Html msg
say s =
    p [] [ text s ]


latestUrl : String
latestUrl =
    "https://github.com/joegiralt/chimera-releases/releases/latest"


change : UnitNow -> Release -> Html msg
change u r =
    fact "UPDATE" (showVersion u.build ++ " → " ++ showVersion (Just r.version))


body : Fields -> List (Html Msg)
body m =
    case m.stage of
        Opening ->
            [ say "Checking the unit…" ]

        Reading _ _ ->
            [ say "Checking the unit and the latest release…" ]

        NoLink ->
            [ say "The unit isn't connected. Connect it, then press UPDATE again."
            , buttons [ btn "CLOSE" Close ]
            ]

        Closing ->
            [ say "Back to the editor…" ]

        Choosing u _ ->
            [ fact "THIS UNIT" (showVersion u.build), say "Choose CHIMERA.BIN, CHIMERA.BK2 and SHA256SUMS, all three at once…" ]

        Ready u rel ->
            ready m u rel

        Confirm u r ->
            confirm m u r

        Running u r run ->
            change u r :: stages (u.selfUpdate /= Nothing) r run :: runningText m.windows run

        Done was r now ->
            [ fact "UPDATED" (showVersion was.build ++ " → " ++ showVersion now.build)
            , say ("Done. The unit runs " ++ showVersion (Just r.version) ++ ".")
            , buttons [ btn "BACK TO THE EDITOR" Close ]
            ]

        StoppedBefore u r f ->
            change u r :: failedBefore m.windows m.webusb u f

        StoppedAfter u r _ f ->
            change u r :: failedAfter f


ready : Fields -> UnitNow -> ReleaseState -> List (Html Msg)
ready m u rel =
    (case m.mode of
        Stuck ->
            fact "THIS UNIT" "UNKNOWN (IN UPDATE MODE)"

        Connected ->
            fact "THIS UNIT" (showVersion u.build)
    )
        :: (case rel of
                Fetching ->
                    [ say "Reading the files…" ]

                Missing why ->
                    [ fact "LATEST" "NOT FOUND"
                    , say (why ++ ".")
                    , say "Choose the release's files instead: CHIMERA.BIN, CHIMERA.BK2 and SHA256SUMS, all three at once."
                    , buttons [ btn "CHOOSE FILES…" Choose, btn "CLOSE" Close ]
                    ]

                Got r ->
                    fact
                        (case r.source of
                            Latest ->
                                "LATEST"

                            Chosen ->
                                "CHOSEN FILES"
                        )
                        (showVersion (Just r.version))
                        -- The self-update needs no WebUSB; the DFU path does.
                        :: (if m.webusb || u.selfUpdate /= Nothing then
                                [ say (offerText m.mode (offer u r))
                                , buttons [ btn (offerButton m.mode (offer u r)) Start, btn "CHOOSE FILES…" Choose, btn "CLOSE" Close ]
                                ]

                            else
                                [ say "USE CHROME OR EDGE: this browser can't reach the unit's update mode (no WebUSB). Firefox and Safari can't update the unit."
                                , buttons [ btn "CHOOSE FILES…" Choose, btn "CLOSE" Close ]
                                ]
                           )
           )


offerText : Mode -> Offer -> String
offerText mode o =
    case ( mode, o ) of
        ( Stuck, _ ) ->
            "For a unit sitting in update mode (its screen dark after a stopped update). Can't tell which version this unit had: in update mode it can't say. This writes the release's firmware to it, then finishes the install once it restarts."

        ( Connected, Newer ) ->
            "An update is ready."

        ( Connected, OtherBuild ) ->
            "Another build of the same version is ready."

        ( Connected, Same ) ->
            "This unit already runs this version. You can reinstall it."

        ( Connected, Older ) ->
            "These files are OLDER than what the unit runs. Installing them is a downgrade."

        ( Connected, Unknown ) ->
            "The unit didn't say its version."


offerButton : Mode -> Offer -> String
offerButton mode o =
    case ( mode, o ) of
        ( Stuck, _ ) ->
            "FINISH THE UPDATE…"

        ( Connected, Same ) ->
            "REINSTALL…"

        ( Connected, Older ) ->
            "DOWNGRADE…"

        ( Connected, Newer ) ->
            "UPDATE…"

        ( Connected, OtherBuild ) ->
            "UPDATE…"

        ( Connected, Unknown ) ->
            "UPDATE…"


confirm : Fields -> UnitNow -> Release -> List (Html Msg)
confirm m u r =
    [ change u r
    , say
        (case ( m.mode, offer u r ) of
            ( Stuck, _ ) ->
                "Can't tell which version this unit had, so this can't say whether it is an update, a reinstall or a downgrade. It writes the firmware to the unit in update mode, then installs bank 2 when it restarts."

            ( Connected, Same ) ->
                "This reinstalls the version the unit already runs."

            ( Connected, Older ) ->
                "THIS IS A DOWNGRADE: the unit gets an older firmware. Projects and Sounds saved by the newer one may not load the same, or at all."

            ( Connected, Newer ) ->
                "This updates the unit's firmware."

            ( Connected, OtherBuild ) ->
                "This updates the unit's firmware."

            ( Connected, Unknown ) ->
                "This updates the unit's firmware."
        )
    , say "Don't unplug the unit or power it off until this page says DONE. It takes about two minutes."
    , say "If the project has unsaved changes, you'll be asked to save or drop them first."
    , say "Your projects and Sounds on the card stay. The bootloader is never touched."
    , buttons
        [ btn
            (case m.mode of
                Stuck ->
                    "FINISH THE UPDATE"

                Connected ->
                    "START UPDATE"
            )
            Go
        , btn "CANCEL" Cancel
        ]
    ]


{-| The stages in order, the current one marked, done ones ticked.
-}
stages : Bool -> Release -> Run -> Html msg
stages self r run =
    let
        -- The self-update's steps, as the owner's screen has them: no update mode.
        selfAt : Int -> Int
        selfAt dfuAt =
            if not self then
                dfuAt

            else if dfuAt == 0 then
                0

            else if dfuAt < 4 then
                1

            else
                2

        at : Int
        at =
            selfAt <|
                case run of
                    Pre Checking ->
                        0

                    Pre ReadingProject ->
                        0

                    Pre (Saving _) ->
                        0

                    Pre Discarding ->
                        0

                    Pre (Settling _) ->
                        0

                    Pre (Copying _) ->
                        1

                    Pre (CopyingBin _) ->
                        1

                    Pre InstallingSelf ->
                        1

                    Pre (EnteringDfu _) ->
                        2

                    Pre (FindingDevice _) ->
                        2

                    Pre (PickingDevice _) ->
                        2

                    Writing _ _ ->
                        3

                    Post _ _ ->
                        4

        pct : Maybe Progress
        pct =
            case run of
                Pre (Copying p) ->
                    Just p

                Pre (CopyingBin p) ->
                    Just p

                Pre ReadingProject ->
                    Nothing

                Pre (Saving _) ->
                    Nothing

                Pre Discarding ->
                    Nothing

                Pre (Settling _) ->
                    Nothing

                Pre InstallingSelf ->
                    Nothing

                Post _ (CopyingLate p) ->
                    Just p

                Writing _ p ->
                    Just p

                Pre Checking ->
                    Nothing

                Pre (EnteringDfu _) ->
                    Nothing

                Pre (FindingDevice _) ->
                    Nothing

                Pre (PickingDevice _) ->
                    Nothing

                Post _ Restarting ->
                    Nothing

                Post _ RestartingSelf ->
                    Nothing

                Post _ (Installing _) ->
                    Nothing

                Post _ RestartingAfterInstall ->
                    Nothing

                Post _ Verifying ->
                    Nothing

        names : List String
        names =
            if self then
                [ "CHECKING", "INSTALLING " ++ showVersion (Just r.version), "RESTARTING · INSTALLING BANK 2" ]

            else
                [ "CHECKING", "COPYING BANK 2", "RESTARTING INTO UPDATE MODE", "WRITING FIRMWARE", "INSTALLING" ]
    in
    ol [ class "ustages" ]
        (List.indexedMap
            (\i n ->
                li
                    [ class
                        (if i < at then
                            "done"

                         else if i == at then
                            "now"

                         else
                            "todo"
                        )
                    , attribute "aria-current"
                        (if i == at then
                            "step"

                         else
                            "false"
                        )
                    ]
                    (text n
                        :: (case ( i == at, pct ) of
                                ( True, Just pr ) ->
                                    [ span [ class "pct" ] [ text (" " ++ String.fromInt (percent pr) ++ " %") ]
                                    , div [ class "ubar" ] [ div [ style "width" (String.fromInt (percent pr) ++ "%") ] [] ]
                                    ]

                                _ ->
                                    []
                           )
                    )
            )
            names
        )


percent : Progress -> Int
percent pr =
    if pr.total <= 0 then
        0

    else
        min 100 (pr.done * 100 // pr.total)


runningText : Bool -> Run -> List (Html Msg)
runningText windows run =
    case run of
        Pre (PickingDevice _) ->
            say "The unit is in update mode (its screen goes dark). The browser asks which device to use: press CHOOSE UPDATE DEVICE and pick STM32 BOOTLOADER."
                :: (if windows then
                        [ say "On Windows, if STM32 BOOTLOADER isn't in the list, it needs a driver once: CANCEL shows the steps." ]

                    else
                        []
                   )
                ++ [ buttons [ btn "CHOOSE UPDATE DEVICE" Pick, btn "CANCEL" Cancel ] ]

        Pre Checking ->
            [ say "Don't unplug the unit or power it off." ]

        Pre (Copying _) ->
            [ say "Don't unplug the unit or power it off." ]

        Pre ReadingProject ->
            [ say "Don't unplug the unit or power it off." ]

        Pre (Saving _) ->
            [ say "Saving the project…" ]

        Pre Discarding ->
            [ say "Reloading the project as last saved…" ]

        Pre (Settling _) ->
            [ say "Waiting for the unit to finish with the card…" ]

        Pre (CopyingBin _) ->
            [ say "Don't unplug the unit or power it off." ]

        Pre InstallingSelf ->
            [ say "Don't unplug the unit or power it off." ]

        Pre (EnteringDfu _) ->
            [ say "Don't unplug the unit or power it off." ]

        Pre (FindingDevice _) ->
            [ say "Don't unplug the unit or power it off." ]

        Writing _ _ ->
            [ say "Don't unplug the unit or power it off." ]

        Post _ _ ->
            [ say "Don't unplug the unit or power it off." ]


driverSteps : List (Html Msg)
driverSteps =
    [ say "On Windows, the browser needs a driver for update mode, once:"
    , ol []
        [ li [] [ text "Download Zadig from ", a [ href "https://zadig.akeo.ie/", target "_blank", rel "noopener" ] [ text "zadig.akeo.ie" ], text " and run it." ]
        , li [] [ text "In Options, tick List All Devices." ]
        , li [] [ text "Select STM32 BOOTLOADER." ]
        , li [] [ text "Pick WinUSB and press Install Driver (or Replace Driver)." ]
        , li [] [ text "Come back here and press WRITE AGAIN." ]
        ]
    ]


bootloaderSteps : List (Html Msg)
bootloaderSteps =
    [ say "Or finish from the bootloader, which is never touched:"
    , ol []
        [ li [] [ text "Over USB: hold MENU while you power the unit on, press button 2 (DFU Mode), then press WRITE AGAIN here (or, on a page without it, FINISH THE UPDATE on the editor's connect page)." ]
        , li []
            [ text "With the SD card: get CHIMERA.BIN and CHIMERA.BK2 from the "
            , a [ href latestUrl, target "_blank", rel "noopener" ] [ text "release page" ]
            , text "; hold MENU while you power the unit on, press button 3 (SD card access), copy both files to the card's top folder (choose Replace) and eject it; press MENU, step with − / + until it shows CHIMERA.BIN, and press button 1. Chimera installs CHIMERA.BK2 on its first start: leave it on while the screen says DON'T POWER OFF."
            ]
        ]
    ]


sdSteps : List (Html Msg)
sdSteps =
    [ say "Or use the SD card instead:"
    , ol []
        [ li [] [ text "Get CHIMERA.BIN and CHIMERA.BK2 from the ", a [ href latestUrl, target "_blank", rel "noopener" ] [ text "release page" ], text "." ]
        , li [] [ text "Hold MENU while you power the unit on, then press button 3 (SD card access)." ]
        , li [] [ text "Copy both files to the card's top folder (choose Replace), and eject it." ]
        , li [] [ text "Press MENU, step with − / + until it shows CHIMERA.BIN, and press button 1." ]
        , li [] [ text "Chimera installs CHIMERA.BK2 on its first start. Leave it on while the screen says DON'T POWER OFF." ]
        ]
    ]


leaveUpdateMode : Html Msg
leaveUpdateMode =
    say "To leave update mode without updating: unplug the USB cable and plug it back in; the unit starts its old firmware as before (CHIMERA.BK2 may already be on the card: that is harmless)."


{-| After a refused or undone self-update: try it again, or the DFU path
(where the browser has WebUSB).
-}
selfWayOut : Bool -> Html Msg
selfWayOut webusb =
    buttons
        (btn "TRY AGAIN" TryAgain
            :: (if webusb then
                    [ btn "USE UPDATE MODE (DFU)" UseDfu ]

                else
                    []
               )
            ++ [ btn "CLOSE" Close ]
        )


failedBefore : Bool -> Bool -> UnitNow -> PreFail -> List (Html Msg)
failedBefore windows webusb u f =
    case f of
        Unsaved loaded ->
            [ say "THE PROJECT HAS UNSAVED CHANGES. Save them or drop them, and the update goes on; or CANCEL and keep working."
            , case loaded of
                Just _ ->
                    say "SAVE AND UPDATE saves the project over its own file. DISCARD AND UPDATE reloads it as last saved, dropping the changes."

                Nothing ->
                    say "This project was never saved: SAVE AND UPDATE saves it as a new project named BEFORE_UPDATE."
            , buttons
                (btn "SAVE AND UPDATE" SaveAndUpdate
                    :: (case loaded of
                            Just _ ->
                                [ btn "DISCARD AND UPDATE" DiscardAndUpdate ]

                            Nothing ->
                                []
                       )
                    ++ [ btn "CANCEL" Cancel ]
                )
            , say "Nothing has been written."
            ]

        NothingFlashed why ->
            [ say (why ++ ".")
            , say ("Nothing was flashed: the unit still runs " ++ showVersion u.build ++ ". Check the USB cable, then press TRY AGAIN.")
            , buttons [ btn "TRY AGAIN" TryAgain, btn "CLOSE" Close ]
            ]

        SelfRefused why ->
            [ say ("THE UNIT REFUSED TO INSTALL THE FIRMWARE ITSELF: " ++ why ++ ".")
            , say ("Nothing was written: the unit still runs " ++ showVersion u.build ++ ".")
            , selfWayOut webusb
            ]

        SelfAborted why ->
            [ say ("THE UNIT STOPPED ITS OWN INSTALL (" ++ why ++ ") AND STARTED ITS OLD FIRMWARE AGAIN, UNTOUCHED.")
            , say ("It still runs " ++ showVersion u.build ++ ".")
            , selfWayOut webusb
            ]

        GarbledBefore why ->
            [ say ("THE UPDATE STOPPED: " ++ why ++ ".")
            , say "Nothing was flashed. Press TRY AGAIN, or CLOSE and reload the page."
            , buttons [ btn "TRY AGAIN" TryAgain, btn "CLOSE" Close ]
            ]

        DfuSilent _ ->
            [ say "THE UNIT DIDN'T ANSWER THE REQUEST FOR UPDATE MODE. It may be in update mode already, its screen dark."
            , say "If the screen is dark: press CHOOSE UPDATE DEVICE and pick STM32 BOOTLOADER to go on. Nothing has been flashed yet."
            , say "If it shows its usual screen: press TRY AGAIN."
            , buttons [ btn "CHOOSE UPDATE DEVICE" Pick, btn "TRY AGAIN" TryAgain, btn "CLOSE" Close ]
            , leaveUpdateMode
            ]
                ++ bootloaderSteps

        PickCancelled d ->
            [ say "NO UPDATE DEVICE WAS CHOSEN. The unit is waiting in update mode (its screen dark)."
            , written d
            , say "Press WRITE AGAIN and pick STM32 BOOTLOADER."
            ]
                ++ (if windows then
                        driverSteps

                    else
                        []
                   )
                ++ [ buttons [ btn "WRITE AGAIN" WriteAgain, btn "CLOSE" Close ] ]
                ++ wayOut d

        WrongDevice d why ->
            [ say ("THAT ISN'T THE UNIT'S UPDATE DEVICE. " ++ why ++ ".")
            , written d
            , buttons [ btn "WRITE AGAIN" WriteAgain, btn "CLOSE" Close ]
            ]
                ++ wayOut d

        CantOpen d ->
            [ say "THE BROWSER CAN'T OPEN THE UNIT'S UPDATE DEVICE. The bootloader is never touched."
            , written d
            , say "Another program may hold it: on Linux, fwupd takes every new DFU device for a moment (the editor waited 10 seconds for it). Press WRITE AGAIN to try once more."
            , say "Or write it from a terminal with dfu-util, in the folder holding the release's CHIMERA.BIN:"
            , p [ class "code" ] [ text "dfu-util -a0 -d 0x0483:0xdf11 -s 0x8020000:leave -D CHIMERA.BIN" ]
            ]
                ++ (if windows then
                        driverSteps

                    else
                        [ say "Close any other program using it (dfu-util, STM32CubeProgrammer). On Linux, give your user access to it once:"
                        , p [ class "code" ] [ text "echo 'SUBSYSTEM==\"usb\", ATTRS{idVendor}==\"0483\", ATTRS{idProduct}==\"df11\", TAG+=\"uaccess\"' | sudo tee /etc/udev/rules.d/70-stm32-dfu.rules && sudo udevadm control --reload && sudo udevadm trigger" ]
                        , say "Then press WRITE AGAIN."
                        ]
                   )
                ++ [ buttons [ btn "WRITE AGAIN" WriteAgain, btn "CLOSE" Close ] ]
                ++ wayOut d

        Guarded d why ->
            [ say ("THE UPDATE STOPPED BEFORE WRITING: " ++ why ++ ".")
            , written d
            , say "Press WRITE AGAIN to pick the device again."
            , buttons [ btn "WRITE AGAIN" WriteAgain, btn "CLOSE" Close ]
            ]
                ++ wayOut d


{-| What this stop wrote, by the firmware area's state: nothing, or, over
an area an earlier write left half done, nothing more.
-}
written : InDfu -> Html msg
written d =
    case d.flash of
        Untouched ->
            say "Nothing has been written."

        Touched ->
            say "THE FIRMWARE AREA IS ONLY PARTLY WRITTEN (an earlier write was cut off, or the unit was left in update mode). Don't just unplug it: it won't start its old firmware. Finish the write here, or from the bootloader."


{-| The ways out of update mode: unplugging only while nothing was written;
else finishing the write, here or from the bootloader.
-}
wayOut : InDfu -> List (Html Msg)
wayOut d =
    case d.flash of
        Untouched ->
            leaveUpdateMode :: bootloaderSteps

        Touched ->
            bootloaderSteps


failedAfter : PostFail -> List (Html Msg)
failedAfter f =
    case f of
        WriteCut why ->
            [ say ("THE FIRMWARE WRITE WAS CUT OFF (" ++ why ++ ").")
            , say "The unit can't be bricked: its bootloader is never touched. Finish from the bootloader:"
            , ol []
                [ li [] [ text "Over USB: hold MENU while you power the unit on, press button 2 (DFU Mode), then press WRITE AGAIN here." ] ]
            , buttons [ btn "WRITE AGAIN" WriteAgain, btn "CLOSE" Close ]
            ]
                ++ sdSteps

        LeaveFailed why ->
            [ say ("THE FIRMWARE IS WRITTEN, BUT THE UNIT DIDN'T RESTART BY ITSELF (" ++ why ++ ").")
            , say "Switch the unit off and on (or unplug the USB cable and plug it back in), then press CHECK AGAIN: it starts the new firmware and installs bank 2."
            , buttons [ btn "CHECK AGAIN" CheckAgain, btn "CONNECT UNIT…" ConnectPort, btn "CLOSE" Close ]
            ]
                ++ bootloaderSteps

        NotBack cause ->
            [ say ("THE FIRMWARE IS WRITTEN, BUT THE UNIT HASN'T ANSWERED (" ++ cause ++ "). What to do depends on its screen:")
            , ol []
                [ li [] [ text "DON'T POWER OFF: it is still installing. Leave it on; when the screen changes, press CHECK AGAIN." ]
                , li [] [ text "Its usual screen: press CHECK AGAIN. If it still doesn't answer, switch it off and on (only if the screen does NOT say DON'T POWER OFF), then CHECK AGAIN." ]
                , li [] [ text "Blank or dark: it is waiting in update mode. Unplug the USB cable, plug it back in, then press CHECK AGAIN." ]
                , li [] [ text "If this page never had the unit's port (FINISH THE UPDATE from the connect page), press CONNECT UNIT… and pick it." ]
                ]
            , buttons [ btn "CHECK AGAIN" CheckAgain, btn "CONNECT UNIT…" ConnectPort, btn "CLOSE" Close ]
            ]
                ++ bootloaderSteps

        Unfinished why ->
            [ say ("THE FIRMWARE IS WRITTEN, BUT THE UPDATE ISN'T FINISHED: " ++ why ++ ".")
            , say "Press TRY AGAIN: the editor asks the unit what it runs now and finishes from there."
            , buttons [ btn "TRY AGAIN" TryAgain, btn "CLOSE" Close ]
            ]
                ++ sdSteps

        SelfNotBack cause ->
            [ say ("THE UNIT HASN'T COME BACK FROM ITS OWN INSTALL (" ++ cause ++ "). It writes its firmware, restarts and installs bank 2: up to three minutes.")
            , say "If its screen says DON'T POWER OFF, leave it on and press CHECK AGAIN when it changes. Otherwise press CHECK AGAIN."
            , buttons [ btn "CHECK AGAIN" CheckAgain, btn "CONNECT UNIT…" ConnectPort, btn "CLOSE" Close ]
            , say "If it never comes back, finish from the bootloader, which is never touched: CHIMERA.BIN is already on the card."
            , ol []
                [ li [] [ text "Hold MENU while you power the unit on." ]
                , li [] [ text "Under Firmware to flash, step with − / + until it shows CHIMERA.BIN." ]
                , li [] [ text "Press button 1 (flash). Chimera installs CHIMERA.BK2 on its first start: leave it on while the screen says DON'T POWER OFF." ]
                ]
            ]

        OtherUnit id ->
            [ say ("THE UNIT THAT ANSWERED AFTER THE RESTART IS ANOTHER ONE (unit " ++ id ++ "), not the one being updated.")
            , say "Unplug the other units (or close the programs using them), keep this one connected, then press CHECK AGAIN."
            , buttons [ btn "CHECK AGAIN" CheckAgain, btn "CLOSE" Close ]
            ]
                ++ bootloaderSteps

        GarbledAfter why ->
            [ say ("THE UPDATE STOPPED AFTER THE FIRMWARE WRITE BEGAN: " ++ why ++ ".")
            , say "Press CHECK AGAIN: the editor asks the unit what it runs now and finishes from there."
            , buttons [ btn "CHECK AGAIN" CheckAgain, btn "CLOSE" Close ]
            ]
                ++ bootloaderSteps
