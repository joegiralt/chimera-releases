// SPDX-License-Identifier: GPL-3.0-or-later
// The firmware update from the browser (UPDATE), end to end: the editor on
// the fake serial port, a fake firmware in the bridge for what the simulator
// doesn't build (`put` to bank 2, `dfu`, `bank2`, its `status`), and a fake
// DfuSe device in the page (e2e/fakedfu.cjs) that erases and writes like
// flash and boots the image it was given. The release is a small one made
// here (e2e/fakerelease.cjs), served where the editor looks for the latest.
//
// Every guard is checked against the fake device's own log: no mass erase,
// no command below 0x08020000, only the image's sectors erased, the
// bootloader's sector untouched; and every stop's words name the way out.
//
// Nothing here reaches a real unit's flash or card: the fake firmware
// answers every update verb in the bridge, and on the real unit (UNIT set)
// the console guard refuses them besides.

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, test } from "node:test";
import { bridge, followPart, openEditor, page, setup, statusText, until } from "./harness.mjs";
import { FakeFirmware, serveRelease } from "./fakeupdate.mjs";

const { makeRelease } = createRequire(import.meta.url)("./fakerelease.cjs");

setup({ engines: ["ALGO"] });

const NEXT = makeRelease("0.4.1 abcd1234");
const UPDATE_WAIT = 60000;

/** The page's UPDATE module's text. */
const said = () => page.locator(".upd").innerText().catch(() => "");
const meta = () => page.locator(".pagehead .meta").innerText().catch(() => "");
const button = (name) => page.locator(".upd button", { hasText: name });

/** Every stage the page's head named, in order, from now on. */
async function watchStages() {
  await page.evaluate(() => {
    window.__stages = [];
    const note = () => {
      const m = document.querySelector(".pagehead .meta")?.textContent ?? "";
      if (window.__stages.at(-1) !== m) window.__stages.push(m);
    };
    window.__stageObs?.disconnect();
    window.__stageObs = new MutationObserver(note);
    window.__stageObs.observe(document.body, { subtree: true, childList: true, characterData: true });
    note();
  });
}
const stagesSeen = () => page.evaluate(() => window.__stages.slice());

/** Out of an update page a failed test left open: CANCEL, then CLOSE. */
async function leavePanel() {
  for (let i = 0; i < 3 && (await page.locator(".upd").count()); i++) {
    for (const name of ["CANCEL", "BACK TO THE EDITOR", "CLOSE"]) {
      const b = button(name);
      if (await b.count()) {
        await b.first().click();
        break;
      }
    }
    await page.waitForTimeout(300);
  }
}

/** The editor on Part 1, a fake firmware installed and the release served. */
async function ready(opts = {}, serve = {}) {
  await openEditor({ how: "serial" });
  bridge.down = false;
  await leavePanel();
  if (!ready.exposed) {
    ready.exposed = true;
    await page.exposeFunction("__onDfuLeave", (img) => ready.fake?.flashed(img));
  }
  bridge.flow.intercept = null;
  await followPart(1, "ALGO");
  serveRelease(bridge, NEXT, serve);
  ready.fake = new FakeFirmware({ bridge, page, release: NEXT, ...opts }).install();
  await page.evaluate(() => {
    window.__usb.mode.unopenable = false;
    delete window.__usb.mode.cutAfter;
    // Each test reads its own writes: the log starts afresh.
    Object.assign(window.__usb.log, { commands: [], erased: [], writes: [], massErase: false, left: false });
  });
  return ready.fake;
}

/** UPDATE in the top bar: the panel open, the unit's and the release's versions read. */
async function openUpdate() {
  await page.locator(".ptop .tab", { hasText: "UPDATE" }).click();
  await until("the panel to read the unit and the release", async () => (await meta()) === "READY", 10000);
}

/** UPDATE…, the confirm screen, START UPDATE. */
async function start() {
  await button("UPDATE…").click();
  await button("START UPDATE").waitFor();
  await watchStages();
  await button("START UPDATE").click();
}

const usbLog = () => page.evaluate(() => ({ ...window.__usb.log, image: null, bootloader: window.__usb.mem.subarray(0, 0x20000).every((b) => b === 0xb0) }));

/** CLOSE (or BACK TO THE EDITOR): the editor follows the unit again. */
async function backToEditor(name = "CLOSE") {
  await button(name).click();
  bridge.flow.intercept = null;
  await followPart(1, "ALGO");
}

/** The guards, read from the fake device's log after a write. */
function assertGuards(log, sectors) {
  assert.equal(log.massErase, false, "a mass erase was sent");
  assert.ok(log.commands.every((c) => c.length === 5 && c.at >= 0x08020000), `a command below 0x08020000: ${JSON.stringify(log.commands.filter((c) => c.at < 0x08020000))}`);
  assert.deepEqual(log.erased, sectors, "erased other sectors than the image's");
  assert.equal(log.bootloader, true, "the bootloader's sector changed");
}

