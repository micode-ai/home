import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import QuickSearch from './QuickSearch.svelte';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';
import type { SearchEntry } from '../services/searchIndex';

const FIXTURE: SearchEntry[] = [
  { type: 'product', id: 'accounting-ai', title: 'Accounting AI Agent', summary: 'Automates Polish tax work', tags: [], url: '/products/accounting-ai/' },
  { type: 'blog', id: 'ksef-2026', title: 'KSeF readiness guide', summary: 'What to do before KSeF', tags: ['KSeF'], url: '/blog/ksef-2026/' },
  { type: 'glossary', id: 'regon', title: 'REGON', summary: 'Polish business registry number', tags: [], url: '/glossary/#regon' },
];

const realLocation = window.location;

beforeAll(() => {
  loadTranslations({
    pl: plTranslations as Record<string, any>,
    en: enTranslations as Record<string, any>,
    ru: ruTranslations as Record<string, any>,
  });
});

beforeEach(() => {
  languageStore.set('pl');
  localStorage.clear();
  window.gtag = vi.fn();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => FIXTURE }) as unknown as Response)
  );
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...realLocation, pathname: '/', search: '', hash: '', href: realLocation.href },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
});

describe('QuickSearch', () => {
  it('renders a trigger button labelled from i18n', () => {
    const { getByLabelText } = render(QuickSearch);
    expect(getByLabelText('Szukaj')).toBeInTheDocument();
  });

  it('opens the overlay on click, fetches the locale index, and groups matches by type', async () => {
    const { getByLabelText, getByPlaceholderText, getByText } = render(QuickSearch);
    await fireEvent.click(getByLabelText('Szukaj'));

    const input = getByPlaceholderText('Szukaj produktów, bloga, słownika…');
    await fireEvent.input(input, { target: { value: 'ksef' } });

    await waitFor(() => expect(getByText('KSeF readiness guide')).toBeInTheDocument());
    expect(getByText('Blog')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/search-index/pl.json');
  });

  it('shows the empty-state message when nothing matches a non-empty query', async () => {
    const { getByLabelText, getByPlaceholderText, getByText } = render(QuickSearch);
    await fireEvent.click(getByLabelText('Szukaj'));
    await fireEvent.input(getByPlaceholderText('Szukaj produktów, bloga, słownika…'), {
      target: { value: 'zzz-nomatch' },
    });

    await waitFor(() => expect(getByText('Brak wyników.')).toBeInTheDocument());
  });

  it('opens via Ctrl+K from anywhere on the page', async () => {
    const { getByPlaceholderText } = render(QuickSearch);
    await fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(getByPlaceholderText('Szukaj produktów, bloga, słownika…')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const { getByLabelText, queryByPlaceholderText } = render(QuickSearch);
    await fireEvent.click(getByLabelText('Szukaj'));
    expect(queryByPlaceholderText('Szukaj produktów, bloga, słownika…')).toBeInTheDocument();

    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(queryByPlaceholderText('Szukaj produktów, bloga, słownika…')).not.toBeInTheDocument();
  });

  it('does not render results before a query is typed', async () => {
    const { getByLabelText, queryByText } = render(QuickSearch);
    await fireEvent.click(getByLabelText('Szukaj'));
    expect(queryByText('Accounting AI Agent')).not.toBeInTheDocument();
  });
});
