import { inngest } from '../client'
import { WorkoutGeneratorService } from '@/lib/services/workout-generator.service'
import { GenerationQueueAdminService } from '@/lib/services/generation-queue-admin.service'

/**
 * Inngest function for asynchronous workout generation
 *
 * This function runs in the background and:
 * 1. Updates queue status to in_progress
 * 2. Generates workout with progress tracking
 * 3. Updates progress in database
 * 4. Marks as completed/failed when done
 *
 * Triggered by event: 'workout/generate.requested'
 */
export const generateWorkoutFunction = inngest.createFunction(
  {
    id: 'generate-workout-async',
    name: 'Generate Workout (Async)',
    // Retry configuration
    retries: 3,
  },
  { event: 'workout/generate.requested' },
  async ({ event, step }) => {
    const { requestId, userId, targetCycleDay } = event.data

    console.log(`[Inngest] Starting workout generation for request ${requestId}`)

    // Step 1: Update status to in_progress and set initial progress
    await step.run('update-status-in-progress', async () => {
      await GenerationQueueAdminService.markAsStarted(requestId)
      // Explicitly write initial progress to ensure polling has something to read
      await GenerationQueueAdminService.updateProgress({
        requestId,
        progressPercent: 0,
        currentPhase: 'Starting workout generation...',
      })
    })

    try {
      // Step 2: Generate workout (no step wrapper to allow real-time progress updates)
      console.log(`[Inngest] Generating workout for user ${userId}, cycle day ${targetCycleDay}`)

      // Import admin client for background processing (bypasses RLS)
      const { getSupabaseAdmin } = await import('@/lib/supabase/admin')
      const adminClient = getSupabaseAdmin()

      // Progress callback to update database (outside step.run for real-time visibility)
      const onProgress = async (phase: string, percent: number, message: string) => {
        console.log(`[Inngest] Progress: ${percent}% - ${message}`)
        try {
          await GenerationQueueAdminService.updateProgress({
            requestId,
            progressPercent: Math.round(percent),
            currentPhase: message,
          })
        } catch (progressError) {
          // Log progress update errors but don't fail the whole generation
          console.error(`[Inngest] Failed to update progress (non-fatal):`, progressError)
        }
      }

      // 🕐 Timeout wrapper: Prevent indefinite hangs (max 11 minutes to accommodate retry logic)
      const GENERATION_TIMEOUT_MS = 11 * 60 * 1000 // 11 minutes (240s base + 360s retry + 60s buffer)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(
            `Workout generation timeout after ${GENERATION_TIMEOUT_MS / 1000}s. ` +
            `The AI took too long to generate exercises. This may indicate network issues or overloaded AI service.`
          ))
        }, GENERATION_TIMEOUT_MS)
      })

      // Generate workout with progress tracking AND admin client
      const workout = await Promise.race([
        WorkoutGeneratorService.generateWorkout(userId, {
          targetCycleDay,
          onProgress,
          supabaseClient: adminClient,
        }),
        timeoutPromise
      ])

      // Step 3: Mark as completed
      await step.run('mark-as-completed', async () => {
        console.log(`[Inngest] ✅ Workout generation completed: ${workout.workout.id}`)
        await GenerationQueueAdminService.markAsCompleted({
          requestId,
          workoutId: workout.workout.id,
        })
      })

      return {
        success: true,
        workoutId: workout.workout.id,
        requestId,
      }
    } catch (error: any) {
      // 🔴 Enhanced error handling with categorization
      console.error(`[Inngest] ❌ Workout generation failed:`, {
        requestId,
        userId,
        errorName: error?.constructor?.name,
        errorMessage: error?.message,
        errorStack: error?.stack?.split('\n').slice(0, 5).join('\n')
      })

      // Categorize error for better user messaging
      let userFriendlyMessage = error.message || 'Unknown error during workout generation'
      let isRetriable = true

      if (error.message?.includes('timeout')) {
        userFriendlyMessage = 'Workout generation took too long. The AI service may be overloaded. Please try again in a few minutes.'
        isRetriable = true // Timeouts are retriable
      } else if (error.message?.includes('JSON') || error.message?.includes('parse')) {
        userFriendlyMessage = 'AI returned invalid data. This should not happen with Structured Outputs. Please try again.'
        isRetriable = true // Parsing errors might be transient
      } else if (error.message?.includes('OpenAI') || error.message?.includes('API')) {
        userFriendlyMessage = 'AI service error. The OpenAI API may be temporarily unavailable. Please try again shortly.'
        isRetriable = true // API errors are retriable
      } else if (error.message?.includes('database') || error.message?.includes('Supabase')) {
        userFriendlyMessage = 'Database error while saving workout. Please try again.'
        isRetriable = true // DB errors are retriable
      } else if (error.message?.includes('validation')) {
        userFriendlyMessage = 'AI generated invalid workout structure. Please try again.'
        isRetriable = false // Validation errors indicate a prompt/schema issue, don't retry
      }

      // Step 4: Mark as failed with detailed error info
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
