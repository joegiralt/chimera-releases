// SPDX-License-Identifier: GPL-3.0-or-later
// The hands on the controls: a menu (open, pick, Escape), toggles of two and
// three, a selector, a choice turned past either end, a knob dragged, the
// arrow keys, a double click's reset (and describe's defaults against
// INIT's), a hand held while the box changes Part, an octave knob; and the
// Part's MOD bay: every source, a destination the unit adds, the matrix
// full, the amounts' ends. Part 1 ALGO, Part 2 MODAL (INIT, the box's keys).
//
// WordRow is drawn by no page yet (the component gallery only): no test here.

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { describeAll } from "./contract.mjs";
import {
  bridge, cableText, centre, choice, describedParams, drag, expectNotice, followPart, loadInit, frames, noticesOn, onEngine, onMixer, page, pick, seen, setup, settledRoute, slider, sliderFollows,
  tokens, unit, unitRoutes, until, wheel,
} from "./harness.mjs";

setup({ engines: ["ALGO", "MODAL"] });

/** The first drawn control of class `cls` (`tgc`, `slc`) whose options number `n` (any, unset). */
async function firstChoice(cls, n) {
  const els = page.locator(`.${cls}[data-choice]`);
  for (let i = 0; i < (await els.count()); i++) {
    const el = els.nth(i);
    if (n === undefined || (await el.getByRole("radio").count()) === n) return { el, addr: await el.getAttribute("data-choice") };
  }
  return null;
}

describe("choices", () => {
  test("E1: a menu: open, the last option picked; Escape shuts it with nothing picked", async () => {
    await onEngine(1, "ALGO");
    const c = choice("OP_A.WAVE");
    await c.locator('[aria-haspopup="listbox"]').first().click();
    const opts = c.getByRole("option");
    const last = (await opts.last().innerText()).trim();
    await opts.last().click();
    await until(`OP_A.WAVE ${last} on the unit`, async () => (await unit.get("OP_A.WAVE")).text === last);
    await until("the menu shut and showing it", async () => (await c.getByRole("listbox").count()) === 0 && (await c.innerText()).includes(last));
    await c.locator('[aria-haspopup="listbox"]').first().click();
    await c.getByRole("listbox").waitFor();
    // The focus where the click left it, on the menu's button.
    await page.keyboard.press("Escape");
    await until("shut by Escape", async () => (await c.getByRole("listbox").count()) === 0);
    await frames();
    assert.equal((await unit.get("OP_A.WAVE")).text, last);
    await pick("OP_A.WAVE", "W1");
    await until("W1 again", async () => (await unit.get("OP_A.WAVE")).text === "W1");
  });

  test("E2: toggles of two and of three: each position clicked, the unit's index followed", async () => {
    await onMixer();
    await page.locator('[data-strip="PART2"] details.setup summary').click();
    for (const n of [2, 3]) {
      const t = await firstChoice("tgc", n);
      assert.ok(t, `no toggle of ${n} drawn`);
      const was = await unit.get(t.addr);
      const radios = t.el.getByRole("radio");
      for (let i = 0; i < n; i++) {
        const name = (await radios.nth(i).innerText()).trim();
        await radios.nth(i).click();
        await until(`${t.addr} at ${name}`, async () => (await unit.get(t.addr)).text === name);
        await until("the toggle checked there", async () => (await radios.nth(i).getAttribute("aria-checked")) === "true");
      }
      await unit.ok(`ed set ${t.addr} #${was.stored}`);
    }
  });

  test("E3: a selector: every option clicked, the unit's index followed", async () => {
    for (const [n, e] of [[1, "ALGO"], [2, "MODAL"]]) {
      await onEngine(n, e);
      const s = await firstChoice("slc");
      if (!s) continue;
      const was = await unit.get(s.addr);
      const radios = s.el.getByRole("radio");
      for (let i = 0; i < (await radios.count()); i++) {
        const name = (await radios.nth(i).innerText()).trim();
        await radios.nth(i).click();
        await until(`${s.addr} at ${name}`, async () => (await unit.get(s.addr)).text === name);
      }
      await unit.ok(`ed set ${s.addr} #${was.stored}`);
      return;
    }
    assert.fail("no selector drawn on ALGO or MODAL");
  });

  test("E4: a choice turned past either end stays in its list; the unit never says ERR", async () => {
    await onEngine(1, "ALGO");
    const s = (await firstChoice("slc")) ?? (await onEngine(2, "MODAL"), await firstChoice("slc"));
    const n = await s.el.getByRole("radio").count();
    const knob = s.el.locator("[data-addr]").first();
    const from = bridge.flow.sent.length;
    await wheel(knob, n + 3);
    await until("at its last", async () => (await unit.get(s.addr)).text === (await s.el.getByRole("radio").last().innerText()).trim(), 5000).catch(async (e) => {
      const got = bridge.flow.got.slice(-40).map((g) => `${g.line} => ${g.lines.join(" | ")}`);
      throw new Error(`${e.message}: ${s.addr} unit ${JSON.stringify(await unit.get(s.addr))}, last ${(await s.el.getByRole("radio").last().innerText()).trim()}, n ${n}\nsent ${bridge.flow.sent.slice(from).join(" ; ")}\n${got.join("\n")}`);
    });
    await wheel(knob, -(n + 3));
    await until("at its first", async () => (await unit.get(s.addr)).text === (await s.el.getByRole("radio").first().innerText()).trim(), 5000);
    const sent = bridge.flow.sent.slice(from).filter((l) => l.startsWith(`ed set ${s.addr} `)).map((l) => Number(tokens(l)[3].slice(1)));
    assert.ok(sent.every((i) => i >= 0 && i < n), `sent ${sent}`);
    assert.ok(!bridge.flow.got.some((g) => g.line.startsWith(`ed set ${s.addr}`) && g.lines.some((l) => l.startsWith("ERR"))));
  });
});

