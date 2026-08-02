import pytest
from PIL import Image, ImageChops

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


# --- pill geometry --------------------------------------------------------
#
# `pill()` had no direct test at all, and nothing anywhere asserted that it
# and `pill_height()` agree. They have to: `slides._plan_cta` reserves
# `brand.pill_height(font)` of vertical budget for a pill it then asks
# `brand.pill()` to draw, and that reservation is what keeps the CTA slide's
# contact address out of the footer band. If `pill()` ever drew taller than
# `pill_height()` reports, `_plan_cta` would report a fit while the real pill
# sat inside the footer — and every slide-level test would still pass,
# because they all measure the *plan*, not the ink.

PILL_SIZES = [18, 24, 32, 48]


def _pill_ink_bbox(font, origin=(60, 80), text=brand.CONTACT):
    """The bbox of everything `pill()` actually draws, and its return value."""
    img = Image.new("RGB", (1200, 400), brand.DARK)
    before = img.copy()
    right_edge = brand.pill(img, origin, text, font)
    bbox = ImageChops.difference(img, before).getbbox()
    return bbox, right_edge


@pytest.mark.parametrize("size", PILL_SIZES, ids=lambda s: f"{s}px")
def test_pill_draws_a_visible_tag(size):
    font = brand.body(size, "semibold")
    bbox, _ = _pill_ink_bbox(font)
    assert bbox is not None, "pill() drew nothing"


@pytest.mark.parametrize("size", PILL_SIZES, ids=lambda s: f"{s}px")
def test_pill_ink_height_is_exactly_what_pill_height_reports(size):
    """The agreement `slides._plan_cta` depends on, asserted on the pixels.

    Both directions matter. Drawing *taller* than reported means a caller
    that reserved the reported height overflows whatever came after it (for
    `_plan_cta`, the footer band). Drawing *shorter* means the caller wastes
    budget and shrinks type it did not need to shrink. PIL's bbox lower bound
    is exclusive — the last row of ink is `bbox[3] - 1` — so the drawn height
    is `bbox[3] - bbox[1] - 1` against a box drawn from `y` to `y + height`
    inclusive.
    """
    font = brand.body(size, "semibold")
    origin = (60, 80)
    bbox, _ = _pill_ink_bbox(font, origin)
    assert bbox[1] == origin[1], (
        f"pill ink starts at y={bbox[1]}, not at the requested y={origin[1]}"
    )
    drawn = bbox[3] - bbox[1] - 1
    reported = brand.pill_height(font)
    assert drawn == reported, (
        f"pill() draws {drawn}px tall at font size {size} but pill_height() "
        f"reports {reported}px — a caller reserving the reported height would "
        f"be off by {drawn - reported}px"
    )


@pytest.mark.parametrize("size", PILL_SIZES, ids=lambda s: f"{s}px")
def test_pill_height_accounts_for_the_vertical_padding(size):
    """Not just "they agree" — the reported height must actually include the
    padding above and below the text, so a mutation reducing it to the bare
    font size is caught even if `pill()` were changed to match."""
    font = brand.body(size, "semibold")
    assert brand.pill_height(font) == size + brand.PILL_PAD_Y * 2


@pytest.mark.parametrize("size", PILL_SIZES, ids=lambda s: f"{s}px")
def test_pill_returns_its_own_right_edge(size):
    """The return value is documented as "the pill's right edge in px" — a
    caller placing anything after the pill relies on it. Assert it against
    the ink rather than against `pill()`'s own arithmetic."""
    font = brand.body(size, "semibold")
    origin = (60, 80)
    bbox, right_edge = _pill_ink_bbox(font, origin)
    assert bbox[0] == origin[0], f"pill ink starts at x={bbox[0]}, not {origin[0]}"
    # bbox[2] is exclusive, so the last inked column is bbox[2] - 1.
    assert bbox[2] - 1 == right_edge, (
        f"pill() reports its right edge at x={right_edge} but its last inked "
        f"column is x={bbox[2] - 1}"
    )


def test_pill_width_follows_its_text():
    """A pill that ignored its `text` argument would still satisfy every
    height assertion above."""
    font = brand.body(32, "semibold")
    short, _ = _pill_ink_bbox(font, text="a")
    wide, _ = _pill_ink_bbox(font, text=brand.CONTACT)
    assert wide[2] > short[2], "pill width does not depend on the text drawn"


def test_browser_frame_wraps_the_screenshot():
    shot = Image.new("RGB", (1600, 900), (255, 255, 255))
    framed = brand.browser_frame(shot, 900, "mi-code.pl")
    assert framed.width == 900
    assert framed.height > 900 * 900 // 1600, "frame adds a chrome bar above the shot"


# --- geometry other modules ask about instead of re-deriving ---------------
#
# `frame_size`, `badge_bottom` and `footer_top` all exist so that
# `slides._place_tall_frame` can plan around the badge, the frame and the
# footer without keeping a second copy of their arithmetic. Each is only
# worth having if it agrees with what actually gets drawn — a reporter that
# drifts from the drawing is worse than no reporter, because the caller
# trusts it. These are the three agreements, asserted on the pixels.

