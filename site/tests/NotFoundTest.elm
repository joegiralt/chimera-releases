-- SPDX-License-Identifier: GPL-3.0-or-later


module NotFoundTest exposing (suite)

import Expect
import Html
import Html.Attributes as Attr
import NotFound
import Route
import Test exposing (Test, describe, test)
import Test.Html.Query as Query
import Test.Html.Selector as Sel


page : Query.Single msg
page =
    Html.div [] (NotFound.view (Route.base "/chimera-releases/")) |> Query.fromHtml


suite : Test
suite =
    describe "NotFound"
        [ test "it says so, owner's line first" <|
            \_ -> page |> Query.has [ Sel.text "Uh-oh.", Sel.text "The thing you're looking for can't be found." ]
        , test "the King in Yellow shrugs, described for a screen reader" <|
            \_ ->
                page
                    |> Query.find [ Sel.tag "svg" ]
                    |> Query.has [ Sel.attribute (Attr.attribute "role" "img"), Sel.attribute (Attr.attribute "aria-label" NotFound.alt) ]
        , test "the way home, and to the guides" <|
            \_ ->
                page
                    |> Query.has
                        [ Sel.all [ Sel.tag "a", Sel.attribute (Attr.href "/chimera-releases/") ]
                        ]
        , test "the guides are linked too" <|
            \_ ->
                page
                    |> Query.findAll [ Sel.tag "a", Sel.attribute (Attr.href "/chimera-releases/guides") ]
                    |> Query.count
                        (\n ->
                            if n == 1 then
                                Expect.pass

                            else
                                Expect.fail ("guides linked " ++ String.fromInt n ++ " times")
                        )
        ]
