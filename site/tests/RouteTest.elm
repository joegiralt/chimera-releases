-- SPDX-License-Identifier: GPL-3.0-or-later


module RouteTest exposing (suite)

import Expect
import GuideId
import Route exposing (Route(..))
import Test exposing (Test, describe, test)
import Url exposing (Url)


bases : List Route.Base
bases =
    [ Route.base "/", Route.base "/chimera-releases/", Route.base "chimera-releases" ]


routes : List Route
routes =
    [ Home, Install, Guides, Releases, Editor ] ++ List.map Guide GuideId.all


url : String -> Url
url path =
    { protocol = Url.Https
    , host = "example.org"
    , port_ = Nothing
    , path = path
    , query = Nothing
    , fragment = Nothing
    }


parseRoot : String -> Route
parseRoot =
    url >> Route.parse (Route.base "/")


suite : Test
suite =
    describe "Route"
        [ test "every route round-trips under every base" <|
            \_ ->
                List.concatMap (\b -> List.map (Route.toString b >> url >> Route.parse b) routes) bases
                    |> Expect.equal (List.concat (List.repeat (List.length bases) routes))
        , test "known paths" <|
            \_ ->
                List.map parseRoot [ "/", "/install", "/guides", "/guides/midi", "/releases", "/sound-editor" ]
                    |> Expect.equal [ Home, Install, Guides, Guide GuideId.Midi, Releases, Editor ]
        , test "a trailing slash is the same page" <|
            \_ ->
                List.map parseRoot [ "/install/", "/guides/faq/" ]
                    |> Expect.equal [ Install, Guide GuideId.Faq ]
        , test "unknown paths are NotFound" <|
            \_ ->
                List.map parseRoot [ "/nope", "/guides/readme", "/guides/faq/x", "/editor/", "/guides/img/a.png" ]
                    |> Expect.equal (List.repeat 5 NotFound)
        , test "NotFound's path parses back to NotFound" <|
            \_ ->
                parseRoot (Route.toString (Route.base "/") NotFound)
                    |> Expect.equal NotFound
        , test "the base is stripped, and a path outside it is NotFound" <|
            \_ ->
                List.map (url >> Route.parse (Route.base "/chimera-releases/")) [ "/chimera-releases/", "/chimera-releases/install", "/install" ]
                    |> Expect.equal [ Home, Install, NotFound ]
        , test "paths under the base" <|
            \_ ->
                ( Route.toString (Route.base "/chimera-releases/") (Guide GuideId.Faq)
                , Route.toString (Route.base "/chimera-releases/") Home
                , Route.toString (Route.base "/") Home
                )
                    |> Expect.equal ( "/chimera-releases/guides/faq", "/chimera-releases/", "/" )
        ]
