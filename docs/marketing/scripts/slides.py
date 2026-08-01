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


def _place_diagram_frame(img, box, slide, campaign, lang, y: int) -> None:
    path = campaign.asset(slide)
    if not path or not path.is_file():
        return  # degrade to a text slide rather than break a batch render
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
            f"slides: no room left for the '{slide.get('asset')}' screenshot on the "
            f"diagram slide of campaign {getattr(campaign, 'id', '?')!r} at "
            f"{img.width}x{img.height} ({lang}); rendering without it",
            RuntimeWarning,
        )
        return
    framed = brand.browser_frame(shot, box["content_width"], brand.SITE)
    if framed.height > available:
        # A small browser frame beats no frame at all.
        scale = available / framed.height
        framed = framed.resize((max(int(framed.width * scale), 1), available), Image.LANCZOS)
    img.paste(framed, ((img.width - framed.width) // 2, y + int(img.height * 0.02)))


def render(campaign: Campaign, slide: dict, lang: str,
           size: tuple[int, int]) -> Image.Image:
    text = campaign.text(slide, lang)
    box, ops, y = _fit_box(size, slide, text)
    img = brand.background(size)
    _execute(img, ops)
    if slide["type"] == "diagram":
        _place_diagram_frame(img, box, slide, campaign, lang, y)
    brand.paste_badge(img, height=max(size[0] // 20, 34))
    brand.footer(img, lang)
    return img
