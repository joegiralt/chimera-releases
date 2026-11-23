-- SPDX-License-Identifier: GPL-3.0-or-later


module Model exposing
    ( Effect(..)
    , Held
    , Kept
    , LearnReading
    , Listed
    , Listing
    , MapHeader
    , MapRowReading
    , Model
    , Msg(..)
    , Notice(..)
    , Reading
    , RouteReading
    , Seat
    , Stage
    , Via(..)
    , armedOn
    , init
    , lastRefusal
    , notice
    , noticeText
    , notices
    , noticesLost
    , pending
    , pendingRoute
    , refusal
    , seat
    , sensingRow
    , shown
    , status
    , step
    , subscriptions
    , takesEdits
    , update
    )

{-| Only the unit's state: what it last reported, and what it refused. The
editor never guesses a value: a control always shows the unit's stored
value, and an edit the unit would not take shows the unit's reason.

`step` is the pure core (messages in, effects out); `update` only runs them.

Nothing the unit says is dropped unseen. It answers each command line in the
order sent, so the commands still unanswered are held in that order
(`awaiting`) and an `ERR` is tied to the one it answers. Every `ERR`, every
set `since` says was refused, and every line the editor can't read, is kept
as a `Notice` until the user has seen it (`SeenNotices`): no later answer, success or link erases one.

The schemas are the unit's own text: on connect, and on an engine
the editor hasn't read, it asks `ed schema <S>` for its page count and hash,
and uses its cached copy of that hash (IndexedDB, `Cache`) or describes every
page and keeps them. A schema is the text its hash names: a cached copy whose
lines don't hash to the unit's is described again, and a described one that
doesn't, or that holds a line the editor can't read, halts and says so. It reads the followed engine's schema, the MIXER's, the
engine's matrix, SETTINGS', MIDI MAP's and ORBIT's.

-}

import Addr exposing (Addr)
import Cache
import Dict exposing (Dict)
import Flow exposing (Flow)
import Hash exposing (Hash)
import Protocol exposing (AnswerLine(..), Cell, Command(..), Degree, Edits, Fault(..), Generation, Health, Learn, Line(..), MapCommand(..), MapInput, MapKind, MapRow(..), Note, NotePool, OnOff, OrbitCommand, Outgoing, OverEdits, PageNo, ProjectFile, ProjectId, ProjectName, Protocol(..), RouteTo, RowStatus, ScaleMask, SchemaId(..), Slot, Song, SoundStatus, SpanPlace, Value, VariantName, cellKey, encode, parse, ringNoToInt, rowIndexToInt, sceneNoToInt, schemaToken, segmentToInt, stepNoToInt)
import Schema exposing (Schema)
import Time
import Transport exposing (Link(..))
import Unit exposing (Engine, Gen, Part)


{-| One value as the unit reported it: its text is the box's own.
-}
type alias Reading =
    { norm : Float, stored : Float, text : String }


{-| A route as the unit reported it: its amount and the box's text.
-}
type alias RouteReading =
    { amount : Int, text : String }


{-| A project file as `since`'s listing says it.
-}
type alias Listed =
    { id : ProjectId, name : String, health : Health, generation : Maybe Generation }


{-| The card's projects as last listed (`ed projects`), in id order, and
whether the card has more than the box lists.
-}
type alias Listing =
    { projects : List Listed, more : Bool }


{-| MIDI MAP's header: the followed Part, its controller map (none picked:
`Nothing`) and KEEP MAP.
-}
type alias MapHeader =
    { part : Part, name : Maybe String, keep : OnOff }


{-| A MIDI MAP row as `since` said it.
-}
type alias MapRowReading =
    { input : MapInput, kind : MapKind, addr : Maybe Addr, min : SpanPlace, max : SpanPlace, echo : OnOff, status : RowStatus }


{-| The box's MIDI learn and its focus-band words.
-}
type alias LearnReading =
    { learn : Learn, note : String }


{-| Where the connect sequence is. One request is in flight at a time.
A schema is checked (`ed schema`), recalled from the cache, or described page
by page; then the next one the editor lacks, then following.
-}
type Stage
    = Greeting
    | Checking SchemaId (Maybe Reply)
    | Recalling SchemaId Reply
    | Describing SchemaId Reply PageNo
    | Following
    | Halted Why


{-| What `ed schema` said of a schema.
-}
type alias Reply =
    { pages : Int, hash : Hash }


{-| A schema read this connection, and the hash it was read under.
-}
type alias Held =
    { hash : Hash, schema : Schema }


{-| What `step` asks of the world: a line to the unit, or the schema cache.
A line is only ever one `encode` wrote (`Outgoing`): a command it can't write
is a notice instead.
-}
type Effect
    = Send Outgoing
    | Recall String
    | Keep String (List String)


{-| What `stepIn` asks for, before `step` makes lines of its commands.
-}
type Wish
    = Say Command
    | Remember String
    | Store String (List String)


type Why
    = UpdateEditor
    | UpdateUnit
      -- The unit speaks a protocol newer or older than this editor's.
    | OtherProtocol Int
    | RefusedBy String
    | Silent
    | TooLarge
    | BadSchema SchemaId SchemaFault
    | Faulted Fault


{-| Why a schema's text can't be used: a line of it the editor can't read,
or text that is not what the unit's hash names (what it said, what was read).
-}
type SchemaFault
    = Unreadable String
    | WrongHash Hash Hash


{-| Something the unit said that the editor could not act on: a refusal, with
the command it answers where one was waiting, or a line it can't read, as
the unit wrote it.
-}
type Notice
    = Refusal { sent : Maybe Command, why : String }
    | Unread String
      -- A command the editor could not write as a line the unit reads.
    | Unsendable Command
      -- A line the browser could not write to the link.
    | Unsent String
      -- A set the unit never answered, though sent twice: given up.
    | NoAnswer Command


{-| A notice kept for the user, and how many times the unit said it.
-}
type alias Kept =
    { notice : Notice, times : Int }


{-| Which Part the box was following when a hand took hold: a new `part`
line is a new seat, and a hand from the old one lets go.
-}
type Seat
    = Seat Int


