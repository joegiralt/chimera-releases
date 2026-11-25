// SPDX-License-Identifier: GPL-3.0-or-later
// The update's hands for Elm's `Update` (the state machine, which decides
// every step): the release's files (the site's copy of the latest, or files
// the user picks) checked before anything is written, the console's answers
// while the update owns the link, CHIMERA.BK2 put onto the card in checked
// lines, the DFU device found and CHIMERA.BIN written (dfu.js), and the
// console waited for after a restart. Each request Elm sends (`updateOut`,
// an `op`) gets its answer on `updateIn`, with the same `op`; progress comes
// as `copied` and `written`.
//
// The same steps as `chimera-usb.py update` (`stage`, `put`, `dfu_flash`,
// `back_after_flash`, `install_bk2`): its constants are named the same.
var ChimeraUpdate = (function () {
  var BANK2_REMOTE = '/CHIMERA/SYSTEM/BANK2.BK2';
  var BK2_HEADER = 256;
  var BK2_MAX = 1 << 20;
  var FW_MAX = 917504; // the stock bootloader erases itself at this size
  var PUT_LINE = 48; // bytes a data line carries: 64 base64 characters
  var PUT_BATCH = 256; // lines a write carries
  var SILENCE_MS = 2000;
  var PUT_WAIT_MS = 125000; // the unit's put deadline (120 s for a 1 MB .bk2) plus 5 s
  var BUSY_TRIES = 5;
  var BUSY_WAIT_MS = 200; // doubling after each `ERR busy`
  var BACK_POLL_MS = 250;
  var LATEST = '../firmware/preenfm3/latest/';

  var app = null, ports = null;
  var held = null; // { bin, bk2, release }: the checked pair, once one is
  var inbox = []; // the unit's lines not yet read
  var wake = null; // a waiting read's resolve
  var linkUp = true;

  function say(m) { app.ports.updateIn.send(m); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // ---- the release's files, checked ----

  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(b) {
    var c = 0xffffffff;
    for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function hex(b) { return Array.from(b, function (x) { return x.toString(16).padStart(2, '0'); }).join(''); }
  function u32(b, at) { return (b[at] | (b[at + 1] << 8) | (b[at + 2] << 16) | (b[at + 3] << 24)) >>> 0; }
  function ascii(b) { return String.fromCharCode.apply(null, b); }

  async function sha256(b) { return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', b))); }

  /** SHA256SUMS' lines as { NAME: hash }. */
  function sums(text) {
    var out = {};
    String(text).split(/\r?\n/).forEach(function (l) {
      var m = /^([0-9a-f]{64})\s+\*?(\S+)$/i.exec(l.trim());
      if (m) out[m[2].toUpperCase()] = m[1].toLowerCase();
    });
    return out;
  }

  function Fault(kind, detail) { var e = new Error(detail); e.fault = kind; return e; }

  /** chimera-usb.py's `check_pair`: the .bin under the bootloader's limit and
   * no .bk2 in disguise; the .bk2 whole (length, CRC-32, its seal its body's
   * SHA-256 prefix) and sealed for this .bin. The release's facts, or a Fault. */
  async function checkPair(bin, bk2) {
    if (ascii(bin.subarray(0, 8)) === 'CHIMERA2') throw Fault('pair', 'CHIMERA.BIN is a .bk2 under a .bin name');
    if (bin.length >= FW_MAX) throw Fault('pair', 'CHIMERA.BIN is ' + bin.length + ' bytes: too big for the firmware area');
    if (ascii(bk2.subarray(0, 8)) !== 'CHIMERA2' || bk2.length < BK2_HEADER || bk2.length > BK2_MAX) throw Fault('pair', 'CHIMERA.BK2 is not a .bk2');
    var body = bk2.subarray(BK2_HEADER);
    if (u32(bk2, 0x0c) !== body.length || crc32(body) !== u32(bk2, 0x10)) throw Fault('pair', 'CHIMERA.BK2 is damaged');
    var seal = bk2.subarray(0x18, 0x20);
    if ((await sha256(body)).slice(0, 16) !== hex(seal)) throw Fault('pair', 'CHIMERA.BK2 is damaged (its seal)');
    if (count(bin, seal) !== 1) throw Fault('pair', 'CHIMERA.BIN and CHIMERA.BK2 are not one build');
    try { ChimeraDfu.checkImage(bin); } catch (e) { throw Fault('pair', 'CHIMERA.BIN: ' + e.message); }
    var version = ascii(bk2.subarray(0x20, 0x40)).split('\0')[0];
    return { version: version, seal: hex(seal), format: bk2[8] | (bk2[9] << 8), binSize: bin.length, bk2Size: bk2.length };
  }

  function count(hay, needle) {
    var n = 0;
    outer: for (var i = 0; i + needle.length <= hay.length; i++) {
      for (var j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
      n++;
    }
    return n;
  }

  /** Both files against SHA256SUMS, then as a pair: held, and said to Elm. */
  async function adopt(bin, bk2, sumsText, source, manifest) {
    var want = sums(sumsText);
    if (!want['CHIMERA.BIN'] || !want['CHIMERA.BK2']) throw Fault('sums', 'SHA256SUMS lists no CHIMERA.BIN and CHIMERA.BK2');
    if ((await sha256(bin)) !== want['CHIMERA.BIN']) throw Fault('checksum', 'CHIMERA.BIN does not match SHA256SUMS: a damaged or different file');
    if ((await sha256(bk2)) !== want['CHIMERA.BK2']) throw Fault('checksum', 'CHIMERA.BK2 does not match SHA256SUMS: a damaged or different file');
    var r = await checkPair(bin, bk2);
    if (manifest && manifest.version + ' ' + manifest.build !== r.version) throw Fault('pair', 'the site says ' + manifest.version + ' ' + manifest.build + ' but CHIMERA.BK2 is ' + r.version);
    r.source = source;
    held = { bin: bin, bk2: bk2, release: r };
    return r;
  }

  async function fetchBytes(url) {
    var r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw Fault('unreachable', url + ': ' + r.status);
    return new Uint8Array(await r.arrayBuffer());
  }

  async function latest() {
    var base = new URL(LATEST, location.href).href;
    var m;
    try {
      var r = await fetch(base + 'manifest.json', { cache: 'no-store' });
      if (!r.ok) throw new Error(String(r.status));
      m = await r.json();
    } catch (e) {
      throw Fault('unreachable', 'the latest release is not on this site (' + (e.message || e) + ')');
    }
    var files = await Promise.all([fetchBytes(base + 'CHIMERA.BIN'), fetchBytes(base + 'CHIMERA.BK2'), fetchBytes(base + 'SHA256SUMS')]);
    return adopt(files[0], files[1], new TextDecoder().decode(files[2]), 'latest', m);
  }

  /** The browser's file chooser: a .BIN, a .BK2 and SHA256SUMS. */
  function choose() {
    return new Promise(function (res, rej) {
      var input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.style.display = 'none';
      input.addEventListener('change', async function () {
        var fs = Array.from(input.files || []);
        input.remove();
        var by = function (re) { return fs.find(function (f) { return re.test(f.name); }); };
        var bin = by(/\.bin$/i), bk2 = by(/\.bk2$/i), sum = by(/sha256/i);
        if (!bin || !bk2 || !sum) { rej(Fault('files', 'choose three files together: CHIMERA.BIN, CHIMERA.BK2 and SHA256SUMS')); return; }
        try {
          res(await adopt(new Uint8Array(await bin.arrayBuffer()), new Uint8Array(await bk2.arrayBuffer()), await sum.text(), 'chosen', null));
        } catch (e) { rej(e); }
      });
      input.addEventListener('cancel', function () { input.remove(); rej(Fault('cancelled', 'no files chosen')); });
      document.body.appendChild(input);
      input.click();
    });
  }

  async function release(how) {
    try {
      var r = how === 'choose' ? await choose() : await latest();
      say({ op: 'release', release: r });
    } catch (e) {
      say({ op: 'release', fault: e.fault || 'unreachable', detail: e.message || String(e) });
    }
  }

  // ---- the console, while the update owns it ----

  function onLine(l) {
    inbox.push(l);
    if (wake) { var w = wake; wake = null; w(); }
  }

  function onState(s) {
    linkUp = s === 'open';
    if (wake) { var w = wake; wake = null; w(); }
  }

  /** The next line within `ms`: the line, 'gone' when the link went, or null. */
  async function nextLine(ms) {
    var end = Date.now() + ms;
    for (;;) {
      if (inbox.length) return inbox.shift();
      if (!linkUp) return 'gone';
      var left = end - Date.now();
      if (left <= 0) return null;
      await new Promise(function (r) {
        var t = setTimeout(function () { if (wake === w) { wake = null; r(); } }, left);
        var w = function () { clearTimeout(t); r(); };
        wake = w;
      });
    }
  }

  var GONE = { gone: true };

  /** Drop a stalled earlier answer's tail: lines until `quiet` ms pass without one. */
  async function drain(quiet) {
    for (var end = Date.now() + SILENCE_MS; Date.now() < end; ) {
      var l = await nextLine(quiet);
      if (l === null || l === 'gone') return;
    }
  }

  function terminal(l) { return l === 'OK' || l.indexOf('OK ') === 0 || l === 'ERR' || l.indexOf('ERR ') === 0; }

  /** `line`'s answer: { lines, end } (end: its OK or ERR line), GONE, or
   * { noAnswer: true }; the first line waited for `first` ms. */
  async function ask1(line, first) {
    await drain(50);
    if (!linkUp || !(await ports.write(line))) return GONE;
    var lines = [];
    for (var wait = first; ; wait = SILENCE_MS) {
      var l = await nextLine(wait);
      if (l === 'gone') return GONE;
      if (l === null) return { noAnswer: true };
      if (terminal(l)) return { lines: lines, end: l };
      lines.push(l);
    }
  }

  /** `ask1`, again while the unit says `ERR busy`: 5 tries, 200 ms apart, doubling. */
  async function ask(line, first) {
    var wait = BUSY_WAIT_MS, a;
    for (var i = 0; i < BUSY_TRIES; i++) {
      a = await ask1(line, first);
      if (a.end !== 'ERR busy') return a;
      await sleep(wait);
      wait *= 2;
    }
    return a;
  }

  function b64(b) {
    var s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }

  /** `put BANK2.BK2 <size> <crc32>`, the data once the unit says READY, then
   * its last line: { end } (OK, OK PRESENT, OK staged:..., or the ERR),
   * GONE or { noAnswer }. Progress as `copied`. */
  async function put1() {
    var data = held.bk2;
    await drain(50);
    var head = 'put ' + BANK2_REMOTE + ' ' + data.length + ' ' + crc32(data).toString(16).padStart(8, '0');
    if (!linkUp || !(await ports.write(head))) return GONE;
    var first = await nextLine(PUT_WAIT_MS);
    if (first === 'gone') return GONE;
    if (first === null) return { noAnswer: true };
    if (first !== 'READY') return { end: first };
    say({ op: 'copied', sent: 0, total: data.length });
    for (var at = 0; at < data.length; at += PUT_LINE * PUT_BATCH) {
      var lines = [];
      for (var o = at; o < Math.min(data.length, at + PUT_LINE * PUT_BATCH); o += PUT_LINE) lines.push(b64(data.subarray(o, o + PUT_LINE)));
      if (!linkUp || !(await ports.write(lines.join('\n')))) return GONE;
      say({ op: 'copied', sent: Math.min(data.length, at + PUT_LINE * PUT_BATCH), total: data.length });
    }
    var last = await nextLine(PUT_WAIT_MS);
    if (last === 'gone') return GONE;
    if (last === null) return { noAnswer: true };
    return { end: last };
  }

  async function put() {
    var wait = BUSY_WAIT_MS, a;
    for (var i = 0; i < BUSY_TRIES; i++) {
      a = await put1();
      if (a.end !== 'ERR busy') break;
      await sleep(wait);
      wait *= 2;
    }
    say(Object.assign({ op: 'put' }, a));
  }

  /** The unit back after a restart: the link opened again (a port this page
   * was given, by the console's USB id) and answering `status`, not busy,
   * within `secs`. With `restart`, first the link going (up to 10 s): the
   * unit restarts a moment after its OK. A wait, never a write: its timeout
   * cuts nothing. */
  async function back(secs, restart) {
    var end = Date.now() + secs * 1000;
    if (restart) {
      for (var t = Date.now() + 10000; linkUp && Date.now() < t; ) await nextLine(Math.min(250, t - Date.now()));
      inbox = [];
    }
    var cause = 'off';
    for (;;) {
      if (!linkUp) {
        inbox = [];
        linkUp = await ports.reopen();
        if (!linkUp) cause = 'off';
      }
      if (linkUp) {
        var a = await ask1('status', Math.max(50, Math.min(SILENCE_MS, end - Date.now())));
        if (a.end && a.end !== 'ERR busy') return say({ op: 'back', lines: a.lines, end: a.end });
        cause = a.gone ? 'off' : a.end ? 'busy' : 'silent';
      }
      var left = end - Date.now();
      if (left <= 0) return say({ op: 'back', timeout: true, cause: cause });
      await sleep(Math.min(BACK_POLL_MS, left));
    }
  }

  /** `dfu`: its answer, or GONE (the unit reset before its OK: sent, not refused). */
  async function dfu() {
    var a = await ask1('dfu', SILENCE_MS);
    say(Object.assign({ op: 'dfu' }, a));
  }

  // ---- the DFU device ----

  var device = null;

  function windows() {
    var p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    return /win/i.test(p);
  }

  /** A DFU device this page was given before, waited for up to `secs` (it
   * comes up a moment after `dfu`). */
  async function findDevice(secs) {
    if (!navigator.usb) return say({ op: 'device', found: false, unsupported: true });
    for (var end = Date.now() + secs * 1000; ; ) {
      device = await ChimeraDfu.known().catch(function () { return null; });
      if (device) return say({ op: 'device', found: true });
      if (Date.now() >= end) return say({ op: 'device', found: false });
      await sleep(250);
    }
  }

  async function pickDevice() {
    if (!navigator.usb) return say({ op: 'device', found: false, unsupported: true });
    try {
      device = await ChimeraDfu.choose();
    } catch (e) {
      device = null;
    }
    say({ op: 'device', found: !!device, picked: true });
  }

  async function write() {
    if (!device) return say({ op: 'write', fault: 'lost', detail: 'no update device' });
    try {
      await ChimeraDfu.write(device, held.bin, ChimeraDfu.BASE, function (done, total) { say({ op: 'written', done: done, total: total }); });
      say({ op: 'write', ok: true });
    } catch (e) {
      var kind = e.guard ? 'guard' : e.unopenable ? 'unopenable' : e.refused ? 'refused' : 'lost';
      say({ op: 'write', fault: kind, detail: e.message || String(e), windows: windows() });
    }
  }

  // ---- Elm's requests ----

  async function run(m) {
    switch (m.op) {
      case 'begin':
        inbox = [];
        linkUp = ports.isOpen();
        ports.take({ line: onLine, state: onState });
        await drain(150);
        return say({ op: 'begun', open: linkUp, webusb: !!navigator.usb, windows: windows() });
      case 'release': return release(m.how);
      case 'ask': {
        var a = await ask(m.line, m.wait || SILENCE_MS);
        return say(Object.assign({ op: 'answer', line: m.line }, a));
      }
      case 'put': return put();
      case 'dfu': return dfu();
      case 'findDevice': return findDevice(m.secs);
      case 'pickDevice': return pickDevice();
      case 'write': return write();
      case 'back': return back(m.secs, !!m.restart);
      case 'end':
        inbox = [];
        return say({ op: 'ended', link: ports.giveBack() });
    }
  }

  return {
    crc32: crc32,
    sums: sums,
    checkPair: checkPair,
    adopt: adopt,
    held: function () { return held; },
    run: run,
    attach: function (a, p) {
      app = a;
      ports = p;
      if (app.ports.updateOut) app.ports.updateOut.subscribe(function (m) { run(m); });
    },
  };
})();

if (typeof module !== 'undefined') module.exports = ChimeraUpdate;
