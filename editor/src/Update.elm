-- SPDX-License-Identifier: GPL-3.0-or-later


port module Update exposing
    ( Answer(..)
    , Bk2(..)
    , Device(..)
    , Event(..)
    , Failure(..)
    , Model
    , Msg(..)
    , Offer(..)
    , Progress
    , Release
    , ReleaseState(..)
    , Request(..)
    , Run(..)
    , Source(..)
    , Stage(..)
    , UnitNow
    , Verdict(..)
    , WriteResult(..)
    , begin
    , offer
    , readStatus
    , stage
    , step
    , subscriptions
    , update
    , verdict
    , view
    )

{-| The update from the browser: what `chimera-usb.py update` does, as a
state machine. Every step is decided here; `update.js` only carries each
request out (the console's answers, the put, the DFU write) and says what
came of it.

  - **Checking:** `status`; a project with unsaved changes stops it, nothing written.
  - **Copying:** `CHIMERA.BK2` put onto the card (`/CHIMERA/SYSTEM/BANK2.BK2`).
    Firmware from before bank 2 refuses the path: the .bk2 then goes after the flash.
  - **Restarting into update mode:** `dfu`; the unit comes back as the STM32 loader's DFU device.
  - **Writing:** `CHIMERA.BIN` at 0x08020000 (`dfu.js`), then the leave that starts it.
  - **Installing:** the console back, the new firmware running, bank 2 open
    with this release's seal; else `bank2 install` (the .bk2 put first,
    after an older firmware), its restart, and `status` once more.

A stop anywhere says what happened and the way out, in plain words: before
the write, nothing changed; during or after it, how to finish from the
bootloader, which is never touched.

-}

import Html exposing (Html, a, button, div, li, ol, p, span, text)
import Html.Attributes exposing (attribute, class, href, rel, style, target)
import Html.Events exposing (onClick)
import Json.Decode as D exposing (Decoder)
import Json.Encode as E
import Ui.Chip as Chip
import Ui.Module as Module
import Ui.Page as Page



-- PORTS


port updateOut : E.Value -> Cmd msg


port updateIn : (D.Value -> msg) -> Sub msg



-- WHAT THE UNIT AND THE RELEASE ARE


{-| The unit as `status` says it: its `build` line's version and hash
(`0.4.0 de07edf9`), whether the project has unsaved changes, its bank 2
line (`open 0.4.0 de07edf9 seal=…`). A unit that didn't answer says none.
-}
type alias UnitNow =
    { build : Maybe String
    , modified : Bool
    , bank2 : Maybe String
    }


{-| Where the files came from: the site's copy of the latest release, or
files the user chose.
-}
type Source
    = Latest
    | Chosen


{-| A pair checked against its SHA256SUMS and as one build (`update.js`):
the .bk2's version (`0.4.1 abcd1234`), its seal, its format, the sizes.
-}
type alias Release =
    { version : String
    , seal : String
    , format : Int
    , binSize : Int
    , bk2Size : Int
    , source : Source
    }


type ReleaseState
    = Fetching
    | Got Release
    | Missing String


{-| Where CHIMERA.BK2 is: on the card before the flash, or still to go after it.
-}
type Bk2
    = Staged
    | AfterFlash


type alias Progress =
    { done : Int, total : Int }


{-| A running update's step.
-}
type Run
    = Checking
    | Copying Progress
    | EnteringDfu Bk2
    | FindingDevice Bk2
      -- The browser asks once which device: a click. True: a pick came back empty.
    | PickingDevice Bk2 Bool
    | Writing Bk2 Progress
    | Restarting Bk2
    | CopyingLate Progress
    | Installing Int
    | RestartingAfterInstall
    | Verifying


{-| Why an update stopped, and so the way out.
-}
type Failure
    = -- Nothing written.
      Unsaved
    | NothingFlashed String
      -- In update mode; nothing written yet.
    | CantOpen Bk2
    | Guarded String
      -- The firmware area half written.
    | WriteCut Bk2 String
      -- The firmware written; the rest not confirmed.
    | NotBack Bk2 String
    | Unfinished String


type Stage
    = Opening
    | Reading (Maybe UnitNow) ReleaseState
    | Ready UnitNow ReleaseState
    | Confirm UnitNow Release
    | Running UnitNow Release Run
    | Done UnitNow Release UnitNow
    | Stopped UnitNow Release Failure
    | NoLink
    | Closing


type Model
    = Model { stage : Stage, windows : Bool, webusb : Bool }



-- WHAT GOES TO update.js, AND WHAT COMES BACK


