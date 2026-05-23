import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { languageStore } from './languageStore';

beforeEach(() => {
  localStorage.clear();
  // Reset store to default between tests
  languageStore.setLanguage('pl');
});

describe('languageStore.setLanguage()', () => {
  it('accepts "pl"', () => {
    languageStore.setLanguage('pl');
    expect(get(languageStore)).toBe('pl');
  });

  it('accepts "en"', () => {
    languageStore.setLanguage('en');
    expect(get(languageStore)).toBe('en');
  });

  it('accepts "ru"', () => {
    languageStore.setLanguage('ru');
    expect(get(languageStore)).toBe('ru');
  });

  it('falls back to "pl" for an invalid code', () => {
    languageStore.setLanguage('de');
    expect(get(languageStore)).toBe('pl');
  });

  it('falls back to "pl" for an empty string', () => {
    languageStore.setLanguage('');
    expect(get(languageStore)).toBe('pl');
  });

  it('persists valid language to localStorage', () => {
    languageStore.setLanguage('en');
    expect(localStorage.getItem('micode_language')).toBe('en');
  });

  it('persists fallback language to localStorage on invalid input', () => {
    languageStore.setLanguage('xx');
    expect(localStorage.getItem('micode_language')).toBe('pl');
  });
});

describe('languageStore.getCurrentLanguage()', () => {
  it('returns the current language', () => {
    languageStore.setLanguage('ru');
    expect(languageStore.getCurrentLanguage()).toBe('ru');
  });

  it('returns "pl" after falling back from invalid', () => {
    languageStore.setLanguage('invalid');
    expect(languageStore.getCurrentLanguage()).toBe('pl');
  });
});

describe('languageStore subscribe()', () => {
  it('notifies subscribers on language change', () => {
    const values: string[] = [];
    const unsub = languageStore.subscribe(v => values.push(v));
    languageStore.setLanguage('en');
    languageStore.setLanguage('ru');
    unsub();
    expect(values).toContain('en');
    expect(values).toContain('ru');
  });
});