describe("knobs", () => {
  /** A slider the page draws for a param `ok` picks (describe's words), and its param. */
  async function drawn(ok) {
    for (const p of await describedParams("ALGO")) if (ok(p) && (await slider(p.addr).count())) return p;
    throw new Error("no such slider drawn");
  }

  test("E5: a knob dragged 100 px up, then back: the unit follows the drag's arithmetic", async () => {
    await onEngine(1, "ALGO");
    const p = await drawn((q) => q.kind === "cont" && q.scale === "lin" && q.addr === "FILTER.RESO");
    await unit.ok(`ed set ${p.addr} ${p.min + (p.max - p.min) * 0.2}`);
    const was = await sliderFollows(p.addr);
    await drag(slider(p.addr), { dy: -60 });
    const up = await until("moved up", async () => {
      const v = await unit.get(p.addr);
      return v.norm > was.norm + 0.1 && v;
    });
    // A knob's whole range is 150 px of travel.
    await until("the drag landed", async () => Math.abs((await unit.get(p.addr)).norm - (was.norm + 60 / 150)) < 0.03, 3000).catch(async () => {
      throw new Error(`from ${was.norm} by 60 px: the unit at ${(await unit.get(p.addr)).norm}, want ${was.norm + 0.4}`);
    });
    await sliderFollows(p.addr);
    await drag(slider(p.addr), { dy: 60 });
    await until("back", async () => Math.abs((await unit.get(p.addr)).norm - was.norm) < 0.03, 3000);
    await sliderFollows(p.addr);
    void up;
  });

  test("E6: the arrow keys: up three, left one, two steps up on the unit", async () => {
    await onEngine(1, "ALGO");
    const p = await drawn((q) => q.kind === "stepped" && q.max - q.min >= 6);
    await unit.ok(`ed set ${p.addr} ${p.min + p.step * 2}`);
    const was = await sliderFollows(p.addr);
    const k = slider(p.addr);
    await k.focus();
    for (const key of ["ArrowUp", "ArrowUp", "ArrowUp", "ArrowLeft"]) await page.keyboard.press(key);
    await until(`${p.addr} two steps up`, async () => Math.abs((await unit.get(p.addr)).stored - (was.stored + 2 * p.step)) < 1e-6, 3000);
    await sliderFollows(p.addr);
  });

  test("E7: a double click resets cont, stepped, octave and choice controls to describe's default", async () => {
    await onEngine(1, "ALGO");
    const picks = [
      await drawn((q) => q.kind === "cont" && q.scale === "lin" && q.def !== q.max),
      await drawn((q) => q.kind === "stepped" && q.def !== q.max),
      await drawn((q) => q.scale === "oct"),
    ];
    for (const p of picks) {
      await unit.ok(`ed set ${p.addr} ${p.max}`);
      await sliderFollows(p.addr);
      await slider(p.addr).dblclick();
      await until(`${p.addr} at its default ${p.def}`, async () => Math.abs((await unit.get(p.addr)).stored - p.def) <= Math.max(p.step / 2, 1e-4 * Math.abs(p.def)), 3000);
      await sliderFollows(p.addr);
    }
    // A choice turned like a knob (a selector's), reset the same way.
    const s = await firstChoice("slc");
    if (s) {
      const p = (await describedParams("ALGO")).find((q) => q.addr === s.addr);
      await unit.ok(`ed set ${s.addr} #${p.max}`);
      await until("off its default", async () => (await unit.get(s.addr)).stored === p.max);
      await s.el.locator("[data-addr]").first().dblclick();
      await until(`${s.addr} at its default`, async () => (await unit.get(s.addr)).stored === p.def, 3000);
    }
  });

  test("E8: describe's defaults are a fresh INIT's values (what a double click resets to is the INIT Sound)", async () => {
    // A fresh INIT ALGO on Part 6 (clean: this file never edits it).
    await loadInit(6, "ALGO");
    await unit.ok("ed part 6");
    const vals = {};
    const panels = {};
    for (const l of await unit.ask("ed since 0")) {
      const w = tokens(l);
      if (w[0] === "val") vals[w[1]] = Number(w[3]);
      if (w[0] === "panel") panels[w[1]] = w[2];
    }
    await unit.ok("ed part 1");
    const drift = new Set();
    for (const p of await describedParams("ALGO")) {
      const v = vals[p.addr];
      // The panels in force only: a variant's default is its own.
      if (v === undefined || (p.panel.variant !== "-" && panels[p.panel.name] !== p.panel.variant)) continue;
      if (Math.abs(v - p.def) > Math.max(p.step / 2, 1e-4 * Math.abs(p.def))) drift.add(`${p.addr} default ${p.def}, INIT ${v}`);
    }
    await followPart(1, "ALGO");
    // describe's defaults are INIT's (ADR 0337): a double click resets a param to the INIT Sound's value.
    assert.deepEqual([...drift], [], "params whose describe default is not INIT ALGO's");
  });

  test("E9: a hand held while the box takes another Part: nothing more sent for the old Part", async () => {
    await onEngine(1, "ALGO");
    const p = await drawn((q) => q.addr === "FILTER.RESO");
    await unit.ok(`ed set ${p.addr} 0.2`);
    await sliderFollows(p.addr);
    const k = slider(p.addr);
    await k.scrollIntoViewIfNeeded();
    const [x, y] = await centre(k);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await frames();
    await page.mouse.move(x, y - 15, { steps: 3 });
    // Every set of the drag so far landed: none in flight, the unit on the last one sent (a want may still wait a beat).
    await until("the drag's sets landed", async () => {
      const last = bridge.flow.sent.findLast((l) => l.startsWith(`ed set ${p.addr} `));
      return !!last && !bridge.flow.setsInFlight && Math.abs((await unit.get(p.addr)).stored - Number(tokens(last)[3])) < 1e-4;
    });
    await frames();
    await until("nothing more of it", () => !bridge.flow.setsInFlight);
    const part1 = (await unit.get(p.addr)).stored;
    await unit.ok("key B2");
    await until("the editor on Part 2", async () => (await page.locator(".unit").innerText()).includes("PART 2"), 5000);
    const at = bridge.flow.sent.length;
    await page.mouse.move(x, y - 60, { steps: 6 });
    await frames();
    await frames();
    await page.mouse.up();
    assert.deepEqual(bridge.flow.sent.slice(at).filter((l) => l.startsWith("ed set ")), [], "a set went out after the Part changed");
    await unit.ok("key B1");
    await followPart(1, "ALGO");
    assert.equal((await unit.get(p.addr)).stored, part1);
  });

  test("E10: an octave knob turned ten notches: the unit's value on the octave curve", async () => {
    await onEngine(1, "ALGO");
    const p = await drawn((q) => q.scale === "oct");
    await unit.ok(`ed set ${p.addr} ${p.min * 4}`);
    const was = await sliderFollows(p.addr);
    await wheel(slider(p.addr), 10);
    const now = await until(`${p.addr} up`, async () => {
      const v = await unit.get(p.addr);
      return v.norm > was.norm && v;
    });
    await sliderFollows(p.addr);
    const curve = p.min * 2 ** (now.norm * Math.log2(p.max / p.min));
    assert.ok(Math.abs(curve - now.stored) / now.stored < 0.02, `${now.stored} at ${now.norm}: the curve says ${curve}`);
  });
});

