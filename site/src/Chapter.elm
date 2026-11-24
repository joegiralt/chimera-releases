-- SPDX-License-Identifier: GPL-3.0-or-later


module Chapter exposing (Chapter, all, file, fromFile, fromSlug, neighbours, slug, title)

{-| A chapter of the 0.4 manual (`manual/preenfm3/0.4/NN-slug.md`). Only
the list below makes one, so a `Chapter` always names a real page; a test
checks the list against the files.
-}


type Chapter
    = Chapter String String


all : List Chapter
all =
    List.map (\( s, t ) -> Chapter s t)
        [ ( "01-concepts", "Concepts: Parts, Sounds, projects and the voice chain" )
        , ( "02-panel-and-navigation", "The panel and navigation" )
        , ( "03-algo", "ALGO" )
        , ( "04-modal", "MODAL" )
        , ( "05-va", "VA" )
        , ( "06-tape", "TAPE" )
        , ( "07-drum", "DRUM" )
        , ( "08-voice-chain", "The voice chain: pitch, filter, FX, amp, stereo and sends" )
        , ( "09-envelopes-and-lfos", "Envelopes and LFOs" )
        , ( "10-mod-matrix", "The mod matrix" )
        , ( "11-mixer-and-master-fx", "The MIXER and the master effects" )
        , ( "12-orbit", "ORBIT, the ring sequencer" )
        , ( "13-settings", "SETTINGS" )
        , ( "14-midi", "MIDI" )
        , ( "15-tuning", "Tuning" )
        , ( "16-card-sounds-library", "The SD card, Sounds and the library" )
        , ( "17-usb", "USB: audio, MIDI and the console" )
        , ( "18-browser-editor", "The browser editor" )
        , ( "19-updating-and-recovery", "Updating and recovery" )
        , ( "20-limits", "Limits: voices, CPU and memory" )
        , ( "21-glossary", "Glossary" )
        ]


slug : Chapter -> String
slug (Chapter s _) =
    s


title : Chapter -> String
title (Chapter _ t) =
    t


{-| The Markdown file's name in the manual's folder.
-}
file : Chapter -> String
file c =
    slug c ++ ".md"


fromSlug : String -> Maybe Chapter
fromSlug s =
    List.filter (\c -> slug c == s) all |> List.head


fromFile : String -> Maybe Chapter
fromFile f =
    List.filter (\c -> file c == f) all |> List.head


{-| The chapters before and after this one.
-}
neighbours : Chapter -> ( Maybe Chapter, Maybe Chapter )
neighbours c =
    let
        at : Int -> Maybe Chapter
        at i =
            List.drop i all |> List.head

        index : Int
        index =
            List.indexedMap Tuple.pair all
                |> List.filter (\( _, other ) -> other == c)
                |> List.head
                |> Maybe.map Tuple.first
                |> Maybe.withDefault 0
    in
    ( if index == 0 then
        Nothing

      else
        at (index - 1)
    , at (index + 1)
    )
