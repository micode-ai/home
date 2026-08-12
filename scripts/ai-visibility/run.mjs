import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractText, extractCitations, resolveHost, classify, bestStatus, summarize, ownedHosts }
  from './analyze.mjs';
import { diffRuns, renderReport, renderTelegramReport } from './report.mjs';
import { buildAdvice } from './advice.mjs';

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
// dozens of them back to back. Pacing is what stops a daily slice from killing
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

export function promptsFingerprint(prompts, repeats) {
  // The cursor is an index into a work list built from prompts.json, so a sweep
  // is only resumable while that list is identical. Editing prompts mid-sweep
  // is normal here — a sweep spans days — so the resume has to detect it.
  const shape = `${repeats}:${prompts.map((prompt) => prompt.id).join(',')}`;
  return createHash('sha1').update(shape).digest('hex').slice(0, 12);
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
        arena: attempt.arena ?? null,
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
    let response;
    try {
      response = await fetchImpl(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
      });
    } catch (error) {
      // A dropped connection throws rather than answering, so it bypasses every
      // status check below. Retry it like a 5xx: observed live, one blip aborted
      // the sweep and took the whole day's free quota down with it.
      if (attempt === 0) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw new Error(`Gemini API unreachable: ${error.message}`);
    }

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
      arena: item.prompt.arena ?? null,
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

function readManualSnapshot(dir, month) {
  const path = join(dir, 'manual', `${month}.json`);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

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

// The daily job passes nothing; the tests pass a scratch data directory and a
// stubbed transport, because every branch below only ever runs in CI otherwise.
export async function main({ dir = dataDir, deps } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const config = JSON.parse(readFileSync(join(dir, 'prompts.json'), 'utf8'));
  const model = process.env.AI_VIS_MODEL || DEFAULT_MODEL;
  const mode = process.env.AI_VIS_ENDPOINT || DEFAULT_MODE;
  // Number('abc') is NaN, and a NaN budget measures nothing while still exiting
  // 0 — the job would go green every day forever. A misconfigured schedule has
  // to go red and alert instead of quietly degrading.
  const asPositiveInt = (name, value, fallback) => {
    // An unset Actions variable renders as an empty string rather than as
    // undefined. Treating that as a bad value would turn this guard into the
    // daily failure it exists to prevent.
    const raw = value === undefined || value === '' ? fallback : value;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error(`${name} must be a positive integer, got ${JSON.stringify(value)}`);
    }
    return parsed;
  };
  const repeats = asPositiveInt('AI_VIS_REPEATS', process.env.AI_VIS_REPEATS, DEFAULT_REPEATS);
  const delayMs = Number(process.env.AI_VIS_DELAY_MS || DEFAULT_DELAY_MS);
  const dailyBudget = asPositiveInt(
    'AI_VIS_DAILY_BUDGET', process.env.AI_VIS_DAILY_BUDGET, DEFAULT_DAILY_BUDGET,
  );
  const date = process.env.AI_VIS_DATE || new Date().toISOString().slice(0, 10);

  const partialPath = join(dir, 'partial.json');
  const fingerprint = promptsFingerprint(config.prompts, repeats);
  const stored = existsSync(partialPath) ? JSON.parse(readFileSync(partialPath, 'utf8')) : null;
  if (stored && stored.fingerprint !== fingerprint) {
    console.log(`prompt set changed — abandoning sweep ${stored.sweep} at ${stored.cursor}/${stored.attempts.length} and starting fresh`);
  }
  const partial = stored && stored.fingerprint === fingerprint
    ? stored
    : { sweep: (stored?.sweep ?? 0) + 1, cursor: 0, attempts: [], calls: 0, started: date, fingerprint };

  const items = workList(config.prompts, repeats);
  const { slice, nextCursor, complete } = nextSlice(items, partial.cursor, dailyBudget);

  // An empty slice that is *complete* means the cursor has run past the end of
  // the work list — the sweep still has to be closed, or partial.json is never
  // reset and the job no-ops green every day until a human notices REPORT.md
  // has gone stale. Only a genuinely-nothing-to-do slice returns early.
  if (!slice.length && !complete) {
    console.log('nothing to measure — check AI_VIS_DAILY_BUDGET');
    return;
  }

  const { attempts, calls } = await measure(
    { ...config, slice, model, mode, delayMs, apiKey },
    deps ?? { fetchImpl: fetch, sleep: (ms) => new Promise((r) => setTimeout(r, ms)) },
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

  const runsDir = join(dir, 'runs');
  const todayFile = `${date}.json`;
  const previous = readPreviousRun(runsDir, todayFile);
  const diff = diffRuns(previous, run);

  mkdirSync(runsDir, { recursive: true });
  writeFileSync(join(runsDir, todayFile), `${JSON.stringify(run, null, 2)}\n`);
  writeFileSync(
    join(dir, 'REPORT.md'),
    renderReport({ run, previous, manual: readManualSnapshot(dir, date.slice(0, 7)) }),
  );
  // The fresh sweep carries the fingerprint too. Without it the next run reads
  // back a partial that matches nothing and restarts the sweep every single day.
  writeFileSync(partialPath, `${JSON.stringify(
    { sweep: partial.sweep + 1, cursor: 0, attempts: [], calls: 0, started: date, fingerprint },
    null, 2,
  )}\n`);

  const questions = Object.fromEntries(config.prompts.map((prompt) => [prompt.id, prompt.text]));
  const advice = buildAdvice(run, config.domain, questions);
  publishOutputs(diff, renderTelegramReport(run, previous, advice));
  console.log(`sweep ${partial.sweep} complete · ${totalCalls} calls · cited ${(run.summary.citedShare * 100).toFixed(1)}% · changed=${diff.changed}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
