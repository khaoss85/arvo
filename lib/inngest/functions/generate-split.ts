import { inngest } from '../client'
import { SplitPlanner } from '@/lib/agents/split-planner.agent'
import { GenerationQueueAdminService } from '@/lib/services/generation-queue-admin.service'
import { CycleStatsService } from '@/lib/services/cycle-stats.service'
import { SplitPlanService } from '@/lib/services/split-plan.service'
import type { SplitPlannerInput } from '@/lib/agents/split-planner.agent'

/**
 * Inngest function for asynchronous split generation
 *
 * This function runs in the background and:
 * 1. Updates queue status to in_progress
 * 2. Loads cycle history for context
 * 3. Generates split with progress tracking
 * 4. Updates progress in database
 * 5. Marks as completed/failed when done
 *
 * Triggered by event: 'split/generate.requested'
 */
export const generateSplitFunction = inngest.createFunction(
  {
    id: 'generate-split-async',
    name: 'Generate Split (Async)',
    // Retry configuration
    retries: 3,
  },
  { event: 'split/generate.requested' },
  async ({ event, step }) => {
    const { requestId, userId, input, targetLanguage } = event.data as {
      requestId: string
      userId: string
      input: SplitPlannerInput
      targetLanguage: string
    }

    console.log(`[Inngest] Starting split generation for request ${requestId}`)

    // Step 1: Update status to in_progress and set initial progress
    await step.run('update-status-in-progress', async () => {
      await GenerationQueueAdminService.markAsStarted(requestId)
      // Explicitly write initial progress to ensure polling has something to read
      await GenerationQueueAdminService.updateProgress({
        requestId,
        progressPercent: 0,
        currentPhase: 'Starting split generation...',
      })
    })

    try {
      // Step 2: Load cycle history (10%)
      console.log(`[Inngest] Loading cycle history for user ${userId}`)
      await GenerationQueueAdminService.updateProgress({
        requestId,
        progressPercent: 10,
        currentPhase: 'Loading training history...',
      })

      // Import admin client for background processing (bypasses RLS)
      const { getSupabaseAdmin } = await import('@/lib/supabase/admin')
      const adminClient = getSupabaseAdmin()

      let cycleHistory = null
      let cycleComparison = null

      try {
        const allCycles = await CycleStatsService.getAllCycleCompletions(userId)

        if (allCycles.length > 0) {
          // Get last 3 cycles for context
          const recentCycles = allCycles.slice(0, 3)

          cycleHistory = recentCycles.map(cycle => ({
            cycleNumber: cycle.cycle_number,
            completedAt: cycle.completed_at,
            totalVolume: cycle.total_volume,
            totalWorkoutsCompleted: cycle.total_workouts_completed,
            avgMentalReadiness: cycle.avg_mental_readiness,
            totalSets: cycle.total_sets,
            volumeByMuscleGroup: (cycle.volume_by_muscle_group as Record<string, number>) || {},
            workoutsByType: (cycle.workouts_by_type as Record<string, number>) || {},
          }))

          // Get comparison between last two cycles if available
          if (allCycles.length >= 2) {
            const lastCycle = allCycles[0]
            const previousCycle = allCycles[1]

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

          console.log(`[Inngest] Loaded ${cycleHistory.length} cycles for context`)
        }
      } catch (error) {
        console.error('[Inngest] Failed to load cycle history (non-critical):', error)
        // Continue without cycle history - it's optional context
      }

      // Step 3: AI split planning (30%)
      await GenerationQueueAdminService.updateProgress({
        requestId,
        progressPercent: 30,
        currentPhase: 'AI analyzing your training needs...',
      })

      const splitPlanner = new SplitPlanner(adminClient, 'low')  // Use low reasoning for good quality with acceptable speed

      // 🕐 Timeout wrapper: Prevent indefinite hangs (max 3.5 minutes for 'low' reasoning)
      const GENERATION_TIMEOUT_MS = 3.5 * 60 * 1000 // 3.5 minutes (gives buffer for complex prompts + AI timeout of 180s)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(
            `Split generation timeout after ${GENERATION_TIMEOUT_MS / 1000}s. ` +
            `The AI took too long to generate the split. This may indicate network issues or overloaded AI service.`
          ))
        }, GENERATION_TIMEOUT_MS)
      })

      // Step 4: Generate split plan with progress tracking (60%)
      await GenerationQueueAdminService.updateProgress({
        requestId,
        progressPercent: 60,
        currentPhase: 'AI is analyzing your training needs (this takes 1-2 minutes)...',
      })

      // Start fake progress updates during AI call to show activity
      const aiStartTime = Date.now()
      const fakeProgressInterval = setInterval(async () => {
        const elapsed = Date.now() - aiStartTime
        // Simulate gradual progress: 60% → 78% over 180 seconds
        const fakeProgress = 60 + Math.min(18, Math.floor(elapsed / 10000))

        await GenerationQueueAdminService.updateProgress({
          requestId,
          progressPercent: fakeProgress,
          currentPhase: 'AI is reasoning through your personalized split...',
        }).catch(() => {
          // Ignore errors during fake progress updates
        })
      }, 10000) // Update every 10 seconds

      let splitPlanData
      try {
        splitPlanData = await Promise.race([
          splitPlanner.planSplit({
            ...input,
            recentCycleCompletions: cycleHistory || undefined,
            cycleComparison: cycleComparison || undefined,
          }, targetLanguage as 'en' | 'it' | undefined),
          timeoutPromise
        ])
      } finally {
        clearInterval(fakeProgressInterval) // Stop fake updates regardless of success/failure
      }

      // Step 5: Save to database (85%)
      await GenerationQueueAdminService.updateProgress({
        requestId,
        progressPercent: 85,
        currentPhase: 'Saving split plan...',
      })

      const splitPlanBase = {
        user_id: input.userId,
        approach_id: input.approachId,
        split_type: input.splitType,
        cycle_days: splitPlanData.cycleDays,
        sessions: splitPlanData.sessions as any,
        frequency_map: splitPlanData.frequencyMap as any,
        volume_distribution: splitPlanData.volumeDistribution as any,
        active: true,
        ai_response_id: splitPlanData.responseId || null, // Store for GPT-5 reasoning persistence
      }

      // Add specialization fields for weak_point_focus splits
      const splitPlanData_final = input.splitType === 'weak_point_focus' && input.specializationMuscle
        ? {
            ...splitPlanBase,
            specialization_muscle: input.specializationMuscle,
            specialization_frequency: splitPlanData.frequencyMap?.[input.specializationMuscle] || 3,
            specialization_volume_multiplier: 1.5,
          }
        : splitPlanBase

      const splitPlan = await SplitPlanService.createServer(
        splitPlanData_final,
        adminClient  // Pass admin client to bypass RLS in background context
      )

      // Step 6: Mark as completed
      await step.run('mark-as-completed', async () => {
        console.log(`[Inngest] ✅ Split generation completed: ${splitPlan.id}`)
        await GenerationQueueAdminService.markSplitAsCompleted({
          requestId,
          splitPlanId: splitPlan.id,
        })
      })

      return {
        success: true,
        splitPlanId: splitPlan.id,
        requestId,
      }
    } catch (error: any) {
      // 🔴 Enhanced error handling with categorization
      console.error(`[Inngest] ❌ Split generation failed:`, {
        requestId,
        userId,
        errorName: error?.constructor?.name,
        errorMessage: error?.message,
        errorStack: error?.stack?.split('\n').slice(0, 5).join('\n')
      })

      // Categorize error for better user messaging
      let userFriendlyMessage = error.message || 'Unknown error during split generation'
      let isRetriable = true

      if (error.message?.includes('timeout')) {
        userFriendlyMessage = 'Split generation took too long. The AI service may be overloaded. Please try again in a few minutes.'
        isRetriable = true // Timeouts are retriable
      } else if (error.message?.includes('JSON') || error.message?.includes('parse')) {
        userFriendlyMessage = 'AI returned invalid data. This should not happen with Structured Outputs. Please try again.'
        isRetriable = true // Parsing errors might be transient
      } else if (error.message?.includes('OpenAI') || error.message?.includes('API')) {
        userFriendlyMessage = 'AI service error. The OpenAI API may be temporarily unavailable. Please try again shortly.'
        isRetriable = true // API errors are retriable
      } else if (error.message?.includes('database') || error.message?.includes('Supabase')) {
        userFriendlyMessage = 'Database error while saving split. Please try again.'
        isRetriable = true // DB errors are retriable
      } else if (error.message?.includes('validation')) {
        userFriendlyMessage = 'AI generated invalid split structure. Please try again.'
        isRetriable = false // Validation errors indicate a prompt/schema issue, don't retry
      }

      // Step 7: Mark as failed with detailed error info
      await step.run('mark-as-failed', async () => {
        await GenerationQueueAdminService.markAsFailed({
          requestId,
          errorMessage: userFriendlyMessage,
        })
      })

      // Only re-throw retriable errors to trigger Inngest retry
      if (isRetriable) {
        throw error
      } else {
        // For non-retriable errors, log but don't retry
        console.error(`[Inngest] Non-retriable error, not retrying:`, userFriendlyMessage)
        return {
          success: false,
          requestId,
          error: userFriendlyMessage,
        }
      }
    }
  }
)
