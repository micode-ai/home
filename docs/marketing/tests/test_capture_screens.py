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


def test_a_tall_diagram_slide_is_captured_like_any_other_picture_slide(
        tmp_path, monkeypatch):
    """`shots_for` walks slides, not slide *types*, and it has to keep doing
    that: `tall-diagram` is the type the six mid-funnel campaigns photograph
    the product pages' LangGraph graphs with, and a type filter here would
    leave every one of them with a spec that declares a capture, a capture run
    that reports nothing to do, and six decks rendering a picture slide with
    no picture — the exact silent-degradation shape `slides._resolve_shot`
    warns about, but one step earlier where nothing warns at all."""
    payload = json.loads(json.dumps(PAYLOAD))
    payload["slides"][1] = dict(
        payload["slides"][1], type="tall-diagram",
        asset="src/accounting-ai-graph.png",
        shot={"path": "/products/accounting-ai/",
              "selector": ".diagram-wrap:has(pre.mermaid svg)"})
    campaign = _load(payload, tmp_path, monkeypatch)
    shots = capture_screens.shots_for(campaign)
    assert {"asset": "src/accounting-ai-graph.png",
            "path": "/products/accounting-ai/",
            "selector": ".diagram-wrap:has(pre.mermaid svg)"} in shots
    assert capture_screens.target_for(campaign, shots[0]) == (
        tmp_path / "creatives" / "demo" / "src" / "accounting-ai-graph.png")


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


def test_one_asset_captured_from_two_pages_is_a_spec_error(tmp_path, monkeypatch):
    """`asset` is the filename, so two captures that resolve to the same one
    are not two captures — they are one file written twice.

    The dedupe key used to be the whole (asset, path, selector) triple, which
    treated this as two distinct pieces of work: two entries, one filename,
    the second `element.screenshot()` overwriting the first, and the Polish
    deck shipping the English table (or the other way round, depending on
    `LANGS` order) with nothing anywhere saying so. The per-language `asset`
    that Task 9 added is exactly what makes this reachable — before it, a
    single slide could only name one asset.
    """
    payload = json.loads(json.dumps(PAYLOAD))
    slide = payload["slides"][1]
    slide.pop("asset")
    slide.pop("shot")
    slide["pl"] = {"headline": "b", "asset": "src/calc.png",
                   "shot": {"path": "/blog/x/", "selector": ".calc-table-wrap"}}
    slide["en"] = {"headline": "b", "asset": "src/calc.png",
                   "shot": {"path": "/en/blog/x/", "selector": ".calc-table-wrap"}}
    with pytest.raises(spec.SpecError) as exc:
        capture_screens.shots_for(_load(payload, tmp_path, monkeypatch))
    message = str(exc.value)
    assert "demo" in message, f"the error must name the campaign: {message}"
    assert "src/calc.png" in message, f"the error must name the asset: {message}"
    assert "/blog/x/" in message and "/en/blog/x/" in message, (
        f"the error must name both pages that would write it: {message}"
    )


def test_one_asset_captured_from_one_page_with_two_selectors_is_a_spec_error(
        tmp_path, monkeypatch):
    """Same clobber, arrived at from the other direction: same page, same
    filename, two different elements photographed into it."""
    payload = json.loads(json.dumps(PAYLOAD))
    slide = payload["slides"][1]
    slide.pop("asset")
    slide.pop("shot")
    slide["pl"] = {"headline": "b", "asset": "src/calc.png",
                   "shot": {"path": "/blog/x/", "selector": ".calc-table-wrap"}}
    slide["en"] = {"headline": "b", "asset": "src/calc.png",
                   "shot": {"path": "/blog/x/", "selector": ".bar-outer"}}
    with pytest.raises(spec.SpecError, match="src/calc.png"):
        capture_screens.shots_for(_load(payload, tmp_path, monkeypatch))


def test_the_same_asset_from_the_same_page_still_collapses_to_one_capture(campaign):
    """The legitimate half of the same rule, restated so the fix above cannot
    be "implemented" by simply rejecting every repeat: a language-neutral
    diagram declares its asset once at slide level, is visited once per
    language, resolves identically both times, and must still cost exactly one
    browser round-trip and one file."""
    shots = capture_screens.shots_for(campaign)
    assert len(shots) == 2, [s["asset"] for s in shots]
    assert len({s["asset"] for s in shots}) == 2


def test_capture_writes_exactly_where_the_renderer_reads(campaign):
    """The writer and the reader must resolve an asset the same way.

    They did not: `capture()` wrote to `creatives/<id>/src/` +
    `Path(asset).name` while `spec.Campaign.asset()` — which
    `slides._place_diagram_frame` calls — resolves `creatives/<id>/` + the
    whole relative path. Identical for the `src/x.png` assets this campaign
    happens to declare, and silently divergent for anything else. The fix is
    that there is now only one resolver; this asserts that, using an asset
    whose directory is *not* `src/` so the old two-resolver behaviour is
    distinguishable from the new one."""
    shot = {"asset": "screens/graph.png", "path": "/products/x/", "selector": None}
    assert capture_screens.target_for(campaign, shot) == campaign.asset(shot)
    assert capture_screens.target_for(campaign, shot).parent.name == "screens", (
        "capture writes into src/ while the renderer looks in screens/"
    )


def test_capture_target_matches_the_renderer_for_the_assets_in_use(campaign):
    """And for the shape every campaign actually declares today, so the fix
    is proven not to have moved the existing captures."""
    for shot in capture_screens.shots_for(campaign):
        assert capture_screens.target_for(campaign, shot) == campaign.asset(shot)
        assert capture_screens.target_for(campaign, shot).parent.name == "src"


def test_main_reports_a_capture_failure_as_a_message_not_a_traceback(
        campaign, monkeypatch, capsys):
    """`capture()` raises `RuntimeError` with an operator-facing message for
    all three of its failure modes (preview server not running, page never
    went quiet, selector never appeared). `main()` caught only `SpecError`, so
    every one of those carefully-written messages reached the console as a
    traceback with the message buried at the bottom — which is exactly what
    writing them was meant to avoid."""
    def explode(campaign_id, base_url=capture_screens.DEFAULT_BASE):
        raise RuntimeError(
            "demo: could not load http://localhost:4173/ — the preview server "
            "does not appear to be running")

    monkeypatch.setattr(capture_screens, "capture", explode)
    assert capture_screens.main(["capture_screens.py", "demo"]) == 1
    captured = capsys.readouterr()
    assert "preview server" in captured.err, captured.err
    assert "Traceback" not in captured.err and "Traceback" not in captured.out


def test_main_still_reports_a_spec_error_as_a_message(campaign, monkeypatch, capsys):
    """The clause added for RuntimeError must not have displaced this one."""
    def explode(campaign_id, base_url=capture_screens.DEFAULT_BASE):
        raise spec.SpecError("demo: no campaign spec")

    monkeypatch.setattr(capture_screens, "capture", explode)
    assert capture_screens.main(["capture_screens.py", "demo"]) == 1
    assert "no campaign spec" in capsys.readouterr().err
