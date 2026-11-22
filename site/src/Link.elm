-- SPDX-License-Identifier: GPL-3.0-or-later


module Link exposing (Link(..), href, image, link)

{-| Where a link or image in a guide or release note points on the site.
Pure: the Markdown's own destinations in, a typed target out. `Unresolved`
is a destination the site can't place; a test fails on any in the guides.
-}

import Anchor exposing (AnchorId)
import AssetPath exposing (AssetPath)
import Doc
import Href exposing (Href)
import Route exposing (Base, Route)


type Link
    = Page Route (Maybe AnchorId)
    | InPage AnchorId
    | File AssetPath
    | External Href
    | Unresolved String


repo : String
repo =
    "https://github.com/joegiralt/chimera-releases"


link : String -> Link
link dest =
    if String.startsWith "#" dest then
        InPage (Anchor.fromFragment (String.dropLeft 1 dest))

    else if String.startsWith repo dest then
        fromRepo dest (String.dropLeft (String.length repo) dest)

    else if String.startsWith "../../" dest then
        fromRepo dest (String.dropLeft 5 dest)

    else
        case Href.web dest of
            Just web ->
                External web

            Nothing ->
                toDoc dest


{-| A path inside the chimera-releases repo on GitHub, `/…` or `#…`.
-}
fromRepo : String -> String -> Link
fromRepo dest path =
    if path == "/releases" then
        Page Route.Releases Nothing

    else if path == "" || String.startsWith "#" path then
        toDoc ("README.md" ++ path)

    else if String.startsWith "/blob/main/" path then
        toDoc (String.dropLeft 11 path)

    else if String.startsWith "/" path then
        Href.web (repo ++ path) |> Maybe.map External |> Maybe.withDefault (Unresolved dest)

    else
        Unresolved dest


toDoc : String -> Link
toDoc dest =
    let
        ( name, fragment ) =
            case List.head (String.indexes "#" dest) of
                Just at ->
                    ( String.left at dest, Just (Anchor.fromFragment (String.dropLeft (at + 1) dest)) )

                Nothing ->
                    ( dest, Nothing )
    in
    case Doc.fromFile name of
        Just doc ->
            Page (Route.fromDoc doc) fragment

        Nothing ->
            Unresolved dest


image : String -> Link
image src =
    case Href.web src of
        Just web ->
            if String.startsWith "https://" src then
                External web

            else
                Unresolved src

        Nothing ->
            if String.startsWith "docs/img/" src then
                AssetPath.image (String.dropLeft 9 src)
                    |> Maybe.map File
                    |> Maybe.withDefault (Unresolved src)

            else
                Unresolved src


href : Base -> Link -> Maybe Href
href base target =
    case target of
        Page route fragment ->
            Just
                (fragment
                    |> Maybe.map (\f -> Href.withFragment f (Route.href base route))
                    |> Maybe.withDefault (Route.href base route)
                )

        InPage fragment ->
            Just (Href.inPage fragment)

        File path ->
            Just (Route.asset base path)

        External url ->
            Just url

        Unresolved _ ->
            Nothing
