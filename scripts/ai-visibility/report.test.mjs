import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { diffRuns, renderReport, renderTelegramReport, citedProperties, plural, renderManualReport } from './report.mjs';

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

  it('breaks the citations down by which property was cited', () => {
    const withProperties = {
      ...run('2026-08-11', { 'pl-a': 'cited' }),
      results: [
        {
          id: 'pl-a', lang: 'pl', kind: 'category', status: 'cited', target: '/',
          attempts: [{ citedDomains: ['eksiegowyai.pl'] }],
        },
      ],
    };
    const md = renderReport({ run: withProperties, previous: null, manual: null });
    expect(md).toContain('eksiegowyai.pl');
  });
});

describe('citedProperties', () => {
  const runWithAttempts = {
    date: '2026-08-11',
    results: [
      { id: 'a', attempts: [{ citedDomains: ['mi-code.pl'] }, { citedDomains: ['mi-code.pl'] }] },
      { id: 'b', attempts: [{ citedDomains: ['eksiegowyai.pl'] }, { citedDomains: [] }] },
      { id: 'c', attempts: [{ citedDomains: [] }, { citedDomains: [] }] },
    ],
  };

  it('counts each property once per prompt, however many repeats cited it', () => {
    expect(citedProperties(runWithAttempts)).toEqual({
      'mi-code.pl': 1,
      'eksiegowyai.pl': 1,
    });
  });

  it('returns nothing when no property was cited', () => {
    expect(citedProperties({ results: [{ id: 'a', attempts: [{ citedDomains: [] }] }] })).toEqual({});
  });

  it('survives a run whose attempts predate the citedDomains field', () => {
    expect(citedProperties({ results: [{ id: 'a', attempts: [{}] }] })).toEqual({});
  });
});

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

