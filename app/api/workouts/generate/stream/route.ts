import { NextRequest } from 'next/server'
import { WorkoutGeneratorService } from '@/lib/services/workout-generator.service'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { getUserLanguage } from '@/lib/utils/get-user-language'
import { GenerationCache } from '@/lib/services/generation-cache'
import { GenerationMetricsService } from '@/lib/services/generation-metrics.service'
import { GenerationQueueService } from '@/lib/services/generation-queue.service'
import { ProgressSimulator } from '@/lib/utils/progress-simulator'
import { inngest } from '@/lib/inngest/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Safely enqueue data to a ReadableStreamDefaultController
 * Handles the case where the controller is already closed (client disconnected)
 */
function safeEnqueue(controller: ReadableStreamDefaultController, chunk: Uint8Array): boolean {
  try {
    controller.enqueue(chunk)
    return true
  } catch (error) {
    // Controller already closed - client disconnected
    if (error instanceof TypeError && error.message.includes('already closed')) {
      console.log('[WorkoutGenerate] Controller already closed during enqueue (client disconnected)')
      return false
    } else {
      throw error
    }
  }
}

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
    const { targetCycleDay } = body
    let generationRequestId = body.generationRequestId

    // Get translations for progress messages and errors
    const tProgress = await getTranslations({ locale, namespace: 'api.workouts.generate.progress' })
    const tErrors = await getTranslations({ locale, namespace: 'api.workouts.generate.errors' })

    // Create a stream for progress updates
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper to send progress update with ETA (updates both stream and database)
          const sendProgress = async (
            phase: string,
            progress: number,
            message: string,
            eta?: number | null,
            detail?: string
          ): Promise<boolean> => {
            const data = JSON.stringify({
              phase,
              progress,
              message,
              ...(eta !== undefined && eta !== null && { eta }),
              ...(detail && { detail })
            })
            const enqueued = safeEnqueue(controller, encoder.encode(`data: ${data}\n\n`))
            if (!enqueued) {
              console.log('[WorkoutGenerate] Client disconnected, stopping progress updates')
              return false
            }

            // Also update database queue (non-blocking, errors logged but not thrown)
            if (generationRequestId) {
              try {
                await GenerationQueueService.updateProgress({
                  requestId: generationRequestId,
                  progressPercent: progress,
                  currentPhase: message
                })
              } catch (error) {
                console.warn('[WorkoutGenerate] Failed to update queue progress:', error)
                // Don't throw - progress updates are non-critical
              }
            }

            return true
          }

          // Check database queue for previous generation (survives server restarts)
          let queueEntry = null
          if (generationRequestId) {
            queueEntry = await GenerationQueueService.getByRequestIdServer(generationRequestId)

            if (queueEntry?.status === 'completed' && queueEntry.workout_id) {
              // Previous generation completed - return the result
              console.log(`[WorkoutGenerate] Returning completed generation from database: ${generationRequestId}`)

              // Fetch the workout
              const { WorkoutService } = await import('@/lib/services/workout.service')
              const workout = await WorkoutService.getByIdServer(queueEntry.workout_id)

              if (workout) {
                await sendProgress('complete', 100, tProgress('workoutReady'))
                const enqueued = safeEnqueue(controller, encoder.encode(`data: ${JSON.stringify({
                  phase: 'complete',
                  workout,
                  insightInfluencedChanges: [] // Not stored in queue entry
                })}\n\n`))
                if (enqueued) {
                  safeClose(controller)
                }
                return
              }
            }

            // Check in-memory cache as well (faster for immediate reconnections)
            const cached = GenerationCache.get(generationRequestId)
            if (cached?.status === 'complete') {
              console.log(`[WorkoutGenerate] Returning cached result: ${generationRequestId}`)
              await sendProgress('complete', 100, tProgress('workoutReady'))
              const enqueued = safeEnqueue(controller, encoder.encode(`data: ${JSON.stringify({
                phase: 'complete',
                workout: cached.workout,
                insightInfluencedChanges: cached.insightInfluencedChanges
              })}\n\n`))
              if (enqueued) {
                safeClose(controller)
              }
              return
            }

            // Create or update database queue entry
            // Use Inngest in production (has event key) OR in dev mode (INNGEST_DEV=1)
            const shouldUseInngest = !!process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV === '1'

            if (!queueEntry) {
              // ⚠️ SERVER-SIDE CONCURRENCY CHECK: Prevent duplicate generations
              // Check if user already has an active generation (pending or in_progress)
              const existingGeneration = await GenerationQueueService.getActiveGenerationServer(userId)

              if (existingGeneration) {
                console.log(`[WorkoutGenerate] User already has active generation:`, {
                  existingRequestId: existingGeneration.request_id,
                  existingDay: existingGeneration.target_cycle_day,
                  requestedDay: targetCycleDay,
                  status: existingGeneration.status
                })

                // If it's for the same day, resume it instead of creating a new one
                if (existingGeneration.target_cycle_day === targetCycleDay) {
                  console.log(`[WorkoutGenerate] Same day - resuming existing generation`)
                  queueEntry = existingGeneration
                  generationRequestId = existingGeneration.request_id

                  // Send current progress and close (will poll for updates)
                  await sendProgress(
                    'profile',
                    existingGeneration.progress_percent,
                    existingGeneration.current_phase || tProgress('resuming')
                  )
                  safeClose(controller)
                  return
                }

                // If it's for a different day, reject with 409 Conflict
                console.warn(`[WorkoutGenerate] Different day - rejecting concurrent generation`)
                await sendProgress('error', 0, tErrors('generationAlreadyInProgress'))
                safeClose(controller)
                return
              }

              // No active generation - safe to create new queue entry
              queueEntry = await GenerationQueueService.createServer({
                userId,
                requestId: generationRequestId,
                targetCycleDay: targetCycleDay ?? null,
                context: { type: 'workout', targetCycleDay }
              })
              console.log(`[WorkoutGenerate] Created queue entry: ${queueEntry.id}`)

              // Trigger Inngest for async background processing (avoids Vercel timeouts)
              if (shouldUseInngest) {
                console.log(`[WorkoutGenerate] Triggering Inngest worker for: ${generationRequestId}`)
                await inngest.send({
                  name: 'workout/generate.requested',
                  data: {
                    requestId: generationRequestId,
                    userId,
                    targetCycleDay: targetCycleDay ?? undefined
                  }
                })

                // Keep stream open and poll database for Inngest updates
                await sendProgress('profile', 5, tProgress('starting'), null)

                // Poll database every 2 seconds for updates from Inngest worker
                let lastProgress = 5
                const pollInterval = 2000  // 2 seconds
                const maxDuration = 5 * 60 * 1000  // 5 minutes max
                const startTime = Date.now()

                console.log(`[WorkoutGenerate] Starting SSE polling for Inngest updates: ${generationRequestId}`)

                while (lastProgress < 100 && (Date.now() - startTime) < maxDuration) {
                  await new Promise(resolve => setTimeout(resolve, pollInterval))

                  // Check database for updates
                  const queueEntry = await GenerationQueueService.getByRequestIdServer(generationRequestId)

                  if (!queueEntry) {
                    console.error(`[WorkoutGenerate] Queue entry disappeared: ${generationRequestId}`)
                    await sendProgress('error', 0, tErrors('failedToGenerate'))
                    break
                  }

                  if (queueEntry.status === 'completed' && queueEntry.workout_id) {
                    // Fetch the workout and send completion
                    const { WorkoutService } = await import('@/lib/services/workout.service')
                    const workout = await WorkoutService.getByIdServer(queueEntry.workout_id)

                    if (workout) {
                      console.log(`[WorkoutGenerate] Inngest generation completed: ${generationRequestId}`)
                      await sendProgress('complete', 100, tProgress('workoutReady'))
                      safeEnqueue(controller, encoder.encode(`data: ${JSON.stringify({
                        phase: 'complete',
                        workout,
                        insightInfluencedChanges: []
                      })}\n\n`))
                    }
                    break
                  } else if (queueEntry.status === 'failed') {
                    console.error(`[WorkoutGenerate] Inngest generation failed: ${queueEntry.error_message}`)
                    await sendProgress('error', 0, queueEntry.error_message || tErrors('failedToGenerate'))
                    break
                  } else if (queueEntry.status === 'in_progress' || queueEntry.status === 'pending') {
                    // Send progress update if it increased
                    if (queueEntry.progress_percent > lastProgress) {
                      console.log(`[WorkoutGenerate] Progress update: ${queueEntry.progress_percent}% - ${queueEntry.current_phase}`)
                      await sendProgress(
                        queueEntry.current_phase || 'profile',
                        queueEntry.progress_percent,
                        queueEntry.current_phase || tProgress('generating'),
                        null
                      )
                      lastProgress = queueEntry.progress_percent
                    }
                  }
                }

                // Timeout check
                if ((Date.now() - startTime) >= maxDuration) {
                  console.error(`[WorkoutGenerate] SSE polling timeout after 5 minutes: ${generationRequestId}`)
                  await sendProgress('error', 0, tErrors('generationTimeout'))
                }

                safeClose(controller)
                return
              }
            } else if (queueEntry.status === 'pending' || queueEntry.status === 'in_progress') {
              // Resume existing generation - check if Inngest is already processing it
              if (shouldUseInngest) {
                console.log(`[WorkoutGenerate] Resuming via SSE polling (Inngest is processing): ${generationRequestId}`)

                // Send current progress from database
                await sendProgress(
                  queueEntry.current_phase || 'profile',
                  queueEntry.progress_percent || 5,
                  queueEntry.current_phase || tProgress('starting'),
                  null
                )

                // Start polling loop (same as new generation)
                let lastProgress = queueEntry.progress_percent || 5
                const pollInterval = 2000
                const maxDuration = 5 * 60 * 1000
                const startTime = Date.now()

                while (lastProgress < 100 && (Date.now() - startTime) < maxDuration) {
                  await new Promise(resolve => setTimeout(resolve, pollInterval))

                  const updatedEntry = await GenerationQueueService.getByRequestIdServer(generationRequestId)

                  if (!updatedEntry) {
                    console.error(`[WorkoutGenerate] Resumed queue entry disappeared: ${generationRequestId}`)
                    await sendProgress('error', 0, tErrors('failedToGenerate'))
                    break
                  }

                  if (updatedEntry.status === 'completed' && updatedEntry.workout_id) {
                    const { WorkoutService } = await import('@/lib/services/workout.service')
                    const workout = await WorkoutService.getByIdServer(updatedEntry.workout_id)

                    if (workout) {
                      console.log(`[WorkoutGenerate] Resumed Inngest generation completed: ${generationRequestId}`)
                      await sendProgress('complete', 100, tProgress('workoutReady'))
                      safeEnqueue(controller, encoder.encode(`data: ${JSON.stringify({
                        phase: 'complete',
                        workout,
                        insightInfluencedChanges: []
                      })}\n\n`))
                    }
                    break
                  } else if (updatedEntry.status === 'failed') {
                    console.error(`[WorkoutGenerate] Resumed generation failed: ${updatedEntry.error_message}`)
                    await sendProgress('error', 0, updatedEntry.error_message || tErrors('failedToGenerate'))
                    break
                  } else if (updatedEntry.status === 'in_progress' || updatedEntry.status === 'pending') {
                    if (updatedEntry.progress_percent > lastProgress) {
                      console.log(`[WorkoutGenerate] Resumed progress update: ${updatedEntry.progress_percent}%`)
                      await sendProgress(
                        updatedEntry.current_phase || 'profile',
                        updatedEntry.progress_percent,
                        updatedEntry.current_phase || tProgress('generating'),
                        null
                      )
                      lastProgress = updatedEntry.progress_percent
                    }
                  }
                }

                if ((Date.now() - startTime) >= maxDuration) {
                  console.error(`[WorkoutGenerate] Resumed SSE polling timeout: ${generationRequestId}`)
                  await sendProgress('error', 0, tErrors('generationTimeout'))
                }

                safeClose(controller)
                return
              }

              // Fallback: mark as started for synchronous processing
              await GenerationQueueService.markAsStarted(generationRequestId)
              console.log(`[WorkoutGenerate] Resuming generation: ${generationRequestId}`)
            }

            // Mark as started in cache (for polling fallback)
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
          await sendProgress('profile', 0, tProgress('starting'), getRemainingEta(0))

          try {
            // Milestone 2: Loading profile (10%)
            await sendProgress('profile', 10, tProgress('loadingProfile'), getRemainingEta(10))

            // Determine if we're generating for current day or future day
            let result
            let profile
            if (targetCycleDay) {
              // Get user's current cycle day to determine which method to use
              profile = await UserProfileService.getByUserIdServer(userId)
              const currentCycleDay = profile?.current_cycle_day || 1

              // Milestone 3: Profile loaded (20%)
              await sendProgress('profile', 20, tProgress('loadingProfile'), getRemainingEta(20))

              // Milestone 4: Planning workout split (30%)
              await sendProgress('split', 30, tProgress('planningWorkout'), getRemainingEta(30))

              // Milestone 5: AI analyzing exercises (45%)
              await sendProgress('ai', 45, tProgress('aiAnalyzing'), getRemainingEta(45))

              if (targetCycleDay === currentCycleDay) {
                // Current day: use generateWorkout with status='ready'
                // Start progress simulation during AI call (45% → 75%)
                const simulator = new ProgressSimulator()
                const aiStartProgress = 45
                const aiEndProgress = 75
                // Estimate AI duration as 30% of total estimated duration (or 120s default)
                const estimatedAiDuration = estimatedDuration ? Math.floor(estimatedDuration * 0.3) : 120000

                simulator.start(aiStartProgress, aiEndProgress, estimatedAiDuration, async (progress) => {
                  await sendProgress('ai', progress, tProgress('aiSelecting'), getRemainingEta(progress))
                })

                try {
                  result = await WorkoutGeneratorService.generateWorkout(userId, {
                    targetCycleDay,
                    status: 'ready'
                  })
                } finally {
                  simulator.stop()
                }
              } else if (targetCycleDay > currentCycleDay) {
                // Future day: use generateDraftWorkout
                // Start progress simulation during AI call (45% → 75%)
                const simulator = new ProgressSimulator()
                const aiStartProgress = 45
                const aiEndProgress = 75
                const estimatedAiDuration = estimatedDuration ? Math.floor(estimatedDuration * 0.3) : 120000

                simulator.start(aiStartProgress, aiEndProgress, estimatedAiDuration, async (progress) => {
                  await sendProgress('ai', progress, tProgress('aiSelecting'), getRemainingEta(progress))
                })

                try {
                  result = await WorkoutGeneratorService.generateDraftWorkout(
                    userId,
                    targetCycleDay
                  )
                } finally {
                  simulator.stop()
                }
              } else {
                throw new Error(tErrors('cannotGeneratePastDay', { current: currentCycleDay, target: targetCycleDay }))
              }
            } else {
              // No targetCycleDay specified: generate for current day
              profile = await UserProfileService.getByUserIdServer(userId)

              // Milestone 3: Profile loaded (20%)
              await sendProgress('profile', 20, tProgress('loadingProfile'), getRemainingEta(20))

              // Milestone 4: Planning workout (30%)
              await sendProgress('split', 30, tProgress('planningWorkout'), getRemainingEta(30))

              // Milestone 5: AI analyzing (45%)
              await sendProgress('ai', 45, tProgress('aiAnalyzing'), getRemainingEta(45))

              // Start progress simulation during AI call (45% → 75%)
              const simulator = new ProgressSimulator()
              const aiStartProgress = 45
              const aiEndProgress = 75
              const estimatedAiDuration = estimatedDuration ? Math.floor(estimatedDuration * 0.3) : 120000

              simulator.start(aiStartProgress, aiEndProgress, estimatedAiDuration, async (progress) => {
                await sendProgress('ai', progress, tProgress('aiSelecting'), getRemainingEta(progress))
              })

              try {
                result = await WorkoutGeneratorService.generateWorkout(userId, {
                  status: 'ready'
                })
              } finally {
                simulator.stop()
              }
            }

            // Milestone 7: Optimizing workout (75%)
            await sendProgress('optimization', 75, tProgress('optimizing'), getRemainingEta(75))

            // Milestone 8: Analyzing performance history (85%)
            await sendProgress('optimization', 85, tProgress('analyzingHistory'), getRemainingEta(85))

            // Milestone 9: Finalizing workout (95%)
            await sendProgress('finalize', 95, tProgress('finalizing'), getRemainingEta(95))

            // Milestone 10: Complete (100%)
            await sendProgress('complete', 100, tProgress('workoutReady'), 0)
            const completeData = JSON.stringify({
              phase: 'complete',
              workout: result.workout,
              insightInfluencedChanges: result.insightInfluencedChanges
            })
            safeEnqueue(controller, encoder.encode(`data: ${completeData}\n\n`))

            // Save completion to cache and database
            if (generationRequestId) {
              // Cache the completed generation (for reconnection/polling)
              GenerationCache.complete(
                generationRequestId,
                result.workout,
                result.insightInfluencedChanges || []
              )

              // Mark as completed in database queue (survives server restarts)
              try {
                await GenerationQueueService.markAsCompleted({
                  requestId: generationRequestId,
                  workoutId: result.workout.id
                })
                console.log(`[WorkoutGenerate] Marked generation as completed in database: ${generationRequestId}`)
              } catch (error) {
                console.error('[WorkoutGenerate] Failed to mark as completed in database:', error)
                // Don't throw - workout was generated successfully
              }

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

          // Save error to cache and database
          if (generationRequestId) {
            const errorMessage = error instanceof Error ? error.message : 'Generation failed'

            // Cache the error (for polling fallback)
            GenerationCache.error(generationRequestId, errorMessage)

            // Mark as failed in database queue (survives server restarts)
            try {
              await GenerationQueueService.markAsFailed({
                requestId: generationRequestId,
                errorMessage
              })
              console.log(`[WorkoutGenerate] Marked generation as failed in database: ${generationRequestId}`)
            } catch (dbError) {
              console.error('[WorkoutGenerate] Failed to mark as failed in database:', dbError)
              // Don't throw - error already occurred
            }
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
          // Use safeEnqueue since controller might already be closed (client disconnected)
          const enqueued = safeEnqueue(controller, encoder.encode(`data: ${errorData}\n\n`))
          if (enqueued) {
            controller.close()
          }
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
