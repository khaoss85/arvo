import { ExerciseSelector } from '@/lib/agents/exercise-selector.agent'
import { AudioScriptGeneratorAgent } from '@/lib/agents/audio-script-generator.agent'
import { InitialWeightEstimator } from '@/lib/agents/initial-weight-estimator.agent'
import { WorkoutService } from './workout.service'
import { UserProfileService } from './user-profile.service'
import { SplitPlanService } from './split-plan.service'
import { CycleStatsService } from './cycle-stats.service'
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
import { normalizeExercise, getExerciseName } from '@/lib/utils/exercise-helpers'

export class WorkoutGeneratorService {
  /**
   * Generate AI-powered workout for user
   * Supports both split-based and rotation-based generation
   *
   * @param userId - User ID
   * @param options - Optional configuration
   * @param options.targetCycleDay - Generate for specific cycle day (for pre-generation)
   * @param options.status - Workout status (default: 'ready')
   * @param options.onProgress - Progress callback for async generation
   */
  static async generateWorkout(
    userId: string,
    options?: {
      targetCycleDay?: number
      status?: WorkoutStatus
      onProgress?: (phase: string, percent: number, message: string) => Promise<void>
      supabaseClient?: any
    }
  ): Promise<{
    workout: Workout
    insightInfluencedChanges?: Array<{
      source: 'insight' | 'memory'
      sourceId: string
      sourceTitle: string
      action: 'avoided' | 'substituted' | 'preferred' | 'adjusted'
      originalExercise?: string
      selectedExercise?: string
      reason: string
    }>
  }> {
    // Extract progress callback and custom client
    const { onProgress, supabaseClient } = options || {}

    // Use provided client (for background workers) or default to server client (for API routes)
    let supabase
    if (supabaseClient) {
      supabase = supabaseClient
    } else {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server')
      supabase = await getSupabaseServerClient()
    }

    // Use low reasoning for faster workout generation with reasonable timeout (180s = 3 minutes)
    // Low reasoning provides good balance between speed and quality for workout generation
    const exerciseSelector = new ExerciseSelector(supabase, 'low')

    // Progress: Starting
    await onProgress?.('profile', 5, 'Loading user profile and preferences')

    // Get user profile (use admin client if provided to bypass RLS in background workers)
    const profile = await UserProfileService.getByUserIdServer(userId, supabase)
    if (!profile) {
      throw new Error('User profile not found. Please create a profile first.')
    }

    if (!profile.approach_id) {
      throw new Error('No training approach selected. Please select a training approach in your profile.')
    }

    // Progress: Loading history
    await onProgress?.('profile', 15, 'Loading recent workout history')

    // Get recent workouts
    const recentWorkouts = await WorkoutService.getCompleted(userId, 3)

    let workoutType: WorkoutType
    let splitPlanId: string | null = null
    let cycleDay: number | null = null
    let variation: 'A' | 'B' | 'none' | null = null
    let sessionContext: {
      sessionFocus?: string[]
      targetVolume?: Record<string, number>
      sessionPrinciples?: string[]
    } = {}

    // Use target cycle day if provided (for pre-generation)
    const targetDay = options?.targetCycleDay

    // If target day is specified, load split plan directly (more robust than getNextWorkout)
    if (targetDay !== undefined && profile.active_split_plan_id) {
      // DIRECT SPLIT PLAN LOADING FOR PRE-GENERATION
      const { data: splitPlan, error: planError } = await supabase
        .from('split_plans')
        .select('*')
        .eq('id', profile.active_split_plan_id)
        .single()

      if (planError) {
        throw new Error(`Failed to load split plan: ${planError.message}`)
      }

      const targetSession = (splitPlan.sessions as any[]).find((s: any) => s.day === targetDay)
      if (!targetSession) {
        throw new Error(`No session found for cycle day ${targetDay}`)
      }

      workoutType = targetSession.workoutType as WorkoutType

      // Defensive check: ensure this is not a REST day
      if (!workoutType || workoutType === 'rest') {
        throw new Error(`Session for cycle day ${targetDay} is a REST day. Cannot generate workout for rest days.`)
      }

      splitPlanId = splitPlan.id
      cycleDay = targetDay
      variation = targetSession.variation as 'A' | 'B' | null

      sessionContext = {
        sessionFocus: targetSession.focus as string[] | undefined,
        targetVolume: targetSession.targetVolume as Record<string, number> | undefined,
        sessionPrinciples: targetSession.principles as string[] | undefined
      }
    } else {
      // Check if user has an active split plan (for regular generation)
      const nextWorkoutData = await SplitPlanService.getNextWorkoutServer(userId)

      if (nextWorkoutData) {
        // SPLIT-BASED GENERATION
        const { session, splitPlan } = nextWorkoutData

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
    }

    // Progress: Planning workout
    await onProgress?.('split', 30, 'Planning workout split and muscle groups')

    // Merge standard equipment with custom equipment
    const customEquipment = (profile.custom_equipment as Array<{ id: string; name: string; exampleExercises: string[] }>) || []
    const customEquipmentIds = customEquipment.map(eq => eq.id)
    const allAvailableEquipment = [...(profile.available_equipment || []), ...customEquipmentIds]

    // Fetch active insights (includes proactive physical limitations from Settings)
    const { data: activeInsights } = await supabase
      .rpc('get_active_insights', {
        p_user_id: userId,
        p_min_relevance: 0.3
      })

    // Fetch active memories (learned user preferences and patterns)
    const { data: activeMemories } = await supabase
      .rpc('get_active_memories', {
        p_user_id: userId,
        p_min_confidence: 0.6
      })

    // Transform database results to agent-expected format (snake_case → camelCase)
    const transformedInsights = (activeInsights || []).map((insight: any) => ({
      id: insight.id,
      type: insight.insight_type,
      severity: insight.severity,
      exerciseName: insight.exercise_name || undefined,
      userNote: insight.user_note,
      metadata: insight.metadata
    }))

    const transformedMemories = (activeMemories || []).map((memory: any) => ({
      id: memory.id,
      category: memory.memory_category,
      title: memory.title,
      description: memory.description || undefined,
      confidenceScore: memory.confidence_score,
      relatedExercises: memory.related_exercises || [],
      relatedMuscles: memory.related_muscles || []
    }))

    // Calculate current cycle progress for fatigue-aware exercise selection
    let currentCycleProgress: {
      volumeByMuscle: Record<string, number>
      workoutsCompleted: number
      avgMentalReadiness: number | null
    } | undefined

    try {
      // Only calculate cycle progress if user has an active split plan
      if (profile.active_split_plan_id) {
        const cycleStats = await CycleStatsService.calculateCycleStats(
          userId,
          profile.active_split_plan_id
        )

        // Extract relevant fields for exercise selection
        currentCycleProgress = {
          volumeByMuscle: cycleStats.volumeByMuscleGroup,
          workoutsCompleted: cycleStats.totalWorkoutsCompleted,
          avgMentalReadiness: cycleStats.avgMentalReadiness
        }

        console.log(`[WorkoutGenerator] Cycle progress loaded:`, {
          workouts: currentCycleProgress.workoutsCompleted,
          avgMR: currentCycleProgress.avgMentalReadiness?.toFixed(1),
          muscles: Object.keys(currentCycleProgress.volumeByMuscle).length
        })
      }
    } catch (error) {
      console.error('[WorkoutGenerator] Failed to load cycle progress (non-critical):', error)
      // Continue without cycle progress - it's optional context for AI
    }

    // Progress: AI exercise selection
    await onProgress?.('ai', 45, 'AI analyzing and selecting exercises')

    // 🔄 Progress Simulator: Update progress during long AI operation (45% → 59%)
    // This prevents the UI from appearing frozen during the 60-180s AI call
    let currentProgress = 45
    const progressSimulator = setInterval(async () => {
      if (currentProgress < 59) {
        currentProgress += 1
        await onProgress?.('ai', currentProgress, 'AI analyzing and selecting exercises')
      }
    }, 2000) // Update every 2 seconds

    // Load previous workout's AI response ID for reasoning continuity (GPT-5)
    // This enables cumulative learning of user preferences across consecutive workouts
    let previousResponseId: string | undefined
    if (recentWorkouts.length > 0) {
      const lastWorkout = recentWorkouts[0]
      previousResponseId = (lastWorkout as any).ai_response_id || undefined
      if (previousResponseId) {
        console.log('[WorkoutGenerator] Loading previous response ID for reasoning continuity:', {
          previousWorkoutId: lastWorkout.id,
          responseId: previousResponseId.slice(0, 12) + '...'
        })
      }
    }

    // Select exercises using AI with error handling
    let selection

    // Get recent exercise names for stagnation analysis
    const recentExerciseNames = this.extractRecentExercises(recentWorkouts)

    // Calculate exercise stagnation/plateau data for AI rotation recommendations
    const exerciseHistoryContext = await this.getExerciseStagnationData(
      userId,
      recentExerciseNames,
      supabase
    )

    try {
      selection = await exerciseSelector.selectExercises({
        workoutType: workoutType as Exclude<WorkoutType, 'rest'>, // Safe: rest days are filtered at line 120
        weakPoints: profile.weak_points || [],
        availableEquipment: allAvailableEquipment,
        customEquipment: customEquipment, // Pass custom equipment metadata
        recentExercises: recentExerciseNames,
        exerciseHistoryContext, // NEW: Stagnation/plateau data for rotation recommendations
        approachId: profile.approach_id,
        userId,
        experienceYears: profile.experience_years,
        userAge: profile.age,
        userGender: profile.gender,
        trainingFocus: profile.training_focus as 'upper_body' | 'lower_body' | 'balanced' | null,
        bodyType: profile.body_type as 'gynoid' | 'android' | 'mixed' | 'ectomorph' | 'mesomorph' | 'endomorph' | null,
        // Periodization context
        mesocycleWeek: profile.current_mesocycle_week,
        mesocyclePhase: profile.mesocycle_phase as 'accumulation' | 'intensification' | 'deload' | 'transition' | null,
        // Caloric phase context
        caloricPhase: profile.caloric_phase as 'bulk' | 'cut' | 'maintenance' | null,
        caloricIntakeKcal: profile.caloric_intake_kcal,
        // Active insights and memories for AI safety and personalization
        activeInsights: transformedInsights,
        activeMemories: transformedMemories,
        // Current cycle progress for fatigue-aware exercise selection
        currentCycleProgress: currentCycleProgress,
        ...sessionContext
      },
      profile.preferred_language as 'en' | 'it' || 'en', // targetLanguage
      previousResponseId // GPT-5 reasoning continuity
      )
    } catch (error: any) {
      console.error('[WorkoutGenerator] ExerciseSelector failed:', error)
      // Provide more user-friendly error message for timeouts
      if (error.message && error.message.includes('timeout')) {
        throw new Error('AI exercise selection took too long. This may be due to high system load or complex workout constraints. Please try again in a few moments.')
      }
      // Re-throw other errors as-is
      throw error
    } finally {
      // 🛑 Stop progress simulator when AI call completes (success or error)
      clearInterval(progressSimulator)
    }

    // Progress: After AI selection (60%)
    await onProgress?.('ai', 60, 'AI exercise selection complete')

    // Progress: Calculating targets (70%)
    await onProgress?.('optimization', 70, 'Calculating progressive overload targets')

    // Get exercise history and calculate initial targets
    const exercisesWithTargets = await Promise.all(
      selection.exercises.map(async (exercise) => {
        const history = await this.getExerciseHistory(userId, exercise.name)

        let targetWeight = 0
        let targetReps = exercise.repRange[0]

        // First, check for learned weights from recent completed workouts
        const learnedWeight = await this.getLearnedTargetWeight(userId, exercise.name, supabase)

        if (history.length > 0) {
          // Calculate progressive overload based on actual performance
          const progressiveTarget = this.calculateProgressiveTarget(
            history,
            exercise.repRange
          )
          targetWeight = progressiveTarget.weight
          targetReps = progressiveTarget.reps

          // If we have learned weights and they're more recent or higher confidence,
          // use them as a baseline adjustment
          if (learnedWeight && learnedWeight.confidence === 'high') {
            // Use learned weight if it's significantly different (more than 10% variance)
            if (Math.abs(learnedWeight.targetWeight - targetWeight) / targetWeight > 0.1) {
              console.log('[WorkoutGenerator] Using learned weight over calculated progression', {
                exerciseName: exercise.name,
                calculatedWeight: targetWeight,
                learnedWeight: learnedWeight.targetWeight,
                variance: Math.round((Math.abs(learnedWeight.targetWeight - targetWeight) / targetWeight) * 100) + '%'
              })
              // Use average of both for smooth transition
              targetWeight = Math.round((targetWeight + learnedWeight.targetWeight) / 2)
            }
          }
        } else {
          // No history - check learned weights first before estimating
          if (learnedWeight) {
            console.log('[WorkoutGenerator] Using learned weight for exercise with no history', {
              exerciseName: exercise.name,
              learnedWeight: learnedWeight.targetWeight,
              confidence: learnedWeight.confidence
            })
            targetWeight = learnedWeight.targetWeight
          } else {
            // Initial conservative estimate based on exercise type and demographics
            // Infer exercise type from name (compound = major movements, isolation = accessories)
            const exerciseType = this.inferExerciseType(exercise.name)

            targetWeight = await this.estimateInitialWeight(
              exercise.name,
              exerciseType,
              profile.gender || 'other',
              profile.weight || null,
              profile.strength_baseline as Record<string, any> | null,
              supabase,
              {
                age: profile.age || undefined,
                experienceYears: profile.experience_years || undefined,
                equipment: exercise.equipmentVariant || undefined,
                trainingApproach: undefined // Approach details not available in selection output
              }
            )
          }
        }

        return {
          exerciseName: exercise.name, // Use canonical field name
          name: exercise.name, // Keep for backwards compatibility
          equipmentVariant: exercise.equipmentVariant,
          equipment: exercise.equipmentVariant, // Duplicate for AnimationService compatibility
          sets: exercise.sets,
          repRange: exercise.repRange,
          restSeconds: exercise.restSeconds,
          tempo: exercise.tempo,
          targetWeight,
          targetReps,
          rationale: exercise.rationaleForSelection,
          alternatives: exercise.alternatives,
          // Exercise metadata for animations and tracking
          primaryMuscles: exercise.primaryMuscles || [],
          secondaryMuscles: exercise.secondaryMuscles || [],
          // NOTE: Do NOT map movementPattern to canonicalPattern
          // movementPattern contains metadata like "horizontal_push", not exercise names
          // Animation URL is pre-fetched in exercise.animationUrl, so canonicalPattern is not needed
          canonicalPattern: undefined,
          movementPattern: exercise.movementPattern, // Keep as separate field for metadata
          romEmphasis: exercise.romEmphasis,
          unilateral: exercise.unilateral,
          // Technical guidance
          technicalCues: exercise.technicalCues || [],
          warmupSets: exercise.warmupSets?.map(warmup => ({
            ...warmup,
            weight: Math.round((warmup.weightPercentage / 100) * targetWeight * 2) / 2 // Calculate actual weight from percentage, round to 0.5kg
          })) || [],
          setGuidance: exercise.setGuidance || [],
          // Animation data (pre-fetched by ExerciseSelector)
          animationUrl: exercise.animationUrl,
          hasAnimation: exercise.hasAnimation,
          // User modification tracking
          aiRecommendedSets: exercise.sets, // Mark as AI-recommended
          userAddedSets: undefined,
          userModifications: undefined,
        }
      })
    )

    // Progress: Optimization complete
    await onProgress?.('optimization', 85, 'Analyzing performance history')

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
      status: options?.status || 'ready',
      // GPT-5 reasoning persistence
      ai_response_id: selection.responseId || null
    }

    // Progress: Finalizing
    await onProgress?.('finalize', 95, 'Finalizing workout details')

    // Create workout using admin client (for background workers) or server client (for API routes)
    const workout = await WorkoutService.createServer(workoutData, supabase)

    // Progress: Complete!
    await onProgress?.('complete', 100, 'Workout ready!')

    // Generate audio coaching scripts (async, don't wait for completion)
    // This runs in the background to avoid blocking workout creation
    this.generateAudioScripts(
      workout.id,
      {
        exercises: exercisesWithTargets,
        userId,
        approachId: profile.approach_id,
        userName: profile.first_name || undefined, // User's first name for personalized audio coaching
        experienceYears: profile.experience_years || undefined,
        workoutRationale: selection.workoutRationale // Overall workout focus and sequencing
      },
      profile.preferred_language as 'en' | 'it' || 'en',
      supabase
    ).catch((error) => {
      // Log error but don't fail workout creation
      console.error('[WorkoutGenerator] Failed to generate audio scripts:', error)
    })

    return {
      workout,
      insightInfluencedChanges: selection.insightInfluencedChanges
    }
  }

