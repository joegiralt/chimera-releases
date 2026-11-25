// SPDX-License-Identifier: GPL-3.0-or-later
// node public/dfu.check.js: the DFU writer's guards and its write, against
// the fake DfuSe device (e2e/fakedfu.cjs). Each guard is pinned here: no
// address below 0x08020000 can be made, no image at the bootloader's limit
// passes, no mass erase can be built or sent, only the image's sectors are
// erased, and the bootloader's sector is never touched.
var D = require('./dfu.js');
var fakeUsb = require('../e2e/fakedfu.cjs');

function fail(msg) { console.error('FAIL ' + msg); process.exit(1); }
function eq(got, want, what) { if (got !== want) fail(what + ': ' + got + ' want ' + want); }
function refuses(f, what) {
  try { f(); } catch (e) { if (e.guard) return e.message; fail(what + ': threw a non-guard ' + e); }
  fail(what + ': not refused');
}
async function rejects(p, what) {
  try { await p; } catch (e) { return e; }
  fail(what + ': not refused');
}

// A firmware-like image: SP, then a reset vector inside it (thumb).
function image(n) {
  var img = new Uint8Array(n);
  for (var i = 8; i < n; i++) img[i] = (i * 7 + 3) & 0xff;
  img.set([0x00, 0xff, 0x00, 0x20, 0x99, 0x02, 0x02, 0x08]);
  return img;
}

function guards() {
  refuses(function () { D.FirmwareAddress(0x08000000); }, 'sector 0 as an address');
  refuses(function () { D.FirmwareAddress(0x0801ffff); }, 'just below the firmware area');
  refuses(function () { D.FirmwareAddress(D.BASE + D.AREA); }, 'past the firmware area');
  refuses(function () { D.FirmwareAddress(134348800.5); }, 'not an integer');
  eq(D.FirmwareAddress(0x08020000).value, 0x08020000, 'the firmware area');
  // The commands take only a FirmwareAddress: a number or a forged object is refused.
  refuses(function () { D.setAddress(0x08000000); }, 'set address from a number');
  refuses(function () { D.eraseSector({ value: 0x08000000 }); }, 'erase from a forged address');
  refuses(function () { D.eraseSector(D.FirmwareAddress(0x08020400)); }, 'erase off a sector start');
  // No mass erase: nothing builds one, and the wire check refuses one.
  eq(Object.keys(D).some(function (k) { return /mass/i.test(k); }), false, 'a mass erase builder exists');
  refuses(function () { D.checkCommand(new Uint8Array([0x41])); }, 'a mass erase on the wire');
  refuses(function () { D.checkCommand(new Uint8Array([0x41, 0, 0, 0, 8])); }, 'an erase of sector 0 on the wire');
  refuses(function () { D.checkCommand(new Uint8Array([0x21, 0, 0, 0, 8])); }, 'an address of 0x08000000 on the wire');
  refuses(function () { D.checkCommand(new Uint8Array([0x92])); }, 'read unprotect on the wire');
  D.checkCommand(new Uint8Array([0x41, 0, 0, 2, 8]));
  // The image: under the limit (917,504 refused, as chimera-usb.py), not a .bk2, a firmware for 0x08020000.
  refuses(function () { D.checkImage(image(D.AREA)); }, 'an image of 917,504 bytes');
  refuses(function () { D.checkImage(image(D.AREA + 1)); }, 'an image over 917,504 bytes');
  D.checkImage(image(D.AREA - 1));
  var bk2 = image(4096);
  bk2.set([0x43, 0x48, 0x49, 0x4d, 0x45, 0x52, 0x41, 0x32]);
  refuses(function () { D.checkImage(bk2); }, 'a .bk2 as the image');
  var low = image(4096);
  low.set([0x01, 0x10, 0x00, 0x08], 4);
  refuses(function () { D.checkImage(low); }, 'a reset vector in the bootloader');
  // The plan: only 0x08020000, only the sectors the image covers.
  refuses(function () { D.plan(0x08000000, 1000, 1024); }, 'a plan at 0x08000000');
  refuses(function () { D.plan(0x08040000, 1000, 1024); }, 'a plan past the start');
  var p = D.plan(D.BASE, 3 * D.SECTOR + 1, 2048);
  eq(p.erase.map(function (a) { return a.value.toString(16); }).join(), '8020000,8040000,8060000,8080000', 'the sectors erased');
  eq(p.blocks[0].at.value, D.BASE, 'the first block');
  eq(p.blocks.length, Math.ceil((3 * D.SECTOR + 1) / 2048), 'the block count');
  // The layout check: the H7's 128 KB sectors fit; 16 KB pages don't.
  eq(D.layoutFits(D.layout('@Internal Flash  /0x08000000/16*128Kg'), p.erase), true, 'an H7 layout');
  eq(D.layoutFits(D.layout('@Internal Flash  /0x08000000/128*016Kg'), p.erase), false, 'a 16 KB page layout');
}

async function happyWrite() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true });
  var img = image(300 * 1024);
  var seen = [];
  await D.write(usb.device, img, D.BASE, function (d, t) { seen.push([d, t]); });
  eq(usb.log.massErase, false, 'a mass erase');
  eq(usb.log.erased.map(function (a) { return a.toString(16); }).join(), '8020000,8040000,8060000', 'erased only the image sectors');
  eq(usb.log.commands.every(function (c) { return c.length === 5 && c.at >= D.BASE; }), true, 'every command at the firmware area');
  eq(usb.mem.subarray(0, D.SECTOR).every(function (b) { return b === 0xb0; }), true, 'the bootloader untouched');
  eq(usb.mem.subarray(0x20000 + img.length, 0x80000).every(function (b) { return b === 0xff; }), true, 'the rest of the last sector erased');
  eq(usb.mem.subarray(0x80000, 0x100000).every(function (b) { return b === 0xa5; }), true, 'sectors past the image untouched');
  eq(Buffer.from(usb.log.image).equals(Buffer.from(img)), true, 'the image written at 0x08020000');
  eq(usb.log.left, true, 'the leave');
  eq(seen[seen.length - 1][0], seen[seen.length - 1][1], 'progress to the end');
}

