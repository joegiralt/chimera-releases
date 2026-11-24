-- SPDX-License-Identifier: GPL-3.0-or-later


module View.EnginePage exposing (BayId(..), Layout, Msg(..), Showing(..), State, follow, framed, init, layout, mixerGlyph, other, partBay, screenSpec, subscriptions, update, view)

{-| An engine's page: the unit's schema, placed by the engine's layout,
read from `Model`, drawn with the Ui components. What the unit describes and
the layout doesn't place is shown in OTHER, never hidden.

A hand never changes a value here: it asks for edits, at most one `ed set`
a frame for each control. Every control shows the unit's stored value, and a
refusal with the unit's reason; nothing is guessed.

-}

import Addr exposing (Addr, PadBlock(..))
import Browser.Events
import Dict exposing (Dict)
import Html exposing (Html, a, button, div, p, text)
import Html.Attributes exposing (attribute, class, classList, href, rel)
import Html.Events exposing (onClick)
import Layout.Algo
import Layout.Drum
import Layout.Mixer as Mixer
import Layout.Modal
import Layout.Page as UnitPage exposing (PadScoped(..), ScopedPage(..), UnitPage(..))
import Layout.Shared as Shared exposing (As(..), Extra(..), Item, Module, Placement(..))
import Layout.Tape
import Layout.Va
import Model exposing (Model, Seat)
import Protocol exposing (Kind(..), OptIndex, PageNo, Scale(..), Value(..))
import Schema exposing (Param, Schema)
import Set exposing (Set)
import Transport
import Ui.Chip as Chip
import Ui.Control as Control exposing (Chosen, Intent(..), Reading, Target(..), Want(..))
import Ui.Fader as Fader
import Ui.Knob as Knob
import Ui.Menu as Menu
import Ui.Module as Module
import Ui.Pad as Pad exposing (Pad)
import Ui.PadStrip as PadStrip exposing (Tab(..))
import Ui.Page as Page exposing (Current(..), Effect(..))
import Ui.PatchBay as PatchBay
import Ui.Routes as Routes exposing (Dest, Source)
import Ui.Screen as Screen
import Ui.Selector as Selector
import Ui.Toggle as Toggle
import Ui.Tokens exposing (Theme)
import Unit exposing (Engine(..), Part)



-- STATE


{-| A patch bay on the page: the Part's mod matrix, or a DRUM pad's routes.
-}
type BayId
    = PartBay
    | PadBay Pad


type alias State =
    { page : Page.State
    , drag : Control.Drag
    , wanted : Control.Wanted

    -- This frame's last amount for each of the Part's routes a hand moved,
    -- by its cell, −127..127.
    , routeWanted : Dict String ( Protocol.Cell, Int )
    , menu : Menu.State
    , bays : Dict String ( BayId, PatchBay.Bay )
    , tab : Tab
    , seat : Maybe Seat

    -- The page shown: the followed Part's engine, or one of the unit's own.
    , showing : Showing

    -- The MIXER's effect tab (its block, `DELAY`); none picked: the first.
    , fx : Maybe String
    }


type Msg
    = Hand Control.Msg
    | MenuMsg Menu.Msg
    | PageMsg Page.Msg
    | BayMsg BayId PatchBay.Msg
    | PadMsg PadStrip.Msg
    | Frame
    | Unit Model.Msg
      -- A UNIT tab: the unit's own page.
    | Show Showing
      -- A Part's tab: that Part's engine, the box following it.
    | GoPart Part
      -- The MIXER's effect tab, by its block (a send's click picks its effect's).
    | MixFx String


{-| What the page shows: the followed Part's engine page, or the unit's
MIXER (from its own `describe MIXER`).
-}
type Showing
    = EngineScreen
    | MixerScreen


init : Theme -> State
init t =
    { page = Page.init t
    , drag = Control.idle
    , wanted = Control.empty
    , routeWanted = Dict.empty
    , menu = Menu.shut
    , bays = Dict.empty
    , tab = Kit
    , seat = Nothing
    , showing = EngineScreen
    , fx = Nothing
    }


subscriptions : State -> Sub Msg
subscriptions s =
    Sub.batch
        [ Sub.map Hand (Control.subscriptions s.drag)
        , if framed s then
            Browser.Events.onAnimationFrame (\_ -> Frame)

          else
            Sub.none
        , Sub.batch (List.map (\( id, bay ) -> Sub.map (BayMsg id) (PatchBay.subscriptions bay)) (Dict.values s.bays))
        ]


{-| Whether the page asks for the next animation frame: while a hand's
wants (a value's, or a route amount's) wait to be sent.
-}
framed : State -> Bool
framed s =
    not (Control.isEmpty s.wanted && Dict.isEmpty s.routeWanted)


{-| The page follows the box: when the box takes another Part (a new
seat), a hand on a control lets go and its unsent wants are dropped, so
nothing meant for the old Part reaches the new one.
-}
follow : Model -> State -> State
follow m s =
    if s.seat == Just (Model.seat m) then
        s

    else
        { s | drag = Control.idle, wanted = Control.empty, routeWanted = Dict.empty, menu = Menu.shut, seat = Just (Model.seat m) }



-- THE LAYOUT


