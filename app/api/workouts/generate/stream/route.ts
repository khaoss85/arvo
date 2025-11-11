import { NextRequest } from 'next/server'
import { WorkoutGeneratorService } from '@/lib/services/workout-generator.service'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get userId from authenticated session (not from request body for security)
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const userId = user.id
    const { targetCycleDay } = await request.json()

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

          // Phase 1: Starting
          sendProgress('profile', 5, 'Starting workout generation')
          await new Promise(resolve => setTimeout(resolve, 100))

          // Phase 2: Loading profile
          sendProgress('profile', 15, 'Loading your profile')

          // Phase 3: Planning workout
          sendProgress('split', 25, 'Planning your workout')
          await new Promise(resolve => setTimeout(resolve, 200))

          // Phase 4: AI selecting exercises (longest phase)
          sendProgress('ai', 35, 'AI analyzing exercises')
          await new Promise(resolve => setTimeout(resolve, 500))
          sendProgress('ai', 50, 'AI selecting best exercises')
          await new Promise(resolve => setTimeout(resolve, 500))
          sendProgress('ai', 65, 'Optimizing exercise selection')

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
              throw new Error(`Cannot generate workout for past cycle day. Current: ${currentCycleDay}, Target: ${targetCycleDay}`)
            }
          } else {
            // No targetCycleDay specified: generate for current day
            result = await WorkoutGeneratorService.generateWorkout(userId, {
              status: 'ready'
            })
          }

          // Phase 5: Analyzing history
          sendProgress('history', 80, 'Analyzing your performance history')
          await new Promise(resolve => setTimeout(resolve, 300))

          // Phase 6: Finalizing
          sendProgress('finalize', 95, 'Finalizing your workout')
          await new Promise(resolve => setTimeout(resolve, 200))

          // Complete
          sendProgress('complete', 100, 'Workout ready!')
          const completeData = JSON.stringify({
            phase: 'complete',
            workout: result.workout,
            insightInfluencedChanges: result.insightInfluencedChanges
          })
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`))

          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          const errorData = JSON.stringify({
            phase: 'error',
            error: error instanceof Error ? error.message : 'Failed to generate workout'
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
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500 }
    )
  }
}
