# -*- coding: utf-8 -*-
"""Rulings that are about the `cost-of-ai-agent` deck specifically.

Everything this file used to assert about spec shape, figures, copy sections,
UTM tagging and render sizes now lives in `test_campaigns.py`, parametrised
over every `campaigns/*/campaign.json` — so campaign two got that coverage the
moment its spec existed rather than when somebody hand-wrote a second copy of
this file. What is left here is what genuinely does not generalise: the
calculator screenshot, whose correctness is a fact about this one article's
reference calculation.

`conftest.py` already puts `docs/marketing/scripts` on `sys.path`.
"""
from urllib.parse import parse_qsl, urlsplit

import spec

CAMPAIGN_ID = "cost-of-ai-agent"


def _diagram_slide(campaign) -> dict:
    return next(s for s in campaign.slides if s["type"] == "diagram")


def test_the_cover_quotes_the_reference_configurations_monthly_bill():
    """$74.38 is not just "a number from the article" — it is the bill for the
    exact configuration the deck's own cover names (8 steps, 1500 tasks,
    gpt-5.4-mini, prefix caching). `test_campaigns.py` proves the cover figure
    exists in the article; this pins *which* of the article's several figures
    it is, so a swap to $50.34 (also in the article, also a real bill, but for
    a different model) cannot pass."""
    campaign = spec.Campaign.load(CAMPAIGN_ID)
    assert campaign.slides[0]["bigNumber"] == "$74.38"


def test_the_calculator_shot_reproduces_the_articles_reference_configuration():
    """The screenshot must show the bill the deck's cover claims.

    The calculator's table renders `result.low.components`, and its *defaults*
    are 4 steps with no cache — a $94.05 bill. The deck's cover says $74.38.
    The article names the exact fields that reproduce its own reference
    calculation ("set both step fields to 8 and the cache share to 90"), so the
    capture URL must carry them; without that the slide shows a third number to
    an audience that will add the column up. Pixels are outside the reach of
    every figure scan in `test_campaigns.py` — this is the only guard.
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
