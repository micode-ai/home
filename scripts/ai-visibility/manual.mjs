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
      arena: prompt.arena ?? null,
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
