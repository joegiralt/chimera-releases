-- SPDX-License-Identifier: GPL-3.0-or-later


module Link exposing (Link(..), href, image, inManual, link)

{-| Where a link or image in a guide or release note points on the site.
Pure: the Markdown's own destinations in, a typed target out. `Unresolved`
is a destination the site can't place; a test fails on any in the guides.
-}

import Anchor exposing (AnchorId)
import AssetPath exposing (AssetPath)
import Chapter
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

    else if List.any (\dir -> String.startsWith dir dest) [ "editor/", "site/" ] then
        -- The licence texts (LICENSE.md): files of the repository, not pages.
        Href.web (repo ++ "/blob/main/" ++ dest) |> Maybe.map External |> Maybe.withDefault (Unresolved dest)

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
        -- A guide is a page here; any other file (a LICENSE) stays on GitHub.
        if String.endsWith ".md" (String.split "#" path |> List.head |> Maybe.withDefault path) then
            toDoc (String.dropLeft 11 path)

        else
            Href.web (repo ++ path) |> Maybe.map External |> Maybe.withDefault (Unresolved dest)

    else if String.startsWith "/" path then
        Href.web (repo ++ path) |> Maybe.map External |> Maybe.withDefault (Unresolved dest)

    else
        Unresolved dest


{-| The manual's folder in the repository. `Guide.parseManual` writes a
manual page's relative destinations as `manual/preenfm3/0.4/…`, so that
`README.md` there is the manual's index and not the install steps.
-}
manualDir : String
manualDir =
    "manual/preenfm3/0.4/"


{-| A destination written in a manual page, as `link` and `image` read it:
a relative one is under the manual's folder.
-}
inManual : String -> String
inManual dest =
    if List.any (\prefix -> String.startsWith prefix dest) [ "https://", "http://", "mailto:", "#", "/", ".", manualDir ] then
        dest

    else
        manualDir ++ dest


toManual : String -> String -> Link
toManual dest rest =
    let
        ( name, fragment ) =
            case String.split "#" rest of
                n :: f :: _ ->
                    ( n, Just (Anchor.fromFragment f) )

                n :: _ ->
                    ( n, Nothing )

                [] ->
                    ( rest, Nothing )
    in
    if name == "README.md" then
        Page Route.Manual fragment

    else
        case Chapter.fromFile name of
            Just c ->
                Page (Route.Chapter c) fragment

            Nothing ->
                AssetPath.manualFile name
                    |> Maybe.andThen
                        (\path ->
                            if List.member name [ "manual.md", "llms.txt" ] then
                                Just (File path)

                            else
                                Nothing
                        )
                    |> Maybe.withDefault (Unresolved dest)


toDoc : String -> Link
toDoc dest =
    if String.startsWith manualDir dest then
        toManual dest (String.dropLeft (String.length manualDir) dest)

    else
        toGuide dest


toGuide : String -> Link
toGuide dest =
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
            if String.startsWith (manualDir ++ "img/") src then
                AssetPath.manualImage (String.dropLeft (String.length manualDir + 4) src)
                    |> Maybe.map File
                    |> Maybe.withDefault (Unresolved src)

            else if String.startsWith "docs/img/" src then
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
