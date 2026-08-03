import importlib
import json
import warnings
from pathlib import Path

import playwright.sync_api
import pytest

import capture_screens  # noqa: E402
import render_warnings  # noqa: E402
import slides  # noqa: E402
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


# --- mermaid's `useMaxWidth` shrink ---------------------------------------
#
# Every number below was read off the live preview server with
# `page.evaluate` (`svg.style.maxWidth` against
# `svg.getBoundingClientRect().width`, viewport 1600, DSF 2), not invented,
# and reproduces the ink measurements in campaign-3-report.md §1.4 exactly:
# 813/686 = 0.84 with a 26 px ink band, 1311/686 = 0.52 with 13-16 px,
# 2346/686 = 0.29 with ~9 px. The article's column renders every mermaid SVG
# at 686 CSS px, which is why all eight of its figures capture at the same
# 1372 px and only their type differs.
_ARTICLE_COLUMN = 686.0

# The two figures campaign three actually shipped. Both are silent, and that
# is the calibration point: `agent-loop` (pl) renders 18-19 px of glyph ink on
# the finished carousel page, which is inside the 16-19 px band this project's
# Task 9 ruling accepted.
SHIPPED_AGENT_LOOP_PL = {
    "natural": 813.105, "rendered": _ARTICLE_COLUMN,
    "label": "Pętla agenta: model albo odpowiada, albo wywołuje narzędzia; "
             "wyniki wracają do niego i krok się powtarza.",
}
SHIPPED_AGENT_LOOP_EN = {
    "natural": 694.34, "rendered": _ARTICLE_COLUMN,
    "label": "The agent's loop: the model either answers or calls tools; the "
             "results come back to it and the step repeats.",
}
# The two figures of the same article that pass `slides._TALL_MIN_SCALE` at
# 0.733x while rendering 9-12 px glyphs — the trap this check exists for.
SHRUNK_GROUNDING_PL = {
    "natural": 1310.609, "rendered": _ARTICLE_COLUMN,
    "label": "Powiązanie z danymi: wFirma daje realne liczby, rejestry "
             "publiczne — dane o kontrahentach i autouzupełnianie po NIP.",
}
SHRUNK_TOOLS_MAP_PL = {
    "natural": 2346.155, "rendered": _ARTICLE_COLUMN,
    "label": "Mapa narzędzi: 58 dostępnych zawsze, a do 24 kolejnych włącza "
             "się, gdy użytkownik ma skonfigurowane kadry (HR) i KSeF.",
}
# The product page's LangGraph graph: narrower than its own 800 px column, so
# mermaid does not touch it. Its problem is geometry (0.374x on the carousel
# page), which `_TALL_MIN_SCALE` already reports.
PRODUCT_GRAPH = {"natural": 373.017, "rendered": 373.016, "label": None}

MERMAID_SHOT = {"asset": "src/figure.png", "path": "/blog/x/",
                "selector": "figure.article-figure pre.mermaid svg"}


def _warnings_for(figures, shot=MERMAID_SHOT, campaign_id="demo"):
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        capture_screens.check_mermaid_shrink(campaign_id, shot, figures)
    return [str(entry.message) for entry in caught]


@pytest.mark.parametrize("figure,factor", [
    (SHRUNK_GROUNDING_PL, "0.52"),
    (SHRUNK_TOOLS_MAP_PL, "0.29"),
])
def test_a_mermaid_figure_its_column_shrank_is_reported_at_capture_time(
        figure, factor):
    """The confirmed trap, closed at the only point the shrink is visible.

    `MermaidDiagram.svelte` initialises mermaid with `useMaxWidth: true`, so a
    figure wider than its column is scaled down whole — text included — before
    the screenshot is taken. The PNG records none of that: it comes out at the
    column's full width either way. Downstream, `slides._TALL_MIN_SCALE` reads
    only the capture-to-slide scale and so believes every capture arrives
    typeset inside `slides._CAPTURE_INK_BAND`; both figures here clear that
    floor at 0.733x while rendering 9-12 px glyphs, silently. Measured live,
    twice, on `accounting-ai-agent-architecture`.

    The message has to carry all three of campaign, asset and factor, because
    a capture run photographs several figures off one page and the operator's
    fix is to change one `selector` in `campaign.json`.
    """
    messages = _warnings_for([figure])
    assert len(messages) == 1, messages
    message = messages[0]
    assert f"{factor}x" in message, message
    assert MERMAID_SHOT["asset"] in message, message
    assert str(round(figure["natural"])) in message, message
    assert figure["label"][:20] in message, (
        f"the warning must name the figure, not just the file: {message}")


