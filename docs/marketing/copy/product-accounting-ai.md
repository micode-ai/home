# accounting-ai — тексты

Кампания **середины воронки** («продукт как доказательство»), первая из шести.
Ведёт на статью `accounting-ai-agent-architecture`, из статьи — на контакт
`development@mi-code.pl`. Подача не «купите продукт», а «мы это построили —
построим и вам»: боль → что построили → архитектура → цифры → CTA.

Цифры: см. `campaigns/accounting-ai/campaign.json` → `source.figures`. Новых не
выдумывать — всё, что стоит в постах, должно дословно стоять в статье;
`tests/test_campaigns.py` сканирует и слайды, и публикуемую прозу ниже.
Ссылки собраны `spec.Campaign.link()`, схема — в `cta-blocks.md`.

## Что именно измеряет каждая цифра

Тест ловит выдуманное число, но **не** ловит правильное число с неправильной
подписью — именно на этом кампания 2 и споткнулась. Поэтому явно:

- **82** — это **максимум**, а не типичное количество: 58 базовых + 15 кадровых
  + 9 для KSeF, причём последние два набора включаются, только если у
  пользователя настроены соответствующие возможности. Формулировка «до 82»
  обязательна, «82 инструмента» — уже неправда.
- **58** — то, что есть у каждого пользователя всегда.
- **15** — набор для кадров и зарплаты; **9** — набор для KSeF.
- **25** — жёсткий предохранитель на число шагов цикла «рассуждение → действие»
  в одном запросе, а не среднее и не лимит инструментов.
- **15 000 zł** — порог платежа, начиная с которого польский закон требует
  проверки счёта контрагента по «Белому списку» МФ. Это требование закона, а не
  настройка продукта.
- **117** — номер статьи (art. 117ba Ordynacji podatkowej), а не количество.
- **GPT-4o** — модель только для распознавания чеков (зрение). Диалоговый агент
  работает на ключе пользователя у OpenAI или Google Gemini.

## Расхождение «20+ / 80+ / 82», которое нужно знать до публикации

Сайт противоречит сам себе, и это не вопрос этой кампании, а баг данных:

| место | что написано |
|---|---|
| `src/data/langgraph-diagrams.ts` → `subgraph TOOLS` | **20+ Accounting Tools** |
| заголовок статьи (`titlePl`/`titleEn`/`titleRu`) | **80+ narzędzi / 80+ tools** |
| тело статьи, её FAQ и `article-diagrams.ts` | **58 + 15 + 9 = до 82** |

Правда — 58/15/9/82: это единственная версия, которая подтверждается телом
статьи, её FAQ и диаграммой `accounting-tools-map`. «80+» в заголовке — это
округление 82 вниз, формально не ложь, но в теле статьи числа «80» нет вообще,
поэтому в креативах оно не используется (и не прошло бы проверку цифр).
«20+» на диаграмме страницы продукта — **устаревшее и неверное** число: узлов в
этом subgraph пять, а инструментов 58–82. Правка — в `src/`, вне объёма этой
кампании, и **отдельной задачи на неё пока не заведено** — здесь раньше стояло
«заведена отдельно», чего не было.

Практическое следствие для креатива: снимок с этой диаграммы («20+ Accounting
Tools») публиковать нельзя — он поставил бы в кадр число, которому противоречит
текст самой колоды. Подробности выбора картинки — в
`.superpowers/sdd/2026-07-31-marketing-factory/campaign-3-report.md`.

## Каналы

Контент-план (`content-plan.md`, строка 5) ставит эту кампанию **только в
LinkedIn** и **только на польском** — карусель PL, четверг 2026-08-13. Поэтому
ниже один канал.

Английский блок написан и отрендерен намеренно: `scripts/spec.py` требует обе
локали на каждом слайде, а `tests/test_campaigns.py` — оба языковых блока в
этом файле и полный комплект рендеров в `renders/en/`. Менять валидатор ради
одной строки календаря было бы изменением фабрики в угоду частному случаю;
готовый EN не стоит ничего и снимает вопрос, когда для него появится слот.

## LinkedIn

Формат: карусель-документ `renders/pl/carousel.pdf` (6 страниц) + текст ниже.
Обложка одиночного поста, если карусель не заходит, — `renders/pl/li-single.png`.

### PL

Księgowość w Polsce to nieustannie zmieniające się stawki, terminy i wymogi.
Zwykły chatbot jest w tym temacie niebezpieczny: pewnie poda nieistniejący
termin, wymyśli numer rachunku albo „przypomni sobie” zeszłoroczną stawkę — i
wszystko to brzmi przekonująco. Cena takiej pomyłki liczona jest w realnych
pieniądzach i karach.

