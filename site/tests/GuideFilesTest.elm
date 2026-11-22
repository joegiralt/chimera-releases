-- SPDX-License-Identifier: GPL-3.0-or-later


module GuideFilesTest exposing (suite)

{-| Every real guide (the Markdown at the root of this repository) parses, and every link and image in it lands somewhere on
the site: a guide that would fail on the site fails here.
-}

import Anchor exposing (AnchorId)
import AssetPath
import Doc exposing (Doc)
import Expect
import Generated.Fixtures as Fixtures
import Guide
import Html
import Html.Attributes as Attr
import Json.Decode as Decode
import Link exposing (Link(..))
import Markdown.Block exposing (Block)
import Release
import Route
import Test exposing (Test, describe, test)
import Test.Html.Query as Query
import Test.Html.Selector as Selector


source : Doc -> Maybe String
source doc =
    Fixtures.docs
        |> List.filter (\( f, _ ) -> f == Doc.file doc)
        |> List.head
        |> Maybe.map Tuple.second


parsed : Doc -> Result String (List Block)
parsed doc =
    source doc
        |> Result.fromMaybe (Doc.file doc ++ " is missing from the repository")
        |> Result.andThen Guide.parse


anchorsOf : Link -> Maybe ( Doc, AnchorId )
anchorsOf link =
    case link of
        Page route (Just fragment) ->
            Route.doc route |> Maybe.map (\d -> ( d, fragment ))

        _ ->
            Nothing


{-| A doc's problems: unresolved targets, missing images, headings
that a link names but no heading has.
-}
problems : List Block -> List String
problems blocks =
    let
        targets : List Link
        targets =
            Guide.targets blocks

        missingAnchor : ( Doc, AnchorId ) -> Bool
        missingAnchor ( d, fragment ) =
            case parsed d of
                Ok other ->
                    not (List.member fragment (Guide.anchors other))

                Err _ ->
                    True
    in
    List.filterMap
        (\t ->
            case t of
                Unresolved dest ->
                    Just ("unresolved: " ++ dest)

                File path ->
                    if List.member path (List.filterMap AssetPath.image Fixtures.images) then
                        Nothing

                    else
                        Just ("no such image: " ++ String.join "/" (AssetPath.segments path))

                InPage fragment ->
                    if List.member fragment (Guide.anchors blocks) then
                        Nothing

                    else
                        Just ("no heading #" ++ Anchor.toString fragment)

                Page _ _ ->
                    anchorsOf t
                        |> Maybe.andThen
                            (\a ->
                                if missingAnchor a then
                                    Just ("no heading " ++ Doc.file (Tuple.first a) ++ "#" ++ Anchor.toString (Tuple.second a))

                                else
                                    Nothing
                            )

                External _ ->
                    Nothing
        )
        targets


{-| A snippet of Markdown, rendered and ready to query.
-}
html : String -> Query.Single msg
html markdown =
    Guide.parse markdown
        |> Result.andThen (Guide.render (Route.base "/"))
        |> Result.withDefault [ Html.text "did not render" ]
        |> Html.div []
        |> Query.fromHtml


rendered : List Block -> Result String ()
rendered blocks =
    Guide.render (Route.base "/") blocks |> Result.map (\_ -> ())


unresolved : List Block -> List Link
unresolved =
    Guide.targets
        >> List.filter
            (\t ->
                case t of
                    Unresolved _ ->
                        True

                    Page _ _ ->
                        False

                    InPage _ ->
                        False

                    File _ ->
                        False

                    External _ ->
                        False
            )


