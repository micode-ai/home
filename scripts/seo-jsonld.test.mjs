import { describe, it, expect } from 'vitest';
import { localizeSiteUrl, localizeHeadJsonLd, jsonLdTypes } from './seo-jsonld.mjs';

const ld = (data) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
const page = (head, body = '') => `<html><head>${head}</head><body>${body}</body></html>`;
const headLd = (html) =>
  [...html.slice(0, html.indexOf('</head>')).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1])
  );

describe('localizeSiteUrl', () => {
  it('moves a site page under the locale prefix', () => {
    expect(localizeSiteUrl('https://mi-code.pl/blog/x/', 'en')).toBe('https://mi-code.pl/en/blog/x/');
    expect(localizeSiteUrl('https://mi-code.pl/', 'ru')).toBe('https://mi-code.pl/ru/');
    expect(localizeSiteUrl('https://mi-code.pl/#products', 'en')).toBe('https://mi-code.pl/en/#products');
  });

  it('leaves Polish, foreign URLs, files and already-localized URLs alone', () => {
    expect(localizeSiteUrl('https://mi-code.pl/blog/x/', 'pl')).toBe('https://mi-code.pl/blog/x/');
    expect(localizeSiteUrl('https://github.com/micode-ai', 'en')).toBe('https://github.com/micode-ai');
    expect(localizeSiteUrl('https://mi-code.pl/og-image.png', 'en')).toBe('https://mi-code.pl/og-image.png');
    expect(localizeSiteUrl('https://mi-code.pl/en/blog/', 'en')).toBe('https://mi-code.pl/en/blog/');
  });
});

describe('localizeHeadJsonLd', () => {
  const article = [
    {
      '@type': 'BlogPosting',
      headline: 'Po polsku',
      url: 'https://mi-code.pl/blog/x/',
      inLanguage: 'pl',
      image: 'https://mi-code.pl/og-image.png',
      author: { '@type': 'Person', url: 'https://www.linkedin.com/in/x/' },
      publisher: { '@type': 'Organization', url: 'https://mi-code.pl/' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://mi-code.pl/blog/x/' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', position: 1, item: 'https://mi-code.pl/' }],
    },
  ];

  it('localizes page URLs and inLanguage, keeps the organisation at the root', () => {
    const [nodes] = headLd(localizeHeadJsonLd(page(ld(article)), { lang: 'en' }));
    expect(nodes[0].url).toBe('https://mi-code.pl/en/blog/x/');
    expect(nodes[0].mainEntityOfPage['@id']).toBe('https://mi-code.pl/en/blog/x/');
    expect(nodes[0].inLanguage).toBe('en');
    expect(nodes[0].image).toBe('https://mi-code.pl/og-image.png');
    expect(nodes[0].publisher.url).toBe('https://mi-code.pl/');
    expect(nodes[1].itemListElement[0].item).toBe('https://mi-code.pl/en/');
  });

  it('applies the per-page edit after localizing', () => {
    const html = localizeHeadJsonLd(page(ld(article)), {
      lang: 'ru',
      edit: (n) => {
        if (n['@type'] === 'BlogPosting') n.headline = 'По-русски';
      },
    });
    expect(headLd(html)[0][0].headline).toBe('По-русски');
  });

  it('drops head nodes the body already emits, and the whole block when nothing is left', () => {
    const head = ld([{ '@type': 'FAQPage' }, { '@type': 'SoftwareApplication', name: 'A' }]) + ld({ '@type': 'BreadcrumbList' });
    const html = localizeHeadJsonLd(page(head), { lang: 'pl', drop: new Set(['FAQPage', 'BreadcrumbList']) });
    const blocks = headLd(html);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual([{ '@type': 'SoftwareApplication', name: 'A' }]);
  });

  it('never touches JSON-LD in the body', () => {
    const body = ld({ '@type': 'FAQPage', inLanguage: 'pl' });
    const html = localizeHeadJsonLd(page('', body), { lang: 'en', drop: new Set(['FAQPage']) });
    expect(html).toContain(body);
  });

  it('escapes < so text cannot close the script element', () => {
    const html = localizeHeadJsonLd(page(ld({ '@type': 'WebPage', name: 'a' })), {
      lang: 'en',
      edit: (n) => (n.name = '</script><b>'),
    });
    expect(html).not.toContain('</script><b>');
  });
});

describe('jsonLdTypes', () => {
  it('collects every declared @type', () => {
    const html = ld([{ '@type': 'FAQPage' }, { '@type': ['Organization', 'ProfessionalService'] }]) + 'x' + ld({ '@type': 'BreadcrumbList' });
    expect([...jsonLdTypes(html)].sort()).toEqual(['BreadcrumbList', 'FAQPage', 'Organization', 'ProfessionalService']);
  });
});
