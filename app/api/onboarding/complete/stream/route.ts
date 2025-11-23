import { NextRequest } from 'next/server'
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server'
import type { SplitType } from '@/lib/services/muscle-groups.service'
import { getTranslations } from 'next-intl/server'
import { getUserLanguage } from '@/lib/utils/get-user-language'
import { GenerationMetricsService } from '@/lib/services/generation-metrics.service'
import { EmailService } from '@/lib/services/email.service'
import { ActivityService } from '@/lib/services/activity.service'
import { inngest } from '@/lib/inngest/client'
import { GenerationQueueService } from '@/lib/services/generation-queue.service'

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
    const data: OnboardingData & { generationRequestId?: string } = await request.json()

    if (!data.userId || !data.approachId) {
      return new Response(
        JSON.stringify({ error: 'userId and approachId are required' }),
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()
    const supabaseAdmin = await getSupabaseAdminClient()
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        // Initialize generation tracking
        // Use provided ID or generate new one
        let generationRequestId = data.generationRequestId || crypto.randomUUID()
        let splitGenerationRequestId = crypto.randomUUID() // Separate ID for split generation tracking
        let isResuming = false

        try {
          // Get user language for i18n
          const locale = await getUserLanguage(data.userId)
          const tProgress = await getTranslations({
            locale,
            namespace: 'api.onboarding.complete.progress'
          })

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
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
            } catch (e) {
              // Controller might be closed if client disconnected
              console.log('[Onboarding] Controller closed, cannot send progress')
            }
          }

          // Check for existing active generation to resume
          if (!data.generationRequestId) {
            const activeGen = await GenerationQueueService.getActiveGenerationServer(data.userId)
            if (activeGen && (activeGen.context as any)?.type === 'onboarding') {
              console.log(`[Onboarding] Found active generation to resume: ${activeGen.request_id}`)
              generationRequestId = activeGen.request_id
              isResuming = true

              // Send immediate progress update
              sendProgress(
                'profile',
                activeGen.progress_percent,
                activeGen.current_phase || tProgress('resuming'),
                null
              )
            }
          } else {
            // Check if the provided ID exists and is active
            const existingGen = await GenerationQueueService.getByRequestIdServer(data.generationRequestId)
            if (existingGen) {
              console.log(`[Onboarding] Resuming provided generation ID: ${data.generationRequestId}`)
              isResuming = true

              if (existingGen.status === 'completed' && existingGen.split_plan_id) {
                // Already done!
                const completeData = JSON.stringify({
                  phase: 'complete',
                  splitPlanId: existingGen.split_plan_id
                })
                controller.enqueue(encoder.encode(`data: ${completeData}\n\n`))
                controller.close()
                return
              }

              // Send immediate progress update
              sendProgress(
                'profile',
                existingGen.progress_percent,
                existingGen.current_phase || tProgress('resuming'),
                null
              )
            }
          }

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

          if (!isResuming) {
            // Start new generation tracking
            await GenerationMetricsService.startGeneration(
              data.userId,
              generationRequestId,
              { type: 'onboarding' }
            )

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
          }

          // Phase 2: Generate split plan if data provided (40-100%)
          let splitPlanId = null
          if (data.splitType && data.weeklyFrequency) {
            if (!isResuming) {
              sendProgress('split', 40, tProgress('planningWorkout'), getRemainingEta(40))

              // Create queue entry for split generation
              // We use the main generationRequestId for the queue entry to allow resuming
              const queueEntry = await GenerationQueueService.createServer({
                userId: data.userId,
                requestId: generationRequestId, // Use the main ID so we can find it later
                context: { type: 'onboarding', splitType: data.splitType }
              })

              console.log(`[Onboarding] Created split generation queue entry: ${queueEntry.id}`)
            }

            // Check if Inngest is available
            const shouldUseInngest = !!process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV === '1'

            if (shouldUseInngest) {
              if (!isResuming) {
                // Build input for SplitPlanner
                const input = {
                  userId: data.userId,
                  approachId: data.approachId,
                  splitType: data.splitType,
                  weeklyFrequency: data.weeklyFrequency,
                  weakPoints: data.weakPoints || [],
                  equipmentAvailable: data.availableEquipment || [],
                  experienceYears: data.confirmedExperience || null,
                  userAge: data.age || null,
                  userGender: (data.gender as 'male' | 'female' | 'other' | null) || null
                }

                // Trigger Inngest for async background processing
                console.log(`[Onboarding] Triggering Inngest worker for split generation: ${generationRequestId}`)
                await inngest.send({
                  name: 'split/generate.requested',
                  data: {
                    requestId: generationRequestId,
                    userId: data.userId,
                    input,
                    targetLanguage: locale
                  }
                })
              }

              // Kickstart: Send initial progress and close stream to force client polling
              sendProgress('split', 50, tProgress('analyzingApproach'), getRemainingEta(50))
              console.log(`[Onboarding] Kickstart: Stream closed, client will poll for updates: ${generationRequestId}`)
              controller.close()
              return
            } else {
              // Fallback: Inngest not available, use synchronous generation
              console.warn(`[Onboarding] Inngest not available, using synchronous split generation`)

              if (!isResuming) {
                sendProgress('split', 40, tProgress('planningWorkout'), getRemainingEta(40))
              }

              const { generateSplitPlanAction } = await import('@/app/actions/split-actions')

              sendProgress('split', 50, tProgress('analyzingApproach'), getRemainingEta(50))

              const splitResult = await generateSplitPlanAction({
                userId: data.userId,
                approachId: data.approachId,
                splitType: data.splitType,
                weeklyFrequency: data.weeklyFrequency,
                weakPoints: data.weakPoints || [],
                equipmentAvailable: data.availableEquipment || [],
                experienceYears: data.confirmedExperience || null,
                userAge: data.age || null,
                userGender: (data.gender as 'male' | 'female' | 'other' | null) || null
              }, generationRequestId)

              if (splitResult?.success && splitResult.data) {
                const splitPlan = splitResult.data.splitPlan as any
                splitPlanId = splitPlan.id

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
            }
          } else {
            sendProgress('split', 85, tProgress('finalizingSetup'), getRemainingEta(85))
          }

          // Phase 3: Complete (95-100%)
          sendProgress('finalize', 95, tProgress('finalizingSetup'), getRemainingEta(95))
          sendProgress('complete', 100, tProgress('setupComplete'), 0)

          // Complete metrics tracking
          await GenerationMetricsService.completeGeneration(generationRequestId, true)

          // Create onboarding completion milestone (async, non-blocking)
          ActivityService.createMilestone(data.userId, 'onboarding_complete', {
            splitPlanId: splitPlanId,
          }).catch((milestoneError) => {
            console.error('Error creating onboarding milestone:', milestoneError)
          })

          // Send onboarding complete email (async, non-blocking)
          const { data: user } = await supabase.auth.getUser()
          if (user?.user?.email) {
            EmailService.sendOnboardingCompleteEmail(data.userId, user.user.email).catch((emailError) => {
              console.error('Error sending onboarding complete email:', emailError)
            })
          }

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
          try {
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          } catch (e) {
            // Ignore if closed
          }
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
