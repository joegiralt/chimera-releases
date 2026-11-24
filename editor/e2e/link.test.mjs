// SPDX-License-Identifier: GPL-3.0-or-later
// The link's life: Web Serial through a fake port (the path every tester
// takes), unplugged and plugged again, a port held elsewhere, a cancelled
// chooser, a failed write; the socket closed while following, and mid-burst;
// a second browser; a unit too new, too old or silent; the schema cache's
// hits, misses and planted entries; the firmware changed behind a live link;
// the simulator restarted behind the bridge; the firmware's own ed-bridge;
// and, on the real unit only, the real Web Serial chooser.
//
// Part 1 ALGO and Part 3 VA (INIT, loaded through the box's keys).

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { describeAll } from "./contract.mjs";
import {
  bridge, cacheGet, cacheKeys, cachePut, chromium, connect, reconnect, connectSays, expectNotice, firstKnob, followPart, frames, newProject, noticesOn, onEngine, openEditor, page, polled,
  root, schemaHash, secondEditor, simOnly, slidersAgainstUnit, slider, statusText, tokens, unit, unitOnly, until, wheel, withoutUnit, loadInit, partOf, via,
} from "./harness.mjs";
import { firmwareDir, freePort, UNIT } from "./unit.mjs";

import { setup } from "./harness.mjs";

setup({ engines: ["ALGO", "VA"] });

const serialCalls = () => page.evaluate(() => window.__serial.calls.slice());
const disconnected = async (p = page) => (await connectSays(p)).includes("THE UNIT WAS DISCONNECTED");
const setsOf = (addr, from = 0) => bridge.flow.sent.slice(from).filter((l) => l.startsWith(`ed set ${addr} `));

/** The editor reconnected over the socket, following Part 1 again. */
async function backOnSocket() {
  bridge.flow.clearRules();
  if (via !== "SIMULATOR") await reconnect("socket");
  await followPart(1, "ALGO");
}

describe("Web Serial (the fake port)", () => {
  test("A1: CONNECT UNIT opens the port and follows the Part; `ed hello` is the first line", async () => {
    await openEditor({ how: "serial" });
    await followPart(1, "ALGO");
    assert.equal(await statusText(), "UNIT · PART 1 · ALGO");
    assert.equal(await page.evaluate(() => window.__serial.firstLine), "ed hello");
    const calls = await serialCalls();
    assert.deepEqual(calls.slice(0, 2), ["requestPort", "open"]);
  });

  test("A2: the cable pulled: THE UNIT WAS DISCONNECTED, the connect page, no control left", async () => {
    await followPart(1, "ALGO");
    await page.evaluate(() => window.__serial.unplug());
    await until("the disconnect said", () => disconnected(), 5000);
    assert.equal(await page.locator('[role="slider"]').count(), 0, "a control still takes a hand");
  });

  test("A3: plugged in again, the same port opens: its streams were released in order", async () => {
    const before = (await serialCalls()).length;
    await connect("serial");
    await followPart(1, "ALGO");
    const calls = await serialCalls();
    // The pull's release, in the only order that frees the port, then the next open.
    const release = calls.slice(calls.indexOf("unplug") + 1, before);
    assert.deepEqual(release, ["reader.cancel", "reader.releaseLock", "writer.close", "writer.releaseLock", "close"]);
    assert.deepEqual(calls.slice(before), ["requestPort", "open"]);
  });

  test("A13: a port held elsewhere: THE PORT IS IN USE", async () => {
    await followPart(1, "ALGO");
    await page.evaluate(() => window.__serial.unplug());
    await until("the disconnect said", () => disconnected());
    await page.evaluate(() => (window.__serial.mode.busy = true));
    await connect("serial");
    await until("the busy port said", async () => (await connectSays()).includes("THE PORT IS IN USE"), 5000);
    await page.evaluate(() => (window.__serial.mode.busy = false));
  });

  test("the chooser cancelled: the connect page stays, nothing said", async () => {
    await page.evaluate(() => (window.__serial.mode.cancel = true));
    const was = await connectSays();
    await connect("serial");
    await until("the chooser asked", async () => (await serialCalls()).filter((c) => c === "requestPort").length >= 3);
    await frames();
    assert.equal(await connectSays(), was);
    assert.deepEqual(await noticesOn(), []);
    await page.evaluate(() => (window.__serial.mode.cancel = false));
  });

  test("A15: a write that fails: one notice, and the link dropped", async () => {
    await connect("serial");
    await followPart(1, "ALGO");
    expectNotice(/^THE LINK DROPPED A LINE: /);
    await page.evaluate(() => (window.__serial.mode.writeFails = true));
    await until("the link dropped", () => disconnected(), 5000);
    await frames();
    const said = (await noticesOn()).filter((n) => n.startsWith("THE LINK DROPPED A LINE"));
    assert.equal(said.length, 1, `notices: ${said.join(" | ")}`);
    await page.evaluate(() => (window.__serial.mode.writeFails = false));
    await page.evaluate(() => window.__serial.port.unplug());
  });
});

