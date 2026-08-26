import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import CookieBanner from './CookieBanner.svelte';

// initializeAnalytics() installs a real gtag stub over the spy when a
// measurement id is present in the environment, which makes the assertions below
// depend on whether the developer has a .env. Stub the loader instead — whether
// gtag.js gets injected is analytics.ts's contract, not the banner's.
vi.mock('../services/analytics', () => ({ initializeAnalytics: vi.fn() }));

beforeAll(() => {
  loadTranslations({
    pl: {
      legal: {
        cookieBanner: {
          message: 'Używamy plików cookie',
          accept: 'Akceptuję',
          reject: 'Odrzucam',
        },
      },
    },
  });
});

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  window.gtag = vi.fn();
  window.mktai = vi.fn();
  // analytics.ts / mktai.ts warn when their env vars are unset, which they are
  // in the test environment — that path is exercised deliberately here.
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.classList.remove('cookie-banner-visible');
});

describe('CookieBanner visibility', () => {
  it('shows when no choice was stored yet', () => {
    render(CookieBanner);
    expect(screen.getByRole('button', { name: /akceptuję/i })).toBeTruthy();
  });

  it('stays hidden once a choice was stored', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    render(CookieBanner);
    expect(screen.queryByRole('button', { name: /akceptuję/i })).toBeNull();
  });
});

describe('CookieBanner consent tracking', () => {
  // Every event on the site is gated on this choice, so the accept rate is the
  // multiplier on all other analytics. A decline is deliberately *not* reported:
  // that would be tracking someone who just asked us not to.
  it('reports consent_accept after the trackers are initialized', async () => {
    render(CookieBanner);
    await fireEvent.click(screen.getByRole('button', { name: /akceptuję/i }));
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'consent_accept',
      expect.objectContaining({ page_type: 'home' })
    );
  });

  it('reports the same acceptance to mktai', async () => {
    render(CookieBanner);
    await fireEvent.click(screen.getByRole('button', { name: /akceptuję/i }));
    expect(window.mktai).toHaveBeenCalledWith(
      'consent_accept',
      'event',
      expect.objectContaining({ page_type: 'home' })
    );
  });

  it('stores the acceptance', async () => {
    render(CookieBanner);
    await fireEvent.click(screen.getByRole('button', { name: /akceptuję/i }));
    expect(localStorage.getItem('cookieConsent')).toBe('accepted');
  });

  it('sends nothing at all when the banner is declined', async () => {
    render(CookieBanner);
    await fireEvent.click(screen.getByRole('button', { name: /odrzucam/i }));
    expect(localStorage.getItem('cookieConsent')).toBe('rejected');
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.mktai).not.toHaveBeenCalled();
  });
});
