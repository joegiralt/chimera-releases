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
import Update
import Update.Read
import Update.Step
import Update.Types exposing (Answer(..), Bk2(..), Device(..), Event(..), Flash(..), InDfu, Msg(..), Offer(..), PostFail(..), PostRun(..), PreFail(..), PreRun(..), Release, ReleaseState(..), Request(..), Run(..), Source(..), Stage(..), Ticket(..), Verdict(..), WriteResult(..))
import Update.View
import Update.Wire


rel : Release
rel =
    { version = "0.4.1 abcd1234", seal = "0123456789abcdef", format = 2, binSize = 900000, bk2Size = 1048576, binSha = "b1n", bk2Sha = "b2k", binCrc = "0a1b2c3d", source = Latest }


selfOld : Answer
selfOld =
    Said [ "build 0.4.0 de07edf9", "state SAVED", "bank2 open 0.4.0 de07edf9 seal=ffffffffffffffff", "selfupdate 1" ] "OK"


selfUnit : Update.Types.UnitNow
selfUnit =
    { unit | selfUpdate = Just { version = 1 } }


selfBack : Answer
selfBack =
    Said [ "build 0.4.1 abcd1234", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef", "selfupdate 1", "bank1 last ok 0a1b2c3d" ] "OK"


selfNew : Update.Types.UnitNow
selfNew =
    Update.Read.readStatus [ "build 0.4.1 abcd1234", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef", "selfupdate 1", "bank1 last ok 0a1b2c3d" ]


selfStarted : Update.Types.Model
selfStarted =
    events [ Begun { open = True, webusb = True, windows = False }, Answered TStatus selfOld, ReleaseIs (Ok rel) ] (Tuple.first Update.begin) |> hands [ Start, Go ]


installing : Update.Types.Model
installing =
    events [ Answered TStatus selfOld, Answered TPut (Said [] "OK"), Answered TPutBin (Said [] "OK"), Answered TSelf (Said [] "OK bank1 verified 900000 0a1b2c3d, restarting") ] selfStarted


status : String -> String -> String -> Answer
status build state bank2 =
    Said [ "firmware 0.4.1 release", "build " ++ build, "protocol 4", "state " ++ state, "bank2 " ++ bank2 ] "OK"


old : Answer
old =
    status "0.4.0 de07edf9" "SAVED" "open 0.4.0 de07edf9 seal=ffffffffffffffff"


new : Answer
new =
    status "0.4.1 abcd1234" "NEW" "open 0.4.1 abcd1234 seal=0123456789abcdef"


newUnit : Update.Types.UnitNow
newUnit =
    Update.Read.readStatus [ "build 0.4.1 abcd1234", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef" ]


unit : Update.Types.UnitNow
unit =
    Update.Read.readStatus [ "build 0.4.0 de07edf9", "state SAVED", "bank2 open 0.4.0 de07edf9 seal=ffffffffffffffff" ]


opened : List Event
opened =
    [ Begun { open = True, webusb = True, windows = False }, Answered TStatus old, ReleaseIs (Ok rel) ]


events : List Event -> Update.Types.Model -> Update.Types.Model
events es m =
    List.foldl (\e acc -> Update.Step.step e acc |> Tuple.first) m es


hands : List Msg -> Update.Types.Model -> Update.Types.Model
hands msgs m =
    List.foldl (\msg acc -> Update.update msg acc |> (\( next, _, _ ) -> next)) m msgs


steps : List Event -> Update.Types.Model -> ( Stage, List Request )
steps es m =
    List.foldl (\e ( acc, reqs ) -> Update.Step.step e acc |> Tuple.mapSecond ((++) reqs)) ( m, [] ) es
        |> Tuple.mapFirst Update.stage


{-| The panel open on `old` with the release, START and GO pressed: CHECKING.
-}
started : Update.Types.Model
started =
    events opened (Tuple.first Update.begin) |> hands [ Start, Go ]


{-| Through the flash: copied (staged or not), dfu, the device, the write.
-}
flashed : Answer -> Update.Types.Model
flashed put =
    events [ Answered TStatus old, Answered TPut put, Answered TDfu Gone, DeviceIs Found, WriteDone WriteOk ] started


oldPut : String
oldPut =
    "ERR put takes /CHIMERA/PROJECTS/P#######.A or /CHIMERA/SOUNDS/S#######.A [--over], its size and CRC-32 in hex"


offerOf : String -> Offer
offerOf build =
    Update.Read.offer (Update.Read.readStatus [ "build " ++ build ]) rel


shown : Update.Types.Model -> Query.Single Update.Types.Msg
shown m =
    Update.View.view (\_ -> Update.Types.Close) identity (Page.init Tokens.Day) m |> List.singleton |> Html.div [] |> Query.fromHtml


idA : String
idA =
    "0034002b3138510a37363337"


idB : String
idB =
    "0011002233445566778899aa"


withUnit : String -> Answer -> Answer
withUnit id a =
    case a of
        Said lines end ->
            Said (lines ++ [ "unit " ++ id ]) end

        NoAnswer ->
            a

        Gone ->
            a


idUnit : Update.Types.UnitNow
idUnit =
    { unit | unit = Just idA }


idStarted : Update.Types.Model
idStarted =
    events [ Begun { open = True, webusb = True, windows = False }, Answered TStatus (withUnit idA old), ReleaseIs (Ok rel) ] (Tuple.first Update.begin) |> hands [ Start, Go ]


idFlashed : Update.Types.Model
idFlashed =
    events [ Answered TStatus (withUnit idA old), Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs Found, WriteDone WriteOk ] idStarted


isBack : Request -> Bool
isBack r =
    case r of
        Back _ _ _ ->
            True

        Begin ->
            False

        FetchLatest ->
            False

        ChooseFiles ->
            False

        Ask _ _ _ _ ->
            False

        Put _ ->
            False

        PutBin _ _ ->
            False

        Dfu ->
            False

        FindDevice _ ->
            False

        PickDevice ->
            False

        Write _ ->
            False

        PickPort ->
            False

        Hold _ ->
            False

        End ->
            False


isDone : Stage -> Bool
isDone st =
    case st of
        Done _ _ _ ->
            True

        Opening ->
            False

        Reading _ _ ->
            False

        Ready _ _ ->
            False

        Choosing _ _ ->
            False

        Confirm _ _ ->
            False

        Running _ _ _ ->
            False

        StoppedBefore _ _ _ ->
            False

        StoppedAfter _ _ _ _ ->
            False

        NoLink ->
            False

        Closing ->
            False


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

        Unsent _ ->
            False


suite : Test
suite =
    describe "Update"
        [ test "status_is_read" <|
            \_ ->
                Expect.equal { build = Just "0.4.0 de07edf9", modified = False, bank2 = Just "open 0.4.0 de07edf9 seal=ffffffffffffffff", selfUpdate = Nothing, unit = Nothing } unit
        , test "the_panel_asks_status_and_the_release_and_shows_both" <|
            \_ ->
                Expect.equal ( Ready unit (Got rel), [ Ask TStatus "status" 2000 0, FetchLatest ] )
                    (steps opened (Tuple.first Update.begin))
        , test "no_link_says_so" <|
            \_ -> Expect.equal NoLink (steps [ Begun { open = False, webusb = True, windows = False } ] (Tuple.first Update.begin) |> Tuple.first)
        , describe "versions, by their numbers"
            [ test "newer_same_other_build_unknown" <|
                \_ -> Expect.equal [ Newer, Same, OtherBuild, Unknown ] [ offerOf "0.4.0 de07edf9", offerOf "0.4.1 abcd1234+", offerOf "0.4.1 ffff0000", Update.Read.offer (Update.Read.readStatus []) rel ]
            , test "an_older_release_is_a_downgrade" <|
                \_ -> Expect.equal [ Older, Older, Older ] [ offerOf "0.5.0 11112222", offerOf "0.4.2 11112222", offerOf "1.0.0 11112222" ]
            , test "not_a_string_compare" <|
                -- "0.10.0" sorts before "0.9.0" as text; as numbers it is newer.
                \_ -> Expect.equal Older (Update.Read.offer (Update.Read.readStatus [ "build 0.10.0 aaaa0000" ]) { rel | version = "0.9.0 bbbb1111" })
            , test "parsed" <|
                \_ -> Expect.equal (Just { major = 0, minor = 10, patch = 2, build = "abc" }) (Update.Read.parseVersion "0.10.2 abc+")
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
                        asked : Update.Types.Model
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
        , describe "the self-update path (ADR 0344): no DFU"
            [ test "the_capability_is_status_selfupdate_1" <|
                \_ -> Expect.equal [ Just { version = 1 }, Nothing, Nothing ] [ (Update.Read.readStatus [ "selfupdate 1" ]).selfUpdate, (Update.Read.readStatus [ "selfupdate yes" ]).selfUpdate, (Update.Read.readStatus [ "build 0.4.0 de07edf9" ]).selfUpdate ]
            , test "bk2_then_bin_to_the_card_root_then_bank1_install_then_status" <|
                \_ ->
                    Expect.equal ( Done selfUnit rel selfNew, [ Put rel, PutBin rel "/CHIMERA.BIN", Ask TSelf "bank1 install 900000 0a1b2c3d" 120000 0, Back 180 True Nothing ] )
                        (steps
                            [ Answered TStatus selfOld
                            , Copied { done = 5, total = 10 }
                            , Answered TPut (Said [] "OK")
                            , Copied { done = 5, total = 10 }
                            , Answered TPutBin (Said [] "OK")
                            , Answered TSelf (Said [] "OK bank1 verified 900000 0a1b2c3d, restarting")
                            , BackDone (Ok selfBack)
                            ]
                            selfStarted
                        )
            , test "the_bk2_is_skipped_when_its_seal_is_already_installed" <|
                \_ ->
                    let
                        sealed : Answer
                        sealed =
                            Said [ "build 0.4.0 de07edf9", "state SAVED", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef", "selfupdate 1" ] "OK"
                    in
                    Expect.equal [ PutBin rel "/CHIMERA.BIN" ]
                        (Update.Step.step (Answered TStatus sealed) (events [ Begun { open = True, webusb = True, windows = False }, Answered TStatus sealed, ReleaseIs (Ok rel) ] (Tuple.first Update.begin) |> hands [ Start, Go ]) |> Tuple.second)
            , test "the_bar_counts_both_files" <|
                \_ ->
                    Expect.equal (Running selfUnit rel (Pre (CopyingBin { done = rel.bk2Size + 100, total = rel.bk2Size + rel.binSize })))
                        (steps [ Answered TStatus selfOld, Answered TPut (Said [] "OK"), Copied { done = 100, total = rel.binSize } ] selfStarted |> Tuple.first)
            , test "already_installed_is_done_without_a_restart" <|
                \_ ->
                    Expect.equal ( Running selfUnit rel (Post Staged Verifying), [ Ask TVerify "status" 2000 0 ] )
                        (steps [ Answered TSelf (Said [] "OK already installed") ] (events [ Answered TStatus selfOld, Answered TPut (Said [] "OK"), Answered TPutBin (Said [] "OK") ] selfStarted))
            , test "err_bank1_wrote_nothing_retry_or_dfu" <|
                \_ ->
                    let
                        refused : Update.Types.Model
                        refused =
                            events [ Answered TStatus selfOld, Answered TPut (Said [] "OK"), Answered TPutBin (Said [] "OK"), Answered TSelf (Said [] "ERR bank1: card read failed") ] selfStarted
                    in
                    Expect.equal
                        [ StoppedBefore selfUnit rel (SelfRefused "ERR bank1: card read failed")
                        , Running selfUnit rel (Pre Checking)
                        , Running { selfUnit | selfUpdate = Nothing } rel (Pre Checking)
                        ]
                        [ Update.stage refused, Update.stage (hands [ TryAgain ] refused), Update.stage (hands [ UseDfu ] refused) ]
            , test "an_aborted_install_is_the_old_firmware_untouched" <|
                \_ ->
                    Expect.equal (StoppedBefore selfUnit rel (SelfAborted "verify failed"))
                        (steps [ BackDone (Ok (Said [ "build 0.4.0 de07edf9", "bank2 open 0.4.0 de07edf9 seal=ffffffffffffffff", "selfupdate 1", "bank1 last aborted verify failed" ] "OK")) ] installing |> Tuple.first)
            , test "back_but_another_crc_is_unfinished" <|
                \_ ->
                    Expect.equal (StoppedAfter selfUnit rel Staged (Unfinished "The unit says bank1 last ok deadbeef, not this release's CHIMERA.BIN (0a1b2c3d)"))
                        (steps [ BackDone (Ok (Said [ "build 0.4.1 abcd1234", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef", "bank1 last ok deadbeef" ] "OK")) ] installing |> Tuple.first)
            , test "not_back_in_three_minutes_says_how_and_checks_again" <|
                \_ ->
                    let
                        stopped : Update.Types.Model
                        stopped =
                            events [ BackDone (Err "off") ] installing
                    in
                    Expect.all
                        [ \_ -> Expect.equal [ StoppedAfter selfUnit rel Staged (SelfNotBack "off"), Running selfUnit rel (Post Staged RestartingSelf) ] [ Update.stage stopped, Update.stage (hands [ CheckAgain ] stopped) ]
                        , \_ -> shown stopped |> Query.has [ Sel.containing [ Sel.text "Under Firmware to flash, step with − / + until it shows CHIMERA.BIN." ] ]
                        ]
                        ()
            , test "the_stage_reads_installing_the_version_and_no_picker" <|
                \_ ->
                    events [ Answered TStatus selfOld, Answered TPut (Said [] "OK") ] selfStarted
                        |> shown
                        |> Expect.all
                            [ Query.has [ Sel.containing [ Sel.text "INSTALLING 0.4.1 (abcd1234)" ] ]
                            , Query.hasNot [ Sel.containing [ Sel.text "RESTARTING INTO UPDATE MODE" ] ]
                            ]
            ]
        , test "the_offer_on_connect_compares_hello_builds" <|
            \_ -> Expect.equal [ Newer, Same, Older ] [ Update.Read.offerFor "0.4.0-de07edf9" "0.4.1 abcd1234", Update.Read.offerFor "0.4.1-abcd1234" "0.4.1 abcd1234", Update.Read.offerFor "0.5.0-11112222" "0.4.1 abcd1234" ]
        , test "the_happy_path_stages_then_flashes_then_checks" <|
            \_ ->
                Expect.equal ( Done unit rel newUnit, [ Put rel, Dfu, FindDevice 10, Write rel, Back 120 False Nothing ] )
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
                Expect.equal ( Done unit rel (Update.Read.readStatus [ "firmware 0.4.1 release", "build 0.4.1 abcd1234", "protocol 4", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef" ]), [ Put rel, Ask TInstall "bank2 install" 120000 0, Back 60 True Nothing ] )
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
                    silent : Update.Types.Model
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
                    picking : Update.Types.Model
                    picking =
                        events [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs NotFound ] started

                    cancelled : Update.Types.Model
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
                    stopped : Update.Types.Model
                    stopped =
                        events [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs Found, WriteDone Unopenable ] started
                in
                Expect.equal [ StoppedBefore unit rel (CantOpen { bk2 = Staged, flash = Untouched }), Running unit rel (Pre (PickingDevice { bk2 = Staged, flash = Untouched })) ]
                    [ Update.stage stopped, Update.stage (hands [ WriteAgain ] stopped) ]
        , test "a_cut_write_is_after_the_write_and_can_write_again" <|
            \_ ->
                let
                    stopped : Update.Types.Model
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
                    stopped : Update.Types.Model
                    stopped =
                        events [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs Found, WriteDone (LeaveFail "gone") ] started
                in
                Expect.equal [ StoppedAfter unit rel Staged (LeaveFailed "gone"), Running unit rel (Post Staged Restarting) ]
                    [ Update.stage stopped, Update.stage (hands [ CheckAgain ] stopped) ]
        , test "try_again_after_a_flash_asks_the_unit_never_starts_over" <|
            \_ ->
                let
                    unfinished : Update.Types.Model
                    unfinished =
                        events [ BackDone (Ok (status "0.4.0 de07edf9" "NEW" "empty")) ] (flashed (Said [] "OK"))
                in
                Expect.equal [ StoppedAfter unit rel Staged (Unfinished "The unit says build 0.4.0 de07edf9: the new firmware (0.4.1 abcd1234) isn't the one running"), Running unit rel (Post Staged Restarting) ]
                    [ Update.stage unfinished, Update.stage (hands [ TryAgain ] unfinished) ]
        , test "not_back_can_check_again" <|
            \_ ->
                let
                    stopped : Update.Types.Model
                    stopped =
                        events [ BackDone (Err "off") ] (flashed (Said [] "OK"))
                in
                Expect.equal [ StoppedAfter unit rel Staged (NotBack "off"), Running unit rel (Post Staged Restarting) ]
                    [ Update.stage stopped, Update.stage (hands [ CheckAgain ] stopped) ]
        , test "the_old_firmware_still_running_is_unfinished" <|
            \_ ->
                Expect.equal (NotFinished "The unit says build 0.4.0 de07edf9: the new firmware (0.4.1 abcd1234) isn't the one running") (Update.Read.verdict rel old)
        , test "a_foreign_slot_is_said" <|
            \_ ->
                Expect.equal (NotFinished "The unit's MIXER slot (0x08180000) holds other code; bank 2 not installed")
                    (Update.Read.verdict rel (status "0.4.1 abcd1234" "NEW" "slot foreign mixer"))
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
                    ready : Update.Types.Model
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
                Expect.equal [ Installed (Update.Read.readStatus [ "firmware 0.4.1 release", "build 0.4.1 abcd1234", "protocol 4", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef" ]), NeedsInstall "bank2 empty" ]
                    [ Update.Read.verdict rel new, Update.Read.verdict rel (status "0.4.1 abcd1234" "NEW" "empty") ]
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
                    ready : Update.Types.Model
                    ready =
                        events [ Begun { open = False, webusb = True, windows = False }, ReleaseIs (Ok rel) ] (Tuple.first Update.beginStuck)
                in
                Expect.equal [ Ready (Update.Read.readStatus []) (Got rel), Running (Update.Read.readStatus []) rel (Pre (PickingDevice { bk2 = AfterFlash, flash = Touched })) ]
                    [ Update.stage ready, Update.stage (hands [ Start, Go ] ready) ]
        , describe "the firmware area already touched (a cut write, a stuck unit)"
            [ test "write_again_after_a_cut_stays_touched_through_every_stop" <|
                \_ ->
                    let
                        cutThenPick : Update.Types.Model
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
                        ready : Update.Types.Model
                        ready =
                            events [ Begun { open = False, webusb = True, windows = False }, ReleaseIs (Ok rel) ] (Tuple.first Update.beginStuck)
                    in
                    Expect.all
                        [ \_ -> shown ready |> Query.has [ Sel.containing [ Sel.text "Can't tell which version this unit had" ] ]
                        , \_ -> shown (hands [ Start, Go, Cancel ] ready) |> Query.hasNot [ Sel.containing [ Sel.text "Nothing has been written" ] ]
                        , \_ -> Expect.equal (StoppedBefore (Update.Read.readStatus []) rel (PickCancelled { bk2 = AfterFlash, flash = Touched })) (Update.stage (hands [ Start, Go, Cancel ] ready))
                        ]
                        ()
            , test "an_untouched_stop_says_nothing_was_written" <|
                \_ ->
                    events [ Answered TStatus old, Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs NotFound ] started
                        |> hands [ Cancel ]
                        |> shown
                        |> Query.has [ Sel.containing [ Sel.text "Nothing has been written" ] ]
            ]
        , describe "the unit's identity (status's unit line)"
            [ test "read_as_24_hex_digits" <|
                \_ -> Expect.equal [ Just "0034002b3138510a37363337", Nothing ] [ (Update.Read.readStatus [ "unit 0034002B3138510A37363337" ]).unit, (Update.Read.readStatus [ "unit 1234" ]).unit ]
            , test "the_wait_after_the_flash_names_the_unit" <|
                \_ -> Expect.equal [ Back 120 False (Just idA) ] (steps [ Answered TStatus (withUnit idA old), Answered TPut (Said [] "OK"), Answered TDfu Gone, DeviceIs Found, WriteDone WriteOk ] idStarted |> Tuple.second |> List.filter isBack)
            , test "the_same_unit_back_is_done" <|
                \_ -> Expect.equal True (isDone (steps [ BackDone (Ok (withUnit idA new)) ] idFlashed |> Tuple.first))
            , test "another_unit_back_stops" <|
                \_ ->
                    Expect.equal (StoppedAfter idUnit rel Staged (OtherUnit idB))
                        (steps [ BackDone (Ok (withUnit idB new)) ] idFlashed |> Tuple.first)
            , test "no_unit_line_is_not_another_unit" <|
                \_ -> Expect.equal True (isDone (steps [ BackDone (Ok new) ] idFlashed |> Tuple.first))
            , test "a_dry_run_result_reads_without_error_and_isnt_this_install" <|
                \_ ->
                    Expect.equal (StoppedAfter selfUnit rel Staged (Unfinished "The unit says bank1 last dry ok 0a1b2c3d"))
                        (steps [ BackDone (Ok (Said [ "build 0.4.1 abcd1234", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef", "selfupdate 1", "bank1 last dry ok 0a1b2c3d" ] "OK")) ] installing |> Tuple.first)
            ]
        , describe "after bank1 install is sent: the unit may be flashing"
            [ test "a_lost_reply_a_vanished_port_or_an_unreadable_one_all_wait_for_it" <|
                \_ ->
                    let
                        sent : Update.Types.Model
                        sent =
                            events [ Answered TStatus selfOld, Answered TPut (Said [] "OK"), Answered TPutBin (Said [] "OK") ] selfStarted

                        waiting : ( Stage, List Request )
                        waiting =
                            ( Running selfUnit rel (Post Staged RestartingSelf), [ Back 180 True Nothing ] )
                    in
                    Expect.equal [ waiting, waiting, waiting ]
                        [ steps [ Answered TSelf NoAnswer ] sent
                        , steps [ Answered TSelf Gone ] sent
                        , steps [ Garbled "x" ] sent
                        ]
            , test "the_wait_never_offers_dfu_retry_or_replug" <|
                \_ ->
                    events [ Answered TStatus selfOld, Answered TPut (Said [] "OK"), Answered TPutBin (Said [] "OK"), Answered TSelf Gone ] selfStarted
                        |> shown
                        |> Expect.all
                            [ Query.has [ Sel.containing [ Sel.text "may be updating itself" ] ]
                            , Query.hasNot [ Sel.containing [ Sel.text "USE UPDATE MODE" ] ]
                            , Query.hasNot [ Sel.containing [ Sel.text "TRY AGAIN" ] ]
                            ]
            , test "not_back_after_it_never_offers_dfu_or_unplugging" <|
                \_ ->
                    events [ Answered TStatus selfOld, Answered TPut (Said [] "OK"), Answered TPutBin (Said [] "OK"), Answered TSelf Gone, BackDone (Err "off") ] selfStarted
                        |> shown
                        |> Expect.all
                            [ Query.has [ Sel.containing [ Sel.text "may still be updating itself" ] ]
                            , Query.hasNot [ Sel.containing [ Sel.text "USE UPDATE MODE" ] ]
                            , Query.hasNot [ Sel.containing [ Sel.text "Unplug the USB cable" ] ]
                            ]
            , test "a_verb_never_sent_may_offer_try_again" <|
                \_ ->
                    Expect.equal (StoppedBefore selfUnit rel (NothingFlashed "The unit was disconnected before the install was sent"))
                        (steps [ Answered TStatus selfOld, Answered TPut (Said [] "OK"), Answered TPutBin (Said [] "OK"), Unsent TSelf ] selfStarted |> Tuple.first)
            ]
        , describe "answers read strictly"
            [ test "a_malformed_answer_is_an_error_not_no_answer" <|
                \_ -> Expect.equal True (isGarbled (Update.Wire.decode (E.object [ ( "op", E.string "answer" ), ( "id", E.string "status" ) ])))
            , test "ok_false_is_not_a_write_done" <|
                \_ -> Expect.equal True (isGarbled (Update.Wire.decode (E.object [ ( "op", E.string "write" ), ( "ok", E.bool False ) ])))
            , test "an_explicit_no_answer_is_one" <|
                \_ -> Expect.equal (Answered TStatus NoAnswer) (Update.Wire.decode (E.object [ ( "op", E.string "answer" ), ( "id", E.string "status" ), ( "noAnswer", E.bool True ) ]))
            , test "garbled_mid_run_stops_on_its_side_of_the_write" <|
                \_ ->
                    Expect.equal [ StoppedBefore unit rel (GarbledBefore "x"), StoppedAfter unit rel Staged (GarbledAfter "x") ]
                        [ Update.stage (events [ Garbled "x" ] started), Update.stage (events [ Garbled "x" ] (flashed (Said [] "OK"))) ]
            , test "a_mismatched_release_stops" <|
                \_ -> Expect.equal (StoppedBefore unit rel (GarbledBefore "not it")) (Update.stage (events [ Answered TStatus old, Mismatch "not it" ] started))
            ]
        ]
