# AI Visibility Checker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Measure weekly, for free, whether AI engines cite mi-code.pl, and keep the series in git.

**Architecture:** A dependency-free Node script runs a fixed prompt set through the Gemini API with Google Search grounding, classifies each prompt as `cited` / `mentioned` / `absent`, writes a dated JSON run plus a rebuilt `REPORT.md`, and a weekly GitHub Actions job commits the result and pings Telegram only when the set of cited prompts changes. Pure logic (parsing, classification, diffing, rendering) lives in two side-effect-free modules that are unit-tested with mocked network; all I/O lives in the entry point.

**Tech Stack:** Node 20 built-ins only (`fetch`, `fs`, `path`) — no new npm dependencies. Vitest for tests. GitHub Actions for the schedule. Gemini 2.5 Flash for grounding.

**Spec:** `docs/superpowers/specs/2026-08-11-ai-visibility-checker-design.md`
**Issue:** MI-70 — https://github.com/micode-ai/home/issues/75

## Global Constraints

- **No new npm dependencies.** The script must run with `node scripts/ai-visibility/run.mjs` on a clean checkout with no `npm ci`. The workflow deliberately has no install step.
- **Node 20**, ESM (`.mjs`), matching `scripts/generate-og-images.mjs`.
- **Default model `gemini-2.5-flash`.** Grounding is free only on 2.5 Flash / Flash-Lite — "Free of charge, up to 500 RPD (limit shared with Flash-Lite RPD)". Gemini 3.x bills search after 5,000/month. Never change the default to a 3.x model.
- **Every bot commit message must contain `[skip ci]`.** `deploy.yml` triggers on any push to `development` with no path filter.
- **Pure functions take no ambient state.** No `Date.now()`, no `process.env`, no `fetch` reached for directly inside `analyze.mjs` / `report.mjs` — clock, env and network arrive as arguments. This is what keeps the tests deterministic and offline.
- **A partial run is never written.** Any call that fails after its retry aborts the whole run with a non-zero exit and writes no files.
- **Commit after every task.**

---

### Task 1: Record the real API response shape

The spec depends on an external API that is mid-migration: the classic `generateContent` returns `candidates[].groundingMetadata.groundingChunks[].web.uri`, while the newer `/v1beta/interactions` returns `url_citation` annotations. Rather than guess, capture one real response and pin it as a fixture. Everything downstream is written against this file.

**Files:**
- Create: `scripts/ai-visibility/fixtures/generate-content.json`
- Create: `scripts/ai-visibility/fixtures/README.md`

**Interfaces:**
- Consumes: nothing
- Produces: two fixture files consumed by Task 3's tests, and a recorded decision on which endpoint mode is the default in Task 6.

- [ ] **Step 1: Get a free API key**

Create one at https://aistudio.google.com/apikey. Export it locally — do not put it in any file:

```bash
export GEMINI_API_KEY='...'
```

- [ ] **Step 2: Call the classic endpoint with grounding and save the raw response**

```bash
mkdir -p scripts/ai-visibility/fixtures
curl -sS \
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent' \
  -H "x-goog-api-key: ${GEMINI_API_KEY}" \
  -H 'content-type: application/json' \
  -d '{
    "contents": [{ "parts": [{ "text": "Czym zajmuje sie MiCode Sp. z o.o. z Gdanska?" }] }],
    "tools": [{ "google_search": {} }]
  }' > scripts/ai-visibility/fixtures/generate-content.json
```

- [ ] **Step 3: Verify the response actually contains grounding**

```bash
node -e "const r=require('./scripts/ai-visibility/fixtures/generate-content.json');
console.log('citations:', JSON.stringify(r.candidates?.[0]?.groundingMetadata?.groundingChunks?.slice(0,2), null, 2));
console.log('output_text present:', typeof r.output_text);
console.log('steps present:', Array.isArray(r.steps));"
```

Expected: a non-empty `groundingChunks` array whose entries have a `web` object. Note whether `web.uri` is a direct publisher URL or a `vertexaisearch.cloud.google.com/grounding-api-redirect/...` link, and whether a `web.domain` field is present — Task 3 handles all three cases, but the fixture must show which one is real today.

If instead the call errors with a model-not-found or tool-not-supported message, run the same probe against the newer endpoint and save it to `scripts/ai-visibility/fixtures/interactions.json`:

```bash
curl -sS 'https://generativelanguage.googleapis.com/v1beta/interactions' \
  -H "x-goog-api-key: ${GEMINI_API_KEY}" \
  -H 'content-type: application/json' \
  -d '{
    "model": "gemini-2.5-flash",
    "input": "Czym zajmuje sie MiCode Sp. z o.o. z Gdanska?",
    "tools": [{ "type": "google_search" }]
  }' > scripts/ai-visibility/fixtures/interactions.json
```

- [ ] **Step 4: Write the second fixture by hand**

Whichever endpoint answered in Step 3, the *other* shape still needs a fixture so the parser is covered both ways. Write the missing one by hand — it is small, and its point is to lock the shape, not to be a real answer. If Step 3 produced `generate-content.json`, create `scripts/ai-visibility/fixtures/interactions.json`:

```json
{
  "id": "int_hand_written",
  "model": "gemini-2.5-flash",
  "output_text": "MiCode Sp. z o.o. to software house z Gdanska.",
  "steps": [
    {
      "type": "model_output",
      "content": [
        {
          "type": "text",
          "text": "MiCode Sp. z o.o. to software house z Gdanska.",
          "annotations": [
            {
              "type": "url_citation",
              "url": "https://mi-code.pl/",
              "title": "MiCode — enterprise software and AI",
              "start_index": 0,
              "end_index": 45
            },
            {
              "type": "url_citation",
              "url": "https://rejestr.io/krs/example",
              "title": "Rejestr.io",
              "start_index": 46,
              "end_index": 60
            }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 5: Record what was learned**

Create `scripts/ai-visibility/fixtures/README.md`:

```markdown
# Fixtures

`generate-content.json` and `interactions.json` pin the two response shapes the
Gemini API can return for a grounded prompt. One of them was captured live on
2026-08-11 with a real key; the other is hand-written to lock the shape.

Recorded on capture:

- Endpoint that answered: `<generateContent | interactions>`
- Citation URLs came back as: `<direct publisher URLs | vertexaisearch redirects>`
- `web.domain` present: `<yes | no>`

`run.mjs` defaults to the endpoint recorded above (`DEFAULT_MODE`). The other is
reachable via `AI_VIS_ENDPOINT`, so a future migration is a config change rather
than a rewrite.

Fixtures contain no API key. Refresh them by re-running the probe in
`docs/superpowers/plans/2026-08-11-ai-visibility-checker.md`, Task 1.
```

Fill the three angle-bracket values in from what Step 3 actually printed. Leaving a literal `<...>` in the committed file is a bug, not a placeholder to keep.

- [ ] **Step 6: Confirm no secret leaked into the fixtures**

```bash
grep -ri "AIza" scripts/ai-visibility/fixtures/ || echo "clean"
```

Expected: `clean`.

- [ ] **Step 7: Commit**

```bash
git add scripts/ai-visibility/fixtures
git commit -m "Pin the Gemini grounding response shapes as fixtures (MI-70)"
```

---

### Task 2: The prompt set

**Files:**
- Create: `docs/seo/ai-visibility/prompts.json`
- Test: `scripts/ai-visibility/prompts.test.mjs`

**Interfaces:**
- Consumes: nothing
- Produces: the `prompts.json` contract — `{ domain: string, brandTerms: string[], prompts: Array<{ id, lang, kind, text, target }> }` where `lang ∈ {pl,en,ru}` and `kind ∈ {category,brand}`. Tasks 4 and 6 read it.

- [ ] **Step 1: Write the failing test**

Create `scripts/ai-visibility/prompts.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const config = JSON.parse(
  readFileSync(join(root, 'docs/seo/ai-visibility/prompts.json'), 'utf8'),
);

