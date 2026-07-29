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
    {
      slug: 'short-fixture',
      titlePl: 'Krótki', titleEn: 'Short', titleRu: 'Короткий',
      summaryPl: 's', summaryEn: 's', summaryRu: 's',
      date: '2026-07-18',
      tags: ['AI'],
      bodyPl: 'Akapit.\n\n## Jedna sekcja\n\nWięcej.',
      bodyEn: 'Paragraph.\n\n## One section\n\nMore.',
      bodyRu: 'Абзац.\n\n## Один раздел\n\nЕще.',
    },
    {
      slug: 'long-fixture',
      titlePl: 'Długi', titleEn: 'Long', titleRu: 'Длинный',
      summaryPl: 's', summaryEn: 's', summaryRu: 's',
      date: '2026-07-19',
      tags: ['AI'],
      bodyPl: 'Wstęp.\n\n## Pierwsza\n\nA.\n\n## Druga\n\nB.\n\n## Trzecia\n\nC.',
      bodyEn: 'Intro.\n\n## First section\n\nA.\n\n## Second section\n\nB.\n\n## Third section\n\nC.',
      bodyRu: 'Введение.\n\n## Первый\n\nA.\n\n## Второй\n\nB.\n\n## Третий\n\nC.',
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

describe('ArticlePage table of contents', () => {
  it('hides the TOC on an article with fewer than 3 h2 sections', () => {
    languageStore.set('en');
    const { queryByText } = render(ArticlePage, { props: { slug: 'short-fixture' } });
    expect(queryByText('On this page')).toBeNull();
  });

  it('shows the TOC on an article with 3 or more h2 sections, one link per heading', () => {
    languageStore.set('en');
    const { getByText, getAllByRole } = render(ArticlePage, { props: { slug: 'long-fixture' } });
    expect(getByText('On this page')).toBeTruthy();
    const links = getAllByRole('link', { name: /First section|Second section|Third section/ });
    expect(links).toHaveLength(3);
  });

  it('links each TOC entry to its heading via a matching #id anchor', () => {
    languageStore.set('en');
    const { getByRole } = render(ArticlePage, { props: { slug: 'long-fixture' } });
    const link = getByRole('link', { name: 'Second section' });
    const href = link.getAttribute('href');
    expect(href).toMatch(/^#/);
    const heading = document.querySelector(href!);
    expect(heading?.tagName).toBe('H2');
    expect(heading?.textContent).toBe('Second section');
  });

  it('gives an all-Cyrillic heading a stable section-N id instead of an empty one', () => {
    languageStore.set('ru');
    const { getByRole } = render(ArticlePage, { props: { slug: 'long-fixture' } });
    const link = getByRole('link', { name: 'Второй' });
    expect(link.getAttribute('href')).toBe('#section-2');
  });

  it('translates the "On this page" label per locale', () => {
    languageStore.set('pl');
    const { getByText } = render(ArticlePage, { props: { slug: 'long-fixture' } });
    expect(getByText('Na tej stronie')).toBeTruthy();
  });
});