FRAME_WIDTHS = [120, 400, 617, 618, 900, 1006]
CANVAS_SIZES = [(1080, 1350), (1080, 1920), (1200, 627), (1200, 630)]


@pytest.mark.parametrize("width", FRAME_WIDTHS, ids=lambda w: f"{w}px")
@pytest.mark.parametrize("shot_size", [(1600, 2560), (1340, 474), (800, 800)],
                         ids=lambda s: f"{s[0]}x{s[1]}")
def test_frame_size_reports_what_browser_frame_actually_builds(shot_size, width):
    """`slides._tall_frame_width` searches for the largest frame width whose
    frame still fits the height it has, and it does that by asking
    `frame_size` rather than by building candidate frames. If the two ever
    disagreed the search would settle on a width whose real frame is taller
    than the budget, and the visual would run into the footer with nothing
    reporting it. 617/618 bracket the knee where the title bar stops being
    the 34px floor and starts scaling with the frame."""
    shot = Image.new("RGB", shot_size, (255, 255, 255))
    framed = brand.browser_frame(shot, width, brand.SITE)
    assert brand.frame_size(shot_size, width) == (framed.width, framed.height)


@pytest.mark.parametrize("size", CANVAS_SIZES, ids=lambda s: f"{s[0]}x{s[1]}")
def test_badge_bottom_is_where_the_badge_ink_actually_ends(size):
    """`slides._layout`'s `tall_top` starts a `tall-diagram` header just below
    this, so that the one slide type which pushes its header up the canvas to
    buy height still clears the badge. A `badge_bottom` that under-reported
    would put a full-width headline straight through the badge."""
    img = Image.new("RGB", size, brand.DARK)
    before = img.copy()
    brand.paste_badge(img, height=brand.badge_height(size[0]))
    bbox = ImageChops.difference(img, before).getbbox()
    assert bbox is not None, "paste_badge drew nothing"
    # bbox's lower bound is exclusive, so the last inked row is bbox[3] - 1.
    assert bbox[1] == brand.BADGE_TOP, (
        f"badge ink starts at y={bbox[1]}, not at BADGE_TOP={brand.BADGE_TOP}"
    )
    assert bbox[3] - 1 <= brand.badge_bottom(size[0]), (
        f"badge ink reaches y={bbox[3] - 1} but badge_bottom() reports "
        f"{brand.badge_bottom(size[0])} — a header starting there would run "
        "under the badge"
    )


@pytest.mark.parametrize("size", CANVAS_SIZES, ids=lambda s: f"{s[0]}x{s[1]}")
def test_footer_top_is_where_the_footer_ink_actually_starts(size):
    """`slides._place_tall_frame` sizes its visual against this instead of
    against `slides._FOOTER_RESERVE`'s flat 14%, precisely because the flat
    reserve leaves 123px of empty canvas on 1080x1350 that a tall picture
    could have used. That only holds if this really is the first footer
    pixel: over-report and the visual is drawn through the domain label."""
    before = brand.background(size)
    after = before.copy()
    brand.footer(after, "pl")
    bbox = ImageChops.difference(before, after).getbbox()
    assert bbox is not None, "footer drew nothing"
    assert brand.footer_top(size) == bbox[1], (
        f"footer_top() reports y={brand.footer_top(size)} but the footer's "
        f"first inked row is y={bbox[1]}"
    )


@pytest.mark.parametrize(
    "size",
    [(1080, 1350), (1200, 627), (1080, 1920), (1200, 630)],
    ids=lambda s: f"{s[0]}x{s[1]}",
)
def test_footer_writes_the_domain(size):
    """The footer's ink (including descenders, e.g. the "p" in ".pl") must
    stay fully inside the canvas at every aspect ratio the factory renders,
    not just the tall 1080x1350/1080x1920 ones — regression test for a bug
    where font size (derived from width) and bottom margin (derived from
    height) decoupled on wide/short canvases and clipped the label."""
    width, height = size
    before = brand.background(size)
    after = before.copy()
    brand.footer(after, "pl")

    diff = ImageChops.difference(before, after)
    bbox = diff.getbbox()
    assert bbox is not None, f"{size}: footer drew nothing"

    # PIL silently clips anything drawn past the canvas edge, so the diff's
    # own bbox can never report top < 0 or bottom > height — both bounds are
    # tautologically satisfied by construction and would not have caught the
    # bug. What *does* reveal clipping: PIL's bbox "lower" bound is exclusive
    # (1 + the last non-zero row), so it only ever equals `height` exactly
    # when the very last pixel row of the canvas is part of the ink — i.e.
    # the label was cut off by the edge rather than sitting above it with
    # room to spare. A strict "<" is the real assertion; "<=" would pass on
    # both clipped and unclipped renders.
    top, bottom = bbox[1], bbox[3]
    assert top >= 0, f"{size}: footer ink starts above the canvas (top={top})"
    assert bottom < height, (
        f"{size}: footer ink is clipped by the bottom edge — its last row "
        f"of ink coincides with the canvas's last pixel row "
        f"(ink bottom={bottom}, canvas height={height})"
    )