describe("the Part's MOD bay", () => {
  const bay = () => page.locator(".bay").first();
  async function patchTo(src, dstIndex = 0) {
    const s = bay().locator(".jcol.srcs > *", { hasText: new RegExp(`^${src}$`) }).first();
    const d = bay().locator(".jcol.dsts > *").nth(dstIndex);
    await s.scrollIntoViewIfNeeded();
    const [sx, sy] = await centre(s);
    const [dx, dy] = await centre(d);
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(dx, dy, { steps: 5 });
    await page.mouse.up();
  }

  test("F1: every source patched to one destination and unpatched: the unit's routes follow", async () => {
    await onEngine(1, "ALGO");
    const { pages } = await describeAll(unit, "MTX-ALGO");
    const srcs = pages[0].lines.map(tokens).filter((w) => w[0] === "src");
    const dst = tokens(pages[0].lines.find((l) => l.startsWith("col ")))[2];
    const dstLabel = (await bay().locator(".jcol.dsts > *").first().innerText()).trim();
    const was = await unitRoutes();
    for (const [, word, label] of srcs) {
      const cell = `${word}:${dst}`;
      if (was[cell]) continue;
      await patchTo(label);
      await until(`${cell} on the unit`, async () => !!(await unitRoutes())[cell], 5000);
      const att = bay().locator(`.att[aria-label="${label} to ${dstLabel}"]`);
      await att.waitFor();
      await att.dblclick();
      await until(`${cell} gone`, async () => !(await unitRoutes())[cell], 5000);
      await att.waitFor({ state: "detached" });
    }
  });

  test("F2, F4: a route the unit makes to a destination off the fixed columns grows a column; ±127 reads ±100", async () => {
    await onEngine(1, "ALGO");
    const cols = () => bay().locator(".jcol.dsts > *").count();
    const n = await cols();
    await unit.ok("ed route LFO2:OP_A.LEVEL 127");
    await until("a column for OP_A.LEVEL", async () => (await cols()) === n + 1);
    const att = bay().locator(".att").filter({ has: page.locator("xpath=.") });
    void att;
    await settledRoute("LFO2:OP_A.LEVEL");
    const cable = bay().locator('.att[aria-label^="LFO2 to "]').first();
    await until("+100 on the cable", async () => (await cable.getAttribute("aria-valuetext")) === cableText(127));
    await unit.ok("ed route LFO2:OP_A.LEVEL -127");
    await until("the unit at -127", async () => (await settledRoute("LFO2:OP_A.LEVEL")).amount === -127, 10000);
    await until("-100 on the cable", async () => (await cable.getAttribute("aria-valuetext")) === "-100");
    await unit.ok("ed route LFO2:OP_A.LEVEL off");
    await until("the column gone", async () => (await cols()) === n);
  });

  test("F3: the matrix full: the unit's refusal is said, and no cable drawn for it", async (t) => {
    await onEngine(1, "ALGO");
    const made = [];
    // The params a route may take (describe's flags: `d`), off the matrix's fixed columns.
    const dests = (await describedParams("ALGO")).filter((p) => (p.words[9] ?? "").includes("d") && !p.addr.startsWith("FILTER.") && !p.addr.startsWith("OUT.")).map((p) => p.addr);
    let full = null;
    expectNotice(/^THE UNIT REFUSED: \S+: MATRIX FULL$/);
    expectNotice(/^THE UNIT REFUSED (AT LEAST )?\d+ MORE EDITS$/);
    for (const d of [...new Set(dests)]) {
      const got = await unit.ask(`ed route ENV2:${d} 30`);
      if (!got.at(-1).startsWith("OK")) {
        full = got.at(-1);
        break;
      }
      made.push(`ENV2:${d}`);
      if (made.length > 40) break;
    }
    try {
      if (!full) {
        // Routes are queued: the box takes them at its turn, and refuses those past its limit in `since`.
        await until("the routes landed", async () => Object.keys(await unitRoutes()).length >= 4);
      }
      const routes = await unitRoutes();
      const kept = Object.keys(routes).length;
      const dropped = made.filter((c) => !routes[c]).map((c) => c.slice("ENV2:".length));
      assert.ok(dropped.length > 0, `${made.length} routes asked, all kept: the matrix never filled`);
      const said = async () => (await noticesOn()).join("\n");
      // A Part's first drop named (as a set's refusal is), the rest counted: `refused more <n>`.
      await until("the dropped routes' refusals said", async () => {
        const n = await noticesOn();
        const named = n.filter((x) => x.endsWith(": MATRIX FULL"));
        const more = n.some((x) => / MORE EDITS$/.test(x));
        return named.length > 0 && named.every((x) => dropped.some((d) => x === `THE UNIT REFUSED: ${d}: MATRIX FULL`)) && (dropped.length === 1 || more);
      }, 5000).catch(async () => {
        throw new Error(`dropped ${dropped.join(" ")}; the editor said: ${await said()}`);
      });
      const cables = () => bay().locator(".att").count();
      await until("the editor draws the unit's routes", async () => (await cables()) === kept, 5000).catch(async () => {
        throw new Error(`the unit has ${kept} routes, the editor ${await cables()} cables`);
      });
      // One more from the editor's hand, to a fixed column (VCA): the box takes routes to its fixed
      // columns past the limit (and a hand can patch to no other kind of column a full matrix lacks).
      await patchTo("VELO", 2);
      await until("the route made", async () => !!(await unitRoutes())["VEL:OUT.VCA"], 5000);
      await until("the editor still draws only the unit's", async () => (await cables()) === Object.keys(await unitRoutes()).length, 5000);
      made.push("VEL:OUT.VCA");
      t.diagnostic(`${made.length} routes asked, the unit kept ${kept} and refused ${dropped.length}${full ? `, then said ${full}` : ""}`);
    } finally {
      for (const c of made) await unit.ask(`ed route ${c} off`);
    }
    await until("the routes gone", async () => !Object.keys(await unitRoutes()).some((c) => c.startsWith("ENV2:")), 10000);
  });
});
