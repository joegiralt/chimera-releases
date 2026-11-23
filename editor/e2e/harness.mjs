// SPDX-License-Identifier: GPL-3.0-or-later
// What every e2e file shares: the unit (simulator, or the real one with
// UNIT set), the bridge, headless Chrome with the built editor, the box's
// own paths to a new project and an INIT Sound, and the hands the tests use.
// Each test file is its own process, so each has its own simulator, card,
// bridge port and browser profile (its own schema cache).
//
// `setup()` registers the hooks: the unit booted and its Parts loaded
// before, everything closed after, and after every test the check that no
// page said a notice the test did not expect (`expectNotice`) or threw.

import assert from "node:assert/strict";
import path from "node:path";
import { after, afterEach, before } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { startBridge } from "./bridge.mjs";
import { describeAll } from "./contract.mjs";
import { SLOW, startUnit, tokens, UNIT, until } from "./unit.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export const editorDir = path.resolve(here, "..");
export const root = path.resolve(editorDir, "..");

/** Each engine on its own Part, INIT loaded there through the browser keys. */
export const ENGINES = ["ALGO", "MODAL", "VA", "TAPE", "DRUM"]; // EngineType::PLAYABLE's order: the INIT rows'
export const partOf = (e) => ENGINES.indexOf(e) + 1;

/** A test only the real unit can run, or only the simulator: skipped, with
 * the reason in the run's output, elsewhere. */
export const unitOnly = (why) => (UNIT ? false : `unit only (UNIT= unset): ${why}`);
export const simOnly = (why) => (UNIT ? `simulator only: ${why}` : false);

// Live bindings: the importers see these as `setup()`'s hooks set them.
export let unit;
export let bridge;
export let browser;
export let page;

/** Every page open now, for the notice check. */
const pages = new Set();
/** The notices the running test expects, as RegExps. */
let expected = [];

/** The running test expects a notice matching `re` (on any page); the check after it lets it by. */
export function expectNotice(re) {
  expected.push(re);
}

/** The notices `p` shows now, each as its text. */
export async function noticesOn(p = page) {
  return (await p.locator(".said > div:not(.connect)").allInnerTexts()).map((t) => t.trim());
}

/** `p`'s notices seen (its SEEN pressed), so the next test starts clean. */
export async function seen(p = page) {
  const b = p.locator(".said .connect button", { hasText: "SEEN" });
  if (await b.count()) await b.first().click();
  await until("the notices gone", async () => (await p.locator(".said").count()) === 0);
}

/** `status`'s `state` word: NEW (no edits since a new project), SAVED, MODIFIED... */
export async function projectState() {
  return ((await unit.ask("status")).find((l) => l.startsWith("state ")) ?? "").slice(6);
}

/** A new project, by the panel's own path: SETTINGS > PROJECT > LOAD,
 * its last row (+ CREATE NEW), EDIT. Over unsaved edits the unit asks
 * START A NEW PROJECT? with SAVE THEN LOAD, LOAD ANYWAY, CANCEL, opening on
 * SAVE THEN LOAD: the pick is clamped, so all the way left then one right
 * is LOAD ANYWAY, never a save. Nothing is written to the card. Each step's
 * place is checked before the next key; anything else up fails at once. */
