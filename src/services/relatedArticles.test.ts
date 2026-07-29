import { describe, it, expect } from 'vitest';
import { getRelatedPosts } from './relatedArticles';

// Newest-first, as `ArticlePage.svelte`'s `publishedPosts` derivation guarantees.
const POSTS = [
  { slug: 'newest-ai-qa', tags: ['AI', 'QA'] },
  { slug: 'mid-ai-only', tags: ['AI'] },
  { slug: 'older-ai-qa', tags: ['AI', 'QA'] },
  { slug: 'oldest-mobile', tags: ['Mobile'] },
];

describe('getRelatedPosts()', () => {
  it('excludes the current post', () => {
    const current = POSTS[0];
    const result = getRelatedPosts(POSTS, current);
    expect(result.some((p) => p.slug === current.slug)).toBe(false);
  });

  it('ranks higher tag-overlap first', () => {
    const current = POSTS[0]; // ['AI', 'QA']
    const result = getRelatedPosts(POSTS, current);
    // 'older-ai-qa' shares 2 tags, 'mid-ai-only' shares 1 — overlap winner comes first.
    expect(result[0].slug).toBe('older-ai-qa');
  });

  it('breaks score ties by preserving input (newest-first) order', () => {
    const current = { slug: 'current', tags: ['AI', 'QA'] };
    const posts = [
      { slug: 'newer', tags: ['AI'] },
      { slug: 'older', tags: ['AI'] },
    ];
    expect(getRelatedPosts(posts, current).map((p) => p.slug)).toEqual(['newer', 'older']);
  });

  it('falls back to most-recent-other-posts when there is zero tag overlap', () => {
    const current = { slug: 'no-overlap', tags: ['Nope'] };
    const result = getRelatedPosts(POSTS, current, 3);
    expect(result.map((p) => p.slug)).toEqual(['newest-ai-qa', 'mid-ai-only', 'older-ai-qa']);
  });

  it('caps results at the given limit', () => {
    const current = POSTS[0];
    expect(getRelatedPosts(POSTS, current, 1)).toHaveLength(1);
  });

  it('defaults the limit to 3', () => {
    const current = POSTS[0];
    expect(getRelatedPosts(POSTS, current).length).toBeLessThanOrEqual(3);
  });

  it('returns an empty array when no other posts exist', () => {
    const current = POSTS[0];
    expect(getRelatedPosts([current], current)).toEqual([]);
  });

  it('excludes the current post even if not present in the pool by reference', () => {
    const current = { slug: 'newest-ai-qa', tags: ['AI', 'QA'] };
    const result = getRelatedPosts(POSTS, current);
    expect(result.some((p) => p.slug === 'newest-ai-qa')).toBe(false);
  });
});
