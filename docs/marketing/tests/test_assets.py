from pathlib import Path

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
