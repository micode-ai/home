# legalka-kb — тексты

Кампания **середины воронки** («продукт как доказательство»), вторая из шести и
**первая, которая публикуется одиночной картинкой**, а не каруселью
(`content-plan.md`, строка 7). Ведёт на статью `legalka-kb-ai-architecture`, из
статьи — на контакт `development@mi-code.pl`. Подача не «попробуйте бота», а
«мы это построили — построим и вам»: боль → что построили → дисциплина базы →
собственный сервер → CTA.

Цифры: см. `campaigns/legalka-kb/campaign.json` → `source.figures`. Новых не
выдумывать — всё, что стоит в постах, должно дословно стоять в статье;
`tests/test_campaigns.py` сканирует и слайды, и публикуемую прозу ниже.
Ссылки собраны `spec.Campaign.link()`, схема — в `cta-blocks.md`.

## Одиночная картинка: обложка и есть весь креатив

`build_single.py` рендерит **только слайд `hook`**. Для строки 7 это значит, что
опубликованный креатив — `renders/pl/li-single.png` — несёт всё сообщение
в одиночку: за ним нет ещё пяти страниц, которые дочитает заинтересовавшийся.
Планка к обложке здесь выше, чем у каруселей 1–4, и из этого следуют два
решения ниже — какой аргумент вынесен на обложку и почему кампании не нужна
картинка ни на одном слайде.

Остальная колода (6 слайдов) собрана, отрендерена и лежит в
`creatives/legalka-kb/renders/{pl,en}/`: `carousel.pdf`, `story-9x16-01..06`,
`feed-4x5`, `og`, `reel.mp4`/`reel.gif`. Она не публикуется по этой строке
календаря, но проверяется тестами и готова, когда слот появится.

## Чем это отличается от кампании 2 — и почему это главное ограничение

Кампания 2 (`rag-without-hallucinations`, строка 4, **2026-08-11**) построена на
**той же статье** и выходит в ту же ленту LinkedIn за девять дней до этой. Её
обложка — `100%` и «Bot, który mówi „nie wiem”», её первый абзац — про
уверенно врущий чатбот, а её первый пункт — воздержание на 109 «золотых»
вопросах при цитируемости ≈99% и покрытии фактов ≈97%.

Поэтому здесь:

- **обложка не метрика качества, а `60`** — максимальный интервал повторной
  проверки утверждения слоя «норма». Кампания 2 упоминала 60 и 90 одной строкой
  на пятом слайде; здесь это вынесено в заголовок;
- **первый абзац поста — не про галлюцинации, а про то, где лежат данные.**
  Заголовок обложки — «Twoja baza wiedzy, Twój serwer»;
- **109 / 99% / 97% / 100% не используются ни на одном слайде и ни в одной
  строке поста.** Не потому, что они неверны, а потому, что читатель, увидевший
  оба поста, получил бы повтор через девять дней — и продуктовый пост, который
  должен продавать *нашу работу*, прочитался бы как ослабленный пересказ
  верхнего. Ссылка на статью говорит, что качество измеряется, не называя
  цифр повторно;
- **28 091 и 17 284 тоже не используются**: это таблица четвёртого слайда
  кампании 2 целиком. Из объёмов коллектора оставлено одно число — `2,4 млн`, —
  и оно стоит не ради масштаба, а как знаменатель к фильтру персональных
  данных: столько прошло на входе, и при этом «грязный» факт отбрасывается без
  сохранения, а в базу его переносит человек.

Что взято из статьи впервые: два несмешиваемых слоя базы и их сроки, путь
«черновик → рецензия → зверифицировано», фильтр персональных данных «сначала
безопасность», ручной шаг куратора, доля **3%** неправильно разложенных фактов
и — главным аргументом — подмена любой модели на локальную одной настройкой.

## Что именно измеряет каждая цифра

Тест ловит выдуманное число, но **не** ловит правильное число с неправильной
подписью — на этом кампания 2 и споткнулась. Поэтому явно:

- **60** — максимальный интервал между повторными проверками **утверждения**
  слоя «норма» («sprawdzane ponownie nie rzadziej niż co 60 dni»). Это верхняя
  граница процесса, а не «база целиком обновляется раз в 60 дней» и не срок
  жизни факта.
