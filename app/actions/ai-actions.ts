'use server'

import { OnboardingService } from '@/lib/services/onboarding.service'
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
    const result = await OnboardingService.completeOnboarding(userId, data)
    return { success: true, workoutId: result.workoutId }
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
