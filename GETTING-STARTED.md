# Getting started with Chimera

A short tour for alpha testers. To install (or go back to stock), follow the [README](README.md); this guide starts once Chimera boots. The [quick start](QUICK-START.md) explains the screen, the controls and every page with annotated screenshots; the [FAQ](FAQ.md) answers "how do I…".

You will need a MIDI keyboard or sequencer on the **DIN MIDI input**. USB doesn't carry MIDI.

## First five minutes

1. Power on. The boot splash shows the firmware version; note it, you will want it for bug reports. (It's also at SETTINGS › SYSTEM › ABOUT.)
2. Press **B1**. That is Part 1. There are six Parts (B1 to B6), each a separate instrument. The six dots at the top of the screen are the Parts: the current one is a bright green dot, and a Part that is playing gets a ring.
3. Play Part 1 from your keyboard. Out of the box, Part *n* listens on MIDI channel *n*, is POLY, and plays out of output pair P1.
4. Turn the six encoders under the screen. Each one drives the cell above it.
5. Choose what a Part is: hold **EDIT** and press **B1** to open the Sound browser. The top rows are INIT sounds, one per engine (ALGO, MODAL, VA, TAPE), then DRUM, which says COMING SOON and doesn't load yet, above the project's Sounds; each row names its engine. The list opens on Sound 1, so turn encoder 1 up for INIT, to the one you want, and press **EDIT** to load it. Turn encoder 2 for the LIBRARY and FACTORY tabs: FACTORY holds the 127 factory Sounds once they are on the card.

## Getting around

Every Part is a chain of pages. **MINUS / PLUS** move along it. A page's sub-pages sit in a row at the bottom of the screen: **SEQ** goes on to the next one (wrapping round at the end) and **EDIT** goes back one. The same keys work everywhere: Parts, the mixer, the Sound browser, ORBIT and SETTINGS. In a list, any encoder moves the bar. In a dialog, **EDIT** is OK and **MENU** or **SEQ** cancels. Touch a cell and the focus band shows any combo it answers to. The [quick start](QUICK-START.md) has the whole map, the key combos and an annotated tour of the screen.

## Parts and engines

Each Part runs one engine. Load a Sound with another engine and the Part's pages change to match. Every engine's chain ends in the same FLT, AMP and MOD pages.

| Engine | What it is | Pages |
|---|---|---|
| ALGO | six-operator phase-modulation synth | ALG (and PITCH), OSC (and its per-operator sub-pages), FLT, AMP, MOD |
| MODAL | struck, plucked and bowed resonators | EXC (exciter), RES (models STRING, BANK, BOWED, SYMP; and PITCH), FLT, AMP, MOD |
| VA | two variable-wave oscillators combined by MODE, with a SUB, a NOISE source and STABILITY drift | VA (and its OSC1, OSC2, NOISE and PITCH sub-pages), FLT, AMP, MOD |
| TAPE | plays sound sources from the card through a machine: WALK, STRETCH, SCRUB or WAVE | SRC (the source), DECK (and the machine's own page and PITCH), FLT, AMP, MOD |

FLT holds the filter (CLEAN, 2040, DIRTY, LADDER or SEM) and the voice's FX slot; AMP holds the VCA, its low-pass gate and the Part's effect sends. Filters, modulation and the effects are in the [quick start](QUICK-START.md#7-the-filter) and the [FAQ](FAQ.md#modulation).

## Voices and CPU

<!-- PLACEHOLDER: the voice table (voices per engine, model and filter on each chip revision) is supplied by the owner after the 0.2.0 stress test. Replace this comment and the line below with it. -->

*The table of how many voices each engine plays is coming with the final 0.2.0 build.*

## How do I...

Load and save Sounds and projects, route modulation, set MIDI channels, glide and bend, use TAPE and the effects, change the theme, update the firmware or report a bug: see the [FAQ](FAQ.md).

## Not working yet

- MIDI input is DIN only.
- DRUM isn't in this release.
- SETTINGS rows that are dimmed are not built yet; EDIT skips them.

## Alpha notes

- Check [KNOWN-ISSUES.md](KNOWN-ISSUES.md) before filing.
- Chimera reads and writes only under `/CHIMERA/` on the card, and reads `CHIMERA.BK2` from the card's main folder when it installs. Your stock PreenFM3 files are untouched.
- Reporting a bug: **Issues › New issue › Bug report**. Give the version (boot splash or ABOUT), what you did, and what you heard or saw. A short recording or photo helps.
