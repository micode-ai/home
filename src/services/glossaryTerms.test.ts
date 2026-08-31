import { describe, it, expect } from 'vitest';
import { annotateGlossary, type GlossaryEntry } from './glossaryTerms';

const RAG: GlossaryEntry = {
  id: 'rag',
  terms: ['RAG'],
  definitionPl: 'pl',
  definitionEn: 'en',
  definitionRu: 'ru',
};
const GPT: GlossaryEntry = {
  id: 'gpt',
  terms: ['GPT'],
  definitionPl: 'pl',
  definitionEn: 'en',
  definitionRu: 'ru',
};

describe('annotateGlossary()', () => {
  it('tags a matched term and preserves surrounding plain text', () => {
    const seen = new Set<string>();
    expect(annotateGlossary('We use RAG here.', [RAG], seen)).toEqual([
      { text: 'We use ' },
      { text: 'RAG', termId: 'rag' },
      { text: ' here.' },
    ]);
  });

  it('adds the matched id to the caller-owned seen set', () => {
    const seen = new Set<string>();
    annotateGlossary('RAG', [RAG], seen);
    expect(seen.has('rag')).toBe(true);
  });

  it('does not re-match a term already in seen', () => {
    const seen = new Set<string>(['rag']);
    expect(annotateGlossary('RAG again', [RAG], seen)).toEqual([{ text: 'RAG again' }]);
  });

  it('only tags the first of two occurrences in the same call', () => {
    const seen = new Set<string>();
    expect(annotateGlossary('RAG and more RAG', [RAG], seen)).toEqual([
      { text: 'RAG', termId: 'rag' },
      { text: ' and more RAG' },
    ]);
  });

  it('is case-sensitive, so a lowercase substring inside an ordinary word is not matched', () => {
    const seen = new Set<string>();
    expect(annotateGlossary('a paragraph about it', [RAG], seen)).toEqual([
      { text: 'a paragraph about it' },
    ]);
  });

  it('matches GPT inside a hyphenated version like GPT-4', () => {
    const seen = new Set<string>();
    expect(annotateGlossary('costs less with GPT-4 today', [GPT], seen)).toEqual([
      { text: 'costs less with ' },
      { text: 'GPT', termId: 'gpt' },
      { text: '-4 today' },
    ]);
  });

  it('does not match GPT glued onto a product name like ChatGPT', () => {
    const seen = new Set<string>();
    expect(annotateGlossary('powered by ChatGPT', [GPT], seen)).toEqual([
      { text: 'powered by ChatGPT' },
    ]);
  });

  it('tags multiple distinct terms in the same text', () => {
    const seen = new Set<string>();
    expect(annotateGlossary('RAG plus GPT together', [RAG, GPT], seen)).toEqual([
      { text: 'RAG', termId: 'rag' },
      { text: ' plus ' },
      { text: 'GPT', termId: 'gpt' },
      { text: ' together' },
    ]);
  });

  it('returns the text unchanged when there is no match', () => {
    const seen = new Set<string>();
    expect(annotateGlossary('nothing to see here', [RAG], seen)).toEqual([
      { text: 'nothing to see here' },
    ]);
  });

  it('returns the text unchanged for empty input', () => {
    const seen = new Set<string>();
    expect(annotateGlossary('', [RAG], seen)).toEqual([{ text: '' }]);
  });
});
