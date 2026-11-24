# The browser editor

The browser editor is a sound editor that runs in a web browser and talks to Chimera over the USB cable. It shows the current Part's Sound on one screen: turn a control in the editor and the unit follows, turn a knob on the unit and the editor follows. This chapter covers what it needs, connecting, what it shows and its messages. The pages it mirrors are in the engine chapters ([ALGO](03-algo.md), [MODAL](04-modal.md), [VA](05-va.md), [TAPE](06-tape.md), [DRUM](07-drum.md)), [the voice chain](08-voice-chain.md), [the mod matrix](10-mod-matrix.md) and [the mixer](11-mixer-and-master-fx.md); the USB connection is in [USB](17-usb.md).

## Editor: what you need

- **Chimera 0.4 or later** on the unit.
- **Chrome, Edge or another Chromium browser.** The editor uses Web Serial, which Safari, Firefox and phones lack; there it says **USE CHROME OR EDGE**.
- A USB cable that carries data.

Nothing is installed: open the editor from the **EDITOR** page of the Chimera website (**OPEN THE EDITOR**).

**Why Web Serial:** the editor speaks to the text console Chimera already has on USB, so it needs no driver, app or extra firmware mode.

## Editor: connecting to the unit

1. Connect the PreenFM3 and turn it on as usual.
2. Press **CONNECT UNIT** in the editor.
3. Pick the PreenFM3 in the browser's list and press **Connect**.

The editor says **READING THE UNIT**, then shows the current Part's page, titled with Part and engine (`PART 1 · VA`), with the link live in the top bar. Before you connect it reads **NOT CONNECTED** and **NO UNIT**.

Only one program can hold the USB port: while the update tool runs, the editor says **THE PORT IS IN USE (CLOSE chimera-usb.py)**. **CONNECT SIMULATOR** is for people who build Chimera's desktop simulator from source.

## Editor: what it shows

The page is laid out like a hardware panel, built from what the unit describes, and every control shows the value the unit has stored.

| Part of the page | What it does |
|---|---|
| Top bar | **CHIMERA**, tabs **P1**–**P6** named by engine (clicking one moves the unit to that Part), **MIXER**, the **DAY \| NIGHT** theme switch and the link |
| **SHOW** | Chips that show or hide module groups (**ALGORITHM**, **PITCH**, **OPERATORS**, **OSCILLATORS**, **RESONATOR**, **TAPE**, **FILTER**, **FX**, **AMP**, **ENVELOPES**, **LFOS**, **MOD**, **KIT**, **OUT**, **PAD**…); **FOLD ALL**, **OPEN ALL** |
| Screens | Each page's picture (algorithm, filter response, envelope, LFO), drawn as the unit draws it |
| Knobs, faders, choices | Drag, mouse wheel or arrow keys to turn; **double-click** for the default; more than eight options open a list |
| MOD patch bay | Sources as jacks on the left, destinations on the right, a cable per route. Drag output to input to patch; the knob mid-cable sets the amount, double-click unpatches. Amber adds, blue subtracts. **PATCH \| MATRIX** shows the same routes as a grid |
| DRUM | A strip of pads, named by machine, picks the pad you edit |
| MIXER | A strip per Part, the **OUT** strip, and the effects as tabs with their pictures |
| **OTHER** | Anything the layout doesn't place yet, so nothing is hidden |

A change in the editor on the page the unit shows moves the unit's focus to that cell.

**Why the editor follows the unit:** the editor keeps no copy of a Sound; every value is read back from the unit after each change, so screen and synth always agree.

> **Design note:** the pictures in the editor aren't copies of the unit's screens. They are the unit's own drawing code, compiled for the browser and fed the unit's values: when the filter curve bends in the editor, it bends by exactly the same maths as on the synth. DAY is a cream panel in the spirit of a Cascadia; NIGHT is the dark of the unit itself.

## Editor: messages

Messages appear in a **THE UNIT SAID** module at the top; **SEEN** clears them, and a repeat shows a count (`×3`). A busy unit is asked again quietly; a message shows only if the editor gives up.

| Message | Meaning | What to do |
|---|---|---|
| **THIS EDITOR NEEDS CHIMERA 0.4 OR LATER. THIS UNIT IS RUNNING 0.3.0.** | Firmware too old | [Update](19-updating-and-recovery.md); the editor links **DOWNLOAD CHIMERA 0.4 OR LATER** |
| **USE CHROME OR EDGE** | No Web Serial | Use a Chromium browser |
| **THE PORT IS IN USE (CLOSE chimera-usb.py)** | Another program holds the port | Close it, connect again |
| **THE UNIT WAS DISCONNECTED** | Cable out or unit off | Reconnect, **CONNECT UNIT** |
| **THE UNIT STOPPED ANSWERING** | No reply | Check the cable, reconnect |
| **UPDATE THE EDITOR** | Unit newer than editor | Reload the page |
| **THE UNIT REFUSED: …** | A change was turned down, with the reason | Read it; pointing at the control shows it too |
| **NOT TAKEN: THE UNIT KEPT ITS VALUE** | A change didn't land | Try again |
| **THE TURN OF … WAS NOT SENT: THE BOX TOOK ANOTHER PART** | The unit changed Part or Sound mid-turn | The editor shows the new Part; turn again |

**Why plainly:** a silently dropped change leaves you guessing. Every refusal comes back in the unit's words, and the control keeps the unit's value.