describe("the socket", () => {
  test("A5: the link closed while following: the connect page, and a hand there sends nothing", async () => {
    await backOnSocket();
    const { addr, knob } = await firstKnob("ALGO");
    const was = await unit.get(addr);
    const box = await knob.boundingBox();
    bridge.hangUp();
    await until("the disconnect said", () => disconnected(), 5000);
    const n = bridge.flow.sent.length;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -100);
    await frames();
    assert.equal(bridge.flow.sent.length, n, "a line went out after the link closed");
    assert.equal((await unit.get(addr)).stored, was.stored);
  });

  test("A6: connected again: the schemas asked again, the notices from before kept, the values the unit's", async () => {
    expectNotice(/^THE UNIT SAID A LINE THIS EDITOR CAN'T READ: before the drop$/);
    await connect("socket");
    await followPart(1, "ALGO");
    bridge.inject("before the drop");
    await until("the notice", async () => (await noticesOn()).length === 1);
    bridge.hangUp();
    await until("the disconnect said", () => disconnected(), 5000);
    const from = bridge.flow.sent.length;
    await connect("socket");
    await followPart(1, "ALGO");
    assert.ok(bridge.flow.sent.slice(from).includes("ed schema ALGO"), "ed schema ALGO not asked again");
    assert.deepEqual(await noticesOn(), ["THE UNIT SAID A LINE THIS EDITOR CAN'T READ: before the drop"]);
    await until("every slider the unit's", async () => (await slidersAgainstUnit()).length === 0, 5000).catch(async (e) => {
      throw new Error(`${e.message}: ${(await slidersAgainstUnit()).join("; ")}`);
    });
  });

  test("A7: the link closed mid-burst: nothing of the old burst goes on the new link", async () => {
    await followPart(1, "ALGO");
    const { addr, knob, kind, min, max } = await firstKnob("ALGO");
    const half = (min + max) / 2;
    await unit.ok(`ed set ${addr} ${kind === "stepped" ? Math.round(half) : half}`);
    await until("the editor to read it", async () => (await knob.getAttribute("aria-valuetext")) === (await unit.get(addr)).text);
    let n = 0;
    bridge.flow.rule({ match: (l) => l.startsWith(`ed set ${addr} `) && ++n === 2, act: "close" });
    const from = bridge.flow.sent.length;
    await wheel(knob, -50);
    await until("the first set answered", () => setsOf(addr, from).length === 1 && !bridge.flow.setsInFlight, 5000, 2);
    const acked = Number(tokens(setsOf(addr, from)[0])[3]);
    await wheel(knob, 50);
    await until("the link closed mid-burst", () => disconnected(), 5000);
    const after = bridge.flow.sent.length;
    await connect("socket");
    await followPart(1, "ALGO");
    await polled(8);
    assert.deepEqual(setsOf(addr, after), [], "the old burst's set went out on the new link");
    const v = await unit.get(addr);
    assert.ok(Math.abs(v.stored - acked) < 1e-4, `the unit holds ${v.stored}, the last set it answered was ${acked}`);
  });

  test("A9: a second browser connects: the first says it was disconnected, never a stale page", async () => {
    await backOnSocket();
    const p2 = await secondEditor();
    await connect("socket", p2);
    await until("the first tab disconnected", () => disconnected(), 5000);
    assert.equal(await page.locator('[role="slider"]').count(), 0);
    await until("the second follows", async () => /^SIMULATOR · PART \d · \S+$/.test(await statusText(p2)), 30000);
    await p2.context().close();
    await backOnSocket();
  });
});

