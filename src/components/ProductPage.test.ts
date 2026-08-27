import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { loadTranslations, t } from '../services/i18n';
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

describe('ProductPage structured data', () => {
  function structuredData(container: HTMLElement) {
    return Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map(
      (node) => JSON.parse(node.textContent ?? '{}')
    );
  }

  function ofType(container: HTMLElement, type: string) {
    return structuredData(container).find((data) => data['@type'] === type);
  }

  function renderProduct(productId: string, lang: 'pl' | 'en' | 'ru') {
    languageStore.set(lang);
    return render(ProductPage, { props: { productId } }).container;
  }

  it('describes the product as a SoftwareApplication under its localized name', () => {
    const container = renderProduct('accounting-ai', 'pl');
    expect(ofType(container, 'SoftwareApplication')?.name).toBe(
      t('products.accountingAI.name', 'pl')
    );
  });

  it('points the SoftwareApplication at the canonical product URL', () => {
    const container = renderProduct('accounting-ai', 'pl');
    expect(ofType(container, 'SoftwareApplication')?.url).toBe(
      'https://mi-code.pl/products/accounting-ai/'
    );
  });

  it('uses the locale-prefixed URL on a translated page', () => {
    const container = renderProduct('accounting-ai', 'ru');
    expect(ofType(container, 'SoftwareApplication')?.url).toBe(
      'https://mi-code.pl/ru/products/accounting-ai/'
    );
  });

  it('lists the external product links as sameAs', () => {
    const container = renderProduct('accounting-ai', 'pl');
    expect(ofType(container, 'SoftwareApplication')?.sameAs).toContain(
      'https://github.com/micode-ai/accounting-ai-agent'
    );
  });

  it('names MiCode as the publisher', () => {
    const container = renderProduct('accounting-ai', 'pl');
    expect(ofType(container, 'SoftwareApplication')?.publisher?.name).toBe('MiCode Sp. z o.o.');
  });

  it('publishes the product FAQ as a FAQPage', () => {
    const container = renderProduct('accounting-ai', 'pl');
    expect(ofType(container, 'FAQPage')?.mainEntity).toHaveLength(4);
  });

  it('localizes the FAQ answers', () => {
    const container = renderProduct('accounting-ai', 'ru');
    const first = ofType(container, 'FAQPage')?.mainEntity[0];
    expect(first.name).toBe(t('products.accountingAI.faq.q1.question', 'ru'));
    expect(first.acceptedAnswer.text).toBe(t('products.accountingAI.faq.q1.answer', 'ru'));
  });

  it('emits a breadcrumb trail from the home page to the product', () => {
    const container = renderProduct('accounting-ai', 'pl');
    const crumbs = ofType(container, 'BreadcrumbList')?.itemListElement;
    expect(crumbs.map((c: { name: string }) => c.name)).toEqual([
      'MiCode Sp. z o.o.',
      t('products.accountingAI.name', 'pl')
    ]);
  });

  it('escapes < so the JSON can never break out of its script element', () => {
    const container = renderProduct('accounting-ai', 'pl');
    const raw = Array.from(container.querySelectorAll('script[type="application/ld+json"]'))
      .map((node) => node.textContent ?? '')
      .join('');
    expect(raw).not.toContain('<');
  });

  it('emits structured data for every product', () => {
    for (const id of ['budget-assistant', 'legalka-kb', 'emarketing-ai', 'ngx-chat', 'testing-ai']) {
      const container = renderProduct(id, 'en');
      expect(ofType(container, 'SoftwareApplication'), id).toBeTruthy();
      expect(ofType(container, 'FAQPage'), id).toBeTruthy();
    }
  });
});
