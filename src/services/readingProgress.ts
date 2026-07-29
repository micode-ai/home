// Reading-progress percentage for the article-progress bar. Pure derived value — no new data
// fields, no DOM access here; see docs/contracts/blog-reading-progress-bar.md.

/**
 * Given the article body element's `getBoundingClientRect().top`/`.height` and the current
 * `window.innerHeight`, returns how far through the article the reader has scrolled, as a
 * percentage clamped to `[0, 100]`.
 */
export function computeReadingProgress(
  articleTop: number,
  articleHeight: number,
  viewportHeight: number
): number {
  const scrollable = articleHeight - viewportHeight;
  if (scrollable <= 0) return 100;

  const scrolled = Math.min(Math.max(-articleTop, 0), scrollable);
  return Math.min(100, Math.max(0, (scrolled / scrollable) * 100));
}
