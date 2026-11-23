// SPDX-License-Identifier: GPL-3.0-or-later
// The contract: every kind of line the unit writes in `ed describe` and
// `ed since`, read by the editor's own Protocol.parse and Schema.add
// (e2e/contract/Contract.elm, compiled by `just e2e`). No fixture: the lines
// are the simulator's, now.

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { tokens } from "./unit.mjs";

/** A line's first word, and what Protocol.parse must read it as (`Answer (<one of these>`). */
export const KINDS = {
  ed: ["HelloIs"], schema: ["SchemaIs"], page: ["Page"], panel: ["Panel"], param: ["Param"], opt: ["Opt"],
  route: ["Route", "RouteIs"], source: ["Source"], src: ["Src"], col: ["Col"], amount: ["AmountRange"],
  dests: ["Dests"], routes: ["RoutesIs"], unroute: ["Unroute"], val: ["Val"], part: ["PartIs"], mixer: ["MixerIs"],
  refused: ["Refused"], crumb: ["Crumb"], settings: ["SettingsIs"], project: ["ProjectIs"], sound: ["SoundIs"],
  toast: ["ToastIs"], projects: ["ProjectsIs"], proj: ["Proj"], input: ["InputIs"], kind: ["KindIs"],
  ccs: ["CcsAre"], msbs: ["MsbsAre"], span: ["SpanIs"], rows: ["RowsAre"], maprows: ["MapRowsAre"], map: ["MapIs"],
  row: ["RowIs"], learn: ["LearnIs"], mapfile: ["MapFileIs"], act: ["Act"], orbit: ["OrbitIs"], song: ["SongIs"],
  slot: ["SlotIs"], chord: ["ChordIs"], scale: ["ScaleIs"], step: ["StepIs"], pool: ["PoolIs"],
};

/** The compiled worker: `read(kind, lines)` resolves to { parsed, addresses, pages }. */
export function editorReader(dir) {
  const ctx = { console, setTimeout, clearTimeout };
  vm.runInNewContext(fs.readFileSync(path.join(dir, "contract.js"), "utf8"), ctx);
  const app = ctx.Elm.Contract.init();
  const waiting = new Map();
  app.ports.read.subscribe((r) => {
    waiting.get(r.kind)?.(r);
    waiting.delete(r.kind);
  });
  return (kind, lines) =>
    new Promise((res) => {
      waiting.set(kind, res);
      app.ports.lines.send({ kind, lines });
    });
}

/** Every page of `schema`'s describe: [{ n, lines }] (OK lines dropped); [] for a schema of 0 pages. */
export async function describeAll(unit, schema) {
  const head = tokens((await unit.ask(`ed schema ${schema}`))[0] ?? "");
  if (head[0] !== "schema" || head[1] !== schema) throw new Error(`ed schema ${schema}: ${head.join(" ")}`);
  const pages = [];
  for (let n = 0; n < Number(head[2]); n++) {
    const got = await unit.ask(`ed describe ${schema} ${n}`);
    if (got.at(-1) !== "OK") throw new Error(`ed describe ${schema} ${n}: ${got.join(" | ")}`);
    pages.push({ n, lines: got.slice(0, -1) });
  }
  return { head: head.join(" "), pages };
}

/** `read` each batch of `lines`; failures as strings, and the kinds seen. */
export async function check(read, kind, lines, seen) {
  const failures = [];
  const r = await read(kind, lines);
  lines.forEach((l, i) => {
    if (l.trim() === "") return; // a whole section's opening
    const word = tokens(l)[0];
    const got = r.parsed[i];
    if (/^(OK|ERR)/.test(l)) {
      if (got === "Unknown") failures.push(`${kind}: the editor can't read ${JSON.stringify(l)}`);
      return;
    }
    const want = KINDS[word];
    if (!want) {
      failures.push(`${kind}: a kind of line the contract doesn't know (add it to the editor, then to KINDS): ${JSON.stringify(l)}`);
      return;
    }
    seen.add(word);
    const as = /^Answer \((\w+)/.exec(got)?.[1] ?? /^Answer (\w+)/.exec(got)?.[1];
    if (!as || !want.includes(as)) failures.push(`${kind}: ${JSON.stringify(l)} read as ${got.slice(0, 120)}, want ${want.join(" or ")}`);
  });
  return { failures, reading: r };
}
