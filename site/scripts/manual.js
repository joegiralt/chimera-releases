// SPDX-License-Identifier: GPL-3.0-or-later
// node scripts/manual.js <out> <base>: the manual's files (the chapters' Markdown, img/,
// manual.md, llms.txt) into <out>/manual/preenfm3/0.4/, beside the pages.js index.html
// files; and llms.txt at the site's root (its links made absolute under <base>) unless the
// site already has one.
const fs = require("fs");
const path = require("path");

const [out, base = "/"] = process.argv.slice(2);
if (!out) throw new Error("usage: node scripts/manual.js <out> [base]");
const dir = "manual/preenfm3/0.4";
const from = path.join(__dirname, "..", "..", dir);
fs.cpSync(from, path.join(out, dir), { recursive: true });
const root = path.join(out, "llms.txt");
if (!fs.existsSync(root) && !fs.existsSync(path.join(__dirname, "..", "public", "llms.txt"))) {
  const text = fs.readFileSync(path.join(from, "llms.txt"), "utf8").replace(/\]\((?!https?:|#|\/)([^)]+)\)/g, `](${base}${dir}/$1)`);
  fs.writeFileSync(root, text);
}
