-- SPDX-License-Identifier: GPL-3.0-or-later


port module LayoutScreens exposing (main)

{-| Every layout screen's `<chimera-screen>` spec, as the editor's page builds
it, for `layout-screens.check.js` to paint with screen.wasm. Node hands each
engine's `describe` text, the values the unit reports and its panels' variants;
this answers, per engine, each screen module's title, the addresses off its page
its art reads, and its spec (null where the page doesn't resolve).
-}

import Addr
import Dict
import Json.Decode as Decode
import Json.Encode as Encode
import Layout.Page
import Layout.Shared as Shared
import Model
import Protocol exposing (Line(..))
import Schema exposing (Schema)
import Ui.PadStrip exposing (Tab(..))
import Ui.Screen as Screen
import Unit
import View.EnginePage as EnginePage


port screens : Encode.Value -> Cmd msg


type alias Engine =
    { name : String, schema : List String, vals : List ( String, Float ), variants : List ( String, String ) }


main : Program Decode.Value () Never
main =
    Platform.worker
        { init = \flags -> ( (), screens (answer flags) )
        , update = \_ m -> ( m, Cmd.none )
        , subscriptions = \_ -> Sub.none
        }


answer : Decode.Value -> Encode.Value
answer flags =
    case Decode.decodeValue (Decode.list engine) flags of
        Ok es ->
            Encode.list one es

        Err e ->
            Encode.object [ ( "error", Encode.string (Decode.errorToString e) ) ]


engine : Decode.Decoder Engine
engine =
    Decode.map4 Engine
        (Decode.field "name" Decode.string)
        (Decode.field "schema" (Decode.list Decode.string))
        (Decode.field "vals" (Decode.list (Decode.map2 Tuple.pair (Decode.index 0 Decode.string) (Decode.index 1 Decode.float))))
        (Decode.field "variants" (Decode.list (Decode.map2 Tuple.pair (Decode.index 0 Decode.string) (Decode.index 1 Decode.string))))


read : List String -> Schema
read =
    List.foldl
        (\raw s ->
            case Protocol.parse raw of
                Answer a ->
                    Schema.add a s

                _ ->
                    s
        )
        Schema.empty


one : Engine -> Encode.Value
one e =
    case Unit.engineFromName e.name of
        Just u ->
            let
                m : Model.Model
                m =
                    { model
                        | schema = read e.schema
                        , values = Dict.fromList (List.filterMap (\( k, v ) -> Addr.fromWire k |> Maybe.map (\a -> ( Addr.key a, { norm = 0, stored = v, text = "" } ))) e.vals)
                        , variants = Dict.fromList (List.filterMap (\( n, v ) -> Protocol.variantName v |> Maybe.map (Tuple.pair n)) e.variants)
                    }
            in
            (EnginePage.layout u Kit).every
                |> List.filterMap (\md -> Shared.screen md |> Maybe.map (Tuple.pair md))
                |> Encode.list
                    (\( md, sc ) ->
                        Encode.object
                            [ ( "engine", Encode.string e.name )
                            , ( "title", Encode.string (Shared.title md) )
                            , ( "note", Encode.string (Shared.note md) )
                            , ( "page", Encode.string (Layout.Page.label (Shared.screenPage sc)) )
                            , ( "reads", Encode.list (Addr.key >> Encode.string) (Shared.screenReads sc) )
                            , ( "spec"
                              , EnginePage.screenSpec m u sc
                                    |> Maybe.andThen Screen.spec
                                    |> Maybe.map Screen.encodeSpec
                                    |> Maybe.withDefault Encode.null
                              )
                            ]
                    )

        Nothing ->
            Encode.object [ ( "error", Encode.string ("no engine " ++ e.name) ) ]


model : Model.Model
model =
    Model.init
