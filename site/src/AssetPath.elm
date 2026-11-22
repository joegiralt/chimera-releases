-- SPDX-License-Identifier: GPL-3.0-or-later


module AssetPath exposing (AssetPath, doc, editor, image, segments)

{-| A static file the build puts in `dist/`: a doc's Markdown, a guide's
image, the editor. `Route.asset` puts it under the site's base.
-}

import Doc exposing (Doc)


type AssetPath
    = AssetPath (List String)


doc : Doc -> AssetPath
doc d =
    AssetPath [ "guides", Doc.file d ]


{-| A file in chimera-releases' `docs/img`, by its name alone.
-}
image : String -> Maybe AssetPath
image name =
    if String.isEmpty name || String.contains "/" name || String.contains "\\" name || String.startsWith "." name then
        Nothing

    else
        Just (AssetPath [ "guides", "img", name ])


{-| The browser editor's own build, a folder.
-}
editor : AssetPath
editor =
    AssetPath [ "editor", "" ]


segments : AssetPath -> List String
segments (AssetPath s) =
    s
