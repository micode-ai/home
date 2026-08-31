import { describe, it, expect } from 'vitest';
import { convert, formatCurrency, CURRENCIES, PLN_PER_USD } from './currency';

describe('convert()', () => {
  it('leaves USD amounts unchanged', () => {
    expect(convert(100, 'USD')).toBe(100);
  });

  it('multiplies by the fixed rate for PLN', () => {
    expect(convert(100, 'PLN')).toBe(100 * PLN_PER_USD);
  });
});

describe('formatCurrency()', () => {
  it('formats USD with a dollar sign and en-US grouping', () => {
    expect(formatCurrency(188.1, 'USD')).toBe('$188.10');
  });

  it('formats PLN converted and with the pl-PL currency format', () => {
    const converted = (188.1 * PLN_PER_USD).toFixed(2).replace('.', ',');
    expect(formatCurrency(188.1, 'PLN').replace(/\s/g, ' ')).toBe(`${converted} zł`);
  });

  it('rounds to at most 2 fraction digits', () => {
    expect(formatCurrency(1.005, 'USD')).toMatch(/^\$1\.0[01]$/);
  });
});

describe('CURRENCIES', () => {
  it('lists exactly USD and PLN', () => {
    expect(CURRENCIES).toEqual(['USD', 'PLN']);
  });
});
