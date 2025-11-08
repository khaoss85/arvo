'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { WorkoutGeneratorService } from '@/lib/services/workout-generator.service'
import type { OnboardingData } from '@/lib/types/onboarding'

/**
 * Server action to complete onboarding
 * Creates user profile and generates first AI workout
 * This runs on the server and has access to OPENAI_API_KEY
 */
export async function completeOnboardingAction(
  userId: string,
  data: OnboardingData
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Upsert user profile using server client (bypasses RLS with server role)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        approach_id: data.approachId,
        weak_points: data.weakPoints,
        equipment_preferences: data.equipmentPreferences,
        strength_baseline: data.strengthBaseline,
        experience_years: 0
      })

    if (profileError) {
      throw new Error(`Failed to create user profile: ${profileError.message}`)
    }

    // Generate first AI-powered workout
    const workout = await WorkoutGeneratorService.generateWorkout(userId)

    return { success: true, workoutId: workout.id }
  } catch (error) {
    console.error('Server action - Onboarding completion error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete onboarding'
    }
  }
}

/**
 * Server action to generate a new workout
 * Uses AI to create personalized workout based on user profile
 * This runs on the server and has access to OPENAI_API_KEY
 */
export async function generateWorkoutAction(userId: string) {
  try {
    const workout = await WorkoutGeneratorService.generateWorkout(userId)
    return { success: true, workout }
  } catch (error) {
    console.error('Server action - Workout generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate workout'
    }
  }
}
