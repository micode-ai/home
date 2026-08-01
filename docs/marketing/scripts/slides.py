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
    # Font sizes and margins were tuned against the 1080x1350 carousel page
    # (aspect ratio _REFERENCE_ASPECT) and scale off canvas *width* below.
    # That is safe on a tall canvas, but a short/wide one — the 1200x627
    # LinkedIn banner or the 1200x630 OG card (aspect ~1.9) — has far less
    # vertical budget per unit of width, so naive width-driven sizing eats
    # into that budget fast. Scaling off the smaller of the actual width and
    # a width *equivalent to the reference aspect ratio* derived from height
    # keeps the proven proportions untouched on tall canvases while raising
    # the amount of copy a short canvas can carry before it needs to shrink
    # further. `shrink` is an additional multiplier `_fit_box` uses to make
    # a specific slide's actual (possibly much longer) copy fit.
    scale = min(width, height / _REFERENCE_ASPECT) * shrink
    margin = int(scale * 0.085)
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


def _draw_block(img, lines, font, fill, x, y, spacing=1.25) -> int:
    draw = ImageDraw.Draw(img)
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += int(font.size * spacing)
    return y


def _header(img, box, text: dict) -> int:
    y = box["top"]
    if text.get("eyebrow"):
        draw = ImageDraw.Draw(img)
        draw.text((box["margin"], y), text["eyebrow"].upper(),
                  font=box["eyebrow"], fill=brand.ORANGE_LIGHT)
        y += int(box["eyebrow"].size * 2.1)
    if text.get("headline"):
        y = _draw_block(img, brand.wrap(text["headline"], box["title"], box["content_width"]),
                        box["title"], brand.WHITE, box["margin"], y)
    return y


def _sub(img, box, text: dict, y: int) -> int:
    if not text.get("sub"):
        return y
    y += int(box["sub"].size * 0.6)
    return _draw_block(img, brand.wrap(text["sub"], box["sub"], box["content_width"]),
                       box["sub"], brand.MUTED, box["margin"], y, 1.45)


def _hook(img, box, slide, text, campaign, lang):
    y = _header(img, box, text)
    if slide.get("bigNumber"):
        y += int(box["huge"].size * 0.2)
        ImageDraw.Draw(img).text((box["margin"], y), slide["bigNumber"],
                                 font=box["huge"], fill=brand.ORANGE)
        y += int(box["huge"].size * 1.15)
    _sub(img, box, text, y)


def _problem(img, box, slide, text, campaign, lang):
    _sub(img, box, text, _header(img, box, text))


def _numbers(img, box, slide, text, campaign, lang):
    # Per-language rows win over slide-level rows: this keeps a language-
    # neutral table (model names, dollar amounts) simple at the slide level
    # while letting localised labels (e.g. "Staly prefiks" vs "Fixed prefix")
    # live per language instead of being crammed onto one bilingual line.
    rows = text.get("rows") or slide.get("rows", [])
    y = _sub(img, box, text, _header(img, box, text))
    y += int(box["row"].size * 0.9)
    draw = ImageDraw.Draw(img)
    right = box["margin"] + box["content_width"]
    row_height = int(box["row"].size * _ROW_HEIGHT_FACTOR)
    for label, value in rows:
        draw.text((box["margin"], y), str(label), font=box["row"], fill=brand.MUTED)
        value_width = draw.textlength(str(value), font=box["row"])
        draw.text((right - value_width, y), str(value), font=box["row"], fill=brand.ORANGE_LIGHT)
        # A label's descenders (the "p"/"g" in a model name) sit at roughly
        # 1.31-1.33x the font's nominal size below its draw origin, fairly
        # consistently across sizes — measured directly via textbbox, not
        # eyeballed. `_LINE_Y_FACTOR` clears that with a couple of px to
        # spare; `_ROW_HEIGHT_FACTOR` then leaves a further gap before the
        # next row's own top-bearing, so the rule reads as a separator
        # between rows rather than a strike-through of the row above it.
        line_y = y + int(box["row"].size * _LINE_Y_FACTOR)
        draw.line([(box["margin"], line_y), (right, line_y)], fill=brand.NAVY, width=2)
        y += row_height


def _diagram(img, box, slide, text, campaign, lang):
    y = _sub(img, box, text, _header(img, box, text))
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


