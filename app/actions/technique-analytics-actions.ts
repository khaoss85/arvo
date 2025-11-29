'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/utils/auth.server'
import {
  techniqueAnalyticsService,
  type LogTechniqueExecutionInput,
  type TechniqueHistoryEntry,
} from '@/lib/services/technique-analytics.service'
import type {
  TechniqueType,
  TechniqueConfig,
  TechniqueExecutionResult,
  TechniqueStats,
  TechniqueEffectiveness,
} from '@/lib/types/advanced-techniques'

/**
 * Log a technique execution result
 */
export async function logTechniqueResultAction(input: {
  workoutId?: string
  exerciseName: string
  techniqueType: TechniqueType
  techniqueConfig: TechniqueConfig
  executionResult?: TechniqueExecutionResult
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await getSupabaseServerClient()

    return await techniqueAnalyticsService.logTechniqueExecution(supabase, {
      userId: user.id,
      workoutId: input.workoutId,
      exerciseName: input.exerciseName,
      techniqueType: input.techniqueType,
      techniqueConfig: input.techniqueConfig,
      executionResult: input.executionResult,
    })
  } catch (error) {
    console.error('[Action] logTechniqueResultAction error:', error)
    return { success: false, error: 'Failed to log technique result' }
  }
}

/**
 * Get user's technique statistics
 */
export async function getTechniqueStatsAction(): Promise<{
  success: boolean
  data?: TechniqueStats
  error?: string
}> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await getSupabaseServerClient()
    const stats = await techniqueAnalyticsService.getUserTechniqueStats(supabase, user.id)

    return { success: true, data: stats }
  } catch (error) {
    console.error('[Action] getTechniqueStatsAction error:', error)
    return { success: false, error: 'Failed to fetch technique stats' }
  }
}

/**
 * Get technique history
 */
export async function getTechniqueHistoryAction(options?: {
  techniqueType?: TechniqueType
  exerciseName?: string
  limit?: number
}): Promise<{
  success: boolean
  data?: TechniqueHistoryEntry[]
  error?: string
}> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await getSupabaseServerClient()
    const history = await techniqueAnalyticsService.getTechniqueHistory(
      supabase,
      user.id,
      options
    )

    return { success: true, data: history }
  } catch (error) {
    console.error('[Action] getTechniqueHistoryAction error:', error)
    return { success: false, error: 'Failed to fetch technique history' }
  }
}

/**
 * Get most effective techniques
 */
export async function getEffectiveTechniquesAction(
  muscleGroup?: string
): Promise<{
  success: boolean
  data?: TechniqueEffectiveness[]
  error?: string
}> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await getSupabaseServerClient()
    const effectiveness = await techniqueAnalyticsService.getEffectiveTechniques(
      supabase,
      user.id,
      muscleGroup
    )

    return { success: true, data: effectiveness }
  } catch (error) {
    console.error('[Action] getEffectiveTechniquesAction error:', error)
    return { success: false, error: 'Failed to fetch technique effectiveness' }
  }
}

/**
 * Get technique usage counts
 */
export async function getTechniqueUsageCountsAction(): Promise<{
  success: boolean
  data?: Array<{
    techniqueType: TechniqueType
    count: number
    completionRate: number
  }>
  error?: string
}> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await getSupabaseServerClient()
    const counts = await techniqueAnalyticsService.getTechniqueUsageCounts(supabase, user.id)

    return { success: true, data: counts }
  } catch (error) {
    console.error('[Action] getTechniqueUsageCountsAction error:', error)
    return { success: false, error: 'Failed to fetch usage counts' }
  }
}
