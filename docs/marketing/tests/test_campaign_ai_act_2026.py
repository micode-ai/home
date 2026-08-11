# -*- coding: utf-8 -*-
"""Rulings that are about the `ai-act-2026` deck specifically.

The campaign-agnostic checks — spec shape, figures against the article, glyph
coverage, copy sections, UTM links, render sizes — are in `test_campaigns.py`
and cover this campaign by virtue of its campaign.json existing. This file pins
the two decisions made *for this deck* that would otherwise survive only as
prose.

`conftest.py` already puts `docs/marketing/scripts` on `sys.path`.
"""
import spec

CAMPAIGN_ID = "ai-act-2026"


def test_the_cover_is_the_article_number_not_a_penalty():
    """Of this article's 26 figures, `50` is the only one a reader already
    carries as a *name* rather than a quantity: "Article 50" is how the duty is
    referred to everywhere, so it hooks without a decoded caption.

    The alternative covers are all worse for the same reason. `15` and `35` are
    the fine ceilings, and a cover built on a penalty makes the deck a threat
    from a vendor who is not the reader's lawyer — the register `cta-blocks.md`
    rules out for this campaign. `2027` is the deferral year and would put the
    deck's cover on the half of the story that is *not* urgent, which is the
    exact misreading slide 2 exists to correct.
    """
    campaign = spec.Campaign.load(CAMPAIGN_ID)
    assert campaign.slides[0]["bigNumber"] == "50"


def test_the_deck_carries_no_picture_slide_because_nothing_was_measured():
    """Deliberate, and on a *different* ground from the four earlier refusals.

    Campaign 2 had no candidate, campaign 4's candidates were all cut by the
    shrink detector, campaign 5's sole survivor was a content dead end, and
    campaign 6 refused a measurably fine picture because the neighbouring
    calendar row had already published it. Here the picture was never measured:
    both candidates live on the article page, so capturing either needs a live
    build (`npm run build && npm run preview`) plus a playwright chromium, and
    neither `capture_screens.check_mermaid_shrink` nor `slides._TALL_MIN_SCALE`
    was ever run against them.

    The factory's rule reads in one direction — a picture ships only with a
    measurement — so no measurement means no picture slide, and three `numbers`
    slides carry the content instead. What to measure first if that is ever
    revisited is written down in `copy/funnel-ai-act-2026.md`: the
    `ai-act-dates` table (a direct precedent — campaign 1 photographs the cost
    table out of its own article) ahead of the `ai-act-timeline` mermaid, and
    via the `diagram` path with *two* captures, because that table renders its
    own per-language headers and rows out of `src/data/article-tables.ts`.

    Consequence worth keeping true: with no picture slide this campaign needs no
    `capture_screens.py` run at all, so it never meets the mermaid capture race
    documented in `README.md`. If a picture slide is added here, this test is
    where the measurement that justified it belongs.
    """
    campaign = spec.Campaign.load(CAMPAIGN_ID)
    types = [slide["type"] for slide in campaign.slides]
    assert not ({"diagram", "tall-diagram"} & set(types)), (
        "a picture slide was added to a deck whose candidates have never been "
        "measured; run capture_screens.py against the ai-act-dates table and "
        "record the ink band here first"
    )
    assert types.count("numbers") >= 3, (
        "the three numbers slides are what stands in for the picture: the "
        "calendar, the four Article 50 duties and the two upcoming deadlines"
    )
