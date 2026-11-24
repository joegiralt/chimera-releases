# The mod matrix and routes

Every connection from a modulator to the sound is a **route**: one cell of the MOD matrix, a source on its row and a destination in its column, with an amount. This chapter covers the matrix page (**MTX** on the chain map, MATRIX in the sub-page row, MOD MATRIX on screen), every source and destination, and every gesture that makes, changes or deletes a route. The modulators are in [Envelopes and LFOs](09-envelopes-and-lfos.md), the filter's route cells and the VCA in [the voice chain](08-voice-chain.md), the wheel, pressure and MPE in [MIDI](14-midi.md).

## MOD: every connection is a route

There is no hidden wiring. When an envelope opens the filter, an LFO adds vibrato or velocity makes a note louder, a route in the matrix says so, with an amount you can see and change. Knobs such as ENV AMT on the filter's MODULATION page are the same matrix cell seen from another place: turn either and both move.

An amount runs from −127 to +127. The source's value times the amount is added to the destination's own setting. The parameter's number on its page never moves; a thin line under its bar shows modulation reaching it.

**Why:** one place holds every connection, so a Sound can always be read, and deleting a route always takes its effect away.

> **Design note:** only a parameter the voice reads afresh every block can be a destination. A knob read once at note-on, or one that only picks a mode, would accept a route and then ignore it. Rather than offer a connection that does nothing, those say NOT MODULATABLE. The matrix only makes promises it keeps.

## MOD: the matrix page

The MOD node's own page is the matrix; **SEQ** steps on to the envelopes, SPEED and the LFOs.

![The MOD MATRIX page, annotated](img/algo_mtx.png)

1. **Header:** MOD MATRIX.
2. **Source rows:** ENV1 to ENV3, LFO1 to LFO3.
3. **A primed column**, PIT PITCH, holding LFO 1's +2 route: the INIT vibrato.
4. **VELO** and **NOTE.**
5. **The hand rows** (WHEEL, PRESS, SLIDE), then ALGO's **OP5** and **OP6**; `×` marks a column a tap can't reach.
6. **Readout:** the route under the cursor in full words (`ENV 1 → FILTER CUTOFF`) …
7. … and the amount in the destination's terms (`0 = 0 oct`).
8. **Hint:** the keys for the cell under the cursor …
9. … and what they do (MIX + MINUS deletes the route).
10. **Count:** routes in use and destinations primed (`5 ROUTES   2 OF 16 DEST`).
11. **Chain map**, on MOD.
12. **Sub-pages:** MTX lit.

The page has no cells of its own; the encoders work the grid:

| Encoder | Does |
|---|---|
| 1 | Cursor up and down the rows |
| 2 | Cursor across the columns |
| 4 | Scrolls the columns (the cursor comes along) |
| 5 | Amount of the cell under the cursor, −127 to +127 |

Five columns show at once; `<` and `>` mean more off screen. Each header has two lines: the block (FLT, OUT, FX, PIT, LF1, E2, OP1 …) over the parameter. A cell with a route is lit and prints its amount, an empty cell is an outline, the cursor's cell is outlined in the accent colour. A route at 0 stays a route (it prints `0`), ready for an amount.

![The matrix scrolled, with eight primed columns](img/mod_matrix_wide.png)

## MOD: the sources

| Row | Readout | What it is | Range |
|---|---|---|---|
| **ENV1**, **ENV2**, **ENV3** | ENV 1 … | The envelope slots | 0 to 1 (LFO-mode slot −1 to 1) |
| **LFO1**, **LFO2**, **LFO3** | LFO 1 … | The LFO slots | −1 to 1 |
| **VELO** | VELOCITY | How hard the note was played | 0 to 1 |
| **NOTE** | NOTE | The key, centred on C4; +127 into the cutoff tracks an octave per octave | −1 to 1 |
| **WHEEL** | MOD WHEEL | CC 1 on the Part's channel | 0 to 1 |
| **PRESS** | PRESSURE | Channel or the note's poly pressure, whichever is higher | 0 to 1 |
| **SLIDE** | SLIDE | CC 74 (MPE slide), on the Part's channel or the note's own | 0 to 1 |
| **OP5**, **OP6** | OP5, OP6 | ALGO only: operators 5 and 6's audio | audio |