type alias Model =
    { link : Maybe Link
    , via : Maybe Via
    , schema : Schema
    , mixer : Schema
    , matrix : Schema
    , settings : Schema
    , midiMap : Schema
    , orbit : Schema
    , routes : Dict String RouteReading
    , held : Dict String Held
    , incoming : Schema

    -- The schema being described, as the unit wrote it (last first), for the cache.
    , incomingLines : List String
    , values : Dict String Reading
    , refusals : Dict String String
    , whole : Bool
    , part : Maybe Part
    , engine : Maybe Engine
    , described : Maybe Engine
    , seat : Seat
    , variants : Dict String VariantName
    , source : Maybe String
    , gen : Maybe Gen
    , stage : Stage
    , asked : Maybe Time.Posix
    , owed : Int
    , leftover : Bool
    , now : Time.Posix

    -- The commands sent while following that the unit has not answered,
    -- oldest first: it answers in the order sent.
    , awaiting : List Command

    -- The edits' window: the one set on the wire, and the wants waiting.
    , flow : Flow

    -- What the unit refused or the editor couldn't read, newest first, each
    -- distinct one once; and how many fell off the end unseen.
    , kept : List Kept
    , lost : Int

    -- SETTINGS' section: the loaded project, each Part's Sound (by its
    -- number), the box's last toast, the listing.
    , project : Maybe { name : String, file : ProjectFile, edits : Edits, generation : Maybe Generation }
    , sounds : Dict Int { name : String, status : SoundStatus }
    , toast : Maybe String
    , listing : Maybe Listing

    -- MAP's section: its header, the Sound's rows and the controller map's
    -- (by their 1-based number), learn, the card's maps as last listed.
    , mapHeader : Maybe MapHeader
    , soundRows : Dict Int MapRowReading
    , mapRows : Dict Int MapRowReading
    , learn : Maybe LearnReading
    , mapFiles : List String

    -- ORBIT's section: the song, each scene slot, each segment's chord (by
    -- their 1-based numbers), CUSTOM's scale, each ring's steps (by ring and
    -- step) and pools (by ring).
    , song : Maybe Song
    , slots : Dict Int Slot
    , chords : Dict Int Degree
    , scale : Maybe ScaleMask
    , steps : Dict ( Int, Int ) Note
    , pools : Dict Int NotePool
    }


{-| What the user chose to connect to.
-}
type Via
    = ViaUnit
    | ViaSimulator


type Msg
    = LinkChanged Link
    | Line String
    | Tick Time.Posix
    | Edit Addr Value
    | Pick Addr Protocol.OptIndex
    | FollowPart Part
    | Connect Via
    | Recalled { key : String, lines : Maybe (List String) }
      -- The cache answered something that is no answer: a miss.
    | RecallGarbled
      -- The browser could not write this line to the link.
    | WriteFailed String
    | EditRoute Cell RouteTo
      -- The card's projects listed again.
    | AskProjects
      -- Save over the loaded project's own file.
    | SaveOwn
      -- Save into a new id.
    | SaveNew ProjectName
      -- Load a listed file, witnessed by the generation the listing said.
    | LoadListed ProjectId Generation OverEdits
      -- A MIDI MAP or learn command.
    | MapAct MapCommand
      -- An ORBIT transport, scene, chord, scale, step or pool command.
    | OrbitAct OrbitCommand
      -- The user has seen the notices: they go.
    | SeenNotices


{-| A schema's cache key: the protocol, the schema and its hash.
-}
cacheKey : SchemaId -> Hash -> String
cacheKey s h =
    String.join "/" [ String.fromInt Protocol.supported, schemaToken s, Hash.toHex h ]


{-| A request unanswered this long has timed out. While connecting, that
halts: a late `OK` could not be told from the next request's, so it would
skip a step. Following never halts. A `since` is asked once more with the last
number we did get, and no further until every answer owed (`owed`) has come;
the unit answers in order, so a late `OK` is only counted, and its `val` lines
are true, as the number only moves forward. An `OK` that leaves answers owed
restarts the clock (`leftover`): if the rest never come, the next timeout
counts them lost and asks afresh, as does a re-ask that is lost too. The unit
heals a lost answer on the next ask.

A recall from the cache gets the same clock: a store that never answers is
a miss, and the schema is described. So does the edits' window (`Flow`).

-}
answerTimeoutMs : Int
answerTimeoutMs =
    1000


pollMs : Float
pollMs =
    33


init : Model
init =
    { link = Nothing
    , via = Nothing
    , schema = Schema.empty
    , mixer = Schema.empty
    , matrix = Schema.empty
    , settings = Schema.empty
    , midiMap = Schema.empty
    , orbit = Schema.empty
    , routes = Dict.empty
    , held = Dict.empty
    , incoming = Schema.empty
    , incomingLines = []
    , values = Dict.empty
    , refusals = Dict.empty
    , whole = False
    , part = Nothing
    , engine = Nothing
    , described = Nothing
    , seat = Seat 0
    , variants = Dict.empty
    , source = Nothing
    , gen = Nothing
    , stage = Greeting
    , asked = Nothing
    , owed = 0
    , leftover = False
    , now = Time.millisToPosix 0
    , awaiting = []
    , flow = Flow.idle
    , kept = []
    , lost = 0
    , project = Nothing
    , sounds = Dict.empty
    , toast = Nothing
    , listing = Nothing
    , mapHeader = Nothing
    , soundRows = Dict.empty
    , mapRows = Dict.empty
    , learn = Nothing
    , mapFiles = []
    , song = Nothing
    , slots = Dict.empty
    , chords = Dict.empty
    , scale = Nothing
    , steps = Dict.empty
    , pools = Dict.empty
    }


subscriptions : Sub Msg
subscriptions =
    Sub.batch
        [ Transport.lineIn Line
        , Transport.linkState (Transport.parseLink >> LinkChanged)
        , Cache.got (Cache.decode >> Maybe.map Recalled >> Maybe.withDefault RecallGarbled)
        , Transport.writeFailed WriteFailed
        , Time.every pollMs Tick
        ]


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    let
        ( m, effects ) =
            step msg model
    in
    ( m, Cmd.batch (opening msg :: List.map run effects) )


{-| The one thing besides effects a message asks of the world: a link.
-}
opening : Msg -> Cmd msg
opening msg =
    case msg of
        Connect ViaUnit ->
            Transport.connectSerial ()

        Connect ViaSimulator ->
            Transport.connectSocket "ws://127.0.0.1:7342"

        LinkChanged _ ->
            Cmd.none

        Line _ ->
            Cmd.none

        Tick _ ->
            Cmd.none

        Edit _ _ ->
            Cmd.none

        Pick _ _ ->
            Cmd.none

        FollowPart _ ->
            Cmd.none

        Recalled _ ->
            Cmd.none

        RecallGarbled ->
            Cmd.none

        WriteFailed _ ->
            Cmd.none

        EditRoute _ _ ->
            Cmd.none

        AskProjects ->
            Cmd.none

        SaveOwn ->
            Cmd.none

        SaveNew _ ->
            Cmd.none

        LoadListed _ _ _ ->
            Cmd.none

        MapAct _ ->
            Cmd.none

        OrbitAct _ ->
            Cmd.none

        SeenNotices ->
            Cmd.none


run : Effect -> Cmd msg
run e =
    case e of
        Send o ->
            Transport.send (Protocol.outgoingLine o)

        Recall key ->
            Cache.recall key

        Keep key lines ->
            Cache.keep { key = key, lines = lines }


