# Updating and recovery

This chapter covers installing and updating Chimera, the install screen, the stock bootloader it relies on, DFU mode, going back to the stock PreenFM3 firmware, recovery, and bug reports. Copying files to the card is in [the SD card chapter](16-card-sounds-library.md#card-copying-files-from-a-computer); the USB port is in [USB](17-usb.md).

## Updating: the two halves of the firmware

Chimera comes as two files, and needs both:

- `CHIMERA.BIN`, the first half, written by the bootloader;
- `CHIMERA.BK2`, the second half, which Chimera installs itself when it finds a new one on the card or from the update tool.

A release also has the factory zip (`factory-v1.zip`: factory Sounds, their TAPE sources, four demo projects and the five factory controller maps) and the update tool, `chimera-usb.py`.

File names never carry a version (that is in the release title, the boot splash and SETTINGS › SYSTEM › ABOUT). Keep them exactly as they are: if your browser saved `CHIMERA (1).BIN` or `CHIMERA (1).BK2`, rename it back in Finder or Explorer rather than deleting it.

| Way | When |
|---|---|
| [The update tool over USB](#updating-with-the-update-tool-over-usb) | The unit runs Chimera 0.3 or later, on macOS or Linux. One command |
| [The SD card](#updating-from-the-sd-card) | A first install, Windows, or if the tool stops |
| [USB DFU with dfu-util](#updating-over-usb-dfu-with-dfu-util) | When the card can't be used, on macOS or Linux |

All three end on the same install screen, and your projects and Sounds stay on the card.

**Why two halves:** the flash area the bootloader writes is too small for Chimera; the rest lives where the bootloader doesn't reach, so Chimera writes it itself. The tool and install screen make the two halves one step.

## Updating with the update tool over USB

You need the PreenFM3 running Chimera 0.3 or later, a data USB cable, and `CHIMERA.BIN`, `CHIMERA.BK2` and `chimera-usb.py` in your Downloads folder, names unchanged. On Windows, use [the SD card](#updating-from-the-sd-card).

**Once, on a Mac:**

1. Open Terminal (**Command + Space**, type **Terminal**, **Return**). Type each command on the line ending in `%` or `$` and press Return; when the line comes back, it has finished.
2. Install Homebrew with the one command on brew.sh if you don't have it. Your password doesn't show as you type; that is normal.
3. Install dfu-util, which writes the firmware:

   ```bash
   brew install dfu-util
   ```

4. Install pyserial, which finds the PreenFM3 (if the Mac offers the command line developer tools, install them and run this again):

   ```bash
   python3 -m pip install --user pyserial
   ```

On Linux, install `dfu-util` with your package manager (`sudo apt install dfu-util`).

**The update:**

1. **Hold MENU** to save your project: the tool won't start with unsaved changes.
2. Connect the PreenFM3 and turn it on as usual, playing Chimera.
3. In Terminal:

   ```bash
   cd ~/Downloads
   python3 chimera-usb.py update CHIMERA.BIN CHIMERA.BK2
   ```

4. Wait. The tool checks both files, writes the firmware, and the PreenFM3 restarts showing **DON'T POWER OFF**. Leave cable, power and Terminal alone until it prints `OK updated` and the version, which can take a few minutes.

The tool updates firmware only; add the factory Sounds as in [the SD card chapter](16-card-sounds-library.md#card-copying-files-from-a-computer). Close the [browser editor](18-browser-editor.md) first: only one program can hold the port.

**If it stops** before the restart, nothing has changed: fix what the last line names and run it again. After the restart, the bootloader is untouched: hold **MENU** at power-on and use [the SD card](#updating-from-the-sd-card).

**Why one command:** an update is one package, one command and one install screen, never two jobs you could do in the wrong order.

## Updating from the SD card

No software is needed on the computer.

**Step 1: check the bootloader.** Turn the unit off, hold **MENU**, turn it on, and hold until the screen lights. The top line must read `pfm3 BootLoader 1.09`; if older, [update it](#updating-an-older-bootloader) once. If nothing appears, see [Recovery: the bootloader screen doesn't appear](#recovery-the-bootloader-screen-doesnt-appear).

**Step 2: download** `CHIMERA.BIN`, `CHIMERA.BK2` and the factory zip, and unzip it (to a folder called **CHIMERA**).

**Step 3: copy the files.**

1. Connect the PreenFM3 by USB, enter the bootloader (hold **MENU** at power-on) and press **button 3 (SD card access)**.
2. Copy `CHIMERA.BIN` and `CHIMERA.BK2` into the drive's main folder; choose **Replace** over older copies.
3. Copy the factory set as [the SD card chapter](16-card-sounds-library.md#card-copying-files-from-a-computer) describes.
4. Eject the drive, then press **MENU** on the PreenFM3.

**Step 4: flash and install.**

1. Under **Firmware to flash**, press **−** / **+** until it shows `CHIMERA.BIN`.
2. Press **button 1 (flash)**.
3. Chimera starts, finds `CHIMERA.BK2` and installs it ([the install screen](#updating-the-install-screen)). Leave the power on.

**Pick `CHIMERA.BIN`, the big file.** The bootloader lists every `.bin`. A Mac also leaves a hidden twin, `._CHIMERA.BIN`, listed as `CHIMER~1.BIN`: it isn't firmware, and flashing it gives a black screen. Leave it; just pick the real one.

The two files can stay on the card; next time, copy the new ones over them with **Replace**.

**On Windows**, the first USB connection after an update may set up the driver again; let it finish, then pick **Chimera** again in your music software.

## Updating over USB DFU with dfu-util

On macOS or Linux, `CHIMERA.BIN` can go over USB.

1. Install `dfu-util` (`brew install dfu-util`, or your package manager).
2. Enter DFU: with USB connected, hold **MENU** at power-on and press **button 2 (DFU Mode)**, or use SETTINGS › SYSTEM › **OS UPGRADE** ([DFU from SETTINGS](#updating-dfu-from-settings)).
3. In the firmware's folder, run exactly:

   ```bash
   dfu-util -a 0 -d 0483:df11 -D CHIMERA.BIN -s 0x08020000:leave
   ```

   The unit restarts into Chimera. `Error during download get_status` afterwards is normal.

4. Copy `CHIMERA.BK2` and the factory set to the card as in [Updating from the SD card](#updating-from-the-sd-card), then power-cycle; Chimera installs `CHIMERA.BK2` on that start.

**Only ever use that command.** Chimera always goes to `0x08020000`. Never write it to `0x08000000` (the bootloader), and never use `-a 1` (the chip's option bytes, which can lock the chip for good).

If Linux can't access the DFU device, use `sudo`, or allow your user once and replug:

```bash
echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="df11", TAG+="uaccess"' | sudo tee /etc/udev/rules.d/70-stm32-dfu.rules && sudo udevadm control --reload
```

## Updating: DFU from SETTINGS

SETTINGS › SYSTEM › **OS UPGRADE** restarts into DFU without the power-on hold. It asks **ENTER DFU? PLAY STOPS UNTIL FLASHED OR POWER-CYCLED** (**ENTER DFU**, **CANCEL**), opening on **CANCEL**.

![ENTER DFU, asked by OS UPGRADE](img/settings_prompt_enter_dfu.png)

Nothing plays in DFU. Flash with the command above, or power-cycle to return unchanged.

## Updating: the install screen

![The install screen, annotated](img/install.png)

1. **DON'T POWER OFF.** Chimera is writing its second half; sound keeps playing.
2. The version being installed, with its build (`INSTALLING 0.4.0 b42f427c`).
3. The step, here **WRITING** (**ERASING**, **WRITING**, **SEALING**). Then Chimera carries on.

Buttons and knobs wait until it ends. If the power goes off, the next start installs again from the beginning; the bootloader and first half are never touched.

**Why it survives a power cut:** the seal is written last, and until it is, Chimera treats the second half as absent. A half-written install never runs.

> **Design note:** Chimera rides on the stock PreenFM3 bootloader, Ixox's, version 1.09, and never writes a byte of it. The bootloader is the one program that can always bring the synth back, so Chimera treats it like a landlord's wiring. Look, admire, do not rewire.

### Updating: when the install is refused

![NOT INSTALLED](img/install_refused.png)

**NOT INSTALLED · THE MIXER SLOT HOLDS OTHER CODE. · NOTHING WAS WRITTEN.** (or **THE EDIT SLOT**) means another program sits in a flash area the bootloader keeps for optional programs (started by holding **MIXER** or **EDIT** at power-on). Chimera won't overwrite it. After 5 seconds or a button, Chimera starts without its second half: those Parts and effects say **UPDATE**, and ABOUT reads **SLOT IN USE**. Please [report it](#recovery-reporting-a-bug) with the version.

### Updating: a Part or effect says UPDATE or NEEDS UPDATE

`CHIMERA.BK2` is missing or from another version. Without it, the engines, effects, ORBIT and most of MIDI stay silent, and MIDI in is ignored. Copy the matching `CHIMERA.BK2` to the card's main folder (hold **MENU** at power-on, button 3), eject and restart.

## Updating an older bootloader

Chimera needs the stock bootloader **1.09** and never changes it. If yours is older, update it once: `p3_boot_1_09.bin` is in `pfm3_firmware_1_03.zip` on the PreenFM3 v1.03 release page, with its own instructions.

1. Enter DFU ([step 2 above](#updating-over-usb-dfu-with-dfu-util)).
2. Run:

   ```bash
   dfu-util -a 0 -d 0483:df11 -D p3_boot_1_09.bin -s 0x08000000
   ```

   The only time you write to `0x08000000`, and only with this file. Don't interrupt it: an interrupted bootloader update can stop the unit starting.

3. Restart holding **MENU** and check it says 1.09.

**Why 1.09:** it is the bootloader PreenFM3 owners already have, so installing and leaving Chimera are the same steps as for the stock firmware.

## Going back to the stock PreenFM3 firmware

Download the stock v1.03 firmware and install `p3_1_03.bin` with the SD card or DFU method above, in place of `CHIMERA.BIN`. Your stock patches and settings were never touched, and Chimera's files stay in `/CHIMERA/` for when you come back.

## Recovery: what to do when something goes wrong

Never power off, pull the cable or stop the tool while `dfu-util` or the update tool writes, or while the screen says **DON'T POWER OFF**. If it happens anyway: during the install screen, the next start installs again; during a `CHIMERA.BIN` write, hold **MENU** at power-on and flash again.

| Symptom | What to do |
|---|---|
| Black screen after flashing | Hold **MENU** at power-on and flash again, picking `CHIMERA.BIN`, not `CHIMER~1.BIN` |
| The computer doesn't see the card | Use a data cable, and press **button 3 (SD card access)** in the bootloader |
| Dark screen at every power-on, computer sees a DFU device | The BOOT0 jumper inside must sit fully on its **NORMAL** pins. Bridged, or hanging on one pin, it starts the chip's own DFU |
| The unit starts in DFU again once after a flash (flashed with BOOT0 bridged) | Leave DFU without flashing: `dfu-util -a 0 -d 0483:df11 -s 0x08020000:leave` (an error on exit is expected), then set the jumper to NORMAL |

### Recovery: the bootloader screen doesn't appear

Turn the unit fully off, hold **MENU** before turning it on, and keep holding. If it still doesn't appear, check the BOOT0 jumper, then [open an issue](#recovery-reporting-a-bug) before trying anything else.

### Recovery: a damaged bootloader

A Chimera install never writes the bootloader. If it is ever lost (say, after an interrupted bootloader update), the chip's own DFU, in memory that can't be written, brings the unit back:

1. Bridge BOOT0 and plug in; `dfu-util -l` lists `0483:df11`.
2. Write the stock bootloader:

   ```bash
   dfu-util -a 0 -d 0483:df11 -D p3_boot_1_09.bin -s 0x08000000
   ```

3. Write Chimera and leave DFU:

   ```bash
   dfu-util -a 0 -d 0483:df11 -D CHIMERA.BIN -s 0x08020000:leave
   ```

4. Put BOOT0 back to NORMAL and power-cycle; Chimera installs `CHIMERA.BK2` from the card.

Every command here uses `-a 0`; never `-a 1`.

## Recovery: reporting a bug

Check [Known issues](https://joegiralt.github.io/chimera-releases/guides/known-issues) first, then open **Issues › New issue › Bug report** on the releases page. The form asks for:

- **Which build are you on?** From ABOUT or the boot splash (`0.4.0 b42f427c`).
- **Board.** The **CHIP** cell on ABOUT (`V 176`).
- **What were you doing when you first noticed it?** Part, engine, Sound or project, what you played.
- **How can we make it happen?** Steps, from a fresh start if you can.
- **What did you expect to happen?** and **What actually happened?**
- **How often?** Every time, sometimes, once.
- **Your setup** (optional): controller, power (9 V or USB), other gear.
- **Attachments** (optional): a recording, a screen photo or the project file.

![SETTINGS › SYSTEM › ABOUT](img/settings_system_about.png)

1. Header: SETTINGS › SYSTEM › ABOUT.
2. The firmware's name, CHIMERA.
3. FIRMWARE: version and build type (`0.4.0  RELEASE`).
4. The build's identity: version and commit (`0.4.0 b42f427c`), the line a bug report asks for.
5. **VERSION**, 0.4.0.
6. **BUILD**, RELEASE.
7. **CHIP**, the board (`V 176`).
8. **CLOCK**, 480 MHZ.
9. **RESET**, why the chip last restarted (WDOG).
10. **CARD**, NO CARD here.
11. Footer: the project and its state.
12. Footer: `MENU BACK`.

A faint buzz when powered over USB from the computer your audio interface is on is a ground loop, not a bug: use the 9 V supply.
