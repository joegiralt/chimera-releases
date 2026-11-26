-- SPDX-License-Identifier: GPL-3.0-or-later


module Update.Read exposing
    ( bank1Last
    , crcEq
    , installRefusal
    , isOk
    , later
    , loadedOf
    , offer
    , offerFor
    , otherUnit
    , parseVersion
    , readStatus
    , sealOpen
    , staging
    , trimPlus
    , unitOf
    , verdict
    , verdictWhy
    )

{-| What the unit's answers mean: `status`'s lines, `ed since`'s project
line, the put's and the install's answers, and versions against a release.
-}

import Update.Types exposing (Answer(..), Bk2(..), Loaded, Offer(..), Release, SelfUpdate, Source(..), UnitNow, Verdict(..), Version)


selfUpdateOf : List String -> Maybe SelfUpdate
selfUpdateOf lines =
    lines
        |> List.filterMap
            (\l ->
                case String.words l of
                    [ "selfupdate", n ] ->
                        String.toInt n
                            |> Maybe.andThen
                                (\v ->
                                    if v >= 1 then
                                        Just { version = v }

                                    else
                                        Nothing
                                )

                    _ ->
                        Nothing
            )
        |> List.head


{-| A unit's identity: 24 lowercase hex digits, the H750's 96-bit UID.
-}
unitId : String -> Maybe String
unitId s =
    if String.length s == 24 && String.all Char.isHexDigit s then
        Just (String.toLower s)

    else
        Nothing


{-| The unit that answered after a restart isn't the one being updated:
both said who they are, and they differ. A unit that can't say is not
another.
-}
otherUnit : UnitNow -> Answer -> Maybe String
otherUnit u a =
    case a of
        Said lines _ ->
            case ( u.unit, (readStatus lines).unit ) of
                ( Just was, Just now ) ->
                    if was /= now then
                        Just now

                    else
                        Nothing

                ( Just _, Nothing ) ->
                    Nothing

                ( Nothing, _ ) ->
                    Nothing

        NoAnswer ->
            Nothing

        Gone ->
            Nothing


parseVersion : String -> Maybe Version
parseVersion s =
    case String.words (trimPlus s) of
        [ numbers, build ] ->
            case List.map String.toInt (String.split "." numbers) of
                [ Just major, Just minor, Just patch ] ->
                    Just { major = major, minor = minor, patch = patch, build = build }

                _ ->
                    Nothing

        [] ->
            Nothing

        [ _ ] ->
            Nothing

        _ :: _ :: _ :: _ ->
            Nothing


{-| Bank 2 already open with this release's seal: its .bk2 needn't go again.
-}
sealOpen : Release -> UnitNow -> Bool
sealOpen r u =
    case u.bank2 of
        Just b ->
            String.startsWith "open " b && String.endsWith (" seal=" ++ r.seal) b

        Nothing ->
            False


{-| `status`'s `bank1 last <ok|aborted|…> <rest>`.
-}
bank1Last : List String -> Maybe ( String, String )
bank1Last lines =
    lines
        |> List.filterMap
            (\l ->
                case String.words l of
                    "bank1" :: "last" :: word :: rest ->
                        Just ( word, String.join " " rest )

                    _ ->
                        Nothing
            )
        |> List.head


{-| Two CRC-32s in hex, whatever their case or leading zeros.
-}
crcEq : String -> String -> Bool
crcEq a b =
    let
        norm : String -> String
        norm =
            String.toLower >> String.trim >> dropZeros

        dropZeros : String -> String
        dropZeros x =
            if String.startsWith "0" x && String.length x > 1 then
                dropZeros (String.dropLeft 1 x)

            else
                x
    in
    norm a == norm b


verdictWhy : Verdict -> Maybe String
verdictWhy v =
    case v of
        Installed _ ->
            Nothing

        NeedsInstall why ->
            Just why

        NotFinished why ->
            Just why


later : String
later =
    " (it installs at that firmware's next start)"


installRefusal : String -> String
installRefusal end =
    case foreignSlot end of
        Just f ->
            f

        Nothing ->
            if String.contains "staged: needs firmware" end then
                String.dropLeft 4 end ++ later

            else
                "bank2 install: " ++ end


isOk : String -> Bool
isOk l =
    l == "OK" || String.startsWith "OK " l


{-| `status`'s lines as a `UnitNow`.
-}
readStatus : List String -> UnitNow
readStatus lines =
    let
        after : String -> Maybe String
        after key =
            lines
                |> List.filter (String.startsWith (key ++ " "))
                |> List.head
                |> Maybe.map (String.dropLeft (String.length key + 1) >> String.trim)
    in
    { build = after "build"
    , modified = List.member "state MODIFIED" lines
    , bank2 = after "bank2"
    , selfUpdate = selfUpdateOf lines
    , unit = after "unit" |> Maybe.andThen unitId
    }


{-| `ed since`'s `project "<name>" <id|new> <clean|edited> gen <g|->` line
as the loaded project's id and generation; none for a project never saved.
-}
loadedOf : List String -> Maybe (Maybe Loaded)
loadedOf lines =
    lines
        |> List.filter (String.startsWith "project \"")
        |> List.head
        |> Maybe.map
            (\l ->
                case String.words (String.dropLeft (Maybe.withDefault 0 (List.head (List.reverse (String.indexes "\"" l))) + 1) l) of
                    [ id, _, "gen", g ] ->
                        Maybe.map2 Loaded (String.toInt id) (String.toInt g)

                    _ ->
                        Nothing
            )


