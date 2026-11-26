-- SPDX-License-Identifier: GPL-3.0-or-later


port module Main exposing (main)

import Browser
import Html exposing (Html, button, div, p, text)
import Html.Attributes exposing (class)
import Html.Events exposing (onClick)
import Json.Decode as Decode
import Model
import Transport
import Ui.Tokens as Tokens
import Update
import Update.Read
import Update.Types
import Update.View
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
    , updating : Maybe Update.Types.Model
    , offer : Offer
    }


{-| The offer on connect: once a unit on USB is followed, its firmware
against the site's latest. A newer release is offered once a page session
(NOT NOW keeps it away); the same or an older one never is.
-}
type Offer
    = NotAsked
    | Asking String
    | Offered { have : String, latest : String }
    | Settled


type Msg
    = Unit Model.Msg
    | Page EnginePage.Msg
    | Updating Update.Types.Msg
    | LatestIs (Maybe String)
    | NotNow
    | UpdateNow
    | Ignore


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
            Sub.batch [ Sub.map Unit Model.subscriptions, Sub.map Page (EnginePage.subscriptions app.page), Update.latestSub LatestIs Ignore ]


{-| The stored theme, else the OS's: what theme.js read at start.
-}
init : Decode.Value -> ( App, Cmd Msg )
init flags =
    ( { unit = Model.init, page = EnginePage.init (Tokens.fromPreference (Tokens.preference flags)), updating = Nothing, offer = NotAsked }, Cmd.none )


update : Msg -> App -> ( App, Cmd Msg )
update msg app =
    case msg of
        Unit m ->
            let
                ( unit, cmd ) =
                    Model.update m app.unit

                ( offer, ask ) =
                    asking unit app.offer
            in
            ( { app | unit = unit, page = EnginePage.follow unit app.page, offer = offer }, Cmd.batch [ Cmd.map Unit cmd, ask ] )

        LatestIs latest ->
            case ( app.offer, latest ) of
                ( Asking have, Just v ) ->
                    if Update.Read.offerFor have v == Update.Types.Newer then
                        ( { app | offer = Offered { have = have, latest = v } }, Cmd.none )

                    else
                        ( { app | offer = Settled }, Cmd.none )

                ( Asking _, Nothing ) ->
                    ( { app | offer = Settled }, Cmd.none )

                ( NotAsked, _ ) ->
                    ( app, Cmd.none )

                ( Offered _, _ ) ->
                    ( app, Cmd.none )

                ( Settled, _ ) ->
                    ( app, Cmd.none )

        NotNow ->
            ( { app | offer = Settled }, Cmd.none )

        UpdateNow ->
            update (Page EnginePage.OpenUpdate) { app | offer = Settled }

        Ignore ->
            ( app, Cmd.none )

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

        Page EnginePage.OpenStuck ->
            case app.updating of
                Just _ ->
                    ( app, Cmd.none )

                Nothing ->
                    let
                        ( u, cmd ) =
                            Update.beginStuck
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


{-| The offer asked once a unit on USB is followed and its firmware known.
-}
asking : Model.Model -> Offer -> ( Offer, Cmd Msg )
asking unit offer =
    case ( offer, firmware unit, unit.via ) of
        ( NotAsked, Just have, Just Model.ViaUnit ) ->
            ( Asking have, Update.askLatest )

        ( NotAsked, _, _ ) ->
            ( offer, Cmd.none )

        ( Asking _, _, _ ) ->
            ( offer, Cmd.none )

        ( Offered _, _, _ ) ->
            ( offer, Cmd.none )

        ( Settled, _, _ ) ->
            ( offer, Cmd.none )


view : App -> Html Msg
view app =
    case ( app.updating, app.offer ) of
        ( Just u, _ ) ->
            Update.View.view (EnginePage.PageMsg >> Page) Updating app.page.page u

        ( Nothing, Offered o ) ->
            div []
                [ div [ class "ui offerbar" ]
                    [ p [] [ text ("Chimera " ++ number o.latest ++ " is available. You're running " ++ number o.have ++ ". Update now?") ]
                    , div [ class "connect" ]
                        [ button [ class "hbtn", onClick UpdateNow ] [ text "UPDATE" ]
                        , button [ class "hbtn", onClick NotNow ] [ text "NOT NOW" ]
                        ]
                    ]
                , Html.map Page (EnginePage.view app.unit app.page)
                ]

        ( Nothing, _ ) ->
            Html.map Page (EnginePage.view app.unit app.page)


{-| The firmware the followed unit runs, as `ed hello` named it (`0.4.0-de07edf9`), once it is followed.
-}
firmware : Model.Model -> Maybe String
firmware unit =
    Model.status unit |> Maybe.andThen (\_ -> unit.firmware)


{-| A version's number: `0.4.1` of `0.4.1 abcd1234` or `0.4.1-abcd1234`.
-}
number : String -> String
number v =
    String.replace "-" " " v |> String.words |> List.head |> Maybe.withDefault v
