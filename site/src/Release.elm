-- SPDX-License-Identifier: GPL-3.0-or-later


module Release exposing (Asset, AssetKind(..), Current(..), Release, Releases, Skipped, Stage(..), classify, current, kindLabel, latest, listDecoder)

{-| chimera-releases' GitHub Releases, as the public API gives them.
-}

import ByteSize exposing (ByteSize)
import Href exposing (Href)
import Iso8601
import Json.Decode as Decode exposing (Decoder)
import Time
import Version exposing (Version)


type AssetKind
    = Firmware
    | FirmwareBank2
    | FactorySet
    | Checksums
    | Bootloader
    | OtherAsset


type Stage
    = Stable
    | Prerelease


type alias Asset =
    { name : String, kind : AssetKind, url : Href, size : ByteSize }


type alias Release =
    { version : Version
    , name : Maybe String
    , stage : Stage
    , published : Time.Posix
    , notes : String
    , assets : List Asset
    , page : Href
    , unreadableFiles : Int
    }


{-| The releases that decoded, and how many didn't.
-}
type alias Releases =
    { releases : List Release, skipped : List Skipped }


{-| What can still be read of a release that couldn't be.
-}
type alias Skipped =
    { published : Maybe Time.Posix, stage : Maybe Stage }


type Current
    = Current Release
    | NewerSkipped Release
    | NoneReadable
    | NoRelease


{-| The release to offer: the newest stable one, unless a release that
couldn't be read may be newer (then the pages say so and point at GitHub).
-}
current : Releases -> Current
current list =
    let
        maybeStable : Skipped -> Bool
        maybeStable s =
            s.stage /= Just Prerelease
    in
    case latest list.releases of
        Just r ->
            if List.any (\s -> maybeStable s && newer r s) list.skipped then
                NewerSkipped r

            else
                Current r

        Nothing ->
            if List.any maybeStable list.skipped then
                NoneReadable

            else
                NoRelease


newer : Release -> Skipped -> Bool
newer r s =
    case s.published of
        Just t ->
            Time.posixToMillis t > Time.posixToMillis r.published

        Nothing ->
            True


{-| By the names releases use: `CHIMERA.BIN` (0.1.0: `chimera-0.1.0.bin`),
`CHIMERA.BK2`, `factory-….zip`, `SHA256SUMS`. A bootloader is its own kind;
any other `.bin` (stock firmware) is never FIRMWARE.
-}
classify : String -> AssetKind
classify name =
    let
        lower : String
        lower =
            String.toLower name

        versioned : Bool
        versioned =
            String.startsWith "chimera-" lower
                && String.endsWith ".bin" lower
                && (Version.fromTag (String.slice 8 -4 lower) /= Nothing)
    in
    if lower == "chimera.bin" || versioned then
        Firmware

    else if lower == "chimera.bk2" then
        FirmwareBank2

    else if String.startsWith "factory-" lower && String.endsWith ".zip" lower then
        FactorySet

    else if lower == "sha256sums" || lower == "sha256sums.txt" then
        Checksums

    else if String.contains "bootloader" lower then
        Bootloader

    else
        OtherAsset


{-| A download button's label: what the file is, in full words.
-}
kindLabel : AssetKind -> String
kindLabel kind =
    case kind of
        Firmware ->
            "FIRMWARE"

        FirmwareBank2 ->
            "FIRMWARE, PART 2"

        FactorySet ->
            "FACTORY SOUNDS"

        Checksums ->
            "CHECKSUMS"

        Bootloader ->
            "BOOTLOADER"

        OtherAsset ->
            "FILE"


{-| Each release on its own: one this site can't read (a tag that isn't a
version, a page that isn't the web) is skipped, keeping what can be read
of it; never the list.
-}
listDecoder : Decoder Releases
listDecoder =
    Decode.list Decode.value
        |> Decode.map
            (List.foldr
                (\value acc ->
                    case Decode.decodeValue decoder value of
                        Ok r ->
                            { acc | releases = r :: acc.releases }

                        Err _ ->
                            { acc | skipped = skipped value :: acc.skipped }
                )
                { releases = [], skipped = [] }
            )


skipped : Decode.Value -> Skipped
skipped value =
    { published = Decode.decodeValue (Decode.field "published_at" Iso8601.decoder) value |> Result.toMaybe
    , stage = Decode.decodeValue (Decode.field "prerelease" stage) value |> Result.toMaybe
    }


stage : Decoder Stage
stage =
    Decode.bool
        |> Decode.map
            (\pre ->
                if pre then
                    Prerelease

                else
                    Stable
            )


decoder : Decoder Release
decoder =
    Decode.map7
        (\v name st published notes ( files, unreadable ) page ->
            { version = v
            , name = name
            , stage = st
            , published = published
            , notes = notes
            , assets = files
            , page = page
            , unreadableFiles = unreadable
            }
        )
        (Decode.field "tag_name" version)
        (Decode.field "name" (Decode.nullable Decode.string))
        (Decode.field "prerelease" stage)
        (Decode.field "published_at" Iso8601.decoder)
        (Decode.field "body" (Decode.nullable Decode.string) |> Decode.map (Maybe.withDefault ""))
        (Decode.field "assets" assets)
        (Decode.field "html_url" webHref)


{-| Each file on its own: one that can't be read is left out and counted.
-}
assets : Decoder ( List Asset, Int )
assets =
    Decode.list Decode.value
        |> Decode.map
            (\values ->
                let
                    read : List Asset
                    read =
                        List.filterMap (Decode.decodeValue asset >> Result.toMaybe) values
                in
                ( read, List.length values - List.length read )
            )


version : Decoder Version
version =
    Decode.string
        |> Decode.andThen
            (\tag ->
                Version.fromTag tag
                    |> Maybe.map Decode.succeed
                    |> Maybe.withDefault (Decode.fail ("not a version: " ++ tag))
            )


asset : Decoder Asset
asset =
    Decode.map3 (\name -> Asset name (classify name))
        (Decode.field "name" Decode.string)
        (Decode.field "browser_download_url" webHref)
        (Decode.field "size" byteSize)


{-| The newest stable release: the one to download.
-}
latest : List Release -> Maybe Release
latest releases =
    releases
        |> List.filter (\r -> r.stage == Stable)
        |> List.sortWith (\a b -> Version.compare b.version a.version)
        |> List.head


webHref : Decoder Href
webHref =
    Decode.string
        |> Decode.andThen
            (\url ->
                Href.web url
                    |> Maybe.map Decode.succeed
                    |> Maybe.withDefault (Decode.fail ("not a web address: " ++ url))
            )


byteSize : Decoder ByteSize
byteSize =
    Decode.int
        |> Decode.andThen
            (\n ->
                ByteSize.fromInt n
                    |> Maybe.map Decode.succeed
                    |> Maybe.withDefault (Decode.fail "a negative size")
            )
