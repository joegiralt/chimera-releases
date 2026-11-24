-- SPDX-License-Identifier: GPL-3.0-or-later


module Guide exposing (anchors, parse, render, targets, view)

{-| A chimera-releases Markdown file (a guide, README or a release's
notes), parsed and rendered with every link and image through `Link`.

Raw HTML in the Markdown is cut down to a known set of tags without
attributes (an `img`'s `src` and `alt` and an `a`'s `href` go through
`Link`); an unknown tag keeps its content, and `script`, `link`, `meta`
and the like are dropped whole. So a tag that parsed never fails the
render. Before parsing, void tags are closed and attribute values quoted
(outside code); HTML the parser still can't read is a parse error, which
the guide test fails on.

-}

import Anchor exposing (AnchorId)
import Href
import Html exposing (Html)
import Html.Attributes as Attr
import Link exposing (Link(..))
import Markdown.Block as Block exposing (Block)
import Markdown.Html
import Markdown.Parser
import Markdown.Renderer exposing (Renderer, defaultHtmlRenderer)
import Regex exposing (Regex)
import Route exposing (Base)


parse : String -> Result String (List Block)
parse markdown =
    Markdown.Parser.parse (closeVoidTags markdown)
        |> Result.map (List.filterMap normalize)
        |> Result.mapError (List.map Markdown.Parser.deadEndToString >> String.join "\n")



-- RAW HTML


{-| What the parser needs before it reads raw HTML: a tag that never
closes written `<br />`, and every attribute value in quotes. Code (fenced
blocks of either kind, indented blocks and backtick spans of any length)
is left exactly as written.
-}
closeVoidTags : String -> String
closeVoidTags markdown =
    String.lines markdown
        |> List.foldl step { fence = Nothing, indented = False, blank = True, done = [] }
        |> .done
        |> List.reverse
        |> String.join "\n"


type alias Scan =
    { fence : Maybe ( Char, Int ), indented : Bool, blank : Bool, done : List String }


step : String -> Scan -> Scan
step line scan =
    let
        trimmed : String
        trimmed =
            String.trimLeft line

        indent : Int
        indent =
            String.length (String.replace "\t" "    " (String.left (String.length line - String.length trimmed) line))

        blank : Bool
        blank =
            String.isEmpty trimmed

        kept : Scan -> Scan
        kept s =
            { s | blank = blank, done = line :: s.done }
    in
    case scan.fence of
        Just ( c, n ) ->
            if indent < 4 && run c trimmed >= n && String.isEmpty (String.trim (String.dropLeft (run c trimmed) trimmed)) then
                kept { scan | fence = Nothing }

            else
                kept scan

        Nothing ->
            if indent < 4 && (run '`' trimmed >= 3 || run '~' trimmed >= 3) then
                kept
                    { scan
                        | fence =
                            Just
                                (if run '`' trimmed >= 3 then
                                    ( '`', run '`' trimmed )

                                 else
                                    ( '~', run '~' trimmed )
                                )
                        , indented = False
                    }

            else if blank then
                kept scan

            else if indent >= 4 && (scan.blank || scan.indented) then
                kept { scan | indented = True }

            else
                { scan | indented = False, blank = blank, done = closeInLine line :: scan.done }


{-| How many of `c` the text starts with.
-}
run : Char -> String -> Int
run c text =
    String.length text - String.length (dropWhile c text)


dropWhile : Char -> String -> String
dropWhile c text =
    case String.uncons text of
        Just ( first, rest ) ->
            if first == c then
                dropWhile c rest

            else
                text

        Nothing ->
            text


closeInLine : String -> String
closeInLine line =
    spans line
        |> List.map
            (\( code, text ) ->
                if code then
                    text

                else
                    text |> Regex.replace tagPattern (.match >> Regex.replace unquoted quote) |> Regex.replace voidTag close
            )
        |> String.concat


