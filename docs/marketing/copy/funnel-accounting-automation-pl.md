# accounting-automation-pl — тексты

Кампания **верха воронки**, пятая по счёту и шестая кампания фабрики. Ведёт на
статью `accounting-ai-agent-architecture`, из статьи — на контакт
`development@mi-code.pl`.

Адресат здесь третий по счёту у этой фабрики и не совпадает ни с одним из
предыдущих: `strategy.md` ставит на эту строку **владельцев бизнеса в Польше**.
Не CTO (кампании 1–3) и не маркетинг-директор (кампания 4). Такой читатель не
спрашивает «как устроен агент» — он спрашивает «что из этого я реально отдам, а
что мне продают». Отсюда регистр: деньги, риск и ответственность вместо
архитектуры; ни одного слова про LangGraph, узлы и петли.

Цифры: см. `campaigns/accounting-automation-pl/campaign.json` → `source.figures`.
Новых не выдумывать — всё, что стоит в постах, должно дословно стоять в статье;
`tests/test_campaigns.py` сканирует и слайды, и публикуемую прозу ниже.
Ссылки собраны `spec.Campaign.link()`, схема — в `cta-blocks.md`.

## Что именно измеряет каждая цифра

Тест ловит выдуманное число, но **не** ловит правильное число с неправильной
подписью — на этом споткнулась кампания 2. Поэтому явно:

- **15 000** — это **сумма платежа в злотых**, начиная с которой польский закон
  (ст. 117ba Ordynacji podatkowej) требует убедиться, что счёт контрагента
  стоит в официальном «Белом списке» Минфина. Это **порог обязанности по
  закону**, а не цена, не лимит продукта и не какая-либо наша метрика. На
  обложке он стоит именно в этой роли: пример работы, у которой есть жёсткий
  порог и государственный реестр, — то есть работы, которую и надо отдавать
  агенту. Оговорка идёт вместе с цифрой: пропуск этой проверки грозит потерей
  права отнести расход в затраты, и это последствие для читателя, а не функция
  нашего продукта.
- **3** стоит в колоде только внутри `KSeF, format FA(3)` / `KSeF, FA(3)
  format` — это **номер версии формата** структурированной e-фактуры, а не
  количество чего-либо. В `source.figures` его **нет**, и это осознанно: скан
  ищет цифру где угодно в корпусе на 24 тысячи знаков, а `3` там встречается не
  только в `FA(3)`, но и внутри `o3` — названия модели OpenAI в перечислении
  `gpt-5, o1, o3`. То есть пин удовлетворялся бы посторонней подстрокой и не
  покраснел бы, даже если убрать из статьи все упоминания `FA(3)`. Здесь раньше
  стояло обратное утверждение — оно было ложным. Общий вывод для следующих
  кампаний: **однозначные цифры — слабые пины** в большом корпусе, потому что
  ловятся как часть посторонних токенов (версии, имена моделей, артикулы).
  Кампанию держит `15 000` — один настоящий пин лучше, чем настоящий и пустой.
- **117** попадает в скан из `art. 117ba` в тексте поста. Это **номер статьи**
  Налоговой ординации, а не количество. На слайдах его нет.

Чего в колоде **нет** намеренно: ни одного количества инструментов (58, 15, 9,
82, 24) и ни одного числа шагов (25). Причина — в следующем разделе.

## Как эта кампания разведена с кампанией 3 (`accounting-ai`)

Ограничение календаря, и оно жёстче, чем у пары «кампания 2 / кампания 5».
Кампания 3 ведёт на **ту же статью**, в **ту же ленту LinkedIn**, и выходит
2026-08-13 — за **двенадцать дней** до этой строки. Обе кампании про
бухгалтерию. Разведены они по четырём осям:

| | кампания 3 (`accounting-ai`, 13.08) | кампания 6 (`accounting-automation-pl`, 25.08) |
|---|---|---|
| Уровень | середина: «мы это построили — построим и вам» | верх: «вот как самому решить, что отдавать» |
| Адресат | CTO | владелец бизнеса |
| Обложка | `82` — максимум инструментов у **нашего** агента | `15 000 zł` — порог **в законе читателя** |
| Первая фраза поста | «Zwykły chatbot jest w tym temacie niebezpieczny» | «co z księgowości da się realnie oddać AI, a co jest tylko marketingiem» |
| Предмет | как устроен продукт | где проходит граница автоматизируемого |

