-- SPDX-License-Identifier: GPL-3.0-or-later


module Main exposing (main)

{-| The Chimera site: the guides and releases of chimera-releases, and a
door to the browser editor.
-}

import Anchor exposing (AnchorId)
import AssetPath
import Browser
import Browser.Dom as Dom
import Browser.Navigation as Nav
import ByteSize
import Doc exposing (Doc(..))
import Docs exposing (Docs)
import Features
import Guide
import GuideId exposing (GuideId)
import Href exposing (Href)
import Html exposing (Html)
import Html.Attributes as Attr
import Html.Events as Events
import Http
import Json.Encode
import Menu
import Release exposing (Asset, Release, Stage(..))
import Remote exposing (Remote(..))
import Route exposing (Base, Route(..))
import Sign
import Task
import Time
import Url exposing (Url)
import Version


type alias Flags =
    { base : String }


type alias Model =
    { key : Nav.Key
    , base : Base
    , route : Route
    , fragment : Maybe AnchorId
    , docs : Docs
    , releases : Remote Release.Releases
    }


type Msg
    = UrlRequested Browser.UrlRequest
    | UrlChanged Url
    | GotDoc Doc (Result Http.Error String)
    | GotReleases (Result Http.Error Release.Releases)
    | Retry Doc
    | Settled


{-| How a page was reached: the first load leaves focus and scroll to the
browser; a link moves focus to the page and scrolls.
-}
type Arrival
    = FirstLoad
    | Navigated


main : Program Flags Model Msg
main =
    Browser.application
        { init = init
        , view = view
        , update = update
        , subscriptions = \_ -> Sub.none
        , onUrlRequest = UrlRequested
        , onUrlChange = UrlChanged
        }


init : Flags -> Url -> Nav.Key -> ( Model, Cmd Msg )
init flags url key =
    let
        ( model, cmd ) =
            arrive FirstLoad
                url
                { key = key
                , base = Route.base flags.base
                , route = NotFound
                , fragment = Nothing
                , docs = Docs.empty
                , releases = Loading
                }
    in
    ( model
    , Cmd.batch
        [ cmd
        , Http.get
            { url = "https://api.github.com/repos/joegiralt/chimera-releases/releases"
            , expect = Http.expectJson GotReleases Release.listDecoder
            }
        ]
    )



-- UPDATE


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UrlRequested (Browser.Internal url) ->
            if Route.parse model.base url == NotFound then
                -- The editor and the guides' files are the server's.
                ( model, Nav.load (Url.toString url) )

            else
                ( model, Nav.pushUrl model.key (Url.toString url) )

        UrlRequested (Browser.External address) ->
            ( model, Nav.load address )

        UrlChanged url ->
            arrive Navigated url model

        GotDoc doc result ->
            if Route.doc model.route == Just doc then
                ( { model | docs = Docs.set doc (Just (fromResult (Result.map Guide.parse result))) model.docs }
                , model.fragment |> Maybe.map scrollTo |> Maybe.withDefault Cmd.none
                )

            else
                -- Left behind: fetched again if it is shown again.
                ( { model | docs = Docs.set doc Nothing model.docs }, Cmd.none )

        GotReleases result ->
            ( { model | releases = fromResult result }
            , case ( model.route, model.fragment ) of
                ( Releases, Just id ) ->
                    scrollTo id

                _ ->
                    Cmd.none
            )

        Retry doc ->
            let
                ( docs, fetch ) =
                    fetchDoc model.base doc model.docs
            in
            ( { model | docs = docs }, fetch )

        Settled ->
            ( model, Cmd.none )


