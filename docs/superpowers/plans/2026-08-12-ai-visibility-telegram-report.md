# Telegram Report With Data-Derived Advice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the terse Telegram alert into a per-sweep report that ends in concrete advice derived from the measurement itself.

**Architecture:** A new pure module `scripts/ai-visibility/advice.mjs` holds six rules, each firing only on a condition present in the run object. `report.mjs` gains `renderTelegramReport`, replacing `renderAlert`. `run.mjs` publishes the message on every closed sweep rather than only when the cited set moved.

**Tech Stack:** Node 20 built-ins only. Vitest.

**Spec:** `docs/superpowers/specs/2026-08-12-ai-visibility-telegram-report-design.md`
**Issue:** MI-70 — https://github.com/micode-ai/home/issues/75

## Global Constraints

- **No new npm dependencies.** `package.json` must not change.
- Node 20, ESM (`.mjs`), matching the existing modules.
- `advice.mjs` and `report.mjs` stay **pure**: no clock, no `process.env`, no filesystem, no network. Everything arrives as an argument.
- **Advice may only state what the run object contains.** A rule that guesses, extrapolates, or hard-codes a recommendation is wrong by construction — the whole point is that every line traces back to a measured number.
- Telegram caps a message at **4096 characters**. Only the advice tail may be dropped; the header and numbers are never truncated.
- Do not touch `analyze.mjs`, `scripts/ai-visibility/fixtures/`, or `docs/seo/ai-visibility/prompts.json`.
- Commit after every task.

### Spec correction, applied here

The spec names the entry point `buildAdvice(run, previous)`. No rule needs the
previous run — every one of the six reads only the current sweep — while all of
them need to know which domain is primary, which lives in `prompts.json` and not
in the run object. The signature is therefore **`buildAdvice(run, domain)`**.
Carrying an unused parameter would be the kind of thing a reviewer rightly
flags.

---

### Task 1: The advice rules

**Files:**
- Create: `scripts/ai-visibility/advice.mjs`
- Test: `scripts/ai-visibility/advice.test.mjs`

**Interfaces:**
- Consumes: run objects shaped `{ date, sweep, calls, results, summary }`, where each result is `{ id, lang, kind, target, status, attempts }` and each attempt is `{ status, citedUrls, citedDomains, sourceDomains }`.
- Produces:
  - `buildAdvice(run, domain) -> Array<{ rule: string, priority: number, text: string }>`, at most 5 entries, sorted by ascending priority
  - `rivalCounts(run) -> Record<string, number>` — how many prompts each foreign domain was cited for among prompts where we were not cited

- [ ] **Step 1: Write the failing test**

