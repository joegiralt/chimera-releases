-- SPDX-License-Identifier: GPL-3.0-or-later


module LinkTest exposing (suite)

import Anchor
import AssetPath
import Doc exposing (Doc(..))
import Expect
import GuideId exposing (GuideId(..))
import Href
import Link exposing (Link(..))
import Route exposing (Route(..))
import Test exposing (Test, describe, test)
import Version


web : String -> Link
web url =
    Href.web url |> Maybe.map External |> Maybe.withDefault (Unresolved url)


suite : Test
suite =
    describe "Link"
        [ describe "Doc"
            [ test "README is Install & update, guides are guide pages" <|
                \_ ->
                    List.map Route.fromDoc [ Readme, GuideDoc Faq ]
                        |> Expect.equal [ Install, Guide Faq ]
            , test "the doc each route shows" <|
                \_ ->
                    List.map Route.doc [ Install, Guide Midi, Home, Guides, Releases, Editor, NotFound ]
                        |> Expect.equal [ Just Readme, Just (GuideDoc Midi), Nothing, Nothing, Nothing, Nothing, Nothing ]
            , test "all is README then every guide" <|
                \_ -> Doc.all |> Expect.equal (Readme :: List.map GuideDoc GuideId.all)
            , test "files round-trip for every doc" <|
                \_ ->
                    List.map (Doc.file >> Doc.fromFile) Doc.all
                        |> Expect.equal (List.map Just Doc.all)
            ]
        , describe "link"
            [ test "a guide, with and without a heading" <|
                \_ ->
                    List.map Link.link [ "FAQ.md", "MIDI.md#mpe", "README.md#reporting-bugs" ]
                        |> Expect.equal
                            [ Page (Guide Faq) Nothing
                            , Page (Guide Midi) (Just (Anchor.fromFragment "mpe"))
                            , Page Install (Just (Anchor.fromFragment "reporting-bugs"))
                            ]
            , test "a heading on the same page" <|
                \_ -> Link.link "#sounds" |> Expect.equal (InPage (Anchor.fromFragment "sounds"))
            , test "the repo's releases and issues" <|
                \_ ->
                    List.map Link.link [ "../../releases", "../../issues/new/choose" ]
                        |> Expect.equal
                            [ Page Releases Nothing
                            , web "https://github.com/joegiralt/chimera-releases/issues/new/choose"
                            ]
            , test "the repo's GitHub pages become site pages" <|
                \_ ->
                    List.map Link.link
                        [ "https://github.com/joegiralt/chimera-releases#installing-chimera"
                        , "https://github.com/joegiralt/chimera-releases/blob/main/TUNING.md"
                        , "https://github.com/joegiralt/chimera-releases/releases"
                        ]
                        |> Expect.equal [ Page Install (Just (Anchor.fromFragment "installing-chimera")), Page (Guide Tuning) Nothing, Page Releases Nothing ]
            , test "other web links stay external" <|
                \_ ->
                    List.map Link.link [ "https://github.com/joegiralt/chimera-releases/issues", "https://example.org/a", "mailto:a@b.c" ]
                        |> Expect.equal
                            [ web "https://github.com/joegiralt/chimera-releases/issues"
                            , web "https://example.org/a"
                            , web "mailto:a@b.c"
                            ]
            , test "anything else is Unresolved" <|
                \_ ->
                    List.map Link.link [ "OTHER.md", "docs/img/a.png", "../x", "", "javascript:alert(1)" ]
                        |> Expect.equal [ Unresolved "OTHER.md", Unresolved "docs/img/a.png", Unresolved "../x", Unresolved "", Unresolved "javascript:alert(1)" ]
            ]
        , describe "image"
            [ test "docs/img is served under guides/img" <|
                \_ -> Link.image "docs/img/lfo.png" |> Expect.equal (AssetPath.image "lfo.png" |> Maybe.map File |> Maybe.withDefault (Unresolved ""))
            , test "a guide, a deeper path or a climb is not an image" <|
                \_ ->
                    List.map Link.image [ "FAQ.md", "docs/img/a/b.png", "docs/img/../x.png" ]
                        |> Expect.equal [ Unresolved "FAQ.md", Unresolved "docs/img/a/b.png", Unresolved "docs/img/../x.png" ]
            ]
        , describe "href"
            [ test "under a base" <|
                \_ ->
                    List.map (Link.href (Route.base "/chimera-releases/") >> Maybe.map Href.toString)
                        [ Page (Guide Midi) (Just (Anchor.fromFragment "mpe"))
                        , InPage (Anchor.fromFragment "x")
                        , Link.image "docs/img/a.png"
                        , web "https://e.org"
                        , Unresolved "a"
                        ]
                        |> Expect.equal
                            [ Just "/chimera-releases/guides/midi#mpe"
                            , Just "#x"
                            , Just "/chimera-releases/guides/img/a.png"
                            , Just "https://e.org"
                            , Nothing
                            ]
            , test "the editor and a doc's file" <|
                \_ ->
                    ( Route.asset (Route.base "/chimera-releases/") AssetPath.editor |> Href.toString
                    , Route.asset (Route.base "/") (AssetPath.doc (GuideDoc Faq)) |> Href.toString
                    )
                        |> Expect.equal ( "/chimera-releases/editor/", "/guides/FAQ.md" )
            , test "the repo's own pages" <|
                \_ ->
                    Href.toString (Href.repo [ "blob", "main", "FAQ.md" ])
                        |> Expect.equal "https://github.com/joegiralt/chimera-releases/blob/main/FAQ.md"
            , test "only web links are web" <|
                \_ ->
                    List.map (Href.web >> Maybe.map Href.toString) [ "https://a.b/c", "http://a.b", "mailto:x@y.z", "javascript:x", "/local", "data:text/html,x" ]
                        |> Expect.equal [ Just "https://a.b/c", Just "http://a.b", Just "mailto:x@y.z", Nothing, Nothing, Nothing ]
            ]
        , describe "Anchor, GitHub's heading ids"
            [ test "headings" <|
                \_ ->
                    List.map (Anchor.fromHeading >> Anchor.toString)
                        [ "Step 3: Copy the files to the card"
                        , "Switching back to the original PreenFM3 firmware"
                        , "What's MPE?"
                        , "TAPE: SRC, `ONESHOT` & LOOP"
                        , "Part 1 — the mixer"
                        ]
                        |> Expect.equal
                            [ "step-3-copy-the-files-to-the-card"
                            , "switching-back-to-the-original-preenfm3-firmware"
                            , "whats-mpe"
                            , "tape-src-oneshot--loop"
                            , "part-1--the-mixer"
                            ]
            , test "a repeated heading gets -1, -2" <|
                \_ ->
                    List.map Anchor.fromHeading [ "Sounds", "MIDI", "Sounds", "Sounds", "Sounds 1" ]
                        |> Anchor.unique
                        |> List.map Anchor.toString
                        |> Expect.equal [ "sounds", "midi", "sounds-1", "sounds-2", "sounds-1-1" ]
            , test "a release's id" <|
                \_ ->
                    Version.fromTag "v0.3.0"
                        |> Maybe.map (Anchor.release >> Anchor.toString)
                        |> Expect.equal (Just "v0.3.0")
            ]
        ]
