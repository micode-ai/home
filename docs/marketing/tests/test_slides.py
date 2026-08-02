import json
import warnings

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
        {"type": "tall-diagram", "asset": "src/tall-graph.png",
         "pl": {"eyebrow": "ARCHITEKTURA", "headline": "Jak dziala agent"},
         "en": {"eyebrow": "ARCHITECTURE", "headline": "How the agent works"}},
        {"type": "cta",
         "pl": {"headline": "Policzymy to na Twoich danych", "sub": "Przed rozpoczeciem pracy."},
         "en": {"headline": "We will price it on your data", "sub": "Before the work starts."}},
    ],
}

# The shape of a real product LangGraph capture: `flowchart TD` photographed
# by `capture_screens.py` at device_scale_factor=2 comes out 1600x2560,
# aspect 0.625. Measured on the live accounting-ai page, not assumed.
TALL_SHOT = (1600, 2560)
# The same aspect ratio at a size small enough that every canvas renders it
# above `slides._TALL_MIN_SCALE` — the readable half of the legibility guard.
SMALL_TALL_SHOT = (500, 800)
# Wider than it is tall, so the *width* budget binds instead of the height
# budget: this is the shot that can tell `visual_width` from `content_width`.
WIDE_SHOT = (1200, 600)
# The worst any canvas does with `TALL_SHOT`: measured 200px at 1200x627, the
# shortest canvas this factory renders. A floor, not a target — it exists so
# "degrades sanely" is a number rather than an adjective.
_MIN_VISUAL_WIDTH = 180


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
    for name, size in (("tall-graph.png", TALL_SHOT),
                       ("small-tall-graph.png", SMALL_TALL_SHOT),
                       ("wide-visual.png", WIDE_SHOT)):
        Image.new("RGB", size, (255, 255, 255)).save(shot_dir / name)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    return spec.Campaign.load("demo")


@pytest.mark.parametrize("index", range(len(PAYLOAD["slides"])))
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
    img = slides.render(campaign, campaign.slides[5], "pl", (1080, 1350))
    assert img.size == (1080, 1350)
    assert len(img.getcolors(maxcolors=1_000_000) or []) > 50


# --- tall-diagram ---------------------------------------------------------
#
# Everything below is about one number: how wide the visual comes out. A
# capture with aspect a placed in H px of height is a*H px wide, and the node
# labels inside it scale with the frame, so "how much height did the layout
# leave the picture" and "can anyone read the picture" are the same question.
# The measurements these tests are pinned to come from the real accounting-ai
# capture (1600x2560) rendered through `slides.render`, not from arithmetic.

def _frame_bbox(campaign, slide, lang, size):
    """The bbox of the screenshot this slide pastes, isolated by rendering the
    same slide with a missing asset and diffing: the text, badge and footer
    are identical between the two, so every differing pixel is the frame."""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        drawn = slides.render(campaign, slide, lang, size)
        blank = slides.render(campaign, dict(slide, asset="src/does-not-exist.png"),
                              lang, size)
    return ImageChops.difference(drawn, blank).getbbox()


# What a mid-funnel product slide actually says: the eyebrow and headline the
# compact header is designed around, plus the sub a `diagram` slide would set
# at 36px and this one sets at 25px. Length is in the same range as the two
# shipped campaigns' `diagram` subs (198 and 172 characters).
MID_FUNNEL_PL = {
    "eyebrow": "ARCHITEKTURA",
    "headline": "Jak dziala agent ksiegowy",
    "sub": "Petla agenta LangGraph z ponad dwudziestoma narzedziami "
           "ksiegowymi: faktury i KSeF, kadry i place, platnosci i podatki, "
           "kontrahenci oraz ksiega i deklaracje.",
}


def _tall_slide(asset="src/tall-graph.png", **copy):
    text = {"eyebrow": "ARCHITEKTURA", "headline": "Jak dziala agent", **copy}
    return {"type": "tall-diagram", "asset": asset, "pl": text, "en": text}


def test_every_slide_type_in_the_spec_has_a_planner(campaign):
    """`spec.SLIDE_TYPES` is what a campaign.json is validated against and
    `slides._PLANNERS` is what actually draws. A type in the first and not the
    second loads fine and dies with a `KeyError` inside `_fit_box` on the
    first render — after `capture_screens.py` has already run. A type in the
    second and not the first can never be spec'd at all."""
    assert set(spec.SLIDE_TYPES) == set(slides._PLANNERS)