describe('prompts.json', () => {
  it('measures the live domain', () => {
    expect(config.domain).toBe('mi-code.pl');
  });

  it('lists brand terms to detect an unlinked mention', () => {
    expect(config.brandTerms).toContain('MiCode');
    expect(config.brandTerms.length).toBeGreaterThanOrEqual(4);
  });

  it('has unique ids', () => {
    const ids = config.prompts.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses only supported languages and kinds', () => {
    for (const p of config.prompts) {
      expect(['pl', 'en', 'ru']).toContain(p.lang);
      expect(['category', 'brand']).toContain(p.kind);
      expect(p.text.length).toBeGreaterThan(15);
    }
  });

  it('keeps brand controls in every measured language', () => {
    const brandLangs = new Set(
      config.prompts.filter((p) => p.kind === 'brand').map((p) => p.lang),
    );
    // Brand prompts are the canary: if even these stop being cited, indexing
    // broke rather than marketing. They are useless if a language has none.
    expect(brandLangs.has('pl')).toBe(true);
    expect(brandLangs.has('en')).toBe(true);
  });

  it('stays inside the free grounding budget at two repeats a run', () => {
    // 500 grounded requests per day are free, shared across Flash and Flash-Lite.
    expect(config.prompts.length * 2).toBeLessThan(500);
  });

  it('points category prompts at a page we actually publish', () => {
    for (const p of config.prompts.filter((x) => x.target)) {
      expect(p.target.startsWith('/')).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run scripts/ai-visibility/prompts.test.mjs`
Expected: FAIL — cannot read `docs/seo/ai-visibility/prompts.json`, the file does not exist.

- [ ] **Step 3: Write the prompt set**

Create `docs/seo/ai-visibility/prompts.json`:

```json
{
  "domain": "mi-code.pl",
  "brandTerms": [
    "MiCode",
    "mi-code.pl",
    "eKsiegowyAi",
    "eMarketingAI",
    "ngx-open-web-ui-chat",
    "Legalka",
    "Peraviortkin"
  ],
  "prompts": [
    { "id": "pl-firma-ai-gdansk", "lang": "pl", "kind": "category", "target": "/",
      "text": "Ktora firma programistyczna w Gdansku wdraza agentow AI dla biznesu?" },
    { "id": "pl-ksiegowosc-wfirma", "lang": "pl", "kind": "category", "target": "/products/accounting-ai/",
      "text": "Czy istnieje asystent AI, ktory laczy sie z wFirma i odpowiada na pytania o VAT i PIT?" },
    { "id": "pl-koszt-agenta", "lang": "pl", "kind": "category", "target": "/blog/ai-agent-cost-per-month-model/",
      "text": "Ile kosztuje miesiecznie utrzymanie agenta AI opartego na LLM?" },
    { "id": "pl-rag-halucynacje", "lang": "pl", "kind": "category", "target": "/blog/legalka-kb-ai-architecture/",
      "text": "Jak zbudowac chatbota RAG, ktory mowi 'nie wiem' zamiast halucynowac?" },
    { "id": "pl-geo-aeo", "lang": "pl", "kind": "category", "target": "/blog/geo-aeo-generative-answer-engine-optimization/",
      "text": "Jak sprawic, zeby ChatGPT i Perplexity cytowaly moja strone?" },
    { "id": "pl-legalizacja-bot", "lang": "pl", "kind": "category", "target": "/products/legalka-kb/",
      "text": "Czy jest darmowy bot, ktory pomaga zalegalizowac pobyt w Polsce?" },
    { "id": "pl-ai-act-2026", "lang": "pl", "kind": "category", "target": "/blog/ai-act-sierpien-2026-co-obowiazuje/",
      "text": "Jakie obowiazki naklada AI Act na firmy w 2026 roku?" },
    { "id": "pl-text2sql", "lang": "pl", "kind": "category", "target": "/blog/scm-ai-agents-supply-chain/",
      "text": "Kto w Polsce buduje systemy Text2SQL i RAG dla przedsiebiorstw?" },
    { "id": "pl-integracja-erp", "lang": "pl", "kind": "category", "target": "/blog/scm-ai-agents-supply-chain/",
      "text": "Jak zintegrowac agenta AI z systemem ERP i lancuchem dostaw?" },
    { "id": "pl-marketing-saas", "lang": "pl", "kind": "category", "target": "/products/emarketing-ai/",
      "text": "Jaka polska platforma SaaS generuje tresci marketingowe przy pomocy AI?" },

    { "id": "en-angular-ai-chat", "lang": "en", "kind": "category", "target": "/products/ngx-chat/",
      "text": "How do I add an AI chat component to an Angular app with a single npm install?" },
    { "id": "en-open-webui-angular", "lang": "en", "kind": "category", "target": "/products/ngx-chat/",
      "text": "Is there an Angular library that connects a chat UI to Open WebUI?" },
    { "id": "en-agent-cost", "lang": "en", "kind": "category", "target": "/blog/ai-agent-cost-per-month-model/",
      "text": "What actually drives the monthly cost of running an LLM agent in production?" },
    { "id": "en-self-improving-agents", "lang": "en", "kind": "category", "target": "/blog/self-improving-agent-teams/",
      "text": "How can a team of AI agents improve their own prompts overnight?" },
    { "id": "en-langgraph-tools", "lang": "en", "kind": "category", "target": "/blog/accounting-ai-agent-architecture/",
      "text": "How do you structure a single LangGraph agent that has more than 80 tools?" },
    { "id": "en-geo-aeo", "lang": "en", "kind": "category", "target": "/blog/geo-aeo-generative-answer-engine-optimization/",
      "text": "What is Generative Engine Optimization and how do I get my site cited by AI?" },
    { "id": "en-testing-ai", "lang": "en", "kind": "category", "target": "/products/testing-ai/",
      "text": "Are there AI platforms that generate test cases from a codebase and schedule the runs?" },
    { "id": "en-poland-ai-dev", "lang": "en", "kind": "category", "target": "/",
      "text": "Which software houses in Poland build enterprise AI integrations?" },

    { "id": "ru-legalizacja", "lang": "ru", "kind": "category", "target": "/products/legalka-kb/",
      "text": "Есть ли бесплатный бот, который помогает легализоваться в Польше?" },
    { "id": "ru-stoimost-agenta", "lang": "ru", "kind": "category", "target": "/blog/ai-agent-cost-per-month-model/",
      "text": "Сколько стоит содержать AI-агента на LLM в месяц?" },
    { "id": "ru-rag-bez-gallucinacij", "lang": "ru", "kind": "category", "target": "/blog/legalka-kb-ai-architecture/",
      "text": "Как сделать RAG-бота, который не выдумывает ответы, а говорит «не знаю»?" },
    { "id": "ru-geo-aeo", "lang": "ru", "kind": "category", "target": "/blog/geo-aeo-generative-answer-engine-optimization/",
      "text": "Как попасть в ответы ChatGPT и Perplexity со своим сайтом?" },
    { "id": "ru-buhgalteria-polsha", "lang": "ru", "kind": "category", "target": "/products/accounting-ai/",
      "text": "Какой AI-помощник разбирается в польских налогах VAT и PIT?" },

    { "id": "pl-brand-micode", "lang": "pl", "kind": "brand", "target": "/",
      "text": "Czym zajmuje sie MiCode Sp. z o.o. z Gdanska?" },
    { "id": "en-brand-micode", "lang": "en", "kind": "brand", "target": "/",
      "text": "What does the software company MiCode Sp. z o.o. do?" },
    { "id": "pl-brand-eksiegowy", "lang": "pl", "kind": "brand", "target": "/products/accounting-ai/",
      "text": "Co to jest eKsiegowyAi i kto go zbudowal?" },
    { "id": "en-brand-ngx", "lang": "en", "kind": "brand", "target": "/products/ngx-chat/",
      "text": "What is the npm package ngx-open-web-ui-chat?" }
  ]
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run scripts/ai-visibility/prompts.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add docs/seo/ai-visibility/prompts.json scripts/ai-visibility/prompts.test.mjs
git commit -m "Add the AI-visibility prompt set (MI-70)"
```

---

### Task 3: Parse citations out of either response shape

**Files:**
- Create: `scripts/ai-visibility/analyze.mjs`
- Test: `scripts/ai-visibility/analyze.test.mjs`

**Interfaces:**
- Consumes: the fixtures from Task 1.
- Produces:
  - `extractText(response) -> string`
  - `extractCitations(response) -> Array<{ url: string, title: string, domain: string | null }>`
  - `resolveHost(citation, fetchImpl) -> Promise<string>` — a bare hostname without `www.`, or `'unknown'`

- [ ] **Step 1: Write the failing test**

Create `scripts/ai-visibility/analyze.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractText, extractCitations, resolveHost } from './analyze.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name) =>
  JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8'));

describe('extractCitations', () => {
  it('reads the generateContent shape', () => {
    const response = {
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: 'https://mi-code.pl/', title: 'MiCode', domain: 'mi-code.pl' } },
              { web: { uri: 'https://wfirma.pl/', title: 'wFirma' } },
            ],
          },
        },
      ],
    };
    expect(extractCitations(response)).toEqual([
      { url: 'https://mi-code.pl/', title: 'MiCode', domain: 'mi-code.pl' },
      { url: 'https://wfirma.pl/', title: 'wFirma', domain: null },
    ]);
  });

  it('reads the interactions url_citation shape', () => {
    const response = {
      steps: [
        {
          type: 'model_output',
          content: [
            {
              type: 'text',
              annotations: [
                { type: 'url_citation', url: 'https://mi-code.pl/', title: 'MiCode' },
                { type: 'something_else', url: 'https://ignored.example/' },
              ],
            },
          ],
        },
      ],
    };
    expect(extractCitations(response)).toEqual([
      { url: 'https://mi-code.pl/', title: 'MiCode', domain: null },
    ]);
  });

  it('handles both committed fixtures without throwing', () => {
    for (const name of ['generate-content.json', 'interactions.json']) {
      expect(Array.isArray(extractCitations(fixture(name)))).toBe(true);
    }
  });

  it('de-duplicates a url cited more than once', () => {
    const response = {
      steps: [
        {
          content: [
            {
              annotations: [
                { type: 'url_citation', url: 'https://mi-code.pl/', title: 'a' },
                { type: 'url_citation', url: 'https://mi-code.pl/', title: 'b' },
              ],
            },
          ],
        },
      ],
    };
    expect(extractCitations(response)).toHaveLength(1);
  });

  it('returns an empty list for an ungrounded answer', () => {
    expect(extractCitations({ candidates: [{ content: { parts: [{ text: 'hi' }] } }] })).toEqual([]);
    expect(extractCitations({})).toEqual([]);
  });
});

