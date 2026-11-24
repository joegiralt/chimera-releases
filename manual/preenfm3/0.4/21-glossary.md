# Glossary

Short definitions of the words this manual and the screen use, each with a link to the section that explains it in full. Screen labels are in capitals, as the screen shows them.

## Glossary: terms A to F

- **ALGO.** The six-operator phase-modulation engine, with 32 algorithms and a MORPH between two of them. See [ALGO](03-algo.md).
- **ALGORITHM (ALG).** How ALGO's six operators connect: which modulate which, and which are heard. See [the ALGORITHM page](03-algo.md#algo-the-algorithm-page-alg).
- **AMP.** The voice's VCA and low-pass gate page, last in the voice before stereo and the sends. See [AMP](08-voice-chain.md#amp-the-vca-and-low-pass-gate).
- **AUTO channel.** A MIDI channel that plays whichever Part you are editing. See [CONTROL CHANNELS](14-midi.md#midi-control-channels-mixer-sequencer-and-auto).
- **B1 to B6.** The six buttons under the screen. Each one selects a Part. See [the controls](02-panel-and-navigation.md#panel-the-controls).
- **Cell.** One of the six value boxes on a page, turned by the encoder below it. See [the cells](02-panel-and-navigation.md#panel-the-cells-and-how-values-move).
- **Chain, chain map.** A Part's pages in a row of nodes (for example ALG, OSC, FLT, AMP, MOD), drawn at the bottom of the screen. See [the screen](02-panel-and-navigation.md#panel-the-screen).
- **Choke group.** DRUM pads in one group cut each other off, like an open and a closed hi-hat. See [choke groups](07-drum.md#drum-choke-groups-and-voice-groups).
- **CHRD.** ORBIT's chord ring, which sets the harmony the other rings fit to. See [the CHRD page](12-orbit.md#orbit-the-chrd-page).
- **Controller map.** A list of up to 90 bindings from a controller's knobs to Chimera's parameters, kept on the card. See [controller maps](14-midi.md#midi-controller-maps).
- **D-pad.** MINUS and PLUS move along the chain; SEQ and EDIT move through a node's sub-pages. The same four keys work everywhere. See [the D-pad](02-panel-and-navigation.md#panel-the-d-pad).
- **Design note.** A boxed aside in this manual that tells where a part of Chimera came from and how it was modelled. It is not needed to play the instrument.
- **DFU.** The chip's own USB update mode, used when the normal update path is not available. See [DFU](19-updating-and-recovery.md#updating-over-usb-dfu-with-dfu-util).
- **DRUM.** The kit engine: twelve pads, each with its own machine, filter, amp and envelopes. See [DRUM](07-drum.md).
- **ENV A, ENV B.** The two kinds of envelope slot: A is an AHDSR, B a function generator that can also loop as an LFO or burst. See [envelopes](09-envelopes-and-lfos.md#envelopes-the-three-slots).
- **Exciter.** What sets a MODAL resonator ringing: a strike, a bow, a burst of noise. See [the EXC page](04-modal.md#modal-the-exc-page-exciter).
- **FACTORY.** The read-only Sounds that come with Chimera. Edits are saved to the LIBRARY. See [the FACTORY tab](16-card-sounds-library.md#sounds-the-factory-tab).
- **Focus band.** The upper part of the screen. It shows the touched cell large, with its glyph and the gestures it answers to. See [the focus band](02-panel-and-navigation.md#panel-the-focus-band).
- **FX slot.** One drive or shaping stage per voice (SOFT, FUZZ, FOLD), before or after the filter. See [the FX slot](08-voice-chain.md#fx-the-fx-slot).

## Glossary: terms G to M

- **Glide.** A value change eases to its target instead of jumping. Every continuous setting glides, so knob moves never click. See [design ideas](01-concepts.md#concepts-design-ideas-you-will-meet-everywhere).
- **Glyph.** The small picture beside a focused value: an arc, a waveform, a staff, a level. See [the focus band](02-panel-and-navigation.md#panel-the-focus-band).
- **Hint.** A line in the focus band that names the hidden gestures the touched cell answers to, such as MIX + SEQ LEARN. See [hints](02-panel-and-navigation.md#panel-hints-in-the-focus-band).
- **INIT.** The clean starting Sound of each engine. See [INIT](16-card-sounds-library.md#sounds-init-the-clean-start-for-each-engine).
- **KIT keymap.** Which MIDI keys play which DRUM pad. See [the KIT keymap](07-drum.md#drum-the-kit-keymap-and-tonal).
- **Learn.** Binding a controller's knob to a cell by touching the cell and moving the knob. See [learn](14-midi.md#midi-learn).
- **LFO.** A low-frequency oscillator. Each Sound has three LFO slots, CLASSIC or FUNC. See [LFOs](09-envelopes-and-lfos.md#lfos-the-three-lfo-slots).
- **LIBRARY.** Your own Sounds, saved on the card and loadable into any project. See [the LIBRARY tab](16-card-sounds-library.md#sounds-the-library-tab).
- **Low-pass gate (LPG).** A VCA and a low-pass filter moved together, so a note gets darker as it gets quieter. See [AMP](08-voice-chain.md#amp-the-vca-and-low-pass-gate).
- **Machine.** In TAPE, the way a source is played (WALK, STRETCH, SCRUB, WAVE). In DRUM, the sound model of a pad (TONE KICK, METAL HAT, NONE). See [TAPE](06-tape.md#tape-the-deck-page) and [every machine](07-drum.md#drum-every-machine).
- **Master effects.** The chorus, delay, reverb and compressor shared by all six Parts, on the MIXER chain. See [how the effects are wired](11-mixer-and-master-fx.md#mixer-how-the-effects-are-wired).
- **MIX.** The key that, held, turns other keys into secondary actions (MIX + …). See [key combos](02-panel-and-navigation.md#panel-key-combos-and-holds).
- **MIXER.** The pages for each Part's level, voices, EQ and sends, and for the master effects. See [the MIXER](11-mixer-and-master-fx.md).
- **MODAL.** The physical-modelling engine: an exciter sets a resonator (string, bank, bowed, sympathetic) ringing. See [MODAL](04-modal.md).
- **Mod matrix (MTX).** The grid of every modulation route of a Sound: sources down the side, destinations across. See [the matrix page](10-mod-matrix.md#mod-the-matrix-page).
- **MORPH.** ALGO's blend between ALG A and ALG B. See [the ALGORITHM page](03-algo.md#algo-the-algorithm-page-alg).
- **MPE.** MIDI Polyphonic Expression: per-note pitch, pressure and slide from an MPE controller. See [MPE zones](14-midi.md#midi-mpe-zones).

## Glossary: terms N to R

- **NRPN.** A MIDI message that addresses a parameter by number. Every stored parameter of Chimera has a fixed NRPN address. See [NRPN addresses](14-midi.md#midi-nrpn-addresses).
- **Node.** One stop on the chain map, such as FLT. A node can hold sub-pages. See [the D-pad](02-panel-and-navigation.md#panel-the-d-pad).
- **ORBIT.** The ring sequencer: a chord ring and five step rings that play Parts or kit pads. See [ORBIT](12-orbit.md).
- **Part.** One of six instruments, each with its own Sound, engine, MIDI channel and mixer strip. See [Parts](01-concepts.md#concepts-parts).
- **Pickup.** A controller knob takes over a value only once it passes the value's current position, so nothing jumps. See [the MIDI MAP page](14-midi.md#midi-the-midi-map-page).
- **Pool.** The project's memory for Sounds and TAPE sources. See [the sound pool](20-limits.md#limits-the-sound-pool-the-projects-memory).
- **Priming.** Picking a destination on the matrix before choosing a source for it. See [priming](10-mod-matrix.md#mod-priming-a-destination).
- **Project.** Six Parts with their Sounds, the mixer and ORBIT, saved together on the card. See [projects](01-concepts.md#concepts-projects).
- **RANDOMIZE.** Rolls the active Part's Sound from a seed, in a chosen style. See [PART](13-settings.md#settings-part).
- **RESERVE.** Voices a Part keeps for itself so other Parts cannot steal them. See [VOICES and RESERVE](20-limits.md#limits-voices-and-reserve-per-part).
- **Resonator.** The ringing body of a MODAL voice. See [the RES page](04-modal.md#modal-the-res-page-resonator).
- **Ring.** One of ORBIT's circular step patterns. See [how a ring makes a rhythm](12-orbit.md#orbit-how-a-ring-makes-a-rhythm).
- **Route.** One connection from a modulation source to a destination, with an amount. Every modulation in Chimera is a route. See [every connection is a route](10-mod-matrix.md#mod-every-connection-is-a-route).

## Glossary: terms S to Z

- **Scala file.** A text file that describes a tuning. Chimera reads them from the card. See [Scala files](15-tuning.md#tuning-scala-files).
- **Scene.** A stored ORBIT state you can switch to in time. See [scenes](12-orbit.md#orbit-the-scn-page-scenes).
- **Sends.** How much of a Part goes to the chorus, delay and reverb. See [SENDS](08-voice-chain.md#sends-chorus-delay-and-reverb).
- **SETTINGS.** The menu behind MENU: projects, Parts, MIDI, audio, personal choices and system pages. See [SETTINGS](13-settings.md).
- **Shedding.** When the CPU runs out, Chimera fades voices out, released tails first, instead of glitching. See [shedding](20-limits.md#limits-when-the-cpu-is-full-shedding).
- **SMART EQ.** A Part EQ that carves room for the Part by its ROLE in the mix. See [SMART EQ](11-mixer-and-master-fx.md#mixer-smart-eq).
- **SNAP.** Fits played keys to a scale, per Part. See [how SNAP and tuning meet](15-tuning.md#tuning-how-snap-and-tuning-meet).
- **Sound.** A Part's patch: its engine and every setting of its voice. See [Sounds](01-concepts.md#concepts-sounds).
- **Source.** A sample on the card that a TAPE Part plays. See [sources and memory](06-tape.md#tape-sources-and-memory).
- **STABILITY.** How steady VA's oscillators and some filters are. Lower values drift like old analogue circuits. See [STABILITY](05-va.md#va-stability).
- **Streaming.** A TAPE source too long for memory plays straight from the card. See [streaming](20-limits.md#limits-tape-sources-and-streaming).
- **Sub-page.** A page under a node, reached with SEQ and EDIT. See [the D-pad](02-panel-and-navigation.md#panel-the-d-pad).
- **TAPE.** The sample engine, with its machines and 12-bit character. See [TAPE](06-tape.md).
- **Toast.** A short message that appears over the screen and goes away by itself, such as SAVED. See [card messages](16-card-sounds-library.md#card-messages-and-what-to-do).
- **VA.** The virtual analogue engine: two variable-wave oscillators combined by a MODE, with SUB and NOISE. See [VA](05-va.md).
- **Voice.** One sounding note. Chimera shares a pool of voices among the six Parts. See [the voice pool](20-limits.md#limits-the-voice-pool).
- **Voice chain.** The path a note takes: engine, filter, FX slot, AMP, stereo, sends. See [the voice chain](01-concepts.md#concepts-the-voice-chain).
