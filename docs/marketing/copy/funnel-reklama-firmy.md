# reklama-firmy — тексты

Кампания верха воронки, но не про продукт и не про статью-разбор — про саму
компанию. Ведёт на статью `o-firmie-micode`, из статьи — на контакт
`development@mi-code.pl`. Единственная кампания фабрики, у которой источник —
не техническая статья с формулой или архитектурой, а описание компании, и
единственная, чей адресат — читатель, который вообще ещё не знает, кто такой
MiCode.

Цифры: см. `campaigns/reklama-firmy/campaign.json` → `source.figures`. Ровно
две — `2024` (год założenia) и `18` (лет опыта założyciela) — потому что это
единственные величины, которые статья пишет цифрой. Всё остальное (sześć
produktów, cztery repozytoria, jeden pakiet npm, trzy strony, trzy linie
usług, pięć kroków, trzy dni robocze na wycenę) статья пишет **słowami**, więc
w kreatywie też stoi słowami — cyfrowego śladu tam nie ma, a `tests/
test_campaigns.py` sканирует и слайды, и публикуемую прозу ниже. Ссылки
собраны `spec.Campaign.link()`, схема — в `cta-blocks.md`.

Колода не несёт слайда `diagram`/`tall-diagram`. Человек прикрепил в `src/`
четыре сертификата (Oracle ADF, дважды Hugging Face, NVIDIA) — это подлинные
дипломы основателя, они подтверждают «18-letnie doświadczenie» и то, что
обучение AI продолжается сейчас, а не осталось в резюме. Но оба типа
картиночных слайдов этой фабрики требуют `shot` — инструкцию для
`capture_screens.py`, то есть подпись, что картинка снята с живой страницы
сайта. Эти файлы — не снимки страницы, это сканы личных сертификатов; писать
им фиктивный `shot` значило бы завести второе, ложное значение для поля,
которое везде в кампаниях означает одно и то же. Поэтому в колоде их нет, а
здесь это явно зафиксировано, а не тихо потеряно.

## LinkedIn

Формат: карусель-документ `renders/<lang>/carousel.pdf` (6 страниц) + текст
ниже. Обложка одиночного поста, если карусель не заходит, —
`renders/<lang>/li-single.png`.

### PL

Na naszej stronie głównej stoi jedno zdanie: MiCode buduje systemy dla firm, z
AI w środku. Ten post jest jego długą wersją.

MiCode powstał w 2024 roku. Założył go inżynier z 18-letnim doświadczeniem w
IT — i od razu zrobił coś, czego większość doradców AI nigdy nie robi:
uruchomił własne produkty i sam je utrzymuje.

Sześć, dokładnie: AI Budget Assistant (Google Play), Accounting AI Agent (SaaS
+ GitHub), Legalka KB (bot na Telegramie), Marketing AI assistant (SaaS +
GitHub), ngx-open-web-ui-chat (open source, npm) i Testing AI Assistant.
Cztery z sześciu mają publiczne repozytoria, jeden jest na npm, trzy mają
własne produkcyjne strony. To nie jest twierdzenie o skali — to twierdzenie o
istnieniu, a takie sprawdza się w minutę.

Dlaczego to ważne dla Ciebie: musieliśmy sami odpowiedzieć — za własne
pieniądze, zanim ktokolwiek nas o to zapytał — na te same pytania, które
zadaje klient. Ile to kosztuje miesięcznie. Co się dzieje, gdy model się
zmienia pod tobą. Jak odróżnić halucynację od faktu, zanim zrobi to
użytkownik.

Sprzedajemy trzy rzeczy, celowo wąsko: oprogramowanie na zamówienie (Java,
Spring Boot, Angular), integrację systemów IT przez REST API i rozwiązania
chmurowe. AI nie jest czwartą linią — trafia do środka systemu, który i tak
budujemy, albo nie ma go w projekcie wcale.

Projekt z nami zaczyna się od bezpłatnej rozmowy wstępnej. Potem pisemna
wycena w trzy dni robocze, zanim usłyszymy cokolwiek więcej o Twoim projekcie.
Dalej: rozwój iteracyjny z demami, wdrożenie, wsparcie.

Kim jesteśmy, co dokładnie wypuściliśmy i skąd wziąć nasze dane rejestrowe,
jeśli i tak byś ich szukał:
https://mi-code.pl/blog/o-firmie-micode/?utm_source=linkedin&utm_medium=social&utm_campaign=reklama-firmy

Chcesz zacząć od rozmowy? Napisz na development@mi-code.pl.

#AI #LLM #enterprise #softwarehouse #Gdańsk #ITPolska #transformacjacyfrowa

### EN

Our home page carries one sentence: MiCode builds enterprise systems with AI
inside. This post is the long version of it.

