-- SPDX-License-Identifier: GPL-3.0-or-later


module Flow exposing (Edit(..), Expiry(..), Flow, acked, expire, idle, inFlight, target, want)

{-| The edits' window: one edit on the wire at a time (an `ed set`, or an
`ed route` of a matrix cell). A hand moves faster than the unit answers, so
what it wants meanwhile waits here, keyed by what it edits (an address, a
cell), the latest want of each winning, until the edit on the wire is
answered (`OK` or `ERR`); then the next goes. The unit never gets a burst,
and the last place a hand let go is always the last thing sent.

An edit unanswered for too long is sent once more; unanswered again, it is
given up (the model says so) and the next goes, so a lost answer never stops
the window.

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
    = Idle
    | Waiting Sent Pending


{-| The edit on the wire, what it edits, when it went, and whether it was
sent again.
-}
type alias Sent =
    { edit : Edit, at : Time.Posix, resent : Bool }


{-| What waits, one edit a key: the latest want wins.
-}
type Pending
    = Pending (Dict String Edit)


idle : Flow
idle =
    Idle


{-| A hand wants `e`: sent now if nothing is on the wire, else held (over
any older want of what it edits).
-}
want : Time.Posix -> Edit -> Flow -> ( Flow, Maybe Command )
want now e f =
    case f of
        Idle ->
            ( Waiting (sent now e) (Pending Dict.empty), Just (command e) )

        Waiting s (Pending d) ->
            if s.edit == e then
                -- What is on the wire is the latest.
                ( Waiting s (Pending (Dict.remove (keyOf e) d)), Nothing )

            else
                ( Waiting s (Pending (Dict.insert (keyOf e) e d)), Nothing )


sent : Time.Posix -> Edit -> Sent
sent now e =
    { edit = e, at = now, resent = False }


{-| The edit on the wire was answered: the next waiting one goes.
-}
acked : Time.Posix -> Flow -> ( Flow, Maybe Command )
acked now f =
    case f of
        Idle ->
            ( Idle, Nothing )

        Waiting _ p ->
            next now p


next : Time.Posix -> Pending -> ( Flow, Maybe Command )
next now (Pending d) =
    case Dict.toList d of
        ( k, e ) :: _ ->
            ( Waiting (sent now e) (Pending (Dict.remove k d)), Just (command e) )

        [] ->
            ( Idle, Nothing )


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
expire now ms f =
    case f of
        Idle ->
            ( f, Fresh )

        Waiting s (Pending d) ->
            if Time.posixToMillis now - Time.posixToMillis s.at < ms then
                ( f, Fresh )

            else if not s.resent then
                let
                    e : Edit
                    e =
                        Dict.get (keyOf s.edit) d |> Maybe.withDefault s.edit
                in
                ( Waiting { s | edit = e, at = now, resent = True } (Pending (Dict.remove (keyOf s.edit) d))
                , Resent (command s.edit) (command e)
                )

            else
                let
                    ( after, n ) =
                        next now (Pending d)
                in
                ( after, GaveUp (command s.edit) n )


{-| The edit on the wire, if one is.
-}
inFlight : Flow -> Maybe Command
inFlight f =
    case f of
        Idle ->
            Nothing

        Waiting s _ ->
            Just (command s.edit)


{-| The last edit of what `like` edits (its value ignored) that the editor
asked for and the unit has not yet said it took: the waiting want, else the
edit on the wire. A wheel's notch starts from here, so notches faster than
the answers all count.
-}
target : Edit -> Flow -> Maybe Edit
target like f =
    case f of
        Idle ->
            Nothing

        Waiting s (Pending d) ->
            case Dict.get (keyOf like) d of
                Just e ->
                    Just e

                Nothing ->
                    if keyOf s.edit == keyOf like then
                        Just s.edit

                    else
                        Nothing
