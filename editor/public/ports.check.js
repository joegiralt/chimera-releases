// SPDX-License-Identifier: GPL-3.0-or-later
// node public/ports.check.js: the serial teardown order, the link lifecycle,
// the writes' order and pace, and the cache's failures, against fakes.
var P = require('./ports.js');

function fail(msg) { console.error('FAIL ' + msg); process.exit(1); }
function eq(got, want, what) { if (got !== want) fail(what + ': ' + got + ' want ' + want); }
var tick = function () { return new Promise(function (r) { setTimeout(r, 5); }); };

async function teardownOrder() {
  var log = [];
  var step = function (n) { return function () { log.push(n); return Promise.resolve(); }; };
  var port = { close: step('port.close') };
  var reader = { cancel: step('reader.cancel'), releaseLock: function () { log.push('reader.releaseLock'); } };
  var writer = { close: step('writer.close'), releaseLock: function () { log.push('writer.releaseLock'); } };
  await P.release(port, reader, writer);
  eq(log.join(), 'reader.cancel,reader.releaseLock,writer.close,writer.releaseLock,port.close', 'teardown order');
}

// A cut-off answer leaves a fragment; the empty line that opens the next full
// answer ends it, so `part` arrives whole.
function fragmentThenFullAnswer() {
  var got = [];
  var feed = P.liner(function (l) { got.push(l); });
  feed('val A.B 0 0 "te');
  feed('\npart 2 VA\nOK 7\n');
  eq(got.indexOf('part 2 VA') >= 0, true, 'the part line survives a fragment: ' + JSON.stringify(got));
}

// A fake Elm app and a fake Web Serial port.
function fakeApp() {
  var states = [];
  var subs = {};
  var port = function (n) { return { subscribe: function (f) { subs[n] = f; } }; };
  return {
    states: states, subs: subs,
    ports: {
      connectSerial: port('connectSerial'), connectSocket: port('connectSocket'), send: port('send'),
      linkState: { send: function (s) { states.push(s); } },
      lineIn: { send: function () {} },
      writeFailed: { send: function (l) { (subs.failedLog = subs.failedLog || []).push(l); } },
      recall: port('recall'), keep: port('keep'),
      got: { send: function (g) { (subs.gotLog = subs.gotLog || []).push(g); } },
    },
  };
}

function fakeSerial(opts) {
  var log = [];
  var writes = []; // each write: { line, done() }
  var pending = null; // resolves the current read
  var port = {
    log: log,
    open: function () { return opts.open ? opts.open() : Promise.resolve(); },
    close: function () { log.push('port.close'); return Promise.resolve(); },
    writes: writes,
    writable: { getWriter: function () { return {
      get ready() { log.push('ready'); return opts.ready ? opts.ready() : Promise.resolve(); },
      write: function (bytes) {
        if (opts.failWrite) return Promise.reject(new Error('gone'));
        var line = new TextDecoder().decode(bytes);
        log.push('write ' + line.trim());
        if (!opts.slow) return Promise.resolve();
        return new Promise(function (res) { writes.push({ line: line, done: res }); });
      },
      close: function () { return Promise.resolve(); }, releaseLock: function () {} }; } },
    readable: { getReader: function () { return {
      read: function () { return new Promise(function (res, rej) { pending = { res: res, rej: rej }; }); },
      cancel: function () { if (pending) pending.res({ done: true }); return Promise.resolve(); },
      releaseLock: function () {} }; } },
    unplug: function () { pending.res({ done: true }); },
  };
  var chooser = 0;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { serial: {
    requestPort: function () { chooser++; return Promise.resolve(port); } } } });
  return { port: port, chooser: function () { return chooser; } };
}

async function serialEnds() {
  var app = fakeApp(); P.attach(app);
  var s = fakeSerial({});
  app.subs.connectSerial(); await tick();
  eq(app.states.join(), 'open', 'serial opens');
  s.port.unplug(); await tick();
  eq(app.states.join(), 'open,lost', 'read loop ends: lost');
  eq(s.port.log.join(), 'port.close', 'read loop ended while current: the port is released');
}

