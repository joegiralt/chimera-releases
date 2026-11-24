-- SPDX-License-Identifier: GPL-3.0-or-later


module Layout.Modal exposing (modules)

{-| MODAL's page, in v6's order: RESONATOR (its MODEL in the title bar),
EXCITER, MODAL-2, PITCH, then the voice and MOD. The model picks what the
exciter and MODAL-2 hold.

MODAL's own pages are scoped (their band is the live scope), so each screen
is the gauge the unit draws for the module's first hand: EXCITE's (or
FORCE's), BRIGHT's, MODAL-2's first cell.

-}

import Addr exposing (Block(..))
import Layout.Page exposing (DrawnPage(..), ScopedPage(..), UnitPage(..))
import Layout.Shared as Shared exposing (Built, Module, auto, fader, gauge, group, hero, knob, module_)
import Ui.Chip as Chip
import Ui.Screen exposing (Focus(..))


modules : List Module
modules =
    [ resonator, exciter, modal2, Shared.pitch, Shared.filter, Shared.filterMod, Shared.voiceFx Fx, Shared.ampOut ]
        ++ List.map Shared.envelope Addr.envs
        ++ List.map Shared.lfo Addr.lfos
        ++ [ Shared.mod ]


a : String -> Built
a =
    Addr.named Modal


resonator : Module
resonator =
    module_ Chip.Resonator "RESONATOR"
        |> Shared.withHeader [ a "MODE" ]
        |> Shared.withScreen (gauge (Scoped Res) CellC)
        |> Shared.withGroups
            [ group "" [ hero (a "BRIGHT"), knob (a "STRUCTURE") ]
            , group "" [ fader (a "DAMP"), fader (a "POS") ]
            ]


exciter : Module
exciter =
    module_ Chip.Resonator "EXCITER"
        |> Shared.withScreen (gauge (Scoped Exc) CellA)
        |> Shared.withGroups [ group "" [ hero (a "EXCITE"), hero (a "FORCE"), fader (a "COLOR"), fader (a "BURST"), fader (a "SPEED") ] ]


modal2 : Module
modal2 =
    module_ Chip.Resonator "MODAL-2"
        |> Shared.withScreen (gauge (Scoped Mdl2) CellA)
        |> Shared.withGroups
            [ group "" [ auto (a "MODES") ]
            , group "BODY" [ knob (a "COUPLE"), fader (a "HALO"), fader (a "BODY") ]
            , group "ENSEMBLE" [ fader (a "E.DPT"), fader (a "E.RAT"), fader (a "E.MIX") ]
            ]
