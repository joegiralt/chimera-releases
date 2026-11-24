# USB, MIDI, audio and the console over one cable

One USB cable carries MIDI both ways, Chimera's main out to the computer, the computer's sound into the main out, and a console for the update tool and the browser editor. This chapter covers each, how Chimera shows up on a computer, and per-system notes. See also [MIDI](14-midi.md), [the card](16-card-sounds-library.md), [the browser editor](18-browser-editor.md) and [Updating and recovery](19-updating-and-recovery.md).

## USB: what the cable carries

Use a data cable (some only charge). While Chimera runs it shows up as one device, **Chimera**:

| Part | Shows up as | For |
|---|---|---|
| MIDI | port **Chimera**, in and out | Playing and controlling, as on DIN ([USB MIDI](#usb-midi)) |
| Audio input | input **Chimera**, stereo | Recording the main out ([USB audio](#usb-audio)) |
| Audio output | output **Chimera**, stereo | Playing the computer through the main out |
| Console | a serial port | Update tool, editor, file transfers ([the console](#usb-the-console)) |

MIDI and audio are class compliant (no driver on Linux, macOS or Windows). DIN MIDI and the jacks keep working alongside.

## USB MIDI

Over USB, Chimera is one MIDI port, **Chimera**, both ways, carrying every channel as DIN does: each Part on its own channel, CONTROL CHANNELS and MPE zones alike, plus clock, SysEx, MTS, the identity reply, the parameter dump, ECHO and PARAM OUT. Everything in [MIDI](14-midi.md) applies. USB and DIN are heard side by side, and ECHO and PARAM OUT go out of both. If the computer resets or sleeps while holding a note or the pedal, Chimera releases them and shows `USB MIDI LOST`.

**Why one port, not one per Part:** a USB device's self-description must fit a fixed space. With the audio streams in it there is room for one MIDI port; six Part ports and audio don't fit, and audio won. Each Part still plays from its own channel.

> **Design note:** a USB device introduces itself with a descriptor, a little block of bytes the chip's USB library expects to fit a 256-byte box. Once, an early build sent a bigger one, and the unit stopped talking to the computer until it was put back by hand. Since then every USB layout is enumerated by a test on the computer before it is flashed, and the box has been fitted with a shoehorn and a very stern note.

## USB audio

Stereo, 24-bit, 48 kHz, both ways.

- **Input** (Chimera to computer): the main out after the master bus. Record it like any interface; the jacks keep playing.
- **Output** (computer to Chimera): mixed into the main out at the computer's own scale (full scale as loud as the synth at full scale). Chimera's clock sets the pace, so nothing drifts or clicks.
- The computer's sound joins after the point the input records, so a backing track played through Chimera is never recorded back. Turn off DAW input monitoring, or you hear Chimera twice.

### USB: the USB AUDIO page

**SETTINGS › AUDIO ROUTING › USB AUDIO** (USB on the settings chain) sets how loud the computer plays through Chimera.

![USB AUDIO page, annotated](img/settings_audio_usb.png)

1. Header: `SETTINGS › AUDIO › USB`.
2. Focused cell, large.
3. Its glyph: a knob.
4. Picture band.
5. **USB IN** (A).
6. Footer: project name and unsaved mark.
7. Footer: `A-F EDIT · MENU BACK`.

| Cell | Options | Default | What it does |
|---|---|---|---|
| **USB IN** (A) | OFF, -24dB, -18dB, -12dB, -9dB, -6dB, -3dB, 0dB | 0dB | Level of the computer's sound in the main out |

Changes and new streams fade in, never click. At 0dB a loud track over a loud patch can clip cleanly at full scale: turn one down. OFF keeps the output present but silent. USB IN is kept on the unit, not in the project.

**Why 0dB:** the computer plays as soon as it sends, like any class-compliant interface.

> **Design note:** USB IN is Chimera's take on the USB-to-main control on Elektron's boxes: the computer becomes one more voice, after the synth's effects. Recording leaves it out, as an interface does with loopback off, so nobody discovers the sound of infinite gain at 2 a.m.

## USB: the console

A serial port on the same cable, used by tools rather than typed into:

- **Updates:** `chimera-usb.py update` checks both halves, puts the second on the card, writes the first, and the unit installs the rest after restart ([Updating and recovery](19-updating-and-recovery.md)).
- **The browser editor**, through Web Serial in Chrome, Edge or another Chromium browser ([the browser editor](18-browser-editor.md)).
- **Files on the card** while Chimera runs: projects, library Sounds, TAPE sources, [controller maps](14-midi.md#midi-controller-maps-on-the-card) and [Scala tunings](15-tuning.md#tuning-putting-scala-files-on-the-card), sent in checked pieces through Chimera's own save ([the card](16-card-sounds-library.md)).
- **Bug reports:** `chimera-usb.py status` prints state and version; `chimera-usb.py shot` saves a PNG screenshot.

`chimera-usb.py` is one Python 3 file with no other dependencies, for Linux and macOS (`python3 chimera-usb.py help` lists commands). On Windows, use SD card access and the card install steps.

**Why a console too:** files and editor traffic are large and need replies; a serial port carries them without disturbing the music's MIDI port.

## USB: how Chimera shows up on a computer

Chimera uses the stock PreenFM3's USB ID, **0483:5740**, named **Chimera**; the serial port shares it. It is the same instrument running different firmware. The device version changes when the USB layout does, so Windows sets up its driver afresh.

Two modes belong to the bootloader, not Chimera:

- **SD card access:** hold **MENU** at power-on, then press **button 3**. The card mounts as a USB drive; no MIDI or audio.
- **DFU mode** (USB ID **0483:df11**), for installing; **SETTINGS › SYSTEM › OS UPGRADE** restarts into it ([Updating and recovery](19-updating-and-recovery.md)).

SETTINGS › SYSTEM › USB CONFIG is a dimmed placeholder (LATER): nothing to set.

> **Design note:** Chimera is a guest in someone else's beautifully built house. The hardware and bootloader stay as they are, and Chimera keeps the instrument's USB identity, so to your computer it is still a PreenFM3, now with opinions.

## USB: notes for Linux, macOS and Windows

USB MIDI and audio have been tried on Linux. macOS and Windows should work driverless but are untried; the known issues page says how to report what you find.

| System | Note |
|---|---|
| Linux | PipeWire may start the **Chimera** output at 40 % (about −24 dB): set it to 100 % |
| Linux | `chimera-usb.py` "no access": join the `dialout` group (log out and in) or run the `sudo tee` line it prints |
| Linux | `dfu-util` can't reach DFU mode: see the udev line in the install guide's troubleshooting |
| macOS | `chimera-usb.py` needs `pyserial`, updates need `dfu-util`; the site's install page walks a first-time Terminal user through both |
| macOS | Hidden `._name` files left by SD card access are never listed |
| Windows | After an update the driver may be set up again: let it finish, then pick **Chimera** again |
| Windows | `chimera-usb.py` doesn't run: use SD card access and the card install steps |
| All | The editor needs a Chromium browser; Safari, Firefox and phones lack Web Serial |
| All | A buzz when USB-powered from the audio computer is a ground loop: use the 9 V supply or a USB isolator |
| All | Sleep and replugging during USB audio are untried; starting and stopping recording works |
