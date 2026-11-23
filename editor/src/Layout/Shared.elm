-- SPDX-License-Identifier: GPL-3.0-or-later


module Layout.Shared exposing
    ( As(..)
    , Built
    , Extra(..)
    , Group
    , Item
    , Module
    , Placement(..)
    , Route
    , ScreenAt
    , Slot
    , active
    , addGroups
    , addresses
    , ampOut
    , auto
    , chip
    , envelope
    , extras
    , fader
    , fill
    , filter
    , filterCore
    , filterMod
    , gauge
    , group
    , header
    , hero
    , heroFader
    , index
    , isWhole
    , knob
    , lfo
    , menu
    , mod
    , module_
    , note
    , padRoutes
    , pitch
    , pitchWith
    , place
    , screen
    , screenConfig
    , screenPage
    , screenReads
    , strip
    , tall
    , title
    , unbuilt
    , voiceFx
    , withChip
    , withExtras
    , withFallback
    , withFocus
    , withGroups
    , withHeader
    , withNote
    , withReads
    , withScreen
    )

{-| A page is a table: modules in signal order, each placing the unit's
addresses into groups, with the control each gets by meaning. A layout never
invents a parameter: labels, ranges and option names come from the unit, and
an address the Sound doesn't show now (another variant's) is simply not
drawn. The modules every voice engine shares live here.

A `Module` is opaque: a layout builds one with `module_` and the `with`
setters, and every address in it comes from `Addr`'s typed builders. A word
the unit has none of builds no address: the module keeps it (`unbuilt`), a
test holds every layout to none, and the page draws the rest.

-}

import Addr exposing (Addr, Block(..), Env, Lfo, PadBlock(..))
import Dict exposing (Dict)
import Layout.Page as Page exposing (DrawnPage(..), UnitPage(..))
import Protocol exposing (PageNo, VariantName)
import Schema exposing (Schema)
import Ui.Chip as Chip exposing (Chip)
import Ui.Pad exposing (Pad)
import Ui.Screen as Screen exposing (Focus, Glyph, Shape(..))
import Unit exposing (Engine)



-- THE TABLE'S WORDS


{-| The control a slot gets. `Auto` follows the schema (a choice of 2–3 is a
toggle, 4–8 a selector, more a menu; a frequency a knob, the rest faders);
the others are overrides by meaning: a ratio or a morph is a knob, the one
to noodle a hero, a long list a menu.
-}
type As
    = Auto
    | AsKnob
    | AsHero
    | AsFader
    | AsHeroFader
    | AsMenu


{-| An address a layout built from the unit's word, or the word, which
the unit has none of.
-}
type alias Built =
    Result String Addr


type alias Slot =
    { addr : Built, as_ : As }


type alias Group =
    { title : String, slots : List Slot }


{-| What a module holds besides its controls.
-}
type Extra
    = -- TAPE's sample name: shown, never edited here (the sample lives on the card).
      SourceText
    | Note String
      -- The routes a panel names that the unit doesn't describe yet.
    | NextSlice
      -- The Part's mod matrix: `describe MTX`'s sources, `since`'s routes.
    | PartMatrix
      -- A DRUM pad's four routes, a live patch bay.
    | PadRoutes Pad


{-| A screen: the unit's page and what of it is drawn, the crop under it
while the WASM loads, and the addresses off that page its art also reads
(VA's WAVE morph draws OSC 1's SHAPE). Opaque: a band (`strip`, `tall`) is
only ever a drawn page's, so no screen draws the live scope.
-}
type ScreenAt
    = ScreenAt { page : UnitPage, art : Art, fallback : Maybe Glyph, reads : List Built }


{-| A drawn page's band, its shape and the cell in focus; or a page's focus
band gauge with that cell's picture.
-}
type Art
    = Band Shape (Maybe Focus)
    | GaugeOf Focus


type Span
    = Half
    | Whole


type Module
    = Module
        { title : String
        , note : String
        , chip : Chip
        , header : List Built
        , screen : Maybe ScreenAt
        , groups : List Group
        , extras : List Extra
        , span : Span
        }


module_ : Chip -> String -> Module
module_ c t =
    Module { title = t, note = "", chip = c, header = [], screen = Nothing, groups = [], extras = [], span = Half }


withChip : Chip -> Module -> Module
withChip c (Module m) =
    Module { m | chip = c }


withNote : String -> Module -> Module
withNote n (Module m) =
    Module { m | note = n }


{-| The title bar's type menus: the selectors that swap the module's body.
-}
withHeader : List Built -> Module -> Module
withHeader h (Module m) =
    Module { m | header = h }


withScreen : ScreenAt -> Module -> Module
withScreen s (Module m) =
    Module { m | screen = Just s }


withGroups : List Group -> Module -> Module
withGroups gs (Module m) =
    Module { m | groups = gs }