{-| A new address: its page, its doc fetched if never requested, and for
a link, focus on the page and the scroll (to `#…`, else the top).
-}
arrive : Arrival -> Url -> Model -> ( Model, Cmd Msg )
arrive arrival url model =
    let
        route : Route
        route =
            Route.parse model.base url
                |> (\parsed ->
                        if Menu.shows Features.editor parsed then
                            parsed

                        else
                            NotFound
                   )

        fragment : Maybe AnchorId
        fragment =
            Maybe.map Anchor.fromFragment url.fragment

        ( docs, fetch ) =
            Route.doc route
                |> Maybe.map (\doc -> fetchDoc model.base doc model.docs)
                |> Maybe.withDefault ( model.docs, Cmd.none )

        settle : Cmd Msg
        settle =
            case arrival of
                FirstLoad ->
                    Cmd.none

                Navigated ->
                    Dom.focus "content"
                        |> Task.onError (\_ -> Task.succeed ())
                        |> Task.andThen (\_ -> fragment |> Maybe.map scrollTask |> Maybe.withDefault (Dom.setViewport 0 0))
                        |> Task.attempt (\_ -> Settled)
    in
    ( { model | route = route, fragment = fragment, docs = docs }
    , Cmd.batch [ fetch, settle ]
    )


{-| Fetch a doc never requested or failed; leave one loading or loaded.
-}
fetchDoc : Base -> Doc -> Docs -> ( Docs, Cmd Msg )
fetchDoc base doc docs =
    if Docs.needsFetch doc docs then
        ( Docs.set doc (Just Loading) docs
        , Http.get
            { url = Href.toString (Route.asset base (AssetPath.doc doc))
            , expect = Http.expectString (GotDoc doc)
            }
        )

    else
        ( docs, Cmd.none )


scrollTask : AnchorId -> Task.Task Dom.Error ()
scrollTask id =
    Dom.getElement (Anchor.toString id)
        |> Task.andThen (\e -> Dom.setViewport 0 (e.element.y - 16))


scrollTo : AnchorId -> Cmd Msg
scrollTo id =
    Task.attempt (\_ -> Settled) (scrollTask id)


fromResult : Result Http.Error a -> Remote a
fromResult result =
    case result of
        Ok a ->
            Loaded a

        Err e ->
            Failed e



-- VIEW


view : Model -> Browser.Document Msg
view model =
    { title = title model.route
    , body =
        [ Html.a [ Attr.class "skip", Attr.href "#content" ] [ Html.text "Skip to the page" ]
        , header model
        , Html.main_ [ Attr.id "content", Attr.tabindex -1, Attr.class (pageClass model.route) ] (page model)
        , footer model.base
        ]
    }


href : Href -> Html.Attribute msg
href =
    Href.toString >> Attr.href


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


pageClass : Route -> String
pageClass route =
    case route of
        Home ->
            "home"

        Install ->
            "install"

        Guides ->
            "page"

        Guide _ ->
            "page"

        Releases ->
            "page"

        Editor ->
            "page"

        NotFound ->
            "page"


{-| The navigation entry a page sits under.
-}
section : Route -> Maybe Route
section route =
    case route of
        Home ->
            Nothing

        Install ->
            Just Install

        Guides ->
            Just Guides

        Guide _ ->
            Just Guides

        Releases ->
            Just Releases

        Editor ->
            Just Editor

        NotFound ->
            Nothing


header : Model -> Html Msg
header model =
    Html.header [ Attr.class "top" ]
        [ Html.a [ Attr.class "mark", href (Route.href model.base Home) ]
            [ Html.span [ Attr.class "tile" ] [ Sign.view ], Html.text "CHIMERA" ]
        , Html.nav []
            (List.map (navLink model) (Menu.nav Features.editor))
        ]


navLink : Model -> { route : Route, label : String } -> Html Msg
navLink model { route, label } =
    Html.a
        [ href (Route.href model.base route)
        , Attr.classList [ ( "here", section model.route == Just route ) ]
        ]
        [ Html.text label ]


footer : Base -> Html Msg
footer base =
    Html.footer []
        [ Html.p []
            [ Html.text "Chimera is alternative firmware for the PreenFM3. The guides are kept in "
            , Html.a [ href (Href.repo []) ] [ Html.text "chimera-releases" ]
            , Html.text " on GitHub. "
            , Html.a [ href (Route.href base (Guide GuideId.Licensing)) ] [ Html.text "Licensing (GPL)" ]
            , Html.text " · "
            , Html.a [ href (Route.href base (Guide GuideId.License)) ] [ Html.text "Tester licence" ]
            , Html.text " (before 0.4)."
            ]
        ]


