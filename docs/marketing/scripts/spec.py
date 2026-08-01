# -*- coding: utf-8 -*-
"""Campaign specs: load, validate, and turn into tagged links.

A campaign is one campaign.json. Generators read it and hardcode nothing,
so adding the twelfth campaign never means writing a twelfth script.
"""
import json
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlencode

MARKETING = Path(__file__).resolve().parents[1]

SLIDE_TYPES = ("hook", "problem", "diagram", "numbers", "cta")
LANGS = ("pl", "en")
BASE = "https://mi-code.pl"


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
        data = json.loads(path.read_text(encoding="utf-8"))

        for field in ("id", "track", "target", "slides"):
            if not data.get(field):
                raise SpecError(f"{campaign_id}: missing required field {field!r}")

        slides = data["slides"]
        for index, slide in enumerate(slides):
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
        target = self.target
        if lang == "en" and "/en/" not in target:
            target = target.replace(f"{BASE}/", f"{BASE}/en/", 1)
        query = urlencode({
            "utm_source": source,
            "utm_medium": "social",
            "utm_campaign": self.utm_campaign,
        })
        return f"{target}{'&' if '?' in target else '?'}{query}"

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
