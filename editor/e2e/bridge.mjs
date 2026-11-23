// SPDX-License-Identifier: GPL-3.0-or-later
// One localhost server for the browser: the built editor (editor/dist) over
// HTTP, and the unit's console over WebSocket, one text message per line, as
// the firmware's ed-bridge speaks it. The editor's lines join the test's in
// the console client's queue, so both are answered, in order, and the bridge
// sees every `ed set` the editor sends and when its answer comes back.

import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".wasm": "application/wasm", ".png": "image/png" };

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
    setsInFlight: 0, // the editor's `ed set`s sent and not yet answered
    maxSetsInFlight: 0,
    reset() {
      this.sent = [];
      this.maxSetsInFlight = this.setsInFlight;
    },
    // Paused, the unit's answers wait here, in order: a unit slower than the hand.
    paused: null,
    pause() {
      this.paused ??= [];
    },
    resume() {
      const held = this.paused ?? [];
      this.paused = null;
      for (const f of held) f();
    },
  };
  let socket = null;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const file = path.join(dist, url.pathname === "/" ? "index.html" : path.normalize(url.pathname));
    if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(file).pipe(res);
  });

  server.on("upgrade", (req, sock) => {
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
        const isSet = /^ed set /.test(line);
        if (isSet) {
          flow.setsInFlight++;
          flow.maxSetsInFlight = Math.max(flow.maxSetsInFlight, flow.setsInFlight);
        }
        unit.con.ask(line, "editor").then((c) => {
          const deliver = () => {
            if (isSet) flow.setsInFlight--;
            if (sock !== socket || sock.destroyed) return;
            for (const l of c.lines) sock.write(frame(0x1, Buffer.from(l, "utf8")));
          };
          if (flow.paused) flow.paused.push(deliver);
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
    close: () => {
      socket?.destroy();
      return new Promise((r) => server.close(r));
    },
  };
}
