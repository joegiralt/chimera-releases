-- SPDX-License-Identifier: GPL-3.0-or-later


port module Main exposing (main)

import Browser
import Html exposing (Html, button, div, p, text)
import Html.Attributes exposing (class)
import Html.Events exposing (onClick)
import Json.Decode as Decode
import Model
import Tape
import Tape.Types
import Tape.View
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


{-| The unit's state, the hands on the page, the panel open, and the
offer on connect.
-}
type alias App =
    { unit : Model.Model
    , page : EnginePage.State
    , panel : Panel
    , offer : Offer
    }


{-| A panel that holds the link while it is open, a firmware update or a
TAPE import, never both: the editor waits (no polls, no lines) until it
gives the link back, then starts over.
-}
type Panel
    = NoPanel
    | UpdatePanel Update.Types.Model
    | TapePanel Tape.Types.Model


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
    | Taping Tape.Types.Msg
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
    case app.panel of
        UpdatePanel _ ->
            Sub.batch [ Sub.map Updating Update.subscriptions, Sub.map Page (EnginePage.subscriptions app.page) ]

        TapePanel _ ->
            Sub.batch [ Sub.map Taping Tape.subscriptions, Sub.map Page (EnginePage.subscriptions app.page) ]

        NoPanel ->
            Sub.batch [ Sub.map Unit Model.subscriptions, Sub.map Page (EnginePage.subscriptions app.page), Update.latestSub LatestIs Ignore ]


{-| The stored theme, else the OS's: what theme.js read at start.
-}
init : Decode.Value -> ( App, Cmd Msg )
init flags =
    ( { unit = Model.init, page = EnginePage.init (Tokens.fromPreference (Tokens.preference flags)), panel = NoPanel, offer = NotAsked }, Cmd.none )


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
                ( Asking have, Just version ) ->
                    if Update.Read.offerFor have version == Update.Types.Newer then
                        ( { app | offer = Offered { have = have, latest = version } }, Cmd.none )

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
            opening app (Tuple.mapFirst UpdatePanel Update.begin)

        Page EnginePage.OpenTape ->
            opening app (Tuple.mapBoth TapePanel (Cmd.map Taping) Tape.begin)

        Page EnginePage.OpenStuck ->
            opening app (Tuple.mapFirst UpdatePanel Update.beginStuck)

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
            case app.panel of
                UpdatePanel updating ->
                    let
                        ( next, cmd, link ) =
                            Update.update um updating
                    in
                    closing app (UpdatePanel next) (Cmd.map Updating cmd) link

                TapePanel _ ->
                    ( app, Cmd.none )

                NoPanel ->
                    ( app, Cmd.none )

        Taping tm ->
            case app.panel of
                TapePanel taping ->
                    let
                        ( next, cmd, link ) =
                            Tape.update tm taping
                    in
                    closing app (TapePanel next) (Cmd.map Taping cmd) link

                UpdatePanel _ ->
                    ( app, Cmd.none )

                NoPanel ->
                    ( app, Cmd.none )


{-| A panel opened, only when none is.
-}
opening : App -> ( Panel, Cmd Msg ) -> ( App, Cmd Msg )
opening app ( panel, cmd ) =
    case app.panel of
        NoPanel ->
            ( { app | panel = panel }, cmd )

        UpdatePanel _ ->
            ( app, Cmd.none )

        TapePanel _ ->
            ( app, Cmd.none )


{-| The panel after a step; once it gives the link back, closed, and the
editor starts over on the link.
-}
closing : App -> Panel -> Cmd Msg -> Maybe String -> ( App, Cmd Msg )
closing app panel cmd given =
    case given of
        Just link ->
            let
                ( unit, more ) =
                    Model.update (Model.LinkChanged (Transport.parseLink link)) app.unit
            in
            ( { app | panel = NoPanel, unit = unit, page = EnginePage.follow unit app.page }, Cmd.batch [ cmd, Cmd.map Unit more ] )

        Nothing ->
            ( { app | panel = panel }, cmd )


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
    case ( app.panel, app.offer ) of
        ( UpdatePanel updating, _ ) ->
            Update.View.view (EnginePage.PageMsg >> Page) Updating app.page.page updating

        ( TapePanel taping, _ ) ->
            Tape.View.view (EnginePage.PageMsg >> Page) Taping app.page.page taping

        ( NoPanel, Offered offered ) ->
            div []
                [ div [ class "ui offerbar" ]
                    [ p [] [ text ("Chimera " ++ number offered.latest ++ " is available. You're running " ++ number offered.have ++ ". Update now?") ]
                    , div [ class "connect" ]
                        [ button [ class "hbtn", onClick UpdateNow ] [ text "UPDATE" ]
                        , button [ class "hbtn", onClick NotNow ] [ text "NOT NOW" ]
                        ]
                    ]
                , Html.map Page (EnginePage.view app.unit app.page)
                ]

        ( NoPanel, _ ) ->
            Html.map Page (EnginePage.view app.unit app.page)


{-| The firmware the followed unit runs, as `ed hello` named it (`0.4.0-de07edf9`), once it is followed.
-}
firmware : Model.Model -> Maybe String
firmware unit =
    Model.status unit |> Maybe.andThen (\_ -> unit.firmware)


{-| A version's number: `0.4.1` of `0.4.1 abcd1234` or `0.4.1-abcd1234`.
-}
number : String -> String
number version =
    String.replace "-" " " version |> String.words |> List.head |> Maybe.withDefault version
