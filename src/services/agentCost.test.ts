import { describe, it, expect } from 'vitest';
import { computeAgentCost, MODEL_PRICES, PRICES_SNAPSHOT_DATE, type CostInputs } from './agentCost';

const base: CostInputs = {
  tools: 80,
  tokensPerToolSchema: 180,
  systemPromptTokens: 1200,
  historyTokens: 2000,
  ragTokens: 0,
  outputTokensPerStep: 300,
  stepsMin: 8,
  stepsMax: 8,
  tasksPerDay: 50,
  cachedShare: 0,
  model: 'gpt-5.4-mini',
  euResidency: false,
};

describe('computeAgentCost', () => {
  it('prices a task from its per-step token load', () => {
    const r = computeAgentCost(base);
    // 80 tools x 180 tok = 14400 tok/request; x8 steps = 115200 tok at $0.75/1M
    expect(r.low.components.toolSchemas).toBeCloseTo(0.0864 * 50 * 30, 4);
    expect(r.low.perTask).toBeCloseTo(0.1164, 6);
    expect(r.low.monthly).toBeCloseTo(174.6, 4);
  });

  it('makes tool schemas the dominant line item', () => {
    const r = computeAgentCost(base);
    expect(r.low.components.toolSchemas / r.low.monthly).toBeGreaterThan(0.7);
  });

  it('applies the cache discount only to the stable prefix', () => {
    const r = computeAgentCost({ ...base, cachedShare: 0.9 });
    // prefix blended price = 0.1*0.75 + 0.9*0.075 = 0.1425
    expect(r.low.components.toolSchemas).toBeCloseTo(0.016416 * 50 * 30, 4);
    // history is volatile — never discounted
    expect(r.low.components.history).toBeCloseTo(0.012 * 50 * 30, 4);
    expect(r.low.monthly).toBeCloseTo(60.876, 3);
  });

  it('spans the range from min steps with cache to max steps without', () => {
    const r = computeAgentCost({ ...base, stepsMin: 4, stepsMax: 16, cachedShare: 0.9 });
    expect(r.low.monthly).toBeLessThan(r.high.monthly);
    // high ignores the cache entirely
    const noCache = computeAgentCost({ ...base, stepsMin: 16, stepsMax: 16, cachedShare: 0 });
    expect(r.high.monthly).toBeCloseTo(noCache.low.monthly, 6);
  });

  it('adds 10% for EU data residency', () => {
    const plain = computeAgentCost(base).low.monthly;
    const eu = computeAgentCost({ ...base, euResidency: true }).low.monthly;
    expect(eu).toBeCloseTo(plain * 1.1, 6);
  });

  it('treats blank, negative, and non-finite inputs as zero instead of throwing', () => {
    const r = computeAgentCost({
      ...base,
      tools: NaN,
      systemPromptTokens: -500,
      historyTokens: Number.POSITIVE_INFINITY,
      ragTokens: 0,
      outputTokensPerStep: 0,
      tasksPerDay: 0,
    });
    expect(r.low.monthly).toBe(0);
    expect(Number.isFinite(r.low.perTask)).toBe(true);
  });

  it('clamps cachedShare into 0..1', () => {
    const over = computeAgentCost({ ...base, cachedShare: 5 });
    const one = computeAgentCost({ ...base, cachedShare: 1 });
    expect(over.low.monthly).toBeCloseTo(one.low.monthly, 6);
  });

  it('exposes the price snapshot date and a cached price for every model', () => {
    expect(PRICES_SNAPSHOT_DATE).toBe('2026-07-25');
    for (const [id, p] of Object.entries(MODEL_PRICES)) {
      expect(p.cachedInput, id).toBeLessThan(p.input);
      expect(p.output, id).toBeGreaterThan(p.input);
    }
  });
});
