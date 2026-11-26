-- SPDX-License-Identifier: GPL-3.0-or-later


module Update.Wire exposing (decode, encode)

{-| The update's requests to `update.js` as JSON, and its answers read
back strictly.
-}

import Json.Decode as D exposing (Decoder)
import Json.Encode as E
import Update.Types exposing (Answer(..), Device(..), Event(..), Progress, Release, Request(..), Source(..), Ticket(..), WriteResult(..))


ticketId : Ticket -> String
ticketId which =
    case which of
        TStatus ->
            "status"

        TProject ->
            "project"

        TSave ->
            "save"

        TPutBin ->
            "putbin"

        TSelf ->
            "self"

        TPut ->
            "put"

        TDfu ->
            "dfu"

        TInstall ->
            "install"

        TVerify ->
            "verify"


encode : Request -> E.Value
encode request =
    let
        op : String -> List ( String, E.Value ) -> E.Value
        op name rest =
            E.object (( "op", E.string name ) :: rest)
    in
    case request of
        Begin ->
            op "begin" []

        FetchLatest ->
            op "release" [ ( "how", E.string "latest" ) ]

        ChooseFiles ->
            op "release" [ ( "how", E.string "choose" ) ]

        Ask which line wait delay unit ->
            op "ask" [ ( "id", E.string (ticketId which) ), ( "line", E.string line ), ( "wait", E.int wait ), ( "delay", E.int delay ), ( "unit", Maybe.map E.string unit |> Maybe.withDefault E.null ) ]

        Put rel ->
            op "put" [ ( "id", E.string (ticketId TPut) ), ( "file", E.string "bk2" ), ( "seal", E.string rel.seal ), ( "sha", E.string rel.bk2Sha ) ]

        PutBin rel remote ->
            op "put" [ ( "id", E.string (ticketId TPutBin) ), ( "file", E.string "bin" ), ( "remote", E.string remote ), ( "seal", E.string rel.seal ), ( "sha", E.string rel.binSha ) ]

        Dfu ->
            op "dfu" [ ( "id", E.string (ticketId TDfu) ) ]

        FindDevice secs ->
            op "findDevice" [ ( "secs", E.int secs ) ]

        PickDevice ->
            op "pickDevice" []

        Write rel ->
            op "write" [ ( "seal", E.string rel.seal ), ( "sha", E.string rel.binSha ) ]

        Back secs restart unit ->
            op "back" [ ( "secs", E.int secs ), ( "restart", E.bool restart ), ( "unit", Maybe.map E.string unit |> Maybe.withDefault E.null ) ]

        PickPort ->
            op "pickPort" []

        Hold on ->
            op "hold" [ ( "on", E.bool on ) ]

        End ->
            op "end" []


{-| What `update.js` said, read strictly: anything malformed is `Garbled`
with the reason, never a missing answer.
-}
decode : D.Value -> Event
decode value =
    case D.decodeValue event value of
        Ok decoded ->
            decoded

        Err err ->
            Garbled ("an answer the editor can't read (" ++ String.left 160 (D.errorToString err) ++ ")")


event : Decoder Event
event =
    D.field "op" D.string
        |> D.andThen
            (\op ->
                case op of
                    "begun" ->
                        D.map3 (\open webusb win -> Begun { open = open, webusb = webusb, windows = win })
                            (D.field "open" D.bool)
                            (D.field "webusb" D.bool)
                            (D.field "windows" D.bool)

                    "release" ->
                        D.oneOf
                            [ D.field "release" release |> D.map (Ok >> ReleaseIs)
                            , D.field "cancelled" (exactly True) |> D.map (\_ -> ReleaseCancelled)
                            , D.field "detail" D.string |> D.map (Err >> ReleaseIs)
                            ]

                    "answer" ->
                        D.oneOf
                            [ D.field "unsent" (exactly True) |> D.andThen (\_ -> D.map Unsent (D.field "id" ticket))
                            , D.map2 Answered (D.field "id" ticket) answer
                            ]

                    "copied" ->
                        D.map Copied (progress "sent")

                    "written" ->
                        D.map Written (progress "done")

                    "device" ->
                        D.oneOf
                            [ D.field "found" (exactly True) |> D.map (\_ -> DeviceIs Found)
                            , D.field "unsupported" (exactly True) |> D.map (\_ -> DeviceIs NoWebUsb)
                            , D.field "cancelled" (exactly True) |> D.map (\_ -> DeviceIs Cancelled)
                            , D.field "problem" D.string |> D.map (problem >> Wrong >> DeviceIs)
                            , D.field "found" (exactly False) |> D.map (\_ -> DeviceIs NotFound)
                            ]

                    "write" ->
                        D.oneOf
                            [ D.field "ok" (exactly True) |> D.map (\_ -> WriteDone WriteOk)
                            , D.map3 writeFault
                                (D.field "fault" D.string)
                                (D.field "detail" D.string)
                                (D.field "started" D.bool)
                                |> D.andThen identity
                            ]

                    "back" ->
                        D.oneOf
                            [ D.field "cause" D.string |> D.map (backCause >> Err >> BackDone)
                            , answer |> D.map (Ok >> BackDone)
                            ]

                    "mismatch" ->
                        D.map Mismatch (D.field "detail" D.string)

                    "ended" ->
                        D.map Ended (D.field "link" D.string)

                    "latest" ->
                        D.succeed Unrelated

                    _ ->
                        D.fail ("not an update event: " ++ op)
            )