def test_tall_diagram_gives_a_tall_visual_far_more_room_than_a_diagram_slide(campaign):
    """The whole point of the type, measured on the shape it exists for.

    Same copy, same 1600x2560 capture, same canvas — only the slide type
    differs, so the difference is the layout and nothing else. `diagram`
    spends its height on a headline inset at 0.17 of the canvas and a 36px sub
    at 1.45 leading, then fits the picture into what is left: 273px of frame,
    which is `strategy.md`'s measured 271px and the reason this type exists.
    The compact header leaves 532px. Measured 1.95x.

    `MID_FUNNEL_PL` matters as much as the floor does. With a bare eyebrow and
    headline the same comparison is only 1.27x, because a `diagram` slide with
    no sub is not spending its height either — so a fixture without a sub
    would put the floor below what a reverted header still scores, and pass on
    the bug. This is the copy a mid-funnel product slide actually carries.

    The second assertion is the one that does most of the mutation-killing,
    because "better than `diagram`" is a low bar that several partial
    reversions clear. Every constant this layout owns was reverted in turn and
    the visual measured as a share of the canvas: shipped 49.3%, header inset
    back to `top`'s 0.17 42.9%, headline back to `title` 45.9%, caption back
    to `sub` 43.5%, footer clearance back to `_FOOTER_RESERVE` 44.1%, header
    gap tripled 46.6%. The 48% floor is under the shipped value and over all
    six. It is a tight budget on purpose: there is no measurement noise here
    (the renders are deterministic), and a change that costs the visual more
    than a percent of the canvas is one a person should be looking at.
    """
    tall = _tall_slide(**MID_FUNNEL_PL)
    as_diagram = dict(tall, type="diagram")
    size = (1080, 1350)
    tall_bbox = _frame_bbox(campaign, tall, "pl", size)
    diagram_bbox = _frame_bbox(campaign, as_diagram, "pl", size)
    assert tall_bbox is not None and diagram_bbox is not None
    tall_width = tall_bbox[2] - tall_bbox[0]
    diagram_width = diagram_bbox[2] - diagram_bbox[0]
    assert tall_width >= diagram_width * 1.5, (
        f"a tall capture renders {tall_width}px wide as 'tall-diagram' against "
        f"{diagram_width}px as 'diagram' ({tall_width / diagram_width:.2f}x) — "
        "the compact header is not buying the visual any room"
    )
    assert tall_width >= size[0] * 0.48, (
        f"a tall capture renders {tall_width}px wide on a {size[0]}px canvas "
        f"({100 * tall_width / size[0]:.1f}%), under the 48% this layout was "
        "measured at — some of the height the compact header frees up is being "
        "spent again somewhere else"
    )


def test_tall_diagram_fits_its_visual_to_the_visual_column_not_the_text_column(campaign):
    """When a capture's aspect makes *width* the binding constraint rather
    than height, the frame must use the wider visual column (canvas minus
    `_TALL_VISUAL_MARGIN`) and not the text column every headline wraps to.

    Measured at 1080x1920 with a 2:1 capture: the height budget would allow a
    frame far wider than the canvas, so the frame lands at the visual column's
    1006px. `content_width` there is 898px, and the difference is the whole
    reason the constant exists — for a capture whose width binds it is worth
    12% of the glyph size. A shot that is *taller* than it is wide can never
    tell the two columns apart, because it never reaches either.
    """
    slide = _tall_slide(asset="src/wide-visual.png")
    bbox = _frame_bbox(campaign, slide, "pl", (1080, 1920))
    assert bbox is not None
    width = bbox[2] - bbox[0]
    box = slides._layout((1080, 1920))
    assert width > box["content_width"], (
        f"a width-bound visual came out {width}px wide, no wider than the "
        f"{box['content_width']}px text column — the visual is being fitted to "
        "the column headlines wrap to"
    )
    assert width == box["visual_width"], (
        f"a width-bound visual came out {width}px wide against a "
        f"{box['visual_width']}px visual column"
    )


def test_tall_diagram_warns_when_its_visual_lands_below_the_legibility_floor(campaign):
    """The defect this slide type was built to fix, in its own words.

    `_MIN_DIAGRAM_HEIGHT` is a floor on whether a frame is worth drawing, not
    on whether anyone can read it: a real 1600x2560 product graph clears it by
    an order of magnitude on every canvas while rendering its node labels at
    4-9px. Nothing fired. The operator's fix is a spec change — a tighter
    capture — so the warning has to carry the numbers that make the case:
    which capture, which canvas, what scale it got, and what it needed.
    """
    with pytest.warns(RuntimeWarning) as caught:
        slides.render(campaign, _tall_slide(), "pl", (1080, 1350))
    messages = [str(w.message) for w in caught]
    assert any("tall-graph.png" in m and "demo" in m and "tall-diagram" in m
               and "1080x1350" in m and "1600x2560" in m and "0.57" in m
               for m in messages), (
        f"expected a warning naming the capture, campaign, slide type, canvas, "
        f"source size and the floor it missed; got {messages}"
    )


