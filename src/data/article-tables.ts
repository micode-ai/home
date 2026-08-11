// Tabular content embedded in blog articles.
// Referenced from a post body via the `[[table:<id>]]` marker (see ArticlePage.svelte).
// Keyed by a stable id, then by language — same convention as article-diagrams.ts.
//
// Every figure here is a MODEL evaluated on declared assumptions, never measured production
// spend. `cost-assumptions` row labels deliberately mirror the `costCalc.*` field labels in
// src/data/{pl,en,ru}.json, and `cost-before-after` mirrors `costCalc.comp.*`, so the article
// and the calculator widget below it name the same things.
//
// `cost-before-after` is `computeAgentCost` from src/services/agentCost.ts evaluated on the
// `cost-assumptions` configuration at 8 steps and 1500 tasks/month for gpt-5.4-mini without
// the EU residency uplift, at cachedShare 0 and 0.9. Component cells are rounded to the cent,
// so they sum to 74.37 while the exact total is 74.376 — the total row carries 74.38, which is
// what the calculator renders. Keep the two in sync if the assumptions ever change.

type Lang = 'ru' | 'en' | 'pl';

export type ArticleTable = {
  headers: string[];
  rows: string[][];
};

export const articleTables: Record<string, Record<Lang, ArticleTable>> = {
  'cost-assumptions': {
    ru: {
      headers: ['Допущение', 'Значение'],
      rows: [
        ['Инструментов у агента', '80'],
        ['Токенов на схему инструмента', '180'],
        ['Токенов в системном промпте', '1200'],
        ['Токенов истории в запросе', '2000'],
        ['Токенов найденного контекста (RAG)', '1500'],
        ['Токенов ответа на шаг', '300'],
        ['Шагов на задачу', '8 (в калькуляторе вилка 4–12)'],
        ['Задач в день', '50'],
        ['Дней в месяце', '30'],
        ['Модель', 'gpt-5.4-mini'],
      ],
    },
    en: {
      headers: ['Assumption', 'Value'],
      rows: [
        ['Tools the agent has', '80'],
        ['Tokens per tool schema', '180'],
        ['Tokens in the system prompt', '1200'],
        ['History tokens per request', '2000'],
        ['Retrieved context tokens (RAG)', '1500'],
        ['Output tokens per step', '300'],
        ['Steps per task', '8 (4–12 range in the calculator)'],
        ['Tasks per day', '50'],
        ['Days per month', '30'],
        ['Model', 'gpt-5.4-mini'],
      ],
    },
    pl: {
      headers: ['Założenie', 'Wartość'],
      rows: [
        ['Liczba narzędzi agenta', '80'],
        ['Tokenów na schemat narzędzia', '180'],
        ['Tokenów w prompcie systemowym', '1200'],
        ['Tokenów historii w zapytaniu', '2000'],
        ['Tokenów znalezionego kontekstu (RAG)', '1500'],
        ['Tokenów odpowiedzi na krok', '300'],
        ['Kroków na zadanie', '8 (w kalkulatorze widełki 4–12)'],
        ['Zadań dziennie', '50'],
        ['Dni w miesiącu', '30'],
        ['Model', 'gpt-5.4-mini'],
      ],
    },
  },

  'cost-before-after': {
    ru: {
      headers: ['Составляющая', 'Без рычагов, USD/мес', 'С кэшем 90%, USD/мес'],
      rows: [
        ['Схемы инструментов', '129.60', '24.62'],
        ['Системный промпт', '10.80', '2.05'],
        ['История диалога', '18.00', '18.00'],
        ['Найденный контекст (RAG)', '13.50', '13.50'],
        ['Ответ модели', '16.20', '16.20'],
        ['Итого', '188.10', '74.38'],
      ],
    },
    en: {
      headers: ['Component', 'No levers, USD/mo', 'With 90% cache, USD/mo'],
      rows: [
        ['Tool schemas', '129.60', '24.62'],
        ['System prompt', '10.80', '2.05'],
        ['Conversation history', '18.00', '18.00'],
        ['Retrieved context (RAG)', '13.50', '13.50'],
        ['Model output', '16.20', '16.20'],
        ['Total', '188.10', '74.38'],
      ],
    },
    pl: {
      headers: ['Składnik', 'Bez dźwigni, USD/mies.', 'Z cache 90%, USD/mies.'],
      rows: [
        ['Schematy narzędzi', '129.60', '24.62'],
        ['Prompt systemowy', '10.80', '2.05'],
        ['Historia rozmowy', '18.00', '18.00'],
        ['Znaleziony kontekst (RAG)', '13.50', '13.50'],
        ['Odpowiedź modelu', '16.20', '16.20'],
        ['Razem', '188.10', '74.38'],
      ],
    },
  },

  // AI Act compliance calendar as it stands after Regulation (EU) 2026/1744 (Digital Omnibus
  // on AI, in force 27 July 2026) and Poland's act on AI systems (core provisions in force
  // 11 August 2026). The two December 2026 / December 2027 rows are the deferred dates, not
  // the original ones — if the calendar shifts again, this table and the article body that
  // states the same dates in prose have to move together.
  'ai-act-dates': {
    ru: {
      headers: ['Дата', 'Что вступает в силу', 'Кого касается'],
      rows: [
        ['2 февраля 2025', 'Запрещённые практики (ст. 5) и ИИ-грамотность (ст. 4)', 'Всех — поставщиков и внедряющих'],
        ['2 августа 2025', 'Обязанности поставщиков моделей общего назначения (GPAI)', 'Поставщиков моделей'],
        ['2 августа 2026', 'Прозрачность по ст. 50; штрафные полномочия Комиссии по GPAI', 'Чат-боты, генераторы контента, дипфейки, распознавание эмоций'],
        ['11 августа 2026', 'Польский закон о системах ИИ: надзор, нотифицированные органы, песочницы', 'Польский рынок'],
        ['28 октября 2026', 'KRiBSI может налагать административные штрафы', 'Польский рынок'],
        ['2 декабря 2026', 'Конец отсрочки на машиночитаемую маркировку контента', 'Поставщиков генераторов контента'],
        ['2 декабря 2027', 'Системы высокого риска, Приложение III (после переноса)', 'Найм, образование, кредиты, госуслуги'],
        ['2 августа 2028', 'Системы высокого риска, Приложение I (после переноса)', 'ИИ, встроенный в регулируемые продукты'],
      ],
    },
    en: {
      headers: ['Date', 'What starts applying', 'Who it affects'],
      rows: [
        ['2 February 2025', 'Prohibited practices (Art. 5) and AI literacy (Art. 4)', 'Everyone — providers and deployers'],
        ['2 August 2025', 'Obligations for providers of general-purpose AI models (GPAI)', 'Model providers'],
        ['2 August 2026', 'Article 50 transparency; Commission fining powers over GPAI', 'Chatbots, content generators, deepfakes, emotion recognition'],
        ['11 August 2026', 'Poland’s AI systems act: supervision, notified bodies, sandboxes', 'The Polish market'],
        ['28 October 2026', 'KRiBSI can impose administrative fines', 'The Polish market'],
        ['2 December 2026', 'End of the grace period for machine-readable content marking', 'Providers of content generators'],
        ['2 December 2027', 'High-risk systems, Annex III (after the deferral)', 'Hiring, education, credit, public services'],
        ['2 August 2028', 'High-risk systems, Annex I (after the deferral)', 'AI embedded in regulated products'],
      ],
    },
    pl: {
      headers: ['Data', 'Co zaczyna obowiązywać', 'Kogo dotyczy'],
      rows: [
        ['2 lutego 2025', 'Praktyki zakazane (art. 5) i kompetencje AI (art. 4)', 'Wszystkich — dostawców i wdrażających'],
        ['2 sierpnia 2025', 'Obowiązki dostawców modeli ogólnego przeznaczenia (GPAI)', 'Dostawców modeli'],
        ['2 sierpnia 2026', 'Przejrzystość z art. 50; uprawnienia Komisji do kar wobec GPAI', 'Chatboty, generatory treści, deepfake, rozpoznawanie emocji'],
        ['11 sierpnia 2026', 'Polska ustawa o systemach AI: nadzór, jednostki notyfikowane, piaskownice', 'Rynek polski'],
        ['28 października 2026', 'KRiBSI może nakładać kary administracyjne', 'Rynek polski'],
        ['2 grudnia 2026', 'Koniec karencji na maszynowe znakowanie treści', 'Dostawców generatorów treści'],
        ['2 grudnia 2027', 'Systemy wysokiego ryzyka, Załącznik III (po przesunięciu)', 'Rekrutacja, edukacja, kredyty, usługi publiczne'],
        ['2 sierpnia 2028', 'Systemy wysokiego ryzyka, Załącznik I (po przesunięciu)', 'AI wbudowana w produkty regulowane'],
      ],
    },
  },
};
