-- SPDX-License-Identifier: GPL-3.0-or-later


module RouteTest exposing (suite)

import Chapter
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
    [ Home, Install, Guides, Manual, Releases, Editor ] ++ List.map Guide GuideId.all ++ List.map Chapter Chapter.all


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
        , test "the router lists every page, once, NotFound not among them" <|
            \_ ->
                List.map (Route.toString (Route.base "/")) Route.all
                    |> List.sort
                    |> Expect.equal (List.sort (List.map (Route.toString (Route.base "/")) routes))
        , test "known paths" <|
            \_ ->
                List.map parseRoot [ "/", "/install", "/guides", "/guides/midi", "/releases", "/sound-editor" ]
                    |> Expect.equal [ Home, Install, Guides, Guide GuideId.Midi, Releases, Editor ]
        , test "the manual's pages" <|
            \_ ->
                List.map parseRoot [ "/manual/preenfm3/0.4/", "/manual/preenfm3/0.4/01-concepts/", "/manual/preenfm3/0.4/03-algo" ]
                    |> Expect.equal (Manual :: List.filterMap (Chapter.fromSlug >> Maybe.map Chapter) [ "01-concepts", "03-algo" ])
        , test "the manual's paths end in a slash, as pages.js writes them" <|
            \_ ->
                List.map (Route.toString (Route.base "/chimera-releases/")) (Manual :: List.filterMap (Chapter.fromSlug >> Maybe.map Chapter) [ "01-concepts" ])
                    |> Expect.equal [ "/chimera-releases/manual/preenfm3/0.4/", "/chimera-releases/manual/preenfm3/0.4/01-concepts/" ]
        , test "a trailing slash is the same page" <|
            \_ ->
                List.map parseRoot [ "/install/", "/guides/faq/" ]
                    |> Expect.equal [ Install, Guide GuideId.Faq ]
        , test "unknown paths are NotFound" <|
            \_ ->
                List.map parseRoot [ "/nope", "/guides/readme", "/guides/faq/x", "/editor/", "/guides/img/a.png", "/manual/preenfm3/0.4/nope", "/manual/preenfm3/0.3/" ]
                    |> Expect.equal (List.repeat 7 NotFound)
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