page : Model -> List (Html Msg)
page model =
    case model.route of
        Home ->
            home model

        Install ->
            install model

        Guides ->
            guides model.base

        Guide id ->
            [ Html.article [ Attr.class "doc" ] (docView model (GuideDoc id))
            , Html.p [ Attr.class "source" ]
                [ Html.a [ href (sourceOf (GuideDoc id)) ] [ Html.text ("READ " ++ GuideId.file id ++ " ON GITHUB") ] ]
            ]

        Releases ->
            releases model

        Editor ->
            editor model.base

        NotFound ->
            [ Html.h1 [] [ Html.text "Nothing here" ]
            , Html.p []
                [ Html.text "No page at this address. "
                , Html.a [ href (Route.href model.base Home) ] [ Html.text "Back to the start" ]
                , Html.text "."
                ]
            ]


sourceOf : Doc -> Href
sourceOf doc =
    Href.repo [ "blob", "main", Doc.file doc ]


githubReleases : Href
githubReleases =
    Href.repo [ "releases" ]


docView : Model -> Doc -> List (Html Msg)
docView model doc =
    case Docs.get doc model.docs of
        Nothing ->
            loading

        Just Loading ->
            loading

        Just (Loaded (Ok blocks)) ->
            Guide.view model.base blocks

        Just (Loaded (Err _)) ->
            unavailable "" Nothing (sourceOf doc) (Doc.file doc)

        Just (Failed e) ->
            unavailable (problem e) (Just (Retry doc)) (sourceOf doc) (Doc.file doc)


loading : List (Html msg)
loading =
    [ Html.p [ Attr.class "quiet" ] [ Html.text "Loading…" ] ]


unavailable : String -> Maybe Msg -> Href -> String -> List (Html Msg)
unavailable why retry link name =
    [ Html.p [ Attr.class "problem" ]
        ([ Html.text ("This couldn't be loaded here" ++ why ++ ". ")
         , Html.a [ href link ] [ Html.text ("Read " ++ name ++ " on GitHub") ]
         , Html.text "."
         ]
            ++ (case retry of
                    Just msg ->
                        [ Html.button [ Attr.class "retry", Events.onClick msg ] [ Html.text "TRY AGAIN" ] ]

                    Nothing ->
                        []
               )
        )
    ]


home : Model -> List (Html Msg)
home model =
    [ Html.section [ Attr.class "hero" ]
        [ Html.span [ Attr.class "tile big" ] [ Sign.view ]
        , Html.div []
            [ Html.h1 [] [ Html.text "Chimera" ]
            , Html.p [ Attr.class "lede" ]
                [ Html.text "Alternative firmware for the PreenFM3 synthesizer: new sound engines, effects and sequencing, on the hardware you already have." ]
            , Html.p []
                [ Html.text "It installs from the PreenFM3's own SD card, and you can switch back to the original firmware. Chimera is in alpha: some features aren't finished, and you may run into bugs." ]
            , current model
            ]
        ]
    , Html.ul [ Attr.class "doors" ]
        (List.map (door model.base) (Menu.doors Features.editor))
    ]


current : Model -> Html Msg
current model =
    case model.releases of
        Loaded list ->
            case Release.current list of
                Release.Current r ->
                    currentLine model.base r

                Release.NewerSkipped r ->
                    Html.div []
                        [ currentLine model.base r
                        , Html.p [ Attr.class "problem" ] newerSkipped
                        ]

                Release.NoneReadable ->
                    Html.p [ Attr.class "problem" ] noneReadable

                Release.NoRelease ->
                    Html.text ""

        Loading ->
            Html.text ""

        Failed _ ->
            Html.text ""


currentLine : Base -> Release -> Html Msg
currentLine base r =
    Html.p [ Attr.class "current" ]
        [ Html.span [ Attr.class "label" ] [ Html.text "CURRENT RELEASE" ]
        , Html.a [ href (Route.href base Install) ] [ Html.text (Version.toString r.version) ]
        , Html.span [ Attr.class "quiet" ] [ Html.text (day r.published) ]
        ]


{-| A release that couldn't be read here may be newer than the one shown.
-}
newerSkipped : List (Html Msg)
newerSkipped =
    [ Html.text "A newer release may be out that this site couldn't read: check "
    , Html.a [ href githubReleases ] [ Html.text "the releases on GitHub" ]
    , Html.text " before you download."
    ]


