import { inngest } from '../client'
import { SplitPlanner } from '@/lib/agents/split-planner.agent'
import { GenerationQueueAdminService } from '@/lib/services/generation-queue-admin.service'
import { CycleStatsService } from '@/lib/services/cycle-stats.service'
import { SplitPlanService } from '@/lib/services/split-plan.service'
import { memoryService } from '@/lib/services/memory.service'
import { insightService } from '@/lib/services/insight.service'
import { getUserLanguage } from '@/lib/utils/get-user-language'
import type { SplitPlannerInput } from '@/lib/agents/split-planner.agent'

/**
 * Helper to get recent substitutions
 */
async function getRecentSubstitutions(userId: string, daysBack: number) {
  const { getSupabaseAdmin } = await import('@/lib/supabase/admin')
  const supabase = getSupabaseAdmin()

  const threshold = new Date()
  threshold.setDate(threshold.getDate() - daysBack)

  const { data: substitutions, error } = await supabase
    .from('sets_log')
    .select(`
      exercise_name,
      original_exercise_name,
      substitution_reason,
      workouts!inner(
        user_id,
        completed_at
      )
    `)
    .eq('workouts.user_id', userId)
    .not('original_exercise_name', 'is', null)
    .gte('workouts.completed_at', threshold.toISOString())

  if (error || !substitutions) {
    console.error('[getRecentSubstitutions] Error:', error)
    return []
  }

  // Deduplicate and count
  const patternMap = new Map<string, any>()

  for (const sub of substitutions) {
    if (!sub.original_exercise_name || !sub.exercise_name) continue

    const key = `${sub.original_exercise_name}→${sub.exercise_name}`

    if (patternMap.has(key)) {
      patternMap.get(key)!.count++
    } else {
      patternMap.set(key, {
        originalExercise: sub.original_exercise_name,
        newExercise: sub.exercise_name,
        reason: sub.substitution_reason || 'user_preference',
        count: 1
      })
    }
  }

  return Array.from(patternMap.values())
}

/**
 * Inngest function for asynchronous split adaptation after cycle completion
 *
 * This function:
 * 1. Loads current active split
 * 2. Gathers adaptation context (cycles, memories, insights, substitutions)
 * 3. Calls SplitPlanner with "medium" reasoning for quality adaptations
 * 4. Saves adapted split and updates user profile
 *
 * Triggered by event: 'split/adapt.requested'
 */
