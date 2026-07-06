import { writable, type Writable } from 'svelte/store';
import { setItem } from '../services/storage';

/**
 * Language store for managing the current language state
 * Supports Polish ('pl'), English ('en') and Russian ('ru')
 * Defaults to Polish ('pl')
 */

export type Language = 'pl' | 'en' | 'ru';

const STORAGE_KEY = 'micode_language';

const isLanguage = (value: unknown): value is Language =>
  value === 'pl' || value === 'en' || value === 'ru';

export interface LanguageStore extends Writable<Language> {
  setLanguage: (lang: string) => void;
  getCurrentLanguage: () => Language;
}

/**
 * Determine the initial language.
 *
 * The URL path is authoritative: prerendered locale pages live under `/en/…`
 * and `/ru/…`, so the client must pick the same language the page was
 * prerendered in — otherwise hydration mismatches. Root and unknown prefixes
 * are Polish (the canonical default). localStorage is intentionally NOT used
 * for the initial value, so hydration always matches the static HTML.
 *
 * On the server (prerender) there is no `window`; `renderPage()` sets the
 * locale explicitly before rendering, so we just default to 'pl' here.
 */
const detectInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const segment = window.location.pathname.replace(/^\/+/, '').split('/')[0];
    if (segment === 'en' || segment === 'ru') return segment;
  }
  return 'pl';
};

// Create a writable store with language derived from the URL (see above)
const createLanguageStore = (): LanguageStore => {
  const initialLanguage: Language = detectInitialLanguage();

  const { subscribe, set, update } = writable<Language>(initialLanguage);

  return {
    subscribe,
    set,
    update,

    /**
     * Set the current language
     * @param lang - Language code ('pl', 'en' or 'ru')
     */
    setLanguage: (lang: string) => {
      if (isLanguage(lang)) {
        set(lang);
        setItem(STORAGE_KEY, lang);
      } else {
        console.warn(`Invalid language code: ${lang}. Defaulting to 'pl'.`);
        set('pl');
        setItem(STORAGE_KEY, 'pl');
      }
    },

    /**
     * Get the current language value
     * @returns Current language code ('pl', 'en' or 'ru')
     */
    getCurrentLanguage: (): Language => {
      let currentLang: Language = 'pl';
      const unsubscribe = subscribe(value => {
        currentLang = value;
      });
      unsubscribe();
      return currentLang;
    }
  };
};

export const languageStore = createLanguageStore();
