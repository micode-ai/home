import { describe, it, expect } from 'vitest';
import { buildAdvice, rivalCounts } from './advice.mjs';

const DOMAIN = 'mi-code.pl';

// A result builder, so each test states only what it is about.
const result = (id, over = {}) => ({
  id,
  lang: over.lang ?? 'pl',
  kind: over.kind ?? 'category',
  target: over.target ?? null,
  status: over.status ?? 'absent',
  attempts: over.attempts ?? [
    { status: over.status ?? 'absent', citedUrls: [], citedDomains: over.citedDomains ?? [], sourceDomains: over.sourceDomains ?? [] },
  ],
});

const run = (results) => ({ date: '2026-08-14', sweep: 1, calls: 2, results, summary: {} });

const rules = (advice) => advice.map((a) => a.rule);

describe('rivalCounts', () => {
  it('counts a foreign domain once per prompt where we were not cited', () => {
    const counts = rivalCounts(run([
      result('a', { sourceDomains: ['cognity.pl', 'cognity.pl'] }),
      result('b', { sourceDomains: ['cognity.pl'] }),
    ]));
    expect(counts['cognity.pl']).toBe(2);
  });

  it('ignores prompts where we were cited', () => {
    const counts = rivalCounts(run([
      result('a', { status: 'cited', citedDomains: [DOMAIN], sourceDomains: ['cognity.pl'] }),
    ]));
    expect(counts['cognity.pl']).toBeUndefined();
  });
});

describe('rule: brand canary', () => {
  it('fires when a brand prompt does not cite us', () => {
    const advice = buildAdvice(run([result('pl-brand', { kind: 'brand' })]), DOMAIN);
    expect(rules(advice)).toContain('brand-canary');
    expect(advice.find((a) => a.rule === 'brand-canary').text).toContain('pl-brand');
  });

  it('stays silent when every brand prompt cites us', () => {
    const advice = buildAdvice(
      run([result('pl-brand', { kind: 'brand', status: 'cited', citedDomains: [DOMAIN] })]),
      DOMAIN,
    );
    expect(rules(advice)).not.toContain('brand-canary');
  });
});

describe('rule: page exists but is not cited', () => {
  it('names the page and who was cited instead', () => {
    const advice = buildAdvice(run([
      result('pl-koszt', { target: '/blog/koszt/', sourceDomains: ['cognity.pl', 'aioa.pl'] }),
    ]), DOMAIN);
    const text = advice.find((a) => a.rule === 'page-not-cited').text;
    expect(text).toContain('/blog/koszt/');
    expect(text).toContain('cognity.pl');
  });

  it('stays silent for a prompt with no target page', () => {
    const advice = buildAdvice(run([result('pl-x', { target: null })]), DOMAIN);
    expect(rules(advice)).not.toContain('page-not-cited');
  });

  it('reports at most two pages, so one rule cannot fill the message', () => {
    const advice = buildAdvice(run([
      result('a', { target: '/a/' }), result('b', { target: '/b/' }),
      result('c', { target: '/c/' }), result('d', { target: '/d/' }),
    ]), DOMAIN);
    expect(rules(advice).filter((r) => r === 'page-not-cited')).toHaveLength(2);
  });

  it('never names an unresolved host as the one cited instead', () => {
    const advice = buildAdvice(run([
      result('pl-x', { target: '/x/', sourceDomains: ['unknown'] }),
    ]), DOMAIN);
    expect(advice.find((a) => a.rule === 'page-not-cited').text).not.toContain('unknown');
  });
});

