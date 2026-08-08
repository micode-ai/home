# -*- coding: utf-8 -*-
"""Every campaign on disk, checked by the same rules.

This file used to be `test_campaign_cost_of_ai_agent.py` with `CAMPAIGN_ID`,
`ARTICLE_FIGURES` and the article slug hardcoded at the top. That shape
contradicted two things the branch promises out loud: `strategy.md` presents
"no invented figures" as an *enforced* guarantee, and the spec's own success
criterion is that adding the twelfth campaign needs no new code. With the
per-campaign file, campaign two would have had zero coverage until somebody
hand-wrote a parallel copy of 242 lines — so the guarantee held for exactly
one campaign, and the criterion was false for the test suite.

So the campaign-agnostic half is parametrised over every
`campaigns/*/campaign.json` on disk, and the two pieces of per-campaign data
it needs — which material the deck is built out of, and which figures it is
built on — live in that campaign.json under `source` (see `spec._source`). A
new campaign is therefore covered the moment its spec exists, and a campaign
that forgets to declare its corpus fails `test_every_campaign_declares_the_
corpus_its_figures_are_checked_against` rather than silently opting out of the
figure guard.

That mandate is unconditional across tracks, and it was not always. It used to
be gated on `track == "funnel-top"` — with every downstream figure check
written as `if not campaign.source_slug: pytest.skip(...)` — so a mid-funnel
campaign could simply omit the `source` block and opt out of the whole guard.
Reconstructed on a throwaway funnel-mid campaign with invented numbers on the
cover, in the rows and in both post-text blocks: the sweep went **100% green**,
with five SKIPPED lines where the checks should have been. Campaign three
escaped only because its target happens to be an article. So: two shapes of
corpus (`source.slug` for an article, `source.product` for a product page),
exactly one required of every campaign, and nothing below skips on its
absence — a campaign that declares neither fails, loudly, in every scan that
would have read it.

What stays campaign-specific lives in `test_campaign_<id>.py` next to this
file: rulings that are about one deck, not about decks in general.

`conftest.py` already puts `docs/marketing/scripts` on `sys.path`, so
`import spec` below needs no path juggling of its own.
"""
import datetime
import json
import re
from pathlib import Path

import imageio_ffmpeg
import pytest
from fontTools.ttLib import TTFont
from PIL import Image

import brand
import slides
import spec

MARKETING = Path(__file__).resolve().parents[1]
CAMPAIGNS = MARKETING / "campaigns"
SITE_DATA = MARKETING.parents[1] / "src" / "data"
POSTS = SITE_DATA / "blog-posts.json"
PRODUCTS = SITE_DATA / "products.json"

CAMPAIGN_IDS = sorted(path.parent.name for path in CAMPAIGNS.glob("*/campaign.json"))

# Campaign ids that have shipped a spec so far. `CAMPAIGN_IDS` is a glob, and
# a glob that stops matching turns every parametrised test in this file into a
# vacuous pass. Pinned so the sweep cannot quietly shrink; extend it when a
# campaign lands, which is the one moment a human is looking at this file.
KNOWN_CAMPAIGNS = {"cost-of-ai-agent", "rag-without-hallucinations",
                   "accounting-ai", "geo-aeo", "legalka-kb",
                   "accounting-automation-pl", "self-improving-agents"}

# The keys of a language block that end up as ink on a slide. `slides.py`
# reads exactly these (`_plan_header` -> eyebrow/headline, `_plan_sub` -> sub,
# `_plan_numbers` -> rows) plus the slide-level `bigNumber`; `asset`/`shot`
# are capture instructions, never drawn. The figure scan and the glyph scan
# below are only as complete as this tuple, so
# `test_the_copy_scan_covers_every_key_a_language_block_declares` fails if a
# campaign.json ever starts declaring a rendered key that is not listed here.
COPY_KEYS = ("eyebrow", "headline", "sub")
LANG_BLOCK_KEYS = set(COPY_KEYS) | {"rows", "asset", "shot"}
SLIDE_KEYS = {"type", "bigNumber", "rows", "asset", "shot", *spec.LANGS}

# `## <heading>` in a copy file -> the `utm_source` links under it must carry.
CHANNEL_SOURCES = {"LinkedIn": "linkedin", "Facebook": "facebook",
                   "Stories": "instagram"}
# How the content plan's channel column names the same three channels.
PLAN_CHANNEL_PREFIXES = {"LinkedIn": "LinkedIn", "Facebook": "Facebook",
                         "Stories": "Stories"}

SINGLE_FORMATS = {"li-single.png": (1200, 627),
                  "feed-4x5.png": (1080, 1350),
                  "og.png": (1200, 630)}
CAROUSEL_SIZE = (1080, 1350)
STORY_SIZE = (1080, 1920)
FEED_VIDEO_SIZE = (1080, 1350)

# Instagram accepts a video in the *feed* (and in an ad's feed placement) only
# within this range of width/height. 9:16 = 0.5625 is below it, which is why
# `reel.mp4` cannot be posted to a feed and `reel-4x5.mp4` exists.
FEED_RATIO_RANGE = (0.8, 16 / 9)


# --- helpers ---------------------------------------------------------------

def _campaign(campaign_id: str) -> spec.Campaign:
    return spec.Campaign.load(campaign_id)


def _article(slug: str) -> dict:
    posts = json.loads(POSTS.read_text(encoding="utf-8"))
    posts = posts if isinstance(posts, list) else posts["posts"]
    return next(post for post in posts if post["slug"] == slug)


def _article_corpus(slug: str) -> str:
    article = _article(slug)
    return (article.get("bodyPl") or "") + (article.get("bodyEn") or "")