describe('plural', () => {
  const call = (n) => plural(n, 'вызов', 'вызова', 'вызовов');

  it('uses the singular for one', () => {
    expect(call(1)).toBe('вызов');
  });

  it('uses the paucal for two through four', () => {
    expect(call(2)).toBe('вызова');
    expect(call(4)).toBe('вызова');
  });

  it('uses the plural from five', () => {
    expect(call(5)).toBe('вызовов');
  });

  it('uses the plural through the teens, which do not follow their last digit', () => {
    expect(call(11)).toBe('вызовов');
    expect(call(12)).toBe('вызовов');
    expect(call(14)).toBe('вызовов');
  });

  it('follows the last digit again past twenty', () => {
    expect(call(21)).toBe('вызов');
    expect(call(54)).toBe('вызова');
  });

  it('handles zero', () => {
    expect(call(0)).toBe('вызовов');
  });
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

  it('drops the lowest-priority advice first, keeping the most important', () => {
    const advice = [
      { rule: 'brand-canary', priority: 1, text: `первый ${'x'.repeat(1500)}` },
      { rule: 'dead-language', priority: 4, text: `последний ${'y'.repeat(3000)}` },
    ];
    const text = renderTelegramReport(sweep(), null, advice);
    expect(text).toContain('первый');
    expect(text).not.toContain('последний');
  });

  it('drops the whole advice block rather than leaving a dangling heading', () => {
    const advice = [{ rule: 'brand-canary', priority: 1, text: 'z'.repeat(5000) }];
    const text = renderTelegramReport(sweep(), null, advice);
    expect(text).not.toContain('Что делать');
    expect(text).toContain('Свип 3');
  });

  it('agrees the call count with its noun', () => {
    // A full sweep is 54 — "54 вызовов" is simply wrong Russian, and it is the
    // number this line prints on almost every closed sweep.
    const head = (calls) => renderTelegramReport(sweep({ calls }), null, []).split('\n')[1];
    expect(head(54)).toBe('Свип 3 · 2026-08-14 · 54 вызова');
    expect(head(1)).toBe('Свип 3 · 2026-08-14 · 1 вызов');
    expect(head(5)).toBe('Свип 3 · 2026-08-14 · 5 вызовов');
  });

  it('survives a previous run whose summary is missing', () => {
    // main() writes the run file and resets partial.json *before* rendering the
    // alert. A throw here would lose days of measurement on a runner that
    // cannot replay them, so every cross-run read is guarded.
    const previous = { date: '2026-08-13', results: [{ id: 'pl-a', status: 'cited' }] };
    expect(() => renderTelegramReport(sweep(), previous, [])).not.toThrow();
    expect(renderTelegramReport(sweep(), previous, [])).toContain('было 1 из 1');
  });

  it('never names a search aggregator among the rivals', () => {
    const withAggregators = sweep({
      results: [
        {
          id: 'pl-a', lang: 'pl', kind: 'category', status: 'absent', target: '/',
          attempts: [{ status: 'absent', citedUrls: [], citedDomains: [], sourceDomains: ['google.com', 'cognity.pl'] }],
        },
      ],
      summary: { byLang: {}, byKind: {}, citedShare: 0 },
    });
    const text = renderTelegramReport(withAggregators, null, []);
    expect(text).toContain('cognity.pl (1)');
    expect(text).not.toContain('google.com');
  });

  it('names the rivals cited where we were not, and never an unresolved host', () => {
    const withRivals = sweep({
      results: [
        {
          id: 'pl-a', lang: 'pl', kind: 'category', status: 'absent', target: '/',
          attempts: [{ status: 'absent', citedUrls: [], citedDomains: [], sourceDomains: ['cognity.pl', 'unknown'] }],
        },
      ],
      summary: { byLang: {}, byKind: {}, citedShare: 0 },
    });
    const text = renderTelegramReport(withRivals, null, []);
    expect(text).toContain('cognity.pl (1)');
    expect(text).not.toContain('unknown');
  });

  it('prints the arena line under the language breakdown when byArena has data', () => {
    const withArena = sweep({
      summary: {
        byLang: { pl: { cited: 1, mentioned: 0, absent: 0 }, en: { cited: 0, mentioned: 0, absent: 1 } },
        byKind: {},
        byArena: {
          ours: { cited: 1, mentioned: 0, absent: 11 },
          open: { cited: 0, mentioned: 0, absent: 15 },
        },
        citedShare: 0.5,
      },
    });
    const text = renderTelegramReport(withArena, null, []);
    expect(text).toContain('Наши темы: 1/12 · Общие: 0/15');
  });

  it('omits the arena line entirely when byArena is empty', () => {
    // sweep()'s summary carries no byArena at all — the shape an older run file
    // or a summary built before this field existed would have.
    const text = renderTelegramReport(sweep(), null, []);
    expect(text).not.toContain('Наши темы');
    expect(text).not.toContain('Общие');
  });
});

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

  it('prints an arena line under an engine line when that engine has byArena data', () => {
    const withArena = {
      engine: 'chatgpt',
      run: {
        ...engineRun({ a: 'cited', b: 'absent' }),
        summary: {
          byLang: {}, byKind: {},
          byArena: { ours: { cited: 1, mentioned: 0, absent: 0 }, open: { cited: 0, mentioned: 0, absent: 1 } },
          citedShare: 0.5,
        },
      },
      advice: [],
    };
    const text = renderManualReport('2026-08', [withArena]);
    expect(text).toContain('Наши темы: 1/1 · Общие: 0/1');
  });

  it('omits the arena line for an engine whose byArena is empty', () => {
    const text = renderManualReport('2026-08', [
      { engine: 'chatgpt', run: engineRun({ a: 'absent' }), advice: [] },
    ]);
    expect(text).not.toContain('Наши темы');
    expect(text).not.toContain('Общие');
  });
});

describe('the workflow that sends the message', () => {
  const workflow = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../..', '.github/workflows/ai-visibility.yml'),
    'utf8',
  );

  it('does not prefix an emoji the message already carries', () => {
    // renderTelegramReport opens with 📊, so a 📊 in the workflow's printf too
    // would send every report headed '📊 📊'.
    expect(renderTelegramReport(sweep(), null, [])).toContain('📊');
    expect(workflow).toContain("text=$(printf '%s\\n\\nRun: %s' \"$ALERT\" \"$run_url\")");
  });

  it('still marks a failed run, which renders no message of its own', () => {
    expect(workflow).toContain('🔴 AI-visibility run failed');
  });
});
