# Chimera quick start

How to get around, fast. Install first with the [README](README.md); for "how do I…" questions see the [FAQ](FAQ.md).

The screenshots are rendered by the firmware's own screen code. Your values will differ.

## 1. The panel

| Control | What it does |
|---|---|
| **Encoders 1–6** | Each turns the cell above it: 1 2 3 on the top row of cells, 4 5 6 below |
| **B1–B6** | The six Parts. Each Part is its own instrument with its own engine |
| **MINUS / PLUS** | Previous / next page along the chain |
| **EDIT** | Down a level, into a page's sub-pages; wraps round from the last |
| **SEQ** | Up a level |
| **MIX** | Held, it turns other keys into secondary actions (MIX + …) |
| **MENU** | SETTINGS. Tap again to step back out, one level at a time |

## 2. The idea

- **A Part is a chain of pages.** Each page holds up to six parameters, one per encoder.
- **Some pages have sub-pages** hanging below them. The FILTER page has FILTER MOD beneath it; a VA Part's VA page has OSC 1, OSC 2 and PITCH beneath it.
- **One D-pad, everywhere.** The same four keys move you through a Part's pages, the mixer, the Sound browser, ORBIT and every SETTINGS list.
- **Nothing to memorise.** Touch a cell and the focus band shows any MIX combo that cell answers to.
- **Changes glide.** A turned value eases to its new place rather than jumping.

```
                    SEQ  (up)
                     ▲
   MINUS (prev) ◀  page  ▶ PLUS (next)
                     ▼
                    EDIT (down, wraps)

   An ALGO Part's chain (ALG is its home):

   ALG ──── OSC ──── DRV ──── FLT ──── AMP ──── MOD
    └ PIT    ├ CRS             └ FMD    └ SYM    ├ E1  E2  E3
             ├ FIN … FBK                         ├ SPD
             └ OP1 … OP6                         └ L1  L2  L3
```

## 3. Key combos

| Keys | Does |
|---|---|
| B*n* | Part *n*'s pages. Press the same B*n* again to flip to its mixer and back |
| MIX + B*n* | Part *n*'s mixer |
| EDIT + B*n* | The Sound browser for Part *n* |
| MIX + turn | Jump the value to its next landmark (minimum, default, maximum) |
| MIX + PLUS | On a parameter: prime it as a modulation destination |
| MIX + MINUS | On a route: delete it. In the browser: clear the slot |
| MENU | Open SETTINGS; inside, step back a level |
| hold MENU | Quick-save the project to the card (a new project asks for a name first) |
| hold SEQ | ORBIT, the ring sequencer |

## 4. The screen

![A Part page, annotated](docs/img/part-page.png)

