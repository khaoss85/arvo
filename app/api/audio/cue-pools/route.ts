/**
 * Server-side API route for generating realtime audio cue pools
 *
 * This route generates AI-driven cue pools for realtime tempo coaching.
 * Keeps the OpenAI API calls server-side for security.
 */

import { NextRequest, NextResponse } from 'next/server'
import { AudioScriptGeneratorAgent } from '@/lib/agents/audio-script-generator.agent'
import type { RealtimeCuePools, RealtimeCuePoolsInput } from '@/lib/types/realtime-cue-pools'

export const runtime = 'edge' // Use Edge Runtime for lower latency

interface CuePoolsErrorResponse {
  error: string
  message: string
}

/**
 * POST /api/audio/cue-pools
 *
 * Generate realtime audio cue pools using AI
 *
 * @body {RealtimeCuePoolsInput} - Exercise and set parameters
 * @returns {RealtimeCuePools} - AI-generated cue pools
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body: RealtimeCuePoolsInput
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'Invalid JSON in request body',
        } as CuePoolsErrorResponse,
        { status: 400 }
      )
    }

    const { exerciseName, setNumber, targetReps, tempo, setType, language } = body

    // Validate required fields
    if (!exerciseName || !setNumber || !targetReps || !tempo || !setType || !language) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'Missing required fields: exerciseName, setNumber, targetReps, tempo, setType, language',
        } as CuePoolsErrorResponse,
        { status: 400 }
      )
    }

    // Validate language
    if (language !== 'en' && language !== 'it') {
      return NextResponse.json(
        {
          error: 'invalid_language',
          message: 'Language must be "en" or "it"',
        } as CuePoolsErrorResponse,
        { status: 400 }
      )
    }

    // Generate cue pools using AI agent
    console.log(`[CuePools API] Generating cue pools for ${exerciseName} (${language})`)

    const agent = new AudioScriptGeneratorAgent()
    const cuePools = await agent.generateRealtimeCuePools({
      exerciseName,
      setNumber,
      targetReps,
      tempo,
      setType,
      language,
      previousSetReps: body.previousSetReps,
      isFailureSet: body.isFailureSet,
      exerciseCategory: body.exerciseCategory,
    })

    console.log(`[CuePools API] Successfully generated cue pools`)

    return NextResponse.json(cuePools, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours (cue pools are stable per exercise)
      },
    })
  } catch (error) {
    console.error('[CuePools API] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Internal server error',
      } as CuePoolsErrorResponse,
      { status: 500 }
    )
  }
}
