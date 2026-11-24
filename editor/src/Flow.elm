-- SPDX-License-Identifier: GPL-3.0-or-later


module Flow exposing (Edit(..), Expiry(..), Flow, acked, answerLost, busy, busyTries, busyWaitMs, expire, forget, forgetRoutesTo, heard, idle, inFlight, target, untaken, want)

{-| The edits' window: one edit on the wire at a time (an `ed set`, or an
`ed route` of a matrix cell). A hand moves faster than the unit answers, so
what it wants meanwhile waits here, keyed by what it edits (an address, a
cell), the latest want of each winning, until the edit on the wire is
answered (`OK` or `ERR`); then the next goes. The unit never gets a burst,
and the last place a hand let go is always the last thing sent.

An edit unanswered for too long is sent once more; unanswered again, it is
given up (the model says so) and the next goes, so a lost answer never stops
the window. An answered edit stays the base a hand counts from until the
unit reports taking it (an `OK queued` is not yet applied), or the timeout.

A unit too busy to take an edit (`ERR busy`: card work, a full queue) has
the window shut a while, longer each time, and the latest want of what that
edit edited goes when it opens again: a busy answer is never a refusal, and
never drops where the hand let go. Busy past `busyTries` in a row, the edit
is given up (the model says so).

-}

import Addr exposing (Addr)
import Dict exposing (Dict)
import Protocol exposing (Cell, Command(..), RouteTo, Value)
import Time


{-| What a hand edits: a parameter's value, or a matrix cell's route.
-}
type Edit
    = SetTo Addr Value
    | RouteOf Cell RouteTo


{-| What the edit edits: its address, or its cell (never an address).
-}
keyOf : Edit -> String
keyOf e =
    case e of
        SetTo a _ ->
            Addr.key a

        RouteOf c _ ->
            "route " ++ Protocol.cellKey c


command : Edit -> Command
command e =
    case e of
        SetTo a v ->
            Set a v

        RouteOf c to ->
            SetRoute c to


type Flow
    = Flow
        { wire : Maybe Sent

        -- Each waiting want, by what it edits, with when it first waited:
        -- they go oldest first (a pad route's source and destination before
        -- its amount), the latest want of each in its first one's place.
        , pending : Dict String ( Int, Edit )
        , seq : Int

        -- Answered edits the unit has not yet reported taking (`OK queued`
        -- is taken, not applied): still where a hand last asked each to go,
        -- when, and whether the unit has since said anything of it. A newer
        -- edit of the same going on the wire ends it: given up, that one
        -- leaves the unit's value, not an older wish.
        , landed : Dict String Landed

        -- Shut after `ERR busy` until this time, and how many busy answers in a row.
        , shut : Maybe Time.Posix
        , busyRun : Int
        }


type alias Landed =
    { edit : Edit, at : Time.Posix, heard : Bool }


{-| The edit on the wire, when it went, and whether it was sent again.
-}
type alias Sent =
    { edit : Edit, at : Time.Posix, resent : Bool }


idle : Flow
idle =
    Flow { wire = Nothing, pending = Dict.empty, seq = 0, landed = Dict.empty, shut = Nothing, busyRun = 0 }


