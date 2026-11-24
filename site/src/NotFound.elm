-- SPDX-License-Identifier: GPL-3.0-or-later


module NotFound exposing (alt, view)

{-| The page for an address the site has no page at.
-}

import Href
import Html exposing (Html)
import Html.Attributes as Attr
import King
import Route exposing (Base, Route(..))


{-| The figure's description, for a screen reader.
-}
alt : String
alt =
    "Hastur, the King in Yellow: a round cartoon figure in a tattered yellow robe, no face under his hood, shrugging with both hands up."


view : Base -> List (Html msg)
view base =
    [ Html.div [ Attr.class "lost" ]
        [ King.view alt
        , Html.div []
            [ Html.h1 [] [ Html.text "Uh-oh." ]
            , Html.p [ Attr.class "lede" ] [ Html.text "The thing you're looking for can't be found." ]
            , Html.p [] [ Html.text "The King in Yellow has looked everywhere, even in Carcosa. It isn't there either." ]
            , Html.p [ Attr.class "ways" ]
                [ Html.a [ Attr.href (Href.toString (Route.href base Home)) ] [ Html.text "Back to the start" ]
                , Html.a [ Attr.href (Href.toString (Route.href base Guides)) ] [ Html.text "Browse the guides" ]
                ]
            ]
        ]
    ]
