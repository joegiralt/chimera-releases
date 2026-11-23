-- SPDX-License-Identifier: GPL-3.0-or-later


module Layout.Mixer exposing (Desk, Effect, Picture(..), Send, Strip, desk)

{-| The unit's MIXER as a desk, from its `describe MIXER` alone, never a
fixed list:

  - a channel strip per Part: the pages named `<PART>_<PAGE>` (`PART1_PRT`,
    `PART1_EQ`, `PART1_SND`), its EQ the `EQ` page's, its sends the `SND`
    page's (each to the effect its label names), its fader the cell
    labelled LEVEL, its PAN the one labelled PAN, the rest in a row;
  - the effects, in `describe` order: the other pages gathered by the block
    their parameters belong to (CHORUS, DELAY, REVERB, COMP);
  - the master: the effects' page with a VOL or LEVEL cell is the OUT
    strip, and its block's tab (that page among its others) is called OUT.

Every parameter appears once (the first page that holds it), in `describe`
order. A page with nothing on it (a Part's VOICES) adds nothing.

-}

import Addr exposing (Addr)
import Protocol
import Schema exposing (Schema)
import Ui.Screen exposing (Focus(..))


type alias Desk =
    { strips : List Strip, master : Maybe Strip, effects : List Effect }


{-| A strip: its key (`PART1`), title (`P1`), the Part's number when it is
one, and its cells by role.
-}
type alias Strip =
    { key : String
    , title : String
    , part : Maybe Int
    , eq : List Addr
    , sends : List Send
    , pan : Maybe Addr
    , level : Maybe Addr
    , rest : List Addr
    }


{-| A send, and the effect (its key) its label names, if one does.
-}
type alias Send =
    { addr : Addr, effect : Maybe String }


{-| An effect's tab: its key (the block, `CHORUS`), its title, and its
pages' cells.
-}
type alias Effect =
    { key : String, title : String, pages : List ( String, List Addr ), picture : Maybe Picture }


{-| Where the screen kit draws an effect's picture, as the unit's focus band
shows it: a page's gauge with a cell in focus (the chorus's TYPE picks
braid, moire or ray gun; the delay's FDBK; the reverb's MIX, a cube for
QUAD), or a page's art (the master's compressor curve). By the page's label.
-}
type Picture
    = GaugeOn String Focus
    | ArtOn String


{-| The kit's pictures, by the page that holds each.
-}
pictures : List ( String, Picture )
pictures =
    [ ( "CHR", GaugeOn "CHR" CellA )
    , ( "DLY", GaugeOn "DLY" CellC )
    , ( "REV", GaugeOn "REV" CellF )
    , ( "MST", ArtOn "MST" )
    ]


pictureOf : List ( String, List Addr ) -> Maybe Picture
pictureOf pages =
    pages
        |> List.filterMap (\( label, _ ) -> pictures |> List.filter (Tuple.first >> (==) label) |> List.head |> Maybe.map Tuple.second)
        |> List.head


type alias Seen =
    { pages : List { key : String, strip : Bool, sub : String, cells : List ( Addr, String ) }
    , placed : List String
    }


