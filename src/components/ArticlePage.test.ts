import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
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
      // Oldest date on purpose: tag-overlap ties resolve newest-first, so this fixture stays
      // out of the other posts' top-3 related lists and leaves those assertions alone.
      slug: 'link-fixture',
      titlePl: 'Linki', titleEn: 'Links', titleRu: 'Ссылки',
      summaryPl: 's', summaryEn: 's', summaryRu: 's',
      date: '2026-07-01',
      tags: ['AI'],
      bodyPl: 'Zobacz [rozporządzenie](https://eur-lex.europa.eu/eli/reg/2026/1744/oj).',
      bodyEn:
        'Read the [regulation](https://eur-lex.europa.eu/eli/reg/2026/1744/oj) and **note this**.\n\n> Callout with [the ministry](https://www.gov.pl/web/cyfryzacja).\n\nNot a link: [click](javascript:alert(1)).',
      bodyRu: 'Смотрите [регламент](https://eur-lex.europa.eu/eli/reg/2026/1744/oj).',
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

describe('ArticlePage inline links', () => {
  it('renders [text](url) as an external link opening in a new tab', () => {
    languageStore.set('en');
    const { getByRole } = render(ArticlePage, { props: { slug: 'link-fixture' } });
    const link = getByRole('link', { name: 'regulation' });
    expect(link.getAttribute('href')).toBe('https://eur-lex.europa.eu/eli/reg/2026/1744/oj');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('keeps the surrounding prose and bold in the same paragraph as the link', () => {
    languageStore.set('en');
    const { getByRole } = render(ArticlePage, { props: { slug: 'link-fixture' } });
    const paragraph = getByRole('link', { name: 'regulation' }).closest('p');
    expect(paragraph?.textContent).toBe('Read the regulation and note this.');
    expect(paragraph?.querySelector('strong')?.textContent).toBe('note this');
  });

  it('renders a link inside a callout', () => {
    languageStore.set('en');
    const { container } = render(ArticlePage, { props: { slug: 'link-fixture' } });
    const link = container.querySelector('.article-callout a');
    expect(link?.getAttribute('href')).toBe('https://www.gov.pl/web/cyfryzacja');
  });

  it('leaves a non-http(s) target as plain text instead of a link', () => {
    languageStore.set('en');
    const { queryByRole, getByText } = render(ArticlePage, { props: { slug: 'link-fixture' } });
    expect(queryByRole('link', { name: 'click' })).toBeNull();
    expect(getByText(/Not a link: \[click\]/)).toBeTruthy();
  });

  it('renders a link authored in the Russian body', () => {
    languageStore.set('ru');
    const { getByRole } = render(ArticlePage, { props: { slug: 'link-fixture' } });
    expect(getByRole('link', { name: 'регламент' }).getAttribute('href')).toContain(
      'eli/reg/2026/1744'
    );
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

describe('ArticlePage reading progress bar', () => {
  it('hides the bar on an article with fewer than 3 h2 sections (same gate as the TOC)', () => {
    languageStore.set('en');
    const { container } = render(ArticlePage, { props: { slug: 'short-fixture' } });
    expect(container.querySelector('.reading-progress-bar')).toBeNull();
  });

  it('shows an aria-hidden bar with a width style on an article with 3 or more h2 sections', () => {
    languageStore.set('en');
    const { container } = render(ArticlePage, { props: { slug: 'long-fixture' } });
    const bar = container.querySelector('.reading-progress-bar');
    expect(bar).toBeTruthy();
    expect(bar?.getAttribute('aria-hidden')).toBe('true');
    expect(bar?.getAttribute('style')).toMatch(/width:\s*[\d.]+%/);
  });
});

describe('ArticlePage scroll depth tracking', () => {
  let rectSpy: ReturnType<typeof vi.spyOn> | undefined;

  // jsdom gives every element a zero-sized rect, which reads as "fully scrolled".
  // Stub a tall article body so the thresholds can be crossed deliberately.
  function articleTop(top: number) {
    const rect = {
      top,
      height: 3000,
      bottom: top + 3000,
      left: 0,
      right: 800,
      width: 800,
      x: 0,
      y: top,
      toJSON: () => ({}),
    } as DOMRect;
    if (rectSpy) {
      rectSpy.mockReturnValue(rect);
    } else {
      rectSpy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect);
    }
  }

  function depths() {
    return vi
      .mocked(window.gtag!)
      .mock.calls.filter((call) => call[1] === 'scroll')
      .map((call) => (call[2] as Record<string, unknown>).percent_scrolled);
  }

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cookieConsent', 'accepted');
    window.history.replaceState(null, '', '/blog/long-fixture/');
    languageStore.set('en');
    window.gtag = vi.fn();
    window.mktai = vi.fn();
    articleTop(0);
  });

  afterEach(() => {
    rectSpy?.mockRestore();
    rectSpy = undefined;
  });

  it('sends nothing while the reader is still at the top', () => {
    render(ArticlePage, { props: { slug: 'long-fixture' } });
    expect(depths()).toEqual([]);
  });

  it('reports the 25% threshold once the reader passes it', async () => {
    render(ArticlePage, { props: { slug: 'long-fixture' } });
    articleTop(-600);
    await fireEvent.scroll(window);
    expect(depths()).toEqual([25]);
  });

  it('does not repeat a threshold already reported', async () => {
    render(ArticlePage, { props: { slug: 'long-fixture' } });
    articleTop(-600);
    await fireEvent.scroll(window);
    articleTop(-700);
    await fireEvent.scroll(window);
    expect(depths()).toEqual([25]);
  });

  it('reports every threshold crossed in a single jump to the end', async () => {
    render(ArticlePage, { props: { slug: 'long-fixture' } });
    articleTop(-2232);
    await fireEvent.scroll(window);
    expect(depths()).toEqual([25, 50, 75, 90]);
  });

  it('sends nothing when cookies were not accepted', async () => {
    localStorage.setItem('cookieConsent', 'rejected');
    render(ArticlePage, { props: { slug: 'long-fixture' } });
    articleTop(-2232);
    await fireEvent.scroll(window);
    expect(window.gtag).not.toHaveBeenCalled();
  });
});
