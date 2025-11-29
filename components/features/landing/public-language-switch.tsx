'use client'

import { useLocaleStore } from '@/lib/stores/locale.store'
import type { Locale } from '@/i18n'

const LANGUAGES: { code: Locale; flag: string }[] = [
  { code: 'en', flag: '🇬🇧' },
  { code: 'it', flag: '🇮🇹' }
]

export function PublicLanguageSwitch() {
  const { locale, setLocale } = useLocaleStore()

  return (
    <div className="flex items-center gap-1">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          className={`text-lg p-1 rounded transition-opacity ${
            locale === lang.code ? 'opacity-100' : 'opacity-40 hover:opacity-70'
          }`}
          aria-label={`Switch to ${lang.code}`}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  )
}
