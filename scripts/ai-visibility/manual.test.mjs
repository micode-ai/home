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
