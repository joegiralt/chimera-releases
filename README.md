# Chimera

Chimera is alternative firmware for the **PreenFM3** synthesizer: a multi-engine, multitimbral digital synth with chain-based navigation. It runs on the stock PreenFM3 hardware and installs through the stock bootloader, which it never touches, so you can always go back to the stock firmware.

This repository holds **releases only**: firmware binaries, notes and the bug tracker for testers. The source is not public.

> **Status: no release yet.** The first alpha is being prepared. Watch this repository (Watch › Custom › Releases) to be told when it lands.

## Install (when a release is out)

1. Download `chimera.bin` and `chimera.bin.sha256` from the [Releases](../../releases) page and check the checksum.
2. Put the PreenFM3 into DFU mode (stock firmware: see the PreenFM3 documentation; Chimera: **SETTINGS › SYSTEM › OS UPGRADE**).
3. Flash the firmware area only:
   ```
   dfu-util -a0 -d 0483:df11 -D chimera.bin -s 0x8020000:leave
   ```
   - **Never** write to `0x08000000` (the bootloader) and **never** use `-a1` (option bytes).

## Go back to the stock firmware

Download the stock PreenFM3 firmware (v1.03 release zip, file `p3_1_03.bin`), enter DFU mode, then:
```
dfu-util -a0 -d 0483:df11 -D p3_1_03.bin -s 0x8020000:leave
```

## Your SD card

Chimera only reads and writes inside a `/CHIMERA/` folder on the card. Your stock PreenFM3 patches, banks and settings are left alone.

## TAPE sources

TAPE plays sample sources from the card. To add the factory set, copy its `.SRC` files with a card reader into `/CHIMERA/TAPES/` on the card (create the folders if needed; keep the file names exactly as they are), then put the card back.

## Reporting bugs

Please use **Issues › New issue › Bug report**. Tell us the firmware version (shown at boot), what you did, and what you heard or saw — a short recording or photo helps a lot. Check the known issues in the release notes first.

## Licence

Chimera is © 2026 Joe Giralt. All rights reserved. Release binaries are provided under the [tester licence](LICENSE.md).
