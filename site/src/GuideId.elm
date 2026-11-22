-- SPDX-License-Identifier: GPL-3.0-or-later


module GuideId exposing (GuideId(..), all, file, fromFile, fromSlug, slug, title)

{-| The guides in chimera-releases the site renders. README.md is not one:
it holds the install steps and renders on Install & update (see `Doc`).
-}


type GuideId
    = GettingStarted
    | QuickStart
    | Faq
    | Midi
    | Nrpn
    | Tuning
    | KnownIssues
    | License
    | Licensing


{-| The guide after this one in reading order. A new constructor fails to
compile here until it has a place, so `all` can't miss one.
-}
next : GuideId -> Maybe GuideId
next id =
    case id of
        GettingStarted ->
            Just QuickStart

        QuickStart ->
            Just Faq

        Faq ->
            Just Midi

        Midi ->
            Just Nrpn

        Nrpn ->
            Just Tuning

        Tuning ->
            Just KnownIssues

        KnownIssues ->
            Just License

        License ->
            Just Licensing

        Licensing ->
            Nothing


all : List GuideId
all =
    let
        from : GuideId -> List GuideId
        from id =
            id :: (next id |> Maybe.map from |> Maybe.withDefault [])
    in
    from GettingStarted


slug : GuideId -> String
slug id =
    case id of
        GettingStarted ->
            "getting-started"

        QuickStart ->
            "quick-start"

        Faq ->
            "faq"

        Midi ->
            "midi"

        Nrpn ->
            "nrpn"

        Tuning ->
            "tuning"

        KnownIssues ->
            "known-issues"

        License ->
            "license"

        Licensing ->
            "licensing"


{-| The Markdown file's name in chimera-releases.
-}
file : GuideId -> String
file id =
    String.toUpper (slug id) ++ ".md"


title : GuideId -> String
title id =
    case id of
        GettingStarted ->
            "Getting started"

        QuickStart ->
            "Quick start"

        Faq ->
            "FAQ"

        Midi ->
            "MIDI control"

        Nrpn ->
            "NRPN chart"

        Tuning ->
            "Tuning"

        KnownIssues ->
            "Known issues"

        License ->
            "Tester licence"

        Licensing ->
            "Licensing"


fromSlug : String -> Maybe GuideId
fromSlug s =
    List.filter (\id -> slug id == s) all |> List.head


fromFile : String -> Maybe GuideId
fromFile f =
    List.filter (\id -> file id == f) all |> List.head
