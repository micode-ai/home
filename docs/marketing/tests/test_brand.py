from PIL import Image

import brand  # noqa: E402


def test_palette_matches_the_site_stylesheet():
    """These are read off src/app.css; drifting from them breaks message match."""
    assert brand.NAVY == (0x1E, 0x40, 0xAF)
    assert brand.NAVY_DARK == (0x1E, 0x3A, 0x8A)
    assert brand.ORANGE == (0xF9, 0x73, 0x16)
    assert brand.ORANGE_LIGHT == (0xFB, 0x92, 0x3C)
    assert brand.DARK == (0x0F, 0x17, 0x2A)
    assert brand.INK == (0x1E, 0x29, 0x3B)
    assert brand.BORDER == (0xE2, 0xE8, 0xF0)


def test_site_and_contact_constants():
    assert brand.SITE == "mi-code.pl"
    assert brand.CONTACT == "development@mi-code.pl"


def test_fonts_load_at_requested_size():
    assert brand.heading(80).size == 80
    assert brand.heading(40, "semibold").size == 40
    assert brand.body(32).size == 32
    assert brand.body(32, "semibold").size == 32


def test_background_fills_the_whole_canvas():
    img = brand.background((1080, 1350))
    assert img.size == (1080, 1350)
    assert img.mode == "RGB"
    corners = [img.getpixel(p) for p in [(0, 0), (1079, 0), (0, 1349), (1079, 1349)]]
    assert all(c != (0, 0, 0) for c in corners), "background left pure-black corners"


def test_background_is_a_gradient_not_a_flat_fill():
    img = brand.background((1080, 1350))
    assert img.getpixel((540, 20)) != img.getpixel((540, 1330))


def test_wrap_respects_max_width():
    font = brand.body(32)
    lines = brand.wrap(
        "Ile to bedzie kosztowac miesiecznie to pierwsze pytanie w kazdej rozmowie",
        font,
        400,
    )
    assert len(lines) > 1
    for line in lines:
        assert font.getlength(line) <= 400


def test_wrap_keeps_every_word():
    font = brand.body(32)
    text = "prompt systemowy schematy narzedzi historia rozmowy"
    assert " ".join(brand.wrap(text, font, 300)).split() == text.split()


def test_wrap_does_not_drop_a_word_longer_than_the_line():
    font = brand.body(32)
    lines = brand.wrap("development@mi-code.pl", font, 80)
    assert "development@mi-code.pl" in " ".join(lines)


def test_paste_badge_marks_the_top_right():
    img = Image.new("RGB", (1080, 1350), brand.DARK)
    before = img.crop((820, 20, 1060, 110)).tobytes()
    brand.paste_badge(img)
    assert img.crop((820, 20, 1060, 110)).tobytes() != before


def test_browser_frame_wraps_the_screenshot():
    shot = Image.new("RGB", (1600, 900), (255, 255, 255))
    framed = brand.browser_frame(shot, 900, "mi-code.pl")
    assert framed.width == 900
    assert framed.height > 900 * 900 // 1600, "frame adds a chrome bar above the shot"


def test_footer_writes_the_domain():
    img = Image.new("RGB", (1080, 1350), brand.DARK)
    before = img.tobytes()
    brand.footer(img, "pl")
    assert img.tobytes() != before
