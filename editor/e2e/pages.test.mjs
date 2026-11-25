// SPDX-License-Identifier: GPL-3.0-or-later
// The pages: every address the unit describes has a control; the panels
// swap their controls when a variant changes (from the editor's hand and
// from the box's); DRUM's twelve PAD views, PAD 12's addresses, a pad's
// routes as a patch bay (and a full one); machine NONE and every machine;
// the MIXER's six strips, their setup, REVERB's TYPE and DELAY's SYNC; the
// Part tabs' names; the theme; folding and the SHOW chips; TAPE's source.
//
// INIT ALGO, MODAL, VA, TAPE and DRUM on Parts 1 to 5 (the box's keys).

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  bridge, centre, choice, describeMap, drawnAddrs, ENGINES, expectNotice, followPart, frames, noticesOn, onEngine, onMixer, page, partOf, pick, seen, setup, showCell, slider, sliderFollows,
  statusText, tokens, unit, unitPanels, until, wheel,
} from "./harness.mjs";

setup();

const pad2 = (n) => String(n).padStart(2, "0");

/** The DRUM page on pad `n`'s tab (0: KIT). */
async function onPad(n) {
  await onEngine(partOf("DRUM"), "DRUM");
  const tab = n === 0 ? page.locator(".padstrip .pst.kit") : page.locator(".padstrip .pst", { has: page.locator("b", { hasText: new RegExp(`^${pad2(n)}$`) }) });
  await tab.click();
  await until(`pad ${n}'s tab`, async () => (await tab.getAttribute("aria-selected")) === "true");
}

/** The params the unit's panels show now: every panel's always-shown ones and each variant in force. */
async function activeParams(schema) {
  const { variants } = await describeMap(schema);
  const now = await unitPanels();
  const out = new Set();
  for (const [k, addrs] of Object.entries(variants)) {
    const [name, v] = k.split(" ");
    if (v === "-" || now[name] === v) for (const a of addrs) out.add(a);
  }
  return out;
}

/** A pad route's addresses: the bay draws them as jacks and cables, not controls. */
const bayOnly = (a) => /_RT\d\.(SOURCE|DEST|AMOUNT)$/.test(a);

describe("every address has a control", () => {
  for (const e of ENGINES) {
    test(`D1: ${e}: each param of the panels in force is drawn (OTHER's included)`, async () => {
      const n = partOf(e);
      await onEngine(n, e);
      const want = await activeParams(e);
      const drawn = await drawnAddrs();
      if (e === "DRUM") for (let p = 1; p <= 12; p++) {
        await onPad(p);
        for (const a of await drawnAddrs()) drawn.add(a);
      }
      const mixer = new Set(Object.values((await describeMap("MIXER")).variants).flat());
      const missing = [...want].filter((a) => !drawn.has(a) && !bayOnly(a) && !mixer.has(a));
      assert.deepEqual(missing, [], `${e}: ${missing.length} described addresses no control draws`);
      if (e === "DRUM") await onPad(0);
    });
  }
});

