from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ASSETS = Path(__file__).resolve().parents[1] / "assets"
FONTS = ASSETS / "fonts"

REQUIRED_FONTS = [
    "Poppins-Bold.ttf",
    "Poppins-SemiBold.ttf",
    "OpenSans-Regular.ttf",
    "OpenSans-SemiBold.ttf",
]


def test_badge_exists_and_has_alpha():
    badge = ASSETS / "micode-badge.png"
    assert badge.is_file(), "MICODE badge missing"
    with Image.open(badge) as img:
        assert img.mode in ("RGBA", "LA"), "badge must keep transparency"


def test_all_required_fonts_present():
    missing = [name for name in REQUIRED_FONTS if not (FONTS / name).is_file()]
    assert not missing, f"missing font files: {missing}"


def test_fonts_render_visible_glyphs():
    """A font that loads but renders blank is worse than a missing one."""
    for name in REQUIRED_FONTS:
        font = ImageFont.truetype(str(FONTS / name), 64)
        canvas = Image.new("L", (600, 120), 0)
        ImageDraw.Draw(canvas).text((10, 10), "Agent AI 74", font=font, fill=255)
        assert canvas.getbbox() is not None, f"{name} rendered nothing"


def test_fonts_render_polish_diacritics():
    """PL copy uses ą ć ę ł ń ó ś ź ż — a font without them silently drops glyphs."""
    for name in REQUIRED_FONTS:
        font = ImageFont.truetype(str(FONTS / name), 64)
        plain = Image.new("L", (600, 120), 0)
        ImageDraw.Draw(plain).text((10, 10), "Ile", font=font, fill=255)
        accented = Image.new("L", (600, 120), 0)
        ImageDraw.Draw(accented).text((10, 10), "Iłę", font=font, fill=255)
        assert plain.tobytes() != accented.tobytes(), f"{name} lacks PL diacritics"


def test_font_licenses_shipped():
    licenses = list(FONTS.glob("*LICENSE*")) + list(FONTS.glob("*OFL*"))
    assert licenses, "ship the font licence files alongside the fonts"


def test_font_postscript_names_are_distinct():
    """Each font file must self-identify with its own PostScript name.

    instantiateVariableFont() without updateFontNames=True leaves every
    exported static instance pointing at the source variable font's name
    table, so e.g. OpenSans-Regular.ttf and OpenSans-SemiBold.ttf could both
    claim nameID 6 (PostScript name) "OpenSans-Regular". PIL loads fonts by
    file path and would not notice, but PDF/font-embedding tooling commonly
    keys embedded font resources off the PostScript name or unique ID — a
    collision risks one weight silently shadowing the other in the LinkedIn
    carousel PDF.
    """
    seen: dict[str, str] = {}
    for name in REQUIRED_FONTS:
        font = TTFont(str(FONTS / name))
        postscript_name = font["name"].getDebugName(6)
        colliding_file = seen.get(postscript_name)
        assert colliding_file is None, (
            f"{name} and {colliding_file} share PostScript name "
            f"{postscript_name!r} — one would shadow the other when both "
            f"are embedded in the same PDF"
        )
        seen[postscript_name] = name