export async function newProject() {
  const at = async (want) => {
    const now = await unit.at();
    if (now !== want) throw new Error(`new project: the unit is at ${JSON.stringify(now)}, not ${JSON.stringify(want)}: a screen or prompt the suite doesn't know`);
  };
  const edited = (await projectState()) === "MODIFIED";
  // MENU (a tap, never the hold's quick save) until SETTINGS' top: it cancels a
  // prompt a stopped run left up (its safe answer), climbs out of a deeper
  // list, or opens SETTINGS.
  for (let i = 0; i < 6 && (await unit.at()) !== "SETTINGS"; i++) {
    const was = await unit.at();
    await unit.ok("key MENU");
    await until("MENU to land", async () => (await unit.at()) !== was, 1000).catch(() => {});
  }
  await at("SETTINGS");
  // The bar opens on the top list's first row, PROJECT; and PROJECT's on LOAD PROJECT.
  await unit.ok("key EDIT");
  await until("SETTINGS > PROJECT", async () => (await unit.at()) === "SETTINGS > PROJECT");
  await unit.ok("key EDIT");
  await until("SETTINGS > PROJECT > LOAD", async () => (await unit.at()) === "SETTINGS > PROJECT > LOAD");
  // LOAD's rows wrap: one up from the first is the last, + CREATE NEW.
  await unit.ok("turn 1 -1");
  await at("SETTINGS > PROJECT > LOAD");
  await unit.ok("key EDIT");
  if (edited) {
    await unit.ok("turn 1 -64");
    await unit.ok("turn 1 1");
    await unit.ok("key EDIT");
  }
  await until("a new project (state NEW)", async () => (await projectState()) === "NEW", 5000).catch(async (e) => {
    throw new Error(`${e.message}; the unit is at ${JSON.stringify(await unit.at())}, state ${await projectState()}: a prompt the suite doesn't know may be up`);
  });
  // Out of SETTINGS to Part 1's pages.
  await unit.ok("key B1");
  await until("Part 1's pages", async () => (await unit.at()).startsWith("PART 1 > "));
}

/** Part `n` to the INIT Sound on browser row `row`: EDIT+B<n>, the list's top, down `row`, EDIT.
 * Only over a clean Part: an edited one would ask REPLACE? and wait for a hand. */
export async function loadInit(n, engine) {
  const sound = (await unit.ask("ed since 0")).find((l) => l.startsWith(`sound ${n} `)) ?? "";
  if (!sound.endsWith(" clean")) throw new Error(`Part ${n} is not clean (${JSON.stringify(sound)}): loading over it would ask REPLACE? and wait for a hand`);
  await unit.ok(`key EDIT+B${n}`);
  await until(`the unit's SOUND ${n} browser`, async () => (await unit.at()) === `SOUND ${n}`);
  await unit.ok("turn 1 -64");
  const row = ENGINES.indexOf(engine);
  if (row > 0) await unit.ok(`turn 1 ${row}`);
  await unit.ok("key EDIT");
  await until(`INIT ${engine} on Part ${n}`, async () => {
    const all = await unit.ask("ed since 0");
    return all.includes(`part ${n} ${engine}`) && all.includes(`sound ${n} "INIT" clean`);
  }, 15000);
}

/** The hooks: the unit up on a new project, `engines` each on its own Part
 * (ENGINES' order), the browser and bridge closed after, and the notice check
 * after every test. */
export function setup({ engines = ENGINES } = {}) {
  before(async () => {
    unit = await startUnit(root);
    // The simulator boots on a new project: an edit first, so its run takes the prompt's path too.
    if (!unit.real) await unit.ok("ed set FILTER.CUTOFF 0.3");
    await until("the edit to land", async () => unit.real || (await projectState()) === "MODIFIED");
    await newProject();
    for (const e of engines) await loadInit(partOf(e), e);
  });

  after(async () => {
    await browser?.close();
    await bridge?.close();
    await unit?.stop();
  });

  // H5: no test leaves a notice it did not expect, or a page error.
  afterEach(async () => {
    bridge?.flow.clearRules();
    const want = expected;
    expected = [];
    const bad = [];
    for (const p of pages) {
      if (p.isClosed()) {
        pages.delete(p);
        continue;
      }
      const said = await noticesOn(p).catch(() => []);
      bad.push(...said.filter((n) => !want.some((re) => re.test(n))).map((n) => `notice: ${n}`));
      bad.push(...p.errors.map((e) => `page error: ${e}`));
      p.errors = [];
      if (said.length) await seen(p).catch(() => {});
    }
    assert.deepEqual(bad, [], "a notice or page error the test did not expect");
  });
}

/** The fake `navigator.serial` (H2): a port whose streams are a WebSocket to
 * this run's bridge, so ports.js's Web Serial path (requestPort, open, the
 * read loop, `release()`) runs against the unit. `window.__serial` records
 * every call in order (`calls`) and takes faults (`mode`): `cancel` (the
 * chooser cancelled), `busy` (open rejects: held elsewhere), `writeFails`;
 * `__serial.unplug()` ends the reader as a pulled cable does. */
