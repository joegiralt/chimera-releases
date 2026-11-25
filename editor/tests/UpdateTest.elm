-- SPDX-License-Identifier: GPL-3.0-or-later


module UpdateTest exposing (suite)

import Expect
import Html
import Json.Encode as E
import Test exposing (Test, describe, test)
import Test.Html.Query as Query
import Test.Html.Selector as Sel
import Ui.Page as Page
import Ui.Tokens as Tokens
import Update exposing (Answer(..), Bk2(..), Device(..), Event(..), Flash(..), InDfu, Msg(..), Offer(..), PostFail(..), PostRun(..), PreFail(..), PreRun(..), Release, ReleaseState(..), Request(..), Run(..), Source(..), Stage(..), Ticket(..), Verdict(..), WriteResult(..))


rel : Release
rel =
    { version = "0.4.1 abcd1234", seal = "0123456789abcdef", format = 2, binSize = 900000, bk2Size = 1048576, binSha = "b1n", bk2Sha = "b2k", source = Latest }


status : String -> String -> String -> Answer
status build state bank2 =
    Said [ "firmware 0.4.1 release", "build " ++ build, "protocol 4", "state " ++ state, "bank2 " ++ bank2 ] "OK"


old : Answer
old =
    status "0.4.0 de07edf9" "SAVED" "open 0.4.0 de07edf9 seal=ffffffffffffffff"


new : Answer
new =
    status "0.4.1 abcd1234" "NEW" "open 0.4.1 abcd1234 seal=0123456789abcdef"


