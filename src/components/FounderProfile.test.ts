import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import FounderProfile from './FounderProfile.svelte';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';

beforeAll(() => {
  loadTranslations({
    pl: plTranslations,
    en: enTranslations,
    ru: ruTranslations,
  });
});

afterEach(() => {
  languageStore.set('pl');
});

describe('FounderProfile', () => {
  it('renders the founder name', () => {
    const { container } = render(FounderProfile);
    expect(container.querySelector('.founder-name')?.textContent).toBe(
      plTranslations.founder.name
    );
  });

  it('renders a non-empty bio paragraph mentioning MiCode', () => {
    const { container } = render(FounderProfile);
    const bio = container.querySelector('.founder-bio');
    expect(bio).toBeTruthy();
    expect(bio?.textContent).toContain('MiCode');
    expect((bio?.textContent ?? '').length).toBeGreaterThan(80);
  });

  it('renders the avatar image with alt set to the founder name', () => {
    const { container } = render(FounderProfile);
    const img = container.querySelector('img.avatar-photo');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('alt')).toBe(plTranslations.founder.name);
  });

  it('shows the initials monogram fallback when the photo fails to load', async () => {
    const { container } = render(FounderProfile);
    const img = container.querySelector('img.avatar-photo');
    expect(img).toBeTruthy();

    await fireEvent.error(img as HTMLImageElement);

    expect(container.querySelector('img.avatar-photo')).toBeNull();
    const monogram = container.querySelector('.avatar-monogram');
    expect(monogram?.textContent?.trim()).toBe('MP');
    expect(monogram?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders a localized bio for each language', () => {
    for (const lang of ['pl', 'en', 'ru'] as const) {
      languageStore.set(lang);
      const { container } = render(FounderProfile);
      const bioText = container.querySelector('.founder-bio')?.textContent ?? '';
      expect(bioText).toBe((translationsFor(lang).founder as any).bio);
    }
  });
});

function translationsFor(lang: 'pl' | 'en' | 'ru') {
  return { pl: plTranslations, en: enTranslations, ru: ruTranslations }[lang];
}
