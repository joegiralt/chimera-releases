-- SPDX-License-Identifier: GPL-3.0-or-later


module Update.Hand exposing (hand)

{-| A hand on the update's page: the model and the requests it sends.
-}

import Update.Step exposing (status)
import Update.Types exposing (Bk2(..), Flash(..), InDfu, Loaded, Mode(..), Model(..), Msg(..), PostFail(..), PostRun(..), PreFail(..), PreRun(..), Release, ReleaseState(..), Request(..), Run(..), Stage(..), Ticket(..), UnitNow, confirmOf, pickingOf, readyOf, stoppedAfterOf, stoppedBeforeOf)


hand : Msg -> Model -> ( Model, List Request )
hand msg ((Model fields) as model) =
    let
        ignore : ( Model, List Request )
        ignore =
            ( model, [] )

        go : Stage -> List Request -> ( Model, List Request )
        go stage reqs =
            ( Model { fields | stage = stage }, reqs )

        pickAgain : ( UnitNow, Release, PreFail ) -> ( Model, List Request )
        pickAgain ( unit, release, failure ) =
            case inUpdateMode failure of
                Just inDfu ->
                    go (Running unit release (Pre (PickingDevice inDfu))) [ PickDevice ]

                Nothing ->
                    ignore
    in
    case msg of
        FromJs _ ->
            ignore

        Choose ->
            case readyOf fields.stage of
                Just ( unit, rel ) ->
                    go (Choosing unit rel) [ ChooseFiles ]

                Nothing ->
                    ignore

        Start ->
            case readyOf fields.stage of
                Just ( unit, Got release ) ->
                    go (Confirm unit release) []

                Just ( _, Fetching ) ->
                    ignore

                Just ( _, Missing _ ) ->
                    ignore

                Nothing ->
                    ignore

        Go ->
            case confirmOf fields.stage of
                Just ( unit, release ) ->
                    case fields.mode of
                        Connected ->
                            go (Running unit release (Pre Checking)) [ status unit.unit TStatus 0 ]

                        -- Already in update mode: the device first (a click).
                        -- It may hold half an image: touched until written whole.
                        Stuck ->
                            go (Running unit release (Pre (PickingDevice { bk2 = AfterFlash, flash = Touched }))) []

                Nothing ->
                    ignore

        Cancel ->
            case ( confirmOf fields.stage, pickingOf fields.stage, unsavedOf fields.stage ) of
                ( Just ( unit, release ), _, _ ) ->
                    go (Ready unit (Got release)) []

                ( Nothing, Just ( unit, release, bk2 ), _ ) ->
                    go (StoppedBefore unit release (PickCancelled bk2)) []

                -- Unsaved changes, and the user keeps them: back to the offer.
                ( Nothing, Nothing, Just ( unit, release, _ ) ) ->
                    go (Ready unit (Got release)) []

                ( Nothing, Nothing, Nothing ) ->
                    ignore

        SaveAndUpdate ->
            case unsavedOf fields.stage of
                Just ( unit, release, _ ) ->
                    go (Running unit release (Pre (Saving False))) [ Ask TSave "ed project save" 15000 0 unit.unit ]

                Nothing ->
                    ignore

        DiscardAndUpdate ->
            case unsavedOf fields.stage of
                Just ( unit, release, Just loaded ) ->
                    go (Running unit release (Pre Discarding)) [ Ask TSave ("ed project load " ++ String.fromInt loaded.id ++ " " ++ String.fromInt loaded.gen ++ " discard") 15000 0 unit.unit ]

                Just ( _, _, Nothing ) ->
                    ignore

                Nothing ->
                    ignore

        Pick ->
            case ( pickingOf fields.stage, stoppedBeforeOf fields.stage ) of
                ( Just _, _ ) ->
                    ( model, [ PickDevice ] )

                ( Nothing, Just stopped ) ->
                    pickAgain stopped

                ( Nothing, Nothing ) ->
                    ignore

        -- The click is the chooser's gesture: the device is picked again.
        WriteAgain ->
            case ( stoppedBeforeOf fields.stage, stoppedAfterOf fields.stage ) of
                ( Just stopped, _ ) ->
                    pickAgain stopped

                ( Nothing, Just ( unit, release, ( bk2, WriteCut _ ) ) ) ->
                    go (Running unit release (Pre (PickingDevice { bk2 = bk2, flash = Touched }))) [ PickDevice ]

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
            afterAgain fields.stage |> Maybe.map (\( stage, reqs ) -> go stage reqs) |> Maybe.withDefault ignore

        TryAgain ->
            case stoppedBeforeOf fields.stage of
                Just ( unit, release, failure ) ->
                    case failure of
                        Unsaved _ ->
                            go (Running unit release (Pre Checking)) [ status unit.unit TStatus 0 ]

                        NothingFlashed _ ->
                            go (Running unit release (Pre Checking)) [ status unit.unit TStatus 0 ]

                        GarbledBefore _ ->
                            go (Running unit release (Pre Checking)) [ status unit.unit TStatus 0 ]

                        DfuSilent _ ->
                            go (Running unit release (Pre Checking)) [ status unit.unit TStatus 0 ]

                        SelfRefused _ ->
                            go (Running unit release (Pre Checking)) [ status unit.unit TStatus 0 ]

                        SelfAborted _ ->
                            go (Running unit release (Pre Checking)) [ status unit.unit TStatus 0 ]

                        OtherUnitBefore _ ->
                            go (Running unit release (Pre Checking)) [ status unit.unit TStatus 0 ]

                        PickCancelled _ ->
                            ignore

                        WrongDevice _ _ ->
                            ignore

                        CantOpen _ ->
                            ignore

                        Guarded _ _ ->
                            ignore

                Nothing ->
                    afterAgain fields.stage |> Maybe.map (\( stage, reqs ) -> go stage reqs) |> Maybe.withDefault ignore

        ConnectPort ->
            case stoppedAfterOf fields.stage of
                Just ( unit, release, ( bk2, failure ) ) ->
                    let
                        ( wait, secs ) =
                            waitAgain unit failure
                    in
                    go (Running unit release (Post bk2 wait)) [ PickPort, Back secs False unit.unit ]

                Nothing ->
                    ignore

        -- The self-update refused or undone: the same update by DFU instead.
        UseDfu ->
            case stoppedBeforeOf fields.stage of
                Just ( unit, release, SelfRefused _ ) ->
                    go (Running { unit | selfUpdate = Nothing } release (Pre Checking)) [ status unit.unit TStatus 0 ]

                Just ( unit, release, SelfAborted _ ) ->
                    go (Running { unit | selfUpdate = Nothing } release (Pre Checking)) [ status unit.unit TStatus 0 ]

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

                Just ( _, _, OtherUnitBefore _ ) ->
                    ignore

                Nothing ->
                    ignore

        Close ->
            let
                closing : ( Model, List Request )
                closing =
                    go Closing [ End ]
            in
            case fields.stage of
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
afterAgain stage =
    stoppedAfterOf stage
        |> Maybe.andThen
            (\( unit, release, ( bk2, failure ) ) ->
                let
                    ( wait, secs ) =
                        waitAgain unit failure

                    again : Maybe ( Stage, List Request )
                    again =
                        Just ( Running unit release (Post bk2 wait), [ Back secs False unit.unit ] )
                in
                case failure of
                    WriteCut _ ->
                        Nothing

                    LeaveFailed _ ->
                        again

                    NotBack _ ->
                        again

                    Unfinished _ ->
                        again

                    GarbledAfter _ ->
                        again

                    SelfNotBack _ ->
                        again

                    OtherUnit _ ->
                        again
            )


