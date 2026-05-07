import { writable, type Writable } from 'svelte/store';
import { getItem, setItem } from '../services/storage';

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

// Create a writable store with language loaded from localStorage or default to 'pl'
const createLanguageStore = (): LanguageStore => {
  const storedLanguage = getItem(STORAGE_KEY);
  const initialLanguage: Language = isLanguage(storedLanguage) ? storedLanguage : 'pl';

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