async function refusedBeforeTheWire() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true });
  var e = await rejects(D.write(usb.device, image(4096), 0x08000000), 'a write at 0x08000000');
  eq(e.guard, true, 'a guard refusal');
  eq(usb.log.opens, 0, 'the device opened for a refused write');
  eq(usb.log.commands.length, 0, 'commands sent for a refused write');
  e = await rejects(D.write(usb.device, image(D.AREA), D.BASE), 'an image at the limit');
  eq(e.guard, true, 'a guard refusal (size)');
  eq(usb.log.opens, 0, 'the device opened for an oversize image');
}

async function unopenable() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true, mode: { unopenable: true } });
  var e = await rejects(D.write(usb.device, image(4096), D.BASE), 'an unopenable device');
  eq(e.unopenable, true, 'unopenable');
}

async function cutMidWrite() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true, mode: { cutAfter: 10 } });
  var e = await rejects(D.write(usb.device, image(100 * 1024), D.BASE), 'a pulled cable');
  eq(e.lost, true, 'lost');
  eq(usb.log.writes.length, 10, 'blocks written before the cut');
  eq(usb.mem.subarray(0, D.SECTOR).every(function (b) { return b === 0xb0; }), true, 'the bootloader untouched by a cut');
}

async function eraseRefused() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true, mode: { refuseErase: true } });
  var e = await rejects(D.write(usb.device, image(4096), D.BASE), 'a refused erase');
  eq(e.refused, true, 'refused');
  eq(usb.log.writes.length, 0, 'writes after a refused erase');
}

// Only the PreenFM3's chip: an STM32H7's internal flash, 16 sectors of 128 KB.
async function onlyTheH7() {
  for (var layout of ['@Internal Flash  /0x08000000/04*016Kg,01*064Kg,07*128Kg', '@Internal Flash  /0x08000000/04*032Kg,01*128Kg,03*256Kg', null, '@Option Bytes  /0x5200201C/01*128 e']) {
    var scope = { navigator: {} };
    var usb = fakeUsb(scope, { present: true, granted: true });
    var other = usb.addOther(layout);
    var e = await rejects(D.write(other, image(4096), D.BASE), 'a write to ' + layout);
    eq(e.guard, true, 'a guard refusal for ' + layout);
    eq(e.started, false, 'started on ' + layout);
    eq(other.sent, 0, 'transfers sent to ' + layout);
    if (layout) eq(/not the PreenFM3/.test(e.message), true, 'the refusal names it: ' + e.message);
  }
  eq(D.isH7('@Internal Flash  /0x08000000/16*128Kg'), true, 'the H7');
  eq(D.isH7('@Internal Flash  /0x08000000/08*128Kg'), false, 'an H7 with 1 MB');
}

// A descriptor that can't be read refuses the write: no guessed transfer size.
async function noGuessedTransferSize() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true, mode: { badDescriptor: true } });
  var e = await rejects(D.write(usb.device, image(4096), D.BASE), 'an unreadable descriptor');
  eq(e.guard, true, 'a guard refusal (descriptor)');
  eq(usb.log.commands.length, 0, 'commands sent without a transfer size');
}

// After a download the spec allows dfuDNBUSY or dfuDNLOAD-IDLE, never dfuIDLE.
async function strictSettle() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true, mode: { idleAfterDownload: true } });
  var e = await rejects(D.write(usb.device, image(4096), D.BASE), 'dfuIDLE after a download');
  eq(e.refused, true, 'refused');
  eq(usb.log.writes.length, 0, 'written past a wrong state');
}

// Whether a write started (an erase sent) and whether it failed at the leave.
async function startedAndLeave() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true, mode: { unopenable: true } });
  eq((await rejects(D.write(usb.device, image(4096), D.BASE), 'unopenable')).started, false, 'started (unopenable)');
  scope = { navigator: {} };
  usb = fakeUsb(scope, { present: true, granted: true, mode: { cutAfter: 3 } });
  var cut = await rejects(D.write(usb.device, image(100 * 1024), D.BASE), 'cut');
  eq(cut.started, true, 'started (cut)');
  eq(!!cut.leave, false, 'leave (cut)');
  scope = { navigator: {} };
  usb = fakeUsb(scope, { present: true, granted: true, mode: { failLeave: true } });
  var img = image(10 * 1024);
  var left = await rejects(D.write(usb.device, img, D.BASE), 'a failed leave');
  eq(left.leave, true, 'leave (failed leave)');
  eq(left.started, true, 'started (failed leave)');
  eq(usb.log.writes.reduce(function (n, w) { return n + w.length; }, 0), img.length, 'every byte written before the leave');
}

(async function () {
  guards();
  await onlyTheH7();
  await noGuessedTransferSize();
  await strictSettle();
  await startedAndLeave();
  await happyWrite();
  await refusedBeforeTheWire();
  await unopenable();
  await cutMidWrite();
  await eraseRefused();
  console.log('dfu.js: ok');
})().catch(function (e) { fail(e.stack || e); });