{-| The wait for the unit after a stop past the write: the self-update's
(three minutes, its `bank1 last` read) after its own install, else the DFU
write's.
-}
waitAgain : UnitNow -> PostFail -> ( PostRun, Int )
waitAgain unit failure =
    case ( failure, unit.selfUpdate ) of
        ( SelfNotBack _, _ ) ->
            ( RestartingSelf, 180 )

        ( OtherUnit _, Just _ ) ->
            ( RestartingSelf, 180 )

        ( OtherUnit _, Nothing ) ->
            ( Restarting, 120 )

        ( WriteCut _, _ ) ->
            ( Restarting, 120 )

        ( LeaveFailed _, _ ) ->
            ( Restarting, 120 )

        ( NotBack _, _ ) ->
            ( Restarting, 120 )

        ( Unfinished _, _ ) ->
            ( Restarting, 120 )

        ( GarbledAfter _, _ ) ->
            ( Restarting, 120 )


{-| A stop that left the unit in update mode with nothing written: its DFU
device can be picked again.
-}
inUpdateMode : PreFail -> Maybe InDfu
inUpdateMode failure =
    case failure of
        DfuSilent bk2 ->
            Just { bk2 = bk2, flash = Untouched }

        PickCancelled inDfu ->
            Just inDfu

        WrongDevice inDfu _ ->
            Just inDfu

        CantOpen inDfu ->
            Just inDfu

        Guarded inDfu _ ->
            Just inDfu

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

        OtherUnitBefore _ ->
            Nothing


{-| A stop on unsaved changes: the loaded project, if it can be reloaded.
-}
unsavedOf : Stage -> Maybe ( UnitNow, Release, Maybe Loaded )
unsavedOf stage =
    case stoppedBeforeOf stage of
        Just ( unit, release, Unsaved loaded ) ->
            Just ( unit, release, loaded )

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

        Just ( _, _, OtherUnitBefore _ ) ->
            Nothing

        Nothing ->
            Nothing
