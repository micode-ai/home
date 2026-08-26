import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import ProductCard from './ProductCard.svelte';
import type { Product } from '../types/products';

const product: Product = {
  id: 'accounting-ai',
  nameKey: 'product.accountingAi.name',
  descriptionKey: 'product.accountingAi.description',
  links: [
    {
      type: 'github',
      url: 'https://github.com/micode-ai/accounting-ai-agent',
      labelKey: 'product.links.github',
    },
  ],
};

function renderCard() {
  return render(ProductCard, {
    props: { product, productImage: undefined, index: 0, onOpenModal: () => {} },
  });
}

beforeAll(() => {
  loadTranslations({ pl: {} });
});

describe('ProductCard tracking', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cookieConsent', 'accepted');
    window.history.replaceState(null, '', '/');
    window.gtag = vi.fn();
    window.mktai = vi.fn();
  });

  it('fires select_item with the product id when the card is opened', async () => {
    const { container } = renderCard();
    await fireEvent.click(container.querySelector('.product-card')!);
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'select_item',
      expect.objectContaining({ item_id: 'accounting-ai' })
    );
  });

  it('fires select_item when the card is activated by keyboard', async () => {
    const { container } = renderCard();
    await fireEvent.keyDown(container.querySelector('.product-card')!, { key: 'Enter' });
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'select_item',
      expect.objectContaining({ item_id: 'accounting-ai' })
    );
  });

  it('sends nothing when cookies were not accepted', async () => {
    localStorage.setItem('cookieConsent', 'rejected');
    const { container } = renderCard();
    await fireEvent.click(container.querySelector('.product-card')!);
    expect(window.gtag).not.toHaveBeenCalled();
  });
});
