import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@/i18n';
import { defaultLocale } from '@/i18n';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

/**
 * Zustand store for managing user's locale preference
 * Persists to localStorage for consistency across sessions
 */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: defaultLocale,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'arvo_locale',
    }
  )
);
