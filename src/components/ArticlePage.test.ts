import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';

vi.mock('../data/blog-posts.json', () => ({
  default: [
    {
      slug: 'block-fixture',
      titlePl: 'Tytuł', titleEn: 'Title', titleRu: 'Заголовок',
      summaryPl: 's', summaryEn: 's', summaryRu: 's',
      date: '2026-07-25',
      tags: ['AI'],
      bodyPl: 'Akapit.\n\n[[table:fixture-table]]',
      bodyEn: 'Paragraph.\n\n[[table:fixture-table]]',
      bodyRu: 'Абзац.\n\n[[table:fixture-table]]\n\n[[table:missing-table]]',
    },
  ],
}));

vi.mock('../data/article-tables', () => ({
  articleTables: {
    'fixture-table': {
      ru: { headers: ['Вход', 'Значение'], rows: [['Шагов на задачу', '8']] },
      en: { headers: ['Input', 'Value'], rows: [['Steps per task', '8']] },
      pl: { headers: ['Wejście', 'Wartość'], rows: [['Kroków na zadanie', '8']] },
    },
  },
}));

const ArticlePage = (await import('./ArticlePage.svelte')).default;

beforeAll(() => {
  loadTranslations({
    pl: plTranslations as Record<string, any>,
    en: enTranslations as Record<string, any>,
    ru: ruTranslations as Record<string, any>,
  });
});

describe('ArticlePage table block', () => {
  it('renders headers and rows in the active language', () => {
    languageStore.set('pl');
    const { getByText } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    expect(getByText('Wejście')).toBeTruthy();
    expect(getByText('Kroków na zadanie')).toBeTruthy();
  });

  it('renders the table as a real table with column headers', () => {
    languageStore.set('en');
    const { getByRole } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    const table = getByRole('table');
    expect(table.querySelectorAll('thead th[scope="col"]').length).toBe(2);
    expect(table.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('skips an unknown table id instead of rendering the raw marker', () => {
    languageStore.set('ru');
    const { queryByText, getByText } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    expect(getByText('Вход')).toBeTruthy();
    expect(queryByText('[[table:missing-table]]')).toBeNull();
  });

  it('keeps plain paragraphs untouched', () => {
    languageStore.set('ru');
    const { getByText } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    expect(getByText('Абзац.')).toBeTruthy();
  });
});
