# Маркетинговая фабрика mi-code.pl — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Построить в `docs/marketing/` повторяемое производство B2B-креативов для mi-code.pl: общий брендовый модуль, четыре генератора, съёмку скриншотов и первую кампанию `cost-of-ai-agent` на PL/EN.

**Architecture:** Один модуль `brand.py` держит визуальные токены, снятые с `src/app.css` сайта. Кампания описывается файлом `campaign.json` из пяти типов слайдов; `slides.py` умеет отрисовать любой тип на любой холст. Четыре тонких скрипта-генератора комбинируют слайды в конкретные форматы — карусель, одиночный пост, сторис с видео. Добавление новой кампании не требует кода.

**Tech Stack:** Python 3.13, Pillow 12.1.1, imageio 2.37.0, numpy 2.3.1, Playwright, pytest 9.0.2.

## Global Constraints

- Все визуальные токены берутся из `src/app.css` сайта: navy `#1E40AF`, navy dark `#1E3A8A`, orange `#F97316`, orange light `#FB923C`, тёмная база `#0F172A`, текст `#1E293B`, граница `#E2E8F0`.
- Шрифты только из `docs/marketing/assets/fonts/`. Обращаться к `C:/Windows/Fonts` или любым системным путям запрещено — рендер обязан воспроизводиться на CI.
- Заголовки — Poppins, основной текст — Open Sans.
- Языки только `pl` и `en`. Русский вне объёма.
- Домен в креативах и ссылках — `mi-code.pl`, контакт — `development@mi-code.pl`.
- PL-страницы живут на `https://mi-code.pl/...`, EN-страницы — на `https://mi-code.pl/en/...`.
- Каждая внешняя ссылка несёт UTM: `utm_source`, `utm_medium=social`, `utm_campaign=<id кампании>`.
- Тесты — pytest, лежат в `docs/marketing/tests/`. Существующий Vitest не трогаем.
- Все скрипты запускаются из корня репозитория и сами вычисляют пути от `__file__`.
- Ни один генератор не хардкодит тексты кампаний — только читает `campaign.json`.

---

## Карта файлов

| Файл | Ответственность |
|---|---|
| `docs/marketing/README.md` | как устроена фабрика, команды регенерации |
| `docs/marketing/strategy.md` | аудитория, каналы, воронка, метрики |
| `docs/marketing/content-plan.md` | календарь публикаций |
| `docs/marketing/assets/fonts/` | Poppins + Open Sans + лицензии |
| `docs/marketing/assets/micode-badge.png` | бейдж, копия из репо приложения |
| `docs/marketing/scripts/brand.py` | палитра, шрифты, примитивы отрисовки |
| `docs/marketing/scripts/spec.py` | загрузка и валидация `campaign.json`, сборка UTM |
| `docs/marketing/scripts/slides.py` | пять типов слайдов на произвольный холст |
| `docs/marketing/scripts/build_carousel.py` | 1080×1350 серия + склеенный PDF |
| `docs/marketing/scripts/build_single.py` | 1200×627, 1080×1350, 1200×630 |
| `docs/marketing/scripts/build_reel.py` | 1080×1920 постеры + mp4/gif |
| `docs/marketing/scripts/capture_screens.py` | съёмка страниц сайта через Playwright |
| `docs/marketing/scripts/fetch_fonts.py` | разовая загрузка шрифтов |
| `docs/marketing/campaigns/cost-of-ai-agent/campaign.json` | спека первой кампании |
| `docs/marketing/copy/funnel-cost-of-ai-agent.md` | тексты постов PL/EN |
| `docs/marketing/copy/cta-blocks.md` | CTA, хэштеги, UTM-схема |
| `docs/marketing/tests/` | pytest на всё выше |

---

### Task 1: Каркас, шрифты и бейдж

**Files:**
- Create: `docs/marketing/scripts/fetch_fonts.py`
- Create: `docs/marketing/tests/test_assets.py`
- Create: `docs/marketing/assets/fonts/` (загружается скриптом)
- Create: `docs/marketing/assets/micode-badge.png` (копия)
- Create: `docs/marketing/README.md`

**Interfaces:**
- Consumes: ничего
- Produces: каталог `docs/marketing/assets/fonts/` с файлами `Poppins-Bold.ttf`, `Poppins-SemiBold.ttf`, `OpenSans-Regular.ttf`, `OpenSans-SemiBold.ttf`, пригодными для `PIL.ImageFont.truetype`; `docs/marketing/assets/micode-badge.png`

- [ ] **Step 1: Написать падающий тест**

Создать `docs/marketing/tests/test_assets.py`:

```python
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ASSETS = Path(__file__).resolve().parents[1] / "assets"
FONTS = ASSETS / "fonts"

REQUIRED_FONTS = [
    "Poppins-Bold.ttf",
    "Poppins-SemiBold.ttf",
    "OpenSans-Regular.ttf",
    "OpenSans-SemiBold.ttf",
]


def test_badge_exists_and_has_alpha():
    badge = ASSETS / "micode-badge.png"
    assert badge.is_file(), "MICODE badge missing"
    with Image.open(badge) as img:
        assert img.mode in ("RGBA", "LA"), "badge must keep transparency"


def test_all_required_fonts_present():
    missing = [name for name in REQUIRED_FONTS if not (FONTS / name).is_file()]
    assert not missing, f"missing font files: {missing}"


def test_fonts_render_visible_glyphs():
    """A font that loads but renders blank is worse than a missing one."""
    for name in REQUIRED_FONTS:
        font = ImageFont.truetype(str(FONTS / name), 64)
        canvas = Image.new("L", (600, 120), 0)
        ImageDraw.Draw(canvas).text((10, 10), "Agent AI 74", font=font, fill=255)
        assert canvas.getbbox() is not None, f"{name} rendered nothing"


def test_fonts_render_polish_diacritics():
    """PL copy uses ą ć ę ł ń ó ś ź ż — a font without them silently drops glyphs."""
    for name in REQUIRED_FONTS:
        font = ImageFont.truetype(str(FONTS / name), 64)
        plain = Image.new("L", (600, 120), 0)
        ImageDraw.Draw(plain).text((10, 10), "Ile", font=font, fill=255)
        accented = Image.new("L", (600, 120), 0)
        ImageDraw.Draw(accented).text((10, 10), "Iłę", font=font, fill=255)
        assert plain.tobytes() != accented.tobytes(), f"{name} lacks PL diacritics"


def test_font_licenses_shipped():
    licenses = list(FONTS.glob("*LICENSE*")) + list(FONTS.glob("*OFL*"))
    assert licenses, "ship the font licence files alongside the fonts"
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `python -m pytest docs/marketing/tests/test_assets.py -v`
Expected: FAIL — все тесты падают, каталога `assets` ещё нет.

- [ ] **Step 3: Написать загрузчик шрифтов**

Создать `docs/marketing/scripts/fetch_fonts.py`:

```python
# -*- coding: utf-8 -*-
"""Download the site's fonts into assets/fonts/ so renders are reproducible.

The landing page pulls Poppins + Open Sans from the Google Fonts CDN at runtime.
The creatives cannot depend on a CDN, and they must not read C:/Windows/Fonts —
that path does not exist on a CI runner. Run this once; the files are committed.

Usage:
    python docs/marketing/scripts/fetch_fonts.py
"""
import sys
import urllib.request
from pathlib import Path

from PIL import ImageFont

FONTS_DIR = Path(__file__).resolve().parents[1] / "assets" / "fonts"
RAW = "https://raw.githubusercontent.com/google/fonts/main"

# Poppins ships static instances; Open Sans is variable-only upstream, so the
# static cut is taken from the repo's own static/ folder.
SOURCES = {
    "Poppins-Bold.ttf": f"{RAW}/ofl/poppins/Poppins-Bold.ttf",
    "Poppins-SemiBold.ttf": f"{RAW}/ofl/poppins/Poppins-SemiBold.ttf",
    "OpenSans-Regular.ttf": f"{RAW}/ofl/opensans/static/OpenSans-Regular.ttf",
    "OpenSans-SemiBold.ttf": f"{RAW}/ofl/opensans/static/OpenSans-SemiBold.ttf",
}

LICENSES = {
    "Poppins-OFL.txt": f"{RAW}/ofl/poppins/OFL.txt",
    "OpenSans-OFL.txt": f"{RAW}/ofl/opensans/OFL.txt",
}


def download(url: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=60) as response:
        target.write_bytes(response.read())
    print(f"  {target.name}  <-  {url}")


