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
  abstract get temperature(): number

  protected async complete<T>(
    userPrompt: string,
    responseFormat?: any
  ): Promise<T> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: this.temperature,
        response_format: responseFormat || { type: 'json_object' }
      })

      const content = completion.choices[0]?.message?.content
      if (!content) throw new Error('No response from AI')

      return JSON.parse(content) as T
    } catch (error) {
      console.error('AI completion error:', error)
      throw error
    }
  }
}
