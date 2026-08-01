# -*- coding: utf-8 -*-
"""Stories and Reels: static 9:16 posters plus the video that walks them.

The posters and the video come from the same slides, so a Story and a Reel
never drift apart. Cross-fade between slides keeps the clip watchable
without any motion design work per campaign.

Usage:
    python docs/marketing/scripts/build_reel.py cost-of-ai-agent pl
"""
import sys
import warnings
from pathlib import Path

import imageio.v2 as imageio
import numpy as np
from PIL import Image

import slides
from spec import Campaign, SpecError

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
    campaign = Campaign.load(campaign_id)
    written: list[Path] = []

    for lang in langs:
        out = campaign.render_dir(lang)
        for stale in out.glob("story-9x16-*.png"):
            stale.unlink()

        pages = []
        for index, slide in enumerate(campaign.slides, start=1):
            # `slides.render` raises a RuntimeWarning (not an exception) when
            # this slide's copy still overflows the footer band at the
            # minimum type scale. Left as a bare Python warning, that is easy
            # to miss in a real build run. `simplefilter("always")` here only
            # lifts this block's *own* filter so the warning is reliably
            # captured rather than deduped away — it must not leak out and
            # override a caller's filter (e.g. a CI gate running with `-W
            # error::RuntimeWarning`). So: capture, print the operator-facing
            # line, then step back outside this block (where the caller's own
            # filters are back in force) and re-emit via `warn_explicit` so
            # *that* filter — not this block's — decides whether it prints,
            # is ignored, or raises. See build_single.py for the same shape.
            with warnings.catch_warnings(record=True) as caught:
                warnings.simplefilter("always")
                page = slides.render(campaign, slide, lang, CANVAS)
            for w in caught:
                print(
                    f"  WARNING: {campaign_id} ({lang}): story-9x16 slide {index} "
                    f"('{slide['type']}') at {CANVAS[0]}x{CANVAS[1]} overflowed its "
                    "footer band even at the minimum type scale — shorten this "
                    "campaign's copy",
                    file=sys.stderr,
                )
                warnings.warn_explicit(w.message, w.category, w.filename, w.lineno)
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
        build(argv[1], argv[2:] or ["pl"])
    except SpecError as exc:
        print(f"spec error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
