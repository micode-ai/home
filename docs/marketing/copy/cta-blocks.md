# CTA-блоки, хэштеги и UTM

Один источник правды для концовок постов. Не переписывать в каждом файле —
подставлять отсюда, чтобы контакт и домен нигде не разошлись.

Файл собран в два слоя. Всё, что выше раздела «CTA по кампаниям», одинаково
для всех двенадцати кампаний и меняется только вместе с компанией. Ниже —
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

### `accounting-ai`

Первая кампания **середины воронки**, поэтому и предложение другое: не «мы
посчитаем/соберём вам это», а «мы уже это построили — построим и на ваших
системах». Контакт, домен и UTM-схема — те же.

- **Rozmowa:** Potrzebujesz agenta wbudowanego w Twoje systemy i dane? Napisz na development@mi-code.pl.
- **Artykuł:** Cała architektura opisana od środka, ze schematami z wewnętrznej dokumentacji: `<link>`
- **Conversation:** Need an agent embedded in your own systems and data? Write to development@mi-code.pl.
- **Article:** The whole architecture from the inside, with the diagrams from our internal documentation: `<link>`
- **Хэштеги:** PL `#LangGraph #ksiegowosc #KSeF` · EN `#LangGraph #accounting #KSeF`

Оговорка этой кампании идёт вместе с цифрой: «до 82 narzędzi» — это максимум
(58 базовых плюс 15 и 9, включающиеся при настройке), а не типичное число, и
сам агент не заменяет бухгалтера. Подробнее — в шапке
`product-accounting-ai.md`.

### `legalka-kb`

Вторая кампания **середины воронки** и первая, публикуемая **одиночной
картинкой**. Предложение то же по форме, что у `accounting-ai` («мы это
построили — построим и у вас»), но с другим ключом: не «встроим агента в ваши
системы», а «база и модели остаются у вас». Контакт, домен и UTM-схема — те же.

Отдельная оговорка по соседству в ленте: `rag-without-hallucinations` ведёт на
**ту же статью** и выходит за девять дней до этой строки. Поэтому здесь не
повторяются ни `100%`, ни `109`, ни `≈99%`, ни `≈97%` — ни на слайдах, ни в
тексте поста. Ссылка на статью говорит, что качество измеряется, не называя
цифр повторно. Подробнее — в шапке `product-legalka-kb.md`.

- **Rozmowa:** Potrzebujesz asystenta, który odpowiada wyłącznie z Twojej bazy — i może stać na Twoim serwerze? Napisz na development@mi-code.pl.
- **Artykuł:** Cała architektura opisana od środka, ze wszystkimi schematami z wewnętrznej dokumentacji — razem z tym, jak mierzymy jakość odpowiedzi i z jakim wynikiem: `<link>`
- **Conversation:** Need an assistant that answers strictly from your own base — and can run on your own server? Write to development@mi-code.pl.
- **Article:** The whole architecture from the inside, with every diagram from our internal documentation — including how we measure answer quality and with what result: `<link>`
- **Хэштеги:** PL `#RAG #legaltech` · EN `#RAG #legaltech`

Оговорка этой кампании идёт вместе с цифрами: 60 дней — это **максимальный
интервал** между повторными проверками утверждения слоя «норма», а +90 дней —
**самая дальняя** дата годности факта слоя «практика». Обе цифры описывают
верхнюю границу процесса, а не свежесть каждой строки базы в моменте; и сам
Legalka KB — упорядоченные данные, а не юридическая консультация.

### `geo-aeo`

Единственная кампания, у которой адресат — **маркетинг-директор**, а не CTO
и не владелец бизнеса (`strategy.md`, строка `geo-aeo`). Поэтому предложение
формулируется в терминах видимости бренда, а не архитектуры: не «соберём вам
систему», а «посмотрим, как вы выглядите, когда за вас отвечает AI». Контакт,
домен и UTM-схема — те же.

- **Rozmowa:** Zastanawiasz się, jak Twoja marka wypada, gdy to AI odpowiada w Twoim imieniu? Napisz na development@mi-code.pl.
- **Artykuł:** Skąd się to wzięło, czym różni się od SEO i jak stosujemy to na wszystkich naszych stronach: `<link>`
- **Conversation:** Wondering how your brand shows up when an AI answers on your behalf? Write to development@mi-code.pl.
- **Article:** Where this came from, how it differs from SEO, and how we apply it across all our sites: `<link>`
- **Хэштеги:** PL `#GEO #AEO #marketing` · EN `#GEO #AEO`

Оговорка этой кампании идёт не с цифрой, а вместо неё, и она двойная. Первая
— авторская, из самой статьи: GEO и AEO — это не «взлом алгоритма», а
находимость и цитируемость. Вторая — про сам материал: **во всём теле статьи
на трёх языках ровно три числа, и все три это даты** (2022, 2023, 2024).
Долей рынка, процента zero-click-запросов и падения трафика там нет ни на
одном языке, поэтому их нет и в креативе; любая такая цифра была бы
выдуманной. Подробнее — в шапке `funnel-geo-aeo.md`.

### `accounting-automation-pl`

Кампания **верха воронки**, адресат — **владелец бизнеса в Польше** (третий
адресат этой фабрики после CTO и маркетинг-директора). Поэтому предложение не
про архитектуру и не про продукт: не «построим вам агента», а «посмотрим, что в
Ваших процессах вообще стоит отдавать». Контакт, домен и UTM-схема — те же.

