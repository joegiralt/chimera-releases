-- SPDX-License-Identifier: GPL-3.0-or-later


module Flow exposing (Expiry(..), Flow, acked, expire, idle, inFlight, target, want)

{-| The edits' window: one `ed set` on the wire at a time. A hand moves
faster than the unit answers, so what it wants meanwhile waits here, the
latest want of each address winning, until the set on the wire is answered
(`OK` or `ERR`); then the next goes. The unit never gets a burst, and the
last place a hand let go is always the last thing sent.

A set unanswered for too long is sent once more; unanswered again, it is
given up (the model says so) and the next goes, so a lost answer never stops
the window.

-}

import Addr exposing (Addr)
import Dict exposing (Dict)
import Protocol exposing (Command(..), Value)
import Time


type Flow
    = Idle
    | Waiting Sent Pending


{-| The set on the wire: when it went, and whether it was sent again.
-}
type alias Sent =
    { addr : Addr, value : Value, at : Time.Posix, resent : Bool }


{-| What waits, one value an address: the latest want wins.
-}
type Pending
    = Pending (Dict String ( Addr, Value ))


idle : Flow
idle =
    Idle


{-| A hand wants `a` at `v`: sent now if nothing is on the wire, else held
(over any older want of `a`).
-}
want : Time.Posix -> Addr -> Value -> Flow -> ( Flow, Maybe Command )
want now a v f =
    case f of
        Idle ->
            ( Waiting (sent now a v) (Pending Dict.empty), Just (Set a v) )

        Waiting s (Pending d) ->
            if s.addr == a && s.value == v then
                -- What is on the wire is the latest.
                ( Waiting s (Pending (Dict.remove (Addr.key a) d)), Nothing )

            else
                ( Waiting s (Pending (Dict.insert (Addr.key a) ( a, v ) d)), Nothing )


sent : Time.Posix -> Addr -> Value -> Sent
sent now a v =
    { addr = a, value = v, at = now, resent = False }


{-| The set on the wire was answered: the next waiting one goes.
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
        ( k, ( a, v ) ) :: _ ->
            ( Waiting (sent now a v) (Pending (Dict.remove k d)), Just (Set a v) )

        [] ->
            ( Idle, Nothing )


{-| What a clock found of the set on the wire: still in time; sent again
(the set given up, and the one sent in its place: the latest want of its
address, else itself); or given up for good, and the next set sent.
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
                    k : String
                    k =
                        Addr.key s.addr

                    v : Value
                    v =
                        Dict.get k d |> Maybe.map Tuple.second |> Maybe.withDefault s.value
                in
                ( Waiting { s | value = v, at = now, resent = True } (Pending (Dict.remove k d))
                , Resent (Set s.addr s.value) (Set s.addr v)
                )

            else
                let
                    ( after, n ) =
                        next now (Pending d)
                in
                ( after, GaveUp (Set s.addr s.value) n )


{-| The set on the wire, if one is.
-}
inFlight : Flow -> Maybe Command
inFlight f =
    case f of
        Idle ->
            Nothing

        Waiting s _ ->
            Just (Set s.addr s.value)


{-| Where the editor last asked `a` to go and the unit has not yet said it
went: the waiting want, else the set on the wire. A wheel's notch starts
from here, so notches faster than the answers all count.
-}
target : Addr -> Flow -> Maybe Value
target a f =
    case f of
        Idle ->
            Nothing

        Waiting s (Pending d) ->
            case Dict.get (Addr.key a) d of
                Just ( _, v ) ->
                    Just v

                Nothing ->
                    if s.addr == a then
                        Just s.value

                    else
                        Nothing
