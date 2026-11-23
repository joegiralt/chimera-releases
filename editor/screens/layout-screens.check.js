// SPDX-License-Identifier: GPL-3.0-or-later
// node screens/layout-screens.check.js [--hashes]: every layout screen, as the
// editor's page builds its spec (screens/LayoutScreens.elm, compiled to
// screens/layout-screens.js), painted by the kit's screen.wasm as
// <chimera-screen> paints it. Each must draw more than the scope's centre line,
// and move when its page's values move; a screen that reads addresses off its
// page (VA's WAVE morph reads SHAPE) must move with those too. Values: each
// engine's INIT (its schema's defaults and its INIT panels), then every
// continuous or stepped value redrawn at random (choices kept, so the variant
// stays), or, for a picture a choice picks, every value redrawn. --hashes
// prints each screen's pixel hash, at INIT and with the values moved.
var fs = require('fs');
var path = require('path');
var S = require('../public/screen.js');

var fixtures = path.join(__dirname, '../tests/fixtures');
var ENGINES = ['ALGO', 'VA', 'MODAL', 'TAPE', 'DRUM'];
var problems = [];
function fail(msg) { console.error('FAIL ' + msg); process.exit(1); }

function file(name) { return fs.readFileSync(path.join(fixtures, name), 'utf8').split('\n').filter(function (l) { return l !== ''; }); }

// Each param once, in describe order: its INIT (stored) value and how it moves.
function params(lines) {
  var seen = {}, out = [];
  lines.forEach(function (l) {
    var w = l.split(' ');
    if (w[0] !== 'param' || seen[w[1]]) return;
    seen[w[1]] = true;
    var t = l.slice(l.lastIndexOf('" ') + 2).split(' ');
    out.push({ addr: w[1], kind: t[0], min: Number(t[2]), max: Number(t[3]), step: Number(t[4]), def: Number(t[5]) });
  });
  return out;
}

function moved(p, rnd) {
  var v = p.min + rnd() * (p.max - p.min);
  if (p.step > 0) v = Math.min(p.max, p.min + Math.round((v - p.min) / p.step) * p.step);
  return Math.fround(v);
}

// A choice's option other than its INIT one.
function other(p, rnd) {
  var n = p.max - p.min + 1;
  if (n < 2) return Math.fround(p.def);
  return Math.fround(p.min + (p.def - p.min + 1 + Math.floor(rnd() * (n - 1))) % n);
}

function seeded(seed) {
  return function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
}

function hash(r) {
  if (r.hidden) return 'hidden';
  if (r.error) return 'error';
  var x = 2166136261;
  for (var i = 0; i < r.rgba.length; i++) { x ^= r.rgba[i]; x = Math.imul(x, 16777619) >>> 0; }
  return ('0000000' + x.toString(16)).slice(-8);
}

// Rows holding a pixel other than the picture's commonest colour: a flat
// scope is its one centre line, two rows at most.
function inkRows(r) {
  var count = {}, best = 0, bg = 0;
  for (var i = 0; i < r.rgba.length; i += 4) {
    var c = (r.rgba[i] << 16) | (r.rgba[i + 1] << 8) | r.rgba[i + 2];
    count[c] = (count[c] || 0) + 1;
    if (count[c] > best) { best = count[c]; bg = c; }
  }
  var rows = 0;
  for (var y = 0; y < r.rect.h; y++) {
    for (var x = 0; x < r.rect.w; x++) {
      var o = (y * r.rect.w + x) * 4;
      if (((r.rgba[o] << 16) | (r.rgba[o + 1] << 8) | r.rgba[o + 2]) !== bg) { rows++; break; }
    }
  }
  return rows;
}

