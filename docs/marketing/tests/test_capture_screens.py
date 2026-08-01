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
