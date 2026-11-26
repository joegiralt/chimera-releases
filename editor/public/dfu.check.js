// SPDX-License-Identifier: GPL-3.0-or-later
// node public/dfu.check.js: the DFU writer's guards and its write, against
// the fake DfuSe device (e2e/fakedfu.cjs). Each guard is pinned here: no
// address below 0x08020000 can be made, no image at the bootloader's limit
// passes, no mass erase can be built or sent, only the image's sectors are
// erased, and the bootloader's sector is never touched.
var Dfu = require('./dfu.js');
var fakeUsb = require('../e2e/fakedfu.cjs');

function fail(msg) { console.error('FAIL ' + msg); process.exit(1); }
function eq(got, want, what) { if (got !== want) fail(what + ': ' + got + ' want ' + want); }
function refuses(thunk, what) {
  try { thunk(); } catch (error) { if (error.guard) return error.message; fail(what + ': threw a non-guard ' + error); }
  fail(what + ': not refused');
}
async function rejects(promise, what) {
  try { await promise; } catch (error) { return error; }
  fail(what + ': not refused');
}

// A firmware-like image: SP, then a reset vector inside it (thumb).
function image(size) {
  var img = new Uint8Array(size);
  for (var idx = 8; idx < size; idx++) img[idx] = (idx * 7 + 3) & 0xff;
  img.set([0x00, 0xff, 0x00, 0x20, 0x99, 0x02, 0x02, 0x08]);
  return img;
}

function guards() {
  refuses(function () { Dfu.FirmwareAddress(0x08000000); }, 'sector 0 as an address');
  refuses(function () { Dfu.FirmwareAddress(0x0801ffff); }, 'just below the firmware area');
  refuses(function () { Dfu.FirmwareAddress(Dfu.BASE + Dfu.AREA); }, 'past the firmware area');
  refuses(function () { Dfu.FirmwareAddress(134348800.5); }, 'not an integer');
  eq(Dfu.FirmwareAddress(0x08020000).value, 0x08020000, 'the firmware area');
  // The commands take only a FirmwareAddress: a number or a forged object is refused.
  refuses(function () { Dfu.setAddress(0x08000000); }, 'set address from a number');
  refuses(function () { Dfu.eraseSector({ value: 0x08000000 }); }, 'erase from a forged address');
  refuses(function () { Dfu.eraseSector(Dfu.FirmwareAddress(0x08020400)); }, 'erase off a sector start');
  // No mass erase: nothing builds one, and the wire check refuses one.
  eq(Object.keys(Dfu).some(function (key) { return /mass/i.test(key); }), false, 'a mass erase builder exists');
  refuses(function () { Dfu.checkCommand(new Uint8Array([0x41])); }, 'a mass erase on the wire');
  refuses(function () { Dfu.checkCommand(new Uint8Array([0x41, 0, 0, 0, 8])); }, 'an erase of sector 0 on the wire');
  refuses(function () { Dfu.checkCommand(new Uint8Array([0x21, 0, 0, 0, 8])); }, 'an address of 0x08000000 on the wire');
  refuses(function () { Dfu.checkCommand(new Uint8Array([0x92])); }, 'read unprotect on the wire');
  Dfu.checkCommand(new Uint8Array([0x41, 0, 0, 2, 8]));
  // The image: under the limit (917,504 refused, as chimera-usb.py), not a .bk2, a firmware for 0x08020000.
  refuses(function () { Dfu.checkImage(image(Dfu.AREA)); }, 'an image of 917,504 bytes');
  refuses(function () { Dfu.checkImage(image(Dfu.AREA + 1)); }, 'an image over 917,504 bytes');
  Dfu.checkImage(image(Dfu.AREA - 1));
  var bk2 = image(4096);
  bk2.set([0x43, 0x48, 0x49, 0x4d, 0x45, 0x52, 0x41, 0x32]);
  refuses(function () { Dfu.checkImage(bk2); }, 'a .bk2 as the image');
  var low = image(4096);
  low.set([0x01, 0x10, 0x00, 0x08], 4);
  refuses(function () { Dfu.checkImage(low); }, 'a reset vector in the bootloader');
  // The plan: only 0x08020000, only the sectors the image covers.
  refuses(function () { Dfu.plan(0x08000000, 1000, 1024); }, 'a plan at 0x08000000');
  refuses(function () { Dfu.plan(0x08040000, 1000, 1024); }, 'a plan past the start');
  var planned = Dfu.plan(Dfu.BASE, 3 * Dfu.SECTOR + 1, 2048);
  eq(planned.erase.map(function (address) { return address.value.toString(16); }).join(), '8020000,8040000,8060000,8080000', 'the sectors erased');
  eq(planned.blocks[0].at.value, Dfu.BASE, 'the first block');
  eq(planned.blocks.length, Math.ceil((3 * Dfu.SECTOR + 1) / 2048), 'the block count');
  // The layout check: the H7's 128 KB sectors fit; 16 KB pages don't.
  eq(Dfu.layoutFits(Dfu.layout('@Internal Flash   /0x08000000/16*128Kg'), planned.erase), true, 'an H7 layout');
  eq(Dfu.layoutFits(Dfu.layout('@Internal Flash   /0x08000000/128*016Kg'), planned.erase), false, 'a 16 KB page layout');
}