  /**
   * Generate audio coaching scripts for a workout
   * Runs asynchronously after workout creation to avoid blocking
   */
  private static async generateAudioScripts(
    workoutId: string,
    scriptInput: {
      exercises: any[]
      userId: string
      approachId: string
      userName?: string
      experienceYears?: number
      workoutRationale?: string
    },
    targetLanguage: 'en' | 'it',
    supabase: any
  ): Promise<void> {
    try {
      console.log(`[WorkoutGenerator] Generating audio scripts for workout ${workoutId}`)

      // Initialize audio script generator
      const audioGenerator = new AudioScriptGeneratorAgent(supabase)
      audioGenerator.setUserId(scriptInput.userId)

      // Fetch user profile for periodization context
      const userProfile = await UserProfileService.getByUserIdServer(scriptInput.userId)

      // Fetch workout details for cycle context
      const { data: workoutData } = await supabase
        .from('workouts')
        .select('cycle_day, split_plan_id')
        .eq('id', workoutId)
        .single()

      // Fetch split plan for total cycle days
      let totalCycleDays: number | undefined
      if (workoutData?.split_plan_id) {
        const { data: splitPlanData } = await supabase
          .from('split_plans')
          .select('cycle_days')
          .eq('id', workoutData.split_plan_id)
          .single()

        totalCycleDays = splitPlanData?.cycle_days
      }

      // Extract common rest periods from exercises
      const restPeriods = Array.from(
        new Set(
          scriptInput.exercises
            .map((ex) => ex.restSeconds)
            .filter((r): r is number => typeof r === 'number')
        )
      ).sort((a, b) => a - b)

      // Prepare input for audio script generator with contextual data
      const audioInput = {
        workoutRationale: scriptInput.workoutRationale, // Overall workout focus and exercise sequencing
        exercises: scriptInput.exercises.map((ex) => ({
          name: ex.name || ex.exerciseName,
          sets: ex.sets,
          repRange: ex.repRange,
          tempo: ex.tempo,
          technicalCues: ex.technicalCues,
          rationaleForSelection: ex.rationale,
          setGuidance: ex.setGuidance,
          warmupSets: ex.warmupSets,
        })),
        userId: scriptInput.userId,
        approachId: scriptInput.approachId,
        userName: scriptInput.userName,
        experienceYears: scriptInput.experienceYears,
        commonRestPeriods: restPeriods.length > 0 ? restPeriods : [60, 90, 120],
        // Contextual data for storytelling and personalization
        cycleDay: workoutData?.cycle_day || userProfile?.current_cycle_day || undefined,
        totalCycleDays: totalCycleDays || (userProfile?.active_split_plan_id ? 8 : undefined), // Default 8 if unknown
        mesocycleWeek: userProfile?.current_mesocycle_week || undefined,
        mesocyclePhase: userProfile?.mesocycle_phase || undefined,
        userWeakPoints: userProfile?.weak_points || [],
      }

      // Generate scripts using AI
      const audioScripts = await audioGenerator.generateWorkoutScripts(
        audioInput,
        targetLanguage
      )

      // Update workout with audio scripts
      const { error: updateError } = await supabase
        .from('workouts')
        .update({ audio_scripts: audioScripts })
        .eq('id', workoutId)

      if (updateError) {
        throw new Error(`Failed to save audio scripts: ${updateError.message}`)
      }

      console.log(`[WorkoutGenerator] Audio scripts generated successfully for workout ${workoutId}`)
    } catch (error) {
      console.error('[WorkoutGenerator] Audio script generation error:', error)
      throw error
    }
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
  ): Promise<{
    workout: Workout
    insightInfluencedChanges?: Array<{
      source: 'insight' | 'memory'
      sourceId: string
      sourceTitle: string
      action: 'avoided' | 'substituted' | 'preferred' | 'adjusted'
      originalExercise?: string
      selectedExercise?: string
      reason: string
    }>
  }> {
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
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
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
      return exercises?.map((e: any) => getExerciseName(e)) || []
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
   * Falls back to AI estimation if traditional methods return 0 or fail
   */
  private static async estimateInitialWeight(
    exerciseName: string,
    exerciseType: 'compound' | 'isolation' | 'accessory',
    gender: 'male' | 'female' | 'other' = 'other',
    bodyweight: number | null = null,
    strengthBaseline: Record<string, { weight: number; reps: number; rir: number }> | null = null,
    supabaseClient?: any,
    additionalContext?: {
      age?: number
      experienceYears?: number
      equipment?: string
      trainingApproach?: {
        name: string
        focus: string
      }
    }
  ): Promise<number> {
    const name = exerciseName.toLowerCase()

    console.log('[WorkoutGenerator.estimateInitialWeight] Starting estimation', {
      exerciseName,
      exerciseType,
      gender,
      hasBodyweight: !!bodyweight,
      hasBaseline: !!strengthBaseline,
      hasAdditionalContext: !!additionalContext
    })

    // Check if we have a strength baseline for this exercise
    if (strengthBaseline) {
      for (const [baselineExercise, data] of Object.entries(strengthBaseline)) {
        const baselineName = baselineExercise.toLowerCase()
        // Match similar exercises (e.g., "bench press" matches "bench")
        if (name.includes(baselineName) || baselineName.includes(name.split(' ')[0])) {
          // Use 85% of baseline weight as conservative starting point
          const estimatedWeight = Math.round(data.weight * 0.85)
          console.log('[WorkoutGenerator.estimateInitialWeight] Using baseline', {
            baselineExercise,
            baselineWeight: data.weight,
            estimatedWeight
          })
          return estimatedWeight
        }
      }
    }

    // If bodyweight available, use bodyweight ratios for major lifts
    if (bodyweight && bodyweight > 0) {
      const genderMultiplier = gender === 'female' ? 0.6 : 1.0

      if (name.includes('bench')) return Math.round(bodyweight * 0.5 * genderMultiplier)
      if (name.includes('squat')) return Math.round(bodyweight * 0.6 * genderMultiplier)
      if (name.includes('deadlift')) return Math.round(bodyweight * 0.8 * genderMultiplier)
      if (name.includes('leg') && name.includes('press')) return Math.round(bodyweight * 0.7 * genderMultiplier) // Leg press similar to squat
      if (name.includes('row')) return Math.round(bodyweight * 0.4 * genderMultiplier)
      if (name.includes('press') && name.includes('shoulder')) return Math.round(bodyweight * 0.3 * genderMultiplier)
    }

    // Fallback to conservative starting weights adjusted by gender
    const genderMultiplier = gender === 'female' ? 0.6 : 1.0
    let fallbackWeight = 0

    if (name.includes('bench')) fallbackWeight = Math.round(40 * genderMultiplier)
    else if (name.includes('squat')) fallbackWeight = Math.round(50 * genderMultiplier)
    else if (name.includes('deadlift')) fallbackWeight = Math.round(60 * genderMultiplier)
    else if (name.includes('leg') && name.includes('press')) fallbackWeight = Math.round(70 * genderMultiplier) // Leg press is a heavy compound movement
    else if (name.includes('row')) fallbackWeight = Math.round(30 * genderMultiplier)
    else if (name.includes('press') && name.includes('shoulder')) fallbackWeight = Math.round(20 * genderMultiplier)
    else if (name.includes('curl')) fallbackWeight = Math.round(15 * genderMultiplier)
    else if (name.includes('extension')) fallbackWeight = Math.round(15 * genderMultiplier)
    else if (name.includes('raise')) fallbackWeight = Math.round(10 * genderMultiplier)
    else if (name.includes('fly')) fallbackWeight = Math.round(15 * genderMultiplier)
    else fallbackWeight = Math.round(20 * genderMultiplier) // Default conservative weight

    // If fallback returned 0 or we have no data, use AI estimation as last resort
    if (fallbackWeight === 0 || (fallbackWeight <= 10 && !bodyweight && !strengthBaseline)) {
      console.log('[WorkoutGenerator.estimateInitialWeight] Traditional methods failed or returned low weight, attempting AI estimation', {
        fallbackWeight,
        hasSupabaseClient: !!supabaseClient
      })

      // Only attempt AI if we have supabase client
      if (supabaseClient) {
        try {
          const estimator = new InitialWeightEstimator(supabaseClient)

          // Build user profile for AI
          const userProfile = {
            gender: gender === 'other' ? 'male' : gender, // AI expects male/female only
            bodyWeight: bodyweight || undefined,
            age: additionalContext?.age,
            experienceYears: additionalContext?.experienceYears
          }

          const aiResult = await estimator.estimateWeight({
            exerciseName,
            exerciseType,
            equipment: additionalContext?.equipment,
            userProfile,
            trainingApproach: additionalContext?.trainingApproach
          })

          console.log('[WorkoutGenerator.estimateInitialWeight] AI estimation succeeded', {
            aiEstimate: aiResult.estimatedWeight,
            confidence: aiResult.confidenceLevel,
            rationalePreview: aiResult.rationale.substring(0, 100)
          })

          return aiResult.estimatedWeight

        } catch (error) {
          console.error('[WorkoutGenerator.estimateInitialWeight] AI estimation failed, using fallback', {
            error: error instanceof Error ? error.message : String(error),
            fallbackWeight
          })
          // Fall through to return fallbackWeight
        }
      } else {
        console.warn('[WorkoutGenerator.estimateInitialWeight] No Supabase client available for AI estimation, using fallback', {
          fallbackWeight
        })
      }
    }

    console.log('[WorkoutGenerator.estimateInitialWeight] Returning weight', {
      weight: fallbackWeight,
      method: 'traditional'
    })

    return fallbackWeight
  }

  /**
   * Infer exercise type from exercise name
   * Helps classify exercises when type info is not provided
   */
  private static inferExerciseType(exerciseName: string): 'compound' | 'isolation' | 'accessory' {
    const name = exerciseName.toLowerCase()

    // Major compound movements
    const compoundKeywords = [
      'squat', 'deadlift', 'bench press', 'overhead press', 'military press',
      'row', 'pull-up', 'chin-up', 'dip', 'lunge', 'leg press'
    ]

    for (const keyword of compoundKeywords) {
      if (name.includes(keyword)) {
        return 'compound'
      }
    }

    // Isolation movements
    const isolationKeywords = [
      'curl', 'extension', 'raise', 'fly', 'flye', 'kickback',
      'pulldown', 'pushdown', 'calf', 'crunch', 'ab'
    ]

    for (const keyword of isolationKeywords) {
      if (name.includes(keyword)) {
        return 'isolation'
      }
    }

    // Default to accessory for unknown exercises
    return 'accessory'
  }

  /**
   * Get learned target weight for an exercise from recent completed workouts
   * Prioritizes most recent learned weight within last 30 days
   */
  private static async getLearnedTargetWeight(
    userId: string,
    exerciseName: string,
    supabaseClient: any
  ): Promise<{
    targetWeight: number
    confidence: 'low' | 'medium' | 'high'
    updatedAt: string
  } | null> {
    try {
      console.log('[WorkoutGenerator.getLearnedTargetWeight] Searching for learned weights', {
        userId,
        exerciseName
      })

      // Get recent completed workouts (last 30 days) with learned weights
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: workouts, error } = await supabaseClient
        .from('workouts')
        .select('learned_target_weights, completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('learned_target_weights', 'is', null)
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .order('completed_at', { ascending: false })
        .limit(10) // Check last 10 completed workouts

      if (error) {
        console.error('[WorkoutGenerator.getLearnedTargetWeight] Query failed', {
          error: error.message
        })
        return null
      }

      if (!workouts || workouts.length === 0) {
        console.log('[WorkoutGenerator.getLearnedTargetWeight] No recent workouts with learned weights found')
        return null
      }

      console.log('[WorkoutGenerator.getLearnedTargetWeight] Found workouts with learned weights', {
        count: workouts.length
      })

      // Search for the most recent learned weight for this exercise
      for (const workout of workouts) {
        const learnedWeights = workout.learned_target_weights as Array<{
          exerciseName: string
          targetWeight: number
          updatedAt: string
          confidence: 'low' | 'medium' | 'high'
        }>

        if (!learnedWeights || !Array.isArray(learnedWeights)) continue

        const learnedWeight = learnedWeights.find(
          w => w.exerciseName.toLowerCase() === exerciseName.toLowerCase()
        )

        if (learnedWeight) {
          console.log('[WorkoutGenerator.getLearnedTargetWeight] Found learned weight', {
            exerciseName,
            targetWeight: learnedWeight.targetWeight,
            confidence: learnedWeight.confidence,
            workoutCompletedAt: workout.completed_at
          })
          return learnedWeight
        }
      }

      console.log('[WorkoutGenerator.getLearnedTargetWeight] No learned weight found for exercise', {
        exerciseName
      })
      return null

    } catch (error) {
      console.error('[WorkoutGenerator.getLearnedTargetWeight] Unexpected error', {
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  /**
   * Get exercise stagnation/plateau data for AI rotation recommendations
   * Calculates weeks used and performance change for each exercise
   *
   * @param userId - User ID
   * @param exerciseNames - Exercise names to analyze
   * @param supabase - Supabase client
   * @returns Array of exercise history context for AI prompt
   */
  private static async getExerciseStagnationData(
    userId: string,
    exerciseNames: string[],
    supabase: any
  ): Promise<Array<{
    name: string
    weeksUsed: number
    isPlateaued: boolean
    avgWeightChange: number
  }>> {
    if (!exerciseNames || exerciseNames.length === 0) {
      return []
    }

    try {
      // Query sets_log for the last 8 weeks, grouped by exercise and week
      const eightWeeksAgo = new Date()
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56) // 8 weeks

      const { data: setLogs, error } = await supabase
        .from('sets_log')
        .select(`
          exercise_name,
          weight_actual,
          created_at,
          workouts!inner (
            user_id,
            status
          )
        `)
        .eq('workouts.user_id', userId)
        .eq('workouts.status', 'completed')
        .eq('set_type', 'working')
        .eq('skipped', false)
        .gte('created_at', eightWeeksAgo.toISOString())
        .order('created_at', { ascending: true })

      if (error || !setLogs || setLogs.length === 0) {
        console.log('[getExerciseStagnationData] No data found or error:', error?.message)
        return []
      }

      // Group by exercise name (case-insensitive)
      const exerciseData = new Map<string, {
        weeks: Set<string>
        weightsByWeek: Map<string, number[]>
      }>()

      for (const log of setLogs) {
        const exerciseName = log.exercise_name?.toLowerCase()
        if (!exerciseName || log.weight_actual === null) continue

        // Check if this exercise is in our target list (case-insensitive)
        const matchingExercise = exerciseNames.find(
          name => name.toLowerCase() === exerciseName
        )
        if (!matchingExercise) continue

        // Get week key (YYYY-WW format)
        const date = new Date(log.created_at)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay()) // Start of week
        const weekKey = weekStart.toISOString().slice(0, 10)

        if (!exerciseData.has(matchingExercise)) {
          exerciseData.set(matchingExercise, {
            weeks: new Set(),
            weightsByWeek: new Map()
          })
        }

        const data = exerciseData.get(matchingExercise)!
        data.weeks.add(weekKey)

        if (!data.weightsByWeek.has(weekKey)) {
          data.weightsByWeek.set(weekKey, [])
        }
        data.weightsByWeek.get(weekKey)!.push(log.weight_actual)
      }

      // Calculate plateau status for each exercise
      const results: Array<{
        name: string
        weeksUsed: number
        isPlateaued: boolean
        avgWeightChange: number
      }> = []

      exerciseData.forEach((data, exerciseName) => {
        const weeksUsed = data.weeks.size

        // Calculate average weight change
        const sortedWeeks = Array.from(data.weightsByWeek.entries())
          .sort((a: [string, number[]], b: [string, number[]]) => a[0].localeCompare(b[0]))

        let avgWeightChange = 0

        if (sortedWeeks.length >= 2) {
          // Compare first and last week averages
          const firstWeekWeights = sortedWeeks[0][1]
          const lastWeekWeights = sortedWeeks[sortedWeeks.length - 1][1]

          const firstAvg = firstWeekWeights.reduce((a: number, b: number) => a + b, 0) / firstWeekWeights.length
          const lastAvg = lastWeekWeights.reduce((a: number, b: number) => a + b, 0) / lastWeekWeights.length

          if (firstAvg > 0) {
            avgWeightChange = ((lastAvg - firstAvg) / firstAvg) * 100
          }
        }

        // Plateau: 4+ weeks used AND weight change < 2.5%
        const isPlateaued = weeksUsed >= 4 && Math.abs(avgWeightChange) < 2.5

        results.push({
          name: exerciseName,
          weeksUsed,
          isPlateaued,
          avgWeightChange: Math.round(avgWeightChange * 10) / 10 // Round to 1 decimal
        })
      })

      console.log('[getExerciseStagnationData] Calculated stagnation data:', {
        exercisesAnalyzed: results.length,
        plateauedCount: results.filter(r => r.isPlateaued).length
      })

      return results

    } catch (error) {
      console.error('[getExerciseStagnationData] Unexpected error:', error)
      return []
    }
  }
}