- **90** — самая дальняя дата, после которой факт слоя «**практика**» считается
  неактуальным («nie później niż +90 dni»). Тоже верхняя граница, и относится
  только к «практике»: у «нормы» нет срока годности, у неё есть перепроверка.
- **3** — доля полезных, но **неправильно разложенных по темам** фактов после
  того, как работу классификатора разбили на маленькие порции («przydatnych,
  lecz źle poukładanych faktów zostaje około 3%»). Это **не** доля мусора: доля,
  попадающая в «мусорную» сборную категорию, — это отдельная пара 51% → 23%.
  Ровно эту подмену поймало ревью кампании 2, и здесь она не повторяется.
- **2,4 млн / 2.4 million** — сколько сообщений прошло **через коллектор**, а не
  сколько фактов в базе и не сколько их признано существенными.

Оговорка, которая идёт в пост вместе с цифрами: 60 и +90 — это **верхние
границы процесса**, а не обещание, что каждая строка базы свежа в эту секунду.
И сам Legalka KB — упорядоченные данные, а не юридическая консультация; статья
говорит это своей собственной врезкой.

## Почему `source` — статья, а не страница продукта

`source` объявлен как `slug: legalka-kb-ai-architecture`, хотя кампания
продуктовая. Три причины, и первая — замер:

1. **Корпус страницы продукта содержит ровно три числа — 97, 99 и 100**
   (замерено `test_campaigns._product_corpus('legalka-kb')` + `_NUMBER`: 7561
   знак, три числа). Все три — это метрики кампании 2. Колода, объявившая
   `product`, физически не смогла бы поставить на обложку ничего, кроме них, —
   то есть ровно того, чего эта кампания обязана избежать.
2. **Ни дисциплины базы, ни сменяемости моделей на странице продукта нет.**
   60 дней, +90 дней, «сначала безопасность», ручной шаг куратора, Ollama и
   LM Studio — всё это живёт только в теле статьи. Проверять числа против
   корпуса, в котором их нет, значит не иметь возможности их назвать.
3. **CTA середины воронки ведёт на разговор о постройке, а не на продукт.**
   Страница продукта заканчивается кнопкой в Telegram-бота (`@legalka_pl_bot`),
   то есть предлагает читателю *пользоваться* готовым сервисом. Статья
   заканчивается ровно нашим предложением: «если нужен похожий ассистент,
   который отвечает только из ваших данных, — напишите». Прецедент — кампания 3,
   тоже середина воронки и тоже `slug`.

Заметьте: `test_the_target_link_points_at_the_declared_source` связывает
`source` и `target` намертво, так что «объявить статью, а вести на страницу
продукта» — не вариант, и это правильно.

## Почему в колоде нет слайда с картинкой

Третий случай кампании без картинки — и третье **разное** основание. У кампании
2 схемы отвергла геометрия, у кампании 4 — детектор ужатия; здесь оба гейта
проходит ровно одна схема из четырнадцати, и она пуста по содержанию.

Замер на живой сборке (`npm run build && npm run preview`, порт 4173) через
`capture_screens._MERMAID_MEASURE_JS`, DSF 2. Колонка статьи — 686 px, колонка
страницы продукта — 766 px. Порог `check_mermaid_shrink` — 0,80.

| схема | натуральная ширина PL / EN | ужатие PL / EN | вердикт |
|---|---|---|---|
| `legalka-system-overview` | 2637 / 2428 | 0,26× / 0,28× | детектор |
| `legalka-monorepo` | 442 / 530 | 1,00× / 1,00× | прошла детектор |
| `legalka-page-lifecycle` | 965 / 815 | 0,71× / 0,84× | детектор (PL) |
| `legalka-answer-flow` | 749 / 667 | 0,92× / 1,00× | прошла детектор |
| `legalka-bot-features` | 2343 / 2310 | 0,29× / 0,30× | детектор |
| `legalka-collection-pipeline` | 1901 / 1698 | 0,36× / 0,40× | детектор |
| `legalka-dashboard` | 1119 / 1037 | 0,61× / 0,66× | детектор |
| `legalka-collection-tab` | 276 / 276 | 1,00× / 1,00× | прошла детектор |
| `legalka-review-tab` | 896 / 886 | 0,77× / 0,78× | детектор |
| `legalka-review-sequence` | 1483 / 1478 | 0,46× / 0,46× | детектор |
| `legalka-revision-agent` | 2050 / 1955 | 0,34× / 0,35× | детектор |
| `legalka-revision-dialogue` | 1252 / 1289 | 0,55× / 0,53× | детектор |
| `legalka-end-to-end` | 1620 / 1516 | 0,42× / 0,45× | детектор |
| граф LangGraph со страницы продукта | 1278 / 1278 | 0,60× / 0,60× | детектор |

