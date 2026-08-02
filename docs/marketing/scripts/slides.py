# -*- coding: utf-8 -*-
"""Render one campaign slide onto one canvas.

Every slide type must survive every canvas — a 1200x627 LinkedIn banner is
half the height of a carousel page, so sizes are derived from the canvas
rather than fixed. This is what lets one campaign.json feed all formats.
"""
import warnings

from PIL import Image, ImageDraw

import brand
from spec import Campaign

# The aspect ratio of the 1080x1350 carousel canvas every proportion below
# was tuned against. Named so `_layout`'s width/height trade-off can't drift
# out of sync with the canvas it was actually validated on.
_REFERENCE_ASPECT = 1080 / 1350

# Fraction of canvas height reserved for the footer band (brand.footer's
# domain label plus breathing room). Nothing drawn by a renderer may end up
# below `height - height * _FOOTER_RESERVE`.
_FOOTER_RESERVE = 0.14

# Below this shrink factor, type would read as an afterthought rather than a
# deliberate small size — better to accept a slide that (rarely, only for
# copy far longer than any real campaign) sits closer to the footer band
# than to keep shrinking indefinitely.
_MIN_SHRINK = 0.55

# Smallest browser-frame height worth drawing at all; below this even a
# maximally shrunk frame would be an unrecognisable sliver.
_MIN_DIAGRAM_HEIGHT = 50

# --- `tall-diagram` proportions -------------------------------------------
#
# A tall visual is bound by height, never by width: a capture with aspect a
# placed in H px of height comes out a*H wide, so every pixel of height the
# header or the footer band takes costs a*1 px of width — and, because the
# capture scales as a whole, that many px of the node labels inside it too.
# The constants below therefore all exist to buy height back.

# Clearance this slide type leaves between the bottom of its visual and the
# footer's first ink row, in place of `_FOOTER_RESERVE`'s flat 14% of canvas
# height. The flat reserve is deliberately generous — it bottoms out at
# y=1161 on 1080x1350 while `brand.footer_top` puts the first footer pixel at
# y=1284 — and 123 px of empty canvas is a price a paragraph can afford and a
# tall picture cannot: at aspect 0.625 it is 77 px of frame width. Asking
# `brand.footer_top` where the footer actually is and leaving a real gap is
# both tighter and more honest than a second magic fraction, and a framed
# image can sit closer to the footer than a paragraph can without the page
# reading as crowded, because the frame draws its own edge.
_TALL_FOOTER_GAP = 0.025

# Gap between the bottom of the compact header and the top of the frame.
_TALL_HEADER_GAP = 0.015

# Side margin for the visual only, as a fraction of `_layout`'s `base_scale`.
# Narrower than the 0.085 text margin on purpose: that margin exists so every
# slide in a swipeable deck starts its *type* at the same x, and an image is
# not type. On 1080 canvases it widens the box a visual may occupy from
# 898 px to 1006 px — 12% more scale, and therefore 12% larger glyphs, for
# any capture whose aspect makes width rather than height the binding
# constraint. Measured: the accounting-ai graph cropped to its agent loop
# (960x1260) goes from 898 px to 1006 px wide at 1080x1920, and its node
# labels from 22 px to 25 px.
_TALL_VISUAL_MARGIN = 0.035

# How tall a line of the site's own body-size text is, in source pixels, in
# any screenshot this factory takes. Every capture goes through
# `capture_screens.py` at `device_scale_factor=2`, so ~16 px CSS type always
# lands as a ~24-30 px ink band — measured on both captures this repo holds:
# 28 px for every row of campaign one's calculator table (which carries
# descenders), 23-24 px for the LangGraph node labels that do not and 30 px
# for the ones that do.
_CAPTURE_INK_BAND = (24, 30)

# Below this source-pixels-to-slide-pixels scale, a capture taken by this
# factory is no longer readable.
#
# Anchored to this project's own ruling rather than to a fresh opinion: Task
# 9 rejected `.calc` at 0.293x ("~8.2 px, illegible") and accepted
# `.calc-table-wrap` at 0.670x and 0.572x ("~18.8 px" and "~16.0 px"). Those
# glyph numbers are that capture's 28 px ink bands times the scale, so the
# accepted floor is 16/28 = 0.571.
#
# It is one threshold for every source because `_CAPTURE_INK_BAND` is the
# same in every source. It is still a proxy, and it fails in both directions:
# a capture of something typeset much larger than body copy (a hero heading,
# a chart title) stays readable below it and gets warned about anyway, and a
# capture of something smaller is unreadable at it without a word said. For
# the five product `flowchart TD` graphs this slide type exists to carry, it
# is the right ruler.
_TALL_MIN_SCALE = 0.57

