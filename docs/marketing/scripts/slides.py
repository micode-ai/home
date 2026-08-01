# -*- coding: utf-8 -*-
"""Render one campaign slide onto one canvas.

Every slide type must survive every canvas — a 1200x627 LinkedIn banner is
half the height of a carousel page, so sizes are derived from the canvas
rather than fixed. This is what lets one campaign.json feed all formats.
"""
from PIL import Image, ImageDraw

import brand
from spec import Campaign


def _layout(size: tuple[int, int]) -> dict:
    width, height = size
    # Font sizes and margins were tuned against the 1080x1350 carousel page
    # (aspect ratio 0.8) and scale off canvas *width* below. That is safe on
    # a tall canvas, but a short/wide one — the 1200x627 LinkedIn banner or
    # the 1200x630 OG card (aspect ~1.9) — has far less vertical budget per
    # unit of width, so width-driven sizing overflows off the bottom edge
    # (observed: the hook slide's big number and the numbers slide's table
    # both ran past the canvas and into the footer). Scaling off the smaller
    # of the actual width and a width *equivalent to today's tuned aspect
    # ratio* derived from height keeps the proven proportions untouched on
    # tall canvases while shrinking everything proportionally to fit on
    # short ones.
    scale = min(width, height / 0.8)
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
    for label, value in rows:
        draw.text((box["margin"], y), str(label), font=box["row"], fill=brand.MUTED)
        value_width = draw.textlength(str(value), font=box["row"])
        draw.text((right - value_width, y), str(value), font=box["row"], fill=brand.ORANGE_LIGHT)
        y += int(box["row"].size * 1.35)
        draw.line([(box["margin"], y - box["row"].size // 3), (right, y - box["row"].size // 3)],
                  fill=brand.NAVY, width=2)


def _diagram(img, box, slide, text, campaign, lang):
    y = _sub(img, box, text, _header(img, box, text))
    path = campaign.asset(slide)
    if not path or not path.is_file():
        return  # degrade to a text slide rather than break a batch render
    with Image.open(path) as raw:
        shot = raw.convert("RGB")
    available = img.height - y - int(img.height * 0.14)
    if available < 80:
        return
    framed = brand.browser_frame(shot, box["content_width"], brand.SITE)
    if framed.height > available:
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


def render(campaign: Campaign, slide: dict, lang: str,
           size: tuple[int, int]) -> Image.Image:
    img = brand.background(size)
    box = _layout(size)
    _RENDERERS[slide["type"]](img, box, slide, campaign.text(slide, lang),
                              campaign, lang)
    brand.paste_badge(img, height=max(size[0] // 20, 34))
    brand.footer(img, lang)
    return img
