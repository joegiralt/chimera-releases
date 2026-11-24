-- SPDX-License-Identifier: GPL-3.0-or-later


module Meta exposing (description, title)

{-| Each page's title and description: the browser's tab, and the head of
the page's own `index.html` (what a link preview shows).
-}

import Features
import GuideId
import Menu
import Route exposing (Route(..))


title : Route -> String
title route =
    let
        named : String -> String
        named name =
            name ++ " · Chimera"
    in
    case route of
        Home ->
            "Chimera"

        Install ->
            named "Install & update"

        Guides ->
            named "Guides"

        Guide id ->
            named (GuideId.title id)

        Releases ->
            named "Releases"

        Editor ->
            named "Editor"

        NotFound ->
            named "Not found"


description : Route -> String
description route =
    let
        door : String
        door =
            Menu.doors Features.editor |> List.filter (\d -> d.route == route) |> List.head |> Maybe.map .text |> Maybe.withDefault ""
    in
    case route of
        Home ->
            "Chimera, alternative firmware for the PreenFM3: install and update, guides, releases and the browser editor."

        Guide id ->
            GuideId.title id ++ ": a guide to Chimera, alternative firmware for the PreenFM3."

        NotFound ->
            "Chimera, alternative firmware for the PreenFM3."

        Install ->
            door

        Guides ->
            door

        Releases ->
            door

        Editor ->
            door
