import { NextRequest } from 'next/server'
import { WorkoutGeneratorService } from '@/lib/services/workout-generator.service'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { getUserLanguage } from '@/lib/utils/get-user-language'
import { GenerationCache } from '@/lib/services/generation-cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
          // Helper to send progress update
          const sendProgress = (phase: string, progress: number, message: string) => {
            const data = JSON.stringify({ phase, progress, message })
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
              controller.close()
              return
            }

            // Mark as started (for polling fallback)
            GenerationCache.start(generationRequestId)
          }

          // Multi-phase non-linear progress algorithm
          // Provides natural-feeling progression that matches user expectations
          const getProgressConfig = (current: number): { step: number; interval: number; phase: string; message: string } => {
            if (current < 20) {
              // Phase 1: FAST initial feedback (0-20%)
              return { step: 5, interval: 600, phase: 'profile', message: tProgress('loadingProfile') }
            } else if (current < 45) {
              // Phase 2: MEDIUM momentum building (20-45%)
              return { step: 4, interval: 2000, phase: 'split', message: tProgress('planningWorkout') }
            } else if (current < 70) {
              // Phase 3: SLOW AI selection (45-70%)
              return { step: 3, interval: 3500, phase: 'ai', message: tProgress('aiSelecting') }
            } else if (current < 90) {
              // Phase 4: ULTRA-SLOW optimization (70-90%)
              // Small increments to show system is still working during long AI generation
              // +1% every 5 seconds prevents "frozen" perception
              return { step: 1, interval: 5000, phase: 'optimization', message: tProgress('optimizing') }
            }
            // Cap at 90% until AI completes
            return { step: 0, interval: 0, phase: 'optimization', message: tProgress('optimizing') }
          }

          // Start from 0% with immediate feedback
          let currentProgress = 0
          sendProgress('profile', currentProgress, tProgress('starting'))

          // Dynamic progress interval that adapts speed based on current progress
          let progressInterval: NodeJS.Timeout | null = null
          const updateProgress = () => {
            const config = getProgressConfig(currentProgress)

            if (config.step > 0 && currentProgress < 90) {
              currentProgress = Math.min(currentProgress + config.step, 90)
              sendProgress(config.phase, currentProgress, config.message)

              // Schedule next update with appropriate interval
              if (progressInterval) clearTimeout(progressInterval)
              progressInterval = setTimeout(updateProgress, config.interval)
            }
          }

          // Start the adaptive progress updates
          updateProgress()

          try {
            // Determine if we're generating for current day or future day
            let result
            if (targetCycleDay) {
              // Get user's current cycle day to determine which method to use
              const profile = await UserProfileService.getByUserIdServer(userId)
              const currentCycleDay = profile?.current_cycle_day || 1

              if (targetCycleDay === currentCycleDay) {
                // Current day: use generateWorkout with status='ready'
                result = await WorkoutGeneratorService.generateWorkout(userId, {
                  targetCycleDay,
                  status: 'ready'
                })
              } else if (targetCycleDay > currentCycleDay) {
                // Future day: use generateDraftWorkout
                result = await WorkoutGeneratorService.generateDraftWorkout(
                  userId,
                  targetCycleDay
                )
              } else {
                throw new Error(tErrors('cannotGeneratePastDay', { current: currentCycleDay, target: targetCycleDay }))
              }
            } else {
              // No targetCycleDay specified: generate for current day
              result = await WorkoutGeneratorService.generateWorkout(userId, {
                status: 'ready'
              })
            }

            // Stop the progress updates once generation completes
            if (progressInterval) {
              clearTimeout(progressInterval)
              progressInterval = null
            }

            // Phase 5: Finalizing workout (real milestone - after AI generation)
            // Jump to 95% (must be > 90% cap to avoid going backwards)
            sendProgress('finalize', 95, tProgress('finalizing'))

            // Complete
            sendProgress('complete', 100, tProgress('workoutReady'))
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
            }

            controller.close()
          } catch (error) {
            // Always stop the progress updates on error
            if (progressInterval) {
              clearTimeout(progressInterval)
              progressInterval = null
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