{-| The modules a view shows, and every module of every view (an address
placed in any of them is not OTHER's).
-}
type alias Layout =
    { shown : List Module, every : List Module }


layout : Engine -> Tab -> Layout
layout e tab =
    let
        one : List Module -> Layout
        one ms =
            { shown = ms, every = ms }
    in
    case e of
        Algo ->
            one Layout.Algo.modules

        Va ->
            one Layout.Va.modules

        Modal ->
            one Layout.Modal.modules

        Tape ->
            one Layout.Tape.modules

        Drum ->
            { shown =
                case tab of
                    Kit ->
                        Layout.Drum.kit

                    PadTab p ->
                        Layout.Drum.pad p
            , every = Layout.Drum.every
            }


{-| The Sound's items no module of the layout places.
-}
other : List Item -> List Module -> List Item
other items every =
    let
        placed : Item -> Shared.Placement
        placed =
            Shared.place every
    in
    List.filter
        (\i ->
            case placed i of
                Placed _ ->
                    False

                Unplaced ->
                    True
        )
        items



-- WHAT A HAND DOES


update : Msg -> Model -> State -> ( State, List Model.Msg, Maybe Theme )
update msg m s0 =
    let
        s : State
        s =
            follow m s0
    in
    case msg of
        Hand h ->
            hand m h s |> (\( st, asks ) -> ( st, asks, Nothing ))

        MenuMsg mm ->
            let
                ( menu, picked ) =
                    Menu.update mm

                shut : State
                shut =
                    { s | menu = menu }
            in
            picked |> Maybe.map (\h -> hand m h shut) |> Maybe.withDefault ( shut, [] ) |> (\( st, asks ) -> ( st, asks, Nothing ))

        PageMsg pm ->
            let
                ( page, effect ) =
                    Page.update pm s.page
            in
            ( { s | page = page }
            , []
            , case effect of
                StoreTheme t ->
                    Just t

                NoEffect ->
                    Nothing
            )

        BayMsg id bm ->
            let
                ( bay, effects ) =
                    PatchBay.update bm (bayOf id s)
            in
            List.foldl (\e ( st, asks ) -> bayEffect m id e st |> Tuple.mapSecond ((++) asks)) ( { s | bays = Dict.insert (bayKey id) ( id, bay ) s.bays }, [] ) effects
                |> (\( st, asks ) -> ( st, asks, Nothing ))

        PadMsg (PadStrip.Select t) ->
            ( { s | tab = t }, [], Nothing )

        Frame ->
            let
                ( wants, rest ) =
                    Control.flush s.wanted
            in
            ( { s | wanted = rest, routeWanted = Dict.empty }
            , List.map
                (\( a, w ) ->
                    case w of
                        Number v ->
                            Model.Edit a (Num v)

                        Option i ->
                            Model.Pick a i
                )
                wants
                ++ List.filterMap (\( c, n ) -> Protocol.amount n |> Maybe.map (Model.EditRoute c << Protocol.RouteAmount)) (Dict.values s.routeWanted)
            , Nothing
            )

        Unit um ->
            ( s, [ um ], Nothing )

        Show v ->
            ( { s | showing = v }, [], Nothing )

        GoPart p ->
            ( { s | showing = EngineScreen }, [ Model.FollowPart p ], Nothing )

        MixFx k ->
            ( { s | fx = Just k }, [], Nothing )


bayKey : BayId -> String
bayKey id =
    case id of
        PartBay ->
            "MOD"

        PadBay p ->
            "PAD" ++ String.fromInt (Pad.number p)


bayOf : BayId -> State -> PatchBay.Bay
bayOf id s =
    Dict.get (bayKey id) s.bays |> Maybe.map Tuple.second |> Maybe.withDefault PatchBay.init


{-| A hand on a bay. The Part's patches its matrix (`ed route`): a new cable
at `newCable`, unpatching removes the route. A pad's patches its routes: a
new cable takes the first route with no amount (none left: a notice says so),
and unpatching sets the amount to nothing.
-}
bayEffect : Model -> BayId -> PatchBay.Effect -> State -> ( State, List Model.Msg )
bayEffect m id effect s =
    case ( id, effect ) of
        ( _, PatchBay.Handed h ) ->
            hand m h s

        ( PartBay, PatchBay.Patched from to ) ->
            if List.any (\c -> c.from == from && c.to == to) (Routes.cables (partBay m)) then
                ( s, [] )

            else
                ( s
                , Maybe.map2 (\c a -> [ Model.EditRoute c (Protocol.RouteAmount a) ])
                    (partCell m from to)
                    (Protocol.amount (round (toFloat (Routes.amountValue (Routes.amountFromNorm newCable)) * 127 / 100)))
                    |> Maybe.withDefault []
                )

        ( PartBay, PatchBay.Unpatched from to ) ->
            ( s, partCell m from to |> Maybe.map (\c -> [ Model.EditRoute c Protocol.RouteOff ]) |> Maybe.withDefault [] )

        ( PadBay p, PatchBay.Patched from to ) ->
            let
                routes : List RouteNow
                routes =
                    routesNow m p
            in
            if List.any (\r -> r.on && r.from == Just from && r.to == Just to) routes then
                ( s, [] )

            else
                case List.filter (.on >> not) routes |> List.head of
                    Just r ->
                        ( s
                            |> want r.route.source (Option (Routes.sourceOption from))
                            |> want r.route.dest (Option (Routes.destOption to))
                            |> (\st -> paramOf m r.route.amount |> Maybe.map (\ap -> want ap.addr (Number (Control.atNorm ap newCable)) st) |> Maybe.withDefault st)
                        , []
                        )

                    -- Every route in use: no cable, and the page says why.
                    Nothing ->
                        ( s, [ Model.Decline ("PAD " ++ Pad.label p ++ "'S " ++ String.fromInt (List.length routes) ++ " ROUTES ARE ALL IN USE: UNPATCH ONE FIRST") ] )

        ( PadBay p, PatchBay.Unpatched from to ) ->
            ( routesNow m p
                |> List.filter (\r -> r.on && r.from == Just from && r.to == Just to)
                |> List.foldl (\r -> want r.route.amount (Number 0)) s
            , []
            )


{-| Where a new cable's attenuverter starts: half way up.
-}
newCable : Float
newCable =
    0.75


{-| A pad route as the unit has it now: patched while its amount is not
nothing.
-}
type alias RouteNow =
    { route : Shared.Route, on : Bool, from : Maybe Source, to : Maybe Dest, amount : Maybe Param }


{-| The Part's mod matrix as the unit has it: the sources `describe MTX`
lists, its fixed columns then each other destination a route names, and a
cable for each route `since` reported. FM3 IN's and QM IN's jacks are FILTER
MOD's knobs, not the bay's.
-}
partBay : Model -> Routes.Routes
partBay m =
    let
        jacks : PartJacks
        jacks =
            partJacks m

        cable : ( String, String, Int ) -> Maybe Routes.Cable
        cable ( s, d, a ) =
            Maybe.map3
                (\from to key -> { from = from, to = to, amount = Routes.amount (round (toFloat a * 100 / 127)), addr = key })
                (lookup s jacks.sources)
                (lookup d jacks.dests)
                -- The cable's key: its cell, which reads as an address no
                -- param has, so a hand on its attenuverter moves nothing yet.
                (Addr.fromWire (s ++ ":" ++ d))
    in
    List.foldl Routes.add (Routes.new (List.map Tuple.second jacks.sources) (List.map Tuple.second jacks.dests)) (List.filterMap cable jacks.routed)


{-| The Part's bay's jacks, each by the unit's word for it (a source's
`LFO1`, a destination's address), and its routes as (source, destination,
amount −127..127).
-}
type alias PartJacks =
    { sources : List ( String, Routes.Source )
    , dests : List ( String, Routes.Dest )
    , routed : List ( String, String, Int )
    }


