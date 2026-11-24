// SPDX-License-Identifier: GPL-3.0-or-later
// The Yellow Sign, Chimera's mark, traced from the firmware's boot splash bitmap
// (`node scripts/sign.js <yellow_sign.rle>`, chimera-core/src/ui/yellow_sign.rle at origin/0.4:
// 192 x 192, runs of ground then ink, alternating). Christian Knutsson's design for Pelgrane
// Press, public domain since 2020.
//
// The trace: the bitmap 4x up (bilinear), Gaussian-blurred, its 50 % contour by marching
// squares, each loop simplified (Douglas-Peucker). The ring is drawn as two true circles fit
// to its traced extent; the glyph and its two dots as smooth curves through the traced points.
//
// Writes:
//   src/Sign.elm                  the mark as drawn on the pages (the trace as it is)
//   public/favicon.svg            the tab icon: the mark made bolder to read at 16 px (a heavier
//                                 ring, the glyph larger and stroked), black on yellow as the
//                                 splash, yellow on the NIGHT ground in dark mode
//   public/favicon-32.png         for browsers without SVG icons (light)
//   public/apple-touch-icon.png   180 px (light)
// The PNGs need rsvg-convert (librsvg) on PATH, or RSVG=<path to it>. PREVIEW=<dir> also
// renders both modes at 16, 32 and 180 px there.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const S = 192;
const UP = 4;
const BLUR = 2.4; // in bitmap pixels
const EPS = 0.5; // simplification, in bitmap pixels
const YELLOW = "#f1e579"; // the splash's yellow
const INK = "#0a0b0d"; // the firmware's ground; the editor's NIGHT ground

if (!process.argv[2]) throw new Error("usage: node scripts/sign.js <yellow_sign.rle>");
const rle = fs.readFileSync(process.argv[2]);
const ink = new Uint8Array(S * S);
let at = 0;
rle.forEach((run, i) => {
  if (i % 2 === 1) ink.fill(1, at, at + run);
  at += run;
});
if (at !== S * S) throw new Error(`runs cover ${at}, not ${S * S}`);

// The field: a ground border of 2 so every loop closes, 4x up bilinear, then blurred.
const P = S + 4;
const W = P * UP;
const src = (x, y) => (x < 2 || y < 2 || x >= S + 2 || y >= S + 2 ? 0 : ink[(y - 2) * S + (x - 2)] * 255);
let field = new Float64Array(W * W);
for (let y = 0; y < W; y++)
  for (let x = 0; x < W; x++) {
    const fx = Math.min(Math.max((x + 0.5) / UP - 0.5, 0), P - 1);
    const fy = Math.min(Math.max((y + 0.5) / UP - 0.5, 0), P - 1);
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const x1 = Math.min(x0 + 1, P - 1), y1 = Math.min(y0 + 1, P - 1);
    const tx = fx - x0, ty = fy - y0;
    field[y * W + x] = (src(x0, y0) * (1 - tx) + src(x1, y0) * tx) * (1 - ty) + (src(x0, y1) * (1 - tx) + src(x1, y1) * tx) * ty;
  }
// Separable Gaussian.
const sigma = (BLUR * UP) / 2;
const rad = Math.ceil(sigma * 3);
const k = [];
for (let i = -rad; i <= rad; i++) k.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
const ks = k.reduce((a, b) => a + b);
const pass = (f, dx, dy) => {
  const o = new Float64Array(W * W);
  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let i = -rad; i <= rad; i++) {
        const xx = Math.min(Math.max(x + i * dx, 0), W - 1), yy = Math.min(Math.max(y + i * dy, 0), W - 1);
        s += f[yy * W + xx] * k[i + rad];
      }
      o[y * W + x] = s / ks;
    }
  return o;
};
field = pass(pass(field, 1, 0), 0, 1);
const T = 127.5;

