# -*- coding: utf-8 -*-
"""Capture the source screenshots a campaign's diagram slides need.

The LangGraph diagrams on the product pages are drawn by mermaid in the
browser, so there is no static file to copy — a headless browser is the only
way to get them. Start the preview server first:

    npm run build && npm run preview
    python docs/marketing/scripts/capture_screens.py cost-of-ai-agent

Requires: pip install playwright && playwright install chromium
"""
import sys
from pathlib import Path

from spec import Campaign, SpecError

VIEWPORT = {"width": 1600, "height": 1000}
DEFAULT_BASE = "http://localhost:4173"


def shots_for(campaign: Campaign) -> list[dict]:
    """Every slide that declares a `shot` block, in deck order."""
    shots = []
    for slide in campaign.slides:
        shot = slide.get("shot")
        if not shot or not slide.get("asset"):
            continue
        shots.append({
            "asset": slide["asset"],
            "path": shot["path"],
            "selector": shot.get("selector"),
        })
    return shots


def capture(campaign_id: str, base_url: str = DEFAULT_BASE) -> list[Path]:
    from playwright.sync_api import sync_playwright  # imported late: optional dep

    campaign = Campaign.load(campaign_id)
    shots = shots_for(campaign)
    if not shots:
        print(f"{campaign_id}: no diagram slides declare a screenshot")
        return []

    src_dir = campaign.root.parents[1] / "creatives" / campaign_id / "src"
    src_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport=VIEWPORT, device_scale_factor=2)
        for shot in shots:
            url = f"{base_url.rstrip('/')}{shot['path']}"
            page.goto(url, wait_until="networkidle")
            target = src_dir / Path(shot["asset"]).name
            if shot["selector"]:
                # mermaid renders after hydration; wait for the node, not a timer
                element = page.wait_for_selector(shot["selector"], timeout=15_000)
                element.screenshot(path=str(target))
            else:
                page.screenshot(path=str(target), full_page=False)
            written.append(target)
            print(f"  {url} -> {target.name}")
        browser.close()

    return written


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    try:
        capture(argv[1], argv[2] if len(argv) > 2 else DEFAULT_BASE)
    except SpecError as exc:
        print(f"spec error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
