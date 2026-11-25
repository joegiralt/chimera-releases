-- SPDX-License-Identifier: GPL-3.0-or-later


port module Main exposing (main)

import Browser
import Html exposing (Html)
import Json.Decode as Decode
import Model
import Transport
import Ui.Tokens as Tokens
import Update
import View.EnginePage as EnginePage


{-| The theme a choice in the top bar keeps (theme.js, behind try/catch).
-}
port storeTheme : String -> Cmd msg


{-| The unit's state, the hands on the page, and a firmware update while
one is open: it holds the link, and the editor waits (no polls, no lines)
until it gives the link back, then starts over.
-}
type alias App =
    { unit : Model.Model
    , page : EnginePage.State
    , updating : Maybe Update.Model
    }


type Msg
    = Unit Model.Msg
    | Page EnginePage.Msg
    | Updating Update.Msg


main : Program Decode.Value App Msg
main =
    Browser.element
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }


subscriptions : App -> Sub Msg
subscriptions app =
    case app.updating of
        Just _ ->
            Sub.batch [ Sub.map Updating Update.subscriptions, Sub.map Page (EnginePage.subscriptions app.page) ]

        Nothing ->
            Sub.batch [ Sub.map Unit Model.subscriptions, Sub.map Page (EnginePage.subscriptions app.page) ]


{-| The stored theme, else the OS's: what theme.js read at start.
-}
init : Decode.Value -> ( App, Cmd Msg )
init flags =
    ( { unit = Model.init, page = EnginePage.init (Tokens.fromPreference (Tokens.preference flags)), updating = Nothing }, Cmd.none )


update : Msg -> App -> ( App, Cmd Msg )
update msg app =
    case msg of
        Unit m ->
            let
                ( unit, cmd ) =
                    Model.update m app.unit
            in
            ( { app | unit = unit, page = EnginePage.follow unit app.page }, Cmd.map Unit cmd )

        Page EnginePage.OpenUpdate ->
            case app.updating of
                Just _ ->
                    ( app, Cmd.none )

                Nothing ->
                    let
                        ( u, cmd ) =
                            Update.begin
                    in
                    ( { app | updating = Just u }, cmd )

        Page m ->
            let
                ( page, asks, store ) =
                    EnginePage.update m app.unit app.page

                -- One update for every ask: their lines go in order.
                ( unit, cmd ) =
                    Model.updateAll asks app.unit
            in
            ( { app | unit = unit, page = EnginePage.follow unit page }
            , Cmd.batch [ Maybe.withDefault Cmd.none (Maybe.map (Tokens.name >> storeTheme) store), Cmd.map Unit cmd ]
            )

        Updating um ->
            case app.updating of
                Nothing ->
                    ( app, Cmd.none )

                Just u ->
                    case Update.update um u of
                        ( _, cmd, Just link ) ->
                            -- The link given back: the editor starts over on it.
                            let
                                ( unit, more ) =
                                    Model.update (Model.LinkChanged (Transport.parseLink link)) app.unit
                            in
                            ( { app | updating = Nothing, unit = unit, page = EnginePage.follow unit app.page }, Cmd.batch [ Cmd.map Updating cmd, Cmd.map Unit more ] )

                        ( next, cmd, Nothing ) ->
                            ( { app | updating = Just next }, Cmd.map Updating cmd )


view : App -> Html Msg
view app =
    case app.updating of
        Just u ->
            Update.view (EnginePage.PageMsg >> Page) Updating app.page.page u

        Nothing ->
            Html.map Page (EnginePage.view app.unit app.page)
