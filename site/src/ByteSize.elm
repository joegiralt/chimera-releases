-- SPDX-License-Identifier: GPL-3.0-or-later


module ByteSize exposing (ByteSize, fromInt, toString)

{-| A file's size, never negative.
-}


type ByteSize
    = ByteSize Int


fromInt : Int -> Maybe ByteSize
fromInt n =
    if n < 0 then
        Nothing

    else
        Just (ByteSize n)


toString : ByteSize -> String
toString (ByteSize bytes) =
    if bytes < 1024 then
        String.fromInt bytes ++ " B"

    else
        String.fromInt (round (toFloat bytes / 1024)) ++ " KB"
