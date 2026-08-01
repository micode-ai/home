# cost-of-ai-agent — тексты

Кампания верха воронки. Ведёт на статью `ai-agent-cost-per-month-model`, из
статьи — на контакт `development@mi-code.pl`.

Цифры: см. `campaigns/cost-of-ai-agent/campaign.json`. Новых не выдумывать —
всё, что стоит в постах, должно дословно стоять в статье. Ссылки собраны
`spec.Campaign.link()`, схема — в `cta-blocks.md`.

Важная оговорка, которую нельзя терять при сокращении текста: $74.38 — это
**расчётная модель на объявленных допущениях, а не наш счёт от провайдера**.
Статья говорит об этом первым же абзацем после вступления; пост, который
подаёт эту цифру как факт из своей бухгалтерии, продаёт то, чего у нас нет.

## LinkedIn

Формат: карусель-документ `renders/<lang>/carousel.pdf` (6 страниц) + текст
ниже. Обложка одиночного поста, если карусель не заходит, —
`renders/<lang>/li-single.png`.

### PL

„Ile to będzie kosztować miesięcznie?” — pierwsze pytanie w każdej rozmowie
o agencie AI. I niemal jedyne, na które pada odpowiedź „to zależy”.

Odpowiedź szczera i bezużyteczna: nie daje ani rzędu wielkości, ani pojęcia,
co zmienić, jeśli liczba się nie spodoba.

A pytanie da się policzyć. Potrzebne są trzy rzeczy: formuła, konfiguracja
referencyjna i jawnie wypisane założenia. W naszej konfiguracji referencyjnej
— 8 kroków na zadanie, 1500 zadań miesięcznie, gpt-5.4-mini — wychodzi $74.38
miesięcznie. Trzy rzeczy, które warto z tego zapamiętać:

→ Rozrzut między modelami przy identycznej pracy to 25× — od $50.34 do
$1254.00 miesięcznie. Spór o „drogi model” bez ustalonych założeń nie
prowadzi donikąd.
→ 98,5% tokenów wymiany to wejście, nie odpowiedź modelu. Model nie pamięta
poprzedniego kroku i dostaje go opowiedzianego od nowa, więc rachunek robi
przesyłanie, a nie inteligencja.
→ 82% tego wejścia to stabilny prefiks, który da się podać z cache — a
wejście z cache jest tańsze o około 90%. To jedyna dźwignia, która nie zmienia
ani słowa w zapytaniu.

Zastrzeżenie, bez którego ta liczba jest nieuczciwa: to model wyliczeniowy na
jawnych założeniach, a nie nasza faktura. Zmieni się założenie — zmieni się
liczba. Dlatego cały rachunek rozłożyliśmy na czynniki i dołożyliśmy
kalkulator, w który wstawisz własne liczby:
https://mi-code.pl/blog/ai-agent-cost-per-month-model/?utm_source=linkedin&utm_medium=social&utm_campaign=cost-of-ai-agent

Wyceniasz agenta AI dla swojej firmy? Napisz na development@mi-code.pl —
policzymy model kosztu na Twoich narzędziach i zadaniach.

#AI #agentAI #LLM #enterprise #softwarehouse #Gdańsk #ITPolska #kosztyIT

### EN

"How much will this cost per month?" is the first question in every
conversation about an AI agent. It is also the one that almost always gets
answered with "it depends."

That answer is honest and useless: it gives you neither an order of magnitude
nor any idea what to change if the number turns out wrong.

The question is computable. It needs three things: a formula, a reference
configuration, and assumptions written down in the open. On our reference
configuration — 8 steps per task, 1500 tasks a month, gpt-5.4-mini — it comes
out at $74.38 per month. Three things worth taking away:

→ The spread between models doing identical work is 25× — $50.34 to $1254.00
per month. Arguing about an "expensive model" before the assumptions are
pinned down leads nowhere.
→ 98.5% of the tokens in an exchange are input, not the model's answer. The
model remembers nothing between calls and gets the previous step retold in
full, so the bill is driven by re-sending, not by intelligence.
→ 82% of that input is a stable prefix that can be served from cache — and
cached input is about 90% cheaper. It is the one lever that changes not a
single word of the request.

