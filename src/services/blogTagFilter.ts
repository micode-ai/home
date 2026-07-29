// Client-side filtering of the blog listing by tag, plus the `?tag=` URL round-trip so a
// filtered view is shareable/bookmarkable. Deliberately DOM-independent beyond the standard
// `URLSearchParams` global — `BlogListing.svelte` owns all `window.location`/`history` access,
// mirroring `costEstimateUrl.ts`'s split for the cost calculator.

export type TaggedPost = { tags: string[] };

/** Unique tags across all given posts, alphabetically sorted. */
export function collectTags<T extends TaggedPost>(posts: T[]): string[] {
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}

/** `tag === null` returns `posts` unchanged; otherwise posts whose `tags` includes it. */
export function filterByTag<T extends TaggedPost>(posts: T[], tag: string | null): T[] {
  if (tag === null) return posts;
  return posts.filter((post) => post.tags.includes(tag));
}

/**
 * Reads the `tag` key out of a query string. Returns it only if it's a member of `validTags`;
 * a missing, stale, or hand-edited/unknown tag falls back to `null` (show everything) rather
 * than throwing or filtering to an empty list.
 */
export function getTagFromQuery(search: string, validTags: string[]): string | null {
  const raw = new URLSearchParams(search).get('tag');
  return raw !== null && validTags.includes(raw) ? raw : null;
}

/**
 * Sets or deletes the `tag` key (deletes when `tag` is `null`) on a copy of `search`'s params,
 * returning the resulting query string (with leading `?`, or `''` if no params remain). Any
 * other existing param (UTM, etc.) is preserved untouched.
 */
export function buildTagQuery(search: string, tag: string | null): string {
  const params = new URLSearchParams(search);
  if (tag === null) params.delete('tag');
  else params.set('tag', tag);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
