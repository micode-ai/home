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
    const measured = new Set(config.prompts.map((p) => p.lang));
    const brandLangs = new Set(
      config.prompts.filter((p) => p.kind === 'brand').map((p) => p.lang),
    );
    // Brand prompts are the canary: if even these stop being cited, indexing
    // broke rather than marketing. They are useless if a language has none —
    // and a language we score without a canary produces a number we cannot read.
    for (const lang of measured) {
      expect(brandLangs, `no brand control for ${lang}`).toContain(lang);
    }
  });

  it('exercises every product page in at least two languages', () => {
    const products = JSON.parse(
      readFileSync(join(root, 'src/data/products.json'), 'utf8'),
    ).map((product) => `/products/${product.id}/`);

    for (const target of products) {
      const langs = new Set(
        config.prompts.filter((p) => p.target === target).map((p) => p.lang),
      );
      // A page can be cited in one language and invisible in another. Measuring
      // a product in a single language hides exactly that.
      expect(langs.size, `${target} is only measured in ${[...langs].join(', ') || 'no'} language(s)`)
        .toBeGreaterThanOrEqual(2);
    }
  });

  it('targets only routes the site actually builds', () => {
    const viteConfig = readFileSync(join(root, 'vite.config.ts'), 'utf8');
    const routes = new Set(['/']);
    for (const match of viteConfig.matchAll(/resolve\(__dirname,\s*["'`]([^"'`]+)["'`]\)/g)) {
      const route = match[1].replace(/index\.html$/, '');
      routes.add(route.startsWith('/') ? route : `/${route}`);
    }

    for (const prompt of config.prompts.filter((p) => p.target)) {
      // A prompt aimed at a dead URL makes the advice lie: it reports "the page
      // exists but they cite someone else" about a page nobody can visit.
      expect(routes, `${prompt.id} targets ${prompt.target}`).toContain(prompt.target);
    }
  });

  it('stays inside the free grounding budget at two repeats a run', () => {
    // 500 grounded requests per day are free, shared across Flash and Flash-Lite.
    expect(config.prompts.length * 2).toBeLessThan(500);
  });

  it('keeps a full sweep inside a week', () => {
    // The 500/day grounding allowance is not the binding limit — DEFAULT_DAILY_BUDGET
    // in run.mjs is 18 model calls, so the sweep runs as a cursor over several days.
    // A prompt set large enough that a sweep never closes yields no trend at all.
    const DAILY_BUDGET = 18;
    const days = Math.ceil((config.prompts.length * 2) / DAILY_BUDGET);
    expect(days, `a full sweep would take ${days} days`).toBeLessThanOrEqual(7);
  });

  it('points category prompts at a page we actually publish', () => {
    for (const p of config.prompts.filter((x) => x.target)) {
      expect(p.target.startsWith('/')).toBe(true);
    }
  });

  it('measures every owned property, not only the landing page', () => {
    expect(config.ownedDomains).toEqual(
      expect.arrayContaining(['mi-code.pl', 'eksiegowyai.pl', 'emarketingai.pl', 'ai-budget.pl']),
    );
  });

  it('keeps the primary domain inside the owned list', () => {
    expect(config.ownedDomains).toContain(config.domain);
  });
});
