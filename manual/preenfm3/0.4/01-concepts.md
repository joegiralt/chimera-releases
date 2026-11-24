# Concepts: Parts, Sounds, projects and the voice chain

This chapter explains the ideas the rest of the manual builds on: the six Parts, Sounds, projects and the library, the path a note takes to the output jacks, modulation, the five engines and the design rules behind the controls. For the buttons and the screen, read [The panel and navigation](02-panel-and-navigation.md) next; for voices, CPU and memory, see [Limits](20-limits.md).

## Concepts: what Chimera is

Chimera is firmware for the PreenFM3. It runs on the PreenFM3's own hardware (chip, screen, six encoders, buttons, jacks, MIDI, USB and SD card) and replaces the stock FM synthesizer with a different instrument:

- **Multi-engine.** Five engines, ALGO, MODAL, VA, TAPE and DRUM; each Part can use any of them.
- **Multitimbral.** Six Parts play at once, each with its own engine, Sound and MIDI channel.
- **One voice chain.** Every engine runs through the same filter, FX slot, amp, stereo and sends, moved by the same modulation matrix.
- **A ring sequencer**, [ORBIT](12-orbit.md), plays the Parts by itself.

Chimera keeps the PreenFM3's USB identity, SD card and bootloader. It reads and writes only inside the card's `/CHIMERA/` folder, so your stock files are left alone. Going back to the stock firmware is in [Updating and recovery](19-updating-and-recovery.md).

> **Design note:** Chimera started as an idea of a boutique, Eurorack-flavoured instrument squeezed into a box built for FM. The PreenFM3 has a fast chip, a colour screen and six encoders, which is plenty, provided you are prepared to count every cycle. The rest of this manual is, in a sense, the story of that counting. Please do enjoy. Try not to lick the capacitors and get high on LSD.

## Concepts: Parts

A **Part** is one instrument inside Chimera. There are six, one for each button **B1** to **B6**. Press **B*n*** for Part *n*'s sound pages; press it again for its mixer.

