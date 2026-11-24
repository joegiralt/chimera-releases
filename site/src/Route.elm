-- SPDX-License-Identifier: GPL-3.0-or-later


module Route exposing (Base, Route(..), all, asset, base, doc, fromDoc, href, parse, toString)

{-| The site's pages. `/editor/` and the `/guides/…` files are static, not
routes: an internal link that parses to `NotFound` is loaded from the
server. Files on the unit and updating from the browser (phases 2 and 3)
come in as new constructors here; every `case` on `Route` is exhaustive,
so each new page fails to compile until it has a place.
-}

import AssetPath exposing (AssetPath)
import Doc exposing (Doc(..))
import GuideId exposing (GuideId)
import Href exposing (Href)
import Url exposing (Url)


type Route
    = Home
    | Install
    | Guides
    | Guide GuideId
    | Releases
    | Editor
    | NotFound


{-| Every page, NotFound aside: each gets its own `index.html` at build
time, so a deep link is a page and not the server's 404 fallback. `next`
walks them, and its `case` is exhaustive: a new page fails to compile
until it is listed.
-}
all : List Route
all =
    let
        from : Route -> List Route
        from r =
            -- The guides' list, then each guide.
            (if r == Guides then
                Guides :: List.map Guide GuideId.all

             else
                [ r ]
            )
                ++ (next r |> Maybe.map from |> Maybe.withDefault [])
    in
    from Home


next : Route -> Maybe Route
next r =
    case r of
        Home ->
            Just Install

        Install ->
            Just Guides

        Guides ->
            Just Releases

        Guide _ ->
            Nothing

        Releases ->
            Just Editor

        Editor ->
            Nothing

        NotFound ->
            Nothing


{-| Where the site is served from: `/` locally, `/chimera-releases/` on a
project's GitHub Pages.
-}
type Base
    = Base (List String)


base : String -> Base
base path =
    Base (segments path)


segments : String -> List String
segments path =
    String.split "/" path |> List.filter (not << String.isEmpty)


parse : Base -> Url -> Route
parse (Base root) url =
    let
        path : List String
        path =
            segments url.path
    in
    if List.take (List.length root) path == root then
        fromSegments (List.drop (List.length root) path)

    else
        NotFound


fromSegments : List String -> Route
fromSegments path =
    case path of
        [] ->
            Home

        [ "install" ] ->
            Install

        [ "guides" ] ->
            Guides

        [ "guides", slug ] ->
            GuideId.fromSlug slug |> Maybe.map Guide |> Maybe.withDefault NotFound

        [ "releases" ] ->
            Releases

        [ "sound-editor" ] ->
            Editor

        _ ->
            NotFound


href : Base -> Route -> Href
href (Base root) route =
    Href.root <|
        root
            ++ (case route of
                    Home ->
                        [ "" ]

                    Install ->
                        [ "install" ]

                    Guides ->
                        [ "guides" ]

                    Guide id ->
                        [ "guides", GuideId.slug id ]

                    Releases ->
                        [ "releases" ]

                    Editor ->
                        [ "sound-editor" ]

                    NotFound ->
                        [ "not-found" ]
               )


toString : Base -> Route -> String
toString b =
    href b >> Href.toString


{-| A static file under the base.
-}
asset : Base -> AssetPath -> Href
asset (Base root) path =
    Href.root (root ++ AssetPath.segments path)


fromDoc : Doc -> Route
fromDoc d =
    case d of
        Readme ->
            Install

        GuideDoc id ->
            Guide id


{-| The doc a page shows, if any.
-}
doc : Route -> Maybe Doc
doc route =
    case route of
        Install ->
            Just Readme

        Guide id ->
            Just (GuideDoc id)

        Home ->
            Nothing

        Guides ->
            Nothing

        Releases ->
            Nothing

        Editor ->
            Nothing

        NotFound ->
            Nothing