Три схемы прошли детектор; дальше — второй гейт, `slides._TALL_MIN_SCALE` через
настоящий `slides.render()` на 1080×1350 при однострочном заголовке:

| снимок | исходник | масштаб | предупреждение |
|---|---|---|---|
| `legalka-answer-flow` pl | 1372×2792 | 0,34× | **да** |
| `legalka-answer-flow` en | 1336×2952 | 0,32× | **да** |
| `legalka-monorepo` pl / en | 888×1838 / 1064×1838 | 0,52× / 0,52× | **да** |
| `legalka-collection-tab` | 552×1294 | ~0,73× | нет |

То есть оба гейта проходит одна схема — `legalka-collection-tab`. Снимок открыт
и осмотрен: это **четыре несвязанных серых прямоугольника** с подписями
(«Status ładowania», «Kanały», «Sterowanie», «Magazyny i fakty») — ни одной
стрелки, ни одного ребра. Это не архитектура, а список панелей вкладки
дашборда, то есть тот же тупик по содержанию, что и `g.cluster` у кампании 3.

Отдельно про `legalka-page-lifecycle`: по содержанию она подошла бы третьему
слайду идеально (черновик → рецензия → «зверифицировано — норма / практика»), второй
гейт проходит с запасом (1372×688, 0,733×), но детектор режет её на **PL**
(0,71× против 0,80), а PL — публикуемая локаль. И это не формальность: на
открытом снимке подпись ребра `poprawki (AI lub ręczne)` наезжает на соседнюю
`recenzja kuratora` — схема ломается ещё на странице статьи, до всякой съёмки.

**Решающий довод именно для этой строки календаря:** `build_single.py` рендерит
только `hook`, а `hook` — не тип со снимком. Картинка на любом другом слайде
физически не попала бы в опубликованный пост. Ставить ради неё съёмку,
коммитить PNG и держать вторую точку рассинхрона с сайтом — цена без выручки.
Поэтому: **картинки нет, `capture_screens.py` этой кампании не нужен.**

## Каналы

Контент-план (`content-plan.md`, строка 7) ставит эту кампанию **только в
LinkedIn**, **одиночной картинкой** и **только на польском** — четверг
2026-08-20. Поэтому ниже один канал.

Английский блок написан и отрендерен намеренно, ровно как у кампании 3:
`scripts/spec.py` требует обе локали на каждом слайде, а `tests/test_campaigns.py`
— оба языковых блока в этом файле и полный комплект рендеров в `renders/en/`.
Ослаблять валидатор ради одной строки календаря — это изменение фабрики в угоду
частному случаю; готовый EN ничего не стоит и ждёт своего слота.

## LinkedIn

Формат: одиночный пост — картинка `renders/pl/li-single.png` (1200×627) + текст
ниже. Карусель `renders/pl/carousel.pdf` (6 страниц) собрана и готова, если
одиночный пост решат заменить каруселью.

### PL

Najczęstsze pytanie o asystenta AI na firmowych danych nie brzmi „czy to
zadziała”. Brzmi: „gdzie w takim razie trafiają nasze dane”.

W Legalka KB odpowiedź jest architektoniczna, a nie regulaminowa. Każdy model —
od rozumienia zapytania, przez generowanie odpowiedzi, po rozpoznawanie i
syntezę mowy — podmienia się na lokalny (Ollama, LM Studio) jednym ustawieniem,
a sam kod zostaje ten sam. Cały stos może więc stać na Twoim serwerze i nie
wysyłać pytań użytkowników na zewnątrz.

Druga połowa tej samej odpowiedzi jest nudniejsza i ważniejsza: asystent jest
tyle wart, ile dyscyplina wokół bazy. Trzy rzeczy, których w niej pilnujemy:

→ Dwie warstwy, których nigdy nie mieszamy. „Norma” to, czego wymaga prawo — z
odnośnikiem do źródła, oznaczana jako zweryfikowana dopiero po recenzji
prawnika i sprawdzana ponownie nie rzadziej niż co 60 dni. „Praktyka” to
obserwacja wnioskodawców, zawsze z datą, po której fakt uznaje się za
nieaktualny — nie później niż +90 dni.
→ Nic nie trafia do użytkownika bez recenzji. Każda strona powstaje jako szkic;
dopóki nim jest, bot może ją pokazać, ale uczciwie oznacza taką odpowiedź jako
niezweryfikowaną, zamiast podawać ją za sprawdzoną.
→ Zbieranie jest półautomatyczne, przeniesienie faktu do bazy — nie. Przez
kolektor przeszło około 2,4 mln wiadomości z otwartych czatów, a filtr danych
osobowych działa według zasady „najpierw bezpieczeństwo”: każdy „brudny” fakt
jest odrzucany bez zapisu. Do bazy fakt przenosi zawsze kurator, nigdy automat.

Zastrzeżenie, bez którego te liczby obiecują za dużo: 60 dni to maksymalny
odstęp między sprawdzeniami twierdzenia z warstwy „norma”, a +90 dni to
najdalsza data ważności faktu z „praktyki”. Jedno i drugie to górna granica
procesu, a nie gwarancja, że każdy wiersz bazy jest świeży w tej sekundzie. I
sam Legalka KB to uporządkowane dane, nie porada prawna.

Cała architektura opisana od środka, ze wszystkimi schematami z wewnętrznej
dokumentacji — razem z tym, jak mierzymy jakość odpowiedzi i z jakim wynikiem:
https://mi-code.pl/blog/legalka-kb-ai-architecture/?utm_source=linkedin&utm_medium=social&utm_campaign=legalka-kb

Zbudowaliśmy to u siebie i ten sam rygor przenosimy na cudze dane i cudze
procesy. Potrzebujesz asystenta, który odpowiada wyłącznie z Twojej bazy — i
może stać na Twoim serwerze? Napisz na development@mi-code.pl.

#AI #RAG #LLM #enterprise #softwarehouse #ITPolska #legaltech

### EN

The most common question about an AI assistant on company data is not “will it
work”. It is “where does our data end up once it does”.

In Legalka KB the answer is architectural rather than contractual. Every model —
from understanding the question, through composing the answer, to speech
recognition and synthesis — swaps for a local one (Ollama, LM Studio) with a
single setting, while the code itself stays the same. So the whole stack can run
on your own server and never send users' questions outside.

The other half of the same answer is duller and matters more: an assistant is
worth exactly as much as the discipline around its base. Three things we hold
to:

→ Two layers that are never mixed. “Norm” is what the law requires — linked to
its source, marked verified only after a lawyer's review, and re-checked at
least once every 60 days. “Practice” is an applicants' observation, always
dated, with a date after which the fact counts as stale — no later than
+90 days.
→ Nothing reaches a user without review. Every page is born as a draft; while it
is one, the bot may still show it, but honestly marks such an answer as
unverified rather than passing it off as checked.
→ Collection is semi-automatic; promoting a fact is not. Around 2.4 million
messages from open chats have passed through the collector, and the
personal-data filter runs on a “safety first” principle: any “dirty” fact is
dropped without being saved. Moving a fact into the base is always a manual step
by the curator, never automatic.

The caveat without which those numbers promise too much: 60 days is the maximum
gap between two checks of a claim in the “norm” layer, and +90 days is the
furthest expiry a “practice” fact can carry. Both are upper bounds on a process,
not a guarantee that every row of the base is fresh this second. And Legalka KB
itself is structured data, not legal advice.

The whole architecture from the inside, with every diagram from our internal
documentation — including how we measure answer quality and with what result:
https://mi-code.pl/en/blog/legalka-kb-ai-architecture/?utm_source=linkedin&utm_medium=social&utm_campaign=legalka-kb

We built it in-house, and the same rigour carries over to someone else's data
and someone else's processes. Need an assistant that answers strictly from your
own base — and can run on your own server? Write to development@mi-code.pl.

#AI #RAG #LLM #enterprise #softwarehouse #Poland #legaltech