# A `numbers` row's separator line, and the vertical step to the next row,
# as multiples of the row font's nominal size. Measured (via textbbox, at
# sizes 18-45) that a label's descenders — the "p"/"g" in a model name —
# reach roughly 1.31-1.33x the font size below its draw origin; the line
# factor clears that with a couple of px to spare, and the row-height factor
# leaves a further gap before the next row's own top-bearing so the rule
# reads as a separator between rows rather than a strike-through of the row
# above it.
_LINE_Y_FACTOR = 1.4
_ROW_HEIGHT_FACTOR = 1.6


def _layout(size: tuple[int, int], shrink: float = 1.0) -> dict:
    width, height = size
    # Font sizes were tuned against the 1080x1350 carousel page (aspect ratio
    # _REFERENCE_ASPECT) and scale off canvas *width* below. That is safe on
    # a tall canvas, but a short/wide one — the 1200x627 LinkedIn banner or
    # the 1200x630 OG card (aspect ~1.9) — has far less vertical budget per
    # unit of width, so naive width-driven sizing eats into that budget fast.
    # Scaling off the smaller of the actual width and a width *equivalent to
    # the reference aspect ratio* derived from height keeps the proven
    # proportions untouched on tall canvases while raising the amount of
    # copy a short canvas can carry before it needs to shrink further.
    #
    # `base_scale` depends only on the canvas — never on this slide's copy —
    # so `margin`/`content_width` (and therefore the left edge every slide
    # at this canvas draws from) stay identical across slides regardless of
    # how much any one of them needs to shrink its type. `shrink` is an
    # additional multiplier applied only to font sizes: `_fit_box` reduces
    # it to make a specific slide's actual (possibly much longer) copy fit
    # vertically, without moving where anything *starts* horizontally — a
    # carousel deck built from slides of varying copy length must still line
    # up down the page.
    base_scale = min(width, height / _REFERENCE_ASPECT)
    scale = base_scale * shrink
    margin = int(base_scale * 0.085)
    return {
        "margin": margin,
        "content_width": width - margin * 2,
        "eyebrow": brand.body(max(int(scale * 0.026), 15), "semibold"),
        "title": brand.heading(max(int(scale * 0.072), 30)),
        "sub": brand.body(max(int(scale * 0.034), 17)),
        "huge": brand.heading(max(int(scale * 0.165), 60)),
        "row": brand.body(max(int(scale * 0.038), 18), "semibold"),
        "top": int(height * 0.17),
        # `tall-diagram` only. Its header starts as high as the badge allows
        # rather than at `top`'s comfortable 0.17 of the canvas (229 px on
        # 1080x1350 against 118 px here), and sets its headline and its
        # optional caption smaller than `title`/`sub` — every one of those
        # px is a px of visual. Kept here with the rest of the per-canvas
        # sizes so there is still exactly one place a proportion is written
        # down; `_plan_tall_diagram` owns the spacing between them.
        "tall_top": brand.badge_bottom(width) + int(height * 0.018),
        "tall_title": brand.heading(max(int(scale * 0.052), 26)),
        "tall_caption": brand.body(max(int(scale * 0.024), 14)),
        "visual_width": width - int(base_scale * _TALL_VISUAL_MARGIN) * 2,
    }


# --- draw plans -----------------------------------------------------------
#
# Each `_plan_*` function below computes a slide's layout exactly once, as a
# list of positioned draw operations plus the bottom y the content reaches.
# `_fit_box` uses the *same* function, at successively smaller `shrink`
# values, purely to read off that bottom y — "measuring" is just not
# executing the ops yet. `render()` then executes the ops the fitting loop
# already settled on. There is deliberately no second, parallel arithmetic
# path here: a spacing factor (1.25, 1.45, 0.6, 2.1, 1.15, 0.2, 0.9, 1.1)
# appears exactly once, in the plan function that owns it, so a draw
# function and a "measure" function can never quietly drift apart.

def _text_op(xy, s, font, fill):
    return ("text", xy, s, font, fill)


def _line_op(p1, p2, fill, width):
    return ("line", p1, p2, fill, width)


def _pill_op(xy, s, font):
    return ("pill", xy, s, font)


