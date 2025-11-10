import { ExerciseSelector } from '@/lib/agents/exercise-selector.agent'
import { WorkoutService } from './workout.service'
import { UserProfileService } from './user-profile.service'
import { SplitPlanService } from './split-plan.service'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  getNextWorkoutType,
  getTargetMuscleGroups,
  generateWorkoutName,
  inferWorkoutType,
  type WorkoutType,
  type SplitType
} from './muscle-groups.service'
import type { Workout, InsertWorkout, WorkoutStatus } from '@/lib/types/schemas'

export class WorkoutGeneratorService {
  /**
   * Generate AI-powered workout for user
   * Supports both split-based and rotation-based generation
   *
   * @param userId - User ID
   * @param options - Optional configuration
   * @param options.targetCycleDay - Generate for specific cycle day (for pre-generation)
   * @param options.status - Workout status (default: 'ready')
   */
  static async generateWorkout(
    userId: string,
    options?: {
      targetCycleDay?: number
      status?: WorkoutStatus
    }
  ): Promise<Workout> {
    // Get server Supabase client for server-side operations
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    const exerciseSelector = new ExerciseSelector(supabase)

    // Get user profile
    const profile = await UserProfileService.getByUserIdServer(userId)
    if (!profile) {
      throw new Error('User profile not found. Please create a profile first.')
    }

    if (!profile.approach_id) {
      throw new Error('No training approach selected. Please select a training approach in your profile.')
    }

    // Get recent workouts
    const recentWorkouts = await WorkoutService.getCompleted(userId, 3)

    // Check if user has an active split plan
    const nextWorkoutData = await SplitPlanService.getNextWorkout(userId)

    let workoutType: WorkoutType
    let splitPlanId: string | null = null
    let cycleDay: number | null = null
    let variation: 'A' | 'B' | null = null
    let sessionContext: {
      sessionFocus?: string[]
      targetVolume?: Record<string, number>
      sessionPrinciples?: string[]
    } = {}

    // Use target cycle day if provided (for pre-generation), otherwise use next workout from profile
    const targetDay = options?.targetCycleDay

    if (nextWorkoutData) {
      // SPLIT-BASED GENERATION
      const { session, splitPlan } = nextWorkoutData

      // If target day is specified, get session for that day instead of current day
      if (targetDay !== undefined) {
        const targetSession = splitPlan.sessions.find((s: any) => s.cycleDay === targetDay)
        if (!targetSession) {
          throw new Error(`No session found for cycle day ${targetDay}`)
        }

        workoutType = targetSession.workoutType as WorkoutType
        splitPlanId = splitPlan.id
        cycleDay = targetDay
        variation = targetSession.variation as 'A' | 'B' | null

        sessionContext = {
          sessionFocus: targetSession.focus as string[] | undefined,
          targetVolume: targetSession.targetVolume as Record<string, number> | undefined,
          sessionPrinciples: targetSession.principles as string[] | undefined
        }
      } else {
        // Use current day's session
        workoutType = session.workoutType as WorkoutType
        splitPlanId = splitPlan.id
        cycleDay = nextWorkoutData.cycleDay
        variation = session.variation

        // Pass session context to exercise selector
        sessionContext = {
          sessionFocus: session.focus,
          targetVolume: session.targetVolume,
          sessionPrinciples: session.principles
        }
      }
    } else {
      // ROTATION-BASED GENERATION (fallback for users without split plan)
      const preferredSplit = (profile.preferred_split as SplitType) || 'push_pull_legs'

      let lastWorkoutType: WorkoutType | null = null
      if (recentWorkouts && recentWorkouts.length > 0) {
        const lastWorkout = recentWorkouts[0]
        lastWorkoutType = lastWorkout.workout_type as WorkoutType ||
                         inferWorkoutType(lastWorkout.exercises as any[] || [])
      }

      workoutType = getNextWorkoutType(lastWorkoutType, preferredSplit)
    }

    // Select exercises using AI
    const selection = await exerciseSelector.selectExercises({
      workoutType,
      weakPoints: profile.weak_points || [],
      equipmentPreferences: (profile.equipment_preferences as Record<string, string>) || {},
      recentExercises: this.extractRecentExercises(recentWorkouts),
      approachId: profile.approach_id,
      userId,
      experienceYears: profile.experience_years,
      userAge: profile.age,
      userGender: profile.gender,
      ...sessionContext
    })

    // Get exercise history and calculate initial targets
    const exercisesWithTargets = await Promise.all(
      selection.exercises.map(async (exercise) => {
        const history = await this.getExerciseHistory(userId, exercise.name)

        let targetWeight = 0
        let targetReps = exercise.repRange[0]

        if (history.length > 0) {
          // Calculate progressive overload based on actual performance
          const progressiveTarget = this.calculateProgressiveTarget(
            history,
            exercise.repRange
          )
          targetWeight = progressiveTarget.weight
          targetReps = progressiveTarget.reps
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
      split_type: profile.preferred_split || 'push_pull_legs',
      // Split plan fields
      split_plan_id: splitPlanId,
      cycle_day: cycleDay,
      variation: variation,
      mental_readiness_overall: null,
      // Workout status
      status: options?.status || 'ready'
    }

    return await WorkoutService.create(workoutData)
  }

  /**
   * Generate draft workout for a future cycle day
   * This allows pre-generation of workouts that can be reviewed/refined before execution
   *
   * @param userId - User ID
   * @param targetCycleDay - The cycle day to generate for (must be > current cycle day)
   */
  static async generateDraftWorkout(
    userId: string,
    targetCycleDay: number
  ): Promise<Workout> {
    // Verify that target cycle day is in the future
    const profile = await UserProfileService.getByUserIdServer(userId)
    if (!profile) {
      throw new Error('User profile not found')
    }

    const currentCycleDay = profile.current_cycle_day || 1
    if (targetCycleDay <= currentCycleDay) {
      throw new Error(`Cannot pre-generate workout for past or current cycle day. Current: ${currentCycleDay}, Target: ${targetCycleDay}`)
    }

    if (!profile.active_split_plan_id) {
      throw new Error('No active split plan found. Cannot pre-generate workouts without a split plan.')
    }

    // Check if a workout already exists for this cycle day
    const supabase = getSupabaseBrowserClient()
    const { data: existingWorkout } = await supabase
      .from('workouts')
      .select('id, status')
      .eq('user_id', userId)
      .eq('split_plan_id', profile.active_split_plan_id)
      .eq('cycle_day', targetCycleDay)
      .in('status', ['draft', 'ready', 'in_progress'])
      .maybeSingle()

    if (existingWorkout) {
      throw new Error(`A workout already exists for cycle day ${targetCycleDay} (status: ${(existingWorkout as any).status})`)
    }

    // Generate workout with draft status
    return this.generateWorkout(userId, {
      targetCycleDay,
      status: 'draft'
    })
  }

  /**
   * Calculate progressive overload target based on recent performance
   * Uses actual sets data to determine appropriate progression
   */
  private static calculateProgressiveTarget(
    history: any[],
    repRange: [number, number]
  ): { weight: number; reps: number } {
    if (history.length === 0) {
      return { weight: 0, reps: repRange[0] }
    }

    // Get most recent completed set
    const lastSet = history[0]
    const lastWeight = lastSet.weight_actual || lastSet.weight_target || 0
    const lastReps = lastSet.reps_actual || lastSet.reps_target || repRange[0]
    const lastRir = lastSet.rir_actual || 3 // Default to 3 RIR if not recorded

    // Progressive overload logic based on RIR and reps
    // If RIR < 2: very close to failure, increase weight
    // If RIR >= 3: add reps first, then weight
    // If reps at top of range: increase weight

    let targetWeight = lastWeight
    let targetReps = lastReps

    if (lastRir < 2 || lastReps >= repRange[1]) {
      // Close to failure or at top of rep range -> increase weight
      // Typical progression: 2.5-5% increase
      const increment = lastWeight >= 40 ? 2.5 : 1.25 // Smaller jumps for lighter weights
      targetWeight = Math.round((lastWeight + increment) * 4) / 4 // Round to nearest 0.25
      targetReps = repRange[0] // Reset to bottom of range
    } else if (lastReps < repRange[1]) {
      // Room to add reps -> add 1-2 reps
      targetReps = Math.min(lastReps + 1, repRange[1])
      targetWeight = lastWeight // Keep weight same
    } else {
      // At top of range with good RIR -> small weight increase
      targetWeight = Math.round((lastWeight + 1.25) * 4) / 4
      targetReps = repRange[0]
    }

    return { weight: targetWeight, reps: targetReps }
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
   * Uses exercise_name since exercises table was replaced with exercise_generations
   */
  private static async getExerciseHistory(
    userId: string,
    exerciseName: string
  ): Promise<any[]> {
    const supabase = getSupabaseBrowserClient()

    // Query sets_log by exercise_name (case-insensitive)
    const { data: sets } = await supabase
      .from('sets_log')
      .select('*, workouts!inner(user_id)')
      .ilike('exercise_name', exerciseName)
      .eq('workouts.user_id', userId)
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