type Request
    = Begin
    | FetchLatest
    | ChooseFiles
    | Ask String Int
    | Put
    | Dfu
    | FindDevice Int
    | PickDevice
    | Write
    | Back Int Bool
    | End


{-| A console answer: its body and its OK or ERR line; none in time; or the link gone.
-}
type Answer
    = Said (List String) String
    | NoAnswer
    | Gone


type Device
    = Found
    | NotFound
    | NoWebUsb


type WriteResult
    = WriteOk
    | Unopenable
    | Cut String
    | Refused String
    | GuardRefused String


type Event
    = Begun { open : Bool, webusb : Bool, windows : Bool }
    | ReleaseIs (Result String Release)
    | Answered String Answer
    | Copied Progress
    | PutDone Answer
    | DfuDone Answer
    | DeviceIs Device
    | Written Progress
    | WriteDone WriteResult
    | BackDone (Result String Answer)
    | Ended String


type Msg
    = FromJs D.Value
    | Choose
    | Start
    | Go
    | Cancel
    | Pick
    | WriteAgain
    | CheckAgain
    | TryAgain
    | Close



-- STEPS


{-| The panel opening: the link taken from the editor, `status`, and the
site's latest release.
-}
begin : ( Model, Cmd msg )
begin =
    ( Model { stage = Opening, windows = False, webusb = True }, send [ Begin ] )


stage : Model -> Stage
stage (Model m) =
    m.stage


subscriptions : Sub Msg
subscriptions =
    updateIn FromJs


{-| A message in; the model, what to send, and the link's state once the
update has given it back (the editor then starts over).
-}
update : Msg -> Model -> ( Model, Cmd Msg, Maybe String )
update msg model =
    let
        ( next, reqs ) =
            case msg of
                FromJs v ->
                    case D.decodeValue event v of
                        Ok e ->
                            step e model

                        Err _ ->
                            ( model, [] )

                Choose ->
                    hand msg model

                Start ->
                    hand msg model

                Go ->
                    hand msg model

                Cancel ->
                    hand msg model

                Pick ->
                    hand msg model

                WriteAgain ->
                    hand msg model

                CheckAgain ->
                    hand msg model

                TryAgain ->
                    hand msg model

                Close ->
                    hand msg model
    in
    ( next
    , send reqs
    , case msg of
        FromJs v ->
            case D.decodeValue event v of
                Ok (Ended l) ->
                    Just l

                _ ->
                    Nothing

        Choose ->
            Nothing

        Start ->
            Nothing

        Go ->
            Nothing

        Cancel ->
            Nothing

        Pick ->
            Nothing

        WriteAgain ->
            Nothing

        CheckAgain ->
            Nothing

        TryAgain ->
            Nothing

        Close ->
            Nothing
    )


send : List Request -> Cmd msg
send reqs =
    Cmd.batch (List.map (encode >> updateOut) reqs)


{-| A hand on the panel.
-}
hand : Msg -> Model -> ( Model, List Request )
hand msg ((Model m) as model) =
    let
        to : Stage -> Model
        to s =
            Model { m | stage = s }
    in
    case ( msg, m.stage ) of
        ( Choose, Ready u _ ) ->
            ( to (Ready u Fetching), [ ChooseFiles ] )

        ( Start, Ready u (Got r) ) ->
            ( to (Confirm u r), [] )

        ( Go, Confirm u r ) ->
            ( to (Running u r Checking), [ Ask "status" 2000 ] )

        ( Cancel, Confirm u r ) ->
            ( to (Ready u (Got r)), [] )

        ( Pick, Running u r (PickingDevice b _) ) ->
            ( to (Running u r (PickingDevice b False)), [ PickDevice ] )

        ( WriteAgain, Stopped u r (CantOpen b) ) ->
            ( to (Running u r (FindingDevice b)), [ FindDevice 3 ] )

        ( WriteAgain, Stopped u r (WriteCut b _) ) ->
            ( to (Running u r (FindingDevice b)), [ FindDevice 3 ] )

        ( CheckAgain, Stopped u r (NotBack b _) ) ->
            ( to (Running u r (Restarting b)), [ Back 120 False ] )

        ( TryAgain, Stopped u r _ ) ->
            ( to (Running u r Checking), [ Ask "status" 2000 ] )

        ( Close, Running _ _ _ ) ->
            -- Never mid-update: the page has no CLOSE then.
            ( model, [] )

        ( Close, Closing ) ->
            ( model, [] )

        ( Close, _ ) ->
            ( to Closing, [ End ] )

        _ ->
            ( model, [] )


