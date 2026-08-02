# -*- coding: utf-8 -*-
"""Single-image formats: LinkedIn 1200x627, feed 4:5, and the OG card.

All three carry the same message — the campaign's hook slide — because a
single image gets one chance to say something. The canvases differ enough in
aspect ratio that the slide renderer sizes type from the canvas, not fixed px.

Usage:
    python docs/marketing/scripts/build_single.py cost-of-ai-agent pl en
"""
import sys
from pathlib import Path

import render_warnings
import slides
from spec import Campaign, SpecError, check_langs

CANVASES = {
    "li-single": (1200, 627),
    "feed-4x5": (1080, 1350),
    "og": (1200, 630),
}


def build(campaign_id: str, langs: list[str]) -> list[Path]:
    check_langs(langs)
    campaign = Campaign.load(campaign_id)
    hook = next((s for s in campaign.slides if s["type"] == "hook"),
                campaign.slides[0])
    written: list[Path] = []

    for lang in langs:
        out = campaign.render_dir(lang)
        for name, size in CANVASES.items():
            path = out / f"{name}.png"
            # `slides.render` reports a slide it could not lay out properly —
            # copy that still overflows the footer band at the minimum type
            # scale (a real risk on these short/wide canvases; see slides.py's
            # `_fit_box`), a screenshot it could not find — as a bare
            # RuntimeWarning, which is easy to miss in a real build run.
            # `render_warnings.surfaced` adds the operator-facing line and
            # hands the warning back to the caller's own filters; its
            # docstring has the full contract. Re-emission happens as the
            # `with` exits, i.e. before `image.save()`, so a caller running
            # with `-W error::RuntimeWarning` still never gets a saved file
            # for this format — the same semantics as a plain
            # `slides.render(...).save(path)`.
            with render_warnings.surfaced(campaign_id, lang, f"'{name}'", size):
                image = slides.render(campaign, hook, lang, size)
            image.save(path)
            written.append(path)
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