async function failedWriteReleases() {
  var app = fakeApp(); P.attach(app);
  var s = fakeSerial({ failWrite: true });
  app.subs.connectSerial(); await tick();
  app.subs.send('ed hello'); await tick();
  eq(app.states.join(), 'open,lost', 'failed write: lost');
  eq(s.port.log.filter(function (l) { return l !== 'ready'; }).join(), 'port.close', 'failed write: the port is released');
  eq(JSON.stringify(app.subs.failedLog), JSON.stringify(['ed hello']), 'failed write: said to Elm');
}

// Lines go out one at a time, each after the writer is ready and the line
// before it written: a slow link never gets two writes at once.
async function writesWaitTheirTurn() {
  var app = fakeApp(); P.attach(app);
  var s = fakeSerial({ slow: true });
  app.subs.connectSerial(); await tick();
  // One update's lines come as one list, in the order it awaits their answers.
  app.subs.send(['ed set A.B 1', 'ed set A.B 2']); app.subs.send('ed since 4');
  await tick();
  eq(s.port.writes.length, 1, 'one write at a time');
  eq(s.port.log.join(), 'ready,write ed set A.B 1', 'ready awaited before the write');
  s.port.writes[0].done(); await tick();
  eq(s.port.writes.length, 2, 'the next after the first is written');
  s.port.writes[1].done(); await tick();
  s.port.writes[2].done(); await tick();
  eq(s.port.log.filter(function (l) { return l !== 'ready'; }).join(), 'write ed set A.B 1,write ed set A.B 2,write ed since 4', 'in order');
  eq(app.subs.failedLog, undefined, 'nothing failed');
}

// A writer not ready holds the line back.
async function writerNotReadyWaits() {
  var app = fakeApp(); P.attach(app);
  var open = null;
  var s = fakeSerial({ ready: function () { return new Promise(function (r) { open = r; }); } });
  app.subs.connectSerial(); await tick();
  app.subs.send('ed hello'); await tick();
  eq(s.port.log.indexOf('write ed hello'), -1, 'not written while the writer is not ready');
  open(); await tick();
  eq(s.port.log.indexOf('write ed hello') >= 0, true, 'written once ready');
}

// A fake WebSocket: open at once, sent lines kept, `bufferedAmount` set by the test.
function fakeSocket() {
  var made = [];
  globalThis.WebSocket = function () {
    var ws = this;
    ws.readyState = 1; ws.bufferedAmount = 0; ws.sent = [];
    ws.send = function (l) { ws.sent.push(l); };
    ws.close = function () { ws.readyState = 3; if (ws.onclose) ws.onclose(); };
    made.push(ws);
    setTimeout(function () { if (ws.onopen) ws.onopen(); }, 0);
  };
  return made;
}

// A socket with too much unsent waits before the next line; a closed one fails it.
async function socketRespectsItsBuffer() {
  var app = fakeApp(); P.attach(app);
  var made = fakeSocket();
  app.subs.connectSocket('ws://x'); await tick();
  var ws = made[0];
  ws.bufferedAmount = 1 << 20;
  app.subs.send('ed set A.B 1'); await tick();
  eq(ws.sent.length, 0, 'held while the socket is full');
  ws.bufferedAmount = 0; await tick(); await tick();
  eq(ws.sent.join(), 'ed set A.B 1', 'sent once drained');
  ws.readyState = 3;
  app.subs.send('ed set A.B 2'); await tick();
  eq(JSON.stringify(app.subs.failedLog), JSON.stringify(['ed set A.B 2']), 'a closed socket: said to Elm');
  delete globalThis.WebSocket;
}

async function quickClicksDoNotInterleave() {
  var app = fakeApp(); P.attach(app);
  var s = fakeSerial({});
  app.subs.connectSerial(); app.subs.connectSerial(); app.subs.connectSocket('ws://x'); await tick();
  eq(s.chooser(), 1, 'one chooser for two quick clicks');
  eq(app.states.join(), 'open', 'one connection, one open');
}

