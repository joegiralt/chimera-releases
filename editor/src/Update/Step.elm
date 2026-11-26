-- SPDX-License-Identifier: GPL-3.0-or-later


module Update.Step exposing (status, step)

{-| What came back from `update.js`, against where the update is: each
step's answer read, and the next request.
-}

import Update.Read exposing (bank1Last, crcEq, installRefusal, isOk, later, loadedOf, otherUnit, readStatus, sealOpen, staging, unitOf, verdict, verdictWhy)
import Update.Types exposing (Answer(..), Bk2(..), Device(..), Event(..), Fields, Flash(..), InDfu, Mode(..), Model(..), PostFail(..), PostRun(..), PreFail(..), PreRun(..), Progress, Release, ReleaseState(..), Request(..), Run(..), Stage(..), Ticket(..), UnitNow, Verdict(..), WriteResult(..))


{-| Where CHIMERA.BIN goes for the unit's own install: the card's root.
-}
binRemote : String
binRemote =
    "/CHIMERA.BIN"


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
    , unsent : Maybe Ticket
    }


classify : Event -> In
classify e =
    let
        none : In
        none =
            { begun = Nothing, release = Nothing, cancelled = False, answer = Nothing, copied = Nothing, written = Nothing, device = Nothing, write = Nothing, back = Nothing, broken = Nothing, unsent = Nothing }
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

        Unsent t ->
            { none | answer = Just ( t, Gone ), unsent = Just t }


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
                            ( Model { fields | stage = Reading Nothing Fetching }, [ status Nothing TStatus 0, FetchLatest ] )

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
                        -- The install's answer unreadable: it may be writing; wait for it.
                        Pre InstallingSelf ->
                            ( Model { m | stage = Running u r (Post Staged RestartingSelf) }, [ Back 180 True u.unit ] )

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


status : Maybe String -> Ticket -> Int -> Request
status unit t delay =
    Ask t "status" 2000 delay unit


