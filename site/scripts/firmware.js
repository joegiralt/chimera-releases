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

const FW_MAX = 917504; // the stock bootloader erases itself at this size

/** chimera-usb.py's `check_pair`: the .bin under the bootloader's limit and
 * no .bk2 in disguise; the .bk2 whole (length, CRC-32, its seal its body's
 * SHA-256 prefix) and sealed for this .bin (the seal in it once). What is
 * wrong, or null. */
function checkPair(bin, bk2) {
  if (bin.subarray(0, 8).toString("ascii") === "CHIMERA2") return "CHIMERA.BIN is a .bk2 under a .bin name";
  if (bin.length >= FW_MAX) return `CHIMERA.BIN is ${bin.length} bytes: too big for the firmware area`;
  if (bk2.subarray(0, 8).toString("ascii") !== "CHIMERA2" || bk2.length < 256 || bk2.length > 1 << 20) return "CHIMERA.BK2 is not a .bk2";
  const body = bk2.subarray(256);
  if (bk2.readUInt32LE(0x0c) !== body.length || require("zlib").crc32(body) !== bk2.readUInt32LE(0x10)) return "CHIMERA.BK2 is damaged";
  const seal = bk2.subarray(0x18, 0x20);
  if (!crypto.createHash("sha256").update(body).digest().subarray(0, 8).equals(seal)) return "CHIMERA.BK2 is damaged (its seal)";
  let n = 0;
  for (let at = bin.indexOf(seal); at >= 0; at = bin.indexOf(seal, at + 1)) n++;
  if (n !== 1) return "CHIMERA.BIN and CHIMERA.BK2 are not one build";
  return null;
}
module.exports = { checkPair };
if (require.main !== module) return;

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
// chimera-usb.py's check_pair: never publish a pair the editor would refuse.
const pairFault = checkPair(bin, bk2);
if (pairFault) throw new Error(`firmware: ${pairFault}; not published`);
const [version, build] = bk2.subarray(0x20, 0x40).toString("ascii").split("\0")[0].split(" ");
if (!version || !build) throw new Error("firmware: CHIMERA.BK2 names no version and build");
const manifest = { version, build, tag, files: { "CHIMERA.BIN": { size: bin.length }, "CHIMERA.BK2": { size: bk2.length } } };
fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`firmware: ${version} ${build} (${tag || "no tag"}) in ${dir}`);
