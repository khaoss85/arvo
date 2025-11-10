import { NextRequest, NextResponse } from 'next/server'
import { WorkoutService } from '@/lib/services/workout.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workout = await WorkoutService.getByIdServer(params.id)

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Error fetching workout:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
      { status: 500 }
    )
  }
}
