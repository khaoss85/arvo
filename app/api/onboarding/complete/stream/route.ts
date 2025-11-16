import { NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { SplitType } from '@/lib/services/muscle-groups.service'
import { getTranslations } from 'next-intl/server'
import { getUserLanguage } from '@/lib/utils/get-user-language'
import { GenerationMetricsService } from '@/lib/services/generation-metrics.service'
import { ProgressSimulator } from '@/lib/utils/progress-simulator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface OnboardingData {
  userId: string
  approachId: string
  weakPoints: string[]
  availableEquipment: string[]
  equipmentPreferences: Record<string, any>
  strengthBaseline: Record<string, any>
  firstName: string | null
  gender: string | null
  age: number | null
  weight: number | null
  height: number | null
  confirmedExperience: number | null
  splitType?: SplitType
  weeklyFrequency?: number
}

export async function POST(request: NextRequest) {
  try {
    const data: OnboardingData = await request.json()

    if (!data.userId || !data.approachId) {
      return new Response(
        JSON.stringify({ error: 'userId and approachId are required' }),
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        // Initialize generation tracking
        const generationRequestId = crypto.randomUUID()
        const splitGenerationRequestId = crypto.randomUUID() // Separate ID for split generation tracking

        try {
          // Get user language for i18n
          const locale = await getUserLanguage(data.userId)
          const tProgress = await getTranslations({
            locale,
            namespace: 'api.onboarding.complete.progress'
          })

          // Start metrics tracking
          await GenerationMetricsService.startGeneration(
            data.userId,
            generationRequestId,
            { type: 'onboarding' }
          )

          // Get estimated duration for ETA calculation
          const estimatedDuration = await GenerationMetricsService.getEstimatedDuration(
            data.userId,
            { type: 'onboarding' }
          )

          const getRemainingEta = (progressPercent: number): number | null => {
            if (!estimatedDuration) return null
            const remaining = estimatedDuration * ((100 - progressPercent) / 100)
            return Math.max(0, Math.round(remaining / 1000))
          }

          // Helper to send progress updates with ETA
          const sendProgress = (
            phase: string,
            progress: number,
            message: string,
            eta?: number | null,
            detail?: string
          ) => {
            const data: any = { phase, progress, message }
            if (eta !== undefined && eta !== null) data.eta = eta
            if (detail) data.detail = detail
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          }

          // Phase 1: Create user profile (0-30%)
          sendProgress('profile', 0, tProgress('starting'), getRemainingEta(0))
          sendProgress('profile', 10, tProgress('creatingProfile'), getRemainingEta(10))

          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: data.userId,
              approach_id: data.approachId,
              weak_points: data.weakPoints || [],
              available_equipment: data.availableEquipment || [],
              strength_baseline: data.strengthBaseline || {},
              first_name: data.firstName || null,
              gender: data.gender || null,
              age: data.age || null,
              weight: data.weight || null,
              height: data.height || null,
              experience_years: data.confirmedExperience || 0,
              preferred_split: data.splitType || null,
              active_split_plan_id: null,
              current_cycle_day: null
            }, {
              onConflict: 'user_id'
            })

          if (profileError) {
            throw new Error(`Failed to create profile: ${profileError.message}`)
          }

          sendProgress('profile', 30, tProgress('profileCreated'), getRemainingEta(30))

          // Phase 2: Generate split plan if data provided (40-90%)
          let splitPlanId = null
          if (data.splitType && data.weeklyFrequency) {
            sendProgress('split', 40, tProgress('planningWorkout'), getRemainingEta(40))
            sendProgress('split', 50, tProgress('analyzingApproach'), getRemainingEta(50))

            // Start progress simulation during AI call (50% → 90%)
            const simulator = new ProgressSimulator()
            const aiStartProgress = 50
            const aiEndProgress = 90
            // Estimate AI duration as 40% of total estimated duration (or 120s default)
            const estimatedAiDuration = estimatedDuration ? Math.floor(estimatedDuration * 0.4) : 120000

            simulator.start(aiStartProgress, aiEndProgress, estimatedAiDuration, async (progress) => {
              sendProgress('split', progress, tProgress('generatingSplit'), getRemainingEta(progress))
            })

            const { generateSplitPlanAction } = await import('@/app/actions/split-actions')
            let splitResult

            try {
              splitResult = await generateSplitPlanAction({
                userId: data.userId,
                approachId: data.approachId,
                splitType: data.splitType,
                weeklyFrequency: data.weeklyFrequency,
                weakPoints: data.weakPoints || [],
                equipmentAvailable: data.availableEquipment || [],
                experienceYears: data.confirmedExperience || null,
                userAge: data.age || null,
                userGender: (data.gender as 'male' | 'female' | 'other' | null) || null
              }, splitGenerationRequestId) // Pass requestId for resume capability
            } finally {
              simulator.stop()
            }

            if (splitResult?.success && splitResult.data) {
              splitPlanId = splitResult.data.splitPlan.id

              // Update profile with split plan
              await supabase
                .from('user_profiles')
                .update({
                  active_split_plan_id: splitPlanId,
                  current_cycle_day: 1
                })
                .eq('user_id', data.userId)
            }

            sendProgress('split', 90, tProgress('splitCreated'), getRemainingEta(90))
          } else {
            sendProgress('split', 85, tProgress('finalizingSetup'), getRemainingEta(85))
          }

          // Phase 3: Complete (95-100%)
          sendProgress('finalize', 95, tProgress('finalizingSetup'), getRemainingEta(95))
          sendProgress('complete', 100, tProgress('setupComplete'), 0)

          // Complete metrics tracking
          await GenerationMetricsService.completeGeneration(generationRequestId, true)

          // Send final complete event
          const completeData = JSON.stringify({
            phase: 'complete',
            splitPlanId: splitPlanId
          })
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`))

          controller.close()
        } catch (error) {
          console.error('Onboarding stream error:', error)

          // Mark generation as failed
          await GenerationMetricsService.completeGeneration(generationRequestId, false)

          const errorData = JSON.stringify({
            phase: 'error',
            error: error instanceof Error ? error.message : 'Failed to complete onboarding'
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
