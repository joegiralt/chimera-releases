# Tuning, temperaments, Scala files and MTS

Each Part plays in a tuning of its own: equal temperament, a historical temperament, a Scala file from the card, or MIDI Tuning Standard. This chapter covers the TUNING page, the temperaments, Scala files and keyboard maps, MTS, and how tuning meets SNAP. See also [MIDI](14-midi.md), [the card](16-card-sounds-library.md) and [USB](17-usb.md). On SETTINGS pages **A** to **F** are encoders 1 to 6.

## Tuning: the TUNING page

**SETTINGS › AUDIO ROUTING › TUNING** (TUN on the settings chain; breadcrumb `SETTINGS › AUDIO › TUNING`). TUNE is the whole unit's; TUNING and MAPPING belong to the active Part: press another Part's button to set its tuning.

![TUNING page, annotated](img/settings_audio_tuning.png)

1. Header: `SETTINGS › AUDIO › TUNING`.
2. Focused cell, large: TUNE, 0, with its arc.
3. Picture band.
4. **TUNE** (A), 0.
5. **TUNING** (B), 12-TET.
6. **MAPPING** (C), CONTIN.
7. Footer: the project and its state.
8. Footer: `A-F EDIT · MENU BACK`.

With a Scala file picked, **TUNING** shows the file's name (its first 7 characters in the cell; with focus, a long name scrolls), and the focus band shows the description line written inside the file, or the file name when it has none.

| Cell | Range or options | Default | What it does |
|---|---|---|---|
| **TUNE** (A) | −100 to +100 cents | 0 | Shifts the unit's A4 = 440 Hz reference; every Part follows |
| **TUNING** (B) | 12-TET, JUST, PYTHAG, MEANTONE, WERCK, MTS, then Scala files | 12-TET | The active Part's tuning |
| **MAPPING** (C) | CONTIN., KEYBD | CONTIN. | How the Part's Scala file lies on the keys ([MAPPING](#tuning-mapping-the-scale-on-the-keys)) |

New notes play the tuning; sounding notes keep their pitch. TUNE is kept on the unit; TUNING and MAPPING are saved per Part in the project. The focus band explains the choice: `FOLLOWS MTS SYSEX FROM MIDI IN` on MTS; the `.SCL` file (and `.KBM MAPS THE KEYS` when a `.kbm` is beside it) on a Scala file; `EACH KEY THE NEXT STEP` (CONTIN.), `EACH C STARTS THE SCALE` (KEYBD) or `FOR SCALA FILES` on MAPPING. The PITCH page's tuner ([the voice chain](08-voice-chain.md)) reads notes in the Part's tuning.

**Why per Part:** one Part can drone in just intonation under equal-tempered chords. **Why TUNE is the unit's:** it matches the room, whatever project is loaded.

## Tuning: the built-in temperaments

