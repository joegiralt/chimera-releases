# Chimera quick start

How to get around, fast. Install first with the [README](README.md); for "how do I…" questions see the [FAQ](FAQ.md).

The screenshots are rendered by the firmware's own screen code. Your values will differ.

## 1. The panel

| Control | What it does |
|---|---|
| **Encoders 1–6** | Each turns the cell above it: 1 2 3 on the top row of cells, 4 5 6 below |
| **B1–B6** | The six Parts. Each Part is its own instrument with its own engine |
| **MINUS / PLUS** | Previous / next page along the chain |
| **EDIT** | Back one sub-page. Also **OK** in a dialog, and it opens the selected row in lists |
| **SEQ** | On to the next sub-page (wraps round from the last). Also cancels, with MENU, in a dialog |
| **MIX** | Held, it turns other keys into secondary actions (MIX + …) |
| **MENU** | SETTINGS. Tap again to step back out, one level at a time |

## 2. The idea

- **A Part is a chain of pages.** Each page holds up to six parameters, one per encoder.
- **Some pages have sub-pages** in a row under the chain map. The FILTER page has MODULATION beside it; a VA Part's VA page has OSC 1, OSC 2 and PITCH beside it.
- **One D-pad, everywhere.** The same four keys move you through a Part's pages, the mixer, the Sound browser, ORBIT and every SETTINGS list.
- **Any encoder moves a list.** In SETTINGS, the Sound browser, project lists and dialogs, turn any encoder to move the bar.
- **Nothing to memorise.** Touch a cell and the focus band shows any MIX combo that cell answers to.
- **Changes glide.** A turned value eases to its new place rather than jumping.

```
   MINUS (previous page)  ◀  page  ▶  PLUS (next page)

   EDIT (previous sub-page)  ◀  sub-page  ▶  SEQ (next sub-page)

   An ALGO Part's chain (ALG is its home):

   ALG ──── OSC ──── DRV ──── FLT ──── AMP ──── MOD
    └ PIT    ├ CRS             └ FMD    └ SYM    ├ E1  E2  E3
             ├ FIN … FBK                         ├ SPD
             └ OP1 … OP6                         └ L1  L2  L3
```

