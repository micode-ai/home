import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import ProductPage from './ProductPage.svelte';
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

describe('ProductPage i18n', () => {
  it('renders Polish UI chrome when lang=pl', async () => {
    languageStore.set('pl');
    const { getByText } = render(ProductPage, { props: { productId: 'accounting-ai' } });
    expect(getByText('O produkcie')).toBeTruthy();
    expect(getByText('Kluczowe funkcje')).toBeTruthy();
  });

  it('renders Russian UI chrome when lang=ru', async () => {
    languageStore.set('ru');
    const { getByText } = render(ProductPage, { props: { productId: 'accounting-ai' } });
    expect(getByText('О продукте')).toBeTruthy();
    expect(getByText('Ключевые возможности')).toBeTruthy();
  });
});
