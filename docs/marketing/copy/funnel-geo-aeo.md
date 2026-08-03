# geo-aeo — тексты

Кампания верха воронки, четвёртая. Ведёт на статью
`geo-aeo-generative-answer-engine-optimization`, из статьи — на контакт
`development@mi-code.pl`.

Аудитория здесь другая, чем у первых трёх кампаний: `strategy.md` ставит на эту
строку **маркетинг-директоров**, а не CTO. Отсюда регистр: меньше архитектуры,
больше последствий. Читатель не спрашивает «как устроен движок ответов» — он
спрашивает «почему мой ранг на месте, а трафика и упоминаний нет». Колода
отвечает ровно на это и только в конце говорит, что с этим делать.

Цифры: см. `campaigns/geo-aeo/campaign.json` → `source.figures`. Новых не
выдумывать — всё, что стоит в постах, должно дословно стоять в статье;
`tests/test_campaigns.py` сканирует и слайды, и публикуемую прозу ниже.
Ссылки собраны `spec.Campaign.link()`, схема — в `cta-blocks.md`.

## Что именно измеряет каждая цифра

У этой статьи есть особенность, которую надо знать до того, как кто-то
попробует «усилить обложку числом»: **во всём её теле — PL, EN и RU — ровно три
числа, и все три это даты**. Ни процентов, ни объёмов, ни денег: материал
качественный по своей природе. Проверено сканом того же регулярного выражения,
которым числа проверяет `tests/test_campaigns.py`.

- **2022** — месяц и год публичной премьеры ChatGPT
  («Publiczna premiera ChatGPT w listopadzie 2022 roku» / «The public launch of
  ChatGPT in November 2022»). Это дата, с которой синтезированный ответ стал
  повседневной привычкой, — а не доля рынка, не доля zero-click-запросов и не
  падение трафика. Обложка говорит именно это.
- **2023** — год академической работы *GEO: Generative Engine Optimization*
  (Princeton, Georgia Tech, Allen Institute for AI, IIT Delhi). Это дата
  появления **термина** в научной литературе, а не дата запуска какого-либо
  продукта.
- **2024** — год конференции KDD, на которой эта работа была представлена. Тоже
  дата, и относится она к работе 2023 года, а не к AI Overviews.

Чего в статье **нет** и чего поэтому нет в колоде: доли запросов с AI Overviews,
процента zero-click-поиска, роста или падения трафика. Статья говорит «значительная
доля запросов» и «рост zero-click-поиска» словами, без числа, — и креатив обязан
говорить так же. Любая цифра, которой захочется подкрепить этот слайд, будет
выдуманной, и это ровно тот случай, ради которого правило написано.

Отсюда же следует форма обложки: `bigNumber` — это `2022`, год, а не метрика.
Тест требует, чтобы число обложки стояло в статье; в статье стоят только три
даты; значит, честная обложка — дата. Подпись под ней об этом и говорит.

## Почему в колоде нет слайда с картинкой

Замерено, а не предположено. В статье три схемы и ни одной таблицы
(`src/data/article-tables.ts` не содержит записей для этого slug). Все три схемы
— mermaid, и все три шире колонки статьи (720 CSS px, SVG рисуется в 686), то
есть страница ужимает их целиком вместе с текстом ещё до съёмки. Замер на живой
сборке через `capture_screens._MERMAID_MEASURE_JS`:

| схема | натуральная ширина PL / EN | ужатие | тушь в снимке |
|---|---|---|---|
| `geo-search-shift` | 2334 / 2208 | 0,29× / 0,31× | 10–11 px (замер) |
| `geo-timeline` | 1271 / 1209 | 0,54× / 0,57× | одна полоса, подписи слиты |
| `geo-micode-recipe` | 1078 / 1067 | 0,64× / 0,64× | 14–19 px (замер) |

Порог `capture_screens.check_mermaid_shrink` — 0,80 (это `24/30` из
`slides._CAPTURE_INK_BAND`). Все три схемы под ним, то есть съёмка любой из них
выдала бы `RuntimeWarning`, а лучшая из трёх (`geo-micode-recipe`) при
масштабе `tall-diagram` 1006/1372 = 0,733 дала бы на карусельной странице
**10–14 px** глифов при принятой планке 16–19. Ровно случай кампании 2:
колода собрана без слайда с картинкой, и три слайда `numbers` несут то же
содержание читаемо. Подробности и замеры — в
`.superpowers/sdd/2026-07-31-marketing-factory/campaign-4-report.md`.

## Каналы

Контент-план (`content-plan.md`, строка 6) ставит эту кампанию **только в
LinkedIn** — карусель PL + EN, вторник 2026-08-18. Поэтому ниже один канал.
Остальные форматы (`feed-4x5.png`, `story-9x16-01..06.png`, `reel.mp4`,
`og.png`) отрендерены и лежат в `creatives/geo-aeo/renders/` — они готовы к
публикации, но слота в календаре у них нет; когда он появится, сюда добавляется
`## Facebook` / `## Stories` со своими `utm_source`, и `test_campaigns.py`
начнёт требовать их сам.

## LinkedIn

Формат: карусель-документ `renders/<lang>/carousel.pdf` (6 страниц) + текст
ниже. Обложка одиночного поста, если карусель не заходит, —
`renders/<lang>/li-single.png`.

### PL

Twój ranking się nie zmienił. Zmieniło się to, co widzi klient.