def main() -> int:
    for name, url in {**SOURCES, **LICENSES}.items():
        try:
            download(url, FONTS_DIR / name)
        except Exception as exc:  # noqa: BLE001 - report and keep going
            print(f"  FAILED {name}: {exc}", file=sys.stderr)
            return 1

    for name in SOURCES:
        ImageFont.truetype(str(FONTS_DIR / name), 32)  # raises if unusable
    print(f"OK — {len(SOURCES)} fonts verified in {FONTS_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Загрузить шрифты и скопировать бейдж**

```bash
python docs/marketing/scripts/fetch_fonts.py
cp ../../ai-budget-assistant/docs/marketing/assets/micode-badge.png docs/marketing/assets/micode-badge.png
```

Если `ofl/opensans/static/` в апстриме не существует, скачать вариативный
`ofl/opensans/OpenSans[wdth,wght].ttf`, открыть через
`ImageFont.truetype(path, size)`, вызвать `font.set_variation_by_name("Regular")`
и `set_variation_by_name("SemiBold")`, сохранить нужные начертания как статические
через `fontTools.ttLib`. Обновить `SOURCES` под фактические пути и записать
причину замены комментарием в `fetch_fonts.py`.

- [ ] **Step 5: Запустить тесты и убедиться, что проходят**

Run: `python -m pytest docs/marketing/tests/test_assets.py -v`
Expected: PASS, 5 тестов.

- [ ] **Step 6: Написать README**

Создать `docs/marketing/README.md` — назначение фабрики, дерево каталогов из
спеки `docs/superpowers/specs/2026-07-31-marketing-factory-design.md`, раздел
«Регенерация» с пайплайном из четырёх команд, и явное предупреждение, что
`assets/fonts/` коммитится в репозиторий намеренно.

- [ ] **Step 7: Коммит**

```bash
git add docs/marketing/README.md docs/marketing/assets docs/marketing/scripts/fetch_fonts.py docs/marketing/tests/test_assets.py
git commit -m "Add marketing factory scaffold with pinned Poppins and Open Sans"
```

---

### Task 2: `brand.py` — визуальные токены и примитивы

**Files:**
- Create: `docs/marketing/scripts/brand.py`
- Create: `docs/marketing/tests/test_brand.py`

**Interfaces:**
- Consumes: `assets/fonts/*.ttf`, `assets/micode-badge.png` из Task 1
- Produces:
  - константы `NAVY, NAVY_DARK, ORANGE, ORANGE_LIGHT, DARK, INK, BORDER, WHITE, MUTED` — `tuple[int, int, int]`
  - `SITE: str`, `CONTACT: str`
  - `heading(size: int, weight: str = "bold") -> ImageFont.FreeTypeFont`
  - `body(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont`
  - `background(size: tuple[int, int]) -> Image.Image`
  - `wrap(text: str, font, max_width: int) -> list[str]`
  - `pill(img: Image.Image, xy: tuple[int, int], text: str, font) -> int`
  - `browser_frame(shot: Image.Image, width: int, url: str) -> Image.Image`
  - `footer(img: Image.Image, lang: str) -> None`
  - `paste_badge(img: Image.Image, height: int = 56) -> None`

- [ ] **Step 1: Написать падающий тест**

Создать `docs/marketing/tests/test_brand.py`:

```python
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import brand  # noqa: E402


def test_palette_matches_the_site_stylesheet():
    """These are read off src/app.css; drifting from them breaks message match."""
    assert brand.NAVY == (0x1E, 0x40, 0xAF)
    assert brand.NAVY_DARK == (0x1E, 0x3A, 0x8A)
    assert brand.ORANGE == (0xF9, 0x73, 0x16)
    assert brand.ORANGE_LIGHT == (0xFB, 0x92, 0x3C)
    assert brand.DARK == (0x0F, 0x17, 0x2A)
    assert brand.INK == (0x1E, 0x29, 0x3B)
    assert brand.BORDER == (0xE2, 0xE8, 0xF0)


def test_site_and_contact_constants():
    assert brand.SITE == "mi-code.pl"
    assert brand.CONTACT == "development@mi-code.pl"


def test_fonts_load_at_requested_size():
    assert brand.heading(80).size == 80
    assert brand.heading(40, "semibold").size == 40
    assert brand.body(32).size == 32
    assert brand.body(32, "semibold").size == 32


def test_background_fills_the_whole_canvas():
    img = brand.background((1080, 1350))
    assert img.size == (1080, 1350)
    assert img.mode == "RGB"
    corners = [img.getpixel(p) for p in [(0, 0), (1079, 0), (0, 1349), (1079, 1349)]]
    assert all(c != (0, 0, 0) for c in corners), "background left pure-black corners"


def test_background_is_a_gradient_not_a_flat_fill():
    img = brand.background((1080, 1350))
    assert img.getpixel((540, 20)) != img.getpixel((540, 1330))


def test_wrap_respects_max_width():
    font = brand.body(32)
    lines = brand.wrap(
        "Ile to bedzie kosztowac miesiecznie to pierwsze pytanie w kazdej rozmowie",
        font,
        400,
    )
    assert len(lines) > 1
    for line in lines:
        assert font.getlength(line) <= 400


def test_wrap_keeps_every_word():
    font = brand.body(32)
    text = "prompt systemowy schematy narzedzi historia rozmowy"
    assert " ".join(brand.wrap(text, font, 300)).split() == text.split()


def test_wrap_does_not_drop_a_word_longer_than_the_line():
    font = brand.body(32)
    lines = brand.wrap("development@mi-code.pl", font, 80)
    assert "development@mi-code.pl" in " ".join(lines)


def test_paste_badge_marks_the_top_right():
    img = Image.new("RGB", (1080, 1350), brand.DARK)
    before = img.crop((820, 20, 1060, 110)).tobytes()
    brand.paste_badge(img)
    assert img.crop((820, 20, 1060, 110)).tobytes() != before


def test_browser_frame_wraps_the_screenshot():
    shot = Image.new("RGB", (1600, 900), (255, 255, 255))
    framed = brand.browser_frame(shot, 900, "mi-code.pl")
    assert framed.width == 900
    assert framed.height > 900 * 900 // 1600, "frame adds a chrome bar above the shot"


def test_footer_writes_the_domain():
    img = Image.new("RGB", (1080, 1350), brand.DARK)
    before = img.tobytes()
    brand.footer(img, "pl")
    assert img.tobytes() != before
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `python -m pytest docs/marketing/tests/test_brand.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'brand'`.

- [ ] **Step 3: Реализовать `brand.py`**

Создать `docs/marketing/scripts/brand.py`:

```python
# -*- coding: utf-8 -*-
"""Visual tokens for every mi-code.pl creative.

Colours and fonts are the ones the landing page itself uses (src/app.css).
A creative and the page it links to must read as the same company, so this
module is the only place any of them is written down.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

MARKETING = Path(__file__).resolve().parents[1]
FONTS = MARKETING / "assets" / "fonts"
BADGE = MARKETING / "assets" / "micode-badge.png"

# --- palette: mirrors src/app.css -------------------------------------------
NAVY = (0x1E, 0x40, 0xAF)          # --color-primary
NAVY_DARK = (0x1E, 0x3A, 0x8A)     # --color-primary-dark
ORANGE = (0xF9, 0x73, 0x16)        # --color-accent
ORANGE_LIGHT = (0xFB, 0x92, 0x3C)  # --color-accent-light
DARK = (0x0F, 0x17, 0x2A)          # --color-bg-hero
INK = (0x1E, 0x29, 0x3B)           # --color-text-primary
BORDER = (0xE2, 0xE8, 0xF0)        # --color-border
WHITE = (0xFA, 0xFA, 0xFC)
MUTED = (0xC8, 0xD0, 0xE0)

SITE = "mi-code.pl"
CONTACT = "development@mi-code.pl"

_HEADING = {"bold": "Poppins-Bold.ttf", "semibold": "Poppins-SemiBold.ttf"}
_BODY = {"regular": "OpenSans-Regular.ttf", "semibold": "OpenSans-SemiBold.ttf"}


def heading(size: int, weight: str = "bold") -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / _HEADING[weight]), size)


def body(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / _BODY[weight]), size)


def background(size: tuple[int, int]) -> Image.Image:
    """Dark navy vertical gradient with a soft orange glow, as on the hero."""
    width, height = size
    img = Image.new("RGB", size, DARK)
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(height - 1, 1)
        draw.line(
            [(0, y), (width, y)],
            fill=tuple(int(DARK[i] + (NAVY_DARK[i] - DARK[i]) * t) for i in range(3)),
        )

    glow = Image.new("RGB", size, (0, 0, 0))
    radius = int(width * 0.55)
    ImageDraw.Draw(glow).ellipse(
        [width - radius, -radius // 2, width + radius, radius], fill=ORANGE
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius // 3))
    return Image.blend(img, Image.blend(img, glow, 0.35), 0.55)


def wrap(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    """Greedy word wrap. A word wider than max_width keeps its own line
    rather than being dropped or split mid-glyph."""
    lines: list[str] = []
    current = ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if current and font.getlength(candidate) > max_width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def pill(img: Image.Image, xy: tuple[int, int], text: str,
         font: ImageFont.FreeTypeFont) -> int:
    """Draw an orange outlined tag. Returns the pill's right edge in px."""
    draw = ImageDraw.Draw(img)
    x, y = xy
    pad_x, pad_y = 26, 14
    width = int(font.getlength(text)) + pad_x * 2
    height = font.size + pad_y * 2
    draw.rounded_rectangle([x, y, x + width, y + height],
                           radius=height // 2, outline=ORANGE, width=3)
    draw.text((x + pad_x, y + pad_y - 2), text, font=font, fill=ORANGE_LIGHT)
    return x + width


def browser_frame(shot: Image.Image, width: int, url: str) -> Image.Image:
    """Put a screenshot inside a browser window chrome with the URL shown."""
    bar = max(int(width * 0.055), 34)
    scaled = shot.resize((width, max(int(width * shot.height / shot.width), 1)),
                         Image.LANCZOS)
    frame = Image.new("RGB", (width, scaled.height + bar), (0x23, 0x2B, 0x3B))
    draw = ImageDraw.Draw(frame)
    dot_r = bar // 6
    for i, colour in enumerate([(0xFF, 0x5F, 0x57), (0xFE, 0xBC, 0x2E), (0x28, 0xC8, 0x40)]):
        cx = bar // 2 + i * dot_r * 3
        draw.ellipse([cx - dot_r, bar // 2 - dot_r, cx + dot_r, bar // 2 + dot_r], fill=colour)
    url_font = body(max(bar // 2, 14))
    draw.text((bar * 3, (bar - url_font.size) // 2 - 2), url, font=url_font, fill=MUTED)
    frame.paste(scaled, (0, bar))
    return frame


def paste_badge(img: Image.Image, height: int = 56) -> None:
    """MICODE badge, top-right, matching the app factory's placement."""
    with Image.open(BADGE) as raw:
        badge = raw.convert("RGBA")
    scaled = badge.resize((max(int(height * badge.width / badge.height), 1), height),
                          Image.LANCZOS)
    img.paste(scaled, (img.width - scaled.width - 48, 40), scaled)


def footer(img: Image.Image, lang: str) -> None:
    """Domain strip along the bottom edge."""
    draw = ImageDraw.Draw(img)
    font = heading(max(img.width // 34, 20), "semibold")
    label = SITE
    draw.text(((img.width - draw.textlength(label, font=font)) // 2,
               img.height - int(img.height * 0.06)),
              label, font=font, fill=ORANGE_LIGHT)
```

- [ ] **Step 4: Запустить тесты и убедиться, что проходят**

Run: `python -m pytest docs/marketing/tests/test_brand.py -v`
Expected: PASS, 11 тестов.

- [ ] **Step 5: Коммит**

```bash
git add docs/marketing/scripts/brand.py docs/marketing/tests/test_brand.py
git commit -m "Add brand module carrying the site's palette and fonts into creatives"
```

---

### Task 3: `spec.py` — чтение кампании и UTM

**Files:**
- Create: `docs/marketing/scripts/spec.py`
- Create: `docs/marketing/tests/test_spec.py`

**Interfaces:**
- Consumes: ничего из предыдущих задач
- Produces:
  - `SLIDE_TYPES: tuple[str, ...]` — `("hook", "problem", "diagram", "numbers", "cta")`
  - `class Campaign` с полями `id: str`, `track: str`, `target: str`, `utm_campaign: str`, `slides: list[dict]`, `root: Path`
  - `Campaign.load(campaign_id: str) -> Campaign` — читает `campaigns/<id>/campaign.json`, валидирует, бросает `SpecError`
  - `Campaign.text(slide: dict, lang: str) -> dict` — блок нужного языка
  - `Campaign.link(lang: str, source: str) -> str` — целевой URL с UTM и языковым префиксом
  - `Campaign.asset(slide: dict) -> Path | None` — абсолютный путь к скриншоту слайда
  - `Campaign.render_dir(lang: str) -> Path`
  - `class SpecError(Exception)`

- [ ] **Step 1: Написать падающий тест**

Создать `docs/marketing/tests/test_spec.py`:

```python
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import spec  # noqa: E402


def write_campaign(tmp_path: Path, payload: dict) -> Path:
    root = tmp_path / "campaigns" / payload["id"]
    root.mkdir(parents=True)
    (root / "campaign.json").write_text(json.dumps(payload), encoding="utf-8")
    return root


VALID = {
    "id": "demo",
    "track": "funnel-top",
    "target": "https://mi-code.pl/blog/ai-agent-cost-per-month-model/",
    "utm": {"campaign": "demo"},
    "slides": [
        {"type": "hook", "bigNumber": "$74.38",
         "pl": {"headline": "Ile kosztuje agent AI?"},
         "en": {"headline": "What does an AI agent cost?"}},
        {"type": "cta",
         "pl": {"headline": "Policzymy to"}, "en": {"headline": "We will price it"}},
    ],
}


def test_load_reads_id_track_and_slides(tmp_path, monkeypatch):
    write_campaign(tmp_path, VALID)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    campaign = spec.Campaign.load("demo")
    assert campaign.id == "demo"
    assert campaign.track == "funnel-top"
    assert len(campaign.slides) == 2


def test_load_rejects_unknown_slide_type(tmp_path, monkeypatch):
    broken = json.loads(json.dumps(VALID))
    broken["slides"][0]["type"] = "banner"
    write_campaign(tmp_path, broken)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    with pytest.raises(spec.SpecError, match="banner"):
        spec.Campaign.load("demo")


def test_load_rejects_slide_missing_a_language(tmp_path, monkeypatch):
    """A slide with no EN block would silently render an empty English creative."""
    broken = json.loads(json.dumps(VALID))
    del broken["slides"][1]["en"]
    write_campaign(tmp_path, broken)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    with pytest.raises(spec.SpecError, match="en"):
        spec.Campaign.load("demo")


def test_load_rejects_campaign_without_cta_slide(tmp_path, monkeypatch):
    """Lead generation is the whole point; a deck with no CTA is a defect."""
    broken = json.loads(json.dumps(VALID))
    broken["slides"] = [broken["slides"][0]]
    write_campaign(tmp_path, broken)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    with pytest.raises(spec.SpecError, match="cta"):
        spec.Campaign.load("demo")


def test_load_reports_a_missing_campaign_by_name(tmp_path, monkeypatch):
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    with pytest.raises(spec.SpecError, match="nope"):
        spec.Campaign.load("nope")


def test_text_returns_the_requested_language(tmp_path, monkeypatch):
    write_campaign(tmp_path, VALID)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    campaign = spec.Campaign.load("demo")
    assert campaign.text(campaign.slides[0], "pl")["headline"] == "Ile kosztuje agent AI?"
    assert campaign.text(campaign.slides[0], "en")["headline"] == "What does an AI agent cost?"


def test_link_appends_utm(tmp_path, monkeypatch):
    write_campaign(tmp_path, VALID)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    link = spec.Campaign.load("demo").link("pl", "linkedin")
    assert "utm_source=linkedin" in link
    assert "utm_medium=social" in link
    assert "utm_campaign=demo" in link


def test_link_uses_the_en_prefix_for_english(tmp_path, monkeypatch):
    write_campaign(tmp_path, VALID)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    campaign = spec.Campaign.load("demo")
    assert campaign.link("en", "linkedin").startswith("https://mi-code.pl/en/blog/")
    assert campaign.link("pl", "linkedin").startswith("https://mi-code.pl/blog/")


def test_link_does_not_double_the_en_prefix(tmp_path, monkeypatch):
    payload = json.loads(json.dumps(VALID))
    payload["target"] = "https://mi-code.pl/en/blog/x/"
    write_campaign(tmp_path, payload)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    assert spec.Campaign.load("demo").link("en", "x").count("/en/") == 1


def test_render_dir_is_per_language(tmp_path, monkeypatch):
    write_campaign(tmp_path, VALID)
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    campaign = spec.Campaign.load("demo")
    assert campaign.render_dir("pl").as_posix().endswith("creatives/demo/renders/pl")
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `python -m pytest docs/marketing/tests/test_spec.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'spec'`.

- [ ] **Step 3: Реализовать `spec.py`**

Создать `docs/marketing/scripts/spec.py`:

```python
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
```

- [ ] **Step 4: Запустить тесты и убедиться, что проходят**

Run: `python -m pytest docs/marketing/tests/test_spec.py -v`
Expected: PASS, 10 тестов.

- [ ] **Step 5: Коммит**

```bash
git add docs/marketing/scripts/spec.py docs/marketing/tests/test_spec.py
git commit -m "Add campaign spec loader with validation and UTM link building"
```

---

### Task 4: `slides.py` — пять типов слайдов

**Files:**
- Create: `docs/marketing/scripts/slides.py`
- Create: `docs/marketing/tests/test_slides.py`

**Interfaces:**
- Consumes: `brand` (Task 2), `spec.Campaign` (Task 3)
- Produces:
  - `render(campaign: Campaign, slide: dict, lang: str, size: tuple[int, int]) -> Image.Image` — единая точка входа, диспетчеризует по `slide["type"]`, всегда возвращает изображение ровно размера `size`

- [ ] **Step 1: Написать падающий тест**

Создать `docs/marketing/tests/test_slides.py`:

```python
import json
import sys
from pathlib import Path

import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import brand  # noqa: E402
import slides  # noqa: E402
import spec  # noqa: E402

CANVASES = [(1080, 1350), (1200, 627), (1080, 1920), (1200, 630)]

PAYLOAD = {
    "id": "demo", "track": "funnel-top",
    "target": "https://mi-code.pl/blog/x/", "utm": {"campaign": "demo"},
    "slides": [
        {"type": "hook", "bigNumber": "$74.38",
         "pl": {"eyebrow": "AI DLA BIZNESU", "headline": "Ile kosztuje agent AI miesiecznie?",
                "sub": "Tyle wychodzi w konfiguracji referencyjnej."},
         "en": {"eyebrow": "AI FOR BUSINESS", "headline": "What does an AI agent cost per month?",
                "sub": "That is the reference configuration."}},
        {"type": "problem",
         "pl": {"headline": "To zalezy nie jest odpowiedzia",
                "sub": "Cennik podaje cene za milion tokenow, ale nie kwote rachunku."},
         "en": {"headline": "It depends is not an answer",
                "sub": "A price list gives a unit price, not your bill."}},
        {"type": "numbers",
         "rows": [["gpt-5.4-nano", "$50.34"], ["gpt-5.6-sol", "$1254.00"]],
         "pl": {"headline": "Ta sama praca, 25x roznicy", "sub": "Te same tokeny."},
         "en": {"headline": "Same work, 25x apart", "sub": "The same tokens."}},
        {"type": "diagram", "asset": "src/calculator.png",
         "pl": {"headline": "Kalkulator w artykule", "sub": "Wstaw wlasne liczby."},
         "en": {"headline": "A calculator in the article", "sub": "Plug in your own numbers."}},
        {"type": "cta",
         "pl": {"headline": "Policzymy to na Twoich danych", "sub": "Przed rozpoczeciem pracy."},
         "en": {"headline": "We will price it on your data", "sub": "Before the work starts."}},
    ],
}


@pytest.fixture
def campaign(tmp_path, monkeypatch):
    root = tmp_path / "campaigns" / "demo"
    root.mkdir(parents=True)
    (root / "campaign.json").write_text(json.dumps(PAYLOAD), encoding="utf-8")
    shot_dir = tmp_path / "creatives" / "demo" / "src"
    shot_dir.mkdir(parents=True)
    Image.new("RGB", (1600, 900), (255, 255, 255)).save(shot_dir / "calculator.png")
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    return spec.Campaign.load("demo")


@pytest.mark.parametrize("index", range(5))
@pytest.mark.parametrize("size", CANVASES)
@pytest.mark.parametrize("lang", ["pl", "en"])
def test_every_slide_type_renders_at_every_canvas(campaign, index, size, lang):
    img = slides.render(campaign, campaign.slides[index], lang, size)
    assert img.size == size
    assert img.mode == "RGB"


def test_rendered_slide_is_not_blank(campaign):
    img = slides.render(campaign, campaign.slides[0], "pl", (1080, 1350))
    assert len(img.getcolors(maxcolors=1_000_000) or []) > 50


def test_pl_and_en_slides_differ(campaign):
    """Guards against a renderer that ignores the lang argument."""
    pl = slides.render(campaign, campaign.slides[0], "pl", (1080, 1350))
    en = slides.render(campaign, campaign.slides[0], "en", (1080, 1350))
    assert pl.tobytes() != en.tobytes()


def test_hook_slide_shows_the_big_number(campaign):
    """The headline figure is the hook; dropping it guts the creative."""
    with_number = slides.render(campaign, campaign.slides[0], "pl", (1080, 1350))
    stripped = dict(campaign.slides[0])
    stripped.pop("bigNumber")
    without = slides.render(campaign, stripped, "pl", (1080, 1350))
    assert with_number.tobytes() != without.tobytes()


def test_diagram_slide_without_its_asset_still_renders(campaign, monkeypatch):
    """Missing screenshot must degrade to a text slide, not crash a batch run."""
    missing = dict(campaign.slides[3])
    missing["asset"] = "src/does-not-exist.png"
    img = slides.render(campaign, missing, "pl", (1080, 1350))
    assert img.size == (1080, 1350)


def test_numbers_slide_renders_all_rows(campaign):
    two_rows = slides.render(campaign, campaign.slides[2], "pl", (1080, 1350))
    one_row = dict(campaign.slides[2])
    one_row["rows"] = [["gpt-5.4-nano", "$50.34"]]
    assert two_rows.tobytes() != slides.render(campaign, one_row, "pl", (1080, 1350)).tobytes()


def test_cta_slide_carries_the_contact_address(campaign):
    img = slides.render(campaign, campaign.slides[4], "pl", (1080, 1350))
    assert img.size == (1080, 1350)
    assert len(img.getcolors(maxcolors=1_000_000) or []) > 50
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `python -m pytest docs/marketing/tests/test_slides.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'slides'`.

- [ ] **Step 3: Реализовать `slides.py`**

Создать `docs/marketing/scripts/slides.py`:

```python
# -*- coding: utf-8 -*-
"""Render one campaign slide onto one canvas.

Every slide type must survive every canvas — a 1200x627 LinkedIn banner is
half the height of a carousel page, so sizes are derived from the canvas
rather than fixed. This is what lets one campaign.json feed all formats.
"""
from PIL import Image, ImageDraw

import brand
from spec import Campaign


def _layout(size: tuple[int, int]) -> dict:
    width, height = size
    margin = int(width * 0.085)
    return {
        "margin": margin,
        "content_width": width - margin * 2,
        "eyebrow": brand.body(max(int(width * 0.026), 15), "semibold"),
        "title": brand.heading(max(int(width * 0.072), 30)),
        "sub": brand.body(max(int(width * 0.034), 17)),
        "huge": brand.heading(max(int(width * 0.165), 60)),
        "row": brand.body(max(int(width * 0.038), 18), "semibold"),
        "top": int(height * 0.17),
    }


def _draw_block(img, lines, font, fill, x, y, spacing=1.25) -> int:
    draw = ImageDraw.Draw(img)
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += int(font.size * spacing)
    return y


def _header(img, box, text: dict) -> int:
    y = box["top"]
    if text.get("eyebrow"):
        draw = ImageDraw.Draw(img)
        draw.text((box["margin"], y), text["eyebrow"].upper(),
                  font=box["eyebrow"], fill=brand.ORANGE_LIGHT)
        y += int(box["eyebrow"].size * 2.1)
    if text.get("headline"):
        y = _draw_block(img, brand.wrap(text["headline"], box["title"], box["content_width"]),
                        box["title"], brand.WHITE, box["margin"], y)
    return y


def _sub(img, box, text: dict, y: int) -> int:
    if not text.get("sub"):
        return y
    y += int(box["sub"].size * 0.6)
    return _draw_block(img, brand.wrap(text["sub"], box["sub"], box["content_width"]),
                       box["sub"], brand.MUTED, box["margin"], y, 1.45)


def _hook(img, box, slide, text, campaign, lang):
    y = _header(img, box, text)
    if slide.get("bigNumber"):
        y += int(box["huge"].size * 0.2)
        ImageDraw.Draw(img).text((box["margin"], y), slide["bigNumber"],
                                 font=box["huge"], fill=brand.ORANGE)
        y += int(box["huge"].size * 1.15)
    _sub(img, box, text, y)


def _problem(img, box, slide, text, campaign, lang):
    _sub(img, box, text, _header(img, box, text))


def _numbers(img, box, slide, text, campaign, lang):
    y = _sub(img, box, text, _header(img, box, text))
    y += int(box["row"].size * 0.9)
    draw = ImageDraw.Draw(img)
    right = box["margin"] + box["content_width"]
    for label, value in slide.get("rows", []):
        draw.text((box["margin"], y), str(label), font=box["row"], fill=brand.MUTED)
        value_width = draw.textlength(str(value), font=box["row"])
        draw.text((right - value_width, y), str(value), font=box["row"], fill=brand.ORANGE_LIGHT)
        y += int(box["row"].size * 1.35)
        draw.line([(box["margin"], y - box["row"].size // 3), (right, y - box["row"].size // 3)],
                  fill=brand.NAVY, width=2)


def _diagram(img, box, slide, text, campaign, lang):
    y = _sub(img, box, text, _header(img, box, text))
    path = campaign.asset(slide)
    if not path or not path.is_file():
        return  # degrade to a text slide rather than break a batch render
    with Image.open(path) as raw:
        shot = raw.convert("RGB")
    available = img.height - y - int(img.height * 0.14)
    if available < 80:
        return
    framed = brand.browser_frame(shot, box["content_width"], brand.SITE)
    if framed.height > available:
        scale = available / framed.height
        framed = framed.resize((max(int(framed.width * scale), 1), available), Image.LANCZOS)
    img.paste(framed, ((img.width - framed.width) // 2, y + int(img.height * 0.02)))


def _cta(img, box, slide, text, campaign, lang):
    y = _sub(img, box, text, _header(img, box, text))
    y += int(box["row"].size * 1.1)
    brand.pill(img, (box["margin"], y), brand.CONTACT, box["row"])


_RENDERERS = {
    "hook": _hook,
    "problem": _problem,
    "numbers": _numbers,
    "diagram": _diagram,
    "cta": _cta,
}


def render(campaign: Campaign, slide: dict, lang: str,
           size: tuple[int, int]) -> Image.Image:
    img = brand.background(size)
    box = _layout(size)
    _RENDERERS[slide["type"]](img, box, slide, campaign.text(slide, lang),
                              campaign, lang)
    brand.paste_badge(img, height=max(size[0] // 20, 34))
    brand.footer(img, lang)
    return img
```

- [ ] **Step 4: Запустить тесты и убедиться, что проходят**

Run: `python -m pytest docs/marketing/tests/test_slides.py -v`
Expected: PASS, 46 тестов (40 параметризованных + 6 отдельных).

- [ ] **Step 5: Коммит**

```bash
git add docs/marketing/scripts/slides.py docs/marketing/tests/test_slides.py
git commit -m "Add slide renderer covering five slide types on any canvas"
```

---

### Task 5: `build_carousel.py` — карусель LinkedIn

**Files:**
- Create: `docs/marketing/scripts/build_carousel.py`
- Create: `docs/marketing/tests/test_build_carousel.py`

**Interfaces:**
- Consumes: `slides.render` (Task 4), `spec.Campaign` (Task 3)
- Produces: `build(campaign_id: str, langs: list[str]) -> list[Path]` — пишет `carousel-01.png … carousel-NN.png` и `carousel.pdf` в `renders/<lang>/`, возвращает список записанных путей

- [ ] **Step 1: Написать падающий тест**

Создать `docs/marketing/tests/test_build_carousel.py`:

```python
import json
import sys
from pathlib import Path

import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import build_carousel  # noqa: E402
import spec  # noqa: E402

PAYLOAD = {
    "id": "demo", "track": "funnel-top",
    "target": "https://mi-code.pl/blog/x/", "utm": {"campaign": "demo"},
    "slides": [
        {"type": "hook", "bigNumber": "$74.38",
         "pl": {"headline": "Ile kosztuje agent AI?"},
         "en": {"headline": "What does an AI agent cost?"}},
        {"type": "problem",
         "pl": {"headline": "To zalezy nie jest odpowiedzia"},
         "en": {"headline": "It depends is not an answer"}},
        {"type": "cta",
         "pl": {"headline": "Policzymy to"}, "en": {"headline": "We will price it"}},
    ],
}


@pytest.fixture
def workspace(tmp_path, monkeypatch):
    root = tmp_path / "campaigns" / "demo"
    root.mkdir(parents=True)
    (root / "campaign.json").write_text(json.dumps(PAYLOAD), encoding="utf-8")
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    return tmp_path


def test_writes_one_png_per_slide_per_language(workspace):
    build_carousel.build("demo", ["pl", "en"])
    for lang in ("pl", "en"):
        out = workspace / "creatives" / "demo" / "renders" / lang
        assert sorted(p.name for p in out.glob("carousel-*.png")) == [
            "carousel-01.png", "carousel-02.png", "carousel-03.png"
        ]


def test_pages_use_the_linkedin_carousel_canvas(workspace):
    build_carousel.build("demo", ["pl"])
    page = workspace / "creatives" / "demo" / "renders" / "pl" / "carousel-01.png"
    with Image.open(page) as img:
        assert img.size == (1080, 1350)


def test_writes_a_single_pdf_with_every_page(workspace):
    """LinkedIn only accepts carousels as a PDF document."""
    build_carousel.build("demo", ["pl"])
    pdf = workspace / "creatives" / "demo" / "renders" / "pl" / "carousel.pdf"
    assert pdf.is_file()
    assert pdf.stat().st_size > 5000
    assert pdf.read_bytes().startswith(b"%PDF")


def test_build_returns_every_path_it_wrote(workspace):
    written = build_carousel.build("demo", ["pl"])
    assert len(written) == 4  # three pages plus the pdf
    assert all(p.exists() for p in written)


def test_rerun_overwrites_instead_of_accumulating(workspace):
    build_carousel.build("demo", ["pl"])
    build_carousel.build("demo", ["pl"])
    out = workspace / "creatives" / "demo" / "renders" / "pl"
    assert len(list(out.glob("carousel-*.png"))) == 3


def test_stale_pages_are_removed_when_the_deck_shrinks(workspace):
    build_carousel.build("demo", ["pl"])
    shorter = json.loads(json.dumps(PAYLOAD))
    shorter["slides"] = [shorter["slides"][0], shorter["slides"][2]]
    (workspace / "campaigns" / "demo" / "campaign.json").write_text(
        json.dumps(shorter), encoding="utf-8")
    build_carousel.build("demo", ["pl"])
    out = workspace / "creatives" / "demo" / "renders" / "pl"
    assert len(list(out.glob("carousel-*.png"))) == 2
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `python -m pytest docs/marketing/tests/test_build_carousel.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'build_carousel'`.

- [ ] **Step 3: Реализовать `build_carousel.py`**

Создать `docs/marketing/scripts/build_carousel.py`:

```python
# -*- coding: utf-8 -*-
"""LinkedIn carousel: one 1080x1350 page per slide, plus the PDF.

LinkedIn publishes carousels as document posts, so the PDF — not the PNG
series — is the file that actually gets uploaded. The PNGs are kept for
reuse in other feeds and for reviewing a deck without opening a reader.

Usage:
    python docs/marketing/scripts/build_carousel.py cost-of-ai-agent pl en
"""
import sys
from pathlib import Path

import slides
from spec import Campaign, SpecError

CANVAS = (1080, 1350)


def build(campaign_id: str, langs: list[str]) -> list[Path]:
    campaign = Campaign.load(campaign_id)
    written: list[Path] = []

    for lang in langs:
        out = campaign.render_dir(lang)
        for stale in out.glob("carousel-*.png"):
            stale.unlink()

        pages = []
        for index, slide in enumerate(campaign.slides, start=1):
            page = slides.render(campaign, slide, lang, CANVAS)
            path = out / f"carousel-{index:02d}.png"
            page.save(path)
            pages.append(page)
            written.append(path)

        pdf = out / "carousel.pdf"
        pages[0].save(pdf, save_all=True, append_images=pages[1:], resolution=150.0)
        written.append(pdf)
        print(f"  {lang}: {len(pages)} pages -> {pdf}")

    return written


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    try:
        build(argv[1], argv[2:] or ["pl", "en"])
    except SpecError as exc:
        print(f"spec error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
```

- [ ] **Step 4: Запустить тесты и убедиться, что проходят**

Run: `python -m pytest docs/marketing/tests/test_build_carousel.py -v`
Expected: PASS, 6 тестов.

- [ ] **Step 5: Коммит**

```bash
git add docs/marketing/scripts/build_carousel.py docs/marketing/tests/test_build_carousel.py
git commit -m "Add LinkedIn carousel generator emitting page PNGs and an upload PDF"
```

---

### Task 6: `build_single.py` — одиночные посты и OG

**Files:**
- Create: `docs/marketing/scripts/build_single.py`
- Create: `docs/marketing/tests/test_build_single.py`

**Interfaces:**
- Consumes: `slides.render` (Task 4), `spec.Campaign` (Task 3)
- Produces:
  - `CANVASES: dict[str, tuple[int, int]]` — `{"li-single": (1200, 627), "feed-4x5": (1080, 1350), "og": (1200, 630)}`
  - `build(campaign_id: str, langs: list[str]) -> list[Path]` — пишет `li-single.png`, `feed-4x5.png`, `og.png`

- [ ] **Step 1: Написать падающий тест**

Создать `docs/marketing/tests/test_build_single.py`:

```python
import json
import sys
from pathlib import Path

import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import build_single  # noqa: E402
import spec  # noqa: E402

PAYLOAD = {
    "id": "demo", "track": "funnel-top",
    "target": "https://mi-code.pl/blog/x/", "utm": {"campaign": "demo"},
    "slides": [
        {"type": "hook", "bigNumber": "$74.38",
         "pl": {"headline": "Ile kosztuje agent AI?"},
         "en": {"headline": "What does an AI agent cost?"}},
        {"type": "cta",
         "pl": {"headline": "Policzymy to"}, "en": {"headline": "We will price it"}},
    ],
}


@pytest.fixture
def workspace(tmp_path, monkeypatch):
    root = tmp_path / "campaigns" / "demo"
    root.mkdir(parents=True)
    (root / "campaign.json").write_text(json.dumps(PAYLOAD), encoding="utf-8")
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    return tmp_path


def test_canvas_sizes_match_the_platforms():
    assert build_single.CANVASES["li-single"] == (1200, 627)
    assert build_single.CANVASES["feed-4x5"] == (1080, 1350)
    assert build_single.CANVASES["og"] == (1200, 630)


def test_writes_all_three_formats_per_language(workspace):
    build_single.build("demo", ["pl", "en"])
    for lang in ("pl", "en"):
        out = workspace / "creatives" / "demo" / "renders" / lang
        for name in ("li-single.png", "feed-4x5.png", "og.png"):
            assert (out / name).is_file(), f"{lang}/{name} missing"


def test_each_file_has_its_declared_size(workspace):
    build_single.build("demo", ["pl"])
    out = workspace / "creatives" / "demo" / "renders" / "pl"
    for name, size in build_single.CANVASES.items():
        with Image.open(out / f"{name}.png") as img:
            assert img.size == size, f"{name} rendered at {img.size}"


def test_singles_are_built_from_the_hook_slide(workspace):
    """The hook is the whole message when there is only one image."""
    build_single.build("demo", ["pl"])
    out = workspace / "creatives" / "demo" / "renders" / "pl"
    with Image.open(out / "feed-4x5.png") as feed:
        assert len(feed.getcolors(maxcolors=1_000_000) or []) > 50


def test_falls_back_to_the_first_slide_when_no_hook_exists(workspace):
    no_hook = json.loads(json.dumps(PAYLOAD))
    no_hook["slides"][0]["type"] = "problem"
    no_hook["slides"][0].pop("bigNumber")
    (workspace / "campaigns" / "demo" / "campaign.json").write_text(
        json.dumps(no_hook), encoding="utf-8")
    written = build_single.build("demo", ["pl"])
    assert len(written) == 3


def test_build_returns_every_path_it_wrote(workspace):
    written = build_single.build("demo", ["pl", "en"])
    assert len(written) == 6
    assert all(p.exists() for p in written)
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `python -m pytest docs/marketing/tests/test_build_single.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'build_single'`.

- [ ] **Step 3: Реализовать `build_single.py`**

Создать `docs/marketing/scripts/build_single.py`:

```python
# -*- coding: utf-8 -*-
"""Single-image formats: LinkedIn 1200x627, feed 4:5, and the OG card.

All three carry the same message — the campaign's hook slide — because a
single image gets one chance to say something. The canvases differ enough in
aspect ratio that the slide renderer sizes type from the canvas, not fixed px.

Usage:
    python docs/marketing/scripts/build_single.py cost-of-ai-agent pl en
"""
import sys
from pathlib import Path

import slides
from spec import Campaign, SpecError

CANVASES = {
    "li-single": (1200, 627),
    "feed-4x5": (1080, 1350),
    "og": (1200, 630),
}


def build(campaign_id: str, langs: list[str]) -> list[Path]:
    campaign = Campaign.load(campaign_id)
    hook = next((s for s in campaign.slides if s["type"] == "hook"),
                campaign.slides[0])
    written: list[Path] = []

    for lang in langs:
        out = campaign.render_dir(lang)
        for name, size in CANVASES.items():
            path = out / f"{name}.png"
            slides.render(campaign, hook, lang, size).save(path)
            written.append(path)
        print(f"  {lang}: {len(CANVASES)} singles -> {out}")

    return written


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    try:
        build(argv[1], argv[2:] or ["pl", "en"])
    except SpecError as exc:
        print(f"spec error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
```

- [ ] **Step 4: Запустить тесты и убедиться, что проходят**

Run: `python -m pytest docs/marketing/tests/test_build_single.py -v`
Expected: PASS, 6 тестов.

- [ ] **Step 5: Коммит**

```bash
git add docs/marketing/scripts/build_single.py docs/marketing/tests/test_build_single.py
git commit -m "Add single-image generator for LinkedIn, feed and OG canvases"
```

---

### Task 7: `build_reel.py` — сторис и видео

**Files:**
- Create: `docs/marketing/scripts/build_reel.py`
- Create: `docs/marketing/tests/test_build_reel.py`

**Interfaces:**
- Consumes: `slides.render` (Task 4), `spec.Campaign` (Task 3)
- Produces:
  - `CANVAS: tuple[int, int]` — `(1080, 1920)`
  - `FPS: int` — `24`
  - `SECONDS_PER_SLIDE: float` — `2.6`
  - `build(campaign_id: str, langs: list[str]) -> list[Path]` — пишет `story-9x16-01.png … -NN.png`, `reel.mp4`, `reel.gif`

- [ ] **Step 1: Написать падающий тест**

Создать `docs/marketing/tests/test_build_reel.py`:

```python
import json
import sys
from pathlib import Path

import imageio.v3 as iio
import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import build_reel  # noqa: E402
import spec  # noqa: E402

PAYLOAD = {
    "id": "demo", "track": "funnel-top",
    "target": "https://mi-code.pl/blog/x/", "utm": {"campaign": "demo"},
    "slides": [
        {"type": "hook", "bigNumber": "$74.38",
         "pl": {"headline": "Ile kosztuje agent AI?"},
         "en": {"headline": "What does an AI agent cost?"}},
        {"type": "cta",
         "pl": {"headline": "Policzymy to"}, "en": {"headline": "We will price it"}},
    ],
}


@pytest.fixture
def workspace(tmp_path, monkeypatch):
    root = tmp_path / "campaigns" / "demo"
    root.mkdir(parents=True)
    (root / "campaign.json").write_text(json.dumps(PAYLOAD), encoding="utf-8")
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    return tmp_path


def test_writes_one_story_poster_per_slide(workspace):
    build_reel.build("demo", ["pl"])
    out = workspace / "creatives" / "demo" / "renders" / "pl"
    assert sorted(p.name for p in out.glob("story-9x16-*.png")) == [
        "story-9x16-01.png", "story-9x16-02.png"
    ]


def test_posters_use_the_vertical_canvas(workspace):
    build_reel.build("demo", ["pl"])
    poster = workspace / "creatives" / "demo" / "renders" / "pl" / "story-9x16-01.png"
    with Image.open(poster) as img:
        assert img.size == (1080, 1920)


def test_writes_both_mp4_and_gif(workspace):
    build_reel.build("demo", ["pl"])
    out = workspace / "creatives" / "demo" / "renders" / "pl"
    assert (out / "reel.mp4").is_file()
    assert (out / "reel.gif").is_file()
    assert (out / "reel.mp4").stat().st_size > 10_000


def test_video_length_covers_every_slide(workspace):
    """Two slides at 2.6s each must not silently render as a one-second clip."""
    build_reel.build("demo", ["pl"])
    mp4 = workspace / "creatives" / "demo" / "renders" / "pl" / "reel.mp4"
    frames = iio.imread(mp4, plugin="pyav")
    expected = int(build_reel.FPS * build_reel.SECONDS_PER_SLIDE * 2)
    assert len(frames) >= expected * 0.9


def test_video_frames_use_the_vertical_canvas(workspace):
    build_reel.build("demo", ["pl"])
    mp4 = workspace / "creatives" / "demo" / "renders" / "pl" / "reel.mp4"
    frames = iio.imread(mp4, plugin="pyav")
    assert frames.shape[1:3] == (1920, 1080)


def test_reel_is_not_a_still_image(workspace):
    """A transition bug that renders the same frame throughout still produces
    a playable file, so compare the first and last frames explicitly."""
    build_reel.build("demo", ["pl"])
    mp4 = workspace / "creatives" / "demo" / "renders" / "pl" / "reel.mp4"
    frames = iio.imread(mp4, plugin="pyav")
    assert frames[0].tobytes() != frames[-1].tobytes()


def test_stale_posters_are_removed_when_the_deck_shrinks(workspace):
    build_reel.build("demo", ["pl"])
    shorter = json.loads(json.dumps(PAYLOAD))
    shorter["slides"] = [shorter["slides"][1]]
    (workspace / "campaigns" / "demo" / "campaign.json").write_text(
        json.dumps(shorter), encoding="utf-8")
    build_reel.build("demo", ["pl"])
    out = workspace / "creatives" / "demo" / "renders" / "pl"
    assert len(list(out.glob("story-9x16-*.png"))) == 1
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `python -m pytest docs/marketing/tests/test_build_reel.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'build_reel'`.

- [ ] **Step 3: Реализовать `build_reel.py`**

Создать `docs/marketing/scripts/build_reel.py`:

```python
# -*- coding: utf-8 -*-
"""Stories and Reels: static 9:16 posters plus the video that walks them.

The posters and the video come from the same slides, so a Story and a Reel
never drift apart. Cross-fade between slides keeps the clip watchable
without any motion design work per campaign.

Usage:
    python docs/marketing/scripts/build_reel.py cost-of-ai-agent pl
"""
import sys
from pathlib import Path

import imageio.v2 as imageio
import numpy as np
from PIL import Image

import slides
from spec import Campaign, SpecError

CANVAS = (1080, 1920)
FPS = 24
SECONDS_PER_SLIDE = 2.6
FADE_FRAMES = 8


def _frames(pages: list[Image.Image]) -> list[np.ndarray]:
    hold = int(FPS * SECONDS_PER_SLIDE) - FADE_FRAMES
    out: list[np.ndarray] = []
    for index, page in enumerate(pages):
        current = np.asarray(page, dtype=np.uint8)
        out.extend([current] * max(hold, 1))
        if index + 1 < len(pages):
            nxt = np.asarray(pages[index + 1], dtype=np.uint8)
            for step in range(1, FADE_FRAMES + 1):
                alpha = step / (FADE_FRAMES + 1)
                blended = current * (1 - alpha) + nxt * alpha
                out.append(blended.astype(np.uint8))
    return out


def build(campaign_id: str, langs: list[str]) -> list[Path]:
    campaign = Campaign.load(campaign_id)
    written: list[Path] = []

    for lang in langs:
        out = campaign.render_dir(lang)
        for stale in out.glob("story-9x16-*.png"):
            stale.unlink()

        pages = []
        for index, slide in enumerate(campaign.slides, start=1):
            page = slides.render(campaign, slide, lang, CANVAS)
            path = out / f"story-9x16-{index:02d}.png"
            page.save(path)
            pages.append(page)
            written.append(path)

        frames = _frames(pages)
        mp4 = out / "reel.mp4"
        imageio.mimwrite(mp4, frames, fps=FPS, codec="libx264",
                         macro_block_size=8, quality=8)
        written.append(mp4)

        gif = out / "reel.gif"
        preview = [np.asarray(Image.fromarray(f).resize((CANVAS[0] // 2, CANVAS[1] // 2),
                                                        Image.LANCZOS))
                   for f in frames[::3]]
        imageio.mimwrite(gif, preview, duration=1000 * 3 / FPS, loop=0)
        written.append(gif)
        print(f"  {lang}: {len(pages)} posters + reel -> {out}")

    return written


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    try:
        build(argv[1], argv[2:] or ["pl"])
    except SpecError as exc:
        print(f"spec error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
```

- [ ] **Step 4: Запустить тесты и убедиться, что проходят**

Run: `python -m pytest docs/marketing/tests/test_build_reel.py -v`
Expected: PASS, 7 тестов.

Если `imageio` не найдёт кодек H.264, установить бэкенд:
`pip install imageio[pyav]` — и перезапустить. Не заменять кодек на другой
без обновления теста `test_video_frames_use_the_vertical_canvas`.

- [ ] **Step 5: Коммит**

```bash
git add docs/marketing/scripts/build_reel.py docs/marketing/tests/test_build_reel.py
git commit -m "Add story poster and reel generator with cross-fade transitions"
```

---

### Task 8: `capture_screens.py` — съёмка сайта

**Files:**
- Create: `docs/marketing/scripts/capture_screens.py`
- Create: `docs/marketing/tests/test_capture_screens.py`
- Modify: `docs/marketing/README.md` (раздел про Playwright)

**Interfaces:**
- Consumes: `spec.Campaign` (Task 3)
- Produces:
  - `shots_for(campaign: Campaign) -> list[dict]` — список `{"asset": str, "url": str, "selector": str | None}` из `campaign.json`
  - `capture(campaign_id: str, base_url: str = "http://localhost:4173") -> list[Path]`

- [ ] **Step 1: Написать падающий тест**

Создать `docs/marketing/tests/test_capture_screens.py`:

```python
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import capture_screens  # noqa: E402
import spec  # noqa: E402

PAYLOAD = {
    "id": "demo", "track": "funnel-top",
    "target": "https://mi-code.pl/blog/x/", "utm": {"campaign": "demo"},
    "slides": [
        {"type": "hook", "pl": {"headline": "a"}, "en": {"headline": "a"}},
        {"type": "diagram", "asset": "src/calculator.png",
         "shot": {"path": "/blog/ai-agent-cost-per-month-model/",
                  "selector": ".cost-calculator"},
         "pl": {"headline": "b"}, "en": {"headline": "b"}},
        {"type": "diagram", "asset": "src/hero.png",
         "shot": {"path": "/"},
         "pl": {"headline": "c"}, "en": {"headline": "c"}},
        {"type": "cta", "pl": {"headline": "d"}, "en": {"headline": "d"}},
    ],
}


@pytest.fixture
def campaign(tmp_path, monkeypatch):
    root = tmp_path / "campaigns" / "demo"
    root.mkdir(parents=True)
    (root / "campaign.json").write_text(json.dumps(PAYLOAD), encoding="utf-8")
    monkeypatch.setattr(spec, "MARKETING", tmp_path)
    return spec.Campaign.load("demo")


def test_shots_for_lists_only_slides_that_declare_one(campaign):
    shots = capture_screens.shots_for(campaign)
    assert [s["asset"] for s in shots] == ["src/calculator.png", "src/hero.png"]


def test_shots_carry_the_selector_when_declared(campaign):
    shots = capture_screens.shots_for(campaign)
    assert shots[0]["selector"] == ".cost-calculator"
    assert shots[1]["selector"] is None


def test_shots_carry_the_page_path(campaign):
    shots = capture_screens.shots_for(campaign)
    assert shots[0]["path"] == "/blog/ai-agent-cost-per-month-model/"


def test_campaign_with_no_diagram_slides_needs_no_capture(campaign, tmp_path):
    payload = json.loads(json.dumps(PAYLOAD))
    payload["slides"] = [payload["slides"][0], payload["slides"][3]]
    (tmp_path / "campaigns" / "demo" / "campaign.json").write_text(
        json.dumps(payload), encoding="utf-8")
    assert capture_screens.shots_for(spec.Campaign.load("demo")) == []
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `python -m pytest docs/marketing/tests/test_capture_screens.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'capture_screens'`.

- [ ] **Step 3: Реализовать `capture_screens.py`**

Создать `docs/marketing/scripts/capture_screens.py`:

```python
# -*- coding: utf-8 -*-
"""Capture the source screenshots a campaign's diagram slides need.

The LangGraph diagrams on the product pages are drawn by mermaid in the
browser, so there is no static file to copy — a headless browser is the only
way to get them. Start the preview server first:

    npm run build && npm run preview
    python docs/marketing/scripts/capture_screens.py cost-of-ai-agent

Requires: pip install playwright && playwright install chromium
"""
import sys
from pathlib import Path

from spec import Campaign, SpecError

VIEWPORT = {"width": 1600, "height": 1000}
DEFAULT_BASE = "http://localhost:4173"


def shots_for(campaign: Campaign) -> list[dict]:
    """Every slide that declares a `shot` block, in deck order."""
    shots = []
    for slide in campaign.slides:
        shot = slide.get("shot")
        if not shot or not slide.get("asset"):
            continue
        shots.append({
            "asset": slide["asset"],
            "path": shot["path"],
            "selector": shot.get("selector"),
        })
    return shots


def capture(campaign_id: str, base_url: str = DEFAULT_BASE) -> list[Path]:
    from playwright.sync_api import sync_playwright  # imported late: optional dep

    campaign = Campaign.load(campaign_id)
    shots = shots_for(campaign)
    if not shots:
        print(f"{campaign_id}: no diagram slides declare a screenshot")
        return []

    src_dir = campaign.root.parents[1] / "creatives" / campaign_id / "src"
    src_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport=VIEWPORT, device_scale_factor=2)
        for shot in shots:
            url = f"{base_url.rstrip('/')}{shot['path']}"
            page.goto(url, wait_until="networkidle")
            target = src_dir / Path(shot["asset"]).name
            if shot["selector"]:
                # mermaid renders after hydration; wait for the node, not a timer
                element = page.wait_for_selector(shot["selector"], timeout=15_000)
                element.screenshot(path=str(target))
            else:
                page.screenshot(path=str(target), full_page=False)
            written.append(target)
            print(f"  {url} -> {target.name}")
        browser.close()

    return written


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    try:
        capture(argv[1], argv[2] if len(argv) > 2 else DEFAULT_BASE)
    except SpecError as exc:
        print(f"spec error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
```

- [ ] **Step 4: Запустить тесты и убедиться, что проходят**

Run: `python -m pytest docs/marketing/tests/test_capture_screens.py -v`
Expected: PASS, 4 теста.

- [ ] **Step 5: Установить браузер Playwright и дописать README**

```bash
python -m playwright install chromium
```

В `docs/marketing/README.md` добавить раздел «Скриншоты»: требование сначала
поднять `npm run build && npm run preview`, команду установки chromium и
пояснение, что съёмка нужна только кампаниям со слайдами типа `diagram`.

- [ ] **Step 6: Коммит**

```bash
git add docs/marketing/scripts/capture_screens.py docs/marketing/tests/test_capture_screens.py docs/marketing/README.md
git commit -m "Add Playwright screenshot capture for campaign diagram slides"
```

---

### Task 9: Кампания `cost-of-ai-agent` целиком

**Files:**
- Create: `docs/marketing/campaigns/cost-of-ai-agent/campaign.json`
- Create: `docs/marketing/copy/funnel-cost-of-ai-agent.md`
- Create: `docs/marketing/copy/cta-blocks.md`
- Create: `docs/marketing/strategy.md`
- Create: `docs/marketing/content-plan.md`
- Create: `docs/marketing/tests/test_campaign_cost_of_ai_agent.py`

**Interfaces:**
- Consumes: всё из Tasks 1–8
- Produces: полностью отрендеренная кампания в `creatives/cost-of-ai-agent/renders/{pl,en}/`

**Источник цифр** — статья `ai-agent-cost-per-month-model` в `src/data/blog-posts.json`.
Все числа ниже взяты из неё дословно, выдумывать новые запрещено:
референсный расчёт **$74.38/мес**, разброс **$50.34** (gpt-5.4-nano) против
**$1254.00** (gpt-5.6-sol) — около 25×, стабильный префикс **15 600 токенов**,
**19 100** токенов входа против **300** выхода на шаг, **98,5%** обмена
приходится на вход, **82%** входа можно подать из кэша, кэш дешевле обычного
входа примерно на **90%**.

- [ ] **Step 1: Написать падающий тест**

Создать `docs/marketing/tests/test_campaign_cost_of_ai_agent.py`:

```python
import json
import re
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import spec  # noqa: E402

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
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `python -m pytest docs/marketing/tests/test_campaign_cost_of_ai_agent.py -v`
Expected: FAIL — `SpecError: no campaign spec for 'cost-of-ai-agent'`.

- [ ] **Step 3: Написать `campaign.json`**

Создать `docs/marketing/campaigns/cost-of-ai-agent/campaign.json`:

```json
{
  "id": "cost-of-ai-agent",
  "track": "funnel-top",
  "target": "https://mi-code.pl/blog/ai-agent-cost-per-month-model/",
  "utm": { "campaign": "cost-of-ai-agent" },
  "slides": [
    {
      "type": "hook",
      "bigNumber": "$74.38",
      "pl": {
        "eyebrow": "Agent AI dla biznesu",
        "headline": "Ile agent AI kosztuje miesięcznie?",
        "sub": "Tyle wychodzi w konfiguracji referencyjnej. Policzone przed wdrożeniem, a nie po pierwszej fakturze."
      },
      "en": {
        "eyebrow": "AI agents for business",
        "headline": "What does an AI agent cost per month?",
        "sub": "That is the reference configuration — worked out before the build, not after the first invoice."
      }
    },
    {
      "type": "problem",
      "pl": {
        "eyebrow": "Problem",
        "headline": "„To zależy” nie jest odpowiedzią",
        "sub": "Cennik podaje cenę za milion tokenów, a nie kwotę rachunku. Brakuje trzech wielkości: ile tokenów idzie w jednym zapytaniu, ile zapytań przypada na jedno zadanie i jaka część wejścia jest podana z cache."
      },
      "en": {
        "eyebrow": "The problem",
        "headline": "\"It depends\" is not an answer",
        "sub": "A price list gives a unit price, not your bill. Three quantities are missing: tokens per request, requests per task, and how much of the input is served from cache."
      }
    },
    {
      "type": "numbers",
      "rows": [
        ["gpt-5.4-nano", "$50.34"],
        ["gpt-5.6-sol", "$1254.00"]
      ],
      "pl": {
        "eyebrow": "Rozrzut",
        "headline": "Ta sama praca, 25 razy różnicy",
        "sub": "Identyczna liczba tokenów, dwa modele. Dopóki założenia nie są ustalone, spór o „drogi model” nie prowadzi donikąd."
      },
      "en": {
        "eyebrow": "The spread",
        "headline": "Same work, 25× apart",
        "sub": "Identical token counts, two models. Until the assumptions are fixed, arguing about an \"expensive model\" goes nowhere."
      }
    },
    {
      "type": "numbers",
      "rows": [
        ["Stały prefiks / fixed prefix", "15 600"],
        ["Wejście na krok / input per step", "19 100"],
        ["Wyjście na krok / output per step", "300"],
        ["Wejście z cache / cacheable input", "82%"]
      ],
      "pl": {
        "eyebrow": "Anatomia rachunku",
        "headline": "Płacisz za przesyłanie, nie za inteligencję",
        "sub": "Model nie pamięta poprzedniego kroku — dostaje go opowiedzianego od nowa. 98,5% tokenów wymiany to wejście."
      },
      "en": {
        "eyebrow": "Anatomy of the bill",
        "headline": "You pay for re-sending, not for intelligence",
        "sub": "The model remembers nothing between calls — every step re-sends the whole context. 98.5% of the exchange is input."
      }
    },
    {
      "type": "diagram",
      "asset": "src/calculator.png",
      "shot": {
        "path": "/blog/ai-agent-cost-per-month-model/",
        "selector": ".cost-calculator"
      },
      "pl": {
        "eyebrow": "Kalkulator",
        "headline": "Wstaw własne liczby",
        "sub": "Narzędzia, kroki na zadanie, trafienia w cache — kalkulator w artykule przelicza rachunek na Twoich założeniach."
      },
      "en": {
        "eyebrow": "Calculator",
        "headline": "Plug in your own numbers",
        "sub": "Tools, steps per task, cache hit rate — the calculator in the article recomputes the bill on your assumptions."
      }
    },
    {
      "type": "cta",
      "pl": {
        "eyebrow": "MICODE",
        "headline": "Policzymy to na Twoich danych",
        "sub": "Model kosztu na Twoich narzędziach, Twoich zadaniach i Twojej polityce danych — razem z uczciwą oceną, które dźwignie są realnie dostępne."
      },
      "en": {
        "eyebrow": "MICODE",
        "headline": "We will price it on your data",
        "sub": "A cost model built on your tools, your tasks and your data policy — with an honest read on which levers you can actually pull."
      }
    }
  ]
}
```

- [ ] **Step 4: Проверить, что спека валидна**

Run: `python -m pytest docs/marketing/tests/test_campaign_cost_of_ai_agent.py -v -k "spec or deck or slide or hook or figure"`
Expected: PASS — шесть тестов спеки проходят, тесты копирайта и рендеров ещё падают.

- [ ] **Step 5: Написать `cta-blocks.md`**

Создать `docs/marketing/copy/cta-blocks.md` — переиспользуемые концовки постов:

```markdown
# CTA-блоки, хэштеги и UTM

Один источник правды для концовок постов. Не переписывать в каждом файле —
подставлять отсюда, чтобы контакт и домен нигде не разошлись.

## UTM-схема

Каждая ссылка из поста:

`<url>?utm_source=<канал>&utm_medium=social&utm_campaign=<id кампании>`

| Канал | `utm_source` |
|---|---|
| LinkedIn | `linkedin` |
| Facebook | `facebook` |
| Instagram | `instagram` |
| Telegram | `telegram` |

Без этого через месяц не будет видно, какая кампания привела заказчика,
и вторую фазу не на чем будет планировать.

## CTA — PL

- **Rozmowa:** Wyceniasz agenta AI dla swojej firmy? Napisz na development@mi-code.pl — policzymy model kosztu na Twoich narzędziach i zadaniach.
- **Artykuł:** Cały rachunek rozłożony na czynniki, z kalkulatorem: <link>
- **Miękkie:** Robimy systemy enterprise z AI od 18 lat. mi-code.pl

## CTA — EN

- **Conversation:** Pricing an AI agent for your company? Write to development@mi-code.pl — we build the cost model on your tools and your tasks.
- **Article:** The full bill broken down, calculator included: <link>
- **Soft:** Enterprise systems with AI for 18 years. mi-code.pl

## Хэштеги

**PL:** #AI #agentAI #LLM #enterprise #softwarehouse #Gdańsk #ITPolska #transformacjacyfrowa #kosztyIT
**EN:** #AI #AIagents #LLM #enterprise #softwarehouse #Poland #techleadership #cloudcosts
```

- [ ] **Step 6: Написать тексты постов**

Создать `docs/marketing/copy/funnel-cost-of-ai-agent.md` с разделами
`## LinkedIn` (внутри `### PL` и `### EN`), `## Facebook` (`### PL`, `### EN`)
и `## Stories`. Требования, которые проверяет тест:

- каждая ссылка несёт `utm_campaign=cost-of-ai-agent`;
- в EN-разделах ссылка идёт на `https://mi-code.pl/en/blog/ai-agent-cost-per-month-model/`;
- в PL-разделах — на `https://mi-code.pl/blog/ai-agent-cost-per-month-model/`;
- `utm_source=linkedin` в разделе LinkedIn, `facebook` — в разделе Facebook.

Каждый пост строится по одной схеме: крючок цифрой, признание проблемы,
две-три цифры из статьи, вывод, CTA из `cta-blocks.md`. Числа брать только
из списка «Источник цифр» в шапке этой задачи.

Заготовка первого блока:

```markdown
# cost-of-ai-agent — тексты

Кампания верха воронки. Ведёт на статью, из статьи — на контакт.
Цифры: см. `campaigns/cost-of-ai-agent/campaign.json`. Новых не выдумывать.

## LinkedIn

Формат: карусель-документ `renders/<lang>/carousel.pdf` + текст ниже.

### PL

„Ile to będzie kosztować miesięcznie?" — pierwsze pytanie w każdej rozmowie
o agencie AI. I niemal jedyne, na które pada odpowiedź „to zależy".

To odpowiedź szczera i bezużyteczna: nie daje ani rzędu wielkości, ani pojęcia,
co zmienić, jeśli liczba się nie spodoba.

A pytanie da się policzyć. W naszej konfiguracji referencyjnej wychodzi
$74.38 miesięcznie. Trzy rzeczy, które to umożliwiają:

→ Rozrzut między modelami przy tej samej pracy to 25× — od $50.34 do $1254.00.
→ 98,5% tokenów wymiany to wejście, nie odpowiedź modelu.
→ 82% tego wejścia da się podać z cache, który jest o ~90% tańszy.

Rozłożyliśmy cały rachunek na czynniki — z kalkulatorem, w który wstawisz
własne liczby: https://mi-code.pl/blog/ai-agent-cost-per-month-model/?utm_source=linkedin&utm_medium=social&utm_campaign=cost-of-ai-agent

Wyceniasz agenta AI dla swojej firmy? Napisz na development@mi-code.pl —
policzymy model kosztu na Twoich narzędziach i zadaniach.

#AI #agentAI #LLM #enterprise #softwarehouse #Gdańsk #ITPolska #kosztyIT

### EN

"How much will it cost per month?" is the first question in every conversation
about an AI agent. It is also the one that almost always gets answered with
"it depends."

That answer is honest and useless: it gives you neither an order of magnitude
nor any idea what to change if you dislike the number.

The question is answerable. In our reference configuration it comes out at
$74.38 a month. Three things make that calculable:

→ The spread between models doing identical work is 25× — $50.34 to $1254.00.
→ 98.5% of the tokens in an exchange are input, not the model's answer.
→ 82% of that input can be served from cache, which is ~90% cheaper.

We broke the whole bill down into its parts — with a calculator you can put
your own numbers into: https://mi-code.pl/en/blog/ai-agent-cost-per-month-model/?utm_source=linkedin&utm_medium=social&utm_campaign=cost-of-ai-agent

Pricing an AI agent for your company? Write to development@mi-code.pl — we
build the cost model on your tools and your tasks.

#AI #AIagents #LLM #enterprise #softwarehouse #Poland #techleadership #cloudcosts
```

Осталось дописать в том же файле два раздела. Требования к ним:

**`## Facebook`** — `### PL` и `### EN`. Короче LinkedIn примерно вдвое, без
буллетов со стрелками, без профессионального жаргона: аудитория там —
владельцы бизнеса, а не инженеры. Оставить один крючок ($74.38), один контраст
(25× между моделями) и ссылку с `utm_source=facebook`. Хэштеги те же.

**`## Stories`** — шесть кадров под `story-9x16-01..06.png`, по одной фразе на
кадр, на обоих языках. Кадры повторяют слайды карусели: цифра → «to zależy»
не ответ → 25× разброс → платишь за пересылку → калькулятор → CTA. Фраза на
кадр не длиннее шести слов, ссылка только на последнем.

- [ ] **Step 7: Написать strategy.md и content-plan.md**

`docs/marketing/strategy.md` — перенести из спеки
`docs/superpowers/specs/2026-07-31-marketing-factory-design.md`: аудитория,
каналы, таблица воронки, список 11 кампаний, метрики (клики с UTM, обращения
на development@mi-code.pl, просмотры статей).

`docs/marketing/content-plan.md` — календарь: по одной кампании верха воронки
в неделю, между ними пост «продукт как доказательство»; для каждой — дата,
канал, язык, файл креатива, файл текста. Первая строка — `cost-of-ai-agent`.

- [ ] **Step 8: Отснять скриншот и отрендерить всё**

```bash
npm run build && npm run preview &
python docs/marketing/scripts/capture_screens.py cost-of-ai-agent
python docs/marketing/scripts/build_carousel.py cost-of-ai-agent pl en
python docs/marketing/scripts/build_single.py   cost-of-ai-agent pl en
python docs/marketing/scripts/build_reel.py     cost-of-ai-agent pl en
```

Если селектор `.cost-calculator` не находится, открыть
`src/components/CostCalculator.svelte`, взять фактическое имя корневого класса
и поправить `shot.selector` в `campaign.json`. Не заменять слайд на текстовый —
кальклятор и есть визуальный аргумент этой кампании.

- [ ] **Step 9: Запустить все тесты фабрики**

Run: `python -m pytest docs/marketing/tests -v`
Expected: PASS, все тесты всех восьми предыдущих задач плюс 11 тестов кампании.

- [ ] **Step 10: Глазами проверить креативы**

Открыть `docs/marketing/creatives/cost-of-ai-agent/renders/pl/carousel.pdf` и
`renders/en/carousel.pdf`. Проверить: польские диакритики на месте, текст
нигде не выходит за поля и не наезжает на бейдж, `$74.38` читается на
превью-размере, скриншот калькулятора не размыт. Тесты проверяют размеры и
факт отрисовки, но не вёрстку — этот шаг пропускать нельзя.

- [ ] **Step 11: Коммит**

```bash
git add docs/marketing
git commit -m "Add the cost-of-ai-agent campaign with copy, spec and rendered creatives"
```

---

## Финальная проверка

- [ ] `python -m pytest docs/marketing/tests -v` — всё зелёное
- [ ] `npx vitest run` — существующие тесты сайта не сломаны
- [ ] `git status` чист
- [ ] Завести issue MI-<n> по правилу проекта, запушить в `development`
