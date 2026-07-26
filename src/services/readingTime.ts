// Reading-time estimate for a blog post body. Pure derived value — no new data fields; see
// docs/contracts/blog-reading-time-estimate.md.

/** `[[diagram:id|caption]]`, `[[table:id]]`, `[[widget:id]]` — whole token is dropped, not counted. */
const DIRECTIVE_RE = /\[\[(?:diagram|table|widget):[^\]]*\]\]/gi;

const DEFAULT_WORDS_PER_MINUTE = 200;

/**
 * Estimates reading minutes for one post's body text in one language. Strips authoring markup
 * (directive tokens, `## `/`> ` block markers, `**`/`*` inline markers) before counting words,
 * so the estimate reflects prose actually read, not markup syntax.
 */
export function estimateReadingMinutes(
  bodyText: string,
  wordsPerMinute: number = DEFAULT_WORDS_PER_MINUTE
): number {
  const stripped = (bodyText ?? '')
    .replace(DIRECTIVE_RE, ' ')
    .replace(/^[ \t]*##[ \t]+/gm, '')
    .replace(/^[ \t]*>[ \t]?/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '');

  const words = stripped.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return 1;

  return Math.max(1, Math.round(words.length / wordsPerMinute));
}
