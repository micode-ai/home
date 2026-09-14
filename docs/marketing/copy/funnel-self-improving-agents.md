# self-improving-agents — тексты

Кампания верха воронки, пятая и **последняя** в этом треке: оставшиеся четыре
строки плана (11, 12, 13 и продуктовая девятая) — все середина воронки. Ведёт
на статью `self-improving-agent-teams`, из статьи — на контакт
`development@mi-code.pl`.

Адресат по `strategy.md` — **tech-лид**. Это четвёртый адресат фабрики после
CTO, маркетинг-директора и владельца бизнеса, и регистр здесь самый технический
из всех: читателю можно показать петлю, состояния сессии и слово «watchdog». Но
порядок тот же, что и везде — сначала последствие («твои агенты не становятся
лучше»), потом механизм. Колода не открывается архитектурой.

Цифры: см. `campaigns/self-improving-agents/campaign.json` → `source.figures`.
Новых не выдумывать — всё, что стоит в постах, должно дословно стоять в статье;
`tests/test_campaigns.py` сканирует и слайды, и публикуемую прозу ниже. Ссылки
собраны `spec.Campaign.link()`, схема — в `cta-blocks.md`.

## Что именно измеряет каждая цифра

Скан корпуса (`bodyPl` + `bodyEn`, 40 598 знаков) тем же регулярным выражением,
которым числа проверяет `tests/test_campaigns.py`, даёт **шесть различных чисел
на всю статью**, и каждое встречается ровно по одному разу в каждом языковом
теле:

| число | что это | встречается |
|---|---|---|
| `2025` | год разговора, в котором Карпаты назвал недостающий элемент | 1 раз |
| `1` … `5` | номера пунктов списка из пяти шагов ночной петли | по 1 разу |

Всё остальное статья пишет **словами**, на всех трёх языках: «trzy strukturalne
problemy», «trzech do pięciu», «Trzysta takich», «jeden projekt albo
pięćdziesiąt», «tysiąc linii», «dziesięć tysięcy uwag lintera». Поэтому
цифрового следа у них нет и в колоде их быть не может — а словами их
употреблять можно и нужно, что колода и делает.

- **2025** — год разговора, в котором Andrej Karpathy сформулировал недостающий
  элемент («W rozmowie z 2025 roku» / «In a 2025 conversation»). Это **дата
  высказывания**, а не метрика, не доля, не наш результат и не год выхода
  какого-либо продукта. Подпись на обложке говорит именно это. Второй случай
  после кампании 4 (`2022`), когда обложка несёт дату: в статье просто нет
  величины, которую можно было бы туда поставить.

**Почему обложка не `5`.** Пять шагов петли — единственная в статье величина,
которая читается как количество, и она однозначно подтверждается: список идёт
`1.`…`5.`, пятый пункт последний. Но это **однозначная цифра**, а такой пин
слаб: `_quotes` требует границ по цифрам, а не по смыслу, так что `5` в корпусе
удовлетворяется любым будущим «5 minut» или «GPT-5», и проверка этого не
заметит — ровно та ловушка, на которой кампания 6 поймала свой `3` (его молча
удовлетворяла подстрока `o3` в перечне моделей). Плюс «5 шагов» — это
архитектура, а обложка должна вести последствием. Поэтому в `source.figures`
объявлено ровно одно число, `2025`, четырёхзначное и однозначно опознаваемое, и
оно же стоит на обложке. Сами пять шагов колода показывает — слайдом 4, **без
номеров**: пять строк таблицы и есть пять шагов, цифра для этого не нужна.

**Совпадение форматирования PL/EN.** `bigNumber` объявляется на уровне слайда и
не может быть языковым (`slides.py` читает его вне языкового блока), поэтому
число, которое в двух локалях пишется по-разному, на одной из обложек читалось
бы неправильно — это зафиксировано отчётом кампании 6 про `15 000` / `15,000`.
Здесь этой проблемы нет по построению: год пишется `2025` и в польской, и в
английской традиции, без разделителя разрядов. Обложки совпадают.

## Проверка утверждений со сравнением и порогом

Отдельно, дословно по трём телам статьи (`bodyPl`, `bodyEn`, `bodyRu`), потому
что ни один тест не проверяет **направление** утверждения — только то, что
цифры есть в корпусе. Кампании 3 и 6 обе выпустили «above X» там, где источник
говорит «X or more».