Each Part has its own Sound (and so its own engine), its own MIDI channel (Part *n* listens on channel *n* out of the box; set it with **CH** on the Part's mixer page or in SETTINGS › MIDI CONFIG › CHANNELS, see [MIDI](14-midi.md)), and its own mix: **LEVEL**, **PAN**, **MODE** (MONO or POLY), **OUT** (P1, P2 or P3), **BEND**, **VOICES**, **RESERVE** and its EQ (**TILT**, **LO CUT**, **ROLE**). The mix lives in the [MIXER](11-mixer-and-master-fx.md), not in the Sound. All six Parts share one pool of eight voices ([Limits](20-limits.md#limits-the-voice-pool)).

Two Parts on the same MIDI channel both play: that is how you layer Sounds.

## Concepts: Sounds

A **Sound** is a Part's patch. It holds the engine and all its settings, the voice chain (PITCH, filter, FX slot, AMP, STEREO), the modulation (three envelopes, three LFOs, the MOD matrix), the sends to CHORUS, DELAY and REVERB, the MIDI rows learned to its cells, and for TAPE its source, for DRUM its kit.

The engine belongs to the Sound: to change a Part's engine, load a Sound that uses another one. Each engine has a clean start, its **INIT** row in the Sound browser (INIT ALGO, INIT MODAL, INIT VA, INIT TAPE, INIT DRUM).

A Sound does **not** hold the Part's channel or mix, so loading a Sound never moves your mix.

**Why:** choosing the engine by loading a Sound means a Part is never half set up for one engine and half for another.

## Concepts: projects

A **project** is the whole musical state, saved as one file on the card: its Sounds (up to 128 slots, the PROJECT tab of the Sound browser), its TAPE sources ([the sound pool](20-limits.md#limits-the-sound-pool-the-projects-memory)), the six Parts and their mix, the shared effects and master, and ORBIT.

**Hold MENU** from anywhere to save it (a new project asks for a name). Load, create, rename, copy and delete projects in SETTINGS › PROJECT ([SETTINGS](13-settings.md), [the SD card](16-card-sounds-library.md)). A new project starts with a set of factory Sounds, and Parts 1 to 5 on some of them.

### Concepts: copies, not links

```
   LIBRARY (card)  ──copy──▶  PROJECT slot  ──copy──▶  Part
```

Loading a Sound copies it; editing the Part edits only its copy; saving (MIX + EDIT in the browser, or SETTINGS › PART › SAVE TO PROJ) copies it back into a slot. A later change to a library Sound or a slot never changes a Part loaded from it. An edited Part reads `* EDITED` in SETTINGS › PART; a project with unsaved changes reads `* MODIFIED`. Chimera asks before anything would throw away unsaved work.

**Why:** if a Part only pointed at a library Sound, editing it for another song would quietly change this one. Copies keep each project as you left it.

## Concepts: the library and factory Sounds

Two more places to load from, both on the card: the **LIBRARY**, Sounds you saved from any project (to carry a Sound between projects), and **FACTORY**, the read-only factory Sounds. Open the Sound browser with **EDIT + B*n*** and turn encoder 2 to switch tabs. See [The SD card, Sounds and the library](16-card-sounds-library.md).

## Concepts: the voice chain

Every note a Part plays runs through the same path, whatever its engine:

```
  one voice (a note)                                 one Part (all its voices)
 ┌───────────────────────────────────────────┐     ┌──────────────────────────────┐
 │ ENGINE ─▶ FX slot ─▶ FILTER ─▶ FX slot ─▶  │     │                              │
 │           (PRE)               (POST)       │     │  sum ─▶ EQ ─▶ LEVEL / PAN ──┼──▶ OUT pair
 │   ─▶ AMP (VCA / LPG) ─▶ STEREO ───────────┼────▶│        (LO CUT,   │          │
 └───────────────────────────────────────────┘     │         TILT)     └─ sends ──┼──▶ CHORUS
                                                   └──────────────────────────────┘    DELAY
                                                                                        REVERB
                                                                                          │
   main pair P1 ◀── effect returns ◀────────────────────────────────────────────────────────┘
      │
      └─▶ MASTER compressor (MST) ─▶ master level (LVL) ─▶ output jacks (and USB audio)
```

1. **The engine** makes the raw note.
2. **The FX slot** (OFF, SOFT, FUZZ or FOLD) sits before or after the filter, set by **FX PLACE** (PRE or POST).
3. **The filter**: CLEAN, 2040, DIRTY, LADDER or SEM.
4. **AMP**, the VCA, which **LPG**, **DECAY** and **STRIKE** turn into a low-pass gate.
5. **STEREO** places each note.
6. The Part's voices are summed, then **LO CUT** and **TILT**, then **LEVEL**, **PAN** and three **sends**. The delay can also feed the reverb.
7. **OUT** picks the pair: P1 (main), P2 or P3. Effects return on P1 only. The compressor (**MST**) and master level (**LVL**) come last; USB audio records the main pair.

Every engine's chain map ends in **FLT** (FILTER), **AMP** and **MOD**, and every engine has a **PITCH** sub-page. These shared pages are explained once, in [The voice chain](08-voice-chain.md); the mix and effects in [The MIXER and the master effects](11-mixer-and-master-fx.md).

**Why:** one chain means one set of pages to learn. A filter sweep or a low-pass gate works the same on an FM bell, a string or a recording.

> **Design note:** the voice chain reads like a Eurorack row: oscillator, wavefolder or fuzz, filter, low-pass gate. The low-pass gate is a port of the one in Émilie Gillet's Mutable Instruments Plaits; FUZZ is modelled from the circuit of a Big Muff pedal; SEM is the SEM-1A filter, from a published circuit-model paper; 2040 models the SSM2040 chip. No soldering iron was harmed.

## Concepts: modulation

Everything that moves a setting over time is a **route** in the Part's **MOD matrix**. Sources are the rows: ENV1–ENV3, LFO1–LFO3, VELO, NOTE, WHEEL, PRESS, SLIDE and, on ALGO, OP5 and OP6. Destinations are the columns: filter frequency and resonance, the VCA, the FX slot, and any parameter you add with **MIX + PLUS** on its cell. The filter's **ENV AMT**, **FREQ MOD** and **RES MOD** are routes too, shown where you would look for them. See [The mod matrix](10-mod-matrix.md) and [Envelopes and LFOs](09-envelopes-and-lfos.md).

**Why:** one way to connect anything to anything, as on a patch bay. Nothing is hard-wired out of sight.

## Concepts: the five engines

| Engine | What it is |
|---|---|
| [ALGO](03-algo.md) | Six-operator phase modulation. Two algorithms, **ALG A** and **ALG B**, blended by **MORPH**; operators can be formant (FRMT) or noise (NOIS) |
| [MODAL](04-modal.md) | Physical models: an exciter (EXC) strikes, plucks or bows a resonator (RES); **MODEL** picks STRING, BANK, BOWED or SYMP. Notes ring on after key-up |
| [VA](05-va.md) | Two morphing oscillators combined by **MODE** (MIX, SYNC, RING, FM…), with **SUB**, NOISE and **STABILITY** for analogue drift |
| [TAPE](06-tape.md) | Plays recordings (sources) from memory or streamed from the card; the DECK machine is **WALK**, **STRETCH**, **SCRUB** or **WAVE** |
| [DRUM](07-drum.md) | A kit on one Part: twelve pads, each with its own machine (TONE KICK, METAL HAT, PLAIN NOISE…), filter, amp, modulation and keys |

> **Design note:** the engines have known ancestors, and none of them is a copy. MODAL builds on the maths of Émilie Gillet's Mutable Instruments Rings and Elements. ALGO's factory set includes Sounds ported from Yamaha TX81Z patches, which then wander off on six operators instead of four. TAPE's STRETCH follows the way a classic Akai S950 stretched time. VA is a clean-room design, meant to feel analogue while still able to go West Coast or East Coast. DRUM borrows the shape of an Analog Rytm kit and the structure of the Machinedrum's machines, from their manuals only.

## Concepts: design ideas you will meet everywhere

These rules hold across the whole instrument.

| Rule | What it means | Why |
|---|---|---|
| Changes glide, never snap | A continuous control eases to its new value over 20–30 ms; a structural choice (TYPE, WAVE, algorithm, machine) crossfades or waits for the next note | An instant jump is heard as a click, from a knob, a CC, RANDOMIZE or a program change |
| Numbers show what you set | Modulation never moves the number; a thin line under a bar or a faint band on a picture shows it | A number that jumps with an LFO can't be read or set |
| Hidden gestures show a hint | Touch a cell and the focus band lists its combos ([Hints](02-panel-and-navigation.md#panel-hints-in-the-focus-band)) | A combo nobody can find doesn't exist |
| Labelled modules | Each page is one module with up to six labelled controls in fixed places; full words where they fit | Readable at a glance, like a Eurorack panel |
| Pages show what they do | The middle of the screen draws the page's effect; a dimmed cell says why it does nothing | You shape by ear; the picture tells you what changed |
| Safe by default | DELETE, CLEAR and SAVE OVER open on CANCEL; an unplayable choice is shown dimmed with its reason and not applied | Explore without fear of losing work |

### Concepts: one D-pad everywhere

**MINUS** and **PLUS** go along (pages, Parts, rows); **EDIT** and **SEQ** go between a page and its sub-pages, on a Part's pages, the mixer, the Sound browser, ORBIT and every SETTINGS list ([The D-pad](02-panel-and-navigation.md#panel-the-d-pad)).

**Why:** a key that means up on one screen and save on another can't be learned by hand.
