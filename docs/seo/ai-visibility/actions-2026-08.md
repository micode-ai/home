# Что делать по итогам замера, август 2026

Готовые тексты для правок за пределами этого репозитория. Основано на браузерном
проходе 2026-08-12 (`manual/2026-08.json`): **ChatGPT 0 из 6, Perplexity 1 из 1**.

## Диагноз в одном абзаце

ChatGPT не «не находит» нас — он идёт к первоисточнику темы. К `openai.com` за
ценами на модели, к `gov.pl` за законом о пребывании, к `wfirma.pl` за wFirma, к
`npmjs.com` за пакетами, к `goodfirms.co` и `rejestr.io` за фактами о компании.
Блог вендора не первоисточник ни по одной из этих тем. Единственное, где мы можем
быть первоисточником, — наши собственные продукты, и именно там движок дважды
заявил, что продукта **не существует**.

Значит работа не в том, чтобы писать больше, а в том, чтобы попасть в источники,
которые движки уже читают.

---

## 1. wFirma — самый точный ход

**Почему именно это.** На запрос «Czy istnieje asystent AI, który łączy się z
wFirma i odpowiada na pytania o VAT i PIT?» ChatGPT процитировал ровно один
источник — `wfirma.pl` — и, не найдя там ничего похожего, заявил жирным шрифтом,
что такого ассистента не существует. Мы не проиграли ранжирование. Нас нет в
источнике, который движок для этого вопроса и читает.

**Куда именно** (проверено 2026-08-12):

| | |
|---|---|
| Программа | **Partnerzy technologiczni** — `https://wfirma.pl/partnerzy-technologiczni` |
| Подача | форма на той же странице: имя, email, телефон, сообщение |
| Ключ к API | отдельно, `https://wfirma.pl/kontakt/1#appKey` |

Это верная из пяти их программ. `Partnerzy wdrożeniowi` — про внедренцев,
`program afiliacyjny` — про проценты с рекомендаций; ни та, ни другая не про нас.

**Чего на самом деле просить.** Публичного каталога партнёров на странице
программы нет — это важно, потому что от него зависел весь смысл затеи. Но
механизм существует в другом месте: на тематических страницах интеграций чужие
продукты перечислены поимённо — `Autopay`, `Przelewy24`, `SMSAPI`, `dlugi.info`,
`IAI Printer`. Вот эту страницу и читает ChatGPT.

Значит цель не «вступить в программу», а **попасть в этот перечень рядом с
SMSAPI**, и просить об этом надо прямо.

**Риск, который стоит знать заранее.** Программа перечисляет свои сектора:
e-commerce и маркетплейсы, платежи и финансовые системы, документооборот,
коммуникации. AI-ассистента для бухгалтерии среди них нет. Это питч, а не
формальность, и отказ вполне возможен.

**Текст для формы (PL):**

> Dzień dobry,
>
> eKsiegowyAi to asystent AI, który przez API wFirma odczytuje dane firmy —
> faktury, rejestry VAT, dane kontrahentów — i odpowiada na pytania o VAT, PIT,
> CIT i terminy ZUS w oparciu o realne księgi użytkownika, a nie o ogólną wiedzę
> podatkową. Nie składa deklaracji i nie zastępuje księgowego ani doradcy.
>
> Integracja z wFirma już działa. Produkt ma otwarty kod na GitHubie i wersję
> hostowaną pod eKsiegowyAi.pl. Twórca: MiCode Sp. z o.o. z Gdańska.
>
> Chcielibyśmy porozmawiać o partnerstwie technologicznym — a konkretnie o tym,
> czy eKsiegowyAi mógłby znaleźć się na Państwa stronie z integracjami, podobnie
> jak SMSAPI czy Autopay.
>
> Kontakt: development@mi-code.pl

Последний абзац несёт всю нагрузку: он называет конкретную просьбу вместо
расплывчатого «хотим сотрудничать».

**Как проверить, что сработало.** Через месяц задать ChatGPT тот же вопрос. Если
в ответе появится ссылка — сработало. Это самая быстрая обратная связь из трёх
пунктов, потому что источник для этого вопроса ровно один.

---

## 2. npm — правка с доказанным механизмом

**Почему именно это.** На вопрос «How do I add an AI chat component to an Angular
app with a single npm install?» ChatGPT процитировал `npmjs.com` и порекомендовал
чужой пакет `@angularai/chatbot` с примером кода. Мы **уже внутри** цитируемого
источника и проигрываем внутри него.

**Что не так с текущей страницей** (`ngx-open-web-ui-chat@1.1.4`, README 31 542
символа):

