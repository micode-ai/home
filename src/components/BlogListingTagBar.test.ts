import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';

// Truncation of the filter bar, which needs more tags than the bar shows — so this is a separate
// module from `BlogListing.test.ts` rather than extra cases in it. That file's fixture carries
// four tags on purpose: nothing truncates, so its chip queries can rely on the filter-bar chip
// being the first button with a given accessible name. Growing that fixture past the threshold
// would move some of its chips off the bar and break those queries for an unrelated reason.
//
// Fixture shape mirrors the real blog: one tag on every post, and a long tail of tags carried by
// a single post each (today 20 of 32 tags are on exactly one article).
vi.mock('../data/blog-posts.json', () => ({
  default: [
    {
      slug: 'first',
      titlePl: 'Pierwszy', titleEn: 'First', titleRu: 'Первый',
      summaryPl: 's', summaryEn: 's', summaryRu: 's',
      date: '2026-08-01',
      tags: ['AI', 'Alpha', 'Bravo', 'Charlie'],
      bodyPl: 'Akapit.', bodyEn: 'Paragraph.', bodyRu: 'Абзац.',
    },
    {
      slug: 'second',
      titlePl: 'Drugi', titleEn: 'Second', titleRu: 'Второй',
      summaryPl: 's', summaryEn: 's', summaryRu: 's',
      date: '2026-07-01',
      tags: ['AI', 'Delta', 'Echo', 'Foxtrot'],
      bodyPl: 'Akapit.', bodyEn: 'Paragraph.', bodyRu: 'Абзац.',
    },
    {
      slug: 'third',
      titlePl: 'Trzeci', titleEn: 'Third', titleRu: 'Третий',
      summaryPl: 's', summaryEn: 's', summaryRu: 's',
      date: '2026-06-01',
      tags: ['AI', 'Golf', 'Hotel', 'India'],
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

function chipNames(container: HTMLElement): string[] {
  return [...container.querySelectorAll('.filter-bar button')].map(
    (button) => button.textContent?.trim() ?? ''
  );
}

describe('BlogListing tag bar truncation', () => {
  it('shows the seven most-used tags and hides the rest behind a disclosure', () => {
    const { container, getByText } = render(BlogListing);
    // All + the seven ranked tags (AI first, then the tail alphabetically) + the disclosure.
    expect(chipNames(container)).toEqual([
      'All', 'AI', 'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', '+3 more',
    ]);
    expect(getByText('+3 more')).toBeTruthy();
    expect(chipNames(container)).not.toContain('Golf');
    // Scoped to the bar on purpose: a hidden tag is still rendered on its own post card, which
    // is what keeps every tag reachable without expanding the bar.
    expect(chipNames(container)).not.toContain('Hotel');
    expect(container.querySelector('.post-tags')?.textContent).toContain('Alpha');
  });

  it('reveals every tag when the disclosure is clicked, and flips aria-expanded', async () => {
    const { container, getByText } = render(BlogListing);
    const toggle = getByText('+3 more');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    await fireEvent.click(toggle);
    expect(chipNames(container)).toContain('Hotel');
    expect(chipNames(container)).toContain('India');
    expect(getByText('Show fewer tags').getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps an active tag from the hidden tail on the collapsed bar', () => {
    // Otherwise a `?tag=` link into a tail tag renders a bar with no pressed chip above a list
    // that is filtered to one post — the filter would look broken rather than active.
    window.history.replaceState(null, '', '/blog/?tag=India');
    const { container, getByText } = render(BlogListing);
    const india = [...container.querySelectorAll('.filter-bar button')].find(
      (button) => button.textContent?.trim() === 'India'
    );
    expect(india).toBeTruthy();
    expect(india?.getAttribute('aria-pressed')).toBe('true');
    expect(getByText('1 posts')).toBeTruthy();
    // Still collapsed: the tail's other tag stays off the bar.
    expect(chipNames(container)).not.toContain('Hotel');
  });

  it('translates the disclosure label per locale', () => {
    languageStore.set('pl');
    const { getByText } = render(BlogListing);
    expect(getByText('+3 więcej')).toBeTruthy();
  });
});