{-| What came back from `update.js`, against where the update is: an
answer the step isn't waiting for changes nothing.
-}
step : Event -> Model -> ( Model, List Request )
step e ((Model m) as model) =
    let
        to : Stage -> Model
        to s =
            Model { m | stage = s }

        running : UnitNow -> Release -> Run -> Model
        running u r =
            Running u r >> to

        stop : UnitNow -> Release -> Failure -> ( Model, List Request )
        stop u r f =
            ( to (Stopped u r f), [] )
    in
    case ( e, m.stage ) of
        ( Begun b, Opening ) ->
            if b.open then
                ( Model { m | stage = Reading Nothing Fetching, windows = b.windows, webusb = b.webusb }, [ Ask "status" 2000, FetchLatest ] )

            else
                ( Model { m | stage = NoLink, windows = b.windows, webusb = b.webusb }, [] )

        ( Answered "status" a, Reading Nothing rel ) ->
            reading (Just (unitOf a)) rel m

        ( ReleaseIs r, Reading u Fetching ) ->
            reading u (releaseState r) m

        ( ReleaseIs r, Ready u Fetching ) ->
            ( to (Ready u (releaseState r)), [] )

        -- CHECKING: unsaved changes stop it; a unit too old to say goes on, as the script does.
        ( Answered "status" a, Running u r Checking ) ->
            case a of
                Gone ->
                    stop u r (NothingFlashed "The unit was disconnected")

                Said _ _ ->
                    if (unitOf a).modified then
                        stop u r Unsaved

                    else
                        ( running u r (Copying { done = 0, total = r.bk2Size }), [ Put ] )

                NoAnswer ->
                    ( running u r (Copying { done = 0, total = r.bk2Size }), [ Put ] )

        ( Copied p, Running u r (Copying _) ) ->
            ( running u r (Copying p), [] )

        ( PutDone a, Running u r (Copying _) ) ->
            case staging r a of
                Ok b ->
                    ( running u r (EnteringDfu b), [ Dfu ] )

                Err why ->
                    stop u r (NothingFlashed why)

        ( DfuDone a, Running u r (EnteringDfu b) ) ->
            case a of
                Said _ end ->
                    if isOk end then
                        ( running u r (FindingDevice b), [ FindDevice 10 ] )

                    else
                        stop u r (NothingFlashed ("The unit refused update mode: " ++ end))

                -- Sent: the OK was lost to the reset, not refused.
                Gone ->
                    ( running u r (FindingDevice b), [ FindDevice 10 ] )

                NoAnswer ->
                    stop u r (NothingFlashed "The unit didn't answer the request for update mode")

        ( DeviceIs d, Running u r (FindingDevice b) ) ->
            device d u r b m

        ( DeviceIs d, Running u r (PickingDevice b _) ) ->
            case d of
                NotFound ->
                    ( running u r (PickingDevice b True), [] )

                Found ->
                    device d u r b m

                NoWebUsb ->
                    device d u r b m

        ( Written p, Running u r (Writing b _) ) ->
            ( running u r (Writing b p), [] )

        ( WriteDone w, Running u r (Writing b _) ) ->
            case w of
                WriteOk ->
                    ( running u r (Restarting b), [ Back 120 False ] )

                Unopenable ->
                    stop u r (CantOpen b)

                Cut why ->
                    stop u r (WriteCut b why)

                Refused why ->
                    stop u r (WriteCut b why)

                GuardRefused why ->
                    stop u r (Guarded why)

        ( BackDone res, Running u r (Restarting b) ) ->
            case res of
                Err cause ->
                    stop u r (NotBack b cause)

                Ok a ->
                    case verdict r a of
                        Installed now ->
                            ( to (Done u r now), [] )

                        NeedsInstall _ ->
                            case b of
                                Staged ->
                                    ( running u r (Installing 1), [ Ask "bank2 install" 120000 ] )

                                AfterFlash ->
                                    ( running u r (CopyingLate { done = 0, total = r.bk2Size }), [ Put ] )

                        NotFinished why ->
                            stop u r (Unfinished why)

        ( Copied p, Running u r (CopyingLate _) ) ->
            ( running u r (CopyingLate p), [] )

        ( PutDone a, Running u r (CopyingLate _) ) ->
            case a of
                Said _ end ->
                    if String.startsWith "OK staged:" end then
                        stop u r (Unfinished (String.dropLeft 3 end ++ later))

                    else if isOk end then
                        ( running u r (Installing 1), [ Ask "bank2 install" 120000 ] )

                    else
                        stop u r (Unfinished ("Copying CHIMERA.BK2 after the flash: " ++ end))

                NoAnswer ->
                    stop u r (Unfinished "The unit stopped answering while CHIMERA.BK2 was copied")

                Gone ->
                    stop u r (Unfinished "The unit was disconnected while CHIMERA.BK2 was copied")

        ( Answered "bank2 install" a, Running u r (Installing tries) ) ->
            case a of
                Said _ end ->
                    if String.startsWith "OK bank2 open " end then
                        ( running u r RestartingAfterInstall, [ Back 60 True ] )

                    else if isOk end then
                        ( running u r Verifying, [ Ask "status" 2000 ] )

                    else if end == "ERR bank2: busy" && tries < 5 then
                        ( running u r (Installing (tries + 1)), [ Ask "bank2 install" 120000 ] )

                    else
                        stop u r (Unfinished (installRefusal end))

                -- The install may have opened the door and restarted the unit.
                Gone ->
                    ( running u r RestartingAfterInstall, [ Back 60 True ] )

                NoAnswer ->
                    stop u r (Unfinished "The unit didn't answer bank2 install")

        ( BackDone res, Running u r RestartingAfterInstall ) ->
            case res of
                Err cause ->
                    stop u r (NotBack Staged cause)

                Ok a ->
                    finish u r a m

        ( Answered "status" a, Running u r Verifying ) ->
            finish u r a m

        ( Ended _, Closing ) ->
            ( model, [] )

        _ ->
            ( model, [] )


