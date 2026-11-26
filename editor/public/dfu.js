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
  function Guard(msg) { var error = new Error(msg); error.guard = true; return error; }

  /** An address in the firmware area: the only kind the writer sends. */
  function FirmwareAddress(address) {
    if (!(this instanceof FirmwareAddress)) return new FirmwareAddress(address);
    if (!Number.isInteger(address) || address < BASE || address >= BASE + AREA) {
      throw Guard('refused: 0x' + (address >>> 0).toString(16) + ' is outside the firmware area (0x08020000 up); the bootloader is never written');
    }
    this.value = address;
    Object.freeze(this);
  }

  function le32(op, address) {
    var value = address.value;
    return new Uint8Array([op, value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);
  }

  function setAddress(address) {
    if (!(address instanceof FirmwareAddress)) throw Guard('refused: set address takes a firmware address');
    return le32(SET_ADDRESS, address);
  }

  /** One sector's erase: the sector starting at `a`, never a mass erase. */
  function eraseSector(address) {
    if (!(address instanceof FirmwareAddress)) throw Guard('refused: erase takes a firmware address');
    if ((address.value - BASE) % SECTOR !== 0) throw Guard('refused: an erase starts on a sector');
    return le32(ERASE, address);
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
    for (var sectorAt = 0; sectorAt < length; sectorAt += SECTOR) erase.push(FirmwareAddress(BASE + sectorAt));
    var blocks = [];
    for (var blockAt = 0; blockAt < length; blockAt += block) blocks.push({ at: FirmwareAddress(BASE + blockAt), from: blockAt, to: Math.min(length, blockAt + block) });
    return { erase: erase, blocks: blocks };
  }

  /** The PreenFM3's chip, an STM32H750 as its ROM loader names it: internal
   * flash at 0x08000000, sixteen 128 KB sectors. An F4, F7 or anything else
   * (another board in DFU mode) is not written. */
  var H7 = /^@Internal Flash\s*\/0x08000000\/16\*128K[a-g]?\s*$/i;
  function isH7(name) { return H7.test(name || ''); }

  /** "@Internal Flash   /0x08000000/16*128Kg" as [{ at, size, count }]. */
  function layout(name) {
    var match = /^@[^/]*\/0x([0-9a-f]+)\/(.*)$/i.exec(name || '');
    if (!match) return null;
    var at = parseInt(match[1], 16), out = [];
    var parts = match[2].split(',');
    for (var idx = 0; idx < parts.length; idx++) {
      var piece = /^\s*(\d+)\*(\d+)\s*([KMB ]?)\s*([a-g]?)\s*$/i.exec(parts[idx]);
      if (!piece) return null;
      var unit = { K: 1024, M: 1048576 }[piece[3].toUpperCase()] || 1;
      var size = Number(piece[2]) * unit, count = Number(piece[1]);
      out.push({ at: at, size: size, count: count });
      at += size * count;
    }
    return out;
  }

  /** Every sector to erase lies in a 128 KB run of the device's layout. */
  function layoutFits(segs, erase) {
    return erase.every(function (address) {
      return segs.some(function (seg) { return seg.size === SECTOR && address.value >= seg.at && address.value + SECTOR <= seg.at + seg.size * seg.count && (address.value - seg.at) % SECTOR === 0; });
    });
  }

  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  // The DFU interface: class FE, subclass 01, its first alternate (alt 0, the internal flash).
  function dfuInterface(dev) {
    var ifs = dev.configuration ? dev.configuration.interfaces : [];
    for (var idx = 0; idx < ifs.length; idx++) {
      var alts = ifs[idx].alternates;
      for (var altIdx = 0; altIdx < alts.length; altIdx++) {
        var alt = alts[altIdx];
        if (alt.interfaceClass === 0xfe && alt.interfaceSubclass === 0x01 && alt.alternateSetting === 0) return { number: ifs[idx].interfaceNumber, alt: alt };
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
      var data = all.data;
      for (var at = 0; at + 1 < data.byteLength; ) {
        var len = data.getUint8(at);
        if (len < 2) break;
        if (data.getUint8(at + 1) === 0x21 && len >= 7) {
          var size = data.getUint16(at + 5, true);
          if (size >= 64 && size <= 4096) return size;
        }
        at += len;
      }
    } catch (error) { /* refused below */ }
    throw Guard('refused: the device\'s DFU descriptor (its transfer size) could not be read; nothing was written');
  }

  /** The device, opened and its DFU interface claimed. A device that can't
   * be opened (Windows without WinUSB, a Linux node without access, another
   * program holding it) rejects with `unopenable`. */
  async function open(dev, claimMs) {
    var held = false;
    try {
      if (!dev.opened) await dev.open();
      if (!dev.configuration) await dev.selectConfiguration(1);
      var iface = dfuInterface(dev);
      if (!iface) throw Guard('this USB device has no DFU interface');
      // fwupd (Linux) claims every new 0483:df11 for a moment, and a claim
      // then fails busy: try again every 250 ms for the window. Nothing has
      // been written yet, so the retries are safe.
      for (var end = Date.now() + claimMs; ; ) {
        try {
          await dev.claimInterface(iface.number);
          await dev.selectAlternateInterface(iface.number, 0);
          return iface;
        } catch (error) {
          held = true;
          if (Date.now() >= end) throw error;
          await sleep(250);
        }
      }
    } catch (error) {
      try { await dev.close(); } catch (closeError) {}
      if (error && error.guard) throw error;
      var err = new Error((error && error.message) || String(error));
      err.unopenable = true;
      // Opened, but its interface never came free: another program holds it.
      err.held = held;
      throw err;
    }
  }

  /** The configuration descriptor, whole (standard GET_DESCRIPTOR). */
  async function configDescriptor(dev) {
    var get = function (length) { return dev.controlTransferIn({ requestType: 'standard', recipient: 'device', request: 6, value: 0x0200, index: 0 }, length); };
    var head = await get(9);
    return (await get(head.data.getUint16(2, true))).data;
  }

  /** The DFU alternate's name: WebUSB's interfaceName, or (null there, as
   * Chrome on Windows may leave it) its string descriptor, read here. */
  async function altName(dev, iface) {
    if (iface.alt.interfaceName) return iface.alt.interfaceName;
    try {
      var desc = await configDescriptor(dev);
      var index = 0;
      for (var at = 0; at + 9 <= desc.byteLength; ) {
        var len = desc.getUint8(at);
        if (len < 2) break;
        if (desc.getUint8(at + 1) === 4 && desc.getUint8(at + 2) === iface.number && desc.getUint8(at + 3) === 0) index = desc.getUint8(at + 8);
        at += len;
      }
      if (!index) return null;
      var str = function (value, lang, length) { return dev.controlTransferIn({ requestType: 'standard', recipient: 'device', request: 6, value: value, index: lang }, length); };
      var langs = (await str(0x0300, 0, 255)).data;
      var lang = langs.byteLength >= 4 ? langs.getUint16(2, true) : 0x0409;
      var strDesc = (await str(0x0300 | index, lang, 255)).data;
      var out = '';
      for (var idx = 2; idx + 1 < Math.min(strDesc.byteLength, strDesc.getUint8(0)); idx += 2) out += String.fromCharCode(strDesc.getUint16(idx, true));
      return out || null;
    } catch (error) {
      return null;
    }
  }

  function link(dev, iface) {
    var setup = function (request, value) { return { requestType: 'class', recipient: 'interface', request: request, value: value, index: iface }; };
    var out = async function (request, value, data) {
      var reply = await dev.controlTransferOut(setup(request, value), data);
      if (reply.status !== 'ok') throw new Error('the device stalled a request');
    };
    return {
      status: async function () {
        var reply = await dev.controlTransferIn(setup(GETSTATUS, 0), 6);
        if (reply.status !== 'ok' || !reply.data || reply.data.byteLength < 6) throw new Error('the device stalled its status');
        var data = reply.data;
        return { status: data.getUint8(0), poll: data.getUint8(1) | (data.getUint8(2) << 8) | (data.getUint8(3) << 16), state: data.getUint8(4) };
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
  async function settle(dfuLink, what) {
    for (;;) {
      var answer = await dfuLink.status();
      if (answer.status !== 0 || answer.state === ERROR) {
        try { await dfuLink.clear(); } catch (error) {}
        var err = new Error('the device refused ' + what + ' (status ' + answer.status + ')');
        err.refused = true;
        throw err;
      }
      // After a download the spec allows only dfuDNLOAD-SYNC or dfuDNBUSY
      // (wait the device's poll time) and then dfuDNLOAD-IDLE (done).
      if (answer.state === DNLOAD_IDLE) return;
      if (answer.state === DNBUSY || answer.state === DNLOAD_SYNC) {
        await sleep(Math.max(answer.poll, 1));
        continue;
      }
      var odd = new Error('the device is in DFU state ' + answer.state + ' during ' + what);
      odd.refused = true;
      throw odd;
    }
  }

  /** Back to dfuIDLE from wherever an earlier run left it. */
  async function idle(dfuLink) {
    var answer = await dfuLink.status();
    if (answer.state === ERROR) { await dfuLink.clear(); answer = await dfuLink.status(); }
    if (answer.state !== IDLE) { await dfuLink.abort(); answer = await dfuLink.status(); }
    if (answer.state !== IDLE) {
      var err = new Error('the device will not go idle (state ' + answer.state + ')');
      err.refused = true;
      throw err;
    }
  }

  /** `image` (CHIMERA.BIN) written at `at`, which must be 0x08020000: its
   * sectors erased, the blocks written, then the leave that starts it.
   * `progress(done, total)` after each block. Every guard runs before the
   * device is touched. Rejects with `.guard`, `.unopenable`, `.refused` or
   * (anything else: the device went away) `.lost` set. */
  async function write(dev, image, at, progress, opts) {
    checkImage(image);
    plan(at, image.length, 1024); // the guards, before the device is touched
    progress = progress || function () {};
    var iface = await open(dev, (opts && opts.claimMs) || 10000).catch(function (error) { error.started = false; throw error; });
    var name = await altName(dev, iface);
    if (!isH7(name)) {
      try { await dev.close(); } catch (error) {}
      throw Object.assign(Guard('refused: this DFU device is not the PreenFM3\'s STM32H7 (its flash: ' + (name || 'not named') + '). Unplug other boards in DFU mode'), { started: false });
    }
    var size = await transferSize(dev);
    var planned = plan(at, image.length, size);
    if (!layoutFits(layout(name), planned.erase)) {
      try { await dev.close(); } catch (error) {}
      throw Object.assign(Guard('refused: the device lays out its flash as ' + name + ', not 128 KB sectors from 0x08020000'), { started: false });
    }
    var dfuLink = link(dev, iface.number);
    var total = planned.erase.length + planned.blocks.length;
    var done = 0;
    var started = false;
    try {
      await idle(dfuLink);
      for (var idx = 0; idx < planned.erase.length; idx++) {
        started = true;
        await dfuLink.command(eraseSector(planned.erase[idx]));
        await settle(dfuLink, 'an erase');
        progress(++done, total);
      }
      for (var blockIdx = 0; blockIdx < planned.blocks.length; blockIdx++) {
        var block = planned.blocks[blockIdx];
        await dfuLink.command(setAddress(block.at));
        await settle(dfuLink, 'an address');
        await dfuLink.data(image.subarray(block.from, block.to));
        await settle(dfuLink, 'a write');
        progress(++done, total);
      }
    } catch (error) {
      if (!error.guard && !error.refused) error.lost = true;
      error.started = started;
      throw error;
    }
    try {
      await leave(dfuLink, dev);
    } catch (error) {
      // Every block is written: the firmware is in; the unit didn't start it.
      error.leave = true;
      error.started = true;
      throw error;
    }
  }

  /** Start the firmware: the address, an empty download, a status. The
   * device resets under the last two, so their failures are its leaving. */
  async function leave(dfuLink, dev) {
    await dfuLink.command(setAddress(FirmwareAddress(BASE)));
    await settle(dfuLink, 'an address');
    try {
      await dfuLink.data(new Uint8Array(0));
      var answer = await dfuLink.status();
      if (answer.state === MANIFEST) await dfuLink.status();
    } catch (error) { /* gone: it is starting the firmware */ }
    try { await dev.close(); } catch (error) {}
  }

  /** The browser's chooser for the DFU device (a click's): the device, or
   * null when nothing was picked. */
  async function choose() {
    try {
      return await navigator.usb.requestDevice({ filters: [ID] });
    } catch (error) {
      if (error && error.name === 'NotFoundError') return null;
      throw error;
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
