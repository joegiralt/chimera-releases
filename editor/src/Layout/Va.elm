-- SPDX-License-Identifier: GPL-3.0-or-later


module Layout.Va exposing (modules)

{-| VA's page, in v6's order: OSC 1, OSC 2, MODE, MIXER, the voice, then
PITCH and MOD. The wave is the continuous variable wave, so it is a knob.

VA's own pages are scoped (their band is the live scope), so each screen is
the gauge the unit draws for the module's cell: OSC 1 and 2 the WAVE morph
(the VA page's cells A and B, which read the oscillator's SHAPE too), MODE
the two waves combined (cell C), MIXER the noise level (NOISE's cell B).

-}

import Addr exposing (Block(..), Osc(..))
import Layout.Page exposing (DrawnPage(..), ScopedPage(..), UnitPage(..))
import Layout.Shared as Shared exposing (Built, Module, auto, fader, gauge, group, hero, knob, menu, module_)
import Ui.Chip as Chip
import Ui.Screen exposing (Focus(..), Glyph(..))


modules : List Module
modules =
    [ osc Osc1, osc Osc2, mode, mixer, Shared.filter, Shared.filterMod, Shared.voiceFx Fx, Shared.ampOut ]
        ++ List.map Shared.envelope Addr.envs
        ++ List.map Shared.lfo Addr.lfos
        ++ [ Shared.pitch, Shared.mod ]


va : String -> Built
va =
    Addr.named Va


osc : Osc -> Module
osc o =
    let
        a : String -> Built
        a =
            Addr.vaNamed o
    in
    module_ Chip.Oscillators ("OSC " ++ String.fromInt (Addr.oscNumber o))
        |> Shared.withScreen (gauge (Scoped VaPage) (waveCell o) |> Shared.withReads [ a "SHAPE" ] |> Shared.withFallback VaWave)
        |> Shared.withGroups
            [ group "" [ hero (a "WAVE"), knob (a "SHAPE") ]
            , group "PITCH" [ knob (a "CRSE"), knob (a "FINE") ]
            ]


{-| The VA page's cell for the oscillator's WAVE: A or B.
-}
waveCell : Osc -> Focus
waveCell o =
    case o of
        Osc1 ->
            CellA

        Osc2 ->
            CellB


mode : Module
mode =
    module_ Chip.Oscillators "MODE"
        |> Shared.withScreen (gauge (Scoped VaPage) CellC |> Shared.withReads [ Addr.vaNamed Osc1 "SHAPE", Addr.vaNamed Osc2 "SHAPE" ])
        |> Shared.withGroups
            [ group "" [ menu (va "MODE") ]
            , group "" [ hero (va "AMOUNT") ]
            , group "" [ fader (va "STAB") ]
            ]


mixer : Module
mixer =
    module_ Chip.Oscillators "MIXER"
        |> Shared.withScreen (gauge (Scoped Noise) CellB)
        |> Shared.withGroups
            [ group "" [ fader (va "SUB") ]
            , group "NOISE" [ auto (va "NOISEKIND"), fader (va "NOISE") ]
            ]
