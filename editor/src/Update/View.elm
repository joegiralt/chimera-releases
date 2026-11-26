-- SPDX-License-Identifier: GPL-3.0-or-later


module Update.View exposing (view)

{-| The update's page: where the update is, and what to do.
-}

import Html exposing (Html, a, button, div, li, ol, p, span, text)
import Html.Attributes exposing (attribute, class, href, rel, style, target)
import Html.Events exposing (onClick)
import Links
import Ui.Chip as Chip
import Ui.Module as Module
import Ui.Page as Page
import Update.Read exposing (offer, trimPlus)
import Update.Types exposing (Fields, Flash(..), InDfu, Mode(..), Model(..), Msg(..), Offer(..), PostFail(..), PostRun(..), PreFail(..), PreRun(..), Progress, Release, ReleaseState(..), Run(..), Source(..), Stage(..), UnitNow)


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
            [ say "The unit may be updating itself: don't power it off or unplug it." ]

        Pre (EnteringDfu _) ->
            [ say "Don't unplug the unit or power it off." ]

        Pre (FindingDevice _) ->
            [ say "Don't unplug the unit or power it off." ]

        Writing _ _ ->
            [ say "Don't unplug the unit or power it off." ]

        Post _ RestartingSelf ->
            [ say "The unit may be updating itself: don't power it off or unplug it. It writes its firmware, restarts and installs bank 2, then comes back here by itself (up to three minutes)." ]

        Post _ Restarting ->
            [ say "Don't unplug the unit or power it off." ]

        Post _ (CopyingLate _) ->
            [ say "Don't unplug the unit or power it off." ]

        Post _ (Installing _) ->
            [ say "Don't unplug the unit or power it off." ]

        Post _ RestartingAfterInstall ->
            [ say "Don't unplug the unit or power it off." ]

        Post _ Verifying ->
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
            , a [ href Links.latestUrl, target "_blank", rel "noopener" ] [ text "release page" ]
            , text "; hold MENU while you power the unit on, press button 3 (SD card access), copy both files to the card's top folder (choose Replace) and eject it; press MENU, step with − / + until it shows CHIMERA.BIN, and press button 1. Chimera installs CHIMERA.BK2 on its first start: leave it on while the screen says DON'T POWER OFF."
            ]
        ]
    ]


sdSteps : List (Html Msg)
sdSteps =
    [ say "Or use the SD card instead:"
    , ol []
        [ li [] [ text "Get CHIMERA.BIN and CHIMERA.BK2 from the ", a [ href Links.latestUrl, target "_blank", rel "noopener" ] [ text "release page" ], text "." ]
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
            , say "The unit may still be updating itself: don't power it off or unplug it while its screen shows it working."
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
