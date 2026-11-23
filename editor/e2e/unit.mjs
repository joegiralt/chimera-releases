// SPDX-License-Identifier: GPL-3.0-or-later
// The simulated unit for the end-to-end tests: chimera-desktop headless (no
// window, no audio device, no MIDI port) on a card of its own, its console on
// a free localhost port, and one client to that console that every request
// goes through, the editor's included (the console takes one client at a time).

import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

export const SHOT_BYTES = 240 * 320 * 2;

/** A free localhost port. */
export function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

/** Resolves when `ok()` is true, polling every `every` ms; rejects after `ms` naming `what`. */
export async function until(what, ok, ms = 5000, every = 20) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await ok();
    if (v) return v;
    if (Date.now() > end) throw new Error(`timed out after ${ms} ms waiting for ${what}`);
    await new Promise((r) => setTimeout(r, every));
  }
}

const terminal = (l) => l === "OK" || l.startsWith("OK ") || l.startsWith("ERR");

/** The console's one client: requests answered one at a time, in order. */
class Console {
  constructor(sock) {
    this.sock = sock;
    this.buf = Buffer.alloc(0);
    this.queue = []; // { line, shot, done, lines, body }
    this.current = null;
    this.onSent = () => {};
    sock.on("data", (d) => {
      this.buf = Buffer.concat([this.buf, d]);
      this.drain();
    });
    sock.on("error", () => {});
  }

  /** `line`'s answer: its lines up to and including the OK or ERR. `who` is told when it goes out. */
  ask(line, who = "test") {
    return new Promise((done) => {
      this.queue.push({ line, who, done, lines: [], body: null, shot: /^shot\b/.test(line) });
      this.next();
    });
  }

  next() {
    if (this.current || !this.queue.length) return;
    this.current = this.queue.shift();
    this.onSent(this.current);
    this.sock.write(this.current.line + "\n");
  }

  drain() {
    for (;;) {
      const c = this.current;
      if (!c) return;
      // A shot: its header line, then the frame's bytes, then OK.
      if (c.shot && c.lines.length === 1 && c.lines[0].startsWith("SHOT ") && !c.body) {
        if (this.buf.length < SHOT_BYTES) return;
        c.body = this.buf.subarray(0, SHOT_BYTES);
        this.buf = this.buf.subarray(SHOT_BYTES);
        continue;
      }
      const i = this.buf.indexOf(10);
      if (i < 0) return;
      const l = this.buf.subarray(0, i).toString("utf8").replace(/\r$/, "");
      this.buf = this.buf.subarray(i + 1);
      c.lines.push(l);
      if (terminal(l) && !(c.shot && l.startsWith("SHOT "))) {
        this.current = null;
        c.done(c);
        this.next();
      }
    }
  }
}

/** The firmware checkout: CHIMERA_DIR, else ./firmware, else ../chimera (from the repository's root). */
export function firmwareDir(root) {
  if (process.env.CHIMERA_DIR) return path.resolve(process.env.CHIMERA_DIR);
  const inRepo = path.join(root, "firmware");
  return fs.existsSync(inRepo) ? inRepo : path.resolve(root, "..", "chimera");
}

/** chimera-desktop headless, and its console's client. `stop()` ends both and removes the card. */
export async function startUnit(root) {
  const fw = firmwareDir(root);
  // `just e2e` builds it in the firmware's utils profile (release, no LTO); E2E_PROFILE picks another.
  const bin = path.join(fw, "target", process.env.E2E_PROFILE ?? "utils", "chimera-desktop");
  if (!fs.existsSync(bin)) throw new Error(`no ${bin}: \`just e2e\` builds it`);
  const port = await freePort();
  const card = fs.mkdtempSync(path.join(os.tmpdir(), "chimera-e2e-card-"));
  const log = [];
  const proc = spawn(bin, [], {
    cwd: card,
    env: {
      ...process.env,
      CHIMERA_HEADLESS: "1",
      CHIMERA_CONSOLE: `127.0.0.1:${port}`,
      CHIMERA_CARD: card,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const s of [proc.stdout, proc.stderr]) s.on("data", (d) => log.push(String(d)));
  let exited = null;
  proc.on("exit", (code, sig) => (exited = `exited ${code ?? sig}`));

  const sock = await until("the simulator's console", () =>
    exited
      ? Promise.reject(new Error(`chimera-desktop ${exited}: ${log.join("")}`))
      : new Promise((res) => {
          const s = net.connect(port, "127.0.0.1");
          s.once("connect", () => res(s));
          s.once("error", () => res(null));
        }),
    20000, 50);
  const con = new Console(sock);
  // The console answers once the boot is done.
  const hello = await con.ask("ed hello");
  if (!/^ed hello \d+ /.test(hello.lines[0] ?? "")) throw new Error(`ed hello: ${hello.lines.join(" | ")}`);

  const unit = {
    con,
    log,
    /** The answer's lines, the terminal one last. */
    async ask(line) {
      return (await con.ask(line)).lines;
    },
    /** `ask`, and it must end OK. */
    async ok(line) {
      const got = await unit.ask(line);
      if (!got.at(-1).startsWith("OK")) throw new Error(`${line}: ${got.join(" | ")}`);
      return got;
    },
    /** The screen's framebuffer, RGB565 big-endian, as the panel holds it (`shot raw`). */
    async shot() {
      const c = await con.ask("shot raw");
      if (!c.body || c.lines.at(-1) !== "OK") throw new Error(`shot raw: ${c.lines.join(" | ")}`);
      return Buffer.from(c.body);
    },
    /** `ed get <addr>`: { norm, stored, text }. */
    async get(addr) {
      const got = await unit.ask(`ed get ${addr}`);
      const t = tokens(got[0] ?? "");
      if (t[0] !== "val" || t[1] !== addr) throw new Error(`ed get ${addr}: ${got.join(" | ")}`);
      return { norm: Number(t[2]), stored: Number(t[3]), text: t[4] };
    },
    /** `status`'s `at` line, less the word. */
    async at() {
      return ((await unit.ask("status")).find((l) => l.startsWith("at ")) ?? "").slice(3);
    },
    async stop() {
      sock.destroy();
      proc.kill("SIGKILL");
      await new Promise((r) => (exited ? r() : proc.once("exit", r)));
      fs.rmSync(card, { recursive: true, force: true });
    },
  };
  return unit;
}

/** The protocol's words: a "quoted" run is one (Protocol.elm's grammar). */
export function tokens(s) {
  const out = [];
  const re = /"((?:[^"]|"(?! |$))*)"(?= |$)|(\S+)/g;
  for (let m; (m = re.exec(s)); ) out.push(m[1] ?? m[2]);
  return out;
}
