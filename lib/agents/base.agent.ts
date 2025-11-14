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
   * Gets appropriate timeout based on reasoning effort level
   * Higher reasoning requires more time for AI to think through complex constraints
   * @returns Timeout in milliseconds
   */
  protected getTimeoutForReasoning(): number {
    switch (this.reasoningEffort) {
      case 'low':
        return 90000      // 90s - fast, standard constraints
      case 'medium':
        return 180000     // 180s (3min) - complex multi-constraint optimization
      case 'high':
        return 240000     // 240s (4min) - maximum reasoning for hardest problems
    }
  }

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
    targetLanguage: Locale = 'en',
    customTimeoutMs?: number
  ): Promise<T> {
    try {
      console.log('🤖 [BASE_AGENT] Starting AI completion request...', {
        agentClass: this.constructor.name,
        targetLanguage,
        promptLength: userPrompt.length,
        customTimeout: customTimeoutMs ? `${customTimeoutMs}ms` : 'default',
        timestamp: new Date().toISOString()
      })

      // Add language instruction to system prompt
      const languageInstruction = this.getLanguageInstruction(targetLanguage)

      // Combine system and user prompts for Responses API
      // GPT-5 relies on instruction following for JSON formatting (no response_format parameter)
      const combinedInput = `${this.systemPrompt}${languageInstruction}\n\n${userPrompt}\n\nIMPORTANT: You must respond with valid JSON only. Do not include any markdown formatting, code blocks, or explanatory text - just the raw JSON object.`

      // Add timeout safety to prevent indefinite hangs
      // Use reasoning-based timeout (90s for 'low', 150s for 'medium', 240s for 'high')
      const AI_TIMEOUT_MS = customTimeoutMs || this.getTimeoutForReasoning()
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(
            `AI request timeout after ${AI_TIMEOUT_MS / 1000}s. ` +
            `This may indicate network issues or an overloaded AI service. ` +
            `Agent: ${this.constructor.name}`
          ))
        }, AI_TIMEOUT_MS)
      })

      const response = await Promise.race([
        this.openai.responses.create({
          model: 'gpt-5-mini',
          input: combinedInput,
          reasoning: { effort: this.reasoningEffort },
          text: { verbosity: 'medium' }
        }),
        timeoutPromise
      ])

      console.log('✅ [BASE_AGENT] AI response received', {
        hasResponse: !!response,
        hasOutputText: !!response.output_text,
        outputLength: response.output_text?.length || 0
      })

      const content = response.output_text
      if (!content) throw new Error('No response from AI')

      // Clean up any potential markdown code blocks or extra whitespace
      const cleanedContent = content.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')

      return JSON.parse(cleanedContent) as T
    } catch (error) {
      // Detailed error logging for AI failures
      console.error('🔴 [BASE_AGENT] AI completion error:', {
        agent: this.constructor.name,
        errorName: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
        isOpenAIError: error?.constructor?.name?.includes('OpenAI'),
        isTimeout: error instanceof Error && error.message.includes('timeout'),
        reasoningEffort: this.reasoningEffort,
        timestamp: new Date().toISOString()
      })

      // Enhance error message with agent context for better debugging
      if (error instanceof Error) {
        const enhancedMessage = `[${this.constructor.name}] ${error.message}`
        error.message = enhancedMessage
      }

      throw error
    }
  }

  /**
   * Complete AI request with automatic retry and validation feedback loop
   * @param userPrompt - The user prompt to send to AI
   * @param validationFn - Function to validate the AI result and provide feedback (can be async)
   * @param maxAttempts - Maximum number of attempts (default: 3)
   * @param targetLanguage - Target language for responses
   * @returns Validated AI result
   * @throws Error if all attempts fail validation
   */
  protected async completeWithRetry<T>(
    userPrompt: string,
    validationFn: (result: T) => Promise<{ valid: boolean; feedback: string }> | { valid: boolean; feedback: string },
    maxAttempts: number = 3,
    targetLanguage: Locale = 'en'
  ): Promise<T> {
    let lastFeedback = ''

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Build prompt with feedback from previous attempt
        const feedbackSection = lastFeedback
          ? `\n\n${'='.repeat(80)}\n⚠️  PREVIOUS ATTEMPT ${attempt - 1} FAILED - PLEASE FIX THESE ISSUES:\n${'='.repeat(80)}\n${lastFeedback}\n\n✅ CORRECTIVE ACTIONS REQUIRED:\n- Review the validation errors above carefully\n- Adjust your output to fix these specific issues\n- Ensure all constraints and targets are met\n- Double-check your calculations before responding\n${'='.repeat(80)}\n`
          : ''

        const enrichedPrompt = `${userPrompt}${feedbackSection}`

        // Calculate progressive timeout for retries based on reasoning effort
        // Base timeout depends on reasoning level: low=90s, medium=150s, high=240s
        // Then apply multiplier for retries: 1.0x, 1.5x, 2.0x
        const baseTimeoutMs = this.getTimeoutForReasoning()
        const timeoutMultiplier = 1 + (attempt - 1) * 0.5 // 1.0, 1.5, 2.0, 2.5...
        const dynamicTimeout = Math.round(baseTimeoutMs * timeoutMultiplier)

        console.log(`[BaseAgent.completeWithRetry] Attempt ${attempt}/${maxAttempts}`, {
          hasFeedback: !!lastFeedback,
          promptLength: enrichedPrompt.length,
          reasoningEffort: this.reasoningEffort,
          timeoutMs: dynamicTimeout,
          timeoutSeconds: Math.round(dynamicTimeout / 1000)
        })

        // Generate with AI (with dynamic timeout)
        const result = await this.complete<T>(enrichedPrompt, targetLanguage, dynamicTimeout)

        // Validate result (await since validation function can be async)
        const validation = await validationFn(result)

        if (validation.valid) {
          console.log(`[BaseAgent.completeWithRetry] ✅ Success on attempt ${attempt}`)
          return result
        }

        // Validation failed, prepare feedback for next attempt
        lastFeedback = validation.feedback
        console.warn(`[BaseAgent.completeWithRetry] ❌ Attempt ${attempt} validation failed:`, {
          attempt,
          feedbackLength: lastFeedback.length,
          feedbackPreview: lastFeedback.substring(0, 200)
        })

        // If this was the last attempt, throw error with full context
        if (attempt === maxAttempts) {
          throw new Error(
            `[${this.constructor.name}] AI generation failed after ${maxAttempts} attempts.\n\n` +
            `Context:\n` +
            `- Agent: ${this.constructor.name}\n` +
            `- Reasoning effort: ${this.reasoningEffort}\n` +
            `- Final attempt: ${attempt}/${maxAttempts}\n\n` +
            `Validation error:\n${lastFeedback}\n\n` +
            `The AI was unable to generate a valid result despite multiple retry attempts with corrective feedback. ` +
            `This may indicate overly strict validation constraints or an issue with the AI model.`
          )
        }

      } catch (error) {
        // If it's an AI API error (not validation), don't retry
        if (error instanceof Error && !error.message.includes('validation') && !error.message.includes('VIOLATION')) {
          console.error(`[BaseAgent.completeWithRetry] Non-validation error, aborting retry:`, error.message)
          throw error
        }

        // If it's validation error on last attempt, rethrow
        if (attempt === maxAttempts) {
          throw error
        }

        // Otherwise, extract feedback and continue to next attempt
        lastFeedback = error instanceof Error ? error.message : 'Unknown validation error'
      }
    }

    // Should never reach here
    throw new Error(`Retry loop exhausted unexpectedly`)
  }
}
