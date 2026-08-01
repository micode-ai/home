# Контент-план

Ритм: одна кампания верха воронки в неделю, между ними — пост «продукт как
доказательство». Верх воронки выходит во вторник, продукт — в четверг: у
кампании остаётся два дня на первую волну кликов, прежде чем лента получит
следующий пост от того же отправителя.

Языки в один день не разводятся: PL и EN — это разные аудитории одной ленты
LinkedIn, а не два поста подряд для одних и тех же людей. PL идёт с
`renders/pl/`, EN — с `renders/en/`.

Даты — план, а не обязательство. Что не сдвигается — порядок: `cost-of-ai-agent`
идёт первой, потому что это единственная полностью отрендеренная кампания и на
ней проверяется, работает ли схема вообще.

## Расписание

| # | Дата | Кампания | Уровень | Канал | Язык | Креатив | Текст |
|---|---|---|---|---|---|---|---|
| 1 | 2026-08-04 | `cost-of-ai-agent` | верх | LinkedIn (карусель) | PL + EN | `creatives/cost-of-ai-agent/renders/{pl,en}/carousel.pdf` | `copy/funnel-cost-of-ai-agent.md` → `## LinkedIn` |
| 2 | 2026-08-06 | `cost-of-ai-agent` | верх | Facebook + Instagram фид | PL | `creatives/cost-of-ai-agent/renders/pl/feed-4x5.png` | `copy/funnel-cost-of-ai-agent.md` → `## Facebook` |
| 3 | 2026-08-07 | `cost-of-ai-agent` | верх | Stories + Reels | PL | `creatives/cost-of-ai-agent/renders/pl/story-9x16-01..06.png`, `reel.mp4` | `copy/funnel-cost-of-ai-agent.md` → `## Stories` |
| 4 | 2026-08-11 | `accounting-ai` | середина | LinkedIn (карусель) | PL | `creatives/accounting-ai/renders/pl/carousel.pdf` | `copy/product-accounting-ai.md` |
| 5 | 2026-08-13 | `rag-without-hallucinations` | верх | LinkedIn (карусель) | PL + EN | `creatives/rag-without-hallucinations/renders/{pl,en}/carousel.pdf` | `copy/funnel-rag-without-hallucinations.md` |
| 6 | 2026-08-18 | `legalka-kb` | середина | LinkedIn (одиночный) | PL | `creatives/legalka-kb/renders/pl/li-single.png` | `copy/product-legalka-kb.md` |
| 7 | 2026-08-20 | `geo-aeo` | верх | LinkedIn (карусель) | PL + EN | `creatives/geo-aeo/renders/{pl,en}/carousel.pdf` | `copy/funnel-geo-aeo.md` |
| 8 | 2026-08-25 | `emarketing-ai` | середина | Facebook + Instagram фид | PL | `creatives/emarketing-ai/renders/pl/feed-4x5.png` | `copy/product-emarketing-ai.md` |
| 9 | 2026-08-27 | `accounting-automation-pl` | верх | LinkedIn (карусель) | PL | `creatives/accounting-automation-pl/renders/pl/carousel.pdf` | `copy/funnel-accounting-automation-pl.md` |
| 10 | 2026-09-01 | `budget-assistant` | середина | Stories + Reels | PL | `creatives/budget-assistant/renders/pl/reel.mp4` | `copy/product-budget-assistant.md` |
| 11 | 2026-09-03 | `self-improving-agents` | верх | LinkedIn (карусель) | PL + EN | `creatives/self-improving-agents/renders/{pl,en}/carousel.pdf` | `copy/funnel-self-improving-agents.md` |
| 12 | 2026-09-08 | `testing-ai` | середина | LinkedIn (одиночный) | PL + EN | `creatives/testing-ai/renders/{pl,en}/li-single.png` | `copy/product-testing-ai.md` |
| 13 | 2026-09-10 | `ngx-chat` | середина | LinkedIn (карусель) | EN | `creatives/ngx-chat/renders/en/carousel.pdf` | `copy/product-ngx-chat.md` |

Строки 1–3 готовы к публикации. Строки 4–13 — план: `campaign.json` и тексты
для них ещё не написаны, это следующая фаза (по спеке — механическая, кода
она не требует).

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
