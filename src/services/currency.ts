// Display-only currency conversion for the agent-cost calculator. `agentCost.ts` computes
// everything in USD; this module only converts and formats for display, never feeds back into
// the cost model itself.

export type Currency = 'USD' | 'PLN';

export const CURRENCIES: Currency[] = ['USD', 'PLN'];

/**
 * Fixed, periodically-updated conversion rate — not a live FX feed. Keeps the calculator
 * static-site-friendly (no runtime dependency, no build-time fetch). Bump this by hand when it
 * drifts too far from the market rate; shown in the UI (`costCalc.rateNote`) whenever PLN is
 * selected, so a stale rate is never mistaken for a live quote.
 */
export const PLN_PER_USD = 4.0;

const LOCALES: Record<Currency, string> = {
  USD: 'en-US',
  PLN: 'pl-PL',
};

export function convert(usdAmount: number, currency: Currency): number {
  return currency === 'PLN' ? usdAmount * PLN_PER_USD : usdAmount;
}

export function formatCurrency(usdAmount: number, currency: Currency): string {
  return new Intl.NumberFormat(LOCALES[currency], {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(convert(usdAmount, currency));
}
