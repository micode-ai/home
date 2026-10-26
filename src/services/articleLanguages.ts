import type { Language } from '../stores/languageStore';
import { LOCALES } from './locale';

export type LangPost = Record<string, unknown>;

const SUFFIX: Record<Language, string> = { pl: 'Pl', en: 'En', ru: 'Ru' };

function hasText(post: LangPost, field: string, lang: Language): boolean {
  const value = post[field + SUFFIX[lang]];
  return typeof value === 'string' && value.trim() !== '';
}

/** Locales (in pl, en, ru order) in which the post has both a title and a body. */
export function availableLanguages(post: LangPost): Language[] {
  return LOCALES.filter((l) => hasText(post, 'title', l) && hasText(post, 'body', l));
}

/** The locale to render: `lang` if translated, else the first available one, else `lang`. */
export function resolveContentLanguage(post: LangPost, lang: Language): Language {
  const available = availableLanguages(post);
  return available.includes(lang) ? lang : (available[0] ?? lang);
}
