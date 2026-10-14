# Chimera FAQ

Short answers for alpha testers. New to the controls? Read the [quick start](QUICK-START.md) first. Labels below are as they appear on screen.

**Contents:** [Sounds](#sounds) · [Projects](#projects) · [Modulation](#modulation) · [Engines](#engines) · [MIDI and playing](#midi-and-playing) · [Effects](#effects) · [The screen](#the-screen) · [Firmware and bugs](#firmware-and-bugs)

## Sounds

**How do I load a Sound?**
Hold **EDIT** and press **B*n*** to open the Sound browser for Part *n*. Turn **encoder 1** to the Sound and press **EDIT**. Turn **encoder 2** to switch between the PROJECT tab (the project's own Sounds) and the LIBRARY tab (Sounds saved on the card). If the Part has edits you haven't saved, it asks first.

**How do I start a new Sound from INIT?**
In the Sound browser, turn encoder 1 up past Sound 01 to the INIT rows (INIT ALGO, INIT MODAL, INIT VA) and press **EDIT**. Or, to reset the Part to INIT of its engine: SETTINGS › PART › CLEAR.

**How do I save a Sound?**
In the browser's PROJECT tab, press **MIX + EDIT**: it saves the Part's Sound over its own slot, or to a new slot if it has none. The hint shows how much memory it takes. SETTINGS › PART › SAVE TO PROJ gives you the choice (OVER SLOT, TO NEW SLOT). Sounds saved this way live in the project, so then **hold MENU** to save the project to the card.

**How do I keep a Sound for other projects?**
SETTINGS › PART › SAVE TO LIBRARY, or **MIX + EDIT** on the browser's LIBRARY tab. It asks for a name and writes the Sound to the card.

**How do I clear a Sound slot?**
In the browser's PROJECT tab, select it and press **MIX + MINUS**. It asks before clearing.

**Where are the factory Sounds?**
There is no FACTORY tab yet. Every new project starts with the factory Sounds in its PROJECT tab: TX BASS, TX EPIANO, TX BRASS, TX BELL, SAW LEAD, SQR BASS, MORPH PAD, MORPH KEYS, and the formant Sounds CHOIR, TALK BASS, BREATH and VOX. Parts 1 to 5 start on some of them. To get them back, start a new project: SETTINGS › PROJECT › LOAD PROJECT › + CREATE NEW.

**How do I add Sounds from my computer?**
The card is inside the case, so use the USB console: `python3 chimera-usb.py put <file> /CHIMERA/SOUNDS/`. They show up on the LIBRARY tab. See [the console tool](README.md#the-console-tool).

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
On the naming screen: encoder 1 moves the cursor, 2 picks a letter, 3 a digit, space or dash, 4 switches case, 5 deletes. **SEQ** saves, **MENU** cancels.

## Modulation

**How do I route an LFO or an envelope to a parameter?**
1. On any page, touch the parameter (turn its encoder a little) and press **MIX + PLUS**. The focus band says ADDED: it is now a column in the matrix.
2. Go to the Part's MOD page (PLUS along the chain). Its first page is the matrix.
3. Encoder 1 moves the cursor to a source row (ENV1–3, LFO1–3, VELO, NOTE), encoder 2 to the column, and **encoder 5** sets the amount. Under the grid, the route reads in words, with what the amount means (for example `+42 = +3.3 oct`).

Other messages you may see after MIX + PLUS: ALREADY ROUTED, NOT MODULATABLE, MATRIX FULL.

**How do I remove a route?**
On the matrix, put the cursor on it and press **MIX + MINUS**. On a parameter page, **MIX + MINUS** takes the touched parameter out of the matrix altogether.

**Where are the envelopes and LFOs?**
Under MOD: press EDIT to go down from the matrix to E1, E2, E3 (envelopes), SPD (their speeds), L1, L2, L3 (LFOs).

**What about the filter's FM and QM knobs?**
On FLT and its FILTER MOD sub-page they are routes themselves: turn the IN cell (FM3 IN, QM IN) to pick a source and the amount cell to set how much. **MIX + MINUS** on an amount deletes the route.

## Engines

**How do I change a Part's engine?**
Load a Sound with another engine: the INIT row of that engine is a clean start. The Part's pages change to match.

**What do the engines do?**

| Engine | What it is | Its chain |
|---|---|---|
| ALGO | Six-operator phase modulation (FM). Two algorithms, ALG A and ALG B, with MORPH blending between them | ALG · OSC · DRV · FLT · AMP · MOD |
| MODAL | Physical models: struck, plucked and bowed resonators. MODEL picks STRING, BANK, BOWED or SYMP (sympathetic strings) | EXC · RES · FLT · AMP · MOD |
| VA | Two variable-wave oscillators combined by MODE (MIX, SYNC, RING, XOR, BITS), with a SUB and STABILITY drift | VA · DRV · FLT · AMP · MOD |

**Why do TAPE and DRUM say COMING SOON?**
They aren't in this release. TAPE, the sample engine, is being reworked and DRUM is still to come. Their rows are in the browser so you know they're on the way; EDIT on them only shows COMING SOON.

**What filter types are there?**
On the FLT page, TYPE: CLEAN, 2040, DIRTY, LADDER. The cells change with the type.

## MIDI and playing

**How do I set a Part's MIDI channel?**
The CH cell on the mixer's PART page (MIX + B*n*, MINUS to PRT), or all six at once at SETTINGS › MIDI CONFIG › CHANNELS. Out of the box, Part *n* listens on channel *n*.

**MONO or POLY?**
MODE on the same PART page.

**How do I set glide?**
On the engine's PIT sub-page (EDIT from ALG, RES or VA): set STEAL to GLIDE and TIME to the glide time (150 ms at INIT). A note that takes over a voice of the same Part glides from that voice's pitch; on a MONO Part, legato playing glides.

**How do I set the pitch-bend range?**
BEND on the mixer's PART page, in semitones (2 by default).

**Which MIDI messages work?**
Notes, pitch bend and the sustain pedal (CC 64), on the DIN input. Other CCs are ignored for now. USB carries the console only, not notes.

**I hear nothing from a Part.**
Check its CH matches your keyboard, its LEVEL is up, and its OUT. A Part sent to output pair P2 or P3 is silent on the main pair: the header then shows `OUT P2` or `OUT P3`.

**How do I tune the whole synth?**
SETTINGS › AUDIO ROUTING › TUNING.

## Effects

**How do the effects work?**
Each Part sends to three shared effects. Open the mixer (B*n* twice, or MIX + B*n*) and use SND: the CHORUS, DELAY and REVERB send levels. PLUS walks on to the effects themselves:

| Page | Cells | Sub-page |
|---|---|---|
| CHR (chorus) | MODE (OFF, I, II, I+II), RATE, DEPTH, MIX | |
| DLY (delay) | TIME, FDBK, TONE, REV (delay into the reverb), MIX | CHAR: MECH (wow and flutter), SAT |
| REV (reverb) | TYPE (QUAD, ROOM, HALL, BLOOM, GATE, REVERSE), SIZE, TIME, DAMP, SMEAR, MIX | MORE: extra controls for the TYPE |
| MST (master) | Compressor: THRESH, RATIO, ATK, REL, MAKEUP, MIX | LVL: VOL and PAN of the whole synth |

A Sound keeps its send levels when you save it.

## The screen

**How do I turn the hints off?**
SETTINGS › PERSONALIZE › THEME › HINTS: OFF. The combos still work.

**How do I switch to light mode?**
SETTINGS › PERSONALIZE › THEME › INVERT: ON. The same page has BRIGHT, GAMMA, ACCENT and BLACK. These settings belong to the unit, not to a project.

**Can I change the screensaver?**
SETTINGS › PERSONALIZE › SCREENSAVER: OFF, or 5 to 60 seconds.

**Some SETTINGS rows are grey.**
They say LATER and aren't built yet; EDIT skips them.

## Firmware and bugs

**Which version am I running?**
It's on the boot splash, and at SETTINGS › SYSTEM › ABOUT.

**Which file do I flash?**
There is one: `chimera-<version>.bin`, on the [Releases](../../releases) page. It includes ORBIT, the ring sequencer (hold SEQ).

**How do I update the firmware, or go back to stock?**
SETTINGS › SYSTEM › OS UPGRADE puts the unit in DFU mode; then follow the [README](README.md#2-flash-chimera). To return to the stock firmware: [Go back to the stock firmware](README.md#go-back-to-the-stock-firmware).

**How do I report a bug?**
Check [KNOWN-ISSUES.md](KNOWN-ISSUES.md) first. Then **Issues › New issue › Bug report**, with the version, what you did and what you heard or saw. Attach the output of `python3 chimera-usb.py status` and, for anything on screen, a `python3 chimera-usb.py shot`. See [the console tool](README.md#the-console-tool) and [reporting bugs](README.md#reporting-bugs).

**The console tool can't find the unit.**
After a cold power-on the USB console may not come up; a pass through SETTINGS › SYSTEM › OS UPGRADE brings it back. It's a [known issue](KNOWN-ISSUES.md).

**I hear a hum when the unit is powered over USB.**
That's a ground loop with your computer, not a bug. Use the 9 V supply. See [KNOWN-ISSUES.md](KNOWN-ISSUES.md).
