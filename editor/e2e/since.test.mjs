// SPDX-License-Identifier: GPL-3.0-or-later
// The harness's `ed since` read whole: the real unit pages an answer past
// its byte bound (`OK <m> more`, since.rs), so a state check that read only
// the first page missed what a later one said (a DRUM Part's pad lines put
// the `sound` lines on page 2, and loadInit never saw INIT load). Against a
// fake console that pages, no simulator needed.

import assert from "node:assert/strict";
import { test } from "node:test";
import { sinceWhole } from "./unit.mjs";

/** A console whose `ed since` answers in pages of `per` lines, as the unit's does past its bound. */
function paging(lines, per) {
  const asked = [];
  const ask = async (line) => {
    asked.push(line);
    const match = /^ed since (\d+)$/.exec(line);
    const from = Number(match[1]) === 0 ? 0 : Number(match[1]) - 100;
    const page = lines.slice(from, from + per);
    const rest = from + per < lines.length;
    return [...page, rest ? `OK ${100 + from + per} more` : "OK 4181"];
  };
  return { ask, asked };
}

test("S1: a paged `ed since 0` is read through to its last page", async () => {
  const lines = ["part 5 DRUM", ...Array.from({ length: 40 }, (_, idx) => `val DRUM.PAD${idx} 0 0 "0"`), 'sound 5 "INIT" clean'];
  const paged = paging(lines, 16);
  const got = await sinceWhole(paged.ask);
  assert.deepEqual(got.lines, lines, "lines missing or out of order");
  assert.equal(got.gen, 4181);
  assert.deepEqual(paged.asked, ["ed since 0", "ed since 116", "ed since 132"]);
  assert.ok(got.lines.includes('sound 5 "INIT" clean'), "the sound line on the last page");
});

test("S2: an unpaged answer is one ask; an answer that isn't a since's throws", async () => {
  const paged = paging(["part 1 ALGO"], 16);
  assert.deepEqual(await sinceWhole(paged.ask), { lines: ["part 1 ALGO"], gen: 4181 });
  assert.equal(paged.asked.length, 1);
  await assert.rejects(sinceWhole(async () => ["ERR ed since too large"]), /too large/);
});
