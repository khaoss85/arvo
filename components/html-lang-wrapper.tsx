'use client'

import { useEffect } from 'react'
import { useLocaleStore } from '@/lib/stores/locale.store'

/**
 * Client component that updates the HTML lang attribute dynamically
 * based on the user's language preference
 */
export function HtmlLangWrapper() {
  const { locale } = useLocaleStore()

  useEffect(() => {
    // Update the HTML lang attribute when locale changes
    document.documentElement.lang = locale
  }, [locale])

  return null
}
