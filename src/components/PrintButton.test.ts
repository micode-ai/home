import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import PrintButton from './PrintButton.svelte';
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

describe('PrintButton', () => {
  it('renders the localized label per locale', () => {
    const en = render(PrintButton, { props: { lang: 'en' } });
    expect(en.getByTestId('print-button').textContent).toContain('Print / Save as PDF');
    en.unmount();

    const pl = render(PrintButton, { props: { lang: 'pl' } });
    expect(pl.getByTestId('print-button').textContent).toContain('Drukuj / Zapisz jako PDF');
    pl.unmount();

    const ru = render(PrintButton, { props: { lang: 'ru' } });
    expect(ru.getByTestId('print-button').textContent).toContain('Печать / Сохранить как PDF');
    ru.unmount();
  });

  it('calls window.print on click', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const { getByTestId } = render(PrintButton, { props: { lang: 'en' } });

    await fireEvent.click(getByTestId('print-button'));

    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  describe('tracking', () => {
    beforeEach(() => {
      localStorage.clear();
      localStorage.setItem('cookieConsent', 'accepted');
      window.gtag = vi.fn();
      window.mktai = vi.fn();
    });

    it('fires share with the print method', async () => {
      vi.spyOn(window, 'print').mockImplementation(() => {});
      const { getByTestId } = render(PrintButton, { props: { lang: 'en' } });

      await fireEvent.click(getByTestId('print-button'));

      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'share',
        expect.objectContaining({ method: 'print', content_type: 'article' })
      );
    });

    it('sends nothing when cookies were not accepted', async () => {
      localStorage.setItem('cookieConsent', 'rejected');
      vi.spyOn(window, 'print').mockImplementation(() => {});
      const { getByTestId } = render(PrintButton, { props: { lang: 'en' } });

      await fireEvent.click(getByTestId('print-button'));

      expect(window.gtag).not.toHaveBeenCalled();
    });
  });
});
