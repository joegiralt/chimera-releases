# Concepts: Parts, Sounds, projects and the voice chain

This chapter explains the ideas the rest of the manual builds on: what Chimera is, the six Parts, Sounds, projects and the library, the path a note takes from the engine to the output jacks, how modulation works, the five engines, and the design rules behind the controls. For the buttons and the screen, read [The panel and navigation](02-panel-and-navigation.md) next. For the ceilings (voices, CPU, memory), see [Limits](20-limits.md).

## Concepts: what Chimera is

Chimera is firmware for the PreenFM3. It runs on the PreenFM3's own hardware (its chip, screen, six encoders, buttons, output jacks, MIDI ports, USB port and SD card) and replaces the stock FM synthesizer with a different instrument:

- **Multi-engine.** Five sound engines: ALGO, MODAL, VA, TAPE and DRUM. Each Part can use any of them.
- **Multitimbral.** Six Parts play at once, each with its own engine, Sound and MIDI channel.
- **One voice chain for all engines.** Whatever the engine, its sound goes through the same filter, FX slot, amp, stereo and sends, and the same modulation matrix moves it.
- **A ring sequencer**, [ORBIT](12-orbit.md), plays the Parts by itself.

Chimera is software on someone else's hardware. It keeps the PreenFM3's identity where that helps you: the same USB identity, the same SD card, the same bootloader. Your stock PreenFM3 files on the card are left alone: Chimera reads and writes only inside the card's `/CHIMERA/` folder. Going back to the stock firmware is covered in [Updating and recovery](19-updating-and-recovery.md).

> **Design note:** Chimera started as an idea of a boutique, Eurorack-flavoured instrument squeezed into a box built for FM. The PreenFM3 has a fast chip, a colour screen and six encoders, which is plenty, provided you are prepared to count every cycle. The rest of this manual is, in a sense, the story of that counting. Please do enjoy. Try not to lick the capacitors and get high on LSD.

## Concepts: Parts

A **Part** is one instrument inside Chimera. There are six, numbered 1 to 6, one for each of the buttons **B1** to **B6**.

Each Part has:

