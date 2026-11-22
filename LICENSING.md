# Licensing

This repository holds three kinds of files, under different terms.

## The firmware

The firmware files attached to each release (`CHIMERA.BIN`, `CHIMERA.BK2` and the factory files) are published as binaries only. Their source is not public. They are covered by the tester licence in [LICENSE.md](LICENSE.md).

## The editor and the website

The source of the browser editor (`editor/`) and of the website (`site/`) is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. The full text is in [editor/LICENSE](editor/LICENSE) and [site/LICENSE](site/LICENSE).

Copyright © 2026 Joe Giralt.

This source is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

## The editor kit

`editor/kit/` is not covered by the GPL. It is built from the firmware for each release: `screen.wasm`, which draws the unit's screens in the editor, and the unit's own description of its parameters. It is covered by the tester licence in [LICENSE.md](LICENSE.md), as the firmware is.
