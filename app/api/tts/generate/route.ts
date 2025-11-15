/**
 * Server-side API route for OpenAI TTS generation
 *
 * This route proxies TTS requests to OpenAI, keeping the API key secure server-side.
 * Benefits:
 * - API key never exposed to client
 * - Rate limiting can be applied server-side
 * - Request logging and monitoring
 * - Cost tracking per user
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge' // Use Edge Runtime for lower latency

interface TTSRequest {
  text: string
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  model?: 'tts-1' | 'tts-1-hd'
  speed?: number // 0.25 - 4.0
}

interface TTSErrorResponse {
  error: string
  message: string
  fallbackToWebSpeech?: boolean
}

/**
 * POST /api/tts/generate
 *
 * Generate speech audio using OpenAI TTS-1
 *
 * @body {TTSRequest} - Text, voice, model, and speed settings
 * @returns {Blob} - Audio blob (MP3 format)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate environment
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('[TTS API] OPENAI_API_KEY not configured')
      return NextResponse.json(
        {
          error: 'configuration_error',
          message: 'OpenAI TTS not configured on server',
          fallbackToWebSpeech: true,
        } as TTSErrorResponse,
        { status: 503 }
      )
    }

    // 2. Parse and validate request body
    let body: TTSRequest
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'Invalid JSON in request body',
        } as TTSErrorResponse,
        { status: 400 }
      )
    }

    const { text, voice, model = 'tts-1', speed = 1.0 } = body

    // Validate required fields
    if (!text || !voice) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'Missing required fields: text, voice',
        } as TTSErrorResponse,
        { status: 400 }
      )
    }

    // Validate text length (OpenAI limit: 4096 characters)
    if (text.length > 4096) {
      return NextResponse.json(
        {
          error: 'text_too_long',
          message: `Text exceeds maximum length of 4096 characters (got ${text.length})`,
        } as TTSErrorResponse,
        { status: 400 }
      )
    }

    // Validate voice
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    if (!validVoices.includes(voice)) {
      return NextResponse.json(
        {
          error: 'invalid_voice',
          message: `Invalid voice: ${voice}. Must be one of: ${validVoices.join(', ')}`,
        } as TTSErrorResponse,
        { status: 400 }
      )
    }

    // Validate speed
    if (speed < 0.25 || speed > 4.0) {
      return NextResponse.json(
        {
          error: 'invalid_speed',
          message: `Invalid speed: ${speed}. Must be between 0.25 and 4.0`,
        } as TTSErrorResponse,
        { status: 400 }
      )
    }

    // 3. Call OpenAI TTS API
    console.log(`[TTS API] Generating audio: ${text.substring(0, 50)}... (${text.length} chars, voice: ${voice}, model: ${model})`)

    const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        response_format: 'mp3',
        speed,
      }),
    })

    // 4. Handle OpenAI errors
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      let errorData: any
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      console.error(`[TTS API] OpenAI error: ${openaiResponse.status} - ${JSON.stringify(errorData)}`)

      // Map OpenAI errors to user-friendly messages
      if (openaiResponse.status === 401) {
        return NextResponse.json(
          {
            error: 'authentication_error',
            message: 'Invalid OpenAI API key',
            fallbackToWebSpeech: true,
          } as TTSErrorResponse,
          { status: 503 }
        )
      }

      if (openaiResponse.status === 429) {
        return NextResponse.json(
          {
            error: 'rate_limit_exceeded',
            message: 'OpenAI rate limit exceeded. Please try again in a moment.',
            fallbackToWebSpeech: true,
          } as TTSErrorResponse,
          { status: 429 }
        )
      }

      if (openaiResponse.status >= 500) {
        return NextResponse.json(
          {
            error: 'openai_server_error',
            message: 'OpenAI service temporarily unavailable',
            fallbackToWebSpeech: true,
          } as TTSErrorResponse,
          { status: 503 }
        )
      }

      // Generic error
      return NextResponse.json(
        {
          error: 'openai_error',
          message: errorData.error?.message || 'OpenAI TTS request failed',
          fallbackToWebSpeech: true,
        } as TTSErrorResponse,
        { status: openaiResponse.status }
      )
    }

    // 5. Return audio blob
    const audioBlob = await openaiResponse.blob()
    console.log(`[TTS API] Success: Generated ${audioBlob.size} bytes of audio`)

    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=604800', // Cache for 7 days (matches IndexedDB TTL)
      },
    })
  } catch (error) {
    console.error('[TTS API] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Internal server error',
        fallbackToWebSpeech: true,
      } as TTSErrorResponse,
      { status: 500 }
    )
  }
}
