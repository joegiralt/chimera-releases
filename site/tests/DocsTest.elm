-- SPDX-License-Identifier: GPL-3.0-or-later


module DocsTest exposing (suite)

import Doc exposing (Doc(..))
import Docs
import Expect
import GuideId exposing (GuideId(..))
import Http
import Remote exposing (Remote(..))
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Docs"
        [ test "nothing is requested at first" <|
            \_ ->
                List.map (\d -> Docs.get d Docs.empty) Doc.all
                    |> Expect.equal (List.map (\_ -> Nothing) Doc.all)
        , test "each doc keeps its own state" <|
            \_ ->
                Docs.empty
                    |> Docs.set Readme (Just Loading)
                    |> Docs.set (GuideDoc Midi) (Just (Loaded (Ok [])))
                    |> (\docs -> List.map (\d -> Docs.get d docs) [ Readme, GuideDoc Midi, GuideDoc Nrpn ])
                    |> Expect.equal [ Just Loading, Just (Loaded (Ok [])), Nothing ]
        , test "fetched when never requested or failed, not while loading or loaded" <|
            \_ ->
                List.map (\slot -> Docs.needsFetch Readme (Docs.set Readme slot Docs.empty))
                    [ Nothing, Just Loading, Just (Failed Http.NetworkError), Just (Loaded (Ok [])), Just (Loaded (Err "bad")) ]
                    |> Expect.equal [ True, False, True, False, False ]
        , test "a doc can go back to never requested" <|
            \_ ->
                Docs.empty
                    |> Docs.set Readme (Just Loading)
                    |> Docs.set Readme Nothing
                    |> Docs.get Readme
                    |> Expect.equal Nothing
        ]