function fakeSerial(url) {
  const log = { calls: [], mode: {}, port: null, firstLine: null };
  window.__serial = log;
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  class FakePort {
    constructor() {
      this.readable = null;
      this.writable = null;
    }
    async open() {
      log.calls.push("open");
      if (log.mode.busy) throw new DOMException("Failed to open serial port.", "NetworkError");
      if (this.readable) throw new DOMException("The port is already open.", "InvalidStateError");
      const ws = new WebSocket(url);
      await new Promise((res, rej) => {
        ws.onopen = res;
        ws.onerror = () => rej(new DOMException("Failed to open serial port.", "NetworkError"));
      });
      this.ws = ws;
      const me = this;
      let ctl;
      const readable = new ReadableStream({
        start(c) {
          ctl = c;
          ws.onmessage = (m) => c.enqueue(enc.encode(m.data + "\r\n"));
          ws.onclose = () => {
            try {
              c.error(new DOMException("The device has been lost.", "NetworkError"));
            } catch (e) {}
          };
        },
      });
      const writable = new WritableStream({
        write(chunk) {
          if (log.mode.writeFails) throw new DOMException("Failed to write.", "NetworkError");
          for (const l of dec.decode(chunk).split("\n")) {
            if (!l) continue;
            log.firstLine ??= l;
            ws.send(l);
          }
        },
      });
      const logged = (stream, get, name) => {
        const orig = stream[get].bind(stream);
        stream[get] = () => {
          const r = orig();
          const end = name === "reader" ? "cancel" : "close";
          const fin = r[end].bind(r);
          r[end] = (...a) => {
            log.calls.push(`${name}.${end}`);
            return fin(...a);
          };
          const rel = r.releaseLock.bind(r);
          r.releaseLock = () => {
            log.calls.push(`${name}.releaseLock`);
            rel();
          };
          return r;
        };
      };
      logged(readable, "getReader", "reader");
      logged(writable, "getWriter", "writer");
      this.readable = readable;
      this.writable = writable;
      this.unplug = () => {
        log.calls.push("unplug");
        try {
          ctl.error(new DOMException("The device has been lost.", "NetworkError"));
        } catch (e) {}
        ws.close();
      };
      void me;
    }
    async close() {
      log.calls.push("close");
      if (this.readable?.locked || this.writable?.locked) throw new TypeError("Cannot close a locked stream");
      this.ws?.close();
      this.readable = null;
      this.writable = null;
    }
  }
  log.unplug = () => log.port?.unplug?.();
  const serial = {
    async requestPort() {
      log.calls.push("requestPort");
      if (log.mode.cancel) throw new DOMException("No port selected by the user.", "NotFoundError");
      log.port ??= new FakePort();
      return log.port;
    },
    async getPorts() {
      return log.port ? [log.port] : [];
    },
  };
  if (log.mode.none) return;
  Object.defineProperty(navigator, "serial", { value: serial, configurable: true });
}

/** A page of its own on the built editor, linked to this run's bridge: its
 * simulator socket and its fake serial port both reach the bridge. */
async function newEditorPage(ctx, ws = bridge.ws) {
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(String(e)));
  // Offline: fonts and anything else not on this machine fail fast.
  await p.route(/^https?:\/\/(?!127\.0\.0\.1[:/])/, (r) => r.abort());
  // The editor's simulator link is ws://127.0.0.1:7342: this run's bridge instead.
  await p.addInitScript((url) => {
    const Native = window.WebSocket;
    window.WebSocket = class extends Native {
      constructor(u, pr) {
        super(u === "ws://127.0.0.1:7342" ? url : u, pr);
      }
    };
  }, ws);
  await p.addInitScript(fakeSerial, ws);
  pages.add(p);
  return p;
}

/** How the editor is linked: `SIMULATOR` (the socket) or `UNIT` (Web Serial, the fake port). */
export let via = "SIMULATOR";

/** The browser, the bridge and the editor's page, once; connected `how`
 * (`socket` or `serial`) on first open. */