async function happyWrite() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true });
  var img = image(300 * 1024);
  var seen = [];
  await Dfu.write(usb.device, img, Dfu.BASE, function (done, total) { seen.push([done, total]); });
  eq(usb.log.massErase, false, 'a mass erase');
  eq(usb.log.erased.map(function (address) { return address.toString(16); }).join(), '8020000,8040000,8060000', 'erased only the image sectors');
  eq(usb.log.commands.every(function (command) { return command.length === 5 && command.at >= Dfu.BASE; }), true, 'every command at the firmware area');
  eq(usb.mem.subarray(0, Dfu.SECTOR).every(function (byte) { return byte === 0xb0; }), true, 'the bootloader untouched');
  eq(usb.mem.subarray(0x20000 + img.length, 0x80000).every(function (byte) { return byte === 0xff; }), true, 'the rest of the last sector erased');
  eq(usb.mem.subarray(0x80000, 0x100000).every(function (byte) { return byte === 0xa5; }), true, 'sectors past the image untouched');
  eq(Buffer.from(usb.log.image).equals(Buffer.from(img)), true, 'the image written at 0x08020000');
  eq(usb.log.left, true, 'the leave');
  eq(seen[seen.length - 1][0], seen[seen.length - 1][1], 'progress to the end');
}

async function refusedBeforeTheWire() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true });
  var error = await rejects(Dfu.write(usb.device, image(4096), 0x08000000), 'a write at 0x08000000');
  eq(error.guard, true, 'a guard refusal');
  eq(usb.log.opens, 0, 'the device opened for a refused write');
  eq(usb.log.commands.length, 0, 'commands sent for a refused write');
  error = await rejects(Dfu.write(usb.device, image(Dfu.AREA), Dfu.BASE), 'an image at the limit');
  eq(error.guard, true, 'a guard refusal (size)');
  eq(usb.log.opens, 0, 'the device opened for an oversize image');
}

async function unopenable() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true, mode: { unopenable: true } });
  var error = await rejects(Dfu.write(usb.device, image(4096), Dfu.BASE), 'an unopenable device');
  eq(error.unopenable, true, 'unopenable');
}

async function cutMidWrite() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true, mode: { cutAfter: 10 } });
  var error = await rejects(Dfu.write(usb.device, image(100 * 1024), Dfu.BASE), 'a pulled cable');
  eq(error.lost, true, 'lost');
  eq(usb.log.writes.length, 10, 'blocks written before the cut');
  eq(usb.mem.subarray(0, Dfu.SECTOR).every(function (byte) { return byte === 0xb0; }), true, 'the bootloader untouched by a cut');
}

async function eraseRefused() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true, mode: { refuseErase: true } });
  var error = await rejects(Dfu.write(usb.device, image(4096), Dfu.BASE), 'a refused erase');
  eq(error.refused, true, 'refused');
  eq(usb.log.writes.length, 0, 'writes after a refused erase');
}

// Only the PreenFM3's chip: an STM32H7's internal flash, 16 sectors of 128 KB.
async function onlyTheH7() {
  for (var layout of ['@Internal Flash   /0x08000000/04*016Kg,01*064Kg,07*128Kg', '@Internal Flash   /0x08000000/04*032Kg,01*128Kg,03*256Kg', null, '@Option Bytes   /0x5200201C/01*128 e']) {
    var scope = { navigator: {} };
    var usb = fakeUsb(scope, { present: true, granted: true });
    var other = usb.addOther(layout);
    var error = await rejects(Dfu.write(other, image(4096), Dfu.BASE), 'a write to ' + layout);
    eq(error.guard, true, 'a guard refusal for ' + layout);
    eq(error.started, false, 'started on ' + layout);
    // A device with no name has its string descriptor read; nothing is ever sent to it.
    eq(layout ? other.sent : other.outs, 0, 'transfers sent to ' + layout);
    eq(other.opened, false, 'left open: ' + layout);
    if (layout) eq(/not the PreenFM3/.test(error.message), true, 'the refusal names it: ' + error.message);
  }
  eq(Dfu.isH7('@Internal Flash   /0x08000000/16*128Kg'), true, 'the H7');
  eq(Dfu.isH7('@Internal Flash   /0x08000000/08*128Kg'), false, 'an H7 with 1 MB');
}

// A descriptor that can't be read refuses the write: no guessed transfer size.
async function noGuessedTransferSize() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true, mode: { badDescriptor: true } });
  var error = await rejects(Dfu.write(usb.device, image(4096), Dfu.BASE), 'an unreadable descriptor');
  eq(error.guard, true, 'a guard refusal (descriptor)');
  eq(usb.log.commands.length, 0, 'commands sent without a transfer size');
}

// After a download the spec allows dfuDNBUSY or dfuDNLOAD-IDLE, never dfuIDLE.
async function strictSettle() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true, mode: { idleAfterDownload: true } });
  var error = await rejects(Dfu.write(usb.device, image(4096), Dfu.BASE), 'dfuIDLE after a download');
  eq(error.refused, true, 'refused');
  eq(usb.log.writes.length, 0, 'written past a wrong state');
}

