-- SPDX-License-Identifier: GPL-3.0-or-later


module Links exposing (downloadUrl, latestUrl)

{-| Where the editor sends the user for firmware.
-}


{-| Where to get the firmware this editor needs: the site's INSTALL & UPDATE
page (the latest release, and the steps that also update an older one).
-}
downloadUrl : String
downloadUrl =
    "https://joegiralt.github.io/chimera-releases/install"


latestUrl : String
latestUrl =
    "https://github.com/joegiralt/chimera-releases/releases/latest"
