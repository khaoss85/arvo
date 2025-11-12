/**
 * Severity levels shown to user (friendly names)
 * Mapped to database severity values used by AI agents
 */
export const SEVERITY_MAPPING = {
  'Mild': 'caution',     // AI will prefer alternatives
  'Moderate': 'warning', // AI will strongly avoid
  'Severe': 'critical'   // AI must avoid completely
} as const

export type UserSeverity = keyof typeof SEVERITY_MAPPING
export type DatabaseSeverity = typeof SEVERITY_MAPPING[UserSeverity]

/**
 * Map database severity back to user-friendly name
 */
export function mapDatabaseSeverityToUser(dbSeverity: string): UserSeverity {
  const reverseMapping: Record<string, UserSeverity> = {
    'caution': 'Mild',
    'warning': 'Moderate',
    'critical': 'Severe',
    'info': 'Mild' // Fallback
  }
  return reverseMapping[dbSeverity] || 'Mild'
}

/**
 * Map user-friendly severity to database value
 */
export function mapUserSeverityToDatabase(userSeverity: UserSeverity): DatabaseSeverity {
  return SEVERITY_MAPPING[userSeverity]
}