{-| A hand wants `e`: sent now if nothing is on the wire, else held (over
any older want of what it edits).
-}
want : Time.Posix -> Edit -> Flow -> ( Flow, Maybe Command )
want now e (Flow f) =
    case f.wire of
        Nothing ->
            if (Dict.get (keyOf e) f.landed |> Maybe.map (\l -> l.edit == e && not l.heard)) == Just True && not (Dict.member (keyOf e) f.pending) then
                -- Answered already, and the unit has said nothing of it since:
                -- asking again says nothing new. Once it reports another
                -- value (another hand's), it is asked again.
                ( Flow f, Nothing )

            else if f.shut == Nothing then
                ( Flow { f | wire = Just (sent now e), landed = Dict.remove (keyOf e) f.landed }, Just (command e) )

            else
                ( Flow (wait e f), Nothing )

        Just s ->
            if s.edit == e then
                -- What is on the wire is the latest.
                ( Flow { f | pending = Dict.remove (keyOf e) f.pending }, Nothing )

            else
                ( Flow (wait e f), Nothing )


{-| `e` waiting, after the wants before it (or in place of an older want of what it edits).
-}
wait : Edit -> { a | pending : Dict String ( Int, Edit ), seq : Int } -> { a | pending : Dict String ( Int, Edit ), seq : Int }
wait e f =
    let
        at : Int
        at =
            Dict.get (keyOf e) f.pending |> Maybe.map Tuple.first |> Maybe.withDefault f.seq
    in
    { f | pending = Dict.insert (keyOf e) ( at, e ) f.pending, seq = f.seq + 1 }


sent : Time.Posix -> Edit -> Sent
sent now e =
    { edit = e, at = now, resent = False }


{-| The edit on the wire was answered: it has landed (until the unit
reports it, or a timeout), and the next waiting one goes.
-}
acked : Time.Posix -> Flow -> ( Flow, Maybe Command )
acked now (Flow f) =
    case f.wire of
        Nothing ->
            ( Flow f, Nothing )

        Just s ->
            next now (Flow { f | wire = Nothing, busyRun = 0, landed = Dict.insert (keyOf s.edit) { edit = s.edit, at = now, heard = False } f.landed })


{-| How many `ERR busy` answers in a row before an edit is given up.
-}
busyTries : Int
busyTries =
    8


{-| The window shut after the `n`th busy answer in a row: 50 ms, doubling, at most a second.
-}
busyWaitMs : Int -> Int
busyWaitMs n =
    min 1000 (50 * 2 ^ (n - 1))


{-| The edit on the wire was answered `ERR busy`: the window shuts a while,
and the edit waits to go again (unless a later want of what it edits waits
already: that one goes). Past `busyTries` in a row it is given up instead
(the command given up), and the window opens on the next tick.
-}
busy : Time.Posix -> Flow -> ( Flow, Maybe Command )
busy now (Flow f) =
    case f.wire of
        Nothing ->
            ( Flow f, Nothing )

        Just s ->
            let
                run : Int
                run =
                    f.busyRun + 1
            in
            if run >= busyTries then
                ( Flow { f | wire = Nothing, busyRun = 0, shut = Just now, pending = Dict.remove (keyOf s.edit) f.pending }
                , Just (command s.edit)
                )

            else
                ( Flow
                    { f
                        | wire = Nothing
                        , busyRun = run
                        , shut = Just (Time.millisToPosix (Time.posixToMillis now + busyWaitMs run))
                        , pending =
                            if Dict.member (keyOf s.edit) f.pending then
                                f.pending

                            else
                                -- First to go when the window opens.
                                Dict.insert (keyOf s.edit) ( -1, s.edit ) f.pending
                    }
                , Nothing
                )


{-| How many answer timeouts a unit may be silent (busy) before an edit sent
again is given up.
-}
busyUnit : Int
busyUnit =
    5


{-| The edit on the wire lost its answer (a later one came first): timed out
now, so the next clock sends it once more, or gives it up.
-}
answerLost : Flow -> Flow
answerLost (Flow f) =
    -- Sent "long ago": late for any clock.
    Flow { f | wire = f.wire |> Maybe.map (\s -> { s | at = Time.millisToPosix -1000000000000 }) }


next : Time.Posix -> Flow -> ( Flow, Maybe Command )
next now (Flow f) =
    case Dict.toList f.pending |> List.sortBy (Tuple.second >> Tuple.first) |> List.map (Tuple.mapSecond Tuple.second) of
        ( k, e ) :: _ ->
            ( Flow { f | wire = Just (sent now e), pending = Dict.remove k f.pending, landed = Dict.remove k f.landed }, Just (command e) )

        [] ->
            ( Flow { f | wire = Nothing }, Nothing )


{-| The unit reported what `like` edits (its value ignored); `took` says
whether the report is the landed edit taken. Taken, the landed edit goes:
the unit's value is the base again.
-}
heard : Edit -> (Edit -> Bool) -> Flow -> Flow
heard like took (Flow f) =
    case Dict.get (keyOf like) f.landed of
        Just l ->
            if took l.edit then
                Flow { f | landed = Dict.remove (keyOf like) f.landed }

            else
                Flow { f | landed = Dict.insert (keyOf like) { l | heard = True } f.landed }

        Nothing ->
            Flow f


{-| The unit refused what `like` edits: the landed edit is said, and goes.
-}
forget : Edit -> Flow -> Flow
forget like (Flow f) =
    Flow { f | landed = Dict.remove (keyOf like) f.landed }


{-| The unit refused the routes to `dest` (a full matrix): their landed edits go.
-}
forgetRoutesTo : String -> Flow -> Flow
forgetRoutesTo dest (Flow f) =
    let
        to : Landed -> Bool
        to l =
            case l.edit of
                RouteOf c _ ->
                    String.endsWith (":" ++ dest) (Protocol.cellKey c)

                SetTo _ _ ->
                    False
    in
    Flow { f | landed = Dict.filter (\_ l -> not (to l)) f.landed }


{-| The landed edits past `ms` that the unit never said a word of, not a
value nor a refusal: `expire` drops them; the model checks each against
the unit's value (the unit names only its newest refusals).
-}
untaken : Time.Posix -> Int -> Flow -> List Edit
untaken now ms (Flow f) =
    f.landed
        |> Dict.values
        |> List.filter (\l -> not l.heard && Time.posixToMillis now - Time.posixToMillis l.at >= ms)
        |> List.map .edit


{-| What a clock found of the edit on the wire: still in time; sent again
(the edit given up, and the one sent in its place: the latest want of its
key, else itself); or given up for good, and the next edit sent.
-}
type Expiry
    = Fresh
    | Resent Command Command
    | GaveUp Command (Maybe Command)
      -- The window open again after `ERR busy`: this goes.
    | Reopened (Maybe Command)


{-| The window after `ms` milliseconds without an answer: the edit is sent
again; sent again, it is given up only once its answer is shown lost (a
later one came first: `answerLost`), or the unit is silent `busyUnit` times
as long. A silent unit is a busy one (its answers wait, in order), and an
answer it then gives is late, not lost.
-}
expire : Time.Posix -> Int -> Flow -> ( Flow, Expiry )
expire now ms (Flow f0) =
    let
        late : Time.Posix -> Bool
        late at =
            Time.posixToMillis now - Time.posixToMillis at >= ms

        -- A landed edit the unit never reports is given up quietly: the
        -- unit's value is the base again.
        f : { wire : Maybe Sent, pending : Dict String ( Int, Edit ), seq : Int, landed : Dict String Landed, shut : Maybe Time.Posix, busyRun : Int }
        f =
            { f0 | landed = Dict.filter (\_ l -> not (late l.at)) f0.landed }
    in
    case f.wire of
        Nothing ->
            case f.shut of
                Just until ->
                    if Time.posixToMillis now >= Time.posixToMillis until then
                        next now (Flow { f | shut = Nothing }) |> Tuple.mapSecond Reopened

                    else
                        ( Flow f, Fresh )

                Nothing ->
                    ( Flow f, Fresh )

        Just s ->
            if not (late s.at) then
                ( Flow f, Fresh )

            else if s.resent && Time.posixToMillis now - Time.posixToMillis s.at < busyUnit * ms then
                ( Flow f, Fresh )

            else if not s.resent then
                let
                    e : Edit
                    e =
                        Dict.get (keyOf s.edit) f.pending |> Maybe.map Tuple.second |> Maybe.withDefault s.edit
                in
                ( Flow { f | wire = Just { s | edit = e, at = now, resent = True }, pending = Dict.remove (keyOf s.edit) f.pending }
                , Resent (command s.edit) (command e)
                )

            else
                let
                    ( after, n ) =
                        next now (Flow { f | wire = Nothing })
                in
                ( after, GaveUp (command s.edit) n )


{-| The edit on the wire, if one is.
-}
inFlight : Flow -> Maybe Command
inFlight (Flow f) =
    f.wire |> Maybe.map (.edit >> command)


{-| The last edit of what `like` edits (its value ignored) that the editor
asked for and the unit has not yet reported: the waiting want, else the
edit on the wire, else one answered but not yet reported. A wheel's notch
starts from here, so notches faster than the answers all count.
-}
target : Edit -> Flow -> Maybe Edit
target like (Flow f) =
    let
        k : String
        k =
            keyOf like
    in
    case Dict.get k f.pending of
        Just ( _, e ) ->
            Just e

        Nothing ->
            case
                f.wire
                    |> Maybe.map .edit
                    |> Maybe.andThen
                        (\e ->
                            if keyOf e == k then
                                Just e

                            else
                                Nothing
                        )
            of
                Just e ->
                    Just e

                Nothing ->
                    Dict.get k f.landed |> Maybe.map .edit