export const adaptSplitFunction = inngest.createFunction(
  {
    id: 'adapt-split-async',
    name: 'Adapt Split After Cycle (Async)',
    retries: 3,
  },
  { event: 'split/adapt.requested' },
  async ({ event, step }) => {
    const { requestId, userId } = event.data as {
      requestId: string
      userId: string
    }

    console.log(`[Inngest] Starting split adaptation for request ${requestId}`)

    // Step 1: Update status to in_progress
    await step.run('update-status-in-progress', async () => {
      await GenerationQueueAdminService.markAsStarted(requestId)
      await GenerationQueueAdminService.updateProgress({
        requestId,
        progressPercent: 0,
        currentPhase: 'Starting split adaptation...',
      })
    })

    try {
      // Import admin client for background processing
      const { getSupabaseAdmin } = await import('@/lib/supabase/admin')
      const adminClient = getSupabaseAdmin()

      // Step 2: Load current active split (10%)
      await GenerationQueueAdminService.updateProgress({
        requestId,
        progressPercent: 10,
        currentPhase: 'Loading current split...',
      })

      const currentSplit = await SplitPlanService.getActive(userId)
      if (!currentSplit) {
        throw new Error('No active split plan found')
      }

      console.log(`[Inngest] Current split:`, {
        id: currentSplit.id,
        type: currentSplit.split_type,
        cycleDays: currentSplit.cycle_days
      })

      // Step 3: Gather adaptation data (20%)
      await GenerationQueueAdminService.updateProgress({
        requestId,
        progressPercent: 20,
        currentPhase: 'Analyzing cycle history...',
      })

      // Get last 3 cycle completions for trend analysis
      const cycleHistory = await CycleStatsService.getAllCycleCompletions(userId)
      const recentCycles = cycleHistory.slice(0, 3)

      // Get cycle comparison (trends)
      let cycleComparison = null
      if (recentCycles.length >= 2) {
        const lastCycle = recentCycles[0]
        const previousCycle = recentCycles[1]

        const volumeDelta = previousCycle.total_volume > 0
          ? ((lastCycle.total_volume - previousCycle.total_volume) / previousCycle.total_volume) * 100
          : 0

        const mentalReadinessDelta = (lastCycle.avg_mental_readiness !== null && previousCycle.avg_mental_readiness !== null)
          ? lastCycle.avg_mental_readiness - previousCycle.avg_mental_readiness
          : null

        cycleComparison = {
          volumeDelta,
          workoutsDelta: lastCycle.total_workouts_completed - previousCycle.total_workouts_completed,
          mentalReadinessDelta,
          setsDelta: lastCycle.total_sets - previousCycle.total_sets,
        }
      }

      // Step 4: Load memories, insights, substitutions (35%)
      await GenerationQueueAdminService.updateProgress({
        requestId,
        progressPercent: 35,
        currentPhase: 'Loading your preferences and insights...',
      })

      const memories = await memoryService.getActiveMemories(userId)
      const insights = await insightService.getActiveInsights(userId)
      const substitutions = await getRecentSubstitutions(userId, 90)

      // Get user profile for equipment preferences
      const { data: profile } = await adminClient
        .from('user_profiles')
        .select('available_equipment, weak_points')
        .eq('user_id', userId)
        .single()

      console.log(`[Inngest] Adaptation data gathered:`, {
        cycles: recentCycles.length,
        memories: memories.length,
        insights: insights.length,
        substitutions: substitutions.length,
        equipment: profile?.available_equipment?.length || 0
      })

      // Step 5: Build SplitPlannerInput (45%)
      await GenerationQueueAdminService.updateProgress({
        requestId,
        progressPercent: 45,
        currentPhase: 'Preparing adaptation context...',
      })

      const targetLanguage = await getUserLanguage(userId)

      const input: SplitPlannerInput = {
        userId,
        approachId: currentSplit.approach_id!,
        splitType: currentSplit.split_type as any,
        weeklyFrequency: currentSplit.cycle_days,
        weakPoints: profile?.weak_points || [],
        equipmentAvailable: profile?.available_equipment || ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'],
        substitutionPatterns: substitutions.map((sub: any) => ({
          originalExercise: sub.original_exercise,
          newExercise: sub.substitute_exercise,
          reason: sub.reason,
          count: 1
        })),
        memories: memories.map((mem: any) => ({
          content: mem.title,
          category: mem.memory_category,
          createdAt: ''
        })),
        insights: insights.map((insight: any) => ({
          exerciseName: insight.exercise_name || 'Unknown',
          category: insight.insight_type || 'general',
          description: insight.user_note,
          severity: insight.severity || 'medium'
        })),
        recentCycleCompletions: recentCycles.map(cycle => ({
          cycleNumber: cycle.cycle_number,
          completedAt: cycle.completed_at,
          totalVolume: cycle.total_volume,
          totalWorkoutsCompleted: cycle.total_workouts_completed,
          avgMentalReadiness: cycle.avg_mental_readiness,
          totalSets: cycle.total_sets,
          volumeByMuscleGroup: cycle.volume_by_muscle_group as Record<string, number>,
          workoutsByType: cycle.workouts_by_type as Record<string, number>
        })),
        cycleComparison: cycleComparison || undefined
      }

      // Step 6: AI adaptation with medium reasoning (60%)
      await GenerationQueueAdminService.updateProgress({
        requestId,
        progressPercent: 60,
        currentPhase: 'AI adapting your split plan...',
      })

      // Timeout wrapper: 5 minutes max
      const GENERATION_TIMEOUT_MS = 5 * 60 * 1000
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(
            `Split adaptation timeout after ${GENERATION_TIMEOUT_MS / 1000}s. ` +
            `The AI took too long to adapt the split.`
          ))
        }, GENERATION_TIMEOUT_MS)
      })

      const planner = new SplitPlanner(adminClient, 'medium') // Use medium reasoning for quality
      const previousResponseId = currentSplit.ai_response_id || undefined

      const adaptedSplit = await Promise.race([
        planner.planSplit(input, targetLanguage as 'en' | 'it' | undefined, previousResponseId),
        timeoutPromise
      ])

      console.log(`[Inngest] Split adapted:`, {
        sessions: adaptedSplit.sessions?.length,
        cycleDays: adaptedSplit.cycleDays
      })

      // Step 7: Save adapted split (85%)
      await GenerationQueueAdminService.updateProgress({
        requestId,
        progressPercent: 85,
        currentPhase: 'Saving adapted split...',
      })

      // Deactivate current split
      await SplitPlanService.deactivateAll(userId)

      // Create new adapted split
      const newSplit = await SplitPlanService.createServer({
        user_id: userId,
        approach_id: currentSplit.approach_id!,
        split_type: currentSplit.split_type,
        cycle_days: adaptedSplit.cycleDays,
        sessions: adaptedSplit.sessions as any,
        frequency_map: adaptedSplit.frequencyMap,
        volume_distribution: adaptedSplit.volumeDistribution,
        active: true,
        ai_response_id: adaptedSplit.responseId || null,
      }, adminClient)  // Pass admin client to bypass RLS in background context

      // Update user profile
      await adminClient
        .from('user_profiles')
        .update({
          active_split_plan_id: newSplit.id,
          current_cycle_day: 1,
          current_cycle_start_date: new Date().toISOString()
        })
        .eq('user_id', userId)

      // Step 8: Mark as completed (100%)
      await step.run('mark-as-completed', async () => {
        console.log(`[Inngest] ✅ Split adaptation completed: ${newSplit.id}`)
        await GenerationQueueAdminService.markSplitAsCompleted({
          requestId,
          splitPlanId: newSplit.id,
        })
      })

      return {
        success: true,
        splitPlanId: newSplit.id,
        requestId,
        adaptationContext: {
          cyclesAnalyzed: recentCycles.length,
          memoriesUsed: memories.length,
          insightsUsed: insights.length,
          substitutionsUsed: substitutions.length
        }
      }
    } catch (error: any) {
      console.error(`[Inngest] ❌ Split adaptation failed:`, {
        requestId,
        userId,
        errorName: error?.constructor?.name,
        errorMessage: error?.message,
      })

      // Categorize error
      let userFriendlyMessage = error.message || 'Unknown error during split adaptation'
      let isRetriable = true

      if (error.message?.includes('timeout')) {
        userFriendlyMessage = 'Split adaptation took too long. Please try again in a few minutes.'
        isRetriable = true
      } else if (error.message?.includes('No active split')) {
        userFriendlyMessage = 'No active split plan found. Please create a split first.'
        isRetriable = false
      } else if (error.message?.includes('JSON') || error.message?.includes('parse')) {
        userFriendlyMessage = 'AI returned invalid data. Please try again.'
        isRetriable = true
      } else if (error.message?.includes('OpenAI') || error.message?.includes('API')) {
        userFriendlyMessage = 'AI service error. Please try again shortly.'
        isRetriable = true
      } else if (error.message?.includes('database') || error.message?.includes('Supabase')) {
        userFriendlyMessage = 'Database error while saving split. Please try again.'
        isRetriable = true
      }

      // Mark as failed
      await step.run('mark-as-failed', async () => {
        await GenerationQueueAdminService.markAsFailed({
          requestId,
          errorMessage: userFriendlyMessage,
        })
      })

      if (isRetriable) {
        throw error
      } else {
        console.error(`[Inngest] Non-retriable error:`, userFriendlyMessage)
        return {
          success: false,
          requestId,
          error: userFriendlyMessage,
        }
      }
    }
  }
)
