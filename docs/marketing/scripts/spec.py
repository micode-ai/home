# -*- coding: utf-8 -*-
"""Campaign specs: load, validate, and turn into tagged links.

A campaign is one campaign.json. Generators read it and hardcode nothing,
so adding the twelfth campaign never means writing a twelfth script.
"""
import json
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

MARKETING = Path(__file__).resolve().parents[1]

# `diagram` and `tall-diagram` differ only in the shape of the picture they
# carry, and that difference is the whole point: `diagram` spends its height
# on a headline and a full sub and gives the leftovers to a wide, low visual
# (campaign one's 2.83:1 calculator table); `tall-diagram` keeps the header to
# a label so a tall, narrow visual (the product pages' `flowchart TD` graphs,
# ~0.62:1) gets every pixel of height the canvas can spare. See
# `slides._plan_tall_diagram` for the measurements.
SLIDE_TYPES = ("hook", "problem", "diagram", "tall-diagram", "numbers", "cta")
LANGS = ("pl", "en")


class SpecError(Exception):
    """A render request that would produce a broken or misleading creative —
    a campaign.json this module refuses to load, or a language this factory
    does not carry."""


def check_langs(langs) -> list[str]:
    """Validate the languages a generator was asked to render.

    All three generators take languages straight off the command line and
    hand them to `slide[lang]`, so `build_carousel.py <id> ru` used to die
    with a bare `KeyError: 'ru'` raised from inside this module — a traceback
    that names neither the offending argument as an *argument* nor the two
    languages that would have worked. Raised as a `SpecError` so each
    generator's existing `except SpecError` prints one actionable line.
    """
    unknown = [lang for lang in langs if lang not in LANGS]
    if unknown:
        raise SpecError(
            f"unsupported language{'s' if len(unknown) > 1 else ''} "
            f"{', '.join(repr(lang) for lang in unknown)}; this factory "
            f"renders {', '.join(repr(lang) for lang in LANGS)}"
        )
    return list(langs)


def _source(campaign_id: str, data: dict) -> tuple[str | None, list[str]]:
    """The article a campaign summarises, and the figures it is built on.

    Top-of-funnel campaigns are a distilled blog article, and `strategy.md`
    promises that every number in a creative stands verbatim in that article.
    That promise is only enforceable if the spec says *which* article — which
    is what `source.slug` is for — and `source.figures` names the figures
    whose disappearance from either side should break the build.

    Declared here rather than in a table inside the test suite so that adding
    the twelfth campaign stays what the spec says it is: a `campaign.json`
    and a file in `copy/`, with no test module to edit. Optional, because a
    mid-funnel product campaign points at a product page, not an article.
    """
    source = data.get("source", {})
    if not isinstance(source, dict):
        raise SpecError(
            f"{campaign_id}: 'source' must be an object, "
            f"got {type(source).__name__}"
        )
    slug = source.get("slug")
    if slug is not None and not (isinstance(slug, str) and slug.strip()):
        raise SpecError(
            f"{campaign_id}: source.slug must be a non-empty string, got {slug!r}"
        )
    figures = source.get("figures", [])
    if not isinstance(figures, list):
        raise SpecError(
            f"{campaign_id}: source.figures must be a list, "
            f"got {type(figures).__name__}"
        )
    for figure in figures:
        if not (isinstance(figure, str) and figure.strip()):
            raise SpecError(
                f"{campaign_id}: source.figures entries must be non-empty "
                f"strings, got {figure!r}"
            )
    return slug, list(figures)


@dataclass
class Campaign:
    id: str
    track: str
    target: str
    utm_campaign: str
    slides: list[dict]
    root: Path
    source_slug: str | None = None
    source_figures: list[str] = field(default_factory=list)

    @classmethod
    def load(cls, campaign_id: str) -> "Campaign":
        path = MARKETING / "campaigns" / campaign_id / "campaign.json"
        if not path.is_file():
            raise SpecError(f"no campaign spec for {campaign_id!r} at {path}")
        raw = path.read_text(encoding="utf-8")
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise SpecError(
                f"{campaign_id}: {path} is not valid JSON: {exc}"
            ) from exc
        if not isinstance(data, dict):
            raise SpecError(
                f"{campaign_id}: {path} must contain a JSON object, "
                f"got {type(data).__name__}"
            )

        # Not `field`: that name is the `dataclasses.field` imported above, and
        # a loop variable shadowing it inside the class body is one refactor
        # away from a confusing NameError.
        for required in ("id", "track", "target", "slides"):
            if not data.get(required):
                raise SpecError(f"{campaign_id}: missing required field {required!r}")

        slides = data["slides"]
        for index, slide in enumerate(slides):
            if not isinstance(slide, dict):
                raise SpecError(
                    f"{campaign_id}: slide {index} must be an object, "
                    f"got {type(slide).__name__}"
                )
            kind = slide.get("type")
            if kind not in SLIDE_TYPES:
                raise SpecError(
                    f"{campaign_id}: slide {index} has unknown type {kind!r}; "
                    f"expected one of {', '.join(SLIDE_TYPES)}"
                )
            for lang in LANGS:
                if lang not in slide:
                    raise SpecError(
                        f"{campaign_id}: slide {index} ({kind}) has no {lang!r} copy"
                    )
                if not isinstance(slide[lang], dict):
                    raise SpecError(
                        f"{campaign_id}: slide {index} ({kind}) {lang!r} copy must be "
                        f"an object, got {type(slide[lang]).__name__}"
                    )
        if not any(slide["type"] == "cta" for slide in slides):
            raise SpecError(f"{campaign_id}: no 'cta' slide — the deck cannot convert")

        source_slug, source_figures = _source(campaign_id, data)

        return cls(
            id=data["id"],
            track=data["track"],
            target=data["target"],
            utm_campaign=data.get("utm", {}).get("campaign", data["id"]),
            slides=slides,
            root=path.parent,
            source_slug=source_slug,
            source_figures=source_figures,
        )

    def text(self, slide: dict, lang: str) -> dict:
        return slide[lang]

    def link(self, lang: str, source: str) -> str:
        parts = urlsplit(self.target)
        path = parts.path
        if lang == "en" and path != "/en" and not path.startswith("/en/"):
            if path == "":
                path = "/en"
            elif path.startswith("/"):
                path = "/en" + path
            else:
                path = "/en/" + path

        utm_keys = {"utm_source", "utm_medium", "utm_campaign"}
        query = [
            (key, value)
            for key, value in parse_qsl(parts.query, keep_blank_values=True)
            if key not in utm_keys
        ]
        query.extend([
            ("utm_source", source),
            ("utm_medium", "social"),
            ("utm_campaign", self.utm_campaign),
        ])
        return urlunsplit((parts.scheme, parts.netloc, path, urlencode(query), parts.fragment))

    def asset(self, block: dict) -> Path | None:
        """Absolute path to the screenshot a block declares. The file may not
        exist yet — callers check, so a missing capture degrades instead of
        crashing.

        `block` is any mapping that may carry an `"asset"` key: a slide, or one
        of its `pl`/`en` language blocks. Keeping it duck-typed is what lets a
        caller write `asset(text) or asset(slide)` and get per-language
        screenshots with a slide-level fallback, exactly as `rows` already
        works — see `slides._place_diagram_frame`."""
        rel = block.get("asset")
        if not rel:
            return None
        return MARKETING / "creatives" / self.id / rel

    def render_dir(self, lang: str) -> Path:
        path = MARKETING / "creatives" / self.id / "renders" / lang
        path.mkdir(parents=True, exist_ok=True)
        return path
