import { UserProfileService } from './user-profile.service'
import { WorkoutGeneratorService } from './workout-generator.service'
import type { OnboardingData } from '@/lib/types/onboarding'

export class OnboardingService {
  /**
   * Complete onboarding by creating user profile and generating first AI workout
   */
  static async completeOnboarding(userId: string, data: OnboardingData) {
    try {
      // Create or update user profile with collected data
      await UserProfileService.upsert({
        user_id: userId,
        approach_id: data.approachId,
        weak_points: data.weakPoints,
        equipment_preferences: data.equipmentPreferences as any,
        strength_baseline: data.strengthBaseline as any,
        experience_years: 0, // Can be added to onboarding later
        preferred_split: null // Default split, can be updated later
      })

      // Generate first AI-powered workout using the collected preferences
      const workout = await WorkoutGeneratorService.generateWorkout(userId)

      return { success: true, workoutId: workout.id }
    } catch (error) {
      console.error('Onboarding completion error:', error)
      throw error
    }
  }

  /**
   * Check if user has completed onboarding
   */
  static async checkOnboardingStatus(userId: string): Promise<boolean> {
    const profile = await UserProfileService.getByUserId(userId)
    return !!profile
  }
}