describe('extractText', () => {
  it('reads output_text when present', () => {
    expect(extractText({ output_text: 'answer' })).toBe('answer');
  });

  it('joins candidate parts otherwise', () => {
    const response = {
      candidates: [{ content: { parts: [{ text: 'one' }, { text: 'two' }] } }],
    };
    expect(extractText(response)).toBe('one\ntwo');
  });

  it('returns an empty string when there is no text at all', () => {
    expect(extractText({})).toBe('');
  });
});

describe('resolveHost', () => {
  const explode = () => {
    throw new Error('network must not be touched for a direct url');
  };

  it('takes the host straight off a direct url and drops www', async () => {
    expect(await resolveHost({ url: 'https://www.mi-code.pl/en/' }, explode)).toBe('mi-code.pl');
  });

  it('prefers the domain field over a network call for a redirect', async () => {
    const citation = {
      url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc',
      domain: 'www.mi-code.pl',
    };
    expect(await resolveHost(citation, explode)).toBe('mi-code.pl');
  });

  it('reads the publisher domain off the title when it is shaped like one', async () => {
    // Confirmed against the live fixture on 2026-08-11: grounded chunks carry no
    // domain field, and their title is the bare publisher domain.
    const citation = {
      url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc',
      title: 'krs-online.com.pl',
      domain: null,
    };
    expect(await resolveHost(citation, explode)).toBe('krs-online.com.pl');
  });

  it('follows the redirect when the title is a page title rather than a domain', async () => {
    const fetchImpl = async () => ({ url: 'https://mi-code.pl/products/accounting-ai/' });
    const citation = {
      url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc',
      title: 'MiCode — enterprise software and AI',
      domain: null,
    };
    expect(await resolveHost(citation, fetchImpl)).toBe('mi-code.pl');
  });

  it('follows the redirect when there is no title at all', async () => {
    const fetchImpl = async () => ({ url: 'https://mi-code.pl/products/accounting-ai/' });
    const citation = {
      url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc',
      title: '',
      domain: null,
    };
    expect(await resolveHost(citation, fetchImpl)).toBe('mi-code.pl');
  });

  it('reports unknown instead of throwing when the redirect cannot be followed', async () => {
    const fetchImpl = async () => {
      throw new Error('ECONNRESET');
    };
    const citation = {
      url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc',
      domain: null,
    };
    expect(await resolveHost(citation, fetchImpl)).toBe('unknown');
  });

  it('reports unknown for a malformed url', async () => {
    expect(await resolveHost({ url: 'not a url' }, explode)).toBe('unknown');
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run scripts/ai-visibility/analyze.test.mjs`
Expected: FAIL — `Failed to resolve import "./analyze.mjs"`.

- [ ] **Step 3: Write the implementation**

Create `scripts/ai-visibility/analyze.mjs`:

```js
// Pure analysis of one grounded answer. No clock, no env, no ambient fetch —
// everything the functions need arrives as an argument, so the tests run offline
// and deterministically.

// Google hands back grounded sources as redirects through this host. Comparing
// our domain against such a URL would never match, so the host has to be
// resolved before any classification happens.
const REDIRECT_HOSTS = ['vertexaisearch.cloud.google.com'];

// A grounded chunk's title is usually the publisher's bare domain rather than a
// page title — verified against the live response captured in fixtures/. When it
// is shaped like a domain we trust it, because the alternative is one HEAD
// request per source and a weekly run sees a few hundred of them.
const DOMAIN_SHAPED = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

const bareHost = (value) => String(value).replace(/^www\./, '').toLowerCase();

export function extractText(response) {
  if (typeof response?.output_text === 'string') return response.output_text;
  return (response?.candidates ?? [])
    .flatMap((candidate) => candidate?.content?.parts ?? [])
    .map((part) => part?.text ?? '')
    .filter(Boolean)
    .join('\n');
}

export function extractCitations(response) {
  const citations = [];
  const seen = new Set();
  const add = (url, title, domain) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    citations.push({ url, title: title ?? '', domain: domain ?? null });
  };

  // Shape A — classic generateContent.
  for (const candidate of response?.candidates ?? []) {
    for (const chunk of candidate?.groundingMetadata?.groundingChunks ?? []) {
      if (chunk?.web) add(chunk.web.uri, chunk.web.title, chunk.web.domain);
    }
  }

  // Shape B — the interactions endpoint, where citations are text annotations.
  for (const step of response?.steps ?? []) {
    for (const content of step?.content ?? []) {
      for (const annotation of content?.annotations ?? []) {
        if (annotation?.type === 'url_citation') add(annotation.url, annotation.title, null);
      }
    }
  }

  return citations;
}

export async function resolveHost(citation, fetchImpl) {
  let host;
  try {
    host = bareHost(new URL(citation.url).hostname);
  } catch {
    return 'unknown';
  }

  if (!REDIRECT_HOSTS.includes(host)) return host;
  if (citation.domain) return bareHost(citation.domain);

  const title = String(citation.title ?? '').trim();
  if (DOMAIN_SHAPED.test(title)) return bareHost(title);

  try {
    const response = await fetchImpl(citation.url, { method: 'HEAD', redirect: 'follow' });
    return bareHost(new URL(response.url).hostname);
  } catch {
    return 'unknown';
  }
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run scripts/ai-visibility/analyze.test.mjs`
Expected: PASS, 15 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/ai-visibility/analyze.mjs scripts/ai-visibility/analyze.test.mjs
git commit -m "Parse cited sources out of either Gemini response shape (MI-70)"
```

---

### Task 4: Classify and summarise

**Files:**
- Modify: `scripts/ai-visibility/analyze.mjs`
- Modify: `scripts/ai-visibility/analyze.test.mjs`

**Interfaces:**
- Consumes: `extractText`, `extractCitations`, `resolveHost` from Task 3.
- Produces:
  - `classify({ text, hosts, domain, brandTerms }) -> 'cited' | 'mentioned' | 'absent'`
  - `bestStatus(statuses: string[]) -> string`
  - `summarize(results) -> { byLang, byKind, citedShare }` where each bucket is `{ cited, mentioned, absent }` and `results` entries are `{ id, lang, kind, status }`

- [ ] **Step 1: Write the failing test**

Append to `scripts/ai-visibility/analyze.test.mjs`:

```js
import { classify, bestStatus, summarize } from './analyze.mjs';

const BRAND = ['MiCode', 'eKsiegowyAi'];

describe('classify', () => {
  it('calls it cited when our domain is among the sources', () => {
    const status = classify({
      text: 'Nothing recognisable here.',
      hosts: ['wfirma.pl', 'mi-code.pl'],
      domain: 'mi-code.pl',
      brandTerms: BRAND,
    });
    expect(status).toBe('cited');
  });

  it('counts a subdomain of ours as cited', () => {
    const status = classify({
      text: '', hosts: ['blog.mi-code.pl'], domain: 'mi-code.pl', brandTerms: BRAND,
    });
    expect(status).toBe('cited');
  });

  it('does not mistake a lookalike domain for ours', () => {
    const status = classify({
      text: '', hosts: ['notmi-code.pl'], domain: 'mi-code.pl', brandTerms: BRAND,
    });
    expect(status).toBe('absent');
  });

  it('calls it mentioned when the brand is in the text but not in the sources', () => {
    const status = classify({
      text: 'Takim narzedziem jest eKsiegowyAi od polskiego zespolu.',
      hosts: ['poradnikprzedsiebiorcy.pl'],
      domain: 'mi-code.pl',
      brandTerms: BRAND,
    });
    expect(status).toBe('mentioned');
  });

  it('matches a brand term regardless of case', () => {
    const status = classify({
      text: 'micode builds agents', hosts: [], domain: 'mi-code.pl', brandTerms: BRAND,
    });
    expect(status).toBe('mentioned');
  });

  it('prefers cited over mentioned when both are true', () => {
    const status = classify({
      text: 'MiCode', hosts: ['mi-code.pl'], domain: 'mi-code.pl', brandTerms: BRAND,
    });
    expect(status).toBe('cited');
  });

  it('calls it absent when neither is true', () => {
    const status = classify({
      text: 'Some other vendors.', hosts: ['sap.com'], domain: 'mi-code.pl', brandTerms: BRAND,
    });
    expect(status).toBe('absent');
  });
});

describe('bestStatus', () => {
  it('takes the strongest of the repeats', () => {
    expect(bestStatus(['absent', 'cited'])).toBe('cited');
    expect(bestStatus(['absent', 'mentioned'])).toBe('mentioned');
    expect(bestStatus(['absent', 'absent'])).toBe('absent');
  });

  it('treats no attempts as absent rather than crashing', () => {
    expect(bestStatus([])).toBe('absent');
  });
});

describe('summarize', () => {
  const results = [
    { id: 'a', lang: 'pl', kind: 'category', status: 'cited' },
    { id: 'b', lang: 'pl', kind: 'category', status: 'absent' },
    { id: 'c', lang: 'en', kind: 'brand', status: 'mentioned' },
    { id: 'd', lang: 'en', kind: 'brand', status: 'cited' },
  ];

  it('counts every status per language', () => {
    expect(summarize(results).byLang).toEqual({
      pl: { cited: 1, mentioned: 0, absent: 1 },
      en: { cited: 1, mentioned: 1, absent: 0 },
    });
  });

  it('counts every status per kind', () => {
    expect(summarize(results).byKind).toEqual({
      category: { cited: 1, mentioned: 0, absent: 1 },
      brand: { cited: 1, mentioned: 1, absent: 0 },
    });
  });

  it('reports the cited share over all prompts', () => {
    expect(summarize(results).citedShare).toBeCloseTo(0.5, 5);
  });

  it('reports a zero share for an empty run instead of dividing by zero', () => {
    expect(summarize([]).citedShare).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run scripts/ai-visibility/analyze.test.mjs`
Expected: FAIL — `classify is not a function` (the import resolves to `undefined`).

- [ ] **Step 3: Write the implementation**

Append to `scripts/ai-visibility/analyze.mjs`:

```js
// Ranked so a repeat that found more evidence wins over one that found less.
const RANK = { cited: 3, mentioned: 2, absent: 1 };

export function classify({ text, hosts, domain, brandTerms }) {
  const target = bareHost(domain);
  const isOurs = (host) => host === target || host.endsWith(`.${target}`);
  if (hosts.some(isOurs)) return 'cited';

  const haystack = String(text).toLowerCase();
  // A brand can be named without being linked — worth knowing, but it is not
  // a citation and must never be counted as one.
  const named = brandTerms.some((term) => haystack.includes(term.toLowerCase()));
  return named ? 'mentioned' : 'absent';
}

export function bestStatus(statuses) {
  return statuses.reduce(
    (best, status) => ((RANK[status] ?? 0) > RANK[best] ? status : best),
    'absent',
  );
}

export function summarize(results) {
  const emptyBucket = () => ({ cited: 0, mentioned: 0, absent: 0 });
  const byLang = {};
  const byKind = {};

  for (const result of results) {
    (byLang[result.lang] ??= emptyBucket())[result.status] += 1;
    (byKind[result.kind] ??= emptyBucket())[result.status] += 1;
  }

  const cited = results.filter((result) => result.status === 'cited').length;
  return { byLang, byKind, citedShare: results.length ? cited / results.length : 0 };
}
```

Note on `classify`: matching a lookalike like `notmi-code.pl` is prevented by comparing against `.${target}` with the dot, not by `includes`. The test for it is there because the naive version of this function is wrong in exactly that way.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run scripts/ai-visibility/analyze.test.mjs`
Expected: PASS, 28 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/ai-visibility/analyze.mjs scripts/ai-visibility/analyze.test.mjs
git commit -m "Classify each prompt as cited, mentioned or absent (MI-70)"
```

---

### Task 5: Diff two runs and render the report

**Files:**
- Create: `scripts/ai-visibility/report.mjs`
- Test: `scripts/ai-visibility/report.test.mjs`

**Interfaces:**
- Consumes: run objects shaped as `{ date, source, model, calls, results, summary }` where `results` entries are `{ id, lang, kind, status, target, attempts }`.
- Produces:
  - `diffRuns(previous, next) -> { gained: string[], lost: string[], changed: boolean, baseline: boolean }`
  - `renderReport({ run, previous, manual }) -> string` (markdown)
  - `renderAlert(diff, run) -> string` (plain text for Telegram)

- [ ] **Step 1: Write the failing test**

Create `scripts/ai-visibility/report.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import { diffRuns, renderReport, renderAlert } from './report.mjs';

const run = (date, statuses) => ({
  date,
  source: 'gemini',
  model: 'gemini-2.5-flash',
  calls: Object.keys(statuses).length * 2,
  results: Object.entries(statuses).map(([id, status]) => ({
    id,
    lang: id.slice(0, 2),
    kind: id.includes('brand') ? 'brand' : 'category',
    status,
    target: '/',
    attempts: [],
  })),
  summary: { byLang: {}, byKind: {}, citedShare: 0 },
});

describe('diffRuns', () => {
  it('reports a prompt that started being cited', () => {
    const diff = diffRuns(run('2026-08-04', { 'pl-a': 'absent' }), run('2026-08-11', { 'pl-a': 'cited' }));
    expect(diff.gained).toEqual(['pl-a']);
    expect(diff.lost).toEqual([]);
    expect(diff.changed).toBe(true);
  });

  it('reports a prompt that stopped being cited', () => {
    const diff = diffRuns(run('2026-08-04', { 'pl-a': 'cited' }), run('2026-08-11', { 'pl-a': 'mentioned' }));
    expect(diff.lost).toEqual(['pl-a']);
    expect(diff.gained).toEqual([]);
    expect(diff.changed).toBe(true);
  });

  it('stays quiet when nothing moved', () => {
    const diff = diffRuns(run('2026-08-04', { 'pl-a': 'cited' }), run('2026-08-11', { 'pl-a': 'cited' }));
    expect(diff.changed).toBe(false);
  });

  it('ignores mentioned-to-absent flicker, which is not a citation change', () => {
    const diff = diffRuns(run('2026-08-04', { 'pl-a': 'mentioned' }), run('2026-08-11', { 'pl-a': 'absent' }));
    expect(diff.changed).toBe(false);
  });

  it('treats a first run as a baseline and never alerts on it', () => {
    const diff = diffRuns(null, run('2026-08-11', { 'pl-a': 'cited' }));
    expect(diff.baseline).toBe(true);
    expect(diff.changed).toBe(false);
    expect(diff.gained).toEqual(['pl-a']);
  });
});

describe('renderReport', () => {
  const next = run('2026-08-11', { 'pl-a': 'cited', 'en-b': 'absent' });

  it('leads with the date and the model', () => {
    const md = renderReport({ run: next, previous: null, manual: null });
    expect(md).toContain('2026-08-11');
    expect(md).toContain('gemini-2.5-flash');
  });

  it('lists every prompt with its status', () => {
    const md = renderReport({ run: next, previous: null, manual: null });
    expect(md).toContain('pl-a');
    expect(md).toContain('en-b');
  });

  it('spells out what the number does not mean', () => {
    const md = renderReport({ run: next, previous: null, manual: null });
    expect(md.toLowerCase()).toContain('not chatgpt');
  });

  it('renders without a previous run', () => {
    expect(() => renderReport({ run: next, previous: null, manual: null })).not.toThrow();
  });

  it('shows the manual snapshot when one exists', () => {
    const manual = {
      month: '2026-08',
      crawlers: { GPTBot: 120, 'ChatGPT-User': 3 },
      referrals: { 'chatgpt.com': 2 },
      engines: [{ engine: 'chatgpt', id: 'pl-a', status: 'absent', note: '' }],
    };
    const md = renderReport({ run: next, previous: null, manual });
    expect(md).toContain('GPTBot');
    expect(md).toContain('120');
    expect(md).toContain('chatgpt.com');
  });

  it('says so plainly when no manual snapshot has been taken', () => {
    const md = renderReport({ run: next, previous: null, manual: null });
    expect(md).toContain('no manual snapshot');
  });
});

describe('renderAlert', () => {
  it('names what appeared and what disappeared', () => {
    const diff = { gained: ['pl-a'], lost: ['en-b'], changed: true, baseline: false };
    const text = renderAlert(diff, run('2026-08-11', {}));
    expect(text).toContain('pl-a');
    expect(text).toContain('en-b');
    expect(text).toContain('2026-08-11');
  });

  it('omits an empty side rather than printing an empty list', () => {
    const diff = { gained: ['pl-a'], lost: [], changed: true, baseline: false };
    const text = renderAlert(diff, run('2026-08-11', {}));
    expect(text).not.toContain('Lost');
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run scripts/ai-visibility/report.test.mjs`
Expected: FAIL — `Failed to resolve import "./report.mjs"`.

- [ ] **Step 3: Write the implementation**

Create `scripts/ai-visibility/report.mjs`:

```js
// Rendering and diffing. Like analyze.mjs: pure, no clock, no filesystem —
// the run's own `date` field is the only notion of time.

const citedIds = (run) =>
  new Set((run?.results ?? []).filter((r) => r.status === 'cited').map((r) => r.id));

export function diffRuns(previous, next) {
  const before = citedIds(previous);
  const after = citedIds(next);
  const gained = [...after].filter((id) => !before.has(id)).sort();
  const lost = [...before].filter((id) => !after.has(id)).sort();
  const baseline = previous == null;

  return {
    gained,
    lost,
    baseline,
    // A first run has nothing to compare against: everything would look like a
    // gain, and the ops channel would get a wall of noise on day one.
    changed: !baseline && (gained.length > 0 || lost.length > 0),
  };
}

const percent = (value) => `${(value * 100).toFixed(1)}%`;

const bucketRows = (buckets) =>
  Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => `| ${key} | ${b.cited} | ${b.mentioned} | ${b.absent} |`)
    .join('\n');

const STATUS_ICON = { cited: '✅', mentioned: '➖', absent: '❌' };

export function renderReport({ run, previous, manual }) {
  const diff = diffRuns(previous, run);
  const lines = [];

  lines.push('# AI visibility — mi-code.pl');
  lines.push('');
  lines.push('<!-- Generated by scripts/ai-visibility/run.mjs. Do not edit by hand. -->');
  lines.push('');
  lines.push(`**Run:** ${run.date} · **Model:** ${run.model} · **Calls:** ${run.calls}`);
  lines.push(`**Cited share:** ${percent(run.summary.citedShare)}`);
  lines.push('');

  if (diff.baseline) {
    lines.push('First run — no previous measurement to compare against.');
  } else if (diff.changed) {
    if (diff.gained.length) lines.push(`**Newly cited:** ${diff.gained.join(', ')}`);
    if (diff.lost.length) lines.push(`**No longer cited:** ${diff.lost.join(', ')}`);
  } else {
    lines.push('No change in the set of cited prompts since the previous run.');
  }
  lines.push('');

  lines.push('## By language');
  lines.push('');
  lines.push('| lang | cited | mentioned | absent |');
  lines.push('|---|---|---|---|');
  lines.push(bucketRows(run.summary.byLang));
  lines.push('');

  lines.push('## By kind');
  lines.push('');
  lines.push('| kind | cited | mentioned | absent |');
  lines.push('|---|---|---|---|');
  lines.push(bucketRows(run.summary.byKind));
  lines.push('');

  lines.push('## Prompts');
  lines.push('');
  lines.push('| | prompt | lang | target |');
  lines.push('|---|---|---|---|');
  for (const result of run.results) {
    lines.push(
      `| ${STATUS_ICON[result.status] ?? '?'} | ${result.id} | ${result.lang} | ${result.target ?? ''} |`,
    );
  }
  lines.push('');

  lines.push('## Manual snapshot');
  lines.push('');
  if (manual) {
    lines.push(`Month: ${manual.month}`);
    lines.push('');
    lines.push('| crawler | hits |');
    lines.push('|---|---|');
    for (const [bot, hits] of Object.entries(manual.crawlers ?? {})) {
      lines.push(`| ${bot} | ${hits} |`);
    }
    lines.push('');
    lines.push('| referrer | sessions |');
    lines.push('|---|---|');
    for (const [source, sessions] of Object.entries(manual.referrals ?? {})) {
      lines.push(`| ${source} | ${sessions} |`);
    }
    lines.push('');
    if (manual.engines?.length) {
      lines.push('| engine | prompt | status |');
      lines.push('|---|---|---|');
      for (const row of manual.engines) {
        lines.push(`| ${row.engine} | ${row.id} | ${row.status} |`);
      }
      lines.push('');
    }
  } else {
    lines.push('There is no manual snapshot for this month yet.');
    lines.push('');
  }

  lines.push('## What this does not measure');
  lines.push('');
  lines.push('- Gemini is **not ChatGPT**. One engine gives a trend line for how findable and');
  lines.push('  citable the site is, not a share of all AI answers.');
  lines.push('- Grounding through an API does not rank the same way the engine\'s web UI does.');
  lines.push('- GA4 referrals only count visitors who accepted cookies, so that figure is a floor.');
  lines.push('- A single run proves nothing. Only the series does.');
  lines.push('');

  return lines.join('\n');
}

export function renderAlert(diff, run) {
  const parts = [`AI visibility — mi-code.pl (${run.date})`, ''];
  if (diff.gained.length) parts.push(`Newly cited: ${diff.gained.join(', ')}`);
  if (diff.lost.length) parts.push(`Lost: ${diff.lost.join(', ')}`);
  return parts.join('\n');
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run scripts/ai-visibility/report.test.mjs`
Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/ai-visibility/report.mjs scripts/ai-visibility/report.test.mjs
git commit -m "Diff runs and render the AI-visibility report (MI-70)"
```

---

### Task 6: The runner

**Files:**
- Create: `scripts/ai-visibility/run.mjs`
- Test: `scripts/ai-visibility/run.test.mjs`
- Modify: `package.json` (add the `ai-visibility` script)

**Interfaces:**
- Consumes: everything from Tasks 3–5, plus `docs/seo/ai-visibility/prompts.json`.
- Produces:
  - `buildRequest(mode, model, text) -> { url, body }`
  - `measure(config, deps) -> Promise<{ results, calls }>` where `config` is `{ prompts, domain, brandTerms, model, mode, repeats, apiKey }` and `deps` is `{ fetchImpl, sleep }`
  - `main()` — the CLI entry point, invoked when the module is run directly

- [ ] **Step 1: Write the failing test**

Create `scripts/ai-visibility/run.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import { buildRequest, measure } from './run.mjs';

const config = {
  domain: 'mi-code.pl',
  brandTerms: ['MiCode'],
  model: 'gemini-2.5-flash',
  mode: 'generateContent',
  repeats: 2,
  apiKey: 'test-key',
  prompts: [
    { id: 'pl-a', lang: 'pl', kind: 'category', target: '/', text: 'pytanie?' },
  ],
};

const answer = (uri) => ({
  candidates: [
    {
      content: { parts: [{ text: 'Odpowiedz.' }] },
      groundingMetadata: { groundingChunks: [{ web: { uri, title: 't', domain: null } }] },
    },
  ],
});

const okResponse = (payload) => ({ ok: true, status: 200, json: async () => payload });
const noSleep = async () => {};

describe('buildRequest', () => {
  it('targets the classic endpoint with the google_search tool', () => {
    const { url, body } = buildRequest('generateContent', 'gemini-2.5-flash', 'hi');
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    );
    expect(body.tools).toEqual([{ google_search: {} }]);
    expect(body.contents[0].parts[0].text).toBe('hi');
  });

  it('targets the interactions endpoint with the typed tool', () => {
    const { url, body } = buildRequest('interactions', 'gemini-2.5-flash', 'hi');
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect(body.tools).toEqual([{ type: 'google_search' }]);
    expect(body.input).toBe('hi');
  });
});

describe('measure', () => {
  it('calls the API once per prompt per repeat', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return okResponse(answer('https://example.com/'));
    };
    const result = await measure(config, { fetchImpl, sleep: noSleep });
    expect(calls).toBe(2);
    expect(result.calls).toBe(2);
  });

  it('sends the key in the x-goog-api-key header', async () => {
    let headers;
    const fetchImpl = async (_url, options) => {
      headers = options.headers;
      return okResponse(answer('https://example.com/'));
    };
    await measure(config, { fetchImpl, sleep: noSleep });
    expect(headers['x-goog-api-key']).toBe('test-key');
  });

  it('keeps the strongest status across the repeats', async () => {
    const pages = [answer('https://example.com/'), answer('https://mi-code.pl/')];
    const fetchImpl = async () => okResponse(pages.shift());
    const { results } = await measure(config, { fetchImpl, sleep: noSleep });
    expect(results[0].status).toBe('cited');
    expect(results[0].attempts).toHaveLength(2);
    expect(results[0].attempts[0].status).toBe('absent');
  });

  it('retries once on a rate limit and then succeeds', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      if (calls === 1) return { ok: false, status: 429, text: async () => 'slow down' };
      return okResponse(answer('https://mi-code.pl/'));
    };
    const { results } = await measure({ ...config, repeats: 1 }, { fetchImpl, sleep: noSleep });
    expect(calls).toBe(2);
    expect(results[0].status).toBe('cited');
  });

  it('aborts the whole run when a call fails twice, rather than saving half a measurement', async () => {
    const fetchImpl = async () => ({ ok: false, status: 500, text: async () => 'boom' });
    await expect(
      measure({ ...config, repeats: 1 }, { fetchImpl, sleep: noSleep }),
    ).rejects.toThrow(/500/);
  });

  it('paces its calls so the free tier per-minute limit is not tripped', async () => {
    // The first live run fired 54 calls back to back and died on a 429 within
    // seconds, while a single call at rest succeeded — the limit is per minute,
    // and the gap between calls is the whole fix.
    const waits = [];
    const fetchImpl = async () => okResponse(answer('https://example.com/'));
    const sleep = async (ms) => { waits.push(ms); };
    await measure({ ...config, delayMs: 6500 }, { fetchImpl, sleep });
    // Two calls, so exactly one gap — and nothing waited before the first.
    expect(waits).toEqual([6500]);
  });

  it('waits out a rate limit for longer than a server error', async () => {
    const waits = [];
    const sleep = async (ms) => { waits.push(ms); };
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      if (calls === 1) return { ok: false, status: 429, text: async () => 'slow down' };
      return okResponse(answer('https://mi-code.pl/'));
    };
    await measure({ ...config, repeats: 1, delayMs: 0 }, { fetchImpl, sleep });
    expect(waits).toEqual([30000]);
  });

  it('does not retry a 400, which will fail identically the second time', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return { ok: false, status: 400, text: async () => 'bad model' };
    };
    await expect(
      measure({ ...config, repeats: 1 }, { fetchImpl, sleep: noSleep }),
    ).rejects.toThrow(/400/);
    expect(calls).toBe(1);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run scripts/ai-visibility/run.test.mjs`
Expected: FAIL — `Failed to resolve import "./run.mjs"`.

- [ ] **Step 3: Write the implementation**

Create `scripts/ai-visibility/run.mjs`:

```js
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractText, extractCitations, resolveHost, classify, bestStatus, summarize }
  from './analyze.mjs';
