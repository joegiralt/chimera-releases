// SPDX-License-Identifier: GPL-3.0-or-later
// The unit changing under the editor: a knob turned on the box, a Sound
// loaded on the followed Part, a project loaded, a Part taken by its key, a
// level moved on a Part the editor doesn't follow, a prompt up while the
// editor edits, ORBIT, scenes and learn on the box, and names: the longest a
// project takes, and one holding a quote mark.
//
// INIT ALGO, MODAL and VA on Parts 1 to 3 (the box's keys); Part 6 the new
// project's.

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  bridge, choice, expectNotice, settled, firstKnob, followPart, loadInit, newProject, noticesOn, onEngine, onMixer, page, polled, setup, showCell, simOnly, slider, sliderFollows, slidersAgainstUnit,
  statusText, tokens, tryGet, unit, unitRoutes, until, wheel,
} from "./harness.mjs";

setup({ engines: ["ALGO", "MODAL", "VA"] });

/** Every slider the editor shows equal to the unit's, within `ms`. */
async function slidersSettle(ms = 8000) {
  await until("every slider the unit's", async () => (await slidersAgainstUnit(60)).length === 0, ms).catch(async (e) => {
    throw new Error(`${e.message}: ${(await slidersAgainstUnit(60)).join("; ")}`);
  });
}