- **«Dzisiejsze modele nie mają tej fazy»** (слайд 1). PL: «dzisiejsze modele
  nie mają odpowiednika tej fazy destylacji». EN: «today's models have no
  equivalent distillation phase». RU: «у сегодняшних моделей нет эквивалента
  этой фазы дистилляции». Отрицание полное, не «почти нет» и не «меньше» —
  формулировка совпадает.
- **«zbyt długa cisza kończy sesję» / «too long a silence ends the run»**
  (слайд 5). Источник: «jeśli uruchomienie na zbyt długo milknie, zostaje
  zabite» / «if a run goes quiet for too long, it's killed». Порог здесь —
  «слишком долго», и он **сохранён в обеих локалях**. Первая редакция строки
  была «cisza kończy sesję» / «silence ends the run» — без «zbyt długa» / «too
  long», то есть утверждение усиливалось до «любая пауза убивает сессию», чего
  источник не говорит. Исправлено до рендера.
- **«nikt nie głoduje» / «none is starved»** (слайд 5). PL: «Każdy agent
  dostaje swoją kolej, nikt nie głoduje». EN: «Every agent gets its turn, none
  is starved». Совпадает дословно.
- **«koszt przewidywalny» / «predictable cost»** (слайд 5). PL: «koszt
  przewidywalny». EN: «the cost stays predictable». Совпадает.
- **«rozliczenie się zgadza» / «the books balance»** (слайд 5). PL: «tak by
  rozliczenie zawsze się zgadzało». EN: «so the books always balance».
  Совпадает; «zawsze» опущено, что ослабляет, а не усиливает.
- **«tylko odnotuj» / «record, do not fix»** (слайд 4). PL: «agentowi wprost
  zabroniono iść to *naprawiać*, tylko odnotować». EN: «the agent is explicitly
  told *not* to go and fix it, only to record it». Совпадает.
- **«Agent proponuje, decyduje człowiek» / «The agent proposes, a human
  disposes»** (слайд 3). Это дословная строка статьи, выделенная в ней жирным,
  в обеих локалях.

Ни одного утверждения вида «больше чем», «до», «свыше» в колоде нет — ставить
их было бы не на что.

## Почему у колоды **есть** слайд с картинкой

Первая кампания после третьей, которая ставит картинку, и первый случай, когда
кандидат прошёл оба гейта **и** оказался прав по содержанию. У предыдущих
четырёх причины отказа были разные: у второй подходящего кандидата не было
вовсе, у четвёртой всех срезал детектор, у пятой единственный выживший оказался
тупиком по содержанию, у шестой годная картинка была занята соседней строкой
календаря. Здесь не сработала ни одна из четырёх.

Кандидатов пять — все mermaid-схемы статьи; таблицы у неё нет
(`src/data/article-tables.ts` не содержит записей для этого slug).

**Гейт 1** — `capture_screens.check_mermaid_shrink`, порог 0,80, замер на живой
сборке через `_MERMAID_MEASURE_JS` (колонка статьи 720 CSS px, SVG рисуется в
686, DSF 2):

| схема | натуральная ширина PL / EN | ужатие PL / EN | гейт 1 |
|---|---|---|---|
| `dreaming-team-overview` | 738 / 760 | 0,93× / 0,90× | прошла |
| `dreaming-self-study-loop` | 462 / 450 | 1,00× / 1,00× | прошла |
| `dreaming-scanner-family` | 995 / 935 | 0,69× / 0,73× | **нет** |
| `dreaming-session-lifecycle` | 638 / 519 | 1,00× / 1,00× | прошла |
| `dreaming-cascade-gates` | 426 / 387 | 1,00× / 1,00× | прошла |

Четыре из пяти проходят, три из них вообще не ужаты — такого у фабрики ещё не
было. Причина видна в самих определениях: эти схемы узкие. `flowchart TB` с
короткими подписями укладывается в колонку статьи целиком, а срезанная
`scanner-family` — единственная `flowchart LR`, и её пять параллельных «линз» с
польскими подписями разгоняют натуральную ширину до 995 px.

**Гейт 2** — `slides._TALL_MIN_SCALE` (0,57) через настоящий `render()`:

| снимок | исходник PL / EN | масштаб 1080×1350 | 1080×1920 |
|---|---|---|---|
| `team-overview` | 1372×1162 / 1372×1128 | **0,688 / 0,707, молчит** | 0,733 / 0,733, молчит |
| `self-study-loop` | 928×2816 / 904×2650 | 0,34 / 0,36 — предупреждает | 0,53 / 0,56 — предупреждает |
| `session-lifecycle` | 1276×874 / 1040×826 | 0,788 / 0,967, молчит | молчит |
| `cascade-gates` | 852×3272 / 776×3160 | 0,29 / 0,30 — предупреждает | 0,45 / 0,47 — предупреждает |

Оба `flowchart TB`, у которых много рангов (`self-study-loop` — сама петля,
`cascade-gates` — каскад с воротами), срезаны вторым гейтом ровно по той
причине, которую `strategy.md` называет геометрическим потолком: соотношение
0,33 и 0,26 против нужного ~1,0. То есть **самая уместная по названию схема —
петля самообучения — не проходит**, и это стоит знать: слайд 4 несёт её
содержание строками таблицы, читаемо.

Оба гейта проходят две: `team-overview` и `session-lifecycle`. Выбрана первая,
и выбор сделан по содержанию, а не по замеру (у второй масштаб даже выше):

- `team-overview` — это тезис кампании целиком в одной картинке: хармонограм
  будит агента, агент изучает код и пишет артефакты в репозиторий, артефакты
  идут на **проверку человеку**, а утверждённое возвращается в описания самих
  агентов. Замкнутая петля с человеческой бранкой — то, ради чего кампания
  существует;
- `session-lifecycle` — диаграмма состояний сессии
  (Zaplanowana → Trwa → Sukces / Timeout / Porażka / Uzgodniona). Верно и
  читаемо, но это раздел «Бесопасники», подпорка, а не тезис; к тому же
  исходник низкий (874 / 826 px), поэтому нижняя треть холста остаётся пустой.

**Тушь проверена глазами, а не выведена из масштаба** — ровно та проверка,
которую `README.md` требует для схемы, снимаемой впервые, и которую
`_TALL_MIN_SCALE` сделать за автора не может. Оба готовых слайда `carousel-03`
открыты и прочитаны: подписи узлов и подписи рёбер разборчивы, ни одно ребро не
наезжает на подпись, ни одна подпись не обрезана.

Замер туши прямо на опубликованном PNG (не арифметикой от масштаба): **PL —
19 px**, **EN — около 15–16 px**. Принятая полоса читаемости 16–19 px, то есть
польский в ней, а английский стоит на нижнем краю или чуть ниже. Читается —
проверено вырезкой из готового файла, — но запаса у английского нет.

Здесь же поправка, важная для следующих кампаний: в первой версии этой таблицы
стояло «0,733 / 0,733» в колонке карусельного холста. **Это значение для
1080×1920, а не для 1080×1350.** На карусели первым упирается бюджет высоты, и
он упирается по-разному в двух языках, потому что снимки разной высоты (1162 и
1128 px при одинаковой ширине 1372). На сторис первой упирается ширина колонки —
1006/1372 = 0,733 для обоих языков, отсюда и совпадение, которое ввело в
заблуждение. Масштаб `tall-diagram` **не обязан** быть одинаковым в двух языках,
и на карусели обычно не будет.

Снимки **разные для двух языков** — схема локализована в
`src/data/article-diagrams.ts`, — поэтому объявлены два `asset` и два `shot`,
каждый со своей локали, и `test_a_tall_diagram_slide_captures_something_that_
exists` проверяет именно это. Селектор привязан к тексту подписи, а не к
порядковому номеру: `figure.article-figure:has(figcaption:has-text(…))
pre.mermaid svg`. Снимается сам `svg`, а не `.diagram-wrap` — по причинам из
`README.md` (поля карточки увеличили бы исходник и уронили масштаб).

## Пересечений с соседями по календарю нет

Проверено механически по всем шести отгруженным кампаниям: `source.slug` у них
— `ai-agent-cost-per-month-model`, `legalka-kb-ai-architecture` (дважды),
`accounting-ai-agent-architecture` (дважды) и
`geo-aeo-generative-answer-engine-optimization`. Статью
`self-improving-agent-teams` не использует **ни одна**, поэтому ни ограничения
кампании 5 (та же статья девятью днями раньше), ни ограничения кампании 6 (та
же картинка в той же ленте) здесь не действуют: ни одна цифра, ни одна схема и
ни один тезис этой колоды не заняты соседней строкой. Это первая кампания
фабрики, у которой источник эксклюзивен.

## Каналы

