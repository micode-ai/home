/**
 * i18n translation service
 * Provides translation lookup with nested key support
 */

/**
 * Translation dictionary type
 */
export type Translations = {
  [lang: string]: Record<string, any>;
};

/**
 * In-memory translation storage
 */
let translations: Translations = {};

/**
 * Load translations into memory
 * @param data - Translation data object
 */
export function loadTranslations(data: Translations): void {
  translations = data;
}

/**
 * Get translation for a given key and language
 * Supports nested keys with dot notation (e.g., 'services.mobile.title')
 * Returns the key itself if translation is not found
 * 
 * @param key - Translation key (supports dot notation for nested keys)
 * @param lang - Language code ('pl' or 'en')
 * @returns Translated string or key if not found
 */
export function t(key: string, lang: string): string {
  // Check if language exists
  if (!translations[lang]) {
    return key;
  }

  // Split key by dots for nested access
  const keys = key.split('.');
  let value: any = translations[lang];

  // Traverse the nested object
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Key not found, return the original key
      return key;
    }
  }

  // If final value is a string, return it; otherwise return the key
  if (typeof value === 'string') {
    return value;
  }

  return key;
}
