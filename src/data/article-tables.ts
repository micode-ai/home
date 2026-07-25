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
};
