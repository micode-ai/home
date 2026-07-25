# AI Agent Cost Article (MI-38) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the trilingual article «Сколько будет стоить AI-агент в месяц» with four Mermaid flow diagrams, two data tables, and an interactive cost calculator whose stacked bar recomputes from the reader's own numbers.

**Architecture:** The article is data, not markup — a `blog-posts.json` entry whose body opts into blocks (`## `, `> `, `[[diagram:id]]`, and two new ones: `[[table:id]]`, `[[widget:cost-calculator]]`). Cost math lives in a pure DOM-free service so it can be unit-tested directly; the Svelte component only renders it. Diagram and table content is authored per language and falls back to `ru`, matching the existing `articleDiagrams` convention.

**Tech Stack:** Svelte 5 (runes: `$props`, `$state`, `$derived`), Vite multi-page build, Vitest + @testing-library/svelte + jsdom, Mermaid (already a dependency, dynamically imported). No new dependencies.

## Global Constraints

- **Honest framing (hard rule).** No sentence, diagram caption, or table cell may present the model as measured MiCode production data. Allowed: «в конфигурации ниже», «при таких допущениях». Forbidden: «у нас выходит», «мы платим», «наши расходы составили».
- **Trilingual.** Every user-visible string exists in `pl`, `en`, `ru`. Article bodies, summaries, titles, FAQ, diagram labels, and table content are authored per language; UI strings go through `t(key, lang)` with keys in `src/data/{pl,en,ru}.json`.
- **Mermaid types allowed:** `flowchart LR`, `flowchart TB`, `flowchart TD`, `stateDiagram-v2`, `sequenceDiagram` only. These are the types already used in this repo. `pie`, `timeline`, and `xychart-beta` are NOT used anywhere and must not be introduced.
- **Chart palette is fixed and validated** — exactly these five, in this order, never cycled: `#3B82F6`, `#EA580C`, `#0D9488`, `#A855F7`, `#E11D48`.
- **Price snapshot date is `2026-07-25`** and must be visible in the calculator UI.
- **Model prices (USD per 1M tokens)** — from OpenAI pricing, snapshot above:
  `gpt-5.6-sol` 5.00/0.50/30.00 · `gpt-5.6-terra` 2.50/0.25/15.00 · `gpt-5.6-luna` 1.00/0.10/6.00 · `gpt-5.5` 5.00/0.50/30.00 · `gpt-5.4` 2.50/0.25/15.00 · `gpt-5.4-mini` 0.75/0.075/4.50 · `gpt-5.4-nano` 0.20/0.02/1.25 (input/cached input/output)
- **EU data-residency uplift is +10%** for models released after 2026-03-05.
- **Svelte 5 runes only.** No `export let`, no legacy stores-as-props. Follow `ArticlePage.svelte`.
- **Do not deploy the branch mid-plan.** The post appears in the blog listing from Task 8 onward; the page itself is only reachable after Task 9.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/services/agentCost.ts` | **Create.** Pure cost math + price table. No DOM, no Svelte. |
| `src/services/agentCost.test.ts` | **Create.** Unit tests for the math. |
| `src/data/article-tables.ts` | **Create.** Per-language table content, keyed by id (mirrors `article-diagrams.ts`). |
| `src/components/CostCalculator.svelte` | **Create.** Inputs, stacked bar, legend, tooltip, table view. |
| `src/components/CostCalculator.test.ts` | **Create.** Component tests. |
| `src/components/ArticlePage.test.ts` | **Create.** Block-rendering tests with a mocked posts fixture. |
| `src/components/ArticlePage.svelte` | **Modify.** Two new block kinds + their parsers and renderers. |
| `src/data/article-diagrams.ts` | **Modify.** Append 4 diagrams × 3 languages. |
| `src/data/blog-posts.json` | **Modify.** Append the post entry. |
| `src/data/{pl,en,ru}.json` | **Modify.** Add the `costCalc.*` key group. |
| `blog/ai-agent-cost-per-month-model/index.html` | **Create.** Per-language-neutral page shell with `pl` meta + JSON-LD. |
| `blog/ai-agent-cost-per-month-model/main.ts` | **Create.** Hydrates `ArticleApp` with the slug. |
| `vite.config.ts` | **Modify.** One `rollupOptions.input` entry. |
| `public/llms.txt` | **Modify.** One Blog bullet + two FAQ bullets. |

---

### Task 1: Cost math service

**Files:**
- Create: `src/services/agentCost.ts`
- Test: `src/services/agentCost.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `MODEL_PRICES`, `MODEL_IDS`, `PRICES_SNAPSHOT_DATE`, `DAYS_PER_MONTH`, `COST_COMPONENTS`, types `ModelId`, `CostInputs`, `CostComponent`, `CostBreakdown`, `CostResult`, and `computeAgentCost(inputs: CostInputs): CostResult`.

- [ ] **Step 1: Write the failing test**

Create `src/services/agentCost.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeAgentCost, MODEL_PRICES, PRICES_SNAPSHOT_DATE, type CostInputs } from './agentCost';

const base: CostInputs = {
  tools: 80,
  tokensPerToolSchema: 180,
  systemPromptTokens: 1200,
  historyTokens: 2000,
  ragTokens: 0,
  outputTokensPerStep: 300,
  stepsMin: 8,
  stepsMax: 8,
  tasksPerDay: 50,
  cachedShare: 0,
  model: 'gpt-5.4-mini',
  euResidency: false,
};

describe('computeAgentCost', () => {
  it('prices a task from its per-step token load', () => {
    const r = computeAgentCost(base);
    // 80 tools x 180 tok = 14400 tok/request; x8 steps = 115200 tok at $0.75/1M
    expect(r.low.components.toolSchemas).toBeCloseTo(0.0864 * 50 * 30, 4);
    expect(r.low.perTask).toBeCloseTo(0.1164, 6);
    expect(r.low.monthly).toBeCloseTo(174.6, 4);
  });

  it('makes tool schemas the dominant line item', () => {
    const r = computeAgentCost(base);
    expect(r.low.components.toolSchemas / r.low.monthly).toBeGreaterThan(0.7);
  });

  it('applies the cache discount only to the stable prefix', () => {
    const r = computeAgentCost({ ...base, cachedShare: 0.9 });
    // prefix blended price = 0.1*0.75 + 0.9*0.075 = 0.1425
    expect(r.low.components.toolSchemas).toBeCloseTo(0.016416 * 50 * 30, 4);
    // history is volatile — never discounted
    expect(r.low.components.history).toBeCloseTo(0.012 * 50 * 30, 4);
    expect(r.low.monthly).toBeCloseTo(60.876, 3);
  });

  it('spans the range from min steps with cache to max steps without', () => {
    const r = computeAgentCost({ ...base, stepsMin: 4, stepsMax: 16, cachedShare: 0.9 });
    expect(r.low.monthly).toBeLessThan(r.high.monthly);
    // high ignores the cache entirely
    const noCache = computeAgentCost({ ...base, stepsMin: 16, stepsMax: 16, cachedShare: 0 });
    expect(r.high.monthly).toBeCloseTo(noCache.low.monthly, 6);
  });

  it('adds 10% for EU data residency', () => {
    const plain = computeAgentCost(base).low.monthly;
    const eu = computeAgentCost({ ...base, euResidency: true }).low.monthly;
    expect(eu).toBeCloseTo(plain * 1.1, 6);
  });

  it('treats blank, negative, and non-finite inputs as zero instead of throwing', () => {
    const r = computeAgentCost({
      ...base,
      tools: NaN,
      systemPromptTokens: -500,
      historyTokens: Number.POSITIVE_INFINITY,
      ragTokens: 0,
      outputTokensPerStep: 0,
      tasksPerDay: 0,
    });
    expect(r.low.monthly).toBe(0);
    expect(Number.isFinite(r.low.perTask)).toBe(true);
  });

  it('clamps cachedShare into 0..1', () => {
    const over = computeAgentCost({ ...base, cachedShare: 5 });
    const one = computeAgentCost({ ...base, cachedShare: 1 });
    expect(over.low.monthly).toBeCloseTo(one.low.monthly, 6);
  });

  it('exposes the price snapshot date and a cached price for every model', () => {
    expect(PRICES_SNAPSHOT_DATE).toBe('2026-07-25');
    for (const [id, p] of Object.entries(MODEL_PRICES)) {
      expect(p.cachedInput, id).toBeLessThan(p.input);
      expect(p.output, id).toBeGreaterThan(p.input);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/agentCost.test.ts`
