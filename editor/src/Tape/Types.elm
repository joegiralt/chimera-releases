-- SPDX-License-Identifier: GPL-3.0-or-later


module Tape.Types exposing
    ( Dropped(..)
    , Event(..)
    , Failure(..)
    , Hand(..)
    , Held
    , Js(..)
    , Link(..)
    , Model(..)
    , Msg(..)
    , Outcome(..)
    , Playback(..)
    , Request(..)
    , Send(..)
    , Stage(..)
    , Work(..)
    )

{-| TAPE import's states: a WAV held or not; a source made from it, being
made, or not yet; and once made, playing, going onto the card, or there.
A source that is sending can't be changed or remade: `Sending` holds the
source it sends.
-}

import Json.Decode as D
import Tape.Reply exposing (PutError, Reply)
import Tape.Report exposing (Refusal, Shape, Source, Take)
import Tape.Settings exposing (Args, Rate, Settings, Top)


type Model
    = Model
        { stage : Stage
        , link : Link
        , tick : Int
        }


{-| Whether the editor's link to the unit was open when the panel took it:
a source can be made and heard without a unit, but only sent with one.
-}
type Link
    = Linked
    | Unlinked


type Stage
    = Opening
    | Empty Dropped
    | Reading String
    | Holding Held
    | Closing


{-| No WAV held: nothing tried yet, or the last file refused.
-}
type Dropped
    = Fresh
    | Unread String Refusal


type alias Held =
    { take : Take
    , settings : Settings
    , work : Work
    }


type Work
    = Unmade
      -- The conversion asked, by its number: only its answer is taken.
    | Making Int
    | Made Source Playback
    | Unmakeable Refusal
    | Sending Source Send
    | Sent Source Outcome


type Playback
    = Silent
    | Playing


{-| Where a `put` is: asked, a chunk out awaiting its `ACK` (by index), or
every chunk taken and the read back and seal awaited.
-}
type Send
    = Asking
    | Chunk Int
    | Sealing


type Outcome
    = Landed
    | AlreadyThere
    | Failed Failure


type Failure
    = UnitRefused PutError
    | UnitBusy
    | NoAnswer
    | LinkGone
    | OutOfTurn String


type Msg
    = FromJs D.Value
    | Hand Hand
    | TimedOut Int


{-| A hand on the page.
-}
type Hand
    = Choose
    | SetRate Rate
    | SetStart String
    | SetEnd String
    | SetName String
    | SetShape Shape
    | SetCycle String
    | SetFrames String
    | SetTop Top
    | Make
    | Play
    | Stop
    | SendIt
    | Close


{-| What `tape.js` says.
-}
type Event
    = Begun Bool
    | Picked String
    | PickCancelled
    | Loaded String (Result Refusal Take)
    | Converted Int (Result Refusal Source)
    | PlayEnded
    | Line Reply
    | LinkLost
    | Ended String
    | Garbled String


{-| What is asked: of `tape.js`, or Elm's own `Await`, a reply due within
its milliseconds, else `TimedOut`.
-}
type Request
    = ToJs Js
    | Await Int


{-| What `tape.js` is asked to do.
-}
type Js
    = Begin
    | ChooseFile
    | ReadFile
    | Convert Int Args
    | StartPlay
    | StopPlay
    | SendLine String
    | SendChunk Int
    | End
