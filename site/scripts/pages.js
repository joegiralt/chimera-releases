// SPDX-License-Identifier: GPL-3.0-or-later
// node scripts/pages.js <out> <base>: the app's shell (public/index.html) as an index.html for
// every route the router lists (src/Pages.elm, from Route.all): `<out>/<route>/index.html`,
// each with its page's title and description, so a deep link on GitHub Pages is a 200 (and a
// link preview names the page), not the 404 fallback. `<out>/404.html` stays for unknown paths.
// Also writes `<out>/pages.json`, the list it wrote.
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const [out, base = "/"] = process.argv.slice(2);
if (!out) throw new Error("usage: node scripts/pages.js <out> [base]");
const site = path.join(__dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pages-elm-"));
const js = path.join(tmp, "pages.js");
execFileSync(path.join(site, "node_modules", ".bin", "elm"), ["make", "src/Pages.elm", "--optimize", `--output=${js}`], { cwd: site, stdio: ["ignore", "ignore", "inherit"] });

const ctx = { console, setTimeout, clearTimeout };
vm.runInNewContext(fs.readFileSync(js, "utf8"), ctx);
fs.rmSync(tmp, { recursive: true });
let pages = null;
ctx.Elm.Pages.init().ports.pages.subscribe((p) => (pages = p));
// The worker sends its list when its first command runs: a task later.
setTimeout(() => {
  if (!pages) throw new Error("src/Pages.elm sent no pages");
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const shell = fs.readFileSync(path.join(site, "public", "index.html"), "utf8");
  const fill = (p) => shell.replace(/__BASE__/g, base).replace("__TITLE__", esc(p.title)).replace("__DESCRIPTION__", esc(p.description));
  for (const p of pages) {
    fs.mkdirSync(path.join(out, p.path), { recursive: true });
    fs.writeFileSync(path.join(out, p.path, "index.html"), fill(p));
  }
  // Unknown paths: the home's shell, which shows Not found.
  fs.writeFileSync(path.join(out, "404.html"), fill(pages.find((p) => p.path === "")));
  fs.writeFileSync(path.join(out, "pages.json"), JSON.stringify(pages.map((p) => ({ ...p, title: esc(p.title), description: esc(p.description) })), null, 1));
  console.log(`pages: ${pages.length} routes`);
}, 0);
