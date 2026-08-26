import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import Footer from './Footer.svelte';

const dictionary = (about: string) => ({
  footer: {
    copyright: '© 2026 MiCode Sp. z o.o.',
    address: 'Jana Heweliusza 11 lok. 811, 80-890 Gdańsk',
    privacyPolicy: 'Privacy',
    socialMedia: 'Follow us',
    about,
  },
  nav: { blog: 'Blog', menu: 'Menu' },
  products: {
    accountingAI: { name: 'Accounting AI' },
    budgetAssistant: { name: 'Budget Assistant' },
  },
});

beforeAll(() => {
  loadTranslations({
    pl: dictionary('O firmie'),
    en: dictionary('About us'),
  });
});

beforeEach(() => {
  languageStore.set('pl');
});

describe('Footer company link', () => {
  // /blog/o-firmie-micode/ is the site's second brand-entity page. It used to be
  // reachable only from llms.txt, so it competed with the homepage for the
  // "micode" query while receiving no internal links at all.
  it('links to the company article', () => {
    render(Footer);
    const link = screen.getByRole('link', { name: /o firmie/i });
    expect(link.getAttribute('href')).toBe('/blog/o-firmie-micode/');
  });

  it('keeps the link inside the active language tree', () => {
    languageStore.set('en');
    render(Footer);
    const link = screen.getByRole('link', { name: /about us/i });
    expect(link.getAttribute('href')).toBe('/en/blog/o-firmie-micode/');
  });
});
