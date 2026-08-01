import json

import pytest

import capture_screens  # noqa: E402
import spec  # noqa: E402

PAYLOAD = {
    "id": "demo", "track": "funnel-top",
    "target": "https://mi-code.pl/blog/x/", "utm": {"campaign": "demo"},
    "slides": [
        {"type": "hook", "pl": {"headline": "a"}, "en": {"headline": "a"}},
        {"type": "diagram", "asset": "src/calculator.png",
         "shot": {"path": "/blog/ai-agent-cost-per-month-model/",
                  "selector": ".calc"},
         "pl": {"headline": "b"}, "en": {"headline": "b"}},
        {"type": "diagram", "asset": "src/hero.png",
         "shot": {"path": "/"},
         "pl": {"headline": "c"}, "en": {"headline": "c"}},
        {"type": "cta", "pl": {"headline": "d"}, "en": {"headline": "d"}},
    ],
}


@pytest.fixture
def campaign(tmp_path, monkeypatch):
    root = tmp_path / "campaigns" / "demo"
    root.mkdir(parents=True)
    (root / "campaign.json").write_text(json.dumps(PAYLOAD), encoding="utf-8")
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    return spec.Campaign.load("demo")


def test_shots_for_lists_only_slides_that_declare_one(campaign):
    shots = capture_screens.shots_for(campaign)
    assert [s["asset"] for s in shots] == ["src/calculator.png", "src/hero.png"]


def test_shots_carry_the_selector_when_declared(campaign):
    shots = capture_screens.shots_for(campaign)
    assert shots[0]["selector"] == ".calc"
    assert shots[1]["selector"] is None


def test_shots_carry_the_page_path(campaign):
    shots = capture_screens.shots_for(campaign)
    assert shots[0]["path"] == "/blog/ai-agent-cost-per-month-model/"


def test_campaign_with_no_diagram_slides_needs_no_capture(campaign, tmp_path):
    payload = json.loads(json.dumps(PAYLOAD))
    payload["slides"] = [payload["slides"][0], payload["slides"][3]]
    (tmp_path / "campaigns" / "demo" / "campaign.json").write_text(
        json.dumps(payload), encoding="utf-8")
    assert capture_screens.shots_for(spec.Campaign.load("demo")) == []


def _load(payload, tmp_path, monkeypatch):
    root = tmp_path / "campaigns" / "demo"
    root.mkdir(parents=True, exist_ok=True)
    (root / "campaign.json").write_text(json.dumps(payload), encoding="utf-8")
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    return spec.Campaign.load("demo")


def test_a_language_neutral_slide_is_captured_once_not_once_per_language(campaign):
    """The precedence walk visits every slide once per language. A slide that
    declares nothing per language resolves identically both times, and those
    duplicates must collapse — otherwise every existing campaign silently
    doubles its browser round-trips and overwrites each file with itself."""
    shots = capture_screens.shots_for(campaign)
    assert len(shots) == 2, [s["asset"] for s in shots]


def test_per_language_shot_and_asset_yield_one_capture_per_language(tmp_path, monkeypatch):
    """The calculator screenshot renders its own headers and row labels from
    the site's i18n dictionaries, so the Polish and English decks need two
    captures of two different URLs. Declaring `asset`/`shot` inside the
    language blocks — the same place `rows` already lives — must produce both,
    in language order, without disturbing the other slides."""
    payload = json.loads(json.dumps(PAYLOAD))
    slide = payload["slides"][1]
    slide.pop("asset")
    slide.pop("shot")
    slide["pl"] = {"headline": "b", "asset": "src/calc-pl.png",
                   "shot": {"path": "/blog/x/", "selector": ".calc-table-wrap"}}
    slide["en"] = {"headline": "b", "asset": "src/calc-en.png",
                   "shot": {"path": "/en/blog/x/", "selector": ".calc-table-wrap"}}
    shots = capture_screens.shots_for(_load(payload, tmp_path, monkeypatch))
    assert [(s["asset"], s["path"]) for s in shots] == [
        ("src/calc-pl.png", "/blog/x/"),
        ("src/calc-en.png", "/en/blog/x/"),
        ("src/hero.png", "/"),
    ]
    assert shots[0]["selector"] == ".calc-table-wrap"


def test_a_language_that_overrides_only_the_asset_inherits_the_slide_level_shot(
        tmp_path, monkeypatch):
    """Language-level and slide-level are per key, not all-or-nothing: two
    captures of the *same* page (a page that reads its language from
    localStorage rather than the URL, say) is a legitimate spec, and dropping
    the `shot` fallback would silently produce only one of them."""
    payload = json.loads(json.dumps(PAYLOAD))
    slide = payload["slides"][1]
    slide.pop("asset")
    slide["pl"] = {"headline": "b", "asset": "src/calc-pl.png"}
    slide["en"] = {"headline": "b", "asset": "src/calc-en.png"}
    shots = capture_screens.shots_for(_load(payload, tmp_path, monkeypatch))
    assert [(s["asset"], s["path"], s["selector"]) for s in shots][:2] == [
        ("src/calc-pl.png", "/blog/ai-agent-cost-per-month-model/", ".calc"),
        ("src/calc-en.png", "/blog/ai-agent-cost-per-month-model/", ".calc"),
    ]


def test_shots_for_skips_a_slide_with_shot_but_no_asset_declared(tmp_path, monkeypatch):
    """A `shot` block with nowhere to save the file is not capturable — there
    is no `asset` key telling `capture()` what filename to write. Without this
    test, a mutant that drops the `slide.get("asset")` guard (keeping only the
    `shot` check) passes every other test in this file, because every other
    fixture slide that declares `shot` also declares `asset`."""
    payload = json.loads(json.dumps(PAYLOAD))
    payload["slides"][1].pop("asset")
    root = tmp_path / "campaigns" / "demo"
    root.mkdir(parents=True)
    (root / "campaign.json").write_text(json.dumps(payload), encoding="utf-8")
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    shots = capture_screens.shots_for(spec.Campaign.load("demo"))
    assert [s["asset"] for s in shots] == ["src/hero.png"]
