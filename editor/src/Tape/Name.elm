-- SPDX-License-Identifier: GPL-3.0-or-later


module Tape.Name exposing (Name, NameProblem(..), fromString, toString)

{-| A source's name as the unit holds one (`SoundName`): 1 to 16 of A-Z,
0-9, space and `-`, upper case, no space at either end. Typed in lower
case, it is raised.
-}


type Name
    = Name String


type NameProblem
    = NoName
    | TooLong
    | BadCharacter Char
    | EdgeSpace


fromString : String -> Result NameProblem Name
fromString typed =
    let
        raised : String
        raised =
            String.toUpper typed
    in
    if String.trim raised == "" then
        Err NoName

    else if String.length raised > 16 then
        Err TooLong

    else
        case List.filter (allowed >> not) (String.toList raised) of
            bad :: _ ->
                Err (BadCharacter bad)

            [] ->
                if String.trim raised /= raised then
                    Err EdgeSpace

                else
                    Ok (Name raised)


allowed : Char -> Bool
allowed char =
    Char.isUpper char || Char.isDigit char || char == ' ' || char == '-'


toString : Name -> String
toString (Name name) =
    name