- **its own Sound**, and so its own engine (see [Sounds](#concepts-sounds));
- **its own MIDI channel**: out of the box, Part *n* listens on channel *n*. Set it with **CH** on the Part's mixer page, or all six at once in SETTINGS › MIDI CONFIG › CHANNELS ([MIDI](14-midi.md));
- **its own mix settings**: **LEVEL**, **PAN**, **MODE** (MONO or POLY), **OUT** (output pair P1, P2 or P3), **BEND** (pitch-bend range), its voice limits (**VOICES** and **RESERVE**), its EQ (**TILT**, **LO CUT**, **ROLE**). These live in the [MIXER](11-mixer-and-master-fx.md), not in the Sound.

Press **B*n*** to see Part *n*'s sound pages. Press it again to flip to its mixer. All six Parts draw their voices from one shared pool of eight voices (see [Limits](20-limits.md#limits-the-voice-pool)).

Two Parts on the same MIDI channel both play when that channel plays. That is how you layer two Sounds.

**Why:** six Parts match the six B buttons, so every Part is one press away, and a Part's button is also the way into its mixer.

## Concepts: Sounds

A **Sound** is a Part's patch: everything that makes the Part sound the way it does. It holds:

- **the engine** (ALGO, MODAL, VA, TAPE or DRUM) and all the engine's settings;
- **the voice chain**: PITCH, the filter, the FX slot, AMP, STEREO;
- **the modulation**: the three envelopes, three LFOs and the MOD matrix routes;
- **the sends** to the shared CHORUS, DELAY and REVERB;
- **its MIDI rows**: controls learned to its cells ([MIDI](14-midi.md));
- for a TAPE Sound, **which source** it plays; for a DRUM Sound, **its kit**.

The engine belongs to the Sound. There is no separate engine switch: to change a Part's engine, load a Sound that uses another engine. Each engine has a clean starting Sound, its **INIT** row in the Sound browser (INIT ALGO, INIT MODAL, INIT VA, INIT TAPE, INIT DRUM). The Part's pages change to match the new engine.

What a Sound does **not** hold: the Part's MIDI channel, LEVEL, PAN, MODE, OUT, BEND, voice limits and EQ. Those belong to the Part, in the project's mix, so loading a Sound never moves your mix.

**Why:** choosing the engine by loading a Sound means a Part is never left half set up for one engine and half for another. Every Sound you load is complete and plays as saved.

## Concepts: projects

A **project** is the whole musical state of the instrument, saved as one file on the card. It owns:

- **its Sounds**: up to 128 numbered Sound slots, the PROJECT tab of the Sound browser;
- **its TAPE sources**: the recordings its TAPE Sounds play, held in the project's memory (see [the sound pool](20-limits.md#limits-the-sound-pool-the-projects-memory));
- **the six Parts**: which Sound each one plays and its mix settings;
- **the shared effects and the master**: CHORUS, DELAY, REVERB, the compressor and the master level;
- **ORBIT**: its rings, chords and eight scenes.

**Hold MENU** from anywhere to save the project to the card (a new project asks for a name first). Load, create, rename, copy and delete projects in SETTINGS › PROJECT ([SETTINGS](13-settings.md), [the SD card](16-card-sounds-library.md)).

A new project starts with a set of factory Sounds in its PROJECT tab, and Parts 1 to 5 start on some of them.

### Concepts: copies, not links

Every step from the library to a Part is a copy:

```
   LIBRARY (card)  ──copy──▶  PROJECT slot  ──copy──▶  Part
```

- Loading a Sound into a Part copies it. Editing the Part edits only the Part's copy.
- Saving the Part's Sound (MIX + EDIT in the browser, or SETTINGS › PART › SAVE TO PROJ) copies it back into a project slot.
- A later change to a library Sound, or to a slot, never changes a Part that was loaded from it.

The screen keeps track for you. A Part whose Sound differs from where it came from reads `* EDITED` in SETTINGS › PART. A project with unsaved changes reads `* MODIFIED` at the bottom of SETTINGS. Before anything would throw away unsaved work (loading a Sound over an edited Part, loading another project), Chimera asks first.

**Why:** the project is what you play live and come back to. If a Part only pointed at a library Sound, editing that Sound for another song would quietly change this one. Copies keep each project as you left it.

## Concepts: the library and factory Sounds

Besides the project's own Sounds, there are two more places to load from, both on the card:

- **LIBRARY**: Sounds you saved from any project (SETTINGS › PART › SAVE TO LIBRARY, or MIX + EDIT on the browser's LIBRARY tab). Use it to carry a Sound from one project to another.
- **FACTORY**: the factory Sounds, read-only. An edited factory Sound is saved to your project or library, never over the factory one.

Open the Sound browser with **EDIT + B*n*** and turn encoder 2 to switch between the PROJECT, LIBRARY and FACTORY tabs. The full story, including how the factory set gets onto the card, is in [The SD card, Sounds and the library](16-card-sounds-library.md).

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

In words:

1. **The engine** makes the raw sound of one note: operators (ALGO), a resonator (MODAL), two oscillators (VA), a recording (TAPE) or a drum machine (DRUM).
2. **The FX slot** shapes it: OFF, SOFT (drive), FUZZ or FOLD (a wavefolder). **FX PLACE** puts it before the filter (PRE) or after it (POST).
3. **The filter**: CLEAN, 2040, DIRTY, LADDER or SEM, each with its own modes.
4. **AMP**: the voice's VCA, which **LPG**, **DECAY** and **STRIKE** can turn into a low-pass gate.
5. **STEREO** places each note in the stereo field.
6. The Part's voices are summed, then run through **the Part's EQ** (**LO CUT**, then **TILT**).
7. **LEVEL** and **PAN** set the Part in the mix, and the Part's three **sends** feed the shared CHORUS, DELAY and REVERB. The delay can also feed the reverb.
8. The Part plays out of the output pair its **OUT** picks: P1 (the main pair), P2 or P3. The effects return on P1 only. The master section, the compressor (**MST**) and the master level (**LVL**), comes last. USB audio records the main pair.

Every engine's chain map ends in the same pages, **FLT** (FILTER), **AMP** and **MOD**, and every engine has a **PITCH** sub-page. The shared pages are explained once, in [The voice chain](08-voice-chain.md). The Part's EQ, sends and the shared effects are in [The MIXER and the master effects](11-mixer-and-master-fx.md).

**Why:** one chain for every engine means one set of pages to learn. A filter sweep, a drive or a low-pass gate works the same on an FM bell, a plucked string or a recording.

> **Design note:** the voice chain reads like a Eurorack row: oscillator, wavefolder or fuzz, filter, low-pass gate. Some of those modules have well-known parents. The low-pass gate is a port of the one in Émilie Gillet's Mutable Instruments Plaits; FUZZ is modelled from the circuit of a Big Muff pedal; SEM is the SEM-1A filter, from a published circuit-model paper; 2040 models the SSM2040 chip. The chapters on each say more. No soldering iron was harmed.

## Concepts: modulation

Everything that moves a setting over time is a **route** in the Part's **MOD matrix**. The rows are sources: the three envelopes (ENV1–ENV3), three LFOs (LFO1–LFO3), velocity (VELO), the note (NOTE), the mod wheel (WHEEL), aftertouch (PRESS), MPE slide (SLIDE) and, on ALGO, the audio of operators 5 and 6 (OP5, OP6). The columns are destinations: the filter's frequency and resonance, the VCA, the FX slot, and any other parameter you add. To add one, touch the parameter on its page and press **MIX + PLUS**; it becomes a column. Cells like the filter's **ENV AMT**, **FREQ MOD** and **RES MOD** are routes too, shown where you would look for them. Even the envelope into the amp is a route. The whole story is in [The mod matrix](10-mod-matrix.md), and the envelopes and LFOs are in [Envelopes and LFOs](09-envelopes-and-lfos.md).

**Why:** one way to connect anything to anything, as on a patch bay. Nothing is hard-wired that you can't see or change.

## Concepts: the five engines

### Concepts: ALGO

Six-operator phase modulation (FM). Two algorithms, **ALG A** and **ALG B**, with **MORPH** blending from one to the other. Each operator has its own wave, ratio, level and envelope; operators can also be formant (FRMT) or noise (NOIS) operators for voices and breath. See [ALGO](03-algo.md).

### Concepts: MODAL

Physical models: struck, plucked and bowed resonators. An exciter (the EXC page) hits, plucks or bows a resonator (RES); **MODEL** picks STRING, BANK, BOWED or SYMP (sympathetic strings). A MODAL note rings on after you let go of the key, as a real string does. See [MODAL](04-modal.md).

### Concepts: VA

Two oscillators whose waves morph from sine through triangle and saw to pulse, combined by **MODE** (MIX, SYNC, RING, FM and more), with a sub-oscillator (**SUB**), a noise source (NOISE) and **STABILITY**, which lets each voice drift as analogue oscillators do. See [VA](05-va.md).

### Concepts: TAPE

Plays recordings, called sources, held in the project's memory or streamed from the card. A machine on the DECK page decides how a source plays: **WALK** (one-shot, loop, ping-pong or Mellotron-style tape), **STRETCH** (stretched in time at the key's pitch), **SCRUB** (by hand, like a reel under a finger) or **WAVE** (wavetables). See [TAPE](06-tape.md).

### Concepts: DRUM

A drum kit on one Part: twelve pads, each with its own machine (TONE KICK, TONE SNARE, METAL HAT, PLAIN NOISE and more), its own filter, amp and modulation, and its own keys. One DRUM Part plays a whole kit from one MIDI channel. See [DRUM](07-drum.md).

> **Design note:** the engines have known ancestors, and none of them is a copy. MODAL builds on the maths of Émilie Gillet's Mutable Instruments Rings and Elements. ALGO's factory set includes Sounds ported from Yamaha TX81Z patches, which then wander off on six operators instead of four. TAPE's STRETCH follows the way a classic Akai S950 sampler stretched time, and its GRAIN type ports the grain engine of Mutable Instruments Beads. VA is Chimera's own clean-room design, meant to feel analogue while still able to go West Coast or East Coast. DRUM borrows the shape of an Elektron Analog Rytm kit and the structure of the Machinedrum's machines, from their manuals only: the algorithms and names are Chimera's own.

## Concepts: design ideas you will meet everywhere

These rules hold across the whole instrument. Knowing them makes the rest of the manual shorter.

### Concepts: changes glide, never snap

Turn a knob and the sound glides to the new value: a continuous control (a level, a cutoff, a send, MORPH) eases there over about 20 to 30 ms. A choice that changes the sound's structure (a filter TYPE, a WAVE, an algorithm, a machine) crossfades or waits for the next note, rather than jumping in the middle of one. The number on screen shows the new value at once; the arc or bar under it eases there.

**Why:** an instant jump in a level or a filter is heard as a click. Gliding every change makes turning a knob, a MIDI CC, RANDOMIZE or a program change sound clean while you play.

### Concepts: numbers show what you set

A value on screen is always the value you set. Modulation never moves the number. Where modulation matters, the screen draws it separately: a thin line under a cell's bar, or a faint band on the filter's picture from the cutoff you set to where modulation has it now.

**Why:** a number that jumps around while an LFO runs can't be read or set. You set the base; the picture shows the movement.

### Concepts: one D-pad everywhere

The same four keys move you everywhere: **MINUS** and **PLUS** go along (pages, Parts, rows), **EDIT** and **SEQ** go between a page and its sub-pages. This holds on a Part's pages, the mixer, the Sound browser, ORBIT and every SETTINGS list. See [The D-pad](02-panel-and-navigation.md#panel-the-d-pad).

**Why:** a key that means up on one screen and save on another can't be learned by hand. One meaning per key, everywhere.

### Concepts: hidden gestures always show a hint

The PreenFM3 has few buttons, so some actions are combos (MIX + a key) or holds. None of them is a secret: touch a cell, and the focus band shows the combos that cell answers to, with what they do. See [Hints](02-panel-and-navigation.md#panel-hints-in-the-focus-band).

**Why:** a combo nobody can find doesn't exist. A hint only for the cell you touched keeps the screen quiet the rest of the time.

### Concepts: labelled modules

Each page is one module of the instrument (an oscillator, a filter, an envelope, an effect) with up to six labelled controls, one per encoder, in a fixed place. Labels are full words where they fit (**REVERB**, **DELAY**, **CHORUS**) and are abbreviated only where they truly don't.

**Why:** like a Eurorack module, a page should be readable at a glance: what it is, what each knob does, and where that knob sits.

### Concepts: pages show what they do to the sound

The middle of the screen draws what the page does: the filter's real response, the algorithm's diagram, the LFO's cycle, the machine of a TAPE Sound, the reverb's cube. Each control has its own picture in the focus band (an arc, a crossfader, a level bar, a spirit level for STABILITY). A cell that does nothing in the current setting is dimmed, and touching it says why.

**Why:** you shape a sound by ear, but the picture tells you what you just changed and why a knob seems to do nothing.

### Concepts: safe by default

A dialog that could lose work (DELETE, CLEAR, SAVE OVER) opens on CANCEL, so a reflex press of EDIT does nothing harmful. A choice the instrument can't play (a formant operator past the CPU budget, a machine a streamed source can't feed) is shown dimmed with its reason, and nothing changes until you land on one it can.

**Why:** you should be able to explore without fear of losing a Sound or a project.
