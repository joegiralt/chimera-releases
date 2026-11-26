# Licensing

From Chimera 0.4, everything in this repository (the browser editor in `editor/`, its firmware kit in `editor/kit/`, the website in `site/`, and the firmware source, when it is published here with 0.4) is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. The full text is in [editor/LICENSE](https://github.com/joegiralt/chimera-releases/blob/main/editor/LICENSE) and [site/LICENSE](https://github.com/joegiralt/chimera-releases/blob/main/site/LICENSE).

Copyright © 2026 Joe Giralt.

It is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

The Yellow Sign (the site's mark and the browser tab icon, traced from the firmware's boot splash) is Christian Knutsson's design for Pelgrane Press, released into the public domain in 2020: [Our Yellow Sign is your Yellow Sign](https://pelgranepress.com/2020/02/06/our-yellow-sign-is-your-yellow-sign/). Attribution is not required; it is credited here with thanks.

The editor's firmware update writes `CHIMERA.BIN` over WebUSB with its own DfuSe writer (`editor/public/dfu.js`), written for this project from the USB Device Firmware Upgrade 1.1 class specification (USB-IF) and ST's application note AN3156, *USB DFU protocol used in the STM32 bootloader*. No code is taken from another DFU tool; its leave sequence (set the address, an empty download, a status) is the one [dfu-util](https://dfu-util.sourceforge.net/) uses for `:leave`, credited here with thanks.

Releases before 0.4 were distributed under the tester licence in [LICENSE.md](LICENSE.md).