reading : Maybe UnitNow -> ReleaseState -> { stage : Stage, windows : Bool, webusb : Bool } -> ( Model, List Request )
reading u rel m =
    case ( u, rel ) of
        ( Just unit, Got _ ) ->
            ( Model { m | stage = Ready unit rel }, [] )

        ( Just unit, Missing _ ) ->
            ( Model { m | stage = Ready unit rel }, [] )

        _ ->
            ( Model { m | stage = Reading u rel }, [] )


releaseState : Result String Release -> ReleaseState
releaseState r =
    case r of
        Ok rel ->
            Got rel

        Err why ->
            Missing why


device : Device -> UnitNow -> Release -> Bk2 -> { stage : Stage, windows : Bool, webusb : Bool } -> ( Model, List Request )
device d u r b m =
    case d of
        Found ->
            ( Model { m | stage = Running u r (Writing b { done = 0, total = 1 }) }, [ Write ] )

        NotFound ->
            ( Model { m | stage = Running u r (PickingDevice b False) }, [] )

        NoWebUsb ->
            ( Model { m | stage = Stopped u r (CantOpen b) }, [] )


{-| The last `status`: done, or what it says instead.
-}
finish : UnitNow -> Release -> Answer -> { stage : Stage, windows : Bool, webusb : Bool } -> ( Model, List Request )
finish u r a m =
    case verdict r a of
        Installed now ->
            ( Model { m | stage = Done u r now }, [] )

        NeedsInstall said ->
            ( Model
                { m
                    | stage =
                        Stopped u
                            r
                            (Unfinished ("The unit says " ++ said ++ ", not bank2 open " ++ r.version ++ " seal=" ++ r.seal ++ " (a staged CHIMERA.BK2 stays on the card for the next start)"))
                }
            , []
            )

        NotFinished why ->
            ( Model { m | stage = Stopped u r (Unfinished why) }, [] )


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



-- WHAT THE UNIT'S ANSWERS MEAN


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
    }


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


type Verdict
    = Installed UnitNow
    | NeedsInstall String
    | NotFinished String


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

                    running : Maybe String
                    running =
                        u.build |> Maybe.andThen (trimPlus >> lastWord)
                in
                if hash == Nothing || running /= hash then
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


{-| The unit's version against the release's.
-}
type Offer
    = Newer
    | Same
    | Unknown


offer : UnitNow -> Release -> Offer
offer u r =
    case u.build |> Maybe.map trimPlus of
        Nothing ->
            Unknown

        Just b ->
            if b == r.version then
                Same

            else
                Newer



-- THE WIRE


encode : Request -> E.Value
encode r =
    let
        op : String -> List ( String, E.Value ) -> E.Value
        op name rest =
            E.object (( "op", E.string name ) :: rest)
    in
    case r of
        Begin ->
            op "begin" []

        FetchLatest ->
            op "release" [ ( "how", E.string "latest" ) ]

        ChooseFiles ->
            op "release" [ ( "how", E.string "choose" ) ]

        Ask line wait ->
            op "ask" [ ( "line", E.string line ), ( "wait", E.int wait ) ]

        Put ->
            op "put" []

        Dfu ->
            op "dfu" []

        FindDevice secs ->
            op "findDevice" [ ( "secs", E.int secs ) ]

        PickDevice ->
            op "pickDevice" []

        Write ->
            op "write" []

        Back secs restart ->
            op "back" [ ( "secs", E.int secs ), ( "restart", E.bool restart ) ]

        End ->
            op "end" []


