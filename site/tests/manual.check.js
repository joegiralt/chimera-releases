// SPDX-License-Identifier: GPL-3.0-or-later
// node tests/manual.check.js: the manual as the build serves it. Builds the pages and the
// manual's files into a scratch dir (scripts/pages.js, scripts/manual.js), then: the index and
// every chapter file have a page (index.html, titled), and every link and image in every
// manual page lands in that dist: a chapter's page, a heading of it, an image, manual.md or
// llms.txt.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const site = path.join(__dirname, "..");
const dir = "manual/preenfm3/0.4";
const out = fs.mkdtempSync(path.join(os.tmpdir(), "manual-"));
let failed = false;
const fail = (m) => {
  console.error(`FAIL ${m}`);
  failed = true;
};
// GitHub's heading ids, with -1, -2 for a repeat.
const ids = (md) => {
  const seen = {};
  return stripCode(md)
    .split("\n")
    .filter((l) => /^#{1,6} /.test(l))
    .map((l) => {
      const base = l.replace(/^#+ /, "").replace(/[`*_]/g, (c) => (c === "_" ? c : "")).toLowerCase().replace(/[^\p{L}\p{N} _-]/gu, "").replace(/ /g, "-");
      const n = seen[base] ?? 0;
      seen[base] = n + 1;
      return n ? `${base}-${n}` : base;
    });
};
const stripCode = (md) => md.replace(/^(```|~~~)[\s\S]*?^\1.*$/gm, "");
try {
  execFileSync(process.execPath, [path.join(site, "scripts", "pages.js"), out, "/"], { stdio: ["ignore", "pipe", "inherit"] });
  execFileSync(process.execPath, [path.join(site, "scripts", "manual.js"), out, "/"], { stdio: "inherit" });
  const src = path.join(site, "..", dir);
  const files = fs.readdirSync(src).filter((f) => f.endsWith(".md") && f !== "manual.md");
  if (files.length < 22) fail(`only ${files.length} manual files`);
  const pageOf = (f) => (f === "README.md" ? path.join(out, dir, "index.html") : path.join(out, dir, f.replace(/\.md$/, ""), "index.html"));
  const headings = {};
  for (const f of files) {
    const page = pageOf(f);
    if (!fs.existsSync(page)) fail(`${f}: no page at ${path.relative(out, page)}`);
    else if (!/<title>[^<]+ · Chimera<\/title>/.test(fs.readFileSync(page, "utf8"))) fail(`${f}: page not titled`);
    headings[f] = ids(fs.readFileSync(path.join(src, f), "utf8"));
  }
  for (const f of ["manual.md", "llms.txt"]) if (!fs.existsSync(path.join(out, dir, f))) fail(`${f} not copied`);
  if (!fs.existsSync(path.join(out, "llms.txt"))) fail("no llms.txt at the root");
  let links = 0;
  for (const f of files) {
    const md = stripCode(fs.readFileSync(path.join(src, f), "utf8"));
    for (const m of md.matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const dest = m[1];
      if (/^(https?:|mailto:)/.test(dest)) continue;
      links++;
      const [file, frag] = dest.split("#");
      if (file === "") {
        if (frag && !headings[f].includes(frag)) fail(`${f}: no heading #${frag}`);
      } else if (headings[file]) {
        if (!fs.existsSync(pageOf(file))) fail(`${f}: ${dest} has no page`);
        if (frag && !headings[file].includes(frag)) fail(`${f}: no heading ${file}#${frag}`);
      } else if (!fs.existsSync(path.join(out, dir, file))) fail(`${f}: ${dest} is not in dist`);
    }
  }
  if (!failed) console.log(`manual: ${files.length} pages, ${links} links and images resolve in dist`);
} finally {
  fs.rmSync(out, { recursive: true });
}
if (failed) process.exit(1);