{-| Once connected and following: the link and the Part and engine it follows.
-}
status : Model -> Maybe String
status m =
    if m.link == Just Open && m.stage == Following then
        Maybe.map2
            (\p e ->
                String.join " · "
                    [ if m.via == Just ViaSimulator then
                        "SIMULATOR"

                      else
                        "UNIT"
                    , "PART " ++ String.fromInt (Unit.partNumber p)
                    , Unit.engineName e
                    ]
            )
            m.part
            m.engine

    else
        Nothing


{-| What to tell the user instead of the editor, if anything.
-}
notice : Model -> Maybe String
notice m =
    case m.link of
        Just l ->
            if l /= Open then
                Transport.linkText l

            else
                stageNotice m

        Nothing ->
            Nothing


stageNotice : Model -> Maybe String
stageNotice m =
    case m.stage of
        Halted UpdateEditor ->
            Just "UPDATE THE EDITOR"

        Halted UpdateUnit ->
            Just "UPDATE THE UNIT"

        Halted (OtherProtocol n) ->
            Just
                ((if n > Protocol.supported then
                    "UPDATE THE EDITOR"

                  else
                    "UPDATE THE UNIT"
                 )
                    ++ ": THE UNIT SPEAKS PROTOCOL "
                    ++ String.fromInt n
                    ++ ", THIS EDITOR "
                    ++ String.fromInt Protocol.supported
                )

        Halted (RefusedBy t) ->
            Just ("THE UNIT REFUSED: " ++ t)

        Halted Silent ->
            Just "THE UNIT STOPPED ANSWERING"

        Halted TooLarge ->
            Just "THE UNIT'S ANSWER IS TOO LARGE FOR ONE READ"

        Halted (BadSchema s (Unreadable l)) ->
            Just ("THE UNIT'S " ++ schemaToken s ++ " SCHEMA HAS A LINE THIS EDITOR CAN'T READ: " ++ l)

        Halted (BadSchema s (WrongHash said read_)) ->
            Just ("THE UNIT'S " ++ schemaToken s ++ " SCHEMA IS NOT THE TEXT ITS HASH NAMES: " ++ Hash.toHex said ++ ", READ " ++ Hash.toHex read_)

        Halted (Faulted (NoSuchPart n)) ->
            Just ("THE UNIT NAMED PART " ++ n ++ ": THIS EDITOR KNOWS PARTS 1 TO 6")

        Halted (Faulted (NoSuchEngine e)) ->
            Just ("THE UNIT NAMED AN ENGINE THIS EDITOR DOESN'T KNOW: " ++ e ++ ". UPDATE THE EDITOR")

        Greeting ->
            Nothing

        Checking _ _ ->
            Nothing

        Recalling _ _ ->
            Nothing

        Describing _ _ _ ->
            Nothing

        Following ->
            Nothing


shown : Addr -> Model -> Maybe Reading
shown a m =
    Dict.get (Addr.key a) m.values


{-| The unit's reason for refusing the last edit of `a`, until it next
reports a value for it.
-}
refusal : Addr -> Model -> Maybe String
refusal a m =
    Dict.get (Addr.key a) m.refusals


{-| What the unit refused or the editor couldn't read and the user has not
yet seen, newest first.
-}
notices : Model -> List Kept
notices m =
    m.kept


{-| Where the editor last asked `a` to go that the unit has not yet said:
a want waiting for the window, else the set on the wire.
-}
pending : Addr -> Model -> Maybe Value
pending a m =
    case Flow.target (Flow.SetTo a (Protocol.Num 0)) m.flow of
        Just (Flow.SetTo _ v) ->
            Just v

        Just (Flow.RouteOf _ _) ->
            Nothing

        Nothing ->
            Nothing


{-| Where the editor last asked matrix cell `c` to go that the unit has not
yet said: a route waiting for the window, else the one on the wire.
-}
pendingRoute : Cell -> Model -> Maybe RouteTo
pendingRoute c m =
    case Flow.target (Flow.RouteOf c Protocol.RouteOff) m.flow of
        Just (Flow.RouteOf _ to) ->
            Just to

        Just (Flow.SetTo _ _) ->
            Nothing

        Nothing ->
            Nothing


{-| How many notices fell off the end of `notices` unseen.
-}
noticesLost : Model -> Int
noticesLost m =
    m.lost


{-| The newest refusal the user has not seen: the command it answers, where
one was waiting, and the unit's words.
-}
lastRefusal : Model -> Maybe { sent : Maybe Command, why : String }
lastRefusal m =
    m.kept
        |> List.filterMap
            (\k ->
                case k.notice of
                    Refusal r ->
                        Just r

                    Unread _ ->
                        Nothing

                    Unsendable _ ->
                        Nothing

                    Unsent _ ->
                        Nothing

                    NoAnswer _ ->
                        Nothing
            )
        |> List.head


{-| A notice as the UI says it: the line sent, where known, and the unit's
own words.
-}
noticeText : Notice -> String
noticeText n =
    case n of
        Refusal r ->
            case r.sent |> Maybe.andThen encode of
                Just sent ->
                    "THE UNIT REFUSED " ++ sent ++ ": " ++ r.why

                Nothing ->
                    "THE UNIT REFUSED: " ++ r.why

        Unread raw ->
            "THE UNIT SAID A LINE THIS EDITOR CAN'T READ: " ++ raw

        Unsendable c ->
            "THE EDITOR COULD NOT WRITE " ++ Protocol.sketch c ++ " AS A LINE THE UNIT READS: NOT SENT"

        Unsent l ->
            "THE LINK DROPPED A LINE: " ++ l

        NoAnswer c ->
            "THE UNIT DID NOT ANSWER " ++ Protocol.sketch c ++ ", SENT TWICE: GIVEN UP"


{-| At most this many distinct notices are kept; past it one falls off and
is counted (`noticesLost`): the oldest line the editor couldn't read, and
only with none of those the oldest refusal.
-}
noticesKept : Int
noticesKept =
    16


{-| A notice kept: one the user has not seen yet is counted once more and
comes first; else it is new, and past `noticesKept` one is lost.
-}
keep : Notice -> Model -> Model
keep n m =
    let
        times : Int
        times =
            m.kept |> List.filter (\k -> k.notice == n) |> List.map .times |> List.sum

        all : List Kept
        all =
            { notice = n, times = times + 1 } :: List.filter (\k -> k.notice /= n) m.kept
    in
    if List.length all > noticesKept then
        { m | kept = evict all, lost = m.lost + 1 }

    else
        { m | kept = all }


{-| A full list less one, newest first: its oldest notice that is not a
refusal, or with none its oldest refusal. A refusal answers something the
user did.
-}
evict : List Kept -> List Kept
evict all =
    let
        isUnread : Kept -> Bool
        isUnread k =
            case k.notice of
                Unread _ ->
                    True

                Unsendable _ ->
                    True

                Unsent _ ->
                    True

                NoAnswer _ ->
                    True

                Refusal _ ->
                    False

        -- Oldest first: the first unread line met is the one to go.
        less : List Kept -> List Kept
        less ks =
            case ks of
                k :: rest ->
                    if isUnread k then
                        rest

                    else
                        k :: less rest

                [] ->
                    []
    in
    if List.any isUnread all then
        List.reverse (less (List.reverse all))

    else
        List.take (List.length all - 1) all


