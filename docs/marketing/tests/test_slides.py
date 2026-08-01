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
    # Two per-language captures of the same page, differing only in ink: the
    # real pair differs the same way (a Polish table vs an English one), and a
    # size difference alone would be indistinguishable from a resize bug.
    for name, fill in (("calculator-pl.png", (255, 255, 255)),
                       ("calculator-en.png", (0, 0, 0))):
        Image.new("RGB", (1600, 900), fill).save(shot_dir / name)
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


def test_diagram_slide_uses_the_screenshot_its_own_language_declares(campaign):
    """A screenshot of a page that renders its own text is not language-
    neutral: the article's cost table draws its headers and row labels from the
    site's i18n dictionaries, so one shared capture puts a Polish table on the
    English slide. Each language block may name its own `asset`, exactly as it
    may name its own `rows`."""
    slide = dict(campaign.slides[3])
    slide.pop("asset", None)
    slide["pl"] = dict(slide["pl"], asset="src/calculator-pl.png")
    slide["en"] = dict(slide["en"], asset="src/calculator-en.png")
    # Hold the *copy* identical across the two renders so the only thing that
    # can differ is which screenshot was pasted in.
    slide["en"] = dict(slide["en"], **{k: v for k, v in slide["pl"].items()
                                       if k != "asset"})
    pl = slides.render(campaign, slide, "pl", (1080, 1350))
    en = slides.render(campaign, slide, "en", (1080, 1350))
    assert pl.tobytes() != en.tobytes(), (
        "both languages rendered the same bytes from identical copy — the "
        "per-language asset was ignored and one capture served both decks"
    )


def test_diagram_slide_falls_back_to_the_slide_level_screenshot(campaign):
    """A language-neutral diagram (a mermaid graph, a product screenshot with
    no copy in it) declares its asset once at slide level and both decks use
    it — the fallback half of the same precedence rule."""
    slide = campaign.slides[3]
    assert "asset" not in slide["pl"] and "asset" not in slide["en"]
    with_asset = slides.render(campaign, slide, "pl", (1080, 1350))
    missing = dict(slide, asset="src/does-not-exist.png")
    without = slides.render(campaign, missing, "pl", (1080, 1350))
    assert with_asset.tobytes() != without.tobytes(), (
        "the slide-level asset stopped being used when no language declares one"
    )


def test_language_asset_wins_over_the_slide_level_one(campaign):
    """Isolates the precedence direction. With the language block naming a real
    capture, the slide-level value must have no effect at all — swapping it for
    a file that does not exist must not change a single byte. If the slide level
    were preferred (or merged, or used as a fallback when the language file is
    simply *different*), these two renders would diverge."""
    base = dict(campaign.slides[3])
    base["pl"] = dict(base["pl"], asset="src/calculator-en.png")
    a = slides.render(campaign, dict(base, asset="src/calculator.png"),
                      "pl", (1080, 1350))
    b = slides.render(campaign, dict(base, asset="src/does-not-exist.png"),
                      "pl", (1080, 1350))
    assert a.tobytes() == b.tobytes()


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


def _white_px(img: Image.Image) -> int:
    # getcolors() returns (count, color) pairs; keyed by color, not count.
    colors = {color: count for count, color in (img.getcolors(maxcolors=1_000_000) or [])}
    return colors.get((255, 255, 255), 0)


def test_diagram_slide_with_long_copy_still_shows_a_frame_at_a_short_canvas(campaign):
    """A long headline/sub must not silently crowd the screenshot out on a
    short canvas — the frame should shrink to fit rather than disappear.

    Counting raw white pixels against a fixed threshold is not enough: the
    brand chrome (badge, pill outlines, background glow) alone can clear a
    few-hundred-pixel bar with no screenshot drawn at all. Isolate the
    frame's actual contribution by rendering the identical slide twice —
    once with its screenshot asset present, once with the asset missing —
    and require the asset-present render to carry substantially more white
    ink. Everything else about the two renders (text, badge, footer) is
    identical, so any large difference must come from the frame itself."""
    slide = {"type": "diagram", "asset": "src/calculator.png", "pl": LONG_PL, "en": LONG_PL}
    with_asset = slides.render(campaign, slide, "pl", (1200, 627))
    missing = dict(slide, asset="src/does-not-exist.png")
    without_asset = slides.render(campaign, missing, "pl", (1200, 627))
    frame_contribution = _white_px(with_asset) - _white_px(without_asset)
    assert frame_contribution > 500, (
        f"diagram frame contributed only {frame_contribution} white px at 1200x627 "
        f"(with={_white_px(with_asset)}, without={_white_px(without_asset)}) — the "
        "screenshot may have been silently dropped"
    )


# A sub long enough that, combined with LONG_PL's headline, the header+sub
# text alone leaves less than `slides._MIN_DIAGRAM_HEIGHT` px for the
# screenshot at 1200x627 — the genuinely-no-room case, not just the
# needs-to-shrink case the test above covers.
LONG_PL_NO_ROOM_FOR_DIAGRAM = dict(
    LONG_PL,
    sub=LONG_PL["sub"] + " Wielu klientow porownuje tylko cene za token, nie rzeczywisty "
        "rachunek. Sprawdz to zanim podpiszesz umowe z dostawca modelu.",
)


