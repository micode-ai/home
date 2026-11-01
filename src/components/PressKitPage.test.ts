import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PressKitPage from './PressKitPage.svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import pressKit from '../data/press-kit.json';
import pl from '../data/pl.json';
import en from '../data/en.json';
import ru from '../data/ru.json';

const wc = (s: string) => s.trim().split(/\s+/).length;

beforeAll(() => loadTranslations({ pl, en, ru }));
beforeEach(() => languageStore.set('en'));

describe('press-kit data', () => {
  it.each(['pl', 'en', 'ru'] as const)('%s boilerplate is ~50 and ~150 words', (l) => {
    const b = pressKit.boilerplate[l];
    expect(wc(b.short)).toBeGreaterThanOrEqual(45);
    expect(wc(b.short)).toBeLessThanOrEqual(55);
    expect(wc(b.long)).toBeGreaterThanOrEqual(140);
    expect(wc(b.long)).toBeLessThanOrEqual(160);
  });

  it('has press.* keys in every locale with identical key sets', () => {
    const keys = (o: object) => Object.keys(o).sort();
    expect(keys(pl.press)).toEqual(keys(en.press));
    expect(keys(ru.press)).toEqual(keys(en.press));
    expect(keys(pl.press.colors)).toEqual(keys(en.press.colors));
    expect(keys(ru.press.colors)).toEqual(keys(en.press.colors));
  });

  it('does not offer the founder photo until cleared', () => {
    expect(pressKit.includeFounderPhoto).toBe(false);
  });
});

describe('PressKitPage', () => {
  it('renders heading, ZIP link, press contact and company facts', () => {
    render(PressKitPage);
    expect(screen.getByRole('heading', { level: 1, name: 'Press kit' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Download press kit (ZIP)' })[0]).toHaveAttribute('href', pressKit.zipPath);
    expect(screen.getByRole('link', { name: pressKit.contactEmail })).toHaveAttribute('href', `mailto:${pressKit.contactEmail}`);
    expect(screen.getByRole('heading', { name: 'About the company' })).toBeInTheDocument();
  });

  it('renders a copy button per boilerplate variant (3 langs x 2 sizes)', () => {
    render(PressKitPage);
    expect(screen.getAllByRole('button', { name: /^Copy description/ })).toHaveLength(6);
  });

  it('localises UI chrome in Polish', () => {
    languageStore.set('pl');
    render(PressKitPage);
    expect(screen.getByRole('heading', { level: 1, name: 'Materiały prasowe' })).toBeInTheDocument();
  });
});
