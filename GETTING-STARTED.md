# Getting started with Chimera

A short tour for alpha testers. To install (or go back to stock), follow the [README](README.md); this guide starts once Chimera boots. The [quick start](QUICK-START.md) explains the screen and the controls with annotated screenshots; the [FAQ](FAQ.md) answers "how do I…".

You will need a MIDI keyboard or sequencer on the **DIN MIDI input**. USB is the console only; it does not carry notes yet.

## First five minutes

1. Power on. The boot splash shows the firmware version; note it, you will want it for bug reports. (It's also at SETTINGS › SYSTEM › ABOUT.)
2. Press **B1**. That is Part 1. There are six Parts (B1 to B6), each a separate instrument. The six dots at the top of the screen are the Parts: the current one is a bright green dot, and a Part that is playing gets a ring.
<!-- 0.2.0 final pass: Part dots land with #625. Keep or cut this sentence to match what merged. -->
3. Play Part 1 from your keyboard. Out of the box, Part *n* listens on MIDI channel *n*, is POLY, and plays out of output pair P1.
4. Turn the six encoders under the screen. Each one drives the cell above it.
5. Choose what a Part is: hold **EDIT** and press **B1** to open the Sound browser. The top rows are INIT sounds, one per engine (ALGO, MODAL, VA), then TAPE and DRUM, which say COMING SOON and don't load yet, above the pool's Sounds; each row names its engine. The list opens on Sound 1, so turn encoder 1 up for INIT, to the one you want, and press **EDIT** to load it.

## Getting around

Every Part is a chain of pages. **MINUS / PLUS** move along it. A page's sub-pages sit in a row at the bottom of the screen: **SEQ** goes on to the next one (wrapping round at the end) and **EDIT** goes back one. The same keys work everywhere: Parts, the mixer, the Sound browser, ORBIT and SETTINGS. In a list, any encoder moves the bar. In a dialog, **EDIT** is OK and **MENU** or **SEQ** cancels. Touch a cell and the focus band shows any combo it answers to. The [quick start](QUICK-START.md) has the whole map, the key combos and an annotated tour of the screen.

## Parts and engines

Each Part runs one engine. Load a Sound with another engine and the Part's pages change to match.

| Engine | What it is | Pages |
|---|---|---|
| ALGO | six-operator phase-modulation synth | ALG, OSC (and its per-operator sub-pages), DRV, FLT, AMP, MOD |
| MODAL | struck, plucked and bowed resonators | EXC (exciter), RES (models STRING, BANK, BOWED, SYMP), FLT, AMP, MOD |
| VA | two variable-wave oscillators combined by MODE (MIX, SYNC, RING, XOR, BITS), with a SUB and STABILITY drift | VA (and its OSC 1 / OSC 2 sub-pages), DRV, FLT, AMP, MOD |

TAPE (sample playback from the card) and DRUM aren't in this release.

Filters, modulation and the effects are in the [FAQ](FAQ.md#modulation).

<!-- 0.2.0 final pass: TAPE (#476) is the headline: add its row to the engines table and take it out of "Not working yet" once merged. Also add the new VA modes (#601-605, #613), FX in the filter (#614), the STABILITY glyph (#593) and the chain-map engine track (#592), each only once merged. -->

## How do I...

Load and save Sounds and projects, route modulation, set MIDI channels, glide and bend, use the effects, change the theme, update the firmware or report a bug: see the [FAQ](FAQ.md).

## Not working yet

- MIDI input is DIN only.
- TAPE and DRUM aren't in this release.
- SETTINGS rows that are dimmed are not built yet; EDIT skips them.

## Alpha notes

- Check [KNOWN-ISSUES.md](KNOWN-ISSUES.md) before filing.
- Chimera only reads and writes under `/CHIMERA/` on the card. Your stock PreenFM3 files are untouched.
- Reporting a bug: **Issues › New issue › Bug report**. Give the version (boot splash or ABOUT), what you did, and what you heard or saw. A short recording or photo helps.
