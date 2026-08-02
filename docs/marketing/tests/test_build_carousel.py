import json
import re
import warnings
from pathlib import Path

import pytest
from PIL import Image

import build_carousel
import spec

PAYLOAD = {
    "id": "demo", "track": "funnel-top",
    "target": "https://mi-code.pl/blog/x/", "utm": {"campaign": "demo"},
    "slides": [
        {"type": "hook", "bigNumber": "$74.38",
         "pl": {"headline": "Ile kosztuje agent AI?"},
         "en": {"headline": "What does an AI agent cost?"}},
        {"type": "problem",
         "pl": {"headline": "To zalezy nie jest odpowiedzia"},
         "en": {"headline": "It depends is not an answer"}},
        {"type": "cta",
         "pl": {"headline": "Policzymy to"}, "en": {"headline": "We will price it"}},
    ],
}


@pytest.fixture
def workspace(tmp_path, monkeypatch):
    root = tmp_path / "campaigns" / "demo"
    root.mkdir(parents=True)
    (root / "campaign.json").write_text(json.dumps(PAYLOAD), encoding="utf-8")
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    return tmp_path


def _pdf_page_count(pdf: Path) -> int:
    """Pillow's PDF writer emits exactly one `/Type /Pages` catalog object
    carrying `/Count N` for the whole document. Reading that marker back
    proves how many pages actually landed in the file without pulling in a
    PDF-parsing dependency the rest of this factory doesn't otherwise need."""
    data = pdf.read_bytes()
    match = re.search(rb"/Type\s*/Pages.{0,80}?/Count\s+(\d+)", data, re.DOTALL)
    assert match, f"no /Pages /Count marker found in {pdf}"
    return int(match.group(1))


def test_writes_one_png_per_slide_per_language(workspace):
    build_carousel.build("demo", ["pl", "en"])
    for lang in ("pl", "en"):
        out = workspace / "creatives" / "demo" / "renders" / lang
        assert sorted(p.name for p in out.glob("carousel-*.png")) == [
            "carousel-01.png", "carousel-02.png", "carousel-03.png"
        ]


def test_pages_use_the_linkedin_carousel_canvas(workspace):
    build_carousel.build("demo", ["pl"])
    page = workspace / "creatives" / "demo" / "renders" / "pl" / "carousel-01.png"
    with Image.open(page) as img:
        assert img.size == (1080, 1350)


def test_writes_a_single_pdf_with_every_page(workspace):
    """LinkedIn only accepts carousels as a PDF document."""
    build_carousel.build("demo", ["pl"])
    pdf = workspace / "creatives" / "demo" / "renders" / "pl" / "carousel.pdf"
    assert pdf.is_file()
    assert pdf.stat().st_size > 5000
    assert pdf.read_bytes().startswith(b"%PDF")
    # A PDF that only carried the first page would already satisfy every
    # assertion above (a single 1080x1350 page is tens of KB on its own) —
    # this is the one check that actually proves every slide made it in.
    assert _pdf_page_count(pdf) == len(PAYLOAD["slides"]), (
        "carousel.pdf must contain one page per slide, not just the first"
    )


def test_build_returns_every_path_it_wrote(workspace):
    written = build_carousel.build("demo", ["pl"])
    assert len(written) == 4  # three pages plus the pdf
    assert all(p.exists() for p in written)


def test_rerun_overwrites_instead_of_accumulating(workspace):
    build_carousel.build("demo", ["pl"])
    build_carousel.build("demo", ["pl"])
    out = workspace / "creatives" / "demo" / "renders" / "pl"
    assert len(list(out.glob("carousel-*.png"))) == 3


def test_stale_pages_are_removed_when_the_deck_shrinks(workspace):
    build_carousel.build("demo", ["pl"])
    shorter = json.loads(json.dumps(PAYLOAD))
    shorter["slides"] = [shorter["slides"][0], shorter["slides"][2]]
    (workspace / "campaigns" / "demo" / "campaign.json").write_text(
        json.dumps(shorter), encoding="utf-8")
    build_carousel.build("demo", ["pl"])
    out = workspace / "creatives" / "demo" / "renders" / "pl"
    assert len(list(out.glob("carousel-*.png"))) == 2


