import { describe, it, expect } from 'vitest';
import { fontSizeFor } from './generate-og-images.mjs';

describe('fontSizeFor', () => {
  it('gives the largest tier to short titles', () => {
    expect(fontSizeFor('Short title')).toBe(58);
    expect(fontSizeFor('a'.repeat(50))).toBe(58);
  });

  it('steps down as titles get longer', () => {
    expect(fontSizeFor('a'.repeat(51))).toBe(48);
    expect(fontSizeFor('a'.repeat(75))).toBe(48);
    expect(fontSizeFor('a'.repeat(76))).toBe(40);
    expect(fontSizeFor('a'.repeat(100))).toBe(40);
    expect(fontSizeFor('a'.repeat(101))).toBe(34);
  });

  it('never returns a size below the smallest tier, however long the title', () => {
    expect(fontSizeFor('a'.repeat(500))).toBe(34);
  });
});
