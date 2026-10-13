# Getting started with Chimera

A short tour for alpha testers. To install (or go back to stock), follow the [README](README.md); this guide starts once Chimera boots. The [quick start](QUICK-START.md) explains the screen and the controls with annotated screenshots; the [FAQ](FAQ.md) answers "how do I…".

You will need a MIDI keyboard or sequencer on the **DIN MIDI input**. USB is the console only; it does not carry notes yet.

## First five minutes

1. Power on. The boot splash shows the firmware version; note it, you will want it for bug reports.
2. Press **B1**. That is Part 1. There are six Parts (B1 to B6), each a separate instrument.
3. Play Part 1 from your keyboard. Out of the box, Part *n* listens on MIDI channel *n*, is POLY, and plays out of output pair P1.
4. Turn the six encoders under the screen. Each one drives the cell above it.
5. Choose what a Part is: hold **EDIT** and press **B1** to open the Sound browser. The top rows are INIT sounds, one per engine (ALGO, MODAL, VA), then TAPE and DRUM, which say COMING SOON and don't load yet, above the pool's Sounds; each row names its engine. The list opens on Sound 1, so turn encoder 1 up for INIT, to the one you want, and press **EDIT** to load it.

## Getting around

Every Part is a chain of pages. **MINUS / PLUS** move along it, **EDIT** goes down into a page's sub-pages (wrapping round at the bottom) and **SEQ** comes back up. The same keys work everywhere: Parts, the mixer, the Sound browser, ORBIT and SETTINGS. Touch a cell and the focus band shows any combo it answers to. The [quick start](QUICK-START.md) has the whole map, the key combos and an annotated tour of the screen.

## Parts and engines

Each Part runs one engine. Load a Sound with another engine and the Part's pages change to match.

| Engine | What it is | Pages |
|---|---|---|
| ALGO | six-operator phase-modulation synth | ALG, OSC (and its per-operator sub-pages), DRV, FLT, AMP, MOD |
| MODAL | struck, plucked and bowed resonators | EXC (exciter), RES (models STRING, BANK, BOWED, SYMP), FLT, AMP, MOD |
| VA | two variable-wave oscillators combined by MODE (MIX, SYNC, RING, XOR, BITS), with a SUB and STABILITY drift | VA (and its OSC 1 / OSC 2 sub-pages), DRV, FLT, AMP, MOD |

TAPE (sample playback from the card) and DRUM are coming in a later release.

Filters, modulation and the effects are in the [FAQ](FAQ.md#modulation).

## How do I...

Load and save Sounds and projects, route modulation, set MIDI channels, glide and bend, use the effects, change the theme, update the firmware or report a bug: see the [FAQ](FAQ.md).

## Not working yet

- Of the MIDI control changes only the sustain pedal (CC 64) works, and pitch bend (its range is BEND on each Part's PART page, default 2 semitones); the mod wheel, volume and every other CC are ignored until the per-Part MIDI map.
- There is no MIDI learn or CC mapping page.
- MIDI input is DIN only.
- SETTINGS rows that are dimmed are not built yet; EDIT skips them.

## Alpha notes

- Check [KNOWN-ISSUES.md](KNOWN-ISSUES.md) before filing.
- Chimera only reads and writes under `/CHIMERA/` on the card. Your stock PreenFM3 files are untouched.
- Reporting a bug: **Issues › New issue › Bug report**. Give the version (boot splash or ABOUT), what you did, and what you heard or saw. A short recording or photo helps.