def test_diagram_slide_warns_when_there_is_genuinely_no_room_for_the_screenshot(campaign):
    """When even a maximally-shrunk header/sub leaves no meaningful room for
    the screenshot, the operator must be told — not left with a diagram
    slide that silently rendered as a text-only slide instead."""
    slide = {"type": "diagram", "asset": "src/calculator.png",
             "pl": LONG_PL_NO_ROOM_FOR_DIAGRAM, "en": LONG_PL_NO_ROOM_FOR_DIAGRAM}
    with pytest.warns(RuntimeWarning) as caught:
        slides.render(campaign, slide, "pl", (1200, 627))
    messages = [str(w.message) for w in caught]
    assert any("demo" in m and "diagram" in m and "1200x627" in m for m in messages), (
        f"expected a warning naming the campaign, slide type, and canvas; got {messages}"
    )


# A cta-specific long-copy fixture, tuned so the header+sub alone lands
# just under the footer-band budget at 1200x627 *when the pill's own
# height is correctly counted toward that budget* — but overflows into the
# real footer ink if the pill's height is ever left out of the fitting
# decision (as `_measure_cta` briefly did in an earlier round). Picked by
# measurement, not guesswork: shorter copy either fits under both
# accountings or fails under both, so it can't tell them apart.
LONG_PL_CTA_TIGHT = {
    "eyebrow": "AI DLA BIZNESU",
    "headline": "Dlaczego rachunek za agenta AI bywa dziesiec razy wyzszy niz cena z "
                "cennika dostawcy modelu, a jak to sprawdzic zanim podpiszesz umowe na "
                "produkcyjne wdrozenie",
    "sub": ("Cennik podaje stawke za milion tokenow, ale Twoja miesieczna faktura zalezy "
            "od tego, ile tokenow faktycznie zuzywa caly przeplyw pracy produkcyjnego "
            "agenta w typowym miesiacu obslugi klientow i integracji z systemami "
            "zewnetrznymi firmy.") + (
        " Wiele zespolow o tym zapomina, dopoki nie zobaczy pierwszej faktury "
        "koncowej i notatki od dzialu finansowego."
    ) * 7,
}


def test_cta_pill_height_counts_toward_the_footer_band_budget(campaign):
    """The pill is the last thing a `cta` slide draws, so whether its own
    height is counted toward the vertical-budget check is what determines
    whether the *fitting* decision — not just the header/sub text — keeps
    it clear of the footer. `LONG_PL_CTA_TIGHT` is tuned so header+sub alone
    fits the budget only when the pill's height is also counted; if it were
    ever dropped from the count again (`brand.pill_height()` stopped being
    called, or its result stopped being added), the real pill would land
    ~850px deep into the footer band while this same check reported a fit."""
    slide = {"type": "cta", "pl": LONG_PL_CTA_TIGHT, "en": LONG_PL_CTA_TIGHT}
    img = slides.render(campaign, slide, "pl", (1200, 627))
    overlap = _footer_band_overlap(img, "pl")
    assert overlap == 0, (
        f"cta slide at 1200x627 draws {overlap} px of body content (the pill, most "
        "likely) inside the footer band — the pill's own height may not be counted "
        "toward the fit"
    )


# --- margin/alignment guard -----------------------------------------------

def _leftmost_ink_x(actual: Image.Image, plain: Image.Image):
    """The smallest x at which `actual` differs from a plain, contentless
    background of the same size — the left edge every left-aligned element
    (eyebrow, headline, row label, pill) actually starts drawing at."""
    bbox = ImageChops.difference(actual, plain).getbbox()
    return bbox[0] if bbox else None


def test_left_margin_is_constant_regardless_of_copy_length(campaign):
    """Task 5 builds a carousel deck where slides at the same canvas can
    carry very different copy lengths. If the left margin scaled down along
    with the type when a slide's copy needed shrinking, that slide's text
    would sit at a different left edge than its neighbours in the deck —
    visibly wrong in a document people swipe straight down. A short-copy and
    a long-copy render of the same slide type and canvas must start their
    ink at the same x, even though the long one needs a smaller type scale
    to fit (confirmed separately: LONG_PL's headline alone drops 1080x1350's
    title font from 77px to 69px, i.e. shrink < 1.0)."""
    size = (1080, 1350)
    short_slide = campaign.slides[0]  # fixture's short copy: shrink stays 1.0
    long_slide = dict(short_slide, pl=LONG_PL, en=LONG_PL)
    plain = brand.background(size)
    short_x = _leftmost_ink_x(slides.render(campaign, short_slide, "pl", size), plain)
    long_x = _leftmost_ink_x(slides.render(campaign, long_slide, "pl", size), plain)
    assert short_x == long_x, (
        f"left edge moved from {short_x}px (short copy) to {long_x}px (long copy) "
        f"at {size[0]}x{size[1]} — slides in the same deck would no longer line up"
    )


def test_fit_box_warns_when_copy_still_overflows_at_the_minimum_type_scale(campaign):
    """Past a certain point, no amount of shrinking makes copy fit (every
    font is already at its floor size) and `_fit_box` gives up. That must be
    loud, not silent — 20 `numbers` rows is far more than any real campaign
    table, chosen specifically to blow through the footer band even at the
    smallest type scale."""
    slide = {"type": "numbers",
             "rows": [[f"model-name-{i}", f"${i}.00"] for i in range(20)],
             "pl": {"headline": "x", "sub": "y"}, "en": {"headline": "x", "sub": "y"}}
    with pytest.warns(RuntimeWarning) as caught:
        slides.render(campaign, slide, "pl", (1200, 627))
    messages = [str(w.message) for w in caught]
    assert any("numbers" in m and "1200x627" in m for m in messages), (
        f"expected a warning naming the slide type and canvas; got {messages}"
    )