def _cta(img, box, slide, text, campaign, lang):
    y = _sub(img, box, text, _header(img, box, text))
    y += int(box["row"].size * 1.1)
    brand.pill(img, (box["margin"], y), brand.CONTACT, box["row"])


_RENDERERS = {
    "hook": _hook,
    "problem": _problem,
    "numbers": _numbers,
    "diagram": _diagram,
    "cta": _cta,
}


# --- vertical-budget fitting -------------------------------------------
#
# `_layout` alone only accounts for canvas shape. It says nothing about how
# tall a *particular* slide's actual copy will render, so a long enough
# headline/sub (or enough `numbers` rows) can still walk past the footer
# band on a short canvas even after `_layout` raised the length budget. The
# functions below mirror each renderer's drawing arithmetic to estimate the
# bottom y a slide's text content will reach *without drawing anything*, so
# `_fit_box` can shrink the type scale just enough to keep that estimate
# clear of the footer, then hand the *drawing* functions above the resulting
# box. Renderers never need to know this happened — they just get smaller
# fonts on demand.


def _measure_header(box, text) -> int:
    y = box["top"]
    if text.get("eyebrow"):
        y += int(box["eyebrow"].size * 2.1)
    if text.get("headline"):
        lines = brand.wrap(text["headline"], box["title"], box["content_width"])
        y += int(box["title"].size * 1.25) * len(lines)
    return y


def _measure_sub(box, text, y: int) -> int:
    if not text.get("sub"):
        return y
    y += int(box["sub"].size * 0.6)
    lines = brand.wrap(text["sub"], box["sub"], box["content_width"])
    y += int(box["sub"].size * 1.45) * len(lines)
    return y


def _measure_hook(box, slide, text) -> int:
    y = _measure_header(box, text)
    if slide.get("bigNumber"):
        y += int(box["huge"].size * 0.2)
        y += int(box["huge"].size * 1.15)
    return _measure_sub(box, text, y)


def _measure_problem(box, slide, text) -> int:
    return _measure_sub(box, text, _measure_header(box, text))


def _measure_numbers(box, slide, text) -> int:
    rows = text.get("rows") or slide.get("rows", [])
    y = _measure_sub(box, text, _measure_header(box, text))
    y += int(box["row"].size * 0.9)
    y += int(box["row"].size * _ROW_HEIGHT_FACTOR) * len(rows)
    return y


def _measure_diagram(box, slide, text) -> int:
    # The screenshot itself is fit into whatever remains by `_diagram` (which
    # shrinks or, at worst, warns and omits it — see `_MIN_DIAGRAM_HEIGHT`
    # above — never overflows on its own). Only the header/sub text needs to
    # be kept clear of the footer band here.
    return _measure_sub(box, text, _measure_header(box, text))


def _measure_cta(box, slide, text) -> int:
    y = _measure_sub(box, text, _measure_header(box, text))
    y += int(box["row"].size * 1.1)
    y += box["row"].size + 28  # brand.pill()'s own height: font.size + 2*pad_y (pad_y=14)
    return y


_MEASURERS = {
    "hook": _measure_hook,
    "problem": _measure_problem,
    "numbers": _measure_numbers,
    "diagram": _measure_diagram,
    "cta": _measure_cta,
}


def _fit_box(size: tuple[int, int], slide: dict, text: dict) -> dict:
    """The largest `_layout` box (i.e. the least amount of shrinking) whose
    estimated content stays clear of the footer band, for this slide's
    actual copy. Tall canvases (1080x1350, 1080x1920) have enough vertical
    budget that shrink stays at 1.0 for any realistic copy length, so their
    renders are unaffected — this only engages on the short canvases
    (1200x627, 1200x630) once copy runs long enough to need it."""
    width, height = size
    max_bottom = height - int(height * _FOOTER_RESERVE)
    measure = _MEASURERS[slide["type"]]
    shrink = 1.0
    box = _layout(size, shrink)
    while measure(box, slide, text) > max_bottom and shrink > _MIN_SHRINK:
        shrink = round(shrink - 0.05, 2)
        box = _layout(size, shrink)
    return box


def render(campaign: Campaign, slide: dict, lang: str,
           size: tuple[int, int]) -> Image.Image:
    text = campaign.text(slide, lang)
    box = _fit_box(size, slide, text)
    img = brand.background(size)
    _RENDERERS[slide["type"]](img, box, slide, text, campaign, lang)
    brand.paste_badge(img, height=max(size[0] // 20, 34))
    brand.footer(img, lang)
    return img
