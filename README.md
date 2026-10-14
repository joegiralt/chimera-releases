# Chimera

**A new way to make music with your PreenFM3.**

Chimera is alternative firmware for the PreenFM3 synthesizer. It gives your synth new sound engines, effects, sequencing tools, and a different way to explore and create sounds.

It runs on the original PreenFM3 hardware. You don't need to modify your synth or buy anything else.

And if you decide Chimera isn't for you, you can switch back to the original PreenFM3 firmware.

**Current version: Alpha 0.1.0**

Chimera is still in development. Some features aren't finished, and you may run into bugs.

[Download Chimera](../../releases) | [Getting Started](GETTING-STARTED.md) | [FAQ](FAQ.md)

---

## Installing Chimera

Installing Chimera is straightforward. **We recommend using an SD card**, since this doesn't require installing any software on your computer.

You'll need:

- Your PreenFM3
- A computer
- The SD card already in your PreenFM3
- A USB cable

### Step 1: Check your bootloader

Before installing Chimera, let's check that your PreenFM3 is ready.

1. Turn off your PreenFM3.
2. Hold down the **MENU** button.
3. While holding MENU, turn the PreenFM3 back on.
4. Keep holding MENU until the screen lights up.

You should see a screen with a version number at the top.

**Does it say `pfm3 BootLoader 1.09`?**

Great! You're ready to install Chimera. Continue to Step 2.

**Does it show an older version?**

You'll need to [update your bootloader](#updating-an-older-bootloader) first. This is a one-time process.

**Nothing happens?**

