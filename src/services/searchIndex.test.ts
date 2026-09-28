import { describe, it, expect } from 'vitest';
import { matchSearchEntries, flattenGroupedResults, type SearchEntry } from './searchIndex';

function entry(overrides: Partial<SearchEntry>): SearchEntry {
  return {
    type: 'product',
    id: 'x',
    title: '',
    summary: '',
    tags: [],
    url: '/x/',
    ...overrides,
  };
}

describe('matchSearchEntries', () => {
  it('returns all groups empty for an empty or whitespace-only query', () => {
    const entries = [entry({ title: 'Accounting AI' })];
    expect(matchSearchEntries(entries, '')).toEqual({ products: [], blog: [], glossary: [] });
    expect(matchSearchEntries(entries, '   ')).toEqual({ products: [], blog: [], glossary: [] });
  });

  it('matches case-insensitively and ignores diacritics on both sides', () => {
    const entries = [entry({ type: 'glossary', id: 'regon', title: 'REGON' })];
    const results = matchSearchEntries(entries, 'regon');
    expect(results.glossary.map(e => e.id)).toEqual(['regon']);

    const plEntries = [entry({ type: 'glossary', id: 'ksef', title: 'KSeF', summary: 'Krajowy System e-Faktur' })];
    expect(matchSearchEntries(plEntries, 'krajowy').glossary.map(e => e.id)).toEqual(['ksef']);
  });

  it('groups by type independently of match strength across groups', () => {
    const entries = [
      entry({ type: 'product', id: 'p1', title: 'Accounting Agent' }),
      entry({ type: 'blog', id: 'b1', title: 'Unrelated post', summary: 'mentions accounting in passing' }),
      entry({ type: 'glossary', id: 'g1', title: 'REGON', summary: 'unrelated to bookkeeping' }),
    ];
    const results = matchSearchEntries(entries, 'accounting');
    expect(results.products.map(e => e.id)).toEqual(['p1']);
    expect(results.blog.map(e => e.id)).toEqual(['b1']);
    expect(results.glossary).toEqual([]);
  });

  it('ranks title matches above tag matches above summary matches within a group', () => {
    const entries = [
      entry({ type: 'blog', id: 'summary-hit', title: 'Post A', summary: 'about ksef rollout' }),
      entry({ type: 'blog', id: 'title-hit', title: 'KSeF readiness', summary: 'nothing relevant' }),
      entry({ type: 'blog', id: 'tag-hit', title: 'Post B', summary: 'nothing relevant', tags: ['KSeF'] }),
    ];
    const results = matchSearchEntries(entries, 'ksef');
    expect(results.blog.map(e => e.id)).toEqual(['title-hit', 'tag-hit', 'summary-hit']);
  });

  it('keeps original order as a stable tiebreaker for equal scores', () => {
    const entries = [
      entry({ type: 'product', id: 'first', title: 'AI Budget Assistant' }),
      entry({ type: 'product', id: 'second', title: 'AI Testing Agent' }),
    ];
    const results = matchSearchEntries(entries, 'ai');
    expect(results.products.map(e => e.id)).toEqual(['first', 'second']);
  });

  it('truncates each group to limitPerGroup independently', () => {
    const entries = Array.from({ length: 8 }, (_, i) => entry({ type: 'glossary', id: `g${i}`, title: `Term ${i} match` }));
    const results = matchSearchEntries(entries, 'match', 3);
    expect(results.glossary).toHaveLength(3);
  });

  it('excludes entries that match nothing', () => {
    const entries = [entry({ title: 'Accounting AI' })];
    expect(matchSearchEntries(entries, 'zzz-no-match').products).toEqual([]);
  });
});

describe('flattenGroupedResults', () => {
  it('orders products, then blog, then glossary', () => {
    const products = [entry({ type: 'product', id: 'p' })];
    const blog = [entry({ type: 'blog', id: 'b' })];
    const glossary = [entry({ type: 'glossary', id: 'g' })];
    expect(flattenGroupedResults({ products, blog, glossary }).map(e => e.id)).toEqual(['p', 'b', 'g']);
  });
});
