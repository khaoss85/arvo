/**
 * Hook to get translated muscle group labels
 * Uses next-intl to respect user's language preference
 */
'use client'

import { useTranslations } from 'next-intl'

export function useMuscleGroupLabel() {
  const t = useTranslations('muscleGroups')

  return (key: string): string => {
    // Try to get translation from i18n
    try {
      const translation = t(key as any)
      if (translation && translation !== key) {
        return translation
      }
    } catch (error) {
      // Translation not found, fall back to formatting the key
    }

    // Fallback: capitalize and format the technical name
    // Convert snake_case to Title Case (e.g., 'chest_upper' → 'Chest Upper')
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}
