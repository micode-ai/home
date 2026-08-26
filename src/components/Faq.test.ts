import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import Faq from './Faq.svelte';

beforeAll(() => {
  loadTranslations({ pl: {} });
});

describe('Faq tracking', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cookieConsent', 'accepted');
    window.gtag = vi.fn();
    window.mktai = vi.fn();
  });

  function firstItem(container: HTMLElement) {
    return container.querySelector('details')!;
  }

  function faqEvents() {
    return vi.mocked(window.gtag!).mock.calls.filter((call) => call[1] === 'faq_open');
  }

  it('fires faq_open when an item is expanded', async () => {
    const { container } = render(Faq);
    const details = firstItem(container);
    details.open = true;
    await fireEvent(details, new Event('toggle'));
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'faq_open',
      expect.objectContaining({ item_id: 'faq-1' })
    );
  });

  it('does not fire when an item is collapsed again', async () => {
    const { container } = render(Faq);
    const details = firstItem(container);
    details.open = true;
    await fireEvent(details, new Event('toggle'));
    details.open = false;
    await fireEvent(details, new Event('toggle'));
    expect(faqEvents()).toHaveLength(1);
  });

  it('sends nothing when cookies were not accepted', async () => {
    localStorage.setItem('cookieConsent', 'rejected');
    const { container } = render(Faq);
    const details = firstItem(container);
    details.open = true;
    await fireEvent(details, new Event('toggle'));
    expect(window.gtag).not.toHaveBeenCalled();
  });
});
