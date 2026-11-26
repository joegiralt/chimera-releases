// SPDX-License-Identifier: GPL-3.0-or-later
// A fake firmware for the update's tests, in the bridge (`flow.intercept`):
// the console verbs the simulator doesn't build (`put` to bank 2's staging
// path, `dfu`, `bank2`, `bank2 install`) and a `status` that names its
// version, as the real unit answers them; every other line goes on to the
// simulator. `dfu` takes the console off the bus and plugs the page's fake
// DFU device in; the image the page writes there (`flashed`) becomes the
// running firmware if it is the release's CHIMERA.BIN, and the first boot
// installs a staged .bk2 sealed for it, as the real one does.
import { createRequire } from "node:module";

const { crc32 } = createRequire(import.meta.url)("./fakerelease.cjs");

/** The 0.2 firmware's `put` usage line: it refuses bank 2's path. */
export const OLD_PUT = "ERR put takes /CHIMERA/PROJECTS/P#######.A or /CHIMERA/SOUNDS/S#######.A [--over], its size and CRC-32 in hex";

export class FakeFirmware {
  /** `bridge`, the `page` (its fake DFU device), the `release` it may be updated to;
   * the unit's `build` and `bank2`, its project `state`, `old` (firmware before bank 2). */
  constructor({ bridge, page, release, build = "0.4.0 de07edf9", bank2 = "open 0.4.0 de07edf9 seal=ffffffffffffffff", state = "SAVED", old = false, dfuSilent = false, selfUpdate = false, selfAbort = null, selfRefuse = null, unit = null, unitAfter = null, dropInstallReply = false }) {
    Object.assign(this, { bridge, page, release, build, bank2, state, old, dfuSilent, selfUpdate, selfAbort, selfRefuse, unit, unitAfter, dropInstallReply });
    this.cardBin = null; // /CHIMERA.BIN on the card's root
    this.bank1Last = null;
    this.putting = null; // { size, crc, data: [] } while a put's lines come
    this.staged = null; // the .bk2 on the card
    this.unplugAt = null; // bytes of a put after which the cable is pulled
    this.updating = false; // an update has the link (status asked, no greeting since)
    this.log = [];
    this.handle = this.handle.bind(this);
  }

  install() {
    this.bridge.flow.intercept = this.handle;
    return this;
  }

  status() {
    // `unit <uid>` after `selfupdate 1`, before `bank1 last` (ADR 0344).
    const id = this.unit ? [`unit ${this.unit}`] : [];
    const self = this.selfUpdate ? ["selfupdate 1", ...id, ...(this.bank1Last ? [`bank1 last ${this.bank1Last}`] : [])] : id;
    return [`firmware ${this.build.split(" ")[0]} release`, `build ${this.build}`, "protocol 4", "project FAKE", `state ${this.state}`, "part 1", `bank2 ${this.bank2}`, ...self, "OK"];
  }

  /** `bank1 install <size> <crc>` (ADR 0344): CHIMERA.BIN on the card's root
   * checked against them; then the unit writes its own bank 1 and restarts
   * (`selfAbort`: it gives up and starts the old firmware, untouched;
   * `selfRefuse`: ERR, nothing written). */
  bank1Install(size, crc) {
    const bin = this.cardBin;
    if (this.selfRefuse) return [`ERR bank1: ${this.selfRefuse}`];
    if (!bin || bin.length !== size || crc32(bin) !== crc) return ["ERR bank1: /CHIMERA.BIN is not that size and CRC"];
    if (this.build === this.release.version && bin.equals(this.release.bin)) return ["OK already installed"];
    const crc8 = crc.toString(16).padStart(8, "0");
    this.bridge.down = true;
    // dropInstallReply: the unit hands off before its OK reaches the editor
    // (it resets USB ~20 ms after replying): no answer, the port gone.
    setTimeout(() => this.bridge.hangUp(), this.dropInstallReply ? 5 : 30);
    setTimeout(() => {
      if (this.selfAbort) {
        this.bank1Last = `aborted ${this.selfAbort}`;
      } else {
        this.flashedSelf(bin);
        this.bank1Last = `ok ${crc8}`;
      }
      this.bridge.down = false;
    }, 600);
    return this.dropInstallReply ? [] : [`OK bank1 verified ${size} ${crc8}, restarting`];
  }

  /** Its own bank 1 written: it boots it, and the boot installs a staged .bk2 sealed for it. */
  flashedSelf(img) {
    this.log.push(`self ${img.length}`);
    if (img.equals(this.release.bin)) {
      this.build = this.release.version;
      if (this.staged?.equals(this.release.bk2) || this.bank2 === `open ${this.release.version} seal=${this.release.seal}`) this.bank2 = `open ${this.release.version} seal=${this.release.seal}`;
      else this.bank2 = "empty";
      this.state = "NEW";
    }
  }

  /** The unit off the bus for `ms`, then back. */
  restart(ms = 300) {
    this.bridge.down = true;
    setTimeout(() => this.bridge.hangUp(), 30);
    setTimeout(() => (this.bridge.down = false), ms);
  }