describe("the unit's hello", () => {
  test("A10: a unit speaking protocol 5: UPDATE THE EDITOR, no page", async () => {
    await backOnSocket();
    bridge.flow.rule({ match: /^ed hello$/, act: "map", map: (ls) => ls.map((l) => l.replace(/^ed hello \d+ /, "ed hello 5 ")) });
    await reconnect("socket");
    await until("the halt", async () => (await connectSays()).includes("UPDATE THE EDITOR: THE UNIT SPEAKS PROTOCOL 5, THIS EDITOR 4"), 5000);
    assert.equal(await page.locator('[role="slider"]').count(), 0);
  });

  test("A11: a unit speaking protocol 3: this editor needs 0.4, and where to get it", async () => {
    bridge.flow.clearRules();
    bridge.flow.rule({ match: /^ed hello$/, act: "map", map: (ls) => ls.map((l) => l.replace(/^ed hello \d+ /, "ed hello 3 ")) });
    await reconnect("socket");
    await until("the halt", async () => (await connectSays()).includes("THIS EDITOR NEEDS CHIMERA 0.4 OR LATER."), 5000);
    assert.ok(!(await connectSays()).includes("THIS UNIT IS RUNNING"), "a version it was never told");
    assert.equal(await page.locator(".download a").getAttribute("href"), "https://github.com/joegiralt/chimera-releases/releases");
  });

  test("A11: a 0.3 unit (no `ed`): its version asked of `status`, nothing else sent, and the download linked", async () => {
    bridge.flow.clearRules();
    // 0.3's console: `ed` unknown, `status` as it writes it.
    bridge.flow.rule({ match: /^ed hello$/, act: "answer", lines: ["ERR unknown command ed, try help"] });
    bridge.flow.rule({ match: /^status$/, act: "answer", lines: ["firmware 0.3.0 release", "build 2c8c47aa2", "protocol 3", "project NEW PROJECT", "state new", "part 1", "at PART 1 > ALGORITHM", "sram4 ok", "OK"] });
    const from = bridge.flow.sent.length;
    await reconnect("socket");
    await until("the halt", async () => (await connectSays()).includes("THIS EDITOR NEEDS CHIMERA 0.4 OR LATER. THIS UNIT IS RUNNING 0.3.0."), 5000);
    const link = page.locator(".download a");
    assert.equal(await link.getAttribute("href"), "https://github.com/joegiralt/chimera-releases/releases");
    assert.equal((await link.innerText()).trim(), "DOWNLOAD CHIMERA 0.4 OR LATER");
    await new Promise((r) => setTimeout(r, 500));
    assert.deepEqual(bridge.flow.sent.slice(from), ["ed hello", "status"], "sent besides hello and status");
    assert.equal(await page.locator(".said").count(), 0, "status's lines said as notices");
  });

  test("A12: a unit that never answers at connect: THE UNIT STOPPED ANSWERING", async () => {
    bridge.flow.clearRules();
    bridge.flow.rule({ match: /^ed hello$/, act: "drop" });
    const t0 = Date.now();
    await reconnect("socket");
    await until("the halt", async () => (await connectSays()).includes("THE UNIT STOPPED ANSWERING"), 5000);
    assert.ok(Date.now() - t0 < 3000, `said after ${Date.now() - t0} ms`);
    await backOnSocket();
  });

  test("A14: a browser without Web Serial: USE CHROME OR EDGE", async () => {
    const p2 = await secondEditor({
      init: () => {
        delete navigator.serial;
        delete Navigator.prototype.serial;
      },
    });
    await connect("serial", p2);
    await until("the browser named", async () => (await connectSays(p2)).includes("USE CHROME OR EDGE"), 5000);
    await p2.context().close();
  });
});

