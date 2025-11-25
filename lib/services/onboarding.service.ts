import { UserProfileService } from './user-profile.service'
import { WorkoutGeneratorService } from './workout-generator.service'
import type { OnboardingData } from '@/lib/types/onboarding'

export class OnboardingService {
  /**
   * Get default approach ID for beginners
   * Uses Kuba Method - optimal for beginners due to:
   * - Focus on technique and controlled movements
   * - Moderate volume with intelligent recovery
   * - Sustainable progression without advanced techniques
   */
  private static readonly DEFAULT_BEGINNER_APPROACH_ID = 'cbb3537b-b5e9-4287-aa56-e95c74de99e8' // Kuba Method

  /**
   * Complete onboarding by creating user profile and generating first AI workout
   * For beginners, auto-fills certain fields with sensible defaults
   */
  static async completeOnboarding(userId: string, data: OnboardingData) {
    try {
      const isBeginner = data.experienceLevel === 'beginner'

      // Auto-fill defaults for beginners
      const approachId = isBeginner && !data.approachId
        ? this.DEFAULT_BEGINNER_APPROACH_ID
        : data.approachId

      const weakPoints = isBeginner && (!data.weakPoints || data.weakPoints.length === 0)
        ? []
        : data.weakPoints

      const strengthBaseline = isBeginner && !data.strengthBaseline
        ? {}
        : data.strengthBaseline

      // Create or update user profile with collected data
      await UserProfileService.upsert({
        user_id: userId,
        approach_id: approachId,
        weak_points: weakPoints,
        equipment_preferences: data.equipmentPreferences as any,
        available_equipment: data.availableEquipment || [],
        strength_baseline: strengthBaseline as any,
        first_name: data.firstName || null,
        gender: data.gender || null,
        training_focus: data.trainingFocus || null,
        age: data.age || null,
        weight: data.weight || null,
        height: data.height || null,
        experience_years: data.confirmedExperience || null,
        preferred_split: data.splitType || null,
        active_split_plan_id: null, // No split plan yet
        current_cycle_day: null, // No active cycle yet
        cycles_completed: null, // No cycles completed yet
        current_cycle_start_date: null, // No cycle started yet
        last_cycle_completed_at: null, // No cycles completed yet
        current_mesocycle_week: null, // No mesocycle started yet
        mesocycle_phase: null, // No phase yet
        mesocycle_start_date: null, // No start date yet
        caloric_phase: data.trainingObjective === 'maintain' ? 'maintenance' : (data.trainingObjective === 'recomp' ? null : data.trainingObjective) || null, // Store training objective as caloric phase (recomp doesn't map directly)
        caloric_phase_start_date: data.trainingObjective ? new Date().toISOString() : null,
        caloric_intake_kcal: null, // No caloric intake specified yet
        preferred_language: 'it', // Default to Italian
        audio_coaching_enabled: true, // Audio coaching enabled by default
        audio_coaching_autoplay: false, // Autoplay disabled by default
        audio_coaching_speed: 1.0, // Normal speed by default
        app_mode: 'advanced' // Default to advanced mode
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
