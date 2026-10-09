# Chimera

Chimera is alternative firmware for the **PreenFM3** synthesizer: a multi-engine, multitimbral digital synth with chain-based navigation. It runs on the stock PreenFM3 hardware and installs through the stock bootloader, which it never touches, so you can always go back to the stock firmware.

This repository holds **releases only**: firmware binaries, notes and the bug tracker for testers. The source is not public.

> **Status: no release yet.** The first alpha is being prepared. Watch this repository (Watch › Custom › Releases) to be told when it lands.

## Install (when a release is out)

You need [`dfu-util`](https://dfu-util.sourceforge.net/) and a USB cable. Chimera needs the PreenFM3's **stock bootloader 1.09**, the newest; it is the only one we test against. Everything below is done from the front panel, without opening the case, and was tested on a PCB v1 unit.

### DFU mode

- **From the stock firmware:** power off, hold **MENU only**, power on. The bootloader screen shows its version (`pfm3 BootLoader 1.09`). Press **button 2 (DFU Mode)**.
- **From Chimera:** **SETTINGS › SYSTEM › OS UPGRADE**.

Check with `lsusb` (or System Information on macOS): you should see `0483:df11 STM Device in DFU Mode`.

### 1. Update the bootloader to 1.09 (once, if the screen shows an older version)

Download the stock PreenFM3 v1.03 release zip; it holds `p3_boot_1_09.bin`. Enter DFU mode, then:
```
dfu-util -a0 -d 0483:df11 -D p3_boot_1_09.bin -s 0x08000000
```
This is the only step that writes the bootloader. **Don't cut the power during its two seconds.** If it is interrupted, the unit stays recoverable through the chip's own DFU mode (BOOT0 jumper), but that does mean opening the case.

### 2. Flash Chimera

1. Download `chimera-<version>.bin` (or `chimera-<version>-orbit.bin`, with the ORBIT sequencer) and `SHA256SUMS` from the [Releases](../../releases) page, and check it: `sha256sum -c SHA256SUMS --ignore-missing`.
2. Enter DFU mode, then flash the firmware area only:
   ```
   dfu-util -a0 -d 0483:df11 -D chimera-<version>.bin -s 0x8020000:leave
   ```
   - "File downloaded successfully" followed by `Error during download get_status` is normal: the unit has already left DFU and is booting.
   - Never write the Chimera file to `0x08000000`, and **never** use `-a1` (option bytes).

Later updates: OS UPGRADE, then the same line.

### If holding MENU does nothing

Hold MENU alone, before power reaches the unit, and keep holding until the screen lights. If the bootloader screen still never appears, tell us on the tracker before trying anything else.

## Go back to the stock firmware

From the same v1.03 zip, `p3_1_03.bin`. In Chimera, open **SETTINGS › SYSTEM › OS UPGRADE**, then:
```
dfu-util -a0 -d 0483:df11 -D p3_1_03.bin -s 0x8020000:leave
```
Keep bootloader 1.09; the stock firmware runs on it. To return to Chimera, use the stock route into DFU above.

## Your SD card

Chimera only reads and writes inside a `/CHIMERA/` folder on the card. Your stock PreenFM3 patches, banks and settings are left alone.

## TAPE sources

TAPE plays sample sources from the card. To add the factory set, copy its `.SRC` files with a card reader into `/CHIMERA/TAPES/` on the card (create the folders if needed; keep the file names exactly as they are), then put the card back.

## Reporting bugs

Please use **Issues › New issue › Bug report**. Tell us the firmware version (shown at boot), what you did, and what you heard or saw — a short recording or photo helps a lot. Check the known issues in the release notes first.

## Licence

Chimera is © 2026 Joe Giralt. All rights reserved. Release binaries are provided under the [tester licence](LICENSE.md).
