import { getOpenAIClient } from '@/lib/ai/client'
import { KnowledgeEngine } from '@/lib/knowledge/engine'
import type { Locale } from '@/i18n'

export abstract class BaseAgent {
  protected openai: ReturnType<typeof getOpenAIClient>
  protected knowledge: KnowledgeEngine
  protected supabase: any
  protected reasoningEffort: 'low' | 'medium' | 'high' = 'low'

  constructor(supabaseClient?: any, reasoningEffort?: 'low' | 'medium' | 'high') {
    // Initialize OpenAI client (will only work on server due to server-only in client.ts)
    this.openai = getOpenAIClient()
    // Pass Supabase client to KnowledgeEngine for server-side usage
    this.knowledge = new KnowledgeEngine(supabaseClient)
    // Store supabase client for direct database access in agents
    this.supabase = supabaseClient
    // Configure reasoning effort (default: low for better performance)
    if (reasoningEffort) this.reasoningEffort = reasoningEffort
  }

  abstract get systemPrompt(): string

  /**
   * Gets the language instruction to append to the system prompt
   * @param targetLanguage - The target language for AI responses
   */
  protected getLanguageInstruction(targetLanguage: Locale = 'en'): string {
    if (targetLanguage === 'it') {
      return '\n\n🇮🇹 LANGUAGE INSTRUCTION: You MUST respond in Italian (italiano). Use natural, conversational Italian suitable for a gym/fitness environment. All text fields in your JSON response should be in Italian. Exercise names can remain in English if they are standard international terms (e.g., "Bench Press", "Squat").'
    }
    return '\n\n🇬🇧 LANGUAGE INSTRUCTION: Respond in English.'
  }

  protected async complete<T>(
    userPrompt: string,
    targetLanguage: Locale = 'en'
  ): Promise<T> {
    try {
      // Add language instruction to system prompt
      const languageInstruction = this.getLanguageInstruction(targetLanguage)

      // Combine system and user prompts for Responses API
      // GPT-5 relies on instruction following for JSON formatting (no response_format parameter)
      const combinedInput = `${this.systemPrompt}${languageInstruction}\n\n${userPrompt}\n\nIMPORTANT: You must respond with valid JSON only. Do not include any markdown formatting, code blocks, or explanatory text - just the raw JSON object.`

      const response = await this.openai.responses.create({
        model: 'gpt-5-mini',
        input: combinedInput,
        reasoning: { effort: this.reasoningEffort },
        text: { verbosity: 'medium' }
      })

      const content = response.output_text
      if (!content) throw new Error('No response from AI')

      // Clean up any potential markdown code blocks or extra whitespace
      const cleanedContent = content.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')

      return JSON.parse(cleanedContent) as T
    } catch (error) {
      console.error('AI completion error:', error)
      throw error
    }
  }
}
