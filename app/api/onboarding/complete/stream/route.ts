import { NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ExerciseSelector } from '@/lib/agents/exercise-selector.agent'
import type { SplitType, WorkoutType } from '@/lib/services/muscle-groups.service'
import type { Workout } from '@/lib/types/schemas'

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
        try {
          // Helper to send progress updates
          const sendProgress = (phase: string, progress: number, message: string) => {
            const eventData = JSON.stringify({ phase, progress, message })
            controller.enqueue(encoder.encode(`data: ${eventData}\n\n`))
          }

          // Phase 1: Create user profile (5-15%)
          sendProgress('profile', 5, 'Creating your profile')

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

          sendProgress('profile', 15, 'Profile created')

          // Phase 2: Planning workout (20-25%)
          sendProgress('split', 20, 'Planning your workout')
          await new Promise(resolve => setTimeout(resolve, 200))
          sendProgress('split', 25, 'Analyzing training approach')

          // Phase 3: AI selecting exercises (30-70%)
          sendProgress('ai', 30, 'AI analyzing exercises')
          await new Promise(resolve => setTimeout(resolve, 300))

          // Get user profile for workout generation
          const { data: profile, error: fetchProfileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', data.userId)
            .single()

          if (fetchProfileError || !profile) {
            throw new Error('Failed to fetch user profile')
          }

          sendProgress('ai', 40, 'AI selecting best exercises')

          // Generate workout using ExerciseSelector
          const exerciseSelector = new ExerciseSelector(supabase, 'medium')
          const preferredSplit = (profile.preferred_split as SplitType) || 'push_pull_legs'

          // For first workout, start with 'push' for push_pull_legs, 'upper' for upper_lower, etc.
          let workoutType: WorkoutType = 'push'
          if (preferredSplit === 'upper_lower') {
            workoutType = 'upper'
          } else if (preferredSplit === 'full_body') {
            workoutType = 'full_body'
          }

          sendProgress('ai', 55, 'Optimizing exercise selection')

          // Merge standard equipment with custom equipment
          const customEquipment = (profile.custom_equipment as Array<{ id: string; name: string; exampleExercises: string[] }>) || []
          const customEquipmentIds = customEquipment.map(eq => eq.id)
          const allAvailableEquipment = [...(profile.available_equipment || []), ...customEquipmentIds]

          // Select exercises
          const selection = await exerciseSelector.selectExercises({
            workoutType,
            approachId: data.approachId,
            weakPoints: profile.weak_points || [],
            availableEquipment: allAvailableEquipment,
            customEquipment: customEquipment, // Pass custom equipment metadata
            recentExercises: [],
            userId: data.userId,
            experienceYears: profile.experience_years,
            userAge: profile.age,
            userGender: profile.gender as 'male' | 'female' | 'other' | null
          })

          sendProgress('ai', 70, 'Calculating target weights')

          // Format exercises for workout
          const exercises = selection.exercises.map((exercise: any) => ({
            name: exercise.name,
            equipmentVariant: exercise.equipmentVariant,
            targetSets: exercise.sets,
            targetReps: exercise.repRange[0],
            targetWeight: 0, // Will be estimated on first use
            rir: exercise.rir || 2,
            notes: exercise.notes || null
          }))

          // Create workout in database
          const { data: workout, error: workoutError } = await supabase
            .from('workouts')
            .insert({
              user_id: data.userId,
              planned_at: new Date().toISOString(),
              workout_type: workoutType,
              status: 'ready',
              approach_id: data.approachId,
              completed: false,
              exercises: exercises
            })
            .select()
            .single()

          if (workoutError || !workout) {
            throw new Error('Failed to create workout')
          }

          sendProgress('optimization', 75, 'Analyzing your baseline')

          // Phase 4: Generate split plan if data provided (80-95%)
          let splitPlanId = null
          if (data.splitType && data.weeklyFrequency) {
            sendProgress('finalize', 80, 'Generating training split plan')

            const { generateSplitPlanAction } = await import('@/app/actions/split-actions')
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
            })

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

            sendProgress('finalize', 90, 'Split plan created')
          } else {
            sendProgress('finalize', 85, 'Finalizing your setup')
          }

          // Phase 5: Complete (95-100%)
          sendProgress('finalize', 95, 'Finalizing workout')
          await new Promise(resolve => setTimeout(resolve, 200))
          sendProgress('complete', 100, 'Workout ready!')

          // Send final complete event with workout data
          const completeData = JSON.stringify({
            phase: 'complete',
            workout: workout,
            splitPlanId: splitPlanId
          })
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`))

          controller.close()
        } catch (error) {
          console.error('Onboarding stream error:', error)
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
