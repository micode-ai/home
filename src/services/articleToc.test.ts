import { describe, it, expect } from 'vitest';
import { buildToc } from './articleToc';

describe('buildToc()', () => {
  it('slugifies plain English headings', () => {
    expect(buildToc(['How much does GPT-5 cost?'])).toEqual([
      { text: 'How much does GPT-5 cost?', id: 'how-much-does-gpt-5-cost' },
    ]);
  });

  it('strips Polish diacritics instead of dropping the whole word', () => {
    const [{ id }] = buildToc(['Wdrożenie w mniej niż tydzień']);
    expect(id).toBe('wdrozenie-w-mniej-niz-tydzien');
  });

  it('falls back to section-N for an all-Cyrillic heading', () => {
    const result = buildToc(['Сколько стоит агент в месяц', 'Итоговая модель затрат']);
    expect(result.map((h) => h.id)).toEqual(['section-1', 'section-2']);
  });

  it('disambiguates two headings that slugify to the same base', () => {
    const result = buildToc(['Overview', 'Details', 'Overview']);
    expect(result.map((h) => h.id)).toEqual(['overview', 'details', 'overview-2']);
  });

  it('disambiguates repeated all-Cyrillic fallback collisions the same way', () => {
    const result = buildToc(['Введение', 'Итог']);
    expect(result.map((h) => h.id)).toEqual(['section-1', 'section-2']);
  });

  it('preserves input order and length', () => {
    const headings = ['One', 'Two', 'Three'];
    expect(buildToc(headings).map((h) => h.text)).toEqual(headings);
  });

  it('returns an empty array for empty input', () => {
    expect(buildToc([])).toEqual([]);
  });
});
