-- SPDX-License-Identifier: GPL-3.0-or-later


module Remote exposing (Remote(..))

{-| Something the site fetches: a guide's Markdown, the releases.
-}

import Http


type Remote a
    = Loading
    | Failed Http.Error
    | Loaded a
