-- SPDX-License-Identifier: GPL-3.0-or-later


port module Transport exposing
    ( Link(..)
    , connectSerial
    , connectSocket
    , lineIn
    , linkState
    , linkText
    , parseLink
    , send
    , writeFailed
    )

{-| The one link to the unit, over Web Serial or a WebSocket. The JavaScript
side is `ports.js`; Elm only sees lines and a link state.
-}


type Link
    = Open
    | Busy
    | Absent
    | Lost
    | Unsupported


port connectSerial : () -> Cmd msg


port connectSocket : String -> Cmd msg


{-| Lines to the unit, in this order, in one call: the lines one update sends
go as one, as a `Cmd.batch` of port calls runs them last first.
-}
port send : List String -> Cmd msg


port lineIn : (String -> msg) -> Sub msg


{-| A line the browser could not write to the link (the link then drops).
-}
port writeFailed : (String -> msg) -> Sub msg


port linkState : (String -> msg) -> Sub msg


{-| An unknown state is a lost link: never leave the editor thinking it is open.
-}
parseLink : String -> Link
parseLink s =
    case s of
        "open" ->
            Open

        "busy" ->
            Busy

        "absent" ->
            Absent

        "unsupported" ->
            Unsupported

        _ ->
            Lost


linkText : Link -> Maybe String
linkText l =
    case l of
        Open ->
            Nothing

        Busy ->
            Just "THE PORT IS IN USE (CLOSE chimera-usb.py)"

        Absent ->
            Just "THE SIMULATOR IS NOT RUNNING (just editor-sim)"

        Lost ->
            Just "THE UNIT WAS DISCONNECTED"

        Unsupported ->
            Just "USE CHROME OR EDGE"
