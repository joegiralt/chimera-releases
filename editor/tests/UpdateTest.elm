-- SPDX-License-Identifier: GPL-3.0-or-later


module UpdateTest exposing (suite)

import Expect
import Test exposing (Test, describe, test)
import Update exposing (Answer(..), Bk2(..), Device(..), Event(..), Failure(..), Msg(..), Offer(..), Release, Request(..), Run(..), Source(..), Stage(..), Verdict(..), WriteResult(..))


rel : Release
rel =
    { version = "0.4.1 abcd1234", seal = "0123456789abcdef", format = 2, binSize = 900000, bk2Size = 1048576, source = Latest }


status : String -> String -> String -> Answer
status build state bank2 =
    Said [ "firmware 0.4.1 release", "build " ++ build, "protocol 4", "state " ++ state, "bank2 " ++ bank2 ] "OK"


old : Answer
old =
    status "0.4.0 de07edf9" "SAVED" "open 0.4.0 de07edf9 seal=ffffffffffffffff"


new : Answer
new =
    status "0.4.1 abcd1234" "NEW" "open 0.4.1 abcd1234 seal=0123456789abcdef"


{-| Events in turn from the panel's opening: the last stage and every request.
-}
run : List Event -> ( Stage, List Request )
run =
    List.foldl
        (\e ( m, reqs ) -> Update.step e m |> Tuple.mapSecond ((++) reqs))
        ( Tuple.first Update.begin, [] )
        >> Tuple.mapFirst Update.stage


{-| The panel open on `old` with the release, START and GO pressed: CHECKING.
-}
started : Update.Model
started =
    [ Begun { open = True, webusb = True, windows = False }, Answered "status" old, ReleaseIs (Ok rel) ]
        |> List.foldl (\e m -> Update.step e m |> Tuple.first) (Tuple.first Update.begin)
        |> hands [ Start, Go ]


hands : List Msg -> Update.Model -> Update.Model
hands msgs m =
    List.foldl (\msg acc -> Update.update msg acc |> (\( next, _, _ ) -> next)) m msgs


steps : List Event -> Update.Model -> ( Stage, List Request )
steps es m =
    List.foldl (\e ( acc, reqs ) -> Update.step e acc |> Tuple.mapSecond ((++) reqs)) ( m, [] ) es
        |> Tuple.mapFirst Update.stage


unit : Update.UnitNow
unit =
    Update.readStatus [ "build 0.4.0 de07edf9", "state SAVED", "bank2 open 0.4.0 de07edf9 seal=ffffffffffffffff" ]


oldPut : String
oldPut =
    "ERR put takes /CHIMERA/PROJECTS/P#######.A or /CHIMERA/SOUNDS/S#######.A [--over], its size and CRC-32 in hex"


