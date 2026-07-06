import type { Language } from '../stores/languageStore';

export const LOCALES: Language[] = ['pl', 'en', 'ru'];

/**
 * Remove a leading `/en` or `/ru` locale segment from a pathname, returning the
 * route path without a leading slash. Polish has no prefix.
 *
 * `/en/products/x/` -> `products/x/`, `/` -> ``, `/blog/` -> `blog/`.
 */
export function stripLocale(pathname: string): string {
  const rest = pathname.replace(/^\/+/, '');
  const [first, ...others] = rest.split('/');
  if (first === 'en' || first === 'ru') {
    return others.join('/');
  }
  return rest;
}

/**
 * Build the absolute-path URL for the current route in a target locale.
 * Polish lives at the root; en/ru live under `/en/` and `/ru/`.
 */
export function localizedPath(pathname: string, lang: Language): string {
  const route = stripLocale(pathname);
  return (lang === 'pl' ? '/' : `/${lang}/`) + route;
}

/**
 * Prefix a root-relative internal link with the active locale so navigation
 * stays inside the same language tree. Polish has no prefix.
 *
 * `withLocale('/', 'en')` -> `/en/`, `withLocale('/blog/', 'ru')` -> `/ru/blog/`,
 * `withLocale('/#services', 'en')` -> `/en/#services`.
 */
export function withLocale(path: string, lang: Language): string {
  return lang === 'pl' ? path : `/${lang}${path}`;
}
