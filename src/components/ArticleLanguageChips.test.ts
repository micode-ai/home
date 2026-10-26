import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';
import ArticleLanguageChips from './ArticleLanguageChips.svelte';

const post = { titlePl: 'a', titleEn: 'b', titleRu: '', bodyPl: 'x', bodyEn: 'y', bodyRu: '' };

beforeAll(() => {
  loadTranslations({
    pl: plTranslations as Record<string, any>,
    en: enTranslations as Record<string, any>,
    ru: ruTranslations as Record<string, any>,
  });
});

describe('ArticleLanguageChips', () => {
  it('marks the current locale, links available ones and flags missing ones', () => {
    render(ArticleLanguageChips, { post, slug: 'demo', lang: 'en' });
    expect(screen.getByText('EN').getAttribute('aria-current')).toBe('true');
    const pl = screen.getByText('PL');
    expect(pl.getAttribute('href')).toBe('/blog/demo/');
    expect(pl.getAttribute('hreflang')).toBe('pl');
    const ru = screen.getByText('RU');
    expect(ru.getAttribute('href')).toBeNull();
    expect(ru.getAttribute('aria-disabled')).toBe('true');
  });

  it('prefixes localized links for non-Polish locales', () => {
    render(ArticleLanguageChips, { post: { ...post, bodyRu: 'z', titleRu: 'c' }, slug: 'demo', lang: 'pl' });
    expect(screen.getByText('EN').getAttribute('href')).toBe('/en/blog/demo/');
    expect(screen.getByText('RU').getAttribute('href')).toBe('/ru/blog/demo/');
  });
});
