-- SPDX-License-Identifier: GPL-3.0-or-later


module Update.Types exposing
    ( Answer(..)
    , Bk2(..)
    , Device(..)
    , Event(..)
    , Fields
    , Flash(..)
    , InDfu
    , Loaded
    , Mode(..)
    , Model(..)
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
    , confirmOf
    , pickingOf
    , readyOf
    , runningOf
    , stoppedAfterOf
    , stoppedBeforeOf
    )

{-| What the unit and the release are, where the update is, and what goes
to `update.js` and comes back: the types every part of `Update` shares, and
the stage's views (`runningOf`, `stoppedBeforeOf`…).
-}

import Json.Decode as D


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
      -- The request's line never reached the unit (the write failed): the
      -- link gone before it, as a Gone answer, but known unsent.
    | Unsent Ticket


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


type Verdict
    = Installed UnitNow
    | NeedsInstall String
    | NotFinished String


{-| The unit's version against the release's, by their numbers.
-}
type Offer
    = Newer
    | OtherBuild
    | Same
    | Older
    | Unknown


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