{-| A set's refusal as a notice: with the set it answers where one waits,
else naming its address, so it is still said off its control's page.
-}
setRefused : Maybe Command -> Addr -> String -> Model -> Model
setRefused sent a why m =
    case sent of
        Just _ ->
            keep (Refusal { sent = sent, why = why }) m

        Nothing ->
            if String.contains (Addr.key a) why then
                keep (Refusal { sent = Nothing, why = why }) m

            else
                keep (Refusal { sent = Nothing, why = Addr.key a ++ ": " ++ why }) m


{-| The cell the box's MIDI learn is armed on, when the box can name it.
-}
armedOn : Model -> Maybe Addr
armedOn m =
    case m.learn |> Maybe.map .learn of
        Just (Protocol.Armed a) ->
            a

        Just Protocol.NotLearning ->
            Nothing

        Just (Protocol.Sensing _) ->
            Nothing

        Just Protocol.Pointing ->
            Nothing

        Nothing ->
            Nothing


{-| The Sound row (1-based) learn is hearing a control onto.
-}
sensingRow : Model -> Maybe Int
sensingRow m =
    case m.learn |> Maybe.map .learn of
        Just (Protocol.Sensing i) ->
            Just (rowIndexToInt i)

        Just Protocol.NotLearning ->
            Nothing

        Just (Protocol.Armed _) ->
            Nothing

        Just Protocol.Pointing ->
            Nothing

        Nothing ->
            Nothing


seat : Model -> Seat
seat m =
    m.seat


{-| Edits go out only while following, and only against the schema of the
engine the box is on: during an engine change a shared address (FILTER.CUTOFF)
would mean the old engine's parameter.
-}
takesEdits : Model -> Bool
takesEdits m =
    m.stage == Following && m.engine /= Nothing && m.engine == m.described


step : Msg -> Model -> ( Model, List Effect )
step msg m =
    let
        ( m1, wishes ) =
            stepIn msg m

        ( m2, effects ) =
            effectsOf wishes m1
    in
    released (sending m m2 effects)


{-| Each wish as an effect: a command as its line, or, where `encode` can't
write one, a notice saying so; nothing is dropped unsaid.
-}
effectsOf : List Wish -> Model -> ( Model, List Effect )
effectsOf wishes m =
    List.foldl
        (\w ( acc, es ) ->
            case w of
                Say c ->
                    case Protocol.outgoing c of
                        Just o ->
                            ( acc, es ++ [ Send o ] )

                        Nothing ->
                            ( keep (Unsendable c) acc, es )

                Remember k ->
                    ( acc, es ++ [ Recall k ] )

                Store k ls ->
                    ( acc, es ++ [ Keep k ls ] )
        )
        ( m, [] )
        wishes


{-| While following (as `before` was), the commands sent await their answers.
-}
sending : Model -> Model -> List Effect -> ( Model, List Effect )
sending before m effects =
    if before.stage == Following then
        ( { m | awaiting = m.awaiting ++ List.filterMap sentBy effects }, effects )

    else
        ( m, effects )


{-| The window, after a step: its set no longer awaits an answer (answered,
or counted lost), so the next waiting one goes. Off following, nothing
waits: an edit is only ever for the engine the box is on.
-}
released : ( Model, List Effect ) -> ( Model, List Effect )
released ( m, effects ) =
    if m.stage /= Following then
        ( { m | flow = Flow.idle }, effects )

    else
        case Flow.inFlight m.flow of
            Just c ->
                if List.member c m.awaiting then
                    ( m, effects )

                else
                    let
                        ( flow, next ) =
                            Flow.acked m.now m.flow

                        ( m1, more ) =
                            effectsOf (List.map Say (maybeList next)) { m | flow = flow }
                    in
                    sending m1 m1 more |> Tuple.mapSecond ((++) effects)

            Nothing ->
                ( m, effects )


{-| The command an effect puts on the wire, if it does.
-}
sentBy : Effect -> Maybe Command
sentBy e =
    case e of
        Send o ->
            Just (Protocol.outgoingCommand o)

        Recall _ ->
            Nothing

        Keep _ _ ->
            Nothing


stepIn : Msg -> Model -> ( Model, List Wish )
stepIn msg m =
    case msg of
        LinkChanged l ->
            -- Any link change starts over: nothing of the last link is shown
            -- but the notices the user has not seen.
            ( { init | link = Just l, via = m.via, now = m.now, seat = nextSeat m.seat, kept = m.kept, lost = m.lost }, [] )

        SeenNotices ->
            ( { m | kept = [], lost = 0 }, [] )

        Tick t ->
            tick t m |> Tuple.mapSecond (List.map Say)

        Line raw ->
            line raw (parse raw) m

        Edit a v ->
            edit a v m |> Tuple.mapSecond (List.map Say)

        -- By its number: a name with a space (GATE EXT) is one word so.
        Pick a i ->
            case Schema.optionName m.variants a i (schemaOf a m) of
                Just _ ->
                    edit a (Protocol.Index i) m |> Tuple.mapSecond (List.map Say)

                Nothing ->
                    ( m, [] )

        -- The box moves; the mark follows when `since` says so.
        FollowPart p ->
            if m.stage == Following then
                ( m, [ Say (Follow p) ] )

            else
                ( m, [] )

        -- Opening the link is `update`'s (it asks the shim).
        Connect v ->
            ( { m | via = Just v }, [] )

        Recalled r ->
            ( recalled r m, [] )

        RecallGarbled ->
            ( recallMissed m, [] )

        WriteFailed l ->
            ( keep (Unsent l) m, [] )

        -- A route's amount or its removal, through the edits' window: the
        -- unit glides it a turn's step a pass, and `since` says where it is.
        EditRoute c to ->
            if takesEdits m then
                Flow.want m.now (Flow.RouteOf c to) m.flow |> Tuple.mapBoth (\flow -> { m | flow = flow }) (maybeList >> List.map Say)

            else
                ( m, [] )

        -- The project commands: the box's own card work, under BUSY; what
        -- happened comes back through `since` (`project`, `projects`, `toast`).
        AskProjects ->
            projectCommand ListProjects m

        SaveOwn ->
            projectCommand SaveProject m

        SaveNew n ->
            projectCommand (SaveProjectAs n) m

        LoadListed id g over ->
            projectCommand (LoadProject id g over) m

        MapAct c ->
            mapCommand c m

        -- ORBIT's commands read no engine's schema; `since` says what came of them.
        OrbitAct c ->
            projectCommand (OrbitCmd c) m


