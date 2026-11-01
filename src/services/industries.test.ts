import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/svelte';
import { get } from 'svelte/store';
import {
  industries,
  getIndustry,
  ctaHref,
  industriesForProduct,
  industryJsonLd,
  loc,
} from './industries';
import products from '../data/products.json';
import IndustryPage from '../components/IndustryPage.svelte';
import { loadTranslations } from './i18n';
import { languageStore } from '../stores/languageStore';
import pl from '../data/pl.json';
import en from '../data/en.json';
import ru from '../data/ru.json';

const LANGS = ['pl', 'en', 'ru'] as const;

function collectLoc(node: unknown, path: string, out: string[]) {
  if (node && typeof node === 'object') {
    const keys = Object.keys(node as object);
    if (keys.includes('pl') && keys.includes('en') && keys.includes('ru')) {
      for (const l of LANGS) {
        if (!(node as any)[l]?.trim()) out.push(`${path}.${l}`);
      }
      return;
    }
    for (const k of keys) collectLoc((node as any)[k], `${path}.${k}`, out);
  }
}

describe('industries data', () => {
  it('has the three launch industries', () => {
    expect(industries.map((i) => i.id)).toEqual(['accounting', 'legal', 'smb-ops']);
  });

  it('has no missing translations', () => {
    const missing: string[] = [];
    collectLoc(industries, 'industries', missing);
    expect(missing).toEqual([]);
  });

  it('only references existing products and has a use case for each', () => {
    const ids = new Set(products.map((p) => p.id));
    for (const i of industries) {
      for (const pid of i.productIds) {
        expect(ids.has(pid)).toBe(true);
        expect((i.useCases as Record<string, unknown>)[pid]).toBeTruthy();
      }
    }
  });
});

describe('industries service', () => {
  it('prefills the contact form via msg and targets #contact', () => {
    const i = getIndustry('legal')!;
    const href = ctaHref(i, 'en');
    expect(href.startsWith('/en/for/legal/?msg=')).toBe(true);
    expect(href.endsWith('#contact')).toBe(true);
    const msg = new URL(href, 'https://x.test').searchParams.get('msg');
    expect(msg).toBe(loc(i.ctaMessage, 'en'));
  });

  it('keeps Polish unprefixed', () => {
    expect(ctaHref(getIndustry('accounting')!, 'pl').startsWith('/for/accounting/?msg=')).toBe(true);
  });

  it('finds industries by product', () => {
    expect(industriesForProduct('legalka-kb').map((i) => i.id)).toEqual(['legal']);
    expect(industriesForProduct('budget-assistant').length).toBe(2);
    expect(industriesForProduct('ngx-chat')).toEqual([]);
  });

  it('builds WebPage, BreadcrumbList and FAQPage JSON-LD', () => {
    const nodes = industryJsonLd(getIndustry('accounting')!, 'ru') as any[];
    expect(nodes.map((n) => n['@type'])).toEqual(['WebPage', 'BreadcrumbList', 'FAQPage']);
    expect(nodes[0].url).toBe('https://mi-code.pl/ru/for/accounting/');
    expect(nodes[2].mainEntity.length).toBe(3);
  });
});

describe('IndustryPage', () => {
  beforeAll(() => {
    loadTranslations({ pl, en, ru });
  });

  it('renders one h1 in the active language and a prefilled CTA', () => {
    languageStore.set('en');
    const { container } = render(IndustryPage, { props: { industryId: 'legal' } });
    expect(container.querySelectorAll('h1').length).toBe(1);
    expect(container.querySelector('h1')!.textContent).toBe('AI for law firms');
    const cta = container.querySelector('a.cta') as HTMLAnchorElement;
    expect(cta.getAttribute('href')).toContain('?msg=');
    expect(container.querySelector('a.more')!.getAttribute('href')).toBe('/en/products/legalka-kb/');
    expect(get(languageStore)).toBe('en');
    languageStore.set('pl');
  });

  it('shows a not-found message for an unknown id', () => {
    languageStore.set('pl');
    const { container } = render(IndustryPage, { props: { industryId: 'nope' } });
    expect(container.querySelector('.not-found')).toBeTruthy();
  });
});