desk : Schema -> Desk
desk sch =
    let
        seen : Seen
        seen =
            List.foldl gather { pages = [], placed = [] } (Schema.pages sch)

        keys : (Bool -> Bool) -> List String
        keys keep =
            List.foldl
                (\p acc ->
                    if keep p.strip && not (List.member p.key acc) then
                        acc ++ [ p.key ]

                    else
                        acc
                )
                []
                seen.pages

        pagesOf : String -> List { key : String, strip : Bool, sub : String, cells : List ( Addr, String ) }
        pagesOf k =
            List.filter (\p -> p.key == k) seen.pages

        masterPage : Maybe { key : String, strip : Bool, sub : String, cells : List ( Addr, String ) }
        masterPage =
            seen.pages |> List.filter (\p -> not p.strip && List.any (\( _, l ) -> isLevel l) p.cells) |> List.head

        effects : List Effect
        effects =
            keys not
                |> List.map
                    (\k ->
                        { key = k
                        , title =
                            if Maybe.map .key masterPage == Just k then
                                "OUT"

                            else
                                k
                        , pages = pagesOf k |> List.map (\p -> ( p.sub, List.map Tuple.first p.cells ))
                        , picture = pagesOf k |> List.map (\p -> ( p.sub, [] )) |> pictureOf
                        }
                    )

        effectOf : String -> Maybe String
        effectOf label =
            effects |> List.filter (\e -> e.key == label || e.title == label) |> List.head |> Maybe.map .key

        strip : String -> List ( String, List ( Addr, String ) ) -> Strip
        strip k pages =
            let
                on : String -> List ( Addr, String )
                on sub =
                    pages |> List.filter (\( s, _ ) -> s == sub) |> List.concatMap Tuple.second

                main_ : List ( Addr, String )
                main_ =
                    pages |> List.filter (\( s, _ ) -> s /= "EQ" && s /= "SND") |> List.concatMap Tuple.second

                labelled : (String -> Bool) -> Maybe Addr
                labelled f =
                    main_ |> List.filter (Tuple.second >> f) |> List.head |> Maybe.map Tuple.first

                level : Maybe Addr
                level =
                    labelled isLevel

                pan : Maybe Addr
                pan =
                    labelled ((==) "PAN")
            in
            { key = k
            , title = shortTitle k
            , part = partOf k
            , eq = List.map Tuple.first (on "EQ")
            , sends = List.map (\( a, l ) -> { addr = a, effect = effectOf l }) (on "SND")
            , pan = pan
            , level = level
            , rest = main_ |> List.map Tuple.first |> List.filter (\a -> Just a /= level && Just a /= pan)
            }
    in
    { strips = keys identity |> List.map (\k -> strip k (pagesOf k |> List.map (\p -> ( p.sub, p.cells ))))
    , master = masterPage |> Maybe.map (\p -> strip "OUT" [ ( p.sub, p.cells ) ])
    , effects = effects
    }


isLevel : String -> Bool
isLevel l =
    l == "LEVEL" || l == "VOL"


gather : Schema.Page -> Seen -> Seen
gather pg seen =
    let
        cells : List ( Addr, String )
        cells =
            pg.panels
                |> List.concatMap (.params >> List.map (\p -> ( p.addr, p.label )))
                |> List.foldl
                    (\( a, l ) acc ->
                        if List.member (Addr.key a) seen.placed || List.any (\( b, _ ) -> b == a) acc then
                            acc

                        else
                            acc ++ [ ( a, l ) ]
                    )
                    []
    in
    if List.isEmpty cells then
        seen

    else
        let
            label : String
            label =
                Protocol.pageLabel pg.label

            ( key, strip, sub ) =
                case String.indexes "_" label |> List.head of
                    Just i ->
                        ( String.left i label, True, String.dropLeft (i + 1) label )

                    Nothing ->
                        ( cells |> List.head |> Maybe.map (Tuple.first >> blockOf) |> Maybe.withDefault label, False, label )
        in
        { pages = seen.pages ++ [ { key = key, strip = strip, sub = sub, cells = cells } ]
        , placed = seen.placed ++ List.map (Tuple.first >> Addr.key) cells
        }


{-| `CHORUS` of `CHORUS.RATE`.
-}
blockOf : Addr -> String
blockOf a =
    Addr.key a |> String.split "." |> List.head |> Maybe.withDefault (Addr.key a)


{-| `PART1`'s number.
-}
partOf : String -> Maybe Int
partOf k =
    if String.startsWith "PART" k then
        String.toInt (String.dropLeft 4 k)

    else
        Nothing


{-| `PART1` as the unit's tabs say it, `P1`.
-}
shortTitle : String -> String
shortTitle k =
    partOf k |> Maybe.map (\n -> "P" ++ String.fromInt n) |> Maybe.withDefault k