// A fake IndexedDB: open, one store, get and put, each answering on a tick.
function fakeIdb() {
  var data = {};
  function req(f) { var r = {}; setTimeout(function () { try { r.result = f(); r.onsuccess && r.onsuccess(); } catch (e) { r.error = e; r.onerror && r.onerror(); } }, 0); return r; }
  var store = {
    get: function (k) { return req(function () { return data[k]; }); },
    put: function (v, k) { data[k] = v; return {}; },
  };
  var db = {
    createObjectStore: function () { return store; },
    transaction: function () { var t = { objectStore: function () { return store; } }; setTimeout(function () { t.oncomplete && t.oncomplete(); }, 0); return t; },
    close: function () {},
  };
  return { open: function () { var r = req(function () { return db; }); setTimeout(function () { r.onupgradeneeded && r.onupgradeneeded(); }, 0); return r; } };
}

// No IndexedDB (or any failure of it) is a miss, never silence.
async function noStoreIsAMiss() {
  var app = fakeApp(); P.attach(app);
  delete globalThis.indexedDB;
  await P.recall('4/ALGO/0123456789abcdef');
  eq(JSON.stringify(app.subs.gotLog), JSON.stringify([{ key: '4/ALGO/0123456789abcdef', lines: null }]), 'no store: a miss');
}

// A store another tab blocks is a miss, never a wait.
async function blockedStoreIsAMiss() {
  var app = fakeApp(); P.attach(app);
  globalThis.indexedDB = { open: function () { var r = {}; setTimeout(function () { r.onblocked && r.onblocked(); }, 0); return r; } };
  await P.recall('4/ALGO/0123456789abcdef');
  eq(JSON.stringify(app.subs.gotLog), JSON.stringify([{ key: '4/ALGO/0123456789abcdef', lines: null }]), 'blocked: a miss');
  delete globalThis.indexedDB;
}

// What is kept under a key is recalled under it, and nothing under another.
async function keptIsRecalled() {
  var app = fakeApp(); P.attach(app);
  globalThis.indexedDB = fakeIdb();
  await P.keep({ key: '4/MIXER/00000000000000ab', lines: ['page 0 CHR of 1', 'panel CHR -'] });
  await P.recall('4/MIXER/00000000000000ab');
  await P.recall('4/MIXER/00000000000000ac');
  eq(JSON.stringify(app.subs.gotLog), JSON.stringify([
    { key: '4/MIXER/00000000000000ab', lines: ['page 0 CHR of 1', 'panel CHR -'] },
    { key: '4/MIXER/00000000000000ac', lines: null },
  ]), 'kept, recalled');
  delete globalThis.indexedDB;
}

// A check that never finishes (a promise nobody settles) fails, never exits quietly.
setTimeout(function () { fail('a check never finished'); }, 5000);

// After a restart, two consoles with the unit's USB id: no telling which
// is this unit, so neither is opened.
async function severalUnitsRefused() {
  var opened = 0;
  var port = function () { return { getInfo: function () { return { usbVendorId: 0x0483, usbProductId: 0x5740 }; }, open: function () { opened++; return Promise.resolve(); } }; };
  var other = { getInfo: function () { return { usbVendorId: 0x1234, usbProductId: 0x1 }; }, open: function () { opened++; return Promise.resolve(); } };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { serial: { getPorts: function () { return Promise.resolve([port(), other, port()]); } } } });
  var app = fakeApp(); P.attach(app);
  eq(await P.reopen(), 'several', 'two units: several');
  eq(opened, 0, 'a port opened among several');
}

(async function () {
  await severalUnitsRefused();
  await teardownOrder();
  await noStoreIsAMiss();
  await keptIsRecalled();
  fragmentThenFullAnswer();
  await serialEnds();
  await blockedStoreIsAMiss();
  await failedWriteReleases();
  await writesWaitTheirTurn();
  await writerNotReadyWaits();
  await socketRespectsItsBuffer();
  await quickClicksDoNotInterleave();
  console.log('ok');
  process.exit(0);
})();