def _execute(img: Image.Image, ops: list) -> None:
    draw = ImageDraw.Draw(img)
    for op in ops:
        kind = op[0]
        if kind == "text":
            _, xy, s, font, fill = op
            draw.text(xy, s, font=font, fill=fill)
        elif kind == "line":
            _, p1, p2, fill, width = op
            draw.line([p1, p2], fill=fill, width=width)
        elif kind == "pill":
            _, xy, s, font = op
            brand.pill(img, xy, s, font)
        else:
            raise ValueError(f"slides: unknown draw op {kind!r}")


def _plan_header(box, text: dict):
    ops = []
    y = box["top"]
    if text.get("eyebrow"):
        ops.append(_text_op((box["margin"], y), text["eyebrow"].upper(),
                            box["eyebrow"], brand.ORANGE_LIGHT))
        y += int(box["eyebrow"].size * 2.1)
    if text.get("headline"):
        for line in brand.wrap(text["headline"], box["title"], box["content_width"]):
            ops.append(_text_op((box["margin"], y), line, box["title"], brand.WHITE))
            y += int(box["title"].size * 1.25)
    return ops, y


def _plan_sub(box, text: dict, y: int):
    if not text.get("sub"):
        return [], y
    ops = []
    y += int(box["sub"].size * 0.6)
    for line in brand.wrap(text["sub"], box["sub"], box["content_width"]):
        ops.append(_text_op((box["margin"], y), line, box["sub"], brand.MUTED))
        y += int(box["sub"].size * 1.45)
    return ops, y


def _plan_hook(box, slide, text):
    ops, y = _plan_header(box, text)
    if slide.get("bigNumber"):
        y += int(box["huge"].size * 0.2)
        ops.append(_text_op((box["margin"], y), slide["bigNumber"], box["huge"], brand.ORANGE))
        y += int(box["huge"].size * 1.15)
    sub_ops, y = _plan_sub(box, text, y)
    return ops + sub_ops, y


def _plan_problem(box, slide, text):
    ops, y = _plan_header(box, text)
    sub_ops, y = _plan_sub(box, text, y)
    return ops + sub_ops, y


def _plan_numbers(box, slide, text):
    # Per-language rows win over slide-level rows: this keeps a language-
    # neutral table (model names, dollar amounts) simple at the slide level
    # while letting localised labels (e.g. "Staly prefiks" vs "Fixed prefix")
    # live per language instead of being crammed onto one bilingual line.
    ops, y = _plan_header(box, text)
    sub_ops, y = _plan_sub(box, text, y)
    ops += sub_ops
    rows = text.get("rows") or slide.get("rows", [])
    y += int(box["row"].size * 0.9)
    right = box["margin"] + box["content_width"]
    row_height = int(box["row"].size * _ROW_HEIGHT_FACTOR)
    for label, value in rows:
        ops.append(_text_op((box["margin"], y), str(label), box["row"], brand.MUTED))
        value_width = box["row"].getlength(str(value))
        ops.append(_text_op((right - value_width, y), str(value), box["row"], brand.ORANGE_LIGHT))
        # A label's descenders (the "p"/"g" in a model name) sit at roughly
        # 1.31-1.33x the font's nominal size below its draw origin, fairly
        # consistently across sizes — measured directly via textbbox, not
        # eyeballed. `_LINE_Y_FACTOR` clears that with a couple of px to
        # spare; `_ROW_HEIGHT_FACTOR` then leaves a further gap before the
        # next row's own top-bearing, so the rule reads as a separator
        # between rows rather than a strike-through of the row above it.
        line_y = y + int(box["row"].size * _LINE_Y_FACTOR)
        ops.append(_line_op((box["margin"], line_y), (right, line_y), brand.NAVY, 2))
        y += row_height
    return ops, y


def _plan_diagram(box, slide, text):
    # The screenshot itself is placed separately by `_place_diagram_frame`,
    # after the fitting loop below has settled on a box — it fits into (or,
    # at worst, warns about not fitting into) whatever room is left below
    # this plan's `y`, rather than being part of the fitted plan itself.
    ops, y = _plan_header(box, text)
    sub_ops, y = _plan_sub(box, text, y)
    return ops + sub_ops, y


