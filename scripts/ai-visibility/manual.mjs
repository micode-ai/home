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
