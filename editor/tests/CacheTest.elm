-- SPDX-License-Identifier: GPL-3.0-or-later


module CacheTest exposing (suite)

import Cache
import Expect
import Json.Encode as Encode
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Cache: what ports.js answers, decoded strictly"
        [ test "a_hit_is_its_lines" <|
            \_ ->
                Encode.object [ ( "key", Encode.string "4/VA/ab" ), ( "lines", Encode.list Encode.string [ "page 0 VA of 1" ] ) ]
                    |> Cache.decode
                    |> Expect.equal (Just { key = "4/VA/ab", lines = Just [ "page 0 VA of 1" ] })
        , test "a_miss_is_no_lines" <|
            \_ ->
                Encode.object [ ( "key", Encode.string "4/VA/ab" ), ( "lines", Encode.null ) ]
                    |> Cache.decode
                    |> Expect.equal (Just { key = "4/VA/ab", lines = Nothing })
        , describe "lines that are no list of strings are a miss"
            (List.map
                (\( name, lines ) ->
                    test name <|
                        \_ ->
                            Encode.object [ ( "key", Encode.string "4/VA/ab" ), ( "lines", lines ) ]
                                |> Cache.decode
                                |> Expect.equal (Just { key = "4/VA/ab", lines = Nothing })
                )
                [ ( "a_number", Encode.int 3 )
                , ( "a_string", Encode.string "page 0 VA of 1" )
                , ( "a_list_with_a_number", Encode.list identity [ Encode.string "page 0", Encode.int 1 ] )
                , ( "an_object", Encode.object [] )
                ]
            )
        , describe "an answer with no key is no answer"
            (List.map
                (\( name, v ) -> test name <| \_ -> Expect.equal Nothing (Cache.decode v))
                [ ( "null", Encode.null )
                , ( "a_string", Encode.string "4/VA/ab" )
                , ( "no_key", Encode.object [ ( "lines", Encode.null ) ] )
                , ( "a_key_that_is_a_number", Encode.object [ ( "key", Encode.int 4 ), ( "lines", Encode.null ) ] )
                ]
            )
        ]
