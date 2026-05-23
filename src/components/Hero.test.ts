import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import Hero from './Hero.svelte';

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