{-| A MIDI MAP command goes out while following; one naming a cell only
against the engine the box is on, as an edit does.
-}
mapCommand : MapCommand -> Model -> ( Model, List Wish )
mapCommand c m =
    let
        names : Bool
        names =
            case c of
                AddRow _ _ _ ->
                    True

                LearnAt _ ->
                    True

                SetRow _ _ ->
                    False

                RemoveRow _ _ _ ->
                    False

                PickMap _ ->
                    False

                KeepMap _ ->
                    False

                SaveMap _ ->
                    False

                RenameMap _ ->
                    False

                ListMaps ->
                    False

                StopLearning ->
                    False
    in
    if names && not (takesEdits m) then
        ( m, [] )

    else
        projectCommand (MapCmd c) m


{-| A project command goes out while following: it reads no engine's schema.
-}
projectCommand : Command -> Model -> ( Model, List Wish )
projectCommand c m =
    if m.stage == Following then
        ( m, [ Say c ] )

    else
        ( m, [] )


nextSeat : Seat -> Seat
nextSeat (Seat n) =
    Seat (n + 1)


{-| The schema that describes `a`: the followed engine's, else the mixer's,
else ORBIT's, else SETTINGS'.
-}
schemaOf : Addr -> Model -> Schema
schemaOf a m =
    case ( Schema.param a m.schema, Schema.param a m.mixer, isOrbit a m ) of
        ( Just _, _, _ ) ->
            m.schema

        ( Nothing, Just _, _ ) ->
            m.mixer

        ( Nothing, Nothing, True ) ->
            m.orbit

        ( Nothing, Nothing, False ) ->
            m.settings


{-| Some schema the editor holds describes `a`.
-}
isDescribed : Addr -> Model -> Bool
isDescribed a m =
    Schema.param a m.schema /= Nothing || isMixer a m || isSettings a m || isOrbit a m


isOrbit : Addr -> Model -> Bool
isOrbit a m =
    Schema.param a m.orbit /= Nothing


isSettings : Addr -> Model -> Bool
isSettings a m =
    Schema.param a m.settings /= Nothing


isMixer : Addr -> Model -> Bool
isMixer a m =
    Schema.param a m.mixer /= Nothing


tick : Time.Posix -> Model -> ( Model, List Command )
tick t m0 =
    let
        m : Model
        m =
            { m0 | now = t }

        ask : Command -> ( Model, List Command )
        ask c =
            ( { m | asked = Just t, owed = m.owed + 1, leftover = False }, [ c ] )
    in
    if m.link /= Just Open then
        ( m, [] )

    else
        let
            timedOut : Bool
            timedOut =
                m.asked |> Maybe.map (\at -> ms t - ms at >= answerTimeoutMs) |> Maybe.withDefault False

            silent : ( Model, List Command )
            silent =
                ( { m | stage = Halted Silent, asked = Nothing }, [] )
        in
        case m.stage of
            Halted _ ->
                ( m, [] )

            Following ->
                let
                    ( mf, window ) =
                        expire m

                    again : ( Model, List Command )
                    again =
                        ( { mf | asked = Just t, owed = mf.owed + 1, leftover = False }, window ++ [ Since mf.gen ] )
                in
                if mf.owed == 0 then
                    again

                else if timedOut && mf.owed == 1 && not mf.leftover then
                    again

                else if timedOut then
                    -- Answers still owed after a re-ask: count them lost and ask afresh.
                    Tuple.mapFirst (\fresh -> { fresh | owed = 1, awaiting = [] }) again

                else
                    ( mf, window )

            Greeting ->
                connecting timedOut silent (ask Hello) m

            Checking s _ ->
                connecting timedOut silent (ask (AskSchema s)) m

            -- A store that never answers is a miss.
            Recalling _ _ ->
                if timedOut then
                    ( recallMissed m, [] )

                else
                    ( m, [] )

            Describing s _ n ->
                connecting timedOut silent (ask (Describe s n)) m


{-| The window's clock: a set unanswered past the timeout is no longer
awaited, and is sent again once, or given up (and said) for the next.
-}
expire : Model -> ( Model, List Command )
expire m =
    let
        ( flow, ex ) =
            Flow.expire m.now answerTimeoutMs m.flow

        dropped : Command -> Model
        dropped c =
            { m | flow = flow, awaiting = removeFirst c m.awaiting }
    in
    case ex of
        Flow.Fresh ->
            ( m, [] )

        Flow.Resent old new ->
            ( dropped old, [ new ] )

        Flow.GaveUp old next ->
            ( keep (NoAnswer old) (dropped old), maybeList next )


removeFirst : a -> List a -> List a
removeFirst x xs =
    case xs of
        y :: rest ->
            if y == x then
                rest

            else
                y :: removeFirst x rest

        [] ->
            []


connecting : Bool -> ( Model, List Command ) -> ( Model, List Command ) -> Model -> ( Model, List Command )
connecting timedOut silent go m =
    if timedOut then
        silent

    else if m.asked == Nothing then
        go

    else
        ( m, [] )


ms : Time.Posix -> Int
ms =
    Time.posixToMillis


{-| An edit goes through the window (`Flow`): sent now if no set is on the
wire, else held, the latest of each address winning. One `encode` can't
write is said, never sent.
-}
edit : Addr -> Value -> Model -> ( Model, List Command )
edit a v m =
    if takesEdits m && isDescribed a m then
        case Protocol.outgoing (Set a v) of
            Just _ ->
                Flow.want m.now (Flow.SetTo a v) m.flow |> Tuple.mapBoth (\flow -> { m | flow = flow }) maybeList

            Nothing ->
                ( keep (Unsendable (Set a v)) m, [] )

    else
        ( m, [] )


line : String -> Line -> Model -> ( Model, List Wish )
line raw l m =
    case m.stage of
        -- Nothing more is read, but nothing said is dropped.
        Halted _ ->
            case l of
                Err_ why ->
                    ( keep (Refusal { sent = Nothing, why = why }) m, [] )

                Unknown ->
                    ( unread raw m, [] )

                Answer _ ->
                    ( m, [] )

                Ok_ _ ->
                    ( m, [] )

                OkMore _ ->
                    ( m, [] )

                Queued ->
                    ( m, [] )

                SetRefused a why ->
                    ( setRefused Nothing a why m, [] )

                SinceTooLarge ->
                    ( m, [] )

        Greeting ->
            lineIn raw l m

        Checking _ _ ->
            lineIn raw l m

        Recalling _ _ ->
            lineIn raw l m

        Describing s _ _ ->
            case l of
                -- Describe's own text, whatever it is: the hash reads it all.
                Answer _ ->
                    lineIn raw l { m | incomingLines = raw :: m.incomingLines }

                Unknown ->
                    if String.trim raw == "" then
                        ( m, [] )

                    else
                        ( { m | stage = Halted (BadSchema s (Unreadable raw)), asked = Nothing }, [] )

                Ok_ _ ->
                    lineIn raw l m

                OkMore _ ->
                    lineIn raw l m

                Queued ->
                    lineIn raw l m

                Err_ _ ->
                    lineIn raw l m

                SetRefused _ _ ->
                    lineIn raw l m

                SinceTooLarge ->
                    lineIn raw l m

        Following ->
            lineIn raw l m