event : Decoder Event
event =
    D.field "op" D.string
        |> D.andThen
            (\op ->
                case op of
                    "begun" ->
                        D.map3 (\o w win -> Begun { open = o, webusb = w, windows = win })
                            (D.field "open" D.bool)
                            (D.field "webusb" D.bool)
                            (D.oneOf [ D.field "windows" D.bool, D.succeed False ])

                    "release" ->
                        D.oneOf
                            [ D.field "release" release |> D.map (Ok >> ReleaseIs)
                            , D.field "detail" D.string |> D.map (Err >> ReleaseIs)
                            ]

                    "answer" ->
                        D.map2 Answered (D.field "line" D.string) answer

                    "copied" ->
                        D.map Copied (progress "sent")

                    "put" ->
                        D.map PutDone answer

                    "dfu" ->
                        D.map DfuDone answer

                    "device" ->
                        D.map2
                            (\found unsupported ->
                                DeviceIs
                                    (if found then
                                        Found

                                     else if unsupported then
                                        NoWebUsb

                                     else
                                        NotFound
                                    )
                            )
                            (D.field "found" D.bool)
                            (D.oneOf [ D.field "unsupported" D.bool, D.succeed False ])

                    "written" ->
                        D.map Written (progress "done")

                    "write" ->
                        D.oneOf
                            [ D.field "ok" D.bool |> D.map (\_ -> WriteDone WriteOk)
                            , D.map2
                                (\kind detail ->
                                    WriteDone
                                        (case kind of
                                            "unopenable" ->
                                                Unopenable

                                            "refused" ->
                                                Refused detail

                                            "guard" ->
                                                GuardRefused detail

                                            _ ->
                                                Cut detail
                                        )
                                )
                                (D.field "fault" D.string)
                                (D.field "detail" D.string)
                            ]

                    "back" ->
                        D.oneOf
                            [ D.field "cause" D.string |> D.map (Err >> BackDone)
                            , answer |> D.map (Ok >> BackDone)
                            ]

                    "ended" ->
                        D.map Ended (D.field "link" D.string)

                    _ ->
                        D.fail ("not an update event: " ++ op)
            )


answer : Decoder Answer
answer =
    D.oneOf
        [ D.map2 Said (D.oneOf [ D.field "lines" (D.list D.string), D.succeed [] ]) (D.field "end" D.string)
        , D.field "gone" D.bool |> D.map (\_ -> Gone)
        , D.succeed NoAnswer
        ]


progress : String -> Decoder Progress
progress key =
    D.map2 Progress (D.field key D.int) (D.field "total" D.int)


release : Decoder Release
release =
    D.map6 Release
        (D.field "version" D.string)
        (D.field "seal" D.string)
        (D.field "format" D.int)
        (D.field "binSize" D.int)
        (D.field "bk2Size" D.int)
        (D.field "source" D.string
            |> D.map
                (\s ->
                    if s == "chosen" then
                        Chosen

                    else
                        Latest
                )
        )



-- VIEW


{-| The update's page: the editor's own frame (its top bar and theme), one
UPDATE module that says where the update is and what to do.
-}
view : (Page.Msg -> msg) -> (Msg -> msg) -> Page.State -> Model -> Html msg
view pageMsg toMsg page (Model m) =
    Page.view pageMsg
        page
        (Page.new "UPDATE"
            |> Page.meta (meta m.stage)
            |> Page.link (Page.Linked "UNIT · UPDATE")
            |> Page.modules
                [ Module.new Chip.Unit "UPDATE"
                    |> Module.full
                    |> Module.body [ Html.map toMsg (div [ class "upd" ] (body m)) ]
                ]
        )


meta : Stage -> String
meta s =
    case s of
        Opening ->
            "CHECKING"

        Reading _ _ ->
            "CHECKING"

        Ready _ _ ->
            "READY"

        Confirm _ _ ->
            "READY"

        Running _ _ run ->
            runTitle run

        Done _ _ _ ->
            "DONE"

        Stopped _ _ _ ->
            "STOPPED"

        NoLink ->
            "NOT CONNECTED"

        Closing ->
            "CLOSING"


