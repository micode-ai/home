import { describe, it, expect } from 'vitest';
import { diffRuns, renderReport, renderTelegramReport, citedProperties } from './report.mjs';

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
