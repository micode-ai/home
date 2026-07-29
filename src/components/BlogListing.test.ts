import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';

vi.mock('../data/blog-posts.json', () => ({
  default: [
    {
      slug: 'post-ai-java',
      titlePl: 'AI i Java', titleEn: 'AI and Java', titleRu: 'AI и Java',
      summaryPl: 's', summaryEn: 's', summaryRu: 's',
      date: '2026-01-01',
      tags: ['AI', 'Java'],
      bodyPl: 'Akapit.', bodyEn: 'Paragraph.', bodyRu: 'Абзац.',
    },
    {
      slug: 'post-ai-accounting',
      titlePl: 'AI w księgowości', titleEn: 'AI in Accounting', titleRu: 'AI в бухгалтерии',
      summaryPl: 's', summaryEn: 's', summaryRu: 's',
      date: '2026-01-02',
      tags: ['AI', 'Accounting'],
      bodyPl: 'Akapit.', bodyEn: 'Paragraph.', bodyRu: 'Абзац.',
    },
    {
      slug: 'post-qa',
      titlePl: 'Testy QA', titleEn: 'QA Testing', titleRu: 'QA тесты',
      summaryPl: 's', summaryEn: 's', summaryRu: 's',
      date: '2026-01-03',
      tags: ['QA'],
      bodyPl: 'Akapit.', bodyEn: 'Paragraph.', bodyRu: 'Абзац.',
    },
  ],
}));

const BlogListing = (await import('./BlogListing.svelte')).default;

beforeAll(() => {
  loadTranslations({
    pl: plTranslations as Record<string, any>,
    en: enTranslations as Record<string, any>,
    ru: ruTranslations as Record<string, any>,
  });
});

beforeEach(() => {
  window.history.replaceState(null, '', '/blog/');
  languageStore.set('en');
});

describe('BlogListing tag filter', () => {
  it('shows every post and the full tag set with no filter active', () => {
    const { getByText, getAllByText } = render(BlogListing);
    expect(getByText('3 posts')).toBeTruthy();
    expect(getAllByText('AI').length).toBeGreaterThan(0);
    expect(getAllByText('Accounting').length).toBeGreaterThan(0);
    expect(getAllByText('QA').length).toBeGreaterThan(0);
  });

  // Every tag chip/badge carries `aria-label="Filter by <tag>"`, which becomes its accessible
  // name (overriding the visible text) — so queries target that label, not the bare tag text.
  // The tag also appears both as a filter-bar chip and as a badge on each matching post card, so
  // `getByRole` alone is ambiguous; the filter bar renders first in the DOM, so
  // `getAllByRole(...)[0]` reliably targets its chip (behavior is identical either way — both
  // call the same toggleTag()).

  it('filters to matching posts when a filter-bar chip is clicked', async () => {
    const { getAllByRole, queryByText } = render(BlogListing);
    await fireEvent.click(getAllByRole('button', { name: 'Filter by QA' })[0]);
    expect(queryByText('QA Testing')).toBeTruthy();
    expect(queryByText('AI and Java')).toBeNull();
    expect(queryByText('AI in Accounting')).toBeNull();
    expect(queryByText('1 posts')).toBeTruthy();
  });

  it('marks the active chip as pressed', async () => {
    const { getAllByRole } = render(BlogListing);
    const aiChip = getAllByRole('button', { name: 'Filter by AI' })[0];
    expect(aiChip.getAttribute('aria-pressed')).toBe('false');
    await fireEvent.click(aiChip);
    expect(aiChip.getAttribute('aria-pressed')).toBe('true');
  });

  it('clicking the active tag again clears the filter', async () => {
    const { getAllByRole, getByText } = render(BlogListing);
    const qaChip = getAllByRole('button', { name: 'Filter by QA' })[0];
    await fireEvent.click(qaChip);
    expect(getByText('1 posts')).toBeTruthy();
    await fireEvent.click(qaChip);
    expect(getByText('3 posts')).toBeTruthy();
    expect(qaChip.getAttribute('aria-pressed')).toBe('false');
  });

  it('the "All" chip clears an active filter', async () => {
    const { getAllByRole, getByRole, getByText } = render(BlogListing);
    await fireEvent.click(getAllByRole('button', { name: 'Filter by QA' })[0]);
    expect(getByText('1 posts')).toBeTruthy();
    await fireEvent.click(getByRole('button', { name: 'All' }));
    expect(getByText('3 posts')).toBeTruthy();
  });

  it('clicking a tag badge on a post card also filters', async () => {
    const { getAllByRole, getByText } = render(BlogListing);
    const accountingButtons = getAllByRole('button', { name: 'Filter by Accounting' });
    // index 0 is the filter-bar chip; index 1 is the badge on the "AI in Accounting" post card.
    await fireEvent.click(accountingButtons[1]);
    expect(getByText('1 posts')).toBeTruthy();
    expect(getByText('AI in Accounting')).toBeTruthy();
  });

  it('reflects the active tag in the URL as ?tag=', async () => {
    const { getAllByRole } = render(BlogListing);
    const aiChip = getAllByRole('button', { name: 'Filter by AI' })[0];
    await fireEvent.click(aiChip);
    expect(window.location.search).toBe('?tag=AI');
    await fireEvent.click(aiChip);
    expect(window.location.search).toBe('');
  });

  it('preserves unrelated query params when setting the tag', async () => {
    window.history.replaceState(null, '', '/blog/?utm_source=newsletter');
    const { getAllByRole } = render(BlogListing);
    await fireEvent.click(getAllByRole('button', { name: 'Filter by QA' })[0]);
    expect(window.location.search).toBe('?utm_source=newsletter&tag=QA');
  });

  it('restores the active tag from the URL on mount', () => {
    window.history.replaceState(null, '', '/blog/?tag=Accounting');
    const { getByText, queryByText } = render(BlogListing);
    expect(getByText('AI in Accounting')).toBeTruthy();
    expect(queryByText('QA Testing')).toBeNull();
    expect(getByText('1 posts')).toBeTruthy();
  });

  it('ignores an unknown tag in the URL and shows everything', () => {
    window.history.replaceState(null, '', '/blog/?tag=Nope');
    const { getByText } = render(BlogListing);
    expect(getByText('3 posts')).toBeTruthy();
  });
});