Механическая сверка чисел (скан `test_campaigns._numbers_in` по слайдам обеих
колод):

- кампания 3: `117`, `15`, `15 000`, `15,000`, `25`, `4`, `58`, `82`, `9`
- кампания 6: `15 000`, `3`
- **пересечение — ровно одно число: `15 000`**

И оно переосмыслено, а не повторено, ровно как `2,4 mln` у кампании 5. У
кампании 3 порог `15 000 zł` — строка поддержки на пятом слайде, иллюстрация
того, что агент «сам сходит за данными». Здесь это **обложка**, и она говорит о
другом: закон читателя задал жёсткий порог и назначил реестр, поэтому такая
работа и есть первый кандидат на передачу. Ни одна цифра, на которой построена
кампания 3 (82 / 58 / 15 / 9 / 25), в колоде и постах ниже не встречается.

Отдельно: кампания 3 **запрещена себе как лид** ещё и по форме — брифинг строки
8 прямо требует не открываться количеством инструментов.

## Почему источник — `accounting-ai-agent-architecture`, а не вторая статья

Кандидатов было два, и второй (`accounting-ai-polish-tax-automation`,
«Automatyzacja rozliczeń księgowych w Polsce za pomocą agenta AI») по названию
подходит этой кампании лучше. Он отвергнут **механически, а не по вкусу**: в его
корпусе (`bodyPl` + `bodyEn`, 3531 знак) **ноль чисел**. Проверено тем же
регулярным выражением, которым это делает `tests/test_campaigns.py`.

Это не «мало цифр, как у кампании 4» — это невозможность собрать колоду вообще,
и она доказывается тремя тестами сразу:

- `test_the_hook_number_comes_from_the_article` требует `bigNumber` на обложке
  и требует, чтобы каждое число из него стояло в корпусе;
- `test_every_number_a_reader_sees_appears_in_the_articles_own_text` требует,
  чтобы колода назвала **хотя бы одно** число (`deck states no numbers at all`);
- то же самое требуется от публикуемой прозы поста.

То есть колода обязана назвать число, а корпус не содержит ни одного, — это
прямое противоречие, а не строгая обложка. Третий вариант, `source.product`
для `accounting-ai`, отпадает по той же причине: корпус страницы продукта —
6185 знаков и тоже **ноль чисел** (замер подтверждает оговорку `README.md`).

Остаётся статья про архитектуру, и по содержанию она эту кампанию несёт:
порог 15 000 zł и ст. 117ba, автозаполнение по NIP, календарь сроков, KSeF и
формат FA(3), распознавание чека — и, главное, **собственная оговорка статьи**
о том, чего агент не заменяет. Именно она даёт колоде вторую половину ответа,
без которой «что отдать AI» превращается в рекламу.

## Почему в колоде нет слайда с картинкой

Замерено на живой сборке, а не унаследовано от кампании 3. Кандидатов девять:
восемь mermaid-схем статьи в обеих локалях плюс граф LangGraph со страницы
продукта. Таблицы в статье есть (`aiModelsTable`, 5×2 «какая модель за что
отвечает»), но она про модели, а не про эту кампанию.

Гейт 1 — `capture_screens.check_mermaid_shrink`, порог 0,80 (колонка статьи
686 px, страницы продукта 766 px, DSF 2):

| схема | натуральная ширина PL / EN | ужатие PL / EN | гейт 1 |
|---|---|---|---|
| `accounting-agent-loop` | 814 / 695 | 0,84× / 0,99× | **прошла** |
| `accounting-message-pipeline` | 481 / 504 | 1,00× / 1,00× | **прошла** |
| `accounting-memory-lifecycle` | 696 / 696 | 0,99× / 0,99× | **прошла** |
| `accounting-ocr` | 1123 / 1119 | 0,61× / 0,61× | нет |
| `accounting-system-overview` | 1140 / 1160 | 0,60× / 0,59× | нет |
| `accounting-ksef` | 1191 / 1221 | 0,58× / 0,56× | нет |
| `accounting-grounding` | 1311 / 1220 | 0,52× / 0,56× | нет |
| `accounting-tools-map` | 2346 / 2337 | 0,29× / 0,29× | нет |
| граф со страницы продукта | 1270 / 1270 | 0,60× / 0,60× | нет |

