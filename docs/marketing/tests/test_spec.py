import json
from pathlib import Path

import pytest

import spec  # noqa: E402


def write_campaign(tmp_path: Path, payload: dict) -> Path:
    root = tmp_path / "campaigns" / payload["id"]
    root.mkdir(parents=True)
    (root / "campaign.json").write_text(json.dumps(payload), encoding="utf-8")
    return root


VALID = {
    "id": "demo",
    "track": "funnel-top",
    "target": "https://mi-code.pl/blog/ai-agent-cost-per-month-model/",
    "utm": {"campaign": "demo"},
    "slides": [
        {"type": "hook", "bigNumber": "$74.38",
         "pl": {"headline": "Ile kosztuje agent AI?"},
         "en": {"headline": "What does an AI agent cost?"}},
        {"type": "cta",
         "pl": {"headline": "Policzymy to"}, "en": {"headline": "We will price it"}},
    ],
}


def test_load_reads_id_track_and_slides(tmp_path, monkeypatch):
    write_campaign(tmp_path, VALID)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    campaign = spec.Campaign.load("demo")
    assert campaign.id == "demo"
    assert campaign.track == "funnel-top"
    assert len(campaign.slides) == 2


def test_load_rejects_unknown_slide_type(tmp_path, monkeypatch):
    broken = json.loads(json.dumps(VALID))
    broken["slides"][0]["type"] = "banner"
    write_campaign(tmp_path, broken)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    with pytest.raises(spec.SpecError, match="banner"):
        spec.Campaign.load("demo")


def test_load_rejects_slide_missing_a_language(tmp_path, monkeypatch):
    """A slide with no EN block would silently render an empty English creative."""
    broken = json.loads(json.dumps(VALID))
    del broken["slides"][1]["en"]
    write_campaign(tmp_path, broken)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    with pytest.raises(spec.SpecError, match="en"):
        spec.Campaign.load("demo")


def test_load_rejects_campaign_without_cta_slide(tmp_path, monkeypatch):
    """Lead generation is the whole point; a deck with no CTA is a defect."""
    broken = json.loads(json.dumps(VALID))
    broken["slides"] = [broken["slides"][0]]
    write_campaign(tmp_path, broken)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    with pytest.raises(spec.SpecError, match="cta"):
        spec.Campaign.load("demo")


def test_load_reports_a_missing_campaign_by_name(tmp_path, monkeypatch):
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    with pytest.raises(spec.SpecError, match="nope"):
        spec.Campaign.load("nope")


def test_text_returns_the_requested_language(tmp_path, monkeypatch):
    write_campaign(tmp_path, VALID)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    campaign = spec.Campaign.load("demo")
    assert campaign.text(campaign.slides[0], "pl")["headline"] == "Ile kosztuje agent AI?"
    assert campaign.text(campaign.slides[0], "en")["headline"] == "What does an AI agent cost?"


def test_link_appends_utm(tmp_path, monkeypatch):
    write_campaign(tmp_path, VALID)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    link = spec.Campaign.load("demo").link("pl", "linkedin")
    assert "utm_source=linkedin" in link
    assert "utm_medium=social" in link
    assert "utm_campaign=demo" in link


def test_link_uses_the_en_prefix_for_english(tmp_path, monkeypatch):
    write_campaign(tmp_path, VALID)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    campaign = spec.Campaign.load("demo")
    assert campaign.link("en", "linkedin").startswith("https://mi-code.pl/en/blog/")
    assert campaign.link("pl", "linkedin").startswith("https://mi-code.pl/blog/")


def test_link_does_not_double_the_en_prefix(tmp_path, monkeypatch):
    payload = json.loads(json.dumps(VALID))
    payload["target"] = "https://mi-code.pl/en/blog/x/"
    write_campaign(tmp_path, payload)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    assert spec.Campaign.load("demo").link("en", "x").count("/en/") == 1


def test_render_dir_is_per_language(tmp_path, monkeypatch):
    write_campaign(tmp_path, VALID)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    campaign = spec.Campaign.load("demo")
    assert campaign.render_dir("pl").as_posix().endswith("creatives/demo/renders/pl")