// Whether a write started (an erase sent) and whether it failed at the leave.
async function startedAndLeave() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true, mode: { unopenable: true } });
  eq((await rejects(Dfu.write(usb.device, image(4096), Dfu.BASE), 'unopenable')).started, false, 'started (unopenable)');
  scope = { navigator: {} };
  usb = fakeUsb(scope, { present: true, granted: true, mode: { cutAfter: 3 } });
  var cut = await rejects(Dfu.write(usb.device, image(100 * 1024), Dfu.BASE), 'cut');
  eq(cut.started, true, 'started (cut)');
  eq(!!cut.leave, false, 'leave (cut)');
  scope = { navigator: {} };
  usb = fakeUsb(scope, { present: true, granted: true, mode: { failLeave: true } });
  var img = image(10 * 1024);
  var left = await rejects(Dfu.write(usb.device, img, Dfu.BASE), 'a failed leave');
  eq(left.leave, true, 'leave (failed leave)');
  eq(left.started, true, 'started (failed leave)');
  eq(usb.log.writes.reduce(function (sum, entry) { return sum + entry.length; }, 0), img.length, 'every byte written before the leave');
}

// A null interfaceName: the alternate's string descriptor is read instead.
async function nameFromDescriptor() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true, mode: { noName: true } });
  var img = image(10 * 1024);
  await Dfu.write(usb.device, img, Dfu.BASE);
  eq(usb.log.left, true, 'written with the name from its descriptor');
  scope = { navigator: {} };
  usb = fakeUsb(scope, { present: true, granted: true, mode: { noName: true, nameString: '@Internal Flash   /0x08000000/04*016Kg,01*064Kg,07*128Kg' } });
  var error = await rejects(Dfu.write(usb.device, img, Dfu.BASE), 'an F4 named only in its descriptor');
  eq(error.guard, true, 'a guard refusal (F4 by descriptor)');
  eq(usb.log.commands.length, 0, 'commands sent to an F4 named by descriptor');
  eq(usb.device.opened, false, 'the F4 left open');
}

// A refusal or a failed claim leaves the device closed; no dead helpers.
async function closedOnRefusal() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true });
  var other = usb.addOther('@Internal Flash   /0x08000000/08*128Kg');
  await rejects(Dfu.write(other, image(4096), Dfu.BASE), 'a 1 MB layout');
  eq(other.opened, false, 'left open after a layout refusal');
  scope = { navigator: {} };
  usb = fakeUsb(scope, { present: true, granted: true, mode: { claimFails: true } });
  var error = await rejects(Dfu.write(usb.device, image(4096), Dfu.BASE, null, { claimMs: 300 }), 'a failed claim');
  eq(error.unopenable, true, 'a failed claim is unopenable');
  eq(usb.device.opened, false, 'left open after a failed claim');
  eq('known' in Dfu, false, 'the dead known() is still there');
}

// The real STM32H750 ROM's alternates, verbatim (dfu-util -l on the unit):
// three spaces after the name.
var REAL_FLASH = '@Internal Flash   /0x08000000/16*128Kg';
var REAL_OPTIONS = '@Option Bytes   /0x5200201C/01*128 e';

async function theRealH750() {
  eq(Dfu.isH7(REAL_FLASH), true, 'the H750 ROM\'s flash alternate');
  eq(Dfu.isH7(REAL_OPTIONS), false, 'the option bytes alternate');
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true });
  var opts = usb.addOther(REAL_OPTIONS);
  var error = await rejects(Dfu.write(opts, image(4096), Dfu.BASE), 'the option bytes');
  eq(error.guard, true, 'the option bytes refused');
  eq(opts.sent, 0, 'sent to the option bytes');
}

// fwupd (Linux) claims every new 0483:df11 a moment: the claim is retried
// every 250 ms, up to the window, before the device counts as unopenable;
// nothing is written meanwhile.
async function busyClaimRetried() {
  var scope = { navigator: {} };
  var usb = fakeUsb(scope, { present: true, granted: true, mode: { claimBusyFor: 3 } });
  await Dfu.write(usb.device, image(4096), Dfu.BASE, null, { claimMs: 3000 });
  eq(usb.log.left, true, 'written once the claim went through');
  scope = { navigator: {} };
  usb = fakeUsb(scope, { present: true, granted: true, mode: { claimFails: true } });
  var startedAt = Date.now();
  var error = await rejects(Dfu.write(usb.device, image(4096), Dfu.BASE, null, { claimMs: 800 }), 'a claim that never goes through');
  eq(error.unopenable && error.held, true, 'unopenable, held by another program');
  eq(Date.now() - startedAt >= 700, true, 'retried for the window');
  eq(usb.log.commands.length, 0, 'commands sent without the claim');
}

(async function () {
  guards();
  await theRealH750();
  await busyClaimRetried();
  await nameFromDescriptor();
  await closedOnRefusal();
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
})().catch(function (error) { fail(error.stack || error); });