import { diffRuns, renderReport, renderAlert } from './report.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dataDir = join(root, 'docs/seo/ai-visibility');

// Grounding is free only on 2.5 Flash / Flash-Lite (500 RPD, shared). A 3.x
// model would start billing search after 5,000 a month — never default to one.
const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_MODE = 'generateContent';
const DEFAULT_REPEATS = 2;
const RETRY_DELAY_MS = 5000;
// The free tier caps requests per minute as well as per day, and a run fires
// dozens of them back to back. Pacing is what stops a weekly run from killing
// itself with its own throughput: the first live run tripped a 429 within
// seconds without it, while a single call at rest succeeded.
const DEFAULT_DELAY_MS = 6500;
const RATE_LIMIT_DELAY_MS = 30000;

export function buildRequest(mode, model, text) {
  if (mode === 'interactions') {
    return {
      url: 'https://generativelanguage.googleapis.com/v1beta/interactions',
      body: { model, input: text, tools: [{ type: 'google_search' }] },
    };
  }
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    body: { contents: [{ parts: [{ text }] }], tools: [{ google_search: {} }] },
  };
}

async function callOnce({ url, body }, apiKey, { fetchImpl, sleep }) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    });

    if (response.ok) return response.json();

    // A 429 or a 5xx is worth one more try; a 4xx is a broken request and will
    // fail identically, so burning a second call on it only wastes quota.
    const retryable = response.status === 429 || response.status >= 500;
    if (attempt === 0 && retryable) {
      // A rate limit clears on a clock, a server error on a whim — wait out the
      // former properly rather than spending the one retry too early.
      await sleep(response.status === 429 ? RATE_LIMIT_DELAY_MS : RETRY_DELAY_MS);
      continue;
    }
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Gemini API ${response.status}: ${detail}`);
  }
}

export async function measure(config, deps) {
  const { prompts, domain, brandTerms, model, mode, repeats, apiKey, delayMs } = config;
  const results = [];
  let calls = 0;

  for (const prompt of prompts) {
    const attempts = [];

    for (let repeat = 0; repeat < repeats; repeat += 1) {
      // Pace every call but the first: the gap belongs between calls, and
      // waiting before the run has even started just burns wall clock.
      if (calls > 0) await deps.sleep(delayMs ?? 0);

      const response = await callOnce(
        buildRequest(mode, model, prompt.text), apiKey, deps,
      );
      calls += 1;

      const citations = extractCitations(response);
      const hosts = [];
      for (const citation of citations) {
        hosts.push(await resolveHost(citation, deps.fetchImpl));
      }

      const status = classify({
        text: extractText(response), hosts, domain, brandTerms,
      });
      attempts.push({
        status,
        citedUrls: citations
          .filter((_, index) => hosts[index] === domain || hosts[index].endsWith(`.${domain}`))
          .map((citation) => citation.url),
        sourceDomains: [...new Set(hosts)],
      });
    }

    results.push({
      id: prompt.id,
      lang: prompt.lang,
      kind: prompt.kind,
      target: prompt.target ?? null,
      status: bestStatus(attempts.map((a) => a.status)),
      attempts,
    });
  }

  return { results, calls };
}

function readPreviousRun(runsDir, todayFile) {
  if (!existsSync(runsDir)) return null;
  const earlier = readdirSync(runsDir)
    .filter((name) => name.endsWith('.json') && name !== todayFile)
    .sort();
  if (!earlier.length) return null;
  return JSON.parse(readFileSync(join(runsDir, earlier.at(-1)), 'utf8'));
}

function readManualSnapshot(month) {
  const path = join(dataDir, 'manual', `${month}.json`);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

function publishOutputs(diff, alertText) {
  if (!process.env.GITHUB_OUTPUT) return;
  writeFileSync(
    process.env.GITHUB_OUTPUT,
    `changed=${diff.changed}\nalert<<ALERT_EOF\n${alertText}\nALERT_EOF\n`,
    { flag: 'a' },
  );
}

export async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const config = JSON.parse(readFileSync(join(dataDir, 'prompts.json'), 'utf8'));
  const model = process.env.AI_VIS_MODEL || DEFAULT_MODEL;
  const mode = process.env.AI_VIS_ENDPOINT || DEFAULT_MODE;
  const repeats = Number(process.env.AI_VIS_REPEATS || DEFAULT_REPEATS);
  const delayMs = Number(process.env.AI_VIS_DELAY_MS || DEFAULT_DELAY_MS);
  const date = process.env.AI_VIS_DATE || new Date().toISOString().slice(0, 10);

  const { results, calls } = await measure(
    { ...config, model, mode, repeats, delayMs, apiKey },
    { fetchImpl: fetch, sleep: (ms) => new Promise((r) => setTimeout(r, ms)) },
  );

  const run = { date, source: 'gemini', model, calls, results, summary: summarize(results) };

  const runsDir = join(dataDir, 'runs');
  const todayFile = `${date}.json`;
  const previous = readPreviousRun(runsDir, todayFile);
  const diff = diffRuns(previous, run);

  mkdirSync(runsDir, { recursive: true });
  writeFileSync(join(runsDir, todayFile), `${JSON.stringify(run, null, 2)}\n`);
  writeFileSync(
    join(dataDir, 'REPORT.md'),
    renderReport({ run, previous, manual: readManualSnapshot(date.slice(0, 7)) }),
  );

  publishOutputs(diff, renderAlert(diff, run));
  console.log(`${calls} calls · cited ${(run.summary.citedShare * 100).toFixed(1)}% · changed=${diff.changed}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