export async function openEditor({ how = "socket" } = {}) {
  if (page) return page;
  bridge = await startBridge(path.join(editorDir, "dist"), unit);
  browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/opt/google/chrome/chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  page = await newEditorPage(ctx);
  await page.goto(bridge.url);
  await connect(how);
  return page;
}

/** A second browser profile (H4): its own page, its own cache; its links to
 * this run's bridge, or to the WebSocket `ws`. `init` runs in it before the
 * editor's own scripts. */
export async function secondEditor({ ws, init } = {}) {
  await openEditor();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const p = await newEditorPage(ctx, ws);
  if (init) await p.addInitScript(init);
  await p.goto(bridge.url);
  return p;
}

/** Connected afresh `how`: a link that is up is dropped first (the connect page's buttons show only off a link). */
export async function reconnect(how = "socket", p = page) {
  if (!(await p.getByRole("button", { name: "CONNECT SIMULATOR" }).count())) {
    if (how === "serial") await p.evaluate(() => window.__serial.unplug());
    else bridge.hangUp();
    await p.getByRole("button", { name: "CONNECT SIMULATOR" }).waitFor();
  }
  await connect(how, p);
}

/** CONNECT SIMULATOR (`socket`) or CONNECT UNIT (`serial`, the fake port) on `p`. */
export async function connect(how = "socket", p = page) {
  if (p === page) via = how === "serial" ? "UNIT" : "SIMULATOR";
  await p.getByRole("button", { name: how === "serial" ? "CONNECT UNIT" : "CONNECT SIMULATOR" }).click();
}

/** The page's status text: `SIMULATOR · PART 1 · ALGO` while following. */
export async function statusText(p = page) {
  return (await p.locator(".unit").innerText().catch(() => "")).trim();
}

/** Whatever the page says instead of the editor (a link's or a halt's text), on the connect page. */
export async function connectSays(p = page) {
  if (!(await p.getByRole("button", { name: "CONNECT SIMULATOR" }).count())) return "";
  return (await p.locator(".ui.page").innerText().catch(() => "")).trim();
}

/** What the connect page says when no link is up, or a halt stopped it. */
const DOWN = /DISCONNECTED|NOT RUNNING|NOT CONNECTED|STOPPED ANSWERING|THE UNIT REFUSED|UPDATE THE|TOO LARGE|CAN'T READ|NOT THE TEXT|IN USE|USE CHROME|THE UNIT NAMED/;

/** The editor on Part `n` (its tab), the unit's engine `e` described and read. */
export async function followPart(n, e) {
  await openEditor();
  const want = `${via} · PART ${n} · ${e}`;
  // A test before this one may have left the link down or halted: connect again.
  const following = () => until("following", async () => new RegExp(`^${via} · PART \\d+ · \\S+$`).test(await statusText()), 3000).then(() => true, () => false);
  if (!(await following()) && DOWN.test(await connectSays())) {
    await page.getByRole("button", { name: via === "UNIT" ? "CONNECT UNIT" : "CONNECT SIMULATOR" }).click({ timeout: 2000 }).catch(() => {});
  }
  // Connected, following some Part, before a tab is clicked.
  await until("the editor to follow the unit", async () => new RegExp(`^${via} · PART \\d+ · \\S+$`).test(await statusText()), 30000).catch(async (err) => {
    throw new Error(`${err.message}; the page says ${JSON.stringify(await connectSays())}`);
  });
  if ((await statusText()) !== want) await page.locator(".ptop .tab", { hasText: `P${n}` }).click();
  let last = "";
  await until(`the editor on Part ${n} ${e}`, async () => {
    last = await statusText();
    return last === want && (await page.locator("[data-addr]").count()) > 0;
  }, 30000).catch((err) => {
    throw new Error(`${err.message}; the editor says ${JSON.stringify(last)}`);
  });
  await page.locator(".ptop .tab", { hasText: `P${n}` }).waitFor();
  await settled();
}

/** The editor done reading: its last few lines out all `ed since` polls (no schema asked, no edit). */
export async function settled(p = page) {
  if (p !== page) return;
  await until("the editor to settle into its polls", () => {
    const s = bridge.flow.sent.slice(-4);
    return s.length === 4 && s.every((l) => l.startsWith("ed since"));
  }, 10000, 10);
}