writeFault : String -> String -> Bool -> Decoder Event
writeFault kind detail started =
    case kind of
        "unopenable" ->
            D.succeed (WriteDone Unopenable)

        "refused" ->
            D.succeed (WriteDone (Refused started detail))

        "guard" ->
            D.succeed (WriteDone (GuardRefused detail))

        "lost" ->
            D.succeed (WriteDone (Cut started detail))

        "leave" ->
            D.succeed (WriteDone (LeaveFail detail))

        _ ->
            D.fail ("not a write fault: " ++ kind)


exactly : Bool -> Decoder Bool
exactly want =
    D.bool
        |> D.andThen
            (\got ->
                if got == want then
                    D.succeed got

                else
                    D.fail "not this one"
            )


ticket : Decoder Ticket
ticket =
    D.string
        |> D.andThen
            (\text ->
                case text of
                    "status" ->
                        D.succeed TStatus

                    "project" ->
                        D.succeed TProject

                    "save" ->
                        D.succeed TSave

                    "putbin" ->
                        D.succeed TPutBin

                    "self" ->
                        D.succeed TSelf

                    "put" ->
                        D.succeed TPut

                    "dfu" ->
                        D.succeed TDfu

                    "install" ->
                        D.succeed TInstall

                    "verify" ->
                        D.succeed TVerify

                    _ ->
                        D.fail ("not a request id: " ++ text)
            )


{-| A console answer: its lines and end, the link gone, or no answer in
time; each said outright (`gone`, `noAnswer`), never assumed.
-}
answer : Decoder Answer
answer =
    D.oneOf
        [ D.map2 Said (D.field "lines" (D.list D.string)) (D.field "end" D.string)
        , D.field "gone" (exactly True) |> D.map (\_ -> Gone)
        , D.field "noAnswer" (exactly True) |> D.map (\_ -> NoAnswer)
        ]


problem : String -> String
problem reason =
    case reason of
        "several" ->
            "More than one new STM32 DFU device is on USB: unplug the others, then press WRITE AGAIN"

        "stale" ->
            "That DFU device was already there before the unit restarted into update mode, so it isn't this unit: press WRITE AGAIN and pick the new one"

        _ ->
            "No new STM32 DFU device came up (" ++ reason ++ ")"


backCause : String -> String
backCause cause =
    case cause of
        "several" ->
            "more than one unit's console is on USB, and the editor can't tell which is this one: unplug the others"

        "other" ->
            "no console on USB is this unit's: unplug the other units"

        "busy" ->
            "it still answers busy"

        "silent" ->
            "its console doesn't answer"

        _ ->
            "its console is not on USB"


progress : String -> Decoder Progress
progress key =
    D.map2 Progress (D.field key D.int) (D.field "total" D.int)


release : Decoder Release
release =
    D.map7 (\value seal format binSize bk2Size binSha bk2Sha -> \binCrc src -> Release value seal format binSize bk2Size binSha bk2Sha binCrc src)
        (D.field "version" D.string)
        (D.field "seal" D.string)
        (D.field "format" D.int)
        (D.field "binSize" D.int)
        (D.field "bk2Size" D.int)
        (D.field "binSha" D.string)
        (D.field "bk2Sha" D.string)
        |> D.andThen (\mk -> D.map2 mk (D.field "binCrc" D.string) source)


source : Decoder Source
source =
    D.field "source" D.string
        |> D.andThen
            (\text ->
                case text of
                    "chosen" ->
                        D.succeed Chosen

                    "latest" ->
                        D.succeed Latest

                    _ ->
                        D.fail ("not a source: " ++ text)
            )