Контент-план (`content-plan.md`, строка 10) ставит эту кампанию **только в
LinkedIn** — карусель PL + EN, вторник 2026-09-01. Поэтому ниже один канал.
Остальные форматы (`feed-4x5.png`, `story-9x16-01..06.png`, `reel.mp4` для
Reels/Stories, `reel-4x5.mp4` для ленты, `og.png`) отрендерены и лежат в
`creatives/self-improving-agents/renders/` — они
готовы к публикации, но слота в календаре у них нет; когда он появится, сюда
добавляется `## Facebook` / `## Stories` со своими `utm_source`, и
`test_campaigns.py` начнёт требовать их сам.

## LinkedIn

Формат: карусель-документ `renders/<lang>/carousel.pdf` (6 страниц) + текст
ниже. Обложка одиночного поста, если карусель не заходит, —
`renders/<lang>/li-single.png`.

**Лимит поста — 3000 знаков**, и это лимит площадки, а не наше правило.
Замеренная длина `### EN` — 2925 знаков вместе со ссылкой и хэштегами, запас
есть. `### PL` сейчас 3872 — **не влезает**, композер обрежет текст на середине;
его надо сократить тем же проходом, что и английский. Считать длину нужно
**до** публикации и держать её здесь, в шапке, а не в самом посте:
`tests/test_campaigns.py` сверяет каждое число внутри `### PL` / `### EN` с
текстом статьи, и счётчик знаков честно уронил бы тест — в статье нет числа
2925.

### PL

Zadaj modelowi to samo pytanie za tydzień. Dostaniesz mniej więcej tę samą odpowiedź.

Nie lepszą. Model nie pamięta zeszłego tygodnia, nie wie, że kod bazowy poszedł
od tego czasu do przodu, i nie ma żadnego mechanizmu, by zauważyć, że rada,
której właśnie udzielił, przeczy decyzji podjętej przez zespół trzy commity
temu. To cichy sufit, o który uderza większość zespołów pracujących z AI:
agenci są przydatni danego dnia, ale w Twojej pracy tak naprawdę nigdy nie
stają się lepsi.

W rozmowie z 2025 roku Andrej Karpathy nazwał brakujący element. Człowiek
podczas snu destyluje kontekst minionego dnia do wag mózgu — a dzisiejsze
modele nie mają odpowiednika tej fazy destylacji. Dlatego właśnie zalicza
ciągłe uczenie się i trwałą pamięć do brakujących elementów, przez które agenci
rozsypują się przy prawdziwej pracy.

Wyjście z tego plateau nie wymaga większego modelu. Wymaga dania agentom
czegoś, czego zwykle nie mają — nocnej zmiany.

To podejście utrzymujemy na produkcji. Zespół wyspecjalizowanych agentów, który
według harmonogramu i najczęściej wtedy, gdy nikt nie patrzy, na nowo czyta
własne instrukcje, studiuje kod, za który odpowiada, i proponuje ulepszenia
samym sobie. Pętla jest celowo mała — chodzi o skończoną notatkę każdej nocy, a
nie o idealną mapę repozytorium:

→ Przeczytaj rolę na nowo. Punkt zaczepienia, względem którego mierzy się resztę.
→ Zbadaj kod wyrywkowo, w granicach ścisłego budżetu. Garść odczytów, nie
wyczerpujące przeczesywanie. Krótka, trafna notatka bije długie śledztwo, które
nigdy się nie kończy.
→ Napisz notatkę z nauki. Rola w jednym zdaniu, lista obserwacji konkretnych
dla tego repozytorium i jedno pytanie doprecyzowujące. Krok konsolidacji.
→ Wykryj rozjazd. Plik, do którego odwołują się instrukcje, zniknął. Reguła
opisuje przepływ, którego już nie ma. Sama niezgodność jest znaleziskiem — i
agentowi wprost zabroniono iść to naprawiać, tylko odnotować.
→ Zaproponuj ewolucję. Gdy rozjazd jest strukturalny, agent pisze propozycję
zmiany we własnym opisie.

I tu jest najważniejsza decyzja projektowa w całym podejściu: agent proponuje,
decyduje człowiek. Agent nigdy nie edytuje swoich instrukcji bezpośrednio.
Człowiek przegląda propozycję i stosuje ją w parę minut — albo ją odrzuca. To
uczenie się edycjami, nie spadkiem gradientu, tylko pióro trzyma człowiek.

