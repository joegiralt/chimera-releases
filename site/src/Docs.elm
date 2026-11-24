-- SPDX-License-Identifier: GPL-3.0-or-later


module Docs exposing (Docs, Slot, empty, get, needsFetch, set)

{-| Every doc's fetch, one slot per `Doc` (the type is exhaustive, so a new
guide has a slot or doesn't compile). `Nothing` is never requested.
-}

import Doc exposing (Doc(..))
import GuideId exposing (GuideId(..))
import Markdown.Block exposing (Block)
import Remote exposing (Remote(..))


{-| A doc's fetch; `Nothing` is never requested.
-}
type alias Slot =
    Maybe (Remote (Result String (List Block)))


type Docs
    = Docs
        { readme : Slot
        , gettingStarted : Slot
        , quickStart : Slot
        , faq : Slot
        , midi : Slot
        , nrpn : Slot
        , tuning : Slot
        , knownIssues : Slot
        , license : Slot
        , licensing : Slot
        }


empty : Docs
empty =
    Docs
        { readme = Nothing
        , gettingStarted = Nothing
        , quickStart = Nothing
        , faq = Nothing
        , midi = Nothing
        , nrpn = Nothing
        , tuning = Nothing
        , knownIssues = Nothing
        , license = Nothing
        , licensing = Nothing
        }


get : Doc -> Docs -> Slot
get doc (Docs d) =
    case doc of
        Readme ->
            d.readme

        GuideDoc GettingStarted ->
            d.gettingStarted

        GuideDoc QuickStart ->
            d.quickStart

        GuideDoc Faq ->
            d.faq

        GuideDoc Midi ->
            d.midi

        GuideDoc Nrpn ->
            d.nrpn

        GuideDoc Tuning ->
            d.tuning

        GuideDoc KnownIssues ->
            d.knownIssues

        GuideDoc License ->
            d.license

        GuideDoc Licensing ->
            d.licensing


set : Doc -> Slot -> Docs -> Docs
set doc slot (Docs d) =
    Docs <|
        case doc of
            Readme ->
                { d | readme = slot }

            GuideDoc GettingStarted ->
                { d | gettingStarted = slot }

            GuideDoc QuickStart ->
                { d | quickStart = slot }

            GuideDoc Faq ->
                { d | faq = slot }

            GuideDoc Midi ->
                { d | midi = slot }

            GuideDoc Nrpn ->
                { d | nrpn = slot }

            GuideDoc Tuning ->
                { d | tuning = slot }

            GuideDoc KnownIssues ->
                { d | knownIssues = slot }

            GuideDoc License ->
                { d | license = slot }

            GuideDoc Licensing ->
                { d | licensing = slot }


{-| Never requested, or failed (a visit or RETRY tries again).
-}
needsFetch : Doc -> Docs -> Bool
needsFetch doc docs =
    case get doc docs of
        Nothing ->
            True

        Just (Failed _) ->
            True

        Just Loading ->
            False

        Just (Loaded _) ->
            False