See [Troubleshooting](#troubleshooting).

### Step 2: Download Chimera

1. Open the [Chimera Releases page](../../releases).
2. Download the latest `chimera-<version>.bin` file.
3. Save it somewhere easy to find, like your Downloads folder.

That's the firmware. Now let's put it on your PreenFM3.

### Step 3: Install using your SD card (recommended)

You don't have to remove the SD card from your PreenFM3.

1. Connect your PreenFM3 to your computer using a USB cable.
2. Enter the bootloader (turn on the synth while holding MENU).
3. Press **button 3 (SD card access)**.
4. Your SD card should appear on your computer like a USB drive.
5. Open the drive and copy the Chimera `.bin` file into its main folder (not inside another folder).
6. Safely eject the drive from your computer.
7. Press **MENU** on the PreenFM3 to leave SD card access.
8. Press **button 1 (flash from SD)**.
9. Select the Chimera file if asked, and confirm.

The PreenFM3 will install Chimera and start up.

**That's it. Chimera is installed!**

You can now continue to the [Getting Started Guide](GETTING-STARTED.md).

The latest release also includes factory sounds and demo projects. See the release notes for instructions on adding them.

**A small tip:** Once everything works, you can delete the installation `.bin` file from the SD card. This keeps old firmware files from getting mixed up with future updates.

---

## Another way to install: USB (DFU)

If you can't use the SD card method, you can install Chimera directly over USB.

This requires a small program called `dfu-util`. The steps are slightly different depending on your computer.

Choose your operating system:

- [macOS](#macos)
- [Windows](#windows)
- [Linux](#linux)

### First: Put your PreenFM3 into DFU mode

This part is the same for every computer.

1. Connect your PreenFM3 to your computer with a USB cable.
2. Turn off the PreenFM3.
3. Hold **MENU** while turning it on.
4. When the bootloader appears, press **button 2 (DFU Mode)**.

Now follow the instructions for your computer.

**Only ever use the command shown below.** Chimera always goes to address `0x08020000`. Never write it to `0x08000000` (that's the bootloader), and never use `-a 1`.

### macOS

1. Install `dfu-util` if you don't already have it. If you use Homebrew, open Terminal and run:

   ```bash
   brew install dfu-util
   ```

2. Open Terminal and go to the folder containing your downloaded Chimera firmware. For example, if it's in Downloads:

   ```bash
   cd ~/Downloads
   ```

3. Run this command, replacing `<version>` with the version you downloaded:

   ```bash
   dfu-util -a 0 -d 0483:df11 -D chimera-<version>.bin -s 0x08020000:leave
   ```

Your PreenFM3 should restart into Chimera.

### Windows

On Windows, please use the [SD card method](#step-3-install-using-your-sd-card-recommended) for now. USB steps for Windows are coming.

### Linux

1. Install `dfu-util` using your Linux distribution's package manager.

   For example, on Ubuntu or Debian:

   ```bash
   sudo apt install dfu-util
   ```

2. Open a terminal in the folder containing your downloaded Chimera firmware.

3. Run:

   ```bash
   dfu-util -a 0 -d 0483:df11 -D chimera-<version>.bin -s 0x08020000:leave
   ```

If Linux says it cannot access the USB device, see [Troubleshooting](#troubleshooting).

**Note:** You might see `Error during download get_status` after the firmware transfers successfully. If the PreenFM3 has already restarted into Chimera, this is normal.

---

## After installation

Once Chimera starts, you're ready to explore!

We recommend starting here:

**[Getting Started](GETTING-STARTED.md)** explains the basics of Chimera.

**[Quick Start](QUICK-START.md)** shows you how to navigate the synth.

**[FAQ](FAQ.md)** answers common questions.

You can also download `factory-v1.zip` from the releases page. It includes 56 sounds and four demo projects to get you started.

---

## Switching back to the original PreenFM3 firmware

Chimera doesn't replace or modify your PreenFM3's bootloader during a normal installation.

You can return to the original firmware whenever you like.

1. Download the original PreenFM3 v1.03 firmware.
2. Find the file named `p3_1_03.bin`.
3. Enter the bootloader by holding MENU while powering on.
4. Install the original firmware using either the SD card method or the USB/DFU method described above.

Your original PreenFM3 firmware will be restored.

Chimera also keeps its own files in a separate `/CHIMERA/` folder on your SD card, leaving your original PreenFM3 patches and settings alone.

---

## Updating an older bootloader

Chimera requires PreenFM3 bootloader version 1.09.

If your synth is running an older bootloader, you'll need to update it before installing Chimera.

**Important:** Updating the bootloader is different from installing normal firmware. Interrupting a bootloader update can prevent your PreenFM3 from starting normally.

Download the official PreenFM3 v1.03 release and locate `p3_boot_1_09.bin`.

Enter DFU mode using the steps above, then run:

```bash
dfu-util -a 0 -d 0483:df11 -D p3_boot_1_09.bin -s 0x08000000
```

This is the only time you ever write to `0x08000000`, and only with this file.

Do not disconnect the synth or turn off its power while the update is running.

Once finished, restart your PreenFM3 and check that the bootloader version is now 1.09.

You can then follow the normal Chimera installation instructions.

---

## Troubleshooting

**I held MENU, but nothing happened.**

Turn your PreenFM3 off completely. Hold MENU before turning it back on, and keep holding until the bootloader screen appears.

If it still doesn't work, please [open an issue](../../issues) before trying anything else.

**My computer doesn't see the SD card.**

Check your USB cable and make sure you've selected button 3 (SD card access) from the bootloader menu.

Some USB cables only provide power and can't transfer data.

**Linux says it cannot access the DFU device.**

Run the `dfu-util` command with `sudo`, or allow your user once with:

```bash
echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="df11", TAG+="uaccess"' | sudo tee /etc/udev/rules.d/70-stm32-dfu.rules && sudo udevadm control --reload
```

Then unplug the PreenFM3 and plug it back in.

**Chimera doesn't start after installation.**

Restart the PreenFM3 and try entering the bootloader again. If the bootloader still works, you can reinstall the firmware.

If the problem continues, [report a bug](../../issues).

---

## Reporting bugs

Chimera is currently in alpha, so bug reports are extremely helpful.

If something goes wrong, please open a [bug report](../../issues/new/choose).

Tell us which version you're using, what you were doing when the problem happened, and what you expected to happen.

If possible, include a photo, screenshot, or short recording.

---

## What's coming next?

We're working on additional synthesis engines, including TAPE (sample playback) and DRUM.

These aren't available in the current alpha, but you'll see them marked as COMING SOON in the Sound browser.

Watch this repository for new releases.

## Source code and licence

Chimera is © 2026 Joe Giralt. All rights reserved.

This repository contains firmware releases, documentation, and the issue tracker. The source code is not currently public.

Firmware binaries are distributed under the [tester licence](LICENSE.md).
