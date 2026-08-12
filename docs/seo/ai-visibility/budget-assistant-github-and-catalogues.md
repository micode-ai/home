# AI Budget Assistant — GitHub и каталоги

Продолжение `budget-assistant-listing.md`. Там были магазин и Reddit, здесь —
репозиторий и каталоги альтернатив.

Все факты взяты из `src/data/en.json` (`products.budgetAssistant.*`) и
`products.json`. **Текущее состояние репозитория я не видел** — на момент
написания недоступны были и веб-запросы, и командная строка. Тексты ниже
написаны как замена, а не как правка того, что там сейчас; сверь перед вставкой.

---

## 1. GitHub

Репозиторий открытого продукта — цитируемый документ, который модели читают
наравне с сайтом. Сейчас он почти наверняка описан как проект («мобильное
приложение на таком-то стеке»), а нужно — как продукт категории, словами,
которыми задают вопрос.

### Описание репозитория

Лимит GitHub — 350 символов. Здесь 264.

```
Free, open-source mobile budget app: log expenses by voice, by photographing a receipt, or by typing. AI OCR pulls out the details, a GPT-4 chat answers questions about your own spending, budgets run in five currencies, and it works offline. Nine languages, Android.
```

### Topics

GitHub позволяет до 20, только строчные и через дефис. Эти пятнадцать следуют
из фактов о продукте:

```
expense-tracker
budget-app
personal-finance
receipt-ocr
receipt-scanner
voice-input
spending-tracker
budgeting
money-management
multi-currency
offline-first
ai-assistant
gpt-4
android
open-source
```

**Добавь сам ещё технологические** — язык и фреймворк, на которых написано
приложение. Я их не знаю и выдумывать не буду, а именно по ним репозиторий
находят разработчики.

### Начало README

Заменяет всё до первого раздела. Тот же принцип, что в описании для магазина:
первый экран отвечает на заданный вопрос, а не представляет проект.

```markdown
# AI Budget Assistant

Log an expense by saying it out loud, by photographing the receipt, or by
typing it. Free, and the source is here.

<!-- badges / screenshots -->

**Say it or snap it.** Voice input records what you spent. Receipt scanning
photographs it and AI OCR pulls out merchant, amount and date. Manual entry is
there when you want it. Everything works offline and syncs when you are back.

**Ask about your own money.** A built-in GPT-4 chat answers questions about
your actual spending — not generic advice.

**Budgets in five currencies.** USD, EUR, PLN, GBP and UAH at live rates,
several at once, with alerts as you approach a limit.

**Personal, shared and business accounts** with Owner / Editor / Viewer roles —
a household budget run together, or a team's expenses.

**Nine languages:** English, German, Spanish, French, Dutch, Polish, Russian,
Ukrainian, Belarusian.

[Google Play](https://play.google.com/store/apps/details?id=com.budget.assistant)
· [ai-budget.pl](https://ai-budget.pl)

Built by [MiCode](https://mi-code.pl/products/budget-assistant/), Gdańsk.
```

---

## 2. Каталоги альтернатив

Их логика — «чем заменить приложение X», то есть буквально граф категории.
Попасть туда значит появиться в множестве, из которого движок собирает ответ.

**Оговорка:** в нашем замере каталоги не цитировались напрямую. Это вывод по
аналогии с тем, как устроены источники, а не факт из данных. Reddit и GitHub
доказаны, каталоги — гипотеза с хорошим основанием.

### AlternativeTo

Ключевое поле — «alternative to». Указывать стоит те приложения, которые ChatGPT
сам назвал в ответе на наш запрос: **ExpenseEasy, Mocy, Yavo, Breadsheet,
MoneyMinder, Monarch Money**. Именно они образуют категорию в его картине мира.

Описание:

```
AI Budget Assistant records expenses three ways: say it out loud, photograph
the receipt and let AI OCR read it, or type it in. A built-in GPT-4 chat
answers questions about your own spending. Budgets run in USD, EUR, PLN, GBP
and UAH at live rates. Personal, shared and business accounts with roles.
Works offline, nine languages, free and open source.
```

Теги: `expense-tracker`, `budget`, `receipt-scanner`, `voice-input`,
`personal-finance`, `open-source`, `android`, `offline`.

Лицензия и платформа: open source, Android.

### Product Hunt

Разовый запуск, но страница остаётся навсегда и индексируется.

Tagline (лимит 60, здесь 53):

```
Log expenses by voice or a photo of the receipt — free
```

Описание:

```
I got tired of typing every coffee into a spreadsheet, so we built the thing we
wanted: say an expense out loud, or photograph the receipt and let AI OCR pull
out the merchant, amount and date.

It also does budgets in five currencies at live rates, a GPT-4 chat that
answers questions about your own numbers, and shared or business accounts with
Owner/Editor/Viewer roles for running a household or team budget together.

Offline-first, nine languages, free — and the source is on GitHub.
```

Запускать стоит не сейчас, а под заметную фичу: пустой запуск тратит единственный
шанс на внимание.

### Прочие

Slant («best expense tracker apps»), F-Droid — если сборка это позволяет, там
аудитория, для которой открытый код и есть аргумент. Оба второстепенны рядом
с GitHub.

---

## Порядок

| | что | стоимость |
|---|---|---|
| 1 | GitHub: описание, topics, начало README | час, полностью под контролем |
| 2 | AlternativeTo как альтернатива пяти названным | вечер |
| 3 | Reddit — постоянно, по существу, не рекламой | понемногу и долго |
| 4 | Product Hunt | под заметную фичу |

Первое доказано замером и бесплатно. Последнее — самое заметное и самое
одноразовое.

## Как проверить

Промпты `en-budget-voice`, `pl-budzet-paragony`, `ru-byudzhet-cheki`,
`en-brand-budget` уже в наборе. База: **ChatGPT 0 из 1** по этой теме,
пять конкурентов названы поимённо.
