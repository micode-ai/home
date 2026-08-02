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

import render_warnings
import slides
from spec import Campaign, SpecError, check_langs

CANVAS = (1080, 1350)

# Nominal print resolution written into the PDF. It sets the page geometry
# and nothing else: Pillow does NOT resample: each page keeps its full
# 1080x1350 pixel data, and `resolution` only decides how large that page
# claims to be in PostScript points (1080/150*72 = 518.4 pt by 648 pt, i.e.
# a 7.2" x 9" page). Lower it and the pixels are untouched while the page
# collapses to a stamp — 10.0 would give a 51.8 x 64.8 pt MediaBox, which
# LinkedIn would render as a thumbnail. `test_pdf_pages_declare_the_right_
# physical_page_size` asserts the resulting MediaBox.
PDF_RESOLUTION = 150.0


def build(campaign_id: str, langs: list[str]) -> list[Path]:
    check_langs(langs)
    campaign = Campaign.load(campaign_id)
    written: list[Path] = []

    for lang in langs:
        out = campaign.render_dir(lang)
        for stale in out.glob("carousel-*.png"):
            stale.unlink()

        pages = []
        for index, slide in enumerate(campaign.slides, start=1):
            # See render_warnings.surfaced: slides.render() reports a slide it
            # could not lay out (overflowing copy, a missing screenshot) as a
            # bare RuntimeWarning, which the default filters would dedupe down
            # to a single anonymous line for a whole multi-language deck.
            with render_warnings.surfaced(
                    campaign_id, lang,
                    f"carousel page {index:02d} ('{slide['type']}')", CANVAS):
                page = slides.render(campaign, slide, lang, CANVAS)
            path = out / f"carousel-{index:02d}.png"
            page.save(path)
            pages.append(page)
            written.append(path)

        pdf = out / "carousel.pdf"
        pages[0].save(pdf, save_all=True, append_images=pages[1:],
                      resolution=PDF_RESOLUTION)
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