describe("the schema cache", () => {
  test("B2: each schema read is kept under protocol/schema/hash, its lines hashing to the unit's", async () => {
    await backOnSocket();
    const keys = await cacheKeys();
    for (const s of ["ALGO", "MIXER", "MTX-ALGO", "SETTINGS"]) {
      const head = tokens((await unit.ask(`ed schema ${s}`))[0]);
      const key = `4/${s}/${head[3]}`;
      assert.ok(keys.includes(key), `no ${key} in ${keys.join(" ")}`);
      const lines = await cacheGet(key);
      assert.equal(schemaHash([lines]), head[3], `${key}'s lines don't hash to the unit's`);
    }
  });

  test("B1: a reload reads every schema from the cache: no `ed describe` sent, the same controls", async () => {
    await backOnSocket();
    const addrs = async () => (await page.$$eval("[data-addr], [data-choice]", (els) => els.map((e) => e.dataset.addr ?? e.dataset.choice))).sort();
    const before = await addrs();
    await page.reload();
    bridge.flow.reset();
    await connect("socket");
    await followPart(1, "ALGO");
    await until("the page drawn as before", async () => JSON.stringify(await addrs()) === JSON.stringify(before), 5000);
    assert.deepEqual(bridge.flow.sent.filter((l) => l.startsWith("ed describe")), []);
  });

  test("B3: a garbled cache entry (no list, wrong lines, cut short) is a miss: described again, no halt", async () => {
    const head = tokens((await unit.ask("ed schema ALGO"))[0]);
    const key = `4/ALGO/${head[3]}`;
    const real = await cacheGet(key);
    for (const bad of [{ not: "a list" }, ["page 0 SND of 1", "param NOPE.NOPE \"X\" cont lin 0 1 0.1 0 -"], real.slice(0, 10)]) {
      await page.reload();
      await cachePut(key, bad);
      bridge.flow.reset();
      await connect("socket");
      await followPart(1, "ALGO");
      assert.ok(bridge.flow.sent.includes("ed describe ALGO 0"), `ALGO not described again over ${JSON.stringify(bad).slice(0, 60)}`);
      assert.deepEqual(await cacheGet(key), real, "the entry is the unit's text again");
    }
  });

  test("B4: an entry that hashes to what the unit says but holds a line the editor can't read: the halt names it", async () => {
    const planted = ["page 0 SND of 1", "panel SND -", "this is no describe line"];
    const hash = schemaHash([planted]);
    await page.reload();
    await cachePut(`4/ALGO/${hash}`, planted);
    bridge.flow.rule({ match: /^ed schema ALGO$/, act: "answer", lines: [`schema ALGO 1 ${hash}`, "OK"] });
    await connect("socket");
    await until("the halt", async () => (await connectSays()).includes("THE UNIT'S ALGO SCHEMA HAS A LINE THIS EDITOR CAN'T READ: this is no describe line"), 5000);
    await backOnSocket();
  });

  test("B7: no IndexedDB at all: every schema described, the connect completes", async () => {
    const p2 = await secondEditor({ init: () => Object.defineProperty(window, "indexedDB", { value: undefined, configurable: true }) });
    await connect("socket", p2);
    await until("the second follows", async () => /^SIMULATOR · PART \d · \S+$/.test(await statusText(p2)) && (await p2.locator("[data-addr]").count()) > 0, 30000);
    await p2.context().close();
    await backOnSocket();
  });
});

/** `schema`'s describe less `victim`'s param and opt lines, as another firmware's might be: its pages and hash. */
async function without(schema, victim) {
  const { pages } = await describeAll(unit, schema);
  const changed = pages.map((p) => p.lines.filter((l) => !(/^(param|opt) /.test(l) && tokens(l)[1] === victim)));
  return { changed, hash: schemaHash(changed) };
}

/** The bridge answering for `schema` as the other firmware: its `ed schema` and every page. */
function asOtherFirmware(schema, { changed, hash }) {
  bridge.flow.rule({ match: new RegExp(`^ed schema ${schema}$`), act: "answer", lines: [`schema ${schema} ${changed.length} ${hash}`, "OK"], times: Infinity });
  bridge.flow.rule({
    match: new RegExp(`^ed describe ${schema} \\d+$`),
    act: "map",
    map: (lines, line) => [...changed[Number(line.split(" ").at(-1))], "OK"],
    times: Infinity,
  });
}

/** A continuous param of `schema`'s first page the editor draws now. */
async function drawnParam(schema) {
  const { pages } = await describeAll(unit, schema);
  for (const w of pages[0].lines.map(tokens)) if (w[0] === "param" && w[3] === "cont" && (await slider(w[1]).count())) return w[1];
  throw new Error(`no continuous param of ${schema}'s page 0 drawn`);
}

