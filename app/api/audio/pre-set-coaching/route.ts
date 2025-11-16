import { NextRequest, NextResponse } from 'next/server'
import { AudioScriptGeneratorAgent } from '@/lib/agents/audio-script-generator.agent'
import type { PreSetCoachingInput, PreSetCoachingScript } from '@/lib/types/pre-set-coaching'

export const runtime = 'edge' // Low latency

export async function POST(request: NextRequest) {
  try {
    let body: PreSetCoachingInput
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
      weight,
      reps,
      rir,
      language = 'en',
    } = body

    // Validate required fields
    if (
      !exerciseName ||
      setNumber === undefined ||
      totalSets === undefined ||
      isWarmup === undefined ||
      weight === undefined ||
      reps === undefined ||
      rir === undefined
    ) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'Missing required fields: exerciseName, setNumber, totalSets, isWarmup, weight, reps, rir',
        },
        { status: 400 }
      )
    }

    console.log(`[PreSetCoaching API] Generating script for ${exerciseName}, Set ${setNumber}/${totalSets} (${language})`)

    // Generate script using AI agent with 'minimal' reasoning
    const agent = new AudioScriptGeneratorAgent()
    const script: PreSetCoachingScript = await agent.generatePreSetCoachingScript(body, language)

    console.log(`[PreSetCoaching API] Successfully generated script (${script.segments.length} segments)`)

    return NextResponse.json(script, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('[PreSetCoaching API] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