def _plan_tall_diagram(box, slide, text):
    """A label, not a paragraph — the picture is the argument on this slide.

    `_plan_diagram` gives its header the full `top` inset, the full-size
    `title`, and a `sub` at 36 px with 1.45 leading, then hands whatever is
    left to the screenshot. That is the right trade for a wide, low visual,
    where the leftovers are still wider than the header. It is the wrong one
    for a tall visual, where the visual's *width* is its leftover height
    times its aspect ratio, so the header is spending width it cannot see.

    Measured on 1080x1350 with the real accounting-ai capture (1600x2560,
    aspect 0.625) and one mid-funnel eyebrow/headline/sub: the same slide
    draws a 273 px frame as `diagram` — `strategy.md`'s measured 271 px, and
    the reason this type exists — and a 532 px frame here. The header is the
    whole difference: the eyebrow starts at 118 px instead of 229, the
    headline is 56 px instead of 77 at 1.2 leading instead of 1.25, and the
    sub is set as a 25 px caption at 1.3 instead of a 36 px paragraph at
    1.45.

    `sub` is kept rather than dropped — a campaign that wants one line of
    context under the headline should not have to smuggle it into the
    headline — but at the caption size, and it is charged for: every line of
    it comes straight off the visual, and `_place_tall_frame` warns when what
    is left is too small to read.
    """
    ops = []
    y = box["tall_top"]
    if text.get("eyebrow"):
        ops.append(_text_op((box["margin"], y), text["eyebrow"].upper(),
                            box["eyebrow"], brand.ORANGE_LIGHT))
        y += int(box["eyebrow"].size * 1.9)
    if text.get("headline"):
        for line in brand.wrap(text["headline"], box["tall_title"],
                               box["content_width"]):
            ops.append(_text_op((box["margin"], y), line, box["tall_title"],
                                brand.WHITE))
            y += int(box["tall_title"].size * 1.2)
    if text.get("sub"):
        y += int(box["tall_caption"].size * 0.5)
        for line in brand.wrap(text["sub"], box["tall_caption"],
                               box["content_width"]):
            ops.append(_text_op((box["margin"], y), line, box["tall_caption"],
                                brand.MUTED))
            y += int(box["tall_caption"].size * 1.3)
    return ops, y


def _plan_cta(box, slide, text):
    ops, y = _plan_header(box, text)
    sub_ops, y = _plan_sub(box, text, y)
    ops += sub_ops
    y += int(box["row"].size * 1.1)
    ops.append(_pill_op((box["margin"], y), brand.CONTACT, box["row"]))
    y += brand.pill_height(box["row"])
    return ops, y


_PLANNERS = {
    "hook": _plan_hook,
    "problem": _plan_problem,
    "numbers": _plan_numbers,
    "diagram": _plan_diagram,
    "tall-diagram": _plan_tall_diagram,
    "cta": _plan_cta,
}


def _fit_box(size: tuple[int, int], slide: dict, text: dict):
    """The largest `_layout` box (i.e. the least amount of font shrinking)
    whose planned content stays clear of the footer band for this slide's
    actual copy, plus the plan itself (so `render()` never has to compute it
    a second time). Tall canvases (1080x1350, 1080x1920) have enough
    vertical budget that most realistic copy needs no shrinking at all, but
    that is not a hard guarantee — e.g. a hook slide with a ~92-char headline
    and a ~175-char sub (this module's own `LONG_PL` test fixture) already
    drops 1080x1350's title font from 77px to 69px (shrink ~0.9). Below
    `_MIN_SHRINK`, further iterations stop changing anything (every font
    size is already at its floor), so if the plan still doesn't fit at that
    point, warn instead of returning a box that quietly overflows the
    footer with no signal."""
    width, height = size
    max_bottom = height - int(height * _FOOTER_RESERVE)
    plan = _PLANNERS[slide["type"]]
    shrink = 1.0
    box = _layout(size, shrink)
    ops, y = plan(box, slide, text)
    while y > max_bottom and shrink > _MIN_SHRINK:
        shrink = round(shrink - 0.05, 2)
        box = _layout(size, shrink)
        ops, y = plan(box, slide, text)
    if y > max_bottom:
        warnings.warn(
            f"slides: '{slide['type']}' slide content still overflows the footer band at "
            f"{width}x{height} even at the minimum type scale ({_MIN_SHRINK}x); the copy is "
            "too long for this canvas",
            RuntimeWarning,
        )
    return box, ops, y


def _slide_position(campaign, slide: dict) -> str:
    """Which slide of the deck this is, 1-based, for a warning message.

    `render()` is handed a slide dict, not an index, and tests routinely pass
    a modified copy of one, so this is best-effort: identity first, equality
    second, `'?'` when the slide is not part of the loaded deck at all. A
    warning is worth emitting either way — a missing position is a smaller
    loss than no warning."""
    deck = getattr(campaign, "slides", None) or []
    for index, candidate in enumerate(deck, start=1):
        if candidate is slide:
            return str(index)
    for index, candidate in enumerate(deck, start=1):
        if candidate == slide:
            return str(index)
    return "?"


