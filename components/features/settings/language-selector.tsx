'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { useLocaleStore } from '@/lib/stores/locale.store'
import { updatePreferredLanguage } from '@/app/actions/user-actions'
import type { Locale } from '@/i18n'

interface LanguageSelectorProps {
  userId: string
}

const LANGUAGES: { code: Locale; flag: string; name: string }[] = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' }
]

export function LanguageSelector({ userId }: LanguageSelectorProps) {
  const t = useTranslations('settings.preferences')
  const { locale, setLocale } = useLocaleStore()
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLanguageChange = async (newLanguage: Locale) => {
    if (newLanguage === locale || updating) return

    setUpdating(true)
    setError(null)

    try {
      // Update database
      const result = await updatePreferredLanguage(userId, newLanguage)

      if (!result.success) {
        setError(result.error || 'Failed to update language')
        return
      }

      // Update local store (triggers re-render)
      setLocale(newLanguage)

      console.log('[LanguageSelector] Language updated successfully to:', newLanguage)
    } catch (err) {
      console.error('[LanguageSelector] Error updating language:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-gray-200 mb-1">
          {t('language')}
        </h3>
        <p className="text-xs text-gray-400">
          {t('languageDescription')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={updating}
            className={`
              relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all
              ${
                locale === lang.code
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }
              ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="text-3xl">{lang.flag}</span>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-white">{lang.name}</div>
              <div className="text-xs text-gray-400">{lang.code.toUpperCase()}</div>
            </div>
            {locale === lang.code && (
              <Check className="w-5 h-5 text-blue-400 absolute top-2 right-2" />
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-xs text-red-400 mt-2">
          ⚠️ {error}
        </div>
      )}

      {updating && (
        <div className="text-xs text-blue-400 mt-2">
          Updating language...
        </div>
      )}
    </div>
  )
}
