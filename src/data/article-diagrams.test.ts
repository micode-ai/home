import { describe, it, expect, beforeAll } from 'vitest';
import mermaid from 'mermaid';
import { articleDiagrams } from './article-diagrams';

// Mermaid parses diagram text at runtime in the browser (MermaidDiagram.svelte calls
// mermaid.run()). A syntax error only surfaces on the live page, so we validate every
// embedded definition — in every language — against the same mermaid version the app bundles.
beforeAll(() => {
  mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
});

const LANGS = ['ru', 'en', 'pl'] as const;

describe('articleDiagrams', () => {
  const ids = Object.keys(articleDiagrams);

  it('has diagrams registered', () => {
    expect(ids.length).toBeGreaterThan(0);
  });

  it('every diagram defines all three languages', () => {
    for (const id of ids) {
      for (const lang of LANGS) {
        expect((articleDiagrams as any)[id][lang], `${id}.${lang}`).toBeTruthy();
      }
    }
  });

  const cases = ids.flatMap((id) => LANGS.map((lang) => ({ id, lang })));
  it.each(cases)('diagram "$id" ($lang) parses as valid mermaid', async ({ id, lang }) => {
    const result = await mermaid.parse((articleDiagrams as any)[id][lang]);
    expect(result).toBeTruthy();
  });
});