def test_the_captures_this_factory_ships_are_not_reported(capsys):
    """The other half of the rule, and the reason the floor is where it is.

    A check that fired on campaign three's own picture slide would be worse
    than no check: that capture measures 18-19 px of glyph ink on the finished
    carousel page — inside the band Task 9 accepted — so warning about it would
    teach the operator that this line means nothing. The product page's graph
    is here too: mermaid leaves it alone (373 px into an 800 px column) and its
    real problem, being twice as tall as the canvas, is `_TALL_MIN_SCALE`'s to
    report, not this one's.
    """
    assert _warnings_for([SHIPPED_AGENT_LOOP_PL]) == []
    assert _warnings_for([SHIPPED_AGENT_LOOP_EN]) == []
    assert _warnings_for([PRODUCT_GRAPH]) == []
    assert _warnings_for([SHIPPED_AGENT_LOOP_PL, SHIPPED_AGENT_LOOP_EN,
                          PRODUCT_GRAPH]) == []


def test_a_capture_with_no_mermaid_in_it_is_not_judged():
    """Campaign one's calculator table is prerendered HTML, not an SVG, so the
    page yields nothing to measure. Silence here is what keeps this check from
    becoming an opinion about every screenshot the factory takes — it speaks
    only about the one thing it can actually measure."""
    assert _warnings_for([]) == []
    assert _warnings_for(None) == []
    # A mermaid SVG rendered with `useMaxWidth: false` carries no inline
    # `max-width`, so there is no natural width to compare against; and an
    # element that is not laid out measures 0. Neither is a shrink.
    assert _warnings_for([{"natural": None, "rendered": 686.0, "label": "x"}]) == []
    assert _warnings_for([{"natural": 1310.6, "rendered": 0, "label": "x"}]) == []


def test_the_shrink_floor_is_derived_from_the_ink_band_not_chosen(monkeypatch):
    """The floor must move if the ink band is ever re-measured.

    `slides._CAPTURE_INK_BAND` is the height one line of text occupies in the
    captures `_TALL_MIN_SCALE` was calibrated against — 24 px without
    descenders, 30 px with. A shrink of `s` maps that band to `(24s, 30s)`, so
    at `s = 24/30` the tallest line of the shrunken capture is exactly as tall
    as the shortest line the calibration assumes. That is the whole derivation,
    and it is why this floor is not a number someone picked to make campaign
    three pass: it lands at 0.80 against a shipped 0.844.

    Reloading with a different band is the only way to tell a derivation from a
    hardcoded `0.8`, which is behaviourally identical today and silently wrong
    the day someone re-measures the band.
    """
    assert capture_screens._MERMAID_SHRINK_FLOOR == (
        slides._CAPTURE_INK_BAND[0] / slides._CAPTURE_INK_BAND[1])
    monkeypatch.setattr(slides, "_CAPTURE_INK_BAND", (15, 30))
    try:
        importlib.reload(capture_screens)
        assert capture_screens._MERMAID_SHRINK_FLOOR == 0.5
        # ...and the rule actually consults it: at a 0.5 floor the grounding
        # figure's 0.52x is no longer worth reporting.
        assert _warnings_for([SHRUNK_GROUNDING_PL]) == []
    finally:
        monkeypatch.undo()
        importlib.reload(capture_screens)
    assert _warnings_for([SHRUNK_GROUNDING_PL]) != []