newUnit : Update.UnitNow
newUnit =
    Update.readStatus [ "build 0.4.1 abcd1234", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef" ]


unit : Update.UnitNow
unit =
    Update.readStatus [ "build 0.4.0 de07edf9", "state SAVED", "bank2 open 0.4.0 de07edf9 seal=ffffffffffffffff" ]


opened : List Event
opened =
    [ Begun { open = True, webusb = True, windows = False }, Answered TStatus old, ReleaseIs (Ok rel) ]


events : List Event -> Update.Model -> Update.Model
events es m =
    List.foldl (\e acc -> Update.step e acc |> Tuple.first) m es


hands : List Msg -> Update.Model -> Update.Model
hands msgs m =
    List.foldl (\msg acc -> Update.update msg acc |> (\( next, _, _ ) -> next)) m msgs


steps : List Event -> Update.Model -> ( Stage, List Request )
steps es m =
    List.foldl (\e ( acc, reqs ) -> Update.step e acc |> Tuple.mapSecond ((++) reqs)) ( m, [] ) es
        |> Tuple.mapFirst Update.stage


{-| The panel open on `old` with the release, START and GO pressed: CHECKING.
-}
started : Update.Model
started =
    events opened (Tuple.first Update.begin) |> hands [ Start, Go ]


{-| Through the flash: copied (staged or not), dfu, the device, the write.
-}
flashed : Answer -> Update.Model
flashed put =
    events [ Answered TStatus old, Answered TPut put, Answered TDfu Gone, DeviceIs Found, WriteDone WriteOk ] started


oldPut : String
oldPut =
    "ERR put takes /CHIMERA/PROJECTS/P#######.A or /CHIMERA/SOUNDS/S#######.A [--over], its size and CRC-32 in hex"


offerOf : String -> Offer
offerOf build =
    Update.offer (Update.readStatus [ "build " ++ build ]) rel


shown : Update.Model -> Query.Single Update.Msg
shown m =
    Update.view (\_ -> Update.Close) identity (Page.init Tokens.Day) m |> List.singleton |> Html.div [] |> Query.fromHtml


isGarbled : Event -> Bool
isGarbled e =
    case e of
        Garbled _ ->
            True

        Begun _ ->
            False

        ReleaseIs _ ->
            False

        ReleaseCancelled ->
            False

        Answered _ _ ->
            False

        Copied _ ->
            False

        Written _ ->
            False

        DeviceIs _ ->
            False

        WriteDone _ ->
            False

        BackDone _ ->
            False

        Mismatch _ ->
            False

        Ended _ ->
            False

        Unrelated ->
            False


suite : Test
suite =
    describe "Update"
        [ test "status_is_read" <|
            \_ ->
                Expect.equal { build = Just "0.4.0 de07edf9", modified = False, bank2 = Just "open 0.4.0 de07edf9 seal=ffffffffffffffff", selfUpdate = Nothing } unit
        , test "the_panel_asks_status_and_the_release_and_shows_both" <|
            \_ ->
                Expect.equal ( Ready unit (Got rel), [ Ask TStatus "status" 2000 0, FetchLatest ] )
                    (steps opened (Tuple.first Update.begin))
        , test "no_link_says_so" <|
            \_ -> Expect.equal NoLink (steps [ Begun { open = False, webusb = True, windows = False } ] (Tuple.first Update.begin) |> Tuple.first)
        , describe "versions, by their numbers"
            [ test "newer_same_other_build_unknown" <|
                \_ -> Expect.equal [ Newer, Same, OtherBuild, Unknown ] [ offerOf "0.4.0 de07edf9", offerOf "0.4.1 abcd1234+", offerOf "0.4.1 ffff0000", Update.offer (Update.readStatus []) rel ]
            , test "an_older_release_is_a_downgrade" <|
                \_ -> Expect.equal [ Older, Older, Older ] [ offerOf "0.5.0 11112222", offerOf "0.4.2 11112222", offerOf "1.0.0 11112222" ]
            , test "not_a_string_compare" <|
                -- "0.10.0" sorts before "0.9.0" as text; as numbers it is newer.
                \_ -> Expect.equal Older (Update.offer (Update.readStatus [ "build 0.10.0 aaaa0000" ]) { rel | version = "0.9.0 bbbb1111" })
            , test "parsed" <|
                \_ -> Expect.equal (Just { major = 0, minor = 10, patch = 2, build = "abc" }) (Update.parseVersion "0.10.2 abc+")
            ]
        , test "go_asks_status_first" <|
            \_ -> Expect.equal (Running unit rel (Pre Checking)) (Update.stage started)
        , describe "unsaved changes: save or drop them, and the update goes on"
            [ test "modified_reads_the_loaded_project_through_its_pages_then_asks" <|
                \_ ->
                    Expect.equal ( StoppedBefore unit rel (Unsaved (Just { id = 3, gen = 7 })), [ Ask TProject "ed since 0" 2000 0, Ask TProject "ed since 41" 2000 0 ] )
                        (steps
                            [ Answered TStatus (status "0.4.0 de07edf9" "MODIFIED" "open")
                            , Answered TProject (Said [ "part 5 DRUM", "val DRUM.PAD1 0 0 \"0\"" ] "OK 41 more")
                            , Answered TProject (Said [ "project \"MY SONG\" 3 edited gen 7", "sound 1 \"INIT\" edited" ] "OK 42")
                            ]
                            started
                        )
            , test "a_project_never_saved_can_only_be_saved" <|
                \_ ->
                    Expect.equal (StoppedBefore unit rel (Unsaved Nothing))
                        (steps [ Answered TStatus (status "0.4.0 de07edf9" "MODIFIED" "open"), Answered TProject (Said [ "project \"NEW PROJECT\" new edited gen -" ] "OK 9") ] started |> Tuple.first)
            , test "save_and_update_saves_waits_for_clean_then_copies" <|
                \_ ->
                    let
                        asked : Update.Model
                        asked =
                            events [ Answered TStatus (status "0.4.0 de07edf9" "MODIFIED" "open"), Answered TProject (Said [ "project \"MY SONG\" 3 edited gen 7" ] "OK 9") ] started

                        ( saving, saveReqs ) =
                            Update.press SaveAndUpdate asked
                    in
                    Expect.equal ( Running unit rel (Pre (Copying { done = 0, total = rel.bk2Size })), [ Ask TSave "ed project save" 15000 0, Ask TStatus "status" 2000 500, Ask TStatus "status" 2000 500, Put rel ] )
                        (steps [ Answered TSave (Said [] "OK"), Answered TStatus (status "0.4.0 de07edf9" "MODIFIED" "open"), Answered TStatus old ] saving
                            |> Tuple.mapSecond (\later -> saveReqs ++ later)
                        )
            , test "a_project_never_saved_is_saved_as_before_update" <|
                \_ ->
                    let
                        ( saving, _ ) =
                            Update.press SaveAndUpdate (events [ Answered TStatus (status "0.4.0 de07edf9" "MODIFIED" "open"), Answered TProject (Said [ "project \"NEW PROJECT\" new edited gen -" ] "OK 9") ] started)
                    in
                    Expect.equal ( Running unit rel (Pre (Saving True)), [ Ask TSave "ed project saveas BEFORE_UPDATE" 15000 0 ] )
                        (steps [ Answered TSave (Said [] "ERR ed project save has no file of its own: saveas") ] saving)
            , test "discard_and_update_reloads_with_discard" <|
                \_ ->
                    let
                        ( discarding, reqs ) =
                            Update.press DiscardAndUpdate (events [ Answered TStatus (status "0.4.0 de07edf9" "MODIFIED" "open"), Answered TProject (Said [ "project \"MY SONG\" 3 edited gen 7" ] "OK 9") ] started)
                    in
                    Expect.equal ( Running unit rel (Pre Discarding), [ Ask TSave "ed project load 3 7 discard" 15000 0 ] ) ( Update.stage discarding, reqs )
            , test "cancel_keeps_the_changes_and_goes_back_to_the_offer" <|
                \_ ->
                    Expect.equal (Ready unit (Got rel))
                        (Update.stage (hands [ Cancel ] (events [ Answered TStatus (status "0.4.0 de07edf9" "MODIFIED" "open"), Answered TProject (Said [ "project \"MY SONG\" 3 edited gen 7" ] "OK 9") ] started)))
            ]
        , test "the_self_update_path_puts_both_files_then_installs_no_dfu" <|
            \_ ->
                let
                    su : Update.SelfUpdate
                    su =
                        { binRemote = "/CHIMERA/SYSTEM/BANK1.BIN", install = "selfinstall" }

                    going : Update.Model
                    going =
                        events opened (Tuple.first Update.begin) |> Update.withSelfUpdate su |> hands [ Start, Go ]

                    suUnit : Update.UnitNow
                    suUnit =
                        { unit | selfUpdate = Just su }
                in
                Expect.equal ( Done suUnit rel newUnit, [ Put rel, PutBin rel "/CHIMERA/SYSTEM/BANK1.BIN", Ask TSelf "selfinstall" 120000 0, Back 120 True ] )
                    (steps
                        [ Answered TStatus old
                        , Answered TPut (Said [] "OK")
                        , Copied { done = 5, total = 10 }
                        , Answered TPutBin (Said [] "OK")
                        , Answered TSelf (Said [] "OK installing")
                        , BackDone (Ok (Said [ "build 0.4.1 abcd1234", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef" ] "OK"))
                        ]
                        going
                    )
        , test "without_the_capability_the_dfu_path" <|
            \_ -> Expect.equal Nothing (Update.readStatus [ "build 0.4.0 de07edf9", "selfupdate yes" ]).selfUpdate
        , test "the_offer_on_connect_compares_hello_builds" <|
            \_ -> Expect.equal [ Newer, Same, Older ] [ Update.offerFor "0.4.0-de07edf9" "0.4.1 abcd1234", Update.offerFor "0.4.1-abcd1234" "0.4.1 abcd1234", Update.offerFor "0.5.0-11112222" "0.4.1 abcd1234" ]
        , test "the_happy_path_stages_then_flashes_then_checks" <|
            \_ ->
                Expect.equal ( Done unit rel newUnit, [ Put rel, Dfu, FindDevice 10, Write rel, Back 120 False ] )
                    (steps
                        [ Answered TStatus old
                        , Copied { done = 1000, total = 1048576 }
                        , Answered TPut (Said [] "OK")
                        , Answered TDfu Gone
                        , DeviceIs Found
                        , Written { done = 3, total = 10 }
                        , WriteDone WriteOk
                        , BackDone (Ok (Said [ "build 0.4.1 abcd1234", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef" ] "OK"))
                        ]
                        started
                    )
        , test "an_answer_to_another_request_changes_nothing" <|
            \_ -> Expect.equal ( Running unit rel (Pre Checking), [] ) (steps [ Answered TDfu Gone, Answered TPut (Said [] "OK"), Answered TVerify new, WriteDone WriteOk, BackDone (Ok new) ] started)
        , test "a_staged_bk2_not_installed_at_boot_gets_bank2_install" <|
            \_ ->
                Expect.equal ( Running unit rel (Post Staged (Installing 1)), [ Ask TInstall "bank2 install" 120000 0 ] )
                    (steps [ BackDone (Ok (status "0.4.1 abcd1234" "NEW" "empty")) ] (flashed (Said [] "OK")))
        , test "bank2_busy_is_asked_again_200_ms_later" <|
            \_ ->
                Expect.equal ( Running unit rel (Post Staged (Installing 2)), [ Ask TInstall "bank2 install" 120000 200 ] )
                    (steps [ Answered TInstall (Said [] "ERR bank2: busy") ] (events [ BackDone (Ok (status "0.4.1 abcd1234" "NEW" "empty")) ] (flashed (Said [] "OK"))))
        , test "older_firmware_takes_the_bk2_after_the_flash" <|
            \_ ->
                Expect.equal ( Done unit rel (Update.readStatus [ "firmware 0.4.1 release", "build 0.4.1 abcd1234", "protocol 4", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef" ]), [ Put rel, Ask TInstall "bank2 install" 120000 0, Back 60 True ] )
                    (steps
                        [ BackDone (Ok (status "0.4.1 abcd1234" "NEW" "empty"))
                        , Answered TPut (Said [] "OK")
                        , Answered TInstall (Said [ "audio stopped 812 ms" ] "OK bank2 open 0.4.1 abcd1234")
                        , BackDone (Ok new)
                        ]
                        (flashed (Said [] oldPut))
                    )
        , test "a_0_3_wording_names_bank2_for_a_big_bk2" <|
            \_ ->
                Expect.equal (Running unit rel (Pre (EnteringDfu AfterFlash)))
                    (steps [ Answered TStatus old, Answered TPut (Said [] "ERR put takes P#######.A, S#######.A or BANK2.BK2 (512 KB)") ] started |> Tuple.first)
        , test "another_put_refusal_stops_before_the_flash" <|
            \_ ->
                Expect.equal (StoppedBefore unit rel (NothingFlashed "The unit refused CHIMERA.BK2: ERR put: card full"))
                    (steps [ Answered TStatus old, Answered TPut (Said [] "ERR put: card full") ] started |> Tuple.first)
        , test "an_unplug_mid_copy_stops_with_nothing_flashed" <|
            \_ ->
                Expect.equal (StoppedBefore unit rel (NothingFlashed "The unit was disconnected while CHIMERA.BK2 was copied"))
                    (steps [ Answered TStatus old, Copied { done = 5, total = 10 }, Answered TPut Gone ] started |> Tuple.first)
        , test "no_answer_to_dfu_says_it_may_be_in_update_mode_and_can_go_on" <|
            \_ ->
                let
                    silent : Update.Model
                    silent =
                        events [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu NoAnswer ] started
                in
                Expect.equal [ StoppedBefore unit rel (DfuSilent Staged), Running unit rel (Pre (PickingDevice { bk2 = Staged, flash = Untouched })) ]
                    [ Update.stage silent, Update.stage (hands [ Pick ] silent) ]
        , test "no_new_device_asks_for_a_pick" <|
            \_ ->
                Expect.equal (Running unit rel (Pre (PickingDevice { bk2 = Staged, flash = Untouched })))
                    (steps [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs NotFound ] started |> Tuple.first)
        , test "the_pick_stage_can_be_cancelled_and_written_again" <|
            \_ ->
                let
                    picking : Update.Model
                    picking =
                        events [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs NotFound ] started

                    cancelled : Update.Model
                    cancelled =
                        hands [ Cancel ] picking
                in
                Expect.equal [ StoppedBefore unit rel (PickCancelled { bk2 = Staged, flash = Untouched }), Running unit rel (Pre (PickingDevice { bk2 = Staged, flash = Untouched })) ]
                    [ Update.stage cancelled, Update.stage (hands [ WriteAgain ] cancelled) ]
        , test "a_pick_that_comes_back_empty_stops_with_write_again" <|
            \_ ->
                Expect.equal (StoppedBefore unit rel (PickCancelled { bk2 = Staged, flash = Untouched }))
                    (steps [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs NotFound, DeviceIs Cancelled ] started |> Tuple.first)
        , test "the_wrong_device_is_refused_before_writing" <|
            \_ ->
                Expect.equal ( StoppedBefore unit rel (WrongDevice { bk2 = Staged, flash = Untouched } "two"), [ Put rel, Dfu, FindDevice 10 ] )
                    (steps [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs (Wrong "two") ] started)
        , test "a_device_that_wont_open_can_write_again" <|
            \_ ->
                let
                    stopped : Update.Model
                    stopped =
                        events [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs Found, WriteDone Unopenable ] started
                in
                Expect.equal [ StoppedBefore unit rel (CantOpen { bk2 = Staged, flash = Untouched }), Running unit rel (Pre (PickingDevice { bk2 = Staged, flash = Untouched })) ]
                    [ Update.stage stopped, Update.stage (hands [ WriteAgain ] stopped) ]
        , test "a_cut_write_is_after_the_write_and_can_write_again" <|
            \_ ->
                let
                    stopped : Update.Model
                    stopped =
                        events [ Answered TStatus old, Answered TPut (Said [] oldPut), Answered TDfu Gone, DeviceIs Found, WriteDone (Cut True "gone") ] started
                in
                Expect.equal [ StoppedAfter unit rel AfterFlash (WriteCut "gone"), Running unit rel (Pre (PickingDevice { bk2 = AfterFlash, flash = Touched })) ]
                    [ Update.stage stopped, Update.stage (hands [ WriteAgain ] stopped) ]
        , test "a_write_that_never_started_wrote_nothing" <|
            \_ ->
                Expect.equal (StoppedBefore unit rel (Guarded { bk2 = Staged, flash = Untouched } "idle"))
                    (steps [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs Found, WriteDone (Refused False "idle") ] started |> Tuple.first)
        , test "a_failed_leave_is_firmware_written_not_a_cut" <|
            \_ ->
                let
                    stopped : Update.Model
                    stopped =
                        events [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs Found, WriteDone (LeaveFail "gone") ] started
                in
                Expect.equal [ StoppedAfter unit rel Staged (LeaveFailed "gone"), Running unit rel (Post Staged Restarting) ]
                    [ Update.stage stopped, Update.stage (hands [ CheckAgain ] stopped) ]
        , test "try_again_after_a_flash_asks_the_unit_never_starts_over" <|
            \_ ->
                let
                    unfinished : Update.Model
                    unfinished =
                        events [ BackDone (Ok (status "0.4.0 de07edf9" "NEW" "empty")) ] (flashed (Said [] "OK"))
                in
                Expect.equal [ StoppedAfter unit rel Staged (Unfinished "The unit says build 0.4.0 de07edf9: the new firmware (0.4.1 abcd1234) isn't the one running"), Running unit rel (Post Staged Restarting) ]
                    [ Update.stage unfinished, Update.stage (hands [ TryAgain ] unfinished) ]
        , test "not_back_can_check_again" <|
            \_ ->
                let
                    stopped : Update.Model
                    stopped =
                        events [ BackDone (Err "off") ] (flashed (Said [] "OK"))
                in
                Expect.equal [ StoppedAfter unit rel Staged (NotBack "off"), Running unit rel (Post Staged Restarting) ]
                    [ Update.stage stopped, Update.stage (hands [ CheckAgain ] stopped) ]
        , test "the_old_firmware_still_running_is_unfinished" <|
            \_ ->
                Expect.equal (NotFinished "The unit says build 0.4.0 de07edf9: the new firmware (0.4.1 abcd1234) isn't the one running") (Update.verdict rel old)
        , test "a_foreign_slot_is_said" <|
            \_ ->
                Expect.equal (NotFinished "The unit's MIXER slot (0x08180000) holds other code; bank 2 not installed")
                    (Update.verdict rel (status "0.4.1 abcd1234" "NEW" "slot foreign mixer"))
        , test "close_never_mid_update" <|
            \_ -> Expect.equal (Running unit rel (Pre Checking)) (Update.stage (hands [ Close ] started))
        , test "unsaved_then_try_again_asks_status_again" <|
            \_ ->
                Expect.equal (Running unit rel (Pre Checking))
                    (Update.stage (hands [ TryAgain ] (events [ Answered TStatus (status "0.4.0 de07edf9" "MODIFIED" "open"), Answered TProject (Said [] "OK 9") ] started)))
        , test "a_release_that_fails_its_checks_offers_choosing_files" <|
            \_ ->
                Expect.equal (Ready unit (Missing "CHIMERA.BIN does not match SHA256SUMS"))
                    (steps [ Begun { open = True, webusb = True, windows = False }, Answered TStatus old, ReleaseIs (Err "CHIMERA.BIN does not match SHA256SUMS") ] (Tuple.first Update.begin) |> Tuple.first)
        , test "chosen_files_replace_the_release" <|
            \_ ->
                let
                    ready : Update.Model
                    ready =
                        events [ Begun { open = True, webusb = True, windows = False }, Answered TStatus old, ReleaseIs (Err "unreachable") ] (Tuple.first Update.begin)
                in
                Expect.equal (Ready unit (Got { rel | source = Chosen }))
                    (steps [ ReleaseIs (Ok { rel | source = Chosen }) ] (hands [ Choose ] ready) |> Tuple.first)
        , test "a_cancelled_chooser_keeps_the_latest" <|
            \_ ->
                Expect.equal (Ready unit (Got rel))
                    (steps [ ReleaseCancelled ] (hands [ Choose ] (events opened (Tuple.first Update.begin))) |> Tuple.first)
        , test "close_ends" <|
            \_ -> Expect.equal Closing (Update.stage (hands [ Close ] (events opened (Tuple.first Update.begin))))
        , test "a_late_put_staged_for_another_firmware_is_unfinished" <|
            \_ ->
                Expect.equal (StoppedAfter unit rel AfterFlash (Unfinished "staged: needs firmware 0.4.2 (it installs at that firmware's next start)"))
                    (steps [ BackDone (Ok (status "0.4.1 abcd1234" "NEW" "empty")), Answered TPut (Said [] "OK staged: needs firmware 0.4.2") ] (flashed (Said [] oldPut)) |> Tuple.first)
        , test "verdicts" <|
            \_ ->
                Expect.equal [ Installed (Update.readStatus [ "firmware 0.4.1 release", "build 0.4.1 abcd1234", "protocol 4", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef" ]), NeedsInstall "bank2 empty" ]
                    [ Update.verdict rel new, Update.verdict rel (status "0.4.1 abcd1234" "NEW" "empty") ]
        , test "the_tab_is_held_while_it_writes_or_waits" <|
            \_ ->
                Expect.equal [ False, True, True, False ]
                    [ Update.holding started
                    , Update.holding (events [ Answered TStatus old ] started)
                    , Update.holding (flashed (Said [] "OK"))
                    , Update.holding (events [ BackDone (Err "off") ] (flashed (Said [] "OK")))
                    ]
        , test "a_stuck_unit_fetches_the_release_only_then_picks_the_device" <|
            \_ ->
                let
                    ready : Update.Model
                    ready =
                        events [ Begun { open = False, webusb = True, windows = False }, ReleaseIs (Ok rel) ] (Tuple.first Update.beginStuck)
                in
                Expect.equal [ Ready (Update.readStatus []) (Got rel), Running (Update.readStatus []) rel (Pre (PickingDevice { bk2 = AfterFlash, flash = Touched })) ]
                    [ Update.stage ready, Update.stage (hands [ Start, Go ] ready) ]
        , describe "the firmware area already touched (a cut write, a stuck unit)"
            [ test "write_again_after_a_cut_stays_touched_through_every_stop" <|
                \_ ->
                    let
                        cutThenPick : Update.Model
                        cutThenPick =
                            events [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs Found, WriteDone (Cut True "gone") ] started
                                |> hands [ WriteAgain ]

                        touched : InDfu
                        touched =
                            { bk2 = Staged, flash = Touched }
                    in
                    Expect.equal
                        [ Running unit rel (Pre (PickingDevice touched))
                        , StoppedBefore unit rel (PickCancelled touched)
                        , StoppedBefore unit rel (CantOpen touched)
                        , StoppedBefore unit rel (Guarded touched "layout")
                        , StoppedBefore unit rel (WrongDevice touched "two")
                        , StoppedAfter unit rel Staged (WriteCut "idle")
                        ]
                        [ Update.stage cutThenPick
                        , Update.stage (hands [ Cancel ] cutThenPick)
                        , Update.stage (events [ DeviceIs Found, WriteDone Unopenable ] cutThenPick)
                        , Update.stage (events [ DeviceIs Found, WriteDone (GuardRefused "layout") ] cutThenPick)
                        , Update.stage (events [ DeviceIs (Wrong "two") ] cutThenPick)

                        -- A refusal before this write's first erase is still past "nothing written".
                        , Update.stage (events [ DeviceIs Found, WriteDone (Refused False "idle") ] cutThenPick)
                        ]
            , test "a_stop_after_a_cut_never_says_nothing_was_written_or_unplug" <|
                \_ ->
                    events [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs Found, WriteDone (Cut True "gone") ] started
                        |> hands [ WriteAgain, Cancel ]
                        |> shown
                        |> Expect.all
                            [ Query.hasNot [ Sel.containing [ Sel.text "Nothing has been written" ] ]
                            , Query.hasNot [ Sel.containing [ Sel.text "starts its old firmware as before" ] ]
                            , Query.has [ Sel.containing [ Sel.text "ONLY PARTLY WRITTEN" ] ]
                            ]
            , test "the_stuck_path_starts_touched_and_says_the_version_is_unknown" <|
                \_ ->
                    let
                        ready : Update.Model
                        ready =
                            events [ Begun { open = False, webusb = True, windows = False }, ReleaseIs (Ok rel) ] (Tuple.first Update.beginStuck)
                    in
                    Expect.all
                        [ \_ -> shown ready |> Query.has [ Sel.containing [ Sel.text "Can't tell which version this unit had" ] ]
                        , \_ -> shown (hands [ Start, Go, Cancel ] ready) |> Query.hasNot [ Sel.containing [ Sel.text "Nothing has been written" ] ]
                        , \_ -> Expect.equal (StoppedBefore (Update.readStatus []) rel (PickCancelled { bk2 = AfterFlash, flash = Touched })) (Update.stage (hands [ Start, Go, Cancel ] ready))
                        ]
                        ()
            , test "an_untouched_stop_says_nothing_was_written" <|
                \_ ->
                    events [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs NotFound ] started
                        |> hands [ Cancel ]
                        |> shown
                        |> Query.has [ Sel.containing [ Sel.text "Nothing has been written" ] ]
            ]
        , describe "answers read strictly"
            [ test "a_malformed_answer_is_an_error_not_no_answer" <|
                \_ -> Expect.equal True (isGarbled (Update.decode (E.object [ ( "op", E.string "answer" ), ( "id", E.string "status" ) ])))
            , test "ok_false_is_not_a_write_done" <|
                \_ -> Expect.equal True (isGarbled (Update.decode (E.object [ ( "op", E.string "write" ), ( "ok", E.bool False ) ])))
            , test "an_explicit_no_answer_is_one" <|
                \_ -> Expect.equal (Answered TStatus NoAnswer) (Update.decode (E.object [ ( "op", E.string "answer" ), ( "id", E.string "status" ), ( "noAnswer", E.bool True ) ]))
            , test "garbled_mid_run_stops_on_its_side_of_the_write" <|
                \_ ->
                    Expect.equal [ StoppedBefore unit rel (GarbledBefore "x"), StoppedAfter unit rel Staged (GarbledAfter "x") ]
                        [ Update.stage (events [ Garbled "x" ] started), Update.stage (events [ Garbled "x" ] (flashed (Said [] "OK"))) ]
            , test "a_mismatched_release_stops" <|
                \_ -> Expect.equal (StoppedBefore unit rel (GarbledBefore "not it")) (Update.stage (events [ Answered TStatus old, Mismatch "not it" ] started))
            ]
        ]
