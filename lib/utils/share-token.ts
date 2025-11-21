/**
 * Share Token Generation Utility
 * Generates secure, URL-friendly tokens for public share links
 */

/**
 * Generates a secure, URL-friendly share token
 * Similar to YouTube video IDs or Strava activity tokens
 *
 * @param length - Length of the token (default: 11 chars like YouTube)
 * @returns URL-safe token string
 *
 * @example
 * generateShareToken() // => "aB3dE9fG2hI"
 */
export function generateShareToken(length: number = 11): string {
  // URL-safe characters (no ambiguous chars like 0/O, 1/l/I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let token = ''

  // Use crypto.getRandomValues for cryptographically secure randomness
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)

  for (let i = 0; i < length; i++) {
    token += chars[randomValues[i] % chars.length]
  }

  return token
}

/**
 * Validates a share token format
 * @param token - Token to validate
 * @returns true if token is valid format
 */
export function isValidShareToken(token: string): boolean {
  // Must be 11 characters, alphanumeric (no special chars)
  return /^[A-Za-z0-9]{11}$/.test(token)
}

/**
 * Generates a share URL for a given type and token
 * @param type - Type of share (cycle, progress, workout)
 * @param token - Share token
 * @param baseUrl - Base URL (defaults to current origin)
 * @returns Full share URL
 *
 * @example
 * generateShareUrl('cycle', 'aB3dE9fG2hI')
 * // => "https://yourapp.com/share/cycle/aB3dE9fG2hI"
 */
export function generateShareUrl(
  type: 'cycle' | 'progress' | 'workout',
  token: string,
  baseUrl?: string
): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/share/${type}/${token}`
}

/**
 * Extracts share info from URL
 * @param url - Share URL
 * @returns Share type and token, or null if invalid
 */
export function parseShareUrl(url: string): { type: string; token: string } | null {
  const match = url.match(/\/share\/(cycle|progress|workout)\/([A-Za-z0-9]{11})/)
  if (!match) return null

  return {
    type: match[1],
    token: match[2]
  }
}