// Marching squares: each cell's crossing edges joined; loops followed edge to edge.
const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const links = new Map();
const link = (a, b) => {
  if (!links.has(a)) links.set(a, []);
  if (!links.has(b)) links.set(b, []);
  links.get(a).push(b);
  links.get(b).push(a);
};
for (let y = 0; y < W - 1; y++)
  for (let x = 0; x < W - 1; x++) {
    const c = [y * W + x, y * W + x + 1, (y + 1) * W + x + 1, (y + 1) * W + x];
    const ins = c.map((p) => field[p] > T);
    const n = ins.filter(Boolean).length;
    if (n === 0 || n === 4) continue;
    const e = {};
    for (let i = 0; i < 4; i++) if (ins[i] !== ins[(i + 1) % 4]) e[i] = key(c[i], c[(i + 1) % 4]);
    const es = Object.keys(e).map(Number);
    if (es.length === 2) link(e[es[0]], e[es[1]]);
    else if (c.reduce((s, p) => s + field[p], 0) / 4 > T === ins[0]) {
      // A saddle: joined by the centre's side.
      link(e[3], e[0]);
      link(e[1], e[2]);
    } else {
      link(e[0], e[1]);
      link(e[2], e[3]);
    }
  }
const crossing = (kk) => {
  const [a, b] = kk.split("|").map(Number);
  const t = (T - field[a]) / (field[b] - field[a]);
  const ax = a % W, ay = Math.floor(a / W), bx = b % W, by = Math.floor(b / W);
  return [(ax + t * (bx - ax)) / UP - 2, (ay + t * (by - ay)) / UP - 2];
};
const seen = new Set();
const loops = [];
for (const start of links.keys()) {
  if (seen.has(start)) continue;
  const loop = [];
  let prev = null, cur = start;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    loop.push(crossing(cur));
    const nx = links.get(cur).find((e) => e !== prev && !seen.has(e));
    prev = cur;
    cur = nx;
  }
  if (loop.length > 8) loops.push(loop);
}

const dp = (pts) => {
  if (pts.length < 3) return pts;
  const [x0, y0] = pts[0], [x1, y1] = pts[pts.length - 1];
  const dx = x1 - x0, dy = y1 - y0, n = Math.hypot(dx, dy) || 1;
  let far = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x1 * y0 - y1 * x0) / n;
    if (d > far) [far, idx] = [d, i];
  }
  return far > EPS ? [...dp(pts.slice(0, idx + 1)).slice(0, -1), ...dp(pts.slice(idx))] : [pts[0], pts[pts.length - 1]];
};
// A closed loop: split at the point farthest from its start, each half simplified.
const simple = loops
  .map((l) => {
    const [x0, y0] = l[0];
    let far = 0;
    l.forEach(([x, y], i) => {
      if (Math.hypot(x - x0, y - y0) > Math.hypot(l[far][0] - x0, l[far][1] - y0)) far = i;
    });
    return [...dp(l.slice(0, far + 1)).slice(0, -1), ...dp([...l.slice(far), l[0]]).slice(0, -1)];
  })
  .filter((l) => l.length >= 4);
// Largest first: the ring's outer edge, its inner edge, then the glyph and its dots.
const area = (l) => Math.abs(l.reduce((s, [x, y], i) => s + x * l[(i + 1) % l.length][1] - l[(i + 1) % l.length][0] * y, 0) / 2);
simple.sort((a, b) => area(b) - area(a));
if (simple.length !== 5) throw new Error(`${simple.length} loops traced, not 5 (the ring's two edges, the glyph, its two dots)`);
const [outer, inner, ...glyph] = simple;

