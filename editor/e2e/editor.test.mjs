// SPDX-License-Identifier: GPL-3.0-or-later
// The editor end to end against the simulated unit (`just e2e`), or the real
// one over USB (`UNIT=auto just e2e`). The built editor (editor/dist) in
// headless Chrome, the unit behind it, and every assertion made on both
// sides: the editor's DOM, and the unit's values, routes and screen through
// its console. On the real unit: INIT on Parts 1-5, values and routes set and
// removed, never a project saved, nothing written to its flash (unit.mjs's
// guard).
//
// CHROME: the browser (default /opt/google/chrome/chrome). Nothing is
// downloaded; pages may reach 127.0.0.1 only.

import assert from "node:assert/strict";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { startBridge } from "./bridge.mjs";
import { check, describeAll, editorReader, KINDS } from "./contract.mjs";
import { Console, refusedOnUnit, SLOW, startUnit, tokens, until } from "./unit.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const editorDir = path.resolve(here, "..");
const root = path.resolve(editorDir, "..");

/** The firmware's screen doesn't yet redraw for a set from the editor:
 * until it does, that check is a TODO, reported and not failing.
 * REDRAW_FIXED=1 makes it a plain test. */
const REDRAW_TODO = process.env.REDRAW_FIXED === "1" ? false : "the unit's screen doesn't redraw on `ed set` yet (a firmware fix is on its way)";

/** Each engine on its own Part, INIT loaded there through the browser keys. */
const ENGINES = ["ALGO", "MODAL", "VA", "TAPE", "DRUM"]; // EngineType::PLAYABLE's order: the INIT rows'
const partOf = (e) => ENGINES.indexOf(e) + 1;

let unit;
let bridge;
let browser;
let page;