describe("variants", () => {
  test("D2: FILTER's TYPE picked through every option: its controls come and go with it", async () => {
    await onEngine(1, "ALGO");
    const { options, variants } = await describeMap("ALGO");
    const was = await unit.get("FILTER.KIND");
    for (const [i, name] of Object.entries(options["FILTER.KIND"])) {
      await pick("FILTER.KIND", name);
      await until(`FILTER ${name} on the unit`, async () => (await unit.get("FILTER.KIND")).stored === Number(i));
      const kind = (await unitPanels()).FILTER;
      const own = new Set(variants[`FILTER ${kind}`]);
      const others = new Set(Object.entries(variants).filter(([k]) => k.startsWith("FILTER ") && k !== `FILTER ${kind}`).flatMap(([, a]) => a).filter((a) => !own.has(a)));
      await until(`${name}'s controls`, async () => {
        const drawn = await drawnAddrs();
        return [...own].every((a) => drawn.has(a)) && [...others].every((a) => !drawn.has(a));
      }).catch(async (err) => {
        const drawn = await drawnAddrs();
        throw new Error(`${err.message}: lacks ${[...own].filter((a) => !drawn.has(a))}; still shows ${[...others].filter((a) => drawn.has(a))}`);
      });
    }
    await unit.ok(`ed set FILTER.KIND #${was.stored}`);
  });

  test("D3: a variant changed on the box: the editor's controls swap within a few reads", async () => {
    await onEngine(1, "ALGO");
    const { variants } = await describeMap("ALGO");
    const has = async (k) => {
      const drawn = await drawnAddrs();
      return variants[`FILTER ${k}`].every((a) => drawn.has(a));
    };
    await unit.ok("ed set FILTER.KIND #3");
    await until("LADDER's controls", () => has("LADDER"), 3000);
    // The box's own hand: the encoder on TYPE's cell.
    await showCell("FILTER.KIND");
    const before = (await unit.get("FILTER.KIND")).stored;
    await unit.ok("turn 1 1");
    const now = await until("TYPE turned on the box", async () => {
      const v = await unit.get("FILTER.KIND");
      return v.stored !== before && v;
    }, 2000).catch(() => null);
    if (now) {
      const k = (await unitPanels()).FILTER;
      await until(`${k}'s controls`, () => has(k), 3000);
      assert.ok((await choice("FILTER.KIND").innerText()).includes(now.text));
    }
    await unit.ok("ed set FILTER.KIND #0");
    await until("CLEAN's controls", () => has("CLEAN"), 3000);
  });
});

