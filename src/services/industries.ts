import industriesData from '../data/industries.json';
import type { Language } from '../stores/languageStore';
import { withLocale } from './locale';

export type Loc = { pl: string; en: string; ru: string };
export type Industry = (typeof industriesData)[number];

export const industries: Industry[] = industriesData as Industry[];

export const SITE = 'https://mi-code.pl';

export function loc(field: Loc, lang: Language): string {
  return field[lang] ?? field.pl;
}

export function getIndustry(id: string): Industry | undefined {
  return industries.find((i) => i.id === id);
}

export function industryPath(id: string): string {
  return `/for/${id}/`;
}

/** CTA target: prefills the contact form via ContactForm's `?msg=` param. */
export function ctaHref(industry: Industry, lang: Language): string {
  const msg = encodeURIComponent(loc(industry.ctaMessage, lang));
  return `${withLocale(industryPath(industry.id), lang)}?msg=${msg}#contact`;
}

export function industriesForProduct(productId: string): Industry[] {
  return industries.filter((i) => i.productIds.includes(productId));
}

export const uiLabels = {
  painPoints: { pl: 'Znasz to z codziennej pracy?', en: 'Sound familiar?', ru: 'Знакомо?' },
  products: { pl: 'Produkty dla Twojej branży', en: 'Products for your industry', ru: 'Продукты для вашей отрасли' },
  viewProduct: { pl: 'Zobacz produkt', en: 'View product', ru: 'Смотреть продукт' },
  faq: { pl: 'Najczęstsze pytania', en: 'Frequently asked questions', ru: 'Частые вопросы' },
  solutions: { pl: 'Rozwiązania dla Twojej branży', en: 'Solutions for your industry', ru: 'Решения для вашей отрасли' },
  notFound: { pl: 'Nie znaleziono strony.', en: 'Page not found.', ru: 'Страница не найдена.' },
} satisfies Record<string, Loc>;

export function industryJsonLd(industry: Industry, lang: Language): object[] {
  const url = `${SITE}${withLocale(industryPath(industry.id), lang)}`;
  const title = loc(industry.title, lang);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: loc(industry.metaTitle, lang),
      description: loc(industry.metaDescription, lang),
      url,
      inLanguage: lang,
      isPartOf: { '@type': 'WebSite', name: 'MiCode Sp. z o.o.', url: `${SITE}/` },
      publisher: { '@type': 'Organization', name: 'MiCode Sp. z o.o.', url: `${SITE}/` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'MiCode', item: `${SITE}${withLocale('/', lang)}` },
        { '@type': 'ListItem', position: 2, name: title, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: industry.faq.map((f) => ({
        '@type': 'Question',
        name: loc(f.q, lang),
        acceptedAnswer: { '@type': 'Answer', text: loc(f.a, lang) },
      })),
    },
  ];
}
