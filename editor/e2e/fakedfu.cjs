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
// every control transfer it was given.
function fakeUsb(scope, opts) {
  opts = opts || {};
  var SIZE = 2 * 1024 * 1024, FLASH = 0x08000000, SECTOR = 0x20000, XFER = 2048;
  var mem = new Uint8Array(SIZE).fill(0xa5);
  mem.fill(0xb0, 0, SECTOR); // the bootloader
  var log = { commands: [], erased: [], writes: [], massErase: false, left: false, image: null, opens: 0, requests: 0 };
  var mode = Object.assign({}, opts.mode || {});
  var state = 2, pending = null, pointer = 0, status = 0, blocks = 0, present = !!opts.present;
  var lost = function () { return new DOMException('The device was disconnected.', 'NotFoundError'); };
  var listeners = { connect: [], disconnect: [] };

  function bytes(d) {
    if (!d) return new Uint8Array(0);
    if (d instanceof Uint8Array) return d;
    if (d.buffer) return new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
    return new Uint8Array(d);
  }

  function run(p) {
    if (p.kind === 'cmd') {
      var c = p.data;
      var at = c.length >= 5 ? (c[1] | (c[2] << 8) | (c[3] << 16) | (c[4] << 24)) >>> 0 : null;
      log.commands.push({ op: c[0], at: at, length: c.length });
      if (c[0] === 0x21 && at !== null) { pointer = at; return 0; }
      if (c[0] === 0x41 && c.length === 1) { log.massErase = true; mem.fill(0xff); return 0; }
      if (c[0] === 0x41 && at !== null) {
        if (mode.refuseErase) return 0x0b;
        var s = Math.floor((at - FLASH) / SECTOR) * SECTOR;
        if (s < 0 || s >= SIZE) return 0x08;
        log.erased.push(FLASH + s);
        mem.fill(0xff, s, s + SECTOR);
        return 0;
      }
      return 0x0f;
    }
    if (p.kind === 'data') {
      var off = pointer - FLASH + (p.block - 2) * XFER;
      if (off < 0 || off + p.data.length > SIZE) return 0x08;
      for (var i = 0; i < p.data.length; i++) if (mem[off + i] !== 0xff) return 0x03; // not erased: errWRITE
      mem.set(p.data, off);
      log.writes.push({ at: FLASH + off, length: p.data.length });
      return 0;
    }
    return 0;
  }

  function leave() {
    log.left = true;
    present = false;
    device.opened = false;
    var start = 0x20000, end = start;
    for (var i = 0; i < log.writes.length; i++) end = Math.max(end, log.writes[i].at - FLASH + log.writes[i].length);
    log.image = mem.slice(start, end);
    listeners.disconnect.forEach(function (f) { f({ device: device }); });
    if (scope.__onDfuLeave) scope.__onDfuLeave(Array.from(log.image));
  }

  function guard() {
    if (!present) throw lost();
  }

  function configDescriptor() {
    var name = 4;
    var d = [9, 2, 0, 0, 1, 1, 0, 0x80, 50, 9, 4, 0, 0, 0, 0xfe, 0x01, 0x02, name, 9, 0x21, 0x0b, 0xff, 0x00, XFER & 0xff, XFER >> 8, 0x1a, 0x01];
    d[2] = d.length;
    return new Uint8Array(d);
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
        interfaces: [{ interfaceNumber: 0, alternates: [{ alternateSetting: 0, interfaceClass: 0xfe, interfaceSubclass: 0x01, interfaceProtocol: 0x02, interfaceName: '@Internal Flash  /0x08000000/16*128Kg' }] }],
      };
    },
    async claimInterface() { guard(); },
    async selectAlternateInterface() { guard(); },
    async controlTransferIn(setup, length) {
      guard();
      if (setup.requestType === 'standard' && setup.request === 6) {
        if (mode.badDescriptor) return { status: 'stall' };
        var d = configDescriptor().slice(0, length);
        return { status: 'ok', data: new DataView(d.buffer) };
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
      var d = bytes(data);
      if (setup.request === 1) {
        if (d.length === 0) { state = 7; return { status: 'ok', bytesWritten: 0 }; }
        if (mode.failLeave && setup.value === 0 && d[0] === 0x21 && log.writes.length > 0 && (d[1] | (d[2] << 8) | (d[3] << 16) | (d[4] << 24)) >>> 0 === 0x08020000) {
          present = false;
          device.opened = false;
          throw lost();
        }
        if (setup.value >= 2) {
          if (mode.cutAfter !== undefined && blocks >= mode.cutAfter) {
            present = false;
            device.opened = false;
            listeners.disconnect.forEach(function (f) { f({ device: device }); });
            throw lost();
          }
          blocks++;
        }
        pending = setup.value === 0 ? { kind: 'cmd', data: d.slice() } : { kind: 'data', block: setup.value, data: d.slice() };
        state = 4;
        return { status: 'ok', bytesWritten: d.length };
      }
      if (setup.request === 4) { status = 0; state = 2; return { status: 'ok', bytesWritten: 0 }; }
      if (setup.request === 6) { state = 2; return { status: 'ok', bytesWritten: 0 }; }
      return { status: 'stall' };
    },
  };

  var others = [];
  function addOther(layout) {
    var o = {
      vendorId: 0x0483, productId: 0xdf11, productName: 'STM32  BOOTLOADER', opened: false, configuration: null, sent: 0,
      async open() { o.opened = true; },
      async close() { o.opened = false; },
      async selectConfiguration() {
        o.configuration = { configurationValue: 1, interfaces: [{ interfaceNumber: 0, alternates: [{ alternateSetting: 0, interfaceClass: 0xfe, interfaceSubclass: 0x01, interfaceProtocol: 0x02, interfaceName: layout }] }] };
      },
      async claimInterface() {},
      async selectAlternateInterface() {},
      async controlTransferIn() { o.sent++; return { status: 'stall' }; },
      async controlTransferOut() { o.sent++; return { status: 'stall' }; },
    };
    others.push(o);
    return o;
  }

  var granted = !!opts.granted;
  var usb = {
    async getDevices() { return (present && granted ? [device] : []).concat(others); },
    async requestDevice(o) {
      log.requests++;
      if (mode.pickOther && others.length) return others[0];
      if (!present || mode.cancel) throw new DOMException('No device selected.', 'NotFoundError');
      var f = (o && o.filters) || [];
      if (!f.some(function (x) { return x.vendorId === device.vendorId && x.productId === device.productId; })) throw new DOMException('No device selected.', 'NotFoundError');
      granted = true;
      return device;
    },
    addEventListener(kind, f) { (listeners[kind] = listeners[kind] || []).push(f); },
    removeEventListener(kind, f) { listeners[kind] = (listeners[kind] || []).filter(function (g) { return g !== f; }); },
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
      listeners.connect.forEach(function (f) { f({ device: device }); });
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
