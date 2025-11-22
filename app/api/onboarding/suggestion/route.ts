import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/ai/client'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getUserLanguage } from '@/lib/utils/get-user-language'
import type { Locale } from '@/i18n'

interface SuggestionRequest {
  step: string
  userData: {
    experienceLevel?: string
    age?: number
    gender?: string
    trainingObjective?: string
    splitType?: string
    weeklyFrequency?: number
  }
}

const STEP_PROMPTS: Record<string, (data: SuggestionRequest['userData']) => string> = {
  split: (data) => `
You are a knowledgeable fitness coach providing brief, personalized training split recommendations.

User profile:
- Experience level: ${data.experienceLevel || 'unknown'}
${data.age ? `- Age: ${data.age}` : ''}
${data.gender ? `- Gender: ${data.gender}` : ''}
${data.trainingObjective ? `- Goal: ${data.trainingObjective}` : ''}

Provide a concise (2-3 sentences) recommendation for:
1. Which split type would be best (Push/Pull/Legs, Upper/Lower, Full Body, Bro Split)
2. Optimal training frequency per week

Be encouraging and specific. Use simple language if beginner, technical if advanced.
  `.trim(),

  equipment: (data) => `
You are a fitness equipment advisor providing brief, practical advice.

User profile:
- Experience level: ${data.experienceLevel || 'unknown'}
${data.trainingObjective ? `- Goal: ${data.trainingObjective}` : ''}

Provide a concise (2-3 sentences) suggestion about:
- Essential equipment for their level and goal
- What they can prioritize if building a home gym

Keep it practical and encouraging.
  `.trim(),

  profile: (data) => `
You are a supportive fitness coach explaining why we collect user information.

User experience level: ${data.experienceLevel || 'unknown'}

Provide a brief (2 sentences) explanation of why sharing age, weight, and height helps us:
- Personalize volume and recovery recommendations
- Calculate realistic strength standards

Use simple, non-technical language for beginners. Be concise and reassuring.
  `.trim(),

  goals: (data) => `
You are a fitness coach helping users clarify their training objectives.

User profile:
- Experience level: ${data.experienceLevel || 'unknown'}
${data.age ? `- Age: ${data.age}` : ''}

Provide a brief (2-3 sentences) guidance on:
- How to choose between bulk, cut, maintain, or recomp
- Why mentioning injuries/limitations is important

Be supportive and educational.
  `.trim()
}

/**
 * Get language instruction for OpenAI prompt
 * Same pattern as BaseAgent.getLanguageInstruction()
 */
function getLanguageInstruction(targetLanguage: Locale): string {
  if (targetLanguage === 'it') {
    return '\n\n🇮🇹 LANGUAGE INSTRUCTION: You MUST respond in Italian (italiano). Use natural, conversational Italian suitable for a gym/fitness environment.'
  }
  return '\n\n🇬🇧 LANGUAGE INSTRUCTION: Respond in English.'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's preferred language
    const targetLanguage = await getUserLanguage(user.id)

    const body: SuggestionRequest = await request.json()
    const { step, userData } = body

    // Get prompt template for this step
    const promptGenerator = STEP_PROMPTS[step]
    if (!promptGenerator) {
      return NextResponse.json({
        suggestion: null // No suggestion for this step
      })
    }

    const systemPrompt = promptGenerator(userData)
    const languageInstruction = getLanguageInstruction(targetLanguage)

    // Call OpenAI with lightweight model
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt + languageInstruction
        },
        {
          role: 'user',
          content: 'Please provide your recommendation.'
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    })

    const suggestion = completion.choices[0]?.message?.content

    return NextResponse.json({
      suggestion,
      cached: false
    })
  } catch (error) {
    console.error('[ONBOARDING_SUGGESTION_API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestion' },
      { status: 500 }
    )
  }
}