suite : Test
suite =
    describe "Update"
        [ test "status_is_read" <|
            \_ ->
                Expect.equal { build = Just "0.4.0 de07edf9", modified = False, bank2 = Just "open 0.4.0 de07edf9 seal=ffffffffffffffff" } unit
        , test "the_panel_asks_status_and_the_release_and_shows_both" <|
            \_ ->
                Expect.equal ( Ready unit (Update.Got rel), [ Begin, Ask "status" 2000, FetchLatest ] )
                    (run [ Begun { open = True, webusb = True, windows = False }, Answered "status" old, ReleaseIs (Ok rel) ] |> Tuple.mapSecond ((::) Begin))
        , test "no_link_says_so" <|
            \_ -> Expect.equal NoLink (run [ Begun { open = False, webusb = True, windows = False } ] |> Tuple.first)
        , test "the_versions_offer" <|
            \_ ->
                Expect.equal [ Newer, Same, Unknown ]
                    [ Update.offer unit rel
                    , Update.offer (Update.readStatus [ "build 0.4.1 abcd1234+" ]) rel
                    , Update.offer (Update.readStatus []) rel
                    ]
        , test "go_asks_status_first" <|
            \_ -> Expect.equal (Running unit rel Checking) (Update.stage started)
        , test "unsaved_changes_stop_it_and_nothing_is_written" <|
            \_ ->
                Expect.equal ( Stopped unit rel Unsaved, [] )
                    (steps [ Answered "status" (status "0.4.0 de07edf9" "MODIFIED" "open") ] started)
        , test "the_happy_path_stages_then_flashes_then_checks" <|
            \_ ->
                Expect.equal
                    ( Done unit rel (Update.readStatus [ "build 0.4.1 abcd1234", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef" ])
                    , [ Put, Dfu, FindDevice 10, Write, Back 120 False ]
                    )
                    (steps
                        [ Answered "status" old
                        , Copied { done = 1000, total = 1048576 }
                        , PutDone (Said [] "OK")
                        , DfuDone Gone
                        , DeviceIs Found
                        , Written { done = 3, total = 10 }
                        , WriteDone WriteOk
                        , BackDone (Ok (Said [ "firmware 0.4.1 release", "build 0.4.1 abcd1234", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef" ] "OK"))
                        ]
                        started
                    )
        , test "a_staged_bk2_not_installed_at_boot_gets_bank2_install" <|
            \_ ->
                Expect.equal ( Done unit rel (Update.readStatus [ "firmware 0.4.1 release", "build 0.4.1 abcd1234", "protocol 4", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef" ]), [ Put, Dfu, FindDevice 10, Write, Back 120 False, Ask "bank2 install" 120000, Back 60 True ] )
                    (steps
                        [ Answered "status" old
                        , PutDone (Said [] "OK")
                        , DfuDone (Said [] "OK")
                        , DeviceIs Found
                        , WriteDone WriteOk
                        , BackDone (Ok (status "0.4.1 abcd1234" "NEW" "empty"))
                        , Answered "bank2 install" (Said [ "audio stopped 812 ms" ] "OK bank2 open 0.4.1 abcd1234")
                        , BackDone (Ok new)
                        ]
                        started
                    )
        , test "older_firmware_takes_the_bk2_after_the_flash" <|
            \_ ->
                Expect.equal ( Done unit rel (Update.readStatus [ "firmware 0.4.1 release", "build 0.4.1 abcd1234", "protocol 4", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef" ]), [ Put, Dfu, FindDevice 10, Write, Back 120 False, Put, Ask "bank2 install" 120000, Back 60 True ] )
                    (steps
                        [ Answered "status" old
                        , PutDone (Said [] oldPut)
                        , DfuDone (Said [] "OK")
                        , DeviceIs Found
                        , WriteDone WriteOk
                        , BackDone (Ok (status "0.4.1 abcd1234" "NEW" "empty"))
                        , PutDone (Said [] "OK")
                        , Answered "bank2 install" (Said [] "OK bank2 open 0.4.1 abcd1234")
                        , BackDone (Ok new)
                        ]
                        started
                    )
        , test "a_0_3_wording_names_bank2_for_a_big_bk2" <|
            \_ ->
                Expect.equal (Running unit rel (EnteringDfu AfterFlash))
                    (steps [ Answered "status" old, PutDone (Said [] "ERR put takes P#######.A, S#######.A or BANK2.BK2 (512 KB)") ] started |> Tuple.first)
        , test "another_put_refusal_stops_before_the_flash" <|
            \_ ->
                Expect.equal ( Stopped unit rel (NothingFlashed "The unit refused CHIMERA.BK2: ERR put: card full"), [ Put ] )
                    (steps [ Answered "status" old, PutDone (Said [] "ERR put: card full") ] started)
        , test "an_unplug_mid_copy_stops_with_nothing_flashed" <|
            \_ ->
                Expect.equal (Stopped unit rel (NothingFlashed "The unit was disconnected while CHIMERA.BK2 was copied"))
                    (steps [ Answered "status" old, Copied { done = 5, total = 10 }, PutDone Gone ] started |> Tuple.first)
        , test "dfu_refused_stops_before_the_flash" <|
            \_ ->
                Expect.equal (Stopped unit rel (NothingFlashed "The unit refused update mode: ERR dfu is not in this build"))
                    (steps [ Answered "status" old, PutDone (Said [] "OK"), DfuDone (Said [] "ERR dfu is not in this build") ] started |> Tuple.first)
        , test "no_device_known_asks_for_a_pick" <|
            \_ ->
                Expect.equal (Running unit rel (PickingDevice Staged False))
                    (steps [ Answered "status" old, PutDone (Said [] "OK"), DfuDone Gone, DeviceIs NotFound ] started |> Tuple.first)
        , test "a_pick_writes" <|
            \_ ->
                let
                    ( picking, _ ) =
                        List.foldl (\e ( m, _ ) -> Update.step e m) ( started, [] ) [ Answered "status" old, PutDone (Said [] "OK"), DfuDone Gone, DeviceIs NotFound ]
                in
                Expect.equal ( Running unit rel (Writing Staged { done = 0, total = 1 }), [ Write ] )
                    (steps [ DeviceIs Found ] (hands [ Pick ] picking))
        , test "a_device_that_wont_open_says_how_and_can_write_again" <|
            \_ ->
                let
                    ( stopped, _ ) =
                        List.foldl (\e ( m, _ ) -> Update.step e m) ( started, [] ) [ Answered "status" old, PutDone (Said [] "OK"), DfuDone Gone, DeviceIs Found, WriteDone Unopenable ]
                in
                Expect.equal [ Stopped unit rel (CantOpen Staged), Running unit rel (FindingDevice Staged) ]
                    [ Update.stage stopped, Update.stage (hands [ WriteAgain ] stopped) ]
        , test "a_cut_write_says_how_to_finish_and_can_write_again" <|
            \_ ->
                let
                    ( stopped, _ ) =
                        List.foldl (\e ( m, _ ) -> Update.step e m) ( started, [] ) [ Answered "status" old, PutDone (Said [] oldPut), DfuDone Gone, DeviceIs Found, WriteDone (Cut "gone") ]
                in
                Expect.equal [ Stopped unit rel (WriteCut AfterFlash "gone"), Running unit rel (FindingDevice AfterFlash) ]
                    [ Update.stage stopped, Update.stage (hands [ WriteAgain ] stopped) ]
        , test "a_guard_refusal_writes_nothing" <|
            \_ ->
                Expect.equal (Stopped unit rel (Guarded "refused: 0x8000000"))
                    (steps [ Answered "status" old, PutDone (Said [] "OK"), DfuDone Gone, DeviceIs Found, WriteDone (GuardRefused "refused: 0x8000000") ] started |> Tuple.first)
        , test "not_back_can_check_again" <|
            \_ ->
                let
                    ( stopped, _ ) =
                        List.foldl (\e ( m, _ ) -> Update.step e m) ( started, [] ) [ Answered "status" old, PutDone (Said [] "OK"), DfuDone Gone, DeviceIs Found, WriteDone WriteOk, BackDone (Err "off") ]
                in
                Expect.equal [ Stopped unit rel (NotBack Staged "off"), Running unit rel (Restarting Staged) ]
                    [ Update.stage stopped, Update.stage (hands [ CheckAgain ] stopped) ]
        , test "the_old_firmware_still_running_is_unfinished" <|
            \_ ->
                Expect.equal (NotFinished "The unit says build 0.4.0 de07edf9: the new firmware (0.4.1 abcd1234) isn't the one running") (Update.verdict rel old)
        , test "a_foreign_slot_is_said" <|
            \_ ->
                Expect.equal (NotFinished "The unit's MIXER slot (0x08180000) holds other code; bank 2 not installed")
                    (Update.verdict rel (status "0.4.1 abcd1234" "NEW" "slot foreign mixer"))
        , test "an_answer_the_step_isnt_waiting_for_changes_nothing" <|
            \_ ->
                Expect.equal ( Running unit rel Checking, [] ) (steps [ DfuDone Gone, WriteDone WriteOk, BackDone (Ok new) ] started)
        , test "close_never_mid_update" <|
            \_ -> Expect.equal (Running unit rel Checking) (Update.stage (hands [ Close ] started))
        , test "unsaved_then_try_again_asks_status_again" <|
            \_ ->
                let
                    ( stopped, _ ) =
                        Update.step (Answered "status" (status "0.4.0 de07edf9" "MODIFIED" "open")) started
                in
                Expect.equal (Running unit rel Checking) (Update.stage (hands [ TryAgain ] stopped))
        , test "a_release_that_fails_its_checks_offers_choosing_files" <|
            \_ ->
                Expect.equal (Ready unit (Update.Missing "CHIMERA.BIN does not match SHA256SUMS"))
                    (run [ Begun { open = True, webusb = True, windows = False }, Answered "status" old, ReleaseIs (Err "CHIMERA.BIN does not match SHA256SUMS") ] |> Tuple.first)
        , test "chosen_files_replace_the_release" <|
            \_ ->
                let
                    ready : Update.Model
                    ready =
                        [ Begun { open = True, webusb = True, windows = False }, Answered "status" old, ReleaseIs (Err "unreachable") ]
                            |> List.foldl (\e m -> Update.step e m |> Tuple.first) (Tuple.first Update.begin)
                in
                Expect.equal (Ready unit (Update.Got { rel | source = Chosen }))
                    (steps [ ReleaseIs (Ok { rel | source = Chosen }) ] (hands [ Choose ] ready) |> Tuple.first)
        , test "ended_hands_the_link_back" <|
            \_ ->
                let
                    ready : Update.Model
                    ready =
                        [ Begun { open = True, webusb = True, windows = False }, Answered "status" old, ReleaseIs (Ok rel) ]
                            |> List.foldl (\e m -> Update.step e m |> Tuple.first) (Tuple.first Update.begin)
                in
                Expect.equal Closing (Update.stage (hands [ Close ] ready))
        , test "a_device_missing_from_a_pick_asks_again" <|
            \_ ->
                Expect.equal (Running unit rel (PickingDevice Staged True))
                    (steps [ Answered "status" old, PutDone (Said [] "OK"), DfuDone Gone, DeviceIs NotFound, DeviceIs NotFound ] started |> Tuple.first)
        , test "no_webusb_at_the_device_stops" <|
            \_ ->
                Expect.equal (Stopped unit rel (CantOpen Staged))
                    (steps [ Answered "status" old, PutDone (Said [] "OK"), DfuDone Gone, DeviceIs NoWebUsb ] started |> Tuple.first)
        , test "a_late_put_staged_for_another_firmware_is_unfinished" <|
            \_ ->
                Expect.equal (Stopped unit rel (Unfinished "staged: needs firmware 0.4.2 (it installs at that firmware's next start)"))
                    (steps
                        [ Answered "status" old
                        , PutDone (Said [] oldPut)
                        , DfuDone Gone
                        , DeviceIs Found
                        , WriteDone WriteOk
                        , BackDone (Ok (status "0.4.1 abcd1234" "NEW" "empty"))
                        , PutDone (Said [] "OK staged: needs firmware 0.4.2")
                        ]
                        started
                        |> Tuple.first
                    )
        , test "verdict_installed" <|
            \_ -> Expect.equal (Installed (Update.readStatus [ "firmware 0.4.1 release", "build 0.4.1 abcd1234", "protocol 4", "state NEW", "bank2 open 0.4.1 abcd1234 seal=0123456789abcdef" ])) (Update.verdict rel new)
        , test "verdict_needs_install" <|
            \_ -> Expect.equal (NeedsInstall "bank2 empty") (Update.verdict rel (status "0.4.1 abcd1234" "NEW" "empty"))
        ]
