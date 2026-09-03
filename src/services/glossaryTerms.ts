// First-occurrence glossary-term annotation for blog article prose. Pure function, no
// Svelte/DOM dependency — same shape as `articleToc.ts` / `readingTime.ts`. See
// docs/contracts/blog-jargon-glossary-tooltips.md.

export type GlossaryEntry = {
  id: string;
  terms: string[];
  definitionPl: string;
  definitionEn: string;
  definitionRu: string;
};

export type GlossaryPart = { text: string; termId?: string };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits `text` into plain/glossary-tagged parts. `seen` is caller-owned and mutated in place:
 * an entry already in `seen` is never matched (repeat occurrence stays plain text), and the
 * moment an entry is matched here its id is added to `seen` so later calls sharing the same
 * `Set` (i.e. later segments of the same article render) skip it too. Matching is case-sensitive
 * and whole-word — see the contract for why (avoids matching "RAG" inside "paragraph", and
 * avoids matching "GPT" inside "ChatGPT" while still matching it inside "GPT-4").
 */
export function annotateGlossary(
  text: string,
  glossary: GlossaryEntry[],
  seen: Set<string>
): GlossaryPart[] {
  const candidates = glossary.filter((entry) => !seen.has(entry.id));
  if (!text || candidates.length === 0) return [{ text }];

  const alts: { id: string; form: string }[] = [];
  for (const entry of candidates) {
    for (const form of entry.terms) alts.push({ id: entry.id, form });
  }
  // Longest form first, so a future overlapping alias (one term's surface form being a substring
  // of another's) resolves to the longer, more specific match at a shared start position.
  alts.sort((a, b) => b.form.length - a.form.length);
  const pattern = alts.map((alt) => escapeRegExp(alt.form)).join('|');
  // Unicode-aware word boundaries, not `\b`. A JS `\b` is defined over `\w`, i.e. ASCII only,
  // so it sees a boundary next to every Polish diacritic and every Cyrillic letter: it would
  // both refuse `промпт` in Russian prose and happily tag `środowisko` inside
  // `mikrośrodowisko`. These lookarounds keep the documented behaviour for ASCII forms —
  // `GPT` still matches in `GPT-4` (a hyphen is neither letter nor digit) and still does not
  // match in `ChatGPT` — while treating non-ASCII letters as the letters they are.
  const re = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${pattern})(?![\\p{L}\\p{N}_])`, 'gu');

  const parts: GlossaryPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(re)) {
    const start = match.index ?? 0;
    const alt = alts.find((a) => a.form === match[0]);
    if (!alt || seen.has(alt.id)) continue;
    if (start > cursor) parts.push({ text: text.slice(cursor, start) });
    parts.push({ text: match[0], termId: alt.id });
    seen.add(alt.id);
    cursor = start + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts.length > 0 ? parts : [{ text }];
}