describe("DRUM's pads", () => {
  test("D4: each of the twelve PAD tabs draws that pad's modules, reading the unit", async () => {
    for (let n = 1; n <= 12; n++) {
      await onPad(n);
      const drawn = [...(await drawnAddrs())];
      for (const blk of [`PAD${n}.`, `PAD${n}_FLT.`, `PAD${n}_AMP.`, `PAD${n}_ENV.`, `PAD${n}_LFO.`]) assert.ok(drawn.some((a) => a.startsWith(blk)), `pad ${n}: nothing of ${blk}`);
      const other = drawn.filter((a) => /^PAD\d+/.test(a) && !a.startsWith(`PAD${n}.`) && !a.startsWith(`PAD${n}_`));
      assert.deepEqual(other, [], `pad ${n}'s view draws another pad's controls`);
      await sliderFollows(`PAD${n}.LEVEL`);
      await until("its screens painted", () =>
        page.$$eval("chimera-screen", (els) => els.every((e) => e.hasAttribute("data-painted") || e.hidden || e.hasAttribute("data-error"))));
      assert.equal(await page.locator("chimera-screen[data-error]").count(), 0);
    }
    await onPad(0);
  });

  test("D5: PAD 12's knob moves PAD 12 on the unit, and no other pad", async () => {
    await onPad(12);
    const others = { 1: await unit.get("PAD1.PAN"), 11: await unit.get("PAD11.PAN") };
    const was = await unit.get("PAD12.PAN");
    await wheel(slider("PAD12.PAN"), was.norm > 0.5 ? -3 : 3);
    await until("PAD12.PAN to move", async () => (await unit.get("PAD12.PAN")).stored !== was.stored);
    await sliderFollows("PAD12.PAN");
    assert.equal((await unit.get("PAD1.PAN")).stored, others[1].stored);
    assert.equal((await unit.get("PAD11.PAN")).stored, others[11].stored);
    await onPad(0);
  });

  /** Pad `n`'s bay (its ROUTE 1–4 module's). */
  const padBay = () => page.locator(".sec", { has: page.locator("h2", { hasText: "ROUTE 1–4" }) }).locator(".bay");

  /** A cable patched in the pad's bay from source `s` to dest `d`, by the mouse. */
  async function patch(s, d) {
    const bay = padBay();
    const src = bay.locator(".jcol.srcs > *", { hasText: new RegExp(`^${s}$`) }).first();
    const dst = bay.locator(".jcol.dsts > *", { hasText: new RegExp(`^${d}$`) }).first();
    await src.scrollIntoViewIfNeeded();
    const [sx, sy] = await centre(src);
    const [dx, dy] = await centre(dst);
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(dx, dy, { steps: 5 });
    await page.mouse.up();
  }

  const routeOf = async (n, k) => ({ src: (await unit.get(`PAD${n}_RT${k}.SOURCE`)).text, dst: (await unit.get(`PAD${n}_RT${k}.DEST`)).text, amount: (await unit.get(`PAD${n}_RT${k}.AMOUNT`)).stored });

  test("D6: a pad's routes as a bay: patched, its amount moved, unpatched", async () => {
    await onPad(2);
    for (let k = 1; k <= 4; k++) assert.equal((await routeOf(2, k)).amount, 0, `PAD2 route ${k} starts unused`);
    await patch("LFO", "RESO");
    // Its source and destination land before its amount: no moment on the route's old pair.
    const r = await until("route 1 patched on the unit", async () => {
      const x = await routeOf(2, 1);
      if (x.amount !== 0) assert.deepEqual([x.src, x.dst], ["LFO", "RESO"], "the amount landed on the route's old pair");
      return x.amount !== 0 && x;
    }, 5000, 2);
    const att = padBay().locator(".att").first();
    await att.waitFor();
    const [ax, ay] = await centre(att);
    await page.mouse.move(ax, ay);
    await page.mouse.down();
    await frames();
    await page.mouse.move(ax, ay - 60, { steps: 6 });
    await page.mouse.up();
    await until("the amount moved", async () => (await routeOf(2, 1)).amount !== r.amount);
    await until("the cable reads the unit's amount", async () => (await att.getAttribute("aria-valuetext")) !== null);
    await att.dblclick();
    await until("unpatched: amount 0", async () => (await routeOf(2, 1)).amount === 0);
    await att.waitFor({ state: "detached" });
    await onPad(0);
  });

  test("D7: a pad with all four routes in use: a fifth patch is refused, and the page says so", async () => {
    await onPad(3);
    const pairs = [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]];
    for (let k = 1; k <= 4; k++) {
      await unit.ok(`ed set PAD3_RT${k}.SOURCE #${pairs[k - 1][0]}`);
      await unit.ok(`ed set PAD3_RT${k}.DEST #${pairs[k - 1][1]}`);
      await unit.ok(`ed set PAD3_RT${k}.AMOUNT 40`);
    }
    await until("four cables", async () => (await padBay().locator(".att").count()) === 4, 5000);
    const before = [];
    for (let k = 1; k <= 4; k++) before.push(await routeOf(3, k));
    expectNotice(/^PAD 03'S 4 ROUTES ARE ALL IN USE: UNPATCH ONE FIRST$/);
    bridge.flow.reset();
    await patch("LFO 3", "VOLUME");
    await until("the refusal said", async () => (await noticesOn()).some((n) => n.startsWith("PAD 03'S 4 ROUTES")), 3000);
    assert.equal(await padBay().locator(".att").count(), 4, "a fifth cable drawn");
    assert.deepEqual(bridge.flow.sent.filter((l) => l.startsWith("ed set PAD3_RT")), []);
    for (let k = 1; k <= 4; k++) assert.deepEqual(await routeOf(3, k), before[k - 1]);
    await seen();
    for (let k = 1; k <= 4; k++) await unit.ok(`ed set PAD3_RT${k}.AMOUNT 0`);
    await onPad(0);
  });

  test("D8: machine NONE: the strip says it, no machine knob is drawn, the screens paint", async () => {
    await onPad(4);
    const was = await unit.get("PAD4.MACHINE");
    await pick("PAD4.MACHINE", "NONE");
    await until("NONE on the unit", async () => (await unit.get("PAD4.MACHINE")).text === "NONE");
    const strip = page.locator(".padstrip .pst", { has: page.locator("b", { hasText: /^04$/ }) });
    await until("the strip says NONE", async () => (await strip.innerText()).includes("NONE"));
    await until("no machine knob", async () => [...(await drawnAddrs())].filter((a) => /^PAD4\.KNOB_/.test(a)).length === 0);
    assert.equal(await page.locator("chimera-screen[data-error]").count(), 0);
    await unit.ok(`ed set PAD4.MACHINE #${was.stored}`);
    await onPad(0);
  });

  test("D9: every machine on PAD 1: the MACHINE module's knobs are the machine's", async () => {
    await onPad(1);
    const { options, variants } = await describeMap("DRUM");
    const was = await unit.get("PAD1.MACHINE");
    for (const [i, name] of Object.entries(options["PAD1.MACHINE"])) {
      await pick("PAD1.MACHINE", name);
      await until(`${name} on the unit`, async () => (await unit.get("PAD1.MACHINE")).stored === Number(i));
      const v = (await unitPanels()).PAD1_MCH;
      const want = (variants[`PAD1_MCH ${v}`] ?? []).filter((a) => /^PAD1\.KNOB_/.test(a)).sort();
      await until(`${name}'s knobs`, async () => JSON.stringify([...(await drawnAddrs())].filter((a) => /^PAD1\.KNOB_/.test(a)).sort()) === JSON.stringify(want)).catch(async (e) => {
        throw new Error(`${e.message}: want ${want}, drawn ${[...(await drawnAddrs())].filter((a) => /^PAD1\.KNOB_/.test(a))}`);
      });
    }
    await unit.ok(`ed set PAD1.MACHINE #${was.stored}`);
    await onPad(0);
  });
});

