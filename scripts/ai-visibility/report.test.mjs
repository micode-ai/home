import { describe, it, expect } from 'vitest';
import { diffRuns, renderReport, renderAlert, citedProperties } from './report.mjs';

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

describe('renderAlert', () => {
  it('names what appeared and what disappeared', () => {
    const diff = { gained: ['pl-a'], lost: ['en-b'], changed: true, baseline: false };
    const text = renderAlert(diff, run('2026-08-11', {}));
    expect(text).toContain('pl-a');
    expect(text).toContain('en-b');
    expect(text).toContain('2026-08-11');
  });

  it('omits an empty side rather than printing an empty list', () => {
    const diff = { gained: ['pl-a'], lost: [], changed: true, baseline: false };
    const text = renderAlert(diff, run('2026-08-11', {}));
    expect(text).not.toContain('Lost');
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
