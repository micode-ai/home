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

  it('never counts a search aggregator as a rival', () => {
    // A Gdansk software house does not compete with Google for a citation slot;
    // naming it as a competitor would discredit every other line in the report.
    const counts = rivalCounts(run([
      result('a', { sourceDomains: ['google.com', 'youtube.com', 'amazon.com', 'cognity.pl'] }),
    ]));
    expect(counts['google.com']).toBeUndefined();
    expect(counts['youtube.com']).toBeUndefined();
    expect(counts['amazon.com']).toBeUndefined();
    expect(counts['cognity.pl']).toBe(1);
  });

  it('excludes a country-coded Google host too', () => {
    const counts = rivalCounts(run([
      result('a', { sourceDomains: ['google.co.uk', 'google.pl'] }),
    ]));
    expect(counts['google.co.uk']).toBeUndefined();
    expect(counts['google.pl']).toBeUndefined();
  });

  it('never counts an unresolved host', () => {
    expect(rivalCounts(run([result('a', { sourceDomains: ['unknown'] })]))['unknown'])
      .toBeUndefined();
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
    expect(rules(advice)).not.toContain('brand-mentioned-not-cited');
  });

  it('calls an absent brand prompt an indexing problem, not a linking one', () => {
    const advice = buildAdvice(run([result('pl-brand', { kind: 'brand', status: 'absent' })]), DOMAIN);
    const texts = advice.map((a) => a.text).join('\n');
    expect(texts).toContain('это индексация');
    expect(texts).not.toContain('это ссылки');
  });

  it('calls a mentioned brand prompt a linking problem, not an indexing one', () => {
    // classify() keeps `mentioned` apart from `absent` on purpose: the engine
    // named us and linked elsewhere. Telling the reader to fix indexing here
    // points at the wrong remedy entirely.
    const advice = buildAdvice(run([result('pl-brand', { kind: 'brand', status: 'mentioned' })]), DOMAIN);
    const texts = advice.map((a) => a.text).join('\n');
    expect(texts).toContain('это ссылки');
    expect(texts).not.toContain('это индексация');
    expect(rules(advice)).toContain('brand-mentioned-not-cited');
  });

  it('raises both lines when one brand prompt is absent and another is mentioned', () => {
    const advice = buildAdvice(run([
      result('pl-brand', { kind: 'brand', status: 'absent' }),
      result('en-brand', { kind: 'brand', status: 'mentioned' }),
    ]), DOMAIN);
    expect(rules(advice)).toContain('brand-canary');
    expect(rules(advice)).toContain('brand-mentioned-not-cited');
    expect(advice.find((a) => a.rule === 'brand-canary').text).toContain('pl-brand');
    expect(advice.find((a) => a.rule === 'brand-canary').text).not.toContain('en-brand');
    expect(advice.find((a) => a.rule === 'brand-mentioned-not-cited').text).toContain('en-brand');
    expect(advice.find((a) => a.rule === 'brand-mentioned-not-cited').text).not.toContain('pl-brand');
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
      result('c', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
      result('d', { status: 'cited', citedDomains: [DOMAIN] }),
    ]), DOMAIN);
    const text = advice.find((a) => a.rule === 'portfolio-skew').text;
    expect(text).toContain('eksiegowyai.pl');
    expect(text).toContain(DOMAIN);
  });

  it('stays silent on a single secondary citation, which is a page doing its job', () => {
    // Live data: one citation of eksiegowyai.pl answering an accounting
    // question fired this rule as `1 против 0`. That is the product page
    // working, not a portfolio tilting away from the primary domain.
    const advice = buildAdvice(run([
      result('a', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('portfolio-skew');
  });

  it('stays silent on two secondary citations, still below the sample floor', () => {
    const advice = buildAdvice(run([
      result('a', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
      result('b', { status: 'cited', citedDomains: ['ai-budget.pl'] }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('portfolio-skew');
  });

  it('fires at three secondary citations against none', () => {
    const advice = buildAdvice(run([
      result('a', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
      result('b', { status: 'cited', citedDomains: ['ai-budget.pl'] }),
      result('c', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
    ]), DOMAIN);
    expect(advice.find((a) => a.rule === 'portfolio-skew').text).toContain('3 против 0');
  });

  it('stays silent at a tie above the sample floor', () => {
    const advice = buildAdvice(run([
      result('a', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
      result('b', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
      result('c', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
      result('d', { status: 'cited', citedDomains: [DOMAIN] }),
      result('e', { status: 'cited', citedDomains: [DOMAIN] }),
      result('f', { status: 'cited', citedDomains: [DOMAIN] }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('portfolio-skew');
  });

  it('stays silent when the primary domain leads', () => {
    // Four against three: past the sample floor, so only the comparison can
    // keep this quiet.
    const advice = buildAdvice(run([
      result('a', { status: 'cited', citedDomains: [DOMAIN] }),
      result('b', { status: 'cited', citedDomains: [DOMAIN] }),
      result('c', { status: 'cited', citedDomains: [DOMAIN] }),
      result('d', { status: 'cited', citedDomains: [DOMAIN] }),
      result('e', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
      result('f', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
      result('g', { status: 'cited', citedDomains: ['eksiegowyai.pl'] }),
    ]), DOMAIN);
    expect(rules(advice)).not.toContain('portfolio-skew');
  });

  it('treats a subdomain of the primary domain as primary', () => {
    // Three of them, so the sample floor is not what keeps this silent.
    const advice = buildAdvice(run([
      result('a', { status: 'cited', citedDomains: ['blog.mi-code.pl'] }),
      result('b', { status: 'cited', citedDomains: ['blog.mi-code.pl'] }),
      result('c', { status: 'cited', citedDomains: ['blog.mi-code.pl'] }),
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

describe('buildAdvice', () => {
  it('keeps the five highest-priority items when more rules fire', () => {
    const results = [
      result('pl-brand', { kind: 'brand' }),
      result('en-brand', { kind: 'brand', status: 'mentioned', lang: 'en' }),
      result('a', { target: '/a/', sourceDomains: ['cognity.pl'] }),
      result('b', { target: '/b/', sourceDomains: ['cognity.pl'] }),
      result('c', { sourceDomains: ['cognity.pl'] }),
      result('ru-1', { lang: 'ru' }),
      result('de-1', { lang: 'de' }),
    ];
    const advice = buildAdvice(run(results), DOMAIN);
    expect(advice).toHaveLength(5);
    expect(advice[0].rule).toBe('brand-canary');
    // Sorted by priority, so the lowest-priority rules that fired are dropped:
    // two dead languages queue behind the two priority-1 brand lines.
    expect(rules(advice).filter((r) => r === 'dead-language')).toHaveLength(1);
  });

  it('returns nothing for a run with no results rather than throwing', () => {
    expect(buildAdvice(run([]), DOMAIN)).toEqual([]);
  });
});

const QUESTIONS = {
  'pl-koszt': 'Ile kosztuje miesiecznie utrzymanie agenta AI opartego na LLM?',
  'pl-brand': 'Czym zajmuje sie MiCode Sp. z o.o. z Gdanska?',
};

describe('question labels', () => {
  it('prints the question instead of the slug when it is known', () => {
    const advice = buildAdvice(
      run([result('pl-koszt', { target: '/blog/koszt/', sourceDomains: ['cognity.pl'] })]),
      DOMAIN, QUESTIONS,
    );
    const text = advice.find((a) => a.rule === 'page-not-cited').text;
    expect(text).toContain('Ile kosztuje');
    expect(text).not.toContain('pl-koszt:');
  });

  it('falls back to the id when the question is unknown', () => {
    const advice = buildAdvice(
      run([result('pl-mystery', { target: '/x/', sourceDomains: ['cognity.pl'] })]),
      DOMAIN, QUESTIONS,
    );
    expect(advice.find((a) => a.rule === 'page-not-cited').text).toContain('pl-mystery');
  });

  it('labels the brand canary with its question too', () => {
    const advice = buildAdvice(
      run([result('pl-brand', { kind: 'brand' })]), DOMAIN, QUESTIONS,
    );
    expect(advice.find((a) => a.rule === 'brand-canary').text).toContain('Czym zajmuje');
  });

  it('shortens a long question rather than filling the message', () => {
    const long = { 'pl-long': `${'a'.repeat(200)}?` };
    const advice = buildAdvice(
      run([result('pl-long', { target: '/x/', sourceDomains: ['cognity.pl'] })]),
      DOMAIN, long,
    );
    const text = advice.find((a) => a.rule === 'page-not-cited').text;
    expect(text).toContain('…');
    expect(text.length).toBeLessThan(200);
  });

  it('lists at most two questions and counts the rest', () => {
    const many = { a: 'Pierwsze pytanie?', b: 'Drugie pytanie?', c: 'Trzecie pytanie?' };
    const advice = buildAdvice(run([
      result('a', { kind: 'brand' }), result('b', { kind: 'brand' }), result('c', { kind: 'brand' }),
    ]), DOMAIN, many);
    const text = advice.find((a) => a.rule === 'brand-canary').text;
    expect(text).toContain('Pierwsze');
    expect(text).toContain('и ещё 1');
    expect(text).not.toContain('Trzecie');
  });

  it('behaves exactly as before when no questions are given', () => {
    const advice = buildAdvice(run([result('pl-koszt', { target: '/x/', sourceDomains: ['cognity.pl'] })]), DOMAIN);
    expect(advice.find((a) => a.rule === 'page-not-cited').text).toContain('pl-koszt');
  });
});