def test_the_capture_warning_reaches_the_operator_and_the_callers_filter(capsys):
    """Same channel, same contract as the three generators'.

    `render_warnings.capturing` is `surfaced`'s sibling: one operator line on
    stderr naming the campaign and the asset, then the warning re-emitted with
    `warn_explicit` after the caller's own filters are back in force. The shape
    matters — the `catch_warnings` + `showwarning` variant that shipped once
    printed the line *and* swallowed the raise, silently defeating a CI gate
    running `-W error::RuntimeWarning`, which is worse than never surfacing it.
    """
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        with render_warnings.capturing("accounting-ai", "src/grounding-pl.png"):
            capture_screens.check_mermaid_shrink(
                "accounting-ai", MERMAID_SHOT, [SHRUNK_GROUNDING_PL])
    err = capsys.readouterr().err
    assert err.count("WARNING:") == 1, err
    assert "accounting-ai (capture): src/grounding-pl.png" in err, err
    assert "0.52x" in err, err
    assert len(caught) == 1, "the caller must still see the warning itself"

    with pytest.raises(RuntimeWarning):
        with warnings.catch_warnings():
            warnings.simplefilter("error", RuntimeWarning)
            with render_warnings.capturing("accounting-ai", "src/x.png"):
                capture_screens.check_mermaid_shrink(
                    "accounting-ai", MERMAID_SHOT, [SHRUNK_GROUNDING_PL])


def test_the_render_time_channel_still_reports_slide_context(capsys):
    """`surfaced` and `capturing` share one relay now; the line the three
    generators print — and the four coordinates their tests read off it — must
    not have moved in the process."""
    with warnings.catch_warnings(record=True):
        warnings.simplefilter("always")
        with render_warnings.surfaced("demo", "pl", "'li-single'", (1200, 627)):
            warnings.warn("slides: something", RuntimeWarning)
    err = capsys.readouterr().err
    assert "WARNING: demo (pl): 'li-single' at 1200x627 — slides: something" in err


# --- the check is wired into the capture run, not merely available ---------

class _FakeElement:
    def __init__(self, measured):
        self.measured = measured
        self.evaluated = []

    def screenshot(self, path):
        Path(path).write_bytes(b"\x89PNG\r\n\x1a\n")

    def evaluate(self, script):
        self.evaluated.append(script)
        return self.measured


class _FakePage:
    """Just enough of Playwright's Page for `capture()` to run start to end."""

    def __init__(self, measured):
        self.measured = measured
        self.elements = []

    def add_init_script(self, script): pass

    def add_style_tag(self, content=None): pass

    def goto(self, url, wait_until=None): pass

    def wait_for_selector(self, selector, timeout=None):
        element = _FakeElement(self.measured.get(selector, []))
        self.elements.append(element)
        return element

    def screenshot(self, path, full_page=False):
        Path(path).write_bytes(b"\x89PNG\r\n\x1a\n")

    def evaluate(self, script):
        return self.measured.get(None, [])


class _FakeBrowser:
    def __init__(self, page): self.page = page

    def new_page(self, **kwargs): return self.page

    def close(self): pass


class _FakePlaywright:
    def __init__(self, page):
        self._page = page
        self.chromium = self

    def launch(self): return _FakeBrowser(self._page)

    def __enter__(self): return self

    def __exit__(self, *exc): return False


def test_capture_measures_the_shrink_of_every_shot_it_takes(
        tmp_path, monkeypatch, capsys):
    """A detector nothing calls is a detector that does not exist.

    This is the wiring test: it drives the real `capture()` against a stubbed
    browser that hands back the grounding figure's live measurements, and
    requires the operator line to come out of the run itself — not out of a
    function an operator would have to know to call. Deleting the
    `check_mermaid_shrink` call from `capture()` leaves every other test in
    this file green.
    """
    payload = json.loads(json.dumps(PAYLOAD))
    selector = 'figure.article-figure:has(figcaption:has-text("x")) pre.mermaid svg'
    payload["slides"][1] = dict(payload["slides"][1], type="tall-diagram",
                                asset="src/grounding-pl.png",
                                shot={"path": "/blog/x/", "selector": selector})
    _load(payload, tmp_path, monkeypatch)
    page = _FakePage({selector: [SHRUNK_GROUNDING_PL]})
    monkeypatch.setattr(playwright.sync_api, "sync_playwright",
                        lambda: _FakePlaywright(page))

    with warnings.catch_warnings():
        warnings.simplefilter("always")
        written = capture_screens.capture("demo", "http://localhost:4173")

    assert [path.name for path in written] == ["grounding-pl.png", "hero.png"]
    assert all(path.is_file() for path in written)
    err = capsys.readouterr().err
    assert "WARNING: demo (capture): src/grounding-pl.png" in err, err
    assert "0.52x" in err, err
    assert page.elements[0].evaluated == [capture_screens._MERMAID_MEASURE_JS]
