import { NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { getUserLanguage } from '@/lib/utils/get-user-language'
import { GenerationQueueService } from '@/lib/services/generation-queue.service'
import { inngest } from '@/lib/inngest/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function safeEnqueue(controller: ReadableStreamDefaultController, chunk: Uint8Array): boolean {
  try {
    controller.enqueue(chunk)
    return true
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('already closed')) {
      console.log('[SplitAdapt] Controller closed (client disconnected)')
      return false
    } else {
      throw error
    }
  }
}

function safeClose(controller: ReadableStreamDefaultController) {
  try {
    controller.close()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('already closed')) {
      console.log('[SplitAdapt] Controller already closed')
    } else {
      throw error
    }
  }
}

/**
 * POST /api/splits/adapt/stream
 *
 * Triggers async split adaptation after cycle completion
 * Uses Inngest for background processing with progress tracking
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const userId = user.id
    const locale = await getUserLanguage(userId)
    const generationRequestId = crypto.randomUUID()

    const tProgress = await getTranslations({ locale, namespace: 'api.splits.adapt.progress' })
    const tErrors = await getTranslations({ locale, namespace: 'api.splits.adapt.errors' })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const sendProgress = async (
            phase: string,
            progress: number,
            message: string
          ): Promise<boolean> => {
            const data = JSON.stringify({ phase, progress, message })
            const enqueued = safeEnqueue(controller, encoder.encode(`data: ${data}\n\n`))

            if (!enqueued) return false

            if (generationRequestId) {
              try {
                await GenerationQueueService.updateProgress({
                  requestId: generationRequestId,
                  progressPercent: progress,
                  currentPhase: message
                })
              } catch (error) {
                console.warn('[SplitAdapt] Failed to update queue progress:', error)
              }
            }

            return true
          }

          // Check for existing in-progress adaptation
          const existingGeneration = await GenerationQueueService.getActiveGenerationServer(userId)

          if (existingGeneration) {
            console.log(`[SplitAdapt] User already has active generation:`, existingGeneration.request_id)
            await sendProgress('error', 0, tErrors('generationAlreadyInProgress'))
            safeClose(controller)
            return
          }

          // Create queue entry
          const queueEntry = await GenerationQueueService.createServer({
            userId,
            requestId: generationRequestId,
            context: { type: 'split_adaptation' }
          })
          console.log(`[SplitAdapt] Created queue entry: ${queueEntry.id}`)

          // Trigger Inngest for async processing
          const shouldUseInngest = !!process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV === '1'

          if (shouldUseInngest) {
            console.log(`[SplitAdapt] Triggering Inngest: ${generationRequestId}`)
            await inngest.send({
              name: 'split/adapt.requested',
              data: {
                requestId: generationRequestId,
                userId
              }
            })

            // Start polling
            await sendProgress('profile', 5, tProgress('starting'))

            let lastProgress = 5
            const pollInterval = 2000
            const maxDuration = 5 * 60 * 1000
            const startTime = Date.now()

            console.log(`[SplitAdapt] Starting SSE polling: ${generationRequestId}`)

            while (lastProgress < 100 && (Date.now() - startTime) < maxDuration) {
              await new Promise(resolve => setTimeout(resolve, pollInterval))

              const queueEntry = await GenerationQueueService.getByRequestIdServer(generationRequestId)

              if (!queueEntry) {
                console.error(`[SplitAdapt] Queue entry disappeared`)
                await sendProgress('error', 0, tErrors('failedToAdapt'))
                break
              }

              if (queueEntry.status === 'completed' && queueEntry.split_plan_id) {
                const { data: splitPlan } = await supabase
                  .from('split_plans')
                  .select('*')
                  .eq('id', queueEntry.split_plan_id)
                  .single()

                if (splitPlan) {
                  console.log(`[SplitAdapt] Completed: ${generationRequestId}`)
                  await sendProgress('complete', 100, tProgress('splitReady'))
                  safeEnqueue(controller, encoder.encode(`data: ${JSON.stringify({
                    phase: 'complete',
                    splitPlan
                  })}\n\n`))
                }
                break
              } else if (queueEntry.status === 'failed') {
                console.error(`[SplitAdapt] Failed: ${queueEntry.error_message}`)
                await sendProgress('error', 0, queueEntry.error_message || tErrors('failedToAdapt'))
                break
              } else if (queueEntry.status === 'in_progress' || queueEntry.status === 'pending') {
                if (queueEntry.progress_percent > lastProgress) {
                  console.log(`[SplitAdapt] Progress: ${queueEntry.progress_percent}%`)
                  await sendProgress(
                    queueEntry.current_phase || 'profile',
                    queueEntry.progress_percent,
                    queueEntry.current_phase || tProgress('adapting')
                  )
                  lastProgress = queueEntry.progress_percent
                }
              }
            }

            if ((Date.now() - startTime) >= maxDuration) {
              console.error(`[SplitAdapt] Timeout after 5 minutes`)
              await sendProgress('error', 0, tErrors('adaptationTimeout'))
            }

            safeClose(controller)
            return
          }

          // Fallback: No Inngest configured
          await sendProgress('error', 0, 'Inngest not configured for async adaptation')
          safeClose(controller)
        } catch (error) {
          console.error('🔴 [SPLIT_ADAPTATION_ERROR]:', {
            errorName: error?.constructor?.name,
            errorMessage: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          })

          if (generationRequestId) {
            const errorMessage = error instanceof Error ? error.message : 'Adaptation failed'
            try {
              await GenerationQueueService.markAsFailed({
                requestId: generationRequestId,
                errorMessage
              })
            } catch (dbError) {
              console.error('[SplitAdapt] Failed to mark as failed:', dbError)
            }
          }

          let userErrorMessage = tErrors('failedToAdapt')
          if (error instanceof Error) {
            if (error.message.includes('timeout')) {
              userErrorMessage = tErrors('timeout') || 'Adaptation timed out'
            } else if (error.message.includes('No active split')) {
              userErrorMessage = tErrors('noActiveSplit') || 'No active split plan found'
            } else {
              userErrorMessage = error.message
            }
          }

          const errorData = JSON.stringify({
            phase: 'error',
            error: userErrorMessage
          })
          safeEnqueue(controller, encoder.encode(`data: ${errorData}\n\n`))
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
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
}
