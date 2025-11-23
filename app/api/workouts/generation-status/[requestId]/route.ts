import { NextRequest } from 'next/server'
import { GenerationCache } from '@/lib/services/generation-cache'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { getUserLanguage } from '@/lib/utils/get-user-language'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Polling endpoint for workout generation status
 * Used as fallback when SSE connection drops (mobile background, network issues)
 *
 * Returns:
 * - in_progress: Generation still running
 * - complete: Generation finished, workout available
 * - error: Generation failed
 * - not_found: Request ID not found or expired (>10 minutes)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = params

    if (!requestId || !/^[0-9a-f-]{36}$/i.test(requestId)) {
      return Response.json(
        { status: 'error', error: 'Invalid request ID format' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json(
        { status: 'error', error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check generation cache (in-memory, fast)
    const cached = GenerationCache.get(requestId)

    if (!cached) {
      // Cache miss - fallback to database queue (survives restarts/timeouts)
      console.log(`[GenerationStatus] Cache miss, checking database: ${requestId}`)

      const { GenerationQueueService } = await import('@/lib/services/generation-queue.service')
      const queueEntry = await GenerationQueueService.getByRequestIdServer(requestId)

      if (!queueEntry) {
        console.log(`[GenerationStatus] Not found in cache or database: ${requestId}`)
        return Response.json({
          status: 'not_found',
          message: 'Generation request not found or expired'
        })
      }

      // Found in database - return status
      if (queueEntry.status === 'completed') {
        // Handle split generation completion (onboarding)
        if (queueEntry.split_plan_id) {
          console.log(`[GenerationStatus] Split generation completed (from database): ${requestId}`, {
            splitPlanId: queueEntry.split_plan_id,
            type: queueEntry.context?.type
          })

          return Response.json({
            status: 'complete',
            splitPlanId: queueEntry.split_plan_id
          })
        }

        // Handle workout generation completion
        if (queueEntry.workout_id) {
          // Fetch the completed workout
          const { WorkoutService } = await import('@/lib/services/workout.service')
          const workout = await WorkoutService.getByIdServer(queueEntry.workout_id)

          if (!workout) {
            console.error(`[GenerationStatus] Workout not found for completed generation: ${queueEntry.workout_id}`)
            return Response.json({
              status: 'error',
              error: 'Workout not found'
            })
          }

          console.log(`[GenerationStatus] Workout generation completed (from database): ${requestId}`, {
            workoutId: workout.id
          })

          return Response.json({
            status: 'complete',
            workout,
            insightInfluencedChanges: [] // Not stored in queue entry
          })
        }

        // Completed but missing both IDs - should not happen
        console.error(`[GenerationStatus] Completed generation missing both workout_id and split_plan_id: ${requestId}`)
        return Response.json({
          status: 'error',
          error: 'Generation completed but result not found'
        })
      }

      if (queueEntry.status === 'failed') {
        console.log(`[GenerationStatus] Failed (from database): ${requestId}`, {
          error: queueEntry.error_message
        })
        return Response.json({
          status: 'error',
          error: queueEntry.error_message || 'Generation failed'
        })
      }

      // Still in progress - return database state
      console.log(`[GenerationStatus] In progress (from database): ${requestId}`, {
        progress: queueEntry.progress_percent,
        phase: queueEntry.current_phase
      })

      const locale = await getUserLanguage(user.id)
      const t = await getTranslations({ locale, namespace: 'api.workouts.generate.polling' })

      return Response.json({
        status: 'in_progress',
        progress: queueEntry.progress_percent,
        phase: queueEntry.current_phase,
        message: queueEntry.current_phase || t('generating')
      })
    }

    // Return status based on cache entry
    if (cached.status === 'complete') {
      console.log(`[GenerationStatus] Complete: ${requestId}`)
      return Response.json({
        status: 'complete',
        workout: cached.workout,
        insightInfluencedChanges: cached.insightInfluencedChanges
      })
    }

    if (cached.status === 'error') {
      console.log(`[GenerationStatus] Error: ${requestId}`, { error: cached.error })
      return Response.json({
        status: 'error',
        error: cached.error || 'Generation failed'
      })
    }

    // Still in progress - estimate progress (with phase-awareness)
    const { progress, phase } = GenerationCache.getEstimatedProgress(requestId)
    const elapsed = Date.now() - cached.timestamp
    const elapsedSeconds = Math.floor(elapsed / 1000)

    // Get translations for polling messages
    const locale = await getUserLanguage(user.id)
    const t = await getTranslations({ locale, namespace: 'api.workouts.generate.polling' })

    let message = t('generating')
    if (elapsedSeconds > 120) {
      message = t('almostThere')
    } else if (elapsedSeconds > 60) {
      message = t('stillGenerating')
    }

    console.log(`[GenerationStatus] In progress: ${requestId}`, {
      elapsed: `${elapsedSeconds}s`,
      progress: `${progress}%`,
      phase
    })

    return Response.json({
      status: 'in_progress',
      progress: progress,
      phase: phase, // Include phase to keep synchronized with percentage
      message,
      elapsedSeconds
    })

  } catch (error) {
    console.error('[GenerationStatus] Error:', error)
    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
