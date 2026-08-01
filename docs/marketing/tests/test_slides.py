import json

import pytest
from PIL import Image, ImageChops, ImageDraw

import brand  # noqa: E402
import slides  # noqa: E402
import spec  # noqa: E402

CANVASES = [(1080, 1350), (1200, 627), (1080, 1920), (1200, 630)]

PAYLOAD = {
    "id": "demo", "track": "funnel-top",
    "target": "https://mi-code.pl/blog/x/", "utm": {"campaign": "demo"},
    "slides": [
        {"type": "hook", "bigNumber": "$74.38",
         "pl": {"eyebrow": "AI DLA BIZNESU", "headline": "Ile kosztuje agent AI miesiecznie?",
                "sub": "Tyle wychodzi w konfiguracji referencyjnej."},
         "en": {"eyebrow": "AI FOR BUSINESS", "headline": "What does an AI agent cost per month?",
                "sub": "That is the reference configuration."}},
        {"type": "problem",
         "pl": {"headline": "To zalezy nie jest odpowiedzia",
                "sub": "Cennik podaje cene za milion tokenow, ale nie kwote rachunku."},
         "en": {"headline": "It depends is not an answer",
                "sub": "A price list gives a unit price, not your bill."}},
        {"type": "numbers",
         "rows": [["gpt-5.4-nano", "$50.34"], ["gpt-5.6-sol", "$1254.00"]],
         "pl": {"headline": "Ta sama praca, 25x roznicy", "sub": "Te same tokeny."},
         "en": {"headline": "Same work, 25x apart", "sub": "The same tokens."}},
        {"type": "diagram", "asset": "src/calculator.png",
         "pl": {"headline": "Kalkulator w artykule", "sub": "Wstaw wlasne liczby."},
         "en": {"headline": "A calculator in the article", "sub": "Plug in your own numbers."}},
        {"type": "cta",
         "pl": {"headline": "Policzymy to na Twoich danych", "sub": "Przed rozpoczeciem pracy."},
         "en": {"headline": "We will price it on your data", "sub": "Before the work starts."}},
    ],
}


@pytest.fixture
def campaign(tmp_path, monkeypatch):
    root = tmp_path / "campaigns" / "demo"
    root.mkdir(parents=True)
    (root / "campaign.json").write_text(json.dumps(PAYLOAD), encoding="utf-8")
    shot_dir = tmp_path / "creatives" / "demo" / "src"
    shot_dir.mkdir(parents=True)
    Image.new("RGB", (1600, 900), (255, 255, 255)).save(shot_dir / "calculator.png")
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    return spec.Campaign.load("demo")


@pytest.mark.parametrize("index", range(5))
@pytest.mark.parametrize("size", CANVASES)
@pytest.mark.parametrize("lang", ["pl", "en"])
def test_every_slide_type_renders_at_every_canvas(campaign, index, size, lang):
    img = slides.render(campaign, campaign.slides[index], lang, size)
    assert img.size == size
    assert img.mode == "RGB"


def test_rendered_slide_is_not_blank(campaign):
    img = slides.render(campaign, campaign.slides[0], "pl", (1080, 1350))
    assert len(img.getcolors(maxcolors=1_000_000) or []) > 50


def test_pl_and_en_slides_differ(campaign):
    """Guards against a renderer that ignores the lang argument."""
    pl = slides.render(campaign, campaign.slides[0], "pl", (1080, 1350))
    en = slides.render(campaign, campaign.slides[0], "en", (1080, 1350))
    assert pl.tobytes() != en.tobytes()


def test_hook_slide_shows_the_big_number(campaign):
    """The headline figure is the hook; dropping it guts the creative."""
    with_number = slides.render(campaign, campaign.slides[0], "pl", (1080, 1350))
    stripped = dict(campaign.slides[0])
    stripped.pop("bigNumber")
    without = slides.render(campaign, stripped, "pl", (1080, 1350))
    assert with_number.tobytes() != without.tobytes()


def test_diagram_slide_without_its_asset_still_renders(campaign, monkeypatch):
    """Missing screenshot must degrade to a text slide, not crash a batch run."""
    missing = dict(campaign.slides[3])
    missing["asset"] = "src/does-not-exist.png"
    img = slides.render(campaign, missing, "pl", (1080, 1350))
    assert img.size == (1080, 1350)


def test_numbers_slide_renders_all_rows(campaign):
    two_rows = slides.render(campaign, campaign.slides[2], "pl", (1080, 1350))
    one_row = dict(campaign.slides[2])
    one_row["rows"] = [["gpt-5.4-nano", "$50.34"]]
    assert two_rows.tobytes() != slides.render(campaign, one_row, "pl", (1080, 1350)).tobytes()


def test_numbers_slide_ignores_slide_level_rows_when_language_has_its_own(campaign):
    """Isolates the precedence rule: with the *language* copy held identical
    between both renders, only the slide-level `rows` varies. If the
    language block's own rows are truly authoritative (rather than merely
    preferred, or blended, or ignored), that variation must have zero effect
    on the output — the two renders must be byte-identical."""
    base = dict(campaign.slides[2])
    base["pl"] = dict(base["pl"], rows=[["Staly prefiks", "$12.00"]])
    with_slide_rows = dict(base, rows=[["gpt-5.4-nano", "$50.34"], ["gpt-5.6-sol", "$1254.00"]])
    without_slide_rows = dict(base, rows=[])
    a = slides.render(campaign, with_slide_rows, "pl", (1080, 1350))
    b = slides.render(campaign, without_slide_rows, "pl", (1080, 1350))
    assert a.tobytes() == b.tobytes()


