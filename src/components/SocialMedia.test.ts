import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import SocialMedia from './SocialMedia.svelte';

beforeAll(() => {
  loadTranslations({
    pl: { footer: { socialMedia: 'Obserwuj nas' } },
  });
});

describe('SocialMedia smoke render', () => {
  it('renders every network as an external link', () => {
    render(SocialMedia);
    const links = screen.getAllByRole('link');
    // three Telegram brands + Facebook + Instagram
    expect(links).toHaveLength(5);
    links.forEach((link) => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
    });
  });
});

describe('SocialMedia outbound tracking', () => {
  // These links leave the site, so a click is the last thing we can observe
  // about that visitor. They used to be untracked, which made social the one
  // exit path invisible in the funnel.
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cookieConsent', 'accepted');
    window.history.replaceState(null, '', '/');
    languageStore.set('pl');
    window.gtag = vi.fn();
    window.mktai = vi.fn();
  });

  it('reports a Telegram click with the brand as item_id', async () => {
    render(SocialMedia);
    await fireEvent.click(screen.getByRole('link', { name: /Telegram — MiCode/i }));
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'click',
      expect.objectContaining({ outbound: true, link_type: 'telegram', item_id: 'micode' })
    );
  });

  it('reports an Instagram click', async () => {
    render(SocialMedia);
    await fireEvent.click(screen.getByRole('link', { name: /Instagram/i }));
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'click',
      expect.objectContaining({ outbound: true, link_type: 'instagram', item_id: 'instagram' })
    );
  });

  it('reports a Facebook click', async () => {
    render(SocialMedia);
    await fireEvent.click(screen.getByRole('link', { name: /Facebook/i }));
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'click',
      expect.objectContaining({ outbound: true, link_type: 'facebook', item_id: 'facebook' })
    );
  });

  it('sends nothing when cookies were not accepted', async () => {
    localStorage.setItem('cookieConsent', 'rejected');
    render(SocialMedia);
    await fireEvent.click(screen.getByRole('link', { name: /Instagram/i }));
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.mktai).not.toHaveBeenCalled();
  });
});
