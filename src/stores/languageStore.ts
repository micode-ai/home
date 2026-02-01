import { writable, type Writable } from 'svelte/store';
import { getItem, setItem } from '../services/storage';

/**
 * Language store for managing the current language state
 * Supports Polish ('pl') and English ('en')
 * Defaults to Polish ('pl')
 */

export type Language = 'pl' | 'en';

const STORAGE_KEY = 'micode_language';

export interface LanguageStore extends Writable<Language> {
  setLanguage: (lang: string) => void;
  getCurrentLanguage: () => Language;
}

// Create a writable store with language loaded from localStorage or default to 'pl'
const createLanguageStore = (): LanguageStore => {
  // Load language from localStorage on initialization
  const storedLanguage = getItem(STORAGE_KEY);
  const initialLanguage: Language = 
    (storedLanguage === 'pl' || storedLanguage === 'en') ? storedLanguage : 'pl';
  
  const { subscribe, set, update } = writable<Language>(initialLanguage);

  return {
    subscribe,
    set,
    update,
    
    /**
     * Set the current language
     * @param lang - Language code ('pl' or 'en')
     */
    setLanguage: (lang: string) => {
      if (lang === 'pl' || lang === 'en') {
        set(lang);
        // Save language to localStorage on change
        setItem(STORAGE_KEY, lang);
      } else {
        console.warn(`Invalid language code: ${lang}. Defaulting to 'pl'.`);
        set('pl');
        setItem(STORAGE_KEY, 'pl');
      }
    },
    
    /**
     * Get the current language value
     * @returns Current language code ('pl' or 'en')
     */
    getCurrentLanguage: (): Language => {
      let currentLang: Language = 'pl';
      // Subscribe temporarily to get the current value
      const unsubscribe = subscribe(value => {
        currentLang = value;
      });
      unsubscribe();
      return currentLang;
    }
  };
};

export const languageStore = createLanguageStore();