Create `scripts/ai-visibility/advice.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import { buildAdvice, rivalCounts } from './advice.mjs';

const DOMAIN = 'mi-code.pl';

// A result builder, so each test states only what it is about.
const result = (id, over = {}) => ({
  id,
  lang: over.lang ?? 'pl',
  kind: over.kind ?? 'category',
  target: over.target ?? null,
  status: over.status ?? 'absent',
  attempts: over.attempts ?? [
    { status: over.status ?? 'absent', citedUrls: [], citedDomains: over.citedDomains ?? [], sourceDomains: over.sourceDomains ?? [] },
  ],
});

const run = (results) => ({ date: '2026-08-14', sweep: 1, calls: 2, results, summary: {} });

const rules = (advice) => advice.map((a) => a.rule);

describe('rivalCounts', () => {
  it('counts a foreign domain once per prompt where we were not cited', () => {
    const counts = rivalCounts(run([
      result('a', { sourceDomains: ['cognity.pl', 'cognity.pl'] }),
      result('b', { sourceDomains: ['cognity.pl'] }),
    ]));
    expect(counts['cognity.pl']).toBe(2);
  });

  it('ignores prompts where we were cited', () => {
    const counts = rivalCounts(run([
      result('a', { status: 'cited', citedDomains: [DOMAIN], sourceDomains: ['cognity.pl'] }),
    ]));
    expect(counts['cognity.pl']).toBeUndefined();
  });
});

describe('rule: brand canary', () => {
  it('fires when a brand prompt does not cite us', () => {
    const advice = buildAdvice(run([result('pl-brand', { kind: 'brand' })]), DOMAIN);
    expect(rules(advice)).toContain('brand-canary');
    expect(advice.find((a) => a.rule === 'brand-canary').text).toContain('pl-brand');
  });

  it('stays silent when every brand prompt cites us', () => {
    const advice = buildAdvice(
      run([result('pl-brand', { kind: 'brand', status: 'cited', citedDomains: [DOMAIN] })]),
      DOMAIN,
    );
    expect(rules(advice)).not.toContain('brand-canary');
  });
});

describe('rule: page exists but is not cited', () => {
  it('names the page and who was cited instead', () => {
    const advice = buildAdvice(run([
      result('pl-koszt', { target: '/blog/koszt/', sourceDomains: ['cognity.pl', 'aioa.pl'] }),
    ]), DOMAIN);
    const text = advice.find((a) => a.rule === 'page-not-cited').text;
    expect(text).toContain('/blog/koszt/');
    expect(text).toContain('cognity.pl');
  });

  it('stays silent for a prompt with no target page', () => {
    const advice = buildAdvice(run([result('pl-x', { target: null })]), DOMAIN);
    expect(rules(advice)).not.toContain('page-not-cited');
  });

  it('reports at most two pages, so one rule cannot fill the message', () => {
    const advice = buildAdvice(run([
      result('a', { target: '/a/' }), result('b', { target: '/b/' }),
      result('c', { target: '/c/' }), result('d', { target: '/d/' }),
    ]), DOMAIN);
    expect(rules(advice).filter((r) => r === 'page-not-cited')).toHaveLength(2);
  });
});

describe('rule: portfolio skew', () => {
  it('fires when product sites are cited more often than the primary domain', () => {
    const advice = buildAdvice(run([
      result('a', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
      result('b', { status: 'cited', citedDomains: ['ai-budget.pl'] }),
      result('c', { status: 'cited', citedDomains: [DOMAIN] }),
    ]), DOMAIN);
    const text = advice.find((a) => a.rule === 'portfolio-skew').text;
    expect(text).toContain('eksiegowyai.pl');
    expect(text).toContain(DOMAIN);
  });

  it('stays silent when the primary domain leads', () => {
    const advice = buildAdvice(run([
      result('a', { status: 'cited', citedDomains: [DOMAIN] }),
      result('b', { status: 'cited', citedDomains: [DOMAIN] }),
      result('c', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('portfolio-skew');
  });

  it('treats a subdomain of the primary domain as primary', () => {
    const advice = buildAdvice(run([
      result('a', { status: 'cited', citedDomains: ['blog.mi-code.pl'] }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('portfolio-skew');
  });
});

describe('rule: dead language', () => {
  it('names a language with no citations at all', () => {
    const advice = buildAdvice(run([
      result('ru-1', { lang: 'ru' }),
      result('pl-1', { status: 'cited', citedDomains: [DOMAIN] }),
    ]), DOMAIN);
    const text = advice.find((a) => a.rule === 'dead-language').text;
    expect(text).toContain('ru');
    expect(text).not.toContain('pl:');
  });
});

describe('rule: volatile', () => {
  it('fires when one repeat cited us and another did not', () => {
    const advice = buildAdvice(run([
      result('pl-flap', {
        status: 'cited',
        attempts: [
          { status: 'absent', citedUrls: [], citedDomains: [], sourceDomains: [] },
          { status: 'cited', citedUrls: [], citedDomains: [DOMAIN], sourceDomains: [] },
        ],
      }),
    ]), DOMAIN);
    expect(advice.find((a) => a.rule === 'volatile').text).toContain('pl-flap');
  });

  it('stays silent when both repeats agree', () => {
    const advice = buildAdvice(run([
      result('pl-solid', {
        status: 'cited',
        attempts: [
          { status: 'cited', citedUrls: [], citedDomains: [DOMAIN], sourceDomains: [] },
          { status: 'cited', citedUrls: [], citedDomains: [DOMAIN], sourceDomains: [] },
        ],
      }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('volatile');
  });
});

describe('rule: persistent rival', () => {
  it('fires on a domain cited across three prompts where we are absent', () => {
    const advice = buildAdvice(run([
      result('a', { sourceDomains: ['cognity.pl'] }),
      result('b', { sourceDomains: ['cognity.pl'] }),
      result('c', { sourceDomains: ['cognity.pl'] }),
    ]), DOMAIN);
    expect(advice.find((a) => a.rule === 'persistent-rival').text).toContain('cognity.pl');
  });

  it('stays silent below the threshold', () => {
    const advice = buildAdvice(run([
      result('a', { sourceDomains: ['cognity.pl'] }),
      result('b', { sourceDomains: ['cognity.pl'] }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('persistent-rival');
  });

  it('never reports an unresolved host as a rival', () => {
    const advice = buildAdvice(run([
      result('a', { sourceDomains: ['unknown'] }),
      result('b', { sourceDomains: ['unknown'] }),
      result('c', { sourceDomains: ['unknown'] }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('persistent-rival');
  });
});

describe('buildAdvice', () => {
  it('keeps the five highest-priority items when more rules fire', () => {
    const results = [
      result('pl-brand', { kind: 'brand' }),
      result('a', { target: '/a/', sourceDomains: ['cognity.pl'] }),
      result('b', { target: '/b/', sourceDomains: ['cognity.pl'] }),
      result('c', { sourceDomains: ['cognity.pl'] }),
      result('ru-1', { lang: 'ru' }),
      result('en-1', { lang: 'en' }),
    ];
    const advice = buildAdvice(run(results), DOMAIN);
    expect(advice).toHaveLength(5);
    expect(advice[0].rule).toBe('brand-canary');
    // Sorted by priority, so the lowest-priority rule that fired is dropped.
    expect(rules(advice)).not.toContain('persistent-rival');
  });

  it('returns nothing for a run with no results rather than throwing', () => {
    expect(buildAdvice(run([]), DOMAIN)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run scripts/ai-visibility/advice.test.mjs`