/** The editor on its ENGINE page (not the MIXER), on Part `n`. */
export async function onEngine(n, e) {
  await followPart(n, e);
  const tab = page.locator(".ptop .tab", { hasText: `P${n}` });
  if ((await page.locator('[data-strip="PART1"]').count()) > 0) await tab.click();
  await until("the engine page", async () => (await page.locator('[data-strip="PART1"]').count()) === 0);
}

/** The editor on its MIXER tab, the Part 1 strip drawn. */
export async function onMixer(n = 1, e = "ALGO") {
  await followPart(n, e);
  await page.locator(".ptop .tab", { hasText: "MIXER" }).click();
  await page.locator('[data-strip="PART1"]').waitFor({ timeout: 5000 * SLOW });
}

/** The unit on `addr`'s page, that cell focused: `ed learn <addr>` takes
 * the box there, `ed learn off` leaves learn. False where learn refuses the
 * cell (the unit stays where it is). */
export async function showCell(addr) {
  const was = await unit.at();
  const got = await unit.ask(`ed learn ${addr}`);
  if (!got.at(-1).startsWith("OK")) return false;
  await unit.ok("ed learn off");
  // Already on that page, `at` stays: the wait is only for a move.
  await until(`the unit on ${addr}'s page`, async () => (await unit.at()) !== was, 2000).catch(() => {});
  return true;
}

/** The unit's screen, settled: two shots alike. */
export async function settledShot() {
  let last = await unit.shot();
  return until("the unit's screen to settle", async () => {
    const now = await unit.shot();
    const same = now.equals(last);
    last = now;
    return same && now;
  });
}

/** `schema`'s describe `param` lines, each as { addr, kind, scale, min, max, step, def, page, words }. */
export async function describedParams(schema) {
  const { pages: ps } = await describeAll(unit, schema);
  const out = [];
  for (const pg of ps) {
    let panel = null;
    for (const l of pg.lines) {
      const w = tokens(l);
      if (w[0] === "panel") panel = { name: w[1], variant: w[2] ?? null };
      if (w[0] === "param") out.push({ addr: w[1], label: w[2], kind: w[3], scale: w[4], min: Number(w[5]), max: Number(w[6]), step: Number(w[7]), def: Number(w[8]), page: pg.n, panel, words: w });
    }
  }
  return out;
}

/** The slider the editor draws for `addr`. */
export const slider = (addr, p = page) => p.locator(`[data-addr="${addr}"][role="slider"]`).first();

/** The choice control (menu, toggle, selector) the editor draws for `addr`. */
export const choice = (addr, p = page) => p.locator(`[data-choice="${addr}"]`).first();

/** The editor's reading of `addr`'s slider. */
export const sliderText = (addr) => slider(addr).getAttribute("aria-valuetext");

/** Waits for the editor's slider of `addr` to read what the unit holds; returns the unit's reading. */
export async function sliderFollows(addr, ms = 5000) {
  let v;
  await until(`the editor's ${addr} to read the unit's`, async () => {
    v = await unit.get(addr);
    return (await sliderText(addr)) === v.text;
  }, ms).catch(async (e) => {
    throw new Error(`${e.message}: the unit ${v?.text}, the editor ${await sliderText(addr)}`);
  });
  return v;
}

/** The page's first knob of `engine` the unit shows and the editor draws: a
 * stepped or continuous param of describe page 0 with a [data-addr] in the DOM. */
export async function firstKnob(engine) {
  const { pages: ps } = await describeAll(unit, engine);
  const params = ps[0].lines.map(tokens).filter((w) => w[0] === "param" && (w[3] === "cont" || w[3] === "stepped"));
  // The page may still be drawing the Part's controls: wait for one of them.
  const w = await until(`a knob of ${engine}'s describe page 0 in the editor`, async () => {
    for (const p of params) if (await page.locator(`[data-addr="${p[1]}"][role="slider"]`).count()) return p;
    return null;
  });
  const knob = page.locator(`[data-addr="${w[1]}"][role="slider"]`).first();
  // A control the unit has not reported takes no hand: wait for its reading.
  const v = await unit.get(w[1]);
  await until(`the editor to read ${w[1]}`, async () => (await knob.getAttribute("aria-valuetext")) === v.text);
  return { addr: w[1], knob, kind: w[3], min: Number(w[5]), max: Number(w[6]) };
}

