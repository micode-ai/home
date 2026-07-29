// Table-of-contents id derivation for a blog post's `## heading` blocks. Pure derived value — no
// new data fields; see docs/contracts/blog-article-table-of-contents.md.

export type TocHeading = { text: string; id: string };

const DIACRITICS_RE = /[\u0300-\u036f]/g;
const NON_SLUG_RE = /[^a-z0-9]+/g;
const EDGE_DASH_RE = /^-+|-+$/g;

function baseSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(DIACRITICS_RE, '')
    .replace(NON_SLUG_RE, '-')
    .replace(EDGE_DASH_RE, '');
}

/**
 * Builds `{ text, id }` entries for an ordered list of h2 heading texts. A heading with no
 * Latin/digit characters left after slugifying (e.g. an all-Cyrillic Russian heading) falls back
 * to `section-{n}` (1-based position); any resulting collision with an earlier entry is
 * disambiguated with a `-2`, `-3`, ... suffix, so ids are always unique within one call.
 */
export function buildToc(headings: string[]): TocHeading[] {
  const seen = new Map<string, number>();
  return headings.map((text, i) => {
    const base = baseSlug(text) || `section-${i + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count + 1}`;
    return { text, id };
  });
}
