import { NextRequest } from 'next/server'
import { WorkoutGeneratorService } from '@/lib/services/workout-generator.service'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { getUserLanguage } from '@/lib/utils/get-user-language'
import { GenerationCache } from '@/lib/services/generation-cache'
import { GenerationMetricsService } from '@/lib/services/generation-metrics.service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Safely close a ReadableStreamDefaultController
 * Handles the case where the controller is already closed (can happen with GenerationCache)
 */
function safeClose(controller: ReadableStreamDefaultController) {
  try {
    controller.close()
  } catch (error) {
    // Controller already closed - this is expected when using GenerationCache
    if (error instanceof TypeError && error.message.includes('already closed')) {
      console.log('[WorkoutGenerate] Controller already closed (expected with cache)')
    } else {
      throw error
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get userId from authenticated session (not from request body for security)
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      const locale = await getUserLanguage(user?.id || '')
      const tErrors = await getTranslations({ locale, namespace: 'api.workouts.generate.errors' })
      return new Response(
        JSON.stringify({ error: tErrors('unauthorized') }),
        { status: 401 }
      )
    }

    const userId = user.id
    const locale = await getUserLanguage(userId)
    const body = await request.json()
    const { targetCycleDay, generationRequestId } = body

    // Get translations for progress messages and errors
    const tProgress = await getTranslations({ locale, namespace: 'api.workouts.generate.progress' })
    const tErrors = await getTranslations({ locale, namespace: 'api.workouts.generate.errors' })

    // Create a stream for progress updates
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper to send progress update with ETA
          const sendProgress = (
            phase: string,
            progress: number,
            message: string,
            eta?: number | null,
            detail?: string
          ) => {
            const data = JSON.stringify({
              phase,
              progress,
              message,
              ...(eta !== undefined && eta !== null && { eta }),
              ...(detail && { detail })
            })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }

          // Check cache for previous interrupted generation (idempotency + reconnection)
          if (generationRequestId) {
            const cached = GenerationCache.get(generationRequestId)

            if (cached?.status === 'complete') {
              // Previous generation completed while client was disconnected
              console.log(`[WorkoutGenerate] Returning cached result: ${generationRequestId}`)
              sendProgress('complete', 100, tProgress('workoutReady'))
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                phase: 'complete',
                workout: cached.workout,
                insightInfluencedChanges: cached.insightInfluencedChanges
              })}\n\n`))
              safeClose(controller)
              return
            }

            // Mark as started (for polling fallback)
            GenerationCache.start(generationRequestId)
          }

          // Get estimated duration for ETA calculation
          const generationStartTime = Date.now()
          const estimatedDuration = await GenerationMetricsService.getEstimatedDuration(
            userId,
            { type: 'workout', targetCycleDay }
          )

          // Helper to calculate remaining ETA based on progress
          const getRemainingEta = (progressPercent: number): number | null => {
            if (!estimatedDuration) return null
            const estimatedRemaining = estimatedDuration * ((100 - progressPercent) / 100)
            return Math.max(0, Math.round(estimatedRemaining / 1000)) // Convert to seconds
          }

          // Start metrics tracking
          if (generationRequestId) {
            await GenerationMetricsService.startGeneration(userId, generationRequestId, {
              type: 'workout',
              targetCycleDay
            })
          }

          // Milestone 1: Starting (0%)
          sendProgress('profile', 0, tProgress('starting'), getRemainingEta(0))

          try {
            // Milestone 2: Loading profile (10%)
            sendProgress('profile', 10, tProgress('loadingProfile'), getRemainingEta(10))

            // Determine if we're generating for current day or future day
            let result
            let profile
            if (targetCycleDay) {
              // Get user's current cycle day to determine which method to use
              profile = await UserProfileService.getByUserIdServer(userId)
              const currentCycleDay = profile?.current_cycle_day || 1

              // Milestone 3: Profile loaded (20%)
              sendProgress('profile', 20, tProgress('loadingProfile'), getRemainingEta(20))

              // Milestone 4: Planning workout split (30%)
              sendProgress('split', 30, tProgress('planningWorkout'), getRemainingEta(30))

              // Milestone 5: AI analyzing exercises (45%)
              sendProgress('ai', 45, tProgress('aiAnalyzing'), getRemainingEta(45))

              if (targetCycleDay === currentCycleDay) {
                // Current day: use generateWorkout with status='ready'
                // Milestone 6: AI selecting best exercises (55%)
                sendProgress('ai', 55, tProgress('aiSelecting'), getRemainingEta(55))

                result = await WorkoutGeneratorService.generateWorkout(userId, {
                  targetCycleDay,
                  status: 'ready'
                })
              } else if (targetCycleDay > currentCycleDay) {
                // Future day: use generateDraftWorkout
                // Milestone 6: AI selecting exercises for future day (55%)
                sendProgress('ai', 55, tProgress('aiSelecting'), getRemainingEta(55))

                result = await WorkoutGeneratorService.generateDraftWorkout(
                  userId,
                  targetCycleDay
                )
              } else {
                throw new Error(tErrors('cannotGeneratePastDay', { current: currentCycleDay, target: targetCycleDay }))
              }
            } else {
              // No targetCycleDay specified: generate for current day
              profile = await UserProfileService.getByUserIdServer(userId)

              // Milestone 3: Profile loaded (20%)
              sendProgress('profile', 20, tProgress('loadingProfile'), getRemainingEta(20))

              // Milestone 4: Planning workout (30%)
              sendProgress('split', 30, tProgress('planningWorkout'), getRemainingEta(30))

              // Milestone 5: AI analyzing (45%)
              sendProgress('ai', 45, tProgress('aiAnalyzing'), getRemainingEta(45))

              // Milestone 6: AI selecting (55%)
              sendProgress('ai', 55, tProgress('aiSelecting'), getRemainingEta(55))

              result = await WorkoutGeneratorService.generateWorkout(userId, {
                status: 'ready'
              })
            }

            // Milestone 7: Optimizing workout (75%)
            sendProgress('optimization', 75, tProgress('optimizing'), getRemainingEta(75))

            // Milestone 8: Analyzing performance history (85%)
            sendProgress('optimization', 85, tProgress('analyzingHistory'), getRemainingEta(85))

            // Milestone 9: Finalizing workout (95%)
            sendProgress('finalize', 95, tProgress('finalizing'), getRemainingEta(95))

            // Milestone 10: Complete (100%)
            sendProgress('complete', 100, tProgress('workoutReady'), 0)
            const completeData = JSON.stringify({
              phase: 'complete',
              workout: result.workout,
              insightInfluencedChanges: result.insightInfluencedChanges
            })
            controller.enqueue(encoder.encode(`data: ${completeData}\n\n`))

            // Cache the completed generation (for reconnection/polling)
            if (generationRequestId) {
              GenerationCache.complete(
                generationRequestId,
                result.workout,
                result.insightInfluencedChanges || []
              )

              // Track successful generation metrics for ETA improvement
              await GenerationMetricsService.completeGeneration(generationRequestId, true)
            }

            safeClose(controller)
          } catch (error) {
            // Track failed generation metrics
            if (generationRequestId) {
              await GenerationMetricsService.completeGeneration(generationRequestId, false)
            }
            throw error // Re-throw to be caught by outer catch
          }
        } catch (error) {
          // Detailed error logging for debugging
          console.error('🔴 [WORKOUT_GENERATION_ERROR] Stream error details:', {
            errorName: error?.constructor?.name,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            errorCause: error instanceof Error ? error.cause : undefined,
            timestamp: new Date().toISOString()
          })

          // Cache the error (for polling fallback)
          if (generationRequestId) {
            GenerationCache.error(
              generationRequestId,
              error instanceof Error ? error.message : 'Generation failed'
            )
          }

          // Provide user-friendly error messages based on error type
          let userErrorMessage = tErrors('failedToGenerate')

          if (error instanceof Error) {
            // Check for specific error types to provide better guidance
            if (error.message.includes('timeout')) {
              userErrorMessage = tErrors('timeout') ||
                'AI generation timed out. The service may be overloaded. Please try again in a moment.'
            } else if (error.message.includes('ExerciseSelector')) {
              userErrorMessage = tErrors('exerciseSelectionFailed') ||
                'Failed to select exercises for your workout. Please try again or contact support if the issue persists.'
            } else if (error.message.includes('SplitPlanner')) {
              userErrorMessage = tErrors('splitPlanningFailed') ||
                'Failed to plan your training split. Please try again or contact support if the issue persists.'
            } else if (error.message.includes('validation')) {
              userErrorMessage = tErrors('validationFailed') ||
                'Generated workout did not meet quality standards. Please try again - the AI will attempt to improve the result.'
            } else {
              // Include partial error info for debugging while remaining user-friendly
              userErrorMessage = error.message
            }
          }

          const errorData = JSON.stringify({
            phase: 'error',
            error: userErrorMessage
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    })
  } catch (error) {
    console.error('API error:', error)
    // For the outer catch, we don't have user context, so we fall back to default locale
    const tErrors = await getTranslations({ locale: 'en', namespace: 'api.workouts.generate.errors' })
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : tErrors('internalServerError')
      }),
      { status: 500 }
    )
  }
}
