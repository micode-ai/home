# Контент-план

Ритм: одна кампания верха воронки в неделю, между ними — пост «продукт как
доказательство».

**Правило дней недели действует для LinkedIn**, где обе категории делят одну
ленту: верх воронки — вторник, продукт — четверг. У кампании остаётся два дня
на первую волну кликов, прежде чем лента получит следующий пост от того же
отправителя. Facebook, Instagram-фид и Stories правило «вторник/четверг» не
занимают просто потому, что это другие ленты и другая аудитория: пост туда
ничего не отнимает у следующего поста в LinkedIn. Уровень воронки тут ни при
чём — строки 2 и 3 действительно пересобирают ту же кампанию верха на другой
площадке в ту же неделю, а строки 9 и 11 — это продуктовые посты (`середина`),
которые ничего не пересобирают; освобождены от правила все четыре одинаково и
по одной и той же причине.

Проверено расчётом дат, а не на глаз: каждая строка LinkedIn ниже действительно
попадает на нужный день недели (см. `tests/test_content_plan.py` — он парсит
эту таблицу и падает, если дата разъедется с уровнем воронки).

Языки в один день не разводятся: PL и EN — это разные аудитории одной ленты
LinkedIn, а не два поста подряд для одних и тех же людей. PL идёт с
`renders/pl/`, EN — с `renders/en/`.

Даты — план, а не обязательство. Что не сдвигается — порядок: `cost-of-ai-agent`
идёт первой, потому что это единственная полностью отрендеренная кампания и на
ней проверяется, работает ли схема вообще.

## Расписание

| # | Дата | День | Кампания | Уровень | Канал | Язык | Креатив | Текст |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-08-04 | вт | `cost-of-ai-agent` | верх | LinkedIn (карусель) | PL + EN | `creatives/cost-of-ai-agent/renders/{pl,en}/carousel.pdf` | `copy/funnel-cost-of-ai-agent.md` → `## LinkedIn` |
| 2 | 2026-08-06 | чт | `cost-of-ai-agent` | верх | Facebook + Instagram фид | PL | `creatives/cost-of-ai-agent/renders/pl/feed-4x5.png` | `copy/funnel-cost-of-ai-agent.md` → `## Facebook` |
| 3 | 2026-08-07 | пт | `cost-of-ai-agent` | верх | Stories + Reels | PL | `creatives/cost-of-ai-agent/renders/pl/story-9x16-01..06.png`, `reel.mp4` | `copy/funnel-cost-of-ai-agent.md` → `## Stories` |
| 4 | 2026-08-11 | вт | `rag-without-hallucinations` | верх | LinkedIn (карусель) | PL + EN | `creatives/rag-without-hallucinations/renders/{pl,en}/carousel.pdf` | `copy/funnel-rag-without-hallucinations.md` → `## LinkedIn` |
| 5 | 2026-08-13 | чт | `accounting-ai` | середина | LinkedIn (карусель) | PL | `creatives/accounting-ai/renders/pl/carousel.pdf` | `copy/product-accounting-ai.md` |
| 6 | 2026-08-18 | вт | `geo-aeo` | верх | LinkedIn (карусель) | PL + EN | `creatives/geo-aeo/renders/{pl,en}/carousel.pdf` | `copy/funnel-geo-aeo.md` |
| 7 | 2026-08-20 | чт | `legalka-kb` | середина | LinkedIn (одиночный) | PL | `creatives/legalka-kb/renders/pl/li-single.png` | `copy/product-legalka-kb.md` |
| 8 | 2026-08-25 | вт | `accounting-automation-pl` | верх | LinkedIn (карусель) | PL | `creatives/accounting-automation-pl/renders/pl/carousel.pdf` | `copy/funnel-accounting-automation-pl.md` |
| 9 | 2026-08-27 | чт | `emarketing-ai` | середина | Facebook + Instagram фид | PL | `creatives/emarketing-ai/renders/pl/feed-4x5.png` | `copy/product-emarketing-ai.md` |
| 10 | 2026-09-01 | вт | `self-improving-agents` | верх | LinkedIn (карусель) | PL + EN | `creatives/self-improving-agents/renders/{pl,en}/carousel.pdf` | `copy/funnel-self-improving-agents.md` |
| 11 | 2026-09-03 | чт | `budget-assistant` | середина | Stories + Reels | PL | `creatives/budget-assistant/renders/pl/reel.mp4` | `copy/product-budget-assistant.md` |
| 12 | 2026-09-10 | чт | `testing-ai` | середина | LinkedIn (одиночный) | PL + EN | `creatives/testing-ai/renders/{pl,en}/li-single.png` | `copy/product-testing-ai.md` |
| 13 | 2026-09-17 | чт | `ngx-chat` | середина | LinkedIn (карусель) | EN | `creatives/ngx-chat/renders/en/carousel.pdf` | `copy/product-ngx-chat.md` |