addGroups : List Group -> Module -> Module
addGroups gs (Module m) =
    Module { m | groups = m.groups ++ gs }


withExtras : List Extra -> Module -> Module
withExtras xs (Module m) =
    Module { m | extras = xs }


{-| A module that takes a whole row (MOD).
-}
whole : Module -> Module
whole (Module m) =
    Module { m | span = Whole }


title : Module -> String
title (Module m) =
    m.title


note : Module -> String
note (Module m) =
    m.note


chip : Module -> Chip
chip (Module m) =
    m.chip


header : Module -> List Addr
header (Module m) =
    List.filterMap Result.toMaybe m.header


screen : Module -> Maybe ScreenAt
screen (Module m) =
    m.screen


extras : Module -> List Extra
extras (Module m) =
    m.extras


isWhole : Module -> Bool
isWhole (Module m) =
    m.span == Whole


group : String -> List Slot -> Group
group =
    Group


auto : Built -> Slot
auto a =
    { addr = a, as_ = Auto }


knob : Built -> Slot
knob a =
    { addr = a, as_ = AsKnob }


hero : Built -> Slot
hero a =
    { addr = a, as_ = AsHero }


fader : Built -> Slot
fader a =
    { addr = a, as_ = AsFader }


heroFader : Built -> Slot
heroFader a =
    { addr = a, as_ = AsHeroFader }


menu : Built -> Slot
menu a =
    { addr = a, as_ = AsMenu }


{-| A drawn page's art band, 240 by 68.
-}
strip : DrawnPage -> ScreenAt
strip page =
    ScreenAt { page = Drawn page, art = Band Strip Nothing, fallback = Nothing, reads = [] }


{-| A drawn page's tall art (a filter's, an envelope's), 240 by 158.
-}
tall : DrawnPage -> ScreenAt
tall page =
    ScreenAt { page = Drawn page, art = Band Tall Nothing, fallback = Nothing, reads = [] }


{-| Any page's focus band gauge with cell `f` in focus: the picture the unit
shows for that cell, the only art a scoped page has.
-}
gauge : UnitPage -> Focus -> ScreenAt
gauge page f =
    ScreenAt { page = page, art = GaugeOf f, fallback = Nothing, reads = [] }


withFallback : Glyph -> ScreenAt -> ScreenAt
withFallback g (ScreenAt s) =
    ScreenAt { s | fallback = Just g }


withFocus : Focus -> ScreenAt -> ScreenAt
withFocus f (ScreenAt s) =
    case s.art of
        Band shape _ ->
            ScreenAt { s | art = Band shape (Just f) }

        GaugeOf _ ->
            ScreenAt { s | art = GaugeOf f }


{-| The addresses off the screen's page its art reads too.
-}
withReads : List Built -> ScreenAt -> ScreenAt
withReads rs (ScreenAt s) =
    ScreenAt { s | reads = rs }


screenPage : ScreenAt -> UnitPage
screenPage (ScreenAt s) =
    s.page


screenReads : ScreenAt -> List Addr
screenReads (ScreenAt s) =
    List.filterMap Result.toMaybe s.reads


{-| The screen as `<chimera-screen>` is told it, its page found at `n`, but
for the values.
-}
screenConfig : Engine -> PageNo -> ScreenAt -> Screen.Config
screenConfig e n (ScreenAt s) =
    (case s.art of
        Band shape f ->
            Screen.drawn e n shape |> (f |> Maybe.map Screen.focus |> Maybe.withDefault identity)

        GaugeOf f ->
            Screen.gauge e n f
    )
        |> (s.fallback |> Maybe.map Screen.fallback |> Maybe.withDefault identity)
        |> (Page.pad s.page |> Maybe.map Screen.onPad |> Maybe.withDefault identity)


{-| One of a DRUM pad's routes: its three addresses.
-}
type alias Route =
    { source : Addr, dest : Addr, amount : Addr }


{-| A pad's four routes, each built whole or not at all (`unbuilt` names
what was not).
-}
padRoutes : Pad -> List Route
padRoutes p =
    List.filterMap Result.toMaybe (builtRoutes p)


builtRoutes : Pad -> List (Result (List String) Route)
builtRoutes p =
    List.map
        (\k ->
            let
                at : String -> Built
                at =
                    Addr.named (Pad p (PadRoute k))
            in
            case ( at "SOURCE", at "DEST", at "AMOUNT" ) of
                ( Ok source, Ok dest, Ok amount ) ->
                    Ok { source = source, dest = dest, amount = amount }

                ( s, d, a ) ->
                    Err (List.filterMap errOf [ s, d, a ])
        )
        Addr.routeSlots


errOf : Result e a -> Maybe e
errOf r =
    case r of
        Ok _ ->
            Nothing

        Err e ->
            Just e