Zadaj dziś pytanie, a jest spora szansa, że nie zobaczysz listy dziesięciu
niebieskich linków. ChatGPT, Perplexity, Gemini albo AI Overviews od Google
zwracają jedną, złożoną już odpowiedź — napisaną, opatrzoną źródłami i z góry
rozstrzygającą, które firmy zostaną wspomniane. Jeśli to nie Twoja treść
zostaje w niej zacytowana, jesteś praktycznie niewidoczny, nawet gdy na starej
stronie wyników wciąż zajmujesz pierwsze miejsce.

Dwie dyscypliny odpowiadają dokładnie na tę zmianę:

→ AEO (Answer Engine Optimization) to bycie odpowiedzią, a nie linkiem do niej.
Wyrosło z wyróżnionych fragmentów, asystentów głosowych i „pozycji zero”, a jego
fundamentem są dane strukturalne i samodzielne treści w formie pytanie–odpowiedź,
które maszyna może przejąć dosłownie.
→ GEO (Generative Engine Optimization) jest nowsze i węższe: to bycie cytowanym
wewnątrz odpowiedzi, którą pisze model. Termin pochodzi z pracy naukowej z 2023
roku, napisanej przez badaczy związanych z Princeton, Georgia Tech, Allen
Institute for AI oraz IIT Delhi i przedstawionej później na konferencji KDD 2024.
→ Żadne z nich nie zastępuje SEO. Model wciąż musi zaindeksować i zrozumieć
Twoją stronę, zanim ją zacytuje, więc indeksowalność, czysta struktura i realny
autorytet pozostają fundamentem. Dochodzi tylko nowy cel ponad rankingiem.

Skoro cel jest inny, inne są też sygnały: struktura ponad słowa kluczowe,
cytowalne fakty ponad perswazję, świeżość i jasność ponad objętość. I jedna
rzecz, która w praktyce decyduje najczęściej — dostęp crawlerów. Silnik
generatywny zacytuje wyłącznie to, co jego crawler mógł przeczytać. Jeśli Twój
robots.txt blokuje boty AI, samodzielnie wypisałeś się z odpowiedzi.

U siebie prowadzimy to jako praktykę obejmującą całe portfolio, a nie pole do
odhaczenia na jednej stronie: wyselekcjonowany llms.txt jako tekstowa mapa
treści, robots.txt, który świadomie wpuszcza crawlery AI i jednocześnie
odgradza trasy prywatne, dane strukturalne FAQPage i Organization w JSON-LD
oraz odpowiedź podana wprost w pierwszym akapicie.

Uczciwe zastrzeżenie, bez którego to brzmi jak sprzedaż sztuczki: GEO i AEO nie
są hakowaniem algorytmu. To odkrywalność i cytowalność — sprawianie, by
naprawdę użyteczna, dokładna treść była łatwa do znalezienia, zrozumienia i
poprawnego zacytowania przez maszyny. W chwili, gdy taktyka wyprzedza treść,
tracą i czytelnik, i model.

Skąd się to wzięło, czym różni się od SEO i jak stosujemy to na wszystkich
naszych stronach:
https://mi-code.pl/blog/geo-aeo-generative-answer-engine-optimization/?utm_source=linkedin&utm_medium=social&utm_campaign=geo-aeo

Zastanawiasz się, jak Twoja marka wypada, gdy to AI odpowiada w Twoim imieniu?
Napisz na development@mi-code.pl.

#AI #GEO #AEO #LLM #softwarehouse #ITPolska #marketing

### EN

Your ranking has not changed. What the customer sees has.

Ask a question today and there is a good chance you never see a list of ten
blue links. ChatGPT, Perplexity, Gemini or Google's AI Overviews return a
single synthesized answer — already written, already sourced, already deciding
which companies get mentioned. If your content is not the thing being quoted in
it, you are effectively invisible, even when you still rank number one on the
old-fashioned results page.

Two disciplines address exactly this shift:

→ AEO (Answer Engine Optimization) is about being the answer rather than a link
to it. It grew out of featured snippets, voice assistants and "position zero,"
and its foundation is structured data and self-contained question-and-answer
content a machine can lift verbatim.
→ GEO (Generative Engine Optimization) is newer and narrower: being cited
inside the answer a model writes. The term comes from a 2023 research paper —
researchers associated with Princeton, Georgia Tech, the Allen Institute for AI
and IIT Delhi — later presented at KDD 2024.
→ Neither replaces SEO. A model still has to crawl, index and understand your
page before it can quote it, so crawlability, clean structure and genuine
authority remain the foundation. What changes is the goal on top of ranking.

Because the goal is different, so are the signals: structure over keywords,
quotable facts over persuasion, freshness and clarity over volume. And the one
that decides it most often in practice — crawler access. A generative engine
can only cite what its crawler was allowed to read. If your robots.txt blocks
AI bots, you have opted out of the answer entirely.

We run this as a portfolio-wide practice rather than a checkbox on one page: a
curated llms.txt as a plain-text map of the content, a robots.txt that
deliberately welcomes AI crawlers while fencing off private routes, FAQPage and
Organization structured data in JSON-LD, and the answer stated plainly in the
first paragraph.

The honest caveat, without which this reads like selling a trick: GEO and AEO
are not about gaming an algorithm. They are about discoverability and
citability — making genuinely useful, accurate content easy for machines to
find, understand and quote correctly. The moment the tactic outruns the
substance, both the reader and the model lose.

Where this came from, how it differs from SEO, and how we apply it across all
our sites:
https://mi-code.pl/en/blog/geo-aeo-generative-answer-engine-optimization/?utm_source=linkedin&utm_medium=social&utm_campaign=geo-aeo

Wondering how your brand shows up when an AI answers on your behalf? Write to
development@mi-code.pl.

#AI #GEO #AEO #LLM #softwarehouse #Poland #techleadership