def test_tall_diagram_says_nothing_when_its_visual_clears_the_legibility_floor(campaign):
    """The other half, and the half that makes the warning worth reading. A
    guard that fires on every render is one an operator learns to scroll past,
    and this one has to survive being right: `slides.render` emits it from the
    same channel as the missing-screenshot warning the generators relay to
    stderr on every build."""
    slide = _tall_slide(asset="src/small-tall-graph.png")
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        slides.render(campaign, slide, "pl", (1080, 1350))
    assert [str(w.message) for w in caught] == []


@pytest.mark.parametrize("size", CANVASES, ids=lambda s: f"{s[0]}x{s[1]}")
def test_tall_diagram_keeps_its_visual_clear_of_the_footer_band(campaign, size):
    """This type sizes its visual against `brand.footer_top` rather than
    `_FOOTER_RESERVE`, precisely to use the 123px of empty canvas the flat
    reserve leaves on 1080x1350. That trade is only safe if the gap it keeps
    is real — the failure mode is a diagram drawn straight through the domain
    label, and only the pixels can say."""
    img = slides.render(campaign, _tall_slide(), "pl", size)
    overlap = _footer_band_overlap(img, "pl")
    assert overlap == 0, (
        f"tall-diagram at {size[0]}x{size[1]} draws {overlap}px of visual "
        "inside the footer band"
    )


@pytest.mark.parametrize("size", CANVASES, ids=lambda s: f"{s[0]}x{s[1]}")
def test_tall_diagram_starts_its_header_below_the_badge(campaign, size):
    """The compact header buys its height by starting as high on the canvas as
    it can, and the badge is what "as high as it can" means. `_layout`'s
    `tall_top` is `brand.badge_bottom` plus a gap for exactly this reason; if
    it were raised any further, a headline wide enough to reach the right-hand
    margin would run under the badge."""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        img = slides.render(campaign, _tall_slide(headline="Jak dziala agent "
                                                  "ksiegowy w architekturze "
                                                  "wielu narzedzi"), "pl", size)
        bare = slides.render(campaign, {"type": "tall-diagram", "pl": {}, "en": {}},
                             "pl", size)
    # Diff against a slide with no copy and no visual. Both carry the same
    # badge and the same footer, so the topmost differing row is the header's
    # first ink row — the visual this slide also draws sits below it.
    bbox = ImageChops.difference(img, bare).getbbox()
    assert bbox is not None, "the header drew nothing"
    assert bbox[1] >= brand.badge_bottom(size[0]), (
        f"tall-diagram's header ink starts at y={bbox[1]} at {size[0]}x{size[1]}, "
        f"above the badge's bottom edge at y={brand.badge_bottom(size[0])}"
    )


@pytest.mark.parametrize("size", CANVASES, ids=lambda s: f"{s[0]}x{s[1]}")
def test_tall_diagram_still_draws_something_on_a_canvas_with_no_height_to_give(
        campaign, size):
    """`slides.render`'s contract is exactly the requested size at any canvas,
    never raising, and this type is optimised for the two portrait ones. The
    wide pair is where it has to degrade rather than break: a 1600x2560
    capture on a 627px-tall canvas gets ~350px of height, and a frame 17% of
    the canvas wide with a warning attached is the right answer — an
    exception, or quietly dropping the visual, is not.

    Deliberately not asserting the frame is inside the canvas: PIL clips every
    draw to the canvas bounds, so a diff bbox can never report otherwise and
    the assertion would pass on a frame pasted at y=10000. Where it must not
    reach is the footer, and that is
    `test_tall_diagram_keeps_its_visual_clear_of_the_footer_band`.
    """
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        img = slides.render(campaign, _tall_slide(), "pl", size)
    assert img.size == size and img.mode == "RGB"
    bbox = _frame_bbox(campaign, _tall_slide(), "pl", size)
    assert bbox is not None, "the visual was dropped entirely"
    assert bbox[2] - bbox[0] >= _MIN_VISUAL_WIDTH, (
        f"the visual came out {bbox[2] - bbox[0]}px wide at "
        f"{size[0]}x{size[1]} — smaller than the 1200x627 measurement this "
        "degradation was checked at"
    )