Właśnie dlatego można to zostawić działające bez nadzoru. Agent może mylić się
co noc bez kosztu — złą propozycję po prostu się zamyka. Ale gdy ma rację,
najtrudniejsze już zrobił: zauważył rozjazd i napisał poprawkę.

Reszta jest nudną warstwą operacyjną, zapożyczoną w całości z eksploatacji:
rotacja, żeby nikt nie głodował, globalny limit współbieżności, żeby koszt był
przewidywalny, watchdog, który zabija uruchomienie milczące zbyt długo, i
uzgadniacz, który zamyka sesje umarłe bez raportu, tak by rozliczenie zawsze
się zgadzało.

Uczciwie o kosztach, bo bez tego to brzmi jak sprzedaż cudu: to kosztuje tokeny
— skromnie na uruchomienie, odczuwalnie w sumie. Wyjście jest
niedeterministyczne, więc nie wpina się je wprost w nic, co wymaga
powtarzalności. I wymaga dyscypliny przeglądu: jeśli propozycji nikt nie czyta,
piętrzą się, a wartość pętli wycieka. Na małym, krótkotrwałym projekcie, który
mieści się w głowie jednej osoby — odpuść. To zwraca się tam, gdzie systemu nie
trzyma w głowie już nikt.

Zastrzeżenie do liczby na okładce: 2025 to rok rozmowy, w której padła ta
diagnoza — a nie nasza metryka i nie żaden wynik pomiaru.

Skąd wzięła się ta idea, jak wygląda pętla w środku i jak nie zamienić tego w
kosztowny bałagan:
https://mi-code.pl/blog/self-improving-agent-teams/?utm_source=linkedin&utm_medium=social&utm_campaign=self-improving-agents

Chcesz zacząć od jednego agenta, jednej notatki i jednego nawyku? Napisz na development@mi-code.pl.

#AI #AIagents #LLMOps #automatyzacja #softwarehouse #ITPolska #techlead

### EN

Ask a model the same question next week and you get roughly the same answer.
Not a better one.

It doesn't remember last week, doesn't know your codebase has moved on, and
can't notice that the advice it just gave contradicts a decision your team
made three commits ago. That's the quiet ceiling most teams hit with AI:
agents useful on any given day that never get better at your work.

In a 2025 conversation Andrej Karpathy named the missing piece. Humans distill
the day's context into the brain's weights during sleep; today's models have
no equivalent distillation phase. He counts continual learning and persistent
memory among the gaps that make agents collapse under real work.

Getting past that plateau doesn't take a bigger model. It takes giving your
agents something they never get: a night shift.

We run this in production. Specialist agents that, on a schedule and mostly
while nobody is watching, re-read their own instructions, study the code they
own, and propose improvements to themselves. The loop is deliberately small —
a finished note every night beats a perfect map of the repository:

→ Re-read the role. The anchor everything else is measured against.
→ Sample the code on a strict budget. A handful of reads, not an exhaustive
crawl.
→ Write a learning note: the role in one sentence, a watchlist specific to
this repository, one clarifying question. That is the consolidation step.
→ Detect drift. A referenced file is gone, a rule describes a flow that no
longer exists. The mismatch is the finding, and the agent is told to record
it, not fix it.
→ Propose an evolution. When the mismatch is structural, it writes a change to
its own definition.

The key decision: the agent proposes, a human disposes. It never edits its own
instructions. A person applies the proposal in a couple of minutes or closes
it — learning by edits, not gradient descent, with a person holding the pen.
That is also what makes it safe to leave running unattended: a wrong night
costs nothing, and a right one has already done the hard part.

Honestly about cost, because otherwise this reads like a miracle: it costs
tokens, modest per run and real in aggregate. The output is nondeterministic,
so don't wire it into anything that demands repeatability. And it needs review
discipline — unread proposals pile up and the value leaks away. On a project
that fits in one person's head, skip it. This earns out where nobody holds the
whole system in their head any more.

The 2025 on the cover is the date of that conversation, not a metric of ours.

Where the idea comes from, and how to keep it from becoming an expensive mess:
https://mi-code.pl/en/blog/self-improving-agent-teams/?utm_source=linkedin&utm_medium=social&utm_campaign=self-improving-agents

Want to start with one agent, one note and one habit? Write to development@mi-code.pl.

#AI #AIagents #LLMOps #automation #softwarehouse #Poland #techleadership