1. **Part and place.** `PART 1 · SOUND` is Part 1's sound pages; `PART 1 · MIX` is its mixer. If the Part plays out of output pair 2 or 3, an `OUT P2` or `OUT P3` warning shows on the right of this line.
2. **Page name.** The page you are on (ALGORITHM).
3. **Sounding dot.** Lit while the instrument is making sound. A second dot to its left pulses ORBIT's beat while it runs.
4. **Focus band: label.** The parameter you last touched or turned.
5. **Focus band: value**, large.
6. **Focus band: glyph.** A picture of the value. It depends on the parameter: an arc for most knobs (filled from 12 o'clock when the value is bipolar), a crossfader for blends (MORPH, DRV MIX), a level bar for levels and sends, a switch for on/off, a wave scope for a wave choice, a staff note for TRANSPOSE, and animated pictures for the effects (the chorus braid, the delay rings, the reverb cube). Word choices (MODEL, MODE, STEAL) have no glyph: the word takes the band.
7. **The page's picture.** Here the algorithm diagram. Pages without their own picture show the live output's waveform.
8. **The focused cell.** Its label turns to the accent colour.
9. **The bar** under a cell shows where the value sits in its range; accent on the focused cell. Stepped values (ALG A, PITCH, CRSE) have no bar. A thin line under the bar shows modulation reaching that parameter.
10. **A cell.** Six per page, in encoder order. A dash means the slot is empty; a dimmed cell does nothing in the current setting.
11. **Chain map: where you are.** The current page is the filled pill.
12. **Chain map: the other pages** of the chain, MINUS / PLUS away.
13. **Sub-pages** hang under the pill; the lit dot is the one you are on.

Some pages (FILTER, MASTER, the MOD matrix, ORBIT's ORB) give the whole band to a picture and have no focus band.

## 5. Sub-pages and hints

From FLT, press **EDIT** to go down to FILTER MOD; **EDIT** again wraps back to FLT, and **SEQ** goes back up.

![The FILTER MOD sub-page, annotated](docs/img/sub-page-hint.png)

1. The page name is the sub-page's: FILTER MOD.
2. The touched cell, QM.
3. Its arc, bipolar here, so it fills from 12 o'clock.
4. **The hint line.** Under the value, the touched cell's combos: keys in bold, what they do beside them. It shows only while that cell is the touched one. Turn hints off at SETTINGS › PERSONALIZE › THEME › HINTS.
5. A source cell (FM3 IN): turn it to pick what modulates FM3.
6. A route amount (QM). An unrouted amount shows a dash.
7. The node, FLT, still lit on the map.
8. Its sub-pages: FLT (the page itself) and FMD, lit because you are on it.

## 6. The chain map

The strip at the bottom of every Part, mixer and ORBIT page is the map of the chain you are in.

![The chain map, annotated](docs/img/chain-map.png)

1. **A node:** one page of the chain. MINUS / PLUS step to the neighbours.
2. **The line** joins the chain's pages in order, left to right.
3. **The pill:** the page you are on.
4. **Node labels** are the pages' short names (ALG, OSC, DRV, FLT, AMP, MOD).
5. **The sub-page list** under the pill: the node's own page first, then its sub-pages; the lit one is where you are. Long lists scroll (OSC has 18 sub-pages).

The map changes with the engine: ALGO is ALG · OSC · DRV · FLT · AMP · MOD, MODAL is EXC · RES · FLT · AMP · MOD, VA is VA · DRV · FLT · AMP · MOD. SETTINGS has no map: its bottom band shows the project instead (section 10).

## 7. The mixer

Press B*n* twice, or MIX + B*n*. It opens on SND, or on the effect page you last left. The mixer chain is PRT · SND · CHR · DLY · REV · MST: the Part's own strip and sends, then the shared effects.

![The mixer's PART page, annotated](docs/img/mixer.png)

1. `PART 1 · MIX`: Part 1's mixer.
2. LEVEL's glyph, a level bar.
3. All six Parts' levels, the current Part's in accent.
4. CH (MIDI channel), MODE (MONO or POLY), OUT (output pair P1, P2 or P3).
5. LEVEL, PAN, and BEND (pitch-bend range in semitones).
6. The mixer's chain. EDIT from PRT or SND goes down to the Sound browser.

## 8. The Sound browser

EDIT + B*n*, or EDIT from the mixer. MINUS / PLUS switch Part; SEQ goes back up to the mixer.

![The Sound browser, annotated](docs/img/sound-browser.png)

1. **Tabs.** PROJECT lists the project's own Sounds; LIBRARY lists Sounds saved on the card.
2. Turn **encoder 2** to switch tab.
3. The Part you are loading into.
4. **INIT rows:** a clean Sound per engine, above the project's Sounds.
5. TAPE and DRUM read COMING SOON and don't load yet.
6. The slot number. Turn **encoder 1** to move.
7. The selected row.
8. What the Sound costs in the project's Sound memory.
9. Its engine.
10. **Hints:** EDIT loads, MIX + EDIT saves the Part's Sound, MIX + MINUS clears the slot, each with the memory it takes or frees.
11. How full the project's Sound memory is.

## 9. The MOD matrix

The MOD node's own page (MTX). Its sub-pages are the three envelopes (E1–E3), their speeds (SPD) and three LFOs (L1–L3).

![The MOD matrix, annotated](docs/img/mod-matrix.png)

1. **Columns** are destinations you have primed: on any page, touch a parameter and press MIX + PLUS. Encoder 4 scrolls them sideways.
2. **Rows** are the sources: ENV1–3, LFO1–3, VELO, NOTE (and OP5, OP6 for ALGO's operator taps).
3. **A route**, with its amount.
4. **The cursor.** Encoder 1 moves it up and down, encoder 2 across; encoder 5 sets the amount.
5. The route under the cursor, in full words.
6. Its amount, and what that means in the destination's terms.
7. The hint: MIX + MINUS deletes the route under the cursor.
8. How many routes and destinations are in use.

## 10. SETTINGS

MENU opens it. EDIT opens a row (or runs it), SEQ or MENU goes back, MINUS / PLUS move the bar.

![SETTINGS, annotated](docs/img/settings.png)

1. **Breadcrumb:** where you are in SETTINGS (`SETTINGS › PROJECT`, and so on).
2. The bar: the selected row.
3. A chevron: this row opens a list.
4. LATER: not built yet. Dimmed rows are skipped.
5. The loaded project's name, then its state (`SAVED`, `* MODIFIED`).
6. What the keys do here.

The top list: PROJECT, PART, ORBIT, MIDI CONFIG, SYSEX DUMP (later), AUDIO ROUTING, PERSONALIZE, SYSTEM.

## 11. ORBIT, the ring sequencer

**ORBIT build only:** `chimera-<version>-orbit.bin`. The plain `chimera-<version>.bin` has no sequencer; in it, holding SEQ does nothing.

ORBIT plays Chimera by itself while you shape sounds. A chord progression turns round the outside of five rhythm rings; each ring has its own number of steps, so they run as polyrhythms. Each ring plays a Part and fits its notes to the key, the scale or the current chord. Eight scenes hold whole setups.

![ORBIT's ORB page, annotated](docs/img/orbit.png)

1. The playing scene, and the page (ORBIT).
2. ORBIT's beat dot, then the sounding dot.
3. Key, scale, loop length in bars, and tempo (INT: its own clock).
4. The chord progression, round the outside; the playing segment lit.
5. The sweep: where the bar is.
6. Each ring's Part number, at its first step.
7. A ring's steps: a hit filled, the step playing lit. A muted ring goes dark.
8. ORB's cells: RING (the selected ring and its Part, `3 › P3`), KEY, SCALE, BARS, SCENE, BPM.
9. ORBIT's own chain: ORB · RING · CHRD · SCN.

| In ORBIT | Does |
|---|---|
| hold SEQ (from anywhere) | Enter ORBIT |
| B6 | Play / stop |
| B1–B5 | Open ring 1–5 on the RING page |
| hold B1–B5 | Go to the Part that ring plays |
| MIX + B1–B5 | Mute / unmute that ring |
| MENU | Leave ORBIT, back where you were |

| Page | Sub-pages | What it holds |
|---|---|---|
| ORB | CUSTOM (EDIT) | The overview above. CUSTOM is a circle of the twelve notes for your own scale |
| RING | RHYTHM, VOICE, NOTES (EDIT cycles) | RHYTHM: STEPS, HITS, ROTATE, CHANCE, MUTATE, MUTE. VOICE: GATE, VEL, ACCENT, OCTAVE, RANGE, SNAP. NOTES: MODE, WALK, TARGET (the Part it plays), LEARN, CLEAR, NOTE |
| CHRD | | The progression: SEGS, DEGREE, PLAY |
| SCN | | SCENE (switches on the loop), SAVE (EDIT saves the scene to that slot), SWITCH |

ORBIT follows its own clock, or a MIDI clock from your DAW: SETTINGS › MIDI CONFIG › SYNC.

## 12. First steps

1. Power on, with a MIDI keyboard on the DIN input. Part *n* listens on MIDI channel *n*.
2. Press **B1** and play. Turn the encoders; watch the focus band.
3. Press **PLUS** a few times to walk the chain, then **EDIT** to drop into a sub-page and **SEQ** to come back.
4. Press **B1** again for its mixer. It opens on SND, the sends: turn REVERB to send Part 1 to the reverb. MINUS goes to PRT for LEVEL and PAN.
5. Press **EDIT** to reach the Sound browser. Turn encoder 1 up to INIT VA and press **EDIT**: Part 1 is now a VA. Press **B1** to see its pages.
6. PLUS to FLT, turn FREQ a touch, then press **MIX + PLUS** to prime it. PLUS to MOD: on the matrix, move the cursor to the LFO1 row under that column (encoders 1 and 2) and turn encoder 5.
7. **Hold MENU** to save the project. Give it a name (encoder 1 moves the cursor, 2 picks a letter) and press **SEQ**.
8. ORBIT build: **hold SEQ**, then press **B6**.
