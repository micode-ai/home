import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import SEO from './SEO.svelte';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';
// `?raw` rather than fs: the tsconfig for src/ has no node types.
import indexHtml from '../../index.html?raw';

// "micode" is the brand query the site loses on today, and the entity's only
// declared name was the legal one ("MiCode Sp. z o.o."). The bare brand and the
// hyphenated domain spelling have to be declared as alternate names for the
// query to resolve to this entity at all.
const EXPECTED_ALTERNATES = ['MiCode', 'Mi-Code'];

beforeAll(() => {
  loadTranslations({ pl: plTranslations, en: enTranslations, ru: ruTranslations });
});

beforeEach(() => {
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((n) => n.remove());
  languageStore.set('pl');
});

function renderedGraph(): Record<string, unknown>[] {
  render(SEO);
  const script = document.head.querySelector('script[type="application/ld+json"]');
  expect(script?.textContent).toBeTruthy();
  return JSON.parse(script!.textContent!);
}

function nodeOfType(graph: Record<string, unknown>[], type: string) {
  const node = graph.find((entry) => {
    const t = entry['@type'];
    return Array.isArray(t) ? t.includes(type) : t === type;
  });
  expect(node).toBeTruthy();
  return node!;
}

describe('SEO structured data brand identity', () => {
  it('declares the brand alternate names on the Organization', () => {
    const org = nodeOfType(renderedGraph(), 'Organization');
    expect(org.alternateName).toEqual(expect.arrayContaining(EXPECTED_ALTERNATES));
  });

  it('declares the legal name on the Organization', () => {
    const org = nodeOfType(renderedGraph(), 'Organization');
    expect(org.legalName).toBe('MiCode Sp. z o.o.');
  });

  it('declares the brand alternate name on the WebSite node', () => {
    const site = nodeOfType(renderedGraph(), 'WebSite');
    expect(site.alternateName).toBe('MiCode');
  });
});

describe('static JSON-LD in index.html stays in sync', () => {
  // Non-JS crawlers only ever see the static copy in the HTML shell, and
  // scripts/prerender.mjs carries it into /en/ and /ru/ verbatim. SEO.svelte
  // rewrites it after hydration, so the two must agree.
  it.each(EXPECTED_ALTERNATES)('names %s in the static graph', (alternate) => {
    expect(indexHtml).toContain(`"${alternate}"`);
  });

  it('declares legalName in the static graph', () => {
    expect(indexHtml).toContain('"legalName": "MiCode Sp. z o.o."');
  });
});
