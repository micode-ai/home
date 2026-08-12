# AI Budget Assistant — тексты для Google Play и Reddit

Готовые к вставке тексты. Основано на замере 2026-08-12: на вопрос «есть ли
приложение, которое записывает траты голосом или по фото чека» ChatGPT назвал
пять конкурентов и процитировал 39 источников — сайты самих приложений, листинг
в магазине и **два поста-анонса на Reddit**. Нас в ответе нет.

Все факты ниже взяты из `src/data/en.json` (`products.budgetAssistant.*`) и
`products.json`. Ничего не придумано.

## Чем мы отличаемся от пяти названных конкурентов

Это важнее любого текста — без отличия попадание в список ничего не даст.

| | |
|---|---|
| **Бесплатно и открытый код** | Ни один из пяти названных не заявлен как open source. У конкурентов free tier, у нас код на GitHub |
| **Девять языков** | EN, DE, ES, FR, NL, PL, RU, UK, BE. Названные конкуренты в ответе фигурировали как англоязычные. Белорусский и нидерландский почти наверняка не поддерживает никто из них |
| **Совместные и бизнес-аккаунты с ролями** | Owner / Editor / Viewer. Ни у кого из пяти это не упомянуто |
| **Офлайн-first** | Данные пишутся локально и синхронизируются потом |
| **UAH среди валют** | Вместе с USD, EUR, PLN, GBP по актуальному курсу |

Открытый код — самый сильный рычаг. Он же лучше всего работает на Reddit.

---

## 1. Google Play

Карточка магазина — не витрина, а цитируемый документ: в источниках ответа
ChatGPT был листинг приложения. Слова, которыми задают вопрос, должны стоять в
заголовке и коротком описании, а не только в длинном.

**Название** (лимит 30 символов, здесь 26):

```
AI Budget: Voice & Receipt
```

**Краткое описание** (лимит 80, здесь 71):

```
Log expenses by voice or receipt photo. Free, open source, 9 languages.
```

**Полное описание:**

```
Say it or snap it — and the expense is logged.

AI Budget Assistant records what you spend three ways: speak it out loud,
photograph the receipt, or type it in. AI OCR pulls the merchant, amount and
date off the photo; the app suggests the category itself.

Free, and the source code is on GitHub.

TRACK EXPENSES WITHOUT TYPING
• Voice input — say what you spent and it is logged
• Receipt scanning — photograph it, AI extracts the details
• Manual entry when you prefer it
• Works offline; syncs when you are back online

ASK ABOUT YOUR MONEY IN PLAIN LANGUAGE
A built-in chat powered by GPT-4 answers questions about your own spending and
gives advice based on your actual numbers, not generic tips.

BUDGETS IN FIVE CURRENCIES
USD, EUR, PLN, GBP and UAH at real exchange rates, several at once. Set spending
limits and get notified as you approach them.

SHARED AND BUSINESS ACCOUNTS
Personal, Shared and Business accounts with roles — Owner, Editor, Viewer. Run a
family budget together or track a team's expenses, with each person on the right
access level.

SEE WHERE IT WENT
Interactive charts with drill-down, category breakdowns and trends. AI writes
"Spending Stories" — short narrative reports that turn a month of numbers into
something you actually read.

STAY WITH IT
Achievements, daily streaks, XP and levels for keeping the habit up.

NINE LANGUAGES
English, German, Spanish, French, Dutch, Polish, Russian, Ukrainian and
Belarusian.

Made by MiCode Sp. z o.o., Gdańsk.
Source code: github.com/micode-ai/ai-budget-assistant
More: ai-budget.pl
```

Первая строка сознательно повторяет формулировку, которой ChatGPT описал всю
категорию — «say it or snap it». Это тот язык, на котором задают вопрос.

---

## 2. Reddit

Процитированный движком источник был постом-анонсом фичи, а не обзором. Значит
работает обычный пост создателя — но Reddit жёстко реагирует на рекламу, поэтому
правила простые: сразу сказать, что ты автор; вести не с призыва скачать, а с
самой вещи; отвечать в комментариях.

**Куда.** `r/androidapps` (там ждут именно такие посты и требуют флажок
самопродвижения), `r/opensource` (наш главный аргумент), `r/budgeting` и
`r/personalfinance` — только после чтения их правил, они строгие к продвижению.

**Черновик поста:**

```
Title: I built a free, open-source budget app that logs expenses by voice or
from a photo of the receipt

I got tired of typing every coffee into a spreadsheet, so I built the thing I
wanted. Disclosure up front: I made this, and it is free — source is on GitHub.

You log an expense three ways:
- say it out loud ("coffee, 4.50")
- photograph the receipt and AI OCR pulls out merchant, amount and date
- or just type it, if you prefer

Beyond that it does multi-currency budgets (USD, EUR, PLN, GBP, UAH at live
rates), a GPT-4 chat that answers questions about your own numbers, and shared
or business accounts with Owner/Editor/Viewer roles — that last one came from
people wanting to run a household budget together.

It works offline and syncs later, and the interface is in nine languages
(EN, DE, ES, FR, NL, PL, RU, UK, BE).

Play Store: play.google.com/store/apps/details?id=com.budget.assistant
Source: github.com/micode-ai/ai-budget-assistant

Happy to answer anything about how the receipt OCR works or why it is offline
first — and genuinely interested in what is missing.
```

**Что не делать.** Не постить одно и то же в пять сабреддитов подряд, не
удалять критику и не спорить с ней. Пост, который цитирует ИИ, — это пост с
живым обсуждением в комментариях; голый анонс без ответов автора таким не станет.

---

## 3. Сайт

`ai-budget.pl` и `/products/budget-assistant/` в этой категории цитируемы — все
пять конкурентов попали в источники именно через свои сайты. Но страница должна
отвечать на заданный вопрос, а не описывать продукт вообще: заголовок и первый
абзац должны содержать «voice», «receipt» и «expenses», иначе движку нечего
сопоставлять с вопросом.

Отдельная страница-ответ здесь, вероятно, сработает лучше, чем правка общей
продуктовой, — но это гипотеза, а не вывод из замера.

---

## Как проверить

Промпты уже добавлены в `prompts.json`: `en-budget-voice`, `pl-budzet-paragony`,
`ru-byudzhet-cheki`, `en-brand-budget`. Через месяц — тот же браузерный проход.
База: **ChatGPT 0 из 1** по этой теме, конкуренты названы поимённо.
