# CTA-блоки, хэштеги и UTM

Один источник правды для концовок постов. Не переписывать в каждом файле —
подставлять отсюда, чтобы контакт и домен нигде не разошлись.

Файл собран в два слоя. Всё, что выше раздела «CTA по кампаниям», одинаково
для всех одиннадцати кампаний и меняется только вместе с компанией. Ниже —
по блоку на кампанию: меняется формулировка предложения, но не контакт, не
домен и не UTM-схема. Первая версия этого файла была целиком написана под
`cost-of-ai-agent` («Wyceniasz agenta AI…», «z kalkulatorem»), поэтому второй
кампании нечего было отсюда взять — и она завела бы свою концовку, ровно ту
расходимость, ради предотвращения которой файл существует.
`tests/test_campaigns.py::test_cta_blocks_carries_a_block_for_this_campaign`
требует блок на каждую кампанию из `campaigns/`.

## UTM-схема

Каждая ссылка из поста:

`<url>?utm_source=<канал>&utm_medium=social&utm_campaign=<id кампании>`

| Канал | `utm_source` |
|---|---|
| LinkedIn | `linkedin` |
| Facebook | `facebook` |
| Instagram | `instagram` |
| Telegram | `telegram` |

`utm_medium` всегда `social` — этот набор каналов целиком социальный, и
разделять их нужно по `utm_source`, а не по `medium`.

Ссылку не собирают руками: `spec.Campaign.link(lang, source)` в
`scripts/spec.py` делает это из `target` кампании и сам вставляет префикс
`/en/` для английской версии. Проверить, что получится:

```bash
python -c "import sys; sys.path.insert(0, 'docs/marketing/scripts'); \
import spec; c = spec.Campaign.load('rag-without-hallucinations'); \
print(c.link('pl', 'linkedin')); print(c.link('en', 'linkedin'))"
```

Тест сверяет каждую ссылку в `copy/funnel-<id>.md` с тем, что вернул бы
`link()` для того раздела, под которым она стоит, — так что вручную
подправленная ссылка падает, а не тихо уезжает в чужую корзину атрибуции.

Без атрибуции через месяц не будет видно, какая из кампаний привела
заказчика, и вторую фазу не на чем будет планировать.

## Языки и адреса

- PL — `https://mi-code.pl/...`
- EN — `https://mi-code.pl/en/...`

Русской версии в кампаниях нет: рынок — Польша, второй язык нужен для
LinkedIn и зарубежных лидов.

## Контакт, домен и мягкий CTA

Контакт везде один — `development@mi-code.pl`. Домен в креативах и в мягком
CTA пишется без схемы: `mi-code.pl`. Оба зашиты в `brand.CONTACT` и
`brand.SITE`, и слайд `cta` печатает контакт сам.

- **Мягкий CTA — PL:** 18+ lat doświadczenia w IT: systemy enterprise i AI. mi-code.pl
- **Мягкий CTA — EN:** 18+ years of IT experience: enterprise systems and AI. mi-code.pl

Мягкий CTA говорит про опыт основателя (18+ лет в IT), а не про возраст
компании: MiCode основана в 2024 году, и формулировка «делаем это 18 лет»
была бы неправдой — см. `src/data/pl.json` → `company.foundedNote`
(«Firma założona w 2024 roku przez inżyniera z 18-letnim doświadczeniem w IT»).

## Хэштеги

Базовый набор, общий для всех кампаний:

**PL:** #AI #LLM #enterprise #softwarehouse #Gdańsk #ITPolska #transformacjacyfrowa
**EN:** #AI #LLM #enterprise #softwarehouse #Poland #techleadership

В пост идут 6–8 тегов: 3–4 базовых плюс тематические из блока кампании.
Первым всегда `#AI`.

## CTA по кампаниям

Формат один и тот же: **Rozmowa / Conversation** — прямое предложение с
контактом; **Artykuł / Article** — ссылка на материал (`<link>` подставляет
`spec.Campaign.link`); тематические хэштеги сверх базового набора.

### `cost-of-ai-agent`

- **Rozmowa:** Wyceniasz agenta AI dla swojej firmy? Napisz na development@mi-code.pl — policzymy model kosztu na Twoich narzędziach i zadaniach.
- **Artykuł:** Cały rachunek rozłożony na czynniki, z kalkulatorem: `<link>`
- **Conversation:** Pricing an AI agent for your company? Write to development@mi-code.pl — we build the cost model on your tools and your tasks.
- **Article:** The full bill broken down, calculator included: `<link>`
- **Хэштеги:** PL `#agentAI #kosztyIT` · EN `#AIagents #cloudcosts`

### `rag-without-hallucinations`

- **Rozmowa:** Potrzebujesz asystenta, który odpowiada wyłącznie z Twoich danych? Napisz na development@mi-code.pl.
- **Artykuł:** Cała architektura opisana od środka, ze wszystkimi schematami z wewnętrznej dokumentacji: `<link>`
- **Conversation:** Need an assistant that answers strictly from your own data? Write to development@mi-code.pl.
- **Article:** The whole architecture from the inside, with every diagram from our internal documentation: `<link>`
- **Хэштеги:** PL `#RAG #legaltech` · EN `#RAG #legaltech`

Оговорка этой кампании идёт вместе с цифрой: 100% — это воздержание на
вопросах вне базы, а не непогрешимость. Подробнее — в шапке
`funnel-rag-without-hallucinations.md`.
