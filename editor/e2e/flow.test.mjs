// SPDX-License-Identifier: GPL-3.0-or-later
// The edits' window and the unit's answers, worse than the simulator gives
// them (the bridge's faults): a lost answer, one lost twice, `ERR busy`, a
// refusal at its control, more refusals than `ed since` names, an `ERR` at
// set time, a lost `since`, an answer in pages, one too large, a set and a
// route sharing the window, an unreadable line, a full notice list, and the
// generation running backwards. Part 1 ALGO throughout (INIT, loaded through
// the box's keys).
//
// The test client never asks `ed since` while the editor follows here: an
// answer to anyone clears the unit's refusals and moves its baseline.

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { describeAll } from "./contract.mjs";
import {
  bridge, centre, choice, connect, connectSays, expectNotice, firstKnob, frames, noticesOn, onEngine, page, pick, polled, seen, setup, sliderFollows, tokens, unit, unitRoutes, until, wheel,
} from "./harness.mjs";

setup({ engines: ["ALGO"] });

const setsOf = (addr, from = 0) => bridge.flow.sent.slice(from).filter((l) => l.startsWith(`ed set ${addr} `));

/** `addr`'s option number `i`'s name, from describe. */
async function optionName(schema, addr, i) {
  const { pages } = await describeAll(unit, schema);
  const opt = pages.flatMap((pg) => pg.lines).map(tokens).find((w) => w[0] === "opt" && w[1] === addr && Number(w[2]) === i);
  return opt?.[3];
}

/** Every operator's WAVE back to W1 and the algorithms to where INIT has them, set by the test client. */
async function resetOps(algs) {
  for (const o of "ABCDEF") await unit.ok(`ed set OP_${o}.WAVE #0`);
  for (const [a, v] of Object.entries(algs)) await unit.ok(`ed set ${a} #${v}`);
  await until("the operators back to W1", async () => {
    for (const o of "ABCDEF") if ((await unit.get(`OP_${o}.WAVE`)).stored !== 0) return false;
    return true;
  });
}

describe("lost answers", () => {
  test("C1: a set's answer lost once: the set goes again, the knob ends on the unit's value, the window still opens", async () => {
    await onEngine(1, "ALGO");
    const { addr, knob } = await firstKnob("ALGO");
    const was = await unit.get(addr);
    const lost = bridge.flow.rule({ match: (l) => l.startsWith(`ed set ${addr} `), act: "drop" });
    const from = bridge.flow.sent.length;
    await wheel(knob, was.norm > 0.5 ? -1 : 1);
    await until("the set sent again after its answer was lost", () => setsOf(addr, from).length >= 2, 5000);
    assert.equal(lost.hits, 1);
    const [first, again] = setsOf(addr, from);
    assert.equal(again, first, "the set sent again is the same set");
    const now = await sliderFollows(addr);
    assert.notEqual(now.stored, was.stored);
    assert.ok(Math.abs(now.stored - Number(tokens(first)[3])) < 1e-4, `the unit holds ${now.stored}, the editor set ${tokens(first)[3]}`);
    // Not wedged: the next notch goes out and lands.
    const n = setsOf(addr).length;
    await wheel(knob, was.norm > 0.5 ? -1 : 1);
    await until("the next notch's set", () => setsOf(addr).length > n);
    await until(`${addr} to move again`, async () => (await unit.get(addr)).stored !== now.stored);
    await sliderFollows(addr);
  });

  test("C2: a set's answer lost twice: given up with a notice, and the next want still goes", async () => {
    await onEngine(1, "ALGO");
    const { addr, knob } = await firstKnob("ALGO");
    const was = await unit.get(addr);
    expectNotice(/^THE UNIT DID NOT ANSWER .*SENT TWICE: GIVEN UP/);
    bridge.flow.rule({ match: (l) => l.startsWith(`ed set ${addr} `), act: "drop", times: 2 });
    await wheel(knob, was.norm > 0.5 ? -1 : 1);
    await until("the NoAnswer notice", async () => (await noticesOn()).some((n) => n.startsWith("THE UNIT DID NOT ANSWER")), 5000);
    // The unit took the line (only its answer was lost): the editor shows what it holds.
    const held = await sliderFollows(addr);
    const n = setsOf(addr).length;
    await wheel(knob, held.norm > 0.5 ? -1 : 1);
    await until("the next want sent", () => setsOf(addr).length > n);
    await until(`${addr} to move on the unit`, async () => (await unit.get(addr)).stored !== held.stored);
    await sliderFollows(addr);
  });

  test("C7: a lost `since` answer: the next is whole, and the values still equal the unit's", async () => {
    await onEngine(1, "ALGO");
    const { addr } = await firstKnob("ALGO");
    const lost = bridge.flow.rule({ match: /^ed since /, act: "drop" });
    const from = bridge.flow.got.length;
    await until("a since answer lost", () => lost.hits === 1);
    // The editor asks again with its last number; the unit has moved on: a whole answer, its empty line first.
    await until("a whole answer after the lost one", () => bridge.flow.got.slice(from).some((g) => g.line.startsWith("ed since") && g.lines[0] === ""), 5000);
    await unit.ok(`ed set ${addr} ${(await unit.get(addr)).norm > 0.5 ? 0.25 : 0.75}`);
    await sliderFollows(addr);
  });
});