The caveat without which that number is dishonest: this is a calculation
model on declared assumptions, not our invoice. Change an assumption and the
number changes with it. So we broke the whole bill down into its parts and
added a calculator you can put your own numbers into:
https://mi-code.pl/en/blog/ai-agent-cost-per-month-model/?utm_source=linkedin&utm_medium=social&utm_campaign=cost-of-ai-agent

Pricing an AI agent for your company? Write to development@mi-code.pl — we
build the cost model on your tools and your tasks.

#AI #AIagents #LLM #enterprise #softwarehouse #Poland #techleadership #cloudcosts

## Facebook

Формат: `renders/<lang>/feed-4x5.png`. Аудитория здесь — владельцы бизнеса,
а не инженеры: вдвое короче LinkedIn, без стрелок-буллетов и без жаргона.
Один крючок ($74.38), один контраст (25×), одна ссылка.

### PL

Pierwsze pytanie o agenta AI brzmi zawsze tak samo: ile to będzie kosztować
miesięcznie? I prawie zawsze pada odpowiedź „to zależy”.

Da się policzyć. W naszej konfiguracji referencyjnej wychodzi $74.38
miesięcznie — a przy tej samej pracy sam wybór modelu robi 25 razy różnicy,
od $50.34 do $1254.00. To wyliczenie na jawnych założeniach, nie nasza
faktura: zmieni się założenie, zmieni się liczba.

Rozłożyliśmy cały rachunek na czynniki i dołożyliśmy kalkulator, w który
wstawisz własne liczby:
https://mi-code.pl/blog/ai-agent-cost-per-month-model/?utm_source=facebook&utm_medium=social&utm_campaign=cost-of-ai-agent

Wyceniasz agenta AI dla swojej firmy? Napisz na development@mi-code.pl.

#AI #agentAI #enterprise #softwarehouse #Gdańsk #ITPolska #kosztyIT

### EN

The first question about an AI agent is always the same: how much will it
cost per month? And the answer is almost always "it depends."

It is computable. On our reference configuration it comes out at $74.38 per
month — and on identical work the choice of model alone makes 25 times the
difference, from $50.34 to $1254.00. This is a calculation on declared
assumptions, not our invoice: change an assumption and the number changes.

We broke the whole bill down into its parts and added a calculator you can
put your own numbers into:
https://mi-code.pl/en/blog/ai-agent-cost-per-month-model/?utm_source=facebook&utm_medium=social&utm_campaign=cost-of-ai-agent

Pricing an AI agent for your company? Write to development@mi-code.pl.

#AI #AIagents #enterprise #softwarehouse #Poland #techleadership #cloudcosts

## Stories

Шесть кадров под `renders/<lang>/story-9x16-01..06.png` — они повторяют
слайды карусели один в один. По одной фразе на кадр, не длиннее шести слов;
ссылка только на последнем, свайпом вверх. Тот же проход есть видео:
`renders/<lang>/reel.mp4` (и `reel.gif` для превью).

### PL

1. `story-9x16-01.png` — Agent AI: $74.38 miesięcznie
2. `story-9x16-02.png` — „To zależy” to nie odpowiedź
3. `story-9x16-03.png` — Ta sama praca, 25 razy różnicy
4. `story-9x16-04.png` — Płacisz za przesyłanie, nie inteligencję
5. `story-9x16-05.png` — Schematy narzędzi: 69% rachunku
6. `story-9x16-06.png` — Policzymy to na Twoich danych →
   https://mi-code.pl/blog/ai-agent-cost-per-month-model/?utm_source=instagram&utm_medium=social&utm_campaign=cost-of-ai-agent

### EN

1. `story-9x16-01.png` — An AI agent: $74.38 per month
2. `story-9x16-02.png` — "It depends" is not an answer
3. `story-9x16-03.png` — Same work, 25 times apart
4. `story-9x16-04.png` — You pay for re-sending, not intelligence
5. `story-9x16-05.png` — Tool schemas: 69% of the bill
6. `story-9x16-06.png` — We will price it on your data →
   https://mi-code.pl/en/blog/ai-agent-cost-per-month-model/?utm_source=instagram&utm_medium=social&utm_campaign=cost-of-ai-agent