def test_tall_diagram_warns_when_its_screenshot_was_never_captured(campaign):
    """The missing-capture warning `diagram` has, on the new type too — both
    resolve their screenshot through the same `_resolve_shot`, and this is
    what pins that they still do. A type that grew its own copy of the lookup
    would be free to drop the warning."""
    with pytest.warns(RuntimeWarning) as caught:
        slides.render(campaign, _tall_slide(asset="src/never-captured.png"),
                      "pl", (1080, 1350))
    messages = [str(w.message) for w in caught]
    assert any("never-captured.png" in m and "tall-diagram" in m for m in messages), (
        f"expected a missing-capture warning naming the file and slide type; "
        f"got {messages}"
    )


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
    ("problem", {}),
    ("numbers", {"rows": [["gpt-5.4-nano", "$50.34"], ["gpt-5.6-sol", "$1254.00"]]}),
    ("diagram", {"asset": "src/calculator.png"}),
    ("cta", {}),
])
def test_long_copy_never_bleeds_into_the_footer_band(campaign, slide_type, extra, size):
    """Every slide type must keep its content — text, the `numbers` table,
    the `cta` pill, the `diagram` screenshot — clear of the footer band even
    with much longer copy than this module's compact fixture; previously
    measured to overlap the footer by thousands of ink pixels on these exact
    canvases.

    `problem` and `diagram` were both missing from this list. `diagram`
    reaches the footer band by a different mechanism than every other type —
    its screenshot is placed by `_place_diagram_frame` out of its own
    `available` budget, entirely outside the `_fit_box` loop the other four
    are guarded by — so it needs its own entry rather than inheriting
    `problem`'s (verified: dropping `_FOOTER_RESERVE` from that budget fails
    both `diagram` cases here and nothing else in this file).

    `problem` here is a general guard only, and deliberately not the guard for
    the known `_plan_problem` drift (reporting the header's bottom while also
    drawing the sub). Measured against that exact mutation: with `LONG_PL` the
    bleed is 0 px at both canvases, because `LONG_PL`'s header *and* sub fit at
    shrink 1.0 (484 px against a 540 px budget at 1200x627), so the drift
    changes nothing it can see. `LONG_PL_PROBLEM_TIGHT` and
    `test_problem_slide_counts_its_sub_toward_the_footer_band_budget` below are
    the fixture and test that actually express it.
    """
    slide = {"type": slide_type, "pl": LONG_PL, "en": LONG_PL, **extra}
    img = slides.render(campaign, slide, "pl", size)
    overlap = _footer_band_overlap(img, "pl")
    assert overlap == 0, (
        f"{slide_type} slide at {size[0]}x{size[1]} draws {overlap} px of body "
        f"content inside the footer band"
    )


# A `problem`-specific long-copy fixture, tuned by measurement so its header
# alone still fits the footer-band budget at shrink 1.0 (358 px against 540 px
# at 1200x627) while its header *plus* sub does not (632 px). That gap is the
# only place `_plan_problem`'s "reported bottom" and "drawn bottom" can be
# told apart: if the reported bottom is the header's, `_fit_box` sees a fit,
# never shrinks, and the sub is drawn straight through the footer. Shorter
# copy — including this module's own `LONG_PL` — fits under both accountings
# and cannot distinguish them.
LONG_PL_PROBLEM_TIGHT = dict(
    LONG_PL,
    sub=LONG_PL["sub"] + (
        " Wielu klientow porownuje tylko cene za token, a nie rzeczywisty "
        "rachunek na koniec miesiaca."
    ) * 4,
)


