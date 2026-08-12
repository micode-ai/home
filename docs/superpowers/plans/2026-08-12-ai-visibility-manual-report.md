# Manual Browser-Pass Report — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send the same Telegram report and advice from a hand-driven browser pass over ChatGPT and Perplexity, with no Gemini and no API key.

**Architecture:** A new `scripts/ai-visibility/manual.mjs` adapts the monthly manual file into the run shape the existing rules already consume, one run per engine. `buildAdvice` is reused unchanged; `report.mjs` gains a two-engine renderer. A `workflow_dispatch`-only workflow reads the committed file and sends the message, keeping the bot token inside GitHub.

**Tech Stack:** Node 20 built-ins only. Vitest. GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-12-ai-visibility-manual-report-design.md`
**Issue:** MI-70 — https://github.com/micode-ai/home/issues/75

## Global Constraints

- **No new npm dependencies.** `package.json` gains one script entry and nothing else.
- Node 20, ESM (`.mjs`). `manualToRuns` and everything in `report.mjs` stay pure — no clock, env, filesystem or network. Only `main()` does I/O.
- **The existing `docs/seo/ai-visibility/manual/2026-08.json` predates this design and has no `citedDomains` / `sourceDomains`.** An entry missing them must be read as empty lists, never throw. The first run would otherwise break on our own history.
- Telegram caps a message at 4096 characters; only the advice tail may be dropped.
- The Gemini path stays: do not delete `run.mjs`, its workflow, or its tests.
- Commit after every task.

### Spec correction, applied here

The spec gives `manualToRuns(manual, config) -> Array<{engine, run}>`, but also
requires a warning naming any entry whose `id` is unknown. A pure function
cannot log, so it returns **`{ runs, skipped }`** and `main()` does the warning.

---

### Task 1: Adapt the manual file into runs

**Files:**
- Create: `scripts/ai-visibility/manual.mjs`
- Test: `scripts/ai-visibility/manual.test.mjs`

**Interfaces:**
- Consumes: `summarize` from `./analyze.mjs`.
- Produces: `manualToRuns(manual, config) -> { runs: Array<{engine, run}>, skipped: string[] }`, where each `run` is `{ date, source, results, summary }` and each result is `{ id, lang, kind, target, status, attempts:[{status, citedUrls, citedDomains, sourceDomains}] }` — the same shape a closed Gemini sweep produces.

- [ ] **Step 1: Write the failing test**

Create `scripts/ai-visibility/manual.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import { manualToRuns } from './manual.mjs';

const config = {
  domain: 'mi-code.pl',
  prompts: [
    { id: 'pl-a', lang: 'pl', kind: 'category', target: '/a/', text: 'Pytanie A?' },
    { id: 'en-b', lang: 'en', kind: 'brand', target: '/', text: 'Question B?' },
  ],
};

const manual = (engines) => ({ month: '2026-08', source: 'manual', engines });