{-| A line the editor can't read, kept as the unit wrote it. A blank line
says nothing: it is no line.
-}
unread : String -> Model -> Model
unread raw m =
    if String.trim raw == "" then
        m

    else
        keep (Unread raw) m


{-| What kind of answer a command gets, as far as its last line tells: a
`since`'s `OK` carries its number, a set's refusal its address (the set of
that address it answers).
-}
type Asked
    = AskedSince
    | AskedSet Addr
    | AskedOther


askedBy : Command -> Asked
askedBy c =
    case c of
        Since _ ->
            AskedSince

        Set a _ ->
            AskedSet a

        Hello ->
            AskedOther

        AskSchema _ ->
            AskedOther

        Describe _ _ ->
            AskedOther

        Get _ ->
            AskedOther

        Follow _ ->
            AskedOther

        SetRoute _ _ ->
            AskedOther

        ListProjects ->
            AskedOther

        SaveProject ->
            AskedOther

        SaveProjectAs _ ->
            AskedOther

        LoadProject _ _ _ ->
            AskedOther

        MapCmd _ ->
            AskedOther

        OrbitCmd _ ->
            AskedOther


{-| An answer's last line came, and it can only be the answer to a command
`fits`: the oldest such one is answered, and any sent before it have lost
their answers (the unit answers in order). With none waiting, nothing moves.
-}
answered : (Asked -> Bool) -> Model -> Model
answered fits m =
    let
        after : List Command -> List Command
        after cs =
            case cs of
                c :: rest ->
                    if fits (askedBy c) then
                        rest

                    else
                        after rest

                [] ->
                    m.awaiting
    in
    { m | awaiting = after m.awaiting }


lineIn : String -> Line -> Model -> ( Model, List Wish )
lineIn raw l m =
    case l of
        Answer a ->
            ( answer a m, [] )

        Ok_ (Just g) ->
            ok (Just g) False (answered (\k -> k == AskedSince) m)

        -- `OK` alone is never a `since`'s: a set's, or another command's.
        Ok_ Nothing ->
            ok Nothing False (answered (\k -> k /= AskedSince) m)

        OkMore g ->
            ok (Just g) True (answered (\k -> k == AskedSince) m)

        Err_ why ->
            case m.stage of
                Following ->
                    -- A refused `since` stays owed; the timeout re-asks, then settles it as lost.
                    ( refusedCommand why m, [] )

                Greeting ->
                    if String.startsWith "unknown command" why then
                        ( { m | stage = Halted UpdateUnit, asked = Nothing }, [] )

                    else
                        ( refused why m, [] )

                Checking _ _ ->
                    ( refused why m, [] )

                Recalling _ _ ->
                    ( refused why m, [] )

                Describing _ _ _ ->
                    ( refused why m, [] )

                Halted _ ->
                    ( m, [] )

        SetRefused a why ->
            let
                sent : Maybe Command
                sent =
                    m.awaiting |> List.filter (\c -> askedBy c == AskedSet a) |> List.head
            in
            ( answered (\k -> k == AskedSet a) { m | refusals = Dict.insert (Addr.key a) why m.refusals }
                |> setRefused sent a why
            , []
            )

        Queued ->
            ( answered (\k -> k /= AskedSince) m, [] )

        -- Asking again gets the same: stop, and say so.
        SinceTooLarge ->
            ( { m | stage = Halted TooLarge, asked = Nothing }, [] )

        Unknown ->
            ( unread raw m, [] )


{-| An `ERR` while following: the answer to the oldest command still
waiting, whatever it is. Kept with it; a set's is shown at its control too.
-}
refusedCommand : String -> Model -> Model
refusedCommand why m =
    let
        rest : Model
        rest =
            keep (Refusal { sent = List.head m.awaiting, why = why }) { m | awaiting = List.drop 1 m.awaiting }
    in
    case List.head m.awaiting |> Maybe.map askedBy of
        Just (AskedSet a) ->
            { rest | refusals = Dict.insert (Addr.key a) why rest.refusals }

        Just AskedSince ->
            rest

        Just AskedOther ->
            rest

        Nothing ->
            rest


refused : String -> Model -> Model
refused why m =
    { m | stage = Halted (RefusedBy why), asked = Nothing }


