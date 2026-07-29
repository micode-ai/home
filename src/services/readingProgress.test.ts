import { describe, it, expect } from 'vitest';
import { computeReadingProgress } from './readingProgress';

describe('computeReadingProgress', () => {
  it('is 0 before the article body reaches the top of the viewport', () => {
    // Article body starts 400px below the viewport top — reader hasn't reached it yet.
    expect(computeReadingProgress(400, 3000, 800)).toBe(0);
  });

  it('is 100 once the article body has fully scrolled past', () => {
    // articleTop is far more negative than -(articleHeight - viewportHeight) would require.
    expect(computeReadingProgress(-10000, 3000, 800)).toBe(100);
  });

  it('is 100 exactly when scrolled to the last scrollable pixel', () => {
    // scrollable = 3000 - 800 = 2200
    expect(computeReadingProgress(-2200, 3000, 800)).toBe(100);
  });

  it('is a proportional percentage partway through', () => {
    // scrollable = 2200, scrolled 1100 -> 50%
    expect(computeReadingProgress(-1100, 3000, 800)).toBe(50);
  });

  it('is 100 when the whole article body fits within one viewport', () => {
    expect(computeReadingProgress(0, 600, 800)).toBe(100);
    expect(computeReadingProgress(0, 800, 800)).toBe(100);
  });

  it('never returns a value outside [0, 100]', () => {
    for (const top of [-50000, -2200, -1000, 0, 400, 50000]) {
      const value = computeReadingProgress(top, 3000, 800);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});