Expected: FAIL — `Failed to resolve import "./advice.mjs"`.

- [ ] **Step 3: Write the implementation**

Create `scripts/ai-visibility/advice.mjs`:

```js
// Advice derived only from what a sweep measured. No clock, no network, no
// model: every line this file produces can be traced back to a number in the
// run object it was handed. That is the whole point — a suggestion nobody can
// check is worse than no suggestion.

const MAX_ADVICE = 5;
const MAX_PAGES = 2;
const RIVAL_THRESHOLD = 3;

const bare = (value) => String(value).replace(/^www\./, '').toLowerCase();
const citedOnes = (run) => (run.results ?? []).filter((item) => item.status === 'cited');

const domainsOf = (result, field) =>
  [...new Set((result.attempts ?? []).flatMap((attempt) => attempt[field] ?? []))];

export function rivalCounts(run) {
  const counts = {};
  for (const item of run.results ?? []) {
    if (item.status === 'cited') continue;
    // Once per prompt, not once per mention: a page cited twice in one answer
    // is one competitor, not two.
    for (const domain of domainsOf(item, 'sourceDomains')) {
      counts[domain] = (counts[domain] ?? 0) + 1;
    }
  }
  return counts;
}

function brandCanary(run) {
  const missing = (run.results ?? []).filter(
    (item) => item.kind === 'brand' && item.status !== 'cited',
  );
  if (!missing.length) return [];
  return [{
    rule: 'brand-canary',
    priority: 1,
    text: `Бренд не находит нас: ${missing.map((item) => item.id).join(', ')} — это индексация, а не маркетинг`,
  }];
}

function pageNotCited(run) {
  const out = [];
  for (const item of run.results ?? []) {
    if (out.length >= MAX_PAGES) break;
    if (item.kind !== 'category' || item.status === 'cited' || !item.target) continue;
    const rivals = domainsOf(item, 'sourceDomains').filter((d) => d !== 'unknown').slice(0, 2);
    out.push({
      rule: 'page-not-cited',
      priority: 2,
      text: rivals.length
        ? `${item.id}: страница под запрос есть (${item.target}), но цитируют ${rivals.join(', ')}`
        : `${item.id}: страница под запрос есть (${item.target}), но её не цитируют`,
    });
  }
  return out;
}

function portfolioSkew(run, domain) {
  const target = bare(domain);
  const isPrimary = (host) => host === target || host.endsWith(`.${target}`);
  const others = new Set();
  let primary = 0;
  let secondary = 0;

  for (const item of citedOnes(run)) {
    const domains = domainsOf(item, 'citedDomains').map(bare);
    if (domains.some(isPrimary)) {
      primary += 1;
      continue;
    }
    secondary += 1;
    for (const host of domains) others.add(host);
  }

  if (secondary <= primary || !others.size) return [];
  return [{
    rule: 'portfolio-skew',
    priority: 3,
    text: `Находят через ${[...others].sort().join(', ')}, а не через ${domain} (${secondary} против ${primary})`,
  }];
}

function deadLanguage(run) {
  const byLang = {};
  for (const item of run.results ?? []) {
    const bucket = (byLang[item.lang] ??= { total: 0, cited: 0 });
    bucket.total += 1;
    if (item.status === 'cited') bucket.cited += 1;
  }
  return Object.entries(byLang)
    .filter(([, bucket]) => bucket.cited === 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([lang, bucket]) => ({
      rule: 'dead-language',
      priority: 4,
      text: `${lang}: 0 из ${bucket.total} — ни один запрос на этом языке нас не находит`,
    }));
}

function volatile(run) {
  const flapping = (run.results ?? []).filter((item) => {
    const statuses = new Set((item.attempts ?? []).map((attempt) => attempt.status));
    return statuses.has('cited') && statuses.size > 1;
  });
  if (!flapping.length) return [];
  return [{
    rule: 'volatile',
    priority: 5,
    text: `На грани, повторы расходятся: ${flapping.map((item) => item.id).join(', ')} — запрос почти берётся`,
  }];
}

function persistentRival(run) {
  const strong = Object.entries(rivalCounts(run))
    .filter(([domain, count]) => domain !== 'unknown' && count >= RIVAL_THRESHOLD)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (!strong.length) return [];
  const [domain, count] = strong[0];
  return [{
    rule: 'persistent-rival',
    priority: 6,
    text: `${domain} цитируют в ${count} запросах, где нас нет — постоянный конкурент`,
  }];
}

export function buildAdvice(run, domain) {
  return [
    ...brandCanary(run),
    ...pageNotCited(run),
    ...portfolioSkew(run, domain),
    ...deadLanguage(run),
    ...volatile(run),
    ...persistentRival(run),
  ]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_ADVICE);
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run scripts/ai-visibility/advice.test.mjs`
Expected: PASS, 18 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/ai-visibility/advice.mjs scripts/ai-visibility/advice.test.mjs
git commit -m "Derive AI-visibility advice from the measurement (MI-70)"
```

---

### Task 2: The Telegram report

**Files:**
- Modify: `scripts/ai-visibility/report.mjs`
- Modify: `scripts/ai-visibility/report.test.mjs`

**Interfaces:**
- Consumes: `buildAdvice`, `rivalCounts` from Task 1; the existing `diffRuns` and `percent` in `report.mjs`.
- Produces: `renderTelegramReport(run, previous, advice) -> string`. **`renderAlert` is removed** — `run.mjs` is its only caller and Task 3 updates it.

- [ ] **Step 1: Write the failing test**

Append to `scripts/ai-visibility/report.test.mjs` (add `renderTelegramReport` to the existing import from `./report.mjs`):

```js
const sweep = (over = {}) => ({
  date: '2026-08-14',
  sweep: over.sweep ?? 3,
  calls: over.calls ?? 54,
  results: over.results ?? [
    { id: 'pl-a', lang: 'pl', kind: 'category', status: 'cited', target: '/', attempts: [] },
    { id: 'en-b', lang: 'en', kind: 'brand', status: 'absent', target: '/', attempts: [] },
  ],
  summary: over.summary ?? {
    byLang: { pl: { cited: 1, mentioned: 0, absent: 0 }, en: { cited: 0, mentioned: 0, absent: 1 } },
    byKind: { category: { cited: 1, mentioned: 0, absent: 0 }, brand: { cited: 0, mentioned: 0, absent: 1 } },
    citedShare: 0.5,
  },
});