Отдельная оговорка по соседству в ленте: `accounting-ai` ведёт на **ту же
статью** и выходит за двенадцать дней до этой строки, в ту же ленту LinkedIn.
Поэтому здесь не повторяется ни одна цифра, на которой построена та кампания
(`82`, `58`, `15`, `9`, `25`), и обложка не может быть количеством инструментов.
Единственное общее число — `15 000` — стоит здесь в другой роли: не как
иллюстрация того, что агент «сам сходит за данными», а как порог обязанности в
законе самого читателя. Как разведено — в шапке
`funnel-accounting-automation-pl.md`.

- **Rozmowa:** Chcesz przejrzeć swoje procesy pod kątem tego, co realnie warto oddać agentowi? Napisz na development@mi-code.pl.
- **Artykuł:** Jak to wygląda od środka, na naszym własnym agencie księgowym: `<link>`
- **Conversation:** Want to look at your own processes and see what is genuinely worth handing to an agent? Write to development@mi-code.pl.
- **Article:** What that looks like from the inside, on our own accounting agent: `<link>`
- **Хэштеги:** PL `#ksiegowosc #KSeF #automatyzacja` · EN `#accounting #KSeF #automation`

Оговорка этой кампании идёт вместе с цифрой: 15 000 zł — это **порог платежа,
начиная с которого закон требует проверки по «Белому списку»** (ст. 117ba
Ordynacji podatkowej), а не цена, не лимит продукта и не наша метрика. Пропуск
проверки грозит потерей права отнести расход в затраты. И сам агент не заменяет
ни бухгалтера, ни налогового консультанта — граница проходит там, где нужна
оценка и подпись, и колода говорит об этом отдельным слайдом.

### `self-improving-agents`

Кампания **верха воронки**, последняя в исходном плане этого трека (после неё
добавлена `ai-act-2026`); адресат — **tech-лид**
(четвёртый адресат фабрики после CTO, маркетинг-директора и владельца бизнеса).
Регистр самый технический из всех кампаний, поэтому предложение не «внедрим вам
AI», а «начнём с одного агента, одной заметки и одной привычки» — минимальная
рабочая версия из финала статьи. Это же снимает главное возражение адресата:
подход не требует ни большой модели, ни большого внедрения. Контакт, домен и
UTM-схема — те же.

Пересечений по источнику нет: `self-improving-agent-teams` не используется ни
одной из шести отгруженных кампаний, так что ни одна цифра и ни одна схема этой
колоды не заняты соседней строкой календаря.

- **Rozmowa:** Chcesz zacząć od jednego agenta, jednej notatki i jednego nawyku? Napisz na development@mi-code.pl.
- **Artykuł:** Skąd wzięła się ta idea, jak wygląda pętla w środku i jak nie zamienić tego w kosztowny bałagan: `<link>`
- **Conversation:** Want to start with one agent, one note and one habit? Write to development@mi-code.pl.
- **Article:** Where the idea comes from, what the loop looks like inside, and how to keep it from becoming an expensive mess: `<link>`
- **Хэштеги:** PL `#AIagents #LLMOps #automatyzacja #techlead` · EN `#AIagents #LLMOps #automation #techleadership`

Оговорка этой кампании идёт вместе с цифрой: **2025 — это год разговора**, в
котором Andrej Karpathy назвал недостающий элемент (непрерывное обучение и
постоянная память), а не метрика, не доля и не результат какого-либо измерения.
Вторая оговорка обязательна и идёт в самом посте: подход **стоит токенов**,
выход **недетерминирован**, и он требует дисциплины ревью — без неё предложения
копятся, а ценность петли утекает. Статья говорит всё это прямо, и креатив
обязан говорить так же.

### `ai-act-2026`

Кампания **верха воронки**, шестая в этом треке; адресат — **владелец бизнеса
или руководитель, у которого уже есть чат-бот и AI-контент** (пятый адресат
фабрики после CTO, маркетинг-директора, владельца бизнеса и tech-лида). От
«владельца бизнеса» строки 8 отличается вопросом: там «что стоит отдать
агенту», здесь «за что могут оштрафовать». Поэтому предложение сознательно
узкое: не «приведём вас в соответствие с AI Act» — на это нужен юрист, — а
«проверим чат-бота и тексты с технической стороны». Контакт, домен и UTM-схема
— те же.

Пересечений по источнику нет: статью `ai-act-sierpien-2026-co-obowiazuje` не
использует ни одна из семи предыдущих кампаний, так что ни одна цифра и ни одна
картинка этой колоды не заняты соседней строкой календаря.

- **Rozmowa:** Masz chatbota albo publikujesz treści generowane przez AI i nie wiesz, czy od strony technicznej jesteś w porządku? Napisz na development@mi-code.pl.
- **Artykuł:** Co przesunięto, co obowiązuje od dziś i sześć kroków na ten kwartał: `<link>`
- **Conversation:** Running a chatbot or publishing AI-generated content and unsure whether you are sound on the technical side? Write to development@mi-code.pl.
- **Article:** What moved, what applies today, and six steps for this quarter: `<link>`
- **Хэштеги:** PL `#AIAct #compliance #chatbot` · EN `#AIAct #compliance #chatbot`

Оговорка этой кампании двойная, и обе половины обязательны в самом посте.
Первая: **это не юридическая консультация** — статья говорит это прямо, отдельным
разделом, и креатив не имеет права звучать иначе. Вторая: **даты уже менялись
один раз**, за три недели до публикации статьи, поэтому и колода, и посты
называют источник (Digital Omnibus, рег. 2026/1744), а не только вывод. Отдельно
про суммы: 15 и 35 млн евро — это пороги **из регламента**, а не оценка чьего-либо
риска, и формулировать их как «вам грозит» нельзя.
