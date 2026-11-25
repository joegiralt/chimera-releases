// SPDX-License-Identifier: GPL-3.0-or-later
// node scripts/firmware.js <dir>: the latest release's CHIMERA.BIN, CHIMERA.BK2
// and SHA256SUMS (already in <dir>, from `gh release download`) checked, and
// <dir>/manifest.json written beside them: the version and build hash the
// .bk2 names, the release's tag, each file's size. The editor's UPDATE reads
// them same-origin (a release asset's URL has no CORS), and checks every
// file against SHA256SUMS again before it writes anything.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const [dir, tag = ""] = process.argv.slice(2);
if (!dir) throw new Error("usage: node scripts/firmware.js <dir> [tag]");
const read = (n) => fs.readFileSync(path.join(dir, n));
const bin = read("CHIMERA.BIN");
const bk2 = read("CHIMERA.BK2");
const sums = {};
for (const l of read("SHA256SUMS").toString("utf8").split(/\r?\n/)) {
  const m = /^([0-9a-f]{64})\s+\*?(\S+)$/i.exec(l.trim());
  if (m) sums[m[2].toUpperCase()] = m[1].toLowerCase();
}
for (const [n, b] of [["CHIMERA.BIN", bin], ["CHIMERA.BK2", bk2]]) {
  const got = crypto.createHash("sha256").update(b).digest("hex");
  if (sums[n] !== got) throw new Error(`firmware: ${n} does not match SHA256SUMS (${got})`);
}
if (bk2.subarray(0, 8).toString("ascii") !== "CHIMERA2") throw new Error("firmware: CHIMERA.BK2 is not a .bk2");
const [version, build] = bk2.subarray(0x20, 0x40).toString("ascii").split("\0")[0].split(" ");
if (!version || !build) throw new Error("firmware: CHIMERA.BK2 names no version and build");
const manifest = { version, build, tag, files: { "CHIMERA.BIN": { size: bin.length }, "CHIMERA.BK2": { size: bk2.length } } };
fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`firmware: ${version} ${build} (${tag || "no tag"}) in ${dir}`);
