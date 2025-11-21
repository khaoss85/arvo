/**
 * Split Display Names Utility
 *
 * Formats split type enum values into human-readable display names.
 * Supports both English and Italian locales.
 */

export type SplitType =
  | 'push_pull_legs'
  | 'upper_lower'
  | 'full_body'
  | 'bro_split'
  | 'weak_point_focus'
  | 'custom'

/**
 * Display names for split types in English
 */
const SPLIT_DISPLAY_NAMES_EN: Record<SplitType, string> = {
  push_pull_legs: 'Push/Pull/Legs',
  upper_lower: 'Upper/Lower',
  full_body: 'Full Body',
  bro_split: 'Bro Split',
  weak_point_focus: 'Weak Point Focus',
  custom: 'Custom'
}

/**
 * Display names for split types in Italian
 */
const SPLIT_DISPLAY_NAMES_IT: Record<SplitType, string> = {
  push_pull_legs: 'Push/Pull/Gambe',
  upper_lower: 'Upper/Lower',
  full_body: 'Full Body',
  bro_split: 'Bro Split',
  weak_point_focus: 'Focus Punti Deboli',
  custom: 'Personalizzato'
}

/**
 * Get display name for a split type
 *
 * @param splitType - The split type enum value
 * @param locale - The locale ('en' or 'it'), defaults to 'en'
 * @returns Formatted display name
 *
 * @example
 * getSplitDisplayName('push_pull_legs', 'en') // Returns: "Push/Pull/Legs"
 * getSplitDisplayName('push_pull_legs', 'it') // Returns: "Push/Pull/Gambe"
 */
export function getSplitDisplayName(
  splitType: string | null | undefined,
  locale: 'en' | 'it' = 'en'
): string | null {
  if (!splitType) return null

  const normalizedType = splitType.toLowerCase() as SplitType

  if (locale === 'it') {
    return SPLIT_DISPLAY_NAMES_IT[normalizedType] || splitType
  }

  return SPLIT_DISPLAY_NAMES_EN[normalizedType] || splitType
}
