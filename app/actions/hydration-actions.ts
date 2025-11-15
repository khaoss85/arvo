'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getUserLanguage } from '@/lib/utils/get-user-language'
import { HydrationAdvisor } from '@/lib/agents/hydration-advisor.agent'
import type { HydrationInput, HydrationOutput } from '@/lib/types/hydration'

/**
 * Server action to get AI-powered hydration suggestions during workout
 * Uses HydrationAdvisor with reasoning='none' for ultra-low latency
 * This runs on the server and has access to OPENAI_API_KEY
 */
export async function getHydrationSuggestionAction(
  userId: string,
  input: HydrationInput
): Promise<{ success: true; data: HydrationOutput } | { success: false; error: string }> {
  console.log('[getHydrationSuggestionAction] Received request', {
    userId,
    input: {
      workoutDurationMin: Math.round(input.workoutDurationMs / 60000),
      totalSetsCompleted: input.totalSetsCompleted,
      currentSetNumber: input.currentSetNumber,
      exerciseType: input.exerciseType,
      exerciseName: input.exerciseName,
      muscleGroups: input.muscleGroups,
      lastSetRIR: input.lastSetRIR,
      mentalReadiness: input.mentalReadiness,
      lastDismissedAt: input.lastDismissedAt
    },
    timestamp: new Date().toISOString()
  })

  try {
    const supabase = await getSupabaseServerClient()

    // Get user's preferred language
    const targetLanguage = await getUserLanguage(userId)

    console.log('[getHydrationSuggestionAction] User language detected', {
      targetLanguage
    })

    // Create HydrationAdvisor instance (reasoning='none' for ultra-fast response)
    const advisor = new HydrationAdvisor(supabase)

    console.log('[getHydrationSuggestionAction] Calling HydrationAdvisor.suggestHydration')
    const result = await advisor.suggestHydration(input, targetLanguage)

    console.log('[getHydrationSuggestionAction] Suggestion generated successfully', {
      shouldSuggest: result.shouldSuggest,
      messageType: result.messageType,
      confidence: result.confidence,
      urgency: result.urgency,
      waterAmount: result.waterAmount
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('[getHydrationSuggestionAction] Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      inputWorkoutDuration: input.workoutDurationMs,
      inputSetsCompleted: input.totalSetsCompleted
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate hydration suggestion'
    }
  }
}
