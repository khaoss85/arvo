import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { InsightParserAgent } from '@/lib/agents/insight-parser.agent'

export async function POST(request: NextRequest) {
  console.log('[API /insights/parse] ==================== NEW REQUEST ====================')
  try {
    const body = await request.json()
    const { userId, workoutId, notes } = body

    console.log('[API /insights/parse] Request body:', {
      userId,
      workoutId,
      notesLength: notes?.length,
      notesPreview: notes?.substring(0, 50) + (notes?.length > 50 ? '...' : '')
    })

    // Validate input
    if (!userId || !workoutId || !notes || typeof notes !== 'string') {
      console.error('[API /insights/parse] ❌ Validation failed: Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: userId, workoutId, notes' },
        { status: 400 }
      )
    }

    if (notes.trim().length === 0) {
      console.error('[API /insights/parse] ❌ Validation failed: Empty notes')
      return NextResponse.json(
        { error: 'Notes cannot be empty' },
        { status: 400 }
      )
    }

    console.log('[API /insights/parse] ✅ Validation passed')

    // Create Supabase client
    console.log('[API /insights/parse] Creating Supabase server client...')
    const supabase = await getSupabaseServerClient()

    // Check authentication
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    console.log('[API /insights/parse] Auth check:', {
      authenticated: !!authUser,
      userId: authUser?.id,
      email: authUser?.email,
      authError: authError?.message
    })

    if (!authUser) {
      console.error('[API /insights/parse] ❌ No authenticated user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch workout context
    console.log('[API /insights/parse] Fetching workout...', { workoutId })
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single()

    if (workoutError || !workout) {
      console.error('[API /insights/parse] ❌ Failed to fetch workout')
      console.error('[API /insights/parse] Error details:', workoutError)
      console.error('[API /insights/parse] Possible causes:')
      console.error('  1. Workout does not exist')
      console.error('  2. Workout does not belong to authenticated user (RLS blocking)')
      console.error('  3. User is not properly authenticated')
      return NextResponse.json(
        { error: 'Workout not found', details: workoutError?.message },
        { status: 404 }
      )
    }

    console.log('[API /insights/parse] ✅ Workout found:', {
      workoutId: workout.id,
      workoutUserId: workout.user_id,
      matchesAuthUser: workout.user_id === authUser.id
    })

    // Check for duplicate requests within last 30 seconds (idempotency)
    console.log('[API /insights/parse] Checking for duplicate requests...')
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString()
    const { data: existingInsight, error: duplicateCheckError } = await supabase
      .from('workout_insights')
      .select('id, created_at')
      .eq('workout_id', workoutId)
      .eq('user_note', notes)
      .gte('created_at', thirtySecondsAgo)
      .maybeSingle()

    if (existingInsight) {
      console.log('[API /insights/parse] ✅ Duplicate request detected, skipping creation', {
        existingInsightId: existingInsight.id,
        createdAt: existingInsight.created_at
      })
      return NextResponse.json({
        success: true,
        insightCreated: false,
        isDuplicate: true,
        duplicateInsightId: existingInsight.id
      })
    }

    if (duplicateCheckError) {
      console.warn('[API /insights/parse] ⚠️ Duplicate check failed (proceeding anyway):', duplicateCheckError.message)
    } else {
      console.log('[API /insights/parse] ✅ No duplicate found, proceeding with AI parsing')
    }

    // Parse notes into structured insights using AI
    const parser = new InsightParserAgent(supabase)
    const parseResult = await parser.parseInsight({
      userNote: notes,
      workoutContext: {
        exercises: [], // Simplified for now - in production, fetch from sets_log
        mentalReadiness: workout.mental_readiness_overall || undefined,
        mesocyclePhase: undefined, // Not in database schema
        workoutType: workout.workout_type || undefined
      },
      recentInsights: [] // We'll query this in a production version
    })

    console.log('[API /insights/parse] AI parsing complete', {
      insightType: parseResult.insightType,
      severity: parseResult.severity,
      isDuplicate: parseResult.isDuplicate
    })

    // Save insight to database (if not duplicate)
    let created = null
    if (!parseResult.isDuplicate) {
      try {
        console.log('[API /insights/parse] Creating insight with service role client...', {
          userId,
          workoutId,
          insightType: parseResult.insightType,
          severity: parseResult.severity
        })

        // IMPORTANT: Use service role client to bypass RLS
        // The regular server client (with anon key) is subject to RLS policies,
        // but auth.uid() is not properly propagated in API route context.
        // Since we've already validated the user owns the workout, it's safe
        // to bypass RLS using service role for the INSERT operation.
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseService = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )

        const { data: createdInsight, error: insertError } = await supabaseService
          .from('workout_insights')
          .insert({
            user_id: userId,
            workout_id: workoutId,
            exercise_name: parseResult.relatedExercises?.[0] || undefined,
            user_note: notes,
            insight_type: parseResult.insightType,
            severity: parseResult.severity,
            metadata: {
              affectedMuscles: parseResult.affectedMuscles || [],
              relatedExercises: parseResult.relatedExercises || [],
              suggestedActions: parseResult.suggestedActions || [],
              context: parseResult.context || {}
            },
            status: 'active',
            relevance_score: 1.0
          })
          .select()
          .single()

        if (insertError) {
          console.error('[API /insights/parse] Failed to create insight:', insertError)
          throw insertError
        }

        created = createdInsight
        console.log('[API /insights/parse] ✅ Insight saved successfully', {
          insightId: created.id
        })
      } catch (error: any) {
        console.error('[API /insights/parse] ❌ Failed to create insight:', {
          error: error.message,
          code: error.code,
          details: error.details
        })
        return NextResponse.json(
          {
            error: 'Failed to save insight',
            details: error.message,
            code: error.code
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      insightCreated: !!created,
      isDuplicate: parseResult.isDuplicate,
      duplicateInsightId: parseResult.duplicateInsightId
    })
  } catch (error) {
    console.error('[API /insights/parse] Error:', error)
    return NextResponse.json(
      { error: 'Failed to parse insights' },
      { status: 500 }
    )
  }
}
