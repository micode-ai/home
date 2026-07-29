export type TaggedPost = { slug: string; tags: string[] };

/**
 * `posts` must already be filtered to published posts and sorted newest-first; ties in score
 * keep that input order (stable sort), so equal-score candidates resolve to most-recent-first.
 */
export function getRelatedPosts<T extends TaggedPost>(posts: T[], current: T, limit = 3): T[] {
  const others = posts.filter((p) => p.slug !== current.slug);

  const scored = others.map((post) => ({
    post,
    score: post.tags.filter((tag) => current.tags.includes(tag)).length,
  }));
  const withOverlap = scored.filter((s) => s.score > 0);

  if (withOverlap.length > 0) {
    withOverlap.sort((a, b) => b.score - a.score);
    return withOverlap.slice(0, limit).map((s) => s.post);
  }

  return others.slice(0, limit);
}
