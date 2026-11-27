-- SPDX-License-Identifier: GPL-3.0-or-later


module TapeTest exposing (suite)

import Expect
import Fuzz exposing (Fuzzer)
import Json.Encode as E
import Tape.Name as Name
import Tape.Reply as Reply exposing (PutError(..), Reply(..))
import Tape.Report as Report exposing (Fit(..), LoadRefusal(..), Problem(..), Shape(..))
import Tape.Settings as Settings exposing (Form(..), Rate(..), Top(..))
import Tape.Step as Step
import Tape.Types exposing (Console(..), Dropped(..), Event(..), Failure(..), Hand(..), Js(..), Link(..), Model(..), Msg(..), Outcome(..), Playback(..), Request(..), Send(..), Stage(..), Work(..))
import Tape.View
import Tape.Wire as Wire
import Test exposing (Test, describe, fuzz, test)
import Test.Html.Query as Query
import Test.Html.Selector as Sel
import Ui.Page as Page
import Ui.Tokens as Tokens


{-| `tape.wasm`'s report for a 600 000-byte source: three chunks.
-}
sourceReport : String
sourceReport =
    String.join "\n"
        [ "stem 8266E80B"
        , "bytes 600000"
        , "crc 0BADF00D"
        , "name SINE"
        , "shape plain"
        , "rate 24000"
        , "frames 400000"
        , "count 1"
        , "root 5700"
        , "period 7149254"
        , "cost 600032"
        , "free 158000"
        , "fit streams"
        , "limit 1048576"
        , "why -"
        , ""
        ]


takeReport : String
takeReport =
    "rate 48000\nframes 24000\nname SINE16M48\n"


{-| The source `sourceReport` says, to a test; a report it can't read fails it.
-}
withSource : (Report.Source -> Expect.Expectation) -> Expect.Expectation
withSource check =
    case Report.parseSource sourceReport of
        Ok parsed ->
            check parsed

        Err why ->
            Expect.fail why


take : Report.Take
take =
    { file = "sine.wav", rate = 48000, frames = 24000, name = "SINE" }


modelWith : Link -> Work -> Model
modelWith link work =
    Model { stage = Holding { take = take, settings = Settings.defaults take, work = work }, link = link, console = Idle, tick = 0 }


workOf : Model -> Maybe Work
workOf (Model fields) =
    case fields.stage of
        Holding held ->
            Just held.work

        Opening ->
            Nothing

        Empty _ ->
            Nothing

        Reading _ ->
            Nothing

        Closing ->
            Nothing


{-| Lines from the unit, one after another, each with what it asked.
-}
replies : List String -> Model -> ( Model, List (List Request) )
replies lines start =
    List.foldl
        (\line ( model, asked ) ->
            let
                ( next, reqs ) =
                    Step.step (Line (Reply.parse line)) model
            in
            ( next, asked ++ [ reqs ] )
        )
        ( start, [] )
        lines


sent : Model -> ( Model, List Request )
sent =
    Step.hand SendIt


realLines : Fuzzer String
realLines =
    Fuzz.oneOf
        [ Fuzz.oneOfValues [ "READY", "OK", "OK PRESENT", "ACK 262144", "ERR busy", "ERR put: chunk", "ERR put: damaged", "ERR put takes /CHIMERA/...", "ACK", "ACK -1", "ACK 99999999999", "ACK 12a", " READY ", "" ]
        , Fuzz.string
        , Fuzz.map (\digits -> "ACK " ++ digits) Fuzz.string
        , Fuzz.map (\why -> "ERR put: " ++ why) Fuzz.string
        ]


