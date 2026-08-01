import json
from pathlib import Path

import pytest
from PIL import Image

import build_single
import slides
import spec

PAYLOAD = {
    "id": "demo", "track": "funnel-top",
    "target": "https://mi-code.pl/blog/x/", "utm": {"campaign": "demo"},
    "slides": [
        {"type": "hook", "bigNumber": "$74.38",
         "pl": {"headline": "Ile kosztuje agent AI?"},
         "en": {"headline": "What does an AI agent cost?"}},
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


def _renders_dir(root: Path, lang: str) -> Path:
    return root / "creatives" / "demo" / "renders" / lang


def _bytes(img: Image.Image) -> bytes:
    return img.convert("RGB").tobytes()


def test_canvas_sizes_match_the_platforms():
    assert build_single.CANVASES["li-single"] == (1200, 627)
    assert build_single.CANVASES["feed-4x5"] == (1080, 1350)
    assert build_single.CANVASES["og"] == (1200, 630)


def test_writes_all_three_formats_per_language(workspace):
    build_single.build("demo", ["pl", "en"])
    for lang in ("pl", "en"):
        out = _renders_dir(workspace, lang)
        for name in ("li-single.png", "feed-4x5.png", "og.png"):
            assert (out / name).is_file(), f"{lang}/{name} missing"


def test_each_file_has_its_declared_size(workspace):
    build_single.build("demo", ["pl"])
    out = _renders_dir(workspace, "pl")
    for name, size in build_single.CANVASES.items():
        with Image.open(out / f"{name}.png") as img:
            assert img.size == size, f"{name} rendered at {img.size}"


def test_singles_are_built_from_the_hook_slide(workspace):
    """The hook is the whole message when there is only one image."""
    build_single.build("demo", ["pl"])
    out = _renders_dir(workspace, "pl")
    with Image.open(out / "feed-4x5.png") as feed:
        assert len(feed.getcolors(maxcolors=1_000_000) or []) > 50


def test_singles_render_the_hook_slides_content_exactly(workspace):
    """The brief's colour-count check above cannot tell a hook render apart
    from a cta render (or any other slide) — both easily clear 50 distinct
    colours against the gradient background. Compare each output byte-for-
    byte against an independently computed reference render of the specific
    hook slide object, at every declared canvas, so a build() that quietly
    wired in the wrong slide (the cta, the last slide, ...) is actually
    caught rather than passed."""
    build_single.build("demo", ["pl"])
    campaign = spec.Campaign.load("demo")
    hook = campaign.slides[0]
    assert hook["type"] == "hook"
    out = _renders_dir(workspace, "pl")
    for name, size in build_single.CANVASES.items():
        expected = slides.render(campaign, hook, "pl", size)
        with Image.open(out / f"{name}.png") as actual:
            assert _bytes(actual) == _bytes(expected), (
                f"{name}: rendered content does not match the hook slide"
            )


def test_pl_and_en_renders_are_not_identical(workspace):
    """A build() that silently ignored `lang` — e.g. always rendering the
    Polish copy regardless of which language directory it wrote to — would
    still satisfy every file-existence and size check above for both
    languages. Only comparing actual pixel content across the two languages
    catches a dropped `lang` argument."""
    build_single.build("demo", ["pl", "en"])
    for name in build_single.CANVASES:
        with Image.open(_renders_dir(workspace, "pl") / f"{name}.png") as pl_img, \
                Image.open(_renders_dir(workspace, "en") / f"{name}.png") as en_img:
            assert _bytes(pl_img) != _bytes(en_img), (
                f"{name}: pl and en renders are byte-identical — language may be ignored"
            )


def test_falls_back_to_the_first_slide_when_no_hook_exists(workspace):
    no_hook = json.loads(json.dumps(PAYLOAD))
    no_hook["slides"][0]["type"] = "problem"
    no_hook["slides"][0].pop("bigNumber")
    (workspace / "campaigns" / "demo" / "campaign.json").write_text(
        json.dumps(no_hook), encoding="utf-8")
    written = build_single.build("demo", ["pl"])
    assert len(written) == 3
    # The brief's own assertion stops at the returned list's length, which a
    # build() that fabricated Path objects without actually rendering
    # anything would still satisfy. Confirm the files are real and carry the
    # fallback slide's own content, not a silently empty/blank image.
    assert all(p.is_file() for p in written), "fallback build() must actually write files"
    campaign = spec.Campaign.load("demo")
    first_slide = campaign.slides[0]
    assert first_slide["type"] == "problem"
    out = _renders_dir(workspace, "pl")
    for name, size in build_single.CANVASES.items():
        expected = slides.render(campaign, first_slide, "pl", size)
        with Image.open(out / f"{name}.png") as actual:
            assert _bytes(actual) == _bytes(expected), (
                f"{name}: fallback did not render the first slide's content"
            )


def test_build_returns_every_path_it_wrote(workspace):
    written = build_single.build("demo", ["pl", "en"])
    assert len(written) == 6
    assert all(p.exists() for p in written)
