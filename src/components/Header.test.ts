import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import Header from './Header.svelte';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';

// Header sets up an IntersectionObserver over the landing page's section ids in
// onMount, and darkModeStore.init() reads matchMedia — neither exists in jsdom.
beforeAll(() => {
  loadTranslations({
    pl: plTranslations as Record<string, any>,
    en: enTranslations as Record<string, any>,
    ru: ruTranslations as Record<string, any>,
  });

  window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList);

  (globalThis as any).IntersectionObserver =
    (globalThis as any).IntersectionObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

describe('Header calculator link', () => {
  it('offers the calculator in the Polish nav at the unprefixed anchor', () => {
    languageStore.set('pl');
    const { getAllByRole } = render(Header);
    const links = getAllByRole('link', { name: 'Kalkulator' }) as HTMLAnchorElement[];
    expect(links.length).toBeGreaterThan(0);
    expect(links.every(l => l.getAttribute('href') === '/#calculator')).toBe(true);
  });

  it('keeps the calculator link inside the English locale tree', () => {
    languageStore.set('en');
    const { getAllByRole } = render(Header);
    const links = getAllByRole('link', { name: 'Calculator' }) as HTMLAnchorElement[];
    expect(links.length).toBeGreaterThan(0);
    expect(links.every(l => l.getAttribute('href') === '/en/#calculator')).toBe(true);
  });

  it('keeps the calculator link inside the Russian locale tree', () => {
    languageStore.set('ru');
    const { getAllByRole } = render(Header);
    const links = getAllByRole('link', { name: 'Калькулятор' }) as HTMLAnchorElement[];
    expect(links.length).toBeGreaterThan(0);
    expect(links.every(l => l.getAttribute('href') === '/ru/#calculator')).toBe(true);
  });
});
