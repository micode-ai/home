import hashlib
import json
import warnings
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


def _digest(img: Image.Image) -> str:
    """A content fingerprint, not the raw buffer. A 1200x627 or 1080x1350 RGB
    buffer is 2-4MB; a plain `assert a == b` on two *different* buffers that
    size makes pytest's assertion-rewrite diff engine try to build a
    byte-level diff and hang for well past a minute — reproduced directly
    while writing this fix (see the Fix round 1 section of the task report).
    Hashing first keeps every comparison below at a fixed, tiny size (a
    64-char hex string) regardless of image size, so a real mismatch fails
    fast with a normal two-line diff instead of hanging."""
    return hashlib.sha256(_bytes(img)).hexdigest()


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
    colours against the gradient background. Compare each output against an
    independently computed reference render of the specific hook slide
    object, at every declared canvas, so a build() that quietly wired in the
    wrong slide (the cta, the last slide, ...) is actually caught rather than
    passed. Compared as `_digest()` fingerprints, not raw buffers — see that
    helper's docstring for why."""
    build_single.build("demo", ["pl"])
    campaign = spec.Campaign.load("demo")
    hook = campaign.slides[0]
    assert hook["type"] == "hook"
    out = _renders_dir(workspace, "pl")
    for name, size in build_single.CANVASES.items():
        expected = slides.render(campaign, hook, "pl", size)
        with Image.open(out / f"{name}.png") as actual:
            assert _digest(actual) == _digest(expected), (
                f"{name} ({size[0]}x{size[1]}, pl): rendered content does not "
                "match the hook slide"
            )


def test_pl_and_en_renders_are_not_identical(workspace):
    """A build() that silently ignored `lang` — e.g. always rendering the
    Polish copy regardless of which language directory it wrote to — would
    still satisfy every file-existence and size check above for both
    languages. Only comparing actual pixel content across the two languages
    catches a dropped `lang` argument. Compared as `_digest()` fingerprints,
    not raw buffers — see that helper's docstring for why."""
    build_single.build("demo", ["pl", "en"])
    for name, size in build_single.CANVASES.items():
        with Image.open(_renders_dir(workspace, "pl") / f"{name}.png") as pl_img, \
                Image.open(_renders_dir(workspace, "en") / f"{name}.png") as en_img:
            assert _digest(pl_img) != _digest(en_img), (
                f"{name} ({size[0]}x{size[1]}): pl and en renders are "
                "identical — language may be ignored"
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
            assert _digest(actual) == _digest(expected), (
                f"{name} ({size[0]}x{size[1]}, pl): fallback did not render "
                "the first slide's content"
            )


def test_build_returns_every_path_it_wrote(workspace):
    written = build_single.build("demo", ["pl", "en"])
    assert len(written) == 6
    assert all(p.exists() for p in written)


# `slides._fit_box` raises a RuntimeWarning (not an exception) when a slide's
# copy still overflows the footer band at the minimum type scale. Left as a
# bare Python warning that would go unnoticed in a real build run, an
# operator generating a campaign gets a silently clipped LinkedIn/OG card.
# `_HEADLINE_UNIT`/`_SUB_UNIT` repeated 3x reliably overflows the footer band
# at all three of this task's canvases (confirmed directly, not guessed at,
# against the real `slides.render` before writing this fixture) — long
# enough to hit the shrink floor, unlike this module's compact PAYLOAD copy
# or even the realistic-length copy used in the bleed check.
_HEADLINE_UNIT = ("Dlaczego rachunek za agenta AI bywa dziesięć razy wyższy niż cena z "
                  "cennika dostawcy modelu językowego, a jak to sprawdzić zanim podpiszesz "
                  "umowę na wdrożenie produkcyjne twojej firmy? ")
_SUB_UNIT = ("Cennik podaje stawkę za milion tokenów, ale Twoja miesięczna faktura zależy "
             "od tego, ile tokenów faktycznie zużywa cały przepływ pracy produkcyjnego "
             "agenta w typowym miesiącu obsługi klientów i integracji z systemami "
             "zewnętrznymi firmy. ")
OVERFLOWING_HOOK = {
    "eyebrow": "AI DLA BIZNESU",
    "headline": _HEADLINE_UNIT * 3,
    "sub": _SUB_UNIT * 3,
}


def _write_overflowing_campaign(workspace: Path) -> None:
    overflowing = json.loads(json.dumps(PAYLOAD))
    overflowing["slides"][0]["pl"] = OVERFLOWING_HOOK
    (workspace / "campaigns" / "demo" / "campaign.json").write_text(
        json.dumps(overflowing), encoding="utf-8")


def test_operator_is_warned_when_copy_overflows_the_footer_band(workspace, capsys):
    """build() must convert slides.py's bare RuntimeWarning into an
    unmissable, campaign/language/format-specific line on stderr — not
    swallow it, and not leave it as something only visible under
    `pytest.warns` or `-W error`."""
    _write_overflowing_campaign(workspace)
    build_single.build("demo", ["pl"])
    captured = capsys.readouterr()
    assert "WARNING" in captured.err
    assert "demo" in captured.err, "operator message must name the campaign"
    assert "pl" in captured.err, "operator message must name the language"


def test_normal_copy_length_produces_no_overflow_warning(workspace, capsys):
    """The warning path must not fire on ordinary campaign copy — otherwise
    the operator message would be noise every build produces, not a signal
    that something needs shortening."""
    build_single.build("demo", ["pl"])
    captured = capsys.readouterr()
    assert "WARNING" not in captured.err


def test_overflow_raises_when_the_caller_treats_runtimewarning_as_an_error(workspace):
    """Fix round 1 caught the RuntimeWarning in a block that forced
    `simplefilter("always")` and only ever *displayed* it afterwards
    (`warnings.showwarning`), which never re-enters the filter/raise
    machinery — so a caller running with `-W error::RuntimeWarning` (e.g. a
    CI gate that wants any overflow to fail the build) silently stopped
    seeing the exception it used to get from a bare `slides.render()` call.
    The fix must let the *caller's* filter decide again."""
    _write_overflowing_campaign(workspace)
    with warnings.catch_warnings():
        warnings.simplefilter("error")
        with pytest.raises(RuntimeWarning):
            build_single.build("demo", ["pl"])


def test_overflow_warns_and_prints_exactly_once_per_overflowing_format(workspace, capsys):
    """Re-emitting the captured warning must not double it up: under default
    filters, a caller must see exactly one RuntimeWarning and exactly one
    operator-facing stderr line per format that actually overflowed — not
    zero (suppressed) and not two (the original display plus a duplicate
    re-emit). `OVERFLOWING_HOOK` overflows all three declared canvases
    (confirmed directly against `slides.render` before this fixture was
    written), so both counts must equal `len(build_single.CANVASES)`."""
    _write_overflowing_campaign(workspace)
    with pytest.warns(RuntimeWarning) as caught:
        build_single.build("demo", ["pl"])
    runtime_warnings = [w for w in caught if issubclass(w.category, RuntimeWarning)]
    assert len(runtime_warnings) == len(build_single.CANVASES), (
        f"expected exactly one RuntimeWarning per overflowing format, got "
        f"{len(runtime_warnings)} — a dropped or duplicated re-emit would show up here"
    )
    captured = capsys.readouterr()
    assert captured.err.count("WARNING") == len(build_single.CANVASES), (
        f"expected exactly one operator message per overflowing format, got "
        f"{captured.err.count('WARNING')}"
    )
