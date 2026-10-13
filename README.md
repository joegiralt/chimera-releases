# Chimera

Chimera is alternative firmware for the **PreenFM3** synthesizer: a multi-engine, multitimbral digital synth with chain-based navigation. It runs on the stock PreenFM3 hardware and installs through the stock bootloader, which it never touches, so you can always go back to the stock firmware.

This repository holds **releases only**: firmware binaries, notes and the bug tracker for testers. The source is not public.

New here? Read the [getting-started guide](GETTING-STARTED.md), then the [quick start](QUICK-START.md) for getting around and the [FAQ](FAQ.md) for "how do I…".

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

On Linux, if `dfu-util` says "Cannot open DFU device", run it with `sudo`, or allow your user once:
```
echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="df11", TAG+="uaccess"' | sudo tee /etc/udev/rules.d/70-stm32-dfu.rules && sudo udevadm control --reload
```

### Or flash from the SD card (no dfu-util)

The bootloader can also install from the card, with only a USB cable and a file manager.

1. Power off, hold **MENU only**, power on. Press **button 3 (SD card access)**. The card shows up on your computer as a USB drive.
2. Copy `chimera-<version>.bin` to the card's top folder. Leave the `pfm3` and `CHIMERA` folders alone.
3. Eject the drive on your computer, then press **MENU** on the unit to leave SD card access.
4. Press **button 1 (flash from SD)**, choose the Chimera file with **−/+** if it asks, and confirm. The unit boots into Chimera.

Remove the `.bin` from the card afterwards (SD card access again), so the next update can't pick an old file.

### If holding MENU does nothing

Hold MENU alone, before power reaches the unit, and keep holding until the screen lights. If the bootloader screen still never appears, tell us on the tracker before trying anything else.

Once Chimera boots, the [getting-started guide](GETTING-STARTED.md) takes it from there.

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
