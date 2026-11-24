-- SPDX-License-Identifier: GPL-3.0-or-later


module Menu exposing (doors, nav, shows)

{-| The site's entries: the nav, the home page's cards, and which pages
this build serves.
-}

import Features exposing (Editor(..))
import Route exposing (Route(..))


nav : Editor -> List { route : Route, label : String }
nav editor =
    List.map (\d -> { route = d.route, label = d.label }) (doors editor)


doors : Editor -> List { route : Route, label : String, text : String }
doors editor =
    [ { route = Install, label = "INSTALL & UPDATE", text = "The latest release to download, and the steps to put it on the unit. The same steps update an earlier version." }
    , { route = Guides, label = "GUIDES", text = "Getting started, a tour of every page, the FAQ, MIDI control, tuning and the known issues." }
    , { route = Releases, label = "RELEASES", text = "Every release, its notes and its files." }
    ]
        ++ (case editor of
                EditorShown ->
                    [ { route = Editor, label = "EDITOR", text = "A sound editor in the browser that talks to the unit over USB." } ]

                EditorHidden ->
                    []
           )


{-| Whether this build serves a page; a hidden one is Not found.
-}
shows : Editor -> Route -> Bool
shows editor route =
    case route of
        Editor ->
            editor == EditorShown

        Home ->
            True

        Install ->
            True

        Guides ->
            True

        Guide _ ->
            True

        Releases ->
            True

        NotFound ->
            True
