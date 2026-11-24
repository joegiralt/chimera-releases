-- SPDX-License-Identifier: GPL-3.0-or-later


module Layout.Page exposing (DrawnPage(..), PadDrawn(..), PadScoped(..), ScopedPage(..), UnitPage(..), label, pad, resolve, variantSelector)

{-| The unit's pages a layout draws from, by name: a layout never writes a
page's label as a string, and `resolve` finds its number in the schema the
unit described (a test checks every layout's pages resolve).

A page is drawn or scoped. A drawn page's art band is the page's own picture
(the algorithm chart, an envelope, a filter's curve). A scoped page's band is
the unit's live audio scope, which the editor has no audio for: only its focus
band's gauges draw anything, so a layout can ask a scoped page for a gauge
alone (`Layout.Shared.gauge`), never for its band.

-}

import Addr exposing (Addr, Block(..), Env, Lfo, Operator, PadBlock(..))
import Protocol exposing (PageNo)
import Schema exposing (Schema)
import Ui.Pad as Pad exposing (Pad)


type UnitPage
    = Drawn DrawnPage
    | Scoped ScopedPage


{-| A page whose art band is its own picture.
-}
type DrawnPage
    = Alg
    | Pit
    | OpPage Operator
    | Flt
    | Fx
    | Snd
    | EnvPage Env
    | LfoPage Lfo
    | PadDrawn Pad PadDrawn


{-| A page whose art band is the live scope.
-}
type ScopedPage
    = VaPage
    | Noise
    | Res
    | Exc
    | Mdl2
    | Src
    | Deck
    | Mch
      -- TAPE's PIT: the same label as the others' drawn one, but scoped.
    | TapePit
    | PadScoped Pad PadScoped


{-| A DRUM pad's own drawn pages.
-}
type PadDrawn
    = PadKit
    | PadFlt
    | PadAmp
    | PadPenv
    | PadFx


{-| A DRUM pad's own scoped pages.
-}
type PadScoped
    = PadMch
    | PadPlfo


{-| The page's label as `ed describe` gives it.
-}
label : UnitPage -> String
label p =
    case p of
        Drawn d ->
            drawnLabel d

        Scoped s ->
            scopedLabel s


drawnLabel : DrawnPage -> String
drawnLabel p =
    case p of
        Alg ->
            "ALG"

        Pit ->
            "PIT"

        OpPage o ->
            "OP" ++ String.fromInt (Addr.operatorNumber o)

        Flt ->
            "FLT"

        Fx ->
            "FX"

        Snd ->
            "SND"

        EnvPage e ->
            "E" ++ String.fromInt (Addr.envNumber e)

        LfoPage l ->
            "L" ++ String.fromInt (Addr.lfoNumber l)

        PadDrawn n pp ->
            padLabel n
                ++ (case pp of
                        PadKit ->
                            "_KIT"

                        PadFlt ->
                            "_FLT"

                        PadAmp ->
                            "_AMP"

                        PadPenv ->
                            "_PENV"

                        PadFx ->
                            "_FX"
                   )


scopedLabel : ScopedPage -> String
scopedLabel p =
    case p of
        VaPage ->
            "VA"

        Noise ->
            "NOISE"

        Res ->
            "RES"

        Exc ->
            "EXC"

        Mdl2 ->
            "MDL2"

        Src ->
            "SRC"

        Deck ->
            "DECK"

        Mch ->
            "MCH"

        TapePit ->
            "PIT"

        PadScoped n pp ->
            padLabel n
                ++ (case pp of
                        PadMch ->
                            "_MCH"

                        PadPlfo ->
                            "_PLFO"
                   )


padLabel : Pad -> String
padLabel n =
    "PAD" ++ String.fromInt (Pad.number n)


{-| The page's number in the schema the unit described, if it has the page.
-}
resolve : UnitPage -> Schema -> Maybe PageNo
resolve p =
    Schema.pageNumber (label p)


{-| The DRUM pad a page draws for: the unit selects it before drawing.
-}
pad : UnitPage -> Maybe Pad
pad p =
    case p of
        Drawn (PadDrawn n _) ->
            Just n

        Scoped (PadScoped n _) ->
            Just n

        Drawn Alg ->
            Nothing

        Drawn Pit ->
            Nothing

        Drawn (OpPage _) ->
            Nothing

        Drawn Flt ->
            Nothing

        Drawn Fx ->
            Nothing

        Drawn Snd ->
            Nothing

        Drawn (EnvPage _) ->
            Nothing

        Drawn (LfoPage _) ->
            Nothing

        Scoped VaPage ->
            Nothing

        Scoped Noise ->
            Nothing

        Scoped Res ->
            Nothing

        Scoped Exc ->
            Nothing

        Scoped Mdl2 ->
            Nothing

        Scoped Src ->
            Nothing

        Scoped Deck ->
            Nothing

        Scoped Mch ->
            Nothing

        Scoped TapePit ->
            Nothing


{-| The address whose value picks a panel's variant (`panel FILTER LADDER`
is FILTER.KIND's doing), by the panel's name as the unit gives it.
-}
variantSelector : String -> Maybe Addr
variantSelector name =
    let
        numbered : String -> List a -> Maybe a
        numbered prefix xs =
            if String.startsWith prefix name then
                String.dropLeft (String.length prefix) name
                    |> String.toInt
                    |> Maybe.andThen
                        (\n ->
                            if n >= 1 then
                                List.head (List.drop (n - 1) xs)

                            else
                                Nothing
                        )

            else
                Nothing

        padOf : String -> Maybe Pad
        padOf suffix =
            if String.startsWith "PAD" name && String.endsWith suffix name then
                name |> String.dropLeft 3 |> String.dropRight (String.length suffix) |> String.toInt |> Maybe.andThen (\n -> Pad.all |> List.filter (\q -> Pad.number q == n) |> List.head)

            else
                Nothing

        f : Block -> String -> Maybe Addr
        f b =
            Addr.named b >> Result.toMaybe
    in
    case name of
        "FILTER" ->
            f Filter "KIND"

        "FX" ->
            f VoiceFx "TYPE"

        "RESONATOR" ->
            f Modal "MODE"

        "MACHINE" ->
            f Tape "MODEL"

        _ ->
            [ numbered "ENV" Addr.envs |> Maybe.andThen (\e -> f (EnvBlock e) "TYPE")
            , numbered "LFO" Addr.lfos |> Maybe.andThen (\l -> f (LfoBlock l) "TYPE")
            , numbered "OP" Addr.operators |> Maybe.andThen (\o -> f (Op o) "WAVE")
            , padOf "_MCH" |> Maybe.andThen (\p -> f (Pad p Voice) "MACHINE")
            , padOf "_FLT" |> Maybe.andThen (\p -> f (Pad p PadFilter) "KIND")
            ]
                |> List.filterMap identity
                |> List.head
