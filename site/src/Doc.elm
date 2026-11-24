-- SPDX-License-Identifier: GPL-3.0-or-later


module Doc exposing (Doc(..), all, file, fromFile)

{-| A Markdown file of chimera-releases the site renders: README.md (its
install steps, on Install & update), a guide, or a page of the manual
(`all` and `fromFile` are the repository root's; the manual has its own folder).
-}

import Chapter exposing (Chapter)
import GuideId exposing (GuideId)


type Doc
    = Readme
    | GuideDoc GuideId
    | ManualIndex
    | ManualChapter Chapter


all : List Doc
all =
    Readme :: List.map GuideDoc GuideId.all


file : Doc -> String
file doc =
    case doc of
        Readme ->
            "README.md"

        GuideDoc id ->
            GuideId.file id

        ManualIndex ->
            "README.md"

        ManualChapter c ->
            Chapter.file c


fromFile : String -> Maybe Doc
fromFile f =
    List.filter (\d -> file d == f) all |> List.head