partJacks : Model -> PartJacks
partJacks m =
    let
        mtx : Schema.Matrix
        mtx =
            Schema.matrix m.matrix

        routed : List ( String, String, Int )
        routed =
            Dict.toList m.routes
                |> List.filterMap
                    (\( k, r ) ->
                        -- `<SRC>:<DEST>`; a jack's cell (FM3IN) has no colon.
                        String.indexes ":" k |> List.head |> Maybe.map (\i -> ( String.left i k, String.dropLeft (i + 1) k, r.amount ))
                    )

        fixed : List ( String, String )
        fixed =
            List.map (\( tag, a ) -> ( Addr.key a, tag )) mtx.cols

        named : List ( String, String )
        named =
            List.foldl
                (\( _, d, _ ) acc ->
                    if List.any (\( k, _ ) -> k == d) acc then
                        acc

                    else
                        acc ++ [ ( d, d ) ]
                )
                fixed
                routed

        indexed : (( OptIndex, String ) -> jack) -> List ( String, String ) -> List ( String, jack )
        indexed make =
            List.indexedMap (\i ( k, name ) -> Protocol.optIndex i |> Maybe.map (\ix -> ( k, make ( ix, name ) )))
                >> List.filterMap identity
    in
    { sources = indexed Routes.source mtx.sources
    , dests = indexed Routes.dest named
    , routed = routed
    }


lookup : String -> List ( String, a ) -> Maybe a
lookup k =
    List.filter (Tuple.first >> (==) k) >> List.head >> Maybe.map Tuple.second


{-| The unit's word for a jack of the Part's bay.
-}
wordOf : a -> List ( String, a ) -> Maybe String
wordOf jack =
    List.filter (Tuple.second >> (==) jack) >> List.head >> Maybe.map Tuple.first


{-| A patch between two of the Part's jacks: the route's cell.
-}
partCell : Model -> Routes.Source -> Routes.Dest -> Maybe Protocol.Cell
partCell m from to =
    let
        jacks : PartJacks
        jacks =
            partJacks m
    in
    Maybe.map2 (\s d -> s ++ ":" ++ d) (wordOf from jacks.sources) (wordOf to jacks.dests)
        |> Maybe.andThen Protocol.cell


routesNow : Model -> Pad -> List RouteNow
routesNow m p =
    List.map
        (\r ->
            let
                amount : Maybe Param
                amount =
                    paramOf m r.amount

                option : Addr -> Maybe ( OptIndex, String )
                option a =
                    paramOf m a |> Maybe.andThen (\q -> Control.current (chosen m q) |> Maybe.andThen (\i -> q.options |> List.filter (\( k, _ ) -> k == i) |> List.head))
            in
            { route = r
            , on = Maybe.map2 (\v ap -> abs v.stored >= ap.step / 2) (Model.shown r.amount m) amount |> Maybe.withDefault False
            , from = option r.source |> Maybe.map Routes.source
            , to = option r.dest |> Maybe.map Routes.dest
            , amount = amount
            }
        )
        (Shared.padRoutes p)


padBay : Model -> Pad -> Routes.Routes
padBay m p =
    let
        routes : List RouteNow
        routes =
            routesNow m p

        options : (Shared.Route -> Addr) -> List ( OptIndex, String )
        options f =
            routes |> List.head |> Maybe.andThen (\r -> paramOf m (f r.route)) |> Maybe.map .options |> Maybe.withDefault []
    in
    routes
        |> List.filterMap
            (\r ->
                case ( r.on, ( r.from, r.to ), Maybe.andThen (\ap -> Model.shown ap.addr m) r.amount ) of
                    ( True, ( Just from, Just to ), Just v ) ->
                        Just { from = from, to = to, amount = Routes.amountFromNorm v.norm, addr = r.route.amount }

                    _ ->
                        Nothing
            )
        |> List.foldl Routes.add (Routes.new (List.map Routes.source (options .source)) (List.map Routes.dest (options .dest)))


hand : Model -> Control.Msg -> State -> ( State, List Model.Msg )
hand m h s =
    let
        ( drag, intents ) =
            Control.update (target m s) h s.drag

        -- A hand on a control whose value went with the Part or Sound the
        -- box just took (read now) has nothing to turn from: said, not dropped.
        unread : List Model.Msg
        unread =
            case reached h of
                Just a ->
                    if Model.readingPage m && target m s a == Nothing then
                        [ Model.Decline ("THE TURN OF " ++ Addr.key a ++ " WAS NOT SENT: THE BOX TOOK ANOTHER PART OR SOUND, READ NOW") ]

                    else
                        []

                Nothing ->
                    []
    in
    ( List.foldl (intend m) { s | drag = drag } intents, unread )


{-| The control a hand reaches for, where it starts one.
-}
reached : Control.Msg -> Maybe Addr
reached h =
    case h of
        Control.Grab a _ _ ->
            Just a

        Control.Step a _ ->
            Just a

        Control.Pick a _ ->
            Just a

        Control.Reset a ->
            Just a

        Control.Moved _ ->
            Nothing

        Control.Released ->
            Nothing