const SECTORS = [0x08020000, 0x08040000, 0x08060000]; // NEXT's 300 KB

describe("UPDATE from the browser", () => {
  test("U1: the happy path: versions before, the stages in order, the image at 0x08020000, the version after", async () => {
    const fake = await ready();
    await openUpdate();
    const before = await said();
    assert.match(before, /THIS UNIT\s+0\.4\.0 \(de07edf9\)/);
    assert.match(before, /LATEST\s+0\.4\.1 \(abcd1234\)/);
    await button("UPDATE…").click();
    await button("START UPDATE").waitFor();
    const confirm = await said();
    assert.match(confirm, /0\.4\.0 \(de07edf9\) → 0\.4\.1 \(abcd1234\)/);
    assert.match(confirm, /Don't unplug the unit or power it off/);
    assert.match(confirm, /Unsaved changes block the update/);
    await watchStages();
    await button("START UPDATE").click();
    // A page that was never given the DFU device asks for it once.
    await button("CHOOSE UPDATE DEVICE").waitFor({ timeout: 20000 });
    assert.match(await said(), /STM32 BOOTLOADER/);
    await button("CHOOSE UPDATE DEVICE").click();
    await until("DONE", async () => (await meta()) === "DONE", UPDATE_WAIT);
    assert.match(await said(), /UPDATED\s+0\.4\.0 \(de07edf9\) → 0\.4\.1 \(abcd1234\)/);
    const stages = (await stagesSeen()).filter((s) => s !== "READY");
    const order = ["CHECKING", "COPYING BANK 2", "RESTARTING INTO UPDATE MODE", "WRITING FIRMWARE", "INSTALLING", "DONE"];
    assert.deepEqual(order.filter((s) => stages.includes(s)), order, `stages seen: ${stages}`);
    const log = await usbLog();
    assertGuards(log, SECTORS);
    assert.equal(log.left, true);
    assert.equal(fake.build, "0.4.1 abcd1234", "the unit isn't running the release's CHIMERA.BIN");
    // The .bk2 went first, then dfu; the first boot installed it: no bank2 install.
    const put = fake.log.findIndex((l) => l.startsWith("put /CHIMERA/SYSTEM/BANK2.BK2 "));
    assert.ok(put >= 0 && put < fake.log.indexOf("dfu"), `the put before dfu: ${fake.log}`);
    assert.equal(fake.log.includes("bank2 install"), false);
    await backToEditor("BACK TO THE EDITOR");
    assert.equal(await statusText(), "UNIT · PART 1 · ALGO");
    // The version after: the same release now offers a reinstall.
    fake.install();
    await openUpdate();
    assert.match(await said(), /THIS UNIT\s+0\.4\.1 \(abcd1234\)/);
    assert.match(await said(), /already runs this version/);
    await button("REINSTALL…").waitFor();
    await backToEditor();
  });

  test("U2: unsaved changes refuse it: nothing put, no dfu", async () => {
    const fake = await ready({ state: "MODIFIED" });
    await openUpdate();
    await start();
    await until("the refusal", async () => /UNSAVED CHANGES/.test(await said()), 10000);
    assert.match(await said(), /Save it \(hold MENU\) or load another/);
    assert.match(await said(), /Nothing was written/);
    assert.deepEqual(fake.log.filter((l) => /^(put|dfu|bank2)/.test(l)), []);
    await backToEditor();
  });

  test("U3: a checksum mismatch: the release refused before anything is written", async () => {
    const bad = NEXT.sums.replace(/^[0-9a-f]{4}/, "0000");
    const fake = await ready({}, { sums: bad });
    await openUpdate();
    assert.match(await said(), /CHIMERA\.BIN does not match SHA256SUMS/);
    assert.equal(await button("UPDATE…").count(), 0, "UPDATE offered for files that failed their check");
    await button("CHOOSE FILES…").waitFor();
    assert.deepEqual(fake.log.filter((l) => /^(put|dfu|bank2)/.test(l)), []);
    await backToEditor();
  });

  test("U4: a DFU device that won't open (Windows): the driver steps and the SD route; WRITE AGAIN once fixed", async () => {
    await ready();
    await page.evaluate(() => {
      window.__usb.mode.unopenable = true;
      Object.defineProperty(navigator, "userAgentData", { value: { platform: "Windows" }, configurable: true });
    });
    try {
      const sent = (await usbLog()).commands.length;
      await openUpdate();
      await start();
      await until("the driver steps", async () => /CAN'T OPEN THE UNIT'S UPDATE DEVICE/.test(await said()), UPDATE_WAIT);
      const text = await said();
      for (const want of [/Zadig/, /STM32 BOOTLOADER/, /WinUSB/, /Install Driver/, /button 3 \(SD card access\)/, /Nothing has been written/]) assert.match(text, want);
      assert.equal((await usbLog()).commands.length, sent, "a command sent to a device that wouldn't open");
      await page.evaluate(() => (window.__usb.mode.unopenable = false));
      await button("WRITE AGAIN").click();
      await until("DONE", async () => (await meta()) === "DONE", UPDATE_WAIT);
      assertGuards(await usbLog(), SECTORS);
    } finally {
      await page.evaluate(() => delete navigator.userAgentData);
    }
    await backToEditor("BACK TO THE EDITOR");
  });

  test("U5: a write below 0x08020000 is refused before the device is touched", async () => {
    await ready();
    const got = await page.evaluate(async () => {
      window.__usb.plug();
      const before = window.__usb.log.opens;
      const img = new Uint8Array(4096);
      img.set([0x00, 0xff, 0x00, 0x20, 0x99, 0x02, 0x02, 0x08]);
      const out = [];
      for (const at of [0x08000000, 0x0801f800]) {
        try {
          await ChimeraDfu.write(window.__usb.device, img, at);
          out.push("written");
        } catch (e) {
          out.push(e.guard ? "guard" : `other: ${e.message}`);
        }
      }
      let built = "built";
      try {
        ChimeraDfu.eraseSector(ChimeraDfu.FirmwareAddress(0x08000000));
      } catch (e) {
        built = e.guard ? "guard" : e.message;
      }
      window.__usb.unplug();
      return { out, built, opened: window.__usb.log.opens - before };
    });
    assert.deepEqual(got, { out: ["guard", "guard"], built: "guard", opened: 0 });
  });

  test("U6: unplugged mid-copy: nothing flashed, and how to go on", async () => {
    const fake = await ready();
    fake.unplugAt = 20000;
    await openUpdate();
    await start();
    await until("the stop", async () => (await meta()) === "STOPPED", UPDATE_WAIT);
    const text = await said();
    assert.match(text, /disconnected while CHIMERA\.BK2 was copied/);
    assert.match(text, /Nothing was flashed: the unit still runs 0\.4\.0 \(de07edf9\)/);
    assert.match(text, /TRY AGAIN/);
    assert.equal(fake.log.includes("dfu"), false);
    assert.deepEqual((await stagesSeen()).filter((s) => s !== "READY").slice(0, 2), ["CHECKING", "COPYING BANK 2"]);
    await backToEditor();
  });

  test("U7: unplugged mid-write: the bootloader way to finish, then WRITE AGAIN finishes it", async () => {
    const fake = await ready();
    await page.evaluate(() => (window.__usb.mode.cutAfter = 20));
    await openUpdate();
    await start();
    await until("the cut", async () => /THE FIRMWARE WRITE WAS CUT OFF/.test(await said()), UPDATE_WAIT);
    const text = await said();
    for (const want of [/can't be bricked/, /bootloader is never touched/, /hold MENU while you power the unit on, press button 2 \(DFU Mode\)/, /button 3 \(SD card access\)/, /CHIMERA\.BIN and CHIMERA\.BK2/, /button 1/]) assert.match(text, want);
    const cut = await usbLog();
    assert.equal(cut.bootloader, true, "the bootloader's sector changed");
    assert.equal(fake.build, "0.4.0 de07edf9");
    // The unit back in DFU mode from the bootloader (button 2): WRITE AGAIN.
    await page.evaluate(() => {
      delete window.__usb.mode.cutAfter;
      window.__usb.plug();
    });
    await button("WRITE AGAIN").click();
    await until("DONE", async () => (await meta()) === "DONE", UPDATE_WAIT);
    assert.equal(fake.build, "0.4.1 abcd1234");
    await backToEditor("BACK TO THE EDITOR");
  });

  test("U8: older firmware (before bank 2): the .bk2 goes after the flash, bank2 install, its restart", async () => {
    const fake = await ready({ old: true, build: "0.2.0 02e440e2", bank2: "empty" });
    await openUpdate();
    assert.match(await said(), /THIS UNIT\s+0\.2\.0 \(02e440e2\)/);
    await start();
    await until("DONE", async () => (await meta()) === "DONE", UPDATE_WAIT);
    assert.match(await said(), /UPDATED\s+0\.2\.0 \(02e440e2\) → 0\.4\.1 \(abcd1234\)/);
    const verbs = fake.log.filter((l) => /^(put|dfu|bank2|flashed)/.test(l)).map((l) => l.split(" ").slice(0, 2).join(" "));
    assert.deepEqual(verbs, ["put /CHIMERA/SYSTEM/BANK2.BK2", "dfu", `flashed ${NEXT.bin.length}`, "put /CHIMERA/SYSTEM/BANK2.BK2", "bank2 install"]);
    assert.equal(fake.bank2, `open 0.4.1 abcd1234 seal=${NEXT.seal}`);
    await backToEditor("BACK TO THE EDITOR");
  });
});
