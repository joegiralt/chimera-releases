// SPDX-License-Identifier: GPL-3.0-or-later
// TAPE IMPORT end to end: a WAV chosen in the editor, made into a source by
// tape.wasm, and copied onto the simulator's card by `put` (ADR 0106) over
// the editor's own link: the file on the card is the one the firmware's
// `chimera-import tape` makes of the same WAV (the kit's reference),
// byte for byte, and the unit's `ls tapes` lists it. A re-send is `OK
// PRESENT`; a source past one chunk goes in chunks; a wavetable is the
// CLI's too; a file that isn't a WAV is refused on the page. Simulator only:
// a real unit's card is never written by the suite.

import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { before, describe, test } from "node:test";
import { bridge, editorDir, openEditor, page, setup, simOnly, unit, until } from "./harness.mjs";

setup({ engines: [] });

const { crc32 } = createRequire(import.meta.url)("../public/update.js");
const refs = path.join(editorDir, "tests", "tape-refs");
const skip = simOnly("puts files onto the unit's card");

/** The panel's text. */
const said = () => page.locator(".upd.tape").innerText();
const button = (name) => page.locator(".upd.tape button", { hasText: name }).first();
const field = (name) => page.locator(`.upd.tape [data-tape="${name}"]`);

/** TAPE IMPORT in the top bar: the panel open, holding the link. */
async function openTape() {
  await page.locator(".ptop .tab", { hasText: "IMPORT" }).click();
  await until("the panel", async () => /Drop a WAV/.test(await said()));
}

/** `file` chosen through CHOOSE A WAV (or CHOOSE ANOTHER WAV). */
async function choose(file) {
  const chooser = page.waitForEvent("filechooser");
  await button("CHOOSE").click();
  await (await chooser).setFiles(file);
}