noneReadable : List (Html Msg)
noneReadable =
    [ Html.text "The releases couldn't be read here: download from "
    , Html.a [ href githubReleases ] [ Html.text "the releases on GitHub" ]
    , Html.text "."
    ]


door : Base -> { route : Route, label : String, text : String } -> Html Msg
door base { route, label, text } =
    Html.li []
        [ Html.a [ href (Route.href base route) ]
            [ Html.span [ Attr.class "label" ] [ Html.text label ]
            , Html.span [] [ Html.text text ]
            ]
        ]


install : Model -> List (Html Msg)
install model =
    [ Html.aside [ Attr.class "downloads" ] (downloads model)
    , Html.article [ Attr.class "doc" ] (fromZeroThree ++ Html.hr [] [] :: docView model Readme)
    ]


{-| 0.3 to 0.4 with `chimera-usb.py update` (owner, 2026-11-22), for a Mac
user who has never opened Terminal.
-}
fromZeroThree : List (Html Msg)
fromZeroThree =
    let
        command : String -> Html Msg
        command line =
            Html.pre [] [ Html.code [] [ Html.text line ] ]

        file : String -> Html Msg
        file name =
            Html.code [] [ Html.text name ]

        bold : String -> Html Msg
        bold words =
            Html.strong [] [ Html.text words ]
    in
    [ Html.h2 [] [ Html.text "Updating from 0.3 to 0.4 on a Mac" ]
    , Html.p []
        [ Html.text "A PreenFM3 running Chimera 0.3 updates to 0.4 with Chimera's update tool, "
        , file "chimera-usb.py"
        , Html.text ", over the USB cable. You type two commands in Terminal, the Mac's command window, and the tool does the rest: it puts both halves of the firmware on the unit, and you see one install screen. The tool runs on macOS and Linux; on Windows, use the card steps under Installing Chimera below."
        ]
    , Html.h3 [] [ Html.text "You'll need" ]
    , Html.ul []
        [ Html.li [] [ Html.text "Your PreenFM3, running Chimera 0.3." ]
        , Html.li [] [ Html.text "A USB cable that carries data (some only charge)." ]
        , Html.li [] [ Html.text "Three files from the 0.4 release: ", file "CHIMERA.BIN", Html.text ", ", file "CHIMERA.BK2", Html.text " and ", file "chimera-usb.py", Html.text ". Save them in your Downloads folder and keep their names exactly as they are." ]
        ]
    , Html.h3 [] [ Html.text "Once: open Terminal and add two helpers" ]
    , Html.ol []
        [ Html.li []
            [ Html.text "Open Terminal: press "
            , bold "Command + Space"
            , Html.text ", type "
            , bold "Terminal"
            , Html.text " and press "
            , bold "Return"
            , Html.text ". A window opens with a line ending in "
            , file "%"
            , Html.text " or "
            , file "$"
            , Html.text ". Each command below is typed (or pasted) on that line exactly as shown, then run with Return. When the line comes back, the command has finished."
            ]
        , Html.li []
            [ Html.text "If you don't have Homebrew yet, install it with the one command shown on "
            , Html.a [ href Href.homebrew ] [ Html.text "brew.sh" ]
            , Html.text ". When it asks for your password, type your Mac's password: nothing shows as you type, which is normal. Then press Return."
            ]
        , Html.li []
            [ Html.text "Install dfu-util, which the tool uses to write the firmware:"
            , command "brew install dfu-util"
            ]
        , Html.li []
            [ Html.text "Install pyserial, which the tool uses to find the PreenFM3:"
            , command "python3 -m pip install --user pyserial"
            , Html.text "If the Mac offers to install the command line developer tools, press Install, wait for it to finish, and run the command again."
            ]
        ]
    , Html.h3 [] [ Html.text "The update" ]
    , Html.ol []
        [ Html.li [] [ Html.text "Save your project on the PreenFM3. The tool won't start while the project has unsaved changes: it says so and changes nothing." ]
        , Html.li [] [ Html.text "Connect the PreenFM3 to the Mac with the USB cable and turn it on as usual, so it plays Chimera (not the bootloader screen)." ]
        , Html.li []
            [ Html.text "In Terminal, go to your Downloads folder:"
            , command "cd ~/Downloads"
            ]
        , Html.li []
            [ Html.text "Run the update:"
            , command "python3 chimera-usb.py update CHIMERA.BIN CHIMERA.BK2"
            ]
        , Html.li []
            [ Html.text "Wait. The tool checks both files first, then writes the firmware. The PreenFM3 restarts and shows "
            , bold "DON'T POWER OFF"
            , Html.text " while it installs the second half. Leave the cable in, the power on and the Terminal window open until Terminal prints "
            , file "OK updated"
            , Html.text " and the version. That can take a few minutes."
            ]
        ]
    , Html.p []
        [ Html.text "That's the update. The tool updates the firmware only: to add 0.4's factory Sounds, copy "
        , file "factory-v1.zip"
        , Html.text "'s folders onto the card as in Step 3 below."
        ]
    , Html.h3 [] [ Html.text "If it stops" ]
    , Html.ul []
        [ Html.li [] [ Html.text "Before the PreenFM3 restarts, nothing on the unit has changed. Read the tool's last line, fix what it names (an unsaved project, a missing file, the cable), and run the update again." ]
        , Html.li [] [ Html.text "After the restart, the bootloader is untouched: Chimera never writes it. Turn the PreenFM3 off, hold MENU while you turn it on, and install 0.4 with the card steps below." ]
        ]
    , Html.h3 [] [ Html.text "The bootloader" ]
    , Html.p []
        [ Html.text "Chimera runs on the stock PreenFM3 bootloader 1.09, which a unit running 0.3 already has. The bootloader is Ixox's: if you ever need it, "
        , file "p3_boot_1_09.bin"
        , Html.text " is inside "
        , file "pfm3_firmware_1_03.zip"
        , Html.text " on "
        , Html.a [ href Href.stockBootloader ] [ Html.text "the PreenFM3 v1.03 release" ]
        , Html.text ", with Ixox's instructions."
        ]
    ]


