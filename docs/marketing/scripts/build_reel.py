# -*- coding: utf-8 -*-
"""Stories and Reels: static 9:16 posters plus the video that walks them.

The posters and the video come from the same slides, so a Story and a Reel
never drift apart. Cross-fade between slides keeps the clip watchable
without any motion design work per campaign.

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

CANVAS = (1080, 1920)
FPS = 24
SECONDS_PER_SLIDE = 2.6
FADE_FRAMES = 8


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

        pages = []
        for index, slide in enumerate(campaign.slides, start=1):
            # `slides.render` reports a slide it could not lay out properly —
            # copy that still overflows the footer band at the minimum type
            # scale, a screenshot it could not find — as a bare
            # RuntimeWarning, which is easy to miss in a real build run.
            # `render_warnings.surfaced` adds the operator-facing line and
            # hands the warning back to the caller's own filters; its
            # docstring has the full contract, and build_carousel.py /
            # build_single.py use the same one.
            with render_warnings.surfaced(
                    campaign_id, lang,
                    f"story-9x16 slide {index} ('{slide['type']}')", CANVAS):
                page = slides.render(campaign, slide, lang, CANVAS)
            path = out / f"story-9x16-{index:02d}.png"
            page.save(path)
            pages.append(page)
            written.append(path)

        frames = _frames(pages)
        mp4 = out / "reel.mp4"
        imageio.mimwrite(mp4, frames, fps=FPS, codec="libx264",
                         macro_block_size=8, quality=8)
        written.append(mp4)

        gif = out / "reel.gif"
        preview = [np.asarray(Image.fromarray(f).resize((CANVAS[0] // 2, CANVAS[1] // 2),
                                                        Image.LANCZOS))
                   for f in frames[::3]]
        imageio.mimwrite(gif, preview, duration=1000 * 3 / FPS, loop=0)
        written.append(gif)
        print(f"  {lang}: {len(pages)} posters + reel -> {out}")

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
