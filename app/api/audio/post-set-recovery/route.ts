import { NextRequest, NextResponse } from 'next/server'
import { AudioScriptGeneratorAgent } from '@/lib/agents/audio-script-generator.agent'
import type { PostSetRecoveryInput, PostSetRecoveryScript } from '@/lib/types/pre-set-coaching'

export const runtime = 'edge' // Low latency

export async function POST(request: NextRequest) {
  try {
    let body: PostSetRecoveryInput
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const {
      exerciseName,
      setNumber,
      totalSets,
      isWarmup,
      weightUsed,
      repsCompleted,
      targetReps,
      rirAchieved,
      wasSuccessful,
      restPeriodSeconds,
      setsRemaining,
      language = 'en',
    } = body

    // Validate required fields
    if (
      !exerciseName ||
      setNumber === undefined ||
      totalSets === undefined ||
      isWarmup === undefined ||
      weightUsed === undefined ||
      repsCompleted === undefined ||
      targetReps === undefined ||
      rirAchieved === undefined ||
      wasSuccessful === undefined ||
      restPeriodSeconds === undefined ||
      setsRemaining === undefined
    ) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message:
            'Missing required fields: exerciseName, setNumber, totalSets, isWarmup, weightUsed, repsCompleted, targetReps, rirAchieved, wasSuccessful, restPeriodSeconds, setsRemaining',
        },
        { status: 400 }
      )
    }

    console.log(
      `[PostSetRecovery API] Generating recovery script for ${exerciseName}, Set ${setNumber}/${totalSets} (${repsCompleted}/${targetReps} reps, ${setsRemaining} remaining) (${language})`
    )

    // Generate recovery script using AI agent with 'none' reasoning
    const agent = new AudioScriptGeneratorAgent()
    const script: PostSetRecoveryScript = await agent.generatePostSetRecoveryScript(body, language)

    console.log(
      `[PostSetRecovery API] Successfully generated recovery script (${script.segments.length} segments, type: ${script.metadata.recoveryType})`
    )

    return NextResponse.json(script, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes (shorter than pre-set)
      },
    })
  } catch (error) {
    console.error('[PostSetRecovery API] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
