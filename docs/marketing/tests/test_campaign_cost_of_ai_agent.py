# -*- coding: utf-8 -*-
"""The `cost-of-ai-agent` campaign: spec, copy, and the rendered creatives.

`conftest.py` already puts `docs/marketing/scripts` on `sys.path` for every
test in this directory, so `import spec` below needs no path juggling of its
own.
"""
import json
import re
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit

from PIL import Image

import spec

MARKETING = Path(__file__).resolve().parents[1]
CAMPAIGN_ID = "cost-of-ai-agent"

# Verbatim from the article; a creative quoting a number the article does not
# make is a credibility problem, not a typo. The `$`-amounts are also covered
# by the regex scan below, but the rest — token counts and percentages — carry
# no marker a regex can find them by, so they are listed here and asserted by
# `test_every_article_figure_is_still_quoted_in_the_deck`.
ARTICLE_FIGURES = ["$74.38", "$50.34", "$1254.00", "15 600", "19 100", "98,5", "82"]


def _article() -> dict:
    posts = json.loads((MARKETING.parents[1] / "src" / "data" / "blog-posts.json")
                       .read_text(encoding="utf-8"))
    posts = posts if isinstance(posts, list) else posts["posts"]
    return next(p for p in posts if p["slug"] == "ai-agent-cost-per-month-model")


def _article_corpus() -> str:
    article = _article()
    return (article["bodyPl"] or "") + (article["bodyEn"] or "")


def _campaign_json() -> str:
    return (MARKETING / "campaigns" / CAMPAIGN_ID / "campaign.json").read_text(
        encoding="utf-8")


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
    corpus = _article_corpus()
    raw = _campaign_json()
    for amount in set(re.findall(r"\$[0-9][0-9.,]*", raw)):
        assert amount in corpus, f"{amount} appears in the deck but not in the article"


def test_every_article_figure_is_still_quoted_in_the_deck():
    """The other direction, and the non-`$` figures.

    The regex above can only scan what looks like a dollar amount, so a token
    count or a percentage in the deck is unguarded: mutating `98,5%` to `95,8%`
    in campaign.json leaves it green. `ARTICLE_FIGURES` names exactly those
    figures — assert both ends of each one, so the deck cannot drift from the
    article and the article cannot be edited out from under the deck.
    """
    corpus = _article_corpus()
    raw = _campaign_json()
    for figure in ARTICLE_FIGURES:
        assert figure in corpus, (
            f"{figure!r} is listed as an article figure but no longer appears "
            "in the article — the deck is quoting something the post dropped"
        )
        assert figure in raw, (
            f"{figure!r} is an article figure the deck is built on but it no "
            "longer appears in campaign.json"
        )


def _diagram_slide(campaign) -> dict:
    return next(s for s in campaign.slides if s["type"] == "diagram")


def test_the_calculator_shot_reproduces_the_articles_reference_configuration():
    """The screenshot must show the bill the deck's cover claims.

    The calculator's table renders `result.low.components`, and its *defaults*
    are 4 steps with no cache — a $94.05 bill. The deck's cover says $74.38.
    The article names the exact fields that reproduce its own reference
    calculation ("set both step fields to 8 and the cache share to 90"), so the
    capture URL must carry them; without that the slide shows a third number to
    an audience that will add the column up.
    """
    campaign = spec.Campaign.load(CAMPAIGN_ID)
    slide = _diagram_slide(campaign)
    reference = {"stepsMin": "8", "stepsMax": "8", "cachedSharePct": "90",
                 "model": "gpt-5.4-mini", "tasksPerDay": "50", "euResidency": "0"}
    for lang in ("pl", "en"):
        shot = slide[lang].get("shot") or slide.get("shot")
        assert shot, f"the {lang} diagram slide declares no shot"
        query = dict(parse_qsl(urlsplit(shot["path"]).query))
        for key, value in reference.items():
            assert query.get(key) == value, (
                f"{lang} capture URL has {key}={query.get(key)!r}, but the "
                f"article's reference calculation needs {key}={value!r}"
            )


def test_the_diagram_slide_captures_each_language_from_its_own_locale():
    """The calculator's table draws its headers and row labels from the site's
    own i18n dictionaries, so one capture cannot serve both decks: a single
    shared screenshot puts a Polish table (`Skladnik / USD miesiecznie /
    Udzial w rachunku`) on the English slide whose whole job is to look
    rigorous. Each language must name its own file and its own locale URL."""
    campaign = spec.Campaign.load(CAMPAIGN_ID)
    slide = _diagram_slide(campaign)
    pl_path = (slide["pl"].get("shot") or slide.get("shot", {}))["path"]
    en_path = (slide["en"].get("shot") or slide.get("shot", {}))["path"]
    assert pl_path.startswith("/blog/"), pl_path
    assert en_path.startswith("/en/blog/"), en_path

    pl_asset = campaign.asset(slide["pl"]) or campaign.asset(slide)
    en_asset = campaign.asset(slide["en"]) or campaign.asset(slide)
    assert pl_asset and en_asset, "the diagram slide resolves no screenshot"
    assert pl_asset != en_asset, (
        f"both decks resolve to the same capture ({pl_asset.name}) — the "
        "English slide would ship a Polish table"
    )
    for path in (pl_asset, en_asset):
        assert path.is_file(), f"{path} was never captured"


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