```

Set `DEFAULT_MODE` to whichever endpoint the Task 1 probe actually answered on, and leave the other reachable through `AI_VIS_ENDPOINT`.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run scripts/ai-visibility/run.test.mjs`
Expected: PASS, 10 tests.

- [ ] **Step 5: Add the npm script**

In `package.json`, inside `"scripts"`, after `"preview"`:

```json
"ai-visibility": "node scripts/ai-visibility/run.mjs",
```

- [ ] **Step 6: Run the whole suite to be sure nothing else broke**

Run: `npm run test:run`
Expected: PASS, including the existing suites.

- [ ] **Step 7: Do one real end-to-end run**

```bash
export GEMINI_API_KEY='...'
npm run ai-visibility
```

Expect this to take several minutes, not seconds: calls are paced about 6.5s apart to stay under the free tier's per-minute limit, so 54 of them is roughly six minutes of mostly waiting.

Expected: a line like `54 calls · cited 3.7% · changed=false`, a new `docs/seo/ai-visibility/runs/<today>.json`, and a rebuilt `docs/seo/ai-visibility/REPORT.md`. Open the report and confirm the brand prompts are not all `absent` — if `pl-brand-micode` cannot find us, the problem is indexing, not the script.

- [ ] **Step 8: Commit**

```bash
git add scripts/ai-visibility/run.mjs scripts/ai-visibility/run.test.mjs package.json docs/seo/ai-visibility
git commit -m "Run the AI-visibility measurement and write the report (MI-70)"
```

