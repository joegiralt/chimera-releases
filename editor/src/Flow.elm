-- SPDX-License-Identifier: GPL-3.0-or-later


module Flow exposing (Edit(..), Expiry(..), Flow, acked, expire, heard, idle, inFlight, target, want)

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
        , pending : Dict String Edit

        -- Answered edits the unit has not yet reported taking (`OK queued`
        -- is taken, not applied): still where a hand last asked each to go.
        , landed : Dict String ( Edit, Time.Posix )
        }


{-| The edit on the wire, when it went, and whether it was sent again.
-}
type alias Sent =
    { edit : Edit, at : Time.Posix, resent : Bool }


idle : Flow
idle =
    Flow { wire = Nothing, pending = Dict.empty, landed = Dict.empty }


{-| A hand wants `e`: sent now if nothing is on the wire, else held (over
any older want of what it edits).
-}
want : Time.Posix -> Edit -> Flow -> ( Flow, Maybe Command )
want now e (Flow f) =
    case f.wire of
        Nothing ->
            ( Flow { f | wire = Just (sent now e) }, Just (command e) )

        Just s ->
            if s.edit == e then
                -- What is on the wire is the latest.
                ( Flow { f | pending = Dict.remove (keyOf e) f.pending }, Nothing )

            else
                ( Flow { f | pending = Dict.insert (keyOf e) e f.pending }, Nothing )


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
            next now (Flow { f | wire = Nothing, landed = Dict.insert (keyOf s.edit) ( s.edit, now ) f.landed })


next : Time.Posix -> Flow -> ( Flow, Maybe Command )
next now (Flow f) =
    case Dict.toList f.pending of
        ( k, e ) :: _ ->
            ( Flow { f | wire = Just (sent now e), pending = Dict.remove k f.pending }, Just (command e) )

        [] ->
            ( Flow { f | wire = Nothing }, Nothing )


{-| The unit reported what `like` edits (its value ignored); `took` says
whether the report is the landed edit taken. Taken, the landed edit goes:
the unit's value is the base again.
-}
heard : Edit -> (Edit -> Bool) -> Flow -> Flow
heard like took (Flow f) =
    case Dict.get (keyOf like) f.landed of
        Just ( e, _ ) ->
            if took e then
                Flow { f | landed = Dict.remove (keyOf like) f.landed }

            else
                Flow f

        Nothing ->
            Flow f


{-| What a clock found of the edit on the wire: still in time; sent again
(the edit given up, and the one sent in its place: the latest want of its
key, else itself); or given up for good, and the next edit sent.
-}
type Expiry
    = Fresh
    | Resent Command Command
    | GaveUp Command (Maybe Command)


{-| The window after `ms` milliseconds without an answer.
-}
expire : Time.Posix -> Int -> Flow -> ( Flow, Expiry )
expire now ms (Flow f0) =
    let
        late : Time.Posix -> Bool
        late at =
            Time.posixToMillis now - Time.posixToMillis at >= ms

        -- A landed edit the unit never reports is given up quietly: the
        -- unit's value is the base again.
        f : { wire : Maybe Sent, pending : Dict String Edit, landed : Dict String ( Edit, Time.Posix ) }
        f =
            { f0 | landed = Dict.filter (\_ ( _, at ) -> not (late at)) f0.landed }
    in
    case f.wire of
        Nothing ->
            ( Flow f, Fresh )

        Just s ->
            if not (late s.at) then
                ( Flow f, Fresh )

            else if not s.resent then
                let
                    e : Edit
                    e =
                        Dict.get (keyOf s.edit) f.pending |> Maybe.withDefault s.edit
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
        Just e ->
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
                    Dict.get k f.landed |> Maybe.map Tuple.first