downloads : Model -> List (Html Msg)
downloads model =
    let
        toGithub : Html Msg
        toGithub =
            Html.a [ href githubReleases ] [ Html.text "the releases on GitHub" ]
    in
    Html.h2 [ Attr.class "label" ] [ Html.text "LATEST RELEASE" ]
        :: (case model.releases of
                Loading ->
                    loading

                Failed e ->
                    [ Html.p [] [ Html.text ("The releases couldn't be loaded here" ++ problem e ++ ". Download from "), toGithub, Html.text "." ] ]

                Loaded list ->
                    case Release.current list of
                        Release.Current r ->
                            offer model.base r

                        Release.NewerSkipped r ->
                            Html.p [ Attr.class "problem" ] newerSkipped :: offer model.base r

                        Release.NoneReadable ->
                            [ Html.p [] noneReadable ]

                        Release.NoRelease ->
                            [ Html.p [] [ Html.text "No release yet. See ", toGithub, Html.text "." ] ]
           )


offer : Base -> Release -> List (Html Msg)
offer base r =
    [ Html.p [ Attr.class "version" ]
        [ Html.text (Version.toString r.version)
        , Html.span [ Attr.class "quiet" ] [ Html.text (day r.published) ]
        ]
    , assets r
    , Html.p [ Attr.class "quiet" ]
        [ Html.a [ href (Href.withFragment (Anchor.release r.version) (Route.href base Releases)) ] [ Html.text "Release notes" ]
        , Html.text " · "
        , Html.a [ href r.page ] [ Html.text "on GitHub" ]
        ]
    ]


assets : Release -> Html Msg
assets r =
    Html.div []
        ((if List.isEmpty r.assets && r.unreadableFiles == 0 then
            Html.p [ Attr.class "quiet" ] [ Html.text "No files are attached to this release." ]

          else
            Html.ul [ Attr.class "assets" ] (List.map asset r.assets)
         )
            :: (if r.unreadableFiles > 0 then
                    [ Html.p [ Attr.class "problem" ]
                        [ Html.text (String.fromInt r.unreadableFiles ++ " of its files couldn't be read here: see ")
                        , Html.a [ href r.page ] [ Html.text "this release on GitHub" ]
                        , Html.text "."
                        ]
                    ]

                else
                    []
               )
        )


