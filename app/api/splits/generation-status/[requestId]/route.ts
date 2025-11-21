import { NextRequest } from 'next/server'
import { GenerationQueueService } from '@/lib/services/generation-queue.service'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/splits/generation-status/[requestId]
 *
 * Poll for split generation status and progress
 * Used by client to check progress when using Inngest async generation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { requestId } = params
    const queueEntry = await GenerationQueueService.getByRequestIdServer(requestId)

    if (!queueEntry) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    }

    // Verify ownership
    if (queueEntry.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    return new Response(JSON.stringify({
      status: queueEntry.status,
      progress_percent: queueEntry.progress_percent,
      current_phase: queueEntry.current_phase,
      split_plan_id: queueEntry.split_plan_id,
      error_message: queueEntry.error_message,
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching split generation status:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
