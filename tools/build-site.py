#!/usr/bin/env python3
"""Build the GitHub Pages site (docs/*.html) from the Markdown at the repo root.
Usage: python3 tools/build-site.py   (stdlib only; rerun after editing any .md)
Edit the Markdown, never the generated docs/*.html. Home page: tools/home.html."""
import html, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "docs"
REPO = "https://github.com/joegiralt/chimera-releases"
RELEASES = REPO + "/releases"
# source md -> (output file, nav label, title)
PAGES = [
    ("README.md", "install.html", "Install", "Install Chimera"),
    ("QUICK-START.md", "quick-start.html", "Quick start", "Quick start"),
    ("GETTING-STARTED.md", "getting-started.html", "Getting started", "Getting started"),
    ("FAQ.md", "faq.html", "FAQ", "FAQ"),
    ("KNOWN-ISSUES.md", "known-issues.html", "Known issues", "Known issues"),
]
LINKMAP = {src: out for src, out, _, _ in PAGES}
LINKMAP["LICENSE.md"] = "https://github.com/joegiralt/chimera-releases/blob/main/LICENSE.md"

def slug(t):
    t = re.sub(r"<[^>]+>|[`*]", "", t).lower()
    return re.sub(r"\s", "-", re.sub(r"[^\w\s-]", "", t, flags=re.U)).strip("-")

def link(m):
    text, url = m.group(1), m.group(2)
    if text == "README":
        text = "install guide"
    if url.startswith("../../"):
        # GitHub's repo-relative links (releases, issues) from the README.
        url = REPO + url[len("../.."):]
    else:
        f, _, frag = url.partition("#")
        if f in LINKMAP:
            url = LINKMAP[f] + ("#" + frag if frag else "")
        elif f == "" and frag:
            url = "#" + frag
    return f'<a href="{url}">{text}</a>'

def inline(s):
    s = html.escape(s, quote=False)
    codes = []
    def keep(m):
        codes.append(m.group(1)); return f"\x00{len(codes)-1}\x00"
    s = re.sub(r"`([^`]+)`", keep, s)
    # The guides name images from the repo root (docs/img/...); the pages sit in docs/.
    s = re.sub(r"!\[([^\]]*)\]\((?:docs/)?([^)]+)\)", r'<img src="\2" alt="\1" loading="lazy">', s)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)", r"<em>\1</em>", s)
    return re.sub(r"\x00(\d+)\x00", lambda m: f"<code>{codes[int(m.group(1))]}</code>", s)

def convert(md):
    md = re.sub(r"<!--.*?-->", "", md, flags=re.S)
    lines = md.split("\n")
    out, i, n = [], 0, len(lines)
    item = re.compile(r"^(\d+)\.\s+(.*)|^[-*]\s+(.*)")
    def nextnb(j):
        while j < n and not lines[j].strip(): j += 1
        return j
    while i < n:
        l = lines[i]
        if not l.strip(): i += 1; continue
        if l.startswith("```"):
            j = i + 1; buf = []
            while j < n and not lines[j].startswith("```"): buf.append(lines[j]); j += 1
            out.append("<pre><code>" + html.escape("\n".join(buf)) + "</code></pre>"); i = j + 1; continue
        m = re.match(r"^(#{1,6})\s+(.*)", l)
        if m:
            k = len(m.group(1)); t = inline(m.group(2))
            out.append(f'<h{k} id="{slug(m.group(2))}">{t}</h{k}>'); i += 1; continue
        if re.match(r"^-{3,}\s*$", l): out.append("<hr>"); i += 1; continue
        if l.startswith(">"):
            buf = []
            while i < n and lines[i].startswith(">"): buf.append(lines[i].lstrip("> ")); i += 1
            out.append("<blockquote><p>" + inline(" ".join(buf)) + "</p></blockquote>"); continue
        if l.startswith("|"):
            rows = []
            while i < n and lines[i].startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
            head, body = rows[0], [r for r in rows[2:]]
            t = "<div class=\"tw\"><table><thead><tr>" + "".join(f"<th>{inline(c)}</th>" for c in head) + "</tr></thead><tbody>"
            for r in body: t += "<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>"
            out.append(t + "</tbody></table></div>"); continue
        m = item.match(l)
        if m:
            ordered = m.group(1) is not None
            tag = "ol" if ordered else "ul"
            start = f' start="{m.group(1)}"' if ordered and m.group(1) != "1" else ""
            buf = [f"<{tag}{start}>"]
            while True:
                m = item.match(lines[i])
                buf.append("<li>" + inline(m.group(2) if ordered else m.group(3)) + "</li>"); i += 1
                j = nextnb(i)
                if j < n and item.match(lines[j]) and (item.match(lines[j]).group(1) is not None) == ordered:
                    i = j; continue
                break
            out.append("".join(buf) + f"</{tag}>"); continue
        buf = []
        while i < n and lines[i].strip() and not re.match(r"^(#|>|\||```|-{3,}\s*$)", lines[i]) and not item.match(lines[i]):
            buf.append(lines[i].strip()); i += 1
        p = " ".join(buf)
        if re.fullmatch(r"!\[[^\]]*\]\([^)]+\)", p):
            alt = re.match(r"!\[([^\]]*)\]", p).group(1)
            out.append(f"<figure>{inline(p)}<figcaption>{html.escape(alt)}</figcaption></figure>")
        else:
            out.append("<p>" + inline(p) + "</p>")
    return "\n".join(out)

def shell(title, body, active, home=False):
    nav = "".join(
        f'<a href="{o}"' + (' aria-current="page"' if o == active else "") + f">{lbl}</a>"
        for _, o, lbl, _ in PAGES[1:] if True
    )
    nav = f'<a href="install.html"{" aria-current=\"page\"" if active=="install.html" else ""}>Install</a>' + nav
    t = "Chimera" if home else f"{title} · Chimera"
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{t}</title>
<meta name="description" content="Chimera: alternative firmware for the PreenFM3 synthesizer. New engines, effects and sequencing.">
<link rel="stylesheet" href="site.css">
</head><body>
<header class="top"><div class="wrap bar">
<a class="brand" href="index.html">CHIMERA</a>
<nav>{nav}</nav>
<a class="btn small" href="{RELEASES}/latest">Download</a>
</div></header>
<main class="{'home' if home else 'doc'}">
{body}
</main>
<footer><div class="wrap">Chimera is &copy; 2026 Joe Giralt. Alpha firmware for the PreenFM3, released for testers.
 <a href="{RELEASES}">Releases</a> &middot; <a href="https://github.com/joegiralt/chimera-releases/issues">Issues</a>
 &middot; <a href="https://github.com/joegiralt/chimera-releases/blob/main/LICENSE.md">Tester licence</a></div></footer>
</body></html>
"""

def main():
    for src, out, _, title in PAGES:
        body = convert((ROOT / src).read_text())
        (OUT / out).write_text(shell(title, f'<div class="wrap prose">{body}</div>', out))
    home = (ROOT / "tools" / "home.html").read_text().replace("{{RELEASES}}", RELEASES)
    (OUT / "index.html").write_text(shell("Chimera", home, "index.html", home=True))
    print("built", len(PAGES) + 1, "pages")

main()
