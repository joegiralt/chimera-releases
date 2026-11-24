// SPDX-License-Identifier: GPL-3.0-or-later
// node public/screen.check.js: screen.wasm (the firmware kit's, copied by `just kit`)
// painted as <chimera-screen> paints it, through the `spec` Elm builds,
// without a browser; then the paint cost, replayed from INIT (as before
// the live mirrors) and live.
var fs = require('fs');
var path = require('path');
var S = require('./screen.js');

function fail(msg) { console.error('FAIL ' + msg); process.exit(1); }

// The spec text Elm builds (contract § 1).
function spec(o) {
  return JSON.stringify({ engine: o.engine, page: o.page, region: o.region || 'screen',
                          focus: o.focus == null ? null : o.focus, pad: o.pad == null ? null : o.pad,
                          vals: o.vals || [] });
}

function differ(a, b) {
  var n = 0;
  for (var i = 0; i < a.rgba.length; i++) if (a.rgba[i] !== b.rgba[i]) n++;
  return n;
}

// `ed describe`'s schema fixture: each page's addresses, and a Sound of
// seeded random values, in describe order (a choice a whole option, which
// another variant may lack: that one is refused, the rest land).
function schema(name) {
  var text = fs.readFileSync(path.join(__dirname, '../tests/fixtures/' + name + '-schema.txt'), 'utf8');
  var pages = [], sound = [], seen = {}, page = null, seed = 12345;
  var rnd = function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  text.split('\n').forEach(function (l) {
    var w = l.split(' ');
    if (w[0] === 'page') { page = []; pages[Number(w[1])] = page; }
    if (w[0] === 'param') {
      var t = l.slice(l.lastIndexOf('" ') + 2).split(' ');
      var min = Number(t[2]), max = Number(t[3]), step = Number(t[4]);
      if (page.indexOf(w[1]) < 0) page.push(w[1]);
      if (seen[w[1]]) return;
      seen[w[1]] = true;
      // On the step's grid, as the unit stores it.
      var v = t[0] === 'cont' ? min + rnd() * (max - min) : Math.floor(rnd() * (max + 1));
      if (step > 0) v = Math.min(max, min + Math.round((v - min) / step) * step);
      sound.push([w[1], Math.fround(v)]);
    }
  });
  return { pages: pages, sound: sound };
}

