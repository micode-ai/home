# ai-act-2026 — тексты

Кампания верха воронки, шестая в этом треке и восьмая отгруженная. Ведёт на
статью `ai-act-sierpien-2026-co-obowiazuje`, из статьи — на контакт
`development@mi-code.pl`.

Адресат — **владелец бизнеса или руководитель, у которого уже есть чат-бот и
AI-контент**. Это пятый адресат фабрики после CTO, маркетинг-директора,
владельца бизнеса и tech-лида, и от «владельца бизнеса» строки 8 он отличается
вопросом: там «сколько это стоит и что автоматизирует», здесь «за что меня
могут оштрафовать и что сделать до конца квартала». Поэтому в колоде нет ни
архитектуры, ни LangGraph — только календарь, четыре обязанности и две суммы.

Цифры: см. `campaigns/ai-act-2026/campaign.json` → `source.figures`. Новых не
выдумывать — всё, что стоит в постах, должно дословно стоять в статье;
`tests/test_campaigns.py` сканирует и слайды, и публикуемую прозу ниже.
Ссылки собраны `spec.Campaign.link()`, схема — в `cta-blocks.md`.

## Что именно измеряет каждая цифра

У этой статьи, в отличие от кампаний 4 и 6, чисел много: скан тем же
регулярным выражением, которым числа проверяет `tests/test_campaigns.py`, даёт
**26 различных чисел** в корпусе `bodyPl` + `bodyEn`. Но почти все они —
**даты и пороги из закона, а не наши измерения**, и это надо держать в голове
при любой правке колоды.

- **50** — номер статьи AI Act об обязанностях прозрачности. Это обложка, и это
  не метрика: единственное число в статье, которое читатель уже держит в голове
  как имя («артикул 50»), поэтому оно работает крючком без подписи-расшифровки.
  Обложка кампании 4 несёт дату по той же логике — честное число, а не
  подогнанное.
- **2027** — год, на который Digital Omnibus перенёс обязанности для систем
  высокого риска из Приложения III (точная дата — 2 декабря 2027). Перенос на
  16 месяцев.
- **2028** — то же для Приложения I, встроенного в регулируемые продукты
  (2 августа 2028). Перенос на 12 месяцев.
- **2026** — год, в котором всё это уже действует: статья 50 с 2 августа,
  польская ustawa o systemach AI с 11 августа.
- **15** и **35** — пороги штрафов в миллионах евро (15 млн или 3% оборота за
  нарушение статьи 50; 35 млн или 7% за запрещённые практики). Это суммы **из
  регламента**, а не наша оценка чьего-либо риска, и в постах они стоят именно
  так.
- **28** — день октября, с которого KRiBSI может налагать административные
  штрафы. Для этой кампании это самое практичное число из всех: календарь ставит
  публикацию на 22 сентября, то есть за пять недель до даты.

Чего в статье **нет** и чего поэтому нет в колоде: количества оштрафованных
компаний, доли фирм, готовых к AI Act, стоимости комплаенса. Ни одной такой
цифры в источнике не существует, и любая из них была бы выдуманной.

## Почему в колоде нет слайда с картинкой

Здесь основание отличается от всех четырёх предыдущих отказов, и его стоит
назвать прямо: **картинка не отвергнута замером — замер не проводился**.

У статьи есть ровно два кандидата: схема `ai-act-timeline` (mermaid,
`flowchart LR` с двумя подграфами по четыре узла) и таблица `ai-act-dates`
(`src/data/article-tables.ts`, 3 колонки × 8 строк). Оба живут на странице
статьи, то есть снять их можно только через `capture_screens.py`, а это требует
поднятой сборки (`npm run build && npm run preview`) и установленного chromium
для playwright. Ни `check_mermaid_shrink`, ни `_TALL_MIN_SCALE` по ним не
запускались.

Правило фабрики читается в одну сторону: картинка едет в ленту **только с
замером**. Нет замера — нет слайда, и колода собрана так, чтобы три слайда
`numbers` несли всё содержание сами (тот же ответ, что у кампаний 2 и 4).

Что мерить, если картинку решат добавить, и в каком порядке:

1. **`ai-act-dates`** — сильный кандидат и главный цитируемый блок статьи.
   Прецедент прямой: кампания 1 снимает `.calc-table-wrap`, тоже таблицу из
   статьи, 1340×474. Оговорка из `README.md` действует именно здесь: плотная
   таблица проходит порог масштаба и при этом отрисовывается глифами в 11 px, —
   значит после первой съёмки **нужно открыть PNG глазами**, а не смотреть
   только на предупреждение.