suite : Test
suite =
    describe "the real guides"
        (List.map
            (\doc ->
                test (Doc.file doc ++ " parses and every link and image resolves") <|
                    \_ ->
                        case parsed doc of
                            Ok blocks ->
                                ( problems blocks, rendered blocks )
                                    |> Expect.equal ( [], Ok () )

                            Err e ->
                                Expect.fail e
            )
            Doc.all
            ++ [ test "every release's notes parse, render and resolve" <|
                    \_ ->
                        Decode.decodeString Release.listDecoder Fixtures.releasesJson
                            |> Result.mapError Decode.errorToString
                            |> Result.andThen
                                (.releases
                                    >> List.map (.notes >> Guide.parse >> Result.andThen (\b -> rendered b |> Result.map (\_ -> unresolved b)))
                                    >> List.foldr (Result.map2 (++)) (Ok [])
                                )
                            |> Expect.equal (Ok [])
               , test "a broken link is caught" <|
                    \_ ->
                        Guide.parse "See [this](NOPE.md) and ![x](img.png)."
                            |> Result.map Guide.targets
                            |> Expect.equal (Ok [ Unresolved "NOPE.md", Unresolved "img.png" ])
               , test "headings give GitHub's anchors" <|
                    \_ ->
                        Guide.parse "# Chimera FAQ\n\n## Step 3: Copy `X`\n\ntext"
                            |> Result.map (Guide.anchors >> List.map Anchor.toString)
                            |> Expect.equal (Ok [ "chimera-faq", "step-3-copy-x" ])
               , test "repeated headings get GitHub's -1, -2, in the page too" <|
                    \_ ->
                        Expect.all
                            [ \md ->
                                Guide.parse md
                                    |> Result.map (Guide.anchors >> List.map Anchor.toString)
                                    |> Expect.equal (Ok [ "sounds", "sounds-1", "sounds-2" ])
                            , html
                                >> Query.findAll [ Selector.tag "h2" ]
                                >> Expect.all
                                    (List.indexedMap (\i id -> Query.index i >> Query.has [ Selector.id id ])
                                        [ "sounds", "sounds-1", "sounds-2" ]
                                    )
                            ]
                            "## Sounds\n\nx\n\n## Sounds\n\ny\n\n## Sounds"
               , test "raw HTML: known tags render, unknown ones keep their text, nothing fails" <|
                    \_ ->
                        html "Press <kbd>MENU</kbd>, <foo>kept</foo>.\n\n<div><custom>inner</custom></div>\n\n<marquee>moving</marquee>\n\n<br>"
                            |> Expect.all
                                [ Query.find [ Selector.tag "kbd" ] >> Query.has [ Selector.text "MENU" ]
                                , Query.has [ Selector.text "kept", Selector.text "inner", Selector.text "moving" ]
                                , Query.findAll [ Selector.tag "foo" ] >> Query.count (Expect.equal 0)
                                , Query.findAll [ Selector.tag "marquee" ] >> Query.count (Expect.equal 0)
                                ]
               , test "raw HTML: no script, no attributes but a resolved src, alt and href" <|
                    \_ ->
                        html "<script>alert(1)</script>\n\n<p onclick=\"x()\" style=\"color:red\">p</p>\n\n<img src=\"docs/img/lfo.png\" alt=\"LFO\" onerror=\"x()\">\n\n<a href=\"FAQ.md#sounds\">faq</a>"
                            |> Expect.all
                                [ Query.findAll [ Selector.tag "script" ] >> Query.count (Expect.equal 0)
                                , Query.find [ Selector.tag "p" ] >> Query.hasNot [ Selector.attribute (Attr.style "color" "red") ]
                                , Query.find [ Selector.tag "img" ] >> Query.has [ Selector.attribute (Attr.src "/guides/img/lfo.png"), Selector.attribute (Attr.alt "LFO") ]
                                , Query.find [ Selector.tag "a" ] >> Query.has [ Selector.attribute (Attr.href "/guides/faq#sounds") ]
                                ]
               , test "code is never rewritten: fences of either kind, indented code, long backtick spans" <|
                    \_ ->
                        html "```\n<br>\n```\n\n~~~\n```\n<img src=\"a\">\n~~~\n\nText.\n\n    <br> indented\n\nText ``x <br> y`` end."
                            |> Query.findAll [ Selector.tag "code" ]
                            |> Expect.all
                                [ Query.count (Expect.equal 4)
                                , Query.index 0 >> Query.has [ Selector.text "<br>" ]
                                , Query.index 1 >> Query.has [ Selector.text "<img src=\"a\">" ]
                                , Query.index 2 >> Query.has [ Selector.text "<br> indented" ]
                                , Query.index 3 >> Query.has [ Selector.text "x <br> y" ]
                                ]
               , test "void tags of any kind and unquoted attributes parse; head tags are dropped" <|
                    \_ ->
                        Guide.parse "<link rel=stylesheet href=x.css>\n\n<meta charset=utf-8>\n\n<table><col><tr><td>cell</td></tr></table>\n\n<img src=docs/img/lfo.png alt=LFO>\n\nA <br> and <wbr> inline."
                            |> Result.andThen (Guide.render (Route.base "/"))
                            |> Result.map (Html.div [] >> Query.fromHtml)
                            |> Result.map
                                (Expect.all
                                    [ Query.findAll [ Selector.tag "link" ] >> Query.count (Expect.equal 0)
                                    , Query.findAll [ Selector.tag "meta" ] >> Query.count (Expect.equal 0)
                                    , Query.has [ Selector.text "cell" ]
                                    , Query.find [ Selector.tag "img" ] >> Query.has [ Selector.attribute (Attr.src "/guides/img/lfo.png"), Selector.attribute (Attr.alt "LFO") ]
                                    ]
                                )
                            |> Result.withDefault (Expect.fail "did not parse or render")
               , test "raw HTML images and links are checked like Markdown ones" <|
                    \_ ->
                        Guide.parse "<img src=\"x.png\">\n\n<a href=\"NOPE.md\">n</a>"
                            |> Result.map Guide.targets
                            |> Expect.equal (Ok [ Unresolved "x.png", Unresolved "NOPE.md" ])
               ]
        )
