// SPDX-License-Identifier: GPL-3.0-or-later
// One localhost server for the browser: the built editor (editor/dist) over
// HTTP, and the unit's console over WebSocket, one text message per line, as
// the firmware's ed-bridge speaks it. The editor's lines join the test's in
// the console client's queue, so both are answered, in order, and the bridge
// sees every `ed set` the editor sends and when its answer comes back.
//
// Faults, for the tests that need a worse unit than the simulator: a rule
// (`flow.rule`) matches the editor's lines and drops the answer, answers in
// the unit's place (`ERR busy`), rewrites the answer, holds it, or closes the
// socket mid-burst; `inject` says a line the unit never sent, `hangUp` drops
// the link.

import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

/** E2E_LAG: every answer this many ms late, as the real unit's USB console
 * is next to the simulator's socket (a timing the simulator never shows). */
const LAG = Number(process.env.E2E_LAG ?? 0);

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".wasm": "application/wasm", ".png": "image/png", ".json": "application/json" };

/** Text frames only, as a browser sends them: masked, maybe extended length. */
function* frames(st) {
  for (;;) {
    const b = st.buf;
    if (b.length < 2) return;
    const op = b[0] & 0x0f;
    let len = b[1] & 0x7f;
    let at = 2;
    if (len === 126) {
      if (b.length < 4) return;
      len = b.readUInt16BE(2);
      at = 4;
    } else if (len === 127) {
      if (b.length < 10) return;
      len = Number(b.readBigUInt64BE(2));
      at = 10;
    }
    const masked = b[1] & 0x80;
    const need = at + (masked ? 4 : 0) + len;
    if (b.length < need) return;
    const mask = masked ? b.subarray(at, at + 4) : null;
    const body = Buffer.from(b.subarray(need - len, need));
    if (mask) for (let i = 0; i < body.length; i++) body[i] ^= mask[i & 3];
    st.buf = b.subarray(need);
    yield { op, body };
  }
}

function frame(op, body) {
  const n = body.length;
  const head = n < 126 ? Buffer.from([0x80 | op, n]) : n < 65536 ? Buffer.alloc(4) : Buffer.alloc(10);
  if (n >= 126 && n < 65536) {
    head[0] = 0x80 | op;
    head[1] = 126;
    head.writeUInt16BE(n, 2);
  } else if (n >= 65536) {
    head[0] = 0x80 | op;
    head[1] = 127;
    head.writeBigUInt64BE(BigInt(n), 2);
  }
  return Buffer.concat([head, body]);
}