asset : Asset -> Html Msg
asset a =
    Html.li []
        [ Html.a [ Attr.class "button", href a.url ]
            [ Html.span [ Attr.class "label" ] [ Html.text (Release.kindLabel a.kind) ]
            , Html.span [ Attr.class "file" ] [ Html.text a.name ]
            , Html.span [ Attr.class "size" ] [ Html.text (ByteSize.toString a.size) ]
            ]
        ]


guides : Base -> List (Html Msg)
guides base =
    [ Html.h1 [] [ Html.text "Guides" ]
    , Html.p [ Attr.class "lede" ]
        [ Html.text "Each guide describes Chimera as it is now. To install or update, start with "
        , Html.a [ href (Route.href base Install) ] [ Html.text "Install & update" ]
        , Html.text "."
        ]
    , Html.ul [ Attr.class "doors" ]
        (List.map
            (\id ->
                Html.li []
                    [ Html.a [ href (Route.href base (Guide id)) ]
                        [ Html.span [ Attr.class "label" ] [ Html.text (String.toUpper (GuideId.title id)) ]
                        , Html.span [] [ Html.text (summary id) ]
                        ]
                    ]
            )
            GuideId.all
        )
    ]


summary : GuideId -> String
summary id =
    case id of
        GuideId.GettingStarted ->
            "A short tour once Chimera boots: the first five minutes, getting around, Parts and engines."

        GuideId.QuickStart ->
            "The screen, the controls and every page, with annotated screenshots."

        GuideId.Faq ->
            "Short answers to \"how do I…\"."

        GuideId.Midi ->
            "Controllers, keyboards and sequencers over DIN and USB: learn, MPE, controller maps."

        GuideId.Nrpn ->
            "Every cell's fixed NRPN address, for sequencer instrument definitions."

        GuideId.Tuning ->
            "A tuning per Part: temperaments, Scala files and MIDI Tuning Standard."

        GuideId.KnownIssues ->
            "Check here before filing a bug."

        GuideId.License ->
            "The terms for testers, for releases before 0.4."

        GuideId.Licensing ->
            "GPL-3.0-or-later from 0.4: the editor, its kit, the site and the firmware source."


{-| Whether a release's notes start open.
-}
type Notes
    = Open
    | Folded


releases : Model -> List (Html Msg)
releases model =
    Html.h1 [] [ Html.text "Releases" ]
        :: (case model.releases of
                Loading ->
                    loading

                Failed e ->
                    unavailable (problem e) Nothing githubReleases "the releases"

                Loaded list ->
                    let
                        sorted : List Release
                        sorted =
                            List.sortWith (\a b -> Version.compare b.version a.version) list.releases

                        ids : List AnchorId
                        ids =
                            Anchor.unique (List.map (.version >> Anchor.release) sorted)

                        shown : List (Html Msg)
                        shown =
                            case List.map2 Tuple.pair ids sorted of
                                first :: rest ->
                                    releaseView model.base Open first :: List.map (releaseView model.base Folded) rest

                                [] ->
                                    [ Html.p [] [ Html.text "No release yet." ] ]
                    in
                    shown ++ skipped list
           )


{-| Releases the site couldn't read are on GitHub.
-}
skipped : Release.Releases -> List (Html Msg)
skipped list =
    if List.isEmpty list.skipped then
        []

    else
        [ Html.p [ Attr.class "problem" ]
            [ Html.text
                (String.fromInt (List.length list.skipped)
                    ++ (if List.length list.skipped == 1 then
                            " release couldn't be read here: see "

                        else
                            " releases couldn't be read here: see "
                       )
                )
            , Html.a [ href githubReleases ] [ Html.text "the releases on GitHub" ]
            , Html.text "."
            ]
        ]