{-| A line cut into text and code spans (`` `a` ``, ``` ``a`b`` ```): a run
of backticks opens a span the next run of the same length closes; a run
nothing closes is text.
-}
spans : String -> List ( Bool, String )
spans line =
    let
        go : Int -> List Regex.Match -> List ( Bool, String )
        go from runs =
            case runs of
                opening :: rest ->
                    case closer opening rest of
                        Just ( closing, after ) ->
                            ( False, String.slice from opening.index line )
                                :: ( True, String.slice opening.index (closing.index + String.length closing.match) line )
                                :: go (closing.index + String.length closing.match) after

                        Nothing ->
                            go from rest

                [] ->
                    [ ( False, String.dropLeft from line ) ]
    in
    go 0 (Regex.find backticks line)


closer : Regex.Match -> List Regex.Match -> Maybe ( Regex.Match, List Regex.Match )
closer opening runs =
    case runs of
        next :: rest ->
            if String.length next.match == String.length opening.match then
                Just ( next, rest )

            else
                closer opening rest

        [] ->
            Nothing


backticks : Regex
backticks =
    regex "`+"


tagPattern : Regex
tagPattern =
    regex "<[A-Za-z][A-Za-z0-9-]*\\s[^<>]*>"


unquoted : Regex
unquoted =
    regex "(\\s[A-Za-z_:][\\w:.-]*)=([^\\s\"'=<>`]+)"


quote : Regex.Match -> String
quote match =
    case match.submatches of
        [ Just name, Just value ] ->
            name ++ "=\"" ++ value ++ "\""

        _ ->
            match.match


voidTag : Regex
voidTag =
    regex "<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(?=[\\s/>])([^<>]*?)\\s*/?>"


regex : String -> Regex
regex pattern =
    Regex.fromStringWith { caseInsensitive = True, multiline = False } pattern
        |> Maybe.withDefault Regex.never


close : Regex.Match -> String
close match =
    case match.submatches of
        [ Just name, attributes ] ->
            "<" ++ name ++ Maybe.withDefault "" attributes ++ " />"

        _ ->
            match.match


{-| Tags kept as they are (without attributes).
-}
plain : List String
plain =
    [ "details", "summary", "kbd", "sup", "sub", "b", "i", "em", "strong", "code", "small", "u", "s", "del", "ins", "mark", "p", "div", "span", "br", "hr", "ul", "ol", "li", "blockquote", "pre", "table", "thead", "tbody", "tr", "th", "td" ]


{-| Tags dropped with whatever they hold.
-}
dropped : List String
dropped =
    [ "script", "style", "iframe", "object", "embed", "template", "form", "input", "button", "textarea", "select", "noscript", "link", "meta", "base", "col", "colgroup", "area", "param", "source", "track" ]


normalize : Block -> Maybe Block
normalize block =
    case block of
        Block.HtmlBlock html ->
            normalizeHtml "div" html |> Maybe.map Block.HtmlBlock

        Block.UnorderedList spacing items ->
            Just (Block.UnorderedList spacing (List.map (\(Block.ListItem task children) -> Block.ListItem task (List.filterMap normalize children)) items))

        Block.OrderedList spacing start items ->
            Just (Block.OrderedList spacing start (List.map (List.filterMap normalize) items))

        Block.BlockQuote children ->
            Just (Block.BlockQuote (List.filterMap normalize children))

        Block.Heading level inlines ->
            Just (Block.Heading level (List.filterMap normalizeInline inlines))

        Block.Paragraph inlines ->
            Just (Block.Paragraph (List.filterMap normalizeInline inlines))

        Block.Table header rows ->
            Just
                (Block.Table
                    (List.map (\h -> { h | label = List.filterMap normalizeInline h.label }) header)
                    (List.map (List.map (List.filterMap normalizeInline)) rows)
                )

        Block.CodeBlock _ ->
            Just block

        Block.ThematicBreak ->
            Just block


normalizeInline : Block.Inline -> Maybe Block.Inline
normalizeInline inline =
    case inline of
        Block.HtmlInline html ->
            normalizeHtml "span" html |> Maybe.map Block.HtmlInline

        Block.Link dest title children ->
            Just (Block.Link dest title (List.filterMap normalizeInline children))

        Block.Image src title children ->
            Just (Block.Image src title (List.filterMap normalizeInline children))

        Block.Emphasis children ->
            Just (Block.Emphasis (List.filterMap normalizeInline children))

        Block.Strong children ->
            Just (Block.Strong (List.filterMap normalizeInline children))

        Block.Strikethrough children ->
            Just (Block.Strikethrough (List.filterMap normalizeInline children))

        Block.CodeSpan _ ->
            Just inline

        Block.Text _ ->
            Just inline

        Block.HardLineBreak ->
            Just inline


{-| A known tag stays; an unknown one becomes `wrapper` around its
content; a dropped one goes; comments and the like go.
-}
normalizeHtml : String -> Block.Html Block -> Maybe (Block.Html Block)
normalizeHtml wrapper html =
    case html of
        Block.HtmlElement name attributes children ->
            let
                tag : String
                tag =
                    String.toLower name
            in
            if List.member tag dropped then
                Nothing

            else
                Just (keep wrapper tag attributes (List.filterMap normalize children))

        Block.HtmlComment _ ->
            Nothing

        Block.ProcessingInstruction _ ->
            Nothing

        Block.HtmlDeclaration _ _ ->
            Nothing

        Block.Cdata _ ->
            Nothing


keep : String -> String -> List Block.HtmlAttribute -> List Block -> Block.Html Block
keep wrapper tag attributes kept =
    if tag == "img" then
        Block.HtmlElement tag (List.filter (\a -> List.member (String.toLower a.name) [ "src", "alt" ]) attributes) kept

    else if tag == "a" then
        Block.HtmlElement tag (List.filter (\a -> String.toLower a.name == "href") attributes) kept

    else if List.member tag plain then
        Block.HtmlElement tag [] kept

    else
        Block.HtmlElement wrapper [] kept


attribute : String -> List Block.HtmlAttribute -> Maybe String
attribute name =
    List.filter (\a -> String.toLower a.name == name) >> List.head >> Maybe.map .value



-- WALKING THE BLOCKS


{-| Every link and image (Markdown or raw HTML), resolved, in reading order.
-}
targets : List Block -> List Link
targets =
    List.concatMap blockTargets


blockTargets : Block -> List Link
blockTargets block =
    case block of
        Block.HtmlBlock html ->
            htmlTargets html

        Block.UnorderedList _ items ->
            List.concatMap (\(Block.ListItem _ children) -> targets children) items

        Block.OrderedList _ _ items ->
            List.concatMap targets items

        Block.BlockQuote children ->
            targets children

        Block.Heading _ inlines ->
            List.concatMap inlineTargets inlines

        Block.Paragraph inlines ->
            List.concatMap inlineTargets inlines

        Block.Table header rows ->
            List.concatMap (.label >> List.concatMap inlineTargets) header
                ++ List.concatMap (List.concatMap (List.concatMap inlineTargets)) rows

        Block.CodeBlock _ ->
            []

        Block.ThematicBreak ->
            []


inlineTargets : Block.Inline -> List Link
inlineTargets inline =
    case inline of
        Block.HtmlInline html ->
            htmlTargets html

        Block.Link dest _ children ->
            Link.link dest :: List.concatMap inlineTargets children

        Block.Image src _ _ ->
            [ Link.image src ]

        Block.Emphasis children ->
            List.concatMap inlineTargets children

        Block.Strong children ->
            List.concatMap inlineTargets children

        Block.Strikethrough children ->
            List.concatMap inlineTargets children

        Block.CodeSpan _ ->
            []

        Block.Text _ ->
            []

        Block.HardLineBreak ->
            []


htmlTargets : Block.Html Block -> List Link
htmlTargets html =
    case html of
        Block.HtmlElement tag attributes children ->
            (case ( tag, attribute "src" attributes, attribute "href" attributes ) of
                ( "img", Just src, _ ) ->
                    [ Link.image src ]

                ( "a", _, Just href ) ->
                    [ Link.link href ]

                _ ->
                    []
            )
                ++ targets children

        Block.HtmlComment _ ->
            []

        Block.ProcessingInstruction _ ->
            []

        Block.HtmlDeclaration _ _ ->
            []

        Block.Cdata _ ->
            []


{-| The heading ids `view` gives, in order: GitHub's, with `-1`, `-2` for
a repeat. A heading inside a list or quote gets its plain slug.
-}
anchors : List Block -> List AnchorId
anchors blocks =
    List.filterMap Tuple.second (withIds blocks)
        ++ (Block.foldl (\block acc -> (headingText block |> Maybe.map Anchor.fromHeading |> Maybe.map List.singleton |> Maybe.withDefault []) ++ acc)
                []
                (List.filter (headingText >> (==) Nothing) blocks)
                |> List.reverse
           )


headingText : Block -> Maybe String
headingText block =
    case block of
        Block.Heading _ inlines ->
            Just (Block.extractInlineText inlines)

        Block.HtmlBlock _ ->
            Nothing

        Block.UnorderedList _ _ ->
            Nothing

        Block.OrderedList _ _ _ ->
            Nothing

        Block.BlockQuote _ ->
            Nothing

        Block.Paragraph _ ->
            Nothing

        Block.Table _ _ ->
            Nothing

        Block.CodeBlock _ ->
            Nothing

        Block.ThematicBreak ->
            Nothing


{-| Each top-level block with its heading's id, if it is a heading.
-}
withIds : List Block -> List ( Block, Maybe AnchorId )
withIds blocks =
    List.foldl
        (\block ( ids, out ) ->
            case ( headingText block, ids ) of
                ( Just _, id :: rest ) ->
                    ( rest, ( block, Just id ) :: out )

                ( Just _, [] ) ->
                    ( ids, ( block, Nothing ) :: out )

                ( Nothing, _ ) ->
                    ( ids, ( block, Nothing ) :: out )
        )
        ( Anchor.unique (List.map Anchor.fromHeading (List.filterMap headingText blocks)), [] )
        blocks
        |> Tuple.second
        |> List.reverse



-- RENDERING


{-| A test renders every doc and every release's notes with this.
-}
render : Base -> List Block -> Result String (List (Html msg))
render base blocks =
    Markdown.Renderer.renderWithMeta (renderer base) (withIds blocks)


view : Base -> List Block -> List (Html msg)
view base blocks =
    case render base blocks of
        Ok html ->
            html

        Err e ->
            [ Html.p [ Attr.class "problem" ] [ Html.text ("This page could not be shown: " ++ e) ] ]


renderer : Base -> Maybe AnchorId -> Renderer (Html msg)
renderer base id =
    { defaultHtmlRenderer
        | heading =
            \{ level, rawText, children } ->
                let
                    tag : List (Html.Attribute msg) -> List (Html msg) -> Html msg
                    tag =
                        case level of
                            Block.H1 ->
                                Html.h1

                            Block.H2 ->
                                Html.h2

                            Block.H3 ->
                                Html.h3

                            Block.H4 ->
                                Html.h4

                            Block.H5 ->
                                Html.h5

                            Block.H6 ->
                                Html.h6
                in
                tag [ Attr.id (Anchor.toString (Maybe.withDefault (Anchor.fromHeading rawText) id)) ] children
        , link = \{ destination } -> link base (Link.link destination)
        , image = \{ alt, src } -> image base alt src
        , html =
            -- oneOf tries the last first: the attribute-reading ones go last.
            Markdown.Html.oneOf
                (List.map (\t -> Markdown.Html.tag t (Html.node t [])) plain
                    ++ [ Markdown.Html.tag "a" (Html.span [])
                       , Markdown.Html.tag "img" (\_ -> Html.text "")
                       , Markdown.Html.tag "a" (\href -> link base (Link.link href))
                            |> Markdown.Html.withAttribute "href"
                       , Markdown.Html.tag "img" (\src alt _ -> image base (Maybe.withDefault "" alt) src)
                            |> Markdown.Html.withAttribute "src"
                            |> Markdown.Html.withOptionalAttribute "alt"
                       ]
                )
        , table = Html.div [ Attr.class "table" ] << List.singleton << Html.table []
    }


link : Base -> Link -> List (Html msg) -> Html msg
link base target children =
    case Link.href base target of
        Just href ->
            Html.a (Attr.href (Href.toString href) :: external target) children

        Nothing ->
            Html.span [ Attr.class "unresolved" ] children


image : Base -> String -> String -> Html msg
image base alt src =
    case Link.href base (Link.image src) of
        Just href ->
            Html.img [ Attr.src (Href.toString href), Attr.alt alt, Attr.attribute "loading" "lazy" ] []

        Nothing ->
            Html.text alt


external : Link -> List (Html.Attribute msg)
external target =
    case target of
        External _ ->
            [ Attr.rel "noopener" ]

        Page _ _ ->
            []

        InPage _ ->
            []

        File _ ->
            []

        Unresolved _ ->
            []
