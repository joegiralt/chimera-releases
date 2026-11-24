-- SPDX-License-Identifier: GPL-3.0-or-later


module AssetPath exposing (AssetPath, doc, editor, image, manualFile, manualImage, segments)

{-| A static file the build puts in `dist/`: a doc's Markdown, a guide's
image, the editor. `Route.asset` puts it under the site's base.
-}

import Doc exposing (Doc)


type AssetPath
    = AssetPath (List String)


doc : Doc -> AssetPath
doc d =
    case d of
        Doc.ManualIndex ->
            manualFolder (Doc.file d)

        Doc.ManualChapter _ ->
            manualFolder (Doc.file d)

        Doc.Readme ->
            AssetPath [ "guides", Doc.file d ]

        Doc.GuideDoc _ ->
            AssetPath [ "guides", Doc.file d ]


manualFolder : String -> AssetPath
manualFolder name =
    AssetPath [ "manual", "preenfm3", "0.4", name ]


plainName : String -> Bool
plainName name =
    not (String.isEmpty name || String.contains "/" name || String.contains "\\" name || String.startsWith "." name)


{-| A file of the manual's folder (`manual.md`, `llms.txt`), by its name alone.
-}
manualFile : String -> Maybe AssetPath
manualFile name =
    if plainName name then
        Just (manualFolder name)

    else
        Nothing


{-| A file in the manual's `img/`, by its name alone.
-}
manualImage : String -> Maybe AssetPath
manualImage name =
    if plainName name then
        Just (AssetPath [ "manual", "preenfm3", "0.4", "img", name ])

    else
        Nothing


{-| A file in chimera-releases' `docs/img`, by its name alone.
-}
image : String -> Maybe AssetPath
image name =
    if plainName name then
        Just (AssetPath [ "guides", "img", name ])

    else
        Nothing


{-| The browser editor's own build, a folder.
-}
editor : AssetPath
editor =
    AssetPath [ "editor", "" ]


segments : AssetPath -> List String
segments (AssetPath s) =
    s
