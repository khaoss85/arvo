// Supabase Edge Function: Memory Consolidation
// Scheduled to run weekly (Sunday at midnight)
// Analyzes workout patterns and consolidates memories

import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('[MemoryConsolidation] Starting weekly consolidation...')

    // Get all active users (batch process)
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .limit(100) // Process 100 users per run

    if (usersError) {
      console.error('[MemoryConsolidation] Error fetching users:', usersError)
      return new Response(
        JSON.stringify({ error: usersError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!users || users.length === 0) {
      console.log('[MemoryConsolidation] No users to process')
      return new Response(
        JSON.stringify({ success: true, message: 'No users to process', processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let processedCount = 0
    let errorCount = 0

    // Process each user
    for (const user of users) {
      try {
        console.log(`[MemoryConsolidation] Processing user: ${user.user_id}`)

        // Fetch user's workout history (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: workouts, error: workoutsError } = await supabase
          .from('workouts')
          .select('id, completed_at, mental_readiness_overall, duration_seconds')
          .eq('user_id', user.user_id)
          .eq('status', 'completed')
          .gte('completed_at', thirtyDaysAgo.toISOString())
          .order('completed_at', { ascending: false })
          .limit(20)

        if (workoutsError) {
          console.error(`[MemoryConsolidation] Error fetching workouts for ${user.user_id}:`, workoutsError)
          errorCount++
          continue
        }

        if (!workouts || workouts.length < 3) {
          // Need at least 3 workouts to detect patterns
          console.log(`[MemoryConsolidation] User ${user.user_id} has insufficient workout history (${workouts?.length || 0} workouts)`)
          continue
        }

        // Detect mental readiness pattern
        const mentalReadinessValues = workouts
          .filter(w => w.mental_readiness_overall !== null)
          .map(w => w.mental_readiness_overall!)

        if (mentalReadinessValues.length >= 5) {
          const avgMentalReadiness = mentalReadinessValues.reduce((sum, val) => sum + val, 0) / mentalReadinessValues.length

          // If consistently low mental readiness, create/boost memory
          if (avgMentalReadiness < 2.5) {
            console.log(`[MemoryConsolidation] User ${user.user_id} has low mental readiness pattern (avg: ${avgMentalReadiness.toFixed(2)})`)

            // Check if memory already exists
            const { data: existingMemories } = await supabase
              .from('user_memory_entries')
              .select('id, confidence_score')
              .eq('user_id', user.user_id)
              .eq('memory_category', 'pattern')
              .ilike('title', '%mental readiness%')
              .eq('status', 'active')
              .limit(1)

            if (existingMemories && existingMemories.length > 0) {
              // Boost existing memory
              const memory = existingMemories[0]
              const newConfidence = Math.min(0.95, memory.confidence_score + 0.1)
              await supabase
                .from('user_memory_entries')
                .update({
                  confidence_score: newConfidence,
                  times_confirmed: supabase.rpc('increment', { x: 1 }),
                  last_confirmed_at: new Date().toISOString()
                })
                .eq('id', memory.id)
              console.log(`[MemoryConsolidation] Boosted mental readiness memory for ${user.user_id}`)
            } else {
              // Create new memory
              await supabase
                .from('user_memory_entries')
                .insert({
                  user_id: user.user_id,
                  memory_category: 'pattern',
                  memory_source: 'ai_observation',
                  title: 'Tends toward low mental readiness',
                  description: `User consistently reports low mental readiness (avg ${avgMentalReadiness.toFixed(1)}/5). May benefit from deload or recovery focus.`,
                  confidence_score: 0.6,
                  times_confirmed: 1,
                  status: 'active',
                  first_observed_at: new Date().toISOString(),
                  last_confirmed_at: new Date().toISOString(),
                  related_exercises: [],
                  related_muscles: [],
                  metadata: {
                    averageMentalReadiness: avgMentalReadiness,
                    workoutsSampled: mentalReadinessValues.length
                  }
                })
              console.log(`[MemoryConsolidation] Created mental readiness memory for ${user.user_id}`)
            }
          }
        }

        processedCount++
      } catch (userError) {
        console.error(`[MemoryConsolidation] Error processing user ${user.user_id}:`, userError)
        errorCount++
      }
    }

    console.log(`[MemoryConsolidation] Consolidation complete. Processed: ${processedCount}, Errors: ${errorCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Memory consolidation complete',
        processed: processedCount,
        errors: errorCount
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[MemoryConsolidation] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
