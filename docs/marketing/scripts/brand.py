# -*- coding: utf-8 -*-
"""Visual tokens for every mi-code.pl creative.

Colours and fonts are the ones the landing page itself uses (src/app.css).
A creative and the page it links to must read as the same company, so this
module is the only place any of them is written down.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

MARKETING = Path(__file__).resolve().parents[1]
FONTS = MARKETING / "assets" / "fonts"
BADGE = MARKETING / "assets" / "micode-badge.png"

# --- palette: mirrors src/app.css -------------------------------------------
NAVY = (0x1E, 0x40, 0xAF)          # --color-primary
NAVY_DARK = (0x1E, 0x3A, 0x8A)     # --color-primary-dark
ORANGE = (0xF9, 0x73, 0x16)        # --color-accent
ORANGE_LIGHT = (0xFB, 0x92, 0x3C)  # --color-accent-light
DARK = (0x0F, 0x17, 0x2A)          # --color-bg-hero
INK = (0x1E, 0x29, 0x3B)           # --color-text-primary
BORDER = (0xE2, 0xE8, 0xF0)        # --color-border
WHITE = (0xFA, 0xFA, 0xFC)
MUTED = (0xC8, 0xD0, 0xE0)

SITE = "mi-code.pl"
CONTACT = "development@mi-code.pl"

_HEADING = {"bold": "Poppins-Bold.ttf", "semibold": "Poppins-SemiBold.ttf"}
_BODY = {"regular": "OpenSans-Regular.ttf", "semibold": "OpenSans-SemiBold.ttf"}


def heading(size: int, weight: str = "bold") -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / _HEADING[weight]), size)


def body(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / _BODY[weight]), size)


def background(size: tuple[int, int]) -> Image.Image:
    """Dark navy vertical gradient with a soft orange glow, as on the hero."""
    width, height = size
    img = Image.new("RGB", size, DARK)
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(height - 1, 1)
        draw.line(
            [(0, y), (width, y)],
            fill=tuple(int(DARK[i] + (NAVY_DARK[i] - DARK[i]) * t) for i in range(3)),
        )

    glow = Image.new("RGB", size, (0, 0, 0))
    radius = int(width * 0.55)
    ImageDraw.Draw(glow).ellipse(
        [width - radius, -radius // 2, width + radius, radius], fill=ORANGE
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius // 3))
    return Image.blend(img, Image.blend(img, glow, 0.35), 0.55)


def wrap(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    """Greedy word wrap. A word wider than max_width keeps its own line
    rather than being dropped or split mid-glyph."""
    lines: list[str] = []
    current = ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if current and font.getlength(candidate) > max_width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def pill(img: Image.Image, xy: tuple[int, int], text: str,
         font: ImageFont.FreeTypeFont) -> int:
    """Draw an orange outlined tag. Returns the pill's right edge in px."""
    draw = ImageDraw.Draw(img)
    x, y = xy
    pad_x, pad_y = 26, 14
    width = int(font.getlength(text)) + pad_x * 2
    height = font.size + pad_y * 2
    draw.rounded_rectangle([x, y, x + width, y + height],
                           radius=height // 2, outline=ORANGE, width=3)
    draw.text((x + pad_x, y + pad_y - 2), text, font=font, fill=ORANGE_LIGHT)
    return x + width


def browser_frame(shot: Image.Image, width: int, url: str) -> Image.Image:
    """Put a screenshot inside a browser window chrome with the URL shown."""
    bar = max(int(width * 0.055), 34)
    scaled = shot.resize((width, max(int(width * shot.height / shot.width), 1)),
                         Image.LANCZOS)
    frame = Image.new("RGB", (width, scaled.height + bar), (0x23, 0x2B, 0x3B))
    draw = ImageDraw.Draw(frame)
    dot_r = bar // 6
    for i, colour in enumerate([(0xFF, 0x5F, 0x57), (0xFE, 0xBC, 0x2E), (0x28, 0xC8, 0x40)]):
        cx = bar // 2 + i * dot_r * 3
        draw.ellipse([cx - dot_r, bar // 2 - dot_r, cx + dot_r, bar // 2 + dot_r], fill=colour)
    url_font = body(max(bar // 2, 14))
    draw.text((bar * 3, (bar - url_font.size) // 2 - 2), url, font=url_font, fill=MUTED)
    frame.paste(scaled, (0, bar))
    return frame


def paste_badge(img: Image.Image, height: int = 56) -> None:
    """MICODE badge, top-right, matching the app factory's placement."""
    with Image.open(BADGE) as raw:
        badge = raw.convert("RGBA")
    scaled = badge.resize((max(int(height * badge.width / badge.height), 1), height),
                          Image.LANCZOS)
    img.paste(scaled, (img.width - scaled.width - 48, 40), scaled)


def footer(img: Image.Image, lang: str) -> None:
    """Domain strip along the bottom edge.

    Font size scales with canvas *width* (bigger canvases get bigger type)
    while the bottom margin is a fixed function of canvas *height* — on a
    wide/short canvas (e.g. the 1200x627 LinkedIn post or 1200x630 OG card)
    those two used to decouple and push the glyph's descenders (the "p" in
    ".pl") past the bottom edge. Anchoring off the actual rendered bbox
    (which includes descenders) rather than the font's top-left draw origin
    keeps the ink fully inside the canvas at any aspect ratio.
    """
    draw = ImageDraw.Draw(img)
    font = heading(max(img.width // 34, 20), "semibold")
    label = SITE
    margin = max(int(img.height * 0.025), 14)
    left, top, right, bottom = draw.textbbox((0, 0), label, font=font)
    x = (img.width - (right - left)) // 2 - left
    y = img.height - margin - bottom
    draw.text((x, y), label, font=font, fill=ORANGE_LIGHT)
