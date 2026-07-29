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
      bodyEn: 'Paragraph.\n\n[[table:fixture-table]]\n\n[[widget:cost-calculator]]\n\n[[widget:unknown-widget]]',
      bodyRu: 'Абзац.\n\n[[table:fixture-table]]\n\n[[table:missing-table]]',
    },
    {
      slug: 'related-overlap-fixture',
      titlePl: 'Powiązany', titleEn: 'Related Overlap', titleRu: 'Похожий',
      summaryPl: 'ps', summaryEn: 'Overlap summary', summaryRu: 'рс',
      date: '2026-07-20',
      tags: ['AI', 'QA'],
      bodyPl: 'P.', bodyEn: 'P.', bodyRu: 'P.',
    },
    {
      slug: 'future-fixture',
      titlePl: 'Przyszły', titleEn: 'Future Unpublished', titleRu: 'Будущий',
      summaryPl: 'fs', summaryEn: 'Future summary', summaryRu: 'фс',
      date: '2099-01-01',
      tags: ['AI'],
      bodyPl: 'P.', bodyEn: 'P.', bodyRu: 'P.',
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
    const { getAllByRole } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    const tables = getAllByRole('table');
    const table = tables[0]; // First table is the article table
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

describe('ArticlePage widget block', () => {
  it('mounts the cost calculator', () => {
    languageStore.set('en');
    const { getByText } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    expect(getByText('Run your own numbers')).toBeTruthy();
  });

  it('ignores an unknown widget id instead of printing the marker', () => {
    languageStore.set('en');
    const { queryByText } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    expect(queryByText('[[widget:unknown-widget]]')).toBeNull();
  });
});

describe('ArticlePage related articles', () => {
  it('shows a published, tag-overlapping post with its title, summary, and a link', () => {
    languageStore.set('en');
    const { getByText, getByRole } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    expect(getByText('Related articles')).toBeTruthy();
    expect(getByText('Overlap summary')).toBeTruthy();
    const link = getByRole('link', { name: 'Related Overlap' });
    expect(link.getAttribute('href')).toContain('/blog/related-overlap-fixture/');
  });

  it('never surfaces a future-dated (unpublished) post as a recommendation', () => {
    languageStore.set('en');
    const { queryByText } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    expect(queryByText('Future Unpublished')).toBeNull();
  });

  it('translates the section heading per locale', () => {
    languageStore.set('pl');
    const { getByText } = render(ArticlePage, { props: { slug: 'block-fixture' } });
    expect(getByText('Powiązane artykuły')).toBeTruthy();
  });
});