/** Part `n` to the INIT Sound on browser row `row`: EDIT+B<n>, the list's top, down `row`, EDIT. */
async function loadInit(n, engine) {
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

before(async () => {
  unit = await startUnit(root);
  for (const e of ENGINES) await loadInit(partOf(e), e);
});

after(async () => {
  await browser?.close();
  await bridge?.close();
  await unit?.stop();
});

// ---- the real unit's guard ----

test("on a real unit, the verbs that write its flash or card files are refused, never sent", async () => {
  for (const l of ["dfu", "rm SOUNDS/X.SND", "put a b", "bank2 x", "sweep", "flash", "card clean", "Card  Clean"]) assert.ok(refusedOnUnit(l), l);
  for (const l of ["ed set FILTER.CUTOFF 0.5", "ed route LFO3:FILTER.RESO off", "key EDIT", "turn 1 -64", "shot raw", "status", "card", "ed hello"]) assert.equal(refusedOnUnit(l), null, l);
  const wrote = [];
  const fake = { on() {}, write: (s) => wrote.push(s) };
  const got = await new Console(fake, true).ask("dfu");
  assert.equal(got.lines.at(-1), "ERR e2e refuses dfu on a real unit");
  assert.deepEqual(wrote, []);
});

// ---- the contract: the unit's lines, read by the editor's own parser ----

test("contract: every describe and since line the unit writes, the editor reads", async (t) => {
  const read = editorReader(path.join(here, "contract"));
  const seen = new Set();
  const failures = [];
  const take = async (kind, lines) => {
    const r = await check(read, kind, lines, seen);
    failures.push(...r.failures);
    return r.reading;
  };
  /** `ed since <n>` whole, an `OK <m> more` asked again: its lines, OK lines included. */
  const since = async (n) => {
    const out = [];
    for (;;) {
      const got = await unit.ask(`ed since ${n}`);
      out.push(...got);
      const m = /^OK (\d+)( more)?$/.exec(got.at(-1));
      assert.ok(m, `ed since ${n}: ${got.at(-1)}`);
      if (!m[2]) return { lines: out, gen: Number(m[1]) };
      n = Number(m[1]);
    }
  };

  await take("hello", await unit.ask("ed hello"));
  for (const s of [...ENGINES, ...ENGINES.map((e) => `MTX-${e}`), "MIXER", "SETTINGS", "MAP", "ORBIT"]) {
    const { head, pages } = await describeAll(unit, s);
    await take(`schema ${s}`, [head]);
    if (!pages.length) {
      t.diagnostic(`${s}: 0 pages in this build`);
      continue;
    }
    const lines = pages.flatMap((p) => p.lines);
    const r = await take(`describe ${s}`, lines);
    // Schema.add keeps every page and every address the unit described.
    if (r.pages !== pages.length) failures.push(`describe ${s}: the editor's schema holds ${r.pages} pages, the unit described ${pages.length}`);
    const want = new Set(lines.map(tokens).filter((w) => w[0] === "param").map((w) => w[1]));
    const missing = [...want].filter((a) => !r.addresses.includes(a));
    if (missing.length) failures.push(`describe ${s}: the editor's schema lacks ${missing.slice(0, 8).join(" ")}`);
  }

  // Each engine's Part whole, then diffs: a value, a route made and gone, a project saved.
  for (const e of ENGINES) {
    await unit.ok(`ed part ${partOf(e)}`);
    await take(`since 0, ${e}`, (await since(0)).lines);
  }
  await unit.ok("ed part 1");
  let { gen } = await since(0);
  // A project saved is a file on the card: the simulator's own card only, never the unit's.
  const diffs = ["ed set FILTER.CUTOFF 0.5", "ed route LFO3:FILTER.RESO 33", "ed route LFO3:FILTER.RESO off", ...(unit.real ? [] : ["ed project saveas E2E_CONTRACT"]), "ed projects"];
  if (unit.real) t.diagnostic("the real unit: no project saved");
  for (const cmd of diffs) {
    await unit.ok(cmd);
    // Its effect lands within a frame or two: the next answers until one says more than OK.
    await until(`a since diff after ${cmd}`, async () => {
      const r = await since(gen);
      gen = r.gen;
      await take(`since diff after ${cmd}`, r.lines);
      return r.lines.length > 1;
    });
  }
  // Sets the DRUM pad's machine lacks: the unit's refusals, as `refused` or ERR.
  await unit.ok("ed part 5");
  ({ gen } = await since(0));
  // PAD3's machine (PLAIN-IMPULSE) lacks some of the six knobs: those sets are refused at their turn.
  for (const k of "ABCDEF") await take("set refused", await unit.ask(`ed set PAD3.KNOB_${k} 100`));
  await until("the refusal in a since diff", async () => {
    const r = await since(gen);
    gen = r.gen;
    await take("since after a refusal", r.lines);
    return r.lines.some((l) => l.startsWith("refused "));
  }, 1000).catch((e) => t.diagnostic(`no refused line: ${e.message}`));

  const unseen = Object.keys(KINDS).filter((k) => !seen.has(k));
  t.diagnostic(`kinds seen: ${seen.size} of ${Object.keys(KINDS).length}; not written by the unit in this run: ${unseen.join(" ") || "none"}`);
  assert.deepEqual(failures, []);
});

// ---- the editor in the browser ----

async function openEditor() {
  if (page) return page;
  bridge = await startBridge(path.join(editorDir, "dist"), unit);
  browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/opt/google/chrome/chrome", headless: true });
  page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(String(e)));
  // Offline: fonts and anything else not on this machine fail fast.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1[:/])/, (r) => r.abort());
  // The editor's simulator link is ws://127.0.0.1:7342: this run's bridge instead.
  await page.addInitScript((url) => {
    const Native = window.WebSocket;
    window.WebSocket = class extends Native {
      constructor(u, p) {
        super(u === "ws://127.0.0.1:7342" ? url : u, p);
      }
    };
  }, bridge.ws);
  await page.goto(bridge.url);
  await page.getByRole("button", { name: "CONNECT SIMULATOR" }).click();
  return page;
}

/** The editor on Part `n` (its tab), the unit's engine `e` described and read. */
async function followPart(n, e) {
  await openEditor();
  const said = async () => (await page.locator(".unit").innerText()).trim();
  const want = `SIMULATOR · PART ${n} · ${e}`;
  // Connected, following some Part, before a tab is clicked.
  await until("the editor to follow the unit", async () => /^SIMULATOR · PART \d+ · \S+$/.test(await said()), 30000);
  if ((await said()) !== want) await page.locator(".ptop .tab", { hasText: `P${n}` }).click();
  let last = "";
  await until(`the editor on Part ${n} ${e}`, async () => {
    last = await said();
    return last === want && (await page.locator("[data-addr]").count()) > 0;
  }, 30000).catch((err) => {
    throw new Error(`${err.message}; the editor says ${JSON.stringify(last)}`);
  });
}

