import { NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { getUserLanguage } from '@/lib/utils/get-user-language'
import { GenerationQueueService } from '@/lib/services/generation-queue.service'
import { inngest } from '@/lib/inngest/client'
import type { SplitPlannerInput } from '@/lib/agents/split-planner.agent'

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
    if (error instanceof TypeError && error.message.includes('already closed')) {
      console.log('[SplitGenerate] Controller already closed during enqueue (client disconnected)')
      return false
    } else {
      throw error
    }
  }
}

/**
 * Safely close a ReadableStreamDefaultController
 * Handles the case where the controller is already closed
 */
function safeClose(controller: ReadableStreamDefaultController) {
  try {
    controller.close()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('already closed')) {
      console.log('[SplitGenerate] Controller already closed (expected)')
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
      const tErrors = await getTranslations({ locale, namespace: 'api.splits.generate.errors' })
      return new Response(
        JSON.stringify({ error: tErrors('unauthorized') }),
        { status: 401 }
      )
    }

    const userId = user.id
    const locale = await getUserLanguage(userId)
    const body = await request.json()
    const { input, generationRequestId } = body as {
      input: SplitPlannerInput
      generationRequestId: string
    }

    // Get translations for progress messages and errors
    const tProgress = await getTranslations({ locale, namespace: 'api.splits.generate.progress' })
    const tErrors = await getTranslations({ locale, namespace: 'api.splits.generate.errors' })

    // Create a stream for progress updates
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper to send progress update (updates both stream and database)
          const sendProgress = async (
            phase: string,
            progress: number,
            message: string
          ): Promise<boolean> => {
            const data = JSON.stringify({
              phase,
              progress,
              message
            })
            const enqueued = safeEnqueue(controller, encoder.encode(`data: ${data}\n\n`))
            if (!enqueued) {
              console.log('[SplitGenerate] Client disconnected, stopping progress updates')
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
                console.warn('[SplitGenerate] Failed to update queue progress:', error)
                // Don't throw - progress updates are non-critical
              }
            }

            return true
          }

          // Check database queue for previous generation (survives server restarts)
          let queueEntry = null
          if (generationRequestId) {
            queueEntry = await GenerationQueueService.getByRequestIdServer(generationRequestId)

            if (queueEntry?.status === 'completed' && queueEntry.split_plan_id) {
              // Previous generation completed - return the result
              console.log(`[SplitGenerate] Returning completed generation from database: ${generationRequestId}`)

              // Fetch the split plan
              const { data: splitPlan } = await supabase
                .from('split_plans')
                .select('*')
                .eq('id', queueEntry.split_plan_id)
                .single()

              if (splitPlan) {
                await sendProgress('complete', 100, tProgress('splitReady'))
                const enqueued = safeEnqueue(controller, encoder.encode(`data: ${JSON.stringify({
                  phase: 'complete',
                  splitPlan
                })}\n\n`))
                if (enqueued) {
                  safeClose(controller)
                }
                return
              }
            }

            // Create or update database queue entry
            // Use Inngest in production (has event key) OR in dev mode (INNGEST_DEV=1)
            const shouldUseInngest = !!process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV === '1'

            if (!queueEntry) {
              // ⚠️ SERVER-SIDE CONCURRENCY CHECK: Prevent duplicate generations
              // Check if user already has an active generation (pending or in_progress)
              const existingGeneration = await GenerationQueueService.getActiveGenerationServer(userId)

              if (existingGeneration) {
                console.log(`[SplitGenerate] User already has active generation:`, {
                  existingRequestId: existingGeneration.request_id,
                  status: existingGeneration.status
                })

                // Check if it's for the same split type
                const existingContext = existingGeneration.context as any
                if (existingContext?.splitType === input.splitType) {
                  console.log(`[SplitGenerate] Same split type - resuming existing generation`)
                  queueEntry = existingGeneration

                  // Send current progress and close (will poll for updates)
                  await sendProgress(
                    'profile',
                    existingGeneration.progress_percent,
                    existingGeneration.current_phase || tProgress('resuming')
                  )
                  safeClose(controller)
                  return
                }

                // If it's for a different split type, reject with 409 Conflict
                console.warn(`[SplitGenerate] Different split type - rejecting concurrent generation`)
                await sendProgress('error', 0, tErrors('generationAlreadyInProgress'))
                safeClose(controller)
                return
              }

              // No active generation - safe to create new queue entry
              queueEntry = await GenerationQueueService.createServer({
                userId,
                requestId: generationRequestId,
                context: { type: 'split', splitType: input.splitType }
              })
              console.log(`[SplitGenerate] Created queue entry: ${queueEntry.id}`)

              // Trigger Inngest for async background processing (avoids Vercel timeouts)
              if (shouldUseInngest) {
                console.log(`[SplitGenerate] Triggering Inngest worker for: ${generationRequestId}`)
                await inngest.send({
                  name: 'split/generate.requested',
                  data: {
                    requestId: generationRequestId,
                    userId,
                    input,
                    targetLanguage: locale
                  }
                })

                // Keep stream open and poll database for Inngest updates
                await sendProgress('profile', 5, tProgress('starting'))

                // Poll database every 2 seconds for updates from Inngest worker
                let lastProgress = 5
                const pollInterval = 2000  // 2 seconds
                const maxDuration = 5 * 60 * 1000  // 5 minutes max
                const startTime = Date.now()

                console.log(`[SplitGenerate] Starting SSE polling for Inngest updates: ${generationRequestId}`)

                while (lastProgress < 100 && (Date.now() - startTime) < maxDuration) {
                  await new Promise(resolve => setTimeout(resolve, pollInterval))

                  // Check database for updates
                  const queueEntry = await GenerationQueueService.getByRequestIdServer(generationRequestId)

                  if (!queueEntry) {
                    console.error(`[SplitGenerate] Queue entry disappeared: ${generationRequestId}`)
                    await sendProgress('error', 0, tErrors('failedToGenerate'))
                    break
                  }

                  if (queueEntry.status === 'completed' && queueEntry.split_plan_id) {
                    // Fetch the split plan and send completion
                    const { data: splitPlan } = await supabase
                      .from('split_plans')
                      .select('*')
                      .eq('id', queueEntry.split_plan_id)
                      .single()

                    if (splitPlan) {
                      console.log(`[SplitGenerate] Inngest generation completed: ${generationRequestId}`)
                      await sendProgress('complete', 100, tProgress('splitReady'))
                      safeEnqueue(controller, encoder.encode(`data: ${JSON.stringify({
                        phase: 'complete',
                        splitPlan
                      })}\n\n`))
                    }
                    break
                  } else if (queueEntry.status === 'failed') {
                    console.error(`[SplitGenerate] Inngest generation failed: ${queueEntry.error_message}`)
                    await sendProgress('error', 0, queueEntry.error_message || tErrors('failedToGenerate'))
                    break
                  } else if (queueEntry.status === 'in_progress' || queueEntry.status === 'pending') {
                    // Send progress update if it increased
                    if (queueEntry.progress_percent > lastProgress) {
                      console.log(`[SplitGenerate] Progress update: ${queueEntry.progress_percent}% - ${queueEntry.current_phase}`)
                      await sendProgress(
                        queueEntry.current_phase || 'profile',
                        queueEntry.progress_percent,
                        queueEntry.current_phase || tProgress('generating')
                      )
                      lastProgress = queueEntry.progress_percent
                    }
                  }
                }

                // Timeout check
                if ((Date.now() - startTime) >= maxDuration) {
                  console.error(`[SplitGenerate] SSE polling timeout after 5 minutes: ${generationRequestId}`)
                  await sendProgress('error', 0, tErrors('generationTimeout'))
                }

                safeClose(controller)
                return
              }
            } else if (queueEntry.status === 'pending' || queueEntry.status === 'in_progress') {
              // Resume existing generation - check if Inngest is already processing it
              const shouldUseInngest = !!process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV === '1'

              if (shouldUseInngest) {
                console.log(`[SplitGenerate] Resuming via SSE polling (Inngest is processing): ${generationRequestId}`)

                // Send current progress from database
                await sendProgress(
                  queueEntry.current_phase || 'profile',
                  queueEntry.progress_percent || 5,
                  queueEntry.current_phase || tProgress('starting')
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
                    console.error(`[SplitGenerate] Resumed queue entry disappeared: ${generationRequestId}`)
                    await sendProgress('error', 0, tErrors('failedToGenerate'))
                    break
                  }

                  if (updatedEntry.status === 'completed' && updatedEntry.split_plan_id) {
                    const { data: splitPlan } = await supabase
                      .from('split_plans')
                      .select('*')
                      .eq('id', updatedEntry.split_plan_id)
                      .single()

                    if (splitPlan) {
                      console.log(`[SplitGenerate] Resumed Inngest generation completed: ${generationRequestId}`)
                      await sendProgress('complete', 100, tProgress('splitReady'))
                      safeEnqueue(controller, encoder.encode(`data: ${JSON.stringify({
                        phase: 'complete',
                        splitPlan
                      })}\n\n`))
                    }
                    break
                  } else if (updatedEntry.status === 'failed') {
                    console.error(`[SplitGenerate] Resumed generation failed: ${updatedEntry.error_message}`)
                    await sendProgress('error', 0, updatedEntry.error_message || tErrors('failedToGenerate'))
                    break
                  } else if (updatedEntry.status === 'in_progress' || updatedEntry.status === 'pending') {
                    if (updatedEntry.progress_percent > lastProgress) {
                      console.log(`[SplitGenerate] Resumed progress update: ${updatedEntry.progress_percent}%`)
                      await sendProgress(
                        updatedEntry.current_phase || 'profile',
                        updatedEntry.progress_percent,
                        updatedEntry.current_phase || tProgress('generating')
                      )
                      lastProgress = updatedEntry.progress_percent
                    }
                  }
                }

                if ((Date.now() - startTime) >= maxDuration) {
                  console.error(`[SplitGenerate] Resumed SSE polling timeout: ${generationRequestId}`)
                  await sendProgress('error', 0, tErrors('generationTimeout'))
                }

                safeClose(controller)
                return
              }
            }
          }
        } catch (error) {
          // Detailed error logging for debugging
          console.error('🔴 [SPLIT_GENERATION_ERROR] Stream error details:', {
            errorName: error?.constructor?.name,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            errorCause: error instanceof Error ? error.cause : undefined,
            timestamp: new Date().toISOString()
          })

          // Save error to database
          if (generationRequestId) {
            const errorMessage = error instanceof Error ? error.message : 'Generation failed'

            // Mark as failed in database queue
            try {
              await GenerationQueueService.markAsFailed({
                requestId: generationRequestId,
                errorMessage
              })
              console.log(`[SplitGenerate] Marked generation as failed in database: ${generationRequestId}`)
            } catch (dbError) {
              console.error('[SplitGenerate] Failed to mark as failed in database:', dbError)
            }
          }

          // Provide user-friendly error messages based on error type
          let userErrorMessage = tErrors('failedToGenerate')

          if (error instanceof Error) {
            if (error.message.includes('timeout')) {
              userErrorMessage = tErrors('timeout') ||
                'AI generation timed out. The service may be overloaded. Please try again in a moment.'
            } else if (error.message.includes('SplitPlanner')) {
              userErrorMessage = tErrors('splitPlanningFailed') ||
                'Failed to plan your training split. Please try again or contact support if the issue persists.'
            } else if (error.message.includes('validation')) {
              userErrorMessage = tErrors('validationFailed') ||
                'Generated split did not meet quality standards. Please try again.'
            } else {
              userErrorMessage = error.message
            }
          }

          const errorData = JSON.stringify({
            phase: 'error',
            error: userErrorMessage
          })
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
    const tErrors = await getTranslations({ locale: 'en', namespace: 'api.splits.generate.errors' })
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : tErrors('internalServerError')
      }),
      { status: 500 }
    )
  }
}
