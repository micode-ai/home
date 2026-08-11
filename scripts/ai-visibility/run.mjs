import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractText, extractCitations, resolveHost, classify, bestStatus, summarize, ownedHosts }
  from './analyze.mjs';
import { diffRuns, renderReport, renderAlert } from './report.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dataDir = join(root, 'docs/seo/ai-visibility');

// Grounding is free only on 2.5 Flash / Flash-Lite (500 RPD, shared). A 3.x
// model would start billing search after 5,000 a month — never default to one.
const DEFAULT_MODEL = 'gemini-2.5-flash';
// A live probe on 2026-08-11 confirmed generateContent answers with grounding
// on gemini-2.5-flash (captured in fixtures/generate-content.json). The
// interactions endpoint stays reachable via AI_VIS_ENDPOINT.
const DEFAULT_MODE = 'generateContent';
const DEFAULT_REPEATS = 2;
const RETRY_DELAY_MS = 5000;
// The free tier caps requests per minute as well as per day, and a run fires
// dozens of them back to back. Pacing is what stops a weekly run from killing
// itself with its own throughput: the first live run tripped a 429 within
// seconds without it, while a single call at rest succeeded.
const DEFAULT_DELAY_MS = 6500;
const RATE_LIMIT_DELAY_MS = 30000;
// Twenty model calls a day on the free tier means a 54-call sweep cannot run in
// one sitting. It runs as a cursor over a stable work list instead: each day
// takes the next slice, and the sweep closes when the last item lands.
const DEFAULT_DAILY_BUDGET = 18;

export function workList(prompts, repeats) {
  const items = [];
  for (const prompt of prompts) {
    for (let repeat = 0; repeat < repeats; repeat += 1) items.push({ prompt, repeat });
  }
  return items;
}

export function nextSlice(items, cursor, budget) {
  const nextCursor = Math.min(cursor + budget, items.length);
  return { slice: items.slice(cursor, nextCursor), nextCursor, complete: nextCursor >= items.length };
}

export function foldAttempts(attempts) {
  const byId = new Map();
  for (const attempt of attempts) {
    if (!byId.has(attempt.id)) {
      byId.set(attempt.id, {
        id: attempt.id,
        lang: attempt.lang,
        kind: attempt.kind,
        target: attempt.target ?? null,
        status: 'absent',
        attempts: [],
      });
    }
    const result = byId.get(attempt.id);
    result.attempts.push({
      status: attempt.status,
      citedUrls: attempt.citedUrls ?? [],
      citedDomains: attempt.citedDomains ?? [],
      sourceDomains: attempt.sourceDomains ?? [],
    });
    result.status = bestStatus(result.attempts.map((a) => a.status));
  }
  return [...byId.values()];
}

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
  const { slice, domain, ownedDomains, brandTerms, model, mode, apiKey, delayMs } = config;
  const attempts = [];
  let calls = 0;

  for (const item of slice) {
    // Pace every call but the first: the gap belongs between calls, and
    // waiting before the run has even started just burns wall clock.
    if (calls > 0) await deps.sleep(delayMs ?? 0);

    const response = await callOnce(
      buildRequest(mode, model, item.prompt.text), apiKey, deps,
    );
    calls += 1;

    const citations = extractCitations(response);
    const hosts = [];
    for (const citation of citations) {
      hosts.push(await resolveHost(citation, deps.fetchImpl));
    }

    const status = classify({
      text: extractText(response), hosts, domain, ownedDomains, brandTerms,
    });
    const owned = ownedHosts(hosts, ownedDomains?.length ? ownedDomains : [domain]);
    attempts.push({
      id: item.prompt.id,
      lang: item.prompt.lang,
      kind: item.prompt.kind,
      target: item.prompt.target ?? null,
      status,
      citedUrls: citations
        .filter((_, index) => owned.includes(hosts[index]))
        .map((citation) => citation.url),
      citedDomains: [...new Set(owned)],
      sourceDomains: [...new Set(hosts)],
    });
  }

  return { attempts, calls };
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
  const dailyBudget = Number(process.env.AI_VIS_DAILY_BUDGET || DEFAULT_DAILY_BUDGET);
  const date = process.env.AI_VIS_DATE || new Date().toISOString().slice(0, 10);

  const partialPath = join(dataDir, 'partial.json');
  const partial = existsSync(partialPath)
    ? JSON.parse(readFileSync(partialPath, 'utf8'))
    : { sweep: 1, cursor: 0, attempts: [], calls: 0, started: date };

  const items = workList(config.prompts, repeats);
  const { slice, nextCursor, complete } = nextSlice(items, partial.cursor, dailyBudget);

  if (!slice.length) {
    console.log('sweep already complete for today — nothing to do');
    return;
  }

  const { attempts, calls } = await measure(
    { ...config, slice, model, mode, delayMs, apiKey },
    { fetchImpl: fetch, sleep: (ms) => new Promise((r) => setTimeout(r, ms)) },
  );

  const allAttempts = [...partial.attempts, ...attempts];
  const totalCalls = partial.calls + calls;

  if (!complete) {
    writeFileSync(partialPath, `${JSON.stringify(
      { ...partial, cursor: nextCursor, attempts: allAttempts, calls: totalCalls }, null, 2,
    )}\n`);
    console.log(`sweep ${partial.sweep}: ${nextCursor}/${items.length} measured (${calls} calls today)`);
    return;
  }

  const results = foldAttempts(allAttempts);
  const run = {
    date, source: 'gemini', model, sweep: partial.sweep, started: partial.started,
    calls: totalCalls, results, summary: summarize(results),
  };

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
  writeFileSync(partialPath, `${JSON.stringify(
    { sweep: partial.sweep + 1, cursor: 0, attempts: [], calls: 0, started: date }, null, 2,
  )}\n`);

  publishOutputs(diff, renderAlert(diff, run));
  console.log(`sweep ${partial.sweep} complete · ${totalCalls} calls · cited ${(run.summary.citedShare * 100).toFixed(1)}% · changed=${diff.changed}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
