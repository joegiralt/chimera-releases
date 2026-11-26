-- SPDX-License-Identifier: GPL-3.0-or-later


module Update.Hand exposing (hand)

{-| A hand on the update's page: the model and the requests it sends.
-}

import Update.Step exposing (status)
import Update.Types exposing (Bk2(..), Flash(..), InDfu, Loaded, Mode(..), Model(..), Msg(..), PostFail(..), PostRun(..), PreFail(..), PreRun(..), Release, ReleaseState(..), Request(..), Run(..), Stage(..), Ticket(..), UnitNow, confirmOf, pickingOf, readyOf, stoppedAfterOf, stoppedBeforeOf)


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
                            go (Running u r (Pre Checking)) [ status u.unit TStatus 0 ]

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
                    go (Running u r (Pre (Saving False))) [ Ask TSave "ed project save" 15000 0 u.unit ]

                Nothing ->
                    ignore

        DiscardAndUpdate ->
            case unsavedOf m.stage of
                Just ( u, r, Just l ) ->
                    go (Running u r (Pre Discarding)) [ Ask TSave ("ed project load " ++ String.fromInt l.id ++ " " ++ String.fromInt l.gen ++ " discard") 15000 0 u.unit ]

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
                            go (Running u r (Pre Checking)) [ status u.unit TStatus 0 ]

                        NothingFlashed _ ->
                            go (Running u r (Pre Checking)) [ status u.unit TStatus 0 ]

                        GarbledBefore _ ->
                            go (Running u r (Pre Checking)) [ status u.unit TStatus 0 ]

                        DfuSilent _ ->
                            go (Running u r (Pre Checking)) [ status u.unit TStatus 0 ]

                        SelfRefused _ ->
                            go (Running u r (Pre Checking)) [ status u.unit TStatus 0 ]

                        SelfAborted _ ->
                            go (Running u r (Pre Checking)) [ status u.unit TStatus 0 ]

                        OtherUnitBefore _ ->
                            go (Running u r (Pre Checking)) [ status u.unit TStatus 0 ]

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
                    go (Running { u | selfUpdate = Nothing } r (Pre Checking)) [ status u.unit TStatus 0 ]

                Just ( u, r, SelfAborted _ ) ->
                    go (Running { u | selfUpdate = Nothing } r (Pre Checking)) [ status u.unit TStatus 0 ]

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

        OtherUnitBefore _ ->
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

        Just ( _, _, OtherUnitBefore _ ) ->
            Nothing

        Nothing ->
            Nothing