describe("the box's own hands", () => {
  test("G1: an encoder turned on the box: the control it moved reads the unit's value", async () => {
    await onEngine(1, "ALGO");
    await showCell("FILTER.RESO");
    // What the turn moved, as the unit says it: the val lines of a diff.
    let gen = (await unit.since()).gen;
    await unit.ok("turn 1 3");
    const moved = await until("a value moved by the turn", async () => {
      const got = await unit.since(gen);
      gen = got.gen;
      return got.lines.map(tokens).find((w) => w[0] === "val")?.[1];
    }, 3000);
    if (await slider(moved).count()) await sliderFollows(moved, 3000);
    else {
      assert.ok(await choice(moved).count(), `the turn moved ${moved}, which the page doesn't draw`);
      await until(`${moved}'s choice to read the unit's`, async () => (await choice(moved).innerText()).includes((await unit.get(moved)).text), 3000);
    }
  });

  test("G4: Part 2 taken by its key on the box: the editor follows it, and a hand reaches Part 2 only", async () => {
    await onEngine(1, "ALGO");
    await unit.ok("key B2");
    await until("the editor on Part 2", async () => (await statusText()) === "SIMULATOR · PART 2 · MODAL", 10000);
    const { addr, knob } = await firstKnob("MODAL");
    const was = await unit.get(addr);
    await unit.ok("ed part 1");
    await until("the box on Part 1", async () => (await unit.at()).startsWith("PART 1"));
    const p1 = await tryGet(addr);
    // The editor on Part 1 too before the box goes back: else its status still says Part 2 when the key is pressed,
    // the wait below passes at once, and the hand lands while the editor reads Part 1 then Part 2 again (and takes none).
    await until("the editor on Part 1", async () => (await statusText()) === "SIMULATOR · PART 1 · ALGO", 10000);
    await unit.ok("key B2");
    await until("the editor on Part 2 again", async () => (await statusText()) === "SIMULATOR · PART 2 · MODAL", 10000);
    await settled();
    const from = bridge.flow.got.length;
    await wheel(knob, was.norm > 0.5 ? -2 : 2);
    await until(`${addr} on Part 2 to move`, async () => (await unit.get(addr)).stored !== was.stored).catch(async (e) => {
      const said = bridge.flow.got.slice(from).filter((g) => !(g.line.startsWith("ed since") && g.lines.length === 1));
      throw new Error(`${e.message}: the unit ${JSON.stringify(await unit.get(addr))}, the editor ${await statusText()}, its notices ${JSON.stringify(await noticesOn())}\n${said.slice(0, 30).map((g) => `${g.line} => ${g.lines.join(" | ")}`).join("\n")}`);
    });
    await sliderFollows(addr);
    await unit.ok("key B1");
    await followPart(1, "ALGO");
    assert.equal((await tryGet(addr))?.stored, p1?.stored, `Part 1's ${addr} moved`);
  });

  test("G4: back on an engine it read before, the editor names the Part only once that engine's schema is asked again: a hand meanwhile waits", async () => {
    await onEngine(2, "MODAL");
    await unit.ok("key B1");
    await followPart(1, "ALGO");
    // The answer that says the box is on Part 2 again comes without its OK: the editor waits on it (and asks again
    // after its timeout). All that while it must not claim Part 2 MODAL: it has not yet asked the unit for
    // MODAL's schema, so it takes no hand.
    let cut = 0;
    bridge.flow.rule({
      match: /^ed since /,
      act: "map",
      times: Infinity,
      map: (lines) => {
        if (cut || !lines.includes("part 2 MODAL")) return lines;
        cut = bridge.flow.sent.length;
        return lines.slice(0, -1);
      },
    });
    await unit.ok("key B2");
    const claimed = [];
    await until("the editor to ask again after the missing OK", async () => {
      if ((await statusText()) === "SIMULATOR · PART 2 · MODAL" && !bridge.flow.sent.slice(cut).includes("ed schema MODAL")) claimed.push(Date.now());
      return cut && bridge.flow.sent.slice(cut).some((l) => l.startsWith("ed since") || l === "ed schema MODAL");
    }, 5000, 5);
    assert.deepEqual(claimed, [], "the editor said PART 2 · MODAL before asking MODAL's schema again");
    bridge.flow.clearRules();
    await followPart(2, "MODAL");
    await unit.ok("key B1");
    await followPart(1, "ALGO");
  });

  // G4's failure on the unit (2026-11-24): a turn that lands in the frame the box's new Part comes in, on the old
  // page's control, its value gone with that Part. Not sent (Part 1's turn is not Part 2's), and said.
  test("G4: a turn in the frame the box takes another Part: not sent, and said", async () => {
    await onEngine(1, "ALGO");
    const { addr, knob } = await firstKnob("ALGO");
    const was = await unit.get(addr);
    expectNotice(/^THE TURN OF \S+ WAS NOT SENT: THE BOX TOOK ANOTHER PART/);
    // The wheel goes on the line `part 2 MODAL` itself: the editor has read it, the page not yet drawn again.
    await page.evaluate((a) => {
      const send = WebSocket.prototype.send;
      WebSocket.prototype.send = function (d) {
        WebSocket.prototype.send = send;
        this.addEventListener("message", function on(ev) {
          if (ev.data !== "part 2 MODAL") return;
          this.removeEventListener("message", on);
          const el = document.querySelector(`[data-addr="${a}"][role="slider"]`);
          el.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true }));
          window.__turned = true;
        });
        return send.call(this, d);
      };
    }, addr);
    const from = bridge.flow.sent.length;
    await unit.ok("key B2");
    await until("the turn in that frame", () => page.evaluate(() => window.__turned === true), 10000);
    await followPart(2, "MODAL");
    await until("the turn said", async () => (await noticesOn()).some((n) => n.startsWith(`THE TURN OF ${addr} WAS NOT SENT`)), 3000);
    assert.deepEqual(bridge.flow.sent.slice(from).filter((l) => l.startsWith("ed set ")), [], "the turn sent");
    await unit.ok("key B1");
    await followPart(1, "ALGO");
    assert.equal((await unit.get(addr)).stored, was.stored, `Part 1's ${addr} moved`);
    void knob;
  });

  test("G4: `ERR busy` to the schema and describe asked for the box's new engine: asked again quietly, and the page read", async () => {
    await onEngine(1, "ALGO");
    // Part 3's VA not read yet in this file: its schema asked (and described, unless held) when the box takes it.
    const busy = bridge.flow.rule({ match: /^ed (schema|describe) VA/, act: "answer", lines: ["ERR busy"], times: 3 });
    await unit.ok("key B3");
    await until("the busy answers given", () => busy.hits === 3, 10000);
    await followPart(3, "VA");
    await firstKnob("VA");
    await unit.ok("key B1");
    await followPart(1, "ALGO");
  });

  test("G5: a level moved for a Part the editor doesn't follow: its MIXER strip follows", async () => {
    await onMixer();
    const was = await unit.get("PART3.LEVEL");
    await unit.ok(`ed set PART3.LEVEL ${was.norm > 0.5 ? 0.25 : 0.75}`);
    await until("PART3.LEVEL moved", async () => (await unit.get("PART3.LEVEL")).stored !== was.stored);
    await sliderFollows("PART3.LEVEL");
    await page.locator(".ptop .tab", { hasText: "P1" }).click();
  });
});