{-| The words the module asked for that build no address: none, in a
layout that is right.
-}
unbuilt : Module -> List String
unbuilt (Module m) =
    List.filterMap errOf m.header
        ++ List.concatMap (.slots >> List.filterMap (.addr >> errOf)) m.groups
        ++ (m.screen |> Maybe.map (\(ScreenAt s) -> List.filterMap errOf s.reads) |> Maybe.withDefault [])
        ++ List.concatMap
            (\x ->
                case x of
                    PadRoutes p ->
                        List.concat (List.filterMap errOf (builtRoutes p))

                    SourceText ->
                        []

                    Note _ ->
                        []

                    NextSlice ->
                        []

                    PartMatrix ->
                        []
            )
            m.extras


{-| Every address the module places.
-}
addresses : Module -> List Addr
addresses (Module m) =
    header (Module m)
        ++ List.concatMap (.slots >> List.filterMap (.addr >> Result.toMaybe)) m.groups
        ++ List.concatMap
            (\x ->
                case x of
                    PadRoutes p ->
                        List.concatMap (\r -> [ r.source, r.dest, r.amount ]) (padRoutes p)

                    SourceText ->
                        []

                    Note _ ->
                        []

                    NextSlice ->
                        []

                    PartMatrix ->
                        []
            )
            m.extras



-- WHAT THE SOUND SHOWS NOW


{-| A parameter the Sound has now, with the label its most specific panel
gives it.
-}
type alias Item =
    { param : Schema.Param, label : String }


{-| Where an item sits on a page: in a module, or in no module (OTHER's, so
nothing the unit describes is ever hidden).
-}
type Placement
    = Placed Module
    | Unplaced


place : List Module -> Item -> Placement
place every =
    let
        -- Built once per layout: the first module that places each address.
        holder : Dict String Module
        holder =
            List.foldr (\m acc -> List.foldl (\a -> Dict.insert (Addr.key a) m) acc (addresses m)) Dict.empty every
    in
    \item ->
        case Dict.get (Addr.key item.param.addr) holder of
            Just m ->
                Placed m

            Nothing ->
                Unplaced


