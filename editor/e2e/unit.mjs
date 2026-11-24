// SPDX-License-Identifier: GPL-3.0-or-later
// The unit for the end-to-end tests: chimera-desktop headless (no window, no
// audio device, no MIDI port) on a card of its own, its console on a free
// localhost port; or, with UNIT set, the real unit's USB console (UNIT=/dev/
// ttyACM<n>, or UNIT=auto: /dev/chimera, else the one tty with the console's
// USB id 0483:5740 that answers `status` as Chimera). Either way one client to
// that console, that every request goes through, the editor's included (the
// console takes one client at a time). On the real unit a guard refuses the
// verbs that could harm it (`refusedOnUnit`), and every wait is longer.

import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import tty from "node:tty";

export const SHOT_BYTES = 240 * 320 * 2;

/** The real unit's console, when the run is against it: `/dev/ttyACM<n>` or `auto`. */
export const UNIT = process.env.UNIT ?? "";

/** Every wait stretches this much on the real unit: USB serial is slower than the simulator's socket. */
export const SLOW = UNIT ? 4 : 1;

/** Console verbs that write the unit's flash or its card's files, or reboot it:
 * never sent to a real unit. `card` only with `clean`. */
const NEVER_ON_UNIT = ["dfu", "rm", "put", "bank2", "sweep", "flash", "update", "format", "reboot", "reset", "fault"];

/** The verb `line` would run that the guard refuses on a real unit, or null. */
export function refusedOnUnit(line) {
  const w = line.trim().toLowerCase().split(/\s+/);
  if (NEVER_ON_UNIT.includes(w[0])) return w[0];
  if (w[0] === "card" && w[1] === "clean") return "card clean";
  return null;
}

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

/** Resolves when `ok()` is true, polling every `every` ms; rejects after `ms`
 * (times SLOW on the real unit) naming `what`. */