// The worker's answer for these values.
function specs(vals) {
  var Elm = require('./layout-screens.js').Elm;
  var flags = ENGINES.map(function (e) {
    var name = e.toLowerCase();
    var init = file(name + '-init.txt');
    return {
      name: e,
      schema: file(name + '-schema.txt'),
      vals: vals[e],
      variants: init.map(function (l) { return l.split(' '); }).filter(function (w) { return w[0] === 'panel' && w.length === 3; }).map(function (w) { return [w[1], w[2]]; })
    };
  });
  return new Promise(function (res) {
    var app = Elm.LayoutScreens.init({ flags: flags });
    app.ports.screens.subscribe(function (got) {
      if (!got || got.error) fail('the worker: ' + JSON.stringify(got && got.error));
      res([].concat.apply([], got));
    });
  });
}

S.load(fs.readFileSync(path.join(__dirname, '../public/screen.wasm'))).then(async function (x) {
  var names = S.engines(x);
  var init = {}, moved_ = {}, any_ = {}, all = {};
  ENGINES.forEach(function (e, k) {
    var ps = params(file(e.toLowerCase() + '-schema.txt'));
    var rnd = seeded(4242 + k);
    all[e] = ps;
    init[e] = ps.map(function (p) { return [p.addr, Math.fround(p.def)]; });
    moved_[e] = ps.map(function (p) { return p.kind === 'cont' || p.kind === 'stepped' ? [p.addr, moved(p, rnd)] : [p.addr, Math.fround(p.def)]; });
    any_[e] = ps.map(function (p) { return [p.addr, p.kind === 'cont' || p.kind === 'stepped' ? moved(p, rnd) : other(p, rnd)]; });
  });
  var A = await specs(init), B = await specs(moved_), D = await specs(any_);
  if (A.length !== B.length || A.length === 0) fail('screens: ' + A.length + ' then ' + B.length);
  // Only the addresses screens read off their pages moved: those screens move.
  var readsMoved = {};
  ENGINES.forEach(function (e) {
    var reads = {};
    A.forEach(function (s) { if (s.engine === e) s.reads.forEach(function (r) { reads[r] = true; }); });
    readsMoved[e] = init[e].map(function (v, i) { return reads[v[0]] ? moved_[e][i] : v; });
  });
  var C = await specs(readsMoved);
  var paint = function (s) {
    x.reset(names.indexOf(s.engine));
    return S.paintSpec(x, names, JSON.stringify(s.spec));
  };
  // A picture keyed by a choice (an operator's wave, a pad's machine) moves
  // when the choices do too: a whole random Sound, drawn.
  var moves = function (pa, pd) { return !pd.error && !pd.hidden && hash(pd) !== hash(pa); };
  var hashes = [];
  A.forEach(function (a, i) {
    var what = a.engine + ' ' + (a.note ? a.note + ' ' : '') + a.title + ' (' + a.page + (a.spec ? ' ' + a.spec.region + (a.spec.focus === null ? '' : ' cell ' + 'ABCDEF'[a.spec.focus]) : '') + ')';
    if (!a.spec) { problems.push(what + ': no spec'); return; }
    var pa = paint(a), pb = paint(B[i]);
    hashes.push(what + ' ' + hash(pa) + ' -> ' + hash(pb));
    if (pa.error || pa.hidden) { problems.push(what + ': ' + (pa.error || 'hidden')); return; }
    var rows = inkRows(pa);
    if (rows <= 2) problems.push(what + ': only a centre line (' + rows + ' row' + (rows === 1 ? '' : 's') + ' of ink)');
    else if (hash(pa) === hash(pb) && !moves(pa, paint(D[i]))) problems.push(what + ': does not move with its page\'s values');
    if (a.reads.length && hash(paint(C[i])) === hash(pa)) problems.push(what + ': does not move with ' + a.reads.join(', '));
  });
  if (process.argv.indexOf('--hashes') >= 0) hashes.forEach(function (h) { console.log(h); });
  if (problems.length) fail(problems.length + ' of ' + A.length + ' layout screens:\n  ' + problems.join('\n  '));
  console.log('layout-screens.check: ' + A.length + ' layout screens draw their art and move with their values');
}).catch(function (e) { fail(e.stack || e); });
