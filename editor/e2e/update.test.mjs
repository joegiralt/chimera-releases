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
import { bridge, followPart, openEditor, page, secondEditor, setup, statusText, until } from "./harness.mjs";
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
    delete window.__usb.mode.pickOther;
    delete window.__usb.mode.failLeave;
    window.__usb.removeOthers();
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

/** Whether the page holds a close or reload (its beforeunload prevented). */
const held = () => page.evaluate(() => {
  const e = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(e);
  return e.defaultPrevented;
});

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
    assert.match(confirm, /unsaved changes, you'll be asked to save or drop them/);
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

  test("U2: unsaved changes: the choices; CANCEL keeps them and writes nothing", async () => {
    const fake = await ready({ state: "MODIFIED" });
    await openUpdate();
    await start();
    await until("the choices", async () => /UNSAVED CHANGES/.test(await said()), 10000);
    for (const b of ["SAVE AND UPDATE", "DISCARD AND UPDATE", "CANCEL"]) await button(b).waitFor();
    assert.match(await said(), /Nothing has been written/);
    await button("CANCEL").click();
    await until("back to the offer", async () => (await meta()) === "READY", 5000);
    assert.deepEqual(fake.log.filter((l) => /^(put|dfu|bank2|ed project)/.test(l)), []);
    await backToEditor();
  });

  test("U2b: SAVE AND UPDATE saves the project, then updates", async () => {
    const fake = await ready({ state: "MODIFIED" });
    await openUpdate();
    await start();
    await button("SAVE AND UPDATE").click();
    // A page never given the DFU device asks for it once (run alone, this test is the first).
    await until("DONE", async () => {
      if (await button("CHOOSE UPDATE DEVICE").count()) await button("CHOOSE UPDATE DEVICE").click().catch(() => {});
      return (await meta()) === "DONE";
    }, UPDATE_WAIT);
    const verbs = fake.log.filter((l) => /^(put|dfu|ed project)/.test(l)).map((l) => (l.startsWith("put ") ? l.split(" ").slice(0, 2) : l.split(" ").slice(0, 3)).join(" "));
    assert.deepEqual(verbs.slice(0, 3), ["ed project save", "put /CHIMERA/SYSTEM/BANK2.BK2", "dfu"]);
    await backToEditor("BACK TO THE EDITOR");
  });

  test("U2c: DISCARD AND UPDATE reloads the project as saved, then updates", async () => {
    const fake = await ready({ state: "MODIFIED" });
    await openUpdate();
    await start();
    await button("DISCARD AND UPDATE").click();
    await until("DONE", async () => (await meta()) === "DONE", UPDATE_WAIT);
    assert.ok(fake.log.includes("ed project load 3 7 discard"), `no discard: ${fake.log}`);
    assert.ok(fake.log.indexOf("ed project load 3 7 discard") < fake.log.findIndex((l) => l.startsWith("put ")));
    await backToEditor("BACK TO THE EDITOR");
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

  test("U9: a DFU device already there before `dfu` (an F4 board) is never taken; the new one is, and the tab is held meanwhile", async () => {
    const fake = await ready();
    await page.evaluate(() => (window.__other = window.__usb.addOther("@Internal Flash   /0x08000000/04*016Kg,01*064Kg,07*128Kg")));
    await openUpdate();
    assert.equal(await held(), false, "held before START");
    await start();
    await until("the copy under way", async () => /COPYING|RESTARTING|WRITING|INSTALLING/.test(await meta()), 10000);
    assert.equal(await held(), true, "a close or reload not held mid-update");
    await until("DONE", async () => (await meta()) === "DONE", UPDATE_WAIT);
    assert.equal(await held(), false, "still held once DONE");
    assert.equal(await page.evaluate(() => window.__other.sent), 0, "the board that was there before was written to");
    assert.equal(fake.build, "0.4.1 abcd1234");
    await backToEditor("BACK TO THE EDITOR");
  });

  test("U10: a picked device that was there before `dfu` is refused; WRITE AGAIN picks the right one", async () => {
    const fake = await ready();
    await page.evaluate(() => {
      window.__usb.revoke();
      window.__other = window.__usb.addOther("@Internal Flash   /0x08000000/16*128Kg");
      window.__usb.mode.pickOther = true;
    });
    await openUpdate();
    await start();
    await button("CHOOSE UPDATE DEVICE").waitFor({ timeout: 20000 });
    await button("CHOOSE UPDATE DEVICE").click();
    await until("the refusal", async () => /ISN'T THE UNIT'S UPDATE DEVICE/.test(await said()), 10000);
    assert.match(await said(), /already there before/);
    assert.match(await said(), /Nothing has been written/);
    assert.equal(await page.evaluate(() => window.__other.sent), 0);
    await page.evaluate(() => delete window.__usb.mode.pickOther);
    await button("WRITE AGAIN").click();
    await until("DONE", async () => (await meta()) === "DONE", UPDATE_WAIT);
    assert.equal(fake.build, "0.4.1 abcd1234");
    await backToEditor("BACK TO THE EDITOR");
  });

  test("U11: no answer to `dfu`: it may be in update mode; CHOOSE UPDATE DEVICE goes on", async () => {
    const fake = await ready({ dfuSilent: true });
    await openUpdate();
    await start();
    await until("the silence said", async () => /DIDN'T ANSWER THE REQUEST FOR UPDATE MODE/.test(await said()), UPDATE_WAIT);
    for (const want of [/screen dark/, /Nothing has been flashed yet/, /button 2 \(DFU Mode\)/, /button 3 \(SD card access\)/]) assert.match(await said(), want);
    // The hand sees the dark screen (the DFU device up), then picks it.
    await until("the DFU device up", () => page.evaluate(() => window.__usb.present()), 10000);
    await button("CHOOSE UPDATE DEVICE").click();
    await until("DONE", async () => (await meta()) === "DONE", UPDATE_WAIT);
    assert.equal(fake.build, "0.4.1 abcd1234");
    await backToEditor("BACK TO THE EDITOR");
  });

  test("U12: the leave fails: firmware written, the unit didn't restart; a power cycle and CHECK AGAIN finish it", async () => {
    const fake = await ready();
    await page.evaluate(() => (window.__usb.mode.failLeave = true));
    await openUpdate();
    await start();
    await until("the stop", async () => /DIDN'T RESTART BY ITSELF/.test(await said()), UPDATE_WAIT);
    const text = await said();
    assert.doesNotMatch(text, /CUT OFF|Nothing was flashed/);
    assert.match(text, /Switch the unit off and on/);
    fake.powerCycle(NEXT.bin);
    await button("CHECK AGAIN").click();
    await until("DONE", async () => (await meta()) === "DONE", UPDATE_WAIT);
    await backToEditor("BACK TO THE EDITOR");
  });

  test("U13: TRY AGAIN after the flash asks the unit, never says nothing was flashed", async () => {
    const fake = await ready();
    await openUpdate();
    await start();
    // The unit back, but its first boot left bank 2 refused: unfinished.
    const flashed = fake.flashed.bind(fake);
    fake.flashed = (img) => {
      flashed(img);
      fake.bank2 = "slot foreign mixer";
    };
    await until("the stop", async () => /UPDATE ISN'T FINISHED/.test(await said()), UPDATE_WAIT);
    assert.doesNotMatch(await said(), /Nothing was flashed/);
    fake.bank2 = `open 0.4.1 abcd1234 seal=${NEXT.seal}`;
    const asked = fake.log.length;
    await button("TRY AGAIN").click();
    await until("DONE", async () => (await meta()) === "DONE", UPDATE_WAIT);
    assert.equal(fake.log.slice(asked).some((l) => /^(put|dfu)/.test(l)), false, "TRY AGAIN after the flash started over");
    await backToEditor("BACK TO THE EDITOR");
  });

  test("U14: a unit stuck in update mode: FINISH THE UPDATE on the connect page writes it and installs", async () => {
    const fake = await ready({ bank2: "empty" });
    // The unit left in update mode: its console gone, its DFU device up.
    bridge.down = true;
    bridge.hangUp();
    await page.evaluate(() => window.__usb.plug());
    const stuck = page.getByRole("button", { name: "UNIT STUCK IN UPDATE MODE? FINISH THE UPDATE" });
    await stuck.waitFor({ timeout: 10000 });
    await stuck.click();
    await until("the panel", async () => (await meta()) === "READY", 10000);
    assert.match(await said(), /Can't tell which version this unit had/);
    await button("FINISH THE UPDATE…").click();
    await button("FINISH THE UPDATE").click();
    // CANCEL at the device: the area may hold half an image, so no "nothing written", no "unplug".
    await button("CANCEL").click();
    await until("the stop", async () => /NO UPDATE DEVICE WAS CHOSEN/.test(await said()), 5000);
    const stopped = await said();
    assert.match(stopped, /ONLY PARTLY WRITTEN/);
    assert.doesNotMatch(stopped, /Nothing has been written|starts its old firmware/);
    await button("WRITE AGAIN").click();
    await until("DONE", async () => (await meta()) === "DONE", UPDATE_WAIT);
    assert.equal(fake.build, "0.4.1 abcd1234");
    assert.equal(fake.bank2, `open 0.4.1 abcd1234 seal=${NEXT.seal}`);
    await backToEditor("BACK TO THE EDITOR");
  });

  test("U15: an older release is a DOWNGRADE, with its warning", async () => {
    await ready({ build: "0.5.0 99999999", bank2: "open 0.5.0 99999999 seal=ffffffffffffffff" });
    await openUpdate();
    const text = await said();
    assert.match(text, /OLDER than what the unit runs/);
    assert.doesNotMatch(text, /An update is ready/);
    await button("DOWNGRADE…").click();
    await button("START UPDATE").waitFor();
    assert.match(await said(), /THIS IS A DOWNGRADE/);
    await button("CANCEL").click();
    await backToEditor();
  });

  test("U16: after a cut write, a pick that finds no device never says nothing was written or to unplug", async () => {
    const fake = await ready();
    await page.evaluate(() => (window.__usb.mode.cutAfter = 20));
    await openUpdate();
    await start();
    await until("the cut", async () => /THE FIRMWARE WRITE WAS CUT OFF/.test(await said()), UPDATE_WAIT);
    // WRITE AGAIN with the unit not yet back in DFU mode: the chooser finds nothing.
    await button("WRITE AGAIN").click();
    await until("the empty pick", async () => /NO UPDATE DEVICE WAS CHOSEN/.test(await said()), 10000);
    const text = await said();
    assert.match(text, /ONLY PARTLY WRITTEN/);
    assert.doesNotMatch(text, /Nothing has been written|starts its old firmware/);
    await page.evaluate(() => {
      delete window.__usb.mode.cutAfter;
      window.__usb.plug();
    });
    await button("WRITE AGAIN").click();
    await until("DONE", async () => (await meta()) === "DONE", UPDATE_WAIT);
    assert.equal(fake.build, "0.4.1 abcd1234");
    await backToEditor("BACK TO THE EDITOR");
  });

  // Last: its pages take the bridge's one console from the main page.
  test("U17: on connect, a newer release is offered; NOT NOW keeps it away for the session; UPDATE opens the update", async () => {
    await ready();
    const p = await secondEditor();
    const offerbar = p.locator(".offerbar");
    const connectAndFollow = async () => {
      await p.getByRole("button", { name: "CONNECT UNIT" }).click();
      await until("following", async () => /^UNIT · PART \d+ · \S+$/.test((await p.locator(".unit").innerText().catch(() => "")).trim()), 30000);
    };
    await connectAndFollow();
    await offerbar.waitFor({ timeout: 10000 });
    assert.match(await offerbar.innerText(), /Chimera 0\.4\.1 is available\. You're running 0\.4\.0\. Update now\?/);
    await offerbar.getByRole("button", { name: "NOT NOW" }).click();
    await until("the offer gone", async () => (await offerbar.count()) === 0, 3000);
    // Reconnected in the same session: not offered again.
    await p.evaluate(() => window.__serial.unplug());
    await p.getByRole("button", { name: "CONNECT UNIT" }).waitFor();
    await connectAndFollow();
    await new Promise((r) => setTimeout(r, 1500));
    assert.equal(await offerbar.count(), 0, "offered again after NOT NOW");
    // A new session (a reload): offered again, and UPDATE opens the update's page.
    await p.reload();
    await connectAndFollow();
    await offerbar.waitFor({ timeout: 10000 });
    await offerbar.getByRole("button", { name: "UPDATE" }).click();
    await until("the update's page", async () => (await p.locator(".pagehead .meta").innerText().catch(() => "")) === "READY", 10000);
    await p.locator(".upd button", { hasText: "CLOSE" }).click();
    await p.close();
  });
});