Zbudowaliśmy Accounting AI Agent tak, żeby miał jak najmniej powodów do
zmyślania. Trzy decyzje, które za to odpowiadają:

→ Jeden agent, a nie „rój”. Otrzymuje wiadomość, sam decyduje, które narzędzia
wywołać, i układa odpowiedź — bez dyspozytora rozdzielającego zadania między
podagentów. Prościej, przewidywalniej i taniej w debugowaniu. Przed
zapętleniem chroni twardy bezpiecznik: nie więcej niż 25 kroków na zapytanie.
→ Umiejętności w narzędziach, nie w prompcie. Każdy użytkownik ma bazowe 58
narzędzi, a dwa zestawy — 15 dla kadr i płac oraz 9 dla KSeF — włączają się
automatycznie, gdy odpowiednie możliwości są skonfigurowane. Razem do 82
narzędzi w rękach jednego agenta. Model wybiera tylko, które wywołać;
wykonuje je sprawdzony kod.
→ Odpowiedzi na żywych danych. Faktury w wFirma, polskie rejestry publiczne,
oficjalny kalendarz terminów podatkowych. Dla płatności od 15 000 zł agent ma
wprost polecone sprawdzić rachunek kontrahenta na „Białej Liście” MF — bo tego
wymaga art. 117ba Ordynacji podatkowej, a nie dlatego, że tak wypada.

Zastrzeżenie, które idzie razem z tymi liczbami: 82 to maksimum, a nie
standard — 58 narzędzi ma każdy, reszta zależy od tego, co masz skonfigurowane.
I sam agent nie zastępuje księgowego ani doradcy podatkowego: pomaga liczyć i
sporządzać dokumenty, decyzje o Twojej sprawozdawczości pozostają Twoje.

Cała architektura opisana od środka, ze schematami z wewnętrznej dokumentacji:
https://mi-code.pl/blog/accounting-ai-agent-architecture/?utm_source=linkedin&utm_medium=social&utm_campaign=accounting-ai

Siła takiego systemu tkwi nie w rozmiarze modelu, lecz w dyscyplinie wokół
niego — i tę dyscyplinę da się przenieść na Twoje procesy i Twoje integracje.
Potrzebujesz agenta wbudowanego w Twoje systemy i dane? Napisz na
development@mi-code.pl.

#AI #LLM #LangGraph #enterprise #softwarehouse #ITPolska #ksiegowosc #KSeF

### EN

Accounting in Poland means constantly shifting rates, deadlines and
requirements. A generic chatbot is dangerous here: it will confidently name a
deadline that does not exist, invent an account number or “recall” last year's
rate — and all of it sounds convincing. The cost of that mistake is measured in
real money and penalties.

We built Accounting AI Agent so it has as few reasons to make things up as
possible. Three decisions carry that:

→ A single agent, not a “swarm”. It receives the message, decides for itself
which tools to call, and composes the answer — with no dispatcher routing
tasks between sub-agents. Simpler, more predictable and cheaper to debug. A
hard fuse guards against loops: no more than 25 steps per request.
→ The abilities live in the tools, not in the prompt. Every user has the base
58 tools, and two more sets — 15 for HR and payroll and 9 for KSeF — are
enabled automatically once the corresponding capabilities are set up. That is
up to 82 tools in a single agent's hands. The model only picks which one to
call; vetted code runs it.
→ Answers on live data. Invoices in wFirma, the Polish public registries, the
official tax-deadline calendar. For any payment of 15,000 zł or more the agent
is explicitly instructed to check the contractor's account against the Ministry
of Finance “White List” — because Art. 117ba of the Tax Ordinance requires it,
not because it seemed like a good idea.

The caveat that travels with those numbers: 82 is a maximum, not a standard —
58 tools are there for everyone, the rest depends on what you have configured.
And the agent does not replace an accountant or a tax adviser: it helps you
calculate and file, the decisions on your reporting stay yours.

The whole architecture from the inside, with the diagrams from our internal
documentation:
https://mi-code.pl/en/blog/accounting-ai-agent-architecture/?utm_source=linkedin&utm_medium=social&utm_campaign=accounting-ai

The strength of a system like this is not the size of the model but the
discipline around it — and that discipline carries over to your processes and
your integrations. Need an agent embedded in your own systems and data? Write
to development@mi-code.pl.

#AI #LLM #LangGraph #enterprise #softwarehouse #Poland #accounting #KSeF
