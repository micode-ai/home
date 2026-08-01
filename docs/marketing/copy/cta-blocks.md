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

`utm_medium` всегда `social` — этот набор каналов целиком социальный, и
разделять их нужно по `utm_source`, а не по `medium`.

Ссылку не собирают руками: `spec.Campaign.link(lang, source)` в
`scripts/spec.py` делает это из `target` кампании и сам вставляет префикс
`/en/` для английской версии. Проверить, что получится:

```bash
python -c "import sys; sys.path.insert(0, 'docs/marketing/scripts'); \
import spec; c = spec.Campaign.load('cost-of-ai-agent'); \
print(c.link('pl', 'linkedin')); print(c.link('en', 'linkedin'))"
```

Без атрибуции через месяц не будет видно, какая из кампаний привела
заказчика, и вторую фазу не на чем будет планировать.

## Языки и адреса

- PL — `https://mi-code.pl/...`
- EN — `https://mi-code.pl/en/...`

Русской версии в кампаниях нет: рынок — Польша, второй язык нужен для
LinkedIn и зарубежных лидов.

## CTA — PL

- **Rozmowa:** Wyceniasz agenta AI dla swojej firmy? Napisz na development@mi-code.pl — policzymy model kosztu na Twoich narzędziach i zadaniach.
- **Artykuł:** Cały rachunek rozłożony na czynniki, z kalkulatorem: `<link>`
- **Miękkie:** 18+ lat doświadczenia w IT: systemy enterprise i AI. mi-code.pl

## CTA — EN

- **Conversation:** Pricing an AI agent for your company? Write to development@mi-code.pl — we build the cost model on your tools and your tasks.
- **Article:** The full bill broken down, calculator included: `<link>`
- **Soft:** 18+ years of IT experience: enterprise systems and AI. mi-code.pl

Контакт везде один — `development@mi-code.pl`. Домен в креативах и в мягком
CTA пишется без схемы: `mi-code.pl`.

Мягкий CTA говорит про опыт основателя (18+ лет в IT), а не про возраст
компании: MiCode основана в 2024 году, и формулировка «делаем это 18 лет»
была бы неправдой — см. `src/data/pl.json` → `company.foundedNote`
(«Firma założona w 2024 roku przez inżyniera z 18-letnim doświadczeniem w IT»).

## Хэштеги

**PL:** #AI #agentAI #LLM #enterprise #softwarehouse #Gdańsk #ITPolska #transformacjacyfrowa #kosztyIT
**EN:** #AI #AIagents #LLM #enterprise #softwarehouse #Poland #techleadership #cloudcosts

В пост идут 6–8 из списка, не все сразу. Первые четыре — тематические, они
обязательны; остальные добираются под аудиторию конкретного канала.
