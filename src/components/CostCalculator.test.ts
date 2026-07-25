import { describe, it, expect, beforeAll } from 'vitest';
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
});
