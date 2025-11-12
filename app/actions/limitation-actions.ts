'use server'

import { getUser } from '@/lib/utils/auth.server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  SEVERITY_MAPPING,
  type UserSeverity
} from '@/lib/utils/limitation-helpers'

const MAX_ACTIVE_LIMITATIONS = 3

/**
 * Create a proactive limitation/injury report
 * Creates a workout_insight with workout_id = null
 */
export async function createProactiveLimitationAction(input: {
  description: string
  severity: UserSeverity
  affectedMuscles?: string[]
  exerciseName?: string
}) {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate description
    if (!input.description || input.description.trim().length < 3) {
      return { success: false, error: 'Description must be at least 3 characters' }
    }

    if (input.description.length > 500) {
      return { success: false, error: 'Description too long (max 500 characters)' }
    }

    const supabase = await getSupabaseServerClient()

    // Check current active limitations count
    const { data: existingLimitations, error: countError } = await supabase
      .from('workout_insights')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .is('workout_id', null) // Only count proactive limitations
      .gte('relevance_score', 0.3)

    if (countError) {
      console.error('Error counting limitations:', countError)
      return { success: false, error: 'Failed to check existing limitations' }
    }

    if (existingLimitations && existingLimitations.length >= MAX_ACTIVE_LIMITATIONS) {
      return {
        success: false,
        error: `Maximum ${MAX_ACTIVE_LIMITATIONS} active limitations reached. Please resolve an existing one first.`
      }
    }

    // Map user-friendly severity to database severity
    const dbSeverity = SEVERITY_MAPPING[input.severity]

    // Build metadata
    const metadata: any = {
      affectedMuscles: input.affectedMuscles || [],
      context: {
        source: 'proactive_user_input',
        created_from: 'settings'
      }
    }

    // Create proactive insight
    const { data, error } = await supabase
      .from('workout_insights')
      .insert({
        user_id: user.id,
        workout_id: null as any, // PROACTIVE (not linked to workout) - nullable after migration
        exercise_name: input.exerciseName || null,
        user_note: input.description.trim(),
        insight_type: 'pain',
        severity: dbSeverity,
        status: 'active',
        relevance_score: 1.0, // Start at max relevance
        metadata: metadata as any,
        last_mentioned_at: new Date().toISOString()
      } as any) // Force type since generated types haven't been updated post-migration
      .select()
      .single()

    if (error) {
      console.error('Error creating limitation:', error)
      return { success: false, error: 'Failed to create limitation' }
    }

    revalidatePath('/settings')

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error creating limitation:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Mark a limitation as resolved
 */
export async function resolveLimitationAction(insightId: string) {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await getSupabaseServerClient()

    // Update insight to resolved
    const { error } = await supabase
      .from('workout_insights')
      .update({
        status: 'resolved',
        resolved_by: 'user',
        resolved_at: new Date().toISOString()
      })
      .eq('id', insightId)
      .eq('user_id', user.id) // Security: ensure user owns this insight

    if (error) {
      console.error('Error resolving limitation:', error)
      return { success: false, error: 'Failed to resolve limitation' }
    }

    revalidatePath('/settings')

    return { success: true }
  } catch (error) {
    console.error('Unexpected error resolving limitation:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all active limitations for a user
 * Returns both proactive and workout-based insights
 */
export async function getActiveLimitationsAction() {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized', data: [] }
    }

    const supabase = await getSupabaseServerClient()

    // Get all active insights with sufficient relevance
    // Includes both proactive (workout_id NULL) and workout-based insights
    const { data: insights, error } = await supabase
      .from('workout_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('relevance_score', 0.3)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching limitations:', error)
      return { success: false, error: 'Failed to fetch limitations', data: [] }
    }

    return { success: true, data: insights || [] }
  } catch (error) {
    console.error('Unexpected error fetching limitations:', error)
    return { success: false, error: 'An unexpected error occurred', data: [] }
  }
}

/**
 * Get count of active proactive limitations (for validation)
 */
export async function getActiveLimitationsCountAction(): Promise<number> {
  try {
    const user = await getUser()
    if (!user) {
      return 0
    }

    const supabase = await getSupabaseServerClient()

    const { count, error } = await supabase
      .from('workout_insights')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .is('workout_id', null) // Only proactive limitations
      .gte('relevance_score', 0.3)

    if (error) {
      console.error('Error counting limitations:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Unexpected error counting limitations:', error)
    return 0
  }
}

// Note: mapDatabaseSeverityToUser and UserSeverity type are in @/lib/utils/limitation-helpers
// Cannot re-export from 'use server' files - import directly from limitation-helpers instead
