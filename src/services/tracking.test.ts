import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setItem } from './storage';
import { languageStore } from '../stores/languageStore';
import { track, trackConversion, pageType } from './tracking';

function acceptCookies() {
  setItem('cookieConsent', 'accepted');
}

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '/');
  languageStore.set('pl');
  window.gtag = vi.fn();
  window.mktai = vi.fn();
});

describe('pageType()', () => {
  it('maps the root path to home', () => {
    expect(pageType('/')).toBe('home');
  });

  it('maps the blog index to blog_listing', () => {
    expect(pageType('/blog/')).toBe('blog_listing');
  });

  it('maps a blog slug to article', () => {
    expect(pageType('/blog/why-an-llm-lies/')).toBe('article');
  });

  it('maps a product path to product', () => {
    expect(pageType('/products/accounting-ai/')).toBe('product');
  });

  it('maps the privacy policy to privacy', () => {
    expect(pageType('/privacy-policy/')).toBe('privacy');
  });

  it('ignores a locale prefix', () => {
    expect(pageType('/ru/blog/why-an-llm-lies/')).toBe('article');
  });

  it('maps a locale root to home', () => {
    expect(pageType('/en/')).toBe('home');
  });

  it('falls back to other for an unknown route', () => {
    expect(pageType('/something-else/')).toBe('other');
  });
});

describe('track()', () => {
  it('sends a GA4 event when cookies are accepted', () => {
    acceptCookies();
    track('cta_click', { location: 'hero' });
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'cta_click',
      expect.objectContaining({ location: 'hero' })
    );
  });

  it('sends the same event to mktai', () => {
    acceptCookies();
    track('cta_click', { location: 'hero' });
    expect(window.mktai).toHaveBeenCalledWith(
      'cta_click',
      'event',
      expect.objectContaining({ location: 'hero' })
    );
  });

  it('sends nothing when cookies were rejected', () => {
    setItem('cookieConsent', 'rejected');
    track('cta_click');
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.mktai).not.toHaveBeenCalled();
  });

  it('sends nothing when consent was never given', () => {
    track('cta_click');
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.mktai).not.toHaveBeenCalled();
  });

  it('attaches the current language', () => {
    acceptCookies();
    languageStore.set('ru');
    track('cta_click');
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'cta_click',
      expect.objectContaining({ language: 'ru' })
    );
  });

  it('attaches the page type of the current path', () => {
    acceptCookies();
    window.history.pushState({}, '', '/products/accounting-ai/');
    track('cta_click');
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'cta_click',
      expect.objectContaining({ page_type: 'product' })
    );
  });

  it('lets caller params override the defaults', () => {
    acceptCookies();
    track('cta_click', { page_type: 'custom' });
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'cta_click',
      expect.objectContaining({ page_type: 'custom' })
    );
  });

  it('does not throw when gtag is not loaded', () => {
    acceptCookies();
    delete window.gtag;
    expect(() => track('cta_click')).not.toThrow();
    expect(window.mktai).toHaveBeenCalled();
  });

  it('does not throw when mktai is not loaded', () => {
    acceptCookies();
    delete window.mktai;
    expect(() => track('cta_click')).not.toThrow();
    expect(window.gtag).toHaveBeenCalled();
  });
});

describe('trackConversion()', () => {
  it('routes through the mktai conversion channel', () => {
    acceptCookies();
    trackConversion('generate_lead', { form: 'contact' });
    expect(window.mktai).toHaveBeenCalledWith(
      'conversion',
      'generate_lead',
      expect.objectContaining({ form: 'contact' })
    );
  });

  it('sends a GA4 event under the same name', () => {
    acceptCookies();
    trackConversion('generate_lead');
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'generate_lead',
      expect.objectContaining({ page_type: 'home' })
    );
  });

  it('sends nothing when cookies were rejected', () => {
    setItem('cookieConsent', 'rejected');
    trackConversion('generate_lead');
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.mktai).not.toHaveBeenCalled();
  });
});
