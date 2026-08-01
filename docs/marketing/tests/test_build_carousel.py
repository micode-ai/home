import json
import re
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