export async function until(what, ok, ms = 5000, every = 20) {
  ms *= SLOW;
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
export class Console {
  /** `guard`: refuse `refusedOnUnit`'s verbs, answering ERR without sending them. */
  constructor(sock, guard = false) {
    this.sock = sock;
    this.guard = guard;
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
    if (this.dead) return Promise.resolve({ line, who, lines: [], body: null });
    const no = this.guard && refusedOnUnit(line);
    if (no) {
      console.error(`e2e: refused on the unit, never sent: ${line}`);
      return Promise.resolve({ line, who, lines: [`ERR e2e refuses ${no} on a real unit`], body: null });
    }
    return new Promise((done) => {
      this.queue.push({ line, who, done, lines: [], body: null, shot: /^shot\b/.test(line) });
      this.next();
    });
  }

  /** The console gone (its unit restarted): every request waiting is answered with nothing. */
  fail() {
    this.dead = true;
    const all = [this.current, ...this.queue].filter(Boolean);
    this.current = null;
    this.queue = [];
    for (const c of all) c.done({ ...c, lines: [], body: null });
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

/** The real unit's console tty: UNIT, or for `auto` /dev/chimera (the udev
 * rule's link), else the one ttyACM whose USB id is the console's. */
function unitPort() {
  if (UNIT !== "auto") return UNIT;
  if (fs.existsSync("/dev/chimera")) return "/dev/chimera";
  const read = (f) => fs.readFileSync(f, "utf8").trim();
  const ports = fs.readdirSync("/sys/class/tty").filter((n) => /^ttyACM\d+$/.test(n)).filter((n) => {
    try {
      // The tty's device is the USB interface; its parent holds the ids.
      const usb = path.dirname(fs.realpathSync(`/sys/class/tty/${n}/device`));
      return read(path.join(usb, "idVendor")) === "0483" && read(path.join(usb, "idProduct")) === "5740";
    } catch {
      return false;
    }
  });
  if (ports.length !== 1) throw new Error(`UNIT=auto: ${ports.length ? `several consoles (${ports.join(", ")}): set UNIT=/dev/<one>` : "no tty with the console's USB id 0483:5740"}`);
  return `/dev/${ports[0]}`;
}

/** The tty in raw mode (no echo, no line discipline), as the console client's socket. */
function openTty(p) {
  const fd = fs.openSync(p, fs.constants.O_RDWR | fs.constants.O_NOCTTY);
  if (!tty.isatty(fd)) {
    fs.closeSync(fd);
    throw new Error(`${p} is no tty`);
  }
  const rs = new tty.ReadStream(fd);
  rs.setRawMode(true);
  return {
    on: (ev, f) => rs.on(ev, f),
    off: (ev, f) => rs.off(ev, f),
    // In order: one request is on the wire at a time, and each is a short line.
    write(s) {
      const b = Buffer.from(s);
      for (let at = 0; at < b.length; ) {
        try {
          at += fs.writeSync(fd, b, at);
        } catch (e) {
          if (e.code !== "EAGAIN") throw e;
        }
      }
    },
    destroy: () => rs.destroy(),
  };
}

/** Resolves once `src` has been quiet `ms` (a stalled earlier answer's tail dropped), at most `cap` ms. */
function quiet(src, ms = 100, cap = 3000) {
  return new Promise((done) => {
    const end = Date.now() + cap;
    let t;
    const arm = () => {
      clearTimeout(t);
      t = setTimeout(stop, Math.max(0, Math.min(ms, end - Date.now())));
    };
    const stop = () => {
      src.off("data", arm);
      done();
    };
    src.on("data", arm);
    arm();
  });
}

/** The real unit over USB, and its console's client. `stop()` closes the port; the unit is left as it is. */
async function startRealUnit() {
  const p = unitPort();
  const port = openTty(p);
  port.on("error", () => {});
  await quiet(port);
  const con = new Console(port, true);
  const status = await con.ask("status");
  if (!status.lines.some((l) => l.startsWith("firmware "))) throw new Error(`${p} doesn't answer as Chimera: ${status.lines.join(" | ")}`);
  const hello = await con.ask("ed hello");
  if (!/^ed hello \d+ /.test(hello.lines[0] ?? "")) throw new Error(`ed hello: ${hello.lines.join(" | ")}`);
  return withAsks(con, [], {
    real: true,
    async stop() {
      port.destroy();
    },
  });
}

/** The simulator, else (UNIT set) the real unit. */
export function startUnit(root) {
  return UNIT ? startRealUnit() : startSimulator(root);
}

/** chimera-desktop headless, and its console's client. `stop()` ends both
 * and removes the card; `restart()` kills it and boots it again on the same
 * card, a new console behind the same `unit` (a reboot behind a live link). */
async function startSimulator(root) {
  const fw = firmwareDir(root);
  // `just e2e` builds it in the firmware's utils profile (release, no LTO); E2E_PROFILE picks another.
  const bin = path.join(fw, "target", process.env.E2E_PROFILE ?? "utils", "chimera-desktop");
  if (!fs.existsSync(bin)) throw new Error(`no ${bin}: \`just e2e\` builds it`);
  const card = fs.mkdtempSync(path.join(os.tmpdir(), "chimera-e2e-card-"));
  const log = [];
  let proc;
  let sock;
  let exited = null;

  let port;
  /** The console's client, on a socket of its own. */
  const dial = async () => {
    sock = await until("the simulator's console", () =>
      exited
        ? Promise.reject(new Error(`chimera-desktop ${exited}: ${log.join("")}`))
        : new Promise((res) => {
            const s = net.connect(port, "127.0.0.1");
            s.once("connect", () => res(s));
            s.once("error", () => res(null));
          }),
      20000, 50);
    return new Console(sock);
  };
  const boot = async () => {
    port = await freePort();
    exited = null;
    proc = spawn(bin, [], {
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
    const me = proc;
    proc.on("exit", (code, sig) => {
      if (me === proc) exited = `exited ${code ?? sig}`;
    });
    const con = await dial();
    // The console answers once the boot is done.
    const hello = await con.ask("ed hello");
    if (!/^ed hello \d+ /.test(hello.lines[0] ?? "")) throw new Error(`ed hello: ${hello.lines.join(" | ")}`);
    return con;
  };
  const kill = async () => {
    const p = proc;
    sock.destroy();
    p.kill("SIGKILL");
    await new Promise((r) => (p.exitCode !== null || p.signalCode !== null ? r() : p.once("exit", r)));
  };

  const unit = withAsks(await boot(), log, {
    real: false,
    // The simulator's card: a test may plant files on it (never on a real unit's).
    card,
    /** The console's address, for another client (the firmware's ed-bridge) while `hangUp()` has let it go. */
    consoleAddr: () => `127.0.0.1:${port}`,
    /** The test's client off the console (it takes one client at a time). */
    async hangUp() {
      sock.destroy();
      unit.con.fail();
    },
    /** The test's client back on the console. */
    async redial() {
      unit.con = await dial();
      await unit.con.ask("ed hello");
    },
    async restart() {
      const old = unit.con;
      await kill();
      old.fail();
      unit.con = await boot();
    },
    async stop() {
      await kill();
      unit.con.fail();
      fs.rmSync(card, { recursive: true, force: true });
    },
  });
  return unit;
}

/** The tests' requests on `con`, and `own` (`real`, `stop`). */
function withAsks(con, log, own) {
  const unit = {
    con,
    log,
    ...own,
    /** The answer's lines, the terminal one last. A unit busy with its card is asked again. */
    async ask(line) {
      let lines;
      await until(`${line} answered but busy`, async () => {
        lines = (await unit.con.ask(line)).lines;
        return lines.at(-1) !== "ERR busy";
      }, 20000, 200);
      return lines;
    },
    /** `ask`, and it must end OK. */
    async ok(line) {
      const got = await unit.ask(line);
      if (!got.at(-1).startsWith("OK")) throw new Error(`${line}: ${got.join(" | ")}`);
      return got;
    },
    /** The screen's framebuffer, RGB565 big-endian, as the panel holds it (`shot raw`). */
    async shot() {
      const c = await unit.con.ask("shot raw");
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
  };
  return unit;
}

/** The protocol's words: a "quoted" run is one (Protocol.elm's grammar). */
export function tokens(s) {
  const out = [];
  // A quoted field's escapes (ADR 0336): \\ a backslash, \" a quote, \xHH a control byte, \xC2\xHH a C1 control.
  const re = /"((?:[^"\\]|\\\\|\\"|\\x[0-9A-F]{2})*)"(?= |$)|(\S+)/g;
  const unescape = (q) => q.replace(/\\(\\|"|x(?:C2\\x)?([0-9A-F]{2}))/g, (_, e, h) => (h ? String.fromCharCode(parseInt(h, 16)) : e));
  for (let m; (m = re.exec(s)); ) out.push(m[1] !== undefined ? unescape(m[1]) : m[2]);
  return out;
}
