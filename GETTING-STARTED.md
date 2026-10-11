# Getting started with Chimera

A short tour for alpha testers. To install (or go back to stock), follow the [README](README.md); this guide starts once Chimera boots.

You will need a MIDI keyboard or sequencer on the **DIN MIDI input**. USB is the console only; it does not carry notes yet.

## First five minutes

1. Power on. The boot splash shows the firmware version; note it, you will want it for bug reports.
2. Press **B1**. That is Part 1. There are six Parts (B1 to B6), each a separate instrument.
3. Play Part 1 from your keyboard. Out of the box, Part *n* listens on MIDI channel *n*, is POLY, and plays out of output pair P1.
4. Turn the six encoders under the screen. Each one drives the cell above it.
5. Choose what a Part is: hold **EDIT** and press **B1** to open the Sound browser. The top rows are INIT sounds, one per engine (ALGO, MODAL, VA), then TAPE and DRUM, which say COMING SOON and don't load yet, above the pool's Sounds; each row names its engine. The list opens on Sound 1, so turn encoder 1 up for INIT, to the one you want, and press **EDIT** to load it.

## Getting around

The buttons: **B1 to B6** (Parts), **MENU**, **MINUS**, **PLUS**, **MIX**, **EDIT**, **SEQ**.

Every Part is a chain of pages. Move through it with the D-pad:

| Key | Does |
|---|---|
| SEQ | up one level (out of a sub-page) |
| EDIT | down one level (into a sub-page); wraps round at the bottom |
| MINUS / PLUS | along the chain, previous / next page |

This is the same everywhere: Parts, the mixer, SETTINGS lists.

| Gesture | Does |
|---|---|
| B*n* | Part *n*'s pages; press the same B*n* again to flip to its mixer and back |
| MIX + B*n* | Part *n*'s mixer (PART, SENDS, CHORUS, DELAY, REVERB, MASTER) |
| EDIT + B*n* | Sound browser for Part *n* |
| MIX + turn an encoder | jump the value to its next landmark (minimum, default, maximum) |
| MENU | SETTINGS (MENU steps back out, level by level) |
| hold MENU | quick-save the project |
| hold SEQ | ORBIT (if your build has it) |

You do not need to memorise the MIX and hold combos. Touch a cell and the **focus band** (under the big value) shows a hint line for any combo that cell answers to, keys in bold and what they do beside them. You can switch these off at SETTINGS › PERSONALIZE › THEME › HINTS.

Each cell shows its value as a number and a bar. Changes glide rather than jump, so sweeps are smooth.

## Parts and engines

Each Part runs one engine. Load a Sound with another engine and the Part's pages change to match.

| Engine | What it is | Pages |
|---|---|---|
| ALGO | six-operator phase-modulation synth | ALG (algorithm), WAVE and its per-operator sub-pages, DRV, FLT, AMP, MOD |
| MODAL | struck, plucked and bowed resonators | EXC (exciter), RES (models STRING, BANK, BOWED, SYMP), FLT, AMP, MOD |
| VA | two variable-wave oscillators combined by MODE (MIX, SYNC, RING, XOR, BITS), with a sub and STABILITY drift | VA (WAVE1, WAVE2, MODE, BLEND, SUB, STABILITY) and its OSC 1 / OSC 2 sub-pages (CRSE, FINE, SHAPE), DRV, FLT, AMP, MOD |

TAPE (sample playback from the card) and DRUM are coming in a later release.

**Filter** (FLT page, KIND): CLEAN, 2040, DIRTY, LADDER. The panel and its labels follow the kind. The FMD sub-page holds the modulation inputs.

**Modulation** (MOD): a matrix page, plus three envelopes (and their speed page) and three LFOs behind it. On the matrix, MIX + PLUS on a parameter primes it for routing; MIX + MINUS on a route deletes it.

**Effects** (the mixer pages): each Part has SENDS to CHORUS, DELAY and REVERB.
- CHORUS: MODE, RATE, DEPTH, MIX
- DELAY: TIME, FEEDBACK, TONE, REV (send to reverb), MIX; its CHAR sub-page has WOW and flutter and SATURATION
- REVERB: GRIT, TIME, DAMP, SIZE, MIX
- MASTER: a compressor with THRESH, RATIO, ATTACK, RELEASE, MAKEUP, MIX