Гейт 2 — `slides._TALL_MIN_SCALE` (0,57) через настоящий `render()` на
1080×1350, надзаголовок и заголовок в одну строку:

| схема | снимок PL / EN | масштаб PL / EN | гейт 2 |
|---|---|---|---|
| `accounting-agent-loop` | 1372×1198 / 1372×1308 | 0,73 / 0,72 | **прошла** |
| `accounting-memory-lifecycle` | 1372×2092 / 1372×1998 | 0,46 / 0,48 | нет |
| `accounting-message-pipeline` | 964×2638 / 1012×2494 | 0,36 / 0,38 | нет |

Оба гейта проходит **ровно одна схема — и это в точности та картинка, которую
кампания 3 уже опубликовала в эту же ленту двенадцатью днями раньше**
(`campaigns/accounting-ai/campaign.json`, слайд 3). Поэтому картинки нет, и это
**четвёртое по счёту и новое основание** в истории фабрики: у кампании 2 не было
подходящего кандидата вовсе, у кампании 4 всех кандидатов срезал детектор, у
кампании 5 единственный выживший оказался тупиком по содержанию, — а здесь
кандидат прошёл **оба замера** и отвергнут **соседством в календаре**. Первый
случай, когда фабрика отказывается от измеримо годной картинки.

Второй довод, независимый от первого: `accounting-agent-loop` — это петля
«рассуждение → действие» с узлами «Model z podpiętymi narzędziami» и «wyniki
dołączone do rozmowy». Это архитектура, то есть ровно тот регистр, который эта
строка адресату не показывает.

Схема, которая по содержанию подошла бы идеально, — `accounting-grounding`
(wFirma, реестры, обязательная проверка при платеже ≥ 15 000 zł). Её срезал
гейт 1 на 0,52× (PL): `useMaxWidth: true` ужал её на странице **вместе с
текстом**, и на карусельной странице она дала бы около 9–12 px глифов при
принятой планке 16–19 — при том что сам снимок 1372×572 прошёл бы
`_TALL_MIN_SCALE` на 0,73 **молча**. Ровно ловушка, описанная в `README.md`.

Замер графа со страницы продукта здесь новый и стоит его записать: после
правки `src/data/langgraph-diagrams.ts` (горизонтальная раскладка) он стал
1270 CSS px против прежних 3696 у `legalka-kb`-класса проблем, то есть 0,60×
вместо катастрофы, — но для съёмки этого всё ещё мало.

## Каналы

Контент-план (`content-plan.md`, строка 8) ставит эту кампанию **только в
LinkedIn** и **только на польском** — карусель PL, вторник 2026-08-25. Поэтому
ниже один канал.

Английский блок написан и отрендерен намеренно: `scripts/spec.py` требует обе
локали на каждом слайде, а `tests/test_campaigns.py` — оба языковых блока в этом
файле и полный комплект рендеров в `renders/en/`. Ослаблять валидатор ради одной
строки календаря было бы изменением фабрики в угоду частному случаю; готовый EN
ничего не стоит и ждёт своего слота. Остальные форматы (`feed-4x5.png`,
`story-9x16-01..06.png`, `reel.mp4`, `og.png`) отрендерены и лежат в
`creatives/accounting-automation-pl/renders/` — как только под них появится
строка календаря, сюда добавляется `## Facebook` / `## Stories` со своими
`utm_source`, и `test_campaigns.py` начнёт требовать их сам.

## LinkedIn

Формат: карусель-документ `renders/pl/carousel.pdf` (6 страниц) + текст ниже.
Обложка одиночного поста, если карусель не заходит, — `renders/pl/li-single.png`.

### PL

Najczęstsze pytanie, jakie słyszymy od właścicieli firm: co z księgowości da się
realnie oddać AI, a co jest tylko marketingiem.

Odpowiedź nie zależy od tego, jak trudne jest zadanie. Zależy od tego, czy da
się sprawdzić wynik.