install : Maybe String -> Int -> Request
install unit delay =
    Ask TInstall "bank2 install" 120000 delay unit


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

        -- The first copy, for the unit as CHECKING read it: CHIMERA.BK2, unless
        -- a self-updating unit already has its seal open (then CHIMERA.BIN
        -- straight away).
        copyFirst : UnitNow -> ( Model, List Request )
        copyFirst now =
            let
                copy : Run -> List Request -> ( Model, List Request )
                copy next reqs =
                    ( Model { m | stage = Running now r next }, reqs )
            in
            case ( now.selfUpdate, sealOpen r now ) of
                ( Just _, True ) ->
                    copy (Pre (CopyingBin { done = r.bk2Size, total = both })) [ PutBin r binRemote ]

                ( Just _, False ) ->
                    copy (Pre (Copying { done = 0, total = both })) [ Put r ]

                ( Nothing, _ ) ->
                    copy (Pre (Copying { done = 0, total = r.bk2Size })) [ Put r ]

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
        -- CHECKING: the unit read afresh (after TRY AGAIN it may be another
        -- one, or changed): another unit, or unsaved changes, stop it; a unit
        -- too old to say goes on, as the script does.
        Pre Checking ->
            case answerFor TStatus i of
                Just Gone ->
                    before (NothingFlashed "The unit isn't connected")

                Just ((Said _ end) as a) ->
                    case ( isOk end, otherUnit u a ) of
                        ( False, _ ) ->
                            before (NothingFlashed ("The unit answered status with " ++ end))

                        ( True, Just other ) ->
                            before (OtherUnitBefore other)

                        ( True, Nothing ) ->
                            let
                                now : UnitNow
                                now =
                                    afresh u a
                            in
                            if now.modified then
                                ( Model { m | stage = Running now r (Pre ReadingProject) }, [ Ask TProject "ed since 0" 2000 0 now.unit ] )

                            else
                                copyFirst now

                Just NoAnswer ->
                    copyFirst u

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
                            to (Pre ReadingProject) [ Ask TProject ("ed since " ++ next) 2000 0 u.unit ]

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
                        to (Pre (Settling 0)) [ status u.unit TStatus 500 ]

                    else if not asNew && String.contains "no file of its own" end then
                        to (Pre (Saving True)) [ Ask TSave "ed project saveas BEFORE_UPDATE" 15000 0 u.unit ]

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
                        to (Pre (Settling 0)) [ status u.unit TStatus 500 ]

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
                Just ((Said _ end) as a) ->
                    case otherUnit u a of
                        Just other ->
                            before (OtherUnitBefore other)

                        Nothing ->
                            if not (unitOf a).modified then
                                copyFirst
                                    (if isOk end then
                                        afresh u a

                                     else
                                        u
                                    )

                            else if n < 20 then
                                to (Pre (Settling (n + 1))) [ status u.unit TStatus 500 ]

                            else
                                before (Unsaved Nothing)

                Just NoAnswer ->
                    if n < 20 then
                        to (Pre (Settling (n + 1))) [ status u.unit TStatus 500 ]

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
                        to (Pre InstallingSelf) [ Ask TSelf ("bank1 install " ++ String.fromInt r.binSize ++ " " ++ r.binCrc) 120000 0 u.unit ]

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
        -- Once `bank1 install` is sent the unit may already be writing its own
        -- bank 1 (it hands off ~20 ms after its OK, then resets USB): a lost
        -- reply or a vanished port is the wait for it to come back, never a
        -- retry, re-plug or DFU. Only an ERR, or a verb never sent, may offer those.
        Pre InstallingSelf ->
            case ( i.unsent, answerFor TSelf i ) of
                ( Just TSelf, _ ) ->
                    before (NothingFlashed "The unit was disconnected before the install was sent")

                ( _, Just (Said _ end) ) ->
                    if String.startsWith "OK bank1 verified " end then
                        to (Post Staged RestartingSelf) [ Back 180 True u.unit ]

                    else if end == "OK already installed" then
                        to (Post Staged Verifying) [ status u.unit TVerify 0 ]

                    else if isOk end then
                        to (Post Staged RestartingSelf) [ Back 180 True u.unit ]

                    else
                        -- An ERR is the verb refused: the unit isn't writing.
                        before (SelfRefused end)

                ( _, Just Gone ) ->
                    to (Post Staged RestartingSelf) [ Back 180 True u.unit ]

                ( _, Just NoAnswer ) ->
                    to (Post Staged RestartingSelf) [ Back 180 True u.unit ]

                ( _, Nothing ) ->
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
                                        to (Post b (Installing 1)) [ install u.unit 0 ]

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
            case ( i.unsent, answerFor TDfu i ) of
                -- Never sent: the unit is as it was.
                ( Just TDfu, _ ) ->
                    before (NothingFlashed "The unit was disconnected before the request for update mode was sent")

                ( _, Just (Said _ end) ) ->
                    if isOk end then
                        to (Pre (FindingDevice b)) [ FindDevice 10 ]

                    else
                        before (NothingFlashed ("The unit refused update mode: " ++ end))

                -- Sent: the OK was lost to the reset, not refused.
                ( _, Just Gone ) ->
                    to (Pre (FindingDevice b)) [ FindDevice 10 ]

                ( _, Just NoAnswer ) ->
                    before (DfuSilent b)

                ( _, Nothing ) ->
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
                                    to (Post b (Installing 1)) [ install u.unit 0 ]

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
                        to (Post b (Installing 1)) [ install u.unit 0 ]

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
                        to (Post b Verifying) [ status u.unit TVerify 0 ]

                    else if end == "ERR bank2: busy" && tries < 5 then
                        -- 0.2 s between tries, as the script waits.
                        to (Post b (Installing (tries + 1))) [ install u.unit 200 ]

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


{-| The unit as CHECKING's `status` reads it, for the rest of the update:
its self-update only while the confirmed one had it (USE UPDATE MODE stays
chosen), its identity the confirmed one's where it can't say.
-}
afresh : UnitNow -> Answer -> UnitNow
afresh confirmed answer =
    let
        now : UnitNow
        now =
            unitOf answer
    in
    { now
        | selfUpdate = confirmed.selfUpdate |> Maybe.andThen (\_ -> now.selfUpdate)
        , unit =
            case now.unit of
                Just _ ->
                    now.unit

                Nothing ->
                    confirmed.unit
    }


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