## How do I...

**Save a Sound?** Open the Sound browser (EDIT + B*n*), move to a slot and press **MIX + EDIT**; the hint shows what it costs in pool space. Or SETTINGS › PART › SAVE TO PROJ. Either way, then **hold MENU** to save the project to the card.

**Load, save and manage projects?** SETTINGS › PROJECT: LOAD PROJECT, SAVE PROJECT AS, MANAGE PROJECTS (LOAD FROM, SAVE TO, RENAME, CLEAR, DELETE, PROTECT). Holding MENU on a project with no file yet asks for a name.

**Name something?** On the naming screen: encoder 1 moves the cursor, 2 cycles letters, 3 cycles digits, space and dash, 4 toggles case, 5 deletes. **SEQ** saves, **MENU** cancels.

**Clear a Sound slot?** In the browser, MIX + MINUS on the slot.

**Rename, clear or reload a Part?** SETTINGS › PART.

**Change a Part's MIDI channel?** SETTINGS › MIDI CONFIG › CHANNELS (all six Parts on one page), or the CH cell on the mixer's PART page. Part MODE (MONO or POLY) and OUTPUT are on that PART page too, and OUTPUTS is under SETTINGS › AUDIO ROUTING.

**Set a Part's volume and pan?** The LEVEL and PAN cells on that Part's mixer PART page. The whole unit's volume and balance are MASTER › LVL (VOL, PAN); SETTINGS › AUDIO ROUTING › TUNING shifts every engine's pitch, -100 to +100 cents around A4 = 440 Hz.

**Change the screen theme?** SETTINGS › PERSONALIZE › THEME: BRIGHT, GAMMA, ACCENT, BLACK, HINTS.

**Add a library Sound?** The card is inside the case, so use the USB console: download `chimera-usb.py` from the release (Python 3 is all it needs; see the [README](README.md#the-console-tool)), connect USB, then `python3 chimera-usb.py put <file> /CHIMERA/SOUNDS/` (it takes the next free number; `python3 chimera-usb.py ls sounds` lists what is there).

**Report a bug with details?** Run `python3 chimera-usb.py status` and paste the output, and `python3 chimera-usb.py shot` to save a screenshot of the unit; attach both to the bug report. If the console is not there after a cold power-on, that is a [known issue](KNOWN-ISSUES.md); a trip through SETTINGS › SYSTEM › OS UPGRADE brings it back.

**Use ORBIT?** (builds with ORBIT only.) Hold **SEQ**. ORBIT is a ring sequencer: a set of rings (chords and steps). B1 to B5 select a ring; **hold** one to jump to the Part that ring plays. **MIX + B1 to B5** mutes a ring. **B6** plays and stops. MENU leaves. Pages: ORB, RHYTHM (with VOICE and NOTES), CHRD, SCN (scenes). Scenes have their own save under SETTINGS › ORBIT.

**Update or roll back the firmware?** SETTINGS › SYSTEM › OS UPGRADE, then follow the [README](README.md#2-flash-chimera); the stock-firmware route is there too.

**Check my version?** It is on the boot splash, and under SETTINGS › SYSTEM › ABOUT.

## Not working yet

- Of the MIDI control changes only the sustain pedal (CC 64) works, and pitch bend (its range is BEND on each Part's PART page, default 2 semitones); the mod wheel, volume and every other CC are ignored until the per-Part MIDI map.
- There is no MIDI learn or CC mapping page.
- MIDI input is DIN only.
- SETTINGS rows that are dimmed are not built yet; EDIT skips them.

## Alpha notes

- Check [KNOWN-ISSUES.md](KNOWN-ISSUES.md) before filing.
- Chimera only reads and writes under `/CHIMERA/` on the card. Your stock PreenFM3 files are untouched.
- Reporting a bug: **Issues › New issue › Bug report**. Give the version (boot splash or ABOUT), what you did, and what you heard or saw. A short recording or photo helps.