Konkret. Przy każdej płatności od 15 000 zł polskie prawo — art. 117ba
Ordynacji podatkowej — wymaga upewnienia się, że rachunek kontrahenta jest na
oficjalnej „Białej Liście” Ministerstwa Finansów. Pominięcie tego kroku potrafi
kosztować prawo do zaliczenia wydatku do kosztów, i to przez samą formalność.
Jasny próg, urzędowy rejestr, zero miejsca na uznaniowość. Właśnie takie rzeczy
warto oddać agentowi — nie dlatego, że są trudne, tylko dlatego, że wynik da się
sprawdzić u źródła.

Po tej samej stronie granicy stoją:

→ Autouzupełnianie po NIP. Podajesz jeden numer, a brakującą nazwę, REGON i
adres system pobiera z rejestrów publicznych i pokazuje, które pola uzupełnił
automatycznie.
→ Pilnowanie terminów. Z oficjalnego kalendarza terminów podatkowych, a nie z
pamięci modelu.
→ Wystawienie e-faktury do KSeF w wymaganym formacie FA(3), razem z doczekaniem
oficjalnego potwierdzenia.
→ Paragon ze zdjęcia. Robisz zdjęcie w Telegramie, wraca gotowa karta wydatku.

Po drugiej stronie granicy jest to, czego nie oddajesz nikomu. Agent pomaga
liczyć i sporządzać dokumenty, ale nie zastępuje księgowego ani doradcy
podatkowego. Przepisy się zmieniają, szczegóły zależą od konkretnej sytuacji, a
ostateczne decyzje dotyczące Twojej sprawozdawczości podejmujesz Ty lub Twój
księgowy. To nie jest zastrzeżenie drobnym drukiem — to jest właśnie ta granica.

Test, który stosuje się do dowolnego procesu w firmie, nie tylko w księgowości.
Czy da się sprawdzić wynik u źródła? Czy reguła ma jasny próg? Czy ktoś musi to
ocenić i podpisać? Dwa razy „tak” i raz „nie” — zadanie nadaje się dla agenta.

Jak to wygląda od środka, na naszym własnym agencie księgowym:
https://mi-code.pl/blog/accounting-ai-agent-architecture/?utm_source=linkedin&utm_medium=social&utm_campaign=accounting-automation-pl

Chcesz przejrzeć swoje procesy pod tym kątem? Napisz na development@mi-code.pl.

#AI #LLM #ksiegowosc #KSeF #softwarehouse #ITPolska #automatyzacja

### EN

The question we hear most often from business owners: what in accounting can
realistically be handed to AI, and what is just marketing.

The answer does not depend on how hard the task is. It depends on whether the
result can be checked.

Take a concrete case. For any payment of 15,000 zł or more, Polish law — Art. 117ba of
the Tax Ordinance — requires you to confirm that the contractor's account is on
the official Ministry of Finance “White List”. Skip that step and a formality
can cost you the right to book the expense. A fixed threshold, an official
registry, no room for judgement. That is exactly the kind of work worth handing
to an agent — not because it is hard, but because the result can be verified
against a public register.

On the same side of the line:

→ Autofill by NIP. You give one tax number, and the missing name, REGON and
address come from the public registries, with the automatically filled fields
flagged.
→ Watching the deadlines. From the official tax-deadline calendar, not from the
model's memory.
→ Issuing an e-invoice to KSeF in the required FA(3) format, including waiting
for the official confirmation.
→ A receipt from a photo. You take the picture in Telegram and get a structured
expense card back.

On the other side of the line is what you hand to nobody. The agent helps you
calculate and file, but it does not replace an accountant or a tax adviser.
Rules change, the details depend on your specific situation, and the final
decisions on your reporting are yours or your accountant's. That is not small
print — that is the line itself.

A test that works for any process in the company, not just accounting. Can the
result be checked at the source? Does the rule have a clear threshold? Does
somebody have to judge it and sign it? Two yeses and one no, and the task suits
an agent.

What that looks like from the inside, on our own accounting agent:
https://mi-code.pl/en/blog/accounting-ai-agent-architecture/?utm_source=linkedin&utm_medium=social&utm_campaign=accounting-automation-pl

Want to look at your own processes this way? Write to development@mi-code.pl.

#AI #LLM #accounting #KSeF #softwarehouse #Poland #automation