describe('manualToRuns', () => {
  it('builds one run per engine', () => {
    const { runs } = manualToRuns(manual([
      { engine: 'chatgpt', id: 'pl-a', status: 'absent', citedDomains: [], sourceDomains: ['rival.pl'] },
      { engine: 'perplexity', id: 'pl-a', status: 'cited', citedDomains: ['mi-code.pl'], sourceDomains: ['mi-code.pl'] },
    ]), config);
    expect(runs.map((r) => r.engine)).toEqual(['chatgpt', 'perplexity']);
  });

  it('sorts engines by name so the report is deterministic', () => {
    const { runs } = manualToRuns(manual([
      { engine: 'perplexity', id: 'pl-a', status: 'cited', citedDomains: ['mi-code.pl'], sourceDomains: [] },
      { engine: 'chatgpt', id: 'pl-a', status: 'absent', citedDomains: [], sourceDomains: [] },
    ]), config);
    expect(runs.map((r) => r.engine)).toEqual(['chatgpt', 'perplexity']);
  });

  it('pulls lang, kind and target from the prompt config', () => {
    const { runs } = manualToRuns(manual([
      { engine: 'chatgpt', id: 'en-b', status: 'mentioned', citedDomains: [], sourceDomains: [] },
    ]), config);
    expect(runs[0].run.results[0]).toMatchObject({
      id: 'en-b', lang: 'en', kind: 'brand', target: '/', status: 'mentioned',
    });
  });

  it('carries the domains into a single attempt', () => {
    const { runs } = manualToRuns(manual([
      { engine: 'chatgpt', id: 'pl-a', status: 'absent', citedDomains: [], sourceDomains: ['rival.pl', 'other.pl'] },
    ]), config);
    expect(runs[0].run.results[0].attempts).toEqual([
      { status: 'absent', citedUrls: [], citedDomains: [], sourceDomains: ['rival.pl', 'other.pl'] },
    ]);
  });

  it('reads an entry written before the domain fields existed as empty lists', () => {
    // docs/seo/ai-visibility/manual/2026-08.json is exactly this shape.
    const { runs } = manualToRuns(manual([
      { engine: 'chatgpt', id: 'pl-a', status: 'absent', note: 'recorded before the schema grew' },
    ]), config);
    expect(runs[0].run.results[0].attempts[0]).toMatchObject({ citedDomains: [], sourceDomains: [] });
  });

  it('skips an entry whose prompt id is unknown and names it', () => {
    const { runs, skipped } = manualToRuns(manual([
      { engine: 'chatgpt', id: 'pl-a', status: 'absent' },
      { engine: 'chatgpt', id: 'pl-ghost', status: 'absent' },
    ]), config);
    expect(skipped).toEqual(['pl-ghost']);
    expect(runs[0].run.results).toHaveLength(1);
  });

  it('summarises each run the same way a Gemini sweep is summarised', () => {
    const { runs } = manualToRuns(manual([
      { engine: 'chatgpt', id: 'pl-a', status: 'cited', citedDomains: ['mi-code.pl'], sourceDomains: [] },
      { engine: 'chatgpt', id: 'en-b', status: 'absent', citedDomains: [], sourceDomains: [] },
    ]), config);
    expect(runs[0].run.summary.citedShare).toBeCloseTo(0.5, 5);
    expect(runs[0].run.summary.byLang).toEqual({
      pl: { cited: 1, mentioned: 0, absent: 0 },
      en: { cited: 0, mentioned: 0, absent: 1 },
    });
  });

  it('carries the month through as the run date', () => {
    const { runs } = manualToRuns(manual([
      { engine: 'chatgpt', id: 'pl-a', status: 'absent' },
    ]), config);
    expect(runs[0].run.date).toBe('2026-08');
  });

  it('returns nothing for a file with no entries rather than throwing', () => {
    expect(manualToRuns(manual([]), config)).toEqual({ runs: [], skipped: [] });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run scripts/ai-visibility/manual.test.mjs`
Expected: FAIL — `Failed to resolve import "./manual.mjs"`.

- [ ] **Step 3: Write the pure adapter**

Create `scripts/ai-visibility/manual.mjs`:

```js
import { summarize } from './analyze.mjs';

// A browser pass over engines that have no free API. The point of this module is
// that it produces exactly the shape a closed Gemini sweep produces, so every
// rule in advice.mjs works on it unchanged.
export function manualToRuns(manual, config) {
  const byId = new Map((config.prompts ?? []).map((prompt) => [prompt.id, prompt]));
  const byEngine = new Map();
  const skipped = [];

  for (const entry of manual.engines ?? []) {
    const prompt = byId.get(entry.id);
    if (!prompt) {
      skipped.push(entry.id);
      continue;
    }
    if (!byEngine.has(entry.engine)) byEngine.set(entry.engine, []);
    byEngine.get(entry.engine).push({
      id: entry.id,
      lang: prompt.lang,
      kind: prompt.kind,
      target: prompt.target ?? null,
      status: entry.status,
      // Entries written before the schema grew these fields must read as empty,
      // not throw — our own August file is exactly that shape.
      attempts: [{
        status: entry.status,
        citedUrls: [],
        citedDomains: entry.citedDomains ?? [],
        sourceDomains: entry.sourceDomains ?? [],
      }],
    });
  }

  const runs = [...byEngine.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([engine, results]) => ({
      engine,
      run: { date: manual.month, source: 'manual', results, summary: summarize(results) },
    }));

  return { runs, skipped };
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run scripts/ai-visibility/manual.test.mjs`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/ai-visibility/manual.mjs scripts/ai-visibility/manual.test.mjs
git commit -m "Adapt the manual browser pass into the run shape (MI-70)"
```

---

### Task 2: Render the two-engine report

**Files:**
- Modify: `scripts/ai-visibility/report.mjs`
- Modify: `scripts/ai-visibility/report.test.mjs`

**Interfaces:**
- Consumes: the existing `rivalCounts` import and the existing `TELEGRAM_LIMIT` constant in `report.mjs`.
- Produces: `renderManualReport(month, perEngine) -> string`, where `perEngine` is `Array<{ engine: string, run, advice }>`.

- [ ] **Step 1: Write the failing test**

Append to `scripts/ai-visibility/report.test.mjs` (add `renderManualReport` to the existing import from `./report.mjs`):

```js
const engineRun = (statuses, sources = {}) => ({
  date: '2026-08',
  source: 'manual',
  results: Object.entries(statuses).map(([id, status]) => ({
    id, lang: 'pl', kind: 'category', status, target: '/',
    attempts: [{ status, citedUrls: [], citedDomains: [], sourceDomains: sources[id] ?? [] }],
  })),
  summary: { byLang: {}, byKind: {}, citedShare: 0 },
});

describe('renderManualReport', () => {
  it('names the month and the engines it covers', () => {
    const text = renderManualReport('2026-08', [
      { engine: 'chatgpt', run: engineRun({ a: 'absent' }), advice: [] },
      { engine: 'perplexity', run: engineRun({ a: 'cited' }), advice: [] },
    ]);
    expect(text).toContain('2026-08');
    expect(text).toContain('ChatGPT');
    expect(text).toContain('Perplexity');
  });

  it('gives each engine its own count', () => {
    const text = renderManualReport('2026-08', [
      { engine: 'chatgpt', run: engineRun({ a: 'absent', b: 'absent', c: 'mentioned' }), advice: [] },
      { engine: 'perplexity', run: engineRun({ a: 'cited' }), advice: [] },
    ]);
    expect(text).toContain('ChatGPT: 0 из 3');
    expect(text).toContain('Perplexity: 1 из 1');
  });

  it('tags each advice line with its engine when more than one was measured', () => {
    const text = renderManualReport('2026-08', [
      { engine: 'chatgpt', run: engineRun({ a: 'absent' }), advice: [{ rule: 'x', priority: 1, text: 'первое' }] },
      { engine: 'perplexity', run: engineRun({ a: 'cited' }), advice: [{ rule: 'y', priority: 1, text: 'второе' }] },
    ]);
    expect(text).toContain('• ChatGPT · первое');
    expect(text).toContain('• Perplexity · второе');
  });

  it('leaves the tag off when only one engine was measured', () => {
    const text = renderManualReport('2026-08', [
      { engine: 'chatgpt', run: engineRun({ a: 'absent' }), advice: [{ rule: 'x', priority: 1, text: 'первое' }] },
    ]);
    expect(text).toContain('• первое');
    expect(text).not.toContain('ChatGPT · первое');
  });

  it('counts rivals across every engine at once', () => {
    const text = renderManualReport('2026-08', [
      { engine: 'chatgpt', run: engineRun({ a: 'absent' }, { a: ['cognity.pl'] }), advice: [] },
      { engine: 'perplexity', run: engineRun({ b: 'absent' }, { b: ['cognity.pl'] }), advice: [] },
    ]);
    expect(text).toContain('cognity.pl (2)');
  });

  it('omits the advice block entirely when no rule fired anywhere', () => {
    const text = renderManualReport('2026-08', [
      { engine: 'chatgpt', run: engineRun({ a: 'absent' }), advice: [] },
    ]);
    expect(text).not.toContain('Что делать');
  });

  it('stays within the Telegram limit and keeps the header when advice is long', () => {
    const advice = Array.from({ length: 5 }, (_, index) => ({
      rule: 'x', priority: 1, text: `${index} ${'y'.repeat(1500)}`,
    }));
    const text = renderManualReport('2026-08', [
      { engine: 'chatgpt', run: engineRun({ a: 'absent' }), advice },
    ]);
    expect(text.length).toBeLessThanOrEqual(4096);
    expect(text).toContain('ChatGPT: 0 из 1');
    expect(text).toContain('0 yyy');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run scripts/ai-visibility/report.test.mjs`
Expected: FAIL — `renderManualReport is not a function`.

- [ ] **Step 3: Write the implementation**

Append to `scripts/ai-visibility/report.mjs`:

```js
const ENGINE_NAMES = { chatgpt: 'ChatGPT', perplexity: 'Perplexity', gemini: 'Gemini', copilot: 'Copilot' };
const engineName = (engine) => ENGINE_NAMES[engine] ?? engine;

export function renderManualReport(month, perEngine) {
  const lines = [];
  lines.push('📊 AI-видимость mi-code.pl');
  lines.push(`Ручной проход · ${month} · ${perEngine.map(({ engine }) => engineName(engine)).join(', ')}`);
  lines.push('');

  for (const { engine, run } of perEngine) {
    const results = run.results ?? [];
    const cited = results.filter((item) => item.status === 'cited').length;
    lines.push(`${engineName(engine)}: ${cited} из ${results.length}`);
  }

  // Who takes our queries is one question, not one per engine — splitting this
  // by engine would triple the line for a distinction that does not matter here.
  const counts = {};
  for (const { run } of perEngine) {
    for (const [domain, count] of Object.entries(rivalCounts(run))) {
      counts[domain] = (counts[domain] ?? 0) + count;
    }
  }
  const rivals = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([domain, count]) => `${domain} (${count})`);
  if (rivals.length) {
    lines.push('');
    lines.push(`Цитируют вместо нас: ${rivals.join(' · ')}`);
  }

  // The same prompt yields different advice on different engines, so an untagged
  // bullet would be unreadable — unless there is only one engine to confuse it with.
  const tagged = perEngine.length > 1;
  const bullets = perEngine.flatMap(({ engine, advice }) =>
    (advice ?? []).map((item) => (tagged ? `${engineName(engine)} · ${item.text}` : item.text)));

  const header = lines.join('\n');
  if (!bullets.length) return header;

  const opened = `${header}\n\nЧто делать:`;
  let text = opened;
  for (const bullet of bullets) {
    const next = `${text}\n• ${bullet}`;
    if (next.length > TELEGRAM_LIMIT) break;
    text = next;
  }
  return text === opened ? header : text;
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run scripts/ai-visibility/report.test.mjs`
Expected: PASS, 44 tests (37 existing plus 7 new).

- [ ] **Step 5: Commit**

```bash
git add scripts/ai-visibility/report.mjs scripts/ai-visibility/report.test.mjs
git commit -m "Render the browser pass as a two-engine Telegram report (MI-70)"
```

---

### Task 3: Fill in the August pass, then wire the sending

**Files:**
- Modify: `docs/seo/ai-visibility/manual/2026-08.json`
- Modify: `docs/seo/ai-visibility/manual/TEMPLATE.json`
- Modify: `scripts/ai-visibility/manual.mjs`
- Modify: `package.json`
- Create: `.github/workflows/ai-visibility-manual.yml`
- Modify: `docs/seo/ai-visibility/README.md`

**Interfaces:**
- Consumes: `manualToRuns` from Task 1, `renderManualReport` from Task 2, `buildAdvice` from `./advice.mjs`.
- Produces: the workflow step output `alert`, and the npm script `ai-visibility:manual`.

- [ ] **Step 1: Record the domains that were actually observed**

The August file has four entries with notes but no structured domains. These are the sources seen during the pass on 2026-08-12. Add `citedDomains` and `sourceDomains` to each entry, leaving `note` as it is:

- `perplexity` / `pl-brand-micode` — `"citedDomains": ["mi-code.pl"]`, `"sourceDomains": ["mi-code.pl", "krs-online.com.pl", "bizraport.pl", "micode.fi", "panoramafirm.pl", "masio.pl", "vrejestr.pl", "impicode.pl"]`
- `chatgpt` / `pl-brand-micode` — `"citedDomains": []`, `"sourceDomains": ["goodfirms.co", "rejestr.io"]`
- `chatgpt` / `pl-ksiegowosc-wfirma` — `"citedDomains": []`, `"sourceDomains": ["wfirma.pl"]`
- `chatgpt` / `en-angular-ai-chat` — `"citedDomains": []`, `"sourceDomains": ["npmjs.com"]`

Append this sentence to that file's existing `notes` field, because it is an inference and should not be mistaken for a reading:

```
ChatGPT показывает источники подписями («Goodfirms», «Rejestr»), а не URL; goodfirms.co и rejestr.io — это сопоставление подписи домену, а не то, что было видно на экране.
```

Add the two fields to `TEMPLATE.json`'s `engines` example as well, so the next pass records them by default.

- [ ] **Step 2: Add the entry point**

Append to `scripts/ai-visibility/manual.mjs`:

```js
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { buildAdvice } from './advice.mjs';
import { renderManualReport } from './report.mjs';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '../../docs/seo/ai-visibility');

function publishAlert(message) {
  if (!process.env.GITHUB_OUTPUT) return;
  writeFileSync(
    process.env.GITHUB_OUTPUT,
    `alert<<ALERT_EOF\n${message}\nALERT_EOF\n`,
    { flag: 'a' },
  );
}

export function main({ dir = dataDir, month = process.env.AI_VIS_MONTH } = {}) {
  if (!month) throw new Error('AI_VIS_MONTH is not set');

  const path = join(dir, 'manual', `${month}.json`);
  // Failing loudly beats sending an empty report that reads as "nobody cites us".
  if (!existsSync(path)) throw new Error(`no manual pass recorded for ${month} (${path})`);

  const manual = JSON.parse(readFileSync(path, 'utf8'));
  const config = JSON.parse(readFileSync(join(dir, 'prompts.json'), 'utf8'));
  const { runs, skipped } = manualToRuns(manual, config);

  for (const id of skipped) console.warn(`skipping entry with unknown prompt id: ${id}`);
  if (!runs.length) throw new Error(`no usable entries in ${path}`);

  const questions = Object.fromEntries(config.prompts.map((prompt) => [prompt.id, prompt.text]));
  const perEngine = runs.map(({ engine, run }) => ({
    engine, run, advice: buildAdvice(run, config.domain, questions),
  }));

  const message = renderManualReport(month, perEngine);
  publishAlert(message);
  console.log(message);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
```

- [ ] **Step 3: Add the npm script**

In `package.json`, directly after the existing `"ai-visibility"` entry:

```json
"ai-visibility:manual": "node scripts/ai-visibility/manual.mjs",
```

- [ ] **Step 4: Write the workflow**

Create `.github/workflows/ai-visibility-manual.yml`:

```yaml
name: AI visibility manual

# Reports a hand-driven browser pass over ChatGPT and Perplexity — the engines
# that matter and have no free API. There is no schedule on purpose: a human (or
# Claude) drives the browser, commits the month's file, and then runs this.
#
# The bot token stays a GitHub secret, so whoever runs the pass never handles it.
# No GEMINI_API_KEY is involved.

on:
  workflow_dispatch:
    inputs:
      month:
        description: 'Month to report, as YYYY-MM'
        required: true
        type: string

permissions:
  contents: read

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: development

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      # No npm ci: the script uses only Node built-ins.
      - name: Render the report
        id: render
        env:
          AI_VIS_MONTH: ${{ inputs.month }}
        run: npm run ai-visibility:manual

      - name: Tell the ops channel
        if: ${{ failure() || steps.render.outputs.alert != '' }}
        env:
          TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          CHAT: ${{ secrets.TELEGRAM_OPS_CHAT_ID }}
          ALERT: ${{ steps.render.outputs.alert }}
          FAILED: ${{ job.status == 'failure' }}
        run: |
          if [ -z "$TOKEN" ] || [ -z "$CHAT" ]; then
            echo "::warning::TELEGRAM_BOT_TOKEN or TELEGRAM_OPS_CHAT_ID not set — no message sent"
            exit 0
          fi
          run_url="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
          if [ "$FAILED" = "true" ]; then
            text=$(printf '🔴 AI-visibility manual report failed\n\nRun: %s' "$run_url")
          else
            text=$(printf '%s\n\nRun: %s' "$ALERT" "$run_url")
          fi
          curl -sS --max-time 30 \
            "https://api.telegram.org/bot${TOKEN}/sendMessage" \
            --data-urlencode "chat_id=${CHAT}" \
            --data-urlencode "text=${text}" \
            --data-urlencode "disable_web_page_preview=true" \
            -o /dev/null -w 'telegram: HTTP %{http_code}\n'
```

- [ ] **Step 5: Document how it is run**

In `docs/seo/ai-visibility/README.md`, under the manual section, add:

```markdown
Once the month's file is committed and pushed, send it to the ops channel:

    gh workflow run "AI visibility manual" -f month=2026-08

There is no schedule — the pass is hand-driven, so the report goes out when the
pass is done. Record `citedDomains` (ours) and `sourceDomains` (all) per entry:
without them only two of the five advice rules can fire.
```

- [ ] **Step 6: Render it locally against the real file**

```bash
AI_VIS_MONTH=2026-08 npm run ai-visibility:manual
```

Expected: the August report on stdout, naming ChatGPT and Perplexity with their separate counts. Read it as a recipient would and say in the report whether any line is unclear or wrong.

- [ ] **Step 7: Run the whole suite and commit**

```bash
npm run test:run
git add scripts/ai-visibility/manual.mjs package.json .github/workflows/ai-visibility-manual.yml docs/seo/ai-visibility/manual/2026-08.json docs/seo/ai-visibility/manual/TEMPLATE.json docs/seo/ai-visibility/README.md
git commit -m "Send the browser-pass report from a dispatch-only workflow (MI-70)"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| `citedDomains` / `sourceDomains` per entry | 3 (data + template) |
| Entry missing those fields reads as empty | 1 |
| One run per engine, engines sorted | 1 |
| `lang`/`kind`/`target` from `prompts.json` | 1 |
| Unknown `id` skipped and named | 1 (skipped list), 3 (the warning) |
| One message, per-engine counts | 2 |
| Advice tagged by engine, untagged when single | 2 |
| Rivals counted across all engines | 2 |
| Telegram limit, tail-only truncation | 2 |
| `workflow_dispatch` only, month input, token stays in GitHub | 3 |
| Missing month file fails loudly | 3 |
| Gemini path untouched | Global constraints |

**Placeholder scan:** none. Task 3 Step 1 lists exact domain values rather than describing them, and flags the one inference it contains.

**Type consistency:** `manualToRuns` returns `{runs, skipped}` with `runs` entries `{engine, run}`; Task 3 maps those to `{engine, run, advice}`, which is exactly what `renderManualReport(month, perEngine)` in Task 2 iterates. `buildAdvice(run, domain, questions)` matches its existing signature.
