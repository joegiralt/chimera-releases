# Chimera

Chimera is alternative firmware for the **PreenFM3** synthesizer: a multi-engine, multitimbral digital synth with chain-based navigation. It runs on the stock PreenFM3 hardware and installs through the stock bootloader, which it never touches, so you can always go back to the stock firmware.

This repository holds **releases only**: firmware binaries, notes and the bug tracker for testers. The source is not public.

New here? Read the [getting-started guide](GETTING-STARTED.md), then the [quick start](QUICK-START.md) for getting around and the [FAQ](FAQ.md) for "how do I…".

> **Status: alpha 0.1.0.** Download it from [Releases](../../releases). Watch this repository (Watch › Custom › Releases) to hear about the next one.

## Install

### Step 1: check your bootloader (30 seconds)

Power the unit off. Hold **MENU**, and keep holding it while you power on, until the screen lights. The bootloader screen shows its version at the top.

- **`pfm3 BootLoader 1.09`:** you're ready. Go to step 2.
- **An older version:** update the bootloader first, once ([below](#if-your-bootloader-is-older-than-109)), then come back to step 2.
- **No bootloader screen:** see [if holding MENU does nothing](#if-holding-menu-does-nothing).

### Step 2: install Chimera

Download `chimera-<version>.bin` from [Releases](../../releases). Pick `chimera-<version>-orbit.bin` instead if you want the ORBIT sequencer. Then use either way below.

**With a USB cable and `dfu-util`** (one command):

1. On the bootloader screen from step 1, press **button 2 (DFU Mode)**.
2. Run:
   ```
   dfu-util -a0 -d 0483:df11 -D chimera-<version>.bin -s 0x8020000:leave
   ```
   "File downloaded successfully" followed by `Error during download get_status` is normal: the unit has already left DFU and is booting into Chimera.

**From the SD card** (no `dfu-util`, just a file manager):

1. On the bootloader screen, press **button 3 (SD card access)**. The card shows up on your computer as a USB drive.
2. Copy `chimera-<version>.bin` to the card's top folder. Leave the `pfm3` and `CHIMERA` folders alone.
3. Eject the drive, then press **MENU** on the unit to leave SD card access.
4. Press **button 1 (flash from SD)**, choose the Chimera file with **−/+** if it asks, and confirm. The unit boots into Chimera.
5. Next time you're in SD card access, delete the `.bin` so a later update can't pick an old file.

**Then add the factory Sounds** (56 Sounds and 4 demo projects): the release notes show how, from `factory-v1.zip`.

That's it. The [getting-started guide](GETTING-STARTED.md) takes it from there. For later updates, open **SETTINGS › SYSTEM › OS UPGRADE** in Chimera (it goes straight to DFU), then run the same `dfu-util` line.

### Good to know

- Check the download if you like: `sha256sum -c SHA256SUMS --ignore-missing`.
- Only ever flash Chimera to `0x8020000`. Never write it to `0x08000000`, and **never** use `-a1` (option bytes).
- On Linux, if `dfu-util` says "Cannot open DFU device", run it with `sudo`, or allow your user once:
  ```
  echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="df11", TAG+="uaccess"' | sudo tee /etc/udev/rules.d/70-stm32-dfu.rules && sudo udevadm control --reload
  ```
- `lsusb` (or System Information on macOS) shows `0483:df11 STM Device in DFU Mode` while the unit is in DFU.

### If your bootloader is older than 1.09

Do this once. Download the stock PreenFM3 v1.03 release zip; it holds `p3_boot_1_09.bin`. On the bootloader screen, press **button 2 (DFU Mode)**, then:
```
dfu-util -a0 -d 0483:df11 -D p3_boot_1_09.bin -s 0x08000000
```
This is the only step that writes the bootloader. **Don't cut the power during its two seconds.** If it is interrupted, the unit can still be recovered through the chip's own DFU mode (the BOOT0 jumper), but that means opening the case. Then go back to step 1 and check it now says 1.09.

### If holding MENU does nothing

Hold MENU alone, before power reaches the unit, and keep holding until the screen lights. If the bootloader screen still never appears, tell us on the tracker before trying anything else.

## Go back to the stock firmware

From the same v1.03 zip, `p3_1_03.bin`. In Chimera, open **SETTINGS › SYSTEM › OS UPGRADE**, then:
```
dfu-util -a0 -d 0483:df11 -D p3_1_03.bin -s 0x8020000:leave
```
Keep bootloader 1.09; the stock firmware runs on it. To return to Chimera, use the stock route into DFU above.

## The console tool

Each release has a `chimera-usb.py` file next to the firmware (also in `SHA256SUMS`). It needs only Python 3 on Linux or macOS; there is nothing to install. Connect the unit by USB, then run it from the folder you saved it in:

```
python3 chimera-usb.py status      # the unit's state; paste it into bug reports
python3 chimera-usb.py shot        # saves a screenshot (PNG) in the current folder
python3 chimera-usb.py put <file> <remote>   # library Sounds onto the card
python3 chimera-usb.py --help
```

On Linux, if it says "no access", add yourself to the `dialout` group (`sudo usermod -aG dialout $USER`, then log out and in), or run the one-line rule it prints. On macOS the port is `/dev/cu.usbmodem*`, found automatically; to pick one, `CHIMERA_USB=/dev/cu.usbmodemXXXX python3 chimera-usb.py status`.

## Your SD card

Chimera only reads and writes inside a `/CHIMERA/` folder on the card. Your stock PreenFM3 patches, banks and settings are left alone.

## Coming soon

TAPE, the sample engine, and DRUM are coming in a later release; their rows in the Sound browser say COMING SOON. The card is inside the case, so don't pull it: files go over USB with the [console tool](#the-console-tool).

## Reporting bugs

Please use **Issues › New issue › Bug report**. Tell us the firmware version (shown at boot), what you did, and what you heard or saw — a short recording or photo helps a lot. Attach the output of `python3 chimera-usb.py status` and, for anything on screen, a `python3 chimera-usb.py shot`. Check the known issues in the release notes first.

## Licence

Chimera is © 2026 Joe Giralt. All rights reserved. Release binaries are provided under the [tester licence](LICENSE.md).
