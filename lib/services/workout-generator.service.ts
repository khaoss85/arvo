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
          // Initial conservative estimate based on exercise type
          targetWeight = this.estimateInitialWeight(exercise.name)
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
   */
  private static estimateInitialWeight(exerciseName: string): number {
    const name = exerciseName.toLowerCase()

    // Very conservative starting weights
    if (name.includes('bench')) return 40
    if (name.includes('squat')) return 50
    if (name.includes('deadlift')) return 60
    if (name.includes('row')) return 30
    if (name.includes('press') && name.includes('shoulder')) return 20
    if (name.includes('curl')) return 15
    if (name.includes('extension')) return 15
    if (name.includes('raise')) return 10
    if (name.includes('fly')) return 15

    // Default conservative weight
    return 20
  }
}
