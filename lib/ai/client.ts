import 'server-only'
import { OpenAI } from 'openai'

let client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!client) {
    // Debug logging for API key verification
    const apiKeyExists = !!process.env.OPENAI_API_KEY
    const apiKeyLength = process.env.OPENAI_API_KEY?.length || 0
    console.log('🔑 [OPENAI_CLIENT] API key check:', {
      exists: apiKeyExists,
      length: apiKeyLength,
      startsWithSk: process.env.OPENAI_API_KEY?.startsWith('sk-') || false
    })

    if (!process.env.OPENAI_API_KEY) {
      console.error('🔴 [OPENAI_CLIENT] OPENAI_API_KEY not configured!')
      throw new Error('OPENAI_API_KEY not configured')
    }

    console.log('✅ [OPENAI_CLIENT] Initializing OpenAI client...')
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 400000,  // 400s (6.6 min) - SDK-level timeout as safety net
      maxRetries: 0     // Disable automatic retries - we handle retries at application level
    })
    console.log('✅ [OPENAI_CLIENT] OpenAI client initialized with timeout: 400s, maxRetries: 0')
  }
  return client
}
