-- SPDX-License-Identifier: GPL-3.0-or-later


module Doc exposing (Doc(..), all, file, fromFile)

{-| A Markdown file of chimera-releases the site renders: README.md (its
install steps, on Install & update) or a guide.
-}

import GuideId exposing (GuideId)


type Doc
    = Readme
    | GuideDoc GuideId


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


fromFile : String -> Maybe Doc
fromFile f =
    List.filter (\d -> file d == f) all |> List.head
