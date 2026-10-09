# Chimera

Chimera is alternative firmware for the **PreenFM3** synthesizer: a multi-engine, multitimbral digital synth with chain-based navigation. It runs on the stock PreenFM3 hardware and installs through the stock bootloader, which it never touches, so you can always go back to the stock firmware.

This repository holds **releases only**: firmware binaries, notes and the bug tracker for testers. The source is not public.

> **Status: no release yet.** The first alpha is being prepared. Watch this repository (Watch › Custom › Releases) to be told when it lands.

## Install (when a release is out)

You need [`dfu-util`](https://dfu-util.sourceforge.net/) and a USB cable. Both directions below were tested on a PCB v1 unit, stock 1.03 to Chimera and back.

1. Download `chimera-<version>.bin` (or `chimera-<version>-orbit.bin`, with the ORBIT sequencer) and `SHA256SUMS` from the [Releases](../../releases) page, and check it: `sha256sum -c SHA256SUMS --ignore-missing`.
2. Put the PreenFM3 into DFU mode:
   - **From the stock firmware (first install):** power off, hold **MENU only**, power on. The bootloader screen appears; press **button 2 (DFU Mode)**. Stock firmware has no DFU entry in its menus; this is the only front-panel route.
   - **From Chimera (every later update):** **SETTINGS › SYSTEM › OS UPGRADE**.
   - Check with `lsusb` (or System Information on macOS): you should see `0483:df11 STM Device in DFU Mode`.
3. Flash the firmware area only:
   ```
   dfu-util -a0 -d 0483:df11 -D chimera-<version>.bin -s 0x8020000:leave
   ```
   - "File downloaded successfully" followed by `Error during download get_status` is normal: the unit has already left DFU and is booting.
   - **Never** write to `0x08000000` (the bootloader) and **never** use `-a1` (option bytes).

### If holding MENU does nothing

On at least one unit (bootloader 1.05) the bootloader misses the MENU key and boots straight into the firmware. Then, once only:

1. Power off and open the case. Move the **BOOT0** jumper to the DFU position.
2. Power on: the unit comes up in DFU mode. Flash as in step 3.
3. Power off, put the jumper back to **NORMAL** (on both pins, not parked on one: a floating BOOT0 makes every power-on go to DFU), close the case.

After that, Chimera's OS UPGRADE covers every update and the roll-back, with no case opening. Please tell us on the tracker if your unit needed the jumper, and its bootloader version if you know it.

## Go back to the stock firmware

Download the stock PreenFM3 firmware (v1.03 release zip, file `p3_1_03.bin`; do **not** flash the bootloader file in the same zip). In Chimera, open **SETTINGS › SYSTEM › OS UPGRADE**, then:
```
dfu-util -a0 -d 0483:df11 -D p3_1_03.bin -s 0x8020000:leave
```
To return to Chimera later, use the stock route in step 2 above.

## Your SD card

Chimera only reads and writes inside a `/CHIMERA/` folder on the card. Your stock PreenFM3 patches, banks and settings are left alone.

## TAPE sources

TAPE plays sample sources from the card. To add the factory set, copy its `.SRC` files with a card reader into `/CHIMERA/TAPES/` on the card (create the folders if needed; keep the file names exactly as they are), then put the card back.

## Reporting bugs

Please use **Issues › New issue › Bug report**. Tell us the firmware version (shown at boot), what you did, and what you heard or saw — a short recording or photo helps a lot. Check the known issues in the release notes first.

## Licence

Chimera is © 2026 Joe Giralt. All rights reserved. Release binaries are provided under the [tester licence](LICENSE.md).
