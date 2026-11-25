-- SPDX-License-Identifier: GPL-3.0-or-later


port module Update exposing
    ( Answer(..)
    , Bk2(..)
    , Device(..)
    , Event(..)
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
    , Source(..)
    , Stage(..)
    , Ticket(..)
    , UnitNow
    , Verdict(..)
    , Version
    , WriteResult(..)
    , begin
    , beginStuck
    , decode
    , holding
    , offer
    , parseVersion
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
    }


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


{-| Before anything is written to the firmware area.
-}
type PreRun
    = Checking
    | Copying Progress
    | EnteringDfu Bk2
    | FindingDevice Bk2
      -- The browser asks which device: a click.
    | PickingDevice Bk2


{-| After the firmware area was written.
-}
type PostRun
    = Restarting
    | CopyingLate Progress
    | Installing Int
    | RestartingAfterInstall
    | Verifying


type Run
    = Pre PreRun
    | Writing Bk2 Progress
    | Post Bk2 PostRun


{-| A stop before the write: the flash is as it was.
-}
type PreFail
    = Unsaved
    | NothingFlashed String
      -- `dfu` unanswered: the unit may be in update mode, its screen dark.
    | DfuSilent Bk2
      -- In update mode, nothing written: no device picked, the wrong one, one that won't open, a guard.
    | PickCancelled Bk2
    | WrongDevice Bk2 String
    | CantOpen Bk2
    | Guarded Bk2 String
    | GarbledBefore String


{-| A stop once the write started: the firmware area is not what it was.
-}
type PostFail
    = WriteCut String
    | LeaveFailed String
    | NotBack String
    | Unfinished String
    | GarbledAfter String


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
    | TPut
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
    | Dfu
    | FindDevice Int
    | PickDevice
    | Write Release
    | Back Int Bool
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


{-| Whether the tab is held: while anything past CHECKING runs.
-}
holding : Model -> Bool
holding (Model m) =
    case runningOf m.stage of
        Just ( _, _, Pre Checking ) ->
            False

        Just ( _, _, Pre (Copying _) ) ->
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


{-| A hand on the panel.
-}
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
                Just b ->
                    go (Running u r (Pre (PickingDevice b))) [ PickDevice ]

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
                        Stuck ->
                            go (Running u r (Pre (PickingDevice AfterFlash))) []

                Nothing ->
                    ignore

        Cancel ->
            case ( confirmOf m.stage, pickingOf m.stage ) of
                ( Just ( u, r ), _ ) ->
                    go (Ready u (Got r)) []

                ( Nothing, Just ( u, r, b ) ) ->
                    go (StoppedBefore u r (PickCancelled b)) []

                ( Nothing, Nothing ) ->
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
                    go (Running u r (Pre (PickingDevice b))) [ PickDevice ]

                ( Nothing, Just ( _, _, ( _, LeaveFailed _ ) ) ) ->
                    ignore

                ( Nothing, Just ( _, _, ( _, NotBack _ ) ) ) ->
                    ignore

                ( Nothing, Just ( _, _, ( _, Unfinished _ ) ) ) ->
                    ignore

                ( Nothing, Just ( _, _, ( _, GarbledAfter _ ) ) ) ->
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
                        Unsaved ->
                            go (Running u r (Pre Checking)) [ status TStatus 0 ]

                        NothingFlashed _ ->
                            go (Running u r (Pre Checking)) [ status TStatus 0 ]

                        GarbledBefore _ ->
                            go (Running u r (Pre Checking)) [ status TStatus 0 ]

                        DfuSilent _ ->
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
                    go (Running u r (Post b Restarting)) [ PickPort, Back 120 False ]

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
                        Just ( Running u r (Post b Restarting), [ Back 120 False ] )

                    NotBack _ ->
                        Just ( Running u r (Post b Restarting), [ Back 120 False ] )

                    Unfinished _ ->
                        Just ( Running u r (Post b Restarting), [ Back 120 False ] )

                    GarbledAfter _ ->
                        Just ( Running u r (Post b Restarting), [ Back 120 False ] )
            )


{-| A stop that left the unit in update mode with nothing written: its DFU
device can be picked again.
-}
inUpdateMode : PreFail -> Maybe Bk2
inUpdateMode f =
    case f of
        DfuSilent b ->
            Just b

        PickCancelled b ->
            Just b

        WrongDevice b _ ->
            Just b

        CantOpen b ->
            Just b

        Guarded b _ ->
            Just b

        Unsaved ->
            Nothing

        NothingFlashed _ ->
            Nothing

        GarbledBefore _ ->
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