S.load(fs.readFileSync(path.join(__dirname, 'screen.wasm'))).then(function (x) {
  var names = S.engines(x);
  var fixture = fs.readFileSync(path.join(__dirname, '../tests/fixtures/engines.txt'), 'utf8').trim().split('\n');
  // The kit's engines: the playable ones (engines.txt), then the MIXER's FX pages.
  if (JSON.stringify(names) !== JSON.stringify(fixture.concat(['MIXER']))) fail('engines ' + names + ' are not engines.txt\'s ' + fixture + ' and MIXER');
  var reset = function (e) { if (x.reset(names.indexOf(e)) !== 0) fail('reset ' + e); };
  var paint = function (o) { return S.paintSpec(x, names, spec(o)); };

  // A bad spec says why.
  [['', 'spec is no JSON'], ['[]', 'spec is no object'],
   [spec({ engine: 'NOPE', page: 0 }), 'no engine "NOPE"'],
   [spec({ engine: 'VA', page: -1 }), 'page -1'],
   [spec({ engine: 'VA', page: 0, region: 'side' }), 'no region "side"'],
   [spec({ engine: 'VA', page: 0, focus: 6 }), 'focus 6'],
   [spec({ engine: 'DRUM', page: 0, pad: 13 }), 'pad 13'],
   [spec({ engine: 'DRUM', page: 0, region: 'padicon' }), 'padicon needs a pad'],
   [spec({ engine: 'VA', page: 0, vals: [['VA.X', NaN]] }), 'vals[0] ["VA.X",null]'],
   [spec({ engine: 'VA', page: 0, vals: [['NOPE.X', 1]] }), 'vals refused whole (-1)']
  ].forEach(function (c) {
    var got = S.paintSpec(x, names, c[0]);
    if (got.error !== c[1]) fail('spec ' + c[0] + ': ' + JSON.stringify(got.error) + ' not ' + c[1]);
  });

  // A value the mirror refuses is said on the element, the rest painted:
  // data-refused and a mark, never only the console.
  var r = paint({ engine: 'ALGO', page: 0, vals: [['OP_A.WAVE', 99], ['ALGO.MORPH', 3]] });
  if (r.refused !== 1 || !r.rgba) fail('a refused value: ' + JSON.stringify({ refused: r.refused, rgba: !!r.rgba }));
  var st = S.state(r);
  if (st['data-refused'] !== '1 value refused' || st['data-painted'] !== '' || st['data-error'] !== null || !st.mark) {
    fail('a refused value\'s state ' + JSON.stringify(st));
  }
  st = S.state(paint({ engine: 'ALGO', page: 0, vals: [['ALGO.MORPH', 3]] }));
  if (st['data-refused'] !== null || st.mark) fail('a clean paint\'s state ' + JSON.stringify(st));
  st = S.state({ error: 'x' });
  if (st['data-error'] !== 'x' || st['data-painted'] !== null || !st.mark) fail('an error\'s state ' + JSON.stringify(st));

  // A crop is that box of the region alone, and one past the region says so.
  var whole = paint({ engine: 'VA', page: 0, region: 'gauge', focus: 0 });
  var part = S.paintSpec(x, names, JSON.stringify({ engine: 'VA', page: 0, region: 'gauge', focus: 0, pad: null, vals: [], crop: [28, 20, 80, 60] }));
  if (!part.rect || part.rect.w !== 80 || part.rect.h !== 60) fail('crop rect ' + JSON.stringify(part.rect));
  for (var cy = 0; cy < 60; cy++) for (var cx = 0; cx < 80; cx++) for (var ch = 0; ch < 4; ch++) {
    if (part.rgba[(cy * 80 + cx) * 4 + ch] !== whole.rgba[((cy + 20) * whole.rect.w + cx + 28) * 4 + ch]) fail('crop pixel ' + cx + ',' + cy);
  }
  if (!/past the region/.test(S.paintSpec(x, names, JSON.stringify({ engine: 'VA', page: 0, region: 'gauge', focus: 0, pad: null, vals: [], crop: [100, 0, 80, 60] })).error || '')) fail('a crop past the region');

  // ALGO's algorithm page morphs its chart with MORPH focused (2), as Elm
  // sends it; on ALG A (no focus) it shows ALG A.
  var at = function (morph, focus, region) {
    return paint({ engine: 'ALGO', page: 0, region: region, focus: focus, vals: [['ALGO.MORPH', morph]] });
  };
  var a = at(0, 2), b = at(100, 2);
  if (!a.rect || a.rect.w !== 240 || a.rect.h !== 68) fail('ALG screen rect: ' + JSON.stringify(a.rect));
  if (differ(a, b) < 50) fail('MORPH moved ' + differ(a, b) + ' channels with focus 2');
  if (differ(at(0, null), at(100, null)) !== 0) fail('MORPH moved ALG A\'s chart');
  // The same spec, the same pixels, whatever the mirror held before.
  if (differ(at(0, 2), a) !== 0) fail('a repaint differs');
  var g = at(64, 2, 'gauge');
  if (!g.rgba || g.rgba.length !== g.rect.w * g.rect.h * 4) fail('gauge');
  if (!paint({ engine: 'VA', page: 999 }).hidden) fail('a page past the end paints');
  names.forEach(function (e) {
    if (!paint({ engine: e, page: 0, region: 'full' }).rgba) fail(e + ' page 0');
  });

  // DRUM: a pad's icon is its machine's; KIT draws the spec's pad.
  var icon = function (m) { return paint({ engine: 'DRUM', page: 0, region: 'padicon', pad: 3, vals: [['PAD3.MACHINE', m]] }); };
  var i0 = icon(0), i5 = icon(5);
  if (i0.rect.w !== 80 || i0.rect.h !== 48) fail('pad icon rect ' + JSON.stringify(i0.rect));
  if (differ(i0, i5) === 0) fail('a pad icon ignores its machine');
  var kit = function (pad) { return paint({ engine: 'DRUM', page: 9, region: 'screen', pad: pad }); };
  if (differ(kit(5), kit(1)) === 0) fail('KIT ignores the spec\'s pad');
  if (differ(kit(5), kit(5)) !== 0) fail('KIT pad 5 twice differs');

  // A selector after the params it resets: the same as before them.
  var mch = function (vals) { reset('DRUM'); return paint({ engine: 'DRUM', page: 11, vals: vals }); };
  var knob = ['PAD1.KNOB_A', 3], machine = ['PAD1.MACHINE', 4];
  if (differ(mch([knob, machine]), mch([machine, knob])) !== 0) fail('a MACHINE after its knob resets it');

  // The paint cost of one value change, on every page of the engine as a
  // screen: before, each paint replays the Part's every value from INIT and
  // every screen carries them all, so each repaints; live, each screen
  // carries its own page's values, and its mirror writes the diff alone.
  function cost(engine, file, addr, to) {
    var sc = schema(file);
    var sound = sc.sound;
    if (!sound.some(function (v) { return v[0] === addr; })) fail(addr + ' not in ' + file);
    var changed = sound.map(function (v) { return v[0] === addr ? [addr, to] : v; });
    var pages = sc.pages.map(function (_, n) { return n; });
    var e = names.indexOf(engine);
    var time = function (f) { var t = process.hrtime.bigint(); f(); return Number(process.hrtime.bigint() - t) / 1e6; };
    // Before: every screen repaints, each from INIT with every value.
    var before = { paints: 0, ms: 0, writes: 0 };
    pages.forEach(function (n) {
      before.ms += time(function () {
        x.reset(e);
        S.apply(x, e, changed);
        x.show(e, n, 1, -1, 0);
      });
      before.writes += x.writes();
      before.paints++;
    });
    // Live: a screen repaints only if its page's values moved.
    reset(engine);
    var own = function (vals, n) { return vals.filter(function (v) { return sc.pages[n].indexOf(v[0]) >= 0; }); };
    pages.forEach(function (n) { S.apply(x, e, own(sound, n)); x.show(e, n, 1, -1, 0); });
    var live = { paints: 0, ms: 0, writes: 0 };
    pages.forEach(function (n) {
      if (JSON.stringify(own(sound, n)) === JSON.stringify(own(changed, n))) return;
      live.ms += time(function () { S.apply(x, e, own(changed, n)); x.show(e, n, 1, -1, 0); });
      live.writes += x.writes();
      live.paints++;
    });
    if (live.paints === 0 || live.writes !== live.paints) fail(engine + ': ' + JSON.stringify(live));
    console.log('screen.check: ' + engine + ' ' + addr + ' over ' + pages.length + ' screens: before ' +
      before.paints + ' paints, ' + (before.ms / before.paints).toFixed(2) + ' ms each (' + before.ms.toFixed(1) +
      ' ms), ' + Math.round(before.writes / before.paints) + ' values written each; live ' + live.paints + ' paint(s), ' + (live.ms / live.paints).toFixed(2) + ' ms each, ' +
      live.writes + ' value(s) written');
  }
  // The MIXER's effects: each picture more than a line, moving from frame to
  // frame, and with its cell's value; a still spec drawn the same at any frame.
  var mixer = schema('mixer');
  var pageOf = function (label) {
    var text = fs.readFileSync(path.join(__dirname, '../tests/fixtures/mixer-schema.txt'), 'utf8');
    var m = new RegExp('^page (\\d+) ' + label + ' of', 'm').exec(text);
    return Number(m[1]);
  };
  var fxAt = function (label, region, focus, frame, vals) {
    x.reset(names.indexOf('MIXER'));
    return S.paintSpec(x, names, spec({ engine: 'MIXER', page: pageOf(label), region: region, focus: focus, vals: vals || mixer.sound }), frame);
  };
  // (The reverb's cube moves with MIX, its tail with TIME: either will do.)
  [['CHR', 'gauge', 0, ['CHORUS.MIX']], ['DLY', 'gauge', 2, ['DELAY.FDBK']], ['REV', 'gauge', 5, ['REVERB.MIX', 'REVERB.TIME']], ['MST', 'screen', null, ['COMP.THRESH']]].forEach(function (c) {
    var a = fxAt(c[0], c[1], c[2], 0), b = fxAt(c[0], c[1], c[2], 37);
    if (!a.rgba) fail('MIXER ' + c[0] + ': ' + JSON.stringify(a.error || a));
    var with_ = function (addr) { return mixer.sound.map(function (v) { return v[0] === addr ? [v[0], Math.fround(v[1] > 0.5 ? 0.1 : 0.9)] : v; }); };
    if (!c[3].some(function (addr) { return differ(a, fxAt(c[0], c[1], c[2], 0, with_(addr))) > 0; })) fail('MIXER ' + c[0] + ' ignores ' + c[3].join(' and '));
    console.log('screen.check: MIXER ' + c[0] + ' ' + c[1] + ' ' + a.rect.w + 'x' + a.rect.h + ', frame 0 vs 37: ' + differ(a, b) + ' channels moved');
  });

  cost('ALGO', 'algo', 'ALGO.MORPH', 64);
  cost('DRUM', 'drum', 'PAD3.LEVEL', 40);
  console.log('screen.check: ok');
}).catch(function (e) { fail(e.stack || e); });
