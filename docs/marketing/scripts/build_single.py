# -*- coding: utf-8 -*-
"""Single-image formats: LinkedIn 1200x627, feed 4:5, and the OG card.

All three carry the same message — the campaign's hook slide — because a
single image gets one chance to say something. The canvases differ enough in
aspect ratio that the slide renderer sizes type from the canvas, not fixed px.

Usage:
    python docs/marketing/scripts/build_single.py cost-of-ai-agent pl en
"""
import sys
import warnings
from pathlib import Path

import slides
from spec import Campaign, SpecError

CANVASES = {
    "li-single": (1200, 627),
    "feed-4x5": (1080, 1350),
    "og": (1200, 630),
}


def build(campaign_id: str, langs: list[str]) -> list[Path]:
    campaign = Campaign.load(campaign_id)
    hook = next((s for s in campaign.slides if s["type"] == "hook"),
                campaign.slides[0])
    written: list[Path] = []

    for lang in langs:
        out = campaign.render_dir(lang)
        for name, size in CANVASES.items():
            path = out / f"{name}.png"
            # `slides.render` raises a RuntimeWarning (not an exception) when a
            # slide's copy still overflows the footer band at the minimum type
            # scale — a real risk on these short/wide canvases (see slides.py's
            # `_fit_box`). Left as a bare Python warning, that is easy to miss
            # in a real build run; catch it here so a single overflowing
            # format still gets an unmissable, campaign/language/format-
            # specific line on stderr, in addition to (not instead of) the
            # warning itself.
            with warnings.catch_warnings(record=True) as caught:
                warnings.simplefilter("always")
                image = slides.render(campaign, hook, lang, size)
            image.save(path)
            written.append(path)
            for w in caught:
                warnings.showwarning(w.message, w.category, w.filename, w.lineno)
                print(
                    f"  WARNING: {campaign_id} ({lang}): '{name}' at "
                    f"{size[0]}x{size[1]} overflowed its footer band even at the "
                    "minimum type scale — shorten this campaign's hook copy",
                    file=sys.stderr,
                )
        print(f"  {lang}: {len(CANVASES)} singles -> {out}")

    return written


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    try:
        build(argv[1], argv[2:] or ["pl", "en"])
    except SpecError as exc:
        print(f"spec error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
