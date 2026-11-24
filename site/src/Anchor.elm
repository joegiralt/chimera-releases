-- SPDX-License-Identifier: GPL-3.0-or-later


module Anchor exposing (AnchorId, fromFragment, fromHeading, release, toString, unique)

{-| An element id a link can name after `#`: a heading's (as GitHub makes
it, so `FAQ.md#some-heading` lands on the site as it does on GitHub) or a
release's.
-}

import Version exposing (Version)


type AnchorId
    = AnchorId String


{-| Lower case; letters, digits, `-`, `_` and spaces kept; spaces to `-`.
-}
fromHeading : String -> AnchorId
fromHeading heading =
    heading
        |> String.toLower
        |> String.filter kept
        |> String.replace " " "-"
        |> AnchorId


kept : Char -> Bool
kept c =
    Char.isAlphaNum c
        || List.member c [ ' ', '-', '_' ]
        || (Char.toCode c > 127 && Char.toLower c /= Char.toUpper c)


{-| What a link names after `#`, as written.
-}
fromFragment : String -> AnchorId
fromFragment =
    AnchorId


release : Version -> AnchorId
release version =
    AnchorId ("v" ++ Version.toString version)


{-| GitHub's rule for ids on one page: a repeat gets `-1`, `-2`, … and
never takes an id already given.
-}
unique : List AnchorId -> List AnchorId
unique ids =
    List.foldl
        (\(AnchorId id) ( taken, out ) ->
            let
                free : Int -> String
                free n =
                    let
                        candidate : String
                        candidate =
                            if n == 0 then
                                id

                            else
                                id ++ "-" ++ String.fromInt n
                    in
                    if List.member candidate taken then
                        free (n + 1)

                    else
                        candidate

                given : String
                given =
                    free 0
            in
            ( given :: taken, AnchorId given :: out )
        )
        ( [], [] )
        ids
        |> Tuple.second
        |> List.reverse


toString : AnchorId -> String
toString (AnchorId id) =
    id
