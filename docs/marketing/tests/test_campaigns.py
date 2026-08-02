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
it needs — which article the deck summarises, and which figures it is built
on — live in that campaign.json under `source` (see `spec._source`). A new
campaign is therefore covered the moment its spec exists, and a campaign that
forgets to declare its article fails `test_a_top_of_funnel_campaign_declares_
the_article_it_summarises` rather than silently opting out of the figure
guard.

What stays campaign-specific lives in `test_campaign_<id>.py` next to this
file: rulings that are about one deck, not about decks in general.

`conftest.py` already puts `docs/marketing/scripts` on `sys.path`, so
`import spec` below needs no path juggling of its own.
"""
import datetime
import json
import re
from pathlib import Path

import pytest
from fontTools.ttLib import TTFont
from PIL import Image

import brand
import slides
import spec

MARKETING = Path(__file__).resolve().parents[1]
CAMPAIGNS = MARKETING / "campaigns"
POSTS = MARKETING.parents[1] / "src" / "data" / "blog-posts.json"

CAMPAIGN_IDS = sorted(path.parent.name for path in CAMPAIGNS.glob("*/campaign.json"))

# Campaign ids that have shipped a spec so far. `CAMPAIGN_IDS` is a glob, and
# a glob that stops matching turns every parametrised test in this file into a
# vacuous pass. Pinned so the sweep cannot quietly shrink; extend it when a
# campaign lands, which is the one moment a human is looking at this file.
KNOWN_CAMPAIGNS = {"cost-of-ai-agent", "rag-without-hallucinations",
                   "accounting-ai"}

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
def test_a_top_of_funnel_campaign_declares_the_article_it_summarises(campaign_id):
    """Without `source.slug` there is no article to check figures against, and
    the whole "no invented numbers" guarantee degrades to a vacuous pass for
    that campaign. Top of funnel is by definition a distilled article, so the
    declaration is mandatory there and the slug must resolve to a real post."""
    campaign = _campaign(campaign_id)
    if campaign.track != "funnel-top":
        pytest.skip(f"{campaign_id} is {campaign.track}, not an article summary")
    assert campaign.source_slug, (
        f"{campaign_id} is top-of-funnel but declares no source.slug, so no "
        "figure in its deck is checked against any article"
    )
    _article(campaign.source_slug)  # raises StopIteration if the slug is wrong
    assert campaign.source_figures, (
        f"{campaign_id} declares no source.figures, so nothing pins the deck "
        "to the article's own numbers"
    )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_target_link_points_at_the_declared_source(campaign_id):
    """The deck quotes article A while the CTA sends the reader to article B
    is the one failure mode nobody would spot in review — both halves look
    right on their own."""
    campaign = _campaign(campaign_id)
    if not campaign.source_slug:
        pytest.skip(f"{campaign_id} declares no source article")
    assert campaign.source_slug in campaign.target, (
        f"{campaign_id} summarises {campaign.source_slug!r} but links to "
        f"{campaign.target}"
    )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_hook_number_comes_from_the_article(campaign_id):
    """The cover figure is the one number every reader takes away, so it is
    the one that must not be a rounding of something the article never said."""
    campaign = _campaign(campaign_id)
    if not campaign.source_slug:
        pytest.skip(f"{campaign_id} declares no source article")
    hook = campaign.slides[0]
    big = hook.get("bigNumber")
    assert big, f"{campaign_id}'s hook slide carries no bigNumber"
    corpus = _article_corpus(campaign.source_slug)
    for number in _numbers_in([str(big)]):
        assert _quotes(number, corpus), (
            f"{campaign_id}'s cover says {big!r}, but {number!r} does not "
            f"appear in {campaign.source_slug}"
        )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_every_number_a_reader_sees_appears_in_the_articles_own_text(campaign_id):
    """`strategy.md`: every number in a creative must stand verbatim in the
    article it links to. The old test only scanned `$`-amounts, so a token
    count, a percentage or a headcount was unguarded — `109` could become
    `190` and nothing would notice. Scans every rendered string instead, in
    both languages, against *this* campaign's own article.
    """
    campaign = _campaign(campaign_id)
    if not campaign.source_slug:
        pytest.skip(f"{campaign_id} declares no source article")
    corpus = _article_corpus(campaign.source_slug)
    numbers = _numbers_in(_deck_strings(campaign))
    assert numbers, f"{campaign_id}'s deck states no numbers at all"
    for number in sorted(numbers):
        assert _quotes(number, corpus), (
            f"{campaign_id}'s deck states {number!r}, which does not appear "
            f"in the article it links to ({campaign.source_slug})"
        )


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_every_declared_figure_still_stands_in_both_the_article_and_the_deck(
        campaign_id):
    """The other direction. The scan above catches a deck that invents a
    number; it cannot catch a deck that quietly drops the figure it was built
    on, nor an article edited out from under a deck that no longer quotes it.
    `source.figures` names those load-bearing figures and asserts both ends.
    """
    campaign = _campaign(campaign_id)
    if not campaign.source_figures:
        pytest.skip(f"{campaign_id} declares no source figures")
    corpus = _article_corpus(campaign.source_slug)
    deck = " \n".join(_deck_strings(campaign))
    for figure in campaign.source_figures:
        assert _quotes(figure, corpus), (
            f"{figure!r} is declared a {campaign_id} source figure but no "
            f"longer appears in {campaign.source_slug} — the deck is quoting "
            "something the article dropped"
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

    Missing is caught by every scan below anyway (they all read the file).
    *Two* is the case worth its own assertion, because it is the quiet one:
    with both `funnel-<id>.md` and `product-<id>.md` on disk — say a campaign
    renamed from one convention to the other with the old file left behind —
    every scan here would happily check whichever the resolver picked first
    while `content-plan.md` sends the operator to the other, so a stale post
    text with a stale link ships past a green suite. Naming both here is also
    the only place a reader learns that the two conventions exist at all.
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
    if not campaign.source_slug:
        pytest.skip(f"{campaign_id} declares no source article")
    corpus = _article_corpus(campaign.source_slug)
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
            f"appear in {campaign.source_slug}:\n  {offending.strip()}"
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


@pytest.mark.parametrize("campaign_id", CAMPAIGN_IDS)
def test_the_reel_is_shipped_for_both_languages(campaign_id):
    """`README.md` claims the campaign tests cover `reel.mp4`; nothing
    referenced it. Committed renders exist so a clean clone can publish
    without a build, and that argument covers the video too."""
    for lang in spec.LANGS:
        out = MARKETING / "creatives" / campaign_id / "renders" / lang
        for name in ("reel.mp4", "reel.gif"):
            path = out / name
            assert path.is_file(), f"{campaign_id}/{lang}/{name} not rendered"
            assert path.stat().st_size > 50000, f"{path} is suspiciously small"