describe("MIXER", () => {
  test("D10: each of the six strips' faders moves its Part's level", async () => {
    await onMixer();
    for (let n = 1; n <= 6; n++) {
      const a = `PART${n}.LEVEL`;
      const f = page.locator(`[data-strip="PART${n}"] [data-addr="${a}"][role="slider"]`);
      const was = await sliderFollows(a);
      await wheel(f, was.norm > 0.5 ? -4 : 4);
      await until(`${a} to move`, async () => (await unit.get(a)).stored !== was.stored);
      await sliderFollows(a);
    }
  });

  test("D11: a strip's SETUP opens and its controls set the Part", async () => {
    await onMixer();
    const strip = page.locator('[data-strip="PART2"]');
    await strip.locator("details.setup summary").click();
    const bend = strip.locator('details.setup [data-addr="PART2.BEND"][role="slider"]');
    await bend.waitFor();
    const was = await sliderFollows("PART2.BEND");
    await wheel(bend, was.norm > 0.5 ? -2 : 2);
    await until("PART2.BEND to move", async () => (await unit.get("PART2.BEND")).stored !== was.stored);
    await sliderFollows("PART2.BEND");
    await pick("PART2.MODE", "MONO", page);
    await until("PART2.MODE MONO", async () => (await unit.get("PART2.MODE")).text === "MONO");
    await pick("PART2.MODE", "POLY", page);
    await until("PART2.MODE POLY", async () => (await unit.get("PART2.MODE")).text === "POLY");
  });

  test("D12: REVERB's TYPE swaps its panel; DELAY's SYNC swaps TIME for the note", async () => {
    await onMixer();
    await page.locator(".fxtab", { hasText: "REVERB" }).click();
    const { options } = await describeMap("MIXER");
    for (const [i, name] of Object.entries(options["REVERB.TYPE"])) {
      await pick("REVERB.TYPE", name);
      await until(`REVERB ${name}`, async () => (await unit.get("REVERB.TYPE")).stored === Number(i));
      await until("its panel", async () => (await unitPanels()).REVERB !== undefined);
    }
    await unit.ok("ed set REVERB.TYPE #0");
    await page.locator(".fxtab", { hasText: "DELAY" }).click();
    await pick("DELAY.SYNC", options["DELAY.SYNC"]["1"]);
    await until("DELAY SYNC", async () => (await unitPanels()).DELAY === "SYNC");
    await until("the note's control", async () => (await slider("DELAY.NOTE").count()) === 1 && (await slider("DELAY.TIME").count()) === 0);
    await pick("DELAY.SYNC", options["DELAY.SYNC"]["0"]);
    await until("DELAY FREE", async () => (await unitPanels()).DELAY === "FREE");
    await until("TIME's control", async () => (await slider("DELAY.TIME").count()) === 1 && (await slider("DELAY.NOTE").count()) === 0);
  });
});

