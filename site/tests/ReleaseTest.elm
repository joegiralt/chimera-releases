-- SPDX-License-Identifier: GPL-3.0-or-later


module ReleaseTest exposing (suite)

import ByteSize
import Expect
import Generated.Fixtures as Fixtures
import Href
import Json.Decode as Decode
import Release exposing (AssetKind(..), Current(..), Releases, Stage(..))
import Test exposing (Test, describe, test)
import Time
import Version


decoded : Result Decode.Error Releases
decoded =
    Decode.decodeString Release.listDecoder Fixtures.releasesJson


{-| The fixture with one release's JSON changed.
-}
edited : String -> String -> Result Decode.Error Releases
edited from to =
    Decode.decodeString Release.listDecoder (String.replace from to Fixtures.releasesJson)


versions : Result Decode.Error Releases -> Result Decode.Error ( List String, Int )
versions =
    Result.map (\r -> ( List.map (.version >> Version.toString) r.releases, List.length r.skipped ))


suite : Test
suite =
    describe "Release"
        [ describe "Version"
            [ test "tags parse with or without v" <|
                \_ ->
                    List.map (Version.fromTag >> Maybe.map Version.toString) [ "v0.3.0", "1.12.4", "v10.0.0" ]
                        |> Expect.equal [ Just "0.3.0", Just "1.12.4", Just "10.0.0" ]
            , test "anything but three plain numbers is Nothing" <|
                \_ ->
                    List.map Version.fromTag [ "v0.3", "v0.3.0.1", "va.b.c", "", "v0.3.0-rc1", "v-1.0.0", "V0.3.0", "v01.0.0", "v0.03.0", "v0.3.00" ]
                        |> Expect.equal (List.repeat 10 Nothing)
            , test "versions order numerically, not as text" <|
                \_ ->
                    List.filterMap Version.fromTag [ "v0.10.0", "v0.2.0", "v0.9.1", "v1.0.0", "v0.9.0" ]
                        |> List.sortWith Version.compare
                        |> List.map Version.toString
                        |> Expect.equal [ "0.2.0", "0.9.0", "0.9.1", "0.10.0", "1.0.0" ]
            ]
        , describe "classify"
            [ test "the release files" <|
                \_ ->
                    List.map Release.classify [ "CHIMERA.BIN", "chimera-0.1.0.bin", "CHIMERA.BK2", "factory-v1.zip", "SHA256SUMS", "sha256sums.txt" ]
                        |> Expect.equal [ Firmware, Firmware, FirmwareBank2, FactorySet, Checksums, Checksums ]
            , test "a bootloader or another .bin is never FIRMWARE" <|
                \_ ->
                    List.map Release.classify [ "pfm3-bootloader-1.09.bin", "BOOTLOADER.BIN", "p3_105.bin", "chimera-latest.bin", "notes.txt", "factory.zip" ]
                        |> Expect.equal [ Bootloader, Bootloader, OtherAsset, OtherAsset, OtherAsset, OtherAsset ]
            ]
        , describe "ByteSize"
            [ test "shown in B and KB, negative refused" <|
                \_ ->
                    ( List.map (ByteSize.fromInt >> Maybe.map ByteSize.toString) [ 237, 863248 ], ByteSize.fromInt -1 )
                        |> Expect.equal ( [ Just "237 B", Just "843 KB" ], Nothing )
            ]
        , describe "the recorded API response"
            [ test "decodes v0.3.0, v0.2.0, v0.1.0, none skipped" <|
                \_ -> versions decoded |> Expect.equal (Ok ( [ "0.3.0", "0.2.0", "0.1.0" ], 0 ))
            , test "v0.3.0's assets, classified" <|
                \_ ->
                    decoded
                        |> Result.map (.releases >> List.head >> Maybe.map (.assets >> List.map (\a -> ( a.name, a.kind, ByteSize.toString a.size ))))
                        |> Expect.equal
                            (Ok
                                (Just
                                    [ ( "CHIMERA.BIN", Firmware, "843 KB" )
                                    , ( "CHIMERA.BK2", FirmwareBank2, "512 KB" )
                                    , ( "factory-v1.zip", FactorySet, "534 KB" )
                                    , ( "SHA256SUMS", Checksums, "237 B" )
                                    ]
                                )
                            )
            , test "v0.3.0's date, name, page, download and notes" <|
                \_ ->
                    decoded
                        |> Result.map
                            (.releases
                                >> List.head
                                >> Maybe.map
                                    (\r ->
                                        ( ( Time.posixToMillis r.published, r.name )
                                        , Href.toString r.page
                                        , ( List.map (.url >> Href.toString) (List.take 1 r.assets), r.stage, String.left 26 r.notes )
                                        )
                                    )
                            )
                        |> Expect.equal
                            (Ok
                                (Just
                                    ( ( 1794477615000, Just "Chimera 0.3.0" )
                                    , "https://github.com/joegiralt/chimera-releases/releases/tag/v0.3.0"
                                    , ( [ "https://github.com/joegiralt/chimera-releases/releases/download/v0.3.0/CHIMERA.BIN" ], Stable, "# Chimera 0.3.0 (alpha)\n\nN" )
                                    )
                                )
                            )
            , test "latest is the highest stable version, whatever the order" <|
                \_ ->
                    decoded
                        |> Result.map (.releases >> List.reverse >> Release.latest >> Maybe.map (.version >> Version.toString))
                        |> Expect.equal (Ok (Just "0.3.0"))
            , test "a prerelease is never the latest" <|
                \_ ->
                    decoded
                        |> Result.map (.releases >> List.map (\r -> { r | stage = Prerelease }) >> Release.latest)
                        |> Expect.equal (Ok Nothing)
            , test "a release whose tag isn't a version is skipped and counted, the rest kept" <|
                \_ ->
                    List.map (\tag -> versions (edited "\"v0.2.0\"" tag)) [ "\"nightly\"", "\"v0.4.0-rc1\"", "\"V0.4.0\"" ]
                        |> Expect.equal (List.repeat 3 (Ok ( [ "0.3.0", "0.1.0" ], 1 )))
            , test "a release with no name keeps its place" <|
                \_ ->
                    edited "\"name\": \"Chimera 0.2.0 (alpha)\"" "\"name\": null"
                        |> Result.map (.releases >> List.map .name)
                        |> Expect.equal (Ok [ Just "Chimera 0.3.0", Nothing, Just "Chimera 0.1.0" ])
            , test "an asset that can't be read is skipped, its release kept and the gap counted" <|
                \_ ->
                    edited "\"https://github.com/joegiralt/chimera-releases/releases/download/v0.1.0/factory-v1.zip\"" "\"javascript:x\""
                        |> Result.map
                            (\r ->
                                ( List.length r.skipped
                                , List.map (\x -> ( Version.toString x.version, List.length x.assets, x.unreadableFiles )) r.releases
                                )
                            )
                        |> Expect.equal (Ok ( 0, [ ( "0.3.0", 4, 0 ), ( "0.2.0", 4, 0 ), ( "0.1.0", 2, 1 ) ] ))
            ]
        , describe "current"
            [ test "the newest stable release, when nothing was skipped" <|
                \_ -> currentOf [ one "v0.3.0" "2026-11-12T10:00:00Z" False, one "v0.2.0" "2026-10-22T10:00:00Z" False ] |> Expect.equal (Ok (Just ( "sure", "0.3.0" )))
            , test "a skipped release newer than it makes it unsure" <|
                \_ -> currentOf [ one "nightly" "2026-11-12T10:00:00Z" False, one "v0.2.0" "2026-10-22T10:00:00Z" False ] |> Expect.equal (Ok (Just ( "newer skipped", "0.2.0" )))
            , test "a skipped release with no readable date makes it unsure" <|
                \_ -> currentOf [ one "nightly" "soon" False, one "v0.2.0" "2026-10-22T10:00:00Z" False ] |> Expect.equal (Ok (Just ( "newer skipped", "0.2.0" )))
            , test "a skipped older release or a skipped prerelease doesn't" <|
                \_ ->
                    List.map currentOf
                        [ [ one "v0.3.0" "2026-11-12T10:00:00Z" False, one "nightly" "2026-10-22T10:00:00Z" False ]
                        , [ one "v0.4.0-rc1" "2026-11-20T10:00:00Z" True, one "v0.3.0" "2026-11-12T10:00:00Z" False ]
                        ]
                        |> Expect.equal [ Ok (Just ( "sure", "0.3.0" )), Ok (Just ( "sure", "0.3.0" )) ]
            , test "nothing readable, or nothing at all" <|
                \_ ->
                    List.map currentOf [ [ one "nightly" "2026-11-12T10:00:00Z" False ], [] ]
                        |> Expect.equal [ Ok (Just ( "none readable", "" )), Ok Nothing ]
            ]
        ]


{-| A release as the API gives it, with only what the decoder reads.
-}
one : String -> String -> Bool -> String
one tag published prerelease =
    "{\"tag_name\": \""
        ++ tag
        ++ "\", \"name\": null, \"prerelease\": "
        ++ (if prerelease then
                "true"

            else
                "false"
           )
        ++ ", \"published_at\": \""
        ++ published
        ++ "\", \"body\": \"\", \"assets\": [], \"html_url\": \"https://github.com/x\"}"


currentOf : List String -> Result Decode.Error (Maybe ( String, String ))
currentOf list =
    Decode.decodeString Release.listDecoder ("[" ++ String.join "," list ++ "]")
        |> Result.map
            (\r ->
                case Release.current r of
                    Current x ->
                        Just ( "sure", Version.toString x.version )

                    NewerSkipped x ->
                        Just ( "newer skipped", Version.toString x.version )

                    NoneReadable ->
                        Just ( "none readable", "" )

                    NoRelease ->
                        Nothing
            )