unitOf : Answer -> UnitNow
unitOf a =
    case a of
        Said lines end ->
            if isOk end then
                readStatus lines

            else
                readStatus []

        NoAnswer ->
            readStatus []

        Gone ->
            readStatus []


{-| The put's answer before the flash: where CHIMERA.BK2 is, or why it
stopped (nothing flashed). Firmware from before bank 2 refuses the path
with its `put` usage line (0.2, 0.3 word it otherwise: any `put takes`
naming BANK2.BK2 for a .bk2 over 512 KB), and a newer firmware judges an
older format's .bk2 not a bank-2 image: both take it after the flash.
-}
staging : Release -> Answer -> Result String Bk2
staging r a =
    case a of
        Said _ end ->
            if isOk end then
                Ok Staged

            else if oldPutRefusal end r.bk2Size then
                Ok AfterFlash

            else if String.contains "not a bank-2 image" end && r.format /= 2 then
                Ok AfterFlash

            else
                Err ("The unit refused CHIMERA.BK2: " ++ end)

        NoAnswer ->
            Err "The unit stopped answering while CHIMERA.BK2 was copied"

        Gone ->
            Err "The unit was disconnected while CHIMERA.BK2 was copied"


oldPutRefusal : String -> Int -> Bool
oldPutRefusal end bk2Size =
    List.member end
        [ "ERR put takes /CHIMERA/PROJECTS/P#######.A, /CHIMERA/SOUNDS/S#######.A [--over] or /CHIMERA/TAPES/<CRC>.SRC, its size and CRC-32 in hex"
        , "ERR put takes /CHIMERA/PROJECTS/P#######.A or /CHIMERA/SOUNDS/S#######.A [--over], its size and CRC-32 in hex"
        ]
        || (String.startsWith "ERR put takes" end && String.contains "BANK2.BK2" end && bk2Size > 512 * 1024)


{-| chimera-usb.py's `updated`: the new firmware running (its build line's
hash, the .bk2 version's) and bank 2 open with this release's seal.
-}
verdict : Release -> Answer -> Verdict
verdict r a =
    case a of
        Said lines end ->
            if not (isOk end) then
                NotFinished ("The unit answered status with " ++ end)

            else
                let
                    u : UnitNow
                    u =
                        readStatus lines

                    hash : Maybe String
                    hash =
                        lastWord r.version

                    runs : Maybe String
                    runs =
                        u.build |> Maybe.andThen (trimPlus >> lastWord)
                in
                if hash == Nothing || runs /= hash then
                    NotFinished ("The unit says build " ++ Maybe.withDefault "(none)" u.build ++ ": the new firmware (" ++ r.version ++ ") isn't the one running")

                else
                    case u.bank2 of
                        Just b ->
                            case foreignSlot ("bank2 " ++ b) of
                                Just f ->
                                    NotFinished f

                                Nothing ->
                                    if String.startsWith "open " b && String.endsWith (" seal=" ++ r.seal) b then
                                        Installed u

                                    else
                                        NeedsInstall ("bank2 " ++ b)

                        Nothing ->
                            NeedsInstall "no bank2 line"

        NoAnswer ->
            NotFinished "The unit didn't answer status"

        Gone ->
            NotFinished "The unit was disconnected"


trimPlus : String -> String
trimPlus s =
    if String.endsWith "+" s then
        String.dropRight 1 s

    else
        s


lastWord : String -> Maybe String
lastWord s =
    String.words s |> List.reverse |> List.head


foreignSlot : String -> Maybe String
foreignSlot line =
    if String.contains "slot foreign" line then
        case lastWord line of
            Just "mixer" ->
                Just "The unit's MIXER slot (0x08180000) holds other code; bank 2 not installed"

            Just "edit" ->
                Just "The unit's EDIT slot (0x081C0000) holds other code; bank 2 not installed"

            _ ->
                Nothing

    else
        Nothing


{-| `offer` for two versions as text: the unit's (`status`'s `0.4.0 de07edf9`
or `ed hello`'s `0.4.0-de07edf9`) and a release's.
-}
offerFor : String -> String -> Offer
offerFor unitBuild version =
    offer { build = Just (String.replace "-" " " unitBuild), modified = False, bank2 = Nothing, selfUpdate = Nothing, unit = Nothing } { version = version, seal = "", format = 0, binSize = 0, bk2Size = 0, binSha = "", bk2Sha = "", binCrc = "", source = Latest }


offer : UnitNow -> Release -> Offer
offer u r =
    case ( u.build |> Maybe.andThen parseVersion, parseVersion r.version ) of
        ( Just have, Just want ) ->
            case compare ( want.major, want.minor, want.patch ) ( have.major, have.minor, have.patch ) of
                GT ->
                    Newer

                LT ->
                    Older

                EQ ->
                    if want.build == have.build then
                        Same

                    else
                        OtherBuild

        ( Nothing, _ ) ->
            Unknown

        ( Just _, Nothing ) ->
            Unknown