describe("the top bar", () => {
  test("D13: each Part's tab names the engine the unit says it has", async () => {
    await onEngine(1, "ALGO");
    const engines = {};
    for (const l of (await unit.since()).lines) {
      const w = tokens(l);
      if (w[0] === "engine") engines[w[1]] = w[2];
    }
    for (let n = 1; n <= 6; n++) {
      const tab = page.locator(".ptop .tab", { hasText: `P${n}` });
      await until(`P${n}'s name`, async () => (await tab.innerText()).trim().endsWith(engines[n]));
    }
  });

  test("D14: NIGHT and DAY: the page and its screens recoloured, the choice kept over a reload", async () => {
    await onEngine(1, "ALGO");
    const theme = () => page.locator(".ui.page").getAttribute("data-theme");
    const bg = () => page.locator(".ui.page").evaluate((e) => getComputedStyle(e).backgroundColor);
    const to = (await theme()) === "night" ? "DAY" : "NIGHT";
    const before = await bg();
    await page.locator(".themesw button", { hasText: to }).click();
    await until("the theme switched", async () => (await theme()) === to.toLowerCase());
    // The page's tokens recolour it; the unit's screens keep the unit's own pixels.
    await until("the page recoloured", async () => (await bg()) !== before, 3000);
    await page.reload();
    await page.getByRole("button", { name: "CONNECT SIMULATOR" }).click();
    await followPart(1, "ALGO");
    assert.equal(await theme(), to.toLowerCase());
  });

  test("D15: a fold, FOLD ALL, OPEN ALL and a SHOW chip: modules hide and come back with their values", async () => {
    await onEngine(1, "ALGO");
    const knob = page.locator('[data-addr="FILTER.CUTOFF"][role="slider"]').first();
    const was = await knob.getAttribute("aria-valuetext");
    const title = (await page.locator(".sec", { has: knob }).first().locator(".handle h2").innerText()).split("\n")[0].trim();
    const handle = page.locator(".sec .handle", { has: page.locator("h2", { hasText: title }) }).first();
    await handle.click();
    await until("folded", async () => (await knob.count()) === 0);
    await handle.click();
    await until("open", async () => (await knob.count()) === 1);
    await page.getByRole("button", { name: "FOLD ALL" }).click();
    await until("all folded", async () => (await page.locator('[role="slider"]').count()) === 0);
    await page.getByRole("button", { name: "OPEN ALL" }).click();
    await until("all open", async () => (await knob.count()) === 1);
    assert.equal(await knob.getAttribute("aria-valuetext"), was);
    const chip = page.locator(".chips .chip[aria-pressed]").first();
    const n = await page.locator(".sec").count();
    await chip.click();
    await until("a chip's modules hidden", async () => (await page.locator(".sec").count()) < n);
    await chip.click();
    await until("back", async () => (await page.locator(".sec").count()) === n);
    assert.equal(await knob.getAttribute("aria-valuetext"), was);
  });

  test("D16, G9: TAPE with no sample: SOURCE shows the unit's own text, no error", async () => {
    await onEngine(partOf("TAPE"), "TAPE");
    const said = (await unit.since()).lines.map(tokens).find((w) => w[0] === "source");
    assert.ok(said, "the unit says no source line");
    const cell = page.locator(".c.ro", { hasText: "SOURCE" }).locator(".v");
    await until("SOURCE's text", async () => (await cell.innerText()).trim() === said[1]);
    assert.equal(await page.locator("chimera-screen[data-error]").count(), 0);
    void statusText;
  });
});
