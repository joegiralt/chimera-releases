// SPDX-License-Identifier: GPL-3.0-or-later
// Web Serial and WebSocket for the Elm editor: lines in, lines out, link state.
// One link at a time; both kinds look the same to Elm. Lines go out one at a
// time: each write waits for the one before it and for the link to take more
// (a serial writer's `ready`, a socket's `bufferedAmount`), so nothing piles
// up and reaches the unit in a burst. A line that can't be written is said to
// Elm (`writeFailed`), and the link is dropped.
var ChimeraPorts = (function () {
  var link = null; // { write(line) -> Promise, close() }
  var app = null;
  // While an update owns the link (update.js), its lines and state go to
  // it, not to Elm's model, and the model's own lines are not sent.
  var claim = null; // { line(line), state(name) }
  var lastSocket = null; // the URL the socket link was opened to
  var queue = Promise.resolve(); // the last write: the next waits for it

  // A socket holding more than this unsent waits before the next line.
  var SOCKET_HIGH = 4096;

  function state(name) { if (claim) claim.state(name); else app.ports.linkState.send(name); }

  function emit(line) { if (claim) claim.line(line); else app.ports.lineIn.send(line); }

  // Split a stream of text into lines on \n, CR stripped.
  function liner(emit) {
    var buf = '';
    return function (chunk) {
      buf += chunk;
      var i;
      while ((i = buf.indexOf('\n')) >= 0) {
        emit(buf.slice(0, i).replace(/\r$/, ''));
        buf = buf.slice(i + 1);
      }
    };
  }

  // Release a serial port in the only order that lets it close: cancel the
  // reader (ends its read loop), release its lock, close the writer (drains
  // pending writes), release it, and only then close the port. A port closed
  // while a stream is still locked rejects, stays open, and the next
  // requestPort/open fails.
  async function release(port, reader, writer) {
    try { await reader.cancel(); } catch (e) {}
    try { reader.releaseLock(); } catch (e) {}
    try { await writer.close(); } catch (e) {}
    try { writer.releaseLock(); } catch (e) {}
    try { await port.close(); } catch (e) {}
  }

  async function drop() {
    var old = link;
    link = null;
    if (old) { try { await old.close(); } catch (e) {} }
  }

  // True while a connect is between its click and its link: a second click
  // then does nothing, so two connects never interleave their awaits.
  var connecting = false;

  async function connect(setup) {
    if (connecting) return;
    connecting = true;
    var run;
    try { run = await setup(); } finally { connecting = false; }
    if (run) await run();
  }

  var CONSOLE = { usbVendorId: 0x0483, usbProductId: 0x5740 };
  var SERIAL = { baudRate: 115200, dataBits: 8, stopBits: 1, parity: 'none' };

  // Open the port and make it the link; resolves to the read loop, or nothing.
  async function openSerial() {
    await drop();
    if (!('serial' in navigator)) { state('unsupported'); return null; }
    var port;
    try {
      port = await navigator.serial.requestPort({ filters: [CONSOLE] });
      await port.open(SERIAL);
    } catch (e) {
      // A cancelled chooser is not a fault; a port someone else holds is.
      if (e && e.name === 'NotFoundError') { return null; }
      state('busy');
      return null;
    }
    lastSocket = null;
    return adopt(port);
  }

  // An open port as the link; resolves to its read loop.
  function adopt(port) {
    var enc = new TextEncoder();
    var writer = port.writable.getWriter();
    var reader = port.readable.getReader();
    var dec = new TextDecoder('utf-8');
    var feed = liner(emit);
    var mine = {
      write: async function (line) {
        await writer.ready;
        await writer.write(enc.encode(line + '\n'));
      },
      close: function () { return release(port, reader, writer); },
    };
    link = mine;
    state('open');
    return async function () {
      try {
        for (;;) {
          var r = await reader.read();
          if (r.done) break;
          feed(dec.decode(r.value, { stream: true }));
        }
      } catch (e) { /* unplugged: fall through */ }
      // Still current: nobody dropped it, so release it here, or a reconnect to the same port finds it held.
      if (link === mine) { link = null; state('lost'); await mine.close(); }
    };
  }

  function connectSerial() { return connect(openSerial); }

  async function openSocket(url) {
    await drop();
    lastSocket = url;
    var ws;
    try { ws = new WebSocket(url); } catch (e) { state('absent'); return null; }
    var mine = {
      ws: ws,
      write: function (line) { return drained(ws).then(function () { ws.send(line); }); },
      close: function () { ws.close(); },
    };
    var opened = false;
    link = mine;
    ws.onopen = function () { opened = true; state('open'); };
    // The bridge sends one line per message; tolerate a CR or trailing \n.
    ws.onmessage = function (message) {
      String(message.data).split('\n').forEach(function (line, idx, all) {
        if (idx < all.length - 1 || line !== '') emit(line.replace(/\r$/, ''));
      });
    };
    ws.onclose = function () {
      if (link === mine) { link = null; state(opened ? 'lost' : 'absent'); }
    };
    return null;
  }

  function connectSocket(url) { return connect(function () { return openSocket(url); }); }

  // Resolves once the socket's unsent bytes are under SOCKET_HIGH; rejects
  // once it is no longer open.
  function drained(ws) {
    return new Promise(function (res, rej) {
      (function check() {
        if (ws.readyState !== 1) rej(new Error('socket not open'));
        else if (ws.bufferedAmount <= SOCKET_HIGH) res();
        else setTimeout(check, 5);
      })();
    });
  }

  // The line goes out after every line before it. One that can't is said
  // to Elm, and the link is dropped and released, so a reconnect can open
  // the same port; the lines queued behind it on that link are said too.
  function send(line) {
    if (claim) return queue; // the update owns the link: the model is paused
    return push(line, function () { app.ports.writeFailed.send(line); });
  }

  function push(line, said) {
    var l = link;
    var failed = function () {
      said();
      if (l && link === l) { link = null; state('lost'); Promise.resolve(l.close()).catch(function () {}); }
    };
    if (!l) { failed(); return queue; }
    queue = queue.then(function () {
      if (link !== l) throw new Error('link gone');
      return l.write(line);
    }).catch(failed);
    return queue;
  }

  // The update's side (update.js): the link taken from the model and given
  // back, its own writes (resolving true once written, false if the link
  // went), and the link opened again after the unit restarts: a serial port
  // this page was given before (by its USB id), else the same socket.
  // `reopen` resolves true, false, or 'several' (more than one unit).
  function take(claimer) { claim = claimer; }
  function giveBack() { claim = null; return link ? 'open' : 'lost'; }
  function write(line) {
    var ok = true;
    return push(line, function () { ok = false; }).then(function () { return ok; });
  }
  function isOpen() { return !!link; }

  // The console's granted ports (by USB id), to open one at a time when
  // several are there and the unit is picked by what `status` says of it.
  async function candidates() {
    if (lastSocket || !('serial' in navigator)) return [];
    var ports = [];
    try { ports = await navigator.serial.getPorts(); } catch (error) { return []; }
    return ports.filter(function (port) {
      var info = port.getInfo ? port.getInfo() : CONSOLE;
      return info.usbVendorId === CONSOLE.usbVendorId && info.usbProductId === CONSOLE.usbProductId;
    });
  }

  async function openPort(port) {
    await drop();
    try { await port.open(SERIAL); } catch (error) { return false; }
    adopt(port)();
    return true;
  }

  async function reopen() {
    if (link) return true;
    if (lastSocket) {
      openSocket(lastSocket);
      for (var tries = 0; tries < 60; tries++) {
        if (!link) return false;
        if (link.ws && link.ws.readyState === 1) return true;
        await new Promise(function (resolve) { setTimeout(resolve, 50); });
      }
      return false;
    }
    if (!('serial' in navigator)) return false;
    var ports = [];
    try { ports = await navigator.serial.getPorts(); } catch (error) { return false; }
    // Only the console's USB id; with more than one such port there is no
    // telling which is this unit (the console names no serial number), so
    // none is taken: 'several'.
    var mine = ports.filter(function (port) {
      var info = port.getInfo ? port.getInfo() : CONSOLE;
      return info.usbVendorId === CONSOLE.usbVendorId && info.usbProductId === CONSOLE.usbProductId;
    });
    if (mine.length > 1) return 'several';
    if (!mine.length) return false;
    try { await mine[0].open(SERIAL); } catch (error) { return false; }
    adopt(mine[0])();
    return true;
  }

  // The schema cache: IndexedDB, one store, a schema's describe
  // lines under "<protocol>/<SCHEMA>/<hash>". Every failure is a miss: the
  // editor describes the schema again. Never a timer, never a guess.
  var DB = 'chimera-editor', STORE = 'schemas';

  function openDb(idb) {
    return new Promise(function (res, rej) {
      var r = idb.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
      // Another tab holds an older version open: a miss, never a wait.
      r.onblocked = function () { rej(new Error('blocked')); };
    });
  }

  function idbOf() { return typeof indexedDB !== 'undefined' ? indexedDB : null; }

  async function recall(key) {
    var lines = null;
    try {
      var idb = idbOf();
      if (idb) {
        var db = await openDb(idb);
        lines = await new Promise(function (res, rej) {
          var g = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
          g.onsuccess = function () { res(Array.isArray(g.result) ? g.result : null); };
          g.onerror = function () { rej(g.error); };
        });
        db.close();
      }
    } catch (e) { lines = null; }
    app.ports.got.send({ key: key, lines: lines });
  }

  async function keep(entry) {
    try {
      var idb = idbOf();
      if (!idb) return;
      var db = await openDb(idb);
      await new Promise(function (res, rej) {
        var t = db.transaction(STORE, 'readwrite');
        t.objectStore(STORE).put(entry.lines, entry.key);
        t.oncomplete = res;
        t.onerror = function () { rej(t.error); };
      });
      db.close();
    } catch (e) { /* a store that fails keeps nothing: the next connect describes again */ }
  }

  return {
    release: release,
    send: send,
    take: take,
    giveBack: giveBack,
    write: write,
    isOpen: isOpen,
    reopen: reopen,
    candidates: candidates,
    openPort: openPort,
    close: drop,
    liner: liner,
    recall: recall,
    keep: keep,
    attach: function (a) {
      app = a;
      app.ports.connectSerial.subscribe(connectSerial);
      app.ports.connectSocket.subscribe(connectSocket);
      // An update's lines, in order (a lone line too).
      app.ports.send.subscribe(function (ls) { (Array.isArray(ls) ? ls : [ls]).forEach(send); });
      app.ports.recall.subscribe(recall);
      app.ports.keep.subscribe(keep);
    },
  };
})();

if (typeof module !== 'undefined') module.exports = ChimeraPorts;
if (typeof Elm !== 'undefined' && typeof document !== 'undefined') {
  var theme = typeof ChimeraTheme !== 'undefined' ? ChimeraTheme : { flags: function () { return { stored: null, dark: false }; }, store: function () {} };
  var main = Elm.Main.init({ node: document.getElementById('app'), flags: theme.flags() });
  if (main.ports.storeTheme) main.ports.storeTheme.subscribe(theme.store);
  ChimeraPorts.attach(main);
  if (typeof ChimeraUpdate !== 'undefined') ChimeraUpdate.attach(main, ChimeraPorts);
  if (typeof ChimeraTape !== 'undefined') ChimeraTape.attach(main, ChimeraPorts);
}