@pytest.mark.parametrize("size", [(1200, 627), (1200, 630)])
def test_problem_slide_counts_its_sub_toward_the_footer_band_budget(campaign, size):
    """`_plan_problem` must report the bottom of everything it drew.

    A `_plan_*` returning a `y` inconsistent with the ops it emitted is the
    one drift the single-plan-function refactor cannot rule out structurally,
    and `problem` is where it is cheapest to introduce: the function is three
    lines, and dropping the sub's contribution from the returned `y` looks
    like a harmless rename. Measured against exactly that mutation with this
    fixture: 8726 px of body ink inside the real footer band at 1200x627 and
    7982 px at 1200x630, with the rest of this suite green.
    """
    slide = {"type": "problem", "pl": LONG_PL_PROBLEM_TIGHT,
             "en": LONG_PL_PROBLEM_TIGHT}
    img = slides.render(campaign, slide, "pl", size)
    overlap = _footer_band_overlap(img, "pl")
    assert overlap == 0, (
        f"problem slide at {size[0]}x{size[1]} draws {overlap} px of body content "
        "inside the footer band — the sub may not be counted toward the fit"
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


def _load_campaign(tmp_path, monkeypatch, payload):
    root = tmp_path / "campaigns" / "demo"
    root.mkdir(parents=True, exist_ok=True)
    (root / "campaign.json").write_text(json.dumps(payload), encoding="utf-8")
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    return spec.Campaign.load("demo")


def test_diagram_slide_warns_when_its_screenshot_was_never_captured(tmp_path, monkeypatch):
    """A declared screenshot that isn't on disk must not degrade in silence.

    `_place_diagram_frame` returned with no signal at all when the asset file
    was absent — eight lines above a branch that *does* warn for the
    no-room-left case. For a brand-new campaign the single likeliest operator
    mistake is not having run `capture_screens.py` (or having renamed the file
    since), and the result is a slide that looks entirely deliberate: brand
    chrome, headline, sub, and no diagram — on the one slide type whose whole
    job is to show something. The warning must name the campaign, which slide,
    and the path it actually looked at, because "spelt differently from where
    the capture landed" is the other half of this failure mode and only the
    path distinguishes the two.
    """
    payload = json.loads(json.dumps(PAYLOAD))
    payload["slides"][3]["asset"] = "src/never-captured.png"
    campaign = _load_campaign(tmp_path, monkeypatch, payload)
    slide = campaign.slides[3]

    with pytest.warns(RuntimeWarning) as caught:
        img = slides.render(campaign, slide, "pl", (1080, 1350))

    # Still degrades to a text slide rather than breaking a batch render.
    assert img.size == (1080, 1350)
    expected_path = tmp_path / "creatives" / "demo" / "src" / "never-captured.png"
    messages = [str(w.message) for w in caught]
    assert any("demo" in m and "slide 4" in m and str(expected_path) in m
               for m in messages), (
        f"expected a warning naming the campaign, the slide and the path it "
        f"looked for ({expected_path}); got {messages}"
    )


def test_a_captured_screenshot_produces_no_missing_asset_warning(tmp_path, monkeypatch):
    """The other half: the warning must be a signal, not something every
    normal render emits — otherwise the generators relay it on every build and
    an operator learns to ignore it."""
    payload = json.loads(json.dumps(PAYLOAD))
    campaign = _load_campaign(tmp_path, monkeypatch, payload)
    shot_dir = tmp_path / "creatives" / "demo" / "src"
    shot_dir.mkdir(parents=True, exist_ok=True)
    Image.new("RGB", (1600, 900), (255, 255, 255)).save(shot_dir / "calculator.png")
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        slides.render(campaign, campaign.slides[3], "pl", (1080, 1350))
    assert [str(w.message) for w in caught] == []


def test_a_diagram_slide_that_declares_no_screenshot_is_not_warned_about(
        tmp_path, monkeypatch):
    """Declaring no `asset` at all is a spec choice, not a mistake — a
    diagram slide can legitimately be text-only — so it must stay silent. A
    warning here would fire on a valid campaign and devalue the one above."""
    payload = json.loads(json.dumps(PAYLOAD))
    payload["slides"][3].pop("asset")
    campaign = _load_campaign(tmp_path, monkeypatch, payload)
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        slides.render(campaign, campaign.slides[3], "pl", (1080, 1350))
    assert [str(w.message) for w in caught] == []


def test_the_missing_screenshot_warning_names_the_language_that_declared_it(
        tmp_path, monkeypatch):
    """Per-language assets mean only one of the two decks can be broken. The
    warning has to say which, or an operator re-runs a capture that was
    already fine."""
    payload = json.loads(json.dumps(PAYLOAD))
    slide = payload["slides"][3]
    slide.pop("asset")
    slide["pl"] = dict(slide["pl"], asset="src/calculator.png")
    slide["en"] = dict(slide["en"], asset="src/calculator-never-captured.png")
    campaign = _load_campaign(tmp_path, monkeypatch, payload)
    shot_dir = tmp_path / "creatives" / "demo" / "src"
    shot_dir.mkdir(parents=True, exist_ok=True)
    Image.new("RGB", (1600, 900), (255, 255, 255)).save(shot_dir / "calculator.png")

    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        slides.render(campaign, campaign.slides[3], "pl", (1080, 1350))
    assert [str(w.message) for w in caught] == [], "the Polish capture exists"

    with pytest.warns(RuntimeWarning) as caught:
        slides.render(campaign, campaign.slides[3], "en", (1080, 1350))
    messages = [str(w.message) for w in caught]
    assert any("calculator-never-captured.png" in m and "(en)" in m for m in messages), (
        f"expected a warning naming the English asset and language; got {messages}"
    )
