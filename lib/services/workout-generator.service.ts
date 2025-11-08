import { ExerciseSelector } from '@/lib/agents/exercise-selector.agent'
import { WorkoutService } from './workout.service'
import { UserProfileService } from './user-profile.service'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  getNextWorkoutType,
  getTargetMuscleGroups,
  generateWorkoutName,
  inferWorkoutType,
  type WorkoutType,
  type SplitType
} from './muscle-groups.service'
import type { Workout, InsertWorkout } from '@/lib/types/schemas'

export class WorkoutGeneratorService {
  /**
   * Generate AI-powered workout for user
   */
  static async generateWorkout(userId: string): Promise<Workout> {
    const exerciseSelector = new ExerciseSelector()

    // Get user profile
    const profile = await UserProfileService.getByUserId(userId)
    if (!profile) {
      throw new Error('User profile not found. Please create a profile first.')
    }

    if (!profile.approach_id) {
      throw new Error('No training approach selected. Please select a training approach in your profile.')
    }

    // Get recent workouts to determine rotation
    const recentWorkouts = await WorkoutService.getCompleted(userId, 3)

    // Get user's preferred split type (defaults to push_pull_legs)
    const preferredSplit = (profile.preferred_split as SplitType) || 'push_pull_legs'

    // Determine next workout type based on preferred split and last workout
    let lastWorkoutType: WorkoutType | null = null
    if (recentWorkouts && recentWorkouts.length > 0) {
      const lastWorkout = recentWorkouts[0]
      // Try to get workout_type from database, fallback to inference
      lastWorkoutType = lastWorkout.workout_type as WorkoutType ||
                       inferWorkoutType(lastWorkout.exercises as any[] || [])
    }

    const workoutType = getNextWorkoutType(lastWorkoutType, preferredSplit)

    // Select exercises using AI
    const selection = await exerciseSelector.selectExercises({
      workoutType,
      weakPoints: profile.weak_points || [],
      equipmentPreferences: (profile.equipment_preferences as Record<string, string>) || {},
      recentExercises: this.extractRecentExercises(recentWorkouts),
      approachId: profile.approach_id
    })

    // Get exercise history and calculate initial targets
    const exercisesWithTargets = await Promise.all(
      selection.exercises.map(async (exercise) => {
        const history = await this.getExerciseHistory(userId, exercise.name)

        let targetWeight = 0
        let targetReps = exercise.repRange[0]

        if (history.length > 0) {
          // Use last performance
          const last = history[0]
          targetWeight = last.weight_actual || last.weight_target || 0
          targetReps = last.reps_actual || last.reps_target || exercise.repRange[0]
        } else {
          // Initial conservative estimate based on exercise type and demographics
          targetWeight = this.estimateInitialWeight(
            exercise.name,
            profile.gender || 'other',
            profile.weight || null,
            profile.strength_baseline as Record<string, any> | null
          )
        }

        return {
          name: exercise.name,
          equipmentVariant: exercise.equipmentVariant,
          sets: exercise.sets,
          repRange: exercise.repRange,
          restSeconds: exercise.restSeconds,
          targetWeight,
          targetReps,
          rationale: exercise.rationaleForSelection,
          alternatives: exercise.alternatives
        }
      })
    )

    // Calculate target muscle groups from exercises
    const targetMuscleGroups = getTargetMuscleGroups(exercisesWithTargets)

    // Generate descriptive workout name
    const workoutName = generateWorkoutName(workoutType, targetMuscleGroups)

    // Create workout
    const workoutData: InsertWorkout = {
      user_id: userId,
      approach_id: profile.approach_id,
      planned_at: new Date().toISOString().split('T')[0],
      exercises: exercisesWithTargets as any,
      completed: false,
      started_at: null,
      completed_at: null,
      duration_seconds: null,
      total_volume: null,
      total_sets: null,
      notes: null,
      workout_type: workoutType,
      workout_name: workoutName,
      target_muscle_groups: targetMuscleGroups,
      split_type: preferredSplit
    }

    return await WorkoutService.create(workoutData)
  }

  /**
   * Extract exercise names from recent workouts
   */
  private static extractRecentExercises(workouts: Workout[]): string[] {
    return workouts.flatMap(w => {
      const exercises = w.exercises as any[]
      return exercises?.map((e: any) => e.name) || []
    })
  }

  /**
   * Get exercise history for a specific exercise
   */
  private static async getExerciseHistory(
    userId: string,
    exerciseName: string
  ): Promise<any[]> {
    const supabase = getSupabaseBrowserClient()

    // Get exercise ID by name
    const { data: exercise } = await supabase
      .from('exercises')
      .select('id')
      .eq('name', exerciseName)
      .single()

    if (!exercise) {
      return []
    }

    // Get recent sets for this exercise
    const { data: sets } = await supabase
      .from('sets_log')
      .select('*')
      .eq('exercise_id', exercise.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return sets || []
  }

  /**
   * Estimate initial weight for an exercise
   * Uses demographics and strength baseline if available
   */
  private static estimateInitialWeight(
    exerciseName: string,
    gender: 'male' | 'female' | 'other' = 'other',
    bodyweight: number | null = null,
    strengthBaseline: Record<string, { weight: number; reps: number; rir: number }> | null = null
  ): number {
    const name = exerciseName.toLowerCase()

    // Check if we have a strength baseline for this exercise
    if (strengthBaseline) {
      for (const [baselineExercise, data] of Object.entries(strengthBaseline)) {
        const baselineName = baselineExercise.toLowerCase()
        // Match similar exercises (e.g., "bench press" matches "bench")
        if (name.includes(baselineName) || baselineName.includes(name.split(' ')[0])) {
          // Use 85% of baseline weight as conservative starting point
          return Math.round(data.weight * 0.85)
        }
      }
    }

    // If bodyweight available, use bodyweight ratios for major lifts
    if (bodyweight && bodyweight > 0) {
      const genderMultiplier = gender === 'female' ? 0.6 : 1.0

      if (name.includes('bench')) return Math.round(bodyweight * 0.5 * genderMultiplier)
      if (name.includes('squat')) return Math.round(bodyweight * 0.6 * genderMultiplier)
      if (name.includes('deadlift')) return Math.round(bodyweight * 0.8 * genderMultiplier)
      if (name.includes('row')) return Math.round(bodyweight * 0.4 * genderMultiplier)
      if (name.includes('press') && name.includes('shoulder')) return Math.round(bodyweight * 0.3 * genderMultiplier)
    }

    // Fallback to conservative starting weights adjusted by gender
    const genderMultiplier = gender === 'female' ? 0.6 : 1.0

    if (name.includes('bench')) return Math.round(40 * genderMultiplier)
    if (name.includes('squat')) return Math.round(50 * genderMultiplier)
    if (name.includes('deadlift')) return Math.round(60 * genderMultiplier)
    if (name.includes('row')) return Math.round(30 * genderMultiplier)
    if (name.includes('press') && name.includes('shoulder')) return Math.round(20 * genderMultiplier)
    if (name.includes('curl')) return Math.round(15 * genderMultiplier)
    if (name.includes('extension')) return Math.round(15 * genderMultiplier)
    if (name.includes('raise')) return Math.round(10 * genderMultiplier)
    if (name.includes('fly')) return Math.round(15 * genderMultiplier)

    // Default conservative weight
    return Math.round(20 * genderMultiplier)
  }
}