2. **`ai-act-timeline`** — слабый кандидат. Две подгруппы рядом по горизонтали
   плюс три строки текста в каждом узле дают натуральную ширину заведомо больше
   колонки статьи (720 CSS px), а `MermaidDiagram.svelte` инициализирует mermaid
   с `useMaxWidth: true`, поэтому страница ужмёт схему целиком вместе с текстом
   ещё до съёмки. Это ожидание, а не замер, — но проверять первым стоит не его.

У таблицы есть и языковая тонкость, которая решает тип слайда: `ai-act-dates`
хранит собственные `headers`/`rows` на pl и en, поэтому один общий снимок
положил бы польскую таблицу под английский заголовок. То есть это путь
`diagram` с **двумя** снимками (`/blog/…` и `/en/blog/…`), как у кампании 1, а
не `tall-diagram` с одним.

## Каналы

Контент-план (`content-plan.md`, строка 14) ставит эту кампанию **только в
LinkedIn** — карусель PL + EN, вторник 2026-09-22. Разделы под Instagram
написаны на опережение, как у кампании 4: тексты готовы, строк в календаре у
них пока нет.

| Раздел | Куда | Формат | `utm_source` |
|---|---|---|---|
| `## LinkedIn` | LinkedIn | `carousel.pdf`, запасной `li-single.png` | `linkedin` |
| `## Facebook` | **лента Instagram** и Facebook | `reel-4x5.mp4` или `feed-4x5.png` | `facebook` |
| `## Stories` | Stories и Reels | `reel.mp4` + `story-9x16-01..06.png` | `instagram` |

Про дату публикации отдельно. Статья вышла 11 августа, по горячему инфоповоду, а
календарь ставит кампанию на 22 сентября — правило «верх воронки во вторник» и
порядок строк не дают встать раньше. Это не ошибка плана, но она меняет акцент:
к 22 сентября «перенесли или нет» уже не новость, зато **обе даты из пятого
слайда ещё впереди** — 28 октября (штрафы KRiBSI) и 2 декабря (конец карантина
на маркировку). Поэтому и посты ниже построены не на новости о переносе, а на
двух наступающих сроках.

## LinkedIn

Формат: карусель-документ `renders/<lang>/carousel.pdf` (6 страниц) + текст
ниже. Обложка одиночного поста, если карусель не заходит, —
`renders/<lang>/li-single.png`.

### PL

Przesunęli AI Act. Artykułu 50 nie przesunęli.

Digital Omnibus on AI — rozporządzenie (UE) 2026/1744 — jest już obowiązującym
prawem i faktycznie odsuwa najcięższy blok obowiązków: systemy wysokiego ryzyka
z Załącznika III mają teraz termin 2 grudnia 2027, a te z Załącznika I —
2 sierpnia 2028.

To nie amnestia i nie koniec tematu, bo z przesunięcia wyłączono dokładnie tę
część, która dotyczy najpowszechniejszych zastosowań AI w firmie:

→ Artykuł 50 obowiązuje od 2 sierpnia 2026 i jest przypisany do funkcji
systemu, nie do poziomu ryzyka. Nie musisz mieć systemu wysokiego ryzyka, żeby
cię dotyczył — wystarczy, że masz chatbota.
→ Cztery obowiązki: powiedz człowiekowi, że rozmawia z AI; oznaczaj treści
syntetyczne w formacie maszynowo czytelnym; ujawniaj deepfake oraz teksty
publikowane w sprawach interesu publicznego; informuj osoby, wobec których
działa rozpoznawanie emocji.
→ Kary: do 15 mln euro albo 3% światowego obrotu. Najwyższy pułap, 35 mln euro
albo 7%, dotyczy praktyk zakazanych, a nie dokumentacji.

Dwa terminy są dopiero przed nami i właśnie one są dziś praktyczne. Karencja na
maszynowe znakowanie treści kończy się 2 grudnia 2026 — do tego czasu warto
sprawdzić, co realnie oferuje Twój dostawca modelu i czy oznaczenie przeżywa
Twój własny pipeline publikacji: konwersję, kompresję, przycięcie do formatu
społecznościowego. A polski organ nadzoru, KRiBSI, może nakładać kary
administracyjne od 28 października 2026; sama ustawa o systemach sztucznej
inteligencji weszła w życie 11 sierpnia 2026.

