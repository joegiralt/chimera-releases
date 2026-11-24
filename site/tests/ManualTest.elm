-- SPDX-License-Identifier: GPL-3.0-or-later


module ManualTest exposing (suite)

{-| The 0.4 manual (`manual/preenfm3/0.4`): every chapter file has a route
and every route a file, every page parses, renders and resolves each link
(to a chapter and a heading of it, an image, `manual.md`, `llms.txt`), and a
design note is marked. (`tests/manual.check.js` checks the built dist.)
-}

import Anchor
import AssetPath
import Chapter
import Doc
import Expect
import Generated.Fixtures as Fixtures
import Guide
import Html
import Link exposing (Link(..))
import Markdown.Block exposing (Block)
import Route exposing (Route(..))
import Test exposing (Test, describe, test)
import Test.Html.Query as Query
import Test.Html.Selector as Selector


source : String -> Maybe String
source file =
    Fixtures.manual |> List.filter (\( f, _ ) -> f == file) |> List.head |> Maybe.map Tuple.second


parsed : String -> Result String (List Block)
parsed file =
    source file |> Result.fromMaybe (file ++ " is missing") |> Result.andThen Guide.parseManual


problems : List Block -> List String
problems blocks =
    List.filterMap
        (\t ->
            case t of
                Unresolved dest ->
                    Just ("unresolved: " ++ dest)

                File path ->
                    if List.member (String.join "/" (AssetPath.segments path)) (List.map (\i -> "manual/preenfm3/0.4/img/" ++ i) Fixtures.manualImages ++ [ "manual/preenfm3/0.4/manual.md", "manual/preenfm3/0.4/llms.txt" ]) then
                        Nothing

                    else
                        Just ("no such file: " ++ String.join "/" (AssetPath.segments path))

                Page route (Just fragment) ->
                    case Route.doc route |> Maybe.map (Doc.file >> parsed) of
                        Just (Ok other) ->
                            if List.member fragment (Guide.anchors other) then
                                Nothing

                            else
                                Just ("no heading " ++ Route.toString (Route.base "/") route ++ "#" ++ Anchor.toString fragment)

                        Just (Err e) ->
                            Just e

                        Nothing ->
                            Just "a page without a doc"

                Page _ Nothing ->
                    Nothing

                InPage fragment ->
                    if List.member fragment (Guide.anchors blocks) then
                        Nothing

                    else
                        Just ("no heading #" ++ Anchor.toString fragment)

                External _ ->
                    Nothing
        )
        (Guide.targets blocks)


suite : Test
suite =
    describe "the manual"
        ([ test "every chapter file has a route, and every route a file" <|
            \_ ->
                List.map Tuple.first Fixtures.manual
                    |> Expect.equal (List.sort ("README.md" :: List.map Chapter.file Chapter.all))
         , test "the router lists the index, then every chapter in order" <|
            \_ ->
                List.filter (\r -> Route.doc r /= Nothing && r /= Install) Route.all
                    |> List.filter (\r -> r == Manual || List.any (\c -> r == Chapter c) Chapter.all)
                    |> Expect.equal (Manual :: List.map Chapter Chapter.all)
         , test "each chapter's title is its file's heading" <|
            \_ ->
                Chapter.all
                    |> List.map (\c -> ( Chapter.file c, Chapter.title c ))
                    |> Expect.equal
                        (Chapter.all
                            |> List.map
                                (\c ->
                                    ( Chapter.file c
                                    , source (Chapter.file c)
                                        |> Maybe.andThen (String.lines >> List.head)
                                        |> Maybe.map (String.dropLeft 2)
                                        |> Maybe.withDefault "(no heading)"
                                    )
                                )
                        )
         , test "chapters link to their neighbours" <|
            \_ ->
                Chapter.all
                    |> List.filterMap (Chapter.neighbours >> Tuple.first)
                    |> Expect.equal (List.take (List.length Chapter.all - 1) Chapter.all)
         , test "a design note gets its class, an ordinary quote does not" <|
            \_ ->
                Guide.parseManual "> **Design note:** why.\n\n> Plain quote."
                    |> Result.andThen (Guide.render (Route.base "/"))
                    |> Result.map (Html.div [] >> Query.fromHtml >> Query.findAll [ Selector.tag "blockquote" ])
                    |> Result.map
                        (Expect.all
                            [ Query.count (Expect.equal 2)
                            , Query.index 0 >> Query.has [ Selector.class "design-note" ]
                            , Query.index 1 >> Query.hasNot [ Selector.class "design-note" ]
                            ]
                        )
                    |> Result.withDefault (Expect.fail "did not render")
         , test "a manual page's links: chapters with anchors, images, the whole-manual files" <|
            \_ ->
                Guide.parseManual "[a](03-algo.md#x) [b](README.md) ![c](img/va_va.png) [d](manual.md) [e](llms.txt) [f](https://example.org/) [g](nope.md)"
                    |> Result.map (Guide.targets >> List.map (\t -> ( t == Unresolved "manual/preenfm3/0.4/nope.md", Link.href (Route.base "/p/") t |> Maybe.map (\_ -> ()) )))
                    |> Expect.equal (Ok (List.repeat 6 ( False, Just () ) ++ [ ( True, Nothing ) ]))
         ]
            ++ List.map
                (\file ->
                    test (file ++ " parses, renders and every link and image resolves") <|
                        \_ ->
                            case parsed file of
                                Ok blocks ->
                                    ( problems blocks, Guide.render (Route.base "/") blocks |> Result.map (\_ -> ()) )
                                        |> Expect.equal ( [], Ok () )

                                Err e ->
                                    Expect.fail e
                )
                (List.map Tuple.first Fixtures.manual)
        )
