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

**Что сделать.** Подать eKsiegowyAi в каталог интеграций / партнёров wFirma.
Ищется в их разделе для партнёров и разработчиков API.

**Текст заявки (PL):**

> **eKsiegowyAi — asystent AI podłączony do konta wFirma**
>
> Asystent AI, który łączy się z kontem wFirma przez API i odpowiada na pytania
> o VAT, PIT i CIT na podstawie rzeczywistych danych firmy — faktur, rejestrów
> VAT i terminów ZUS. Zamiast ogólnej wiedzy podatkowej podaje odpowiedź opartą
> na tym, co faktycznie jest w księgach.
>
> Nie składa deklaracji i nie zastępuje doradcy podatkowego. Odczytuje dane,
> odpowiada na pytania i wskazuje niespójności — na przykład niekompletny adres
> firmy na fakturze.
>
> Integracja: wFirma API. Producent: MiCode Sp. z o.o., Gdańsk.
> Strona: https://eksiegowyai.pl · https://mi-code.pl/products/accounting-ai/

**Как проверить, что сработало.** Через месяц задать ChatGPT тот же вопрос. Если
в ответе появится ссылка — сработало. Это самая быстрая обратная связь из всех
трёх пунктов.

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
