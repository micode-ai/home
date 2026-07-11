import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/svelte';
import { loadTranslations } from './services/i18n';
import { languageStore } from './stores/languageStore';
import NotFoundApp from './NotFoundApp.svelte';
import plTranslations from './data/pl.json';
import enTranslations from './data/en.json';
import ruTranslations from './data/ru.json';

// NotFoundApp is a top-level app component (like App/BlogApp/ProductApp), so
// mounting it for real exercises Header's IntersectionObserver and
// initScrollReveal's matchMedia call — neither of which jsdom implements.
beforeAll(() => {
  loadTranslations({
    pl: plTranslations as Record<string, any>,
    en: enTranslations as Record<string, any>,
    ru: ruTranslations as Record<string, any>,
  });

  window.matchMedia =
    window.matchMedia ||
    ((query: string) => ({
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

describe('NotFoundApp i18n', () => {
  it('renders Polish copy and a link back home when lang=pl', () => {
    languageStore.set('pl');
    const { getByText, getByRole } = render(NotFoundApp);
    expect(getByText('404')).toBeTruthy();
    expect(getByText('Wróć na stronę główną')).toBeTruthy();
    const link = getByRole('link', { name: /Wróć na stronę główną/i });
    expect(link.getAttribute('href')).toBe('/');
  });

  it('renders English copy with a locale-prefixed home link when lang=en', () => {
    languageStore.set('en');
    const { getByText, getByRole } = render(NotFoundApp);
    expect(getByText("This page doesn't exist or has been moved. Check the address or head back to the homepage.")).toBeTruthy();
    const link = getByRole('link', { name: /Back to homepage/i });
    expect(link.getAttribute('href')).toBe('/en/');
  });

  it('renders Russian copy with a locale-prefixed home link when lang=ru', () => {
    languageStore.set('ru');
    const { getByRole } = render(NotFoundApp);
    const link = getByRole('link', { name: /На главную страницу/i });
    expect(link.getAttribute('href')).toBe('/ru/');
  });
});
