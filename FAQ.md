# Chimera FAQ

Short answers for alpha testers. New to the controls? Read the [quick start](QUICK-START.md) first. Labels below are as they appear on screen.

**Contents:** [Sounds](#sounds) · [Projects](#projects) · [Modulation](#modulation) · [Engines](#engines) · [TAPE](#tape) · [MIDI and playing](#midi-and-playing) · [Effects](#effects) · [The screen](#the-screen) · [Firmware and bugs](#firmware-and-bugs)

## Sounds

**How do I load a Sound?**
Hold **EDIT** and press **B*n*** to open the Sound browser for Part *n*. Turn **encoder 1** to the Sound and press **EDIT**. Turn **encoder 2** to switch between the PROJECT tab (the project's own Sounds), the LIBRARY tab (Sounds saved on the card) and the FACTORY tab (the factory Sounds). If the Part has edits you haven't saved, it asks first.

**How do I start a new Sound from INIT?**
In the Sound browser, turn encoder 1 up past Sound 01 to the INIT rows (INIT ALGO, INIT MODAL, INIT VA, INIT TAPE) and press **EDIT**. Or, to reset the Part to INIT of its engine: SETTINGS › PART › CLEAR.

**How do I save a Sound?**
In the browser's PROJECT tab, press **MIX + EDIT**: it saves the Part's Sound over its own slot, or to a new slot if it has none. The hint shows how much memory it takes. SETTINGS › PART › SAVE TO PROJ gives you the choice (OVER SLOT, TO NEW SLOT). Sounds saved this way live in the project, so then **hold MENU** to save the project to the card.

**How do I keep a Sound for other projects?**
SETTINGS › PART › SAVE TO LIBRARY, or **MIX + EDIT** on the browser's LIBRARY tab. It asks for a name and writes the Sound to the card.

**How do I clear a Sound slot?**
In the browser's PROJECT tab, select it and press **MIX + MINUS**. It asks before clearing.

**Where are the factory Sounds?**
Unzip `factory-v1.zip` from the releases page and copy what's in its **CHIMERA** folder onto the card over USB (hold MENU at power-on, then button 3), as in the [README](README.md#step-3-copy-the-files-to-the-card). It holds the Sounds, the sources the TAPE Sounds play and four demo projects. Then **EDIT + B1** and turn **encoder 2** to the FACTORY tab. Its 128 Sounds (ALGO, MODAL, VA and TAPE) fill three pages: turn encoder 1 down to `NEXT ›` and press **EDIT** for the next, and `‹ PREVIOUS` at the top goes back. Every new project starts with the factory Sounds in its PROJECT tab: TX BASS, TX EPIANO, TX BRASS, TX BELL, SAW LEAD, SQR BASS, MORPH PAD, MORPH KEYS, and the formant Sounds CHOIR, TALK BASS, BREATH and VOX. Parts 1 to 5 start on some of them. To get them back, start a new project: SETTINGS › PROJECT › LOAD PROJECT › + CREATE NEW.

**How do I add Sounds from my computer?**
Use SD card access (hold MENU at power-on, then button 3) and copy the Sound files into the card's `CHIMERA/SOUNDS` folder. They show up on the LIBRARY tab.

**How do I rename a Sound, or reload it from the project?**
SETTINGS › PART: RENAME, CLEAR, SAVE TO PROJ, RELOAD FROM PROJ, LIVE SNAP, SAVE TO LIBRARY.

## Projects

**How do I save the project?**
**Hold MENU**, from anywhere. A new project asks for a name first. SETTINGS › PROJECT › SAVE PROJECT AS saves a copy under a new name.

**How do I load one, or start a new one?**
SETTINGS › PROJECT › LOAD PROJECT, select it, **EDIT**. The **+ CREATE NEW** row starts a fresh project. If the current one has unsaved changes, it asks first.

**How do I rename, copy or delete a project?**
SETTINGS › PROJECT › MANAGE PROJECTS. Select a project, then EDIT for its commands: LOAD FROM, SAVE TO, RENAME, CLEAR, DELETE, PROTECT.

**Where do projects live?**
On the SD card, in `/CHIMERA/PROJECTS/`. Library Sounds are in `/CHIMERA/SOUNDS/`. Chimera reads and writes only inside `/CHIMERA/`; your stock PreenFM3 files are left alone.

**How do I name things?**
On the naming screen: encoder 1 moves the cursor, 2 picks a letter, 3 a digit, space or dash, 4 switches case, 5 deletes. **EDIT** saves, **MENU** or **SEQ** cancels.

## Modulation

**How do I route an LFO or an envelope to a parameter?**
1. On any page, touch the parameter (turn its encoder a little) and press **MIX + PLUS**. The focus band says ADDED: it is now a column in the matrix.
2. Go to the Part's MOD page (PLUS along the chain). Its first page is the matrix.
3. Encoder 1 moves the cursor to a source row (ENV1–3, LFO1–3, VELO, NOTE), encoder 2 to the column, and **encoder 5** sets the amount. Under the grid, the route reads in words, with what the amount means (for example `+42 = +3.3 oct`).

Other messages you may see after MIX + PLUS: ALREADY ROUTED, NOT MODULATABLE, MATRIX FULL.

**How do I remove a route?**
On the matrix, put the cursor on it and press **MIX + MINUS**. On a parameter page, **MIX + MINUS** takes the touched parameter out of the matrix altogether.

**Where are the envelopes and LFOs?**
Under MOD: press **SEQ** to step on from the matrix to ENV1, ENV2, ENV3 (envelopes), SPEED (their speeds), LFO1, LFO2, LFO3. Each LFO page draws the LFO itself, one cycle at the values you set.

**What about FREQ MOD and RES MOD on the filter?**
They are routes themselves. On FLT › JACKS, FREQ SRC and RES SRC pick the sources; on FLT › MODULATION, FREQ MOD and RES MOD set how much. The focus band names the source (`FREQ MOD LFO1`). **MIX + MINUS** on an amount deletes the route.

## Engines

**How do I change a Part's engine?**
Load a Sound with another engine: the INIT row of that engine is a clean start. The Part's pages change to match.

**What do the engines do?**

| Engine | What it is | Its chain |
|---|---|---|
| ALGO | Six-operator phase modulation (FM). Two algorithms, ALG A and ALG B, with MORPH blending between them | ALG · OSC · FLT · AMP · MOD |
| MODAL | Physical models: struck, plucked and bowed resonators. MODEL picks STRING, BANK, BOWED or SYMP (sympathetic strings) | EXC · RES · FLT · AMP · MOD |
| VA | Two variable-wave oscillators combined by MODE, with a SUB, a NOISE source and STABILITY drift | VA · FLT · AMP · MOD |
| TAPE | Plays sound sources from the card through a machine: WALK, STRETCH, SCRUB or WAVE | SRC · DECK · FLT · AMP · MOD |

**What do VA's MODEs do?**
MODE picks how OSC 1 and OSC 2 combine, and BLEND sets how far. The words at BLEND's two ends say what you get, and MODE's glyph draws the result. The MODE cell reads SOFT for SOFT SYNC; the focus band spells every MODE in full.

| MODE | What it does | BLEND from … to … |
|---|---|---|
| MIX | The two oscillators mixed | 1 · 2 |
| SYNC | OSC 2 restarts at each of OSC 1's cycles (hard sync) | 1 · 2 |
| SOFT SYNC | OSC 2 turns round at each of OSC 1's cycles instead of restarting. Softer than SYNC with sine and triangle waves | 1 · 2 |
| RING | Ring modulation: the two multiplied | MIX · RING |
| AM | OSC 2 swells and dips OSC 1's level without turning it upside down; at audio rates it adds sidebands and keeps OSC 1's note. In the top third of BLEND it runs on into RING | CLEAN · RING |
| FM | OSC 2 bends OSC 1's speed, deep enough to run it backwards (through-zero FM). You hear OSC 1; OSC 2 is the modulator | CLEAN · DEEP |
| PHASE | OSC 2 bends OSC 1's phase, as in phase distortion | CLEAN · WARP |
| LOOPFM | Each oscillator modulates its own frequency; BLEND also brings OSC 2 in. WAVE sets how much each one loops | 1 · LOOP |
| MAX | The louder of the two waves at each moment, its corners rounded | MIX · MAX |
| XOR | The two waves' samples combined bit by bit (exclusive or): harsh and digital | MIX · XOR |
| BITS | The mix crushed from 16 bits down to 2 | CLEAN · CRUSH |

**What does VA's NOISE page do?**
NOISE is the voice's own noise source, mixed in beside SUB after MODE and before the filter. KIND picks its colour and LEVEL how much: the lower half of LEVEL is a breath, and at full the noise is about as loud as INIT's two oscillators, never louder. As with SUB, the oscillators dip a little as LEVEL comes up, so the filter sees the same level. See the [quick start](QUICK-START.md#10-va) for the page.

| KIND | Sound |
|---|---|
| WHITE | Even hiss across the whole range |
| PINK | Softer, fuller hiss: less top |
| RED | Dark rumble and wind: mostly low end |
| DIGITAL | Stepped, gritty noise that follows the key: brighter on higher notes |

LEVEL can be modulated in the MOD matrix and learned to a MIDI CC like SUB.

**What is STABILITY?**
On the VA page, how far each voice's oscillators drift; its glyph is a spirit level, the bubble further from the middle the more they drift. The 2040, LADDER and SEM filters have their own STABILITY, on FLT › FX: each voice gets a slightly different chip.

**Why does DRUM say COMING SOON?**
It isn't in this release. EDIT on its row only shows COMING SOON.

**What filter types are there?**
On the FLT page, TYPE: CLEAN, 2040, DIRTY, LADDER and SEM. The cells change with the type, and the picture is drawn from the filter's real response. Every TYPE has FEEDBACK (FDBK, on FLT › MODULATION), and every voice has an FX slot before or after the filter. See the [quick start](QUICK-START.md#7-the-filter) for a tour of the FILTER pages.

**How do I drive or fold the sound?**
With the filter's FX slot. On FLT, turn FX to SOFT (drive), FUZZ or FOLD, and FX PLACE to PRE (before the filter) or POST (after it). FLT › FX holds INPUT, the effect's three pots and MIX. In the MOD matrix the FX column moves the effect's first pot (DRIVE, SUSTAIN or FOLD).

**What do LPG, DECAY and STRIKE on AMP do?**
They turn the VCA into a low-pass gate, the kind modelled on Mutable Instruments Plaits. AMP's cells are VEL · LPG · DECAY · STRIKE. With all three at 0 the VCA is a plain VCA.

| Cell | What it does |
|---|---|
| LPG | Darkening follows the gain: the quieter the note, the darker it is. At full it is Plaits' low-pass gate |
| DECAY | How slowly the gate closes after its level falls: fast while bright, slower as it dims, like a vactrol |
| STRIKE | Each note-on strikes the gate, as hard as the note is played, and it rings out through DECAY. It adds to the envelope routed into VCA as an accent, and a held note falls back to the envelope. With nothing routed into VCA, the strike alone plays the note, which ends when the gate shuts, even with the key held |

Any filter TYPE plays in front of the gate. A sine through FLT › FX FOLD with LPG and STRIKE at full is a bongo. All three knobs can be modulated in the MOD matrix and learned to a MIDI CC.

## TAPE

**What is TAPE?**
An engine that plays sound sources: recordings on the card, held in the project's memory or streamed from the card while they play. A machine on DECK decides how a source is played:

| MODEL | What it does |
|---|---|
| WALK | Plays the window once through (FWD or REVERSE), round a loop (LOOP), or there and back (PING). With TRON on, each key gets its own Mellotron-style tape, 0.25 to 8 s long |
| STRETCH | Plays the source at the key's pitch, stretched or squeezed in time: CLASSIC splices it, GRAIN plays it in grains |
| SCRUB | Moves through the source by hand, like a tape reel under your finger: FINGER is a jog wheel, and keys can place the finger |
| WAVE | Plays a wavetable source: FRAME, SCAN and RANGE move through its frames |

The [quick start](QUICK-START.md#11-tape) has every TAPE page, annotated.

**How do I play a TAPE Sound?**
Load one from the FACTORY tab (the Sounds tagged TAPE), or load INIT TAPE and pick a source on SRC. INIT TAPE has no source, so it is silent until you pick one.

**Where are the sources?**
In the project, and on the card in `/CHIMERA/TAPES`. The factory set copies its sources there. On SRC, turn SOURCE: first come the sources the project holds, then the card's. On a card source, the focus band shows its name and size; press **MIX + PLUS** to load it.

**Can I use my own recordings?**
TAPE plays Chimera's own source files (`.SRC`). A way to make them from your own recordings isn't part of this release.

**What does STREAMS mean?**
A source too long for the project's memory plays from the card as it goes. SOURCE's readout then says how many notes of it can stream at once, for example `24K · 30.0 S · 7 STREAMS`. REVERSE, PING, STRETCH, SCRUB and WAVE need the whole source in memory: on a streamed source they are dimmed and say `… NEEDS RAM · STREAMED`.

**What do TAPE, AGE and WOW do?**
They are the tape's wear, on every machine's own page. TAPE sets how much the pitch wobbles. WOW picks how: CAPSTAN, a tape machine's steady wow and flutter, or WARBLE, a pitch that wanders. AGE darkens the sound and adds hiss; past halfway, the level drops out now and then, as worn tape does.

**Why is a TAPE cell dimmed?**
The current setting doesn't use it, and the focus band says why: on WALK, XFADE is heard only on LOOP and with TRON, RETRIG only once through with TRON off; on STRETCH, each TYPE's cells are dimmed under the other (GRAIN TYPE ONLY, CLASSIC TYPE ONLY).

**How do I free the memory sources take?**
SETTINGS › PROJECT › PURGE UNUSED SRC frees the memory of sources no Part uses. The files on the card stay.

## MIDI and playing

**How do I set a Part's MIDI channel?**
The CH cell on the mixer's PART page (MIX + B*n*, MINUS to PRT), or all six at once at SETTINGS › MIDI CONFIG › CHANNELS. Out of the box, Part *n* listens on channel *n*.

**MONO or POLY?**
MODE on the same PART page.

**How do I set glide?**
On the engine's PITCH sub-page (the last in the row under ALG, RES, VA or DECK): set STEAL to GLIDE and TIME to the glide time (150 ms at INIT). A note that takes over a voice of the same Part glides from that voice's pitch; on a MONO Part, legato playing glides.

**How do I set the pitch-bend range?**
BEND on the mixer's PART page, in semitones (2 by default).

**Which MIDI messages work?**
Notes, pitch bend, the sustain pedal (CC 64) and other CCs, on the DIN input. Each Sound carries a MIDI map of up to 16 CCs, per Part: SETTINGS › PART › MIDI MAP. To learn a CC, touch a cell, hold **MIX** and press **SEQ**, then move the knob on your controller. USB doesn't carry MIDI.

**I hear nothing from a Part.**
Check its CH matches your keyboard, its LEVEL is up, and its OUT. A Part sent to output pair P2 or P3 is silent on the main pair: the header then shows `OUT P2` or `OUT P3`.

**How do I tune the whole synth?**
SETTINGS › AUDIO ROUTING › TUNING.

## Effects

**How do the effects work?**
Each Part sends to three shared effects. Open the mixer (B*n* twice, or MIX + B*n*) and use SND: the CHORUS, DELAY and REVERB send levels. The same page is AMP › SENDS on the Part's chain (SEQ from AMP). PLUS walks on to the effects themselves (annotated in the [quick start](QUICK-START.md#13-the-mixer-and-the-effects)):

| Page | Cells | Sub-page |
|---|---|---|
| CHR (chorus) | MODE (OFF, I, II, I+II), RATE, DEPTH, MIX | |
| DLY (delay) | TYPE (TAPE, GRAIN), TIME, FDBK, TONE, REV (delay into the reverb), MIX | CHARACTER: MECH (wow and flutter), SAT, for TAPE. GRAIN: SIZE, DENSITY, PITCH, TEXTURE, for GRAIN |
| REV (reverb) | TYPE (QUAD, ROOM, HALL, BLOOM, GATE, REVERSE), SIZE, TIME, DAMP, SMEAR, MIX | MORE, MORE 2: extra controls for the TYPE |
| MST (master) | Compressor: THRESH, RATIO, ATK, REL, MAKEUP, MIX | LVL: VOL and PAN of the whole synth |

TAPE is a tape echo. GRAIN, in the manner of Mutable Instruments' Beads, builds its repeats from short grains of the last half second: SIZE is a grain's length, DENSITY how many start each second, PITCH shifts each grain (+12 with a high FDBK is a shimmer), and TEXTURE scatters where and when they start. CHARACTER's cells are heard under TAPE and GRAIN's under GRAIN; under the other TYPE they are dimmed.

A Sound keeps its send levels when you save it.

## The screen

**How do I turn the hints off?**
SETTINGS › PERSONALIZE › THEME › HINTS: OFF. The combos still work.

**How do I switch to light mode?**
SETTINGS › PERSONALIZE › THEME › INVERT: ON. The same page has BRIGHT, GAMMA, ACCENT and BLACK. These settings belong to the unit, not to a project.

**Can I change the screensaver?**
SETTINGS › PERSONALIZE › SCREENSAVER: OFF, or from 5 seconds up to 10 minutes. The default is 5 minutes. A button that wakes the screen also does its job. A turn that wakes it loses its first notch, so you never change a value you couldn't see.

**Can I have the sub-pages as a vertical list?**
SETTINGS › PERSONALIZE › CHAIN MAP › PAGES: STACK. With STACK, **EDIT** goes down a sub-page and **SEQ** goes back up. With ROW (the default), the sub-pages sit in a row: **EDIT** goes back one and **SEQ** goes on one.

**What do EDIT and MENU do in a dialog?**
**EDIT** is OK. **MENU** or **SEQ** cancels. Any encoder moves the highlight. The hint under the question reads `EDIT OK · MENU BACK`. The risky ones (DELETE, CLEAR, SAVE OVER) open on CANCEL, so a quick EDIT does no harm.

**Why is a WAVE or ALG choice dimmed?**
The formant budget can't pay for it. The focus band says why, for example `OP 1 MODULATED · OVER BUDGET` or `BUDGET FULL · OTHER FORMANTS`. Nothing is changed until you land on a choice that isn't dimmed.

**The FREQ number doesn't move when an LFO moves the sound.**
That's on purpose. Every number shows the value you set (FREQ, or CUTOFF on the 2040, included). On the FILTER page, modulation is a faint band under the picture, from the cutoff you set to where it is now.

**Can I make the text bigger?**
SETTINGS › PERSONALIZE › TEXT SIZE › SIZE: LARGE. The cell labels and values, the focus label, the hints, the SETTINGS lists and the Sound names go up a size where they fit. The header, the chain map, the big value and the pictures stay as they are.

**What does `MIX + B1-6 PART` mean in the mixer?**
Hold MIX and press B1 to B6 to jump to that Part's mixer. You stay on the same page.

**Some SETTINGS rows are grey.**
They say LATER and aren't built yet; EDIT skips them.

## Firmware and bugs

**Which version am I running?**
It's on the boot splash, and at SETTINGS › SYSTEM › ABOUT.

**Which file do I flash?**
`CHIMERA.BIN`, from the [Releases](../../releases) page. Its partner `CHIMERA.BK2` goes onto the card beside it: Chimera needs both, and installs `CHIMERA.BK2` by itself on the first start (DON'T POWER OFF on the screen). The file names never carry a version; the version is in the release title and on the boot splash.

**How do I update the firmware, or go back to stock?**
Follow the [README](README.md#installing-chimera): the same steps install a new version over an old one. Copy the new `CHIMERA.BIN`, `CHIMERA.BK2` and factory set onto the card, flash `CHIMERA.BIN`, and let Chimera install `CHIMERA.BK2`. Your projects and Sounds on the card stay. For the USB method, SETTINGS › SYSTEM › OS UPGRADE restarts the unit into DFU mode. To return to the stock firmware: [Switching back to the original PreenFM3 firmware](README.md#switching-back-to-the-original-preenfm3-firmware).

**The bootloader lists `CHIMER~1.BIN`. Which one do I pick?**
On a Mac, copying `CHIMERA.BIN` also leaves a hidden twin called `._CHIMERA.BIN`, and the bootloader shows it as `CHIMER~1.BIN`. It isn't firmware. Press − / + until the list shows `CHIMERA.BIN`, the big one, and flash that. Copying from Windows or Linux avoids the twin.

**My browser saved `CHIMERA (1).BIN`.**
That's a second download of the same file. Rename it back to `CHIMERA.BIN` in Finder or Explorer (and `CHIMERA (1).BK2` to `CHIMERA.BK2`). Rename, don't delete. When you copy it to the card, choose Replace.

**TAPE, ORBIT, the reverb or something else is silent and says UPDATE or NEEDS UPDATE.**
`CHIMERA.BK2` isn't installed, or it's from another version. Copy the `CHIMERA.BK2` from the same release as your `CHIMERA.BIN` to the top of the card (hold MENU at power-on, then button 3), eject, and restart. The screen says DON'T POWER OFF while it installs.

**How do I report a bug?**
Check [KNOWN-ISSUES.md](KNOWN-ISSUES.md) first. Then **Issues › New issue › Bug report**, with the version, what you did and what you heard or saw. A photo, screenshot or short recording helps a lot. See [reporting bugs](README.md#reporting-bugs).

**I hear a hum when the unit is powered over USB.**
That's a ground loop with your computer, not a bug. Use the 9 V supply. See [KNOWN-ISSUES.md](KNOWN-ISSUES.md).
