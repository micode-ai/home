# -*- coding: utf-8 -*-
"""The `cost-of-ai-agent` campaign: spec, copy, and the rendered creatives.

`conftest.py` already puts `docs/marketing/scripts` on `sys.path` for every
test in this directory, so `import spec` below needs no path juggling of its
own.
"""
import json
import re
from pathlib import Path

from PIL import Image

import spec

MARKETING = Path(__file__).resolve().parents[1]
CAMPAIGN_ID = "cost-of-ai-agent"

# Verbatim from the article; a creative quoting a number the article does not
# make is a credibility problem, not a typo.
ARTICLE_FIGURES = ["$74.38", "$50.34", "$1254.00", "15 600", "19 100", "98,5", "82"]


def test_campaign_spec_loads_and_validates():
    campaign = spec.Campaign.load(CAMPAIGN_ID)
    assert campaign.track == "funnel-top"
    assert campaign.target.startswith("https://mi-code.pl/blog/ai-agent-cost-per-month-model")


def test_deck_opens_with_a_hook_and_closes_with_a_cta():
    campaign = spec.Campaign.load(CAMPAIGN_ID)
    assert campaign.slides[0]["type"] == "hook"
    assert campaign.slides[-1]["type"] == "cta"


def test_deck_is_carousel_sized():
    """Under four slides is a single post; over eight, LinkedIn readers drop off."""
    campaign = spec.Campaign.load(CAMPAIGN_ID)
    assert 4 <= len(campaign.slides) <= 8


def test_every_slide_has_a_headline_in_both_languages():
    campaign = spec.Campaign.load(CAMPAIGN_ID)
    for index, slide in enumerate(campaign.slides):
        for lang in ("pl", "en"):
            assert slide[lang].get("headline"), f"slide {index} has no {lang} headline"


def test_hook_number_comes_from_the_article():
    campaign = spec.Campaign.load(CAMPAIGN_ID)
    assert campaign.slides[0]["bigNumber"] == "$74.38"


def test_every_figure_in_the_spec_appears_in_the_article():
    """No invented numbers: each $-amount in the deck must exist in the post."""
    posts = json.loads((MARKETING.parents[1] / "src" / "data" / "blog-posts.json")
                       .read_text(encoding="utf-8"))
    posts = posts if isinstance(posts, list) else posts["posts"]
    article = next(p for p in posts if p["slug"] == "ai-agent-cost-per-month-model")
    corpus = (article["bodyPl"] or "") + (article["bodyEn"] or "")
    raw = (MARKETING / "campaigns" / CAMPAIGN_ID / "campaign.json").read_text(encoding="utf-8")
    for amount in set(re.findall(r"\$[0-9][0-9.,]*", raw)):
        assert amount in corpus, f"{amount} appears in the deck but not in the article"


def test_copy_file_covers_both_languages_and_all_channels():
    copy = (MARKETING / "copy" / f"funnel-{CAMPAIGN_ID}.md").read_text(encoding="utf-8")
    for marker in ("## LinkedIn", "### PL", "### EN", "## Facebook", "## Stories"):
        assert marker in copy, f"copy is missing the {marker!r} section"


def test_copy_links_are_utm_tagged():
    copy = (MARKETING / "copy" / f"funnel-{CAMPAIGN_ID}.md").read_text(encoding="utf-8")
    links = re.findall(r"https://mi-code\.pl/\S+", copy)
    assert links, "copy contains no link to the site"
    for link in links:
        assert "utm_campaign=cost-of-ai-agent" in link, f"untagged link: {link}"


def test_copy_uses_the_english_url_prefix_in_the_english_sections():
    copy = (MARKETING / "copy" / f"funnel-{CAMPAIGN_ID}.md").read_text(encoding="utf-8")
    english = copy.split("### EN", 1)[1]
    assert "mi-code.pl/en/blog/" in english


def test_every_language_section_links_to_its_own_locale_and_channel():
    """Per-section, not once for the whole file.

    `test_copy_uses_the_english_url_prefix_in_the_english_sections` splits on
    the *first* `### EN` and keeps everything after it — which, in a file with
    a LinkedIn block followed by a Facebook block, includes the Facebook PL
    section too. So a Facebook EN link that dropped the `/en/` prefix still
    leaves that test green as long as the LinkedIn EN link kept it. Same hole
    on the channel: nothing above checks that the LinkedIn section's links say
    `utm_source=linkedin` rather than `facebook`, which would send a month of
    LinkedIn clicks into the wrong bucket and quietly ruin the attribution the
    whole UTM scheme exists for. This walks every `##` channel block and every
    `###` language block inside it and checks each link against the locale and
    the channel it actually sits under.
    """
    copy = (MARKETING / "copy" / f"funnel-{CAMPAIGN_ID}.md").read_text(encoding="utf-8")
    sources = {"## LinkedIn": "linkedin", "## Facebook": "facebook", "## Stories": "instagram"}

    channel = None
    language = None
    checked = 0
    for line in copy.splitlines():
        heading = line.strip()
        if heading in sources:
            channel, language = heading, None
        elif heading in ("### PL", "### EN"):
            language = heading
        for link in re.findall(r"https://mi-code\.pl/\S+", line):
            assert channel, f"link outside any channel section: {link}"
            assert language, f"link outside any language section: {link}"
            expected_source = f"utm_source={sources[channel]}"
            assert expected_source in link, (
                f"{channel} {language} link carries the wrong source, "
                f"expected {expected_source!r}: {link}"
            )
            prefix = "https://mi-code.pl/en/blog/" if language == "### EN" \
                else "https://mi-code.pl/blog/"
            assert link.startswith(prefix), (
                f"{channel} {language} link should start with {prefix!r}: {link}"
            )
            checked += 1
    assert checked >= 5, f"only {checked} links checked — the copy lost its links"


def test_all_renders_exist_at_the_right_size():
    expected = {
        "carousel-01.png": (1080, 1350),
        "li-single.png": (1200, 627),
        "feed-4x5.png": (1080, 1350),
        "og.png": (1200, 630),
        "story-9x16-01.png": (1080, 1920),
    }
    for lang in ("pl", "en"):
        out = MARKETING / "creatives" / CAMPAIGN_ID / "renders" / lang
        for name, size in expected.items():
            path = out / name
            assert path.is_file(), f"{lang}/{name} not rendered"
            with Image.open(path) as img:
                assert img.size == size, f"{lang}/{name} is {img.size}, expected {size}"


def test_carousel_pdf_shipped_for_both_languages():
    for lang in ("pl", "en"):
        pdf = MARKETING / "creatives" / CAMPAIGN_ID / "renders" / lang / "carousel.pdf"
        assert pdf.is_file() and pdf.stat().st_size > 5000
