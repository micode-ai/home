# -*- coding: utf-8 -*-
"""Campaign specs: load, validate, and turn into tagged links.

A campaign is one campaign.json. Generators read it and hardcode nothing,
so adding the twelfth campaign never means writing a twelfth script.
"""
import json
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

MARKETING = Path(__file__).resolve().parents[1]

SLIDE_TYPES = ("hook", "problem", "diagram", "numbers", "cta")
LANGS = ("pl", "en")


class SpecError(Exception):
    """A campaign.json that would render a broken or misleading creative."""


@dataclass
class Campaign:
    id: str
    track: str
    target: str
    utm_campaign: str
    slides: list[dict]
    root: Path

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

        for field in ("id", "track", "target", "slides"):
            if not data.get(field):
                raise SpecError(f"{campaign_id}: missing required field {field!r}")

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

        return cls(
            id=data["id"],
            track=data["track"],
            target=data["target"],
            utm_campaign=data.get("utm", {}).get("campaign", data["id"]),
            slides=slides,
            root=path.parent,
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

    def asset(self, slide: dict) -> Path | None:
        """Absolute path to a slide's screenshot. The file may not exist yet —
        callers check, so a missing capture degrades instead of crashing."""
        rel = slide.get("asset")
        if not rel:
            return None
        return MARKETING / "creatives" / self.id / rel

    def render_dir(self, lang: str) -> Path:
        path = MARKETING / "creatives" / self.id / "renders" / lang
        path.mkdir(parents=True, exist_ok=True)
        return path
