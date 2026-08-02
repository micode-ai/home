# rag-without-hallucinations — тексты

Кампания верха воронки. Ведёт на статью `legalka-kb-ai-architecture`, из
статьи — на контакт `development@mi-code.pl`.

Цифры: см. `campaigns/rag-without-hallucinations/campaign.json` → `source.figures`.
Новых не выдумывать — всё, что стоит в постах, должно дословно стоять в статье;
`tests/test_campaigns.py` сканирует каждое число со слайдов по телу статьи.
Ссылки собраны `spec.Campaign.link()`, схема — в `cta-blocks.md`.

Оговорка, которую нельзя терять при сокращении текста: 100% — это
**воздержание на вопросах вне базы, измеренное на наборе из 109 «золотых»
вопросов**, а не обещание, что бот никогда не ошибётся. Статья формулирует это
именно так («качество измеряется, а не предполагается»), и там же стоит её
собственная оговорка: Legalka KB — не юридическая консультация, а собранные и
упорядоченные данные. Пост, который подаёт 100% как «бот не врёт вообще»,
продаёт то, чего в статье нет.

Второй по силе аргумент для B2B — не метрика, а фраза из вывода статьи: секрет
не в размере модели, а в дисциплине вокруг неё. Она же несёт слайд 5.

## Каналы

Контент-план (`content-plan.md`, строка 4) ставит эту кампанию **только в
LinkedIn** — карусель PL + EN, вторник 2026-08-11. Поэтому ниже один канал.
Остальные форматы (`feed-4x5.png`, `story-9x16-01..06.png`, `reel.mp4`,
`og.png`) отрендерены и лежат в `creatives/rag-without-hallucinations/renders/`
— они готовы к публикации, но в календаре для них слота нет; когда он
появится, сюда добавляется `## Facebook` / `## Stories` с собственными
`utm_source`, и `test_campaigns.py` начнёт требовать их сам.

## LinkedIn

Формат: карусель-документ `renders/<lang>/carousel.pdf` (6 страниц) + текст
ниже. Обложка одиночного поста, если карусель не заходит, —
`renders/<lang>/li-single.png`.

### PL

Zwykły chatbot zapytany o urząd nie milczy. Odpowiada — pewnie, płynnie i
ze szczegółami: numer konta, termin, adres. Część z nich nie istnieje.

W większości zastosowań to koszt zerowy. W prawie, medycynie, administracji
i finansach pewna siebie pomyłka jest droższa niż brak odpowiedzi, bo brak
odpowiedzi wysyła człowieka do źródła, a wymyślony numer konta — na przelew.

Zbudowaliśmy asystenta, który w takiej sytuacji mówi „nie wiem”. Legalka KB
odpowiada wyłącznie ze zweryfikowanej bazy wiedzy i wstrzymuje się, gdy w
bazie odpowiedzi nie ma. Trzy rzeczy, które warto z tego zapamiętać:

→ Wstrzymanie się przy pytaniach spoza bazy — 100%. To wynik zmierzony przez
osobny model w roli sędziego na zestawie 109 „złotych” pytań, przy
cytowalności około 99% i pokryciu faktów około 97%. Każda nowa strona bazy
dokłada do zestawu co najmniej jedno pytanie.
→ Baza jest produktem, nie model. Kolektor przepuścił około 2,4 mln
wiadomości, uznał 28 091 za istotne i wyodrębnił z nich 17 284 fakty
praktyczne — ale przeniesienie faktu do bazy to zawsze ręczny krok kuratora,
nigdy automat. Warstwa „norma” jest weryfikowana ponownie nie rzadziej niż
co 60 dni, a fakt z warstwy „praktyka” ma datę ważności nie później niż +90 dni.
→ Nic z tego nie jest przywiązane do jednego dostawcy. Każdy model — od
rozumienia zapytania po syntezę mowy — podmienia się na lokalny (Ollama,
LM Studio) jednym ustawieniem, więc cały stos może stać na Twoim serwerze i
nie wysyłać pytań użytkowników na zewnątrz.

Zastrzeżenie, bez którego te liczby są nieuczciwe: 100% dotyczy wstrzymania
się przy pytaniach spoza bazy, a nie nieomylności. Sam bot też to mówi — to
uporządkowane dane, nie porada prawna, i pod każdą odpowiedzią są oficjalne
linki do samodzielnego sprawdzenia.

Cała architektura opisana od środka, ze wszystkimi schematami z wewnętrznej
dokumentacji:
https://mi-code.pl/blog/legalka-kb-ai-architecture/?utm_source=linkedin&utm_medium=social&utm_campaign=rag-without-hallucinations

Sekret nie tkwi w rozmiarze modelu, lecz w dyscyplinie wokół niego.
Potrzebujesz asystenta, który odpowiada wyłącznie z Twoich danych? Napisz na
development@mi-code.pl.

#AI #RAG #LLM #enterprise #softwarehouse #Gdańsk #ITPolska #legaltech

### EN

Ask a generic chatbot about a government office and it will not stay silent.
It answers — confidently, fluently, with detail: an account number, a
deadline, an address. Some of them do not exist.

In most uses that costs nothing. In law, medicine, public services and
finance a confidently wrong answer is more expensive than no answer at all,
because no answer sends a person to the source, while an invented account
number sends them to the bank.

We built an assistant that says "I don't know" instead. Legalka KB answers
strictly from a verified knowledge base and abstains when the base has no
answer. Three things worth taking away:

→ Abstention on out-of-base questions — 100%. Measured by a separate judge
model over a set of 109 "golden" questions, alongside citation accuracy of
about 99% and fact coverage of about 97%. Every new page in the base adds at
least one more question to that set.
→ The base is the product, not the model. The collector has processed around
2.4 million messages, judged 28,091 of them relevant and extracted 17,284
practical facts — but moving a fact into the base is always a manual step by
the curator, never automatic. The "norm" layer is re-checked at least once
every 60 days, and a "practice" fact carries an expiry no later than +90 days.
→ None of it is tied to a single provider. Every model — from understanding
the question to speech synthesis — swaps for a local one (Ollama, LM Studio)
with a single setting, so the whole stack can run on your own server and
never send users' questions outside.

The caveat without which those numbers are dishonest: the 100% is abstention
on out-of-base questions, not infallibility. The bot says so itself — this is
structured data, not legal advice, and every answer carries official links to
check for yourself.

The whole architecture from the inside, with every diagram from our internal
documentation:
https://mi-code.pl/en/blog/legalka-kb-ai-architecture/?utm_source=linkedin&utm_medium=social&utm_campaign=rag-without-hallucinations

The secret is not the size of the model but the discipline around it. Need an
assistant that answers strictly from your own data? Write to
development@mi-code.pl.

#AI #RAG #LLM #enterprise #softwarehouse #Poland #techleadership #legaltech
