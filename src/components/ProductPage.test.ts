import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
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

describe('ProductPage related article link', () => {
  it('links to the related blog article for legalka-kb (en)', async () => {
    languageStore.set('en');
    const { getByText, getByRole } = render(ProductPage, { props: { productId: 'legalka-kb' } });
    expect(getByText('Read the related article')).toBeTruthy();
    const link = getByRole('link', { name: /How Legalka KB uses AI/i });
    expect(link.getAttribute('href')).toContain('/blog/legalka-kb-ai-architecture/');
  });

  it('shows the localized article title (ru)', async () => {
    languageStore.set('ru');
    const { getByText, getByRole } = render(ProductPage, { props: { productId: 'legalka-kb' } });
    expect(getByText('Читать связанную статью')).toBeTruthy();
    expect(getByRole('link', { name: /Как Legalka KB использует ИИ/i })).toBeTruthy();
  });
});

describe('ProductPage outbound link tracking', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cookieConsent', 'accepted');
    window.history.replaceState(null, '', '/products/accounting-ai/');
    languageStore.set('pl');
    window.gtag = vi.fn();
    window.mktai = vi.fn();
  });

  it('fires an outbound click for the product website link', async () => {
    const { container } = render(ProductPage, { props: { productId: 'accounting-ai' } });
    await fireEvent.click(container.querySelector('.product-website-link')!);
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'click',
      expect.objectContaining({ outbound: true, link_type: 'website', item_id: 'accounting-ai' })
    );
  });

  it('fires an outbound click carrying the link type for a github link', async () => {
    const { container } = render(ProductPage, { props: { productId: 'accounting-ai' } });
    await fireEvent.click(container.querySelector('.hero-link')!);
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'click',
      expect.objectContaining({ outbound: true, link_type: 'github', item_id: 'accounting-ai' })
    );
  });

  it('fires an outbound click from the links section further down the page', async () => {
    const { container } = render(ProductPage, { props: { productId: 'accounting-ai' } });
    await fireEvent.click(container.querySelector('.content-link')!);
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'click',
      expect.objectContaining({ outbound: true, link_type: 'github' })
    );
  });

  it('sends nothing when cookies were not accepted', async () => {
    localStorage.setItem('cookieConsent', 'rejected');
    const { container } = render(ProductPage, { props: { productId: 'accounting-ai' } });
    await fireEvent.click(container.querySelector('.product-website-link')!);
    expect(window.gtag).not.toHaveBeenCalled();
  });
});