def _products() -> list[dict]:
    data = json.loads(PRODUCTS.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else data["products"]


def _product(product_id: str) -> dict:
    for product in _products():
        if product.get("id") == product_id:
            return product
    raise AssertionError(
        f"{product_id!r} is not a product in {PRODUCTS.name}; known ids are "
        f"{sorted(p.get('id') for p in _products())}"
    )


def _i18n(lang: str) -> dict:
    return json.loads((SITE_DATA / f"{lang}.json").read_text(encoding="utf-8"))


def _lookup(tree: dict, dotted: str):
    """`t(key, lang)` from `src/services/i18n.ts`, in eight lines."""
    node = tree
    for part in dotted.split("."):
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node


def _translation_keys(node) -> list[str]:
    """Every i18n key a `products.json` entry references, at any depth.

    `products.json` names its copy indirectly and in three different shapes —
    `nameKey`/`descriptionKey`/`pricingKey` at the top level, bare key strings
    in `features`, `questionKey`/`answerKey` inside `faq` — so walk the whole
    entry and keep the strings that resolve, rather than listing the shapes.
    """
    if isinstance(node, dict):
        return [key for value in node.values() for key in _translation_keys(value)]
    if isinstance(node, list):
        return [key for value in node for key in _translation_keys(value)]
    return [node] if isinstance(node, str) and "." in node else []


def _product_corpus(product_id: str) -> str:
    """What a reader of the product page can check a figure against.

    The mid-funnel counterpart of `_article_corpus`. A product page has no
    `body*`: `ProductPage.svelte` looks the product up in `products.json` and
    renders it generically, taking every string it shows through `t(key, lang)`
    against `src/data/{pl,en}.json`. So the corpus is exactly those resolved
    strings, in both published languages.

    Deliberately narrow in two directions. Only *resolved* translations count,
    not the raw literals in `products.json` (urls, `accentColor`, the badge
    label) — a corpus is only a guard while it is small. And the page's
    LangGraph diagram is **excluded** even though it is ink on the same page:
    it comes from `src/data/langgraph-diagrams.ts`, which is where the known
    "20+ Accounting Tools" error lives, roughly 4x under the article's audited
    58. Admitting it would let a campaign cite a number the site itself is
    wrong about, which is the opposite of what this corpus is for.
    """
    product = _product(product_id)
    texts: list[str] = []
    for lang in spec.LANGS:
        tree = _i18n(lang)
        for key in _translation_keys(product):
            value = _lookup(tree, key)
            if isinstance(value, str):
                texts.append(value)
    return "\n".join(texts)


def _require_source(campaign: spec.Campaign) -> None:
    """Refuse to proceed on a campaign that named no corpus.

    Every figure check below used to open with `if not campaign.source_slug:
    pytest.skip(...)`, which is precisely how a campaign opted out of all of
    them at once. They now open with this, which raises. A skip reads as "not
    applicable"; here it meant "unchecked".
    """
    if not (campaign.source_slug or campaign.source_product):
        raise AssertionError(
            f"{campaign.id} declares neither source.slug nor source.product, "
            "so there is nothing to check its figures against — see "
            "test_every_campaign_declares_the_corpus_its_figures_are_checked_"
            "against"
        )


def _corpus(campaign: spec.Campaign) -> str:
    """The text `campaign`'s every figure has to stand in, verbatim."""
    _require_source(campaign)
    if campaign.source_slug:
        return _article_corpus(campaign.source_slug)
    return _product_corpus(campaign.source_product)


def _source_name(campaign: spec.Campaign) -> str:
    _require_source(campaign)
    return campaign.source_slug or f"the {campaign.source_product} product page"


# A campaign's copy file goes by one of two names, and `README.md`'s own tree
# declares both: `funnel-<id>.md` for the five top-of-funnel decks,
# `product-<id>.md` for the six mid-funnel "product as proof" posts — which is
# also the name `content-plan.md`'s Текст column gives for every one of those
# six rows. This helper hardcoded `funnel-`, so the file's headline claim (a
# campaign is covered the moment its spec exists, with no code edit) held for
# exactly the half of the plan that had shipped. Content-plan row 5 is the
# first mid-funnel campaign and it is where that broke: four tests below read
# the copy file, and every one of them died on a path that was never going to
# exist. Resolved by asking which of the two names is on disk instead of
# assuming, and by refusing to guess when both are.
_COPY_PREFIXES = ("funnel-", "product-")


def _copy_candidates(campaign_id: str) -> list[Path]:
    return [MARKETING / "copy" / f"{prefix}{campaign_id}.md"
            for prefix in _COPY_PREFIXES]


def _copy_path(campaign_id: str) -> Path:
    found = [path for path in _copy_candidates(campaign_id) if path.is_file()]
    if len(found) == 1:
        return found[0]
    names = " or ".join(path.name for path in _copy_candidates(campaign_id))
    if not found:
        raise AssertionError(
            f"{campaign_id} has no copy file — expected {names} under "
            f"{MARKETING / 'copy'}"
        )
    raise AssertionError(
        f"{campaign_id} has two copy files ({', '.join(p.name for p in found)}); "
        "every scan below would read one of them while the calendar sends the "
        "operator to the other, so pick one and delete the other"
    )


def _slide_strings(slide: dict) -> list[str]:
    """Every string this slide puts in front of a reader, both languages.

    Deliberately not `json.dumps(campaign.json)`: the figure guard would then
    be scanning `source.figures` — the very list it is checking against — and
    "the deck still quotes this figure" would be true by construction.
    """
    out: list[str] = []
    if slide.get("bigNumber"):
        out.append(str(slide["bigNumber"]))
    for label, value in slide.get("rows") or []:
        out += [str(label), str(value)]
    for lang in spec.LANGS:
        block = slide.get(lang, {})
        out += [str(block[key]) for key in COPY_KEYS if block.get(key)]
        for label, value in block.get("rows") or []:
            out += [str(label), str(value)]
    return out


def _deck_strings(campaign: spec.Campaign) -> list[str]:
    return [text for slide in campaign.slides for text in _slide_strings(slide)]


# A run of digits, optionally with thousands separators or a decimal comma /
# point inside it: `100`, `2,4`, `28 091`, `28,091`, `74.38`. Anchored so a
# trailing separator ("23%," in a sentence) is not swallowed.
_NUMBER = re.compile(r"[0-9][0-9 .,]*[0-9]|[0-9]")


def _numbers_in(texts: list[str]) -> set[str]:
    found: set[str] = set()
    for text in texts:
        found |= set(_NUMBER.findall(text))
    return found


def _quotes(figure: str, haystack: str) -> bool:
    """`figure` stands in `haystack` as a whole number, not as a fragment.

    Plain `in` would let `5` pass on the strength of `51%`, and `2,4` pass on
    the strength of `12,45`. Digit boundaries are the difference between a
    guard and a formality.
    """
    return re.search(rf"(?<![0-9]){re.escape(figure)}(?![0-9])", haystack) is not None


def _plan_rows() -> list[dict]:
    rows = []
    plan = (MARKETING / "content-plan.md").read_text(encoding="utf-8")
    for line in plan.splitlines():
        if not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 6 or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", cells[1]):
            continue
        rows.append({"date": datetime.date.fromisoformat(cells[1]),
                     "campaign": cells[3].strip("`"),
                     "channel": cells[5]})
    return rows


def _scheduled_channels(campaign_id: str) -> set[str]:
    channels = set()
    for row in _plan_rows():
        if row["campaign"] != campaign_id:
            continue
        for heading, prefix in PLAN_CHANNEL_PREFIXES.items():
            if row["channel"].startswith(prefix):
                channels.add(heading)
    return channels


def _copy_sections(campaign_id: str) -> list[tuple[str, str, str]]:
    """(channel heading, language heading, line) for every link-bearing line."""
    out = []
    channel = language = None
    for line in _copy_path(campaign_id).read_text(encoding="utf-8").splitlines():
        heading = line.strip()
        if heading.startswith("## ") and not heading.startswith("### "):
            channel, language = heading[3:].strip(), None
        elif heading in ("### PL", "### EN"):
            language = heading[4:]
        if "https://mi-code.pl/" in line:
            out.append((channel, language, line))
    return out


# Three things a publishable line legitimately carries that no reader reads as
# a claim: an inline code span (`story-9x16-01.png`, `content-plan.md`), the
# tagged link, and the "1." of a Stories caption list. They are *stripped* from
# the line rather than used to skip it, which is the difference between
# covering campaign 1's Stories captions and dropping them: every one of those
# captions shares its line with a backticked filename, so a line-level skip
# would silently exempt the six lines most likely to be retyped by hand.
_CODE_SPAN = re.compile(r"`[^`]*`")
_URL = re.compile(r"https?://\S+")
_LIST_MARKER = re.compile(r"^\s*\d+[.)]\s")


def _post_lines(campaign_id: str) -> list[tuple[str, str]]:
    """(language, line) for every line of publishable prose in the copy file.

    Only `### PL` / `### EN` blocks. Everything else in a copy file — the
    Russian briefing at the top, the per-channel format notes — is an
    instruction to the operator, not text that goes into a post, and it
    legitimately names render filenames, page counts and calendar rows.
    """
    out: list[tuple[str, str]] = []
    language = None
    for line in _copy_path(campaign_id).read_text(encoding="utf-8").splitlines():
        heading = line.strip()
        if heading.startswith("## ") and not heading.startswith("### "):
            language = None
            continue
        if heading in ("### PL", "### EN"):
            language = heading[4:]
            continue
        if not language:
            continue
        prose = _URL.sub(" ", _CODE_SPAN.sub(" ", _LIST_MARKER.sub("", line)))
        if prose.strip():
            out.append((language, prose))
    return out


def _font_cmap(path: Path) -> set[int]:
    font = TTFont(str(path))
    covered: set[int] = set()
    for table in font["cmap"].tables:
        covered |= set(table.cmap.keys())
    return covered


# --- the sweep itself ------------------------------------------------------

def test_the_campaign_sweep_actually_found_the_campaigns_on_disk():
    """Every test below is parametrised over `CAMPAIGN_IDS`. If that glob ever
    stops matching — a renamed directory, a moved `campaigns/` — pytest
    generates zero cases and the whole file passes without checking anything.
    Assert the sweep is populated, and that it still contains every campaign
    known to have shipped."""
    assert CAMPAIGN_IDS, f"no campaign.json found under {CAMPAIGNS}"
    missing = KNOWN_CAMPAIGNS - set(CAMPAIGN_IDS)
    assert not missing, f"the sweep no longer covers {sorted(missing)}"


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_spec_loads_and_names_itself_after_its_directory(campaign_id):
    campaign = _campaign(campaign_id)
    assert campaign.id == campaign_id, (
        f"{campaign_id}/campaign.json declares id {campaign.id!r}; the "
        "generators are invoked by directory name, so the two must agree"
    )
    assert campaign.track in ("funnel-top", "funnel-mid")
    assert campaign.target.startswith("https://mi-code.pl/")
    assert not campaign.target.startswith("https://mi-code.pl/en/"), (
        "target is the PL page; spec.Campaign.link inserts /en/ for English"
    )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_deck_opens_with_a_hook_and_closes_with_a_cta(campaign_id):
    campaign = _campaign(campaign_id)
    assert campaign.slides[0]["type"] == "hook"
    assert campaign.slides[-1]["type"] == "cta"


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_deck_is_carousel_sized(campaign_id):
    """Under four slides is a single post; over eight, LinkedIn readers drop off."""
    campaign = _campaign(campaign_id)
    assert 4 <= len(campaign.slides) <= 8


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_every_slide_has_a_headline_in_both_languages(campaign_id):
    campaign = _campaign(campaign_id)
    for index, slide in enumerate(campaign.slides):
        for lang in spec.LANGS:
            assert slide[lang].get("headline"), (
                f"{campaign_id} slide {index} has no {lang} headline"
            )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_every_campaign_declares_the_corpus_its_figures_are_checked_against(
        campaign_id):
    """No campaign of any shape gets to opt out of the figure guard.

    This test used to be `test_a_top_of_funnel_campaign_declares_the_article_
    it_summarises` and began `if campaign.track != "funnel-top": pytest.skip`.
    Every downstream figure check was written the same way — `if not
    campaign.source_slug: pytest.skip` — so the entire guarantee hung on a
    field a campaign was free to omit. Reconstructed on a throwaway funnel-mid
    campaign: delete the `source` block, plant `9999` on the cover, `4242` and
    `9999` in the rows and both numbers in the PL and EN post text, and the
    sweep is 100% green with five SKIPPED lines. Skipping is worse than
    failing here, because a skip reads as "not applicable" in exactly the
    place where it means "unchecked". Five product rows of `content-plan.md`
    are still unbuilt, and every one of them would have inherited it.

    So: two corpora, one mandatory declaration.

    - `source.slug` names a blog article and the figures are checked against
      `bodyPl` + `bodyEn`. Not a top-of-funnel-only field — campaign three is
      mid-funnel and links to (and photographs) an article.
    - `source.product` names an id in `src/data/products.json` and the figures
      are checked against the i18n strings that product's page renders. This
      is the answer to "a product campaign has no article": it does have a
      corpus, it is the page it sends the reader to, and it is checkable.

    `spec._source` refuses a campaign that declares *both*; this refuses one
    that declares neither, and also pins that whatever it declares resolves to
    something real and non-empty. `source.figures` is required with it —
    without it, `test_every_declared_figure_still_stands...` has nothing to
    hold the deck to when the source is edited out from under it.
    """
    campaign = _campaign(campaign_id)
    declared = [name for name in (campaign.source_slug, campaign.source_product)
                if name]
    assert len(declared) == 1, (
        f"{campaign_id} ({campaign.track}) declares {len(declared)} sources "
        f"{declared}; every campaign must name exactly one — source.slug for "
        "an article, source.product for a product page — or no figure in its "
        "deck is checked against anything"
    )
    if campaign.source_slug:
        _article(campaign.source_slug)  # StopIteration if the slug is wrong
    else:
        _product(campaign.source_product)  # AssertionError naming the known ids
    assert campaign.source_figures, (
        f"{campaign_id} declares no source.figures, so nothing pins the deck "
        f"to {_source_name(campaign)}'s own numbers"
    )
    assert _corpus(campaign).strip(), (
        f"{campaign_id}'s declared source resolves to an empty corpus, so "
        "every figure check below would pass or fail for the wrong reason"
    )


@pytest.mark.parametrize("product_id", sorted(p["id"] for p in _products()))
def test_a_product_page_resolves_to_a_corpus_a_campaign_can_be_checked_against(
        product_id):
    """`source.product` is the mid-funnel half of the mandate above, and today
    no shipped campaign uses it — campaign three is mid-funnel but points at an
    article. An unexercised corpus resolver is the same shape of hole as the
    guard it was written to close: it would sit there resolving to nothing
    until the first product campaign, and *that* campaign would then pass every
    figure check vacuously. So resolve all six products now, against the site
    data as it stands.

    The floor is deliberately low and structural rather than a golden string:
    the check is that `products.json`'s indirection still lands in
    `src/data/{pl,en}.json` (a renamed key or a moved subtree breaks it), not
    that any particular sentence is present.
    """
    corpus = _product_corpus(product_id)
    assert len(corpus) > 500, (
        f"{product_id} resolves {len(corpus)} characters of product-page copy; "
        "its keys in products.json no longer land in src/data/{pl,en}.json, so "
        "a campaign built on this page would have almost nothing to check its "
        "figures against"
    )
    product = _product(product_id)
    for lang in spec.LANGS:
        name = _lookup(_i18n(lang), product["nameKey"])
        assert isinstance(name, str) and name in corpus, (
            f"{product_id}'s {lang} name ({product['nameKey']}) is missing from "
            "the corpus, so the walk over products.json is not finding its keys"
        )


def test_the_product_corpus_refuses_an_id_that_is_not_a_product():
    """A typo in `source.product` must name the mistake, not resolve to an
    empty corpus — an empty corpus fails every figure check for a reason that
    reads like a copy error."""
    with pytest.raises(AssertionError, match="not a product"):
        _product_corpus("accounting-ai-agent")


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_target_link_points_at_the_declared_source(campaign_id):
    """The deck quotes article A while the CTA sends the reader to article B
    is the one failure mode nobody would spot in review — both halves look
    right on their own. The same holds one step over for a product campaign:
    figures checked against product X's page, reader sent to product Y's."""
    campaign = _campaign(campaign_id)
    _require_source(campaign)
    expected = (campaign.source_slug if campaign.source_slug
                else f"/products/{campaign.source_product}/")
    assert expected in campaign.target, (
        f"{campaign_id} is built on {_source_name(campaign)} but links to "
        f"{campaign.target}"
    )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_hook_number_comes_from_the_article(campaign_id):
    """The cover figure is the one number every reader takes away, so it is
    the one that must not be a rounding of something the source never said.

    "The article" in the name is the usual case; for a `source.product`
    campaign the corpus is the product page's own i18n copy — see `_corpus`."""
    campaign = _campaign(campaign_id)
    corpus = _corpus(campaign)  # raises if the campaign declared no source
    hook = campaign.slides[0]
    big = hook.get("bigNumber")
    assert big, f"{campaign_id}'s hook slide carries no bigNumber"
    for number in _numbers_in([str(big)]):
        assert _quotes(number, corpus), (
            f"{campaign_id}'s cover says {big!r}, but {number!r} does not "
            f"appear in {_source_name(campaign)}"
        )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_every_number_a_reader_sees_appears_in_the_articles_own_text(campaign_id):
    """`strategy.md`: every number in a creative must stand verbatim in the
    article it links to. The old test only scanned `$`-amounts, so a token
    count, a percentage or a headcount was unguarded — `109` could become
    `190` and nothing would notice. Scans every rendered string instead, in
    both languages, against *this* campaign's own source — its article, or
    for a `source.product` campaign the i18n copy of the product page it
    sends the reader to.
    """
    campaign = _campaign(campaign_id)
    corpus = _corpus(campaign)  # raises if the campaign declared no source
    numbers = _numbers_in(_deck_strings(campaign))
    assert numbers, f"{campaign_id}'s deck states no numbers at all"
    for number in sorted(numbers):
        assert _quotes(number, corpus), (
            f"{campaign_id}'s deck states {number!r}, which does not appear "
            f"in the source it links to ({_source_name(campaign)})"
        )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_every_declared_figure_still_stands_in_both_the_article_and_the_deck(
        campaign_id):
    """The other direction. The scan above catches a deck that invents a
    number; it cannot catch a deck that quietly drops the figure it was built
    on, nor an article edited out from under a deck that no longer quotes it.
    `source.figures` names those load-bearing figures and asserts both ends.

    Does not skip on an empty `source.figures`: the mandate test above already
    requires the list to be non-empty, so the skip could only ever have fired
    for a campaign that had already opted out of the guard entirely.
    """
    campaign = _campaign(campaign_id)
    corpus = _corpus(campaign)  # raises if the campaign declared no source
    assert campaign.source_figures, (
        f"{campaign_id} declares no source.figures, so this direction of the "
        "guard checks nothing"
    )
    deck = " \n".join(_deck_strings(campaign))
    for figure in campaign.source_figures:
        assert _quotes(figure, corpus), (
            f"{figure!r} is declared a {campaign_id} source figure but no "
            f"longer appears in {_source_name(campaign)} — the deck is quoting "
            "something the source dropped"
        )
        assert _quotes(figure, deck), (
            f"{figure!r} is declared a {campaign_id} source figure but no "
            "longer appears anywhere a reader would see it"
        )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_copy_scan_covers_every_key_a_language_block_declares(campaign_id):
    """The figure and glyph scans read a fixed tuple of keys. A campaign that
    starts declaring, say, a `caption` would drop straight out of both scans
    with every test still green — a number or a missing glyph could then ship
    unchecked. Fail here instead, where the fix is one line in `COPY_KEYS`."""
    campaign = _campaign(campaign_id)
    for index, slide in enumerate(campaign.slides):
        extra = set(slide) - SLIDE_KEYS
        assert not extra, (
            f"{campaign_id} slide {index} declares unknown key(s) {sorted(extra)}; "
            "if they are rendered, add them to COPY_KEYS/SLIDE_KEYS"
        )
        for lang in spec.LANGS:
            extra = set(slide[lang]) - LANG_BLOCK_KEYS
            assert not extra, (
                f"{campaign_id} slide {index} ({lang}) declares unknown key(s) "
                f"{sorted(extra)}; if they are rendered, add them to COPY_KEYS"
            )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_every_glyph_in_the_deck_copy_exists_in_the_brand_fonts(campaign_id):
    """A character the bundled fonts do not carry renders as a blank box, and
    nothing in the pipeline says so: `slides.render` draws it, the PNG is the
    right size, every size assertion passes, and the tofu is only visible to
    someone who opens the file. Measured on the shipped fonts: `→` (U+2192)
    is missing from all four, so the obvious way to write "51% → 23%" on a
    slide would have shipped a box to LinkedIn.
    """
    campaign = _campaign(campaign_id)
    fonts = sorted((MARKETING / "assets" / "fonts").glob("*.ttf"))
    assert len(fonts) == 4, f"expected the four brand fonts, found {len(fonts)}"
    covered = set.intersection(*(_font_cmap(path) for path in fonts))
    used = {char for text in _deck_strings(campaign) for char in text}
    missing = sorted(char for char in used if ord(char) not in covered)
    assert not missing, (
        f"{campaign_id}'s copy uses {missing} — not in every brand font, so "
        "the slide would render a blank box where the character should be"
    )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_no_numbers_row_runs_into_its_own_value(campaign_id):
    """A `numbers` row draws its label from the left margin and its value
    right-aligned to the other edge. Nothing stops the two overlapping.

    This is not hypothetical and it is not a style question: campaign three's
    first render put `Contractor from the NIP alone` straight through
    `Biała Lista MF and KRS` — 145 px of overlap, two rows of solid mush on the
    published carousel page — with the whole suite green and no warning from
    any generator. `_fit_box` only ever shrinks type for *vertical* overflow,
    so a row that is too wide is simply drawn on top of itself. It was caught
    by opening the PDF, which is exactly the review step a test is supposed to
    stop depending on. The defect was noted as a deferred minor when `slides`
    was built ("right-aligned values go negative and collide with their own
    label at ~76 chars") and stayed unguarded until a campaign hit it.

    The floor is one em of the row font: below that the two columns stop
    reading as two columns. Measured on the decks as shipped — campaign one's
    tightest row is 9.46 em, campaign two's is 1.68 em, campaign three's is
    3.73 em — so one em is well under everything that has ever looked right
    and well over touching.

    Checked at the canvases a deck is actually published at. `build_single`
    renders the hook slide and nothing else, so a `numbers` slide never
    reaches 1200x627 or 1200x630, and failing a campaign for a canvas it is
    never drawn on is how a guard earns the habit of being ignored.
    """
    campaign = _campaign(campaign_id)
    rows = [s for s in campaign.slides if s["type"] == "numbers"]
    if not rows:
        pytest.skip(f"{campaign_id} has no numbers slide")
    checked = 0
    for index, slide in enumerate(rows, 1):
        for lang in spec.LANGS:
            for size in (CAROUSEL_SIZE, STORY_SIZE):
                text = campaign.text(slide, lang)
                box, ops, _ = slides._fit_box(size, slide, text)
                # Read the gap off the plan `render()` will execute rather
                # than re-deriving `_plan_numbers`' arithmetic here: the two
                # would be free to drift, which is the whole reason `_plan_*`
                # exists. A row is the pair of text ops sharing a baseline.
                by_y: dict[int, list] = {}
                for op in ops:
                    if op[0] == "text":
                        _, (x, y), string, font, _fill = op
                        by_y.setdefault(y, []).append((x, string, font))
                for y, drawn in sorted(by_y.items()):
                    if len(drawn) != 2:
                        continue  # eyebrow, headline and sub lines draw alone
                    drawn.sort()
                    (left_x, label, label_font), (right_x, value, _) = drawn
                    gap = right_x - (left_x + label_font.getlength(label))
                    checked += 1
                    assert gap >= box["row"].size, (
                        f"{campaign_id} slide {index} ({lang}) at "
                        f"{size[0]}x{size[1]}: {label!r} and {value!r} are "
                        f"{gap:.0f} px apart, under the {box['row'].size} px "
                        "(one em) this canvas needs to read as two columns"
                        + (" — they overlap" if gap < 0 else "")
                    )
    assert checked, f"{campaign_id} has numbers slides but no rows were measured"


def test_every_slide_type_that_carries_a_picture_is_checked_here():
    """The two tests below are keyed to a slide type each, and a third
    picture-bearing type would get neither.

    That is not hypothetical — `tall-diagram` is exactly how the second one
    came to exist, and until it was written a deck could declare a capture,
    resolve it to a path that was never written, and pass every test in this
    file: the checks are the only thing standing between a spec and a slide
    that renders brand chrome with a hole where the picture should be.
    `slides._PLACERS` is the authoritative list of types that paste one, so
    ask it rather than restating it.
    """
    assert set(slides._PLACERS) == {"diagram", "tall-diagram"}, (
        "a slide type gained (or lost) a picture; give it a capture check in "
        "this file and update this list"
    )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_a_tall_diagram_slide_captures_something_that_exists(campaign_id):
    """A `tall-diagram` deck's captures must be on disk and locale-correct.

    Deliberately *not* the sibling test's "one distinct capture per language"
    rule. That rule is right for `diagram`, whose captures are of pages that
    render their own text — campaign one photographs the article's cost table,
    whose headers come from `src/data/{pl,en}.json`, so a shared capture would
    put a Polish table under an English headline. It is wrong here: the five
    product LangGraph graphs are defined once in
    `src/data/langgraph-diagrams.ts` with English node labels and no i18n
    lookup at all, so one capture legitimately serves both decks, and
    `capture_screens.shots_for` is built to collapse it to a single browser
    round-trip. Requiring two would force a campaign to photograph the same
    pixels twice under different filenames.

    What still has to hold: every language resolves a capture, that file
    exists, and *if* a deck does declare two, each comes from its own locale.
    """
    campaign = _campaign(campaign_id)
    talls = [s for s in campaign.slides if s["type"] == "tall-diagram"]
    if not talls:
        pytest.skip(f"{campaign_id} has no tall-diagram slide")
    for index, slide in enumerate(talls):
        assets = {}
        for lang in spec.LANGS:
            block = slide[lang]
            shot = block.get("shot") or slide.get("shot")
            assert shot, f"{campaign_id} tall-diagram {index} declares no {lang} shot"
            path = campaign.asset(block) or campaign.asset(slide)
            assert path, (
                f"{campaign_id} tall-diagram {index} resolves no {lang} asset"
            )
            assert path.is_file(), f"{path} was never captured"
            assets[lang] = path
        if len(set(assets.values())) > 1:
            for lang in spec.LANGS:
                shot = slide[lang].get("shot") or slide.get("shot")
                prefix = "/en/" if lang == "en" else "/"
                assert shot["path"].startswith(prefix), (
                    f"{campaign_id} tall-diagram {index} declares a per-language "
                    f"capture but takes the {lang} one from {shot['path']}, "
                    "which is not that locale"
                )
                if lang == "pl":
                    assert not shot["path"].startswith("/en/")


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_a_diagram_slide_declares_its_own_capture_for_each_language(campaign_id):
    """A `diagram` slide with no resolvable screenshot degrades to a text
    slide (with a warning nobody reads in a batch run), and one shared
    screenshot puts a Polish table under an English headline whenever the
    captured page renders its own text. Skips cleanly for a deck with no
    diagram slide — see `strategy.md` on why campaign two has none."""
    campaign = _campaign(campaign_id)
    diagrams = [s for s in campaign.slides if s["type"] == "diagram"]
    if not diagrams:
        pytest.skip(f"{campaign_id} has no diagram slide")
    for index, slide in enumerate(diagrams):
        assets = {}
        for lang in spec.LANGS:
            block = slide[lang]
            shot = block.get("shot") or slide.get("shot")
            assert shot, f"{campaign_id} diagram {index} declares no {lang} shot"
            prefix = "/en/" if lang == "en" else "/"
            assert shot["path"].startswith(prefix), (
                f"{campaign_id} diagram {index} captures {lang} from "
                f"{shot['path']}, which is not that locale"
            )
            if lang == "pl":
                assert not shot["path"].startswith("/en/")
            path = campaign.asset(block) or campaign.asset(slide)
            assert path, f"{campaign_id} diagram {index} resolves no {lang} asset"
            assert path.is_file(), f"{path} was never captured"
            assets[lang] = path
        assert len(set(assets.values())) == len(spec.LANGS), (
            f"{campaign_id} diagram {index} resolves one capture for both "
            "languages; the English slide would ship a Polish screenshot"
        )


# --- the copy file ---------------------------------------------------------

@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_campaign_is_on_the_calendar(campaign_id):
    """A campaign with a spec, renders and copy but no row in
    `content-plan.md` is a campaign nobody will publish — and it also makes
    the channel check below vacuous, since that derives what the copy must
    carry from the calendar."""
    scheduled = [row for row in _plan_rows() if row["campaign"] == campaign_id]
    assert scheduled, f"{campaign_id} is not scheduled in content-plan.md"


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_each_campaign_has_exactly_one_copy_file(campaign_id):
    """One campaign, one file of post text — under whichever of the two names
    its funnel level uses.

    Neither failure is silent today: `_copy_path` raises on both zero files
    and two, so every scan that reads the copy file already dies. This test
    earns its place for two other reasons, and the docstring used to justify
    it with a third that the resolver makes unreachable ("every scan would
    happily check whichever the resolver picked first") — it does not pick,
    it refuses.

    First, it is the guard on `_copy_path` itself. The first draft of that
    resolver returned `found[0]`, and *then* the counterfactual was real: with
    both `funnel-<id>.md` and `product-<id>.md` on disk — a campaign renamed
    from one convention to the other with the old file left behind — the scans
    would read one while `content-plan.md` sent the operator to the other, so
    a stale post text with a stale link shipped past a green suite. Mutating
    the resolver back to `found[0]` is killed here and nowhere else.

    Second, it states the condition once, as itself, instead of as N copies of
    a low-level path error from unrelated tests — and naming both candidates
    is the only place a reader of this file learns that the two conventions
    exist at all.
    """
    found = [path.name for path in _copy_candidates(campaign_id) if path.is_file()]
    assert len(found) == 1, (
        f"{campaign_id} resolves {len(found)} copy files {found}; expected "
        f"exactly one of {[p.name for p in _copy_candidates(campaign_id)]}"
    )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_copy_file_carries_a_section_for_every_scheduled_channel(campaign_id):
    """The calendar tells the operator which channel to publish on and which
    copy file to publish from; if that file has no section for the channel,
    the operator is holding a render with nothing to post under it."""
    path = _copy_path(campaign_id)  # raises, naming both names, if absent
    copy = path.read_text(encoding="utf-8")
    channels = _scheduled_channels(campaign_id)
    assert channels, f"{campaign_id} schedules no recognised channel"
    for channel in sorted(channels):
        assert f"## {channel}" in copy, (
            f"content-plan.md schedules {campaign_id} on {channel} but "
            f"{path.name} has no '## {channel}' section"
        )
    for lang in ("PL", "EN"):
        assert f"### {lang}" in copy, f"{path.name} has no '### {lang}' block"


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_every_link_in_the_copy_is_the_one_spec_would_build_for_its_section(
        campaign_id):
    """Per section, not once per file. Splitting on the first `### EN` and
    checking the remainder — the old shape — leaves a Facebook EN link that
    dropped `/en/` green as long as the LinkedIn one kept it, and nothing at
    all checked that the links under `## LinkedIn` say `utm_source=linkedin`
    rather than `facebook`, which would pour a month of LinkedIn clicks into
    the wrong bucket. Compares each link against `spec.Campaign.link(lang,
    source)` for the section it actually sits under, which also pins the
    article slug, the locale prefix and the UTM campaign in one assertion.
    """
    campaign = _campaign(campaign_id)
    checked = 0
    for channel, language, line in _copy_sections(campaign_id):
        for link in re.findall(r"https://mi-code\.pl/\S+", line):
            assert channel in CHANNEL_SOURCES, (
                f"{campaign_id}: link under unknown channel {channel!r}: {link}"
            )
            assert language, f"{campaign_id}: link outside any language block: {link}"
            expected = campaign.link(language.lower(), CHANNEL_SOURCES[channel])
            assert link == expected, (
                f"{campaign_id} {channel}/{language} link is\n  {link}\n"
                f"but spec.Campaign.link builds\n  {expected}"
            )
            checked += 1
    assert checked >= 2, (
        f"only {checked} link(s) checked in {_copy_path(campaign_id).name} — a "
        "copy file with no tagged link cannot be attributed at all"
    )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_every_number_in_the_post_text_appears_in_the_articles_own_text(campaign_id):
    """`strategy.md` states the no-invented-figures rule as covering the
    creative *and the post text*. Until this test the enforced half was the
    creative only — `test_every_number_a_reader_sees...` scans `campaign.json`
    — so the document claimed a guarantee the code did not make, and the post
    text was author-enforced with nothing to catch a typo in a figure that a
    reader will check against the article one click away.

    Scans the publishable prose only (`### PL` / `### EN`), with code spans,
    links and list markers stripped — see `_post_lines`. Measured against both
    campaigns as written: 23 numbers extracted, zero false positives.
    """
    campaign = _campaign(campaign_id)
    corpus = _corpus(campaign)  # raises if the campaign declared no source
    lines = _post_lines(campaign_id)
    # Anti-vacuity: the scan is driven by heading parsing, so a copy file that
    # renames or reflows its language headings would empty it out and leave
    # this test green while checking nothing at all.
    assert {lang for lang, _ in lines} == {"PL", "EN"}, (
        f"the post-text scan found prose under {sorted({l for l, _ in lines})} "
        f"in {_copy_path(campaign_id).name}, not both languages"
    )
    numbers = _numbers_in([line for _, line in lines])
    assert numbers, f"{campaign_id}'s post text states no numbers at all"
    for number in sorted(numbers):
        offending = next(line for _, line in lines if number in line)
        assert _quotes(number, corpus), (
            f"{_copy_path(campaign_id).name} states {number!r}, which does not "
            f"appear in {_source_name(campaign)}:\n  {offending.strip()}"
        )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_cta_blocks_carries_a_block_for_this_campaign(campaign_id):
    """`cta-blocks.md` is the single source of truth for post endings. Its
    first version was written for `cost-of-ai-agent` and said so in every
    line ("Wyceniasz agenta AI…", "z kalkulatorem"), so campaign two had
    nowhere to take an ending from and would have grown its own — which is
    exactly the divergence that file exists to prevent."""
    blocks = (MARKETING / "copy" / "cta-blocks.md").read_text(encoding="utf-8")
    assert f"### `{campaign_id}`" in blocks, (
        f"cta-blocks.md has no '### `{campaign_id}`' section"
    )
    assert brand.CONTACT in blocks and brand.SITE in blocks


# --- the rendered creatives ------------------------------------------------

@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_every_carousel_page_is_rendered_for_both_languages(campaign_id):
    """One page per slide, no more and no fewer. Checking only page 01 — the
    old shape — leaves a deck that lost pages 02..06 to a failed rerun, or
    that kept a stale page 07 from a slide since deleted, entirely green."""
    campaign = _campaign(campaign_id)
    expected = {f"carousel-{i:02d}.png" for i in range(1, len(campaign.slides) + 1)}
    for lang in spec.LANGS:
        out = MARKETING / "creatives" / campaign_id / "renders" / lang
        found = {path.name for path in out.glob("carousel-*.png")}
        assert found == expected, (
            f"{campaign_id}/{lang}: carousel pages {sorted(found)} do not "
            f"match the deck's {len(campaign.slides)} slides"
        )
        for name in sorted(expected):
            with Image.open(out / name) as img:
                assert img.size == CAROUSEL_SIZE, f"{lang}/{name} is {img.size}"


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_every_story_poster_is_rendered_for_both_languages(campaign_id):
    """`README.md` claims this is checked and it was not: the old test looked
    at `story-9x16-01.png` only, so `build_reel.py <id>` run without `pl en`
    left the English posters stale with the suite green — the very mistake
    the README's `pl en` warning exists for."""
    campaign = _campaign(campaign_id)
    expected = {f"story-9x16-{i:02d}.png" for i in range(1, len(campaign.slides) + 1)}
    for lang in spec.LANGS:
        out = MARKETING / "creatives" / campaign_id / "renders" / lang
        found = {path.name for path in out.glob("story-9x16-*.png")}
        assert found == expected, (
            f"{campaign_id}/{lang}: story posters {sorted(found)} do not "
            f"match the deck's {len(campaign.slides)} slides"
        )
        for name in sorted(expected):
            with Image.open(out / name) as img:
                assert img.size == STORY_SIZE, f"{lang}/{name} is {img.size}"


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_single_image_formats_are_rendered_at_their_declared_sizes(campaign_id):
    for lang in spec.LANGS:
        out = MARKETING / "creatives" / campaign_id / "renders" / lang
        for name, size in SINGLE_FORMATS.items():
            path = out / name
            assert path.is_file(), f"{campaign_id}/{lang}/{name} not rendered"
            with Image.open(path) as img:
                assert img.size == size, (
                    f"{campaign_id}/{lang}/{name} is {img.size}, expected {size}"
                )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_carousel_pdf_is_shipped_for_both_languages(campaign_id):
    """The PDF is the file that actually gets uploaded — LinkedIn takes
    carousels as document posts, not as a PNG series."""
    campaign = _campaign(campaign_id)
    for lang in spec.LANGS:
        pdf = MARKETING / "creatives" / campaign_id / "renders" / lang / "carousel.pdf"
        assert pdf.is_file(), f"{campaign_id}/{lang}/carousel.pdf missing"
        # A lone rasterised page is 24-47 KB, so a floor of 5 KB would pass on
        # a one-page PDF. Scale the floor with the deck.
        floor = 15000 * len(campaign.slides)
        assert pdf.stat().st_size > floor, (
            f"{campaign_id}/{lang}/carousel.pdf is {pdf.stat().st_size} bytes "
            f"for {len(campaign.slides)} slides — pages are missing"
        )


def _encoded_size(path: Path) -> tuple[int, int]:
    """(width, height) of a written video, read from the file itself.

    Deliberately not `Image.open`-style cheap metadata off a constant: the
    encoder, not the canvas, decides the final size (see
    `build_reel._macro_block_size`). Pulls only the header — `read_frames`
    yields its metadata dict before decoding any frame — so this stays cheap
    across every campaign and language instead of decoding ~360 frames a file.
    """
    reader = imageio_ffmpeg.read_frames(str(path))
    try:
        return tuple(reader.__next__()["size"])
    finally:
        reader.close()


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_reel_is_shipped_for_both_languages(campaign_id):
    """`README.md` claims the campaign tests cover `reel.mp4`; nothing
    referenced it. Committed renders exist so a clean clone can publish
    without a build, and that argument covers the video too."""
    for lang in spec.LANGS:
        out = MARKETING / "creatives" / campaign_id / "renders" / lang
        for name in ("reel.mp4", "reel.gif", "reel-4x5.mp4"):
            path = out / name
            assert path.is_file(), f"{campaign_id}/{lang}/{name} not rendered"
            assert path.stat().st_size > 50000, f"{path} is suspiciously small"


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_committed_feed_video_can_actually_be_posted_to_a_feed(campaign_id):
    """The entire reason `reel-4x5.mp4` exists, checked on the committed bytes.

    Instagram accepts a feed video only within `FEED_RATIO_RANGE`; the 9:16
    reel sitting beside this file is 0.5625 and is rejected by a feed or
    feed-placement ad composer with "the selected video does not fit the aspect
    ratio range accepted by Instagram". That rejection is what this format was
    added to answer, so it is worth proving per campaign rather than trusting
    the generator: the operator publishes these committed files from a clean
    clone without ever running the build.

    Asserted on the *encoded* size for a specific, measured reason — `imageio`
    rounds each dimension up to its macro block size, and 1350 is not divisible
    by the 8 the 9:16 reel uses, so the obvious implementation writes 1080x1352
    = 0.7988 and lands back outside the range while every canvas constant in
    the repo still reads 1080x1350."""
    for lang in spec.LANGS:
        mp4 = MARKETING / "creatives" / campaign_id / "renders" / lang / "reel-4x5.mp4"
        width, height = _encoded_size(mp4)
        assert (width, height) == FEED_VIDEO_SIZE, (
            f"{campaign_id}/{lang}/reel-4x5.mp4 is {width}x{height}, "
            f"expected {FEED_VIDEO_SIZE[0]}x{FEED_VIDEO_SIZE[1]}"
        )
        low, high = FEED_RATIO_RANGE
        assert low <= width / height <= high, (
            f"{campaign_id}/{lang}/reel-4x5.mp4 is {width/height:.4f}; "
            f"Instagram's feed accepts {low:.3f} (4:5) .. {high:.3f} (16:9)"
        )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_committed_reel_stays_vertical_for_reels_and_stories(campaign_id):
    """The counterpart guard: `reel-4x5.mp4` is an addition, not a migration.
    Reels and Stories are full-bleed 9:16, so a well-meaning "fix" that made
    every video feed-safe would letterbox the format the content plan actually
    schedules (rows 3 and 11, `Stories + Reels`)."""
    for lang in spec.LANGS:
        mp4 = MARKETING / "creatives" / campaign_id / "renders" / lang / "reel.mp4"
        assert _encoded_size(mp4) == STORY_SIZE, (
            f"{campaign_id}/{lang}/reel.mp4 is no longer {STORY_SIZE[0]}x{STORY_SIZE[1]}"
        )
