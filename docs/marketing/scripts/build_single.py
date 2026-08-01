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
            slides.render(campaign, hook, lang, size).save(path)
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