pickingOf : Stage -> Maybe ( UnitNow, Release, Bk2 )
pickingOf s =
    case runningOf s of
        Just ( u, r, Pre (PickingDevice b) ) ->
            Just ( u, r, b )

        Just ( _, _, Pre Checking ) ->
            Nothing

        Just ( _, _, Pre (Copying _) ) ->
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

                        Writing b _ ->
                            to (StoppedAfter u r b (GarbledAfter why))

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


running : In -> UnitNow -> Release -> Run -> Fields -> ( Model, List Request )
running i u r run m =
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

        device : Bk2 -> Device -> ( Model, List Request )
        device b d =
            case d of
                Found ->
                    to (Writing b { done = 0, total = 1 }) [ Write r ]

                NotFound ->
                    to (Pre (PickingDevice b)) []

                Cancelled ->
                    before (PickCancelled b)

                Wrong why ->
                    before (WrongDevice b why)

                NoWebUsb ->
                    before (CantOpen b)
    in
    case run of
        -- CHECKING: unsaved changes stop it; a unit too old to say goes on, as the script does.
        Pre Checking ->
            case answerFor TStatus i of
                Just Gone ->
                    before (NothingFlashed "The unit isn't connected")

                Just ((Said _ _) as a) ->
                    if (unitOf a).modified then
                        before Unsaved

                    else
                        to (Pre (Copying { done = 0, total = r.bk2Size })) [ Put r ]

                Just NoAnswer ->
                    to (Pre (Copying { done = 0, total = r.bk2Size })) [ Put r ]

                Nothing ->
                    ignore

        Pre (Copying _) ->
            case ( i.copied, answerFor TPut i ) of
                ( Just p, _ ) ->
                    to (Pre (Copying p)) []

                ( Nothing, Just a ) ->
                    case staging r a of
                        Ok b ->
                            to (Pre (EnteringDfu b)) [ Dfu ]

                        Err why ->
                            before (NothingFlashed why)

                ( Nothing, Nothing ) ->
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
            i.device |> Maybe.map (device b) |> Maybe.withDefault ignore

        Pre (PickingDevice b) ->
            i.device |> Maybe.map (device b) |> Maybe.withDefault ignore

        Writing b _ ->
            case ( i.written, i.write ) of
                ( Just p, _ ) ->
                    to (Writing b p) []

                ( Nothing, Just w ) ->
                    case w of
                        WriteOk ->
                            to (Post b Restarting) [ Back 120 False ]

                        Unopenable ->
                            before (CantOpen b)

                        GuardRefused why ->
                            before (Guarded b why)

                        Cut started why ->
                            if started then
                                after b (WriteCut why)

                            else
                                before (Guarded b why)

                        Refused started why ->
                            if started then
                                after b (WriteCut why)

                            else
                                before (Guarded b why)

                        LeaveFail why ->
                            after b (LeaveFailed why)

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
                        to (Post b RestartingAfterInstall) [ Back 60 True ]

                    else if isOk end then
                        to (Post b Verifying) [ status TVerify 0 ]

                    else if end == "ERR bank2: busy" && tries < 5 then
                        -- 0.2 s between tries, as the script waits.
                        to (Post b (Installing (tries + 1))) [ install 200 ]

                    else
                        after b (Unfinished (installRefusal end))

                -- The install may have opened the door and restarted the unit.
                Just Gone ->
                    to (Post b RestartingAfterInstall) [ Back 60 True ]

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
    }


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
            op "put" [ ( "id", E.string (ticketId TPut) ), ( "seal", E.string rel.seal ), ( "sha", E.string rel.bk2Sha ) ]

        Dfu ->
            op "dfu" [ ( "id", E.string (ticketId TDfu) ) ]

        FindDevice secs ->
            op "findDevice" [ ( "secs", E.int secs ) ]

        PickDevice ->
            op "pickDevice" []

        Write rel ->
            op "write" [ ( "seal", E.string rel.seal ), ( "sha", E.string rel.binSha ) ]

        Back secs restart ->
            op "back" [ ( "secs", E.int secs ), ( "restart", E.bool restart ) ]

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
    D.map8 Release
        (D.field "version" D.string)
        (D.field "seal" D.string)
        (D.field "format" D.int)
        (D.field "binSize" D.int)
        (D.field "bk2Size" D.int)
        (D.field "binSha" D.string)
        (D.field "bk2Sha" D.string)
        (D.field "source" D.string
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

        Running _ _ run ->
            runTitle run

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


runTitle : Run -> String
runTitle run =
    case run of
        Pre Checking ->
            "CHECKING"

        Pre (Copying _) ->
            "COPYING BANK 2"

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
            change u r :: stages run :: runningText m.windows run

        Done was r now ->
            [ fact "UPDATED" (showVersion was.build ++ " → " ++ showVersion now.build)
            , say ("Done. The unit runs " ++ showVersion (Just r.version) ++ ".")
            , buttons [ btn "BACK TO THE EDITOR" Close ]
            ]

        StoppedBefore u r f ->
            change u r :: failedBefore m.windows u f

        StoppedAfter u r _ f ->
            change u r :: failedAfter f


ready : Fields -> UnitNow -> ReleaseState -> List (Html Msg)
ready m u rel =
    (case m.mode of
        Stuck ->
            say "For a unit sitting in update mode (its screen dark after a stopped update): this writes the firmware to it, then finishes the install once it restarts."

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
                        :: (if m.webusb then
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
            "Finish the update with this release."

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
                "This writes the firmware to the unit in update mode, then installs bank 2 when it restarts."

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
    , say "Unsaved changes block the update: save the project first (hold MENU), or load another."
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
stages : Run -> Html msg
stages run =
    let
        at : Int
        at =
            case run of
                Pre Checking ->
                    0

                Pre (Copying _) ->
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

                Post _ (Installing _) ->
                    Nothing

                Post _ RestartingAfterInstall ->
                    Nothing

                Post _ Verifying ->
                    Nothing

        names : List String
        names =
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


failedBefore : Bool -> UnitNow -> PreFail -> List (Html Msg)
failedBefore windows u f =
    case f of
        Unsaved ->
            [ say "THE PROJECT HAS UNSAVED CHANGES. Save it (hold MENU) or load another, then press TRY AGAIN."
            , say "Nothing was written."
            , buttons [ btn "TRY AGAIN" TryAgain, btn "CLOSE" Close ]
            ]

        NothingFlashed why ->
            [ say (why ++ ".")
            , say ("Nothing was flashed: the unit still runs " ++ showVersion u.build ++ ". Check the USB cable, then press TRY AGAIN.")
            , buttons [ btn "TRY AGAIN" TryAgain, btn "CLOSE" Close ]
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

        PickCancelled _ ->
            [ say "NO UPDATE DEVICE WAS CHOSEN. The unit is waiting in update mode (its screen dark); nothing has been written."
            , say "Press WRITE AGAIN and pick STM32 BOOTLOADER."
            ]
                ++ (if windows then
                        driverSteps

                    else
                        []
                   )
                ++ [ buttons [ btn "WRITE AGAIN" WriteAgain, btn "CLOSE" Close ], leaveUpdateMode ]
                ++ bootloaderSteps

        WrongDevice _ why ->
            [ say ("THAT ISN'T THE UNIT'S UPDATE DEVICE. " ++ why ++ ".")
            , say "Nothing has been written."
            , buttons [ btn "WRITE AGAIN" WriteAgain, btn "CLOSE" Close ]
            , leaveUpdateMode
            ]

        CantOpen _ ->
            say "THE BROWSER CAN'T OPEN THE UNIT'S UPDATE DEVICE. Nothing has been written, and the bootloader is never touched."
                :: (if windows then
                        driverSteps

                    else
                        [ say "Close any other program using it (dfu-util, STM32CubeProgrammer). On Linux, give your user access to it once:"
                        , p [ class "code" ] [ text "echo 'SUBSYSTEM==\"usb\", ATTRS{idVendor}==\"0483\", ATTRS{idProduct}==\"df11\", TAG+=\"uaccess\"' | sudo tee /etc/udev/rules.d/70-stm32-dfu.rules && sudo udevadm control --reload && sudo udevadm trigger" ]
                        , say "Then press WRITE AGAIN."
                        ]
                   )
                ++ [ buttons [ btn "WRITE AGAIN" WriteAgain, btn "CLOSE" Close ] ]
                ++ sdSteps
                ++ [ leaveUpdateMode ]

        Guarded _ why ->
            [ say ("THE UPDATE STOPPED BEFORE WRITING: " ++ why ++ ".")
            , say "Nothing was written. Press WRITE AGAIN to pick the device again."
            , buttons [ btn "WRITE AGAIN" WriteAgain, btn "CLOSE" Close ]
            , leaveUpdateMode
            ]


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

        GarbledAfter why ->
            [ say ("THE UPDATE STOPPED AFTER THE FIRMWARE WRITE BEGAN: " ++ why ++ ".")
            , say "Press CHECK AGAIN: the editor asks the unit what it runs now and finishes from there."
            , buttons [ btn "CHECK AGAIN" CheckAgain, btn "CLOSE" Close ]
            ]
                ++ bootloaderSteps
