# -*- coding: utf-8 -*-
"""LinkedIn carousel: one 1080x1350 page per slide, plus the PDF.

LinkedIn publishes carousels as document posts, so the PDF — not the PNG
series — is the file that actually gets uploaded. The PNGs are kept for
reuse in other feeds and for reviewing a deck without opening a reader.

Usage:
    python docs/marketing/scripts/build_carousel.py cost-of-ai-agent pl en
"""
import sys
from pathlib import Path

import slides
from spec import Campaign, SpecError

CANVAS = (1080, 1350)


def build(campaign_id: str, langs: list[str]) -> list[Path]:
    campaign = Campaign.load(campaign_id)
    written: list[Path] = []

    for lang in langs:
        out = campaign.render_dir(lang)
        for stale in out.glob("carousel-*.png"):
            stale.unlink()

        pages = []
        for index, slide in enumerate(campaign.slides, start=1):
            page = slides.render(campaign, slide, lang, CANVAS)
            path = out / f"carousel-{index:02d}.png"
            page.save(path)
            pages.append(page)
            written.append(path)

        pdf = out / "carousel.pdf"
        pages[0].save(pdf, save_all=True, append_images=pages[1:], resolution=150.0)
        written.append(pdf)
        print(f"  {lang}: {len(pages)} pages -> {pdf}")

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