{-| The param as the panels now showing describe it: the engine's, else
the MIXER's.
-}
paramOf : Model -> Addr -> Maybe Param
paramOf m a =
    case Schema.paramIn m.variants a m.schema of
        Just p ->
            Just p

        Nothing ->
            Schema.paramIn m.variants a m.mixer


isChoice : Param -> Bool
isChoice p =
    case p.kind of
        Cont ->
            False

        Stepped ->
            False

        Choice ->
            True

        Toggle ->
            True


{-| What a hand reaches: where the editor last asked the control to go and
the unit has not yet said (this frame's want, else one waiting for or on the
wire), else the unit's own value. So a wheel's notches faster than the
unit's answers each count. A control the unit has not reported cannot be
taken hold of.
-}
target : Model -> State -> Addr -> Maybe Target
target m s a =
    case partRoute m s a of
        Just ( _, n ) ->
            Just (Continuous { norm = normOfBox n, wheel = routeWheel })

        Nothing ->
            paramTarget m s a


{-| The Part's route a cable's key names (its cell, which the bay keys it
by), and its amount: where a hand last asked it to go and the unit has not
yet said (this frame's, else the window's), else the unit's.
-}
partRoute : Model -> State -> Addr -> Maybe ( Protocol.Cell, Int )
partRoute m s a =
    Maybe.map2 Tuple.pair (Protocol.cell (Addr.key a)) (Dict.get (Addr.key a) m.routes)
        |> Maybe.map
            (\( c, r ) ->
                case Dict.get (Addr.key a) s.routeWanted of
                    Just ( _, n ) ->
                        ( c, n )

                    Nothing ->
                        case Model.pendingRoute c m of
                            Just (Protocol.RouteAmount x) ->
                                ( c, Protocol.amountToInt x )

                            Just Protocol.RouteOff ->
                                ( c, r.amount )

                            Nothing ->
                                ( c, r.amount )
            )


{-| A route amount's place on its attenuverter, −127 at 0; and back.
-}
normOfBox : Int -> Float
normOfBox n =
    (toFloat n / 127 + 1) / 2


boxAt : Float -> Int
boxAt t =
    clamp -127 127 (round ((clamp 0 1 t * 2 - 1) * 127))


{-| A notch on a route's attenuverter: a knob's least.
-}
routeWheel : Float
routeWheel =
    1 / 64


paramTarget : Model -> State -> Addr -> Maybe Target
paramTarget m s a =
    paramOf m a
        |> Maybe.andThen
            (\p ->
                let
                    local : Maybe Want
                    local =
                        case Control.wanted p.addr s.wanted of
                            Just w ->
                                Just w

                            Nothing ->
                                Model.pending p.addr m |> Maybe.andThen wantOf
                in
                if isChoice p then
                    (case local of
                        Just (Option i) ->
                            Just i

                        Just (Number _) ->
                            Control.current (chosen m p)

                        Nothing ->
                            Control.current (chosen m p)
                    )
                        |> Maybe.map (\i -> Discrete { options = List.map Tuple.first p.options, current = i })

                else
                    Model.shown p.addr m
                        |> Maybe.map
                            (\v ->
                                Continuous
                                    { norm =
                                        case local of
                                            Just (Number x) ->
                                                Control.normOf p x

                                            Just (Option _) ->
                                                v.norm

                                            Nothing ->
                                                v.norm
                                    , wheel = Control.wheelNorm p
                                    }
                            )
            )


{-| A value the editor sent, as the want it was.
-}
wantOf : Value -> Maybe Want
wantOf v =
    case v of
        Num x ->
            Just (Number x)

        Index i ->
            Just (Option i)

        Name _ ->
            Nothing


intend : Model -> Intent -> State -> State
intend m intent s =
    case partRoute m s (intentAddr intent) of
        Just ( c, _ ) ->
            case intent of
                SetNorm _ t ->
                    wantRoute c (boxAt t) s

                Nudge _ n ->
                    wantRoute c (boxAt (n.from + toFloat n.by * n.wheel)) s

                -- A route has no default but none: removing it is unpatching.
                SetOption _ _ ->
                    s

                Restore _ ->
                    s

        Nothing ->
            intendParam m intent s


intentAddr : Intent -> Addr
intentAddr intent =
    case intent of
        SetNorm a _ ->
            a

        Nudge a _ ->
            a

        SetOption a _ ->
            a

        Restore a ->
            a


wantRoute : Protocol.Cell -> Int -> State -> State
wantRoute c n s =
    { s | routeWanted = Dict.insert (Protocol.cellKey c) ( c, n ) s.routeWanted }


intendParam : Model -> Intent -> State -> State
intendParam m intent s =
    let
        on : Addr -> (Param -> State) -> State
        on a f =
            paramOf m a |> Maybe.map f |> Maybe.withDefault s
    in
    case intent of
        SetNorm a t ->
            on a (\p -> want p.addr (Number (Control.atNorm p t)) s)

        Nudge a n ->
            on a (\p -> want p.addr (Number (Control.nudged p n)) s)

        SetOption a i ->
            want a (Option i) s

        Restore a ->
            on a
                (\p ->
                    if isChoice p then
                        Protocol.optIndex (round p.default)
                            |> Maybe.map (\i -> want p.addr (Option i) s)
                            |> Maybe.withDefault s

                    else
                        want p.addr (Number p.default) s
                )


{-| The last want of a control this frame.
-}
want : Addr -> Want -> State -> State
want a w s =
    { s | wanted = Control.want a w s.wanted }



-- WHERE A CONTROL IS NOW: THE UNIT'S VALUE


reading : Model -> Param -> Reading
reading m p =
    let
        r : Reading
        r =
            case Model.shown p.addr m of
                Just v ->
                    Control.reading v.norm v.text

                Nothing ->
                    Control.missing
    in
    case Model.refusal p.addr m of
        Just why ->
            Control.refused why r

        Nothing ->
            r