Jest też wyjątek, który w praktyce ratuje najwięcej firm: jeśli treści
generowane przez AI przechodzą przez człowieka, który je czyta, poprawia i
firmuje, obowiązek ujawnienia z artykułu 50 ust. 4 nie powstaje. Warunek —
odpowiedzialność redakcyjna musi być realna i przypisana konkretnej osobie, a
nie zapisana w prezentacji.

Uczciwe zastrzeżenie, bez którego to brzmi jak straszenie: to nie jest porada
prawna, a daty zmieniły się już raz — trzy tygodnie przed publikacją artykułu.
Dlatego materiał podaje źródła, do których warto zajrzeć samemu.

Co przesunięto, co obowiązuje od dziś i sześć kroków na ten kwartał:
https://mi-code.pl/blog/ai-act-sierpien-2026-co-obowiazuje/?utm_source=linkedin&utm_medium=social&utm_campaign=ai-act-2026

Masz chatbota albo publikujesz treści generowane przez AI i nie wiesz, czy od
strony technicznej jesteś w porządku? Napisz na development@mi-code.pl.

#AIAct #compliance #AI #chatbot #softwarehouse #ITPolska

### EN

They deferred the AI Act. They did not defer Article 50.

The Digital Omnibus on AI — Regulation (EU) 2026/1744 — is law in force, and it
really does push back the heaviest block of obligations: standalone high-risk
systems under Annex III now have 2 December 2027, and Annex I systems
2 August 2028.

That is not an amnesty and not the end of the subject, because the deferral
deliberately left out the part that covers the most common uses of AI in a
company:

→ Article 50 has applied since 2 August 2026, and it attaches to a system's
function rather than to a risk tier. You do not need a high-risk system for it
to apply — a chatbot is enough.
→ Four duties: tell a person they are talking to AI; mark synthetic content in
a machine-readable format; disclose deepfakes and text published on matters of
public interest; inform people subject to emotion recognition.
→ Fines: up to EUR 15 million or 3% of worldwide turnover. The top tier, EUR 35
million or 7%, applies to prohibited practices, not to documentation.

Two deadlines are still ahead, and those are the practical ones today. The
grace period for machine-readable content marking ends on 2 December 2026 —
before then it is worth checking what your model vendor actually offers, and
whether the mark survives your own publishing pipeline: conversion,
compression, the crop to a social format. And Poland's supervisory authority,
KRiBSI, can impose administrative fines from 28 October 2026; the act on
artificial intelligence systems itself entered into force on 11 August 2026.

There is also the exception that rescues most companies in practice: if
AI-generated content passes through a human who reads it, edits it and stands
behind it, the Article 50(4) disclosure duty does not arise. The condition is
that editorial responsibility has to be real and assigned to a named person,
not written into a slide deck.

The honest caveat, without which this reads like scaremongering: this is not
legal advice, and the dates already changed once — three weeks before the
article was published. Which is why the piece cites the sources you should
check yourself.

What moved, what applies today, and six steps for this quarter:
https://mi-code.pl/en/blog/ai-act-sierpien-2026-co-obowiazuje/?utm_source=linkedin&utm_medium=social&utm_campaign=ai-act-2026

Running a chatbot or publishing AI-generated content and unsure whether you are
sound on the technical side? Write to development@mi-code.pl.

#AIAct #compliance #AI #chatbot #softwarehouse #Poland

## Facebook

**Это и есть текст поста для Instagram** (и Facebook) — фид. Формат:
`renders/<lang>/reel-4x5.mp4`, если постим видео, или
`renders/<lang>/feed-4x5.png`, если картинкой. Канал называется `Facebook`,
потому что строка плана называется «Facebook + Instagram фид» и `utm_source` у
неё общий — `facebook`; отдельного `instagram` у фида нет, он занят каналом
`## Stories`.

Почему текст отдельный, а не тот же, что в LinkedIn: **подпись в Instagram
обрезается на 2200 знаках**, а версия выше существенно длиннее. Дело и в
аудитории: здесь листают ленту, а не читают разбор, поэтому ниже — один крючок,
два наступающих срока и одна ссылка. Никаких стрелок-буллетов и никакого
«Załącznik III».

### PL

Przesunęli AI Act. Artykułu 50 nie przesunęli.

