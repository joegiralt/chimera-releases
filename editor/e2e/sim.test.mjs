// SPDX-License-Identifier: GPL-3.0-or-later
// The protocol's deep sweep (sim.mjs: every shown param of every engine, the
// MIXER, the matrix, SETTINGS, ORBIT, MIDI MAP, stale generations, loads)
// run inside the suite: the same simulator a test file gets, through this
// run's bridge instead of the firmware's ed-bridge. No browser.

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { startBridge } from "./bridge.mjs";
import { editorDir, setup, simOnly, unit } from "./harness.mjs";

setup({ engines: [] });

test("H-c: sim.mjs's sweep passes against this run's simulator", { skip: simOnly("sweeps every value, saves and loads on the card") }, async (t) => {
  const bridge = await startBridge(path.join(editorDir, "dist"), unit);
  try {
    const out = [];
    const code = await new Promise((done) => {
      const p = spawn(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), "sim.mjs")], { env: { ...process.env, ED_URL: bridge.ws }, stdio: ["ignore", "pipe", "pipe"] });
      for (const s of [p.stdout, p.stderr]) s.on("data", (d) => out.push(String(d)));
      p.on("exit", done);
    });
    const lines = out.join("").split("\n");
    for (const l of lines.filter((x) => /^(FAIL|SKIP)/.test(x))) t.diagnostic(l);
    assert.equal(code, 0, lines.filter((l) => l.startsWith("FAIL")).join("\n") || lines.slice(-20).join("\n"));
  } finally {
    await bridge.close();
  }
});
