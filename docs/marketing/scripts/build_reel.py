# -*- coding: utf-8 -*-
"""Stories and Reels: static 9:16 posters plus the videos that walk them.

The posters and the video come from the same slides, so a Story and a Reel
never drift apart. Cross-fade between slides keeps the clip watchable
without any motion design work per campaign.

Two videos, because one aspect ratio cannot serve both placements Meta offers
for a video. Reels and Stories want the full-bleed vertical canvas; the
Instagram/Facebook **feed** (and the feed placement of an ad) accepts only
4:5 .. 16:9 and rejects anything taller outright, with "the selected video
does not fit the aspect ratio range accepted by Instagram". `reel.mp4` at 9:16
is therefore un-postable to a feed, and a 4:5 cut is not a downgrade of it but
the other half of the same campaign. The 4:5 canvas is the same 1080x1350 the
carousel and `feed-4x5.png` already use, so the feed video is the carousel
deck in motion.

Usage:
    python docs/marketing/scripts/build_reel.py cost-of-ai-agent pl en
"""
import sys
from pathlib import Path

import imageio.v2 as imageio
import numpy as np
from PIL import Image

import render_warnings
import slides
from spec import Campaign, SpecError, check_langs

CANVAS = (1080, 1920)       # Reels / Stories
FEED_CANVAS = (1080, 1350)  # Instagram + Facebook feed, exactly 4:5 = 0.800
FPS = 24
SECONDS_PER_SLIDE = 2.6
FADE_FRAMES = 8


def _macro_block_size(canvas: tuple[int, int]) -> int:
    """Largest `imageio` macro block size that divides the canvas exactly.

    `imageio` rounds each dimension **up** to a multiple of this value, and
    silently: it prints an informational line and encodes the resized video
    anyway. That is harmless at 1080x1920 (both divide by 8) and is not
    harmless at 1080x1350 — 1350/8 = 168.75, so the fixed `macro_block_size=8`
    this module used to pass would encode the feed video at 1080x1352, ratio
    0.7988, which is *below* Instagram's 4:5 floor of 0.800 and rejected for
    precisely the reason the format was added. Measured directly, not reasoned
    about; `tests/test_build_reel.py` pins the encoded size of the written file
    rather than the constant, because only the file can show the rounding.

    Picking the largest divisor keeps 1080x1920 on the 8 it always used, so the
    committed reels re-render byte-comparably, while any future canvas gets the
    same protection without anyone having to remember this.
    """
    for size in (16, 8, 4, 2):
        if canvas[0] % size == 0 and canvas[1] % size == 0:
            return size
    return 1


def _write_mp4(path: Path, frames: list[np.ndarray], canvas: tuple[int, int]) -> None:
    imageio.mimwrite(path, frames, fps=FPS, codec="libx264",
                     macro_block_size=_macro_block_size(canvas), quality=8)


def _pages(campaign: Campaign, lang: str, canvas: tuple[int, int],
           what: str) -> list[Image.Image]:
    """Render the whole deck onto one canvas, surfacing any layout warning.

    `slides.render` reports a slide it could not lay out properly — copy that
    still overflows the footer band at the minimum type scale, a screenshot it
    could not find — as a bare RuntimeWarning, which is easy to miss in a real
    build run. `render_warnings.surfaced` adds the operator-facing line and
    hands the warning back to the caller's own filters; its docstring has the
    full contract, and build_carousel.py / build_single.py use the same one.

    Each canvas gets its own pass, so copy that overflows both is reported once
    per canvas — two different published files, two lines naming which.
    """
    out = []
    for index, slide in enumerate(campaign.slides, start=1):
        with render_warnings.surfaced(
                campaign.id, lang,
                f"{what} slide {index} ('{slide['type']}')", canvas):
            out.append(slides.render(campaign, slide, lang, canvas))
    return out


def _frames(pages: list[Image.Image]) -> list[np.ndarray]:
    hold = int(FPS * SECONDS_PER_SLIDE) - FADE_FRAMES
    out: list[np.ndarray] = []
    for index, page in enumerate(pages):
        current = np.asarray(page, dtype=np.uint8)
        out.extend([current] * max(hold, 1))
        if index + 1 < len(pages):
            nxt = np.asarray(pages[index + 1], dtype=np.uint8)
            for step in range(1, FADE_FRAMES + 1):
                alpha = step / (FADE_FRAMES + 1)
                blended = current * (1 - alpha) + nxt * alpha
                out.append(blended.astype(np.uint8))
    return out


def build(campaign_id: str, langs: list[str]) -> list[Path]:
    check_langs(langs)
    campaign = Campaign.load(campaign_id)
    written: list[Path] = []

    for lang in langs:
        out = campaign.render_dir(lang)
        for stale in out.glob("story-9x16-*.png"):
            stale.unlink()

        pages = _pages(campaign, lang, CANVAS, "story-9x16")
        for index, page in enumerate(pages, start=1):
            path = out / f"story-9x16-{index:02d}.png"
            page.save(path)
            written.append(path)

        frames = _frames(pages)
        mp4 = out / "reel.mp4"
        _write_mp4(mp4, frames, CANVAS)
        written.append(mp4)

        gif = out / "reel.gif"
        preview = [np.asarray(Image.fromarray(f).resize((CANVAS[0] // 2, CANVAS[1] // 2),
                                                        Image.LANCZOS))
                   for f in frames[::3]]
        imageio.mimwrite(gif, preview, duration=1000 * 3 / FPS, loop=0)
        written.append(gif)

        # The feed cut of the same deck. Deliberately no poster set and no gif
        # beside it: the still feed image is `feed-4x5.png` from
        # build_single.py, and `reel.gif` exists only as a lightweight preview
        # of the reel — a second one would be ~1.4 MB of committed bytes that
        # nothing in the plan consumes.
        feed_mp4 = out / "reel-4x5.mp4"
        _write_mp4(feed_mp4,
                   _frames(_pages(campaign, lang, FEED_CANVAS, "reel-4x5")),
                   FEED_CANVAS)
        written.append(feed_mp4)

        print(f"  {lang}: {len(pages)} posters + reel + feed video -> {out}")

    return written


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    try:
        # Same default as build_carousel.py and build_single.py. It used to be
        # `["pl"]` alone, which made a bare `build_reel.py <id>` (and the
        # README command that copied it) quietly produce a Polish-only reel
        # and Polish-only story posters, while the committed artifacts — and
        # `tests/test_campaigns.py`'s poster checks — expect both languages.
        build(argv[1], argv[2:] or ["pl", "en"])
    except SpecError as exc:
        print(f"spec error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
