import { type Locale, locales, defaultLocale } from '@/i18n';

/**
 * Storage key for language preference in localStorage
 * Must match the key used in locale.store.ts
 */
const LOCALE_STORAGE_KEY = 'arvo_locale';

/**
 * Detects the user's preferred locale with the following priority:
 * 1. localStorage (for returning users)
 * 2. Browser language (if supported)
 * 3. Default locale (English)
 *
 * This is used for initial language detection on first visit
 * or when user is not authenticated.
 */
export function detectUserLocale(): Locale {
  // Only run in browser
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  try {
    // 1. Check localStorage for saved preference
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isValidLocale(stored)) {
      return stored as Locale;
    }

    // 2. Check browser language
    const browserLang = navigator.language.toLowerCase();

    // Check for Italian
    if (browserLang.startsWith('it')) {
      return 'it';
    }

    // Check for English
    if (browserLang.startsWith('en')) {
      return 'en';
    }

    // 3. Default to English
    return defaultLocale;
  } catch (error) {
    console.error('Error detecting user locale:', error);
    return defaultLocale;
  }
}

/**
 * Saves the user's language preference to localStorage
 */
export function saveLocaleToStorage(locale: Locale): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.error('Error saving locale to storage:', error);
  }
}

/**
 * Gets the saved locale from localStorage
 */
export function getLocaleFromStorage(): Locale | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isValidLocale(stored)) {
      return stored as Locale;
    }
  } catch (error) {
    console.error('Error reading locale from storage:', error);
  }

  return null;
}

/**
 * Checks if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Gets locale display name
 */
export function getLocaleDisplayName(locale: Locale): string {
  const names: Record<Locale, string> = {
    en: 'English',
    it: 'Italiano',
  };
  return names[locale];
}

/**
 * Gets locale flag emoji
 */
export function getLocaleFlag(locale: Locale): string {
  const flags: Record<Locale, string> = {
    en: '🇬🇧',
    it: '🇮🇹',
  };
  return flags[locale];
}
