// SPDX-License-Identifier: GPL-3.0-or-later
// node tests/pages.check.js: every route the router lists (Route.all) gets its own
// <route>/index.html at build time, with that page's title and description, so a deep link is
// a 200 and not GitHub Pages' 404 fallback; 404.html stays for unknown paths. Builds the page
// list (src/Pages.elm) and writes the files into a scratch dir with scripts/pages.js.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const site = path.join(__dirname, "..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "pages-"));
let failed = false;
const fail = (m) => {
  console.error(`FAIL ${m}`);
  failed = true;
};
try {
  execFileSync(process.execPath, [path.join(site, "scripts", "pages.js"), out, "/chimera-releases/"], { stdio: ["ignore", "pipe", "inherit"] });
  const pages = JSON.parse(fs.readFileSync(path.join(out, "pages.json"), "utf8"));
  if (pages.length < 5) fail(`only ${pages.length} pages listed`);
  for (const p of pages) {
    const file = path.join(out, p.path, "index.html");
    if (!fs.existsSync(file)) {
      fail(`${p.path}: no index.html`);
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    if (!html.includes(`<title>${p.title}</title>`)) fail(`${p.path}: not titled ${p.title}`);
    if (!html.includes(`<meta name="description" content="${p.description}">`)) fail(`${p.path}: no description`);
    if (!html.includes('src="/chimera-releases/elm.js"') || html.includes("__")) fail(`${p.path}: the shell's placeholders not filled`);
  }
  for (const p of ["install", "guides", "guides/licensing", "releases", "sound-editor"])
    if (!pages.some((q) => q.path === p)) fail(`${p} not among the pages`);
  if (!fs.existsSync(path.join(out, "404.html"))) fail("no 404.html");
  if (!failed) console.log(`pages: ${pages.length} routes, each its own index.html`);
} finally {
  fs.rmSync(out, { recursive: true });
}
if (failed) process.exit(1);
