# -*- coding: utf-8 -*-
"""Rulings that are about the `rag-without-hallucinations` deck specifically.

The campaign-agnostic checks — spec shape, figures against the article,
glyph coverage, copy sections, UTM links, render sizes — are in
`test_campaigns.py` and cover this campaign by virtue of its campaign.json
existing. This file pins the two decisions that were made *for this deck* and
would otherwise survive only as prose.

`conftest.py` already puts `docs/marketing/scripts` on `sys.path`.
"""
import spec

CAMPAIGN_ID = "rag-without-hallucinations"


def test_the_cover_is_the_abstention_figure():
    """Of the article's figures, 100% abstention on out-of-base questions is
    the only one that is *measured proof* of "does not hallucinate" rather
    than a description of effort. 99% citability and 97% fact coverage are
    the softer pair, and putting either on the cover would trade the deck's
    single strongest B2B claim for a weaker one that reads the same."""
    campaign = spec.Campaign.load(CAMPAIGN_ID)
    assert campaign.slides[0]["bigNumber"] == "100%"


def test_the_deck_carries_no_diagram_slide():
    """Deliberate, and measured — not an oversight to be tidied up later.

    Every diagram in `legalka-kb-ai-architecture` is mermaid, and the central
    one (`legalka-answer-flow`) is `flowchart TB`: tall and narrow. That is
    exactly the shape `strategy.md` measured through the real `slides.render`
    at 0.30x on 1080x1350 and 0.13x on 1200x630, giving 7-9px node labels —
    against this project's own Task 9 ruling that 8.2px is illegible and
    ~16-19px is required. No warning fires at any of those scales:
    `slides._MIN_DIAGRAM_HEIGHT` is 50px and the available height is 233-847px,
    so the frame is drawn, honestly, and unreadably. The article has no table
    to photograph instead, so a third `numbers` slide carries the content.

    Consequence worth keeping true: with no `diagram` slide this campaign
    needs no `capture_screens.py` run at all, and therefore never meets the
    mermaid capture race documented in `README.md`. If a diagram slide is ever
    added here, this test is the place to record the measurement that
    justified it.
    """
    campaign = spec.Campaign.load(CAMPAIGN_ID)
    types = [slide["type"] for slide in campaign.slides]
    assert "diagram" not in types, (
        "a diagram slide was added to a deck whose only diagrams are tall "
        "mermaid flowcharts; measure the rendered label height first"
    )
    assert types.count("numbers") >= 3, (
        "the numbers slides are what replaced the diagram slide; dropping to "
        "fewer leaves the deck asserting quality without showing it"
    )
