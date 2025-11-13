import { NextRequest } from 'next/server'
import { WorkoutGeneratorService } from '@/lib/services/workout-generator.service'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { getUserLanguage } from '@/lib/utils/get-user-language'

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
    const { targetCycleDay } = await request.json()

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

          // Phase 1: Starting
          sendProgress('profile', 5, tProgress('starting'))
          await new Promise(resolve => setTimeout(resolve, 100))

          // Phase 2: Loading profile
          sendProgress('profile', 15, tProgress('loadingProfile'))

          // Phase 3: Planning workout
          sendProgress('split', 25, tProgress('planningWorkout'))
          await new Promise(resolve => setTimeout(resolve, 200))

          // Phase 4: AI selecting exercises (longest phase)
          sendProgress('ai', 35, tProgress('aiAnalyzing'))
          await new Promise(resolve => setTimeout(resolve, 500))
          sendProgress('ai', 50, tProgress('aiSelecting'))
          await new Promise(resolve => setTimeout(resolve, 500))
          sendProgress('ai', 65, tProgress('optimizingSelection'))

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

          // Phase 5: Analyzing history
          sendProgress('history', 80, tProgress('analyzingHistory'))
          await new Promise(resolve => setTimeout(resolve, 300))

          // Phase 6: Finalizing
          sendProgress('finalize', 95, tProgress('finalizing'))
          await new Promise(resolve => setTimeout(resolve, 200))

          // Complete
          sendProgress('complete', 100, tProgress('workoutReady'))
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
            error: error instanceof Error ? error.message : tErrors('failedToGenerate')
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