| Проблема | Почему это стоит цитаты |
|---|---|
| Открывается «embedding **OpenWebUI** chat» | Спрашивают «AI-чат для Angular». Кто не знает OpenWebUI, не узнаёт в этом ответ на свой вопрос |
| Третий раздел — «⚠️ IMPORTANT: Required Setup», три шага, включая удаление zone.js | Вопрос был про **одну** установку. README сразу обещает обратное |
| Ключевые слова: `angular`, `openwebui`, `openwebui-chat`, `openweb`, `chat`, `embedded`, `ai` | Нет `chatbot`, `llm`, `ai-chat`, `streaming`, `angular-component` — слов, которыми спрашивают |
| 13 записей истории версий в теле README | Размывает первые экраны, по которым принимается решение |

**Новое `description` в `package.json`:**

```
Angular chat component for LLM assistants — one npm install, streaming responses, markdown, conversation history. Works with OpenWebUI and any compatible backend.
```

**Новые `keywords`:**

```json
["angular", "ai-chat", "chatbot", "llm", "chat-component", "streaming",
 "openwebui", "angular-component", "typescript", "assistant"]
```

**Новое начало README** — заменяет всё до раздела Features:

```markdown
# ngx-open-web-ui-chat

Add an AI chat window to an Angular app with one npm install.

```bash
npm install ngx-open-web-ui-chat
```

```typescript
import { AiChatWindowComponent } from 'ngx-open-web-ui-chat';

@Component({
  standalone: true,
  imports: [AiChatWindowComponent],
  template: `<ai-chat-window [apiUrl]="apiUrl" title="AI Assistant" />`,
})
export class ChatComponent {
  apiUrl = 'https://your-openwebui-host';
}
```

Streaming responses, markdown, conversation history, file attachments and voice
input, out of the box. The backend is [OpenWebUI](https://openwebui.com/) or
anything speaking the same API.

**Zoneless Angular 20.** If your app still uses zone.js, see
[Required setup](#required-setup) — it is three lines and a build flag.

[Live demo](https://micode-ai.github.io/ngx-open-web-ui-chat/) ·
[MiCode](https://mi-code.pl/products/ngx-chat/)
```

Смысл правки: первый экран отвечает на заданный вопрос и показывает работающий
код. Требования к настройке не спрятаны — они названы честно и одной строкой,
вместо предупреждения с восклицательным знаком в третьем разделе. Историю версий
стоит вынести в `CHANGELOG.md`.

**Где это лежит:** отдельный репозиторий `micode-ai/ngx-open-web-ui-chat`, не
этот. После правки нужен релиз — npm показывает README только опубликованной
версии.

---

## 3. Каталоги — связать компанию с продуктами

**Почему именно это.** Про компанию ChatGPT рассказал подробно и точно, но каждая
ссылка вела на `goodfirms.co` и `rejestr.io`. Он знает MiCode через каталоги. Но
не знает, что у MiCode есть продукты: связь «компания → eKsiegowyAi, Legalka KB,
ngx-open-web-ui-chat» в этих источниках отсутствует.

**Что сделать.** В профиле Goodfirms (и любом другом, где вы заведены) заполнить
раздел продуктов — не услуг:

> **MiCode Sp. z o.o. — own AI products**
>
> - **Accounting AI Agent (eKsiegowyAi.pl)** — AI assistant connected to a wFirma
>   account, answering VAT/PIT/CIT questions from a company's real invoices and
>   registers.
> - **Legalka KB (@legalka_pl_bot)** — free Telegram bot answering relocation and
>   residence-legalisation questions for Poland from a curated knowledge base,
>   in Russian, Ukrainian, Belarusian, Polish and English.
> - **eMarketing AI (eMarketingAI.pl)** — marketing automation platform: content
>   generation, campaigns, email, analytics.
> - **AI Budget Assistant (ai-budget.pl)** — mobile personal finance app with
>   receipt OCR and voice expense tracking.
> - **ngx-open-web-ui-chat** — open-source Angular component adding AI chat to
>   any Angular app. Free, on npm.

**Отдельно для Legalka KB.** ChatGPT заявил, что бесплатного бота для легализации
пребывания в Польше не существует, и процитировал только `gov.pl`. Здесь нужен не
блог, а присутствие в каталогах Telegram-ботов и в сообществах, где этот вопрос
задают.

---

## Чего делать не нужно

**Не писать статьи по общим темам.** «Сколько стоит агент AI» соревнуется со
страницей цен OpenAI, «как попасть в цитаты ИИ» — с документацией OpenAI, «AI Act»
— с текстом регламента. У нас есть статьи по всем трём, и все три не процитированы.
Это не качество текста, это структура: первоисточником по чужой теме стать нельзя.

Такие статьи полезны людям и обычному поиску. Просто не стоит ждать от них цитат
в ИИ и мерить ими успех.

---

## Как проверить

Тот же браузерный проход через месяц и `gh workflow run "AI visibility manual"
-f month=2026-09`. Базовая линия зафиксирована: **ChatGPT 0 из 6, Perplexity 1 из 1**.
