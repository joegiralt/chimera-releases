// SPDX-License-Identifier: GPL-3.0-or-later
// node public/tape.check.js: tape.wasm (the firmware kit's, copied by `just
// kit`) against the kit's reference set, every case's .SRC made by the
// firmware's own `chimera-import tape` from the same frames under the same
// flags: the file the editor makes must be that file, byte for byte (both
// resample with rubato's scalar dot product, ADR 0345). Then the WAV
// reader as a trust boundary, fuzzed: random bytes and damaged WAVs are
// refused with a status, never a trap, and the module still converts the
// references as before. Then the put's chunk lines.
var fs = require('fs');
var path = require('path');
var Tape = require('./tape.js');
var crc32 = require('./update.js').crc32;

var refs = path.join(__dirname, '..', 'tests', 'tape-refs');

function fail(msg) { console.error('FAIL ' + msg); process.exit(1); }
function eq(got, want, what) { if (got !== want) fail(what + ': ' + got + ' want ' + want); }
function ok(cond, what) { if (!cond) fail(what); }

/** A deterministic PRNG (mulberry32): the fuzz is the same every run. */
function random(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    var mixed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function u32(bytes, at) { return (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0; }

// ---- the .SRC file (ADR 0087/0093): header 28, records, CRC trailer ----

var HEADER = 28, SOURCE_DATA = 0x0018;

/** Its records as { tag, start, len }; a file that doesn't frame fails. */
function records(file, what) {
  ok(String.fromCharCode(file[0], file[1], file[2], file[3]) === 'CHIM', what + ': its magic');
  eq(u32(file, file.length - 4), crc32(file.subarray(0, file.length - 4)), what + ': its trailer is its CRC');
  var out = [];
  var at = HEADER;
  while (at < file.length - 4) {
    var len = file[at + 2] | (file[at + 3] << 8);
    out.push({ tag: file[at] | (file[at + 1] << 8), start: at + 4, len: len });
    at += 4 + len;
  }
  eq(at, file.length - 4, what + ': its records end at the trailer');
  return out;
}

function twelve(value) { return value & 0x800 ? value - 0x1000 : value; }

/** Its 12-bit samples, from every SourceData record. */
function samples(file, recs) {
  var out = [];
  recs.filter(function (rec) { return rec.tag === SOURCE_DATA; }).forEach(function (rec) {
    for (var at = rec.start; at + 2 < rec.start + rec.len; at += 3) {
      out.push(twelve(file[at] | ((file[at + 1] & 0xf) << 8)));
      out.push(twelve((file[at + 1] >> 4) | (file[at + 2] << 4)));
    }
  });
  return out;
}

/** `mine` must be the CLI's `want`, byte for byte; a mismatch names how
 * many samples differ. */
function same(mine, want, what) {
  if (Buffer.compare(Buffer.from(mine), Buffer.from(want)) === 0) return;
  eq(mine.length, want.length, what + ': its length');
  var have = samples(mine, records(mine, what + ' (editor)')), wanted = samples(want, records(want, what + ' (CLI)'));
  var apart = have.filter(function (sample, idx) { return sample !== wanted[idx]; }).length;
  fail(what + ': not the CLI\'s file (' + apart + ' of ' + have.length + ' samples differ)');
}

function cases() {
  return fs.readFileSync(path.join(refs, 'cases.txt'), 'utf8').trim().split('\n').map(function (line) {
    var words = line.split(' ');
    return { name: words[0], from: Number(words[1]), to: Number(words[2]), args: words.slice(3).join(' ').split('|') };
  });
}

function rateOf(take) {
  var match = /^rate (\d+)$/m.exec(take.report);
  return match ? Number(match[1]) : 0;
}

/** Every reference case through the module: each file the CLI's. */
function references(wasm, quiet) {
  var all = cases();
  all.forEach(function (one) {
    var wav = fs.readFileSync(path.join(refs, one.name + '.wav'));
    var take = Tape.loadWav(wasm, one.name + '.wav', wav);
    eq(take.status, 0, one.name + ': load (' + take.report + ')');
    var made = Tape.convertWith(wasm, one.args, one.from, one.to);
    eq(made.status, 0, one.name + ': convert (' + made.report + ')');
    ok(new RegExp('^bytes ' + made.file.length + '$', 'm').test(made.report), one.name + ': the report gives the file\'s size');
    ok(new RegExp('^crc ' + crc32(made.file).toString(16).toUpperCase().padStart(8, '0') + '$', 'm').test(made.report), one.name + ': the report gives the file\'s CRC-32');
    ok(made.preview.length > 0 && made.rate >= 8000, one.name + ': a preview');
    var want = fs.readFileSync(path.join(refs, one.name + '.SRC'));
    same(made.file, new Uint8Array(want), one.name);
  });
  if (!quiet) console.log('tape.wasm: all ' + all.length + ' reference files byte-identical to chimera-import tape\'s');
  return all.length;
}

var STATUSES = [0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12, -13, -14, -15];

/** Damaged and random input: a status every time, never a trap. */
function fuzz(wasm) {
  var next = random(0x7a9e);
  var wavs = cases().map(function (one) { return new Uint8Array(fs.readFileSync(path.join(refs, one.name + '.wav'))); });
  var loaded = 0, converted = 0, runs = 1500;
  for (var run = 0; run < runs; run++) {
    var bytes;
    var base = wavs[Math.floor(next() * wavs.length)];
    switch (run % 5) {
      case 0: // random bytes, sometimes behind a RIFF/WAVE header
        bytes = new Uint8Array(Math.floor(next() * 512));
        for (var idx = 0; idx < bytes.length; idx++) bytes[idx] = Math.floor(next() * 256);
        if (next() < 0.5 && bytes.length >= 12) bytes.set([82, 73, 70, 70, 0, 0, 0, 0, 87, 65, 86, 69]);
        break;
      case 1: // cut short anywhere
        bytes = base.slice(0, Math.floor(next() * base.length));
        break;
      case 2: // bytes flipped in the header and chunk heads
        bytes = base.slice();
        for (var flips = 0; flips < 4; flips++) bytes[Math.floor(next() * Math.min(64, bytes.length))] = Math.floor(next() * 256);
        break;
      case 3: // a chunk size or the format's fields set wild
        bytes = base.slice();
        var at = [4, 16, 20, 22, 24, 28, 32, 34, 40][Math.floor(next() * 9)];
        var wild = [0, 1, 0xffffffff, 0x7fffffff, 3, 0x10000][Math.floor(next() * 6)];
        bytes[at] = wild & 0xff; bytes[at + 1] = (wild >>> 8) & 0xff;
        if (at === 4 || at === 24 || at === 28 || at === 40) { bytes[at + 2] = (wild >>> 16) & 0xff; bytes[at + 3] = wild >>> 24; }
        break;
      default: // bytes flipped anywhere
        bytes = base.slice();
        for (var many = 0; many < 16; many++) bytes[Math.floor(next() * bytes.length)] = Math.floor(next() * 256);
    }
    var take = Tape.loadWav(wasm, 'fuzz.wav', bytes);
    ok(STATUSES.indexOf(take.status) >= 0, 'fuzz run ' + run + ': status ' + take.status);
    if (take.status !== 0) continue;
    loaded++;
    var frames = Number((/^frames (\d+)$/m.exec(take.report) || [])[1]);
    var rate = rateOf(take);
    ok(frames > 0 && rate >= 1000, 'fuzz run ' + run + ': a report it reads (' + take.report + ')');
    // Convert only what stays small at 24 kHz: a wild rate can ask for a huge resample.
    if (frames * 24000 / rate > 400000) continue;
    var made = Tape.convertWith(wasm, ['--rate', '24k'], 0, frames);
    ok(STATUSES.indexOf(made.status) >= 0, 'fuzz run ' + run + ': convert status ' + made.status);
    if (made.status === 0) {
      records(made.file, 'fuzz run ' + run);
      converted++;
    }
  }
  console.log('tape.wasm fuzz: ' + runs + ' damaged or random WAVs, each refused or read (' + loaded + ' read, ' + converted + ' made into sources), no trap');
}

/** The put's chunk lines: 48 bytes a line, padding only at a chunk's end,
 * then `end <the chunk's crc32>`; the lines give the file back whole. */
function chunkLines() {
  var file = new Uint8Array(Tape.CHUNK_BYTES * 2 + 1000);
  for (var idx = 0; idx < file.length; idx++) file[idx] = (idx * 7 + (idx >> 9)) & 0xff;
  var back = [];
  for (var chunk = 0; chunk < 3; chunk++) {
    var lines = Tape.chunkLines(file, chunk);
    var data = lines.slice(0, -1);
    var piece = file.subarray(chunk * Tape.CHUNK_BYTES, Math.min(file.length, (chunk + 1) * Tape.CHUNK_BYTES));
    eq(lines[lines.length - 1], 'end ' + crc32(piece).toString(16).padStart(8, '0'), 'chunk ' + chunk + "'s end line");
    data.forEach(function (line, at) {
      ok(line.length <= 64, 'a data line of 64 characters at most');
      if (at < data.length - 1) ok(line.length === 64 && line.indexOf('=') < 0, 'padding only on a chunk\'s last line');
      back.push(Buffer.from(line, 'base64'));
    });
  }
  eq(Buffer.compare(Buffer.concat(back), Buffer.from(file)), 0, 'the chunks give the file back');
}

async function main() {
  var wasm = await Tape.instantiate(fs.readFileSync(path.join(__dirname, 'tape.wasm')));
  var before = references(wasm, false);
  fuzz(wasm);
  eq(references(wasm, true), before, 'the references after the fuzz');
  chunkLines();
  console.log('tape.check.js: ok');
}

main().catch(function (error) { fail(error.stack || String(error)); });
