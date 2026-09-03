import { describe, it, expect } from 'vitest';
import glossary from './glossary.json';
import { annotateGlossary, type GlossaryEntry } from '../services/glossaryTerms';

const entries = glossary as GlossaryEntry[];

// The glossary page renders every entry, and article prose is annotated from the same
// data, so a malformed entry is either an empty definition on a public page or a term
// that silently never gets a tooltip. Both are invisible without these checks.
describe('glossary.json integrity', () => {
  it('gives every entry all three definitions', () => {
    const incomplete = entries.filter(
      (e) => !e.definitionPl?.trim() || !e.definitionEn?.trim() || !e.definitionRu?.trim()
    );
    expect(incomplete.map((e) => e.id)).toEqual([]);
  });

  it('gives every entry at least one surface form', () => {
    expect(entries.filter((e) => e.terms.length === 0).map((e) => e.id)).toEqual([]);
  });

  it('uses each id once', () => {
    const ids = entries.map((e) => e.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it('never lets two entries claim the same surface form', () => {
    const owner = new Map<string, string>();
    const clashes: string[] = [];
    for (const entry of entries) {
      for (const form of entry.terms) {
        const previous = owner.get(form);
        if (previous && previous !== entry.id) clashes.push(`${form}: ${previous} vs ${entry.id}`);
        owner.set(form, entry.id);
      }
    }
    expect(clashes).toEqual([]);
  });

  // A form ending in a non-letter (e.g. "FA(3)") can never be tagged, because the
  // matcher requires a letter boundary. Such a form is legitimate as terms[0], which the
  // page uses as the heading — but then some other form has to do the matching, or the
  // entry is decoration that no article can ever link to.
  it('leaves every entry with at least one form an article can actually tag', () => {
    const unreachable = entries
      .filter((entry) => {
        return !entry.terms.some((form) => {
          const parts = annotateGlossary(`ppp ${form} qqq`, [entry], new Set<string>());
          return parts.some((part) => part.termId === entry.id);
        });
      })
      .map((e) => e.id);
    expect(unreachable).toEqual([]);
  });

  it('keeps FA(3) as a display-only heading whose matching is done by the bare form', () => {
    const fa3 = entries.find((e) => e.id === 'fa3');
    expect(fa3?.terms[0]).toBe('FA(3)');
    const parts = annotateGlossary('w formacie FA(3), potem', [fa3!], new Set<string>());
    expect(parts.some((p) => p.termId === 'fa3')).toBe(true);
  });
});

describe('glossary.json coverage of the blog', () => {
  const ids = new Set(entries.map((e) => e.id));

  it.each([
    ['prompt'],
    ['token'],
    ['cache'],
    ['chunk'],
    ['agent'],
    ['pipeline'],
    ['orchestration'],
    ['embedding'],
    ['hallucination'],
  ])('defines the AI concept %s', (id) => {
    expect(ids.has(id)).toBe(true);
  });

  it.each([['api'], ['sql'], ['erp'], ['ocr']])('defines the technical term %s', (id) => {
    expect(ids.has(id)).toBe(true);
  });

  it.each([['seo'], ['geo'], ['ctr']])('defines the search/marketing term %s', (id) => {
    expect(ids.has(id)).toBe(true);
  });

  it.each([
    ['feng'],
    ['kpo'],
    ['parp'],
    ['arp'],
    ['ncbr'],
    ['edih'],
    ['gpai'],
    ['upo'],
    ['fa3'],
    ['sme'],
  ])('defines the regulatory/funding term %s', (id) => {
    expect(ids.has(id)).toBe(true);
  });

  it('tags the Polish and Russian spellings of a concept term, not just the English one', () => {
    const prompt = entries.find((e) => e.id === 'prompt')!;
    const cases = ['jeden prompt wystarczy', 'kilka promptów tutaj', 'это промпт тут'];
    for (const text of cases) {
      const parts = annotateGlossary(text, [prompt], new Set<string>());
      expect(parts.some((p) => p.termId === 'prompt')).toBe(true);
    }
  });
});