answer : AnswerLine -> Model -> Model
answer a m =
    case a of
        HelloIs (Speaks h) ->
            { m | part = Just h.part, engine = Just h.engine }

        HelloIs (TooNew n) ->
            { m | stage = Halted (OtherProtocol n) }

        HelloIs (TooOld n) ->
            { m | stage = Halted (OtherProtocol n) }

        -- An engine it doesn't know is a newer unit's; a Part past six, a
        -- unit not speaking as it says: either way, stop and say so.
        Faulty (NoSuchEngine _) ->
            { m | stage = Halted UpdateEditor, asked = Nothing }

        Faulty f ->
            { m | stage = Halted (Faulted f), asked = Nothing }

        SchemaIs r ->
            case m.stage of
                Checking s Nothing ->
                    if r.schema == s then
                        { m | stage = Checking s (Just { pages = r.pages, hash = r.hash }) }

                    else
                        m

                Checking _ (Just _) ->
                    m

                Greeting ->
                    m

                Recalling _ _ ->
                    m

                Describing _ _ _ ->
                    m

                Following ->
                    m

                Halted _ ->
                    m

        PartIs p e ->
            -- A new Part or engine: PART's section is whole; MIXER's stays.
            -- An engine read this connection is shown at once.
            adopt <|
                mixerOnly
                    { m
                        | part = Just p
                        , engine = Just e
                        , seat = nextSeat m.seat
                        , routes = Dict.empty
                        , refusals = Dict.empty
                        , whole = True
                        , source = Nothing
                    }

        MixerIs ->
            -- MIXER's section whole: what was held for it goes.
            { m
                | values = Dict.filter (\k _ -> not (isMixerKey k m)) m.values
                , variants = Dict.filter (\k _ -> not (Schema.hasPanel k m.mixer)) m.variants
            }

        Panel p ->
            if m.stage == Following then
                case p.variant of
                    Just v ->
                        { m | variants = Dict.insert p.name v m.variants }

                    Nothing ->
                        { m | variants = Dict.remove p.name m.variants }

            else
                describing a m

        Val v ->
            if not (isDescribed v.addr m) then
                -- The unit says nothing of it in `describe`: not the editor's.
                m

            else
                { m
                    | values = Dict.insert (Addr.key v.addr) { norm = v.norm, stored = v.stored, text = v.text } m.values
                    , refusals = Dict.remove (Addr.key v.addr) m.refusals
                }

        -- The followed Part's, in a diff: a whole answer (a new Part, or
        -- `since 0`) starts afresh, and an address the schema lacks is
        -- another engine's.
        Refused at why ->
            if m.whole || Schema.param at m.schema == Nothing then
                m

            else
                setRefused Nothing at why { m | refusals = Dict.insert (Addr.key at) why m.refusals }

        Source text ->
            if m.stage == Following then
                { m | source = Just text }

            else
                describing a m

        Page _ ->
            describing a m

        Param _ ->
            describing a m

        Opt _ ->
            describing a m

        Route _ ->
            describing a m

        Src _ ->
            describing a m

        Col _ ->
            describing a m

        AmountRange _ _ ->
            describing a m

        Dests _ ->
            describing a m

        RoutesIs ->
            { m | routes = Dict.empty }

        RouteIs r ->
            { m | routes = Dict.insert (cellKey r.cell) { amount = r.amount, text = r.text } m.routes }

        Unroute c ->
            { m | routes = Dict.remove (cellKey c) m.routes }

        Crumb _ ->
            describing a m

        -- SETTINGS' section whole: its state goes. Its values are THEME's,
        -- MIDI CONFIG's and RANDOMIZE's, a fixed set the whole answer
        -- repeats; a Part's SETTINGS cells are the mixer's section's.
        SettingsIs ->
            { m | project = Nothing, sounds = Dict.empty, toast = Nothing, listing = Nothing }

        ProjectIs p ->
            { m | project = Just p }

        SoundIs snd ->
            { m | sounds = Dict.insert (Unit.partNumber snd.part) { name = snd.name, status = snd.status } m.sounds }

        ToastIs t ->
            { m | toast = Just t }

        -- The listing whole: what was listed before is gone.
        ProjectsIs r ->
            { m | listing = Just { projects = [], more = r.more } }

        Proj pr ->
            { m | listing = m.listing |> Maybe.map (\l -> { l | projects = l.projects ++ [ pr ] }) }

        InputIs _ ->
            describing a m

        KindIs _ ->
            describing a m

        CcsAre _ ->
            describing a m

        MsbsAre _ ->
            describing a m

        SpanIs _ _ ->
            describing a m

        RowsAre _ ->
            describing a m

        MapRowsAre _ ->
            describing a m

        -- MAP's section whole: it repeats its rows, learn and the listing,
        -- so what was held for it goes.
        MapIs h ->
            { m | mapHeader = Just h, soundRows = Dict.empty, mapRows = Dict.empty, learn = Nothing, mapFiles = [] }

        RowIs r ->
            let
                reading : MapRowReading
                reading =
                    { input = r.input, kind = r.kind, addr = r.addr, min = r.min, max = r.max, echo = r.echo, status = r.status }
            in
            case r.row of
                SoundRow i ->
                    { m | soundRows = Dict.insert (rowIndexToInt i) reading m.soundRows }

                MapFileRow i ->
                    { m | mapRows = Dict.insert (rowIndexToInt i) reading m.mapRows }

        -- Whole or a diff's only line: it replaces the learn held.
        LearnIs l ->
            { m | learn = Just l }

        MapFileIs name ->
            { m | mapFiles = m.mapFiles ++ [ name ] }

        Act _ ->
            describing a m

        -- ORBIT's section whole: its state and values go; it repeats them.
        OrbitIs ->
            { m
                | values = Dict.filter (\k _ -> not (isOrbitKey k m)) m.values
                , song = Nothing
                , slots = Dict.empty
                , chords = Dict.empty
                , scale = Nothing
                , steps = Dict.empty
                , pools = Dict.empty
            }

        -- Whole or a diff, each line replaces its own entry.
        SongIs g ->
            { m | song = Just g }

        SlotIs sl ->
            { m | slots = Dict.insert (sceneNoToInt sl.slot) { state = sl.state, rev = sl.rev } m.slots }

        ChordIs sg d ->
            { m | chords = Dict.insert (segmentToInt sg) d m.chords }

        ScaleIs mask ->
            { m | scale = Just mask }

        StepIs r i n ->
            { m | steps = Dict.insert ( ringNoToInt r, stepNoToInt i ) n m.steps }

        PoolIs r ns ->
            { m | pools = Dict.insert (ringNoToInt r) ns m.pools }


{-| Only the MIXER's, SETTINGS' and ORBIT's values and the MIXER's panels
kept: the Part's section starts afresh.
-}
mixerOnly : Model -> Model
mixerOnly m =
    { m
        | values = Dict.filter (\k _ -> isMixerKey k m || isSettingsKey k m || isOrbitKey k m) m.values
        , variants = Dict.filter (\k _ -> Schema.hasPanel k m.mixer) m.variants
    }


isMixerKey : String -> Model -> Bool
isMixerKey k m =
    Addr.fromWire k |> Maybe.map (\a -> isMixer a m) |> Maybe.withDefault False


isSettingsKey : String -> Model -> Bool
isSettingsKey k m =
    Addr.fromWire k |> Maybe.map (\a -> isSettings a m) |> Maybe.withDefault False


isOrbitKey : String -> Model -> Bool
isOrbitKey k m =
    Addr.fromWire k |> Maybe.map (\a -> isOrbit a m) |> Maybe.withDefault False


{-| A schema read this connection, or none.
-}
heldSchema : SchemaId -> Model -> Maybe Schema
heldSchema s m =
    Dict.get (schemaToken s) m.held |> Maybe.map .schema


{-| A line of `ed describe`'s answer, into the schema being read (`line`
keeps it as the unit wrote it, for the hash and the cache).
-}
describing : AnswerLine -> Model -> Model
describing a m =
    case m.stage of
        Describing _ _ _ ->
            { m | incoming = Schema.add a m.incoming }

        Greeting ->
            m

        Checking _ _ ->
            m

        Recalling _ _ ->
            m

        Following ->
            m

        Halted _ ->
            m


{-| `OK` ends the request in flight. `more`: a `since` answer owes sections,
asked for on the next tick.
-}
ok : Maybe Gen -> Bool -> Model -> ( Model, List Wish )
ok done more m0 =
    let
        m : Model
        m =
            { m0 | whole = False }
    in
    case m.stage of
        Greeting ->
            ( readNext { m | asked = Nothing, owed = 0 }, [] )

        Checking s (Just r) ->
            let
                m1 : Model
                m1 =
                    { m | asked = Nothing, owed = 0 }
            in
            case Dict.get (schemaToken s) m.held of
                Just h ->
                    if h.hash == r.hash then
                        ( readNext (install s h m1), [] )

                    else
                        recall s r m1

                Nothing ->
                    recall s r m1

        -- An `OK` with no `schema` line: not the unit this editor speaks to.
        Checking _ Nothing ->
            ( { m | stage = Halted UpdateEditor, asked = Nothing }, [] )

        Recalling _ _ ->
            ( m, [] )

        Describing s r n ->
            let
                m1 : Model
                m1 =
                    { m | asked = Nothing, owed = 0 }
            in
            if Protocol.pageNoToInt n + 1 < r.pages then
                ( { m1 | stage = Describing s r (Protocol.nextPage n) }, [] )

            else
                let
                    lines : List String
                    lines =
                        List.reverse m.incomingLines

                    read_ : Hash
                    read_ =
                        Hash.ofLines lines
                in
                if read_ == r.hash then
                    ( readNext (install s { hash = r.hash, schema = m.incoming } { m1 | incoming = Schema.empty, incomingLines = [] })
                    , [ Store (cacheKey s r.hash) lines ]
                    )

                else
                    -- Not the text the hash names: neither shown nor kept.
                    ( { m1 | stage = Halted (BadSchema s (WrongHash r.hash read_)) }, [] )

        Following ->
            case done of
                Just g ->
                    ( following g (max 0 (m.owed - 1)) more m, [] )

                Nothing ->
                    ( m, [] )

        Halted _ ->
            ( m, [] )