Кампаний верха воронки пять, продуктовых — шесть. Поэтому в неделях 2–5
(строки 4–11) пара «вторник верх / четверг продукт» полная, а в неделях 6–7
(строки 12–13) верха уже не осталось — там только продуктовый четверг. Это не
пропуск в плане: одиннадцатая кампания заканчивается раньше, чем календарь.

Строки 1–6 готовы к публикации. Строки 7–13 — план: `campaign.json` и тексты
для них ещё не написаны.

Строка 6 (`geo-aeo`) — первая кампания, адресованная **маркетинг-директорам**, а
не CTO. Уровень воронки прежний (верх), но регистр другой: меньше архитектуры,
больше последствий. Как и строка 4, она стоит только в LinkedIn, поэтому в её
`copy/funnel-geo-aeo.md` есть только раздел `## LinkedIn`.

Строка 5 (`accounting-ai`) стоит в календаре **только на PL**, но `campaign.json`
и рендеры у неё двуязычные: `scripts/spec.py` требует `pl` и `en` на каждом
слайде, а `tests/test_campaigns.py` — оба языковых блока в файле текстов и
полный комплект рендеров в `renders/en/`. Ослаблять валидатор ради одной
строки календаря — это изменение фабрики в угоду частному случаю; готовый EN
ничего не стоит и ждёт своего слота.

Кампания `rag-without-hallucinations` (строка 4) стоит только в LinkedIn, и
её `copy/funnel-rag-without-hallucinations.md` содержит только раздел
`## LinkedIn` — это не пропуск: `tests/test_campaigns.py` выводит список
обязательных разделов файла текстов из **этой таблицы**, так что появление
строки с Facebook или Stories для кампании сразу потребует и соответствующего
раздела в текстах. Остальные форматы (`feed-4x5`, `story-9x16`, `reel`, `og`)
для неё отрендерены и лежат в репозитории — не хватает только слота в
календаре.

Оговорка про «фазу 2 механическая, кода она не требует»: для верха воронки это
подтвердилось — кампания 2 не потребовала ни строчки нового кода в
`scripts/`, кроме одного нового поля `source` в `spec.py`, добавленного
намеренно, чтобы кампания 12 его тоже не потребовала. Для середины воронки
(строки 5, 7, 9, 11, 12, 13) это подтвердилось **наполовину**. Строка 5 не
потребовала ни строчки в `scripts/` — картинку решил выбор снимка, а не код
(см. блок про слайд `diagram` в `strategy.md`), — но потребовала правки в
`tests/test_campaigns.py`, который в имени файла текстов знал только
`funnel-`. Это была не подгонка теста под кампанию: `README.md` объявляет
`product-<id>.md` для всех шести продуктовых строк, так что сломались бы они
все одинаково. Строки 7, 9, 11, 12 и 13 кода уже не требуют.

`ngx-chat` идёт только на EN намеренно: продукт — опенсорсная библиотека,
её аудитория живёт в англоязычном GitHub, а не в польском LinkedIn.

## Что делать после публикации

Сверять раз в неделю по `utm_campaign` и `utm_source` — какая кампания и
какой канал дали клики. Метрики и что именно считаем — в `strategy.md`.

Обращения на `development@mi-code.pl` UTM-метку не переносят, поэтому в
первом ответе спрашиваем, откуда пришли. Без этого верх воронки нечем
связать с лидом, и вторая фаза планируется вслепую.

## Регенерация креативов кампании

```bash
npm run build && npm run preview            # нужен только если у кампании есть слайд diagram
python docs/marketing/scripts/capture_screens.py <id>
python docs/marketing/scripts/build_carousel.py <id> pl en
python docs/marketing/scripts/build_single.py   <id> pl en
python docs/marketing/scripts/build_reel.py     <id> pl en
```

Подробности — в `README.md`.