Expected: FAIL — cannot resolve `./agentCost`.

- [ ] **Step 3: Write minimal implementation**

Create `src/services/agentCost.ts`:

```ts
// Cost model for running an LLM agent, used by the blog article's calculator.
//
// The point the article makes: an agent's bill is dominated by what gets RE-SENT on every
// step of the loop (system prompt + tool schemas + history + retrieved context), not by the
// user's question or the model's answer. So costs are computed per component, per step.
//
// Prompt caching is applied ONLY to the stable prefix (system prompt + tool schemas). History
// and retrieved context change between steps, so they are never served from cache.

export type ModelId =
  | 'gpt-5.6-sol'
  | 'gpt-5.6-terra'
  | 'gpt-5.6-luna'
  | 'gpt-5.5'
  | 'gpt-5.4'
  | 'gpt-5.4-mini'
  | 'gpt-5.4-nano';

export type ModelPrice = {
  /** USD per 1M input tokens. */
  input: number;
  /** USD per 1M input tokens served from the prompt cache. */
  cachedInput: number;
  /** USD per 1M output tokens. */
  output: number;
};

/** Date the prices below were read off OpenAI's pricing page. Shown in the calculator UI. */
export const PRICES_SNAPSHOT_DATE = '2026-07-25';

export const MODEL_PRICES: Record<ModelId, ModelPrice> = {
  'gpt-5.6-sol': { input: 5.0, cachedInput: 0.5, output: 30.0 },
  'gpt-5.6-terra': { input: 2.5, cachedInput: 0.25, output: 15.0 },
  'gpt-5.6-luna': { input: 1.0, cachedInput: 0.1, output: 6.0 },
  'gpt-5.5': { input: 5.0, cachedInput: 0.5, output: 30.0 },
  'gpt-5.4': { input: 2.5, cachedInput: 0.25, output: 15.0 },
  'gpt-5.4-mini': { input: 0.75, cachedInput: 0.075, output: 4.5 },
  'gpt-5.4-nano': { input: 0.2, cachedInput: 0.02, output: 1.25 },
};

export const MODEL_IDS = Object.keys(MODEL_PRICES) as ModelId[];

/** Billing month used for the monthly figure. Documented in the article's assumptions table. */
export const DAYS_PER_MONTH = 30;

/** Uplift for regional data-residency processing (models released after 2026-03-05). */
const EU_UPLIFT = 1.1;

export type CostComponent = 'toolSchemas' | 'systemPrompt' | 'history' | 'rag' | 'output';

/** Fixed order — the chart assigns its palette by this order and never cycles it. */
export const COST_COMPONENTS: CostComponent[] = [
  'toolSchemas',
  'systemPrompt',
  'history',
  'rag',
  'output',
];

export type CostInputs = {
  tools: number;
  tokensPerToolSchema: number;
  systemPromptTokens: number;
  historyTokens: number;
  ragTokens: number;
  outputTokensPerStep: number;
  stepsMin: number;
  stepsMax: number;
  tasksPerDay: number;
  /** 0..1 — share of the stable prefix served from cache. */
  cachedShare: number;
  model: ModelId;
  euResidency: boolean;
};

export type CostBreakdown = {
  /** USD per month, per component. */
  components: Record<CostComponent, number>;
  /** USD per month, all components. */
  monthly: number;
  /** USD for a single task. */
  perTask: number;
};

export type CostResult = {
  /** Optimistic end: fewest steps, cache as configured. */
  low: CostBreakdown;
  /** Pessimistic end: most steps, no cache at all. */
  high: CostBreakdown;
  snapshotDate: string;
};

/** Blank/negative/non-finite fields come from empty form inputs — treat them as zero. */
function safe(v: number): number {
  return Number.isFinite(v) && v > 0 ? v : 0;
}

function clampShare(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

function breakdown(i: CostInputs, rawSteps: number, rawCachedShare: number): CostBreakdown {
  const price = MODEL_PRICES[i.model] ?? MODEL_PRICES['gpt-5.4-mini'];
  const uplift = i.euResidency ? EU_UPLIFT : 1;
  const steps = safe(rawSteps);
  const cachedShare = clampShare(rawCachedShare);

  // Blended price for the cacheable prefix.
  const prefixPrice = (1 - cachedShare) * price.input + cachedShare * price.cachedInput;
  const cost = (tokens: number, perM: number) => (safe(tokens) * steps / 1_000_000) * perM * uplift;

  const perTask: Record<CostComponent, number> = {
    toolSchemas: cost(safe(i.tools) * safe(i.tokensPerToolSchema), prefixPrice),
    systemPrompt: cost(i.systemPromptTokens, prefixPrice),
    history: cost(i.historyTokens, price.input),
    rag: cost(i.ragTokens, price.input),
    output: cost(i.outputTokensPerStep, price.output),
  };

  const tasksPerMonth = safe(i.tasksPerDay) * DAYS_PER_MONTH;
  const components = {} as Record<CostComponent, number>;
  for (const key of COST_COMPONENTS) components[key] = perTask[key] * tasksPerMonth;

  const sum = (o: Record<CostComponent, number>) =>
    COST_COMPONENTS.reduce((acc, k) => acc + o[k], 0);

  return { components, monthly: sum(components), perTask: sum(perTask) };
}

export function computeAgentCost(inputs: CostInputs): CostResult {
  return {
    low: breakdown(inputs, inputs.stepsMin, inputs.cachedShare),
    high: breakdown(inputs, Math.max(safe(inputs.stepsMin), safe(inputs.stepsMax)), 0),
    snapshotDate: PRICES_SNAPSHOT_DATE,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/agentCost.test.ts`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/services/agentCost.ts src/services/agentCost.test.ts
