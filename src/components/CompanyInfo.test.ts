import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import CompanyInfo from './CompanyInfo.svelte';
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

describe('CompanyInfo copy buttons', () => {
  afterEach(() => {
    cleanup();
    languageStore.set('pl');
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('renders a copy button for NIP and REGON with localized labels', () => {
    languageStore.set('en');
    const { getByLabelText } = render(CompanyInfo);

    expect(getByLabelText('Copy NIP')).toBeTruthy();
    expect(getByLabelText('Copy REGON')).toBeTruthy();
  });

  it('copies the exact NIP value shown on the page', async () => {
    languageStore.set('en');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { getByLabelText, getByText } = render(CompanyInfo);

    await fireEvent.click(getByLabelText('Copy NIP'));

    expect(writeText).toHaveBeenCalledWith('5833510147');
    expect(getByText('Copied!')).toBeTruthy();
  });

  it('copies the exact REGON value shown on the page', async () => {
    languageStore.set('en');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { getByLabelText, getByText } = render(CompanyInfo);

    await fireEvent.click(getByLabelText('Copy REGON'));

    expect(writeText).toHaveBeenCalledWith('528740633');
    expect(getByText('Copied!')).toBeTruthy();
  });

  it('renders localized copy labels in Polish', () => {
    languageStore.set('pl');
    const { getByLabelText } = render(CompanyInfo);
    expect(getByLabelText('Kopiuj NIP')).toBeTruthy();
    expect(getByLabelText('Kopiuj REGON')).toBeTruthy();
  });

  it('renders localized copy labels in Russian', () => {
    languageStore.set('ru');
    const { getByLabelText } = render(CompanyInfo);
    expect(getByLabelText('Скопировать NIP')).toBeTruthy();
    expect(getByLabelText('Скопировать REGON')).toBeTruthy();
  });
});