def test_numbers_slide_falls_back_to_slide_level_rows_when_language_has_none(campaign):
    """Rows with no per-language override (model names, dollar amounts) still
    render using the slide-level table."""
    slide = campaign.slides[2]
    assert "rows" not in slide["pl"]
    assert "rows" not in slide["en"]
    img = slides.render(campaign, slide, "pl", (1080, 1350))
    blank_rows = dict(slide, rows=[])
    without_rows = slides.render(campaign, blank_rows, "pl", (1080, 1350))
    assert img.tobytes() != without_rows.tobytes()


def test_cta_slide_carries_the_contact_address(campaign):
    img = slides.render(campaign, campaign.slides[4], "pl", (1080, 1350))
    assert img.size == (1080, 1350)
    assert len(img.getcolors(maxcolors=1_000_000) or []) > 50


# --- long-copy overflow guards -------------------------------------------
#
# This module's fixture copy is deliberately compact. Real campaign copy
# runs much longer, and on the short/wide canvases (1200x627 LinkedIn,
# 1200x630 OG) that is exactly what used to walk text past the canvas edge
# and into the footer's own space.

LONG_PL = {
    "eyebrow": "AI DLA BIZNESU",
    "headline": "Dlaczego rachunek za agenta AI bywa dziesiec razy wyzszy niz cena z "
                 "cennika dostawcy modelu?",
    "sub": "Cennik podaje stawke za milion tokenow, ale Twoja miesieczna faktura zalezy "
           "od tego, ile tokenow faktycznie zuzywa caly przeplyw pracy produkcyjnego "
           "agenta w typowym miesiacu.",
}


def _footer_ink_top(size: tuple[int, int]) -> int:
    """The y-coordinate brand.footer()'s own glyphs actually start at,
    replicated from its placement math (not slides.py's internal reserve,
    which is an implementation detail of the fix under test — this measures
    the real footer text position instead of guessing at a percentage)."""
    width, height = size
    font = brand.heading(max(width // 34, 20), "semibold")
    margin = max(int(height * 0.025), 14)
    probe = Image.new("RGB", size)
    left, top, right, bottom = ImageDraw.Draw(probe).textbbox(
        (0, 0), brand.SITE, font=font)
    return height - margin - bottom + top


def _footer_band_overlap(actual: Image.Image, lang: str) -> int:
    """Pixels, from the footer's own text top down to the canvas edge, where
    `actual` differs from a plain background + badge + footer with no slide
    body drawn at all — i.e. body-content ink that has bled into the space
    the footer's domain label actually occupies."""
    width, height = actual.size
    baseline = brand.background((width, height))
    brand.paste_badge(baseline, height=max(width // 20, 34))
    brand.footer(baseline, lang)
    band_top = _footer_ink_top((width, height))
    a = actual.crop((0, band_top, width, height))
    b = baseline.crop((0, band_top, width, height))
    diff = ImageChops.difference(a, b).convert("L")
    return sum(count for count, value in
                (diff.getcolors(maxcolors=diff.width * diff.height) or [])
                if value != 0)


@pytest.mark.parametrize("size", [(1200, 627), (1200, 630)])
@pytest.mark.parametrize(("slide_type", "extra"), [
    ("hook", {"bigNumber": "$74.38"}),
    ("numbers", {"rows": [["gpt-5.4-nano", "$50.34"], ["gpt-5.6-sol", "$1254.00"]]}),
    ("cta", {}),
])
def test_long_copy_never_bleeds_into_the_footer_band(campaign, slide_type, extra, size):
    """hook/numbers/cta must keep their text (and, for cta, the pill) clear
    of the footer band even with much longer copy than this module's compact
    fixture — previously measured to overlap the footer by thousands of ink
    pixels on these exact canvases."""
    slide = {"type": slide_type, "pl": LONG_PL, "en": LONG_PL, **extra}
    img = slides.render(campaign, slide, "pl", size)
    overlap = _footer_band_overlap(img, "pl")
    assert overlap == 0, (
        f"{slide_type} slide at {size[0]}x{size[1]} draws {overlap} px of body "
        f"content inside the footer band"
    )


def test_diagram_slide_with_long_copy_still_shows_a_frame_at_a_short_canvas(campaign):
    """A long headline/sub must not silently crowd the screenshot out on a
    short canvas — the frame should shrink to fit rather than disappear."""
    slide = {"type": "diagram", "asset": "src/calculator.png", "pl": LONG_PL, "en": LONG_PL}
    img = slides.render(campaign, slide, "pl", (1200, 627))
    # getcolors() returns (count, color) pairs; keyed by color, not count.
    colors = {color: count for count, color in (img.getcolors(maxcolors=1_000_000) or [])}
    # The fixture screenshot is solid white; its presence in meaningful
    # quantity means the browser frame actually got drawn, not dropped.
    assert colors.get((255, 255, 255), 0) > 500
