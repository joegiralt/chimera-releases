// SPDX-License-Identifier: GPL-3.0-or-later
// A fake STM32 DfuSe device (0483:df11) as WebUSB shows one: 2 MB of flash
// in 128 KB sectors, the bootloader's sector filled with a mark, the
// firmware area with the old firmware's. It erases, writes (only erased
// flash, as flash does), answers GETSTATUS as AN3156's state machine does,
// and leaves on an empty download. Self-contained: `e2e` runs it in the page
// (addInitScript), `public/dfu.check.js` in node.
//
// `fakeUsb(scope, opts)` sets `scope.__usb`: { device, log, mode, plug(),
// unplug() } and, unless opts.noUsb, `scope.navigator.usb`. The log: every
// command (`commands`), the sectors erased, the blocks written, a mass erase
// (`massErase`), the leave. Modes: `unopenable` (open() is refused, as
// Windows does without WinUSB), `cutAfter` (n data blocks, then the cable is
// pulled), `refuseErase` (the device reports an erase error), `failLeave`
// (the cable pulled at the leave, every block written), `badDescriptor` (its
// configuration descriptor stalls), `idleAfterDownload` (dfuIDLE where the
// spec has dfuDNLOAD-IDLE), `pickOther` (the chooser returns the first of
// `addOther`'s devices). `addOther(layout)` puts another DfuSe device on the
// bus, already permitted, with that flash layout string; its `sent` counts
// every control transfer it was given. `noName` leaves the alternate's
// interfaceName null (as Chrome on Windows may), the name then only in its
// string descriptor (`nameString`, default the H7's); `claimFails` refuses
// the interface claim; `claimBusyFor` (n) fails the first n claims, as a
// claim does while fwupd holds the device.
function fakeUsb(scope, opts) {
  opts = opts || {};
  var SIZE = 2 * 1024 * 1024, FLASH = 0x08000000, SECTOR = 0x20000, XFER = 2048;
  var LAYOUT = '@Internal Flash   /0x08000000/16*128Kg';
  var mem = new Uint8Array(SIZE).fill(0xa5);
  mem.fill(0xb0, 0, SECTOR); // the bootloader
  var log = { commands: [], erased: [], writes: [], massErase: false, left: false, image: null, opens: 0, requests: 0 };
  var mode = Object.assign({}, opts.mode || {});
  var state = 2, pending = null, pointer = 0, status = 0, blocks = 0, present = !!opts.present;
  var lost = function () { return new DOMException('The device was disconnected.', 'NotFoundError'); };
  var listeners = { connect: [], disconnect: [] };

  function bytes(raw) {
    if (!raw) return new Uint8Array(0);
    if (raw instanceof Uint8Array) return raw;
    if (raw.buffer) return new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
    return new Uint8Array(raw);
  }

  function run(pendingOp) {
    if (pendingOp.kind === 'cmd') {
      var cmdBytes = pendingOp.data;
      var at = cmdBytes.length >= 5 ? (cmdBytes[1] | (cmdBytes[2] << 8) | (cmdBytes[3] << 16) | (cmdBytes[4] << 24)) >>> 0 : null;
      log.commands.push({ op: cmdBytes[0], at: at, length: cmdBytes.length });
      if (cmdBytes[0] === 0x21 && at !== null) { pointer = at; return 0; }
      if (cmdBytes[0] === 0x41 && cmdBytes.length === 1) { log.massErase = true; mem.fill(0xff); return 0; }
      if (cmdBytes[0] === 0x41 && at !== null) {
        if (mode.refuseErase) return 0x0b;
        var sectorAt = Math.floor((at - FLASH) / SECTOR) * SECTOR;
        if (sectorAt < 0 || sectorAt >= SIZE) return 0x08;
        log.erased.push(FLASH + sectorAt);
        mem.fill(0xff, sectorAt, sectorAt + SECTOR);
        return 0;
      }
      return 0x0f;
    }
    if (pendingOp.kind === 'data') {
      var off = pointer - FLASH + (pendingOp.block - 2) * XFER;
      if (off < 0 || off + pendingOp.data.length > SIZE) return 0x08;
      for (var idx = 0; idx < pendingOp.data.length; idx++) if (mem[off + idx] !== 0xff) return 0x03; // not erased: errWRITE
      mem.set(pendingOp.data, off);
      log.writes.push({ at: FLASH + off, length: pendingOp.data.length });
      return 0;
    }
    return 0;
  }

  function leave() {
    log.left = true;
    present = false;
    device.opened = false;
    var start = 0x20000, end = start;
    for (var idx = 0; idx < log.writes.length; idx++) end = Math.max(end, log.writes[idx].at - FLASH + log.writes[idx].length);
    log.image = mem.slice(start, end);
    listeners.disconnect.forEach(function (listener) { listener({ device: device }); });
    if (scope.__onDfuLeave) scope.__onDfuLeave(Array.from(log.image));
  }

  function guard() {
    if (!present) throw lost();
  }

  function configDescriptor() {
    var name = 4;
    var raw = [9, 2, 0, 0, 1, 1, 0, 0x80, 50, 9, 4, 0, 0, 0, 0xfe, 0x01, 0x02, name, 9, 0x21, 0x0b, 0xff, 0x00, XFER & 0xff, XFER >> 8, 0x1a, 0x01];
    raw[2] = raw.length;
    return new Uint8Array(raw);
  }

  var device = {
    vendorId: 0x0483,
    productId: 0xdf11,
    productName: 'STM32  BOOTLOADER',
    serialNumber: '200364500000',
    opened: false,
    configuration: null,
    async open() {
      log.opens++;
      guard();
      if (mode.unopenable) throw new DOMException('Access denied.', 'SecurityError');
      device.opened = true;
    },
    async close() { device.opened = false; },
    async selectConfiguration() {
      guard();
      device.configuration = {
        configurationValue: 1,
        interfaces: [{ interfaceNumber: 0, alternates: [{ alternateSetting: 0, interfaceClass: 0xfe, interfaceSubclass: 0x01, interfaceProtocol: 0x02, interfaceName: mode.noName ? null : LAYOUT }] }],
      };
    },
    async claimInterface() {
      guard();
      if (mode.claimFails) throw new DOMException('Unable to claim interface.', 'NetworkError');
      // fwupd on Linux claims a new DFU device for a moment: the first claims fail busy.
      if (mode.claimBusyFor > 0) {
        mode.claimBusyFor--;
        throw new DOMException('Unable to claim interface.', 'NetworkError');
      }
    },
    async selectAlternateInterface() { guard(); },
    async controlTransferIn(setup, length) {
      guard();
      if (setup.requestType === 'standard' && setup.request === 6 && (setup.value >> 8) === 3) {
        // String descriptors: 0 the language list, 4 the alternate's name.
        var str = (setup.value & 0xff) === 0 ? null : (setup.value & 0xff) === 4 ? (mode.nameString || LAYOUT) : '';
        var sd = str === null ? [4, 3, 0x09, 0x04] : [2 + str.length * 2, 3];
        if (str) for (var charIdx = 0; charIdx < str.length; charIdx++) sd.push(str.charCodeAt(charIdx) & 0xff, str.charCodeAt(charIdx) >> 8);
        var sb = new Uint8Array(sd).slice(0, length);
        return { status: 'ok', data: new DataView(sb.buffer) };
      }
      if (setup.requestType === 'standard' && setup.request === 6) {
        if (mode.badDescriptor) return { status: 'stall' };
        var raw = configDescriptor().slice(0, length);
        return { status: 'ok', data: new DataView(raw.buffer) };
      }
      if (setup.request === 3) {
        var poll = 0, st = state;
        if (pending) {
          status = run(pending);
          pending = null;
          if (status !== 0) { state = 10; st = 10; } else if (mode.idleAfterDownload) { st = 2; state = 2; } else { st = 4; state = 5; poll = 1; }
        } else if (state === 7) {
          leave();
          st = 8;
        }
        var out = new Uint8Array([status, poll, 0, 0, st, 0]);
        return { status: 'ok', data: new DataView(out.buffer) };
      }
      return { status: 'stall' };
    },
    async controlTransferOut(setup, data) {
      guard();
      var raw = bytes(data);
      if (setup.request === 1) {
        if (raw.length === 0) { state = 7; return { status: 'ok', bytesWritten: 0 }; }
        if (mode.failLeave && setup.value === 0 && raw[0] === 0x21 && log.writes.length > 0 && (raw[1] | (raw[2] << 8) | (raw[3] << 16) | (raw[4] << 24)) >>> 0 === 0x08020000) {
          present = false;
          device.opened = false;
          throw lost();
        }
        if (setup.value >= 2) {
          if (mode.cutAfter !== undefined && blocks >= mode.cutAfter) {
            present = false;
            device.opened = false;
            listeners.disconnect.forEach(function (listener) { listener({ device: device }); });
            throw lost();
          }
          blocks++;
        }
        pending = setup.value === 0 ? { kind: 'cmd', data: raw.slice() } : { kind: 'data', block: setup.value, data: raw.slice() };
        state = 4;
        return { status: 'ok', bytesWritten: raw.length };
      }
      if (setup.request === 4) { status = 0; state = 2; return { status: 'ok', bytesWritten: 0 }; }
      if (setup.request === 6) { state = 2; return { status: 'ok', bytesWritten: 0 }; }
      return { status: 'stall' };
    },
  };

  var others = [];
  function addOther(layout) {
    var fakeDev = {
      vendorId: 0x0483, productId: 0xdf11, productName: 'STM32  BOOTLOADER', opened: false, configuration: null, sent: 0, outs: 0,
      async open() { fakeDev.opened = true; },
      async close() { fakeDev.opened = false; },
      async selectConfiguration() {
        fakeDev.configuration = { configurationValue: 1, interfaces: [{ interfaceNumber: 0, alternates: [{ alternateSetting: 0, interfaceClass: 0xfe, interfaceSubclass: 0x01, interfaceProtocol: 0x02, interfaceName: layout }] }] };
      },
      async claimInterface() {},
      async selectAlternateInterface() {},
      async controlTransferIn() { fakeDev.sent++; return { status: 'stall' }; },
      async controlTransferOut() { fakeDev.sent++; fakeDev.outs++; return { status: 'stall' }; },
    };
    others.push(fakeDev);
    return fakeDev;
  }

  var granted = !!opts.granted;
  var usb = {
    async getDevices() { return (present && granted ? [device] : []).concat(others); },
    async requestDevice(options) {
      log.requests++;
      if (mode.pickOther && others.length) return others[0];
      if (!present || mode.cancel) throw new DOMException('No device selected.', 'NotFoundError');
      var filters = (options && options.filters) || [];
      if (!filters.some(function (filter) { return filter.vendorId === device.vendorId && filter.productId === device.productId; })) throw new DOMException('No device selected.', 'NotFoundError');
      granted = true;
      return device;
    },
    addEventListener(kind, listener) { (listeners[kind] = listeners[kind] || []).push(listener); },
    removeEventListener(kind, listener) { listeners[kind] = (listeners[kind] || []).filter(function (other) { return other !== listener; }); },
  };

  scope.__usb = {
    device: device,
    log: log,
    mode: mode,
    mem: mem,
    plug: function () {
      present = true;
      state = 2; status = 0; pending = null; blocks = 0;
      device.configuration = null;
      listeners.connect.forEach(function (listener) { listener({ device: device }); });
    },
    unplug: function () { present = false; device.opened = false; },
    addOther: addOther,
    revoke: function () { granted = false; },
    removeOthers: function () { others.length = 0; },
    present: function () { return present; },
  };
  if (!opts.noUsb) Object.defineProperty(scope.navigator, 'usb', { value: usb, configurable: true });
  return scope.__usb;
}

if (typeof module !== 'undefined') module.exports = fakeUsb;
