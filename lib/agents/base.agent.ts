import { getOpenAIClient } from '@/lib/ai/client'
import { KnowledgeEngine } from '@/lib/knowledge/engine'

export abstract class BaseAgent {
  protected openai: ReturnType<typeof getOpenAIClient>
  protected knowledge: KnowledgeEngine

  constructor(supabaseClient?: any) {
    // Initialize OpenAI client (will only work on server due to server-only in client.ts)
    this.openai = getOpenAIClient()
    // Pass Supabase client to KnowledgeEngine for server-side usage
    this.knowledge = new KnowledgeEngine(supabaseClient)
  }

  abstract get systemPrompt(): string

  protected async complete<T>(
    userPrompt: string
  ): Promise<T> {
    try {
      // Combine system and user prompts for Responses API
      // GPT-5 relies on instruction following for JSON formatting (no response_format parameter)
      const combinedInput = `${this.systemPrompt}\n\n${userPrompt}\n\nIMPORTANT: You must respond with valid JSON only. Do not include any markdown formatting, code blocks, or explanatory text - just the raw JSON object.`

      const response = await this.openai.responses.create({
        model: 'gpt-5-mini',
        input: combinedInput,
        reasoning: { effort: 'medium' },
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
