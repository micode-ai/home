import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { loadTranslations, t } from './i18n';

const testTranslations = {
  pl: {
    hero: {
      headline: 'Nagłówek',
      cta: 'Kliknij',
    },
    simple: 'Prosta wartość',
    nested: {
      deep: {
        key: 'Zagnieżdżona wartość',
      },
    },
    notString: {
      child: 'ok',
    },
  },
  en: {
    hero: {
      headline: 'Headline',
    },
  },
};

beforeEach(() => {
  loadTranslations(testTranslations);
});

describe('t()', () => {
  it('returns key when language is missing', () => {
    loadTranslations({});
    expect(t('hero.headline', 'pl')).toBe('hero.headline');
  });

  it('returns key when language not loaded at all', () => {
    loadTranslations({});
    expect(t('any.key', 'fr')).toBe('any.key');
  });

  it('resolves a top-level key', () => {
    expect(t('simple', 'pl')).toBe('Prosta wartość');
  });

  it('resolves a two-level nested key', () => {
    expect(t('hero.headline', 'pl')).toBe('Nagłówek');
  });

  it('resolves a deeply nested key', () => {
    expect(t('nested.deep.key', 'pl')).toBe('Zagnieżdżona wartość');
  });

  it('returns key when intermediate segment is missing', () => {
    expect(t('hero.missing.key', 'pl')).toBe('hero.missing.key');
  });

  it('returns key when final segment is missing', () => {
    expect(t('hero.nonexistent', 'pl')).toBe('hero.nonexistent');
  });

  it('returns key when value is an object, not a string', () => {
    expect(t('notString', 'pl')).toBe('notString');
  });

  it('returns key when value is an object mid-path', () => {
    expect(t('nested.deep', 'pl')).toBe('nested.deep');
  });

  it('works across different languages', () => {
    expect(t('hero.headline', 'en')).toBe('Headline');
    expect(t('hero.headline', 'pl')).toBe('Nagłówek');
  });

  it('property: always returns a string', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.constantFrom('pl', 'en', 'fr'),
        (key, lang) => {
          const result = t(key, lang);
          return typeof result === 'string';
        }
      )
    );
  });

  it('property: returns the key itself when translation is missing', () => {
    loadTranslations({});
    fc.assert(
      fc.property(fc.string(), fc.string(), (key, lang) => {
        return t(key, lang) === key;
      })
    );
  });
});