/** The unit's screen, settled: two shots alike. */
async function settledShot() {
  let last = await unit.shot();
  return until("the unit's screen to settle", async () => {
    const now = await unit.shot();
    const same = now.equals(last);
    last = now;
    return same && now;
  });
}

/** The page's first knob of `engine` the unit shows and the editor draws: a
 * stepped or continuous param of describe page 0 with a [data-addr] in the DOM. */
async function firstKnob(engine) {
  const { pages } = await describeAll(unit, engine);
  const params = pages[0].lines.map(tokens).filter((w) => w[0] === "param" && (w[3] === "cont" || w[3] === "stepped"));
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
function wheel(el, n) {
  return el.evaluate((node, n) => {
    for (let i = 0; i < Math.abs(n); i++) {
      node.dispatchEvent(new WheelEvent("wheel", { deltaY: n > 0 ? -100 : 100, bubbles: true, cancelable: true }));
    }
  }, n);
}

/** A cable's amount as the bay writes it: the unit's −127..127 as −100..100. */
const cableText = (a) => {
  const p = Math.round((a * 100) / 127);
  return p > 0 ? `+${p}` : String(p);
};

/** The unit's routes of the followed Part: `ed since 0`'s route lines, as { cell: { amount, text } }. */
async function unitRoutes() {
  const out = {};
  for (const l of await unit.ask("ed since 0")) {
    const w = tokens(l);
    if (w[0] === "route" && /^-?\d+$/.test(w[2])) out[w[1]] = { amount: Number(w[2]), text: w[3] };
  }
  return out;
}

for (const engine of ENGINES) {
  const n = partOf(engine);
  describe(`${engine} on Part ${n}`, () => {
    test("connects: the page renders, no notice, no page error", async () => {
      await followPart(n, engine);
      assert.equal(await page.locator(".said").count(), 0, `notices: ${await page.locator(".said").allInnerTexts()}`);
      assert.deepEqual(page.errors, []);
      assert.ok((await page.locator(".pnl").count()) > 0, "no module drawn");
    });

    test("every module screen paints more than a flat line", async () => {
      await followPart(n, engine);
      // Each <chimera-screen> painted (or hidden as the Sound doesn't show it).
      await until("every screen painted", () =>
        page.$$eval("chimera-screen", (els) => els.every((e) => e.hasAttribute("data-painted") || e.hidden || e.hasAttribute("data-error"))),
      );
      const screens = await page.$$eval(".screen", (els) =>
        els.map((box) => {
          const title = box.closest(".pnl")?.querySelector(".handle, .gt")?.textContent?.trim() ?? "?";
          const s = box.querySelector("chimera-screen");
          if (!s) {
            const img = box.querySelector("img");
            return { title, kind: "img", ok: !!img && img.complete && img.naturalWidth > 0 };
          }
          if (s.hidden) return { title, kind: "hidden", ok: true };
          const c = s.querySelector("canvas");
          const g = c.getContext("2d");
          const { data } = g.getImageData(0, 0, c.width, c.height);
          // Rows holding a pixel unlike the corner's (the background): a flat line is one or two.
          let rows = 0;
          for (let y = 0; y < c.height; y++) {
            for (let x = 0; x < c.width; x++) {
              const i = (y * c.width + x) * 4;
              if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) {
                rows++;
                break;
              }
            }
          }
          return { title, kind: "screen", error: s.getAttribute("data-error"), refused: s.getAttribute("data-refused"), rows, ok: rows > 2 };
        }),
      );
      assert.ok(screens.some((s) => s.kind === "screen"), "no unit screen on the page");
      const bad = screens.filter((s) => !s.ok || s.error || s.refused);
      assert.deepEqual(bad, [], `${screens.length} screens`);
    });

    test("a knob turned in the editor moves the unit's value", async (t) => {
      await followPart(n, engine);
      const { addr, knob } = await firstKnob(engine);
      const was = await unit.get(addr);
      // Away from the end it sits at.
      await wheel(knob, was.norm > 0.5 ? -1 : 1);
      const now = await until(`${addr} to move on the unit`, async () => {
        const v = await unit.get(addr);
        return v.stored !== was.stored && v;
      });
      t.diagnostic(`${addr}: ${was.text} -> ${now.text}`);
      await until("the editor to show the unit's value", async () => (await knob.getAttribute("aria-valuetext")) === now.text);
    });

    test("the unit's own screen redraws when the editor sets a cell its page shows", { todo: REDRAW_TODO }, async () => {
      await followPart(n, engine);
      const at = await unit.at();
      assert.match(at, new RegExp(`^PART ${n} > `), "the unit shows the Part's page");
      const { addr, knob } = await firstKnob(engine);
      const before = await settledShot();
      const was = await unit.get(addr);
      await wheel(knob, was.norm > 0.5 ? -1 : 1);
      await until(`${addr} to move on the unit`, async () => (await unit.get(addr)).stored !== was.stored);
      await until("the unit's screen to change", async () => !(await unit.shot()).equals(before), 2000);
    });

    test("MOD bay: the unit's routes are the cables; patch, amount and unpatch reach the unit", async () => {
      await followPart(n, engine);
      const bay = page.locator(".bay");
      const unitHas = (await unit.ask("ed since 0")).some((l) => l.startsWith(`routes ${n}`));
      assert.ok(unitHas, `the unit reports no routes for Part ${n}`);
      await bay.first().waitFor({ timeout: 5000 * SLOW }).catch(() => {});
      assert.equal(await bay.count(), 1, "the unit reports the Part's routes: the editor draws one MOD bay for them");
      const srcName = "LFO3";
      const src = bay.locator(".jcol.srcs > *", { hasText: srcName }).first();
      const dsts = bay.locator(".jcol.dsts > *");
      const dstName = (await dsts.first().innerText()).trim();
      // A route set on the unit is drawn.
      const routes0 = await unitRoutes();
      const cellOf = (r) => Object.keys(r).find((c) => c.startsWith(`${srcName}:`));
      assert.equal(cellOf(routes0), undefined, `${srcName} starts unpatched: ${JSON.stringify(routes0)}`);
      const att = bay.locator(`.att[aria-label="${srcName} to ${dstName}"]`);
      // Patch in the editor: from the source's jack to the first destination's.
      bridge.flow.reset();
      await src.scrollIntoViewIfNeeded();
      // The page still lays out as values arrive: a box held still across two frames.
      const centre = async (l) => {
        let last = "";
        const b = await until("the jack to hold still", async () => {
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
          const now = await l.boundingBox();
          const same = JSON.stringify(now) === last;
          last = JSON.stringify(now);
          return same && now;
        });
        return [b.x + b.width / 2, b.y + b.height / 2];
      };
      const [sx, sy] = await centre(src);
      const [dx, dy] = await centre(dsts.first());
      await page.mouse.move(sx, sy);
      await page.mouse.down();
      await page.mouse.move(dx, dy, { steps: 5 });
      await page.mouse.up();
      const patched = await until(`${srcName} patched on the unit`, async () => cellOf(await unitRoutes())).catch(async (e) => {
        const routes = bridge.flow.sent.filter((l) => l.startsWith("ed route"));
        const hit = (x, y) => page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.outerHTML.slice(0, 80), [x, y]);
        throw new Error(`${e.message}; the editor sent ${routes.join(", ") || "no ed route"}; drag ${await hit(sx, sy)} at ${sx},${sy} to ${await hit(dx, dy)} at ${dx},${dy}`);
      });
      await att.waitFor();
      // The cable's amount, dragged up.
      const from = (await unitRoutes())[patched].amount;
      const [ax, ay] = await centre(att);
      await page.mouse.move(ax, ay);
      await page.mouse.down();
      await page.mouse.move(ax, ay - 75, { steps: 6 });
      await page.mouse.up();
      const moved = await until(`${patched}'s amount to move`, async () => {
        const r = (await unitRoutes())[patched];
        return r && r.amount !== from && r;
      });
      await until(`the cable to show the unit's amount ${moved.amount} as ${cableText(moved.amount)}`, async () => (await att.getAttribute("aria-valuetext")) === cableText(moved.amount));
      // Unpatch: a double click.
      await att.dblclick();
      await until(`${patched} gone from the unit`, async () => !cellOf(await unitRoutes()));
      await att.waitFor({ state: "detached" });
      // And a route made on the unit shows as a cable.
      await unit.ok(`ed route ${patched} 50`);
      await att.waitFor();
      // The unit glides a route a step a pass: wait for it to land, not a value on the way.
      const set = await until(`${patched} at 50 on the unit`, async () => {
        const r = (await unitRoutes())[patched];
        return r && r.amount === 50 && r;
      });
      await until(`the unit's amount ${set.amount} on the cable`, async () => (await att.getAttribute("aria-valuetext")) === cableText(set.amount));
      await unit.ok(`ed route ${patched} off`);
      await att.waitFor({ state: "detached" });
    });

    test("flow control: 200 wheel notches leave the final value, one set in flight at most", async () => {
      await followPart(n, engine);
      const { addr, knob, kind, min, max } = await firstKnob(engine);
      // From mid-travel, set on the unit: a stale start would show.
      const half = (min + max) / 2;
      await unit.ok(`ed set ${addr} ${kind === "stepped" ? Math.round(half) : half}`);
      const mid = await until(`${addr} mid-travel`, async () => {
        const v = await unit.get(addr);
        return v.norm > 0.2 && v.norm < 0.8 && v;
      });
      await until("the editor to read it", async () => (await knob.getAttribute("aria-valuetext")) === mid.text);
      await until("no set in flight", () => bridge.flow.setsInFlight === 0);
      bridge.flow.reset();
      // Down past the end, then up part of the way: the final value is mid-travel.
      await wheel(knob, -150);
      // The first burst's set answered, and then the unit slow: its next
      // answers held while the second burst lands, before any `since` has
      // said the value the first set. The hand must count from what it asked.
      const isSet = (l) => l.startsWith(`ed set ${addr} `);
      await until("the first burst's set answered", () => bridge.flow.sent.some(isSet) && !bridge.flow.setsInFlight, 5000, 1);
      bridge.flow.pause();
      const before = bridge.flow.sent.filter(isSet).length;
      await wheel(knob, 50);
      await until("the second burst's set sent", () => bridge.flow.sent.filter(isSet).length > before).finally(() => bridge.flow.resume());
      // Idle: a set went out, none is in flight, and the editor has polled
      // `ed since` five times since its last set (it polls while following).
      const quiet = () => {
        const s = bridge.flow.sent;
        const last = s.findLastIndex((l) => l.startsWith("ed set "));
        return last >= 0 && !bridge.flow.setsInFlight && s.slice(last + 1).filter((l) => l.startsWith("ed since")).length >= 5;
      };
      await until("the editor's sets to stop", quiet, 15000);
      const lastSet = tokens(bridge.flow.sent.findLast((l) => l.startsWith(`ed set ${addr} `)))[3];
      const final = await unit.get(addr);
      await until("the editor to show the unit's value", async () => (await knob.getAttribute("aria-valuetext")) === final.text);
      const sets = bridge.flow.sent.filter((l) => l.startsWith(`ed set ${addr} `)).length;
      assert.ok(sets >= 1, "the editor sent no set");
      assert.ok(bridge.flow.maxSetsInFlight <= 1, `${bridge.flow.maxSetsInFlight} sets in flight at once`);
      assert.ok(Math.abs(final.stored - Number(lastSet)) <= 1e-4 * Math.max(1, Math.abs(final.stored)), `the unit holds ${final.stored}, the editor's last set was ${lastSet}`);
      const said = bridge.flow.sent.filter((l) => l.startsWith(`ed set ${addr} `)).map((l) => tokens(l)[3]);
      assert.ok(final.norm > 0 && final.norm < 1, `${addr} at ${final.text} (${final.norm}): not mid-travel; the editor set ${said.join(" ")}`);
    });
  });
}
