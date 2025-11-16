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
        first_name: null, // Can be collected later in profile settings
        gender: data.gender || null,
        age: data.age || null,
        weight: data.weight || null,
        height: data.height || null,
        experience_years: 0, // Can be added to onboarding later
        preferred_split: null, // Default split, can be updated later
        active_split_plan_id: null, // No split plan yet
        current_cycle_day: null, // No active cycle yet
        cycles_completed: null, // No cycles completed yet
        current_cycle_start_date: null, // No cycle started yet
        last_cycle_completed_at: null, // No cycles completed yet
        current_mesocycle_week: null, // No mesocycle started yet
        mesocycle_phase: null, // No phase yet
        mesocycle_start_date: null, // No start date yet
        caloric_phase: null, // No caloric phase yet
        caloric_phase_start_date: null, // No caloric phase start date yet
        caloric_intake_kcal: null, // No caloric intake specified yet
        preferred_language: 'en', // Default to English, will be auto-detected on first app load
        audio_coaching_enabled: true, // Audio coaching enabled by default
        audio_coaching_autoplay: false, // Autoplay disabled by default
        audio_coaching_speed: 1.0 // Normal speed by default
      })

      // Generate first AI-powered workout using the collected preferences
      const result = await WorkoutGeneratorService.generateWorkout(userId)

      return { success: true, workoutId: result.workout.id }
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
