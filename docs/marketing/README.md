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

На момент этого коммита реализованы весь `scripts/` (`spec.py`, `brand.py`,
`fetch_fonts.py`, `capture_screens.py` и все три генератора —
`build_carousel.py`, `build_single.py`, `build_reel.py`), `assets/fonts/`,
`assets/micode-badge.png` и полный набор тестов под `tests/`, а также
`strategy.md`, `content-plan.md` и первая настоящая кампания —
`cost-of-ai-agent`: `campaigns/cost-of-ai-agent/campaign.json`, тексты
`copy/funnel-cost-of-ai-agent.md` + `copy/cta-blocks.md` и все пять форматов
в `creatives/cost-of-ai-agent/renders/{pl,en}/`. Остальные 10 кампаний из
`strategy.md` — следующая фаза; кода она не требует, только `campaign.json`
и файл в `copy/`.

Рендеры лежат в git намеренно. Во-первых, `tests/test_campaign_<id>.py`
проверяет, что они существуют и имеют нужный размер, — иначе набор тестов
краснеет на чистом клоне. Во-вторых, это и есть тот файл, который оператор
загружает в LinkedIn: пересобрать его можно только подняв `npm run build &&
npm run preview` и headless-браузер, а фабрика существует ровно для того,
чтобы этого не требовалось перед каждой публикацией. Цена — около 11 МБ на
кампанию (из них ~2,7 МБ — `reel.mp4` + `reel.gif`); на 11 кампаний это
~120 МБ, и к этому решению стоит вернуться до того, как приземлятся
оставшиеся десять.

## Установка

Все Python-скрипты фабрики и её тесты используют один и тот же набор
зависимостей, зафиксированный в `docs/marketing/requirements.txt`:

```bash
pip install -r docs/marketing/requirements.txt
python -m playwright install chromium
```

Второй шаг обязателен отдельно: `pip install playwright` ставит только
Python-библиотеку, но не сам браузер — без `playwright install chromium`
`capture_screens.py` упадёт уже при попытке запустить браузер.

`imageio-ffmpeg` и `av` пиновать нужно оба, но не по одной и той же причине:
`build_reel.py` пишет `reel.mp4`/`reel.gif` через `imageio-ffmpeg` (это его
реальный продакшен-бэкенд для записи), а `av` нужен только тестам —
`tests/test_build_reel.py` читает записанное видео обратно через
`iio.imread(mp4, plugin="pyav")`, чтобы проверить содержимое кадров. Если
отсутствует `imageio-ffmpeg` (или оба пакета сразу), это не падает с понятным
"нет видеобэкенда" — `imageio.mimwrite` либо бросает `TypeError` про
неподходящий плагин, либо (если нет ни `imageio-ffmpeg`, ни `av`) падает с
непрозрачной ошибкой из `TiffWriter`, никак не намекающей, что дело в
отсутствующем видеобэкенде. Держите в голове эту ошибку, если она всплывёт —
решение не в том, чтобы поставить `imageio[pyav]` вместо `imageio-ffmpeg`;
он покрывает только путь для тестового чтения, а не запись, которую делает
`build_reel.py`.

## Скриншоты (`capture_screens.py`)

Диаграммы LangGraph на страницах продуктов рисует mermaid прямо в браузере —
никакого статического файла для копирования не существует, поэтому съёмка
экрана headless-браузером — единственный способ получить исходник для
`diagram`-слайдов.

Перед запуском нужно поднять собранный сайт локально (не dev-сервер — сборку,
как её увидит реальный посетитель):

```bash
npm run build && npm run preview
python docs/marketing/scripts/capture_screens.py cost-of-ai-agent
```

Съёмка нужна не всем кампаниям — только тем, у которых хотя бы один слайд
типа `diagram` объявляет в `campaign.json` блок `shot` (`path` и опциональный
`selector`). `capture_screens.py` берёт такие слайды через
`shots_for(campaign)`, открывает `{base_url}{path}` для каждого, при наличии
`selector` дожидается элемента через `page.wait_for_selector` (mermaid
дорисовывает диаграмму уже после гидратации страницы, поэтому нужен именно
селектор, а не фиксированная пауза) и сохраняет скриншот элемента — либо
всей страницы, если `selector` не задан — в
`creatives/<id>/src/<имя файла из "asset">`. Кампания без единого
`diagram`-слайда с `shot` не требует запуска этого скрипта вовсе.

`asset` и `shot` можно объявить **внутри языкового блока** `pl`/`en` слайда —
приоритет тот же, что у `rows`: язык перебивает уровень слайда, уровень слайда
остаётся фолбэком (по каждому ключу отдельно). Это нужно, когда снимаемая
страница рисует собственный текст: таблица калькулятора в статье берёт
заголовки и подписи строк из словарей `src/data/{pl,en}.json`, поэтому один
общий скриншот положил бы польскую таблицу на английский слайд. Пример —
слайд `diagram` в `campaigns/cost-of-ai-agent/campaign.json`: `pl` снимает
`/blog/…`, `en` — `/en/blog/…`, в два разных файла. Одинаковые по итогу
съёмки схлопываются, так что языконезависимая диаграмма (mermaid-граф) по-
прежнему стоит ровно одного захода браузера и одного файла.

Состояние страницы задаётся query-строкой прямо в `shot.path`: у калькулятора
`src/services/costEstimateUrl.ts` восстанавливает все ~12 полей из URL
(ключи camelCase: `stepsMin`, `stepsMax`, `cachedSharePct`, `model`,
`euResidency`, …). Без этого снимок показал бы дефолт компонента, а не
конфигурацию, о которой говорит статья.

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