/** `n` wheel notches on `el` in one task: a burst no hand can beat. */
export function wheel(el, n) {
  return el.evaluate((node, n) => {
    for (let i = 0; i < Math.abs(n); i++) {
      node.dispatchEvent(new WheelEvent("wheel", { deltaY: n > 0 ? -100 : 100, bubbles: true, cancelable: true }));
    }
  }, n);
}

/** A cable's amount as the bay writes it: the unit's −127..127 as −100..100. */
export const cableText = (a) => {
  const p = Math.round((a * 100) / 127);
  return p > 0 ? `+${p}` : String(p);
};

/** The unit's routes of the followed Part: `ed since 0`'s route lines, as { cell: { amount, text } }. */
export async function unitRoutes() {
  const out = {};
  for (const l of await unit.ask("ed since 0")) {
    const w = tokens(l);
    if (w[0] === "route" && /^-?\d+$/.test(w[2])) out[w[1]] = { amount: Number(w[2]), text: w[3] };
  }
  return out;
}

/** Route `cell` once the unit has stopped gliding it: the same amount on two reads in a row. */
export async function settledRoute(cell) {
  let last = null;
  return until(`${cell} to settle on the unit`, async () => {
    const r = (await unitRoutes())[cell];
    const same = r && last && r.amount === last.amount;
    last = r;
    return same && r;
  }, 10000, 150);
}

