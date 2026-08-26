import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import LanguageSwitcher from './LanguageSwitcher.svelte';
import { languageStore } from '../stores/languageStore';

const realLocation = window.location;
let assign: ReturnType<typeof vi.fn>;

describe('LanguageSwitcher tracking', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cookieConsent', 'accepted');
    languageStore.set('pl');
    window.gtag = vi.fn();
    window.mktai = vi.fn();
    assign = vi.fn();
    // jsdom refuses real navigation; stub the whole Location so assign() is inert.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...realLocation, pathname: '/', search: '', hash: '', assign },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
  });

  it('fires language_change with the chosen language before navigating', async () => {
    const { getByLabelText } = render(LanguageSwitcher);
    await fireEvent.click(getByLabelText('Switch to EN'));
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'language_change',
      expect.objectContaining({ from_language: 'pl', to_language: 'en' })
    );
    expect(assign).toHaveBeenCalledWith('/en/');
  });

  it('sends nothing when the active language is picked again', async () => {
    const { getByLabelText } = render(LanguageSwitcher);
    await fireEvent.click(getByLabelText('Switch to PL'));
    expect(window.gtag).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it('sends nothing when cookies were not accepted', async () => {
    localStorage.setItem('cookieConsent', 'rejected');
    const { getByLabelText } = render(LanguageSwitcher);
    await fireEvent.click(getByLabelText('Switch to RU'));
    expect(window.gtag).not.toHaveBeenCalled();
  });
});