def _resolve_shot(campaign, slide, lang: str):
    """The screenshot this slide draws for `lang`, as `(path, declared)`.

    Per-language asset wins over the slide-level one, mirroring `rows` in
    `_plan_numbers`. A screenshot of a page that renders its own text — the
    article's cost table, whose headers and row labels come from the site's
    i18n dictionaries — is not language-neutral, so the English deck must be
    able to point at an English capture instead of shipping a Polish table
    under an English headline. Declaration is what decides, not existence: a
    language block that names a file which was never captured degrades to a
    text slide (warning below), rather than silently substituting the other
    language's screenshot.

    Returns `None` when there is nothing to draw, having already warned if
    that is worth reporting. Shared by both picture-bearing slide types so
    the two cannot disagree about which file a language block resolves to.
    """
    text = campaign.text(slide, lang)
    declared = text.get("asset") or slide.get("asset")
    path = campaign.asset(text) or campaign.asset(slide)
    if not path:
        # No screenshot declared at all: this slide is text-only by the
        # spec's own choice, so there is nothing to report.
        return None
    if not path.is_file():
        # Still degrade to a text slide rather than break a batch render —
        # but never silently. For a new campaign the likeliest operator
        # mistake by far is not having run capture_screens.py (or having
        # renamed the file since), and the result is a slide that looks
        # deliberate: brand chrome, headline, sub, no diagram. Naming the
        # path this looked for is what turns "why is the diagram missing"
        # into a one-glance answer, including for the case where the path is
        # simply spelt differently from where the capture landed.
        warnings.warn(
            f"slides: the {declared!r} screenshot for slide "
            f"{_slide_position(campaign, slide)} ('{slide['type']}') of campaign "
            f"{getattr(campaign, 'id', '?')!r} ({lang}) does not exist at "
            f"{path}; rendering the slide without it — capture it first with "
            f"`python docs/marketing/scripts/capture_screens.py "
            f"{getattr(campaign, 'id', '?')}`",
            RuntimeWarning,
        )
        return None
    return path, declared


