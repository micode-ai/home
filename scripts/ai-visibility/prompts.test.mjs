import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const config = JSON.parse(
  readFileSync(join(root, 'docs/seo/ai-visibility/prompts.json'), 'utf8'),
);

describe('prompts.json', () => {
  it('measures the live domain', () => {
    expect(config.domain).toBe('mi-code.pl');
  });

  it('lists brand terms to detect an unlinked mention', () => {
    expect(config.brandTerms).toContain('MiCode');
    expect(config.brandTerms.length).toBeGreaterThanOrEqual(4);
  });

  it('has unique ids', () => {
    const ids = config.prompts.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses only supported languages and kinds', () => {
    for (const p of config.prompts) {
      expect(['pl', 'en', 'ru']).toContain(p.lang);
      expect(['category', 'brand']).toContain(p.kind);
      expect(p.text.length).toBeGreaterThan(15);
    }
  });

  it('keeps brand controls in every measured language', () => {
    const brandLangs = new Set(
      config.prompts.filter((p) => p.kind === 'brand').map((p) => p.lang),
    );
    // Brand prompts are the canary: if even these stop being cited, indexing
    // broke rather than marketing. They are useless if a language has none.
    expect(brandLangs.has('pl')).toBe(true);
    expect(brandLangs.has('en')).toBe(true);
  });

  it('stays inside the free grounding budget at two repeats a run', () => {
    // 500 grounded requests per day are free, shared across Flash and Flash-Lite.
    expect(config.prompts.length * 2).toBeLessThan(500);
  });

  it('points category prompts at a page we actually publish', () => {
    for (const p of config.prompts.filter((x) => x.target)) {
      expect(p.target.startsWith('/')).toBe(true);
    }
  });
});