describe("ERR busy", () => {
  test("C3: `ERR busy` on a set: the editor sends the latest value again, later each time, until the unit takes it", async () => {
    await onEngine(1, "ALGO");
    const { addr, knob } = await firstKnob("ALGO");
    const was = await unit.get(addr);
    const busy = bridge.flow.rule({ match: (l) => l.startsWith(`ed set ${addr} `), act: "answer", lines: ["ERR busy"], times: 3 });
    const from = bridge.flow.sent.length;
    await wheel(knob, was.norm > 0.5 ? -1 : 1);
    const now = await until(`${addr} to land after three busy answers`, async () => {
      const v = await unit.get(addr);
      return v.stored !== was.stored && v;
    }, 10000).catch((e) => {
      throw new Error(`${e.message}; the editor sent ${setsOf(addr, from).join(", ")}; busy answered ${busy.hits}`);
    });
    assert.equal(busy.hits, 3);
    const sets = setsOf(addr, from);
    assert.equal(sets.length, 4, `sets: ${sets.join(", ")}`);
    assert.ok(sets.every((s) => s === sets[0]), "each send is the hand's latest value");
    assert.ok(Math.abs(now.stored - Number(tokens(sets[0])[3])) < 1e-4);
    // Backing off: each wait at least as long as the one before.
    const at = bridge.flow.sent.map((l, i) => [l, bridge.flow.sentAt[i]]).slice(from).filter(([l]) => l.startsWith(`ed set ${addr} `)).map(([, t]) => t);
    const gaps = at.slice(1).map((t, i) => t - at[i]);
    assert.ok(gaps.every((g, i) => i === 0 || g >= gaps[i - 1] - 5), `gaps ${gaps.join(" ")} ms`);
    assert.ok(gaps[0] >= 20, `the first retry after ${gaps[0]} ms`);
    await sliderFollows(addr);
  });

  test("C3: `ERR busy` mid-burst: the hand's last value is what the unit ends on", async () => {
    await onEngine(1, "ALGO");
    const { addr, knob, kind, min, max } = await firstKnob("ALGO");
    const half = (min + max) / 2;
    await unit.ok(`ed set ${addr} ${kind === "stepped" ? Math.round(half) : half}`);
    await sliderFollows(addr);
    const busy = bridge.flow.rule({ match: (l) => l.startsWith(`ed set ${addr} `), act: "answer", lines: ["ERR busy"], times: 2 });
    const from = bridge.flow.sent.length;
    await wheel(knob, 5);
    await frames();
    await wheel(knob, 3);
    await until("the busy answers given", () => busy.hits === 2);
    await until("the editor's sets to stop", () => !bridge.flow.setsInFlight && bridge.flow.sent.slice(bridge.flow.sent.findLastIndex((l) => l.startsWith("ed set ")) + 1).filter((l) => l.startsWith("ed since")).length >= 5, 10000);
    const last = Number(tokens(setsOf(addr, from).at(-1))[3]);
    const final = await sliderFollows(addr);
    assert.ok(Math.abs(final.stored - last) < 1e-4, `the unit holds ${final.stored}, the editor's last set was ${last}`);
    assert.ok(final.stored > half, `eight notches up from ${half} end at ${final.stored}`);
  });
});