chosen : Model -> Param -> Chosen
chosen m p =
    let
        c : Chosen
        c =
            case Model.shown p.addr m of
                Just v ->
                    case Protocol.optIndex (round v.stored) |> Maybe.andThen (\i -> p.options |> List.filter (\( k, _ ) -> k == i) |> List.head) of
                        Just ( i, _ ) ->
                            Control.chosen i

                        Nothing ->
                            Control.notInList

                Nothing ->
                    Control.noValue
    in
    case Model.refusal p.addr m of
        Just why ->
            Control.refusedChoice why c

        Nothing ->
            c


{-| A choice turned like a knob (an operator's ratio): its option's place
along the list, and the option's name.
-}
choiceReading : Model -> Param -> Reading
choiceReading m p =
    let
        ch : Chosen
        ch =
            chosen m p

        r : Reading
        r =
            case Control.current ch of
                Just i ->
                    p.options
                        |> List.indexedMap (\k ( o, _ ) -> ( k, o ))
                        |> List.filter (\( _, o ) -> o == i)
                        |> List.head
                        |> Maybe.map (\( k, _ ) -> Control.reading (toFloat k / toFloat (max 1 (List.length p.options - 1))) (Control.choiceText p.options ch))
                        |> Maybe.withDefault Control.missing

                Nothing ->
                    Control.missing
    in
    case Model.refusal p.addr m of
        Just why ->
            Control.refused why r

        Nothing ->
            r



-- THE SCREENS


{-| What a screen on `page` draws from: that page's own addresses, the
selectors its variants hang on (FILTER.KIND for FILTER's) and the addresses
off the page its art reads (`reads`: VA's WAVE morph reads SHAPE), in
`describe` order, each with the unit's stored value. Nothing else, so a value
elsewhere never repaints it.
-}
screenVals : Model -> PageNo -> List Addr -> List ( Addr, Float )
screenVals m =
    pageVals m.schema m


{-| `screenVals` on schema `sch`'s page `n` (an engine's, the MIXER's).
-}
pageVals : Schema -> Model -> PageNo -> List Addr -> List ( Addr, Float )
pageVals sch m n reads =
    let
        own : List Addr
        own =
            Schema.pageAddresses n sch

        selectors : List Addr
        selectors =
            Schema.pages sch
                |> List.filter (\pg -> pg.n == n)
                |> List.concatMap .panels
                |> List.filter (\pn -> pn.variant /= Nothing)
                |> List.filterMap (.name >> UnitPage.variantSelector)

        wanted : Set String
        wanted =
            Set.fromList (List.map Addr.key (own ++ selectors ++ reads))
    in
    Schema.addresses sch
        |> List.filter (\a -> Set.member (Addr.key a) wanted)
        |> List.filterMap (\a -> Model.shown a m |> Maybe.map (\v -> ( a, v.stored )))


{-| A module's screen, as `<chimera-screen>` is told it.
-}
screenSpec : Model -> Engine -> Shared.ScreenAt -> Maybe Screen.Config
screenSpec m e sc =
    UnitPage.resolve (Shared.screenPage sc) m.schema
        |> Maybe.map (\n -> Shared.screenConfig e n sc |> Screen.values (screenVals m n (Shared.screenReads sc)))


{-| Pad `p`'s icon in the strip: the unit's own for the pad's machine.
-}
padIcon : Model -> Pad -> Screen.Config
padIcon m p =
    Maybe.map2 Tuple.pair (UnitPage.resolve (Scoped (PadScoped p PadMch)) m.schema) (Result.toMaybe (machineOf p))
        |> Maybe.map (\( n, machine ) -> Screen.padIcon n p |> Screen.values (Model.shown machine m |> Maybe.map (\v -> [ ( machine, v.stored ) ]) |> Maybe.withDefault []))
        |> Maybe.withDefault (Screen.new Drum (Screen.PadIcon p))


machineOf : Pad -> Shared.Built
machineOf p =
    Addr.named (Addr.Pad p Voice) "MACHINE"



-- THE PAGE


{-| What every module of a page draws from.
-}
type alias Ctx =
    { m : Model
    , s : State
    , engine : Engine
    , items : Dict String Item
    }


view : Model -> State -> Html Msg
view m s =
    case ( Model.notice m, m.described, m.link ) of
        ( Nothing, Just e, Just Transport.Open ) ->
            -- The page stays up while the unit is read again (another
            -- engine's schema): it says so, and takes no edits meanwhile.
            enginePage m s (Model.status m |> Maybe.withDefault "READING THE UNIT") e

        _ ->
            connectPage m s


connectPage : Model -> State -> Html Msg
connectPage m s =
    let
        says : String
        says =
            case Model.notice m of
                Just n ->
                    n

                Nothing ->
                    if m.link == Just Transport.Open then
                        "READING THE UNIT"

                    else
                        "NOT CONNECTED"
    in
    Page.view PageMsg
        s.page
        (Page.new "CHIMERA"
            |> Page.meta says
            |> Page.modules
                (saidModule m
                    ++ [ Module.new Chip.Unit "UNIT"
                            |> Module.note says
                            |> Module.body
                                (div [ class "connect" ]
                                    [ button [ class "hbtn", onClick (Unit (Model.Connect Model.ViaUnit)) ] [ text "CONNECT UNIT" ]
                                    , button [ class "hbtn", onClick (Unit (Model.Connect Model.ViaSimulator)) ] [ text "CONNECT SIMULATOR" ]
                                    ]
                                    -- A unit too old for this editor: where its update is.
                                    :: (case Model.download m of
                                            Just url ->
                                                [ div [ class "download" ]
                                                    [ a [ href url, Html.Attributes.target "_blank", rel "noopener" ] [ text "DOWNLOAD CHIMERA 0.4 OR LATER" ]
                                                    , text (" " ++ String.replace "https://" "" url)
                                                    ]
                                                ]

                                            Nothing ->
                                                []
                                       )
                                )
                       ]
                )
        )


{-| What the unit refused or the editor couldn't read, in the unit's words,
until the user has seen it; nothing kept, no module.
-}
saidModule : Model -> List (Module.Config Msg)
saidModule m =
    if List.isEmpty (Model.notices m) then
        []

    else
        let
            line : Model.Kept -> Html Msg
            line k =
                div []
                    [ text (Model.noticeText k.notice)
                    , text
                        (if k.times > 1 then
                            " ×" ++ String.fromInt k.times

                         else
                            ""
                        )
                    ]

            lost : List (Html Msg)
            lost =
                if Model.noticesLost m > 0 then
                    [ div [] [ text ("AND " ++ String.fromInt (Model.noticesLost m) ++ " MORE NO LONGER KEPT") ] ]

                else
                    []
        in
        [ Module.new Chip.Unit "THE UNIT SAID"
            |> Module.full
            |> Module.body
                [ div [ class "said" ]
                    (List.map line (Model.notices m) ++ lost ++ [ div [ class "connect" ] [ button [ class "hbtn", onClick (Unit Model.SeenNotices) ] [ text "SEEN" ] ] ])
                ]
        ]


enginePage : Model -> State -> String -> Engine -> Html Msg
enginePage m s status e =
    case s.showing of
        MixerScreen ->
            mixerPage m s status e

        EngineScreen ->
            engineOwn m s status e


engineOwn : Model -> State -> String -> Engine -> Html Msg
engineOwn m s status e =
    let
        lay : Layout
        lay =
            layout e s.tab

        items : List Item
        items =
            Shared.active m.schema m.variants

        ctx : Ctx
        ctx =
            { m = m
            , s = s
            , engine = e
            , items = Shared.index items
            }

        rest : List Item
        rest =
            other items lay.every

        title : String
        title =
            (m.part |> Maybe.map (\pt -> "PART " ++ String.fromInt (Unit.partNumber pt) ++ " · ") |> Maybe.withDefault "") ++ Unit.engineName e
    in
    Page.view PageMsg
        s.page
        (Page.new title
            |> Page.meta status
            |> Page.parts (partTabs m s)
            |> Page.units (unitTabs m s)
            |> Page.link (Page.Linked status)
            |> (case e of
                    Drum ->
                        Page.strip (Html.map PadMsg (PadStrip.view (PadStrip.new "DRUM" (padName m) |> PadStrip.icons (padIcon m)) s.tab))

                    Algo ->
                        identity

                    Va ->
                        identity

                    Modal ->
                        identity

                    Tape ->
                        identity
               )
            |> Page.modules
                (saidModule m
                    ++ List.map (moduleOf ctx) lay.shown
                    ++ (if List.isEmpty rest then
                            []

                        else
                            [ otherModule ctx rest ]
                       )
                )
        )


{-| A pad's name in the strip: its machine, as the unit prints it.
-}
padName : Model -> Pad -> String
padName m p =
    machineOf p |> Result.toMaybe |> Maybe.andThen (\a -> Model.shown a m) |> Maybe.map .text |> Maybe.withDefault "--"


partTabs : Model -> State -> List (Page.Tab Msg)
partTabs m s =
    List.map
        (\pt ->
            { kicker = "P" ++ String.fromInt (Unit.partNumber pt)
            , name = partName m pt
            , current =
                if m.part == Just pt && s.showing == EngineScreen then
                    Here

                else
                    Elsewhere
            , go = GoPart pt
            }
        )
        Unit.allParts


{-| A Part's tab's name: its engine as the unit last said it, else its
Sound's name, else PART.
-}
partName : Model -> Part -> String
partName m pt =
    case Dict.get (Unit.partNumber pt) m.partEngines of
        Just e ->
            Unit.engineName e

        Nothing ->
            Dict.get (Unit.partNumber pt) m.sounds |> Maybe.map .name |> Maybe.withDefault "PART"


{-| The unit's own pages it describes: MIXER, for now.
-}
unitTabs : Model -> State -> List (Page.Tab Msg)
unitTabs m s =
    if List.isEmpty (Schema.pages m.mixer) then
        []

    else
        [ { kicker = "UNIT"
          , name = "MIXER"
          , current =
                if s.showing == MixerScreen then
                    Here

                else
                    Elsewhere
          , go = Show MixerScreen
          }
        ]


{-| The unit's MIXER as a desk (`Layout.Mixer`, from its `describe MIXER`):
a channel strip per Part and the OUT strip, then the effects' chain as tabs
with the picked one's controls, and its picture beside them.
-}
mixerPage : Model -> State -> String -> Engine -> Html Msg
mixerPage m s status e =
    let
        ctx : Ctx
        ctx =
            { m = m
            , s = s
            , engine = e
            , items = Shared.index (Shared.active m.mixer m.variants)
            }

        d : Mixer.Desk
        d =
            Mixer.desk m.mixer

        picked : Maybe Mixer.Effect
        picked =
            case List.filter (\fx -> Just fx.key == s.fx) d.effects of
                fx :: _ ->
                    Just fx

                [] ->
                    List.head d.effects
    in
    Page.view PageMsg
        s.page
        (Page.new "MIXER"
            |> Page.meta status
            |> Page.parts (partTabs m s)
            |> Page.units (unitTabs m s)
            |> Page.link (Page.Linked status)
            |> Page.modules (saidModule m)
            |> Page.body
                [ div [ class "mixer" ]
                    [ div [ class "desk" ] (List.map (stripView ctx) d.strips ++ (d.master |> Maybe.map (stripView ctx >> List.singleton) |> Maybe.withDefault []))
                    , div [ class "fxrow" ]
                        [ Html.section [ class "sec fxbar" ]
                            [ Html.header []
                                [ div [ class "fxtabs", attribute "role" "tablist" ]
                                    (List.indexedMap (fxTab picked) d.effects)
                                ]
                            , div [ class "body" ]
                                [ Module.panel
                                    (picked
                                        |> Maybe.map
                                            (\fx ->
                                                List.indexedMap
                                                    (\i ( title, addrs ) ->
                                                        Module.group
                                                            (if i == 0 then
                                                                ""

                                                             else
                                                                title
                                                            )
                                                            (cells ctx Auto addrs)
                                                    )
                                                    fx.pages
                                            )
                                        |> Maybe.withDefault []
                                    )
                                ]
                            ]
                        , Html.section [ class "sec glyph" ]
                            [ Html.header [] [ Html.h2 [] [ text (picked |> Maybe.map .title |> Maybe.withDefault "") ] ]
                            , div [ class "body" ]
                                (case mixerGlyph m s of
                                    Just sc ->
                                        [ Screen.view sc ]

                                    Nothing ->
                                        [ p [ class "pnote" ] [ text "NO PICTURE OF THIS EFFECT IN THIS SCREEN KIT" ] ]
                                )
                            ]
                        ]
                    ]
                ]
        )


{-| The picked effect's picture as the screen kit draws it (its MIXER
page's gauge or art), animated, from that page's values.
-}
mixerGlyph : Model -> State -> Maybe Screen.Config
mixerGlyph m s =
    let
        effects : List Mixer.Effect
        effects =
            (Mixer.desk m.mixer).effects

        picked : Maybe Mixer.Effect
        picked =
            case List.filter (\fx -> Just fx.key == s.fx) effects of
                fx :: _ ->
                    Just fx

                [] ->
                    List.head effects

        at : String -> (PageNo -> Screen.Config) -> Maybe Screen.Config
        at label make =
            Schema.pageNumber label m.mixer |> Maybe.map (\n -> make n |> Screen.values (pageVals m.mixer m n []))
    in
    picked
        |> Maybe.andThen .picture
        |> Maybe.andThen
            (\pic ->
                case pic of
                    Mixer.GaugeOn label f box ->
                        at label (\n -> Screen.mixerGauge n f box)

                    Mixer.ArtOn label ->
                        at label (\n -> Screen.mixerArt n Screen.Tall)
            )


{-| An effect's tab in the chain's bar: CHORUS → DELAY → REVERB → OUT.
-}
fxTab : Maybe Mixer.Effect -> Int -> Mixer.Effect -> Html Msg
fxTab picked i fx =
    button
        [ classList [ ( "fxtab", True ), ( "on", Just fx == picked ) ]
        , attribute "role" "tab"
        , attribute "aria-selected" (boolText (Just fx == picked))
        , onClick (MixFx fx.key)
        ]
        [ text
            ((if i == 0 then
                ""

              else
                "→ "
             )
                ++ fx.title
            )
        ]


{-| A strip: its EQ, sends (a click on one picks its effect's tab), PAN,
the fader, then the rest. A Part the unit has no Sound for is dim.
-}
stripView : Ctx -> Mixer.Strip -> Html Msg
stripView ctx st =
    let
        sound : Maybe { name : String, status : Protocol.SoundStatus }
        sound =
            st.part |> Maybe.andThen (\n -> Dict.get n ctx.m.sounds)

        -- The Part's setup (channel, voices, bend...), folded at the strip's foot.
        setup : List (Html Msg) -> List (Html Msg)
        setup xs =
            if List.isEmpty xs then
                []

            else
                [ Html.node "details" [ class "setup" ] [ Html.node "summary" [] [ text "SETUP" ], Module.group "" xs ] ]

        section : String -> List (Html Msg) -> List (Html Msg)
        section title xs =
            if List.isEmpty xs then
                []

            else
                [ Module.group title xs ]

        send : Mixer.Send -> Maybe (Html Msg)
        send snd =
            Dict.get (Addr.key snd.addr) ctx.items
                |> Maybe.map
                    (\i ->
                        div
                            (class "send" :: (snd.effect |> Maybe.map (\k -> [ onClick (MixFx k) ]) |> Maybe.withDefault []))
                            [ control ctx ( i, AsKnob ) ]
                    )
    in
    Html.section [ classList [ ( "sec", True ), ( "strip", True ), ( "dim", st.part /= Nothing && sound == Nothing ) ], attribute "data-strip" st.key ]
        [ Html.header [] [ Html.h2 [] [ text st.title, Html.small [] [ text (sound |> Maybe.map .name |> Maybe.withDefault "") ] ] ]
        , div [ class "body" ]
            (section "EQ" (cells ctx AsKnob st.eq)
                ++ section "SENDS" (List.filterMap send st.sends)
                ++ section "" (cells ctx AsKnob (List.filterMap identity [ st.pan ]))
                ++ section "" (cells ctx AsHeroFader (List.filterMap identity [ st.level ]))
                ++ setup (cells ctx Auto st.rest)
            )
        ]


{-| The controls of the addresses the Sound shows now, as `as_`.
-}
cells : Ctx -> As -> List Addr -> List (Html Msg)
cells ctx as_ =
    List.filterMap (\a -> Dict.get (Addr.key a) ctx.items |> Maybe.map (\i -> control ctx ( i, as_ )))


boolText : Bool -> String
boolText b =
    if b then
        "true"

    else
        "false"


moduleOf : Ctx -> Module -> Module.Config Msg
moduleOf ctx md =
    let
        groups : List ( String, List ( Item, As ) )
        groups =
            Shared.fill ctx.items md

        headers : List Item
        headers =
            List.filterMap (\a -> Dict.get (Addr.key a) ctx.items) (Shared.header md)

        screen : List (Html Msg)
        screen =
            Shared.screen md
                |> Maybe.andThen (screenSpec ctx.m ctx.engine)
                |> Maybe.map (\sc -> [ Module.group "" [ Screen.view sc ] ])
                |> Maybe.withDefault []

        nothing : List (Html Msg)
        nothing =
            if List.isEmpty groups && List.isEmpty (Shared.extras md) then
                [ p [ class "pnote" ] [ text "NOTHING TO SET FOR THIS TYPE" ] ]

            else
                []
    in
    Module.new (Shared.chip md) (Shared.title md)
        |> Module.note (Shared.note md)
        |> Module.menus (List.map (\i -> menuOf ctx True i) headers)
        |> Module.summary (List.map (summaryOf ctx) (List.take 3 (headers ++ List.concatMap (Tuple.second >> List.map Tuple.first) groups)))
        |> (if Shared.isWhole md then
                Module.full

            else
                identity
           )
        |> Module.body
            ((if List.isEmpty screen && List.isEmpty groups then
                []

              else
                [ Module.panel (screen ++ List.map (\( t, xs ) -> Module.group t (List.map (control ctx) xs)) groups) ]
             )
                ++ nothing
                ++ List.map (extra ctx) (Shared.extras md)
            )


otherModule : Ctx -> List Item -> Module.Config Msg
otherModule ctx items =
    Module.new Chip.Other "OTHER"
        |> Module.note "DESCRIBED BY THE UNIT, NOT YET PLACED"
        |> Module.body [ Module.panel [ Module.group "" (List.map (\i -> control ctx ( i, Auto )) items) ] ]


summaryOf : Ctx -> Item -> ( String, String )
summaryOf ctx i =
    ( i.label
    , if isChoice i.param then
        Control.choiceText i.param.options (chosen ctx.m i.param)

      else
        Control.text (reading ctx.m i.param)
    )


extra : Ctx -> Extra -> Html Msg
extra ctx x =
    case x of
        NextSlice ->
            let
                named : List String
                named =
                    Schema.pages ctx.m.schema
                        |> List.concatMap (.panels >> List.filter (Schema.panelShown ctx.m.variants) >> List.concatMap (.routes >> List.map .label))
                        |> List.foldl
                            (\r acc ->
                                if List.member r acc then
                                    acc

                                else
                                    acc ++ [ r ]
                            )
                            []
            in
            if List.isEmpty named then
                text ""

            else
                p [ class "pnote" ] [ text (String.join " · " named ++ ": MOD MATRIX ROUTES, IN MOD ONCE THE UNIT DESCRIBES THEM") ]

        SourceText ->
            Module.panel
                [ Module.group ""
                    [ Control.cell [ class "ro" ]
                        "SOURCE"
                        [ Control.readout sourceChars
                            (case ctx.m.source of
                                Just t ->
                                    Control.reading 0 t

                                Nothing ->
                                    Control.missing
                            )
                        ]
                    ]
                ]

        Note t ->
            p [ class "pnote" ] [ text t ]

        PadRoutes pad ->
            Html.map (BayMsg (PadBay pad)) (PatchBay.view (bayOf (PadBay pad) ctx.s) (padBay ctx.m pad))

        PartMatrix ->
            div []
                [ Html.map (BayMsg PartBay) (PatchBay.view (bayOf PartBay ctx.s) (partBay ctx.m)) ]


{-| TAPE's sample name: the card's longest that fits the cell.
-}
sourceChars : Ui.Tokens.Chars
sourceChars =
    Ui.Tokens.oneMore (Ui.Tokens.oneMore Ui.Tokens.readoutChars)



-- THE CONTROLS, BY MEANING


control : Ctx -> ( Item, As ) -> Html Msg
control ctx ( item, as_ ) =
    let
        p : Param
        p =
            item.param
    in
    if isChoice p then
        case as_ of
            AsKnob ->
                choiceKnob ctx item False

            AsHero ->
                choiceKnob ctx item True

            AsMenu ->
                menuOf ctx False item

            Auto ->
                autoChoice ctx item

            AsFader ->
                autoChoice ctx item

            AsHeroFader ->
                autoChoice ctx item

    else
        case as_ of
            AsKnob ->
                contKnob ctx item False

            AsHero ->
                contKnob ctx item True

            AsFader ->
                contFader ctx item False

            AsHeroFader ->
                contFader ctx item True

            AsMenu ->
                contKnob ctx item False

            Auto ->
                case p.scale of
                    Octaves ->
                        contKnob ctx item False

                    Linear ->
                        contFader ctx item False


contKnob : Ctx -> Item -> Bool -> Html Msg
contKnob ctx item big =
    Knob.new item.param.addr (Control.polarity item.param)
        |> Knob.label item.label
        |> when big Knob.hero
        |> (\c -> Html.map Hand (Knob.view c (reading ctx.m item.param)))


contFader : Ctx -> Item -> Bool -> Html Msg
contFader ctx item big =
    Fader.new item.param.addr (Control.polarity item.param)
        |> Fader.label item.label
        |> when big Fader.hero
        |> (\c -> Html.map Hand (Fader.view c (reading ctx.m item.param)))


{-| A choice turned like a knob: its options run one way, never either side
of nothing.
-}
choiceKnob : Ctx -> Item -> Bool -> Html Msg
choiceKnob ctx item big =
    Knob.new item.param.addr (Control.polarity { min = 0, max = 1 })
        |> Knob.label item.label
        |> when big Knob.hero
        |> (\c -> Html.map Hand (Knob.view c (choiceReading ctx.m item.param)))


when : Bool -> (a -> a) -> a -> a
when yes f =
    if yes then
        f

    else
        identity


{-| By the option count: two or three a printed toggle, four to eight a
selector, more a menu.
-}
autoChoice : Ctx -> Item -> Html Msg
autoChoice ctx item =
    let
        p : Param
        p =
            item.param

        now : Chosen
        now =
            chosen ctx.m p
    in
    case ( Toggle.fromOptions p.addr p.options, Selector.fromOptions p.addr p.options ) of
        ( Just t, _ ) ->
            Html.map Hand (Toggle.view (Toggle.label item.label t) now)

        ( Nothing, Just sl ) ->
            Html.map Hand (Selector.view (Selector.label item.label sl) now)

        ( Nothing, Nothing ) ->
            menuOf ctx False item


menuOf : Ctx -> Bool -> Item -> Html Msg
menuOf ctx header item =
    case Control.options item.param.options of
        Just opts ->
            Html.map MenuMsg (Menu.view (Menu.new item.param.addr opts |> Menu.label item.label |> when header Menu.inHeader) ctx.s.menu (chosen ctx.m item.param))

        Nothing ->
            -- A choice the unit lists no options for: turned like a knob.
            choiceKnob ctx item False
