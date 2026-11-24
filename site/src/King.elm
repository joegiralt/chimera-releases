-- SPDX-License-Identifier: GPL-3.0-or-later


module King exposing (view)

{-| Hastur, the King in Yellow (Robert W. Chambers, 1895, public domain),
as a round cartoon: a big hood with nothing under it, a tattered robe with
the Yellow Sign on the chest, both hands up in a sheepish shrug, a bead of
sweat. Drawn for this site; its colours are the site's tokens (`.king` in
style.css), so it follows the page's theme.
-}

import Html.Attributes
import Sign
import Svg exposing (Svg)
import Svg.Attributes as A


{-| The figure, `alt` its description for a screen reader.
-}
view : String -> Svg msg
view alt =
    Svg.svg
        [ A.viewBox "0 0 260 250"
        , A.class "king"
        , Html.Attributes.attribute "role" "img"
        , Html.Attributes.attribute "aria-label" alt
        ]
        [ Svg.title [] [ Svg.text alt ]

        -- The floor's shadow.
        , Svg.ellipse [ A.class "floor", A.cx "130", A.cy "236", A.rx "70", A.ry "9" ] []

        -- The robe: a round bell, its hem in scallops.
        , path "robe" "M96 120 C80 150 66 190 62 222 Q70 232 78 224 Q86 236 96 226 Q106 238 116 228 Q126 240 136 229 Q146 239 156 228 Q166 238 175 226 Q185 235 192 223 Q199 230 200 220 C196 188 182 150 164 120 Z"
        , path "fold" "M100 140 C92 170 86 200 84 226 Q90 231 96 226 C98 200 104 170 110 142 Z"
        , path "fold" "M160 140 C168 170 174 200 176 226 Q170 231 165 228 C163 200 158 170 151 142 Z"

        -- The Yellow Sign on his chest.
        , Svg.g [ A.transform "translate(112 150) scale(0.1875)" ]
            [ Svg.circle [ A.class "robe", A.cx "96", A.cy "96", A.r "96" ] []
            , Svg.path [ A.class "void", A.fillRule "evenodd", A.d Sign.d ] []
            ]

        -- A patch, and a tear.
        , path "shade" "M150 200 l12 -2 l2 11 l-12 2 Z"
        , path "void" "M92 214 l4 10 l-7 -2 Z"

        -- The sleeves, up and out.
        , path "robe" "M102 128 C84 128 66 120 56 104 C52 97 60 90 67 95 C76 104 88 108 100 108 Z"
        , path "shade" "M56 104 C52 97 60 90 67 95 L70 99 C64 100 60 103 58 107 Z"
        , path "robe" "M158 128 C176 128 194 120 204 104 C208 97 200 90 193 95 C184 104 172 108 160 108 Z"
        , path "shade" "M204 104 C208 97 200 90 193 95 L190 99 C196 100 200 103 202 107 Z"

        -- The hands, palms up.
        , hand "translate(54 94) rotate(-62)"
        , hand "translate(206 94) rotate(62) scale(-1 1)"

        -- The big round hood, tipped a little: sheepish. Nothing under it.
        , Svg.g [ A.transform "rotate(-7 130 86)" ]
            [ path "robe" "M130 28 C96 28 78 56 78 86 C78 112 96 132 130 132 C164 132 182 112 182 86 C182 56 164 28 130 28 Z"
            , path "robe" "M128 30 C134 18 146 12 156 14 C150 20 146 26 146 34 Z"
            , path "void" "M130 56 C108 56 98 72 98 90 C98 108 112 118 130 118 C148 118 162 108 162 90 C162 72 152 56 130 56 Z"
            , path "rim" "M130 56 C108 56 98 72 98 90 L102 90 C102 74 112 62 130 62 C148 62 158 74 158 90 L162 90 C162 72 152 56 130 56 Z"
            ]

        -- A bead of sweat, and the shrug's marks.
        , path "hand sweat" "M184 40 C180 48 178 52 180 55 C182 58 187 58 188 54 C189 51 187 47 184 40 Z"
        , path "marks" "M38 70 l-8 -6 M44 64 l-3 -9 M222 70 l8 -6 M216 64 l3 -9"
        ]


path : String -> String -> Svg msg
path class d =
    Svg.path [ A.class class, A.d d ] []


{-| A round palm and four stubby fingers, drawn at the origin.
-}
hand : String -> Svg msg
hand at =
    let
        finger : String -> String -> String -> String -> Svg msg
        finger x y h turn =
            Svg.rect [ A.x x, A.y y, A.width "5", A.height h, A.rx "2.5", A.transform turn ] []
    in
    Svg.g [ A.class "hand", A.transform at ]
        [ Svg.ellipse [ A.cx "0", A.cy "0", A.rx "10", A.ry "8" ] []
        , finger "-9" "-17" "12" ""
        , finger "-3.5" "-19" "13" ""
        , finger "2" "-17.5" "12" ""
        , finger "7" "-12" "9" "rotate(25 9 -8)"
        ]