/** Serve `dist` and bridge `unit`'s console. `flow` counts the editor's sets. */
export async function startBridge(dist, unit) {
  const flow = {
    sent: [], // every line the editor sent, in order
    sentAt: [], // when each was sent (ms)
    got: [], // each answer the editor was given: { line, lines, sentAt, at } (ms)
    dropped: [], // each answer a `drop` kept from it: { line, sentAt, at }
    setsInFlight: 0, // the editor's edits (`ed set`, `ed route`) sent and not yet answered
    maxSetsInFlight: 0,
    reset() {
      this.sent = [];
      this.sentAt = [];
      this.got = [];
      this.dropped = [];
      this.maxSetsInFlight = this.setsInFlight;
    },
    // Paused, the unit's answers wait here, in order: a unit slower than the hand.
    answered: Promise.resolve(), // the latest line's answer (a made-up one waits for it)
    paused: null,
    pausedFrom: 0, // the first line (by its number in `sent`) whose answer waits: answers to earlier lines still come
    pause(from = 0) {
      if (!this.paused) this.pausedFrom = from;
      this.paused ??= [];
    },
    resume() {
      const held = this.paused ?? [];
      this.paused = null;
      for (const f of held) f();
    },
    // The faults, first match first: { match(line), act, lines, map, times, hits, held }.
    rules: [],
    /** A fault on the editor's lines `match` takes (a RegExp or a function), `times` times (default once):
     * act `drop` (the unit takes the line, its answer never comes), `answer` (`lines` answer it, the unit
     * never sees it), `map` (the unit's answer through `map(lines, line)`), `hold` (the answer waits for
     * `release()`), `stall` (it and every answer after it wait for `resume()`), `rewrite` (the line the unit gets is `map(line)`), `defer` (the line reaches the unit only at `release()`, after lines sent since) or
     * `close` (the socket closes before the line goes on). */
    rule({ match, act, lines = [], map = (l) => l, times = 1 }) {
      const test = typeof match === "function" ? match : (l) => match.test(l);
      const r = {
        test, act, lines, map, times, hits: 0, held: [],
        release() {
          const h = this.held;
          this.held = [];
          this.times = 0;
          for (const f of h) f();
        },
        off: () => {
          this.rules = this.rules.filter((x) => x !== r);
        },
      };
      this.rules.push(r);
      return r;
    },
    clearRules() {
      for (const r of this.rules) r.release();
      this.rules = [];
    },
    /** `(line) => lines | null`: lines answer it in the unit's place (none: no answer), null passes it on. */
    intercept: null,
  };
  let socket = null;
  const extra = { files: new Map(), down: false };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const served = extra.files.get(url.pathname);
    if (served) {
      res.writeHead(200, { "content-type": TYPES[path.extname(url.pathname)] ?? "application/octet-stream", "cache-control": "no-store" });
      res.end(served);
      return;
    }
    const file = path.join(dist, url.pathname === "/" ? "index.html" : path.normalize(url.pathname));
    if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(file).pipe(res);
  });

  server.on("upgrade", (req, sock) => {
    // A unit restarting: no console on the bus.
    if (extra.down) {
      sock.destroy();
      return;
    }
    const key = req.headers["sec-websocket-key"];
    const accept = crypto.createHash("sha1").update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
    sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    // A new browser replaces the old, as the console does its clients.
    socket?.destroy();
    socket = sock;
    const st = { buf: Buffer.alloc(0) };
    sock.on("error", () => {});
    sock.on("data", async (d) => {
      st.buf = Buffer.concat([st.buf, d]);
      for (const { op, body } of frames(st)) {
        if (op === 0x8) return sock.end(frame(0x8, Buffer.alloc(0)));
        if (op === 0x9) sock.write(frame(0xa, body));
        if (op !== 0x1) continue;
        const line = body.toString("utf8").replace(/[\r\n]+$/, "");
        flow.sent.push(line);
        const at = Date.now();
        const seq = flow.sentAt.length;
        flow.sentAt.push(at);
        const rule = flow.rules.find((r) => r.times > 0 && r.test(line));
        if (rule) {
          rule.times--;
          rule.hits++;
        }
        // The unit busy from this line on: its answer and every one after it wait, in order, for `resume()`.
        if (rule?.act === "stall") flow.pause(seq);
        if (rule?.act === "close") {
          sock.destroy();
          return;
        }
        // Sets and routes share the editor's window: both are edits on the wire.
        const isSet = /^ed (set|route) /.test(line);
        if (isSet) {
          flow.setsInFlight++;
          flow.maxSetsInFlight = Math.max(flow.maxSetsInFlight, flow.setsInFlight);
        }
        const out = rule?.act === "rewrite" ? rule.map(line) : line;
        const faked = flow.intercept?.(out) ?? null;
        // The unit's own answer: E2E_LAG late, as over the real unit's USB console.
        const late = (c) => (LAG ? new Promise((r) => setTimeout(() => r(c), LAG)) : c);
        // A made-up answer still comes in its turn: after the answers to the lines sent before it, as the unit's would.
        const before = flow.answered;
        const ask = () => (faked ? before.then(() => ({ lines: faked })) : rule?.act === "answer" ? before.then(() => ({ lines: rule.lines })) : unit.con.ask(out, "editor").then(late));
        const answered = rule?.act === "defer" ? new Promise((r) => rule.held.push(() => ask().then(r))) : ask();
        if (rule?.act !== "defer") flow.answered = answered.catch(() => {});
        answered.then((c) => {
          const deliver = () => {
            if (isSet) flow.setsInFlight--;
            if (rule?.act === "drop") {
              flow.dropped.push({ line, seq, sentAt: at, at: Date.now() });
              return;
            }
            if (sock !== socket || sock.destroyed) return;
            const lines = rule?.act === "map" ? rule.map(c.lines, line) : c.lines;
            flow.got.push({ line, lines, seq, sentAt: at, at: Date.now() });
            for (const l of lines) sock.write(frame(0x1, Buffer.from(l, "utf8")));
          };
          if (rule?.act === "hold") rule.held.push(deliver);
          else if (flow.paused && seq >= flow.pausedFrom) flow.paused.push(deliver);
          else deliver();
        });
      }
    });
  });

  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  return {
    port,
    url: `http://127.0.0.1:${port}/`,
    ws: `ws://127.0.0.1:${port}/`,
    flow,
    /** Whether a browser is linked now. */
    linked: () => !!socket && !socket.destroyed,
    /** A line to the linked browser that the unit never said. */
    inject(line) {
      if (socket && !socket.destroyed) socket.write(frame(0x1, Buffer.from(line, "utf8")));
    },
    /** Files served at their paths (`/firmware/preenfm3/latest/CHIMERA.BIN`), ahead of the dist. */
    files: extra.files,
    /** The console off the bus (true) until cleared: a socket opened meanwhile is refused. */
    set down(v) {
      extra.down = v;
    },
    get down() {
      return extra.down;
    },
    /** The link dropped, as an unplugged cable or a killed bridge drops it. */
    hangUp() {
      socket?.destroy();
    },
    close: () => {
      socket?.destroy();
      return new Promise((r) => server.close(r));
    },
  };
}
