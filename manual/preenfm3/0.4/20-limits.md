# Limits: voices, CPU and memory

This chapter covers the instrument's ceilings and what happens at each: voices and stealing, **VOICES** and **RESERVE**, the CPU readout, the pool, TAPE streaming, and list sizes. Parts and Sounds are in [Concepts](01-concepts.md).

## Limits: the voice pool

Chimera has **eight voices**, shared by all six Parts. A voice plays one note or one DRUM hit; any Part can use any free voice, and a MONO Part uses one at a time. Eight is the most that ever sound; how many a Sound gets depends on its cost ([the voice budget](#limits-the-voice-budget-why-rich-sounds-get-fewer-voices)).

**Why eight:** each voice keeps its state in the chip's fastest memory, and a MODAL voice needs a delay line long enough for a bass guitar's low G. Eight of those are what that memory holds.

## Limits: the voice budget, why rich Sounds get fewer voices

Each 64-sample block (1.33 ms) must be computed before the next is due. About three quarters of the chip's time goes to audio; the rest runs the screen, controls, MIDI and card.

Each Sound has a **cost**, measured on the unit: more ALGO operators and links, a moving filter, FUZZ or FOLD, the low-pass gate, many routes or a costly filter TYPE all add to it. Before a note starts, Chimera checks that it fits beside the voices sounding, the shared effects and ORBIT; if not, a voice is [stolen](#limits-voice-stealing). So a Part beside a heavy Sound gets fewer notes than alone.

| Sound | Voices |
|---|---|
| Simple (a one-oscillator VA, a light ALGO patch) | All eight |
| Rich (two morphing six-operator algorithms, a modelled filter, a fuzz) | About six |
| The costliest ALGO Sound | At least four; three with a formant operator |

ALGO's formant (FRMT) and noise (NOIS) operators are the one place a choice is refused for cost: a WAVE or ALG that would go under that floor shows dimmed with `OVER BUDGET` (or `BUDGET FULL · OTHER FORMANTS`), and nothing changes ([ALGO](03-algo.md)).

The chip revision matters too: revision V runs at 480 MHz, revision Y at 400 MHz, so a Y unit gets a voice or so fewer. AUDIO LOAD shows yours (`REV V  480 MHZ`).

**Why:** each Chimera note runs its own engine, filter model, FX slot, amp, gate, stereo and modulation. Chimera spends the chip on rich voices and accepts six to eight of a typical patch; billing each Sound by what it uses gives light Sounds every voice there is.

> **Design note:** every cost in Chimera was measured on a real PreenFM3 with a cycle counter, worst block first, then rounded up. When a reading came back higher than its bill, the bill went up. When it came back lower, it stayed put until a second reading agreed. Accountants would approve; synth players mostly just notice that nothing glitches.

## Limits: voice stealing

When no voice is free, or the budget has no room, Chimera takes one:

1. A Part re-playing its own key reuses that key's voice; a MONO Part always reuses its one voice.
2. Otherwise the oldest released note (a tail) goes first.
3. Only then the oldest held note.
4. A MONO Part's voice is never stolen by another Part.

**VOICES** and **RESERVE** change who may be taken (below). A stolen voice fades over about 3 ms, then the new note starts clean. Within a Part, PITCH's **STEAL** decides whether the new note cuts in or glides ([The voice chain](08-voice-chain.md)).

**Why:** a tail is the least missed; held notes are what you are playing.

## Limits: VOICES and RESERVE per Part

Two voice limits sit on the Part's mixer VOICES page (MIXER › PRT, then SEQ; VOI on the chain map). They belong to the project's mix, not the Sound.

![VOICES page, annotated](img/mixer_voi.png)

1. Header: `PART 1 · MIX`, the VOICES page.
2. The focused cell, MODE, and its value.
3. The hint: `MIX + B1-6 PART` opens another Part's VOICES.
4. The picture: all six Parts' levels, the current one in accent.
5. **MODE** (encoder 1): MONO or POLY.
6. **VOICES** (encoder 2): the cap, AUTO or 1–8.
7. **RESERVE** (encoder 3): voices guarded, 0–8.
8. The chain map: PRT.
9. The sub-pages: PRT, VOI (VOICES), EQ.

| Cell | Range | Default | What it does |
|---|---|---|---|
| **MODE** | MONO, POLY | POLY | One voice at a time, or one a note |
| **VOICES** | AUTO, 1–8 | AUTO | The most voices the Part sounds, tails included; at the cap a new note takes the Part's own oldest tail, else oldest held note |
| **RESERVE** | 0–8 | 0 | Held notes up to this many can't be stolen by other Parts |

**VOICES** stops a long-release pad eating the pool; **RESERVE** keeps a bass or lead intact under busy chords. A reserve guards held notes (and DRUM hits until they end), never tails, and never holds free voices back. RESERVE's focus band shows the total booked, `RESERVES 3/8`.

A Part's RESERVE can't exceed its VOICES, and all reserves together can't exceed eight. A turn past that is held dimmed with its reason (`RESERVE 3 · VOICES 2`, `RESERVES 9 · POOL HOLDS 8`); a CC or the editor asking the same gets the message as a toast.

**Why:** with one shared pool, the busiest Part would otherwise always win. The cap stops one Part taking everything; the reserve promises another what it needs. Both are off by default.

## Limits: when the CPU is full, shedding

When the voices already sounding no longer fit (a costlier filter TYPE, a FUZZ, ORBIT starting), Chimera **sheds** voices: tails first, oldest first, then the newest held note, reserved voices last. A shed voice fades over two blocks (about 3 ms) on the sound it had before the change, so the edit is never heard as a click. A new note waits for a fading voice rather than cutting a held one, starting at most about 3 ms late.

As a safety net, if a block ever takes more than 95 % of its time, Chimera sheds one more voice before the next block, until the load is back under. A shed voice always fades, never cuts.

**Why:** a late block glitches every Part at once; losing the quietest note, faded, is far less noticeable.

## Limits: CPU and the load readout

The header's `CPU 23%` ([The panel](02-panel-and-navigation.md#panel-the-cpu-readout-in-the-header)) is the share of each block's time the audio took, averaged over a few frames: grey to 60 %, amber to 80 %, red above. High numbers are normal, since the budget fills the audio's share on purpose; glitches are not. If you hear one, check AUDIO LOAD.

### Limits: the AUDIO LOAD page

SETTINGS › SYSTEM › DIAGNOSTICS › AUDIO LOAD (AUD LOAD).

![AUDIO LOAD page, annotated](img/settings_system_diag_aud_load.png)

1. Header: where you are in SETTINGS.
2. The focused cell, LOAD.
3. Its glyph, an arc of the load.
4. The picture: chip revision and clock (`REV V  480 MHZ`), last restart cause (`RST WDOG` for the watchdog), and a load bar with the 75 % mark.
5. **LOAD** (encoder 1): average load, % of block time.
6. **PEAK** (encoder 2): the worst block since power-on.
7. **OVER** (encoder 3): blocks that missed their deadline, each a glitch; should stay 0.
8. **DROPS** (encoder 4): notes and MIDI events dropped by a full queue, one count per note source, joined by `/`.
9. **DESYNC** (encoder 5): a timing count for diagnosis; should stay at or near 0.
10. **STACK** (encoder 6): the most working memory the audio has used, in K.
11. Footer: the project and its state.
12. Footer: MENU goes back.

The numbers are read-only. If OVER or DROPS climb in normal playing, note what was playing and [report it](19-updating-and-recovery.md#recovery-reporting-a-bug).

**Timing.** Notes land on block edges, every 1.33 ms. While ORBIT plays, part of the budget is kept for it and for up to five notes starting in one block, leaving a little less room for voices.

## Limits: the sound pool, the project's memory

A project's Sounds and TAPE sources share one 160 KB **pool**:

- **Sounds**: up to 128 slots. A Sound is stored as its differences from its engine's INIT, so most take 0.1K to 0.5K, none more than about 3K.
- **TAPE sources**: up to 32. Short ones are held whole; long ones keep only their first tenth of a second here and [stream](#limits-tape-sources-and-streaming) the rest.

The six Parts' current Sounds don't count: each Part plays its own copy.

![POOL page, annotated](img/settings_project_pool.png)

1. Header: SETTINGS › PROJECT › POOL.
2. The focused cell, USED, in %.
3. Its glyph, an arc of the same.
4. The picture: Sounds in white, sources in grey, a faint part being freed, then free space.
5. **SOUNDS** (encoder 1): how many, and their memory (`17 · 5.8K`).
6. **SOURCES** (encoder 2): how many, and their memory.
7. **FREE** (encoder 3): what is left.
8. Footer: the project and its state.
9. Footer: MENU goes back.

The same meter sits under the Sound browser, whose rows and hints show each cost (`MIX + EDIT SAVES · +0.3K`, `MIX + MINUS CLEARS · FREES 0.3K`).

### Limits: when the pool is full

Chimera says so and changes nothing:

| Action | Message |
|---|---|
| Saving a Sound to the project | `POOL FULL`, `NEEDS 2.0K, 0.2K FREE`; a full 128 slots also refuses |
| Loading a card source on TAPE's SRC | `WON'T FIT · NEEDS 41K, 12K FREE`, the meter previewing it in red |
| Loading a library Sound whose source won't fit | Said before loading |

![The Sound browser with the pool full](img/sound_browser_pool_full.png)

Clear unused Sounds (MIX + MINUS on the PROJECT tab; not one a Part uses), or SETTINGS › PROJECT › PURGE UNUSED SRC (the files stay on the card).

**Why:** the pool is what memory is left after voices and delay lines. One meter for Sounds and sources tells you how full the project is, and sparse Sounds let it hold many more than fixed slots would.

## Limits: TAPE sources and streaming

A source is 12-bit audio at its own rate, 4 to 48 kHz (24 kHz usual). At 24 kHz the whole pool holds only about four and a half seconds, so:

- **A short source** loads whole; every machine and direction plays it.
- **A long source** streams from the card, its first tenth of a second kept in the pool so notes start at once. SOURCE then shows how many notes can stream at the root pitch (`24K · 30.0 S · 7 STREAMS`); higher notes read faster and take more of the card.
- **A stream can't** play backwards or jump: REVERSE, PING, STRETCH, SCRUB and WAVE are dimmed with the reason (`REVERSE NEEDS RAM`, `STRETCH NEEDS RAM`, `… NEEDS RAM · STREAMED`).
- **When the card can't keep up**, a new streamed note can stop a streamed tail, never a held note another Part reserves; failing that, it doesn't play and reads `STREAMS FULL`.
- **A damaged file** reads `BAD FILE · DROPS OUT`; only its notes drop out.

The machines are in [TAPE](06-tape.md).

**Why:** the card is large and memory small; streaming trades the read-anywhere machines for length.

## Limits: lists, maps and names

| What | Limit | Past it |
|---|---|---|
| Sound slots in a project | 128 | A new slot is refused |
| TAPE sources in a project | 32 | Refused; purge unused ones |
| Projects in LOAD PROJECT and MANAGE PROJECTS | 48 | The rest don't show |
| Card sources listed on SRC | 64 | The rest don't show |
| Rows per Sound browser page | 48 | `NEXT ›` / `OLDER ›` |
| Scala files TUNING walks | First 128 | The rest don't show ([Tuning](15-tuning.md)) |
| Maps listed on MIDI MAP | 16 | `CARD HOLDS MORE: 16 SHOWN` |
| Rows in a controller map (a flat list) | 90 | `MAP FULL` |
| A Sound's own MIDI rows | 16 | `MAP FULL` |
| SysEx controls in one map | 16 | `MAP FULL` |
| MOD matrix destinations per Sound | 16 | `MATRIX FULL` ([The mod matrix](10-mod-matrix.md)) |
| Voice groups in a DRUM kit | 8 | A ninth CHOKE group is held dimmed ([DRUM](07-drum.md)) |
| A name (project, Sound, map) | 16 characters | The cursor stops |
| A factory Sound's description | 40 characters | |
| Incoming MIDI events waiting | 64 | Counted in DROPS; note-offs have room of their own, so no note hangs |

**Why:** Chimera never allocates memory while it plays, so every list read from the card has a fixed size, chosen to cover normal use.

## Limits: the firmware's size, and NEEDS UPDATE

The chip's built-in program memory is small. Chimera keeps most of the engines, the effects, ORBIT and much of MIDI in a second part installed from `CHIMERA.BK2`. Without it, or with one from another version, those parts stay silent and say **UPDATE** or **NEEDS UPDATE**: copy the matching `CHIMERA.BK2` to the card and restart ([Updating and recovery](19-updating-and-recovery.md)).

**Why:** the chip was chosen for speed, not program memory. The two halves always come from the same release and install as one update.