Obowiązki dla systemów wysokiego ryzyka pojechały na grudzień 2027. Ale
przejrzystość z artykułu 50 obowiązuje od 2 sierpnia 2026 i nie zależy od
poziomu ryzyka — wystarczy, że masz chatbota albo publikujesz treści
generowane przez AI.

Dwa terminy są jeszcze przed Tobą: od 28 października 2026 polski organ
nadzoru może nakładać kary, a 2 grudnia 2026 kończy się karencja na maszynowe
znakowanie treści.

Za samą przejrzystość grozi do 15 mln euro albo 3% światowego obrotu — więc
warto to sprawdzić, zanim sprawdzi ktoś inny.

Co dokładnie obowiązuje i co zrobić w tym kwartale:
https://mi-code.pl/blog/ai-act-sierpien-2026-co-obowiazuje/?utm_source=facebook&utm_medium=social&utm_campaign=ai-act-2026

To nie porada prawna — to stan na dziś, z linkami do źródeł. Masz pytanie o
swojego chatbota? Napisz na development@mi-code.pl.

#AIAct #compliance #AI #chatbot #softwarehouse #ITPolska

### EN

They deferred the AI Act. They did not defer Article 50.

High-risk obligations moved to December 2027. But Article 50 transparency has
applied since 2 August 2026 and does not depend on a risk tier — a chatbot or
AI-generated content is enough to be covered.

Two deadlines are still ahead of you: from 28 October 2026 Poland's supervisory
authority can impose fines, and on 2 December 2026 the grace period for
machine-readable content marking ends.

Transparency alone carries up to EUR 15 million or 3% of worldwide turnover —
so it is worth checking before somebody else does.

What exactly applies and what to do this quarter:
https://mi-code.pl/en/blog/ai-act-sierpien-2026-co-obowiazuje/?utm_source=facebook&utm_medium=social&utm_campaign=ai-act-2026

Not legal advice — a snapshot with links to the sources. Question about your
own chatbot? Write to development@mi-code.pl.

#AIAct #compliance #AI #chatbot #softwarehouse #Poland

## Stories

Шесть кадров под `renders/<lang>/story-9x16-01..06.png`. Кадры рендерятся из
тех же слайдов, что и карусель (`build_reel.py` → `slides.render`), поэтому на
самом кадре уже напечатан полный текст слайда. Тот же проход даёт видео:
`renders/<lang>/reel.mp4` (и `reel.gif` для превью).

Видео берётся по плейсменту, а не по привычке: в Reels и Stories идёт
`reel.mp4` (9:16), в ленту — `reel-4x5.mp4` (4:5). Таблица «какое видео куда» —
в `README.md`.

Строки ниже — не текст кадра, а сопроводительная подпись: то, что набирается
стикером поверх стори или произносится за кадром. Одна фраза на кадр, не длиннее
шести слов; ссылка — только на последнем кадре, свайпом вверх.

Оговорка этой кампании: у статьи чисел много, и все они из закона — даты и
пороги штрафов. Подписи ниже несут ровно два числа, `50` и `28`, оба стоят в
статье дословно; «сколько компаний уже оштрафовали» в источнике нет, и в
подписи это попасть не может.

### PL

1. `story-9x16-01.png` — Przesunęli AI Act, nie artykuł 50
2. `story-9x16-02.png` — Odroczenie to nie amnestia
3. `story-9x16-03.png` — Wysokie ryzyko czeka, przejrzystość nie
4. `story-9x16-04.png` — Masz chatbota? Powiedz, że to AI
5. `story-9x16-05.png` — KRiBSI karze od 28 października
6. `story-9x16-06.png` — Sprawdzimy Twojego chatbota →
   https://mi-code.pl/blog/ai-act-sierpien-2026-co-obowiazuje/?utm_source=instagram&utm_medium=social&utm_campaign=ai-act-2026

### EN

1. `story-9x16-01.png` — They deferred the Act, not Article 50
2. `story-9x16-02.png` — A deferral is not an amnesty
3. `story-9x16-03.png` — High risk waits, transparency does not
4. `story-9x16-04.png` — Got a chatbot? Say it is AI
5. `story-9x16-05.png` — KRiBSI starts fining 28 October
6. `story-9x16-06.png` — We will review your chatbot →
   https://mi-code.pl/en/blog/ai-act-sierpien-2026-co-obowiazuje/?utm_source=instagram&utm_medium=social&utm_campaign=ai-act-2026
