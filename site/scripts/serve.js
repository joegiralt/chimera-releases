// SPDX-License-Identifier: GPL-3.0-or-later
// Serves site/dist on localhost as GitHub Pages would: a file, a folder's
// index.html (a folder asked for without its slash redirects to it), or
// else 404.html (the app, which routes the path itself).
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "dist");
const port = Number(process.argv[2] || 8000);
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".wasm": "application/wasm", ".png": "image/png", ".md": "text/markdown; charset=utf-8",
};

const file = (p) => { try { return fs.statSync(p).isFile() ? p : null; } catch { return null; } };

http
  .createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const p = path.join(root, path.normalize(rel));
    // A folder without its slash moves to it, as on Pages: /editor -> /editor/.
    const dir = p.startsWith(root) && !rel.endsWith("/") && (() => { try { return fs.statSync(p).isDirectory(); } catch { return false; } })();
    if (dir) {
      res.writeHead(301, { location: rel + "/" });
      res.end();
      return;
    }
    const found = p.startsWith(root) && (file(p) || file(path.join(p, "index.html")));
    const served = found || path.join(root, "404.html");
    res.writeHead(found ? 200 : 404, { "content-type": types[path.extname(served)] || "application/octet-stream" });
    fs.createReadStream(served).pipe(res);
  })
  .listen(port, "127.0.0.1", () => console.log(`site on http://127.0.0.1:${port}/`));