| TUNING | What it plays |
|---|---|
| `12-TET` | Equal temperament, 100 cents a semitone |
| `JUST` | 5-limit just intonation on C: pure thirds and fifths |
| `PYTHAG` | Pythagorean on C: pure fifths, wide bright thirds |
| `MEANTONE` | Quarter-comma meantone: pure major thirds, a wolf on G♯–E♭ |
| `WERCK` | Werckmeister III: every key playable, each its own colour |
| `MTS` | Tuning received over MIDI ([MTS](#tuning-midi-tuning-standard)) |
| a file name (`PELOG`) | A Scala file from the card (the schema's SCALA choice) |

C keeps its usual pitch in every named temperament, so JUST and 12-TET Parts agree on C.

**Why named temperaments:** most players want to hear one, not edit one; Scala files cover the rest.

## Tuning: Scala files

A Scala file (`.scl`, up to 4 KB) holds a scale of up to 128 steps, in cents or ratios; thousands are in the Scala archive (huygens-fokker.org). Chimera reads them from **/CHIMERA/TUNINGS** and never writes there.

> **Design note:** the `.scl` and `.kbm` formats are Manuel Op de Coul's, from his Scala program, and they have quietly become the lingua franca of microtonal music. KEYBD and CONTIN. lay a file on the keys the way the stock PreenFM3 firmware does, so a tuning you loved on stock plays the same here (we read how it behaves, not its code). And yes, you can now play Bohlen–Pierce at a dinner party. Results may vary.

### Tuning: putting Scala files on the card

The card is inside the case, so files arrive over USB.

**With the bootloader's SD card access:**

1. Hold **MENU** while turning the PreenFM3 on, then press **button 3 (SD card access)**. The card mounts as a USB drive.
2. In **CHIMERA**, make a **TUNINGS** folder if there is none, and copy the `.scl` in, with a `.kbm` of the same name beside it if you want your own key map.
3. Eject, press **MENU**, and power-cycle.

Names show in capitals (`BOHLEN-PIERCE`; non A–Z letters as `?`, first 32 characters). A Mac's hidden `._` files and `.DS_Store` are never listed.

**With `chimera-usb.py`** (Python 3, Linux or macOS, Chimera running; see [USB](17-usb.md)):

```
python3 chimera-usb.py tuning pelog.scl
python3 chimera-usb.py tuning pelog.scl java.kbm
```

`pelog.scl` lands as `PELOG.SCL`, and a `.kbm` sent with it as `PELOG.KBM`. The tool takes names of 1 to 8 letters and digits (rename `bohlen-pierce.scl` to `bohlen.scl`, or use SD card access). Resending a name replaces it, and Parts playing it switch at once. A new `.scl` clears its old `.kbm`, so send both together.

To remove a file, move it out with SD card access; Parts playing it fall back to 12-TET (or, with only the `.kbm` gone, to their MAPPING).

### Tuning: picking a Scala file

Turn **B** past MTS on TUNING. The first 128 `.scl` files are reached, in copy order; past the last, `FIRST 128 FILES ONLY`. A file is read when picked, when a project loads it, and when resent over USB. On failure the Part plays 12-TET and the screen says `PELOG.SCL NOT FOUND`, `NOT SCALA`, `TOO BIG` or `NOT READ`.

The project keeps the file's name, so added files move nothing, and a changed `PELOG.SCL` changes every project that plays it. **Why by name:** a list position would shift as files are added.

### Tuning: MAPPING, the scale on the keys

| MAPPING | What it does | Use it for |
|---|---|---|
| **CONTIN.** | Middle C plays step 1 at its usual pitch; each key up is the next step | Non-octave scales, or one long row of steps |
| **KEYBD** | Each scale starts on a C; its octave rounds up to whole octaves of keys (7 steps take 12 keys, 19 take 24), the rest silent | Keeping the scale's octave under the hand's octave |

A 12-step scale plays the same either way. A `.kbm` of the same name overrides MAPPING: it maps keys to steps and sets the reference pitch; keys it leaves out (`x`) or outside its range play equal temperament.

## Tuning: MIDI Tuning Standard

A Part on MTS plays the tuning received over DIN or USB: single-note tuning changes (real-time and bank form), bulk dumps (all 128 keys), and one- and two-byte scale/octave tuning. Device 7F or 0 is accepted; tuning program and channel bits are ignored. Every MTS Part shares one tuning, which lasts until power-off and is not saved.

**Why one shared tuning:** a DAW or tuning editor retunes the instrument as a whole; Parts set to MTS join in, others keep theirs.

## Tuning: how SNAP and tuning meet

LIVE SNAP (SETTINGS › PART › LIVE SNAP, see [Settings](13-settings.md)) and ORBIT's scale fitting work in semitones; the tuning then pitches the key SNAP chose:

1. A note comes in.
2. SNAP (if on) moves it to a key of the scale or chord.
3. The tuning gives that key its pitch.

So SNAP to C major on a JUST Part plays C major's keys, justly tuned. A key KEYBD leaves silent stays silent. A held note that RE-SNAPs glides to the new key's tuned pitch; onto a silent key it keeps sounding in equal temperament.

**Why semitones:** SNAP's scales come from the twelve keys you play; tuning after keeps each tool simple.
