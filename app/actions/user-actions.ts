'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Locale } from '@/i18n'

/**
 * Update user's preferred language in the database
 *
 * @param userId - The user's ID
 * @param language - The preferred language ('en' or 'it')
 * @returns Success status and optional error message
 */
export async function updatePreferredLanguage(
  userId: string,
  language: Locale
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('user_profiles')
      .update({ preferred_language: language })
      .eq('user_id', userId)

    if (error) {
      console.error('[updatePreferredLanguage] Database error:', error)
      return {
        success: false,
        error: 'Failed to update language preference'
      }
    }

    console.log('[updatePreferredLanguage] Successfully updated language to:', language, 'for user:', userId)
    return { success: true }
  } catch (error) {
    console.error('[updatePreferredLanguage] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get user's preferred language from the database
 *
 * @param userId - The user's ID
 * @returns The user's preferred language or null if not found
 */
export async function getUserPreferredLanguage(
  userId: string
): Promise<Locale | null> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('user_profiles')
      .select('preferred_language')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      console.error('[getUserPreferredLanguage] Error fetching language:', error)
      return null
    }

    const language = data.preferred_language
    if (language === 'en' || language === 'it') {
      return language
    }

    return null
  } catch (error) {
    console.error('[getUserPreferredLanguage] Unexpected error:', error)
    return null
  }
}

/**
 * Update user's personal information (demographic data)
 *
 * @param userId - The user's ID
 * @param data - Personal information to update
 * @returns Success status and optional error message
 */
export async function updatePersonalInfo(
  userId: string,
  data: {
    first_name: string | null
    gender: 'male' | 'female' | 'other' | null
    training_focus: 'upper_body' | 'lower_body' | 'balanced' | null
    age: number | null
    weight: number | null
    height: number | null
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate data
    if (data.age !== null && (data.age < 13 || data.age > 120)) {
      return {
        success: false,
        error: 'Age must be between 13 and 120'
      }
    }

    if (data.weight !== null && (data.weight <= 0 || data.weight > 500)) {
      return {
        success: false,
        error: 'Weight must be between 0 and 500 kg'
      }
    }

    if (data.height !== null && (data.height <= 0 || data.height > 300)) {
      return {
        success: false,
        error: 'Height must be between 0 and 300 cm'
      }
    }

    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('user_profiles')
      .update({
        first_name: data.first_name,
        gender: data.gender ?? undefined,
        training_focus: data.training_focus,
        age: data.age,
        weight: data.weight,
        height: data.height,
      })
      .eq('user_id', userId)

    if (error) {
      console.error('[updatePersonalInfo] Database error:', error)
      return {
        success: false,
        error: 'Failed to update personal information'
      }
    }

    console.log('[updatePersonalInfo] Successfully updated personal info for user:', userId)
    return { success: true }
  } catch (error) {
    console.error('[updatePersonalInfo] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
