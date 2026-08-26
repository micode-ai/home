import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import Hero from './Hero.svelte';
import enTranslations from '../data/en.json';

beforeAll(() => {
  loadTranslations({
    pl: {
      hero: {
        headline: 'Test headline',
        subheadline: 'Test subheadline',
        cta: 'Contact us',
      },
    },
  });
});

describe('Hero smoke render', () => {
  it('renders without crashing', () => {
    const { container } = render(Hero);
    expect(container).toBeTruthy();
  });

  it('renders a section element', () => {
    const { container } = render(Hero);
    expect(container.querySelector('section.hero')).toBeTruthy();
  });

  it('renders an h1 heading', () => {
    render(Hero);
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
  });

  it('renders the CTA button', () => {
    render(Hero);
    expect(screen.getByRole('button')).toBeTruthy();
  });
});

describe('Hero EN copy contains target keywords', () => {
  it('headline contains "Mobile" or "Enterprise" or "Software"', () => {
    const { headline } = enTranslations.hero;
    const hasKeyword = /mobile|enterprise|software/i.test(headline);
    expect(hasKeyword).toBe(true);
  });

  it('subheadline mentions location Poland or Gdańsk', () => {
    const { subheadline } = enTranslations.hero;
    const hasLocation = /poland|gdańsk|gdansk/i.test(subheadline);
    expect(hasLocation).toBe(true);
  });
});

describe('Hero CTA tracking', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cookieConsent', 'accepted');
    window.history.replaceState(null, '', '/');
    window.gtag = vi.fn();
    window.mktai = vi.fn();
  });

  it('fires cta_click when the CTA is pressed', async () => {
    render(Hero);
    await fireEvent.click(screen.getByRole('button'));
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'cta_click',
      expect.objectContaining({ location: 'hero' })
    );
  });

  it('fires cta_click when the CTA is activated by keyboard', async () => {
    render(Hero);
    await fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'cta_click',
      expect.objectContaining({ location: 'hero' })
    );
  });

  it('sends nothing when cookies were not accepted', async () => {
    localStorage.setItem('cookieConsent', 'rejected');
    render(Hero);
    await fireEvent.click(screen.getByRole('button'));
    expect(window.gtag).not.toHaveBeenCalled();
  });
});
