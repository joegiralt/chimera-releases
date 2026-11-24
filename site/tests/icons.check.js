// SPDX-License-Identifier: GPL-3.0-or-later
// node tests/icons.check.js: every page's head links the tab icon (the SVG, the
// 32 px PNG for browsers without SVG icons, the 180 px apple-touch one), the
// files exist at the right sizes, and the SVG carries its dark-mode colours.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
const icons = path.join(root, "site", "public");
let failed = false;
const fail = (m) => {
  console.error(`FAIL ${m}`);
  failed = true;
};

// Every HTML page a browser opens: the site's (every route, 404.html too), the editor's, its gallery.
const pages = ["site/public/index.html", "editor/public/index.html", "editor/public/gallery.html"];
const wants = [
  /<link rel="icon" href="[^"]*favicon\.svg" type="image\/svg\+xml">/,
  /<link rel="icon" href="[^"]*favicon-32\.png" type="image\/png" sizes="32x32">/,
  /<link rel="apple-touch-icon" href="[^"]*apple-touch-icon\.png" sizes="180x180">/,
];
for (const p of pages) {
  const head = (fs.readFileSync(path.join(root, p), "utf8").match(/<head>[\s\S]*<\/head>/) ?? [""])[0];
  for (const w of wants) if (!w.test(head)) fail(`${p}: no ${w}`);
}

const svg = fs.readFileSync(path.join(icons, "favicon.svg"), "utf8");
if (!/@media \(prefers-color-scheme: dark\)/.test(svg)) fail("favicon.svg: no dark-mode colours");

// A PNG's size, from its IHDR.
const size = (f) => {
  const b = fs.readFileSync(path.join(icons, f));
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};
for (const [f, s] of [["favicon-32.png", 32], ["apple-touch-icon.png", 180]]) {
  if (!fs.existsSync(path.join(icons, f))) fail(`${f} missing`);
  else if (size(f).join() !== `${s},${s}`) fail(`${f} is ${size(f).join("x")}, not ${s}x${s}`);
}

if (failed) process.exit(1);
console.log(`icons: ${pages.length} pages link them`);
