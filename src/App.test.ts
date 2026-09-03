import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/svelte';
import { loadTranslations } from './services/i18n';
import { languageStore } from './stores/languageStore';
import App from './App.svelte';
import plTranslations from './data/pl.json';
import enTranslations from './data/en.json';
import ruTranslations from './data/ru.json';

// App is a top-level app component, so mounting it for real exercises Header's
// IntersectionObserver, StatsStrip's counters and initScrollReveal's matchMedia
// call — none of which jsdom implements. Same stubs as NotFoundApp.test.ts.
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

describe('App landing page', () => {
  it('carries the cost calculator as a section of its own', () => {
    languageStore.set('en');
    const { container } = render(App);
    expect(container.querySelector('main #calculator')).toBeTruthy();
  });

  it('places the calculator ahead of the contact form it feeds', () => {
    languageStore.set('en');
    const { container } = render(App);
    const calculator = container.querySelector('main #calculator');
    const contact = container.querySelector('main #contact');
    expect(calculator).toBeTruthy();
    expect(contact).toBeTruthy();
    expect(calculator!.compareDocumentPosition(contact!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
