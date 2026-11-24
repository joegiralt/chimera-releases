# Chimera 0.4 manual for the PreenFM3

The complete reference for Chimera 0.4, multi-engine firmware for the PreenFM3 synthesizer. It explains every page, cell and gesture, and why the instrument works the way it does. Labels are written as the screen shows them.

New to Chimera? The [quick start](https://joegiralt.github.io/chimera-releases/guides/quick-start) gets you playing in a few minutes, and the [FAQ](https://joegiralt.github.io/chimera-releases/guides/faq) answers short "how do I" questions. This manual is the full reference behind both.

The whole manual is also one file, [manual.md](manual.md), for reading offline or for handing to an LLM. [llms.txt](llms.txt) points to it.

## Manual: chapters

**Getting around**

1. [Concepts: Parts, Sounds, projects and the voice chain](01-concepts.md)
2. [The panel and navigation](02-panel-and-navigation.md)

**The engines**

3. [ALGO](03-algo.md)
4. [MODAL](04-modal.md)
5. [VA](05-va.md)
6. [TAPE](06-tape.md)
7. [DRUM](07-drum.md)

**Shaping the voice**

8. [The voice chain: pitch, filter, FX, amp, stereo and sends](08-voice-chain.md)
9. [Envelopes and LFOs](09-envelopes-and-lfos.md)
10. [The mod matrix](10-mod-matrix.md)

**The whole instrument**

11. [The MIXER and the master effects](11-mixer-and-master-fx.md)
12. [ORBIT, the ring sequencer](12-orbit.md)
13. [SETTINGS](13-settings.md)
14. [MIDI](14-midi.md)
15. [Tuning](15-tuning.md)

**Files, connections and care**

16. [The SD card, Sounds and the library](16-card-sounds-library.md)
17. [USB: audio, MIDI and the console](17-usb.md)
18. [The browser editor](18-browser-editor.md)
19. [Updating and recovery](19-updating-and-recovery.md)
20. [Limits: voices, CPU and memory](20-limits.md)
21. [Glossary](21-glossary.md)

## Manual: how to read it

- Each chapter covers one subject. Each section covers one topic, and its heading is unique in the whole manual, so a link to it stays put.
- Cells and pages are in bold capitals, as on the screen: **CUTOFF**, **FX PLACE**. Option values are in capitals: LP4, FUZZ.
- A page has a short name on the chain map (FLT) and a full name on its tab (FILTER). The manual gives both.
- Continuous knobs read 0 to 127 unless the screen shows a unit (Hz, ms, dB, %).
- Paragraphs headed **Why:** give the reasoning behind a design choice.
- This manual describes the firmware version in its title. Each release has its own copy.
