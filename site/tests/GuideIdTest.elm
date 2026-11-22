-- SPDX-License-Identifier: GPL-3.0-or-later


module GuideIdTest exposing (suite)

import Expect
import GuideId exposing (GuideId(..))
import Set
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "GuideId"
        [ test "all lists every guide once, in reading order" <|
            \_ ->
                GuideId.all
                    |> Expect.equal [ GettingStarted, QuickStart, Faq, Midi, Nrpn, Tuning, KnownIssues, License ]
        , test "slugs are unique and round-trip" <|
            \_ ->
                ( List.map GuideId.fromSlug (List.map GuideId.slug GuideId.all)
                , Set.size (Set.fromList (List.map GuideId.slug GuideId.all))
                )
                    |> Expect.equal ( List.map Just GuideId.all, List.length GuideId.all )
        , test "files round-trip" <|
            \_ ->
                List.map (GuideId.file >> GuideId.fromFile) GuideId.all
                    |> Expect.equal (List.map Just GuideId.all)
        , test "an unknown slug or file is Nothing" <|
            \_ ->
                ( GuideId.fromSlug "readme", GuideId.fromFile "README.md" )
                    |> Expect.equal ( Nothing, Nothing )
        , test "MIDI's file and title" <|
            \_ ->
                ( GuideId.file Midi, GuideId.slug Midi, GuideId.title Midi )
                    |> Expect.equal ( "MIDI.md", "midi", "MIDI control" )
        ]
