# Known issues

Check here before filing. Known and being worked on. Chimera 0.4.0.

## USB

- **USB MIDI and USB audio are verified on Linux only.** macOS and Windows should work without a driver, since Chimera is a class-compliant USB MIDI and audio device, but they haven't been tried. Computer sleep, and unplugging and replugging the USB cable, haven't been tried either. If you use a Mac or Windows, please tell us in a [new issue](../../issues/new/choose) whether the unit shows up, plays MIDI and records audio.
- **Windows USB audio can glitch when Chimera is both the input and the output**, for example recording in FL Studio with ASIO4ALL.
- **USB MIDI is one port, not six.** Chimera shows up as one MIDI port, **Chimera**, carrying all 16 channels; each Part still plays from its own channel.
- On Linux, PipeWire may start the Chimera audio output at 40 % volume. Set it to 100 % in your sound settings.

## DRUM

- TONE TOM's NOISE is very subtle. It is planned for 0.5 ([issue 25](https://github.com/joegiralt/chimera-releases/issues/25)).

## Sound

- The ROOM reverb can leave a faint high-pitched ring in its tail after a sharp hit such as a snare
- Under the heaviest load (every voice of every Part playing, all effects on), a big chord landing at once can cause a single tiny click
- VA: RING with saw waves can click at the start of a note
- Some knobs only take effect at the next note: a held note doesn't follow them. Among them: MODAL's exciter and body controls, and TAPE's START, END, XFADE and DRAG

## TAPE

- INIT TAPE has no source, so it is silent until you pick one on SRC. The screen doesn't yet say why
- On WAVE, SOURCE lists every source, not only wavetables; a source that isn't one won't play there
- A long source on a card that has been filled and emptied many times can read `FRAGMENTED · COPY IT AGAIN` and won't stream. Copying it again doesn't always help yet
- Rarely, a streamed source drops out for a moment under fast, dense chords
- Turning START while a streamed source plays can cut the note sharply

## Screen

- On the FILTER page, the picture for CLEAN's NOTCH2 mode is a sketch of the response, not the filter's real response
- A cell's bar can follow modulation while its number shows the value you set, so the two can disagree

## MIDI

- A MIDI CC move can be lost while a Sound or project loads from the card

## Hardware

- PreenFM3s with the newer "1.6 - 100" main board are detected, and their knobs and buttons should work, but this hasn't been tried on that board yet. If yours is one, please tell us how it goes (SETTINGS › SYSTEM › ABOUT shows the board next to the chip revision)
- Push encoders (SETTINGS › SYSTEM › PUSH ENCODERS): push to jump a value to its default, push and turn for fine steps. Untested on push-encoder hardware so far; reports welcome

## Not a bug: hum when powered over USB

If you hear a faint buzz or whine with the PreenFM3 powered over USB from the same computer your audio interface is connected to, that's a ground loop between the two. Power the PreenFM3 from its 9 V DC supply (or use a USB isolator) and it goes away.

## Found something else?

Please [open an issue](../../issues/new/choose) in this repository.
