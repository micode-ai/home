# AI Budget Assistant — Reddit

Единственный источник из нашего замера, который цитировался **напрямую**: в
ответе ChatGPT было два поста с Reddit («Introducing: Receipt Scanning», декабрь
2025). Не обзор, не статья — посты об обновлении продукта.

**Оговорка.** Правила конкретных сабреддитов я прочитать не смог: Reddit не
отдаёт страницы автоматическим запросам. Всё ниже — типовые нормы площадки, а не
цитаты правил. **Перед первым постом открой правила сабреддита и прочитай их
сам.** Они меняются, и незнание там не оправдание.

---

## Как это проваливается

Чаще всего не из-за текста, а из-за механики:

- **Свежий аккаунт бренда.** Аккаунт без истории, созданный ради постинга, режут
  автомодератором. Постить надо с живого личного аккаунта.
- **Нет истории участия.** Многие сабреддиты требуют соотношения вроде 9:1 —
  девять обычных комментариев на один пост о себе. Иногда это в правилах, чаще —
  в культуре.
- **Минимальная карма и возраст аккаунта.** Типичный порог автомодератора.
- **Нет флажка [DEV] или Self-promotion**, если сабреддит его требует.
- **Ссылка в заголовке** или заголовок в стиле пресс-релиза.
- **Одновременный кросспост в пять сабреддитов.** Видно сразу и читается как
  спам.
- **Автор не отвечает в комментариях.** Тогда пост мёртв — а нас интересуют
  именно обсуждения, потому что цитируются они.

Отдельно: у многих сабреддитов есть еженедельный тред для самопродвижения. Это
разрешённый путь, и начинать стоит с него.

---

## Куда

Проверить правила каждого перед постом.

| Сабреддит | Характер | Чем заходить |
|---|---|---|
| `r/androidapps` | Разработчиков ждут, обычно нужен флажок | Пост о приложении |
| `r/opensource` | Ценят открытый код сам по себе | Пост про открытость |
| `r/budgeting`, `r/personalfinance` | Строгие к продвижению | Только комментарии в чужих тредах |
| `r/ynab`, `r/plaintextaccounting` | Сообщества вокруг конкурентов | Только комментарии, и очень аккуратно |

---

## 1. Пост для r/androidapps

Заголовок:

```
[DEV] I built a free, open-source budget app that logs expenses by voice or
from a photo of the receipt
```

Текст:

```
Disclosure first: I made this, it is free, and the source is on GitHub.

I got tired of typing every coffee into a spreadsheet, so I built what I
wanted. You log an expense three ways:

- say it out loud ("coffee, 4.50")
- photograph the receipt — AI OCR pulls out merchant, amount and date
- or type it, if you prefer

Beyond that: budgets in five currencies (USD, EUR, PLN, GBP, UAH) at live
rates, a GPT-4 chat that answers questions about your own numbers, and shared
or business accounts with Owner/Editor/Viewer roles — that last one came from
people wanting to run a household budget together.

Offline-first: everything saves locally and syncs when you are back online.
Nine languages (EN, DE, ES, FR, NL, PL, RU, UK, BE).

Play Store: play.google.com/store/apps/details?id=com.budget.assistant
Source: github.com/micode-ai/ai-budget-assistant

Happy to answer anything about how the receipt OCR works or why it is offline
first. Genuinely interested in what is missing — the roles feature exists
because someone asked for it.
```

## 2. Пост для r/opensource

Здесь аргумент не функции, а открытость. Так и надо писать.

Заголовок:

```
Open-source alternative to the receipt-scanning budget apps — voice input,
OCR, no subscription
```

Текст:

```
Most of the "say it or snap it" expense trackers are closed and subscription
based. This one is neither: source is on GitHub, the app is free, and you can
run the whole stack yourself if you would rather not trust anyone's cloud.

What it does: log an expense by voice, by photographing the receipt (AI OCR
extracts merchant, amount, date), or by typing. Multi-currency budgets, a
GPT-4 chat over your own data, shared and business accounts with roles.
Offline-first — local storage, sync when back online. Nine languages.

github.com/micode-ai/ai-budget-assistant

I am the author. Happy to talk about the architecture, and about which parts
depend on an external model and which do not — that question comes up a lot
with anything that says "AI".
```

## 3. Комментарии в чужих тредах

**Самое ценное и самое безопасное.** Такие треды и цитировались движком, а риск
удаления почти нулевой — при условии, что комментарий полезен сам по себе.

Искать треды с вопросами вида «app that scans receipts», «expense tracker with
voice input», «budget app without subscription». Шаблон:

```
If you want it free and open source, there is AI Budget Assistant — voice
input, receipt photo with OCR, multi-currency budgets. Disclosure: I am one
of the authors.

Caveats so you do not waste time: Android only, no iOS build. Bank-account
syncing is not there — you log expenses, it does not import transactions.
If you need automatic bank import, look at the paid ones instead.

github.com/micode-ai/ai-budget-assistant
```

Ограничения названы намеренно. Комментарий, который честно говорит, кому
продукт **не** подходит, не читается как реклама — и именно такие оставляют
висеть, а не удаляют.

---

## Ритм

- **Комментарии** — по нескольку в неделю, там, где действительно спрашивают.
  Это фон, который и создаёт присутствие.
- **Пост** — один, в одном сабреддите. Через неделю-две второй, в другом, с
  другим углом. Не одновременно.
- **Отвечать всем**, включая резким. Критику не удалять — удалённая ветка видна
  и стоит дороже самой критики.
- Пост под заметное обновление работает лучше, чем «мы существуем». Тот
  процитированный пост назывался «Introducing: Receipt Scanning» — это анонс
  фичи, а не приложения.

## Чего не делать

Не заводить аккаунт ради постинга. Не постить одно и то же в пять мест. Не
спорить с модератором публично — если удалили, написать в модмейл вежливо и
один раз. Не покупать апвоуты: это ловится и стоит домену репутации на годы.

## Как проверить

Промпты `en-budget-voice`, `pl-budzet-paragony`, `ru-byudzhet-cheki`,
`en-brand-budget` уже в наборе. База: **ChatGPT 0 из 1** по этой теме, пять
конкурентов названы поимённо.