---

### Task 7: Schedule it and document the monthly ritual

**Files:**
- Create: `.github/workflows/ai-visibility.yml`
- Create: `docs/seo/ai-visibility/README.md`
- Create: `docs/seo/ai-visibility/manual/TEMPLATE.json`

**Interfaces:**
- Consumes: the `changed` and `alert` step outputs written by `publishOutputs` in Task 6.
- Produces: nothing consumed by later tasks — this is the last one.

- [ ] **Step 1: Add the repository secret**

In GitHub → Settings → Secrets and variables → Actions, add `GEMINI_API_KEY`. `TELEGRAM_BOT_TOKEN` and `TELEGRAM_OPS_CHAT_ID` already exist for `site-health.yml`.

- [ ] **Step 2: Write the workflow**

Create `.github/workflows/ai-visibility.yml`:

```yaml
name: AI visibility

# Measures whether AI engines cite mi-code.pl, weekly. The site has been built
# to be citable — llms.txt, an AI-friendly robots.txt, a trilingual prerender —
# and none of that came with a way to tell whether it works. This is that way.
#
# Gemini is the only engine with a free grounded API: Perplexity and OpenAI both
# charge for web search. So this is a trend line for one engine, not a share of
# all AI answers, and the monthly manual pass in docs/seo/ai-visibility/README.md
# is what keeps it honest.

on:
  schedule:
    - cron: '41 5 * * 1'      # Mondays, 05:41 UTC
  workflow_dispatch:

permissions:
  contents: write             # the job commits the run back to development

jobs:
  measure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: development

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      # No npm ci on purpose: the script uses only Node built-ins, so the job
      # needs no install step and cannot be broken by a dependency.
      - name: Measure
        id: measure
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: npm run ai-visibility

      - name: Commit the run
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add docs/seo/ai-visibility
          if git diff --cached --quiet; then
            echo "nothing to commit"
            exit 0
          fi
          # [skip ci] is load-bearing: deploy.yml fires on every push to
          # development with no path filter, so without it a docs-only commit
          # would trigger a full rebuild, a stats refetch and a redeploy.
          git commit -m "Record the weekly AI-visibility run [skip ci]"
          git push

      - name: Tell the ops channel
        if: ${{ failure() || steps.measure.outputs.changed == 'true' }}
        env:
          TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          CHAT: ${{ secrets.TELEGRAM_OPS_CHAT_ID }}
          ALERT: ${{ steps.measure.outputs.alert }}
        run: |
          if [ -z "$TOKEN" ] || [ -z "$CHAT" ]; then
            echo "::warning::TELEGRAM_BOT_TOKEN or TELEGRAM_OPS_CHAT_ID not set — no alert sent"
            exit 0
          fi
          run_url="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
          if [ -n "$ALERT" ]; then
            text=$(printf '📊 %s\n\nRun: %s' "$ALERT" "$run_url")
          else
            text=$(printf '🔴 AI-visibility run failed\n\nRun: %s' "$run_url")
          fi
          curl -sS --max-time 30 \
            "https://api.telegram.org/bot${TOKEN}/sendMessage" \
            --data-urlencode "chat_id=${CHAT}" \
            --data-urlencode "text=${text}" \
            --data-urlencode "disable_web_page_preview=true" \
            -o /dev/null -w 'telegram: HTTP %{http_code}\n'
```

