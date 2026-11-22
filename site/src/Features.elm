-- SPDX-License-Identifier: GPL-3.0-or-later


module Features exposing (Editor(..), editor)

{-| What this build of the site shows. Set here, in the source, and built
in: a feature turns on with a one-line change and a rebuild.
-}


{-| The browser editor (its page, its nav entry, its home card and
`/editor/` itself): shown from 0.4, the first release that speaks its
protocol (ADR 0317).
-}
type Editor
    = EditorHidden
    | EditorShown


editor : Editor
editor =
    EditorShown
