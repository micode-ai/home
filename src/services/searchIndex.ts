/**
 * Site-wide quick search — pure matching/grouping over a pre-built index.
 * See docs/contracts/site-wide-quick-search.md.
 */

export type SearchEntryType = 'product' | 'blog' | 'glossary';

export interface SearchEntry {
  type: SearchEntryType;
  id: string;
  title: string;
  summary: string;
  tags: string[];
  url: string;
}

export interface GroupedSearchResults {
  products: SearchEntry[];
  blog: SearchEntry[];
  glossary: SearchEntry[];
}

const DEFAULT_LIMIT_PER_GROUP = 5;

/** Lowercase + strip diacritics, so "regon" matches "REGON" and a plain-ASCII
 * query still matches accented PL/RU copy. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function scoreEntry(entry: SearchEntry, normalizedQuery: string): number {
  if (normalize(entry.title).includes(normalizedQuery)) return 3;
  if (entry.tags.some(tag => normalize(tag).includes(normalizedQuery))) return 2;
  if (normalize(entry.summary).includes(normalizedQuery)) return 1;
  return 0;
}

function rankGroup(entries: SearchEntry[], normalizedQuery: string, limit: number): SearchEntry[] {
  return entries
    .map((entry, index) => ({ entry, index, score: scoreEntry(entry, normalizedQuery) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ entry }) => entry);
}

/**
 * Groups entries by type and ranks each group independently (title > tag >
 * summary match), so a strong hit in one group never crowds out another.
 * An empty/whitespace-only query returns all three groups empty.
 */
export function matchSearchEntries(
  entries: SearchEntry[],
  query: string,
  limitPerGroup: number = DEFAULT_LIMIT_PER_GROUP
): GroupedSearchResults {
  const trimmed = query.trim();
  if (trimmed === '') {
    return { products: [], blog: [], glossary: [] };
  }

  const normalizedQuery = normalize(trimmed);
  const byType = (type: SearchEntryType) => entries.filter(entry => entry.type === type);

  return {
    products: rankGroup(byType('product'), normalizedQuery, limitPerGroup),
    blog: rankGroup(byType('blog'), normalizedQuery, limitPerGroup),
    glossary: rankGroup(byType('glossary'), normalizedQuery, limitPerGroup),
  };
}

/** Flattens grouped results in display order (Products, Blog, Glossary) — used
 * for keyboard up/down navigation across the whole result list. */
export function flattenGroupedResults(results: GroupedSearchResults): SearchEntry[] {
  return [...results.products, ...results.blog, ...results.glossary];
}
