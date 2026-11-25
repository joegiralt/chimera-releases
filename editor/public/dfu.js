// SPDX-License-Identifier: GPL-3.0-or-later
// CHIMERA.BIN into the PreenFM3's firmware area over WebUSB, by ST's DfuSe
// (the STM32 loader's DFU, 0483:df11): written here from the USB DFU 1.1
// class spec and ST's AN3156, no code taken from another writer. The leave
// (set the address, an empty download, a status) is dfu-util's `:leave`, the
// one `chimera-usb.py update` and the install guide use.
//
// The bootloader is never touched. Every address the writer can put on the
// wire is a `FirmwareAddress`, which can't be made below 0x08020000 or past
// the firmware area; the two commands that take an address take only one;
// a mass erase has no builder at all; and the last step before the wire
// checks every command block again. It erases only the 128 KB sectors the
// image covers, from 0x08020000 up. No write has a timeout: a wait for the
// unit to answer is the unit's own poll time, so nothing cuts a write half
// way; a pulled cable ends it, and says so.
var ChimeraDfu = (function () {
  var BASE = 0x08020000; // the firmware area: the bootloader is below it
  var AREA = 917504; // the stock bootloader erases itself at an image this big
  var SECTOR = 0x20000; // STM32H7: 128 KB sectors
  var ID = { vendorId: 0x0483, productId: 0xdf11 };

  // DFU 1.1 requests and states.
  var DNLOAD = 1, GETSTATUS = 3, CLRSTATUS = 4, ABORT = 6;
  var IDLE = 2, DNLOAD_SYNC = 3, DNBUSY = 4, DNLOAD_IDLE = 5, MANIFEST = 7, ERROR = 10;
  // DfuSe commands, on block 0.
  var SET_ADDRESS = 0x21, ERASE = 0x41;

  /** A refusal of the writer's guards: nothing went on the wire. */
  function Guard(msg) { var e = new Error(msg); e.guard = true; return e; }

  /** An address in the firmware area: the only kind the writer sends. */
  function FirmwareAddress(n) {
    if (!(this instanceof FirmwareAddress)) return new FirmwareAddress(n);
    if (!Number.isInteger(n) || n < BASE || n >= BASE + AREA) {
      throw Guard('refused: 0x' + (n >>> 0).toString(16) + ' is outside the firmware area (0x08020000 up); the bootloader is never written');
    }
    this.value = n;
    Object.freeze(this);
  }

  function le32(op, a) {
    var v = a.value;
    return new Uint8Array([op, v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]);
  }

  function setAddress(a) {
    if (!(a instanceof FirmwareAddress)) throw Guard('refused: set address takes a firmware address');
    return le32(SET_ADDRESS, a);
  }

  /** One sector's erase: the sector starting at `a`, never a mass erase. */
  function eraseSector(a) {
    if (!(a instanceof FirmwareAddress)) throw Guard('refused: erase takes a firmware address');
    if ((a.value - BASE) % SECTOR !== 0) throw Guard('refused: an erase starts on a sector');
    return le32(ERASE, a);
  }

  /** The last look before the wire: a command block is a set address or a
   * sector erase, five bytes, at a firmware address. A one-byte 0x41 (mass
   * erase) or anything else is refused. */
  function checkCommand(bytes) {
    if (bytes.length !== 5 || (bytes[0] !== SET_ADDRESS && bytes[0] !== ERASE)) throw Guard('refused: not a set address or a sector erase');
    var at = (bytes[1] | (bytes[2] << 8) | (bytes[3] << 16) | (bytes[4] << 24)) >>> 0;
    FirmwareAddress(at);
    return bytes;
  }

  /** The image as a Chimera firmware for 0x08020000, or a Guard: under the
   * bootloader's limit, not a .bk2, and its reset vector inside it. */
  function checkImage(img) {
    if (!(img instanceof Uint8Array) || img.length < 8) throw Guard('refused: not a firmware image');
    if (img.length >= AREA) throw Guard('refused: ' + img.length + ' bytes is too big for the firmware area (' + AREA + ' at most, less one)');
    if (String.fromCharCode.apply(null, img.subarray(0, 8)) === 'CHIMERA2') throw Guard('refused: that is CHIMERA.BK2, not CHIMERA.BIN');
    var reset = (img[4] | (img[5] << 8) | (img[6] << 16) | (img[7] << 24)) >>> 0;
    if (!(reset & 1) || reset < BASE || reset >= BASE + img.length) throw Guard('refused: not a firmware image for 0x08020000');
    return img;
  }

  /** What a write of `length` bytes at `at` does: the sectors it erases
   * and the blocks it writes, every address a FirmwareAddress. */
  function plan(at, length, block) {
    var start = FirmwareAddress(at);
    if (start.value !== BASE) throw Guard('refused: the firmware goes at 0x08020000 only');
    if (!(length > 0) || length >= AREA) throw Guard('refused: ' + length + ' bytes does not fit the firmware area');
    var erase = [];
    for (var s = 0; s < length; s += SECTOR) erase.push(FirmwareAddress(BASE + s));
    var blocks = [];
    for (var o = 0; o < length; o += block) blocks.push({ at: FirmwareAddress(BASE + o), from: o, to: Math.min(length, o + block) });
    return { erase: erase, blocks: blocks };
  }

  /** The PreenFM3's chip, an STM32H750 as its ROM loader names it: internal
   * flash at 0x08000000, sixteen 128 KB sectors. An F4, F7 or anything else
   * (another board in DFU mode) is not written. */
  var H7 = /^@Internal Flash\s*\/0x08000000\/16\*128K[a-g]?\s*$/i;
  function isH7(name) { return H7.test(name || ''); }

  /** "@Internal Flash  /0x08000000/16*128Kg" as [{ at, size, count }]. */
  function layout(name) {
    var m = /^@[^/]*\/0x([0-9a-f]+)\/(.*)$/i.exec(name || '');
    if (!m) return null;
    var at = parseInt(m[1], 16), out = [];
    var parts = m[2].split(',');
    for (var i = 0; i < parts.length; i++) {
      var p = /^\s*(\d+)\*(\d+)\s*([KMB ]?)\s*([a-g]?)\s*$/i.exec(parts[i]);
      if (!p) return null;
      var unit = { K: 1024, M: 1048576 }[p[3].toUpperCase()] || 1;
      var size = Number(p[2]) * unit, count = Number(p[1]);
      out.push({ at: at, size: size, count: count });
      at += size * count;
    }
    return out;
  }

  /** Every sector to erase lies in a 128 KB run of the device's layout. */
  function layoutFits(segs, erase) {
    return erase.every(function (a) {
      return segs.some(function (s) { return s.size === SECTOR && a.value >= s.at && a.value + SECTOR <= s.at + s.size * s.count && (a.value - s.at) % SECTOR === 0; });
    });
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // The DFU interface: class FE, subclass 01, its first alternate (alt 0, the internal flash).
  function dfuInterface(dev) {
    var ifs = dev.configuration ? dev.configuration.interfaces : [];
    for (var i = 0; i < ifs.length; i++) {
      var alts = ifs[i].alternates;
      for (var j = 0; j < alts.length; j++) {
        var a = alts[j];
        if (a.interfaceClass === 0xfe && a.interfaceSubclass === 0x01 && a.alternateSetting === 0) return { number: ifs[i].interfaceNumber, alt: a };
      }
    }
    return null;
  }

  /** The DFU functional descriptor's wTransferSize, or a Guard: never a guess. */
  async function transferSize(dev) {
    try {
      var head = await dev.controlTransferIn({ requestType: 'standard', recipient: 'device', request: 6, value: 0x0200, index: 0 }, 9);
      var total = head.data.getUint16(2, true);
      var all = await dev.controlTransferIn({ requestType: 'standard', recipient: 'device', request: 6, value: 0x0200, index: 0 }, total);
      var d = all.data;
      for (var at = 0; at + 1 < d.byteLength; ) {
        var len = d.getUint8(at);
        if (len < 2) break;
        if (d.getUint8(at + 1) === 0x21 && len >= 7) {
          var size = d.getUint16(at + 5, true);
          if (size >= 64 && size <= 4096) return size;
        }
        at += len;
      }
    } catch (e) { /* refused below */ }
    throw Guard('refused: the device\'s DFU descriptor (its transfer size) could not be read; nothing was written');
  }

  /** The device, opened and its DFU interface claimed. A device that can't
   * be opened (Windows without WinUSB, a Linux node without access, another
   * program holding it) rejects with `unopenable`. */
  async function open(dev) {
    try {
      if (!dev.opened) await dev.open();
      if (!dev.configuration) await dev.selectConfiguration(1);
      var f = dfuInterface(dev);
      if (!f) throw Guard('this USB device has no DFU interface');
      await dev.claimInterface(f.number);
      await dev.selectAlternateInterface(f.number, 0);
      return f;
    } catch (e) {
      try { await dev.close(); } catch (x) {}
      if (e && e.guard) throw e;
      var err = new Error((e && e.message) || String(e));
      err.unopenable = true;
      throw err;
    }
  }

  /** The configuration descriptor, whole (standard GET_DESCRIPTOR). */
  async function configDescriptor(dev) {
    var get = function (n) { return dev.controlTransferIn({ requestType: 'standard', recipient: 'device', request: 6, value: 0x0200, index: 0 }, n); };
    var head = await get(9);
    return (await get(head.data.getUint16(2, true))).data;
  }

  /** The DFU alternate's name: WebUSB's interfaceName, or (null there, as
   * Chrome on Windows may leave it) its string descriptor, read here. */
  async function altName(dev, f) {
    if (f.alt.interfaceName) return f.alt.interfaceName;
    try {
      var d = await configDescriptor(dev);
      var index = 0;
      for (var at = 0; at + 9 <= d.byteLength; ) {
        var len = d.getUint8(at);
        if (len < 2) break;
        if (d.getUint8(at + 1) === 4 && d.getUint8(at + 2) === f.number && d.getUint8(at + 3) === 0) index = d.getUint8(at + 8);
        at += len;
      }
      if (!index) return null;
      var str = function (value, lang, n) { return dev.controlTransferIn({ requestType: 'standard', recipient: 'device', request: 6, value: value, index: lang }, n); };
      var langs = (await str(0x0300, 0, 255)).data;
      var lang = langs.byteLength >= 4 ? langs.getUint16(2, true) : 0x0409;
      var s = (await str(0x0300 | index, lang, 255)).data;
      var out = '';
      for (var i = 2; i + 1 < Math.min(s.byteLength, s.getUint8(0)); i += 2) out += String.fromCharCode(s.getUint16(i, true));
      return out || null;
    } catch (e) {
      return null;
    }
  }

  function link(dev, iface) {
    var setup = function (request, value) { return { requestType: 'class', recipient: 'interface', request: request, value: value, index: iface }; };
    var out = async function (request, value, data) {
      var r = await dev.controlTransferOut(setup(request, value), data);
      if (r.status !== 'ok') throw new Error('the device stalled a request');
    };
    return {
      status: async function () {
        var r = await dev.controlTransferIn(setup(GETSTATUS, 0), 6);
        if (r.status !== 'ok' || !r.data || r.data.byteLength < 6) throw new Error('the device stalled its status');
        var d = r.data;
        return { status: d.getUint8(0), poll: d.getUint8(1) | (d.getUint8(2) << 8) | (d.getUint8(3) << 16), state: d.getUint8(4) };
      },
      clear: function () { return out(CLRSTATUS, 0, new Uint8Array(0)); },
      abort: function () { return out(ABORT, 0, new Uint8Array(0)); },
      // Block 0 carries a command, checked once more; block 2 data.
      command: function (bytes) { return out(DNLOAD, 0, checkCommand(bytes)); },
      data: function (bytes) { return out(DNLOAD, 2, bytes); },
    };
  }

  /** Until the device has done the last download: its own poll time
   * between asks, however long an erase takes; never a deadline. */
  async function settle(l, what) {
    for (;;) {
      var s = await l.status();
      if (s.status !== 0 || s.state === ERROR) {
        try { await l.clear(); } catch (e) {}
        var err = new Error('the device refused ' + what + ' (status ' + s.status + ')');
        err.refused = true;
        throw err;
      }
      // After a download the spec allows only dfuDNLOAD-SYNC or dfuDNBUSY
      // (wait the device's poll time) and then dfuDNLOAD-IDLE (done).
      if (s.state === DNLOAD_IDLE) return;
      if (s.state === DNBUSY || s.state === DNLOAD_SYNC) {
        await sleep(Math.max(s.poll, 1));
        continue;
      }
      var odd = new Error('the device is in DFU state ' + s.state + ' during ' + what);
      odd.refused = true;
      throw odd;
    }
  }

  /** Back to dfuIDLE from wherever an earlier run left it. */
  async function idle(l) {
    var s = await l.status();
    if (s.state === ERROR) { await l.clear(); s = await l.status(); }
    if (s.state !== IDLE) { await l.abort(); s = await l.status(); }
    if (s.state !== IDLE) {
      var err = new Error('the device will not go idle (state ' + s.state + ')');
      err.refused = true;
      throw err;
    }
  }

  /** `image` (CHIMERA.BIN) written at `at`, which must be 0x08020000: its
   * sectors erased, the blocks written, then the leave that starts it.
   * `progress(done, total)` after each block. Every guard runs before the
   * device is touched. Rejects with `.guard`, `.unopenable`, `.refused` or
   * (anything else: the device went away) `.lost` set. */
  async function write(dev, image, at, progress) {
    checkImage(image);
    plan(at, image.length, 1024); // the guards, before the device is touched
    progress = progress || function () {};
    var f = await open(dev).catch(function (e) { e.started = false; throw e; });
    var name = await altName(dev, f);
    if (!isH7(name)) {
      try { await dev.close(); } catch (e) {}
      throw Object.assign(Guard('refused: this DFU device is not the PreenFM3\'s STM32H7 (its flash: ' + (name || 'not named') + '). Unplug other boards in DFU mode'), { started: false });
    }
    var size = await transferSize(dev);
    var p = plan(at, image.length, size);
    if (!layoutFits(layout(name), p.erase)) {
      try { await dev.close(); } catch (e) {}
      throw Object.assign(Guard('refused: the device lays out its flash as ' + name + ', not 128 KB sectors from 0x08020000'), { started: false });
    }
    var l = link(dev, f.number);
    var total = p.erase.length + p.blocks.length;
    var done = 0;
    var started = false;
    try {
      await idle(l);
      for (var i = 0; i < p.erase.length; i++) {
        started = true;
        await l.command(eraseSector(p.erase[i]));
        await settle(l, 'an erase');
        progress(++done, total);
      }
      for (var j = 0; j < p.blocks.length; j++) {
        var b = p.blocks[j];
        await l.command(setAddress(b.at));
        await settle(l, 'an address');
        await l.data(image.subarray(b.from, b.to));
        await settle(l, 'a write');
        progress(++done, total);
      }
    } catch (e) {
      if (!e.guard && !e.refused) e.lost = true;
      e.started = started;
      throw e;
    }
    try {
      await leave(l, dev);
    } catch (e) {
      // Every block is written: the firmware is in; the unit didn't start it.
      e.leave = true;
      e.started = true;
      throw e;
    }
  }

  /** Start the firmware: the address, an empty download, a status. The
   * device resets under the last two, so their failures are its leaving. */
  async function leave(l, dev) {
    await l.command(setAddress(FirmwareAddress(BASE)));
    await settle(l, 'an address');
    try {
      await l.data(new Uint8Array(0));
      var s = await l.status();
      if (s.state === MANIFEST) await l.status();
    } catch (e) { /* gone: it is starting the firmware */ }
    try { await dev.close(); } catch (e) {}
  }

  /** The browser's chooser for the DFU device (a click's): the device, or
   * null when nothing was picked. */
  async function choose() {
    try {
      return await navigator.usb.requestDevice({ filters: [ID] });
    } catch (e) {
      if (e && e.name === 'NotFoundError') return null;
      throw e;
    }
  }

  return {
    BASE: BASE, AREA: AREA, SECTOR: SECTOR, ID: ID,
    FirmwareAddress: FirmwareAddress, isH7: isH7, setAddress: setAddress, eraseSector: eraseSector, checkCommand: checkCommand,
    checkImage: checkImage, plan: plan, layout: layout, layoutFits: layoutFits,
    write: write, choose: choose,
  };
})();

if (typeof module !== 'undefined') module.exports = ChimeraDfu;
