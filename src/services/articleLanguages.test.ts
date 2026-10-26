import { describe, it, expect } from 'vitest';
import { availableLanguages, resolveContentLanguage } from './articleLanguages';

const full = { titlePl: 'a', titleEn: 'b', titleRu: 'c', bodyPl: 'x', bodyEn: 'y', bodyRu: 'z' };

describe('availableLanguages', () => {
  it('returns all locales for a fully translated post', () => {
    expect(availableLanguages(full)).toEqual(['pl', 'en', 'ru']);
  });
  it('omits locales with a missing or blank body or title', () => {
    expect(availableLanguages({ ...full, bodyEn: '  ', titleRu: '' })).toEqual(['pl']);
    const { bodyRu, ...noRu } = full;
    expect(availableLanguages(noRu)).toEqual(['pl', 'en']);
  });
});

describe('resolveContentLanguage', () => {
  it('keeps the requested language when available', () => {
    expect(resolveContentLanguage(full, 'ru')).toBe('ru');
  });
  it('falls back to the first available language', () => {
    expect(resolveContentLanguage({ ...full, bodyPl: '' }, 'pl')).toBe('en');
  });
  it('returns the requested language when nothing is available', () => {
    expect(resolveContentLanguage({}, 'en')).toBe('en');
  });
});