suite : Test
suite =
    describe "TAPE import"
        [ describe "the unit's lines"
            [ test "each reply a put can give" <|
                \_ ->
                    List.map Reply.parse [ "READY", "OK PRESENT", "ACK 262144", "OK", "ERR busy", "ERR put: chunk", "ERR put: CRC mismatch", "ERR put: no room", "ERR put is not in this build", "ERR put takes /CHIMERA/PROJECTS/P#######.A", "status 1" ]
                        |> Expect.equal [ Ready, Present, Ack 262144, Done, Busy, Refused ChunkCrc, Refused BadCrc, Refused (Other "no room"), Refused NotInBuild, Refused Usage, Unexpected "status 1" ]
            , fuzz realLines "any line parses, and only `ACK <digits>` is an Ack" <|
                \line ->
                    case Reply.parse line of
                        Ack bytes ->
                            Expect.all
                                [ \_ -> String.trim line |> String.dropLeft 4 |> String.toInt |> Expect.equal (Just bytes)
                                , \_ -> String.trim line |> String.left 4 |> Expect.equal "ACK "
                                , \_ -> bytes |> Expect.atLeast 0
                                ]
                                ()

                        Ready ->
                            Expect.pass

                        Present ->
                            Expect.pass

                        Done ->
                            Expect.pass

                        Busy ->
                            Expect.pass

                        Refused _ ->
                            Expect.pass

                        Unexpected _ ->
                            Expect.pass
            ]
        , describe "tape.wasm's reports"
            [ test "a source's report" <|
                \_ ->
                    Report.parseSource sourceReport
                        |> Result.map (\parsed -> ( Report.remotePath parsed.stem, ( parsed.bytes, parsed.crc ), ( parsed.shape, parsed.fit, parsed.free ) ))
                        |> Expect.equal (Ok ( "/CHIMERA/TAPES/8266E80B.SRC", ( 600000, "0BADF00D" ), ( Plain, Streams, 158000 ) ))
            , test "a take's report" <|
                \_ ->
                    Report.parseTake "a.wav" takeReport |> Expect.equal (Ok { file = "a.wav", rate = 48000, frames = 24000, name = "SINE16M48" })
            , test "a key twice, a key missing, a number that isn't, a shape it doesn't know: no report" <|
                \_ ->
                    List.map (Report.parseSource >> Result.toMaybe)
                        [ sourceReport ++ "bytes 1\n"
                        , String.replace "crc 0BADF00D\n" "" sourceReport
                        , String.replace "bytes 600000" "bytes 6e5" sourceReport
                        , String.replace "shape plain" "shape zoneset" sourceReport
                        , String.replace "stem 8266E80B" "stem 8266E80" sourceReport
                        , String.replace "frames 400000" "frames 0" sourceReport
                        ]
                        |> Expect.equal [ Nothing, Nothing, Nothing, Nothing, Nothing, Nothing ]
            , fuzz Fuzz.string "any text is a report or refused, never a crash" <|
                \report ->
                    case Report.parseSource report of
                        Ok parsed ->
                            parsed.bytes |> Expect.atLeast 1

                        Err _ ->
                            Expect.pass
            , fuzz (Fuzz.intRange 0 13) "a report with any line lost is refused" <|
                \lost ->
                    String.lines sourceReport
                        |> List.indexedMap Tuple.pair
                        |> List.filter (\( idx, _ ) -> idx /= lost)
                        |> List.map Tuple.second
                        |> String.join "\n"
                        |> Report.parseSource
                        |> Result.toMaybe
                        |> Expect.equal Nothing
            , test "a refusal to load says why" <|
                \_ ->
                    String.replace "fit streams" "fit refused" sourceReport
                        |> String.replace "why -" "why transwave"
                        |> Report.parseSource
                        |> Result.map .fit
                        |> Expect.equal (Ok (WontLoad WavetableTooBig))
            , test "statuses" <|
                \_ ->
                    List.map Report.problemOf [ -1, -5, -9, -14, -15, -99 ] |> Expect.equal [ NotWav, NoSound, Report.TooBig, Unwritten, WavetableTooLong, UnknownStatus -99 ]
            ]
        , describe "tape.js's answers"
            [ test "a WAV refused, a trap, a source, a line, an op it doesn't know" <|
                \_ ->
                    withSource <|
                        \source ->
                            [ E.object [ ( "op", E.string "loaded" ), ( "file", E.string "x.wav" ), ( "status", E.int -1 ), ( "report", E.string "not a WAV" ) ]
                            , E.object [ ( "op", E.string "loaded" ), ( "file", E.string "x.wav" ), ( "trapped", E.string "unreachable" ) ]
                            , E.object [ ( "op", E.string "converted" ), ( "id", E.int 3 ), ( "status", E.int 0 ), ( "report", E.string sourceReport ) ]
                            , E.object [ ( "op", E.string "line" ), ( "line", E.string "ACK 262144" ) ]
                            , E.object [ ( "op", E.string "chunkless" ) ]
                            ]
                                |> List.map Wire.decode
                                |> Expect.equal
                                    [ Loaded "x.wav" (Err { problem = NotWav, detail = "not a WAV" })
                                    , Loaded "x.wav" (Err { problem = Trapped, detail = "unreachable" })
                                    , Converted 3 (Ok source)
                                    , Line (Ack 262144)
                                    , Garbled "Problem with the given value:\n\n{\n        \"op\": \"chunkless\"\n    }\n\nno such op: chunkless"
                                    ]
            ]
        , describe "names"
            [ test "a source's name, as the unit holds one" <|
                \_ ->
                    List.map (Name.fromString >> Result.map Name.toString) [ "choir 2", "", "   ", "A NAME OF SEVENTEEN", " LEAD", "BÄSS", "PAD-1" ]
                        |> Expect.equal [ Ok "CHOIR 2", Err Name.NoName, Err Name.NoName, Err Name.TooLong, Err Name.EdgeSpace, Err (Name.BadCharacter 'Ä'), Ok "PAD-1" ]
            , fuzz Fuzz.string "a name it takes is 1 to 16 of A-Z, 0-9, space and -, no edge space" <|
                \typed ->
                    case Name.fromString typed of
                        Ok named ->
                            let
                                kept : String
                                kept =
                                    Name.toString named
                            in
                            Expect.all
                                [ \_ -> String.length kept |> Expect.atMost 16
                                , \_ -> String.trim kept |> Expect.equal kept
                                , \_ -> String.all (\char -> Char.isUpper char || Char.isDigit char || char == ' ' || char == '-') kept |> Expect.equal True
                                ]
                                ()

                        Err _ ->
                            Expect.pass
            ]
        , describe "the choices"
            [ test "the defaults: the whole take at 24 kHz, the importer's name" <|
                \_ ->
                    Settings.args take (Settings.defaults take)
                        |> Result.map (\made -> ( Settings.argsLines made, Settings.argsFrom made, Settings.argsTo made ))
                        |> Expect.equal (Ok ( [ "--rate", "24k", "--name", "SINE" ], 0, 24000 ))
            , test "a long take: END defaults to what one copy holds at 24 kHz" <|
                \_ ->
                    Settings.defaults { take | frames = 44100 * 300, rate = 44100 }
                        |> .end
                        |> Expect.equal "28.870"
            , test "a piece of it, a wavetable at 1024" <|
                \_ ->
                    Settings.args take { rate = K8, start = "0.1", end = "0.25", name = "wave", form = Wavetable { cycle = "480", frames = 8, top = Top1024 } }
                        |> Result.map (\made -> ( Settings.argsLines made, Settings.argsFrom made, Settings.argsTo made ))
                        |> Expect.equal (Ok ( [ "--transwave", "480", "--frames", "8", "--top", "1024", "--name", "WAVE" ], 4800, 12000 ))
            , test "what isn't whole is said, and makes no Args" <|
                \_ ->
                    List.map (Settings.args take >> Result.toMaybe >> Maybe.map (\_ -> ()))
                        [ { rate = K24, start = "0.3", end = "0.2", name = "A", form = Sample }
                        , { rate = K24, start = "x", end = "0.2", name = "A", form = Sample }
                        , { rate = K24, start = "0", end = "0.2", name = "", form = Sample }
                        , { rate = K24, start = "0", end = "0.2", name = "A", form = Wavetable { cycle = "1", frames = 1, top = Top512 } }
                        , { rate = K24, start = "-1", end = "0.2", name = "A", form = Sample }
                        ]
                        |> Expect.equal [ Nothing, Nothing, Nothing, Nothing, Nothing ]
            , test "every rate, in the importer's spelling" <|
                \_ ->
                    List.map (\rate -> Settings.rateLabel rate) Settings.allRates |> Expect.equal [ "48 kHz", "32 kHz", "24 kHz", "16 kHz", "12 kHz", "8 kHz" ]
            ]
        , describe "the put"
            [ test "asked, three chunks each on its ACK, then the seal: on the card" <|
                \_ ->
                    withSource <|
                        \source ->
                            let
                                ( asking, first ) =
                                    sent (modelWith Linked (Made source Silent))

                                ( done, asked ) =
                                    replies [ "READY", "ACK 262144", "ACK 524288", "ACK 600000", "OK" ] asking
                            in
                            ( first, asked, workOf done )
                                |> Expect.equal
                                    ( [ ToJs (SendLine "put /CHIMERA/TAPES/8266E80B.SRC 600000 0BADF00D"), Await 1 ]
                                    , [ [ ToJs (SendChunk 0), Await 2 ], [ ToJs (SendChunk 1), Await 3 ], [ ToJs (SendChunk 2), Await 4 ], [ Await 5 ], [] ]
                                    , Just (Sent source Landed)
                                    )
            , test "the same audio already on the card: nothing sent" <|
                \_ ->
                    withSource <|
                        \source ->
                            replies [ "OK PRESENT" ] (Tuple.first (sent (modelWith Linked (Made source Silent))))
                                |> Tuple.first
                                |> workOf
                                |> Expect.equal (Just (Sent source AlreadyThere))
            , test "a refusal stops it, as the unit says" <|
                \_ ->
                    withSource <|
                        \source ->
                            replies [ "READY", "ERR put: chunk" ] (Tuple.first (sent (modelWith Linked (Made source Silent))))
                                |> Tuple.first
                                |> workOf
                                |> Expect.equal (Just (Sent source (Failed (UnitRefused ChunkCrc))))
            , test "an ACK for the wrong bytes: abort" <|
                \_ ->
                    withSource <|
                        \source ->
                            replies [ "READY", "ACK 1000" ] (Tuple.first (sent (modelWith Linked (Made source Silent))))
                                |> Expect.equal ( modelWith Linked (Sent source (Failed (OutOfTurn "ACK 1000"))) |> withTick 3 |> draining, [ [ ToJs (SendChunk 0), Await 2 ], [ ToJs Abort, AwaitQuiet 3 ] ] )
            , test "no answer to the newest wait: abort; an older wait's timeout does nothing" <|
                \_ ->
                    withSource <|
                        \source ->
                            let
                                ( chunked, _ ) =
                                    replies [ "READY" ] (Tuple.first (sent (modelWith Linked (Made source Silent))))
                            in
                            ( Step.timedOut 1 chunked |> Tuple.second, Step.timedOut 2 chunked )
                                |> Expect.equal ( [], ( modelWith Linked (Sent source (Failed NoAnswer)) |> withTick 3 |> draining, [ ToJs Abort, AwaitQuiet 3 ] ) )
            , test "after an abort, a re-SEND waits for the old put's answer, which is never taken as the new one's" <|
                \_ ->
                    withSource <|
                        \source ->
                            let
                                ( aborted, _ ) =
                                    replies [ "READY" ] (Tuple.first (sent (modelWith Linked (Made source Silent))))
                                        |> Tuple.first
                                        |> Step.timedOut 2

                                ( early, earlyAsked ) =
                                    sent aborted

                                ( answered, _ ) =
                                    replies [ "ERR put: aborted" ] early

                                ( again, againAsked ) =
                                    sent answered
                            in
                            ( ( earlyAsked, workOf answered ), ( againAsked, workOf again ) )
                                |> Expect.equal
                                    ( ( [], Just (Sent source (Failed NoAnswer)) )
                                    , ( [ ToJs (SendLine "put /CHIMERA/TAPES/8266E80B.SRC 600000 0BADF00D"), Await 4 ], Just (Sending source Asking) )
                                    )
            , test "a drain with no answer is over after its wait" <|
                \_ ->
                    withSource <|
                        \source ->
                            modelWith Linked (Sent source (Failed NoAnswer))
                                |> withTick 3
                                |> draining
                                |> Step.timedOut 3
                                |> Tuple.first
                                |> Expect.equal (modelWith Linked (Sent source (Failed NoAnswer)) |> withTick 3)
            , test "the link gone mid-copy" <|
                \_ ->
                    withSource <|
                        \source ->
                            Step.step LinkLost (Tuple.first (sent (modelWith Linked (Made source Silent))))
                                |> Tuple.first
                                |> Expect.equal (modelWith Unlinked (Sent source (Failed LinkGone)) |> withTick 1)
            , test "without a link, SEND does nothing" <|
                \_ ->
                    withSource <|
                        \source ->
                            sent (modelWith Unlinked (Made source Silent)) |> Expect.equal ( modelWith Unlinked (Made source Silent), [] )
            , test "while it copies, no choice, file or close changes anything" <|
                \_ ->
                    withSource <|
                        \source ->
                            let
                                copying : Model
                                copying =
                                    Tuple.first (sent (modelWith Linked (Made source Playing)))
                            in
                            [ Step.hand (SetRate K8) copying, Step.hand Close copying, Step.hand Make copying, Step.step (Picked "b.wav") copying ]
                                |> List.map Tuple.first
                                |> List.all ((==) copying)
                                |> Expect.equal True
            , test "a preview playing stops before the copy" <|
                \_ ->
                    withSource <|
                        \source ->
                            sent (modelWith Linked (Made source Playing)) |> Tuple.second |> List.head |> Expect.equal (Just (ToJs StopPlay))
            ]
        , describe "making it"
            [ test "a WAV read is made at once with the defaults" <|
                \_ ->
                    Step.step (Loaded "sine.wav" (Ok take)) (Model { stage = Reading "sine.wav", link = Linked, console = Idle, tick = 0 })
                        |> Tuple.mapFirst workOf
                        |> Tuple.mapSecond List.length
                        |> Expect.equal ( Just (Making 1), 1 )
            , test "an older conversion's answer is dropped: only the newest is taken" <|
                \_ ->
                    withSource <|
                        \source ->
                            Step.step (Loaded "sine.wav" (Ok take)) (Model { stage = Reading "sine.wav", link = Linked, console = Idle, tick = 0 })
                                |> Tuple.first
                                |> Step.hand (SetRate K48)
                                |> Tuple.first
                                |> Step.hand Make
                                |> Tuple.first
                                |> Step.step (Converted 1 (Ok source))
                                |> Tuple.first
                                |> workOf
                                |> Expect.equal (Just (Making 2))
            , test "a WAV refused: said, and another can be chosen" <|
                \_ ->
                    Step.step (Loaded "x.wav" (Err { problem = NotWav, detail = "" })) (Model { stage = Reading "x.wav", link = Linked, console = Idle, tick = 0 })
                        |> Tuple.first
                        |> Expect.equal (Model { stage = Empty (Unread "x.wav" { problem = NotWav, detail = "" }), link = Linked, console = Idle, tick = 0 })
            , test "a choice changed: the source is to make again, its preview stopped" <|
                \_ ->
                    withSource <|
                        \source ->
                            Step.hand (SetRate K12) (modelWith Linked (Made source Playing))
                                |> Tuple.mapFirst workOf
                                |> Expect.equal ( Just Unmade, [ ToJs StopPlay ] )
            , test "a file dropped while one is held: read, after its preview stops" <|
                \_ ->
                    withSource <|
                        \source ->
                            Step.step (Picked "b.wav") (modelWith Linked (Made source Playing))
                                |> Expect.equal ( Model { stage = Reading "b.wav", link = Linked, console = Idle, tick = 0 }, [ ToJs StopPlay, ToJs ReadFile ] )
            ]
        , describe "the page"
            [ test "a source made: its file, where it plays from, and SEND" <|
                \_ ->
                    withSource <|
                        \source ->
                            Tape.View.view (\_ -> Hand Close) identity (Page.init Tokens.Day) (modelWith Linked (Made source Silent))
                                |> Query.fromHtml
                                |> Expect.all
                                    [ Query.has [ Sel.text "/CHIMERA/TAPES/8266E80B.SRC" ]
                                    , Query.has [ Sel.containing [ Sel.text "STREAMS FROM THE CARD" ] ]
                                    , Query.find [ Sel.tag "button", Sel.containing [ Sel.text "SEND TO THE UNIT" ] ] >> Query.has [ Sel.disabled False ]
                                    ]
            , test "the root as a note" <|
                \_ ->
                    List.map Tape.View.rootName [ 6000, 5700, 6912, 5988 ] |> Expect.equal [ "C4", "A3", "A4 +12", "C4 -12" ]
            , test "sizes in KiB" <|
                \_ ->
                    List.map Tape.View.kib [ 1024, 18214, 158000 ] |> Expect.equal [ "1.0 KiB", "17.8 KiB", "154.3 KiB" ]
            ]
        ]


draining : Model -> Model
draining (Model fields) =
    Model { fields | console = Draining }


withTick : Int -> Model -> Model
withTick tick (Model fields) =
    Model { fields | tick = tick }