The sub-pages of a page sit in a row at the bottom of the screen, each named in a full word (ALGORITHM, PITCH, MATRIX, ENV1 …). The diagram above draws them stacked, with their short names. If you like a stacked list better, SETTINGS › PERSONALIZE › CHAIN MAP › PAGES: STACK. Then **EDIT** goes down a sub-page and **SEQ** goes back up.
<!-- 0.2.0 final pass: FX in the filter (#614) takes DRV out of the chain (ALG · OSC · FLT · AMP · MOD) and gives FLT an FX sub-page; redraw this diagram once it is merged. -->

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
| EDIT / MENU or SEQ | In a dialog: OK / cancel. The hint reads `EDIT OK · MENU BACK` |
| hold MENU | Quick-save the project to the card (a new project asks for a name first) |
| hold SEQ | ORBIT, the ring sequencer |

## 4. The screen

![A Part page, annotated](docs/img/part-page.png)

1. **Part dots.** One dot a Part, B1 to B6. The current Part is the bright green dot; a Part that is playing has a ring round its dot.
2. **Part and place.** `PART 1 · SOUND` is Part 1's sound pages; `PART 1 · MIX` is its mixer. If the Part plays out of output pair 2 or 3, an `OUT P2` or `OUT P3` warning shows on the right of this line.
3. **Page name.** The page you are on (ALGORITHM).
4. **Sounding dot.** Lit while the instrument is making sound. A second dot to its left pulses ORBIT's beat while it runs.
5. **Focus band: label.** The parameter you last touched or turned.
6. **Focus band: value**, large. A unit (Hz, kHz, ms, %) is set small after the number, so `2.14 kHz` never runs under the gauge. The number is the value you set: it shows as soon as you turn, and modulation never moves it.
7. **Focus band: glyph.** A picture of the value. It depends on the parameter: an arc for most knobs (filled from 12 o'clock when the value is bipolar), a crossfader for blends (MORPH, DRV MIX), a level bar for levels and sends, a switch for on/off, a wave scope for a wave choice and for VA's MODE (the two oscillators combined), a staff note for TRANSPOSE, and animated pictures for the effects (the chorus braid, the delay rings, the reverb cube). Word choices (MODEL, the filter's MODE, STEAL) have no glyph: the word takes the band.
<!-- 0.2.0 final pass: add the glyphs that land, each once merged: TAPE's machine pictures (#476), the STABILITY spirit level (#593), FX PLACE (#614), the LFO page's own scope (#649). -->
8. **The page's picture.** Here the algorithm diagram. While you pick ALG A or ALG B, the picture shows that one algorithm on its own; on any other cell it shows A blending into B. Pages without their own picture show the live output's waveform.
9. **The focused cell.** Its label turns to the accent colour.
10. **The bar** under a cell shows where the value sits in its range; accent on the focused cell. Stepped values (ALG A, PITCH, CRSE) have no bar. A thin line under the bar shows modulation reaching that parameter.
11. **A cell.** Six per page, in encoder order. A dash means the slot is empty; a dimmed cell does nothing in the current setting.
12. **Chain map: where you are.** The current page is the filled pill.
13. **Chain map: the other pages** of the chain, MINUS / PLUS away.
14. **Sub-pages** sit in a row under the map. The current one is underlined. `<` and `>` at the ends mean there are more.

Some pages (FILTER, MASTER, the envelopes and LFO speeds, ORBIT's ORB) give the whole band to a picture and have no focus band.

![The FILTER page, annotated](docs/img/filter.png)

1. **The response**, drawn from the filter's real response at the values you set, resonance peak included.
2. **The corner**, at the cutoff you set.
3. **The cutoff readout** (FREQ, or CUTOFF on the 2040): the value you set. It stays still while an LFO or envelope moves the sound.
4. **The modulation mark.** A faint band under the plot runs from the corner to where modulation has the cutoff now, with a tick at its end. It is gone when nothing modulates the cutoff.

<!-- 0.2.0 final pass: FX in the filter (#614) changes FLT's front page (KIND · MODE · FX · PLACE · FREQ · Q): re-shoot filter.png and part-page.png (no DRV on the map) once it is merged. -->

## 5. Sub-pages and hints

From FLT, press **SEQ** to go on to FILTER MOD. **EDIT** goes back to FLT. (On the last sub-page, SEQ wraps round to the first.)

![The FILTER MOD sub-page, annotated](docs/img/sub-page-hint.png)

1. The page name is the sub-page's: FILTER MOD.
2. The touched cell, QM.
3. Its arc, bipolar here, so it fills from 12 o'clock.
4. **The hint line.** Under the value, the touched cell's combos: keys in bold, what they do beside them. It shows only while that cell is the touched one. Turn hints off at SETTINGS › PERSONALIZE › THEME › HINTS.
5. A source cell (FM3 IN): turn it to pick what modulates FM3.
6. A route amount (QM). An unrouted amount shows a dash.
7. The node, FLT, still lit on the map.
8. Its sub-pages in a row: FILTER (the page itself) and MODULATION, underlined because you are on it.

## 6. The chain map

The strip at the bottom of every Part, mixer and ORBIT page is the map of the chain you are in.

![The chain map, annotated](docs/img/chain-map.png)

1. **A node:** one page of the chain. MINUS / PLUS step to the neighbours.
2. **The line** joins the chain's pages in order, left to right.
3. **The pill:** the page you are on.
4. **Node labels** are the pages' short names (ALG, OSC, DRV, FLT, AMP, MOD).
5. **The sub-page row** under the map: the node's own page first, then its sub-pages, each in a full word. The underlined one is where you are. A long row scrolls: `<` and `>` show that more pages are off the edge (OSC has 18).

<!-- 0.2.0 final pass: the chain map's engine track (#592) is not merged. Describe it here once it is, and re-shoot chain-map.png. -->

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
7. **The hint:** `MIX + B1-6 PART` jumps to that Part's mixer and keeps the page you are on. `MIX + SEQ LEARN` starts MIDI learn for the touched cell.

## 8. The Sound browser

EDIT + B*n*, or EDIT from the mixer. MINUS / PLUS switch Part; SEQ goes back up to the mixer.

![The Sound browser, annotated](docs/img/sound-browser.png)

1. **Tabs.** PROJECT lists the project's own Sounds; LIBRARY lists Sounds saved on the card; FACTORY lists the factory Sounds from the card. A long list comes in pages of 48: `NEXT ›` at the bottom turns to the next page, `‹ PREVIOUS` at the top goes back (LIBRARY says `OLDER ›` and `‹ NEWER`). The 88 factory Sounds fill two pages.
2. Turn **encoder 2** to switch tab.
3. The Part you are loading into.
4. **INIT rows:** a clean Sound per engine, above the project's Sounds.
5. TAPE and DRUM read COMING SOON and don't load yet. <!-- 0.2.0 final pass: TAPE (#476) loads once merged; re-shoot sound-browser.png then. -->
6. The slot number. Turn **encoder 1** to move.
7. The selected row.
8. What the Sound costs in the project's Sound memory.
9. Its engine.
10. **Hints:** EDIT loads, MIX + EDIT saves the Part's Sound, MIX + MINUS clears the slot, each with the memory it takes or frees.
11. How full the project's Sound memory is.

## 9. The MOD matrix

The MOD node's own page (MTX). Its sub-pages are the three envelopes (E1–E3), their speeds (SPD) and three LFOs (L1–L3).

![The MOD matrix, annotated](docs/img/mod-matrix.png)

1. **Columns.** The first four (FLT FREQ, FLT Q, OUT VCA, FX) are always there; after them come the destinations you have primed: on any page, touch a parameter and press MIX + PLUS. Encoder 4 scrolls them sideways. <!-- 0.2.0 final pass: say what the FX column moves (the filter's FX slot, P1) once #614's UI is merged. -->
2. **Rows** are the sources: ENV1–3, LFO1–3, VELO, NOTE (and OP5, OP6 for ALGO's operator taps).
3. **A route**, with its amount.
4. **The cursor.** Encoder 1 moves it up and down, encoder 2 across; encoder 5 sets the amount.
5. The route under the cursor, in full words.
6. Its amount, and what that means in the destination's terms.
7. The hint: MIX + MINUS deletes the route under the cursor.
8. How many routes and destinations are in use.

## 10. SETTINGS

MENU opens it. EDIT opens a row (or runs it), SEQ or MENU goes back. MINUS / PLUS, or any encoder, move the bar.

![SETTINGS, annotated](docs/img/settings.png)

1. **Breadcrumb:** where you are in SETTINGS (`SETTINGS › PROJECT`, and so on).
2. The bar: the selected row.
3. A chevron: this row opens a list.
4. LATER: not built yet. Dimmed rows are skipped.
5. The loaded project's name, then its state (`SAVED`, `* MODIFIED`).
6. What the keys do here.

The top list: PROJECT, PART, ORBIT, MIDI CONFIG, SYSEX DUMP (later), AUDIO ROUTING, PERSONALIZE, SYSTEM. PERSONALIZE holds THEME, SCREENSAVER (OFF, or 5 seconds up to 10 minutes; 5 minutes is the default), CHAIN MAP (PAGES: ROW or STACK) and TEXT SIZE (SIZE: NORMAL or LARGE; LARGE sets the cells, the focus label, the hints, the SETTINGS lists and the Sound names a size up).

## 11. ORBIT, the ring sequencer

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
| ORB | CUSTOM (SEQ) | The overview above. CUSTOM is a circle of the twelve notes for your own scale |
| RING | RHYTHM, VOICE, NOTES (SEQ steps on, EDIT back) | RHYTHM: STEPS, HITS, ROTATE, CHANCE, MUTATE, MUTE. VOICE: GATE, VEL, ACCENT, OCTAVE, RANGE, SNAP. NOTES: MODE, WALK, TARGET (the Part it plays), LEARN, CLEAR, NOTE |
| CHRD | | The progression: SEGS, DEGREE, PLAY |
| SCN | | SCENE (switches on the loop), SAVE (EDIT saves the scene to that slot), SWITCH |

ORBIT follows its own clock, or a MIDI clock from your DAW: SETTINGS › MIDI CONFIG › SYNC.

## 12. First steps

1. Power on, with a MIDI keyboard on the DIN input. Part *n* listens on MIDI channel *n*.
2. Press **B1** and play. Turn the encoders; watch the focus band.
3. Press **PLUS** a few times to walk the chain, then **SEQ** to step into a sub-page and **EDIT** to come back.
4. Press **B1** again for its mixer. It opens on SND, the sends: turn REVERB to send Part 1 to the reverb. MINUS goes to PRT for LEVEL and PAN.
5. Press **EDIT** to reach the Sound browser. Turn encoder 1 up to INIT VA and press **EDIT**: Part 1 is now a VA. Press **B1** to see its pages.
6. PLUS along to MOD. On the matrix, move the cursor to the LFO1 row under the FLT FREQ column (encoders 1 and 2) and turn encoder 5. Press MINUS twice, back to FLT, and play: the faint band under the picture shows the LFO moving the cutoff. To modulate any other parameter, touch it and press **MIX + PLUS** to give it a column first.
7. **Hold MENU** to save the project. Give it a name (encoder 1 moves the cursor, 2 picks a letter) and press **EDIT**.
8. ORBIT: **hold SEQ**, then press **B6**.