describe("refusals", () => {
  test("C4: a choice the unit refuses at its turn wears the unit's words, and the value stays", async () => {
    await onEngine(1, "ALGO");
    // One FORMANT a side: OP 1 takes the A side's, so OP 2's is refused.
    await unit.ok("ed set OP_A.WAVE #16");
    await until("OP 1 on FRMT", async () => (await unit.get("OP_A.WAVE")).text === "FRMT");
    await until("the editor to read it", async () => (await choice("OP_A.WAVE").innerText()).includes("FRMT"));
    expectNotice(/^THE UNIT REFUSED: OP_B\.WAVE: .+/);
    await pick("OP_B.WAVE", "FRMT");
    const el = choice("OP_B.WAVE");
    await until("OP 2's refusal mark", async () => (await el.getAttribute("class")).split(" ").includes("refused"), 5000);
    const title = await el.getAttribute("title");
    assert.match(title, /^THE UNIT REFUSED: .+/);
    const why = title.slice("THE UNIT REFUSED: ".length);
    assert.ok((await noticesOn()).some((n) => n === `THE UNIT REFUSED: OP_B.WAVE: ${why}`), `notices: ${await noticesOn()}`);
    assert.equal((await unit.get("OP_B.WAVE")).text, "W1");
    assert.ok((await el.innerText()).includes("W1"), "the menu shows the unit's value");
    await seen();
    await resetOps({});
  });

  test("C5: more refusals in one read than the unit names: every refused control is marked", async () => {
    await onEngine(1, "ALGO");
    const algA = await unit.get("ALGO.ALG_A");
    const algB = await unit.get("ALGO.ALG_B");
    // One FORMANT a side, on OP 1 and OP 4: then OP 2, 3, 5 and 6 to FRMT are refused, and so is
    // algorithm 13 on either side (its links don't fit the formants).
    await unit.ok("ed set OP_A.WAVE #16");
    await unit.ok("ed set OP_D.WAVE #16");
    await until("OP 1 and 4 on FRMT", async () => (await unit.get("OP_A.WAVE")).stored === 16 && (await unit.get("OP_D.WAVE")).stored === 16);
    await until("the editor to read them", async () => (await choice("OP_D.WAVE").innerText()).includes("FRMT"));
    const alg13 = await optionName("ALGO", "ALGO.ALG_A", 12);
    const refusedSets = [["OP_B.WAVE", "FRMT"], ["OP_C.WAVE", "FRMT"], ["OP_E.WAVE", "FRMT"], ["OP_F.WAVE", "FRMT"], ["ALGO.ALG_A", alg13], ["ALGO.ALG_B", alg13]];
    expectNotice(/^THE UNIT REFUSED /);
    expectNotice(/^THE UNIT DID NOT TAKE /);
    // The editor's reads wait at the bridge until all six sets are in: one `since` then holds all six refusals.
    const wait = bridge.flow.rule({ match: /^ed since /, act: "defer", times: Infinity });
    const from = bridge.flow.sent.length;
    // Six picks inside the editor's answer timeout (1 s): a hand at the page's own pace, two frames each.
    await page.evaluate(async (sets) => {
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      for (const [a, name] of sets) {
        const c = document.querySelector(`[data-choice="${a}"]`);
        c.querySelector('[aria-haspopup="listbox"]').click();
        await frame();
        [...c.querySelectorAll('[role="option"]')].find((o) => o.textContent.trim() === name).click();
        await frame();
      }
    }, refusedSets);
    await until("the six sets sent and answered", () => refusedSets.every(([a]) => setsOf(a, from).length >= 1) && !bridge.flow.setsInFlight, 5000);
    wait.release();
    const unmarked = async () => {
      const out = [];
      for (const [a] of refusedSets) if (!((await choice(a).getAttribute("class")) ?? "").split(" ").includes("refused")) out.push(a);
      return out;
    };
    await until("every refused control marked", async () => (await unmarked()).length === 0, 6000).catch(async (e) => {
      throw new Error(`${e.message}: unmarked ${(await unmarked()).join(" ")}; notices ${(await noticesOn()).join(" | ")}`);
    });
    for (const [a] of refusedSets.slice(0, 4)) assert.equal((await unit.get(a)).text, "W1", `${a} unchanged on the unit`);
    assert.equal((await unit.get("ALGO.ALG_A")).stored, algA.stored);
    assert.equal((await unit.get("ALGO.ALG_B")).stored, algB.stored);
    await seen();
    await resetOps({ "ALGO.ALG_A": algA.stored, "ALGO.ALG_B": algB.stored });
  });

  test("C6: `ERR ed set <addr> <why>` at set time: at the control and in a notice naming the line sent", async () => {
    await onEngine(1, "ALGO");
    // The line the unit gets names an option past its last, as a stale list would.
    bridge.flow.rule({ match: /^ed set OP_B\.WAVE #/, act: "rewrite", map: () => "ed set OP_B.WAVE #99" });
    expectNotice(/^THE UNIT REFUSED ed set OP_B\.WAVE #8: .+/);
    await pick("OP_B.WAVE", "TRI");
    const el = choice("OP_B.WAVE");
    await until("OP 2's refusal mark", async () => (await el.getAttribute("class")).split(" ").includes("refused"), 5000);
    assert.match(await el.getAttribute("title"), /^THE UNIT REFUSED: .+/);
    assert.equal((await unit.get("OP_B.WAVE")).text, "W1");
  });
});

describe("answers in pages and halts", () => {
  test("C8: a whole answer in two pages (`OK <m> more`): every value read, none missing", async () => {
    await onEngine(1, "ALGO");
    // The unit's answer cut where the real unit cuts one past its bound: the Part's section, then
    // `more`; the rest whole at the head of the next.
    let rest = null;
    let gen = null;
    bridge.flow.rule({
      match: /^ed since /,
      act: "map",
      map: (lines) => {
        const ok = lines.at(-1);
        const cut = lines.findIndex((l, i) => i > 0 && /^(map|mixer) /.test(l));
        if (lines[0] !== "" || cut < 0) return lines;
        gen = /^OK (\d+)/.exec(ok)[1];
        rest = lines.slice(cut, -1);
        return [...lines.slice(0, cut), `OK ${gen} more`];
      },
      times: 1,
    });
    // A stale number: the whole answer.
    await unit.ok("ed since 0");
    const second = bridge.flow.rule({ match: (l) => rest !== null && l === `ed since ${gen}`, act: "map", map: (lines) => [...rest, ...lines], times: 1 });
    await until("the second page asked for", () => second.hits === 1, 5000);
    const { addr } = await firstKnob("ALGO");
    await sliderFollows(addr);
    assert.equal(await page.locator('[data-addr] .v.missing, [data-addr].missing').count(), 0, "a control the unit reported shows as missing");
    // The MIXER's values came in the second page.
    await page.locator(".ptop .tab", { hasText: "MIXER" }).click();
    await page.locator('[data-addr="PART1.LEVEL"][role="slider"]').waitFor();
    await sliderFollows("PART1.LEVEL");
    await page.locator(".ptop .tab", { hasText: "P1" }).click();
  });

  test("C9: `ERR ed since too large`: the editor stops and says so", async () => {
    await onEngine(1, "ALGO");
    bridge.flow.rule({ match: /^ed since /, act: "answer", lines: ["ERR ed since too large"] });
    await until("the halt", async () => (await connectSays()).includes("THE UNIT'S ANSWER IS TOO LARGE FOR ONE READ"), 5000);
    assert.equal(await page.locator('[role="slider"]').count(), 0, "no control takes a hand");
    await connect("socket");
    await onEngine(1, "ALGO");
  });

  test("C13: the unit's number running backwards (a wrap, a reboot): the editor reads the unit afresh and goes on", async () => {
    await onEngine(1, "ALGO");
    const { addr } = await firstKnob("ALGO");
    // One answer says the top of the count; the next says the unit's own, far below it.
    bridge.flow.rule({ match: /^ed since /, act: "map", map: (lines) => [...lines.slice(0, -1), "OK 999999999"] });
    await polled(4);
    await unit.ok(`ed set ${addr} ${(await unit.get(addr)).norm > 0.5 ? 0.2 : 0.8}`);
    await sliderFollows(addr, 8000);
    await polled(3);
  });
});

describe("the window", () => {
  test("C10: a set and a route share the window: one edit on the wire, both land", async () => {
    await onEngine(1, "ALGO");
    const { addr, knob } = await firstKnob("ALGO");
    const was = await unit.get(addr);
    // The unit slow: every answer held, in order, from the set on. The route the hand makes meanwhile waits for the window.
    bridge.flow.reset();
    bridge.flow.pause();
    await wheel(knob, was.norm > 0.5 ? -1 : 1);
    await until("the set on the wire", () => bridge.flow.sent.some((l) => l.startsWith(`ed set ${addr} `)));
    // A route the unit makes moves no window; the editor's own does: patch LFO3 to the first dest.
    const bay = page.locator(".bay").first();
    const src = bay.locator(".jcol.srcs > *", { hasText: "LFO3" }).first();
    const dst = bay.locator(".jcol.dsts > *").first();
    await src.scrollIntoViewIfNeeded();
    const [sx, sy] = await centre(src);
    const [dx, dy] = await centre(dst);
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(dx, dy, { steps: 5 });
    await page.mouse.up();
    await frames();
    await frames();
    assert.equal(bridge.flow.sent.filter((l) => l.startsWith("ed route LFO3:")).length, 0, "the route went out while the set was on the wire");
    bridge.flow.resume();
    await until("the route sent after the set's answer", () => bridge.flow.sent.some((l) => l.startsWith("ed route LFO3:")), 5000);
    assert.ok(bridge.flow.maxSetsInFlight <= 1, `${bridge.flow.maxSetsInFlight} edits in flight at once`);
    await until(`${addr} landed`, async () => (await unit.get(addr)).stored !== was.stored);
    const cell = tokens(bridge.flow.sent.find((l) => l.startsWith("ed route LFO3:")))[2];
    await until(`${cell} landed`, async () => !!(await unitRoutes())[cell]);
    await unit.ok(`ed route ${cell} off`);
    await until(`${cell} gone`, async () => !(await unitRoutes())[cell]);
  });
});

describe("notices", () => {
  test("C11: a line the editor can't read: one notice, and following goes on", async () => {
    await onEngine(1, "ALGO");
    const { addr } = await firstKnob("ALGO");
    expectNotice(/^THE UNIT SAID A LINE THIS EDITOR CAN'T READ: zzz boot log 1$/);
    bridge.inject("zzz boot log 1");
    await until("the notice", async () => (await noticesOn()).length === 1);
    await unit.ok(`ed set ${addr} ${(await unit.get(addr)).norm > 0.5 ? 0.3 : 0.7}`);
    await sliderFollows(addr);
    assert.deepEqual(await noticesOn(), ["THE UNIT SAID A LINE THIS EDITOR CAN'T READ: zzz boot log 1"]);
  });

  test("C12: twenty distinct notices: sixteen kept, the rest counted, SEEN clears them", async () => {
    await onEngine(1, "ALGO");
    expectNotice(/^THE UNIT SAID A LINE THIS EDITOR CAN'T READ: zzz \d+$/);
    expectNotice(/^AND 4 MORE NO LONGER KEPT$/);
    for (let i = 0; i < 20; i++) bridge.inject(`zzz ${i}`);
    await until("sixteen notices and the count", async () => (await noticesOn()).length === 17);
    const said = await noticesOn();
    assert.equal(said[0], "THE UNIT SAID A LINE THIS EDITOR CAN'T READ: zzz 19", "newest first");
    assert.equal(said.at(-1), "AND 4 MORE NO LONGER KEPT");
    await seen();
    assert.deepEqual(await noticesOn(), []);
  });
});