runTitle : Run -> String
runTitle run =
    case run of
        Checking ->
            "CHECKING"

        Copying _ ->
            "COPYING BANK 2"

        EnteringDfu _ ->
            "RESTARTING INTO UPDATE MODE"

        FindingDevice _ ->
            "RESTARTING INTO UPDATE MODE"

        PickingDevice _ _ ->
            "CHOOSE THE UPDATE DEVICE"

        Writing _ _ ->
            "WRITING FIRMWARE"

        Restarting _ ->
            "INSTALLING"

        CopyingLate _ ->
            "COPYING BANK 2"

        Installing _ ->
            "INSTALLING"

        RestartingAfterInstall ->
            "INSTALLING"

        Verifying ->
            "INSTALLING"


version : Maybe String -> String
version v =
    case v |> Maybe.map (trimPlus >> String.words) of
        Just [ number, hash ] ->
            number ++ " (" ++ hash ++ ")"

        Just ws ->
            String.join " " ws

        Nothing ->
            "UNKNOWN"


fact : String -> String -> Html msg
fact k v =
    div [ class "uline" ] [ span [ class "k" ] [ text k ], span [ class "v" ] [ text v ] ]


btn : String -> Msg -> Html Msg
btn label msg =
    button [ class "hbtn", onClick msg ] [ text label ]


buttons : List (Html Msg) -> Html Msg
buttons =
    div [ class "connect" ]


say : String -> Html msg
say s =
    p [] [ text s ]


latestUrl : String
latestUrl =
    "https://github.com/joegiralt/chimera-releases/releases/latest"


body : { stage : Stage, windows : Bool, webusb : Bool } -> List (Html Msg)
body m =
    case m.stage of
        Opening ->
            [ say "Checking the unit…" ]

        Reading _ _ ->
            [ say "Checking the unit and the latest release…" ]

        NoLink ->
            [ say "The unit isn't connected. Connect it, then press UPDATE again."
            , buttons [ btn "CLOSE" Close ]
            ]

        Closing ->
            [ say "Back to the editor…" ]

        Ready u rel ->
            fact "THIS UNIT" (version u.build)
                :: (case rel of
                        Fetching ->
                            [ say "Reading the files…" ]

                        Missing why ->
                            [ fact "LATEST" "NOT FOUND"
                            , say (why ++ ".")
                            , say "Choose the release's files instead: CHIMERA.BIN, CHIMERA.BK2 and SHA256SUMS, all three at once."
                            , buttons [ btn "CHOOSE FILES…" Choose, btn "CLOSE" Close ]
                            ]

                        Got r ->
                            fact
                                (case r.source of
                                    Latest ->
                                        "LATEST"

                                    Chosen ->
                                        "CHOSEN FILES"
                                )
                                (version (Just r.version))
                                :: (if not m.webusb then
                                        [ say "USE CHROME OR EDGE: this browser can't reach the unit's update mode (no WebUSB). Firefox and Safari can't update the unit." ]

                                    else
                                        [ say
                                            (case offer u r of
                                                Same ->
                                                    "This unit already runs this version. You can reinstall it."

                                                Newer ->
                                                    "An update is ready."

                                                Unknown ->
                                                    "The unit didn't say its version."
                                            )
                                        ]
                                   )
                                ++ [ buttons
                                        ((if m.webusb then
                                            [ btn
                                                (case offer u r of
                                                    Same ->
                                                        "REINSTALL…"

                                                    Newer ->
                                                        "UPDATE…"

                                                    Unknown ->
                                                        "UPDATE…"
                                                )
                                                Start
                                            ]

                                          else
                                            []
                                         )
                                            ++ [ btn "CHOOSE FILES…" Choose, btn "CLOSE" Close ]
                                        )
                                   ]
                   )

        Confirm u r ->
            [ fact "UPDATE" (version u.build ++ " → " ++ version (Just r.version))
            , say
                (if offer u r == Same then
                    "This reinstalls the version the unit already runs."

                 else
                    "This updates the unit's firmware."
                )
            , say "Don't unplug the unit or power it off until this page says DONE. It takes about two minutes."
            , say "Unsaved changes block the update: save the project first (hold MENU), or load another."
            , say "Your projects and Sounds on the card stay. The bootloader is never touched."
            , buttons [ btn "START UPDATE" Go, btn "CANCEL" Cancel ]
            ]

        Running u r run ->
            fact "UPDATE" (version u.build ++ " → " ++ version (Just r.version))
                :: stages run
                :: runningText m.windows run

        Done was r now ->
            [ fact "UPDATED" (version was.build ++ " → " ++ version now.build)
            , say ("Done. The unit runs " ++ version (Just r.version) ++ ".")
            , buttons [ btn "BACK TO THE EDITOR" Close ]
            ]

        Stopped u r f ->
            fact "UPDATE" (version u.build ++ " → " ++ version (Just r.version))
                :: failure m.windows u f


