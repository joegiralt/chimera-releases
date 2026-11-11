# Getting started with Chimera

A short tour for alpha testers. To install (or go back to stock), follow the [README](README.md); this guide starts once Chimera boots. The [quick start](QUICK-START.md) explains the screen, the controls and every page with annotated screenshots; the [FAQ](FAQ.md) answers "how do I…".

You will need a MIDI keyboard, controller or sequencer, on the **DIN MIDI input** or over **USB**. Over USB, Chimera needs no driver: it shows up as a MIDI port called **Chimera**, and as an audio input that records its main out.

## First five minutes

1. Power on. The boot splash shows the firmware version; note it, you will want it for bug reports. (It's also at SETTINGS › SYSTEM › ABOUT.)
2. Press **B1**. That is Part 1. There are six Parts (B1 to B6), each a separate instrument. The six dots at the top of the screen are the Parts: the current one is a bright green dot, and a Part that is playing gets a ring.
3. Play Part 1 from your keyboard. Out of the box, Part *n* listens on MIDI channel *n*, is POLY, and plays out of output pair P1.
4. Turn the six encoders under the screen. Each one drives the cell above it.
5. Choose what a Part is: hold **EDIT** and press **B1** to open the Sound browser. It opens on the Part's own Sound. The top rows are INIT sounds, one per engine (ALGO, MODAL, VA, TAPE), then DRUM, which says COMING SOON and doesn't load yet, above the project's Sounds; each row names its engine. Turn encoder 1 to the one you want and press **EDIT** to load it. Turn encoder 2 for the LIBRARY and FACTORY tabs: FACTORY holds the 128 factory Sounds once they are on the card.

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

Chimera has 8 voices in all, shared by the six Parts. Each note costs a share of the processor that depends on its Sound: the engine, the model, the filter and the FX slot. A note gets a voice only if its cost fits in what is left, so a light Sound plays all 8 and a heavy one fewer.

Voices one Part gets on its own, with the TAPE delay and the QUAD reverb:

| Sound type | Example | Voices |
|---|---|---|
| ALGO, one or two operators | DRIFT ORGAN | 7 |
| ALGO, typical | AIR RAID | 6 |
| ALGO, heaviest | SOFT HORNS | 3 |
| ALGO with formants | NULL CHOIR | 3 |
| VA on the 2040 | SOLO PORTA | 6 |
| VA with FUZZ | INIT VA, FX FUZZ | 5 |
| VA on the LADDER with FOLD | GROWL BASS | 5 |
| MODAL STRING | NYLON | 8 |
| MODAL BOWED | CELLO SWELL | 7 |<!-- CELLO SWELL 7: derived from main's bills (MODAL BOWED 640 → 530 cycles), not read on the unit. -->
| MODAL BANK | GAMELAN | 2 |
| TAPE one-shot or loop | HARP HIT, PAD LOOP | 8 |
| TAPE STRETCH GRAIN | VOICE STRETCH | 5 |

Each Sound's cost is the worst the unit has measured for it, so a Sound never asks for more than the processor can give. Because of that, some heavier Sounds play one voice fewer: on their own with the QUAD reverb, DEAD RADIO plays 7, BIT SHRED 6, SERVO and GROWL BASS 5, and YELLING LEAD 4.

The delay's GRAIN type and the ROOM, HALL and BLOOM reverbs cost about a voice: with one of them on, many Sounds play one voice fewer.

These counts are for the rev V chip (480 MHz). A rev Y chip runs at 400 MHz and has less to share, so heavier Sounds play fewer voices. SETTINGS › SYSTEM › ABOUT shows which chip yours has.

## MIDI

Out of the box, Part *n* listens on MIDI channel *n*, over DIN and USB alike. To turn a controller's knob into a Chimera control, touch a cell, press **MIX + SEQ**, move the knob, and press **MIX + SEQ** again. Controller maps, MPE, program changes, the mixer and ORBIT on their own channels, and values sent back to your controller are in [MIDI control](MIDI.md). Each Part can also play in its own [tuning](TUNING.md).

## How do I...

Load and save Sounds and projects, route modulation, set MIDI channels, glide and bend, use TAPE and the effects, change the theme, update the firmware or report a bug: see the [FAQ](FAQ.md).

## Not working yet

- DRUM isn't in this release.
- SETTINGS rows that are dimmed are not built yet; EDIT skips them.

## Alpha notes

- Check [KNOWN-ISSUES.md](KNOWN-ISSUES.md) before filing.
- Chimera reads and writes only under `/CHIMERA/` on the card, and reads `CHIMERA.BK2` from the card's main folder when it installs. Your stock PreenFM3 files are untouched.
- Reporting a bug: **Issues › New issue › Bug report**. Give the version (boot splash or ABOUT), what you did, and what you heard or saw. A short recording or photo helps.
