-- SPDX-License-Identifier: GPL-3.0-or-later


module Href exposing (Href, homebrew, inPage, repo, root, stockBootloader, toString, web, withFragment)

{-| Where a link or an image points: a web address, or a path on this
site. Built only through the constructors here, so a page never holds an
address the site didn't check.
-}

import Anchor exposing (AnchorId)


type Href
    = Href String


{-| An address on the web: `https:`, `http:` or `mailto:`, nothing else.
-}
web : String -> Maybe Href
web url =
    if List.any (\scheme -> String.startsWith scheme url) [ "https://", "http://", "mailto:" ] then
        Just (Href url)

    else
        Nothing


{-| A page of the chimera-releases repo on GitHub, from its path's segments.
-}
repo : List String -> Href
repo segments =
    Href (String.join "/" ("https://github.com/joegiralt/chimera-releases" :: segments))


{-| An absolute path on this site from its segments (`Route` builds these);
an empty last segment gives a trailing slash.
-}
root : List String -> Href
root segments =
    Href ("/" ++ String.join "/" segments)


{-| Ixox's stock PreenFM3 v1.03 release: `pfm3_firmware_1_03.zip` holds
bootloader 1.09, `p3_boot_1_09.bin` (ADR 0314).
-}
stockBootloader : Href
stockBootloader =
    Href "https://github.com/Ixox/preenfm3/releases/tag/v1.03"


{-| Homebrew, which installs `dfu-util` on a Mac.
-}
homebrew : Href
homebrew =
    Href "https://brew.sh"


inPage : AnchorId -> Href
inPage id =
    Href ("#" ++ Anchor.toString id)


withFragment : AnchorId -> Href -> Href
withFragment id (Href path) =
    Href (path ++ "#" ++ Anchor.toString id)


toString : Href -> String
toString (Href href) =
    href
