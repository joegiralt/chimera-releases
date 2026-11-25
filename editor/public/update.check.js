// SPDX-License-Identifier: GPL-3.0-or-later
// node public/update.check.js: the release's checks before anything is
// written (SHA256SUMS, chimera-usb.py's check_pair), the CRC the put sends,
// and the put's lines, against a fake console.
globalThis.ChimeraDfu = require('./dfu.js');
var U = require('./update.js');
var zlib = require('node:zlib');
var { makeRelease } = require('../e2e/fakerelease.cjs');

function fail(msg) { console.error('FAIL ' + msg); process.exit(1); }
function eq(got, want, what) { if (got !== want) fail(what + ': ' + got + ' want ' + want); }
async function fault(p, kind, what) {
  try { await p; } catch (e) { eq(e.fault, kind, what + ' (' + e.message + ')'); return e.message; }
  fail(what + ': not refused');
}
var u8 = function (b) { return new Uint8Array(b); };

async function checks() {
  var r = makeRelease('0.4.1 abcd1234');
  eq(U.crc32(u8(r.bk2)), zlib.crc32(r.bk2), 'crc32 as zlib');
  var got = await U.adopt(u8(r.bin), u8(r.bk2), r.sums, 'latest', r.manifest);
  eq(got.version, '0.4.1 abcd1234', 'the version');
  eq(got.seal, r.seal, 'the seal');
  eq(got.format, 2, 'the format');
  eq(U.held().release, got, 'held once checked');

  // SHA256SUMS: a file that doesn't match is refused before anything else.
  var bad = Buffer.from(r.bin); bad[100] ^= 1;
  await fault(U.adopt(u8(bad), u8(r.bk2), r.sums, 'latest', null), 'checksum', 'a damaged .bin');
  var badK = Buffer.from(r.bk2); badK[300] ^= 1;
  await fault(U.adopt(u8(r.bin), u8(badK), r.sums, 'latest', null), 'checksum', 'a damaged .bk2');
  await fault(U.adopt(u8(r.bin), u8(r.bk2), 'nothing here', 'latest', null), 'sums', 'SHA256SUMS without the pair');

  // check_pair, with SHA256SUMS made to match: each refusal.
  var other = makeRelease('0.4.2 ffff0000');
  var mixed = r.sums.split('\n')[0] + '\n' + other.sums.split('\n')[1] + '\n';
  await fault(U.adopt(u8(r.bin), u8(other.bk2), mixed, 'chosen', null), 'pair', 'a .bin and another build\'s .bk2');
  var sha = function (b) { return require('node:crypto').createHash('sha256').update(b).digest('hex'); };
  var swapped = sha(r.bk2) + '  CHIMERA.BIN\n' + sha(r.bk2) + '  CHIMERA.BK2\n';
  await fault(U.adopt(u8(r.bk2), u8(r.bk2), swapped, 'chosen', null), 'pair', 'a .bk2 under a .bin name');
  var big = makeRelease('0.4.1 abcd1234', { binSize: 917504 });
  await fault(U.adopt(u8(big.bin), u8(big.bk2), big.sums, 'chosen', null), 'pair', 'a .bin at the bootloader\'s limit');
  var sealed = Buffer.from(r.bk2); sealed[0x18] ^= 1;
  var crcFixed = sha(r.bin) + '  CHIMERA.BIN\n' + sha(sealed) + '  CHIMERA.BK2\n';
  await fault(U.adopt(u8(r.bin), u8(sealed), crcFixed, 'chosen', null), 'pair', 'a .bk2 whose seal is wrong');
  // The site's manifest must name the .bk2's version.
  await fault(U.adopt(u8(r.bin), u8(r.bk2), r.sums, 'latest', { version: '0.4.1', build: 'deadbeef' }), 'pair', 'a manifest naming another build');
  // SHA256SUMS' forms: two spaces, or a binary-mode star; other files ignored.
  eq(U.sums('aa'.repeat(32) + ' *CHIMERA.BIN\n' + 'bb'.repeat(32) + '  NRPN.json\n')['CHIMERA.BIN'], 'aa'.repeat(32), 'a starred name');
}

// The put against a fake console: the header line's size and CRC, the
// lines' base64 of 48 bytes each, and the answer handed to Elm.
async function putLines() {
  var r = makeRelease('0.4.1 abcd1234', { bk2Size: 4096 + 256 });
  await U.adopt(u8(r.bin), u8(r.bk2), r.sums, 'latest', null);
  var wrote = [], said = [], claim = null;
  var ports = {
    isOpen: function () { return true; },
    take: function (c) { claim = c; },
    giveBack: function () { claim = null; return 'open'; },
    write: function (l) {
      l.split('\n').forEach(function (x) { wrote.push(x); });
      if (/^put /.test(l)) setTimeout(function () { claim.line('READY'); }, 1);
      var data = wrote.slice(1).join('');
      if (wrote.length > 1 && Buffer.from(data, 'base64').length === r.bk2.length) setTimeout(function () { claim.line('OK'); }, 1);
      return Promise.resolve(true);
    },
  };
  var app = { ports: { updateIn: { send: function (m) { said.push(m); } }, updateOut: { subscribe: function () {} } } };
  U.attach(app, ports);
  await U.run({ op: 'begin' });
  await U.run({ op: 'put' });
  eq(wrote[0], 'put /CHIMERA/SYSTEM/BANK2.BK2 ' + r.bk2.length + ' ' + zlib.crc32(r.bk2).toString(16).padStart(8, '0'), 'the put line');
  eq(wrote.slice(1).every(function (l) { return l.length <= 64; }), true, 'lines of 48 bytes');
  eq(Buffer.concat(wrote.slice(1).map(function (l) { return Buffer.from(l, 'base64'); })).equals(r.bk2), true, 'the data whole');
  var last = said[said.length - 1];
  eq(last.op + ' ' + last.end, 'put OK', 'the answer');
  eq(said.filter(function (m) { return m.op === 'copied'; }).pop().sent, r.bk2.length, 'progress to the end');
}

(async function () {
  await checks();
  await putLines();
  console.log('update.js: ok');
})().catch(function (e) { fail(e.stack || e); });