describe('renderTelegramReport', () => {
  it('leads with the sweep, the date and the call count', () => {
    const text = renderTelegramReport(sweep(), null, []);
    expect(text).toContain('Свип 3');
    expect(text).toContain('2026-08-14');
    expect(text).toContain('54');
  });

  it('reports the cited count and share', () => {
    const text = renderTelegramReport(sweep(), null, []);
    expect(text).toContain('1 из 2');
    expect(text).toContain('50.0%');
  });

  it('breaks the numbers down by language and by kind', () => {
    const text = renderTelegramReport(sweep(), null, []);
    expect(text).toContain('pl 1/1');
    expect(text).toContain('en 0/1');
    expect(text).toContain('Бренд 0/1');
    expect(text).toContain('Категория 1/1');
  });

  it('omits the comparison and the movement block on a first sweep', () => {
    const text = renderTelegramReport(sweep(), null, []);
    expect(text).not.toContain('было');
    expect(text).not.toContain('Появились');
  });

  it('shows what moved once there is a previous sweep', () => {
    const previous = sweep({
      results: [
        { id: 'pl-a', lang: 'pl', kind: 'category', status: 'absent', target: '/', attempts: [] },
        { id: 'en-b', lang: 'en', kind: 'brand', status: 'absent', target: '/', attempts: [] },
      ],
      summary: { byLang: {}, byKind: {}, citedShare: 0 },
    });
    const text = renderTelegramReport(sweep(), previous, []);
    expect(text).toContain('было 0 из 2');
    expect(text).toContain('Появились: pl-a');
    expect(text).toContain('Пропали: —');
  });

  it('prints the advice under a heading', () => {
    const text = renderTelegramReport(sweep(), null, [
      { rule: 'dead-language', priority: 4, text: 'ru: 0 из 4' },
    ]);
    expect(text).toContain('Что делать:');
    expect(text).toContain('• ru: 0 из 4');
  });

  it('omits the advice block entirely when no rule fired', () => {
    expect(renderTelegramReport(sweep(), null, [])).not.toContain('Что делать');
  });

  it('stays within the Telegram limit and keeps the header when advice is long', () => {
    const advice = Array.from({ length: 5 }, (_, index) => ({
      rule: 'page-not-cited', priority: 2, text: `${index} ${'x'.repeat(1500)}`,
    }));
    const text = renderTelegramReport(sweep(), null, advice);
    expect(text.length).toBeLessThanOrEqual(4096);
    expect(text).toContain('Свип 3');
    expect(text).toContain('1 из 2');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run scripts/ai-visibility/report.test.mjs`
Expected: FAIL — `renderTelegramReport is not a function`.

- [ ] **Step 3: Write the implementation**

In `scripts/ai-visibility/report.mjs`, add the import at the top:

```js
import { rivalCounts } from './advice.mjs';
```

Delete `renderAlert` entirely and add:

```js
const TELEGRAM_LIMIT = 4096;

const bucketTotal = (bucket) => bucket.cited + bucket.mentioned + bucket.absent;

export function renderTelegramReport(run, previous, advice) {
  const results = run.results ?? [];
  const cited = results.filter((item) => item.status === 'cited').length;
  const lines = [];

  lines.push('📊 AI-видимость mi-code.pl');
  lines.push(`Свип ${run.sweep ?? '?'} · ${run.date} · ${run.calls} вызовов`);
  lines.push('');

  const head = `Процитированы: ${cited} из ${results.length} (${percent(run.summary.citedShare)})`;
  if (previous) {
    const before = (previous.results ?? []).filter((item) => item.status === 'cited').length;
    lines.push(`${head} — было ${before} из ${(previous.results ?? []).length} (${percent(previous.summary.citedShare)})`);
  } else {
    lines.push(head);
  }

  const langs = Object.entries(run.summary.byLang ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([lang, bucket]) => `${lang} ${bucket.cited}/${bucketTotal(bucket)}`);
  if (langs.length) lines.push(`По языкам: ${langs.join(' · ')}`);

  const kinds = run.summary.byKind ?? {};
  const kindParts = [];
  if (kinds.brand) kindParts.push(`Бренд ${kinds.brand.cited}/${bucketTotal(kinds.brand)}`);
  if (kinds.category) kindParts.push(`Категория ${kinds.category.cited}/${bucketTotal(kinds.category)}`);
  if (kindParts.length) lines.push(kindParts.join(' · '));

  const diff = diffRuns(previous, run);
  if (!diff.baseline) {
    lines.push('');
    lines.push(`Появились: ${diff.gained.length ? diff.gained.join(', ') : '—'}`);
    lines.push(`Пропали: ${diff.lost.length ? diff.lost.join(', ') : '—'}`);
  }

  const rivals = Object.entries(rivalCounts(run))
    .filter(([domain]) => domain !== 'unknown')
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([domain, count]) => `${domain} (${count})`);
  if (rivals.length) {
    lines.push('');
    lines.push(`Цитируют вместо нас: ${rivals.join(' · ')}`);
  }

  // The header is never sacrificed: advice lines are appended one at a time and
  // the first one that would breach the limit ends the list.
  const header = lines.join('\n');
  if (!advice.length) return header;

  const opened = `${header}\n\nЧто делать:`;
  let text = opened;
  for (const item of advice) {
    const next = `${text}\n• ${item.text}`;
    if (next.length > TELEGRAM_LIMIT) break;
    text = next;
  }
  return text === opened ? header : text;
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run scripts/ai-visibility/report.test.mjs`
Expected: PASS, 25 tests (17 existing plus 8 new).

- [ ] **Step 5: Commit**

```bash
git add scripts/ai-visibility/report.mjs scripts/ai-visibility/report.test.mjs
git commit -m "Render the AI-visibility sweep as a readable Telegram report (MI-70)"
```

---

### Task 3: Send it on every closed sweep

**Files:**
- Modify: `scripts/ai-visibility/run.mjs`
- Modify: `scripts/ai-visibility/run.test.mjs`
- Modify: `.github/workflows/ai-visibility.yml`

**Interfaces:**
- Consumes: `buildAdvice` from Task 1, `renderTelegramReport` from Task 2.
- Produces: the workflow step output `alert`, now written on every closed sweep.

- [ ] **Step 1: Write the failing test**

Append to the `main` describe block in `scripts/ai-visibility/run.test.mjs`, following the pattern the existing `main` tests already use for driving `main({ dir, deps })` against a scratch directory:

```js
  it('publishes an alert body on every closed sweep, not only when the cited set moved', async () => {
    // The previous behaviour only spoke up on a change, which at the observed
    // hit rate meant months of silence.
    const outputPath = join(dir, 'gh-output.txt');
    process.env.GITHUB_OUTPUT = outputPath;
    try {
      await runClosingSweep();   // helper already used by the sweep-closure tests
      const written = readFileSync(outputPath, 'utf8');
      expect(written).toContain('changed=false');
      expect(written).toContain('alert<<ALERT_EOF');
      expect(written).toContain('AI-видимость');
    } finally {
      delete process.env.GITHUB_OUTPUT;
    }
  });
```

If no such helper exists in the file, drive `main` exactly as the existing
sweep-closure test does and assert the same three strings on the file it writes.

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run scripts/ai-visibility/run.test.mjs`
Expected: FAIL — the output file contains `changed=false` but no `alert<<ALERT_EOF`, because the alert is currently gated on `diff.changed`.

- [ ] **Step 3: Write the implementation**

In `scripts/ai-visibility/run.mjs`, extend the import from `./report.mjs` to bring in `renderTelegramReport` instead of `renderAlert`, and add the advice import:

```js
import { diffRuns, renderReport, renderTelegramReport } from './report.mjs';
import { buildAdvice } from './advice.mjs';
```

Replace `publishOutputs` with:

```js
function publishOutputs(diff, alertText) {
  if (!process.env.GITHUB_OUTPUT) return;
  // Written on every closed sweep. The workflow tells a failure from a result
  // by the job status, never by whether this string is empty.
  const lines = [
    `changed=${diff.changed}`,
    `alert<<ALERT_EOF\n${alertText}\nALERT_EOF`,
  ];
  writeFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`, { flag: 'a' });
}
```

And at the sweep-closure call site, replace the `renderAlert(diff, run)` argument:

```js
  const advice = buildAdvice(run, config.domain);
  publishOutputs(diff, renderTelegramReport(run, previous, advice));
```

- [ ] **Step 4: Update the workflow condition**

In `.github/workflows/ai-visibility.yml`, change the alert step's condition from
`if: ${{ failure() || steps.measure.outputs.changed == 'true' }}` to:

```yaml
        if: ${{ failure() || steps.measure.outputs.alert != '' }}
```

Leave the step body alone. The `FAILED: ${{ job.status == 'failure' }}` env var and the `if [ "$FAILED" = "true" ]` branch stay exactly as they are — that is what keeps a failed job from being reported as a result, and it must not regress.

- [ ] **Step 5: Run the whole suite**

Run: `npm run test:run`
Expected: PASS. Confirm no test still references `renderAlert`; the export is gone.

- [ ] **Step 6: Preview the real message**

```bash
node -e "
const { readFileSync } = require('fs');
import('./scripts/ai-visibility/report.mjs').then(async (report) => {
  const advice = await import('./scripts/ai-visibility/advice.mjs');
  const partial = JSON.parse(readFileSync('docs/seo/ai-visibility/partial.json','utf8'));
  const run = await import('./scripts/ai-visibility/run.mjs');
  const results = run.foldAttempts(partial.attempts);
  const analyze = await import('./scripts/ai-visibility/analyze.mjs');
  const fake = { date: '2026-08-12', sweep: partial.sweep, calls: partial.calls, results, summary: analyze.summarize(results) };
  console.log(report.renderTelegramReport(fake, null, advice.buildAdvice(fake, 'mi-code.pl')));
});
"
```

This renders the message from the 18 real attempts already measured. Read it as a recipient would: if a line is not understandable without opening the repo, say so in the report rather than shipping it.

- [ ] **Step 7: Commit**

```bash
git add scripts/ai-visibility/run.mjs scripts/ai-visibility/run.test.mjs .github/workflows/ai-visibility.yml
git commit -m "Send the AI-visibility report on every closed sweep (MI-70)"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Advice from rules over measured data | 1 |
| Six rules with stated priorities and thresholds | 1 |
| Cap of five advice items, sorted by priority | 1 |
| Header line of rival domains, distinct from rule 6 | 2 |
| Message format, first-sweep variant | 2 |
| Telegram 4096 limit, tail-only truncation | 2 |
| Message on every closed sweep, plus failures | 3 |
| Workflow condition keyed on the alert body, failure on job status | 3 |
| `changed` retained as an output | 3 |

**Placeholder scan:** none. Task 3 Step 1 references an existing test helper by
description rather than by name because the `main` tests were written by another
implementer; the step states exactly what to do if it is absent, and the
assertions are given in full either way.

**Type consistency:** `buildAdvice(run, domain)` returns `{rule, priority, text}`
objects, which is what Task 2 iterates and what Task 3 passes through.
`rivalCounts(run)` returns a domain→count map, consumed by both the rule in
Task 1 and the header line in Task 2. `renderTelegramReport(run, previous, advice)`
matches the call site in Task 3.
