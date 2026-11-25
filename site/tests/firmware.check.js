// SPDX-License-Identifier: GPL-3.0-or-later
// node tests/firmware.check.js: `just site-firmware`'s check before it
// publishes the latest release for the editor's UPDATE: a pair that isn't
// one build (or a damaged .bk2) is refused, and no manifest is written.
const assert = require("assert");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { checkPair, crc32 } = require("../scripts/firmware.js");
const { makeRelease } = require("../../editor/e2e/fakerelease.cjs");

const a = makeRelease("0.4.1 abcd1234");
const b = makeRelease("0.4.2 ffff0000");
assert.strictEqual(checkPair(a.bin, a.bk2), null, "one build refused");
assert.strictEqual(checkPair(a.bin, b.bk2), "CHIMERA.BIN and CHIMERA.BK2 are not one build");
const torn = Buffer.from(a.bk2);
torn[400] ^= 1;
assert.strictEqual(checkPair(a.bin, torn), "CHIMERA.BK2 is damaged");
assert.strictEqual(checkPair(a.bk2, a.bk2), "CHIMERA.BIN is a .bk2 under a .bin name");
// dfu.js's checkImage too: the reset vector inside the image at 0x08020000.
const low = Buffer.from(a.bin);
low.writeUInt32LE(0x08001001, 4);
assert.strictEqual(checkPair(low, a.bk2), "CHIMERA.BIN is not a firmware image for 0x08020000");
// Its own CRC-32 (zlib.crc32 needs Node 20.15 or later): the check value.
assert.strictEqual(crc32(Buffer.from("123456789")), 0xcbf43926);

// The script itself: a mismatched pair whose SHA256SUMS match is not published.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "firmware-check-"));
try {
  const sha = (x) => require("crypto").createHash("sha256").update(x).digest("hex");
  fs.writeFileSync(path.join(dir, "CHIMERA.BIN"), a.bin);
  fs.writeFileSync(path.join(dir, "CHIMERA.BK2"), b.bk2);
  fs.writeFileSync(path.join(dir, "SHA256SUMS"), `${sha(a.bin)}  CHIMERA.BIN\n${sha(b.bk2)}  CHIMERA.BK2\n`);
  let refused = false;
  try {
    execFileSync("node", [path.join(__dirname, "../scripts/firmware.js"), dir, "v0"], { stdio: "pipe" });
  } catch (e) {
    refused = /not one build/.test(String(e.stderr));
  }
  assert.ok(refused, "a mismatched pair was published");
  assert.ok(!fs.existsSync(path.join(dir, "manifest.json")), "a manifest written for a mismatched pair");
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log("firmware: ok");