WHEEL, PRESS and SLIDE glide, so a fast throw never steps the sound. The channel's wheel and pressure carry across notes and Sound loads; a new note starts with no poly pressure. Under MPE each note has its own PRESS and SLIDE ([MIDI](14-midi.md)).

## MOD: the four fixed columns

These are on every Sound and take no destination slot:

| Column | Readout | What it moves |
|---|---|---|
| **FLT FREQ** | FILTER CUTOFF | The cutoff (FREQ, or CUTOFF on the 2040); a full route moves it ten octaves |
| **FLT Q** | FILTER RESO | The resonance (Q or RES) |
| **OUT VCA** | OUTPUT VCA | The note's amp; the first route replaces the engine's own contour ([AMP: routes into VCA and BASE](08-voice-chain.md#amp-routes-into-vca-and-base)) |
| **FX FX** | FX and the pot's name | The FX slot's first pot: DRIVE, SUSTAIN or FOLD |

An empty VCA cell says what a route would do: `VCA: ROUTES REPLACE CONTOUR`, or `VCA: SUM STARTS AT AMP BASE` once an envelope is routed there.

## MOD: priming a destination

Every other column is one you **prime** from the page where the parameter lives:

1. Touch the parameter (turn its encoder a little).
2. Press **MIX + PLUS**; the focus band says what happened.
3. Go to the matrix (PLUS along the chain to MOD): the new column is last.
4. Put the cursor on a source row under it and turn encoder 5.

| Message | Means |
|---|---|
| **ADDED** | A new column is in the matrix |
| **ALREADY ROUTED** | It is a column already (the fixed four always are) |
| **NOT MODULATABLE** | It can't be a destination, or is dimmed in the current setting |
| **MATRIX FULL** | All 16 destination slots are taken; remove one first |

The message stays until your next input. Some cells prime something else: on a type A envelope, **ATTACK**, **DECAY**, **RELEASE** and **HOLD** prime its TIME and **SUSTAIN** its LEVEL ([Envelopes: modulating an envelope](09-envelopes-and-lfos.md#envelopes-modulating-an-envelope)); on AMP, **VEL** answers for the VCA column.

## MOD: making, changing and deleting a route

- **Make:** cursor on an empty cell, turn encoder 5.
- **Change:** turn encoder 5 on it; amounts glide, so the sound never steps.
- **Delete:** on the matrix, **MIX + MINUS** on it. On another page, **MIX + MINUS** on a route cell (ENV AMT, KEYBOARD, FREQ MOD, RES MOD).
- **Remove a destination:** on its own page, touch it and press **MIX + MINUS**: the column leaves with every route in it, freeing the slot.

On a route the hint reads `MIX + MINUS DELETES THE ROUTE`; on an empty cell, `MIX + PLUS ON A PARAM PRIMES IT`.

## MOD: what an amount means

The readout gives the amount in the destination's terms:

| Destination | Readout | Example |
|---|---|---|
| A cutoff | octaves | `+42 = +3.3 oct` |
| PITCH | semitones (full route 24) | `+32 = +6.0 st` |
| A tuning in cents | cents | `+32 = +25 ct` |
| Anything else | share of the range | `+42 = +33%` |

A route adds to the setting: a 400 Hz cutoff with ENV 1 at +42 opens about three octaves above 400 Hz at the peak, then settles back. The result is held to the parameter's range.

## MOD: route cells on other pages

Each of these knobs is one route, shown in two places:

| Page | Cell | The route |
|---|---|---|
| FILTER MOD | **ENV AMT** | ENV 1 into FLT FREQ |
| FILTER MOD | **KEYBOARD** | NOTE into FLT FREQ (2040: OFF, HALF, FULL) |
| FILTER MOD | **FREQ MOD** | The FREQ SRC jack's source into FLT FREQ |
| FILTER MOD | **RES MOD** | The RES SRC jack's source into FLT Q |

They read in percent (`+50%`) and the focus band names the source (`FREQ MOD LFO1`). **MIX + turn** jumps to 0, then full, in the direction you turn; **MIX + MINUS** deletes. Moving a jack moves its route, amount and all ([FILTER MOD: the filter's modulation page](08-voice-chain.md#filter-mod-the-filters-modulation-page)).

## MOD: the destinations, shared by every engine

On ALGO, MODAL, VA and TAPE:

| Page | Destinations |
|---|---|
| PITCH | **PITCH**, **FINE** |
| FILTER | FREQ / CUTOFF and Q / RES (fixed), SEM's **MODE** knob |
| FILTER MOD | **FEEDBACK** (FDBK) |
| FX | DRIVE / SUSTAIN / FOLD (fixed), TONE, SYMMETRY, LEVEL, VOLUME, **INPUT**, **MIX**, **STABILITY** |
| AMP | VCA (fixed, through **BASE**), **LPG**, **DECAY**, **STRIKE** |
| STEREO | **PAN** |
| ENV1 to ENV3 | type A: TIME, LEVEL; type B: RISE, FALL, SHAPE |
| LFO1 to LFO3 | **DEPTH** (CLASSIC only) |

Not destinations: TYPE, MODE lists, VOICE, FX PLACE, the jacks, STEAL, TIME (glide), SNAP, VEL, WIDTH, the sends, every envelope and LFO choice, and the LFOs' RATE, SHAPE, SYNC and PHASE.

## MOD: the destinations of each engine

| Engine | Its own destinations |
|---|---|
| [ALGO](03-algo.md) | ALGORITHM's **MORPH**, **VOWEL**, **VOL**; each operator's level (LVL), formant (FRM) and BW (operator pages) |
| [MODAL](04-modal.md) | RESONATOR's **BRIGHT**, **DAMP**, **POS**, **STRUCT** |
| [VA](05-va.md) | VA's **WAVE1**, **WAVE2**, **BLEND**, **SUB**, **STABILITY**; OSC1's and OSC2's **SHAPE**, **CRSE**, **FINE**; NOISE's **LEVEL** |
| [TAPE](06-tape.md) | SRC's **START**, **VOL**; DECK's continuous knobs (labels follow the machine); the machine page's **AGE**, **TAPE** |

A column whose parameter does nothing in the current setting (MORPH while ALG A and ALG B match, say) turns grey; its routes stay, waiting.

![A route to MORPH while MORPH is inert](img/mod_matrix_morph_inert.png)

## MOD: ALGO's operator taps

On ALGO, rows **OP5** and **OP6** carry operators 5 and 6's audio. They reach only the four fixed columns, at audio rate; other cells show `×` and the hint reads `OP5: FREQ Q VCA FOLD ONLY`. The operator's own level and envelope are the depth. The same taps are on FILTER JACKS for FREQ SRC and RES SRC.

![The matrix on ALGO, with the operator taps](img/mod_matrix_algo_taps.png)

**Why:** an operator on the cutoff at audio rate gives filter FM's growl and sidebands, while keeping its place in the algorithm.

## MOD: what a new Sound has

| Route | Amount | Why |
|---|---|---|
| ENV 1, LFO 1 and NOTE into FLT FREQ | 0 | Ready: turn ENV AMT or KEYBOARD and they work |
| LFO 1 into PIT PITCH | +2 | Vibrato, about ±0.4 semitone at full depth |
| WHEEL into LF1 DEPTH | +127 | The wheel brings the vibrato in; DEPTH rests at 0 |
| ENV 1 into OUT VCA (VA and TAPE) | +127 | ENV 1 is the level: a VA tone or tape loop has no end of its own |

## MOD: limits

- 11 source rows (13 on ALGO, with OP5 and OP6).
- The four fixed columns plus up to 16 primed destinations.
- Every cell can hold a route.

## MOD: good starting points

- **Velocity brightness:** VELO into FLT FREQ at +30.
- **Expression on pressure:** PRESS into FLT FREQ at +40, and into a primed TONE for more bite as you lean in.
- **Stereo spread:** prime PAN, route NOTE into it at +64: low notes left, high right.
- **Wobble:** LFO 2 on SQR or S&H into FLT Q at +40 for stepped resonance.
