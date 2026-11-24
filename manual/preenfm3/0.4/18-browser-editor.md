# The browser editor

The browser editor is a sound editor that runs in a web browser and talks to Chimera over the USB cable. It shows the Sound on the unit's current Part on one screen: turn a control in the editor and the unit follows, turn a knob on the unit and the editor follows. This chapter covers what it needs, how to connect, what it shows and what its messages mean. The pages it mirrors are described in the engine chapters ([ALGO](03-algo.md), [MODAL](04-modal.md), [VA](05-va.md), [TAPE](06-tape.md), [DRUM](07-drum.md)), [the voice chain](08-voice-chain.md), [the mod matrix](10-mod-matrix.md) and [the mixer](11-mixer-and-master-fx.md). The USB connection itself is in [USB](17-usb.md).

## Editor: what you need

- **Chimera 0.4 or later** on the unit. An older unit is refused (see [Editor: messages](#editor-messages)).
- **Chrome, Edge or another Chromium browser** on a computer. The editor reaches the unit through Web Serial, which Safari, Firefox and phones don't have. In a browser without it, the editor says **USE CHROME OR EDGE**.
- The PreenFM3 running Chimera, connected with a USB cable that carries data.

Nothing is installed on the computer: the editor is a web page. Open it from the **EDITOR** page of the Chimera website (**OPEN THE EDITOR**).

**Why Web Serial:** Chimera already has a text console on its USB port. The editor speaks to that same port, so it needs no driver, no app and no extra firmware mode, and it works the same on every computer that runs Chrome.

## Editor: connecting to the unit

1. Connect the PreenFM3 to the computer and turn it on as usual, so it plays Chimera.
2. Open the editor and press **CONNECT UNIT**.
3. The browser asks which device to use: pick the PreenFM3 and press **Connect**.

While the editor reads the unit, it says **READING THE UNIT**. Then it shows the current Part's page. Its title names the Part and engine (`PART 1 · VA`), and the top bar shows the link as live.

Before you connect, the page says **NOT CONNECTED** and the top bar **NO UNIT**.

Only one program can hold the unit's USB port at a time. If the update tool is running, the editor says **THE PORT IS IN USE (CLOSE chimera-usb.py)**: let the update finish, then connect.

The editor also has a **CONNECT SIMULATOR** button. It is for people who build Chimera from its source code and run its desktop simulator; with a PreenFM3, use **CONNECT UNIT**.

## Editor: what it shows

The page is laid out like a hardware panel, built from what the unit itself describes. Every control shows the value the unit has stored, never a guess.

- **The top bar.** **CHIMERA**, then a tab per Part, **P1** to **P6**, each named by its engine (ALGO, MODAL, VA, TAPE, DRUM). Click a Part's tab to edit it: the unit moves to that Part too. After the Part tabs comes the **MIXER** tab. At the right are the **DAY | NIGHT** theme switch and the link.
- **SHOW.** A row of chips that show or hide groups of modules: **ALGORITHM**, **PITCH**, **OPERATORS**, **OSCILLATORS**, **RESONATOR**, **TAPE**, **FILTER**, **FX**, **AMP**, **ENVELOPES**, **LFOS**, **MOD**, **KIT**, **OUT**, **PAD** and the rest, as the page has them. **FOLD ALL** and **OPEN ALL** fold or open every module.
- **The unit's screens.** Each page's picture (the algorithm, the filter's response, an envelope, an LFO) is drawn as the unit draws it, and moves as the values change.
- **Knobs, faders and choices.** Drag a knob up or down, or use the mouse wheel or the arrow keys, to turn it. **Double-click** a knob to set it back to its default. A choice with more than eight options opens a list.
- **The MOD patch bay.** The Part's mod matrix as a patch bay: sources as jacks on the left, destinations on the right, one cable per route. Drag from an output to an input to patch a route. Each cable has a small knob at its middle for the amount: drag it up or down, double-click it to unpatch. Cable colour is the sign: amber adds, blue subtracts. The **PATCH | MATRIX** switch shows the same routes as a grid instead.
- **DRUM.** On a DRUM Part, a strip of the kit's pads, named by their machines, picks the pad you edit.
- **The MIXER.** A channel strip per Part and the **OUT** strip, then the effects in a row of tabs with the chosen one's controls and its picture.
- **OTHER.** Anything the unit describes that the editor's layout doesn't place yet is shown in an **OTHER** module, so nothing is hidden.

When the editor changes a cell on the page the unit is showing, the unit's focus moves to that cell, as if you had turned its knob.

**Why the editor follows the unit:** the unit stays the instrument. The editor never keeps its own copy of a Sound: every value it shows is the unit's, read back after each change, so the screen in front of you and the synth on the desk always agree.

> **Design note:** the pictures in the editor aren't copies of the unit's screens. They are the unit's own drawing code, the same code that runs on the PreenFM3, compiled for the browser and fed the unit's values. When the filter curve bends in the editor, it bends by exactly the same maths as on the synth. The DAY theme is a cream panel in the spirit of a Cascadia; NIGHT is the dark of the unit itself. Both are kind to your eyes, which is more than can be said for some 1980s rack units.

## Editor: messages

Messages from the unit and the editor appear in a **THE UNIT SAID** module at the top of the page. Press **SEEN** to clear them. A message that repeats shows a count (`×3`).

| Message | What it means | What to do |
|---|---|---|
| **THIS EDITOR NEEDS CHIMERA 0.4 OR LATER. THIS UNIT IS RUNNING 0.3.0.** | The unit's firmware is too old for the editor | Update the unit (see [Updating and recovery](19-updating-and-recovery.md)). The editor shows **DOWNLOAD CHIMERA 0.4 OR LATER**, a link to the releases page |
| **USE CHROME OR EDGE** | The browser has no Web Serial | Open the editor in Chrome, Edge or another Chromium browser |
| **THE PORT IS IN USE (CLOSE chimera-usb.py)** | Another program holds the unit's USB port | Close it, then connect again |
| **THE UNIT WAS DISCONNECTED** | The cable came out, or the unit was turned off | Reconnect and press **CONNECT UNIT** |
| **THE UNIT STOPPED ANSWERING** | The unit stopped replying | Check the cable, then reconnect |
| **UPDATE THE EDITOR** | The unit is newer than this editor | Reload the editor page to get the current one |
| **THE UNIT REFUSED: …** | The unit turned down a change, and says why | Read the reason. A refused control shows the reason when you point at it |
| **NOT TAKEN: THE UNIT KEPT ITS VALUE** | A change didn't land, and the unit kept its value | Try again |
| **THE TURN OF … WAS NOT SENT: THE BOX TOOK ANOTHER PART** | The unit moved to another Part or Sound while you were turning | The editor now shows the new Part. Turn again |

If the unit is busy for a moment, the editor asks again quietly and only shows a message if it gives up.

**Why the editor says so plainly:** an editor that silently drops a change leaves you wondering what the synth is really doing. Every refusal comes back in the unit's own words, and the control keeps the unit's value, never the one you hoped for.
