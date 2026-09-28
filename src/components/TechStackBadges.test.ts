import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import TechStackBadges from './TechStackBadges.svelte';

beforeAll(() => {
  loadTranslations({
    pl: { products: { techStack: { label: 'Stos technologiczny' } } },
    en: { products: { techStack: { label: 'Tech stack' } } },
    ru: { products: { techStack: { label: 'Технологический стек' } } },
  });
});

describe('TechStackBadges', () => {
  it('renders nothing when stack is undefined', () => {
    const { container } = render(TechStackBadges, { props: { stack: undefined } });
    expect(container.querySelector('.tech-stack')).toBeNull();
  });

  it('renders nothing when stack is an empty array', () => {
    const { container } = render(TechStackBadges, { props: { stack: [] } });
    expect(container.querySelector('.tech-stack')).toBeNull();
  });

  it('renders one badge per stack entry, in order', () => {
    languageStore.set('en');
    const { container, getByText } = render(TechStackBadges, {
      props: { stack: ['LangGraph', 'Telegram Bot API'] },
    });
    const badges = container.querySelectorAll('.tech-stack-badge');
    expect(badges).toHaveLength(2);
    expect(badges[0].textContent).toBe('LangGraph');
    expect(badges[1].textContent).toBe('Telegram Bot API');
    expect(getByText('Tech stack')).toBeTruthy();
  });

  it('translates the label per active language', () => {
    languageStore.set('pl');
    const { getByText } = render(TechStackBadges, { props: { stack: ['Angular'] } });
    expect(getByText('Stos technologiczny')).toBeTruthy();
    languageStore.set('en');
  });

  it('applies the md size class when requested', () => {
    const { container } = render(TechStackBadges, {
      props: { stack: ['Angular'], size: 'md' },
    });
    expect(container.querySelector('.tech-stack--md')).toBeTruthy();
  });
});
