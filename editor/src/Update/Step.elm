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
classify event =
    let
        none : In
        none =
            { begun = Nothing, release = Nothing, cancelled = False, answer = Nothing, copied = Nothing, written = Nothing, device = Nothing, write = Nothing, back = Nothing, broken = Nothing, unsent = Nothing }
    in
    case event of
        Begun carried ->
            { none | begun = Just carried }

        ReleaseIs carried ->
            { none | release = Just carried }

        ReleaseCancelled ->
            { none | cancelled = True }

        Answered ticket answer ->
            { none | answer = Just ( ticket, answer ) }

        Copied carried ->
            { none | copied = Just carried }

        Written carried ->
            { none | written = Just carried }

        DeviceIs carried ->
            { none | device = Just carried }

        WriteDone carried ->
            { none | write = Just carried }

        BackDone carried ->
            { none | back = Just carried }

        Mismatch why ->
            { none | broken = Just why }

        Garbled why ->
            { none | broken = Just why }

        Ended _ ->
            none

        Unrelated ->
            none

        Unsent ticket ->
            { none | answer = Just ( ticket, Gone ), unsent = Just ticket }


answerFor : Ticket -> In -> Maybe Answer
answerFor ticket incoming =
    incoming.answer
        |> Maybe.andThen
            (\( got, answer ) ->
                if got == ticket then
                    Just answer

                else
                    Nothing
            )


{-| What came back from `update.js`, against where the update is.
-}
step : Event -> Model -> ( Model, List Request )
step event ((Model fields) as model) =
    let
        incoming : In
        incoming =
            classify event

        ignore : ( Model, List Request )
        ignore =
            ( model, [] )

        to : Stage -> ( Model, List Request )
        to stage =
            ( Model { fields | stage = stage }, [] )
    in
    case fields.stage of
        Opening ->
            case incoming.begun of
                Just begun ->
                    let
                        opened : Fields
                        opened =
                            { fields | windows = begun.windows, webusb = begun.webusb }
                    in
                    case ( fields.mode, begun.open ) of
                        ( Stuck, _ ) ->
                            ( Model { opened | stage = Reading (Just (readStatus [])) Fetching }, [ FetchLatest ] )

                        ( Connected, True ) ->
                            ( Model { opened | stage = Reading Nothing Fetching }, [ status Nothing TStatus 0, FetchLatest ] )

                        ( Connected, False ) ->
                            ( Model { opened | stage = NoLink }, [] )

                Nothing ->
                    ignore

        Reading unit rel ->
            case ( answerFor TStatus incoming, incoming.release ) of
                ( Just answer, _ ) ->
                    reading (Just (unitOf answer)) rel fields

                ( Nothing, Just release ) ->
                    reading unit (releaseState release) fields

                ( Nothing, Nothing ) ->
                    ignore

        Choosing unit prev ->
            case ( incoming.release, incoming.cancelled ) of
                ( Just release, _ ) ->
                    to (Ready unit (releaseState release))

                -- A cancelled chooser keeps what was there.
                ( Nothing, True ) ->
                    to (Ready unit prev)

                ( Nothing, False ) ->
                    ignore

        Running unit release run ->
            case incoming.broken of
                Just why ->
                    -- Fail closed: a step that can't read its answer stops,
                    -- on the side of the write it is on.
                    case run of
                        -- The install's answer unreadable: it may be writing; wait for it.
                        Pre InstallingSelf ->
                            ( Model { fields | stage = Running unit release (Post Staged RestartingSelf) }, [ Back 180 True unit.unit ] )

                        Pre _ ->
                            to (StoppedBefore unit release (GarbledBefore why))

                        Writing at _ ->
                            to (StoppedAfter unit release at.bk2 (GarbledAfter why))

                        Post bk2 _ ->
                            to (StoppedAfter unit release bk2 (GarbledAfter why))

                Nothing ->
                    running incoming unit release run fields

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


{-| The most pages of `ed since` read for the loaded project's line.
-}
sincePages : Int
sincePages =
    64


status : Maybe String -> Ticket -> Int -> Request
status unit ticket delay =
    Ask ticket "status" 2000 delay unit


