import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import ProjectCta from './ProjectCta.svelte';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';

beforeAll(() => {
  loadTranslations({
    pl: plTranslations as Record<string, any>,
    en: enTranslations as Record<string, any>,
    ru: ruTranslations as Record<string, any>,
  });
});

function msgOf(link: HTMLElement): { path: string; msg: string | null; hash: string } {
  const url = new URL(link.getAttribute('href')!, 'https://www.mi-code.pl');
  return { path: url.pathname, msg: url.searchParams.get('msg'), hash: url.hash };
}

describe('ProjectCta link', () => {
  it('sends an article reader to the Polish home contact form with the title quoted', () => {
    render(ProjectCta, { lang: 'pl', location: 'article_end', itemId: 'some-post', subject: 'Mój artykuł' });
    const { path, msg, hash } = msgOf(screen.getByTestId('project-cta-link'));
    expect(path).toBe('/');
    expect(hash).toBe('#contact');
    expect(msg).toContain('„Mój artykuł”');
  });

  it('stays inside the English locale tree and names the product', () => {
    render(ProjectCta, { lang: 'en', location: 'product', itemId: 'accounting-ai', subject: 'Accounting AI' });
    expect(screen.getByRole('heading', { name: 'Need a solution like Accounting AI?' })).toBeTruthy();
    const { path, msg } = msgOf(screen.getByTestId('project-cta-link'));
    expect(path).toBe('/en/');
    expect(msg).toContain('Accounting AI');
  });

  it('has real copy in every language, not echoed keys', () => {
    for (const lang of ['pl', 'en', 'ru'] as const) {
      const { unmount } = render(ProjectCta, { lang, location: 'article_end', itemId: 'x', subject: 'X' });
      expect(screen.getByTestId('project-cta-link').textContent).not.toContain('projectCta.');
      expect(screen.getByRole('heading').textContent).not.toContain('projectCta.');
      unmount();
    }
  });
});

describe('ProjectCta tracking', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cookieConsent', 'accepted');
    window.history.replaceState(null, '', '/blog/some-post/');
    window.gtag = vi.fn();
    window.mktai = vi.fn();
  });

  it('fires cta_click with its location and item id', async () => {
    render(ProjectCta, { lang: 'pl', location: 'article_end', itemId: 'some-post', subject: 'T' });
    const link = screen.getByTestId('project-cta-link');
    link.addEventListener('click', e => e.preventDefault());
    await fireEvent.click(link);
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'cta_click',
      expect.objectContaining({ location: 'article_end', item_id: 'some-post' })
    );
  });

  it('sends nothing when cookies were not accepted', async () => {
    localStorage.setItem('cookieConsent', 'rejected');
    render(ProjectCta, { lang: 'pl', location: 'product', itemId: 'p', subject: 'P' });
    const link = screen.getByTestId('project-cta-link');
    link.addEventListener('click', e => e.preventDefault());
    await fireEvent.click(link);
    expect(window.gtag).not.toHaveBeenCalled();
  });
});
