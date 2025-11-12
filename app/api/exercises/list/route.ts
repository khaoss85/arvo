import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Fetch exercises from exercise_generations table
    const { data: exercises, error } = await supabase
      .from('exercise_generations')
      .select('id, name, metadata, animation_url, has_animation')
      .order('usage_count', { ascending: false })
      .limit(500) // Limit to most popular exercises

    if (error) {
      console.error('Error fetching exercises:', error)
      return NextResponse.json(
        { error: 'Failed to fetch exercises' },
        { status: 500 }
      )
    }

    // Transform to expected format
    const transformedExercises = exercises?.map((ex: any) => ({
      id: ex.id,
      name: ex.name,
      bodyPart: ex.metadata?.body_part || 'general',
      equipment: ex.metadata?.equipment || 'any',
      target: ex.metadata?.primary_muscles?.[0] || 'general',
      primaryMuscles: ex.metadata?.primary_muscles || [],
      secondaryMuscles: ex.metadata?.secondary_muscles || [],
      animationUrl: ex.animation_url,
      hasAnimation: ex.has_animation || false,
    })) || []

    return NextResponse.json({
      exercises: transformedExercises,
      count: transformedExercises.length,
    })
  } catch (error) {
    console.error('Unexpected error fetching exercises:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