/** Two animation frames: what a hand did this frame has been sent. */
export function frames(p = page) {
  return p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/** An element's centre once it holds still across two frames (the page lays out as values arrive). */
export async function centre(l) {
  let last = "";
  const b = await until("the element to hold still", async () => {
    await frames();
    const now = await l.boundingBox();
    const same = now && JSON.stringify(now) === last;
    last = JSON.stringify(now);
    return same && now;
  });
  return [b.x + b.width / 2, b.y + b.height / 2];
}

/** A mouse drag from `from`'s centre to `to` ([x, y]) or by `{ dy }`. */
export async function drag(from, to) {
  await from.scrollIntoViewIfNeeded();
  const [x, y] = await centre(from);
  const [tx, ty] = Array.isArray(to) ? to : [x, y + to.dy];
  await page.mouse.move(x, y);
  await page.mouse.down();
  // The page's drag listens from the next frame.
  await frames();
  await page.mouse.move(tx, ty, { steps: 8 });
  await page.mouse.up();
}

/** The editor's `ed since` polls after the bridge's `from`th line. */
export const pollsSince = (from) => bridge.flow.sent.slice(from).filter((l) => l.startsWith("ed since")).length;

/** Waits until the editor has polled `n` more times: what the unit said has been read. */
export async function polled(n = 3) {
  const from = bridge.flow.sent.length;
  await until(`${n} polls`, () => pollsSince(from) >= n, 5000, 5);
}

/** `ed get` on `addr`, but undefined where the unit has no such address. */
export async function tryGet(addr) {
  return unit.get(addr).catch(() => undefined);
}

export { SLOW, tokens, UNIT, until };

/** The unit let go and taken again around `f` (the real unit's tty, so a browser of its own can open it). */
export async function withoutUnit(f) {
  await unit.stop();
  try {
    return await f();
  } finally {
    unit = await startUnit(root);
  }
}

/** The browser, to launch another (a headed one) beside it. */
export { chromium };

/** FNV-1a 64 of describe's pages as the unit hashes them (`ed schema`). */
export function schemaHash(pages) {
  let h = 0xcbf29ce484222325n;
  for (const b of Buffer.from(pages.map((lines) => lines.map((l) => l + "\n").join("")).join(""), "utf8")) h = BigInt.asUintN(64, (h ^ BigInt(b)) * 0x100000001b3n);
  return h.toString(16).padStart(16, "0");
}

/** The editor's schema cache (IndexedDB `chimera-editor/schemas`) on `p`: its keys, or one entry set. */
export function cacheKeys(p = page) {
  return p.evaluate(
    () =>
      new Promise((res) => {
        const r = indexedDB.open("chimera-editor", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("schemas");
        r.onsuccess = () => {
          const g = r.result.transaction("schemas", "readonly").objectStore("schemas").getAllKeys();
          g.onsuccess = () => {
            r.result.close();
            res(g.result.map(String));
          };
        };
      }),
  );
}

export function cachePut(key, value, p = page) {
  return p.evaluate(
    ([key, value]) =>
      new Promise((res, rej) => {
        const r = indexedDB.open("chimera-editor", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("schemas");
        r.onsuccess = () => {
          const t = r.result.transaction("schemas", "readwrite");
          t.objectStore("schemas").put(value, key);
          t.oncomplete = () => {
            r.result.close();
            res();
          };
          t.onerror = () => rej(t.error);
        };
      }),
    [key, value],
  );
}

export function cacheGet(key, p = page) {
  return p.evaluate(
    (key) =>
      new Promise((res) => {
        const r = indexedDB.open("chimera-editor", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("schemas");
        r.onsuccess = () => {
          const g = r.result.transaction("schemas", "readonly").objectStore("schemas").get(key);
          g.onsuccess = () => {
            r.result.close();
            res(g.result ?? null);
          };
        };
      }),
    key,
  );
}

/** Every slider the editor shows a value for (cables aside) against the unit's `ed get`: the mismatches. */
export async function slidersAgainstUnit(limit = 40) {
  const shown = await page.$$eval('[data-addr][role="slider"]', (els) =>
    els.filter((e) => !e.dataset.addr.includes(":")).map((e) => [e.dataset.addr, e.getAttribute("aria-valuetext")]),
  );
  const seen = new Set();
  const bad = [];
  for (const [a, text] of shown) {
    if (seen.has(a) || seen.size >= limit) continue;
    seen.add(a);
    const v = await tryGet(a);
    if (v && v.text !== text) bad.push(`${a}: the editor ${text}, the unit ${v.text}`);
  }
  return bad;
}

/** The option named `name` of choice `addr`, picked by the editor's hand: from its menu, or its radio. */
export async function pick(addr, name, p = page) {
  const c = choice(addr, p);
  await c.waitFor();
  const menu = c.locator('[aria-haspopup="listbox"]');
  if (await menu.count()) {
    await menu.first().click();
    const opt = c.getByRole("option", { name, exact: true });
    await opt.waitFor({ timeout: 3000 }).catch(async () => {
      throw new Error(`${addr}'s menu has no option ${name}: ${await c.getByRole("option").allInnerTexts()}`);
    });
    await opt.click();
  } else {
    await c.getByRole("radio", { name, exact: true }).click();
  }
}

/** `schema`'s describe: each param's options ({ index: name }), and each panel variant's params. */
export async function describeMap(schema) {
  const { pages: ps } = await describeAll(unit, schema);
  const options = {};
  const variants = {}; // "PANEL VARIANT" -> [addr]
  let panel = "";
  for (const l of ps.flatMap((p) => p.lines)) {
    const w = tokens(l);
    if (w[0] === "panel") panel = `${w[1]} ${w[2] ?? "-"}`;
    if (w[0] === "param") (variants[panel] ??= []).push(w[1]);
    if (w[0] === "opt") (options[w[1]] ??= {})[w[2]] = w[3];
  }
  return { options, variants };
}

/** The unit's panels now (`ed since 0`'s `panel` lines) as { NAME: VARIANT }. */
export async function unitPanels() {
  const out = {};
  for (const l of await unit.ask("ed since 0")) {
    const w = tokens(l);
    if (w[0] === "panel") out[w[1]] = w[2];
  }
  return out;
}

/** The addresses the page draws a control for (sliders, choices). */
export async function drawnAddrs(p = page) {
  return new Set(await p.$$eval("[data-addr], [data-choice]", (els) => els.map((e) => e.dataset.choice ?? e.dataset.addr)));
}
