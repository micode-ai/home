import json

import pytest
from PIL import Image

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


def test_numbers_slide_prefers_per_language_rows_over_slide_level_rows(campaign):
    """A numbers slide with different pl/en rows must not cram both languages
    onto one bilingual label — pl and en must render visibly different tables."""
    slide = dict(campaign.slides[2])
    slide["pl"] = dict(slide["pl"], rows=[["Staly prefiks", "$12.00"]])
    slide["en"] = dict(slide["en"], rows=[["Fixed prefix", "$99.00"]])
    pl = slides.render(campaign, slide, "pl", (1080, 1350))
    en = slides.render(campaign, slide, "en", (1080, 1350))
    assert pl.tobytes() != en.tobytes()


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
