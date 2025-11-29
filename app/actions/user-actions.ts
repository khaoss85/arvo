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
 * Update user's app mode preference (simple/advanced)
 *
 * @param mode - The app mode ('simple' or 'advanced')
 * @returns Success status and optional error message
 */
export async function updateAppModeAction(
  mode: 'simple' | 'advanced'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated'
      }
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ app_mode: mode })
      .eq('user_id', user.id)

    if (error) {
      console.error('[updateAppModeAction] Database error:', error)
      return {
        success: false,
        error: 'Failed to update app mode'
      }
    }

    console.log('[updateAppModeAction] Successfully updated app mode to:', mode, 'for user:', user.id)
    return { success: true }
  } catch (error) {
    console.error('[updateAppModeAction] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
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
    body_type: 'gynoid' | 'android' | 'mixed' | 'ectomorph' | 'mesomorph' | 'endomorph' | null
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
        body_type: data.body_type,
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

/**
 * Training Max type definition
 */
export interface TrainingMaxes {
  squat?: number
  bench_press?: number
  deadlift?: number
  overhead_press?: number
  [key: string]: number | undefined // Allow other lifts
}

/**
 * Update user's Training Maxes for powerlifting programs
 *
 * @param userId - The user's ID
 * @param trainingMaxes - Object with lift names and TM values in kg
 * @returns Success status and optional error message
 */
export async function updateTrainingMaxes(
  userId: string,
  trainingMaxes: TrainingMaxes
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate TM values
    for (const [lift, value] of Object.entries(trainingMaxes)) {
      if (value !== undefined && value !== null) {
        if (typeof value !== 'number' || isNaN(value)) {
          return {
            success: false,
            error: `Invalid value for ${lift}: must be a number`
          }
        }
        if (value < 0 || value > 1000) {
          return {
            success: false,
            error: `Invalid value for ${lift}: must be between 0 and 1000 kg`
          }
        }
      }
    }

    const supabase = await getSupabaseServerClient()

    // Get current training_maxes to merge
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('training_maxes')
      .eq('user_id', userId)
      .single()

    const currentMaxes = (currentProfile?.training_maxes as TrainingMaxes) || {}

    // Merge new values with existing
    const mergedMaxes = { ...currentMaxes, ...trainingMaxes }

    // Remove undefined/null values
    const cleanedMaxes: TrainingMaxes = {}
    for (const [key, value] of Object.entries(mergedMaxes)) {
      if (value !== undefined && value !== null) {
        cleanedMaxes[key] = value
      }
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ training_maxes: cleanedMaxes })
      .eq('user_id', userId)

    if (error) {
      console.error('[updateTrainingMaxes] Database error:', error)
      return {
        success: false,
        error: 'Failed to update Training Maxes'
      }
    }

    console.log('[updateTrainingMaxes] Successfully updated Training Maxes for user:', userId, cleanedMaxes)
    return { success: true }
  } catch (error) {
    console.error('[updateTrainingMaxes] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get user's Training Maxes
 *
 * @param userId - The user's ID
 * @returns Training Maxes object or null
 */
export async function getTrainingMaxes(
  userId: string
): Promise<TrainingMaxes | null> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('user_profiles')
      .select('training_maxes')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      console.error('[getTrainingMaxes] Error fetching Training Maxes:', error)
      return null
    }

    return (data.training_maxes as TrainingMaxes) || null
  } catch (error) {
    console.error('[getTrainingMaxes] Unexpected error:', error)
    return null
  }
}
