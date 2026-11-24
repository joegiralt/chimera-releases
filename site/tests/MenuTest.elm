-- SPDX-License-Identifier: GPL-3.0-or-later


module MenuTest exposing (suite)

import Expect
import Features exposing (Editor(..))
import Menu
import Route exposing (Route(..))
import Test exposing (Test, describe, test)


routes : List { a | route : Route } -> List Route
routes =
    List.map .route


suite : Test
suite =
    describe "Menu"
        [ test "this build shows the editor: EDITOR in the nav and on the home page" <|
            \_ ->
                ( Features.editor, List.member Editor (routes (Menu.nav Features.editor)), List.member Editor (routes (Menu.doors Features.editor)) )
                    |> Expect.equal ( EditorShown, True, True )
        , test "shown, the editor is the last entry of both" <|
            \_ ->
                ( routes (Menu.nav EditorShown), routes (Menu.doors EditorShown) )
                    |> Expect.equal ( [ Install, Guides, Manual, Releases, Editor ], [ Install, Guides, Manual, Releases, Editor ] )
        , test "hidden, the rest stay" <|
            \_ ->
                routes (Menu.nav EditorHidden)
                    |> Expect.equal [ Install, Guides, Manual, Releases ]
        , test "hidden, the editor's address is no page" <|
            \_ ->
                ( Menu.shows EditorHidden Editor, Menu.shows EditorShown Editor, Menu.shows EditorHidden Guides )
                    |> Expect.equal ( False, True, True )
        ]