{-| The stages in order, the current one marked, done ones ticked.
-}
stages : Run -> Html msg
stages run =
    let
        at : Int
        at =
            case run of
                Checking ->
                    0

                Copying _ ->
                    1

                EnteringDfu _ ->
                    2

                FindingDevice _ ->
                    2

                PickingDevice _ _ ->
                    2

                Writing _ _ ->
                    3

                Restarting _ ->
                    4

                CopyingLate _ ->
                    4

                Installing _ ->
                    4

                RestartingAfterInstall ->
                    4

                Verifying ->
                    4

        pct : Maybe Progress
        pct =
            case run of
                Copying p ->
                    Just p

                CopyingLate p ->
                    Just p

                Writing _ p ->
                    Just p

                Checking ->
                    Nothing

                EnteringDfu _ ->
                    Nothing

                FindingDevice _ ->
                    Nothing

                PickingDevice _ _ ->
                    Nothing

                Restarting _ ->
                    Nothing

                Installing _ ->
                    Nothing

                RestartingAfterInstall ->
                    Nothing

                Verifying ->
                    Nothing

        names : List String
        names =
            [ "CHECKING", "COPYING BANK 2", "RESTARTING INTO UPDATE MODE", "WRITING FIRMWARE", "INSTALLING" ]
    in
    ol [ class "ustages" ]
        (List.indexedMap
            (\i n ->
                li
                    [ class
                        (if i < at then
                            "done"

                         else if i == at then
                            "now"

                         else
                            "todo"
                        )
                    , attribute "aria-current"
                        (if i == at then
                            "step"

                         else
                            "false"
                        )
                    ]
                    (text n
                        :: (case ( i == at, pct ) of
                                ( True, Just p ) ->
                                    [ span [ class "pct" ] [ text (" " ++ String.fromInt (percent p) ++ " %") ]
                                    , div [ class "ubar" ] [ div [ style "width" (String.fromInt (percent p) ++ "%") ] [] ]
                                    ]

                                _ ->
                                    []
                           )
                    )
            )
            names
        )


