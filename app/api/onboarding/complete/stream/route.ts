import { NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
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

          // Phase 2: Generate split plan if data provided (40-100%)
          let splitPlanId = null
          if (data.splitType && data.weeklyFrequency) {
            sendProgress('split', 40, tProgress('planningWorkout'), getRemainingEta(40))

            // Create queue entry for split generation
            const queueEntry = await GenerationQueueService.createServer({
              userId: data.userId,
              requestId: splitGenerationRequestId,
              context: { type: 'split', splitType: data.splitType }
            })

            console.log(`[Onboarding] Created split generation queue entry: ${queueEntry.id}`)

            // Check if Inngest is available
            const shouldUseInngest = !!process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV === '1'

            if (shouldUseInngest) {
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
              console.log(`[Onboarding] Triggering Inngest worker for split generation: ${splitGenerationRequestId}`)
              await inngest.send({
                name: 'split/generate.requested',
                data: {
                  requestId: splitGenerationRequestId,
                  userId: data.userId,
                  input,
                  targetLanguage: locale
                }
              })

              // Poll database for updates from Inngest worker
              sendProgress('split', 50, tProgress('analyzingApproach'), getRemainingEta(50))

              let lastProgress = 50
              const pollInterval = 2000  // 2 seconds
              const maxDuration = 4 * 60 * 1000  // 4 minutes max (shorter than split generation since it's part of onboarding)
              const pollStartTime = Date.now()

              console.log(`[Onboarding] Starting SSE polling for Inngest split generation: ${splitGenerationRequestId}`)

              while (lastProgress < 100 && (Date.now() - pollStartTime) < maxDuration) {
                await new Promise(resolve => setTimeout(resolve, pollInterval))

                // Check database for updates
                const updatedEntry = await GenerationQueueService.getByRequestIdServer(splitGenerationRequestId)

                if (!updatedEntry) {
                  console.error(`[Onboarding] Queue entry disappeared: ${splitGenerationRequestId}`)
                  throw new Error('Split generation queue entry disappeared')
                }

                if (updatedEntry.status === 'completed' && updatedEntry.split_plan_id) {
                  // Split generation completed!
                  splitPlanId = updatedEntry.split_plan_id
                  console.log(`[Onboarding] Split generation completed: ${splitPlanId}`)

                  // Update profile with split plan
                  await supabase
                    .from('user_profiles')
                    .update({
                      active_split_plan_id: splitPlanId,
                      current_cycle_day: 1
                    })
                    .eq('user_id', data.userId)

                  sendProgress('split', 90, tProgress('splitCreated'), getRemainingEta(90))
                  break
                } else if (updatedEntry.status === 'failed') {
                  console.error(`[Onboarding] Split generation failed: ${updatedEntry.error_message}`)
                  throw new Error(updatedEntry.error_message || 'Split generation failed')
                } else if (updatedEntry.status === 'in_progress' || updatedEntry.status === 'pending') {
                  // Send progress update if it increased
                  if (updatedEntry.progress_percent > lastProgress) {
                    // Map progress from 50-90% range for onboarding flow
                    const mappedProgress = 50 + (updatedEntry.progress_percent * 0.4)
                    console.log(`[Onboarding] Split progress: ${updatedEntry.progress_percent}% → ${Math.round(mappedProgress)}%`)

                    sendProgress(
                      'split',
                      Math.round(mappedProgress),
                      updatedEntry.current_phase || tProgress('generatingSplit'),
                      getRemainingEta(Math.round(mappedProgress))
                    )
                    lastProgress = mappedProgress
                  }
                }
              }

              // Timeout check
              if ((Date.now() - pollStartTime) >= maxDuration && !splitPlanId) {
                console.error(`[Onboarding] Split generation timeout after 4 minutes: ${splitGenerationRequestId}`)
                throw new Error('Split generation took too long. Please try again.')
              }
            } else {
              // Fallback: Inngest not available, use synchronous generation
              console.warn(`[Onboarding] Inngest not available, using synchronous split generation`)

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
              }, splitGenerationRequestId)

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
