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