def test_pdf_pages_declare_the_right_physical_page_size(workspace):
    """The PDF's page geometry, which nothing tested.

    `resolution` in `pages[0].save(...)` sets *only* the nominal page size —
    Pillow does not resample, so every page keeps its full 1080x1350 pixel
    data whatever value is passed. Which means dropping 150.0 to 10.0 leaves
    the page count, the file signature, the file size and every PNG untouched
    (the whole suite stayed green against exactly that mutation) while the
    MediaBox collapses from 518.4x648 pt — a 7.2" x 9" page — to 51.8x64.8 pt,
    a postage stamp that LinkedIn would publish as a thumbnail. "A PDF ready
    to upload to LinkedIn" is the spec's first success criterion, so the
    geometry is asserted here in points, hardcoded: deriving the expected
    value from `build_carousel.PDF_RESOLUTION` would make this test move with
    the mutation instead of catching it.
    """
    build_carousel.build("demo", ["pl"])
    pdf = workspace / "creatives" / "demo" / "renders" / "pl" / "carousel.pdf"
    boxes = re.findall(
        rb"/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]",
        pdf.read_bytes())
    assert len(boxes) == len(PAYLOAD["slides"]), (
        f"expected one /MediaBox per page, found {len(boxes)}"
    )
    # 1080 px / 150 dpi * 72 pt-per-inch = 518.4 pt; 1350 px likewise = 648 pt.
    for box in boxes:
        x0, y0, x1, y1 = (float(v) for v in box)
        assert (x0, y0) == (0.0, 0.0), f"page origin is {(x0, y0)}, not (0, 0)"
        assert round(x1, 1) == 518.4 and round(y1, 1) == 648.0, (
            f"carousel page is {x1}x{y1} pt; a 1080x1350 page at 150 dpi is "
            "518.4x648.0 pt (7.2in x 9in)"
        )


def test_each_page_renders_its_own_slide(workspace):
    """Guards against a build() that iterates the right number of times but
    renders the same slide (e.g. slide 0) onto every page instead of the
    slide at that position — every other test here would still pass against
    that bug: the file count, the PDF page count, and the canvas size are
    all unaffected by which slide's content ends up on a given page."""
    build_carousel.build("demo", ["pl"])
    out = workspace / "creatives" / "demo" / "renders" / "pl"
    contents = []
    for index in range(1, len(PAYLOAD["slides"]) + 1):
        with Image.open(out / f"carousel-{index:02d}.png") as img:
            contents.append(img.tobytes())
    assert len(set(contents)) == len(PAYLOAD["slides"]), (
        "every carousel page must render its own slide's content"
    )


def test_an_unknown_language_is_rejected_by_name(workspace):
    """`build_carousel.py cost-of-ai-agent ru` used to die with a bare
    `KeyError: 'ru'` raised deep inside spec.py — a traceback that never says
    the offending value came from the command line, and never says which
    languages would have worked. The factory renders pl and en; anything else
    must be a `SpecError`, which `main()` already prints as one line."""
    with pytest.raises(spec.SpecError) as exc:
        build_carousel.build("demo", ["ru"])
    message = str(exc.value)
    assert "'ru'" in message, f"the error must name the bad language: {message}"
    assert "'pl'" in message and "'en'" in message, (
        f"the error must name the supported languages: {message}"
    )


def test_an_unknown_language_is_rejected_before_anything_is_written(workspace):
    """Validation up front, not mid-run: `pl ru` must not leave a half-built
    Polish deck behind for the operator to wonder about."""
    with pytest.raises(spec.SpecError):
        build_carousel.build("demo", ["pl", "ru"])
    out = workspace / "creatives" / "demo" / "renders"
    assert not list(out.rglob("carousel-*.png")), "pages were written before the check"


# --- overflow warnings ----------------------------------------------------
#
# `slides._fit_box` raises a RuntimeWarning (not an exception) when a slide's
# copy still overflows the footer band at the minimum type scale.
# build_single.py and build_reel.py surface it as an operator-facing line;
# build_carousel.py used to let it propagate raw, which is worse than it
# sounds. `-W error::RuntimeWarning` still fired, but under the *default*
# filters Python dedupes by (message text, code location) — so a deck with
# two overflowing slides rendered in two languages printed exactly one
# anonymous `slides.py:NNN: RuntimeWarning` line naming neither the campaign,
# nor the language, nor which of the pages was clipped, while the operator
# was looking at a directory of freshly written PNGs.
#
# `_HEADLINE_UNIT`/`_SUB_UNIT` x4 reliably overflows the footer band at this
# task's 1080x1350 canvas — measured against the real `slides._fit_box`, not
# guessed at: x2 is clean, x3 is the first multiplier that warns, x4 keeps a
# margin above it.
_HEADLINE_UNIT = ("Dlaczego rachunek za agenta AI bywa dziesiec razy wyzszy niz cena z "
                  "cennika dostawcy modelu jezykowego, a jak to sprawdzic zanim podpiszesz "
                  "umowe na wdrozenie produkcyjne twojej firmy? ")
_SUB_UNIT = ("Cennik podaje stawke za milion tokenow, ale Twoja miesieczna faktura zalezy "
             "od tego, ile tokenow faktycznie zuzywa caly przeplyw pracy produkcyjnego "
             "agenta w typowym miesiacu obslugi klientow i integracji z systemami "
             "zewnetrznymi firmy. ")
OVERFLOWING_COPY = {
    "eyebrow": "AI DLA BIZNESU",
    "headline": _HEADLINE_UNIT * 4,
    "sub": _SUB_UNIT * 4,
}


