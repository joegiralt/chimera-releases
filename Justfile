# SPDX-License-Identifier: GPL-3.0-or-later
# The browser editor (editor/) and the website (site/). GPLv3: LICENSING.md.

# The firmware kit the editor is built and tested against: screen.wasm and
# the unit's `ed describe` answers, from the firmware's `just editor-kit`
kit_dir := "editor/kit/0.4"

# The kit into the places the editor reads it from (both gitignored):
# public/screen.wasm and tests/fixtures/
kit:
    rm -rf editor/tests/fixtures
    cp -r {{kit_dir}}/fixtures editor/tests/fixtures
    cp {{kit_dir}}/screen.wasm editor/public/screen.wasm

# The editor's Elm tests, elm-review, elm-format, and the JS glue's checks
# (screen.wasm painted from node, every layout screen included, its spec from
# editor/screens/LayoutScreens.elm). Elm itself is pinned in editor/package.json.
editor-test: kit
    cd editor && npm install --no-audit --no-fund --silent && node tests/gen-fixture.js && npx elm-test --compiler node_modules/.bin/elm && npx elm-review --compiler node_modules/.bin/elm && npx elm-format --validate src tests review/src screens >/dev/null && node public/ports.check.js && node public/theme.check.js && node public/screen.check.js
    cd editor/screens && ../node_modules/.bin/elm make LayoutScreens.elm --optimize --output=layout-screens.js >/dev/null && node layout-screens.check.js

# The editor, optimised, into editor/dist/
editor-build: kit
    cd editor && npm install --no-audit --no-fund --silent && rm -rf dist && mkdir -p dist/glyphs && npx elm make src/Main.elm --optimize --output=dist/elm.js && cp public/index.html public/ports.js public/theme.js public/style.css public/screen.js public/screen.wasm dist/ && cp public/glyphs/*.png dist/glyphs/

# The UI component gallery (every component, every state, DAY and NIGHT, and
# the JITTER probe), into editor/gallery/
editor-gallery: kit
    cd editor && npm install --no-audit --no-fund --silent && mkdir -p gallery/glyphs && npx elm make src/Gallery.elm --optimize --output=gallery/gallery.js && cp public/gallery.html gallery/index.html && cp public/style.css public/theme.js gallery/ && cp public/glyphs/*.png gallery/glyphs/

# The editor's protocol end to end, against the firmware's simulator
# (`just editor-sim` in the firmware repo)
editor-e2e:
    node editor/e2e/sim.mjs

# The editor against the firmware's simulator, in a browser: chimera-desktop
# headless (CHIMERA_HEADLESS=1, no window, audio device or MIDI port) on a
# card of its own. First the contract: every line kind the unit writes, read
# by the editor's own parser. Then the built editor in headless Chrome, each
# test checking the editor's page and the unit's own state and screen through
# its console. The firmware is CHIMERA_DIR, else ./firmware, else ../chimera;
# BUILD_WRAP runs its cargo build (a build-slot lock, nice); CHROME is the
# browser (/opt/google/chrome/chrome). Nothing is downloaded. Needs a firmware
# whose chimera-desktop takes CHIMERA_HEADLESS and CHIMERA_CONSOLE.
#
# Against the real unit instead: UNIT=auto (the console's USB tty, 0483:5740)
# or UNIT=/dev/ttyACM<n>; nothing is built. It loads INIT on Parts 1-5, sets
# and removes values and routes, saves no project, and refuses every verb that
# writes the unit's flash or card files (dfu, rm, put, bank2, sweep, flash,
# card clean...).
#
# Two tiers: `e2e` is the quick one (e2e/editor.test.mjs: each engine's page,
# a knob, the screens, the MOD bay, the flow, the MIXER); `e2e-full` runs
# every e2e/*.test.mjs, each file its own simulator and browser, three at a
# time. A test only the real unit can run is skipped on the simulator, and
# one only the simulator can run (a reboot, a fault the bridge makes, a
# project saved on its card) is skipped on the unit: either way the skip and
# its reason are in the run's output. E2E_FILES runs just those files.
e2e: editor-build
    @just _e2e "${E2E_FILES:-e2e/editor.test.mjs}"

e2e-full: editor-build
    @just _e2e "${E2E_FILES:-e2e/*.test.mjs}"

_e2e files:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -z "${UNIT:-}" ]; then
        fw="${CHIMERA_DIR:-}"
        if [ -z "$fw" ]; then if [ -d firmware ]; then fw=firmware; else fw=../chimera; fi; fi
        export CHIMERA_DIR="$(cd "$fw" && pwd)"
        (cd "$CHIMERA_DIR" && ${BUILD_WRAP:-} cargo build -q --profile utils -p chimera-desktop -p chimera-utils)
    fi
    cd editor/e2e/contract && ../../node_modules/.bin/elm make Contract.elm --output=contract.js >/dev/null
    # One unit has one console: on the real unit the files run one at a time.
    jobs=3; if [ -n "${UNIT:-}" ]; then jobs=1; fi
    cd ../.. && node --test --test-concurrency=$jobs --test-reporter=spec {{files}}

# Where the site is served from: "/" here, "/chimera-releases/" on GitHub Pages
site_base := "/"

# The site, optimised, into site/dist/: the app, the guides and their images
# from this repository's root, 404.html for deep links, and the editor's own
# build in dist/editor/
site-build base=site_base: editor-build
    #!/usr/bin/env bash
    set -euo pipefail
    cd site
    npm install --no-audit --no-fund --silent
    rm -rf dist
    mkdir -p dist/guides/img
    npx elm make src/Main.elm --optimize --output=dist/elm.js
    sed 's|__BASE__|{{base}}|g' public/index.html > dist/index.html
    cp dist/index.html dist/404.html
    cp public/style.css public/favicon.svg dist/
    cp ../*.md dist/guides/
    cp ../docs/img/* dist/guides/img/
    cp -r ../editor/dist dist/editor

# The site live on GitHub Pages: built for /chimera-releases/, committed to
# this repository's gh-pages branch (built files only) and pushed when
# anything changed. Leaves site/dist built for Pages: `just site-build`
# again before `site-serve`.
site-publish: (site-build "/chimera-releases/")
    #!/usr/bin/env bash
    set -euo pipefail
    rev=$(git rev-parse --short HEAD)
    pages=$(mktemp -d)
    trap 'rm -rf "$pages"' EXIT
    git clone -q --depth 1 -b gh-pages "$(git remote get-url origin)" "$pages"
    find "$pages" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
    cp -r site/dist/. "$pages"/
    touch "$pages/.nojekyll"
    cd "$pages"
    git add -A
    if git diff --cached --quiet; then
        echo "site: nothing changed"
    else
        git commit -qm "Site from $rev"
        git push -q origin gh-pages
        echo "site: published $rev to https://joegiralt.github.io/chimera-releases/"
    fi

# site/dist on http://127.0.0.1:8000/, unknown paths answered as Pages does
site-serve port="8000":
    node site/scripts/serve.js {{port}}

# The site's Elm tests (every guide at the root included) and elm-review
site-test:
    cd site && npm install --no-audit --no-fund --silent && node tests/gen-fixtures.js && npx elm-test && npx elm-review

# Everything the editor and the site must pass
check: editor-test site-test
