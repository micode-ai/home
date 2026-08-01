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

# Pre-accept cookie consent before any of the page's own scripts run, so
# CookieBanner.svelte's onMount check (`if (!stored) visible = true`) never
# flips the banner on in the first place — see src/services/storage.ts for
# the plain localStorage wrapper and src/components/CookieBanner.svelte for
# the exact key this reads. Run via `page.add_init_script` (not a post-load
# `page.evaluate`) so it lands before the app's own onMount hooks fire on
# every navigation this page does, not just the first.
_CONSENT_INIT_SCRIPT = (
    "try { localStorage.setItem('cookieConsent', 'accepted'); } catch (e) {}"
)

# Neutralises chrome that would otherwise repaint into a tall element
# screenshot: `element.screenshot()` on an element taller than the viewport
# scrolls and stitches multiple captures together, and anything `position:
# sticky`/`fixed` repaints at the top of every one of those segments —
# composited straight into the middle of whatever the shot was meant to
# frame. `.header` (Header.svelte, `position: sticky`) and
# `.reading-progress-bar` (ArticlePage.svelte, `position: fixed`) are the
# two pieces of chrome every page in this app renders; `.cookie-banner`
# (CookieBanner.svelte, `position: fixed`) is neutralised too as a second
# line of defence in case the consent pre-accept above doesn't apply (e.g. a
# future navigation this script doesn't control). Targeted at these three
# selectors specifically, not a blanket `*{position:static}` — that would
# also un-stick/un-fix elements that are part of the content being
# photographed, not just this app's chrome.
_SUPPRESS_CHROME_CSS = """
.header { position: static !important; }
.reading-progress-bar { display: none !important; }
.cookie-banner { display: none !important; }
"""


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
    # imported late: optional dep, and the module must still import fine
    # without a browser installed (see the design note in shots_for's caller)
    from playwright.sync_api import Error as PlaywrightError
    from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
    from playwright.sync_api import sync_playwright

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
        page.add_init_script(_CONSENT_INIT_SCRIPT)
        for shot in shots:
            url = f"{base_url.rstrip('/')}{shot['path']}"
            target = src_dir / Path(shot["asset"]).name
            try:
                page.goto(url, wait_until="networkidle")
            except PlaywrightTimeoutError as exc:
                # A *different* failure from "nothing answered": something
                # answered, but the page never went quiet (a stalled request,
                # a polling script, ...). Caught separately from the bare
                # connection failure below — TimeoutError is a subclass of
                # Error, so this branch must come first or it would be
                # mislabelled as "server not running", which it isn't.
                raise RuntimeError(
                    f"{campaign_id}: {url} (for the '{shot['asset']}' "
                    "screenshot) loaded but never reached a quiet network "
                    "state within Playwright's navigation timeout — the "
                    "preview server responded, so this looks like a stalled "
                    "request or a script that keeps polling, not a server "
                    f"that isn't running. Original error: {exc}"
                ) from exc
            except PlaywrightError as exc:
                raise RuntimeError(
                    f"{campaign_id}: could not load {url} (for the "
                    f"'{shot['asset']}' screenshot) — the preview server "
                    f"does not appear to be running at {base_url}. Start it "
                    "with `npm run build && npm run preview` and try again."
                ) from exc
            # Must be re-applied after every navigation: `add_style_tag`
            # injects into the current document only, and each shot may load
            # a different page.
            page.add_style_tag(content=_SUPPRESS_CHROME_CSS)
            if shot["selector"]:
                try:
                    # mermaid renders after hydration; wait for the node, not a timer
                    element = page.wait_for_selector(shot["selector"], timeout=15_000)
                except PlaywrightTimeoutError as exc:
                    raise RuntimeError(
                        f"{campaign_id}: selector {shot['selector']!r} never "
                        f"appeared on {url} within 15s (capturing the "
                        f"'{shot['asset']}' screenshot) — check the selector "
                        "still matches the live markup."
                    ) from exc
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