describe("the firmware changed behind the link", () => {
  test("B6: an engine change asks `ed schema` again, and a held schema the unit no longer has is read afresh", async () => {
    await backOnSocket();
    await onEngine(3, "VA");
    const victim = await drawnParam("VA");
    await onEngine(1, "ALGO");
    asOtherFirmware("VA", await without("VA", victim));
    const from = bridge.flow.sent.length;
    await onEngine(3, "VA");
    await until("ed schema VA asked on the engine change", () => bridge.flow.sent.slice(from).includes("ed schema VA"), 5000);
    await until(`${victim} gone from the page`, async () => (await slider(victim).count()) === 0, 5000);
    bridge.flow.clearRules();
    await onEngine(1, "ALGO");
  });

  test("A8: the simulator restarted behind the bridge: the editor greets it again and shows its values", { skip: simOnly("restarts the simulator") }, async () => {
    await backOnSocket();
    const from = bridge.flow.sent.length;
    await unit.restart();
    await until("the editor to greet the restarted unit", () => bridge.flow.sent.slice(from).includes("ed hello"), 20000).catch((e) => {
      const got = bridge.flow.got.slice(-8).map((g) => `${g.line} -> ${g.lines.length} lines, ${g.lines.at(-1)}`);
      throw new Error(`${e.message}; sent ${bridge.flow.sent.slice(from).slice(-12).join(" | ")}; got ${got.join(" | ")}`);
    });
    await followPart(1, "ALGO");
    await until("every slider the unit's", async () => (await slidersAgainstUnit()).length === 0, 10000).catch(async (e) => {
      throw new Error(`${e.message}: ${(await slidersAgainstUnit()).join("; ")}`);
    });
    // The restarted unit counts from its first number again.
    const ok = bridge.flow.got.slice(-20).map((g) => g.lines.at(-1)).find((l) => /^OK \d+$/.test(l));
    assert.ok(Number(ok.slice(3)) < 1000, `the unit's number ${ok}`);
  });

  test("B5: restarted on other firmware: its schema used, the old one's address gone", { skip: simOnly("restarts the simulator") }, async () => {
    await backOnSocket();
    const victim = await drawnParam("ALGO");
    asOtherFirmware("ALGO", await without("ALGO", victim));
    const from = bridge.flow.sent.length;
    await unit.restart();
    await until("ALGO described afresh", () => bridge.flow.sent.slice(from).includes("ed describe ALGO 0"), 15000);
    await followPart(1, "ALGO");
    await until(`${victim} gone from the page`, async () => (await slider(victim).count()) === 0, 5000);
    bridge.flow.clearRules();
    // Back to the run's own state for what follows.
    await newProject();
    await loadInit(partOf("VA"), "VA");
    await page.reload();
    await connect("socket");
    await followPart(1, "ALGO");
  });
});

test("A16: the firmware's own ed-bridge (`just editor-sim`'s) carries the editor", { skip: simOnly("bridges the simulator's console") }, async (t) => {
  const bin = path.join(firmwareDir(root), "target", process.env.E2E_PROFILE ?? "utils", "chimera-utils");
  if (!fs.existsSync(bin)) return t.skip(`no ${bin}: \`just e2e-full\` builds it`);
  await openEditor();
  const port = await freePort();
  // The console takes one client: the test's lets go while the firmware's bridge holds it.
  bridge.hangUp();
  await unit.hangUp();
  const proc = spawn(bin, ["ed-bridge", "--listen", `127.0.0.1:${port}`, "--console", unit.consoleAddr()], { stdio: "ignore" });
  try {
    const p2 = await secondEditor({ ws: `ws://127.0.0.1:${port}/` });
    // The ed-bridge may not listen yet: NOT RUNNING, and connect again.
    await until("the editor following through the ed-bridge", async () => {
      if (/^SIMULATOR · PART \d · \S+$/.test(await statusText(p2))) return true;
      const says = await connectSays(p2);
      if (says && !/READING THE UNIT/.test(says)) await connect("socket", p2);
      return false;
    }, 30000, 250);
    await until("controls drawn", async () => (await p2.locator('[data-addr][role="slider"]').count()) > 0, 10000);
    assert.deepEqual(await noticesOn(p2), []);
    await p2.context().close();
  } finally {
    proc.kill();
    await new Promise((r) => (proc.exitCode !== null ? r() : proc.once("exit", r)));
    await unit.redial();
  }
});

test("A4: the real unit over real Web Serial: the chooser picked by hand, the Part and engine the unit's", { skip: unitOnly("a headed Chrome and a hand to pick the port (E2E_MANUAL_SERIAL=1)") || (!process.env.E2E_MANUAL_SERIAL && "set E2E_MANUAL_SERIAL=1 to pick the port by hand") }, async () => {
  await openEditor();
  const want = (await unit.ask("ed hello"))[0];
  const [, , , , n, e] = tokens(want);
  await withoutUnit(async () => {
    const b = await chromium.launch({ executablePath: process.env.CHROME ?? "/opt/google/chrome/chrome", headless: false });
    try {
      const p = await b.newPage();
      await p.goto(bridge.url);
      console.error("A4: click CONNECT UNIT and pick the Chimera port (0483:5740)");
      await until("the editor to follow the unit", async () => (await statusText(p)) === `UNIT · PART ${n} · ${e}`, 120000);
    } finally {
      await b.close();
    }
  });
  void UNIT;
});