describe('rule: portfolio skew', () => {
  it('fires when product sites are cited more often than the primary domain', () => {
    const advice = buildAdvice(run([
      result('a', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
      result('b', { status: 'cited', citedDomains: ['ai-budget.pl'] }),
      result('c', { status: 'cited', citedDomains: [DOMAIN] }),
    ]), DOMAIN);
    const text = advice.find((a) => a.rule === 'portfolio-skew').text;
    expect(text).toContain('eksiegowyai.pl');
    expect(text).toContain(DOMAIN);
  });

  it('stays silent when the primary domain leads', () => {
    const advice = buildAdvice(run([
      result('a', { status: 'cited', citedDomains: [DOMAIN] }),
      result('b', { status: 'cited', citedDomains: [DOMAIN] }),
      result('c', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('portfolio-skew');
  });

  it('treats a subdomain of the primary domain as primary', () => {
    const advice = buildAdvice(run([
      result('a', { status: 'cited', citedDomains: ['blog.mi-code.pl'] }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('portfolio-skew');
  });

  it('stays silent when product sites and the primary domain tie', () => {
    const advice = buildAdvice(run([
      result('a', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
      result('b', { status: 'cited', citedDomains: [DOMAIN] }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('portfolio-skew');
  });
});

describe('rule: dead language', () => {
  it('names a language with no citations at all', () => {
    const advice = buildAdvice(run([
      result('ru-1', { lang: 'ru' }),
      result('pl-1', { status: 'cited', citedDomains: [DOMAIN] }),
    ]), DOMAIN);
    const text = advice.find((a) => a.rule === 'dead-language').text;
    expect(text).toContain('ru');
    expect(text).not.toContain('pl:');
  });
});

describe('rule: volatile', () => {
  it('fires when one repeat cited us and another did not', () => {
    const advice = buildAdvice(run([
      result('pl-flap', {
        status: 'cited',
        attempts: [
          { status: 'absent', citedUrls: [], citedDomains: [], sourceDomains: [] },
          { status: 'cited', citedUrls: [], citedDomains: [DOMAIN], sourceDomains: [] },
        ],
      }),
    ]), DOMAIN);
    expect(advice.find((a) => a.rule === 'volatile').text).toContain('pl-flap');
  });

  it('stays silent when both repeats agree', () => {
    const advice = buildAdvice(run([
      result('pl-solid', {
        status: 'cited',
        attempts: [
          { status: 'cited', citedUrls: [], citedDomains: [DOMAIN], sourceDomains: [] },
          { status: 'cited', citedUrls: [], citedDomains: [DOMAIN], sourceDomains: [] },
        ],
      }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('volatile');
  });
});

describe('rule: persistent rival', () => {
  it('fires on a domain cited across three prompts where we are absent', () => {
    const advice = buildAdvice(run([
      result('a', { sourceDomains: ['cognity.pl'] }),
      result('b', { sourceDomains: ['cognity.pl'] }),
      result('c', { sourceDomains: ['cognity.pl'] }),
    ]), DOMAIN);
    expect(advice.find((a) => a.rule === 'persistent-rival').text).toContain('cognity.pl');
  });

  it('stays silent below the threshold', () => {
    const advice = buildAdvice(run([
      result('a', { sourceDomains: ['cognity.pl'] }),
      result('b', { sourceDomains: ['cognity.pl'] }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('persistent-rival');
  });

  it('never reports an unresolved host as a rival', () => {
    const advice = buildAdvice(run([
      result('a', { sourceDomains: ['unknown'] }),
      result('b', { sourceDomains: ['unknown'] }),
      result('c', { sourceDomains: ['unknown'] }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('persistent-rival');
  });
});

describe('buildAdvice', () => {
  it('keeps the five highest-priority items when more rules fire', () => {
    const results = [
      result('pl-brand', { kind: 'brand' }),
      result('a', { target: '/a/', sourceDomains: ['cognity.pl'] }),
      result('b', { target: '/b/', sourceDomains: ['cognity.pl'] }),
      result('c', { sourceDomains: ['cognity.pl'] }),
      result('ru-1', { lang: 'ru' }),
      result('en-1', { lang: 'en' }),
    ];
    const advice = buildAdvice(run(results), DOMAIN);
    expect(advice).toHaveLength(5);
    expect(advice[0].rule).toBe('brand-canary');
    // Sorted by priority, so the lowest-priority rule that fired is dropped.
    expect(rules(advice)).not.toContain('persistent-rival');
  });

  it('returns nothing for a run with no results rather than throwing', () => {
    expect(buildAdvice(run([]), DOMAIN)).toEqual([]);
  });
});
