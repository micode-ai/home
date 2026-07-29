import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/svelte';
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
        secondaryCta: 'Book a free 30-min call →',
        secondaryCtaAriaLabel: 'Book a free 30-minute consultation (opens in a new tab)',
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

  it('renders the secondary booking link opening in a new tab', () => {
    render(Hero);
    const link = screen.getByRole('link', { name: /book a free 30-minute consultation/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.getAttribute('href')).toMatch(/^https?:\/\//);
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
