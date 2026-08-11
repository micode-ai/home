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
// A live probe on 2026-08-11 confirmed generateContent answers with grounding
// on gemini-2.5-flash (captured in fixtures/generate-content.json). The
// interactions endpoint stays reachable via AI_VIS_ENDPOINT.
const DEFAULT_MODE = 'generateContent';
const DEFAULT_REPEATS = 2;
const RETRY_DELAY_MS = 5000;

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
      await sleep(RETRY_DELAY_MS);
      continue;
    }
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Gemini API ${response.status}: ${detail}`);
  }
}

export async function measure(config, deps) {
  const { prompts, domain, brandTerms, model, mode, repeats, apiKey } = config;
  const results = [];
  let calls = 0;

  for (const prompt of prompts) {
    const attempts = [];

    for (let repeat = 0; repeat < repeats; repeat += 1) {
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
  const date = process.env.AI_VIS_DATE || new Date().toISOString().slice(0, 10);

  const { results, calls } = await measure(
    { ...config, model, mode, repeats, apiKey },
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
