import { describe, it, expect } from 'vitest';
import {
  applyEstimateParams,
  decodeEstimateQuery,
  estimateFieldsEqual,
  hasEstimateParams,
  type CostCalculatorFields,
} from './costEstimateUrl';

const DEFAULTS: CostCalculatorFields = {
  tools: 80,
  tokensPerToolSchema: 180,
  systemPromptTokens: 1200,
  historyTokens: 2000,
  ragTokens: 1500,
  outputTokensPerStep: 300,
  stepsMin: 4,
  stepsMax: 12,
  tasksPerDay: 50,
  cachedSharePct: 0,
  model: 'gpt-5.4-mini',
  euResidency: false,
};

describe('applyEstimateParams()', () => {
  it('sets all 12 owned keys', () => {
    const params = new URLSearchParams();
    applyEstimateParams(params, DEFAULTS);
    expect(params.get('tools')).toBe('80');
    expect(params.get('model')).toBe('gpt-5.4-mini');
    expect(params.get('euResidency')).toBe('0');
    expect(params.get('cachedSharePct')).toBe('0');
  });

  it('encodes euResidency true as "1"', () => {
    const params = new URLSearchParams();
    applyEstimateParams(params, { ...DEFAULTS, euResidency: true });
    expect(params.get('euResidency')).toBe('1');
  });

  it('preserves unrelated keys already present', () => {
    const params = new URLSearchParams('utm_source=newsletter&utm_campaign=q3');
    applyEstimateParams(params, DEFAULTS);
    expect(params.get('utm_source')).toBe('newsletter');
    expect(params.get('utm_campaign')).toBe('q3');
    expect(params.get('tools')).toBe('80');
  });

  it('overwrites keys it owns on a second call', () => {
    const params = new URLSearchParams();
    applyEstimateParams(params, DEFAULTS);
    applyEstimateParams(params, { ...DEFAULTS, tools: 160 });
    expect(params.get('tools')).toBe('160');
    expect(Array.from(params.entries()).filter(([k]) => k === 'tools')).toHaveLength(1);
  });
});

describe('decodeEstimateQuery()', () => {
  it('round-trips whatever applyEstimateParams wrote', () => {
    const fields: CostCalculatorFields = { ...DEFAULTS, tools: 160, model: 'gpt-5.6-sol', euResidency: true };
    const params = new URLSearchParams();
    applyEstimateParams(params, fields);
    expect(decodeEstimateQuery(`?${params}`, DEFAULTS)).toEqual(fields);
  });

  it('falls back to defaults when the query string is empty', () => {
    expect(decodeEstimateQuery('', DEFAULTS)).toEqual(DEFAULTS);
  });

  it('falls back per-field on a partial query string', () => {
    const result = decodeEstimateQuery('?tools=200', DEFAULTS);
    expect(result.tools).toBe(200);
    expect(result.tasksPerDay).toBe(DEFAULTS.tasksPerDay);
  });

  it('ignores a non-numeric value for a numeric field', () => {
    const result = decodeEstimateQuery('?tools=not-a-number', DEFAULTS);
    expect(result.tools).toBe(DEFAULTS.tools);
  });

  it('ignores an unrecognized model id', () => {
    const result = decodeEstimateQuery('?model=gpt-9000', DEFAULTS);
    expect(result.model).toBe(DEFAULTS.model);
  });

  it('accepts every known model id', () => {
    const result = decodeEstimateQuery('?model=gpt-5.6-luna', DEFAULTS);
    expect(result.model).toBe('gpt-5.6-luna');
  });

  it('treats euResidency=1 as true and anything else as false', () => {
    expect(decodeEstimateQuery('?euResidency=1', DEFAULTS).euResidency).toBe(true);
    expect(decodeEstimateQuery('?euResidency=0', DEFAULTS).euResidency).toBe(false);
    expect(decodeEstimateQuery('?euResidency=yes', DEFAULTS).euResidency).toBe(false);
  });

  it('ignores unrelated params', () => {
    const result = decodeEstimateQuery('?utm_source=newsletter&tools=42', DEFAULTS);
    expect(result.tools).toBe(42);
  });
});

describe('estimateFieldsEqual()', () => {
  it('is true for two identical field sets', () => {
    expect(estimateFieldsEqual(DEFAULTS, { ...DEFAULTS })).toBe(true);
  });

  it('is false when a numeric field differs', () => {
    expect(estimateFieldsEqual(DEFAULTS, { ...DEFAULTS, tools: 81 })).toBe(false);
  });

  it('is false when the model differs', () => {
    expect(estimateFieldsEqual(DEFAULTS, { ...DEFAULTS, model: 'gpt-5.5' })).toBe(false);
  });

  it('is false when euResidency differs', () => {
    expect(estimateFieldsEqual(DEFAULTS, { ...DEFAULTS, euResidency: true })).toBe(false);
  });
});

describe('hasEstimateParams()', () => {
  it('is false for an empty query string', () => {
    expect(hasEstimateParams('')).toBe(false);
  });

  it('is false when only unrelated params are present', () => {
    expect(hasEstimateParams('?utm_source=newsletter')).toBe(false);
  });

  it('is true once the tools key is present', () => {
    expect(hasEstimateParams('?tools=80')).toBe(true);
  });
});
