import { NextRequest } from 'next/server'
import { GenerationCache } from '@/lib/services/generation-cache'
import { getSupabaseServerClient } from '@/lib/supabase/server'

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

    // Check generation cache
    const cached = GenerationCache.get(requestId)

    if (!cached) {
      console.log(`[GenerationStatus] Not found: ${requestId}`)
      return Response.json({
        status: 'not_found',
        message: 'Generation request not found or expired'
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

    // Still in progress - estimate progress
    const progress = GenerationCache.getEstimatedProgress(requestId)
    const elapsed = Date.now() - cached.timestamp
    const elapsedSeconds = Math.floor(elapsed / 1000)

    let message = 'Generating workout...'
    if (elapsedSeconds > 120) {
      message = 'Almost there...'
    } else if (elapsedSeconds > 60) {
      message = 'Still generating...'
    }

    console.log(`[GenerationStatus] In progress: ${requestId}`, {
      elapsed: `${elapsedSeconds}s`,
      progress: `${progress}%`
    })

    return Response.json({
      status: 'in_progress',
      progress,
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
