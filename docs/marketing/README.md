# Маркетинговая фабрика mi-code.pl

Повторяемое производство рекламных креативов для B2B-лидов mi-code.pl:
LinkedIn-карусели, одиночные посты, фид 4:5, Reels/Stories 9:16 и OG-карточки.
Полная стратегия — в `docs/superpowers/specs/2026-07-31-marketing-factory-design.md`.

Один campaign.json описывает кампанию один раз, генераторы рендерят его в
любой холст — так же, как `products.json` на самом сайте управляет страницами
продуктов вместо захардкоженной разметки.

## Структура

```
docs/marketing/
├── README.md              как всё устроено + команды регенерации
├── strategy.md            аудитория, каналы, воронка, метрики
├── content-plan.md        календарь: что / где / когда публикуем
├── campaigns/
│   └── <id>/campaign.json источник правды по кампании
├── copy/
│   ├── funnel-<slug>.md   × 5  тексты верха воронки (PL/EN)
│   ├── product-<id>.md    × 6  тексты «продукт как доказательство»
│   └── cta-blocks.md      CTA, хэштеги, UTM-метки
├── creatives/<id>/
│   ├── src/               исходные скриншоты сайта
│   └── renders/{pl,en}/   carousel-01..N + carousel.pdf, li-single,
│                          feed-4x5, story-9x16, reel.mp4/gif, og.png
├── assets/
│   ├── micode-badge.png   копия из репо приложения
│   └── fonts/             Poppins + Open Sans (.ttf)
└── scripts/
    ├── fetch_fonts.py
    ├── brand.py
    ├── build_carousel.py
    ├── build_single.py
    ├── build_reel.py
    └── capture_screens.py
```

На момент этого коммита реализован только каркас: `assets/fonts/`,
`assets/micode-badge.png`, `scripts/fetch_fonts.py` и тесты в `tests/`.
`brand.py` и генераторы — предмет последующих задач.

## Регенерация

Полный пайплайн для одной кампании — четыре команды:

```bash
python docs/marketing/scripts/capture_screens.py cost-of-ai-agent
python docs/marketing/scripts/build_carousel.py cost-of-ai-agent pl en
python docs/marketing/scripts/build_single.py   cost-of-ai-agent pl en
python docs/marketing/scripts/build_reel.py     cost-of-ai-agent pl
```

Шрифты и бейдж регенерировать не нужно — они закоммичены (см. ниже) и
скачиваются один раз через `python docs/marketing/scripts/fetch_fonts.py`.

## Шрифты коммитятся намеренно

`assets/fonts/` **намеренно** лежит в git, а не игнорируется и не качается на
каждом запуске сборки. Сайт подтягивает Poppins и Open Sans с CDN Google
Fonts в рантайме — креативам это не подходит: рендер должен быть одинаковым
и на машине разработчика, и на CI-раннере (обычно Linux) без сети. Скрипты
также никогда не должны обращаться к `C:/Windows/Fonts` или любому другому
системному пути — такого пути нет ни на Linux, ни в CI.

Файлы шрифтов и лицензии OFL лежат рядом в `assets/fonts/`:

- `Poppins-Bold.ttf`, `Poppins-SemiBold.ttf` — заголовки (`--font-heading` на
  сайте)
- `OpenSans-Regular.ttf`, `OpenSans-SemiBold.ttf` — текст (`--font-body` на
  сайте)
- `Poppins-OFL.txt`, `OpenSans-OFL.txt` — лицензии SIL Open Font License,
  допускающие распространение шрифтов вместе с репозиторием

Open Sans в `google/fonts` не публикуется статическими начертаниями
(`ofl/opensans/static/` отсутствует) — только вариативным файлом
`OpenSans[wdth,wght].ttf`. `fetch_fonts.py` скачивает вариативный шрифт и
через `fontTools` фиксирует нужные инстансы (`Regular`, `SemiBold`) в
отдельные статические `.ttf`, пригодные для `PIL.ImageFont.truetype`.

Чтобы перекачать шрифты заново (например, после апдейта апстрима):

```bash
python docs/marketing/scripts/fetch_fonts.py
```