def _place_diagram_frame(img, box, slide, campaign, lang, y: int) -> None:
    resolved = _resolve_shot(campaign, slide, lang)
    if resolved is None:
        return
    path, declared = resolved
    with Image.open(path) as raw:
        shot = raw.convert("RGB")
    available = img.height - y - int(img.height * _FOOTER_RESERVE)
    if available < _MIN_DIAGRAM_HEIGHT:
        # Do not silently turn this into a text-only "problem" slide with no
        # sign anything is missing — that is a real loss (Task 6 builds
        # LinkedIn/OG cards straight from this canvas). Warn the operator
        # instead so a too-tall header/sub combination gets noticed and
        # trimmed, rather than shipping a diagram card with no diagram.
        warnings.warn(
            f"slides: no room left for the {declared!r} screenshot on slide "
            f"{_slide_position(campaign, slide)} ('{slide['type']}') of campaign "
            f"{getattr(campaign, 'id', '?')!r} ({lang}) at "
            f"{img.width}x{img.height}; rendering without it",
            RuntimeWarning,
        )
        return
    framed = brand.browser_frame(shot, box["content_width"], brand.SITE)
    if framed.height > available:
        # A small browser frame beats no frame at all.
        scale = available / framed.height
        framed = framed.resize((max(int(framed.width * scale), 1), available), Image.LANCZOS)
    img.paste(framed, ((img.width - framed.width) // 2, y + int(img.height * 0.02)))


def _tall_frame_width(shot_size, max_width: int, available: int) -> int:
    """The widest frame of this shot that is still no taller than `available`.

    `_place_diagram_frame` builds the frame at the text column's width and
    then squashes the *result* to fit, which for a tall shot means a frame
    that was 1486 px tall being resized to 453 — a 0.30x second resample of
    an image that was already resampled once. Solving for the width instead
    means one resample, at the size the frame is actually drawn at.

    A search rather than algebra because `brand.frame_size` is not invertible
    in closed form: the title bar is `max(int(width * 0.055), 34)`, so below
    ~618 px it stops scaling with the frame and the relationship has a knee
    in it. Eleven iterations of integer arithmetic, no image work.
    """
    low, high = 1, max(max_width, 1)
    if brand.frame_size(shot_size, high)[1] <= available:
        return high
    while low < high:
        middle = (low + high + 1) // 2
        if brand.frame_size(shot_size, middle)[1] <= available:
            low = middle
        else:
            high = middle - 1
    return low


def _place_tall_frame(img, box, slide, campaign, lang, y: int) -> None:
    """Draw a `tall-diagram` slide's visual as large as the canvas allows.

    Two differences from `_place_diagram_frame`, both of them the point of
    this slide type:

    * the frame is fitted to whichever of the height budget and the (wider)
      visual column binds, instead of being built at the text column's width
      and squashed afterwards;
    * falling short is reported. `_MIN_DIAGRAM_HEIGHT` is a floor on whether
      a frame is worth drawing at all, not on whether anyone can read it, and
      a tall capture clears it by an order of magnitude while rendering its
      node labels at 4-5 px. That silence is what made the mid-funnel deck
      look shippable; see `_TALL_MIN_SCALE`.
    """
    resolved = _resolve_shot(campaign, slide, lang)
    if resolved is None:
        return
    path, declared = resolved
    with Image.open(path) as raw:
        shot = raw.convert("RGB")
    top = y + int(img.height * _TALL_HEADER_GAP)
    bottom = brand.footer_top(img.size) - int(img.height * _TALL_FOOTER_GAP)
    available = bottom - top
    if available < _MIN_DIAGRAM_HEIGHT:
        warnings.warn(
            f"slides: no room left for the {declared!r} screenshot on slide "
            f"{_slide_position(campaign, slide)} ('{slide['type']}') of campaign "
            f"{getattr(campaign, 'id', '?')!r} ({lang}) at "
            f"{img.width}x{img.height}; rendering without it",
            RuntimeWarning,
        )
        return
    width = _tall_frame_width(shot.size, box["visual_width"], available)
    framed = brand.browser_frame(shot, width, brand.SITE)
    img.paste(framed, ((img.width - framed.width) // 2, top))
    scale = width / shot.width
    if scale < _TALL_MIN_SCALE:
        # Name the numbers, because the fix is a spec change and the operator
        # has to choose between three of them: photograph a readable fragment
        # instead of the whole graph (what campaign one did when `.calc` came
        # out at 0.29x — `.calc-table-wrap` is the same page at 0.67x), give
        # the source a wider layout, or publish this slide only in the 9:16
        # formats, which have ~500 px more height to give it.
        needed = int(shot.width * _TALL_MIN_SCALE)
        low, high = (round(scale * ink) for ink in _CAPTURE_INK_BAND)
        warnings.warn(
            f"slides: the {declared!r} screenshot on slide "
            f"{_slide_position(campaign, slide)} ('{slide['type']}') of campaign "
            f"{getattr(campaign, 'id', '?')!r} ({lang}) renders at {scale:.2f}x "
            f"of its {shot.width}x{shot.height} source at {img.width}x{img.height} "
            f"({width} px wide), below the {_TALL_MIN_SCALE}x this factory's "
            f"captures stay readable at — a line of text in it lands around "
            f"{low}-{high} px against the ~16-19 px it needs. Fitting it here "
            f"would take a {needed} px-wide frame, i.e. a source no taller than "
            f"{int(needed * shot.height / shot.width)} px against this one's "
            f"{shot.height}. Photograph a readable fragment instead of the whole "
            "visual (campaign one's `.calc-table-wrap` against its `.calc`), or "
            "keep this slide to the 9:16 formats, which have the most height to "
            "give it",
            RuntimeWarning,
        )


# Which slide types put a picture on the canvas after the text plan has been
# executed, and how. `render` dispatches through this rather than testing
# `slide["type"] == "diagram"` twice, and `tests/test_campaigns.py` reads it
# to assert every picture-bearing type has a capture check of its own.
_PLACERS = {
    "diagram": _place_diagram_frame,
    "tall-diagram": _place_tall_frame,
}


def render(campaign: Campaign, slide: dict, lang: str,
           size: tuple[int, int]) -> Image.Image:
    text = campaign.text(slide, lang)
    box, ops, y = _fit_box(size, slide, text)
    img = brand.background(size)
    _execute(img, ops)
    place = _PLACERS.get(slide["type"])
    if place is not None:
        place(img, box, slide, campaign, lang, y)
    brand.paste_badge(img, height=brand.badge_height(size[0]))
    brand.footer(img, lang)
    return img
