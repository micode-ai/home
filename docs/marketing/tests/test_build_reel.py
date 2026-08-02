import json
import warnings
from pathlib import Path

import imageio.v3 as iio
import numpy as np
import pytest
from PIL import Image

import build_reel
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

# A third, distinct slide type. Used by the tests that must prove the reel
# actually walks through *every* slide (not just the first and the last) —
# a two-slide deck can't distinguish "played in order" from "skipped the
# middle", so those tests build their own three-slide payload from this.
_PROBLEM_SLIDE = {
    "type": "problem",
    "pl": {"headline": "To zalezy nie jest odpowiedzia",
           "sub": "Ceny modeli to nie cala historia."},
    "en": {"headline": "It depends is not an answer",
           "sub": "Model pricing is not the whole story."},
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


def _write_campaign(workspace: Path, payload: dict) -> None:
    (workspace / "campaigns" / "demo" / "campaign.json").write_text(
        json.dumps(payload), encoding="utf-8")


def _mad(a: np.ndarray, b: np.ndarray) -> float:
    """Mean absolute per-pixel difference. `reel.mp4` is H.264-encoded, which
    is lossy — measured directly (see the task report) that a decoded video
    frame compared against the *uncompressed* PIL render it came from sits
    at a mean diff of roughly 1.2-1.3 (RGB -> YUV420 chroma subsampling and
    back is not lossless, especially at high-contrast text edges), while
    that same decoded frame compared against a *different* slide's
    uncompressed render sits at roughly 4.7-7.1. That gap — not zero, but
    still wide — is what lets `test_reel_visits_every_slides_own_content_in_
    order` tell "this is slide N's content" apart from "this is a different
    slide" using a lossily-compressed frame instead of requiring a
    byte-exact match that lossy encoding could never produce."""
    return float(np.abs(a.astype(np.int16) - b.astype(np.int16)).mean())


def test_writes_one_story_poster_per_slide(workspace):
    build_reel.build("demo", ["pl"])
    out = _renders_dir(workspace, "pl")
    assert sorted(p.name for p in out.glob("story-9x16-*.png")) == [
        "story-9x16-01.png", "story-9x16-02.png"
    ]


def test_posters_use_the_vertical_canvas(workspace):
    build_reel.build("demo", ["pl"])
    poster = _renders_dir(workspace, "pl") / "story-9x16-01.png"
    with Image.open(poster) as img:
        assert img.size == (1080, 1920)


def test_writes_both_mp4_and_gif(workspace):
    build_reel.build("demo", ["pl"])
    out = _renders_dir(workspace, "pl")
    assert (out / "reel.mp4").is_file()
    assert (out / "reel.gif").is_file()
    assert (out / "reel.mp4").stat().st_size > 10_000


def test_video_length_covers_every_slide(workspace):
    """Two slides at 2.6s each must not silently render as a one-second clip."""
    build_reel.build("demo", ["pl"])
    mp4 = _renders_dir(workspace, "pl") / "reel.mp4"
    frames = iio.imread(mp4, plugin="pyav")
    expected = int(build_reel.FPS * build_reel.SECONDS_PER_SLIDE * 2)
    assert len(frames) >= expected * 0.9


def test_video_frames_use_the_vertical_canvas(workspace):
    build_reel.build("demo", ["pl"])
    mp4 = _renders_dir(workspace, "pl") / "reel.mp4"
    frames = iio.imread(mp4, plugin="pyav")
    assert frames.shape[1:3] == (1920, 1080)


def test_reel_is_not_a_still_image(workspace):
    """A transition bug that renders the same frame throughout still produces
    a playable file, so compare the first and last frames explicitly.

    NOT compared with a bare `!=` (on raw bytes or on sha256 digests): a
    "render the same page for every frame" bug was injected directly against
    exactly that check (see the task report) and it still *passed*, because
    a decoded H.264 video has small frame-to-frame decode drift even when
    every source frame fed to the encoder was byte-identical (measured
    directly at ~0.001 mean pixel diff — never exactly 0). A `!=` on digests
    of the decoded bytes is therefore true almost regardless of whether the
    content actually differs, i.e. it kills nothing. `_mad` against a
    threshold that sits well above that drift and well below a genuine
    content change (see its docstring) is what actually distinguishes them.

    This test alone is still weak in one respect: a reel that is two frames
    of slide 1 followed by the rest of slide 2 would still pass it, since
    the first and last frames legitimately differ either way.
    `test_video_length_covers_every_slide` (frame count) and
    `test_reel_visits_every_slides_own_content_in_order` (below) are what
    rule that particular bug out."""
    build_reel.build("demo", ["pl"])
    mp4 = _renders_dir(workspace, "pl") / "reel.mp4"
    frames = iio.imread(mp4, plugin="pyav")
    assert _mad(frames[0], frames[-1]) > 2.0


def test_reel_visits_every_slides_own_content_in_order(workspace):
    """Neither the frame-count check nor the first-vs-last-frame check above
    would catch a reel that renders, say, two frames of slide 1 and then the
    rest of slide 2 (or slide 3): the count is unaffected, and the first and
    last frames still differ. Prove each slide actually gets its own,
    roughly-full `SECONDS_PER_SLIDE` share of screen time, in deck order, by
    sampling a timestamp shortly after each slide's expected start and
    checking which of the deck's own (uncompressed) slide renders that
    decoded, lossy video frame is closest to — it must be that slide's own
    render, not some other slide's.

    Uses a 3-slide payload (hook/problem/cta), not the 2-slide module
    fixture: with only 2 slides "first differs from last" and "the right
    slide showed up in order" collapse into the same fact, so a genuine
    reordering or truncation bug could hide behind them."""
    three_slides = json.loads(json.dumps(PAYLOAD))
    three_slides["slides"] = [three_slides["slides"][0], _PROBLEM_SLIDE,
                               three_slides["slides"][1]]
    _write_campaign(workspace, three_slides)

    build_reel.build("demo", ["pl"])
    campaign = spec.Campaign.load("demo")
    sources = [np.asarray(slides.render(campaign, s, "pl", build_reel.CANVAS),
                          dtype=np.uint8)
               for s in campaign.slides]

    mp4 = _renders_dir(workspace, "pl") / "reel.mp4"
    frames = iio.imread(mp4, plugin="pyav")

    for index, source in enumerate(sources):
        # 15% into a slide's nominal slot is comfortably inside its static
        # hold (the fade only eats into the *end* of a slide's own slot, per
        # `_frames`), yet far enough past its start to catch a hold that
        # collapsed to only a couple of frames.
        t = index * build_reel.SECONDS_PER_SLIDE + 0.15 * build_reel.SECONDS_PER_SLIDE
        frame = frames[min(int(t * build_reel.FPS), len(frames) - 1)]
        diffs = [_mad(frame, other) for other in sources]
        # ~1.2-1.3 is the baseline mean diff between a decoded H.264 frame
        # and the uncompressed render it came from (measured directly, see
        # `_mad`'s docstring); ~2.5 gives that a comfortable margin while
        # staying well below the ~4.7+ a genuinely different slide sits at.
        assert diffs[index] < 2.5, (
            f"slide {index} ({campaign.slides[index]['type']}) at t={t:.2f}s does not "
            f"show its own content (diffs to each slide: {diffs})"
        )
        assert diffs[index] == min(diffs), (
            f"slide {index} ({campaign.slides[index]['type']}) at t={t:.2f}s more closely "
            f"matches a different slide's content (diffs to each slide: {diffs})"
        )


def test_gif_is_a_downsized_preview(workspace):
    """The gif is meant to be a lightweight preview: half-resolution and
    every 3rd frame, not a second copy of the full-quality video. A plain
    "is the file small" check turned out not to reliably prove that: GIF's
    own frame de-duplication already collapses long runs of identical static
    frames (measured directly — a 2-slide reel's ~116 raw frames collapse to
    just 5 stored GIF frames), which absorbs most of the size difference a
    forgotten downsample/subsample would otherwise cause (confirmed by
    actually removing both and reusing every full-resolution frame: the file
    only grew from ~190KB to ~760KB, nowhere near "enormous"). Checking the
    frame *dimensions* directly is what actually proves the halving happened,
    regardless of how well GIF compression happens to hide it in file size."""
    build_reel.build("demo", ["pl"])
    gif = _renders_dir(workspace, "pl") / "reel.gif"
    with Image.open(gif) as img:
        assert img.size == (build_reel.CANVAS[0] // 2, build_reel.CANVAS[1] // 2)
    # Still a basic sanity guard against something going catastrophically
    # wrong (e.g. an uncompressed format written under the .gif name).
    assert gif.stat().st_size < 5_000_000, (
        f"reel.gif is {gif.stat().st_size} bytes — expected a lightweight preview"
    )


def test_gif_frame_delay_matches_the_video_pacing(workspace):
    """`imageio`'s gif writer takes a `duration` argument whose *unit*
    differs between the plugins it can dispatch to — measured directly
    (see the task report) that passing milliseconds here does land as
    milliseconds in the written file's per-frame delay, but that is a fact
    about this specific plugin/version, not something to assume. The gif
    previews every 3rd frame of a `FPS`-fps video, so each preview frame
    should visually cover 3/FPS seconds; read the delays PIL actually
    recorded back out of the file and check against that, rather than
    trusting the constructor argument's name.

    Does not assume which stored GIF frame carries that delay: GIF writers
    are free to merge runs of identical consecutive frames into one longer-
    duration frame (measured directly — this 2-slide reel's ~116 raw frames
    collapse to 5 stored GIF frames, with the two static holds merged into
    one long frame each and only the cross-fade frames staying separate), so
    a specific frame index is not a stable thing to assert on. At least one
    stored frame carrying the expected per-preview-frame delay is: if the
    `duration` argument were misinterpreted as seconds rather than
    milliseconds, every stored delay would be off by ~1000x (rounding to
    ~0ms), and none would land near the expected value."""
    build_reel.build("demo", ["pl"])
    gif = _renders_dir(workspace, "pl") / "reel.gif"
    expected_ms = 1000 * 3 / build_reel.FPS
    with Image.open(gif) as img:
        durations = []
        for i in range(img.n_frames):
            img.seek(i)
            durations.append(img.info.get("duration"))
    # GIF delays are quantised to centiseconds (1/100s), so allow a small
    # margin either side of the exact value instead of demanding equality.
    assert any(d is not None and abs(d - expected_ms) <= 15 for d in durations), (
        f"no gif frame has the expected ~{expected_ms:.0f}ms delay; got {durations} — "
        "the duration argument may be interpreted in the wrong unit"
    )


def test_stale_posters_are_removed_when_the_deck_shrinks(workspace):
    build_reel.build("demo", ["pl"])
    shorter = json.loads(json.dumps(PAYLOAD))
    shorter["slides"] = [shorter["slides"][1]]
    _write_campaign(workspace, shorter)
    build_reel.build("demo", ["pl"])
    out = _renders_dir(workspace, "pl")
    assert len(list(out.glob("story-9x16-*.png"))) == 1


def test_build_returns_every_path_it_wrote(workspace):
    written = build_reel.build("demo", ["pl"])
    # 2 posters + reel.mp4 + reel.gif
    assert len(written) == 4
    assert all(p.exists() for p in written)


# `slides._fit_box` raises a RuntimeWarning (not an exception) when a slide's
# copy still overflows the footer band at the minimum type scale. Left as a
# bare Python warning that would go unnoticed in a real build run, an
# operator generating a campaign gets a silently clipped story poster (and a
# reel frame baked from it). `_HEADLINE_UNIT`/`_SUB_UNIT` x 6 reliably
# overflows the footer band at this task's 1080x1920 canvas (confirmed
# directly against the real `slides.render`, not guessed at — 1080x1920 has
# far more vertical budget than build_single's short/wide canvases, so the
# x3 repeat that overflows those does *not* overflow here; x5 was the first
# multiplier that reliably did, x6 keeps a safety margin above that).
_HEADLINE_UNIT = ("Dlaczego rachunek za agenta AI bywa dziesiec razy wyzszy niz cena z "
                  "cennika dostawcy modelu jezykowego, a jak to sprawdzic zanim podpiszesz "
                  "umowe na wdrozenie produkcyjne twojej firmy? ")
_SUB_UNIT = ("Cennik podaje stawke za milion tokenow, ale Twoja miesieczna faktura zalezy "
             "od tego, ile tokenow faktycznie zuzywa caly przeplyw pracy produkcyjnego "
             "agenta w typowym miesiacu obslugi klientow i integracji z systemami "
             "zewnetrznymi firmy. ")
OVERFLOWING_HOOK = {
    "eyebrow": "AI DLA BIZNESU",
    "headline": _HEADLINE_UNIT * 6,
    "sub": _SUB_UNIT * 6,
}


def _write_overflowing_campaign(workspace: Path) -> None:
    overflowing = json.loads(json.dumps(PAYLOAD))
    overflowing["slides"][0]["pl"] = OVERFLOWING_HOOK
    _write_campaign(workspace, overflowing)


def test_operator_is_warned_when_copy_overflows_the_footer_band(workspace, capsys):
    """build() must convert slides.py's bare RuntimeWarning into an
    unmissable, campaign/language/format-specific line on stderr — not
    swallow it, and not leave it as something only visible under
    `pytest.warns` or `-W error`."""
    _write_overflowing_campaign(workspace)
    build_reel.build("demo", ["pl"])
    captured = capsys.readouterr()
    assert "WARNING" in captured.err
    assert "demo" in captured.err, "operator message must name the campaign"
    assert "pl" in captured.err, "operator message must name the language"


def test_normal_copy_length_produces_no_overflow_warning(workspace, capsys):
    """The warning path must not fire on ordinary campaign copy — otherwise
    the operator message would be noise every build produces, not a signal
    that something needs shortening."""
    build_reel.build("demo", ["pl"])
    captured = capsys.readouterr()
    assert "WARNING" not in captured.err


def test_overflow_raises_when_the_caller_treats_runtimewarning_as_an_error(workspace):
    """Task 6 first implemented the operator-warning shape by catching the
    RuntimeWarning in a block that forced `simplefilter("always")` and only
    ever *displayed* it afterwards (`warnings.showwarning`), which never
    re-enters the filter/raise machinery — so a caller running with `-W
    error::RuntimeWarning` (e.g. a CI gate that wants any overflow to fail
    the build) silently stopped seeing the exception it used to get from a
    bare `slides.render()` call. The fix must let the *caller's* filter
    decide again."""
    _write_overflowing_campaign(workspace)
    with warnings.catch_warnings():
        warnings.simplefilter("error")
        with pytest.raises(RuntimeWarning):
            build_reel.build("demo", ["pl"])


def test_overflow_warns_and_prints_exactly_once(workspace, capsys):
    """Re-emitting the captured warning must not double it up: under default
    filters, a caller must see exactly one RuntimeWarning and exactly one
    operator-facing stderr line for the one slide that overflowed — not zero
    (suppressed) and not two (the original display plus a duplicate
    re-emit)."""
    _write_overflowing_campaign(workspace)
    with pytest.warns(RuntimeWarning) as caught:
        build_reel.build("demo", ["pl"])
    runtime_warnings = [w for w in caught if issubclass(w.category, RuntimeWarning)]
    assert len(runtime_warnings) == 1, (
        f"expected exactly one RuntimeWarning, got {len(runtime_warnings)} — a dropped "
        "or duplicated re-emit would show up here"
    )
    captured = capsys.readouterr()
    assert captured.err.count("WARNING") == 1, (
        f"expected exactly one operator message, got {captured.err.count('WARNING')}"
    )


def test_an_unknown_language_is_rejected_by_name(workspace):
    """`build_reel.py cost-of-ai-agent ru` used to die with a bare
    `KeyError: 'ru'` raised deep inside spec.py. The factory renders pl and
    en; anything else must be a `SpecError` naming both the bad value and the
    supported ones, so `main()` prints one actionable line."""
    with pytest.raises(spec.SpecError) as exc:
        build_reel.build("demo", ["ru"])
    message = str(exc.value)
    assert "'ru'" in message and "'pl'" in message and "'en'" in message, message


def test_an_unknown_language_is_rejected_before_anything_is_written(workspace):
    """`pl ru` must not leave a half-built Polish reel behind — a reel is the
    slowest artefact this factory produces, so failing after it is also the
    most expensive place to fail."""
    with pytest.raises(spec.SpecError):
        build_reel.build("demo", ["pl", "ru"])
    assert not list((workspace / "creatives").rglob("*")), (
        "files were written before the language check ran"
    )


def test_the_command_line_default_renders_both_languages(workspace, monkeypatch):
    """`main()`'s default used to be `["pl"]` alone while build_carousel.py
    and build_single.py both defaulted to `["pl", "en"]` — so a bare
    `build_reel.py <id>` (and the README command copied from it) silently
    produced a Polish-only reel and Polish-only story posters, leaving the
    committed English ones stale on a clean clone. The committed artifacts and
    `test_campaign_<id>.py`'s size checks expect both."""
    seen = {}
    monkeypatch.setattr(build_reel, "build",
                        lambda campaign_id, langs: seen.setdefault("langs", langs) or [])
    assert build_reel.main(["build_reel.py", "demo"]) == 0
    assert seen["langs"] == ["pl", "en"]