install : Maybe String -> Int -> Request
install unit delay =
    Ask TInstall "bank2 install" 120000 delay unit


{-| A step, unless the console that answered after a restart is another
unit's (both said who they are): then it stops, whatever the step.
-}
running : In -> UnitNow -> Release -> Run -> Fields -> ( Model, List Request )
running incoming unit release run fields =
    let
        answered : Maybe Answer
        answered =
            case ( incoming.back, answerFor TVerify incoming ) of
                ( Just (Ok answer), _ ) ->
                    Just answer

                ( Just (Err _), verified ) ->
                    verified

                ( Nothing, verified ) ->
                    verified

        after : Maybe Bk2
        after =
            case run of
                Post bk2 _ ->
                    Just bk2

                Pre _ ->
                    Nothing

                Writing _ _ ->
                    Nothing
    in
    case ( after, answered |> Maybe.andThen (otherUnit unit) ) of
        ( Just bk2, Just id ) ->
            ( Model { fields | stage = StoppedAfter unit release bk2 (OtherUnit id) }, [] )

        ( Just _, Nothing ) ->
            runningOn incoming unit release run fields

        ( Nothing, _ ) ->
            runningOn incoming unit release run fields


runningOn : In -> UnitNow -> Release -> Run -> Fields -> ( Model, List Request )
runningOn incoming unit release run fields =
    let
        ignore : ( Model, List Request )
        ignore =
            ( Model fields, [] )

        to : Run -> List Request -> ( Model, List Request )
        to next reqs =
            ( Model { fields | stage = Running unit release next }, reqs )

        before : PreFail -> ( Model, List Request )
        before failure =
            ( Model { fields | stage = StoppedBefore unit release failure }, [] )

        after : Bk2 -> PostFail -> ( Model, List Request )
        after bk2 failure =
            ( Model { fields | stage = StoppedAfter unit release bk2 failure }, [] )

        -- The self-update's bar counts both files.
        both : Int
        both =
            release.bk2Size + release.binSize

        -- The first copy, for the unit as CHECKING read it: CHIMERA.BK2, unless
        -- a self-updating unit already has its seal open (then CHIMERA.BIN
        -- straight away).
        copyFirst : UnitNow -> ( Model, List Request )
        copyFirst now =
            let
                copy : Run -> List Request -> ( Model, List Request )
                copy next reqs =
                    ( Model { fields | stage = Running now release next }, reqs )
            in
            case ( now.selfUpdate, sealOpen release now ) of
                ( Just _, True ) ->
                    copy (Pre (CopyingBin { done = release.bk2Size, total = both })) [ PutBin release binRemote ]

                ( Just _, False ) ->
                    copy (Pre (Copying { done = 0, total = both })) [ Put release ]

                ( Nothing, _ ) ->
                    copy (Pre (Copying { done = 0, total = release.bk2Size })) [ Put release ]

        device : InDfu -> Device -> ( Model, List Request )
        device at picked =
            case picked of
                Found ->
                    to (Writing at { done = 0, total = 1 }) [ Write release ]

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
            case answerFor TStatus incoming of
                Just Gone ->
                    before (NothingFlashed "The unit isn't connected")

                Just ((Said _ end) as answer) ->
                    case ( isOk end, otherUnit unit answer ) of
                        ( False, _ ) ->
                            before (NothingFlashed ("The unit answered status with " ++ end))

                        ( True, Just other ) ->
                            before (OtherUnitBefore other)

                        ( True, Nothing ) ->
                            let
                                now : UnitNow
                                now =
                                    afresh unit answer
                            in
                            if now.modified then
                                ( Model { fields | stage = Running now release (Pre (ReadingProject 1)) }, [ Ask TProject "ed since 0" 2000 0 now.unit ] )

                            else
                                copyFirst now

                Just NoAnswer ->
                    copyFirst unit

                Nothing ->
                    ignore

        -- The project line may be on a later page of `ed since`.
        -- At most `sincePages` pages, each `next` a number, else as never saved.
        Pre (ReadingProject page) ->
            case answerFor TProject incoming of
                Just (Said lines end) ->
                    case ( loadedOf lines, String.words end ) of
                        ( Just loaded, _ ) ->
                            before (Unsaved loaded)

                        ( Nothing, [ "OK", next, "more" ] ) ->
                            case String.toInt next of
                                Just from ->
                                    if page < sincePages then
                                        to (Pre (ReadingProject (page + 1))) [ Ask TProject ("ed since " ++ String.fromInt from) 2000 0 unit.unit ]

                                    else
                                        before (Unsaved Nothing)

                                Nothing ->
                                    before (Unsaved Nothing)

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
            case answerFor TSave incoming of
                Just (Said _ end) ->
                    if isOk end then
                        to (Pre (Settling 0)) [ status unit.unit TStatus 500 ]

                    else if not asNew && String.contains "no file of its own" end then
                        to (Pre (Saving True)) [ Ask TSave "ed project saveas BEFORE_UPDATE" 15000 0 unit.unit ]

                    else
                        before (NothingFlashed ("The project couldn't be saved: " ++ end))

                Just NoAnswer ->
                    before (NothingFlashed "The unit didn't answer the save")

                Just Gone ->
                    before (NothingFlashed "The unit was disconnected during the save")

                Nothing ->
                    ignore

        Pre Discarding ->
            case answerFor TSave incoming of
                Just (Said _ end) ->
                    if isOk end then
                        to (Pre (Settling 0)) [ status unit.unit TStatus 500 ]

                    else
                        before (NothingFlashed ("The changes couldn't be discarded: " ++ end))

                Just NoAnswer ->
                    before (NothingFlashed "The unit didn't answer the reload")

                Just Gone ->
                    before (NothingFlashed "The unit was disconnected during the reload")

                Nothing ->
                    ignore

        -- The save or reload is the unit's card work: `status` until the project is clean.
        Pre (Settling polls) ->
            case answerFor TStatus incoming of
                Just ((Said _ end) as answer) ->
                    case otherUnit unit answer of
                        Just other ->
                            before (OtherUnitBefore other)

                        Nothing ->
                            if not (unitOf answer).modified then
                                copyFirst
                                    (if isOk end then
                                        afresh unit answer

                                     else
                                        unit
                                    )

                            else if polls < 20 then
                                to (Pre (Settling (polls + 1))) [ status unit.unit TStatus 500 ]

                            else
                                before (Unsaved Nothing)

                Just NoAnswer ->
                    if polls < 20 then
                        to (Pre (Settling (polls + 1))) [ status unit.unit TStatus 500 ]

                    else
                        before (NothingFlashed "The unit stopped answering after the save")

                Just Gone ->
                    before (NothingFlashed "The unit was disconnected after the save")

                Nothing ->
                    ignore

        Pre (Copying _) ->
            case ( incoming.copied, answerFor TPut incoming ) of
                ( Just progress, _ ) ->
                    to (Pre (Copying { progress | total = Maybe.withDefault progress.total (Maybe.map (\_ -> both) unit.selfUpdate) })) []

                ( Nothing, Just answer ) ->
                    case ( staging release answer, unit.selfUpdate ) of
                        -- A unit that writes its own firmware: CHIMERA.BIN onto the card next.
                        ( Ok Staged, Just _ ) ->
                            to (Pre (CopyingBin { done = release.bk2Size, total = both })) [ PutBin release binRemote ]

                        -- Else update mode: the unit no longer on the self-update path.
                        ( Ok bk2, _ ) ->
                            ( Model { fields | stage = Running { unit | selfUpdate = Nothing } release (Pre (EnteringDfu bk2)) }, [ Dfu ] )

                        ( Err why, _ ) ->
                            before (NothingFlashed why)

                ( Nothing, Nothing ) ->
                    ignore

        Pre (CopyingBin _) ->
            case ( incoming.copied, answerFor TPutBin incoming ) of
                ( Just progress, _ ) ->
                    to (Pre (CopyingBin { done = release.bk2Size + progress.done, total = both })) []

                ( Nothing, Just (Said _ end) ) ->
                    if isOk end then
                        to (Pre InstallingSelf) [ Ask TSelf ("bank1 install " ++ String.fromInt release.binSize ++ " " ++ release.binCrc) 120000 0 unit.unit ]

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
            case ( incoming.unsent, answerFor TSelf incoming ) of
                ( Just TSelf, _ ) ->
                    before (NothingFlashed "The unit was disconnected before the install was sent")

                ( _, Just (Said _ end) ) ->
                    if String.startsWith "OK bank1 verified " end then
                        to (Post Staged RestartingSelf) [ Back 180 True unit.unit ]

                    else if end == "OK already installed" then
                        to (Post Staged Verifying) [ status unit.unit TVerify 0 ]

                    else if isOk end then
                        to (Post Staged RestartingSelf) [ Back 180 True unit.unit ]

                    else
                        -- An ERR is the verb refused: the unit isn't writing.
                        before (SelfRefused end)

                ( _, Just Gone ) ->
                    to (Post Staged RestartingSelf) [ Back 180 True unit.unit ]

                ( _, Just NoAnswer ) ->
                    to (Post Staged RestartingSelf) [ Back 180 True unit.unit ]

                ( _, Nothing ) ->
                    ignore

        -- Back as the new firmware: bank 1 written and checked (`bank1 last
        -- ok <crc>`), the build, bank 2 open; or the old firmware, untouched.
        Post bk2 RestartingSelf ->
            case incoming.back of
                Just (Err cause) ->
                    after bk2 (SelfNotBack cause)

                Just (Ok ((Said lines _) as answer)) ->
                    case bank1Last lines of
                        Just ( "aborted", why ) ->
                            before (SelfAborted why)

                        Just ( "ok", crc ) ->
                            if crcEq crc release.binCrc then
                                case verdict release answer of
                                    Installed now ->
                                        ( Model { fields | stage = Done unit release now }, [] )

                                    NeedsInstall _ ->
                                        to (Post bk2 (Installing 1)) [ install unit.unit 0 ]

                                    NotFinished why ->
                                        after bk2 (Unfinished why)

                            else
                                after bk2 (Unfinished ("The unit says bank1 last ok " ++ crc ++ ", not this release's CHIMERA.BIN (" ++ release.binCrc ++ ")"))

                        Just ( word, rest ) ->
                            after bk2 (Unfinished ("The unit says bank1 last " ++ word ++ " " ++ rest))

                        Nothing ->
                            after bk2 (Unfinished "The unit's status has no bank1 line")

                Just (Ok answer) ->
                    after bk2 (Unfinished (Maybe.withDefault "no status" (verdictWhy (verdict release answer))))

                Nothing ->
                    ignore

        Pre (EnteringDfu bk2) ->
            case ( incoming.unsent, answerFor TDfu incoming ) of
                -- Never sent: the unit is as it was.
                ( Just TDfu, _ ) ->
                    before (NothingFlashed "The unit was disconnected before the request for update mode was sent")

                ( _, Just (Said _ end) ) ->
                    if isOk end then
                        to (Pre (FindingDevice bk2)) [ FindDevice 10 ]

                    else
                        before (NothingFlashed ("The unit refused update mode: " ++ end))

                -- Sent: the OK was lost to the reset, not refused.
                ( _, Just Gone ) ->
                    to (Pre (FindingDevice bk2)) [ FindDevice 10 ]

                ( _, Just NoAnswer ) ->
                    before (DfuSilent bk2)

                ( _, Nothing ) ->
                    ignore

        Pre (FindingDevice bk2) ->
            incoming.device |> Maybe.map (device { bk2 = bk2, flash = Untouched }) |> Maybe.withDefault ignore

        Pre (PickingDevice at) ->
            incoming.device |> Maybe.map (device at) |> Maybe.withDefault ignore

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
            case ( incoming.written, incoming.write ) of
                ( Just progress, _ ) ->
                    to (Writing at progress) []

                ( Nothing, Just outcome ) ->
                    case outcome of
                        WriteOk ->
                            to (Post at.bk2 Restarting) [ Back 120 False unit.unit ]

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

        Post bk2 Restarting ->
            case incoming.back of
                Just (Err cause) ->
                    after bk2 (NotBack cause)

                Just (Ok answer) ->
                    case verdict release answer of
                        Installed now ->
                            ( Model { fields | stage = Done unit release now }, [] )

                        -- A difference from the script, kept on purpose: where
                        -- `chimera-usb.py update` stops on a staged .bk2 its first boot
                        -- didn't install, this sends `bank2 install` (the unit
                        -- installs the staged file, or says why not).
                        NeedsInstall _ ->
                            case bk2 of
                                Staged ->
                                    to (Post bk2 (Installing 1)) [ install unit.unit 0 ]

                                AfterFlash ->
                                    to (Post bk2 (CopyingLate { done = 0, total = release.bk2Size })) [ Put release ]

                        NotFinished why ->
                            after bk2 (Unfinished why)

                Nothing ->
                    ignore

        Post bk2 (CopyingLate _) ->
            case ( incoming.copied, answerFor TPut incoming ) of
                ( Just progress, _ ) ->
                    to (Post bk2 (CopyingLate progress)) []

                ( Nothing, Just (Said _ end) ) ->
                    if String.startsWith "OK staged:" end then
                        after bk2 (Unfinished (String.dropLeft 3 end ++ later))

                    else if isOk end then
                        to (Post bk2 (Installing 1)) [ install unit.unit 0 ]

                    else
                        after bk2 (Unfinished ("Copying CHIMERA.BK2 after the flash: " ++ end))

                ( Nothing, Just NoAnswer ) ->
                    after bk2 (Unfinished "The unit stopped answering while CHIMERA.BK2 was copied")

                ( Nothing, Just Gone ) ->
                    after bk2 (Unfinished "The unit was disconnected while CHIMERA.BK2 was copied")

                ( Nothing, Nothing ) ->
                    ignore

        Post bk2 (Installing tries) ->
            case answerFor TInstall incoming of
                Just (Said _ end) ->
                    if String.startsWith "OK bank2 open " end then
                        to (Post bk2 RestartingAfterInstall) [ Back 60 True unit.unit ]

                    else if isOk end then
                        to (Post bk2 Verifying) [ status unit.unit TVerify 0 ]

                    else if end == "ERR bank2: busy" && tries < 5 then
                        -- 0.2 s between tries, as the script waits.
                        to (Post bk2 (Installing (tries + 1))) [ install unit.unit 200 ]

                    else
                        after bk2 (Unfinished (installRefusal end))

                -- The install may have opened the door and restarted the unit.
                Just Gone ->
                    to (Post bk2 RestartingAfterInstall) [ Back 60 True unit.unit ]

                Just NoAnswer ->
                    after bk2 (Unfinished "The unit didn't answer bank2 install")

                Nothing ->
                    ignore

        Post bk2 RestartingAfterInstall ->
            case incoming.back of
                Just (Err cause) ->
                    after bk2 (NotBack cause)

                Just (Ok answer) ->
                    finish unit release bk2 answer fields

                Nothing ->
                    ignore

        Post bk2 Verifying ->
            case answerFor TVerify incoming of
                Just answer ->
                    finish unit release bk2 answer fields

                Nothing ->
                    ignore


reading : Maybe UnitNow -> ReleaseState -> Fields -> ( Model, List Request )
reading maybeUnit rel fields =
    case ( maybeUnit, rel ) of
        ( Just unit, Got _ ) ->
            ( Model { fields | stage = Ready unit rel }, [] )

        ( Just unit, Missing _ ) ->
            ( Model { fields | stage = Ready unit rel }, [] )

        ( Just _, Fetching ) ->
            ( Model { fields | stage = Reading maybeUnit rel }, [] )

        ( Nothing, _ ) ->
            ( Model { fields | stage = Reading maybeUnit rel }, [] )


releaseState : Result String Release -> ReleaseState
releaseState result =
    case result of
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
finish unit release bk2 answer fields =
    case verdict release answer of
        Installed now ->
            ( Model { fields | stage = Done unit release now }, [] )

        NeedsInstall said ->
            ( Model { fields | stage = StoppedAfter unit release bk2 (Unfinished ("The unit says " ++ said ++ ", not bank2 open " ++ release.version ++ " seal=" ++ release.seal ++ " (a staged CHIMERA.BK2 stays on the card for the next start)")) }, [] )

        NotFinished why ->
            ( Model { fields | stage = StoppedAfter unit release bk2 (Unfinished why) }, [] )
