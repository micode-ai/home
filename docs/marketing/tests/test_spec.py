import json
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

import pytest

import spec  # noqa: E402


def write_campaign(tmp_path: Path, payload: dict) -> Path:
    root = tmp_path / "campaigns" / payload["id"]
    root.mkdir(parents=True)
    (root / "campaign.json").write_text(json.dumps(payload), encoding="utf-8")
    return root


def write_raw_campaign(tmp_path: Path, campaign_id: str, raw: str) -> Path:
    root = tmp_path / "campaigns" / campaign_id
    root.mkdir(parents=True)
    (root / "campaign.json").write_text(raw, encoding="utf-8")
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
    link = spec.Campaign.load("demo").link("en", "x")
    assert link.count("/en/") == 1
    parts = urlsplit(link)
    assert parts.path == "/en/blog/x/"
    qs = parse_qs(parts.query)
    assert qs["utm_source"] == ["x"]
    assert qs["utm_medium"] == ["social"]
    assert qs["utm_campaign"] == ["demo"]


def test_link_keeps_utm_as_real_query_params_for_a_plain_pl_target(tmp_path, monkeypatch):
    write_campaign(tmp_path, VALID)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    link = spec.Campaign.load("demo").link("pl", "linkedin")
    parts = urlsplit(link)
    qs = parse_qs(parts.query)
    assert qs["utm_source"] == ["linkedin"]
    assert qs["utm_medium"] == ["social"]
    assert qs["utm_campaign"] == ["demo"]
    assert parts.fragment == ""


def test_link_preserves_an_existing_query_string(tmp_path, monkeypatch):
    payload = json.loads(json.dumps(VALID))
    payload["target"] = "https://mi-code.pl/blog/x/?ref=abc"
    write_campaign(tmp_path, payload)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    link = spec.Campaign.load("demo").link("pl", "linkedin")
    parts = urlsplit(link)
    qs = parse_qs(parts.query)
    assert qs["ref"] == ["abc"]
    assert qs["utm_source"] == ["linkedin"]
    assert qs["utm_medium"] == ["social"]
    assert qs["utm_campaign"] == ["demo"]


def test_link_keeps_the_fragment_after_the_query(tmp_path, monkeypatch):
    """Everything after '#' is a fragment, not a query param — UTM must land
    before it or analytics reading location.search sees nothing."""
    payload = json.loads(json.dumps(VALID))
    payload["target"] = "https://mi-code.pl/blog/x/#pricing"
    write_campaign(tmp_path, payload)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    link = spec.Campaign.load("demo").link("pl", "linkedin")
    parts = urlsplit(link)
    assert parts.fragment == "pricing"
    qs = parse_qs(parts.query)
    assert qs["utm_source"] == ["linkedin"]
    assert qs["utm_medium"] == ["social"]
    assert qs["utm_campaign"] == ["demo"]
    assert link.rindex("#") > link.index("?")


def test_link_handles_query_and_fragment_together(tmp_path, monkeypatch):
    payload = json.loads(json.dumps(VALID))
    payload["target"] = "https://mi-code.pl/blog/x/?ref=abc#pricing"
    write_campaign(tmp_path, payload)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    link = spec.Campaign.load("demo").link("pl", "linkedin")
    parts = urlsplit(link)
    assert parts.fragment == "pricing"
    qs = parse_qs(parts.query)
    assert qs["ref"] == ["abc"]
    assert qs["utm_source"] == ["linkedin"]
    assert qs["utm_medium"] == ["social"]
    assert qs["utm_campaign"] == ["demo"]


def test_link_prefixes_en_for_a_bare_domain_with_no_trailing_slash(tmp_path, monkeypatch):
    payload = json.loads(json.dumps(VALID))
    payload["target"] = "https://mi-code.pl"
    write_campaign(tmp_path, payload)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    link = spec.Campaign.load("demo").link("en", "linkedin")
    parts = urlsplit(link)
    assert parts.path.startswith("/en")
    qs = parse_qs(parts.query)
    assert qs["utm_source"] == ["linkedin"]
    assert qs["utm_medium"] == ["social"]
    assert qs["utm_campaign"] == ["demo"]


def test_load_rejects_malformed_json(tmp_path, monkeypatch):
    write_raw_campaign(tmp_path, "demo", "{not valid json")
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    with pytest.raises(spec.SpecError, match="demo"):
        spec.Campaign.load("demo")


def test_load_rejects_a_slide_that_is_not_an_object(tmp_path, monkeypatch):
    broken = json.loads(json.dumps(VALID))
    broken["slides"][0] = "banner"
    write_campaign(tmp_path, broken)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    with pytest.raises(spec.SpecError, match="slide 0"):
        spec.Campaign.load("demo")


def test_load_rejects_a_language_block_that_is_not_an_object(tmp_path, monkeypatch):
    broken = json.loads(json.dumps(VALID))
    broken["slides"][0]["en"] = "What does an AI agent cost?"
    write_campaign(tmp_path, broken)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    with pytest.raises(spec.SpecError, match="slide 0"):
        spec.Campaign.load("demo")


def test_render_dir_is_per_language(tmp_path, monkeypatch):
    write_campaign(tmp_path, VALID)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    campaign = spec.Campaign.load("demo")
    assert campaign.render_dir("pl").as_posix().endswith("creatives/demo/renders/pl")