const f = (x) => String(Math.round(x * 10) / 10);
const extent = (l) => [Math.min(...l.map((p) => p[0])), Math.max(...l.map((p) => p[0])), Math.min(...l.map((p) => p[1])), Math.max(...l.map((p) => p[1]))];
const [ox0, ox1, oy0, oy1] = extent(outer);
const [ix0, ix1, iy0, iy1] = extent(inner);
const cx = (ox0 + ox1 + ix0 + ix1) / 4, cy = (oy0 + oy1 + iy0 + iy1) / 4;
const R = (ox1 - ox0 + oy1 - oy0) / 4, r = (ix1 - ix0 + iy1 - iy0) / 4;
const circle = (x, y, q) => `M${f(x - q)} ${f(y)}a${f(q)} ${f(q)} 0 1 0 ${f(2 * q)} 0a${f(q)} ${f(q)} 0 1 0 ${f(-2 * q)} 0z`;
// Each traced point a control, the midpoints between them the anchors.
const smooth = (l) => {
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(l[l.length - 1], l[0]);
  const qs = l.map((p, i) => {
    const e = mid(p, l[(i + 1) % l.length]);
    return `Q${f(p[0])} ${f(p[1])} ${f(e[0])} ${f(e[1])}`;
  });
  return `M${f(m0[0])} ${f(m0[1])}${qs.join("")}z`;
};
const glyphD = glyph.map(smooth).join("");
const markD = circle(cx, cy, R) + circle(cx, cy, r) + glyphD;

const out = (p) => path.join(__dirname, "..", p);
fs.writeFileSync(
  out("src/Sign.elm"),
  `-- SPDX-License-Identifier: GPL-3.0-or-later


module Sign exposing (d, view)

{-| The Yellow Sign, Chimera's mark (Christian Knutsson for Pelgrane Press,
public domain): the boot splash's bitmap, traced.
Generated by scripts/sign.js; don't edit.
-}

import Svg exposing (Svg)
import Svg.Attributes as Attr


view : Svg msg
view =
    Svg.svg [ Attr.viewBox "0 0 ${S} ${S}", Attr.class "sign" ]
        [ Svg.path [ Attr.fill "currentColor", Attr.fillRule "evenodd", Attr.d d ] [] ]


{-| The mark's path, in a ${S} x ${S} box (fill it even-odd).
-}
d : String
d =
    "${markD}"
`
);

// The tab icon, centred: the ring heavier, the glyph 1.18x and stroked 5 px, so it reads at
// 16 px. `mode` undefined: both modes by `prefers-color-scheme`; else that mode alone.
const icon = (mode) => {
  const [ground, sign] = mode === "dark" ? [INK, YELLOW] : [YELLOW, INK];
  const both = mode === undefined;
  const style = both
    ? `<style>rect{fill:${YELLOW}}path{fill:${INK}}.g{stroke:${INK}}@media (prefers-color-scheme: dark){rect{fill:${INK}}path{fill:${YELLOW}}.g{stroke:${YELLOW}}}</style>`
    : "";
  const fill = both ? "" : ` fill="${sign}"`;
  const stroke = both ? "" : ` stroke="${sign}"`;
  return `<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- The Yellow Sign: Christian Knutsson for Pelgrane Press, public domain. Generated by site/scripts/sign.js. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">${style}<rect width="${S}" height="${S}" rx="20"${both ? "" : ` fill="${ground}"`}/><path fill-rule="evenodd"${fill} d="${circle(96, 96, 90)}${circle(96, 96, 72)}"/><path class="g"${fill}${stroke} stroke-width="${f(5 / 1.18)}" stroke-linejoin="round" transform="translate(96 96) scale(1.18) translate(${f(-cx)} ${f(-cy)})" d="${glyphD}"/></svg>
`;
};
fs.writeFileSync(out("public/favicon.svg"), icon());

const rsvg = process.env.RSVG || "rsvg-convert";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sign-"));
for (const mode of ["light", "dark"]) fs.writeFileSync(path.join(tmp, `${mode}.svg`), icon(mode));
const render = (mode, px, to) => execFileSync(rsvg, ["-w", String(px), "-h", String(px), path.join(tmp, `${mode}.svg`), "-o", to]);
render("light", 32, out("public/favicon-32.png"));
render("light", 180, out("public/apple-touch-icon.png"));
if (process.env.PREVIEW)
  for (const mode of ["light", "dark"]) for (const px of [16, 32, 180]) render(mode, px, path.join(process.env.PREVIEW, `favicon-${mode}-${px}.png`));
fs.rmSync(tmp, { recursive: true });
console.log(`centre ${f(cx)} ${f(cy)}, ring ${f(R)}/${f(r)}; mark ${markD.length} bytes`);