  handle(line) {
    if (this.putting) return this.data(line);
    // The editor's own greeting: the update is over; its polls go to the simulator.
    if (line === "ed hello") this.updating = false;
    // While an update owns the link (it asks status first), `ed since` names the
    // loaded project, so unsaved changes can be saved or dropped.
    if (this.updating && /^ed since \d+$/.test(line) && this.state === "MODIFIED") return [`project "MY SONG" 3 edited gen 7`, "OK 9"];
    if (!this.updating && !/^(status|put |dfu|bank1|bank2)/.test(line)) return null;
    this.log.push(line);
    const words = line.split(" ");
    if (line === "status") {
      this.updating = true;
      return this.status();
    }
    if (line === "ed project save" || line === "ed project load 3 7 discard") {
      this.state = "SAVED";
      return ["OK"];
    }
    if (words[0] === "put" && words[1] === "/CHIMERA/SYSTEM/BANK2.BK2") {
      if (this.old) return [OLD_PUT];
      this.putting = { size: Number(words[2]), crc: parseInt(words[3], 16), data: [], bytes: 0, to: "staged" };
      return ["READY"];
    }
    if (words[0] === "put" && words[1] === "/CHIMERA.BIN" && this.selfUpdate) {
      this.putting = { size: Number(words[2]), crc: parseInt(words[3], 16), data: [], bytes: 0, to: "cardBin" };
      return ["READY"];
    }
    if (words[0] === "bank1" && words[1] === "install" && this.selfUpdate) return this.bank1Install(Number(words[2]), parseInt(words[3], 16));
    if (line === "dfu" && this.dfuSilent) {
      // A unit that went to update mode without a word: its console goes
      // only after the editor has given up waiting for one.
      setTimeout(() => {
        this.bridge.down = true;
        this.bridge.hangUp();
        this.page.evaluate(() => window.__usb.plug()).catch(() => {});
      }, 2500);
      return [];
    }
    if (line === "dfu") {
      this.bridge.down = true;
      setTimeout(() => {
        this.bridge.hangUp();
        this.page.evaluate(() => window.__usb.plug()).catch(() => {});
      }, 30);
      return ["OK"];
    }
    if (line === "bank2") return [`bank2 ${this.bank2}`, "OK"];
    if (line === "bank2 install") {
      if (!this.staged) return ["ERR bank2: nothing staged"];
      const wanted = this.release.version;
      if (this.build !== wanted) return [`ERR bank2: staged: needs firmware ${wanted}`];
      if (this.bank2 === `open ${wanted} seal=${this.release.seal}`) return ["OK already installed"];
      this.bank2 = `open ${wanted} seal=${this.release.seal}`;
      this.restart();
      return ["audio stopped 800 ms", `OK bank2 open ${wanted}`];
    }
    return null;
  }

  data(line) {
    const putting = this.putting;
    const chunk = Buffer.from(line, "base64");
    putting.data.push(chunk);
    putting.bytes += chunk.length;
    if (this.unplugAt !== null && putting.bytes >= this.unplugAt) {
      this.unplugAt = null;
      this.putting = null;
      this.bridge.hangUp();
      return [];
    }
    if (putting.bytes < putting.size) return [];
    this.putting = null;
    const all = Buffer.concat(putting.data);
    if (all.length !== putting.size || crc32(all) !== putting.crc) return ["ERR put: CRC mismatch"];
    this[putting.to] = all;
    return ["OK"];
  }

  /** The page's DFU device left with `image` at 0x08020000: the unit boots it. */
  flashed(image) {
    // Another unit answers after the restart (unitAfter): the test's other board.
    if (this.unitAfter) this.unit = this.unitAfter;
    const img = Buffer.from(image);
    this.log.push(`flashed ${img.length}`);
    if (img.equals(this.release.bin)) {
      this.build = this.release.version;
      this.old = false;
      // The first boot installs a staged .bk2 sealed for this firmware.
      if (this.staged?.equals(this.release.bk2)) this.bank2 = `open ${this.release.version} seal=${this.release.seal}`;
      else this.bank2 = "empty";
      this.state = "NEW";
    } else {
      this.build = "garbage";
    }
    setTimeout(() => (this.bridge.down = false), 300);
  }

  /** The unit powered off and on in update mode's place: the console off
   * the bus, then back (its firmware whatever was written last). */
  powerCycle(image) {
    this.bridge.down = true;
    this.bridge.hangUp();
    this.flashed(image);
  }
}

/** The release's files served where the editor looks for the latest
 * (`../firmware/preenfm3/latest/`, from the editor at the bridge's root);
 * `sums` overrides SHA256SUMS. */
export function serveRelease(bridge, served, { sums = served.sums } = {}) {
  const at = "/firmware/preenfm3/latest/";
  bridge.files.clear();
  bridge.files.set(at + "manifest.json", Buffer.from(JSON.stringify(served.manifest)));
  bridge.files.set(at + "CHIMERA.BIN", served.bin);
  bridge.files.set(at + "CHIMERA.BK2", served.bk2);
  bridge.files.set(at + "SHA256SUMS", Buffer.from(sums));
}