git commit -m "MI-38 Add agent cost model service (prices snapshot 2026-07-25)"
```

---

### Task 2: Generic `[[table:id]]` article block

**Files:**
- Create: `src/data/article-tables.ts`
- Modify: `src/components/ArticlePage.svelte` (block union ~line 28-32, `DIAGRAM_RE` ~line 34, `diagramDef` ~line 54, `blocks` parser ~line 60-70, render `{#each blocks}` ~line 157-175)
- Test: `src/components/ArticlePage.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `articleTables` (`Record<string, Record<Lang, ArticleTable>>`), type `ArticleTable = { headers: string[]; rows: string[][] }`, and the `[[table:<id>]]` body marker. Task 8 authors content into `articleTables`.

- [ ] **Step 1: Write the failing test**

Create `src/components/ArticlePage.test.ts`. The posts JSON is mocked so block behaviour is tested in isolation from real article content:

```ts
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';

vi.mock('../data/blog-posts.json', () => ({
  default: [
    {
      slug: 'block-fixture',
      titlePl: 'Tytuł', titleEn: 'Title', titleRu: 'Заголовок',
      summaryPl: 's', summaryEn: 's', summaryRu: 's',
      date: '2026-07-25',
      tags: ['AI'],
      bodyPl: 'Akapit.\n\n[[table:fixture-table]]',
      bodyEn: 'Paragraph.\n\n[[table:fixture-table]]',
      bodyRu: 'Абзац.\n\n[[table:fixture-table]]\n\n[[table:missing-table]]',
    },
  ],
}));

vi.mock('../data/article-tables', () => ({
  articleTables: {
    'fixture-table': {
      ru: { headers: ['Вход', 'Значение'], rows: [['Шагов на задачу', '8']] },
      en: { headers: ['Input', 'Value'], rows: [['Steps per task', '8']] },
      pl: { headers: ['Wejście', 'Wartość'], rows: [['Kroków na zadanie', '8']] },
    },
  },
}));

const ArticlePage = (await import('./ArticlePage.svelte')).default;

beforeAll(() => {
  loadTranslations({
    pl: plTranslations as Record<string, any>,
    en: enTranslations as Record<string, any>,
    ru: ruTranslations as Record<string, any>,
  });
});

describe('ArticlePage table block', () => {
  it('renders headers and rows in the active language', () => {
    languageStore.set('pl');
    const { getByText } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    expect(getByText('Wejście')).toBeTruthy();
    expect(getByText('Kroków na zadanie')).toBeTruthy();
  });

  it('renders the table as a real table with column headers', () => {
    languageStore.set('en');
    const { getByRole } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    const table = getByRole('table');
    expect(table.querySelectorAll('thead th[scope="col"]').length).toBe(2);
    expect(table.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('skips an unknown table id instead of rendering the raw marker', () => {
    languageStore.set('ru');
    const { queryByText, getByText } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    expect(getByText('Вход')).toBeTruthy();
    expect(queryByText('[[table:missing-table]]')).toBeNull();
  });

  it('keeps plain paragraphs untouched', () => {
    languageStore.set('ru');
    const { getByText } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    expect(getByText('Абзац.')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ArticlePage.test.ts`
Expected: FAIL — cannot resolve `../data/article-tables`, and no `table` role is found.

- [ ] **Step 3: Create the table data module**

Create `src/data/article-tables.ts`:

```ts
// Tabular content embedded in blog articles.
// Referenced from a post body via the `[[table:<id>]]` marker (see ArticlePage.svelte).
// Keyed by a stable id, then by language — same convention as article-diagrams.ts.

type Lang = 'ru' | 'en' | 'pl';

export type ArticleTable = {
  headers: string[];
  rows: string[][];
};

export const articleTables: Record<string, Record<Lang, ArticleTable>> = {};
```

- [ ] **Step 4: Wire the block into ArticlePage**

In `src/components/ArticlePage.svelte`, add the import next to the existing diagram import (line 8):

```ts
  import { articleTables, type ArticleTable } from '../data/article-tables';
```

Extend the `Block` union (currently lines 28-32) with:

```ts
    | { kind: 'table'; id: string }
```

Add the marker regex next to `DIAGRAM_RE` (line 34):

```ts
  const TABLE_RE = /^\[\[table:([a-z0-9-]+)\]\]$/i;
```

Add the lookup helper next to `diagramDef` (after line 58):

```ts
  // Tables are authored per language; fall back to Russian if a language is missing.
  function tableDef(id: string, l: string): ArticleTable | undefined {
    const entry = (articleTables as Record<string, Record<string, ArticleTable>>)[id];
    if (!entry) return undefined;
    return entry[l] ?? entry.ru;
  }
```

In the `blocks` parser, add the table check immediately after the diagram check (after line 65):

```ts
      const tm = c.match(TABLE_RE);
      if (tm) return { kind: 'table', id: tm[1] };
```

In the render loop, add a branch after the `diagram` branch (after line 171):

```svelte
        {:else if block.kind === 'table'}
          {@const tbl = tableDef(block.id, lang)}
          {#if tbl}
            <div class="article-table-wrap">
              <table class="article-table">
                <thead>
                  <tr>
                    {#each tbl.headers as h}<th scope="col">{h}</th>{/each}
                  </tr>
                </thead>
                <tbody>
                  {#each tbl.rows as row}
                    <tr>
                      {#each row as cell}<td>{cell}</td>{/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/ArticlePage.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 6: Verify no regression on real articles**

Run: `npx vitest run`
Expected: PASS — all pre-existing suites still green.

- [ ] **Step 7: Commit**

```bash
git add src/data/article-tables.ts src/components/ArticlePage.svelte src/components/ArticlePage.test.ts
git commit -m "MI-38 Add generic [[table:id]] block to article bodies"
```

---

### Task 3: Calculator i18n keys and shell

**Files:**
- Modify: `src/data/pl.json`, `src/data/en.json`, `src/data/ru.json`
- Create: `src/components/CostCalculator.svelte`
- Test: `src/components/CostCalculator.test.ts`

**Interfaces:**
- Consumes: `computeAgentCost`, `MODEL_IDS`, `MODEL_PRICES`, `PRICES_SNAPSHOT_DATE`, `DAYS_PER_MONTH`, `COST_COMPONENTS`, `CostInputs` from Task 1.
- Produces: `CostCalculator.svelte` with props `{ lang: string }`. Task 5 adds the bar to it; Task 6 mounts it from a body marker.

- [ ] **Step 1: Add the i18n key group**

Add this object to `src/data/ru.json` at the top level:

```json
  "costCalc": {
    "title": "Посчитайте свой случай",
    "intro": "Введите свои числа — расчёт пересчитается. Это модель, а не наши счета.",
    "tools": "Инструментов у агента",
    "tokensPerToolSchema": "Токенов на схему инструмента",
    "systemPromptTokens": "Токенов в системном промпте",
    "historyTokens": "Токенов истории в запросе",
    "ragTokens": "Токенов найденного контекста (RAG)",
    "outputTokensPerStep": "Токенов ответа на шаг",
    "stepsMin": "Шагов на задачу, минимум",
    "stepsMax": "Шагов на задачу, максимум",
    "tasksPerDay": "Задач в день",
    "cachedShare": "Доля префикса из кэша, %",
    "model": "Модель",
    "euResidency": "Хранение данных в ЕС (+10%)",
    "resultTitle": "В месяц",
    "perTask": "За одну задачу",
    "rangeNote": "Нижняя граница — минимум шагов с кэшем, верхняя — максимум шагов без кэша.",
    "priceNote": "Цены на {date}, проверьте актуальные.",
    "monthNote": "Месяц считается как {days} дней.",
    "breakdownTitle": "Из чего складывается счёт",
    "componentHeader": "Составляющая",
    "costHeader": "USD в месяц",
    "shareHeader": "Доля счёта",
    "comp": {
      "toolSchemas": "Схемы инструментов",
      "systemPrompt": "Системный промпт",
      "history": "История диалога",
      "rag": "Найденный контекст (RAG)",
      "output": "Ответ модели"
    }
  }
```

Add the same structure to `src/data/en.json`:

```json
  "costCalc": {
    "title": "Run your own numbers",
    "intro": "Enter your own figures and the estimate updates. This is a model, not our invoices.",
    "tools": "Tools the agent has",
    "tokensPerToolSchema": "Tokens per tool schema",
    "systemPromptTokens": "Tokens in the system prompt",
    "historyTokens": "History tokens per request",
    "ragTokens": "Retrieved context tokens (RAG)",
    "outputTokensPerStep": "Output tokens per step",
    "stepsMin": "Steps per task, minimum",
    "stepsMax": "Steps per task, maximum",
    "tasksPerDay": "Tasks per day",
    "cachedShare": "Share of prefix served from cache, %",
    "model": "Model",
    "euResidency": "EU data residency (+10%)",
    "resultTitle": "Per month",
    "perTask": "Per task",
    "rangeNote": "The low end is minimum steps with cache; the high end is maximum steps with none.",
    "priceNote": "Prices as of {date} — check the current ones.",
    "monthNote": "A month is counted as {days} days.",
    "breakdownTitle": "What the bill is made of",
    "componentHeader": "Component",
    "costHeader": "USD per month",
    "shareHeader": "Share of bill",
    "comp": {
      "toolSchemas": "Tool schemas",
      "systemPrompt": "System prompt",
      "history": "Conversation history",
      "rag": "Retrieved context (RAG)",
      "output": "Model output"
    }
  }
```

Add the same structure to `src/data/pl.json`:

```json
  "costCalc": {
    "title": "Policz swój przypadek",
    "intro": "Wpisz własne liczby, a wynik przeliczy się od nowa. To model, nie nasze faktury.",
    "tools": "Liczba narzędzi agenta",
    "tokensPerToolSchema": "Tokenów na schemat narzędzia",
    "systemPromptTokens": "Tokenów w prompcie systemowym",
    "historyTokens": "Tokenów historii w zapytaniu",
    "ragTokens": "Tokenów znalezionego kontekstu (RAG)",
    "outputTokensPerStep": "Tokenów odpowiedzi na krok",
    "stepsMin": "Kroków na zadanie, minimum",
    "stepsMax": "Kroków na zadanie, maksimum",
    "tasksPerDay": "Zadań dziennie",
    "cachedShare": "Udział prefiksu z cache, %",
    "model": "Model",
    "euResidency": "Dane w UE (+10%)",
    "resultTitle": "Miesięcznie",
    "perTask": "Za jedno zadanie",
    "rangeNote": "Dolna granica to minimum kroków z cache, górna to maksimum kroków bez cache.",
    "priceNote": "Ceny na {date}, sprawdź aktualne.",
    "monthNote": "Miesiąc liczony jako {days} dni.",
    "breakdownTitle": "Z czego składa się rachunek",
    "componentHeader": "Składnik",
    "costHeader": "USD miesięcznie",
    "shareHeader": "Udział w rachunku",
    "comp": {
      "toolSchemas": "Schematy narzędzi",
      "systemPrompt": "Prompt systemowy",
      "history": "Historia rozmowy",
      "rag": "Znaleziony kontekst (RAG)",
      "output": "Odpowiedź modelu"
    }
  }
```

- [ ] **Step 2: Write the failing test**

Create `src/components/CostCalculator.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import CostCalculator from './CostCalculator.svelte';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';

beforeAll(() => {
  loadTranslations({
    pl: plTranslations as Record<string, any>,
    en: enTranslations as Record<string, any>,
    ru: ruTranslations as Record<string, any>,
  });
});

describe('CostCalculator', () => {
  it('renders localized labels', () => {
    const { getByText } = render(CostCalculator, { props: { lang: 'pl' } });
    expect(getByText('Policz swój przypadek')).toBeTruthy();
    expect(getByText('Liczba narzędzi agenta')).toBeTruthy();
  });

  it('shows the price snapshot date so numbers are never mistaken for current', () => {
    const { getByText } = render(CostCalculator, { props: { lang: 'en' } });
    expect(getByText(/2026-07-25/)).toBeTruthy();
  });

  it('lists every component in the breakdown table', () => {
    const { getByRole } = render(CostCalculator, { props: { lang: 'en' } });
    const table = getByRole('table');
    expect(table.querySelectorAll('tbody tr').length).toBe(5);
  });

  it('recomputes when an input changes', async () => {
    const { getByLabelText, getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    const before = getByTestId('monthly-low').textContent;
    const tools = getByLabelText('Tools the agent has') as HTMLInputElement;
    await fireEvent.input(tools, { target: { value: '160' } });
    expect(getByTestId('monthly-low').textContent).not.toBe(before);
  });

  it('does not break when an input is cleared', async () => {
    const { getByLabelText, getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    const tools = getByLabelText('Tools the agent has') as HTMLInputElement;
    await fireEvent.input(tools, { target: { value: '' } });
    expect(getByTestId('monthly-low').textContent).toMatch(/\d/);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/CostCalculator.test.ts`
Expected: FAIL — cannot resolve `./CostCalculator.svelte`.

- [ ] **Step 4: Write the component**

Create `src/components/CostCalculator.svelte`:

```svelte
<script lang="ts">
  import { t } from '../services/i18n';
  import {
    computeAgentCost,
    COST_COMPONENTS,
    DAYS_PER_MONTH,
    MODEL_IDS,
    PRICES_SNAPSHOT_DATE,
    type CostComponent,
    type CostInputs,
    type ModelId,
  } from '../services/agentCost';

  let { lang }: { lang: string } = $props();

  // Defaults describe the reference configuration from the article's assumptions table:
  // a tool-heavy agent doing multi-step work. They are assumptions, not measurements.
  let tools = $state(80);
  let tokensPerToolSchema = $state(180);
  let systemPromptTokens = $state(1200);
  let historyTokens = $state(2000);
  // Non-zero on purpose: the stacked bar filters empty components out, and a five-series
  // chart is part of the spec. It is also the realistic case for a retrieval-backed agent.
  let ragTokens = $state(1500);
  let outputTokensPerStep = $state(300);
  let stepsMin = $state(4);
  let stepsMax = $state(12);
  let tasksPerDay = $state(50);
  let cachedSharePct = $state(0);
  let model = $state<ModelId>('gpt-5.4-mini');
  let euResidency = $state(false);

  const inputs = $derived<CostInputs>({
    tools, tokensPerToolSchema, systemPromptTokens, historyTokens, ragTokens,
    outputTokensPerStep, stepsMin, stepsMax, tasksPerDay,
    cachedShare: cachedSharePct / 100,
    model, euResidency,
  });

  const result = $derived(computeAgentCost(inputs));

  const usd = (v: number) => '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const pct = (v: number, total: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
  const label = (c: CostComponent) => t(`costCalc.comp.${c}`, lang);
</script>

<section class="calc" aria-labelledby="calc-title">
  <h3 id="calc-title" class="calc-title">{t('costCalc.title', lang)}</h3>
  <p class="calc-intro">{t('costCalc.intro', lang)}</p>

  <div class="calc-grid">
    <label>{t('costCalc.tools', lang)}<input type="number" min="0" bind:value={tools} /></label>
    <label>{t('costCalc.tokensPerToolSchema', lang)}<input type="number" min="0" bind:value={tokensPerToolSchema} /></label>
    <label>{t('costCalc.systemPromptTokens', lang)}<input type="number" min="0" bind:value={systemPromptTokens} /></label>
    <label>{t('costCalc.historyTokens', lang)}<input type="number" min="0" bind:value={historyTokens} /></label>
    <label>{t('costCalc.ragTokens', lang)}<input type="number" min="0" bind:value={ragTokens} /></label>
    <label>{t('costCalc.outputTokensPerStep', lang)}<input type="number" min="0" bind:value={outputTokensPerStep} /></label>
    <label>{t('costCalc.stepsMin', lang)}<input type="number" min="1" bind:value={stepsMin} /></label>
    <label>{t('costCalc.stepsMax', lang)}<input type="number" min="1" bind:value={stepsMax} /></label>
    <label>{t('costCalc.tasksPerDay', lang)}<input type="number" min="0" bind:value={tasksPerDay} /></label>
    <label>{t('costCalc.cachedShare', lang)}<input type="number" min="0" max="100" bind:value={cachedSharePct} /></label>
    <label>{t('costCalc.model', lang)}
      <select bind:value={model}>
        {#each MODEL_IDS as id}<option value={id}>{id}</option>{/each}
      </select>
    </label>
    <label class="calc-check">
      <input type="checkbox" bind:checked={euResidency} />
      {t('costCalc.euResidency', lang)}
    </label>
  </div>

  <p class="calc-result">
    <span class="calc-result-label">{t('costCalc.resultTitle', lang)}</span>
    <span class="calc-range">
      <span data-testid="monthly-low">{usd(result.low.monthly)}</span>
      <span aria-hidden="true"> — </span>
      <span data-testid="monthly-high">{usd(result.high.monthly)}</span>
    </span>
  </p>
  <p class="calc-note">{t('costCalc.perTask', lang)}: {usd(result.low.perTask)} — {usd(result.high.perTask)}</p>
  <p class="calc-note">{t('costCalc.rangeNote', lang)}</p>

  <h4 class="calc-subtitle">{t('costCalc.breakdownTitle', lang)}</h4>

  <div class="calc-table-wrap">
    <table class="calc-table">
      <thead>
        <tr>
          <th scope="col">{t('costCalc.componentHeader', lang)}</th>
          <th scope="col">{t('costCalc.costHeader', lang)}</th>
          <th scope="col">{t('costCalc.shareHeader', lang)}</th>
        </tr>
      </thead>
      <tbody>
        {#each COST_COMPONENTS as c}
          <tr>
            <td>{label(c)}</td>
            <td>{usd(result.low.components[c])}</td>
            <td>{pct(result.low.components[c], result.low.monthly)}%</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="calc-note">{t('costCalc.priceNote', lang).replace('{date}', PRICES_SNAPSHOT_DATE)}</p>
  <p class="calc-note">{t('costCalc.monthNote', lang).replace('{days}', String(DAYS_PER_MONTH))}</p>
</section>

<style>
  .calc {
    margin: 2rem 0;
    padding: 1.5rem;
    background: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-xl, 12px);
  }
  .calc-title { font-size: 1.2rem; font-weight: 700; margin: 0 0 0.5rem; color: var(--color-text-primary, #1e293b); }
  .calc-subtitle { font-size: 1rem; font-weight: 700; margin: 1.75rem 0 0.75rem; color: var(--color-text-primary, #1e293b); }
  .calc-intro { font-size: 0.9375rem; margin: 0 0 1.25rem; color: var(--color-text-secondary, #475569); }
  .calc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.85rem; }
  .calc-grid label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.8125rem; color: var(--color-text-secondary, #475569); }
  .calc-grid input[type="number"], .calc-grid select {
    min-height: 44px;
    padding: 0.4rem 0.6rem;
    font: inherit;
    color: var(--color-text-primary, #1e293b);
    background: var(--color-bg-primary, #fff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 8px;
  }
  .calc-check { flex-direction: row !important; align-items: center; gap: 0.5rem; min-height: 44px; }
  .calc-result { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.75rem; margin: 1.5rem 0 0.25rem; }
  .calc-result-label { font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-secondary, #475569); }
  .calc-range { font-size: 1.6rem; font-weight: 700; color: var(--color-text-primary, #1e293b); }
  .calc-note { font-size: 0.8125rem; margin: 0.35rem 0 0; color: var(--color-text-secondary, #475569); }
  .calc-table-wrap { overflow-x: auto; }
  .calc-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  .calc-table th, .calc-table td { padding: 0.5rem 0.6rem; text-align: left; border-bottom: 1px solid var(--color-border, #e2e8f0); color: var(--color-text-primary, #1e293b); }
</style>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/CostCalculator.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 6: Commit**

```bash
git add src/data/pl.json src/data/en.json src/data/ru.json src/components/CostCalculator.svelte src/components/CostCalculator.test.ts
git commit -m "MI-38 Add cost calculator component with trilingual labels"
```

---

### Task 4: Stacked bar chart in the calculator

**Files:**
- Modify: `src/components/CostCalculator.svelte`
- Test: `src/components/CostCalculator.test.ts`

**Interfaces:**
- Consumes: `result.low.components`, `COST_COMPONENTS`, `label()` from Task 3.
- Produces: the visual that §3/§6/§7 of the article rely on. No new exports.

**Chart rules that must hold (from the design spec):** five fixed colors in `COST_COMPONENTS` order, never cycled · legend always present · 2px surface-colored gap between segments · 4px rounded ends on the bar · per-segment hover tooltip · the same numbers present in the table (already built in Task 3) · text in text tokens, never the series color.

- [ ] **Step 1: Write the failing test**

Append to `src/components/CostCalculator.test.ts`:

```ts
describe('CostCalculator stacked bar', () => {
  it('renders one segment per component in fixed order', () => {
    const { getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    const bar = getByTestId('cost-bar');
    const segs = bar.querySelectorAll('[data-component]');
    expect(Array.from(segs).map((s) => s.getAttribute('data-component'))).toEqual([
      'toolSchemas', 'systemPrompt', 'history', 'rag', 'output',
    ]);
  });

  it('gives the bar an accessible summary, so it is not colour-alone', () => {
    const { getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    const bar = getByTestId('cost-bar');
    expect(bar.getAttribute('role')).toBe('img');
    expect(bar.getAttribute('aria-label')).toMatch(/Tool schemas/);
  });

  it('renders a legend entry for every component', () => {
    const { getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    expect(getByTestId('cost-legend').querySelectorAll('li').length).toBe(5);
  });

  it('resizes segments when the inputs change', async () => {
    const { getByLabelText, getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    const seg = () => getByTestId('cost-bar').querySelector('[data-component="toolSchemas"]') as HTMLElement;
    const before = seg().style.width;
    await fireEvent.input(getByLabelText('Tools the agent has'), { target: { value: '2' } });
    expect(seg().style.width).not.toBe(before);
  });

  it('shows a tooltip for the hovered segment', async () => {
    const { getByTestId, queryByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    expect(queryByTestId('cost-tooltip')).toBeNull();
    const seg = getByTestId('cost-bar').querySelector('[data-component="history"]') as HTMLElement;
    await fireEvent.mouseEnter(seg);
    expect(getByTestId('cost-tooltip').textContent).toMatch(/Conversation history/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/CostCalculator.test.ts`
Expected: FAIL — `cost-bar` test id not found.

- [ ] **Step 3: Add the chart to the component**

In `src/components/CostCalculator.svelte`, add to the `<script>` block after `label`:

```ts
  // Fixed palette, validated with the dataviz validator against both chart surfaces
  // (#F8FAFC light, #1E293B dark): lightness band, chroma floor, CVD separation,
  // normal-vision floor and >=3:1 contrast all pass. Assigned in COST_COMPONENTS order,
  // never cycled.
  const SERIES_COLORS: Record<CostComponent, string> = {
    toolSchemas: '#3B82F6',
    systemPrompt: '#EA580C',
    history: '#0D9488',
    rag: '#A855F7',
    output: '#E11D48',
  };

  let hovered = $state<CostComponent | null>(null);

  const segments = $derived(
    COST_COMPONENTS
      .map((c) => ({
        key: c,
        value: result.low.components[c],
        share: pct(result.low.components[c], result.low.monthly),
      }))
      .filter((s) => s.value > 0)
  );

  const barSummary = $derived(
    segments.map((s) => `${label(s.key)} ${s.share}%`).join(', ')
  );
</script>
```

Insert the chart markup between `.calc-subtitle` and `.calc-table-wrap`:

```svelte
  <div class="bar-outer">
    <div class="bar" data-testid="cost-bar" role="img" aria-label={barSummary}>
      {#each segments as s}
        <span
          class="bar-seg"
          data-component={s.key}
          style="width: {s.share}%; background: {SERIES_COLORS[s.key]}"
          onmouseenter={() => (hovered = s.key)}
          onmouseleave={() => (hovered = null)}
        ></span>
      {/each}
    </div>
    {#if hovered}
      {@const h = segments.find((s) => s.key === hovered)}
      {#if h}
        <p class="bar-tooltip" data-testid="cost-tooltip">
          {label(h.key)} — {usd(h.value)} ({h.share}%)
        </p>
      {/if}
    {/if}
  </div>

  <ul class="bar-legend" data-testid="cost-legend">
    {#each COST_COMPONENTS as c}
      <li>
        <span class="swatch" style="background: {SERIES_COLORS[c]}" aria-hidden="true"></span>
        {label(c)}
      </li>
    {/each}
  </ul>
```

Add to the `<style>` block:

```css
  .bar-outer { margin: 0 0 0.85rem; }
  /* 2px gap in the surface colour separates segments without a border colour of its own. */
  .bar {
    display: flex;
    gap: 2px;
    height: 2.25rem;
    width: 100%;
    border-radius: 4px;
    overflow: hidden;
    background: var(--color-bg-secondary, #f8fafc);
  }
  .bar-seg { display: block; height: 100%; transition: width 0.2s ease; }
  .bar-seg:first-child { border-radius: 4px 0 0 4px; }
  .bar-seg:last-child { border-radius: 0 4px 4px 0; }
  .bar-tooltip {
    margin: 0.5rem 0 0;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-primary, #1e293b);
  }
  .bar-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.1rem;
    list-style: none;
    margin: 0 0 1.25rem;
    padding: 0;
    font-size: 0.8125rem;
    color: var(--color-text-secondary, #475569);
  }
  .bar-legend li { display: flex; align-items: center; gap: 0.4rem; }
  .swatch { width: 12px; height: 12px; border-radius: 3px; flex: none; }
  @media (prefers-reduced-motion: reduce) {
    .bar-seg { transition: none; }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/CostCalculator.test.ts`
Expected: PASS — 10 tests (5 from Task 3 + 5 new).

- [ ] **Step 5: Re-verify the palette with the validator**

Run both commands from the dataviz skill directory and confirm `ALL CHECKS PASS` for each:

```bash
node scripts/validate_palette.js "#3B82F6,#EA580C,#0D9488,#A855F7,#E11D48" --mode light --surface "#F8FAFC"
node scripts/validate_palette.js "#3B82F6,#EA580C,#0D9488,#A855F7,#E11D48" --mode dark  --surface "#1E293B"
```

Expected: both print `→ ALL CHECKS PASS`.

- [ ] **Step 6: Look at it in the browser**

Run `npm run dev`, open the calculator, and check by eye in both light and dark mode: no label collisions, the bar does not overflow its container on a narrow viewport, segment gaps are visible, and legend text is readable. The validator checks colour, not layout — this step is not optional.

- [ ] **Step 7: Commit**

```bash
git add src/components/CostCalculator.svelte src/components/CostCalculator.test.ts
git commit -m "MI-38 Add validated stacked-bar cost breakdown to calculator"
```

---

### Task 5: `[[widget:cost-calculator]]` article block

**Files:**
- Modify: `src/components/ArticlePage.svelte`
- Test: `src/components/ArticlePage.test.ts`

**Interfaces:**
- Consumes: `CostCalculator.svelte` from Tasks 3-4; the `Block` union and parser from Task 2.
- Produces: the `[[widget:cost-calculator]]` body marker used by the article in Task 7.

- [ ] **Step 1: Write the failing test**

Append to `src/components/ArticlePage.test.ts` (extend the mocked fixture's `bodyEn` first — change the `vi.mock` for `blog-posts.json` so `bodyEn` reads `'Paragraph.\n\n[[table:fixture-table]]\n\n[[widget:cost-calculator]]\n\n[[widget:unknown-widget]]'`):

```ts
describe('ArticlePage widget block', () => {
  it('mounts the cost calculator', () => {
    languageStore.set('en');
    const { getByText } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    expect(getByText('Run your own numbers')).toBeTruthy();
  });

  it('ignores an unknown widget id instead of printing the marker', () => {
    languageStore.set('en');
    const { queryByText } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    expect(queryByText('[[widget:unknown-widget]]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ArticlePage.test.ts`
Expected: FAIL — "Run your own numbers" not found; the raw marker renders as a paragraph.

- [ ] **Step 3: Wire the widget block**

In `src/components/ArticlePage.svelte`, add the import:

```ts
  import CostCalculator from './CostCalculator.svelte';
```

Extend the `Block` union:

```ts
    | { kind: 'widget'; id: string }
```

Add the regex next to `TABLE_RE`:

```ts
  const WIDGET_RE = /^\[\[widget:([a-z0-9-]+)\]\]$/i;
```

In the parser, after the table check:

```ts
      const wm = c.match(WIDGET_RE);
      if (wm) return { kind: 'widget', id: wm[1] };
```

In the render loop, after the `table` branch:

```svelte
        {:else if block.kind === 'widget'}
          {#if block.id === 'cost-calculator'}
            <CostCalculator {lang} />
          {/if}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/ArticlePage.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/ArticlePage.svelte src/components/ArticlePage.test.ts
git commit -m "MI-38 Add [[widget:cost-calculator]] block to article bodies"
```

---

### Task 6: Four Mermaid diagrams, three languages each

**Files:**
- Modify: `src/data/article-diagrams.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: diagram ids `cost-bill-anatomy`, `cost-agent-loop`, `cost-four-leaks`, `cost-four-levers`, each with `ru`/`en`/`pl` definitions. Task 7 references them via `[[diagram:<id>|caption]]`.

**Constraints:** only `flowchart TB`, `flowchart LR`, `stateDiagram-v2`. Labels are for a general reader — no internal file or function names. Wrap long labels with `<br/>`. Follow the existing file's formatting: id key, then `ru:`, `en:`, `pl:` template literals.

- [ ] **Step 1: Append the four diagrams**

Add these entries to the `articleDiagrams` object in `src/data/article-diagrams.ts` (Russian shown; author `en` and `pl` with the same structure and translated labels):

```ts
  'cost-bill-anatomy': {
    ru: `flowchart TB
  SP["Системный промпт"] --> REQ
  TS["Схемы всех инструментов"] --> REQ
  H["История диалога"] --> REQ
  RAG["Найденный контекст"] --> REQ
  REQ["Один запрос к модели"] --> OUT["Ответ модели"]
  OUT --> MUL["× число шагов на задачу"]
  MUL --> BILL["Счёт за задачу"]`,
    en: `flowchart TB
  SP["System prompt"] --> REQ
  TS["Schemas of every tool"] --> REQ
  H["Conversation history"] --> REQ
  RAG["Retrieved context"] --> REQ
  REQ["One request to the model"] --> OUT["Model output"]
  OUT --> MUL["x steps per task"]
  MUL --> BILL["Cost of one task"]`,
    pl: `flowchart TB
  SP["Prompt systemowy"] --> REQ
  TS["Schematy wszystkich narzędzi"] --> REQ
  H["Historia rozmowy"] --> REQ
  RAG["Znaleziony kontekst"] --> REQ
  REQ["Jedno zapytanie do modelu"] --> OUT["Odpowiedź modelu"]
  OUT --> MUL["x liczba kroków na zadanie"]
  MUL --> BILL["Koszt jednego zadania"]`,
  },

  'cost-agent-loop': {
    ru: `stateDiagram-v2
  state "запрос собран" as req
  state "модель думает" as model
  state "вызов инструмента" as tool
  state "ответ пользователю" as done
  [*] --> req
  req --> model: префикс уходит заново
  model --> tool: нужен инструмент
  tool --> req: результат дописан в историю
  model --> done: ответ готов
  done --> [*]
  note right of req
    Каждый круг заново пересылает
    промпт и схемы инструментов
  end note`,
    en: `stateDiagram-v2
  state "request assembled" as req
  state "model thinking" as model
  state "tool call" as tool
  state "answer to user" as done
  [*] --> req
  req --> model: prefix re-sent
  model --> tool: a tool is needed
  tool --> req: result appended to history
  model --> done: answer ready
  done --> [*]
  note right of req
    Every lap re-sends the prompt
    and all tool schemas
  end note`,
    pl: `stateDiagram-v2
  state "zapytanie złożone" as req
  state "model myśli" as model
  state "wywołanie narzędzia" as tool
  state "odpowiedź dla użytkownika" as done
  [*] --> req
  req --> model: prefiks wysyłany ponownie
  model --> tool: potrzebne narzędzie
  tool --> req: wynik dopisany do historii
  model --> done: odpowiedź gotowa
  done --> [*]
  note right of req
    Każde koło wysyła ponownie prompt
    i wszystkie schematy narzędzi
  end note`,
  },

  'cost-four-leaks': {
    ru: `flowchart TB
  L["Куда утекает бюджет"] --> A["Все инструменты в каждом запросе<br/>схемы не зависят от задачи"]
  L --> B["Слишком широкий поиск в базе<br/>лишние найденные фрагменты"]
  L --> C["Повторы после сбоя<br/>падение инструмента = ещё один круг"]
  L --> D["История без обрезки<br/>растёт с каждым шагом"]`,
    en: `flowchart TB
  L["Where the budget leaks"] --> A["Every tool in every request<br/>schemas ignore the task at hand"]
  L --> B["Retrieval set too wide<br/>chunks nobody needed"]
  L --> C["Retries after a failure<br/>a failed tool call costs a full lap"]
  L --> D["History never trimmed<br/>grows with every step"]`,
    pl: `flowchart TB
  L["Gdzie wycieka budżet"] --> A["Wszystkie narzędzia w każdym zapytaniu<br/>schematy niezależne od zadania"]
  L --> B["Zbyt szerokie wyszukiwanie<br/>nadmiarowe fragmenty"]
  L --> C["Ponowienia po błędzie<br/>błąd narzędzia to kolejne koło"]
  L --> D["Historia bez obcinania<br/>rośnie z każdym krokiem"]`,
  },

  'cost-four-levers': {
    ru: `flowchart LR
  subgraph До
    B1["Все схемы каждый раз"]
    B2["Префикс не кэшируется"]
    B3["Одна дорогая модель на всё"]
    B4["История целиком"]
  end
  subgraph После
    A1["Подмножество инструментов<br/>по намерению запроса"]
    A2["Стабильный префикс впереди<br/>кэш дешевле примерно в десять раз"]
    A3["Дешёвая на роутинге<br/>дорогая на решении"]
    A4["Обрезка и сжатие истории"]
  end
  B1 --> A1
  B2 --> A2
  B3 --> A3
  B4 --> A4`,
    en: `flowchart LR
  subgraph Before
    B1["Every schema every time"]
    B2["Prefix not cached"]
    B3["One expensive model for everything"]
    B4["Full history"]
  end
  subgraph After
    A1["Tool subset<br/>chosen by intent"]
    A2["Stable prefix first<br/>cache is about ten times cheaper"]
    A3["Cheap model to route<br/>expensive one to decide"]
    A4["History trimmed and summarised"]
  end
  B1 --> A1
  B2 --> A2
  B3 --> A3
  B4 --> A4`,
    pl: `flowchart LR
  subgraph Przed
    B1["Wszystkie schematy za każdym razem"]
    B2["Prefiks bez cache"]
    B3["Jeden drogi model do wszystkiego"]
    B4["Cała historia"]
  end
  subgraph Po
    A1["Podzbiór narzędzi<br/>wybrany po intencji"]
    A2["Stabilny prefiks na początku<br/>cache tańszy około dziesięć razy"]
    A3["Tani model do routingu<br/>drogi do decyzji"]
    A4["Historia obcięta i streszczona"]
  end
  B1 --> A1
  B2 --> A2
  B3 --> A3
  B4 --> A4`,
  },
```

- [ ] **Step 2: Verify every definition parses as Mermaid**

`src/data/article-diagrams.test.ts` already auto-discovers every id and asserts (a) all three
languages are present and (b) each definition passes `mermaid.parse` against the bundled Mermaid
version. No new test file is needed — the four new diagrams add 12 cases automatically.

Run: `npx vitest run src/data/article-diagrams.test.ts`
Expected: PASS — 149 tests (137 existing + 12 new). A Mermaid syntax error fails here, not in the
browser.

**Syntax constraint that follows from this:** `stateDiagram-v2` states must use ASCII ids with the
display label supplied via `state "label" as id`, which is the pattern every existing state
diagram in this file uses. Do not put non-ASCII text in a state id or an edge target.

- [ ] **Step 3: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — no regressions.

- [ ] **Step 4: Commit**

```bash
git add src/data/article-diagrams.ts
git commit -m "MI-38 Add four cost-article diagrams (pl/en/ru)"
```

---

### Task 7: Article content and tables

**Files:**
- Modify: `src/data/blog-posts.json`, `src/data/article-tables.ts`

**Interfaces:**
- Consumes: diagram ids from Task 6, the `[[table:id]]` and `[[widget:cost-calculator]]` markers from Tasks 2 and 5.
- Produces: the post entry with `slug: 'ai-agent-cost-per-month-model'`, and table ids `cost-assumptions` and `cost-before-after`.

**Content rules:** the honest-framing rule from Global Constraints applies to every sentence and every cell. Section order is fixed by the design spec (9 sections). Tags: `["AI", "LLMOps", "Cost", "OpenAI"]`. Date: `2026-07-25`. No `relatedProductSlug` — this article is deliberately services-facing, not product-facing.

- [ ] **Step 1: Author the two tables**

Add to `articleTables` in `src/data/article-tables.ts`. `cost-assumptions` mirrors the calculator's default inputs so the article and the widget agree; every row is labelled as an assumption. `cost-before-after` shows the same configuration before and after the four levers. Russian shown — author `en` and `pl` the same way:

```ts
  'cost-assumptions': {
    ru: {
      headers: ['Допущение', 'Значение'],
      rows: [
        ['Инструментов у агента', '80'],
        ['Токенов на схему инструмента', '180'],
        ['Токенов в системном промпте', '1200'],
        ['Токенов истории в запросе', '2000'],
        ['Токенов найденного контекста', '1500'],
        ['Токенов ответа на шаг', '300'],
        ['Шагов на задачу', '8 (в калькуляторе вилка 4–12)'],
        ['Задач в день', '50'],
        ['Дней в месяце', '30'],
        ['Модель', 'gpt-5.4-mini'],
      ],
    },
    // Author `en` and `pl` with the same row order and translated labels.
  },

  'cost-before-after': {
    ru: {
      headers: ['Составляющая', 'Без рычагов, USD/мес', 'С кэшем 90%, USD/мес'],
      rows: [
        ['Схемы инструментов', '129.60', '24.62'],
        ['Системный промпт', '10.80', '2.05'],
        ['История диалога', '18.00', '18.00'],
        ['Найденный контекст', '13.50', '13.50'],
        ['Ответ модели', '16.20', '16.20'],
        ['Итого', '188.10', '74.37'],
      ],
    },
    // Author `en` and `pl` with the same rows; only the labels and headers are translated.
  },
```

These figures are `computeAgentCost` evaluated on the assumptions above at 8 steps and
1500 tasks/month (50/day × 30), for `gpt-5.4-mini` at $0.75 input / $0.075 cached / $4.50
output per 1M tokens, without the EU uplift. Two things the article must say out loud: tool
schemas are **69% of the bill** before any lever is pulled, and caching the stable prefix takes
the total from $188.10 to $74.37 — a 2.5× cut that touches nothing but prompt layout.

Verify these numbers against the built calculator before publishing (enter the assumptions,
set cache share to 0 then 90). If any cell disagrees, the calculator is the source of truth and
the table is wrong — the two must never diverge.

- [ ] **Step 2: Author the post entry**

Append one object to the array in `src/data/blog-posts.json` with keys exactly matching the existing entries: `slug`, `titlePl`, `titleEn`, `titleRu`, `summaryPl`, `summaryEn`, `summaryRu`, `date`, `tags`, `bodyPl`, `bodyEn`, `bodyRu`, `faq`.

Titles:
- `titlePl`: `Ile naprawdę kosztuje AI-agent miesięcznie? Policz, zanim wdrożysz`
- `titleEn`: `What an AI agent really costs per month: a model you can check yourself`
- `titleRu`: `Сколько будет стоить AI-агент в месяц: считаем до внедрения, а не по факту счёта`

Body skeleton (same structure in all three languages; `\n\n` between chunks, `## ` headings, `> ` callouts):

```
Opening: the question every buyer asks and never gets answered.

## Почему «$X за миллион токенов» — не ответ

## Вы платите за пересылку, а не за интеллект

## Анатомия счёта за одну задачу

[[diagram:cost-bill-anatomy|Что накапливается в одном запросе — и почему всё это умножается на число шагов.]]

[[diagram:cost-agent-loop|На каждом круге цикла системный промпт и схемы инструментов уходят заново.]]

## Четыре места, где утекает бюджет

[[diagram:cost-four-leaks|Четыре типовых утечки; первая обычно самая дорогая.]]

## Четыре рычага

[[diagram:cost-four-levers|До и после по каждому рычагу.]]

## Референсный расчёт

[[table:cost-assumptions]]

[[table:cost-before-after]]

## Посчитайте свой случай

[[widget:cost-calculator]]

## Как проверить расчёт на своём кейсе
```

Content requirements for the prose:
- State the ~90% cached-input discount as the strongest lever — but scope it correctly: it is
  ~10× cheaper **on the cacheable prefix**, which on the reference configuration works out to a
  2.5× cut on the total bill, because history, retrieved context, and output are never cached.
  Claiming "10× cheaper agent" would be wrong and must not appear.
- Include one paragraph on the +10% EU data-residency uplift for models released after 2026-03-05 — the direct answer to «сколько стоит держать данные в ЕС».
- Reference the current model line (`gpt-5.6-*`, `gpt-5.5`, `gpt-5.4-*`), not legacy `gpt-4o` names.
- Every number is introduced as «в конфигурации ниже» / «при таких допущениях».

`faq` — exactly 4 items, keys exactly `qPl`, `qEn`, `qRu`, `aPl`, `aEn`, `aRu`. The questions
(Russian shown; translate for `pl` and `en`):

1. «Что больше всего влияет на стоимость AI-агента?» — ответ: пересылаемый префикс, схемы
   инструментов в первую очередь.
2. «Сколько реально экономит кэширование промпта?» — ответ: кэшированный ввод дешевле примерно
   на 90%, на конфигурации из статьи это $188.10 → $74.37 в месяц.
3. «Агент дороже обычной SaaS-подписки?» — ответ: зависит от числа шагов и задач в день,
   формула и калькулятор в статье.
4. «Сколько добавляет хранение данных в ЕС?» — ответ: +10% для моделей, вышедших после
   2026-03-05.

Answers must stay inside the honest-framing rule: they describe the model's configuration, never
MiCode's own spend.

- [ ] **Step 3: Verify the article renders in all three languages**

Run `npm run dev`, open `/blog/ai-agent-cost-per-month-model/`, `/en/blog/...`, `/ru/blog/...`. Check: every block renders (no raw `[[...]]` markers visible), both tables appear, the calculator works, all four diagrams render.

- [ ] **Step 4: Proofread against the honest-framing rule**

Re-read all three bodies, both tables, all diagram captions, and all FAQ answers. Confirm no sentence claims these are measured MiCode production numbers. This is a required gate, not a nicety.

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/blog-posts.json src/data/article-tables.ts
git commit -m "MI-38 Add cost-model article content and tables (pl/en/ru)"
```

---

### Task 8: Page scaffolding, build registration, and discovery

**Files:**
- Create: `blog/ai-agent-cost-per-month-model/index.html`, `blog/ai-agent-cost-per-month-model/main.ts`
- Modify: `vite.config.ts` (`build.rollupOptions.input`, after line 59), `public/llms.txt`

**Interfaces:**
- Consumes: the post `slug` from Task 7.
- Produces: a reachable, buildable page and its AEO discovery entry.

- [ ] **Step 1: Create `main.ts`**

Create `blog/ai-agent-cost-per-month-model/main.ts`:

```ts
import '../../src/app.css';
import ArticleApp from '../../src/ArticleApp.svelte';
import { hydrate } from 'svelte';

hydrate(ArticleApp, {
  target: document.getElementById('app')!,
  props: { slug: 'ai-agent-cost-per-month-model' }
});
```

- [ ] **Step 2: Create `index.html`**

Copy `blog/geo-aeo-generative-answer-engine-optimization/index.html` verbatim, then replace every article-specific value:
- `<title>` and `og:title` / `twitter:title` → the Polish title from Task 7
- `meta[name=description]`, `og:description`, `twitter:description` → the Polish summary
- `canonical`, `og:url`, `BlogPosting.url`, `mainEntityOfPage.@id`, and the third `BreadcrumbList` item's `item` → `https://mi-code.pl/blog/ai-agent-cost-per-month-model/`
- `article:published_time`, `BlogPosting.datePublished`, `dateModified` → `2026-07-25`
- the four `article:tag` metas → `AI`, `LLMOps`, `Cost`, `OpenAI`
- `BlogPosting.headline` → the Polish title; `BlogPosting.description` → a fuller Polish summary
- `BlogPosting.keywords` → `["AI", "LLMOps", "koszty", "OpenAI", "prompt caching", "tokeny", "AI agent", "kalkulator kosztów"]`
- the third `BreadcrumbList` item's `name` → the Polish title

Leave unchanged: favicons, font preload block, `og:image`, `og:site_name`, author, publisher, `twitter:site`/`creator`, and the `<body>` markup.

- [ ] **Step 3: Register the build entry**

In `vite.config.ts`, add after the `geoAeoArticle` line (line 59):

```ts
                agentCostArticle: resolve(__dirname, "blog/ai-agent-cost-per-month-model/index.html"),
```

- [ ] **Step 4: Add the llms.txt entries**

In `public/llms.txt`, append to the `## Blog` list:

```
- [What an AI agent really costs per month](https://mi-code.pl/blog/ai-agent-cost-per-month-model/): A forward-looking cost model for running an LLM agent — why the bill is dominated by what gets re-sent on every step of the agent loop (system prompt, tool schemas, conversation history, retrieved context) rather than by questions and answers; four places budget leaks and four levers that cut it, including prompt caching at roughly 90% off cached input; plus an interactive calculator. Explicitly a model on declared assumptions, not MiCode billing data.
```

And to the `## FAQ` list:

```
- **What drives the cost of running an AI agent?** Mostly re-sent context: the system prompt and every tool schema travel in each request on each step of the agent loop, so a tool-heavy agent doing multi-step work pays for that prefix many times per task.
- **How much does prompt caching save on an AI agent?** Cached input tokens cost roughly 90% less than regular input tokens, so keeping a stable prefix at the front of the prompt is the single largest lever on an agent's bill.
```

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: build succeeds and `dist/blog/ai-agent-cost-per-month-model/index.html` exists.

- [ ] **Step 6: Verify the production preview**

Run `npm run preview` and open `/blog/ai-agent-cost-per-month-model/`. Confirm the page renders, the calculator is interactive, the `FAQPage` JSON-LD is present in the served HTML for each locale, and no console errors appear.

- [ ] **Step 7: Run the full test suite**

Run: `npm run test:run`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add blog/ai-agent-cost-per-month-model vite.config.ts public/llms.txt
git commit -m "MI-38 Register cost-model article page, build entry, and llms.txt"
```

---

## Definition of Done

1. Article opens in `pl`, `en`, `ru`; no raw `[[...]]` markers anywhere in the rendered body.
2. All four diagrams and the stacked bar render in both light and dark mode.
3. Both tables render and scroll horizontally inside their own container on a narrow viewport.
4. Calculator computes, shows the `2026-07-25` price snapshot date, and survives cleared inputs.
5. Palette re-validated — both validator commands print `ALL CHECKS PASS`.
6. `FAQPage` JSON-LD present per locale in the built output.
7. No sentence, caption, or cell presents the model as measured MiCode data.
8. `npm run test:run` green and `npm run build` succeeds.