releaseView : Base -> Notes -> ( AnchorId, Release ) -> Html Msg
releaseView base notes ( id, r ) =
    Html.section [ Attr.class "release", Attr.id (Anchor.toString id) ]
        [ Html.h2 []
            (Html.text (Maybe.withDefault ("Chimera " ++ Version.toString r.version) r.name)
                :: (case r.stage of
                        Prerelease ->
                            [ Html.span [ Attr.class "label stage" ] [ Html.text "PRERELEASE" ] ]

                        Stable ->
                            []
                   )
                ++ [ Html.span [ Attr.class "quiet" ] [ Html.text (day r.published) ] ]
            )
        , assets r
        , Html.details [ Attr.class "notes", Attr.property "open" (boolProperty (notes == Open)) ]
            [ Html.summary [] [ Html.text "RELEASE NOTES" ]
            , Html.div [ Attr.class "doc" ]
                (case Guide.parse r.notes of
                    Ok blocks ->
                        Guide.view base blocks

                    Err _ ->
                        [ Html.pre [] [ Html.text r.notes ] ]
                )
            ]
        ]


boolProperty : Bool -> Json.Encode.Value
boolProperty =
    Json.Encode.bool


editor : Base -> List (Html Msg)
editor base =
    [ Html.h1 [] [ Html.text "Editor" ]
    , Html.p [ Attr.class "lede" ]
        [ Html.text "A sound editor that runs in your browser and talks to Chimera over the USB cable. It shows the Sound on the unit's current Part on one screen; turn a control in the editor and the unit follows, turn a knob on the unit and the editor follows." ]
    , Html.p []
        [ Html.text "It edits the current Part's Sound on every engine, and reaches the mixer, the mod matrix, MIDI MAP, ORBIT and the settings. It needs Chimera 0.4 or later on the unit: when the unit's firmware is older, the editor says "
        , Html.span [ Attr.class "label" ] [ Html.text "THIS EDITOR NEEDS CHIMERA 0.4 OR LATER" ]
        , Html.text ", names the version the unit runs, and links the releases page."
        ]
    , Html.h2 [] [ Html.text "What you need" ]
    , Html.ul []
        [ Html.li [] [ Html.text "Chrome, Edge or another Chromium browser on a computer. The editor reaches the unit through Web Serial, which Safari, Firefox and phones don't have." ]
        , Html.li [] [ Html.text "The PreenFM3 running Chimera, connected with a USB cable." ]
        ]
    , Html.h2 [] [ Html.text "Connecting" ]
    , Html.ol []
        [ Html.li [] [ Html.text "Open the editor and press ", Html.span [ Attr.class "label" ] [ Html.text "CONNECT UNIT" ], Html.text "." ]
        , Html.li [] [ Html.text "The browser asks which device to use: pick the PreenFM3 and press Connect." ]
        ]
    , Html.p []
        [ Html.a [ Attr.class "button wide", href (Route.asset base AssetPath.editor) ]
            [ Html.span [ Attr.class "label" ] [ Html.text "OPEN THE EDITOR" ] ]
        ]
    , Html.p []
        [ Html.a [ href (Route.href base (Guide GuideId.Midi)) ] [ Html.text "MIDI control" ]
        , Html.text " covers playing and editing Chimera from a controller or sequencer."
        ]
    ]



-- FORMATS


{-| Why a fetch failed, as a clause: `(offline?)`.
-}
problem : Http.Error -> String
problem e =
    case e of
        Http.NetworkError ->
            " (offline?)"

        Http.Timeout ->
            " (it took too long)"

        Http.BadStatus 403 ->
            " (GitHub's hourly limit: try again later)"

        Http.BadStatus 404 ->
            " (not found)"

        Http.BadStatus code ->
            " (error " ++ String.fromInt code ++ ")"

        Http.BadBody _ ->
            " (an answer the site doesn't understand)"

        Http.BadUrl _ ->
            ""


day : Time.Posix -> String
day t =
    String.fromInt (Time.toDay Time.utc t)
        ++ " "
        ++ month (Time.toMonth Time.utc t)
        ++ " "
        ++ String.fromInt (Time.toYear Time.utc t)


month : Time.Month -> String
month m =
    case m of
        Time.Jan ->
            "January"

        Time.Feb ->
            "February"

        Time.Mar ->
            "March"

        Time.Apr ->
            "April"

        Time.May ->
            "May"

        Time.Jun ->
            "June"

        Time.Jul ->
            "July"

        Time.Aug ->
            "August"

        Time.Sep ->
            "September"

        Time.Oct ->
            "October"

        Time.Nov ->
            "November"

        Time.Dec ->
            "December"
