# MIDI, channels, maps and controllers

How Chimera listens and talks over MIDI, on DIN and USB: Part channels, CONTROL CHANNELS, SYNC and program change, MPE, the built-in CCs, learn, MIDI MAP and controller maps, NRPN, SysEx, ECHO and PARAM OUT. The USB port itself is in [USB](17-usb.md); tunings and MIDI Tuning Standard are in [Tuning](15-tuning.md). On SETTINGS pages and on MIDI MAP, **A** to **F** are encoders 1 to 6.

## MIDI: how Chimera listens

Each of the six Parts listens on its own MIDI channel; out of the box Part *n* is on channel *n*, over DIN and USB alike. Parts on one channel layer. On its channel a Part answers:

- notes, velocity, pitch bend, the sustain pedal, the mod wheel, channel and poly pressure;
- the [built-in CCs](#midi-the-built-in-ccs), with no setup;
- the bindings in its [MIDI map](#midi-the-midi-map-page): the Sound's own rows and the Part's controller map;
- every stored cell's fixed [NRPN address](#midi-nrpn-addresses);
- program changes, when PROGRAM is on (see [program change](#midi-program-change-sounds-from-a-sequencer)).

Three more channels can get jobs of their own ([CONTROL CHANNELS](#midi-control-channels-mixer-sequencer-and-auto)), and MPE controllers play in [zones](#midi-mpe-zones).

**Why per Part, and no global CC chart:** each Part can play a different engine with different cells, so a unit-wide chart could only name the cells all engines share. The General MIDI controllers work on every Part, a Sound carries the knobs it was voiced with, and a controller map follows the Part through every Sound and project.

The MIDI settings live in **SETTINGS › MIDI CONFIG**: SYNC, PORT CONFIG (dimmed, marked LATER: not built), CHANNELS, CONTROL CHANNELS, ECHO and MPE. They are kept with SETTINGS on the unit, not in the project (except the Part channels), because they describe your studio, not a song.

## MIDI: the SYNC page

**SETTINGS › MIDI CONFIG › SYNC** (SYN on the settings chain).

![SYNC page, annotated](img/settings_midi_sync.png)

1. Header: `SETTINGS › MIDI › SYNC`.
2. Focused cell, large.
3. Picture band.
4. **SYNC** (A).
5. **PROGRAM** (B).
6. Footer: project name and unsaved mark.
7. Footer: `A-F EDIT · MENU BACK`.

| Cell | Options | Default | What it does |
|---|---|---|---|
| **SYNC** (A) | INT, EXT | EXT | ORBIT's transport follows its own clock (INT) or MIDI clock (EXT) |
| **PROGRAM** (B) | OFF, ON | OFF | A program change loads a Sound ([program change](#midi-program-change-sounds-from-a-sequencer)) |

**Under EXT** a DAW drives [ORBIT](12-orbit.md): Start plays from bar 0, Stop stops, Continue plays on from where ORBIT is. Clock alone never starts ORBIT. **B6** still plays and stops it; the last command wins. If ticks stop for half a second, ORBIT's own clock takes over at the same tempo, so nothing jumps; with no clock at all, ORBIT runs free on B6. **Under INT** clock and transport messages are ignored; notes still play. Switching SYNC carries on without a jump.

**Why EXT by default:** a DAW works at once, and with no clock arriving ORBIT runs free anyway. **Why not in the project:** a project taken to another rig must not bring a clock setting that fights it.

## MIDI: the CHANNELS page

**SETTINGS › MIDI CONFIG › CHANNELS** (CHN on the settings chain) sets each Part's channel.

![CHANNELS page, annotated](img/settings_midi_channels.png)

1. Header: `SETTINGS › MIDI › CHANNELS`.
2. Focused cell, large.
3. Picture band.
4. **P1** (A).
5. **P2** (B).
6. **P3** (C).
7. **P4** (D).
8. **P5** (E).
9. **P6** (F).
10. Footer: project name and unsaved mark.
11. Footer: `A-F EDIT · MENU BACK`.

| Cell | Range | Default | What it does |
|---|---|---|---|
| **P1** to **P6** (A to F) | 1 to 16 | 1 to 6 | The channel Part *n* listens, echoes and sends on |

These are the same values as the channel on the mixer's Part page ([the mixer](11-mixer-and-master-fx.md)) and are saved in the project. Put two Parts on one channel to layer them; put a Part on 1 or 16 to play an [MPE zone](#midi-mpe-zones).

## MIDI: CONTROL CHANNELS, MIXER, SEQUENCER and AUTO

**SETTINGS › MIDI CONFIG › CONTROL CHANNELS** (CTL on the settings chain) gives three channels a job and holds the switch for the built-in CCs.

![CONTROL CHANNELS page, annotated](img/settings_midi_control.png)

1. Header: `SETTINGS › MIDI › CONTROL`.
2. Focused cell, large.
3. Picture band.
4. **MIXER** (A).
5. **SEQ** (B); the readout and focus band call it SEQUENCER.
6. **AUTO** (C).
7. **BUILT-IN** (D).
8. Footer: project name and unsaved mark.
9. Footer: `A-F EDIT · MENU BACK`.

Here AUTO is on Part 1's channel, so it is dimmed:

![CONTROL CHANNELS with a dimmed cell, annotated](img/midi-control.png)

1. Breadcrumb: `SETTINGS › MIDI › CONTROL`.
2. **MIXER** (A), here 14.
3. **SEQ** (B), here 15.
4. **AUTO** (C), here `1`: a Part has it, so it is dimmed and does nothing.
5. The band says who has the channel: `A PART HAS THIS CHANNEL`, `MIXER HAS THIS CHANNEL`, `SEQUENCER HAS THIS CHANNEL` or `MPE HAS THIS CHANNEL`.
6. **BUILT-IN** (D), `ON` or `OFF`.

| Cell | Options | Default | What it does |
|---|---|---|---|
| **MIXER** (A) | OFF, 1 to 16 | OFF | Channel of the [mixer chart](#midi-the-mixer-channel-chart) |
| **SEQUENCER** (B) | OFF, 1 to 16 | OFF | Channel of [ORBIT's chart](#midi-the-sequencer-channel-chart) |
| **AUTO** (C) | OFF, 1 to 16 | OFF | Plays the [Part you are on](#midi-the-auto-channel) |
| **BUILT-IN** (D) | OFF, ON | ON | Each Part answers the [built-in CCs](#midi-the-built-in-ccs) |

A Part's channel always wins over a CONTROL channel; then MIXER wins over SEQUENCER, and SEQUENCER over AUTO. Keep them off MPE zones' channels. The MIXER and SEQUENCER charts are fixed: learn and controller maps do not apply on their channels.

**Why all OFF:** a channel taken by default would steal notes from an existing setup, and MPE uses 2 to 16.

> **Design note:** track channels, an effects channel and an "auto" channel that follows the selected track come straight from Elektron's Digitakt and Digitone, where AUTO CHANNEL and FX CONTROL CH have earned their keep on a lot of stages. Chimera adds a SEQUENCER channel for ORBIT, because a ring sequencer you can't drive from a footswitch is just a very pretty clock.

### MIDI: the AUTO channel

Notes, CCs, bend, pressure and the pedal on AUTO's channel play the Part you are on, exactly as on that Part's channel (layered Parts and its map included). Change Part and AUTO follows; a held note or pedal stays with the Part that started it. **Why:** one keyboard on one channel plays every Part in turn.

### MIDI: the MIXER channel chart

On MIXER's channel these 7-bit CCs move the mixer and master FX, gliding like a knob. Notes are ignored. The FX's [NRPNs](#midi-nrpn-addresses) also work here, for finer steps and their other cells; the [NRPN chart](https://joegiralt.github.io/chimera-releases/guides/nrpn) has the full detail.

| CCs | Moves (in order) |
|---|---|
| 20-25 | PART LEVEL, Parts 1 to 6 |
| 26-31 | PART PAN, Parts 1 to 6 |
| 41-46, 47-52, 53-58 | OUT CHORUS, OUT DELAY, OUT REVERB (the Sound's sends), Parts 1 to 6 |
| 70-72 | CHORUS RATE, DEPTH, MIX |
| 73-83 | DELAY TIME, FDBK, MECHANICS, SAT, TONE, MIX, REV, SIZE, DENSITY, PITCH, TEXTURE |
| 84-94 | REVERB TIME, DAMP, SIZE, MIX, TONE, DIFFUSE, PRE-DLY, SHAPE, SMEAR, RATE, DENSITY |
| 102-108 | COMP THRESH, ATK, REL, MAKEUP, MIX, VOL, PAN |

No reserved CC is used (bank select, data entry and increment/decrement, RPN/NRPN select, sustain).

### MIDI: the SEQUENCER channel chart

On SEQUENCER's channel these CCs drive [ORBIT](12-orbit.md). PLAY/STOP and ON/OFF act as **B6** and **MIX + B*n*** each time the value rises past 63 (127 then 0 is one press). CHANCE, STEPS, KEY and SCALE sweep their values over 0 to 127. A note sets KEY to its pitch class: play an E and the chords move to E.

| CCs | Moves |
|---|---|
| 20 | PLAY/STOP |
| 21-25 | RING1 to RING5 ON/OFF |
| 26-30 | RING1 to RING5 CHANCE |
| 102-106 | RING1 to RING5 STEPS |
| 107, 108 | ORBIT KEY, ORBIT SCALE |

## MIDI: MPE zones

An MPE controller (LinnStrument, Seaboard, Osmose…) sends each note on its own channel, so each finger bends, presses and slides its own note. Chimera plays two zones:

- **lower zone**: master channel 1, notes on 2 and up;
- **upper zone**: master channel 16, notes on 15 and down.

A zone's notes play the Parts on its master channel (Part 1 is on 1 already). Parts on its note channels don't hear them while the zone is on. Each note's bend bends it alone over the zone's bend range; its pressure feeds PRESS and its CC 74 feeds SLIDE in the [mod matrix](10-mod-matrix.md), for that note only. The master channel's bend (over the Part's BEND), wheel, pressure, CC 74, pedal and All Notes Off reach every note.

Most controllers set the zones themselves with RPN 6 (zone on, bend range 48). Or set them on **SETTINGS › MIDI CONFIG › MPE** (MPE on the settings chain):

![MPE page, annotated](img/settings_midi_mpe.png)

1. Header: `SETTINGS › MIDI › MPE`.
2. Focused cell, large.
3. Picture band.
4. **LOWER** (A).
5. **L BEND** (B).
6. **UPPER** (C).
7. **U BEND** (D).
8. Footer: project name and unsaved mark.
9. Footer: `A-F EDIT · MENU BACK`.

| Cell | Options | Default | What it does |
|---|---|---|---|
| **LOWER** (A) | OFF, 1 to 15 | OFF | Lower zone's note channels, counting up from 2 |
| **L BEND** (B) | 0 to 96 semitones | 48 | Lower zone's per-note bend, each way |
| **UPPER** (C) | OFF, 1 to 15 | OFF | Upper zone's note channels, counting down from 15 |
| **U BEND** (D) | 0 to 96 semitones | 48 | Upper zone's per-note bend, each way |

Zones never overlap: growing one shrinks the other. RPN 0 on a note channel sets its zone's bend; on the master channel it sets the Part's BEND. With both OFF, every channel is its own.

**Why the master channel's Parts:** under MPE the master channel names the instrument; the note channels only carry fingers.

## MIDI: the mod wheel, pressure and slide

The [mod matrix](10-mod-matrix.md) has three sources for your hands:

- **WHEEL** (MOD WHEEL in the readout): CC 1, 0 at rest to 1 fully up.
- **PRESS** (PRESSURE in the readout): channel pressure moves every note, poly pressure one note; each note follows the higher.
- **SLIDE**: CC 74, 0 to 1; under MPE each note also has its own, and follows the higher.

They glide, so a fast throw never steps. A new note starts with no poly pressure; wheel and channel pressure carry across notes and loads.

An INIT Sound routes WHEEL into LFO 1's DEPTH (+127) and LFO 1 into PITCH, with DEPTH at 0: wheel up is full vibrato. Moving the wheel is playing, not editing. Factory Sounds that move LFO 1 instead carry a MIDI map row of CC 1 on LFO 1's DEPTH, so there the wheel edits DEPTH and the Sound shows `*`. Wheel, CC 74 and pressure also reach the MIDI map, so a binding on them works beside a route.

## MIDI: the built-in CCs

Every Part answers the General MIDI controllers on its own channel, so a DAW's mixer lanes or a keyboard's sliders work at once:

| CC | Name | Moves |
|---|---|---|
| 7 | Volume | The Part's LEVEL |
| 10 | Pan | The Part's PAN |
| 11 | Expression | A swell under LEVEL (below) |
| 71 | Resonance | The filter's RESO |
| 72 | Release | Shifts release: ALGO every operator's RR, VA and TAPE ENV 1's REL, MODAL DAMP |
| 73 | Attack | Shifts attack: ALGO every operator's AR, VA and TAPE ENV 1's ATK, MODAL nothing |
| 74 | Brightness | The filter's CUTOFF |
| 91 | Reverb | The Sound's REVERB send |
| 93 | Chorus | The Sound's CHORUS send |
| 94 | Delay | The Sound's DELAY send |

- Each glides over the cell's whole range, except ATTACK and RELEASE.
- **ATTACK and RELEASE** shift from the Sound's own values: 64 is the Sound, above is longer, below shorter. Each cell moves from where it is, so ALGO keeps its operators' envelope shapes (64 to 127 is 15 AR steps slower and 7 RR steps longer; AR never reaches 0). VA and TAPE move 1/127 of the range a step. The page shows the shifted values; saving keeps them, and 64 is then the saved Sound. A Sound load or Reset All Controllers (CC 121) returns to 64.
- **Expression** turns the Part down from its LEVEL, sends included: 127 as set, 64 about −12 dB, 0 silent. It is never saved, leaves no `*`, and resets to 127 on a project load, NEW, or Reset All Controllers.
- **Your bindings win:** a CC bound by the Sound or the controller map does only that.
- **Under MPE**, CC 74 on a master channel is SLIDE only; on note channels every CC is the note's.
- **AUTO** reaches the Part you are on; MIXER's and SEQUENCER's channels never reach these.

Set **BUILT-IN** to OFF on [CONTROL CHANNELS](#midi-control-channels-mixer-sequencer-and-auto) when a controller sends CC 7 or 74 for something else.

**Why these numbers:** they are General MIDI's and the sound-controller recommendation's, so GM gear reaches the same controls with no setup.

## MIDI: what a binding can drive

A binding ties one control to one cell:

- **the Sound's cells**: engine, filter, envelopes, LFOs, FX slot and output, not the jacks;
- **the Part's LEVEL and PAN**;
- **the master FX's continuous cells** (CHORUS, DELAY, REVERB, MASTER), not TYPE, MODE or the delay's SYNC. The delay's TIME is two cells (ms under FREE, note under SYNC), each bound separately;
- **ORBIT's ring amounts**: HITS, ROTATE, CHANCE, MUTATE, GATE, VEL, ACCENT and OCTAVE (not STEPS, MUTE, choices or the chord ring).

MOD MATRIX routes and DRUM pad cells can't be bound. A binding to the master FX or ORBIT lives in the map of the Part you learned it on and listens on that Part's channel; if two Parts bind one cell, the last message wins. A ring amount moves the playing scene and its saved slot; HITS and ROTATE span the ring as it is (0 to STEPS, or STEPS − 1).

A control can be a **CC** (`CC 74`), a **14-bit CC pair** (`CC 2+34`, CC 1 to 31 with CC *n* + 32), an **NRPN** (`NRPN 10:3`), **PRESSURE** (channel aftertouch), or a **SysEx message** (`SYSEX 9`, see [SysEx controllers](#midi-sysex-controllers)).

## MIDI: learn

1. Touch the cell (turn its encoder a notch) on a Part's page, a master FX page or an ORBIT page.
2. Hold **MIX** and press **SEQ**. The value line reads `MOVE A KNOB · CUTOFF`.
3. Move the control. The binding is written at once.
4. Turn it right, then left: Chimera guesses its kind and shows the guess.
5. Press **MIX + SEQ** again to keep it. A page change, a nav key or one of Chimera's own encoders also ends learn.

While learning, the control moves nothing. The row goes into the Sound's own rows.

![Learn, sure of its guess, annotated](img/midi-learn.png)

1. The binding: control heard and cell driven (`CC 21 → FINE`).
2. The guess: `TURN IT RIGHT, THEN LEFT` until sure, then the kind (`RELATIVE · TWOS COMPLEMENT`).
3. The hint `MIX + SEQ  DONE`: press it to finish.

Guesses are `ABSOLUTE`, the relative encodings (`RELATIVE · TWOS COMPLEMENT`, `RELATIVE · BINARY OFFSET`…), `BUTTON`, `14-BIT CC` and `INC DEC`. Fix a wrong guess with **E** on MIDI MAP. Learn refuses with:

- `NOT MAPPABLE`: the cell can't be bound;
- `CC 21 ON CH 3, PART ON CH 1`: wrong channel;
- `CC 64 RESERVED`: sustain, bank select, data entry, NRPN/RPN select or channel mode messages;
- `MAP FULL`: the Sound already holds 16 rows.

A relative encoder or 14-bit control learns with ECHO on, so LED rings follow; others learn with ECHO off.

**Why learn guesses:** endless encoders use four relative codes and rarely say which; right-then-left tells them apart.

## MIDI: SysEx controllers

Old programmers made to edit another synth by SysEx can drive Chimera's cells. Learn as usual (**MIX + SEQ**), then move the box's knob slowly: Chimera compares two messages to find the value byte. Keep turning past a coarse step and it also finds a second (14-bit) byte. Press **MIX + SEQ** to finish.

The message then sweeps the cell's full range, gliding. Other addresses from the box move nothing. A SysEx binding listens on every Part whose Sound holds it, whatever the channel. On MIDI MAP it reads `SYSEX` and the value's byte, counting F0 as 1 (`SYSEX 9`); it is always JUMP with no ECHO. Messages up to 32 bytes are heard; a value split into two nibbles reads as 14-bit and won't reach the full range.

> **Design note:** learn finds the value by diffing two messages from the same knob and skipping a Roland-style checksum at the end, so a programmer built for a synth from decades ago can drive a filter it has never heard of. The box is none the wiser, and frankly, it's had a long career and deserves a gentle retirement gig.

## MIDI: the MIDI MAP page

**SETTINGS › PART › MIDI MAP** (MAP in the editor's schemas) lists the current Part's bindings: first **`CONTROLLER`** (the Part's [controller map](#midi-controller-maps) or `NONE`), then the map's rows (`IN <map name>`), then the Sound's own rows (up to 16), then **`+ NEW BINDING`** ([pointing](#midi-adding-a-row-by-pointing)). Empty, it reads `NO CCS · MIX+SEQ ON A CELL`.

Here Part 1 plays the map `EC4`, two rows above its Sound's rows:

![The MIDI MAP page, annotated](img/midi-map.png)

1. Breadcrumb: the Part.
2. `CONTROLLER`: the first row.
3. The map's name, or `NONE`.
4. The bar: control, then cell (`CC 30` `MORPH`). **A** moves it. Master FX and ORBIT cells name their block (`REVERB MIX`, `RING 1 CHANCE`).
5. INPUT kind, short (`JUMP`).
6. A dimmed row does nothing now: the Sound binds the same control, or the cell is not in the Part's engine (`- STRUCT`).
7. The Sound's own rows.
8. The bar's binding spelled out; for a relative kind, the bytes for one step each way.
9. `IN EC4`: the row belongs to the map.
10. **C MIN**, **D MAX** (0 to 255; MAX below MIN reverses), **F ECHO**.
11. **B CONTROL**, **E INPUT** (and **EDIT TARGET** on current firmware).
12. Footer: `A MOVE · MIX+MINUS DELETES`.

### MIDI: the keys on a MIDI MAP row

| Key | On a binding row | On `CONTROLLER` |
|---|---|---|
| **A** | Moves the bar | Moves the bar |
| **B** | CONTROL: CC number (NRPN, PRESSURE, SysEx are `B FIXED`: learn again) | PICK: maps on the card and `NONE` |
| **C** / **D** | MIN / MAX, 0 to 255 | |
| **E** | INPUT (below) | |
| **F** | ECHO, OFF or ON | |
| **EDIT** | TARGET: point at another cell | SAVE ROWS TO MAP ([saving](#midi-saving-a-controller-map)) |
| **MIX + C** / **MIX + D** | FINE: one place a frame | |
| **MIX + MINUS** | DELETE (asks `DELETE CC 74?`) | DELETE the map from the card (asks `DELETE MAP?`) |
| **MIX + PLUS** | | [KEEP MAP](#midi-keep-map-keeping-the-parts-rows) on or off |
| **MIX + EDIT** | | RENAME the map |

The hint line names only the keys a row answers (`B CONTROL  E INPUT  EDIT TARGET`; with **MIX** held, `MIX+C/D FINE  MIX+MINUS DELETE`; on `CONTROLLER`, `B PICK  EDIT SAVE ROWS TO MAP`, or with a map picked `EDIT SAVE  MIX+MINUS DELETE` and `MIX+EDIT RENAME`).

Editing a Sound row edits the Sound (`*`); editing a map row changes the map on the card, not the Sound.

**Why 256 places and FINE:** 256 is already twice a CC's resolution; FINE exists because an accelerated turn skips places.

### MIDI: the INPUT response kinds

| Row | Spelled out | Line below | For |
|---|---|---|---|
| `JUMP` | `ABSOLUTE · JUMPS TO THE KNOB` | | Knob or fader: the cell glides to it at once. Default |
| `PICKUP` | `ABSOLUTE · WAITS TO PICK UP` | | Knob or fader: nothing moves until it reaches the value |
| `SCALE` | `ABSOLUTE · SCALES TO MEET` | | Knob or fader: moves at once, meeting the knob at the ends |
| `TWOS COMP` | `RELATIVE · TWOS COMPLEMENT` | `+1 = 1  -1 = 127` | Endless encoder |
| `OFFSET` | `RELATIVE · BINARY OFFSET` | `+1 = 65  -1 = 63` | Endless encoder |
| `SIGNED` | `RELATIVE · SIGNED BIT` | `+1 = 1  -1 = 65` | Endless encoder |
| `SIGNED 2` | `RELATIVE · SIGNED BIT 2` | `+1 = 65  -1 = 1` | Endless encoder |
| `INC DEC` | `RELATIVE · NRPN` | `INCREMENT AND DECREMENT` | NRPN data increment/decrement |
| `MOMENTARY` | `BUTTON · HELD IS MAX` | | Button: held MAX, released MIN |
| `TOGGLE` | `BUTTON · EACH PRESS FLIPS` | | Button: each press flips MIN/MAX |

| Control | Kinds (the schema spells TWOS-COMP, SIGNED-2, INC-DEC) |
|---|---|
| CC | all but INC DEC |
| 14-bit CC pair (CC14), PRESSURE (PRESS) | JUMP, PICKUP, SCALE |
| NRPN | all |
| SysEx (SYSEX) | JUMP |

A relative encoder moves the cell one step a detent, like Chimera's own encoders.

### MIDI: pickup

![The pickup hint, annotated](img/midi-pickup.png)

1. The touched cell, bound to a PICKUP knob sitting below its value.
2. `MOVE THE KNOB UP TO PICK UP` (or `DOWN`); it clears when the knob reaches the value. Shown while HINTS is on (SETTINGS › PERSONALIZE › THEME).

**Why PICKUP:** after a Sound load knob and cell rarely agree. JUMP moves at once (smoothly), PICKUP waits for you, SCALE moves at once and meets at the ends.

### MIDI: adding a row by pointing

Add a binding without the controller, choosing its CC afterwards:

![Pointing at a cell for a new binding](img/midi_map_pointing.png)

1. On MIDI MAP, put the bar on `+ NEW BINDING` (`POINT AT A CELL`, `ITS CC IS SET ON ITS ROW`) and press **EDIT**.
2. Chimera opens the page you came from. The value line reads `NEW BINDING`, the hint `A-F POINT  MENU CANCELS`.
3. Walk the pages with **EDIT** (Part, mixer, FX, ORBIT). Turn the wanted cell's encoder: it points, changing nothing. The hint becomes `EDIT BINDS  MENU CANCELS`.
4. Press **EDIT**. MIDI MAP returns, bar on the new row.
5. Set the CC with **B**, then MIN, MAX, INPUT, ECHO.

The row joins the picked controller map, or the Sound under `NONE`. Its CC is the first free one that is not CC 1, a built-in CC, or on another of the Part's rows. **EDIT** on an existing row re-points it (`NEW TARGET`), keeping everything but the cell.

While pointing: an unbindable cell reads `NOT MAPPABLE  MENU CANCELS`, a bound one `ALREADY BOUND  MENU CANCELS`, and **EDIT** walks on. **MENU** (tap or hold, no quick save) cancels back to MIDI MAP. **MIX + SEQ** does nothing. A Sound load, a Part change or opening SETTINGS ends pointing. A failed bind says `BINDING GONE` or `NO FREE CC`. A full list dims `+ NEW BINDING` with `MAP FULL` and `DELETE A ROW FIRST`.

**Why EDIT binds only on the hint:** EDIT also walks pages, so it binds only after you turned a cell on the page in view.

## MIDI: controller maps

A controller map is a named, flat list of up to 90 bindings on the card (FADERFOX, CIRKLON, LCXL3…), apart from any Sound or project. A Part picks one on MIDI MAP's first row, so a controller is set up once for every project.

- **Any map plays on any engine.** Rows for cells the engine lacks are dimmed until the Part switches engine.
- **Parts can share a map**; a change reaches all of them.
- **The Sound's own rows win** on a shared control; the map's row dims.
- **The project remembers each Part's map by name**, and it stays through Sound loads.
- **A Part plays 16 of the map's rows at a time:** ECHO rows take the slots first, then rows in order. A moved control without a slot takes the least recently heard slot (a PICKUP row then waits again).

**Why on the card, not in the project:** a controller belongs to the studio, not the song; one map serves every project.

### MIDI: picking a controller map

On **SETTINGS › PART › MIDI MAP**, with the bar on `CONTROLLER`, turn **B** through the maps and `NONE`. The Part plays the map at once. Up to 16 maps are listed (the five factory maps and 11 of yours); with more, `CARD HOLDS MORE: 16 SHOWN` shows.

### MIDI: saving a controller map

1. Learn controls on the Part (**MIX + SEQ**); they become Sound rows.
2. On `CONTROLLER`, press **EDIT** (`SAVE ROWS TO MAP`). NAMING opens on the map's name (`CONTROLLER` if none).
3. Keep the name to update, or type a new one, and press **EDIT**.

The Sound's rows move into the map, replacing rows on the same control or cell, after the existing rows. The Part plays the saved map and its Sound shows `*` (its rows are now empty). A new name copies the current map first. Over 90 rows is refused with `MAP FULL`; a name whose files hold another map with `NAME TAKEN`. To cover another engine, switch engine, learn and save under the same name.

### MIDI: KEEP MAP, keeping the Part's rows

The Sound's own rows change with each Sound load. To browse Sounds with the rows you learned, press **MIX + PLUS** on `CONTROLLER` (`MIX + PLUS KEEP MAP ON`). Each loaded Sound then plays the Part's rows, with no `*`. Rows learned or changed while on show `*` once and are kept (REPLACE keeps them; so does a revert). Press again for `MIX + PLUS KEEP MAP OFF`: if the rows differ from the Sound's, it shows `*` (save to keep, revert to drop). KEEP MAP is not saved; it is off after a project load or power-on.

**Why kept rows are not an edit:** otherwise every load would stop at "save first?".

> **Design note:** this is a DAW's control-surface lock, so the knobs stay yours while presets change underneath. It is also the cure for the classic "I spent ten minutes mapping, loaded one preset, and now I'm sad" experience.

### MIDI: changing and deleting map rows

- **Change** a map row with **B** to **F**: it changes for every Part on the map and is written to the card a moment later. Or learn the same control on the Part (hiding the map row) and save.
- **Re-point** it with **EDIT** ([pointing](#midi-adding-a-row-by-pointing)).
- **Delete** it with **MIX + MINUS**; the card follows.

If the map left the card since it was read, Chimera says `FILE NOT FOUND` and writes nothing.

### MIDI: renaming and deleting a controller map

On `CONTROLLER` with a map picked: **MIX + EDIT** opens NAMING (`RENAME MAP`); every Part follows the new name, and a taken name is refused (`NAME TAKEN`). **MIX + MINUS** asks `DELETE MAP?` and deletes it; Parts that played it play `NONE`.

### MIDI: controller maps on the card

Maps live in `/CHIMERA/MAPS`, a file pair each (`FADE3C04.A` and `.B`: up to four letters of the name plus four characters made from the whole name). The full name is inside, so MIDI MAP lists it by name.

The card is inside the case. Copy maps with the bootloader's SD card access (hold **MENU** at power-on, then button 3) or with `chimera-usb.py` over the USB console ([USB](17-usb.md), [the card](16-card-sounds-library.md)):

```
python3 chimera-usb.py ls maps
python3 chimera-usb.py get /CHIMERA/MAPS/FADE3C04 faderfox.map
python3 chimera-usb.py put faderfox.map /CHIMERA/MAPS/
```

`get` never overwrites a local file. `put` replaces a map of the same name, and Parts playing it play the new one at once.

### MIDI: the factory maps

The factory maps are **ALGO**, **MODAL**, **VA**, **TAPE** and **DRUM**, one per engine. Set a box of knobs to these CCs on the Part's channel and pick the map. Every row is `JUMP` with ECHO off. The CCs avoid the built-in CCs, CC 1, 2, 4, 64 to 69, 84, and CC 16 to 19 (used by factory Sounds' own rows); CUTOFF, RESONANCE and the sends are left to the built-in CCs. To change one, save it under a new name first: reinstalling the factory set restores the originals.

Every map shares these rows (in order within each range):

| CCs | Cells |
|---|---|
| 3, 9, 14, 15, 20-24 | ENV 1 ATK, DEC, SUS, REL, RISE, FALL, SHAPE, TIME, LEVEL |
| 25-31, 85, 86 | ENV 2, the same nine |
| 87-90, 102 | LFO 1 RATE, DEPTH, OFST, RISE, FALL |
| 103-107 / 108-112 | LFO 2 / LFO 3, the same five |
| 113-116 | FILTER INPUT LEVEL, STAB, FEEDBACK, SEM MODE |
| 117-119, 5 | FX AMOUNT, SHAPE, LEVEL, MIX |
| 8, 12 | VOICE FINE, TIME |
| 13, 33-37, 39, 40 | OUTPUT LEVEL, PAN, VCA, VEL, LPG, DECAY, STRIKE, WIDTH |

Then each engine's own cells from CC 41 up (the [NRPN chart](https://joegiralt.github.io/chimera-releases/guides/nrpn) has the full cell lists):

| Map (file, rows) | Own rows |
|---|---|
| ALGO (`ALGODE32.A`, 86) | ALG A, ALG B, MORPH, TRNSP, VOWEL; each operator's WAVE, CRSE, FINE, DETUN, LEVEL |
| MODAL (`MODA3D52.A`, 77) | MODEL, EXCITE, BRIGHT, POS, BODY, ENS.D, ENS.R, ENS.M, DAMP, STRUCT, COUPLE, HALO, MODES, FORCE, SPEED, COLOR, BURST; ENV 3 |
| VA (`VA2B02.A`, 74) | WAVE1, WAVE2, MODE, AMNT, SUB, STAB, CRSE1, FINE1, SHAPE1, CRSE2, FINE2, SHAPE2, KIND, NOISE; ENV 3 |
| TAPE (`TAPE2C4E.A`, 84) | MODEL, START, END, POSITION, MOTION, TAPE, AGE, SIZE, XFADE, DRAG, TYPE, ROOT, PERIOD, SLICE, WOW, DIRECTION, RETRIG, TRON, DRIFT, KEY, LENGTH, GRAIN, SPRAY, FINISH; ENV 3 |
| DRUM (`DRUME1A7.A`, 86) | The master FX (pads have no mappable cells): CHORUS, DELAY (with NOTE), REVERB (with DUCK, RELEASE) and COMP cells |

TAPE's own rows drive whichever machine's cell sits in that slot (POSITION is WALK POSITION, STRCH POSITION, SCRUB FINGER or WAVE FRAME, and so on).

## MIDI: NRPN addresses

Every stored cell has a fixed NRPN address that works on the Part's channel with no binding, gliding like a knob. Addresses never change between firmwares, so a Cirklon instrument, Hapax definition or DAW lane made once keeps working.

- **Message:** CC 99 (address MSB), CC 98 (LSB), CC 6 (value MSB), and CC 38 (value LSB) for 14 bits.
- **Address:** MSB is the block (engine, operator, filter, envelope, master effect…), LSB the cell; written MSB:LSB and as MSB × 128 + LSB (`2:2 (258)` is ALGO's MORPH).
- **Value:** continuous cells take 0 to 16383 (CC 6 alone also spans the range); stepped cells a step count in CC 6; choices a fixed code in CC 6, not their on-screen order.
- Engine cells move only on a Part playing that engine; master FX NRPNs work on any Part's channel; ORBIT ring cells move the playing scene. Unlisted addresses do nothing. A map binding on the same NRPN wins.

The full list is the [NRPN chart](https://joegiralt.github.io/chimera-releases/guides/nrpn); each release also carries it as `NRPN.json` for building templates.

**Why frozen:** an address comes from the cell's identity in the file format, not its place on a page.

## MIDI: program change, Sounds from a sequencer

With **PROGRAM** ON ([SYNC](#midi-the-sync-page)), a program change loads a Sound into every Part on its channel. With it OFF, program changes and bank selects are ignored.

| Bank | Program 0 to 127 loads |
|---|---|
| 0 (default) | The project's Sound slots: SLOT 01 to SLOT 128 |
| 1 | An INIT Sound: 0 ALGO, 1 MODAL, 2 TAPE, 3 VA, 4 DRUM |

Select the bank with CC 0 (or CC 32 alone, or CC 0 at 0 then CC 32); it stays until the next bank select. Empty slots, programs past the last INIT, and bank 2 up do nothing. LIBRARY and FACTORY Sounds must be saved into the project first.

- **A Part already on that Sound** keeps it, edits and all (a `◦` Part, whose slot was saved over, reloads), so repeated program changes cost nothing.
- **A Part with edits** (`*`) loads without asking; its edits wait, and a program change back brings them back, still `*`. One set is kept per Part, dropped by any other load or a project load.
- **Following notes** wait up to 40 ms for the new Sound.
- **While busy** (card load, a prompt, learn or the Sound rung open), the last program change per channel waits.
- **On the Part you are editing**, the pages follow the new engine.

**Why only the project's slots:** LIBRARY and FACTORY order shifts as files are added; slots stay put.

## MIDI: ECHO, values back to the controller

**SETTINGS › MIDI CONFIG › ECHO** (ECH on the settings chain) switches everything Chimera sends.

![ECHO page, annotated](img/settings_midi_echo.png)

1. Header: `SETTINGS › MIDI › ECHO`.
2. Focused cell, large.
3. Its glyph: a switch.
4. Picture band.
5. **ECHO** (A).
6. **PARAM OUT** (B).
7. Footer: project name and unsaved mark.
8. Footer: `A-F EDIT · MENU BACK`.

| Cell | Options | Default | What it does |
|---|---|---|---|
| **ECHO** (A) | OFF, ON | ON | All MIDI OUT: value echo, identity replies, the dump, PARAM OUT |
| **PARAM OUT** (B) | OFF, NRPN | OFF | Each cell you turn goes out as its NRPN |

With ECHO on, each binding with its own ECHO on sends its cell's value back on its control (CC, both 14-bit halves, NRPN, a button's 0/127, or a relative encoder's absolute value for LED rings) whenever the value changes, by any cause. A binding's echo is held for a quarter second after its control last moved, so it never fights your hand, and an echo looped back through MIDI thru in that time is not taken as a turn. Part changes, Sound, map and project loads send all values at once. Of a map's rows, those holding slots echo. On a shared channel the lower Part echoes.

### MIDI: PARAM OUT, recording your edits

At NRPN, each cell you turn goes out of MIDI OUT and USB as its [NRPN](#midi-nrpn-addresses) on the Part's channel, for a DAW to record and play back. Cells without an NRPN (jacks, routes, SETTINGS) send nothing.

- Only your hands send: MIDI input, loads, ORBIT and modulation never go out, so a thru loop never feeds back.
- A fast turn sends the latest value as room allows, never a backlog (DIN carries about 300 NRPNs a second).
- Continuous cells send 14 bits, stepped cells and choices the MSB only.
- Master FX and ORBIT cells send on the channel of the Part you are on.

**Why NRPN:** the frozen addresses replay into the same cell on any Chimera, with no map.

### MIDI: the parameter dump

An editor or LED-ring controller can ask what a Part's Sound is set to. **Request:** `F0 7D 43 48 01 pp F7`.

| `pp` | Answers with |
|---|---|
| `00` to `05` | Part 1 to 6 |
| `10` to `1F` | The (lowest) Part on channel 1 to 16 |
| `7F` | The Part you are editing |

**Answer**, from the port that asked, on the Part's channel: one NRPN per cell the engine reads, in NRPN chart order, then `F0 7D 43 48 02 pp F7`. DIN takes about 0.5 s for ALGO, 0.3 s for others; USB under 0.1 s. No answer with ECHO off or no such Part; a Sound load restarts it. Only cell values: no routes, map, name, LEVEL, PAN or project effects.

## MIDI: what else Chimera answers

- **Pitch bend** over the Part's BEND; **RPN 0** sets BEND (0 to 24); **RPN 6** on 1 or 16 sets an MPE zone.
- **Sustain** (CC 64) holds notes.
- **Clock, Start, Continue, Stop** drive ORBIT under SYNC EXT.
- **Identity request** (`F0 7E 7F 06 01 F7`): identity and version, while ECHO is on.
- **All Notes Off** (CC 123) and CC 124 to 127 release the channel's notes; **All Sound Off** (CC 120) silences them; **Reset All Controllers** (CC 121) resets pedal, bend, wheel, pressure, CC 74, expression and the ATTACK/RELEASE shifts.
- **System Reset** (`FF`) stops every sound and resets every controller.
- **Active Sensing:** once sent, a pulled cable releases held notes within a third of a second (`DIN MIDI LOST`); a USB host that resets or sleeps does the same (`USB MIDI LOST`).
- **MIDI Tuning Standard** retunes Parts set to MTS ([Tuning](15-tuning.md)).

While SETTINGS › SYSTEM › ABOUT reads `NEEDS UPDATE`, MIDI in is ignored, MIDI MAP reads `NEEDS UPDATE`, and **MIX + SEQ** says so instead of learning ([Updating](19-updating-and-recovery.md)).

## MIDI: over USB

Over USB, Chimera is one MIDI port, **Chimera**, both ways, carrying all 16 channels exactly as DIN does; DIN and USB work side by side. Why one port and not one per Part is in [USB MIDI](17-usb.md#usb-midi).
