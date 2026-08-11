import { describe, it, expect } from 'vitest';
import { collectTags, rankTagsByCount, filterByTag, getTagFromQuery, buildTagQuery } from './blogTagFilter';

const POSTS = [
  { tags: ['AI', 'Java'] },
  { tags: ['AI', 'Accounting'] },
  { tags: ['QA', 'Automation'] },
];

describe('collectTags()', () => {
  it('returns unique tags, alphabetically sorted', () => {
    expect(collectTags(POSTS)).toEqual(['Accounting', 'AI', 'Automation', 'Java', 'QA']);
  });

  it('returns an empty array for no posts', () => {
    expect(collectTags([])).toEqual([]);
  });
});

describe('rankTagsByCount()', () => {
  it('puts the most-used tag first', () => {
    expect(rankTagsByCount(POSTS)[0]).toBe('AI');
  });

  it('breaks ties alphabetically, so the prerendered bar is stable across builds', () => {
    // Everything except AI (2 posts) appears once, so the rest must come through sorted.
    expect(rankTagsByCount(POSTS)).toEqual(['AI', 'Accounting', 'Automation', 'Java', 'QA']);
  });

  it('counts a tag once even if a post repeats it', () => {
    expect(rankTagsByCount([{ tags: ['AI', 'AI', 'AI'] }, { tags: ['QA'] }, { tags: ['QA'] }]))
      .toEqual(['QA', 'AI']);
  });

  it('returns the same tags as collectTags, only in a different order', () => {
    expect([...rankTagsByCount(POSTS)].sort()).toEqual([...collectTags(POSTS)].sort());
  });

  it('returns an empty array for no posts', () => {
    expect(rankTagsByCount([])).toEqual([]);
  });
});

describe('filterByTag()', () => {
  it('returns all posts unchanged when tag is null', () => {
    expect(filterByTag(POSTS, null)).toBe(POSTS);
  });

  it('returns only posts containing the given tag', () => {
    expect(filterByTag(POSTS, 'AI')).toEqual([POSTS[0], POSTS[1]]);
  });

  it('returns an empty array when no post has the tag', () => {
    expect(filterByTag(POSTS, 'Nope')).toEqual([]);
  });
});

describe('getTagFromQuery()', () => {
  const validTags = ['AI', 'QA'];

  it('returns the tag when present and valid', () => {
    expect(getTagFromQuery('?tag=AI', validTags)).toBe('AI');
  });

  it('returns null when the tag key is missing', () => {
    expect(getTagFromQuery('', validTags)).toBeNull();
  });

  it('returns null for an unknown/stale tag', () => {
    expect(getTagFromQuery('?tag=Nope', validTags)).toBeNull();
  });

  it('ignores unrelated params', () => {
    expect(getTagFromQuery('?utm_source=newsletter&tag=QA', validTags)).toBe('QA');
  });
});

describe('buildTagQuery()', () => {
  it('adds the tag key to an empty query string', () => {
    expect(buildTagQuery('', 'AI')).toBe('?tag=AI');
  });

  it('removes the tag key when tag is null', () => {
    expect(buildTagQuery('?tag=AI', null)).toBe('');
  });

  it('overwrites an existing tag value', () => {
    expect(buildTagQuery('?tag=AI', 'QA')).toBe('?tag=QA');
  });

  it('preserves unrelated params when adding a tag', () => {
    expect(buildTagQuery('?utm_source=newsletter', 'AI')).toBe('?utm_source=newsletter&tag=AI');
  });

  it('preserves unrelated params when clearing the tag', () => {
    expect(buildTagQuery('?utm_source=newsletter&tag=AI', null)).toBe('?utm_source=newsletter');
  });

  it('returns an empty string when clearing leaves no params', () => {
    expect(buildTagQuery('?tag=AI', null)).toBe('');
  });
});
