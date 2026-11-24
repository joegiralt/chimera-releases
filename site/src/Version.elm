-- SPDX-License-Identifier: GPL-3.0-or-later


module Version exposing (Version, compare, fromTag, toString)

{-| A release's version, from its tag (`v0.3.0`): three numbers without
leading zeros, nothing else, ordered as numbers.
-}


type Version
    = Version Int Int Int


fromTag : String -> Maybe Version
fromTag tag =
    let
        number : String -> Maybe Int
        number s =
            if s == "0" || (String.all Char.isDigit s && not (String.isEmpty s) && not (String.startsWith "0" s)) then
                String.toInt s

            else
                Nothing
    in
    case List.map number (String.split "." (dropV tag)) of
        [ Just major, Just minor, Just patch ] ->
            Just (Version major minor patch)

        _ ->
            Nothing


dropV : String -> String
dropV tag =
    if String.startsWith "v" tag then
        String.dropLeft 1 tag

    else
        tag


toString : Version -> String
toString (Version major minor patch) =
    String.join "." (List.map String.fromInt [ major, minor, patch ])


compare : Version -> Version -> Order
compare (Version a b c) (Version x y z) =
    Basics.compare [ a, b, c ] [ x, y, z ]