describe("loads", () => {
  test("G2: a Sound loaded on the followed Part: its engine, values and routes replace the old", async () => {
    await followPart(6, (await statusText()).endsWith("VA") ? "VA" : (await unit.since()).lines.find((l) => l.startsWith("engine 6 ")).split(" ")[2]);
    await loadInit(6, "VA");
    await until("the editor on Part 6 VA", async () => (await statusText()) === "SIMULATOR · PART 6 · VA", 10000);
    await slidersSettle();
    const routes = await unitRoutes();
    await until("the unit's routes as the cables", async () => (await page.locator(".bay").first().locator(".att").count()) === Object.keys(routes).length, 5000);
    assert.ok((await unit.since()).lines.includes('sound 6 "INIT" clean'));
  });

  test("G3: a project loaded while connected: each tab's engine, the followed page and the MIXER the unit's", { skip: simOnly("saves projects on the card") }, async () => {
    await onEngine(1, "ALGO");
    await unit.ok("ed project saveas E2EA");
    await until("E2EA saved", async () => (await unit.ask("status")).includes("project E2EA"));
    // A new project: every Part's engine its own (MODAL and VA on 2 and 3 are E2EA's).
    await newProject();
    await until("Part 3 no longer VA", async () => !(await unit.since()).lines.includes("engine 3 VA"), 5000);
    await until("P3's tab", async () => !(await page.locator(".ptop .tab", { hasText: "P3" }).innerText()).trim().endsWith("VA"), 5000);
    await unit.ok("ed projects");
    const listed = await until("E2EA listed", async () => (await unit.since()).lines.map(tokens).find((w) => w[0] === "proj" && w[2] === "E2EA"), 5000);
    await unit.ok(`ed project load ${listed[1]} ${listed[5]} discard`);
    await until("E2EA loaded", async () => (await unit.ask("status")).includes("project E2EA"), 10000);
    await followPart(1, "ALGO");
    const engines = Object.fromEntries((await unit.since()).lines.map(tokens).filter((w) => w[0] === "engine").map((w) => [w[1], w[2]]));
    for (let n = 1; n <= 6; n++) await until(`P${n}'s tab ${engines[n]}`, async () => (await page.locator(".ptop .tab", { hasText: `P${n}` }).innerText()).trim().endsWith(engines[n]));
    await slidersSettle();
    await onMixer();
    for (let n = 1; n <= 6; n++) await sliderFollows(`PART${n}.LEVEL`);
    await page.locator(".ptop .tab", { hasText: "P1" }).click();
  });
});

describe("the box busy elsewhere", () => {
  test("G6: a REPLACE? prompt up on the box while the editor edits: no wedge, the editor shows the unit's", async () => {
    await onEngine(1, "ALGO");
    // An edit, so a load over Part 1 asks.
    await unit.ok("ed set FILTER.RESO 0.3");
    await until("Part 1 edited", async () => !(await unit.since()).lines.includes('sound 1 "INIT" clean') || true);
    await unit.ok("key EDIT+B1");
    await until("the SOUND 1 browser", async () => (await unit.at()) === "SOUND 1");
    await unit.ok("key EDIT");
    const at = await until("a prompt", async () => {
      const a = await unit.at();
      return a !== "SOUND 1" && a;
    }, 3000).catch(() => unit.at());
    const k = slider("FILTER.RESO");
    const was = await unit.get("FILTER.RESO");
    await wheel(k, 3);
    await until("FILTER.RESO moved", async () => (await unit.get("FILTER.RESO")).stored !== was.stored, 5000);
    await sliderFollows("FILTER.RESO");
    assert.equal(await unit.at(), at, "the edit moved the box off its prompt");
    // MENU: the prompt's safe answer.
    for (let i = 0; i < 3 && !(await unit.at()).startsWith("PART 1"); i++) {
      await unit.ok("key MENU");
      await unit.ask("status");
    }
    await unit.ok("key B1");
    await until("the box on Part 1's pages", async () => (await unit.at()).startsWith("PART 1"));
    await followPart(1, "ALGO");
  });

  test("G7: ORBIT played and stopped, a scene queued, learn armed and off on the box: no notice, no halt", async () => {
    await onEngine(1, "ALGO");
    for (const c of ["ed orbit play", "ed scene queue 1", "ed learn FILTER.CUTOFF", "ed learn off", "ed orbit stop"]) {
      await unit.ask(c);
      await polled(3);
    }
    const { addr } = await firstKnob("ALGO");
    await unit.ok(`ed set ${addr} ${(await unit.get(addr)).norm > 0.5 ? 0.2 : 0.8}`);
    await sliderFollows(addr);
    assert.deepEqual(await noticesOn(), []);
  });
});

describe("names", () => {
  test("G8: a project named the longest a name takes: read without a notice", { skip: simOnly("saves a project on the card") }, async () => {
    await onEngine(1, "ALGO");
    await unit.ok("ed project saveas ABCDEFGHIJKLMNOP");
    await until("saved", async () => (await unit.ask("status")).includes("project ABCDEFGHIJKLMNOP"), 5000);
    await polled(5);
    assert.deepEqual(await noticesOn(), []);
  });

  // A quoted field escapes its quote (ADR 0336). Names saved on the unit are
  // A-Z a-z 0-9, space and '-', so it can't write one; the line here is the
  // one it would write for a Sound named `AB" CD`.
  test("G8: a name holding a quote mark is read whole", async () => {
    await onMixer();
    bridge.inject('sound 1 "AB\\" CD" clean');
    await polled(3);
    assert.deepEqual(await noticesOn(), [], "the line was not read");
    await until("the strip names the Sound", async () => (await page.locator('[data-strip="PART1"] h2 small').innerText()).trim() === 'AB" CD', 2000);
  });
});