percent : Progress -> Int
percent p =
    if p.total <= 0 then
        0

    else
        min 100 (p.done * 100 // p.total)


runningText : Bool -> Run -> List (Html Msg)
runningText windows run =
    case run of
        PickingDevice _ cancelled ->
            say "The unit is in update mode (its screen goes dark). The browser asks once which device to use: press CHOOSE UPDATE DEVICE and pick STM32 BOOTLOADER."
                :: (if cancelled then
                        say "No device was chosen."
                            :: (if windows then
                                    driverSteps

                                else
                                    []
                               )

                    else
                        []
                   )
                ++ [ buttons [ btn "CHOOSE UPDATE DEVICE" Pick ]
                   , say "To stop instead: unplug the USB cable and plug it back in. The unit starts as before; nothing has been written."
                   ]

        Checking ->
            [ say "Don't unplug the unit or power it off." ]

        Copying _ ->
            [ say "Don't unplug the unit or power it off." ]

        EnteringDfu _ ->
            [ say "Don't unplug the unit or power it off." ]

        FindingDevice _ ->
            [ say "Don't unplug the unit or power it off." ]

        Writing _ _ ->
            [ say "Don't unplug the unit or power it off." ]

        Restarting _ ->
            [ say "Don't unplug the unit or power it off." ]

        CopyingLate _ ->
            [ say "Don't unplug the unit or power it off." ]

        Installing _ ->
            [ say "Don't unplug the unit or power it off." ]

        RestartingAfterInstall ->
            [ say "Don't unplug the unit or power it off." ]

        Verifying ->
            [ say "Don't unplug the unit or power it off." ]


driverSteps : List (Html Msg)
driverSteps =
    [ say "On Windows, the browser needs a driver for update mode, once:"
    , ol []
        [ li [] [ text "Download Zadig from ", a [ href "https://zadig.akeo.ie/", target "_blank", rel "noopener" ] [ text "zadig.akeo.ie" ], text " and run it." ]
        , li [] [ text "In Options, tick List All Devices." ]
        , li [] [ text "Select STM32 BOOTLOADER." ]
        , li [] [ text "Pick WinUSB and press Install Driver (or Replace Driver)." ]
        , li [] [ text "Come back here and press WRITE AGAIN." ]
        ]
    ]


sdSteps : List (Html Msg)
sdSteps =
    [ say "Or use the SD card instead:"
    , ol []
        [ li [] [ text "Get CHIMERA.BIN and CHIMERA.BK2 from the ", a [ href latestUrl, target "_blank", rel "noopener" ] [ text "release page" ], text "." ]
        , li [] [ text "Hold MENU while you power the unit on, then press button 3 (SD card access)." ]
        , li [] [ text "Copy both files to the card's top folder (choose Replace), and eject it." ]
        , li [] [ text "Press MENU, step with − / + until it shows CHIMERA.BIN, and press button 1." ]
        , li [] [ text "Chimera installs CHIMERA.BK2 on its first start. Leave it on while the screen says DON'T POWER OFF." ]
        ]
    ]


failure : Bool -> UnitNow -> Failure -> List (Html Msg)
failure windows u f =
    case f of
        Unsaved ->
            [ say "THE PROJECT HAS UNSAVED CHANGES. Save it (hold MENU) or load another, then press TRY AGAIN."
            , say "Nothing was written."
            , buttons [ btn "TRY AGAIN" TryAgain, btn "CLOSE" Close ]
            ]

        NothingFlashed why ->
            [ say (why ++ ".")
            , say ("Nothing was flashed: the unit still runs " ++ version u.build ++ ". Check the USB cable, then press TRY AGAIN.")
            , buttons [ btn "TRY AGAIN" TryAgain, btn "CLOSE" Close ]
            ]

        CantOpen _ ->
            say "THE BROWSER CAN'T OPEN THE UNIT'S UPDATE DEVICE. Nothing has been written, and the bootloader is never touched."
                :: (if windows then
                        driverSteps

                    else
                        [ say "Close any other program using it (dfu-util, STM32CubeProgrammer). On Linux, give your user access to it once:"
                        , p [ class "code" ] [ text "echo 'SUBSYSTEM==\"usb\", ATTRS{idVendor}==\"0483\", ATTRS{idProduct}==\"df11\", TAG+=\"uaccess\"' | sudo tee /etc/udev/rules.d/70-stm32-dfu.rules && sudo udevadm control --reload && sudo udevadm trigger" ]
                        , say "Then press WRITE AGAIN."
                        ]
                   )
                ++ [ buttons [ btn "WRITE AGAIN" WriteAgain, btn "CLOSE" Close ] ]
                ++ sdSteps
                ++ [ say "To leave update mode without updating: unplug the USB cable and plug it back in; the unit starts as before." ]

        Guarded why ->
            [ say ("THE UPDATE STOPPED BEFORE WRITING: " ++ why ++ ".")
            , say "Nothing was written. The unit is waiting in update mode: unplug the USB cable and plug it back in, and it starts as before."
            , buttons [ btn "CLOSE" Close ]
            ]

        WriteCut _ why ->
            [ say ("THE FIRMWARE WRITE WAS CUT OFF (" ++ why ++ ").")
            , say "The unit can't be bricked: its bootloader is never touched. Finish from the bootloader:"
            , ol []
                [ li [] [ text "Over USB: hold MENU while you power the unit on, press button 2 (DFU Mode), then press WRITE AGAIN here." ] ]
            , buttons [ btn "WRITE AGAIN" WriteAgain, btn "CLOSE" Close ]
            ]
                ++ sdSteps

        NotBack _ cause ->
            [ say ("THE FIRMWARE IS WRITTEN, BUT THE UNIT HASN'T ANSWERED (" ++ cause ++ "). What to do depends on its screen:")
            , ol []
                [ li [] [ text "DON'T POWER OFF: it is still installing. Leave it on; when the screen changes, press CHECK AGAIN." ]
                , li [] [ text "Its usual screen: press CHECK AGAIN. If it still doesn't answer, switch it off and on (only if the screen does NOT say DON'T POWER OFF), then CHECK AGAIN." ]
                , li [] [ text "Blank or dark: it is waiting in update mode. Unplug the USB cable, plug it back in, and press TRY AGAIN." ]
                ]
            , buttons [ btn "CHECK AGAIN" CheckAgain, btn "TRY AGAIN" TryAgain, btn "CLOSE" Close ]
            ]
                ++ sdSteps

        Unfinished why ->
            [ say ("THE FIRMWARE IS WRITTEN, BUT THE UPDATE ISN'T FINISHED: " ++ why ++ ".")
            , say "Press TRY AGAIN to run the whole update again."
            , buttons [ btn "TRY AGAIN" TryAgain, btn "CLOSE" Close ]
            ]
                ++ sdSteps