- [ ] **Step 3: Add the manual snapshot template**

Create `docs/seo/ai-visibility/manual/TEMPLATE.json`:

```json
{
  "month": "YYYY-MM",
  "source": "manual",
  "crawlers": {
    "GPTBot": 0,
    "ChatGPT-User": 0,
    "OAI-SearchBot": 0,
    "PerplexityBot": 0,
    "ClaudeBot": 0,
    "Google-Extended": 0,
    "CCBot": 0
  },
  "referrals": {
    "chatgpt.com": 0,
    "perplexity.ai": 0,
    "gemini.google.com": 0,
    "copilot.microsoft.com": 0
  },
  "engines": []
}
```

- [ ] **Step 4: Document the ritual**

Create `docs/seo/ai-visibility/README.md`:

```markdown
# AI visibility

Does anything out there cite mi-code.pl when it answers a question? `REPORT.md`
holds the current answer; `runs/` holds every weekly measurement.

## Automatic — weekly, no hands

`.github/workflows/ai-visibility.yml` runs `npm run ai-visibility` every Monday.
It asks Gemini the prompts in `prompts.json` with Google Search grounding, reads
the sources it cited back, and writes `runs/YYYY-MM-DD.json` plus a rebuilt
`REPORT.md`. Telegram only hears about it when the set of cited prompts changes.

Grounding is free on Gemini 2.5 Flash up to 500 requests a day, shared with
Flash-Lite. At 27 prompts × 2 repeats a week we use about a tenth of one day's
free allowance.

## Manual — monthly, about ten minutes

Gemini is not ChatGPT, and there is no free API for the engines that matter most.
Once a month, fill in `manual/YYYY-MM.json` from `manual/TEMPLATE.json`:

1. **Cloudflare → Analytics → AI Crawlers.** Copy the hit counts per bot into
   `crawlers`. Read them in two groups: `GPTBot`, `ClaudeBot`, `CCBot` and
   `Google-Extended` are training and indexing, while `ChatGPT-User`,
   `OAI-SearchBot` and `PerplexityBot` fetch a page *while answering someone* —
   those are the footprint of an actual citation.
2. **GA4 → Traffic acquisition.** Copy sessions from `chatgpt.com`,
   `perplexity.ai` and the rest into `referrals`. Analytics only loads after a
   visitor accepts cookies, so this is a floor, never a total.
3. **The engines themselves.** Run the same prompts through a logged-in ChatGPT
   and Perplexity and record `{ engine, id, status }` rows in `engines`. Claude
   can drive this through the browser — ask it to run the monthly AI-visibility
   pass.

The next weekly run picks the file up and folds it into `REPORT.md`.

## Changing the prompts

Edit `prompts.json`. A new product or article usually deserves one category
prompt phrased the way a customer who has never heard of us would ask it.
`scripts/ai-visibility/prompts.test.mjs` guards the shape; run `npm run test:run`
after editing.

Keep the brand prompts. They are the canary: if even "what does MiCode do" stops
finding us, indexing broke, and no amount of content will fix that.
```