/** The source made: its card path, as the page gives it. */
async function made() {
  await until("the source made", async () => /READY TO SEND|CAN'T MAKE IT/.test(await page.locator("body").innerText()), 20000);
  const text = await said();
  const match = /\/CHIMERA\/TAPES\/([0-9A-F]{8})\.SRC/.exec(text);
  assert.ok(match, `no source on the page: ${text}`);
  return match[1];
}

/** SEND TO THE UNIT, and the page saying `wanted` once the copy ends. */
async function send(wanted = /On the card as|already on the card/) {
  await button("SEND TO THE UNIT").click();
  await until("the copy to end", async () => wanted.test(await said()) || /Not copied/.test(await said()), 60000);
  const text = await said();
  assert.ok(wanted.test(text), `not copied: ${text}`);
}

/** The editor's lines since `from`: a write of several (a chunk's batch) split into each. */
const sentSince = (from) => bridge.flow.sent.slice(from).flatMap((text) => text.split("\n"));

const onCard = (stem) => fs.readFileSync(path.join(unit.card, "CHIMERA", "TAPES", `${stem}.SRC`));

async function listed() {
  return (await unit.ask("ls tapes")).join("\n");
}

describe("TAPE IMPORT", { skip }, () => {
  before(async () => {
    await openEditor();
  });

  test("T1: a WAV made into a source and copied: the card holds chimera-import tape's own file, and ls tapes lists it", async () => {
    await openTape();
    await choose(path.join(refs, "sine16m48.wav"));
    const stem = await made();
    const text = await said();
    assert.match(text, /TAKE\s+48 kHz · 0\.500 s/);
    assert.match(text, /SOURCE\s+0\.500 s at 24 kHz · 12-BIT/);
    assert.match(text, /FITS IN MEMORY: [\d.]+ KiB of the [\d.]+ KiB a project of NEW leaves · [\d.]+ KiB left/);
    const from = bridge.flow.sent.length;
    await send();
    const want = fs.readFileSync(path.join(refs, "sine16m48.SRC"));
    assert.ok(onCard(stem).equals(want), "the card's file is the CLI's reference, byte for byte");
    assert.match(await listed(), new RegExp(stem));
    const lines = sentSince(from);
    assert.equal(lines[0], `put /CHIMERA/TAPES/${stem}.SRC ${want.length} ${crc32(new Uint8Array(want)).toString(16).toUpperCase().padStart(8, "0")}`);
    assert.match(lines.at(-1), /^end [0-9a-f]{8}$/, "the chunk ends with its CRC");
  });

  test("T2: the same source again: OK PRESENT, nothing sent", async () => {
    const from = bridge.flow.sent.length;
    await button("CHOOSE ANOTHER WAV").waitFor();
    // A choice changed and back makes the same source: SEND again.
    await page.locator(".upd.tape .tpicks button", { hasText: "32 kHz" }).click();
    await page.locator(".upd.tape .tpicks button", { hasText: "24 kHz" }).click();
    await button("MAKE THE SOURCE").click();
    await made();
    await send(/already on the card/);
    assert.deepEqual(sentSince(from).filter((line) => !/^put /.test(line)), [], "no data after OK PRESENT");
  });

  test("T3: a source past one chunk goes in chunks, each on its ACK, and lands whole", async () => {
    const wav = noiseWav(48000, 4);
    await choose(wav);
    await page.locator(".upd.tape .tpicks button", { hasText: "48 kHz" }).click();
    await field("name").fill("long noise");
    await button("MAKE THE SOURCE").click();
    const stem = await made();
    const from = bridge.flow.sent.length;
    await send();
    const ends = sentSince(from).filter((line) => /^end /.test(line));
    assert.equal(ends.length, 2, "two chunks");
    const file = onCard(stem);
    assert.ok(file.length > 256 * 1024, `a file past one chunk (${file.length} B)`);
    assert.match(await said(), /NAME\s+LONG NOISE/);
    assert.match(await listed(), new RegExp(stem));
  });

  test("T4: a wavetable: the CLI's own file, on the card", async () => {
    await choose(path.join(refs, "wave16m48.wav"));
    await page.locator(".upd.tape .tpicks button", { hasText: "WAVETABLE" }).click();
    await field("cycle").fill("480");
    await field("frames").selectOption("8");
    await button("MAKE THE SOURCE").click();
    const stem = await made();
    assert.match(await said(), /8 FRAMES · WAVETABLE · 12-BIT/);
    await send();
    assert.ok(onCard(stem).equals(fs.readFileSync(path.join(refs, "wave16m48.SRC"))), "the CLI's wavetable, byte for byte");
  });

  test("T5: a file that isn't a WAV is refused on the page; CLOSE gives the link back and the editor follows the unit again", async () => {
    const junk = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "chimera-tape-")), "junk.wav");
    fs.writeFileSync(junk, Buffer.from("RIFF\u0004\u0000\u0000\u0000WAVEjunk, not audio at all"));
    await choose(junk);
    await until("the refusal", async () => /Not a WAV the editor reads/.test(await said()), 10000);
    const polls = () => bridge.flow.sent.filter((line) => line.startsWith("ed since")).length;
    const pollsBefore = polls();
    await button("CLOSE").click();
    await until("the editor polling the unit again", async () => polls() > pollsBefore + 2, 10000);
  });
});

/** `seconds` of 16-bit mono noise at `rate`, a decaying hiss: a WAV past one put chunk at 48 kHz. */
function noiseWav(rate, seconds) {
  const frames = rate * seconds;
  const wav = Buffer.alloc(44 + frames * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + frames * 2, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(frames * 2, 40);
  let state = 12345;
  for (let idx = 0; idx < frames; idx++) {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    const hiss = ((state >>> 8) / 8388608 - 1) * Math.exp(-idx / rate);
    wav.writeInt16LE(Math.round(hiss * 20000), 44 + idx * 2);
  }
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "chimera-tape-")), "noise.wav");
  fs.writeFileSync(file, wav);
  return file;
}
