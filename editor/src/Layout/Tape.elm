-- SPDX-License-Identifier: GPL-3.0-or-later


module Layout.Tape exposing (modules)

{-| TAPE's page, in v6's order: SOURCE (read-only: the sample lives on the
card), DECK (its MODEL in the title bar), MACHINE, PITCH, then the
voice and MOD. The machine picks what DECK and MACHINE hold.

TAPE's own pages are scoped (SOURCE's and DECK's band is the sample, which
lives on the card; MACHINE's the live scope), so each screen is the gauge
the unit draws: START's arc, DECK's machine with its second cell (LENGTH,
SPEED, FINGER or SCAN), MACHINE's tape with TAPE's, PITCH's arc.

-}

import Addr exposing (Block(..))
import Layout.Page exposing (DrawnPage(..), ScopedPage(..), UnitPage(..))
import Layout.Shared as Shared exposing (Built, Extra(..), Module, auto, fader, gauge, group, hero, knob, module_)
import Ui.Chip as Chip
import Ui.Screen exposing (Focus(..))


modules : List Module
modules =
    [ source, deck, machine, Shared.pitchWith (gauge (Scoped TapePit) CellA), Shared.filter, Shared.filterMod, Shared.voiceFx Fx, Shared.ampOut ]
        ++ List.map Shared.envelope Addr.envs
        ++ List.map Shared.lfo Addr.lfos
        ++ [ Shared.mod ]


a : String -> Built
a =
    Addr.named Tape


source : Module
source =
    module_ Chip.Tape "SOURCE"
        |> Shared.withNote "READ-ONLY"
        |> Shared.withScreen (gauge (Scoped Src) CellB)
        |> Shared.withGroups [ group "" [ knob (a "START"), knob (a "END") ] ]
        |> Shared.withExtras [ SourceText, Note "THE SAMPLE LIVES ON THE CARD: CHANGE IT ON THE UNIT, AND THE EDITOR SHOWS IT" ]


deck : Module
deck =
    module_ Chip.Tape "DECK"
        |> Shared.withHeader [ a "MODEL" ]
        |> Shared.withScreen (gauge (Scoped Deck) CellB)
        |> Shared.withGroups
            [ group "" [ hero (a "POSITION") ]
            , group "" [ knob (a "MOTION"), auto (a "TYPE") ]
            , group "" [ fader (a "SIZE"), fader (a "DRAG"), fader (a "STRETCH_LENGTH"), fader (a "XFADE"), fader (a "DRIFT"), auto (a "MODE") ]
            ]


machine : Module
machine =
    module_ Chip.Tape "MACHINE"
        |> Shared.withScreen (gauge (Scoped Mch) CellA)
        |> Shared.withGroups
            [ group "TAPE" [ fader (a "TAPE"), fader (a "AGE"), auto (a "WOW") ]
            , group "" [ auto (a "TRON"), auto (a "RETRIG"), fader (a "GRAIN"), fader (a "SPRAY"), auto (a "STRETCH_END"), auto (a "KEY") ]
            ]