- [ ] **Step 5: Check the workflow parses**

```bash
node -e "const {readFileSync}=require('fs');const s=readFileSync('.github/workflows/ai-visibility.yml','utf8');
if(!s.includes('[skip ci]'))throw new Error('the bot commit must carry [skip ci]');
console.log('ok, and the skip-ci guard is present')"
```

Expected: `ok, and the skip-ci guard is present`.

- [ ] **Step 6: Trigger it once by hand**

Push the branch, then run the workflow from the Actions tab via **Run workflow**. Confirm: the job is green, a commit landed on `development` whose message ends in `[skip ci]`, and — importantly — that **no Deploy run was triggered by it**. If a deploy did fire, the `[skip ci]` marker is not doing its job and nothing else in this task should be considered done.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/ai-visibility.yml docs/seo/ai-visibility/README.md docs/seo/ai-visibility/manual/TEMPLATE.json
git commit -m "Schedule the weekly AI-visibility run and document the monthly pass (MI-70)"
```

- [ ] **Step 8: Close out the issue**

Push `development`, then update https://github.com/micode-ai/home/issues/75 with a `## Verification` section: the test counts, the real end-to-end run output from Task 6 Step 7, and the confirmation from Step 6 that the bot commit did not trigger a deploy.

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Metric: cited / mentioned / absent, best of two repeats | 4 |
| `prompts.json`, 27 prompts, brand controls | 2 |
| `scripts/ai-visibility.mjs` — API call, extraction, classification | 3, 4, 6 |
| Both response shapes + host resolution | 1, 3 |
| `runs/YYYY-MM-DD.json` format | 5, 6 |
| `manual/YYYY-MM.json` format | 7 |
| Weekly workflow, `[skip ci]`, alert only on change | 7 |
| Error handling table (retry, abort, unknown host, no grounding, no previous run) | 3, 5, 6 |
| Tests for `extractCitations` / `classify` / `resolveHost` / `summarize` / `diffRuns` / `renderReport` | 3, 4, 5 |
| "What this does not measure" in `REPORT.md` | 5 |
| Free-tier budget | 2 (asserted in a test), 7 (documented) |

No spec requirement is unimplemented.

**Placeholder scan:** the only angle-bracket values are in Task 1 Step 5, where they are the three facts the probe exists to discover; that step states plainly that leaving them literal is a bug. `DEFAULT_MODE` in Task 6 is likewise pinned by Task 1's recorded finding.

**Type consistency:** `{ url, title, domain }` from `extractCitations` is what `resolveHost` accepts. `{ id, lang, kind, status }` from `measure` is what `summarize` and `diffRuns` read. `{ gained, lost, changed, baseline }` from `diffRuns` is what `renderAlert` and the workflow's `changed` output consume. `bestStatus` takes the array of strings that `measure` builds from `attempts`.
