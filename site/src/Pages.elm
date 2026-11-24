-- SPDX-License-Identifier: GPL-3.0-or-later


port module Pages exposing (main)

{-| The pages the site builds an `index.html` for (`scripts/pages.js`):
every route this build shows, with its path under the base, title and
description.
-}

import Features
import Menu
import Meta
import Route exposing (Route)


port pages : List { path : String, title : String, description : String } -> Cmd msg


page : Route -> { path : String, title : String, description : String }
page r =
    { path = Route.toString (Route.base "/") r |> String.dropLeft 1
    , title = Meta.title r
    , description = Meta.description r
    }


main : Program () () Never
main =
    Platform.worker
        { init = \_ -> ( (), pages (List.map page (List.filter (Menu.shows Features.editor) Route.all)) )
        , update = \_ m -> ( m, Cmd.none )
        , subscriptions = \_ -> Sub.none
        }
