import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import CostCalculator from './CostCalculator.svelte';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';

beforeAll(() => {
  loadTranslations({
    pl: plTranslations as Record<string, any>,
    en: enTranslations as Record<string, any>,
    ru: ruTranslations as Record<string, any>,
  });
});

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('CostCalculator', () => {
  it('renders localized labels', () => {
    const { getByText } = render(CostCalculator, { props: { lang: 'pl' } });
    expect(getByText('Policz swój przypadek')).toBeTruthy();
    expect(getByText('Liczba narzędzi agenta')).toBeTruthy();
  });

  it('shows the price snapshot date so numbers are never mistaken for current', () => {
    const { getByText } = render(CostCalculator, { props: { lang: 'en' } });
    expect(getByText(/2026-07-25/)).toBeTruthy();
  });

  it('lists every component in the breakdown table', () => {
    const { getByRole } = render(CostCalculator, { props: { lang: 'en' } });
    const table = getByRole('table');
    expect(table.querySelectorAll('tbody tr').length).toBe(5);
  });

  it('recomputes when an input changes', async () => {
    const { getByLabelText, getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    const before = getByTestId('monthly-low').textContent;
    const tools = getByLabelText('Tools the agent has') as HTMLInputElement;
    await fireEvent.input(tools, { target: { value: '160' } });
    expect(getByTestId('monthly-low').textContent).not.toBe(before);
  });

  it('does not break when an input is cleared', async () => {
    const { getByLabelText, getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    const tools = getByLabelText('Tools the agent has') as HTMLInputElement;
    await fireEvent.input(tools, { target: { value: '' } });
    expect(getByTestId('monthly-low').textContent).toMatch(/\d/);
  });
});

describe('CostCalculator stacked bar', () => {
  it('renders one segment per component in fixed order', () => {
    const { getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    const bar = getByTestId('cost-bar');
    const segs = bar.querySelectorAll('[data-component]');
    expect(Array.from(segs).map((s) => s.getAttribute('data-component'))).toEqual([
      'toolSchemas', 'systemPrompt', 'history', 'rag', 'output',
    ]);
  });

  it('gives the bar an accessible summary, so it is not colour-alone', () => {
    const { getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    const bar = getByTestId('cost-bar');
    expect(bar.getAttribute('role')).toBe('img');
    expect(bar.getAttribute('aria-label')).toMatch(/Tool schemas/);
  });

  it('renders a legend entry for every component', () => {
    const { getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    expect(getByTestId('cost-legend').querySelectorAll('li').length).toBe(5);
  });

  it('resizes segments when the inputs change', async () => {
    const { getByLabelText, getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    const seg = () => getByTestId('cost-bar').querySelector('[data-component="toolSchemas"]') as HTMLElement;
    const before = seg().style.width;
    await fireEvent.input(getByLabelText('Tools the agent has'), { target: { value: '2' } });
    expect(seg().style.width).not.toBe(before);
  });

  it('shows a tooltip for the hovered segment', async () => {
    const { getByTestId, queryByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    expect(queryByTestId('cost-tooltip')).toBeNull();
    const seg = getByTestId('cost-bar').querySelector('[data-component="history"]') as HTMLElement;
    await fireEvent.mouseEnter(seg);
    expect(getByTestId('cost-tooltip').textContent).toMatch(/Conversation history/);
  });

  it('sums segment widths to ~100% on the shipped default inputs, regardless of rounding', () => {
    const { getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    const segs = Array.from(
      getByTestId('cost-bar').querySelectorAll('[data-component]')
    ) as HTMLElement[];
    const total = segs.reduce((sum, s) => sum + parseFloat(s.style.width), 0);
    expect(total).toBeCloseTo(100, 5);
  });

  it('still sums segment widths to ~100% for inputs whose rounded shares total 99%', async () => {
    const { getByLabelText, getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    await fireEvent.input(getByLabelText('Tools the agent has'), { target: { value: '70' } });
    const segs = Array.from(
      getByTestId('cost-bar').querySelectorAll('[data-component]')
    ) as HTMLElement[];
    const total = segs.reduce((sum, s) => sum + parseFloat(s.style.width), 0);
    expect(total).toBeCloseTo(100, 5);
  });

  it('keeps displayed percentages as rounded integers, not the exact width fraction', async () => {
    const { getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    const seg = getByTestId('cost-bar').querySelector('[data-component="history"]') as HTMLElement;
    await fireEvent.mouseEnter(seg);
    const tooltipText = getByTestId('cost-tooltip').textContent ?? '';
    expect(tooltipText).toMatch(/\(\d+%\)/);
    expect(tooltipText).not.toMatch(/\d\.\d+%/);
    expect(getByTestId('cost-bar').getAttribute('aria-label')).not.toMatch(/\d\.\d+%/);
  });

  it('keeps a non-empty accessible name when every component is zero', async () => {
    const { getByLabelText, getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    await fireEvent.input(getByLabelText('Tasks per day'), { target: { value: '0' } });
    const bar = getByTestId('cost-bar');
    expect(bar.getAttribute('role')).toBe('img');
    expect(bar.getAttribute('aria-label')).toBeTruthy();
  });
});

describe('CostCalculator shareable estimate URL', () => {
  it('does not touch the URL when the visitor never edits the defaults', () => {
    render(CostCalculator, { props: { lang: 'en' } });
    expect(window.location.search).toBe('');
  });

  it('syncs an edited input into the URL query string', async () => {
    const { getByLabelText } = render(CostCalculator, { props: { lang: 'en' } });
    await fireEvent.input(getByLabelText('Tools the agent has'), { target: { value: '200' } });
    const params = new URLSearchParams(window.location.search);
    expect(params.get('tools')).toBe('200');
  });

  it('preserves unrelated query params (e.g. UTM) while syncing', async () => {
    window.history.replaceState(null, '', '/?utm_source=newsletter');
    const { getByLabelText } = render(CostCalculator, { props: { lang: 'en' } });
    await fireEvent.input(getByLabelText('Tools the agent has'), { target: { value: '200' } });
    const params = new URLSearchParams(window.location.search);
    expect(params.get('utm_source')).toBe('newsletter');
    expect(params.get('tools')).toBe('200');
  });

  it('restores inputs from a shared link on mount', () => {
    window.history.replaceState(null, '', '/?tools=200&model=gpt-5.6-sol&euResidency=1');
    const { getByLabelText } = render(CostCalculator, { props: { lang: 'en' } });
    expect((getByLabelText('Tools the agent has') as HTMLInputElement).value).toBe('200');
    expect((getByLabelText(/EU data residency/) as HTMLInputElement).checked).toBe(true);
  });

  it('keeps syncing further edits after restoring from a shared link', async () => {
    window.history.replaceState(null, '', '/?tools=200');
    const { getByLabelText } = render(CostCalculator, { props: { lang: 'en' } });
    await fireEvent.input(getByLabelText('Tools the agent has'), { target: { value: '5' } });
    const params = new URLSearchParams(window.location.search);
    expect(params.get('tools')).toBe('5');
  });

  it('falls back to defaults for an invalid shared value', () => {
    window.history.replaceState(null, '', '/?tools=not-a-number');
    const { getByLabelText } = render(CostCalculator, { props: { lang: 'en' } });
    expect((getByLabelText('Tools the agent has') as HTMLInputElement).value).toBe('80');
  });
});

describe('CostCalculator copy-link button', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('copies the current URL and confirms it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { getByTestId } = render(CostCalculator, { props: { lang: 'en' } });

    await fireEvent.click(getByTestId('copy-link-button'));

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(getByTestId('copy-link-button').textContent).toContain('Link copied!');
  });

  it('shows a failure message when copying fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    document.execCommand = vi.fn().mockReturnValue(false);
    const { getByTestId } = render(CostCalculator, { props: { lang: 'en' } });

    await fireEvent.click(getByTestId('copy-link-button'));

    expect(getByTestId('copy-link-button').textContent).toMatch(/Couldn't copy/);
  });
});

describe('CostCalculator discuss link', () => {
  it('points at the home page contact section with a prefilled summary', () => {
    const { getByTestId } = render(CostCalculator, { props: { lang: 'en' } });
    const href = getByTestId('discuss-link').getAttribute('href') ?? '';
    expect(href).toContain('#contact');
    expect(href.startsWith('/en/?msg=')).toBe(true);
    expect(decodeURIComponent(href)).toContain('agent-cost estimate');
  });

  it('points at the Polish root for the default (pl) locale', () => {
    const { getByTestId } = render(CostCalculator, { props: { lang: 'pl' } });
    const href = getByTestId('discuss-link').getAttribute('href') ?? '';
    expect(href.startsWith('/?msg=')).toBe(true);
  });

  it('locale-prefixes the link for non-Polish languages', () => {
    const { getByTestId } = render(CostCalculator, { props: { lang: 'ru' } });
    const href = getByTestId('discuss-link').getAttribute('href') ?? '';
    expect(href.startsWith('/ru/?msg=')).toBe(true);
  });
});

describe('CostCalculator engagement tracking', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cookieConsent', 'accepted');
    window.history.replaceState(null, '', '/blog/cost-of-ai-agent/');
    window.gtag = vi.fn();
    window.mktai = vi.fn();
  });

  function calculatorEvents() {
    return vi.mocked(window.gtag!).mock.calls.filter((call) => call[1] === 'calculator_use');
  }

  it('stays silent until the visitor edits an input', () => {
    render(CostCalculator, { props: { lang: 'pl' } });
    expect(calculatorEvents()).toHaveLength(0);
  });

  it('fires calculator_use on the first edit', async () => {
    const { getByLabelText } = render(CostCalculator, { props: { lang: 'pl' } });
    await fireEvent.input(getByLabelText('Liczba narzędzi agenta'), { target: { value: '120' } });
    expect(calculatorEvents()).toHaveLength(1);
  });

  it('does not fire again on later edits', async () => {
    const { getByLabelText } = render(CostCalculator, { props: { lang: 'pl' } });
    const tools = getByLabelText('Liczba narzędzi agenta');
    await fireEvent.input(tools, { target: { value: '120' } });
    await fireEvent.input(tools, { target: { value: '130' } });
    expect(calculatorEvents()).toHaveLength(1);
  });

  it('sends nothing when cookies were not accepted', async () => {
    localStorage.setItem('cookieConsent', 'rejected');
    const { getByLabelText } = render(CostCalculator, { props: { lang: 'pl' } });
    await fireEvent.input(getByLabelText('Liczba narzędzi agenta'), { target: { value: '120' } });
    expect(window.gtag).not.toHaveBeenCalled();
  });
});
