import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { InsightParserAgent } from '@/lib/agents/insight-parser.agent'
import { insightService } from '@/lib/services/insight.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, workoutId, notes } = body

    // Validate input
    if (!userId || !workoutId || !notes || typeof notes !== 'string') {
      return NextResponse.json(
        { error: 'Missing required fields: userId, workoutId, notes' },
        { status: 400 }
      )
    }

    if (notes.trim().length === 0) {
      return NextResponse.json(
        { error: 'Notes cannot be empty' },
        { status: 400 }
      )
    }

    console.log('[API /insights/parse] Parsing workout notes', {
      userId,
      workoutId,
      notesLength: notes.length
    })

    // Create Supabase client
    const supabase = await getSupabaseServerClient()

    // Fetch workout context
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single()

    if (workoutError || !workout) {
      console.error('[API /insights/parse] Failed to fetch workout:', workoutError)
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
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
        created = await insightService.createInsight({
          userId,
          workoutId,
          insightType: parseResult.insightType,
          severity: parseResult.severity,
          userNote: notes, // Store original notes
          exerciseName: parseResult.relatedExercises?.[0] || undefined,
          metadata: {
            affectedMuscles: parseResult.affectedMuscles || [],
            relatedExercises: parseResult.relatedExercises || [],
            suggestedActions: parseResult.suggestedActions || [],
            context: parseResult.context || {}
          }
        })
        console.log('[API /insights/parse] Insight saved successfully')
      } catch (error) {
        console.error('[API /insights/parse] Failed to create insight:', error)
        return NextResponse.json(
          { error: 'Failed to save insight' },
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