{-| Every parameter of the panels the Sound shows, once each, in the unit's
order. One address can sit on several pages (an operator's WAVE is on the OSC
page and on the operator's own): the variant panel's description wins.
-}
active : Schema -> Dict String VariantName -> List Item
active sch variants =
    let
        shown : Schema.Panel -> Bool
        shown =
            Schema.panelShown variants

        keep : ( Bool, Item ) -> ( List String, Dict String ( Bool, Item ) ) -> ( List String, Dict String ( Bool, Item ) )
        keep ( generic, item ) ( order, best ) =
            let
                k : String
                k =
                    Addr.key item.param.addr
            in
            case Dict.get k best of
                Nothing ->
                    ( order ++ [ k ], Dict.insert k ( generic, item ) best )

                Just ( heldGeneric, _ ) ->
                    if heldGeneric && not generic then
                        ( order, Dict.insert k ( generic, item ) best )

                    else
                        ( order, best )

        ( keys, chosen ) =
            Schema.pages sch
                |> List.concatMap
                    (\pg ->
                        pg.panels
                            |> List.filter shown
                            |> List.concatMap (\pn -> List.map (\p -> ( pn.variant == Nothing, { param = p, label = labelOf pg pn p } )) pn.params)
                    )
                |> List.foldl keep ( [], Dict.empty )
    in
    List.filterMap (\k -> Dict.get k chosen |> Maybe.map Tuple.second) keys


{-| The Sound's items by address.
-}
index : List Item -> Dict String Item
index items =
    Dict.fromList (List.map (\i -> ( Addr.key i.param.addr, i )) items)


{-| A module's groups as the Sound shows them now: each slot whose address
the Sound has, and no empty group.
-}
fill : Dict String Item -> Module -> List ( String, List ( Item, As ) )
fill items (Module m) =
    m.groups
        |> List.map (\g -> ( g.title, List.filterMap (\s -> s.addr |> Result.toMaybe |> Maybe.andThen (\a -> Dict.get (Addr.key a) items) |> Maybe.map (\i -> ( i, s.as_ ))) g.slots ))
        |> List.filter (Tuple.second >> List.isEmpty >> not)


{-| A page of all six operators labels its cells OP1..OP6; the cell then says
what the page is about.
-}
labelOf : Schema.Page -> Schema.Panel -> Schema.Param -> String
labelOf pg pn p =
    case ( pn.variant, String.toList p.label ) of
        ( Nothing, [ 'O', 'P', d ] ) ->
            if d >= '1' && d <= '6' then
                Protocol.pageLabel pg.label

            else
                p.label

        _ ->
            p.label



-- THE MODULES EVERY VOICE SHARES


{-| PITCH, its screen the PIT page's art band.
-}
pitch : Module
pitch =
    pitchWith (strip Pit)


{-| PITCH with screen `sc`: TAPE's PIT page is scoped, so it draws a gauge.
-}
pitchWith : ScreenAt -> Module
pitchWith sc =
    let
        a : String -> Built
        a =
            Addr.named Pitch
    in
    module_ Chip.Pitch "PITCH"
        |> withScreen sc
        |> withGroups
            [ group "" [ hero (a "PITCH"), knob (a "FINE") ]
            , group "" [ fader (a "GLIDE_TIME") ]
            , group "" [ auto (a "STEAL"), auto (a "SNAP") ]
            ]


{-| A filter in `block` (FILTER, or a DRUM pad's own), its art on `page`.
-}
filterCore : Block -> DrawnPage -> Module
filterCore block page =
    let
        a : String -> Built
        a =
            Addr.named block
    in
    module_ Chip.Filter "FILTER"
        |> withHeader [ a "KIND" ]
        |> withScreen (tall page)
        |> withGroups
            [ group "" [ hero (a "CUTOFF"), knob (a "RESO") ]
            , group "" [ auto (a "MODE"), auto (a "VOICE"), knob (a "MORPH") ]
            ]


filter : Module
filter =
    filterCore Filter Flt |> addGroups [ group "" [ fader (Addr.named Filter "STAB") ] ]


{-| The filter's own modulation: feedback, the input, and the two jacks.
-}
filterMod : Module
filterMod =
    let
        a : String -> Built
        a =
            Addr.named Filter
    in
    module_ Chip.Filter "FILTER MOD"
        |> withGroups
            [ group "" [ fader (a "FB"), fader (a "LEVEL") ]
            , group "JACKS" [ menu (a "FM3IN"), menu (a "QMIN") ]
            ]
        |> withExtras [ NextSlice ]


{-| The voice's effect, its art on `page` (FX, or a DRUM pad's).
-}
voiceFx : DrawnPage -> Module
voiceFx page =
    let
        a : String -> Built
        a =
            Addr.named VoiceFx
    in
    module_ Chip.Fx "VOICE FX"
        |> withHeader [ a "TYPE" ]
        |> withScreen (strip page)
        |> withGroups
            [ group "" [ auto (a "PLACE") ]
            , group "" [ hero (a "P1"), knob (a "P2") ]
            , group "" [ fader (a "P3"), fader (a "MIX") ]
            ]


ampOut : Module
ampOut =
    let
        a : String -> Built
        a =
            Addr.named Out
    in
    module_ Chip.Amp "AMP · OUT"
        |> withNote "LOW-PASS GATE · STEREO · SENDS"
        |> withScreen (strip Snd)
        |> withGroups
            [ group "GATE" [ heroFader (a "LPG"), fader (a "DECAY"), fader (a "STRIKE"), fader (a "VEL"), fader (a "VCA") ]
            , group "STEREO" [ knob (a "PAN"), fader (a "WIDTH") ]
            , group "OUT" [ heroFader (a "LEVEL"), fader (a "SEND1"), fader (a "SEND2"), fader (a "SEND3") ]
            ]


{-| An envelope: type A's stages or type B's function, by the unit's TYPE.
-}
envelope : Env -> Module
envelope e =
    let
        a : String -> Built
        a =
            Addr.named (EnvBlock e)
    in
    module_ Chip.Envelopes ("ENVELOPE " ++ String.fromInt (Addr.envNumber e))
        |> withHeader [ a "TYPE" ]
        |> withScreen (tall (EnvPage e))
        |> withGroups
            [ group "" [ fader (a "ATK"), fader (a "H"), fader (a "DEC"), fader (a "SUS"), fader (a "REL") ]
            , group "" [ fader (a "RISE"), fader (a "FALL"), knob (a "SHAPE") ]
            , group "" [ auto (a "MODE"), auto (a "FORM"), auto (a "SPEED"), auto (a "HOLD") ]
            ]


lfo : Lfo -> Module
lfo l =
    let
        a : String -> Built
        a =
            Addr.named (LfoBlock l)
    in
    module_ Chip.Lfos ("LFO " ++ String.fromInt (Addr.lfoNumber l))
        |> withHeader [ a "TYPE" ]
        |> withScreen (strip (LfoPage l))
        |> withGroups
            [ group "" [ hero (a "RATE"), hero (a "RISE"), auto (a "SHAPE") ]
            , group "" [ fader (a "DEPTH"), auto (a "SYNC"), knob (a "PHASE"), knob (a "FALL"), knob (a "SHAPE_B"), auto (a "FORM") ]
            ]


{-| The Part's mod matrix, at full width.
-}
mod : Module
mod =
    module_ Chip.Mod "MOD"
        |> withNote "PATCH BAY"
        |> whole
        |> withExtras [ PartMatrix ]