MiCode was founded in 2024, by an engineer with 18+ years of IT experience —
and it started by doing something most AI consultants never do: shipping
products of its own and keeping them running.

Six of them, to be exact: AI Budget Assistant (Google Play), Accounting AI
Agent (SaaS + GitHub), Legalka KB (a Telegram bot), Marketing AI assistant
(SaaS + GitHub), ngx-open-web-ui-chat (open source, npm), and Testing AI
Assistant. Four of the six have public repositories, one is on npm, three
have their own production sites. None of that is a claim about scale — it is
a claim about existence, and it is the kind you can check in a minute.

Why that matters to you: we had to answer, with our own money and before
anyone asked us to, the same questions a client asks. What this costs per
month. What happens when the model changes under you. How you tell a
hallucination from a fact before a user does.

We sell three things, deliberately narrow: custom software development
(Java, Spring Boot, Angular), IT systems integration over REST APIs, and
cloud solutions. AI is not a fourth line — it goes inside the system we are
already building for you, or it does not belong in the project at all.

A project with us starts with a free intro call. Then a written quote within
three business days, before we hear anything else about your project. After
that: iterative development with regular demos, delivery, support.

Who we are, what we have actually shipped, and where to look up our company
registration if you would anyway:
https://mi-code.pl/en/blog/o-firmie-micode/?utm_source=linkedin&utm_medium=social&utm_campaign=reklama-firmy

Want to start with a conversation? Write to development@mi-code.pl.

#AI #LLM #enterprise #softwarehouse #Poland #techleadership

## Facebook

Формат: `renders/<lang>/feed-4x5.png`. Аудитория — владелец бизнеса, не
инженер: вдвое короче LinkedIn, один вопрос, один контраст, одна ссылка.

### PL

Ile firm softwarowych, które proponują Ci AI, samo utrzymuje choćby jeden
system AI na produkcji? MiCode utrzymuje sześć — i cztery z nich możesz
sprawdzić od razu, bo mają publiczne repozytoria.

Założona w 2024 roku przez inżyniera z 18-letnim doświadczeniem w IT.
Bezpłatna rozmowa wstępna, pisemna wycena w trzy dni robocze.

Zobacz, co dokładnie wypuściliśmy:
https://mi-code.pl/blog/o-firmie-micode/?utm_source=facebook&utm_medium=social&utm_campaign=reklama-firmy

Napisz na development@mi-code.pl.

#AI #LLM #softwarehouse #Gdańsk #ITPolska #enterprise

### EN

How many software companies pitching you AI actually keep even one AI system
running in production? MiCode keeps six — and four of them you can check
right now, because they have public repositories.

Founded in 2024 by an engineer with 18+ years of IT experience. A free intro
call, a written quote within three business days.

See exactly what we have shipped:
https://mi-code.pl/en/blog/o-firmie-micode/?utm_source=facebook&utm_medium=social&utm_campaign=reklama-firmy

Write to development@mi-code.pl.

#AI #LLM #softwarehouse #Poland #enterprise #techleadership

## Stories

Шесть кадров под `renders/<lang>/story-9x16-01..06.png`. Кадры рендерятся из
тех же слайдов, что и карусель (`build_reel.py` → `slides.render`), поэтому на
самом кадре уже напечатан полный текст слайда. Тот же проход есть видео:
`renders/<lang>/reel.mp4` (плюс `reel.gif` для превью) и, отдельным холстом
4:5, `renders/<lang>/reel-4x5.mp4` для ленты.

Строки ниже — не текст кадра, а сопроводительная подпись: то, что набирается
стикером поверх стори или произносится за кадром в Reels. Одна фраза на кадр,
не длиннее шести слов; ссылка — только на последнем кадре.

### PL

1. `story-9x16-01.png` — MiCode: AI w środku firmy
2. `story-9x16-02.png` — Sami utrzymujemy sześć produktów
3. `story-9x16-03.png` — Cztery mają publiczne repozytoria
4. `story-9x16-04.png` — Sprzedajemy trzy linie usług
5. `story-9x16-05.png` — Wycena pisemna w trzy dni
6. `story-9x16-06.png` — Zacznijmy rozmowę →
   https://mi-code.pl/blog/o-firmie-micode/?utm_source=instagram&utm_medium=social&utm_campaign=reklama-firmy

### EN

1. `story-9x16-01.png` — MiCode: AI built inside
2. `story-9x16-02.png` — We run six products ourselves
3. `story-9x16-03.png` — Four have public repositories
4. `story-9x16-04.png` — We sell three service lines
5. `story-9x16-05.png` — A written quote in three days
6. `story-9x16-06.png` — Let's start the conversation →
   https://mi-code.pl/en/blog/o-firmie-micode/?utm_source=instagram&utm_medium=social&utm_campaign=reklama-firmy