def _write_overflowing_campaign(workspace: Path, indexes=(0,)) -> None:
    overflowing = json.loads(json.dumps(PAYLOAD))
    for index in indexes:
        for lang in ("pl", "en"):
            overflowing["slides"][index][lang] = dict(OVERFLOWING_COPY)
    (workspace / "campaigns" / "demo" / "campaign.json").write_text(
        json.dumps(overflowing), encoding="utf-8")


def test_operator_is_warned_when_copy_overflows_the_footer_band(workspace, capsys):
    """build() must convert slides.py's bare RuntimeWarning into an
    unmissable, campaign/language/page-specific line on stderr — not leave it
    as something only visible under `pytest.warns` or `-W error`."""
    _write_overflowing_campaign(workspace)
    build_carousel.build("demo", ["pl"])
    captured = capsys.readouterr()
    assert "WARNING" in captured.err
    assert "demo" in captured.err, "operator message must name the campaign"
    assert "pl" in captured.err, "operator message must name the language"
    assert "1080x1350" in captured.err, "operator message must name the canvas"


def test_every_overflowing_page_gets_its_own_named_line(workspace, capsys):
    """The specific thing a raw propagated warning cannot do.

    Two overflowing slides (pages 01 and 03) rendered in two languages is four
    distinct problems, and the four messages slides.py produces are identical
    strings from an identical code location — so the default warning filters
    collapse them to ONE printed line, attributed to nothing. Assert all four
    are reported and that each names its own page and its own language."""
    _write_overflowing_campaign(workspace, indexes=(0, 2))
    build_carousel.build("demo", ["pl", "en"])
    lines = [line for line in capsys.readouterr().err.splitlines() if "WARNING" in line]
    assert len(lines) == 4, (
        f"expected one operator line per (overflowing page, language), got "
        f"{len(lines)}: {lines}"
    )
    reported = {(("(pl)" in line and "pl") or "en", page)
                for line in lines
                for page in ("carousel page 01", "carousel page 03")
                if page in line}
    assert reported == {("pl", "carousel page 01"), ("pl", "carousel page 03"),
                        ("en", "carousel page 01"), ("en", "carousel page 03")}, (
        f"lines do not name each overflowing page and language: {lines}"
    )


def test_normal_copy_length_produces_no_overflow_warning(workspace, capsys):
    """The warning path must not fire on ordinary campaign copy — otherwise
    the operator message would be noise every build produces, not a signal
    that something needs shortening."""
    build_carousel.build("demo", ["pl", "en"])
    assert "WARNING" not in capsys.readouterr().err


def test_overflow_raises_when_the_caller_treats_runtimewarning_as_an_error(workspace):
    """Surfacing the warning must not consume it. A CI gate running with
    `-W error::RuntimeWarning` got an exception from the raw propagated
    warning before this fix, and must still get one after it — Task 6's
    first attempt at operator-facing warnings silently broke exactly this."""
    _write_overflowing_campaign(workspace)
    with warnings.catch_warnings():
        warnings.simplefilter("error")
        with pytest.raises(RuntimeWarning):
            build_carousel.build("demo", ["pl"])


def test_overflow_warns_and_prints_exactly_once_per_overflowing_page(workspace, capsys):
    """Re-emitting the captured warning must not double it up: under default
    filters a caller must see exactly one RuntimeWarning and exactly one
    operator line per overflowing page — not zero (suppressed) and not two
    (the original plus a duplicate re-emit)."""
    _write_overflowing_campaign(workspace, indexes=(0, 2))
    with pytest.warns(RuntimeWarning) as caught:
        build_carousel.build("demo", ["pl"])
    runtime = [w for w in caught if issubclass(w.category, RuntimeWarning)]
    assert len(runtime) == 2, (
        f"expected exactly one RuntimeWarning per overflowing page, got "
        f"{len(runtime)} — a dropped or duplicated re-emit would show up here"
    )
    assert capsys.readouterr().err.count("WARNING") == 2


def test_the_operator_line_survives_a_caller_that_ignores_the_warning(workspace, capsys):
    """The operator line and the Python warning are two separate channels, and
    the block's own `simplefilter("always")` is what keeps them separate.

    A caller may legitimately silence `RuntimeWarning` — a batch script
    rendering eleven campaigns, say — and must still be told, on stderr, which
    page of which deck came out clipped; that is the whole reason the operator
    line exists rather than just letting the warning through. Capture is
    therefore unconditional (the lifted filter inside the block), while
    *re-emission* honours whatever the caller asked for: here, silence.
    Removing that `simplefilter` leaves every other warning test in this
    factory green — pytest installs an "always" filter around each test, so
    the difference is invisible unless a test states the caller's filter
    itself, as this one does."""
    _write_overflowing_campaign(workspace)
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("ignore", RuntimeWarning)
        build_carousel.build("demo", ["pl"])
    assert [w for w in caught if issubclass(w.category, RuntimeWarning)] == [], (
        "the caller asked for RuntimeWarning to be ignored and still got one"
    )
    assert capsys.readouterr().err.count("WARNING") == 1, (
        "the operator line disappeared because the caller silenced the warning"
    )
