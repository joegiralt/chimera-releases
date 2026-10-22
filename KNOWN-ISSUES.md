# Known issues

Check here before filing. Known and being worked on.

## Sound

- The ROOM reverb can leave a faint high-pitched ring in its tail after a sharp hit such as a snare
- Under the heaviest load (every voice of every Part playing, all effects on), a big chord landing at once can cause a single tiny click
- VA: RING with saw waves can click at the start of a note, and switching MODE to SYNC while a note is held can click once
- Some knobs only take effect at the next note: a held note doesn't follow them. Among them: MODAL's exciter and body controls, and TAPE's START, END, XFADE and DRAG

## TAPE

- INIT TAPE has no source, so it is silent until you pick one on SRC. The screen doesn't yet say why
- On WAVE, SOURCE lists every source, not only wavetables; a source that isn't one won't play there
- A long source on a card that has been filled and emptied many times can read `FRAGMENTED · COPY IT AGAIN` and won't stream. Copying it again doesn't always help yet
- A project whose TAPE sources didn't all fit in memory when it loaded can show SOURCE MISSING for a source that is on the card
- Rarely, a streamed source drops out for a moment under fast, dense chords
- Turning START while a streamed source plays can cut the note sharply
- Turning TAPE's MODEL from a MIDI CC changes the machine but doesn't set its knobs to the machine's defaults, as turning the encoder does

## Screen

- On the FILTER page, the picture for CLEAN's NOTCH2 mode is a sketch of the response, not the filter's real response
- A cell's bar can follow modulation while its number shows the value you set, so the two can disagree
- In the Sound browser, the selected row's cost can run into its engine name (`0.3KMODAL`)

## MIDI

- A MIDI CC move can be lost while the card is busy (saving, loading, or streaming TAPE hard)

## Hardware

- PreenFM3s with the newer "1.6 - 100" main board are detected, and their knobs and buttons should work, but this hasn't been tried on that board yet. If yours is one, please tell us how it goes (SETTINGS › SYSTEM › ABOUT shows the board next to the chip revision)
- Push encoders (SETTINGS › SYSTEM › PUSH ENCODERS): push to jump a value to its default, push and turn for fine steps. Untested on push-encoder hardware so far; reports welcome

## Not a bug: hum when powered over USB

If you hear a faint buzz or whine with the PreenFM3 powered over USB from the same computer your audio interface is connected to, that's a ground loop between the two. Power the PreenFM3 from its 9 V DC supply (or use a USB isolator) and it goes away.
