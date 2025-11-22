/**
 * Exercise substitution reason types
 * Maps technical database values to user-friendly display labels
 */
export const SUBSTITUTION_REASONS = {
  user_preference: 'user_preference',
  equipment_unavailable: 'equipment_unavailable',
  injury: 'injury',
  fatigue: 'fatigue',
  not_specified: 'not_specified',
} as const

export type SubstitutionReason = keyof typeof SUBSTITUTION_REASONS

/**
 * Get user-friendly label for substitution reason
 * Returns translation key that should be used with i18n
 *
 * @param reason - Technical reason value from database
 * @returns Translation key (e.g., 'exerciseSubstitution.reasons.user_preference')
 */
export function getSubstitutionReasonKey(reason: string | null): string {
  if (!reason) return 'exerciseSubstitution.reasons.not_specified'

  // Map known technical values to translation keys
  const reasonMap: Record<string, string> = {
    user_preference: 'exerciseSubstitution.reasons.user_preference',
    equipment_unavailable: 'exerciseSubstitution.reasons.equipment_unavailable',
    injury: 'exerciseSubstitution.reasons.injury',
    fatigue: 'exerciseSubstitution.reasons.fatigue',
    not_specified: 'exerciseSubstitution.reasons.not_specified',
  }

  return reasonMap[reason] || 'exerciseSubstitution.reasons.not_specified'
}