{-| A schema the editor doesn't hold: from the cache, or, with no pages
(ORBIT or MIDI MAP not in the build), empty at once.
-}
recall : SchemaId -> Reply -> Model -> ( Model, List Wish )
recall s r m =
    if r.pages == 0 then
        ( readNext (install s { hash = r.hash, schema = Schema.empty } m), [] )

    else
        ( { m | stage = Recalling s r, asked = Just m.now }, [ Remember (cacheKey s r.hash) ] )


{-| The schema being recalled is not in the cache (or the cache answered
nothing it could mean, or never answered): describe it.
-}
recallMissed : Model -> Model
recallMissed m =
    case m.stage of
        Recalling s reply ->
            { m | stage = Describing s reply Protocol.firstPage, incoming = Schema.empty, incomingLines = [], asked = Nothing }

        Greeting ->
            m

        Checking _ _ ->
            m

        Describing _ _ _ ->
            m

        Following ->
            m

        Halted _ ->
            m


{-| A `since` answered. Once nothing is owed and no command sent waits for
its answer (its `OK` would be read as `ed schema`'s), a box on another engine
has its schemas read (held, cached or described), then is read from nothing;
the old page stays up meanwhile.
-}
following : Gen -> Int -> Bool -> Model -> Model
following g owed more m =
    if owed == 0 && not more && List.isEmpty m.awaiting && m.engine /= Nothing && m.engine /= m.described then
        readNext
            (adopt
                (mixerOnly
                    { m
                        | refusals = Dict.empty
                        , routes = Dict.empty
                        , gen = Nothing
                        , owed = 0
                        , leftover = False
                        , asked = Nothing
                    }
                )
            )

    else
        { m
            | gen = Just g
            , owed = owed
            , leftover = owed > 0
            , asked =
                if owed > 0 then
                    Just m.now

                else
                    Nothing
        }


{-| The followed engine's schemas, where this connection already read them.
-}
adopt : Model -> Model
adopt m =
    case m.engine |> Maybe.andThen (\e -> heldSchema (EngineSchema e) m |> Maybe.map (Tuple.pair e)) of
        Just ( e, sch ) ->
            { m | schema = sch, described = Just e, matrix = heldSchema (MatrixSchema e) m |> Maybe.withDefault Schema.empty }

        Nothing ->
            m


{-| The cache's answer for the schema being recalled. Lines that hash to
what the unit said are describe's own text: read as its answer is, and a line
of them the editor can't read marks the schema bad. Anything else is a miss:
describe it.
-}
recalled : Cache.Recalled -> Model -> Model
recalled r m =
    case m.stage of
        Recalling s reply ->
            if r.key /= cacheKey s reply.hash then
                m

            else
                let
                    describe : Model
                    describe =
                        recallMissed m
                in
                case r.lines |> Maybe.map (\ls -> ( Hash.ofLines ls == reply.hash, List.foldl read (Ok Schema.empty) ls )) of
                    Just ( True, Ok sch ) ->
                        if Schema.pageCount sch == Just reply.pages && List.length (Schema.pages sch) == reply.pages then
                            readNext (install s { hash = reply.hash, schema = sch } { m | asked = Nothing })

                        else
                            describe

                    Just ( True, Err l ) ->
                        { m | stage = Halted (BadSchema s (Unreadable l)), asked = Nothing }

                    Just ( False, _ ) ->
                        describe

                    Nothing ->
                        describe

        Greeting ->
            m

        Checking _ _ ->
            m

        Describing _ _ _ ->
            m

        Following ->
            m

        Halted _ ->
            m


{-| One cached line into a schema, as `describe`'s answer is read; the first
line that is not describe's (it can't be read, or is an answer's end) is the
error.
-}
read : String -> Result String Schema -> Result String Schema
read raw acc =
    case acc of
        Ok sch ->
            case parse raw of
                Answer a ->
                    Ok (Schema.add a sch)

                Ok_ _ ->
                    Err raw

                OkMore _ ->
                    Err raw

                Queued ->
                    Err raw

                Err_ _ ->
                    Err raw

                SetRefused _ _ ->
                    Err raw

                SinceTooLarge ->
                    Err raw

                Unknown ->
                    Err raw

        Err _ ->
            acc


{-| A schema read: held for this connection, and shown where it belongs.
-}
install : SchemaId -> Held -> Model -> Model
install s h m =
    let
        m1 : Model
        m1 =
            { m | held = Dict.insert (schemaToken s) h m.held }
    in
    case s of
        MixerSchema ->
            { m1 | mixer = h.schema }

        EngineSchema e ->
            if m.engine == Just e then
                { m1 | schema = h.schema, described = Just e }

            else
                m1

        MatrixSchema e ->
            if m.engine == Just e then
                { m1 | matrix = h.schema }

            else
                m1

        SettingsSchema ->
            { m1 | settings = h.schema }

        MapSchema ->
            { m1 | midiMap = h.schema }

        OrbitSchema ->
            { m1 | orbit = h.schema }


{-| What to read next: the followed engine's schema, the mixer's, the
engine's matrix, SETTINGS', MAP's, then ORBIT's, each once a connection;
then following.
-}
readNext : Model -> Model
readNext m =
    let
        lacks : SchemaId -> Bool
        lacks s =
            not (Dict.member (schemaToken s) m.held)

        go : Stage -> Model
        go st =
            { m | stage = st }
    in
    case m.engine of
        Just e ->
            if lacks (EngineSchema e) then
                go (Checking (EngineSchema e) Nothing)

            else if lacks MixerSchema then
                go (Checking MixerSchema Nothing)

            else if lacks (MatrixSchema e) then
                go (Checking (MatrixSchema e) Nothing)

            else if lacks SettingsSchema then
                go (Checking SettingsSchema Nothing)

            else if lacks MapSchema then
                go (Checking MapSchema Nothing)

            else if lacks OrbitSchema then
                go (Checking OrbitSchema Nothing)

            else
                go Following

        Nothing ->
            go (Halted UpdateEditor)


maybeList : Maybe a -> List a
maybeList =
    Maybe.map List.singleton >> Maybe.withDefault []
