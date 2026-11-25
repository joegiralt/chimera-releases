// SPDX-License-Identifier: GPL-3.0-or-later
// A release's pair as `just release` makes one, small: CHIMERA.BK2 (the
// CHIMERA2 header: format, body length and CRC-32, its seal the body's
// SHA-256 prefix, the version) and CHIMERA.BIN (a vector table for
// 0x08020000 and the seal once), with SHA256SUMS and the site's manifest.
const crypto = require("node:crypto");
const zlib = require("node:zlib");

/** `version` is "0.4.1 abcd1234"; `format` the .bk2's (0.4's is 2). */
function makeRelease(version, { binSize = 300 * 1024, bk2Size = 64 * 1024, format = 2 } = {}) {
  const body = Buffer.alloc(bk2Size - 256);
  // The body differs per version, so each version's seal does.
  const seed = crypto.createHash("sha256").update(version).digest();
  for (let i = 0; i < body.length; i++) body[i] = seed[i % 32] ^ (i & 0xff);
  const seal = crypto.createHash("sha256").update(body).digest().subarray(0, 8);
  const head = Buffer.alloc(256);
  head.write("CHIMERA2", 0, "ascii");
  head.writeUInt16LE(format, 8);
  head.writeUInt32LE(body.length, 0x0c);
  head.writeUInt32LE(zlib.crc32(body), 0x10);
  seal.copy(head, 0x18);
  head.write(version, 0x20, "ascii");
  const bk2 = Buffer.concat([head, body]);
  const bin = Buffer.alloc(binSize);
  for (let i = 8; i < bin.length; i++) bin[i] = (i * 13 + seed[i % 32]) & 0xff;
  Buffer.from([0x00, 0xff, 0x00, 0x20, 0x99, 0x02, 0x02, 0x08]).copy(bin, 0);
  // No stray copy of the seal: the filler can't hold it by chance, but make sure.
  seal.copy(bin, 0x400);
  const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
  const sums = `${sha(bin)}  CHIMERA.BIN\n${sha(bk2)}  CHIMERA.BK2\n`;
  const [v, build] = version.split(" ");
  const manifest = { version: v, build, tag: `v${v}`, files: { "CHIMERA.BIN": { size: bin.length }, "CHIMERA.BK2": { size: bk2.length } } };
  return { version, build, seal: seal.toString("hex"), bin, bk2, sums, manifest };
}

module.exports = { makeRelease };
