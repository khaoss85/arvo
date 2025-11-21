import { getOpenAIClient } from '@/lib/ai/client'
import { KnowledgeEngine } from '@/lib/knowledge/engine'
import type { Locale } from '@/i18n'
import { aiMetrics, getOperationType } from '@/lib/utils/ai-metrics'

export abstract class BaseAgent {
  protected openai: ReturnType<typeof getOpenAIClient>
  protected knowledge: KnowledgeEngine
  protected supabase: any
  protected reasoningEffort: 'none' | 'low' | 'medium' | 'high' = 'low'
  protected verbosity: 'low' | 'medium' | 'high' = 'low'
  protected model: string = process.env.OPENAI_MODEL || 'gpt-5-mini'
  protected lastResponseId?: string  // Track response ID for multi-turn CoT persistence

  constructor(
    supabaseClient?: any,
    reasoningEffort?: 'none' | 'low' | 'medium' | 'high',
    verbosity?: 'low' | 'medium' | 'high'
  ) {
    // Initialize OpenAI client (will only work on server due to server-only in client.ts)
    this.openai = getOpenAIClient()
    // Pass Supabase client to KnowledgeEngine for server-side usage
    this.knowledge = new KnowledgeEngine(supabaseClient)
    // Store supabase client for direct database access in agents
    this.supabase = supabaseClient
    // Configure reasoning effort (default: low for better performance)
    if (reasoningEffort) this.reasoningEffort = reasoningEffort
    // Configure verbosity (default: low for concise responses)
    if (verbosity) this.verbosity = verbosity
  }

  abstract get systemPrompt(): string

  /**
   * Get the last response ID for multi-turn CoT persistence
   * Use this to pass context between related AI calls
   */
  getLastResponseId(): string | undefined {
    return this.lastResponseId
  }

  /**
   * Reset the response ID chain (useful for starting new conversation)
   */
  resetResponseId(): void {
    this.lastResponseId = undefined
  }

  /**
   * Gets appropriate timeout based on reasoning effort level
   * Higher reasoning requires more time for AI to think through complex constraints
   * @returns Timeout in milliseconds
   */
  protected getTimeoutForReasoning(): number {
    switch (this.reasoningEffort) {
      case 'none':
        return 15000      // 15s - ultra-fast responses, no extended reasoning (GPT-5.1 fastest mode)
      case 'low':
        return 180000     // 180s (3min) - increased for complex prompts like split planning
      case 'medium':
        return 360000     // 360s (6min) - increased for complex workout generation with many constraints
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

  /**
   * Gets reasoning effort guidance for the AI
   * Helps the model budget reasoning tokens appropriately based on task complexity
   */
  protected getReasoningGuidance(): string {
    switch (this.reasoningEffort) {
      case 'none':
        return `
⚡ **REASONING GUIDANCE: None - Ultra-Fast Mode** (GPT-5.1)
This task requires immediate response with minimal latency:
- Respond instantly based on patterns and training
- No extended thinking or analysis needed
- Direct execution for well-defined tasks
- Optimized for speed-critical gym/real-time use cases
`
      case 'low':
        return `
⚡ **REASONING GUIDANCE: Low Effort Mode**
This task has clear rules but multiple constraints. Use focused reasoning:
- Systematic constraint checking (verify 3-5 key constraints)
- Direct solution generation based on approach rules
- Quick validation of outputs before finalizing
- Consider obvious alternatives if initial solution has issues
- Budget: ~30-60 seconds of thinking
`
      case 'medium':
        return `
🧠 **REASONING GUIDANCE: Medium Effort Mode**
This task has multiple interdependent constraints. Use moderate reasoning:
- Systematically verify EACH constraint (5-10 constraints)
- Consider 2-3 alternative approaches before choosing
- Calculate volume distributions explicitly (show your work)
- Verify solution against ALL constraints with step-by-step calculations
- Budget: ~90-120 seconds of thinking
- Balance speed with thoroughness
`
      case 'high':
        return `
🔬 **REASONING GUIDANCE: High Effort Mode**
This task is complex with many interdependent constraints. Use deep reasoning:
- Map out ALL constraint interactions systematically
- Explore multiple solution paths (4-6 alternatives)
- Verify solution against ALL constraints with detailed calculations
- Consider edge cases and failure modes proactively
- Explain your reasoning process step-by-step
- Budget: ~180-240 seconds of extended thinking
- Prioritize correctness over speed
`
    }
  }

  /**
   * Build caloric phase context for AI prompts
   * Extracted to BaseAgent for DRY - used by ExerciseSelector, ExerciseSubstitution, SplitPlanner, etc.
   *
   * @param caloricPhase - Current caloric phase (bulk/cut/maintenance)
   * @param caloricIntakeKcal - Daily caloric intake (kcal surplus/deficit)
   * @param hasFixedVolume - Whether the training approach has fixed or flexible volume
   * @param approachName - Name of the training approach (for examples)
   * @param approachSetsPerExercise - Approach's sets per exercise guideline (optional)
   */
  protected buildCaloricPhaseContext(
    caloricPhase: 'bulk' | 'cut' | 'maintenance' | null | undefined,
    caloricIntakeKcal?: number | null,
    hasFixedVolume: boolean = false,
    approachName: string = 'your approach',
    approachSetsPerExercise?: { working?: number } | null
  ): string {
    if (!caloricPhase) return ''

    return `
<caloric_phase_modulation>
  <current_phase>${caloricPhase.toUpperCase()}</current_phase>
  ${caloricIntakeKcal ? `<daily_intake>${caloricIntakeKcal > 0 ? 'Surplus' : 'Deficit'}: ${caloricIntakeKcal > 0 ? '+' : ''}${caloricIntakeKcal} kcal</daily_intake>` : ''}
  <approach_classification>${hasFixedVolume ? 'FIXED_VOLUME' : 'FLEXIBLE_VOLUME'}</approach_classification>

  <fundamental_rule>
    ⚠️ CRITICAL: The guidance below must be applied WITHIN your training approach's constraints (Priority 1), not as absolute rules.
    If the approach has specific volume limits or progression rules, THOSE TAKE PRIORITY over these guidelines (Priority 4).
  </fundamental_rule>

${caloricPhase === 'bulk' ? `
  <bulk_phase>
    <overview>Caloric surplus for muscle building - enhanced recovery and anabolic environment</overview>

    <volume_guidance approach_type="${hasFixedVolume ? 'FIXED_VOLUME' : 'FLEXIBLE_VOLUME'}">
      ${!hasFixedVolume ? `
      <if condition="FLEXIBLE_VOLUME">
        <strategy>Volume modulation</strategy>
        <adjustment>+15-20% higher volume compared to maintenance baseline</adjustment>
        <rationale>Enhanced recovery allows more total work within approach's framework</rationale>
        <example>If approach suggests 12-16 sets for quads → lean toward 15-16 sets</example>
      </if>
      ` : ''}

      ${hasFixedVolume ? `
      <if condition="FIXED_VOLUME">
        <strategy>Intensity modulation (volume stays FIXED)</strategy>
        <critical_rule>DO NOT increase set count - respect the approach's set limits</critical_rule>
        <instead>
          - Use heavier loads (aggressive week-to-week progression)
          - Push closer to/beyond failure (within approach's RIR targets)
          - Apply advanced techniques IF approach supports (rest-pause, drop sets, negatives)
        </instead>
        <example>${approachName} in bulk = ${approachSetsPerExercise?.working ? `still ${approachSetsPerExercise.working} sets per exercise` : 'maintain prescribed set count'}, but heavier weights + more aggressive intensity techniques</example>
      </if>
      ` : ''}
    </volume_guidance>

    <exercise_selection>
      - Compound-focused approaches → prioritize main lifts (squat, bench, deadlift variations)
      - Balanced approaches → maintain your approach's typical compound/isolation ratio
      - Follow your approach's exercise priority rules
      - Use caloric surplus as reason to push harder on approach's key exercises
    </exercise_selection>

    <rep_ranges>
      <guideline>Stay within approach's prescribed rep ranges for each exercise type</guideline>
      <if condition="approach_allows_flexibility">IF approach allows range flexibility → explore lower end for strength emphasis</if>
      <critical_rule>DO NOT change prescribed ranges; progress via LOAD, not by changing rep prescriptions</critical_rule>
      <example>If approach says 6-10 reps → use the 6-8 range more often in bulk</example>
    </rep_ranges>

    <progression_focus>
      - Aggressive load progression (this is the prime time for PRs)
      - Prioritize strength gains on approach's main movements
      - Take advantage of enhanced recovery for progressive overload
      - User has nutritional support for strength gains
    </progression_focus>
  </bulk_phase>
` : ''}
${caloricPhase === 'cut' ? `
  <cut_phase>
    <overview>Caloric deficit for fat loss while preserving muscle - compromised recovery</overview>

    <volume_guidance approach_type="${hasFixedVolume ? 'FIXED_VOLUME' : 'FLEXIBLE_VOLUME'}">
      ${!hasFixedVolume ? `
      <if condition="FLEXIBLE_VOLUME">
        <strategy>Volume reduction</strategy>
        <adjustment>-15-20% lower volume compared to maintenance baseline</adjustment>
        <principle>QUALITY over QUANTITY - fewer sets, executed with precision</principle>
        <example>If approach suggests 12-16 sets for quads → lean toward 12-13 sets</example>
      </if>
      ` : ''}

      ${hasFixedVolume ? `
      <if condition="FIXED_VOLUME">
        <strategy>Load/intensity management (volume stays FIXED)</strategy>
        <critical_rule>Maintain the prescribed set count - DO NOT reduce sets</critical_rule>
        <instead>
          - Slightly reduce load if needed to maintain perfect technique (~85-90% of bulk loads)
          - Focus on maintaining strength rather than pushing absolute limits
          - Prioritize quality of contraction over maximum weight
        </instead>
        <example>${approachName} in cut = ${approachSetsPerExercise?.working ? `still ${approachSetsPerExercise.working} sets per exercise` : 'maintain prescribed set count'}, slightly lighter loads with focus on form</example>
      </if>
      ` : ''}
    </volume_guidance>

    <exercise_selection>
      <guideline>Within your approach's exercise priority rules, favor higher stimulus-to-fatigue options when possible:</guideline>
      - Machines and cables when they fit approach's philosophy
      - Exercise variations that preserve muscle with less systemic fatigue
      - Example: If approach allows squat variations, prefer Safety Bar Squat or Leg Press over Low Bar Back Squat

      <if condition="compound_focused_approach">
        - Maintain compound focus but choose slightly less fatiguing variations
        - Safety Squat Bar, Trap Bar Deadlift, Floor Press = same movement patterns, less CNS demand
      </if>

      <rule>Respect your approach's exercise distribution rules</rule>
    </exercise_selection>

    <rep_ranges>
      <guideline>Stay within approach's prescribed rep ranges</guideline>
      <if condition="approach_allows_flexibility">Prefer middle-to-upper end (8-12 range) for muscle preservation</if>
      <critical_rule>DO NOT arbitrarily change to "hypertrophy ranges" if approach specifies different ranges</critical_rule>
      <focus>Maintain technique and muscle engagement over absolute load</focus>
    </rep_ranges>

    <progression_focus>
      - Goal: Maintain strength at ~85-90% of bulking performance
      - Expect slight strength decrease (normal and acceptable in deficit)
      - Prioritize muscle retention over load progression
      - This is NOT the time for PRs unless they happen naturally
    </progression_focus>

    <critical_principle>
      Minimum effective dose WITHIN approach's framework:
      - Apply your approach's minimum effective volume
      - Every extra set costs recovery you don't have
      - Strategic modulation is smart training
    </critical_principle>
  </cut_phase>
` : ''}
${caloricPhase === 'maintenance' ? `
  <maintenance_phase>
    <overview>Balanced caloric intake for sustainable training - optimal baseline</overview>

    <volume_guidance>
      <strategy>Apply your approach's standard baseline volume guidelines</strategy>
      <adjustment>No caloric-driven adjustments needed</adjustment>
    </volume_guidance>

    <exercise_selection>
      - Follow your approach's exercise priority rules
      - No special adjustments for caloric phase
    </exercise_selection>

    <rep_ranges>
      - Use your approach's prescribed rep ranges
      - No modifications needed
    </rep_ranges>

    <progression_focus>
      - Steady, sustainable progress within approach's progression rules
      - Focus on technique refinement and consistency
      - Sustainable long-term training
    </progression_focus>

    <principle>This is your sustainable baseline - apply your approach as designed.</principle>
  </maintenance_phase>
` : ''}
</caloric_phase_modulation>
`
  }

  /**
   * Build active insights context for AI prompts
   * Extracted to BaseAgent for DRY - used by ExerciseSelector, ExerciseSubstitution, ProgressionCalculator, etc.
   *
   * @param insights - Array of active user insights (pain, technique issues, injuries)
   */
  protected buildInsightsContext(
    insights?: Array<{
      id: string
      type: string
      severity: 'critical' | 'warning' | 'caution' | 'info'
      exerciseName?: string | null
      userNote: string
      metadata?: Record<string, any> | null
    }>
  ): string {
    if (!insights || insights.length === 0) return ''

    return `
=== ⚠️ ACTIVE USER INSIGHTS (MUST CONSIDER) ===

The user has reported the following issues that you MUST take into account:

${insights.map(insight => {
  let actionText = '';
  if (insight.severity === 'critical') {
    actionText = '🚫 CRITICAL - MUST AVOID COMPLETELY';
  } else if (insight.severity === 'warning') {
    actionText = '⚠️ WARNING - STRONGLY AVOID, FIND SUBSTITUTE';
  } else if (insight.severity === 'caution') {
    actionText = '⚡ CAUTION - PREFER ALTERNATIVE IF POSSIBLE';
  } else {
    actionText = 'ℹ️ INFO - INFORMATIONAL ONLY';
  }

  let text = `
**Insight ID: ${insight.id}**
Type: ${insight.type}
Severity: ${insight.severity} - ${actionText}
${insight.exerciseName ? `Exercise: ${insight.exerciseName}` : 'General'}
User Note: "${insight.userNote}"`;

  if (insight.metadata) {
    const meta = insight.metadata as any;
    if (meta.affectedMuscles && meta.affectedMuscles.length > 0) {
      text += `\nAffected Muscles: ${meta.affectedMuscles.join(', ')}`;
    }
    if (meta.suggestedActions && meta.suggestedActions.length > 0) {
      text += `\nSuggested Actions:\n${meta.suggestedActions.slice(0, 3).map((a: string) => `  - ${a}`).join('\n')}`;
    }
    if (meta.relatedExercises && meta.relatedExercises.length > 0) {
      text += `\nRelated Exercises: ${meta.relatedExercises.join(', ')}`;
    }
  }

  return text;
}).join('\n\n')}

**ACTION REQUIRED:**
- Document EVERY change you make due to these insights in the "insightInfluencedChanges" array
- Include the insight ID, what you changed, and why
`
  }

  /**
   * Build active memories context for AI prompts
   * Extracted to BaseAgent for DRY - used by ExerciseSelector, ExerciseSubstitution, etc.
   *
   * @param memories - Array of learned user preferences and patterns
   */
  protected buildMemoriesContext(
    memories?: Array<{
      id: string
      category: string
      title: string
      description?: string | null
      confidenceScore: number
      relatedExercises: string[]
      relatedMuscles: string[]
    }>
  ): string {
    if (!memories || memories.length === 0) return ''

    // Group memories by category
    const byCategory: Record<string, any[]> = {};
    memories.forEach(mem => {
      if (!byCategory[mem.category]) byCategory[mem.category] = [];
      byCategory[mem.category].push(mem);
    });

    return `
=== 🧠 LEARNED USER PREFERENCES & PATTERNS ===

The system has learned the following about this user's preferences:

${Object.entries(byCategory).map(([category, mems]) => {
  return `
**${category.toUpperCase()}**
${mems.map(mem => {
  const conf = (mem.confidenceScore * 100).toFixed(0);
  let confidenceLevel = '';
  if (mem.confidenceScore >= 0.8) {
    confidenceLevel = '🔥 STRONG';
  } else if (mem.confidenceScore >= 0.6) {
    confidenceLevel = '💪 MODERATE';
  } else {
    confidenceLevel = '🔹 WEAK';
  }

  let text = `- Memory ID: ${mem.id}
  ${confidenceLevel} (${conf}% confidence)
  "${mem.title}"`;

  if (mem.description) {
    text += `\n  Details: ${mem.description}`;
  }
  if (mem.relatedExercises.length > 0) {
    text += `\n  Related Exercises: ${mem.relatedExercises.join(', ')}`;
  }
  if (mem.relatedMuscles.length > 0) {
    text += `\n  Related Muscles: ${mem.relatedMuscles.join(', ')}`;
  }

  return text;
}).join('\n\n')}`;
}).join('\n')}

**ACTION REQUIRED:**
- When memories have high confidence (≥80%), PRIORITIZE those preferences strongly
- When memories have moderate confidence (60-79%), CONSIDER them as secondary factors
- Document your memory-influenced choices in "insightInfluencedChanges" array
- Include the memory ID, what you chose, and why
`
  }

  /**
   * Normalize muscle name to canonical format with fuzzy matching fallback
   * Handles anatomical variants, typos, and unknown muscle names
   *
   * @param muscleName - Raw muscle name from user input or AI output
   * @returns Canonical muscle name (or best-guess if unknown)
   */
  protected normalizeMuscleToCanonical(muscleName: string): string {
    const normalized = muscleName.toLowerCase().trim();

    // Common canonical names (extend as needed)
    const canonicalMap: Record<string, string> = {
      // Chest
      'pectorals': 'chest',
      'pecs': 'chest',
      'pectoralis major': 'chest',
      'upper chest': 'chest',
      'lower chest': 'chest',

      // Back
      'latissimus dorsi': 'lats',
      'latissimus': 'lats',
      'lat': 'lats',
      'upper back': 'upper_back',
      'middle back': 'mid_back',
      'lower back': 'lower_back',
      'erector spinae': 'lower_back',
      'trapezius': 'traps',
      'rhomboids': 'mid_back',

      // Shoulders
      'deltoids': 'delts',
      'anterior deltoid': 'front_delts',
      'lateral deltoid': 'side_delts',
      'posterior deltoid': 'rear_delts',

      // Arms
      'biceps brachii': 'biceps',
      'triceps brachii': 'triceps',
      'forearms': 'forearms',

      // Legs
      'quadriceps': 'quads',
      'quadriceps femoris': 'quads',
      'hamstrings': 'hamstrings',
      'glutes': 'glutes',
      'gluteus maximus': 'glutes',
      'calves': 'calves',
      'gastrocnemius': 'calves',
      'soleus': 'calves',

      // Core
      'abdominals': 'abs',
      'rectus abdominis': 'abs',
      'obliques': 'obliques'
    };

    // Direct match
    if (canonicalMap[normalized]) {
      return canonicalMap[normalized];
    }

    // Fuzzy matching for common patterns
    if (normalized.includes('chest') || normalized.includes('pec')) return 'chest';
    if (normalized.includes('lat')) return 'lats';
    if (normalized.includes('trap')) return 'traps';
    if (normalized.includes('delt') || normalized.includes('shoulder')) return 'delts';
    if (normalized.includes('bicep')) return 'biceps';
    if (normalized.includes('tricep')) return 'triceps';
    if (normalized.includes('quad')) return 'quads';
    if (normalized.includes('ham')) return 'hamstrings';
    if (normalized.includes('glute')) return 'glutes';
    if (normalized.includes('calf') || normalized.includes('calve')) return 'calves';
    if (normalized.includes('ab') || normalized.includes('core')) return 'abs';

    // Log unknown muscle for monitoring
    console.warn('[BaseAgent] Unknown muscle name encountered:', muscleName);

    // Return original as fallback
    return normalized;
  }

  protected async complete<T>(
    userPrompt: string,
    targetLanguage: Locale = 'en',
    customTimeoutMs?: number,
    previousResponseId?: string
  ): Promise<T> {
    try {
      console.log('🤖 [BASE_AGENT] Starting AI completion request...', {
        agentClass: this.constructor.name,
        targetLanguage,
        promptLength: userPrompt.length,
        customTimeout: customTimeoutMs ? `${customTimeoutMs}ms` : 'default',
        previousResponseId: previousResponseId || this.lastResponseId,
        timestamp: new Date().toISOString()
      })

      // Add language instruction and reasoning guidance to system prompt
      const languageInstruction = this.getLanguageInstruction(targetLanguage)
      const reasoningGuidance = this.getReasoningGuidance()

      // Combine system and user prompts for Responses API
      // GPT-5 relies on instruction following for JSON formatting (no response_format parameter)
      // Note: Preambles are handled by Responses API reasoning items (visible to developer, not in output_text)
      const combinedInput = `${this.systemPrompt}${languageInstruction}${reasoningGuidance}\n\n${userPrompt}\n\nIMPORTANT: You must respond with valid JSON only. Do not include any markdown formatting, code blocks, or explanatory text - just the raw JSON object.`

      // Add timeout safety to prevent indefinite hangs
      // Use reasoning-based timeout (15s for 'none', 90s for 'low', etc)
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

      // Use previousResponseId if provided, otherwise use last saved response ID
      // This enables multi-turn CoT persistence for +4.3% accuracy improvement (Tau-Bench verified)
      const responseIdToUse = previousResponseId || this.lastResponseId

      // Log before OpenAI call for debugging
      const aiStartTime = Date.now()
      console.log('🚀 [BASE_AGENT] Sending request to OpenAI...', {
        agent: this.constructor.name,
        model: this.model,
        reasoning: this.reasoningEffort,
        promptLength: combinedInput.length,
        timeout: AI_TIMEOUT_MS,
        timestamp: new Date().toISOString()
      })

      // Add keepalive logging to track long-running requests
      const keepaliveInterval = setInterval(() => {
        const elapsed = Math.round((Date.now() - aiStartTime) / 1000)
        console.log(`⏳ [BASE_AGENT] Still waiting for OpenAI... ${elapsed}s elapsed (timeout: ${AI_TIMEOUT_MS / 1000}s)`, {
          agent: this.constructor.name,
          model: this.model,
          reasoning: this.reasoningEffort
        })
      }, 30000) // Log every 30 seconds

      let response
      try {
        response = await Promise.race([
          this.openai.responses.create({
            model: this.model,
            input: combinedInput,
            reasoning: { effort: this.reasoningEffort },
            text: { verbosity: this.verbosity },
            ...(responseIdToUse && { previous_response_id: responseIdToUse })
          }),
          timeoutPromise
        ])
      } finally {
        clearInterval(keepaliveInterval) // Always clean up interval
      }

      const aiDuration = Date.now() - aiStartTime
      console.log('✅ [BASE_AGENT] AI response received', {
        agent: this.constructor.name,
        hasResponse: !!response,
        hasOutputText: !!response.output_text,
        outputLength: response.output_text?.length || 0,
        responseId: response.id,
        duration: `${aiDuration}ms`,
        timestamp: new Date().toISOString()
      })

      const content = response.output_text
      if (!content) throw new Error('No response from AI')

      // Save response ID for multi-turn CoT persistence
      // This enables passing reasoning context to subsequent calls (+4.3% accuracy, -30-50% CoT tokens)
      this.lastResponseId = response.id

      // Clean up any potential markdown code blocks or extra whitespace
      let cleanedContent = content.trim().replace(/^```json\n?/i, '').replace(/\n?```$/i, '')

      // Extract only the JSON object (from first { to last })
      const firstBrace = cleanedContent.indexOf('{')
      const lastBrace = cleanedContent.lastIndexOf('}')

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1)
      }

      // Remove control characters from the JSON string
      // This handles cases where the AI response contains literal newlines, tabs, etc.
      // Control chars between JSON structural elements are just whitespace
      // Control chars inside string values (if any) will be removed to preserve JSON validity
      cleanedContent = cleanedContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')

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
   * Complete AI request with Structured Outputs (JSON Schema validation by OpenAI)
   * This method uses chat.completions.create() instead of responses.create()
   * to leverage OpenAI's Structured Outputs feature which guarantees valid JSON.
   *
   * According to GPT-5.1 Prompting Guide:
   * - Structured Outputs work with chat.completions API (not responses API)
   * - JSON is always valid (guaranteed by OpenAI)
   * - Can use reasoning: 'none' for 50% faster responses
   * - ~70% cost reduction (no reasoning tokens)
   *
   * @param userPrompt - The user prompt to send to AI
   * @param jsonSchema - JSON Schema for strict structured output validation
   * @param targetLanguage - Target language for responses
   * @param customTimeoutMs - Optional custom timeout
   * @returns Validated AI result (guaranteed to match schema)
   */
  protected async completeWithStructuredOutput<T>(
    userPrompt: string,
    jsonSchema: {
      name: string
      strict?: boolean
      schema: Record<string, any>
    },
    targetLanguage: Locale = 'en',
    customTimeoutMs?: number
  ): Promise<T> {
    try {
      console.log('🤖 [BASE_AGENT] Starting Structured Output AI request...', {
        agentClass: this.constructor.name,
        targetLanguage,
        schemaName: jsonSchema.name,
        promptLength: userPrompt.length,
        customTimeout: customTimeoutMs ? `${customTimeoutMs}ms` : 'default',
        timestamp: new Date().toISOString()
      })

      // Add language instruction to system prompt
      // No reasoning guidance needed - we're using reasoning: 'none' for speed
      const languageInstruction = this.getLanguageInstruction(targetLanguage)

      // For structured outputs, add planning guidance (per GPT-5.1 guide)
      const planningGuidance = `\n\n⚡ PLANNING GUIDANCE: You MUST plan extensively before generating the JSON output, ensuring all constraints are met and the JSON is valid. Verify the JSON structure matches the schema exactly before responding.`

      const systemPrompt = `${this.systemPrompt}${languageInstruction}${planningGuidance}`

      // Timeout based on reasoning effort (or custom)
      const AI_TIMEOUT_MS = customTimeoutMs || this.getTimeoutForReasoning()
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(
            `Structured Output AI request timeout after ${AI_TIMEOUT_MS / 1000}s. ` +
            `Agent: ${this.constructor.name}, Schema: ${jsonSchema.name}`
          ))
        }, AI_TIMEOUT_MS)
      })

      // Use chat.completions.create() with Structured Outputs
      // Per GPT-5.1 guide: use reasoning 'none' or 'low' for best performance with structured outputs
      const response = await Promise.race([
        this.openai.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: jsonSchema.name,
              strict: jsonSchema.strict ?? true, // Default to strict mode
              schema: jsonSchema.schema
            }
          },
          // Use reasoning 'none' for speed (50% faster, 70% cheaper)
          // Structured Outputs guarantees JSON validity, so we don't need heavy reasoning
          ...(this.reasoningEffort !== 'none' && {
            // Only include reasoning if using o1/o3-mini models
            // For gpt-5.1, reasoning is controlled via prompt
          })
        }),
        timeoutPromise
      ])

      console.log('✅ [BASE_AGENT] Structured Output AI response received', {
        hasResponse: !!response,
        hasChoices: !!response.choices?.[0],
        hasContent: !!response.choices?.[0]?.message?.content,
        responseId: response.id
      })

      const content = response.choices?.[0]?.message?.content
      if (!content) throw new Error('No response from AI')

      // Parse JSON (guaranteed to be valid by Structured Outputs)
      return JSON.parse(content) as T

    } catch (error) {
      console.error('🔴 [BASE_AGENT] Structured Output AI error:', {
        agent: this.constructor.name,
        schemaName: jsonSchema.name,
        errorName: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        isTimeout: error instanceof Error && error.message.includes('timeout'),
        timestamp: new Date().toISOString()
      })

      if (error instanceof Error) {
        error.message = `[${this.constructor.name}] ${error.message}`
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
   * @param previousResponseId - Optional previous response ID for multi-turn CoT
   * @returns Validated AI result
   * @throws Error if all attempts fail validation
   */
  protected async completeWithRetry<T>(
    userPrompt: string,
    validationFn: (result: T) => Promise<{ valid: boolean; feedback: string }> | { valid: boolean; feedback: string },
    maxAttempts: number = 3,
    targetLanguage: Locale = 'en',
    previousResponseId?: string
  ): Promise<T> {
    let lastFeedback = ''

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const startTime = Date.now()

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
          timeoutSeconds: Math.round(dynamicTimeout / 1000),
          previousResponseId: previousResponseId || this.lastResponseId
        })

        // Generate with AI (with dynamic timeout)
        // Pass previousResponseId for multi-turn CoT persistence (only on first attempt)
        const result = await this.complete<T>(
          enrichedPrompt,
          targetLanguage,
          dynamicTimeout,
          attempt === 1 ? previousResponseId : undefined  // Only use on first attempt
        )

        // Validate result (await since validation function can be async)
        const validation = await validationFn(result)

        const latencyMs = Date.now() - startTime

        if (validation.valid) {
          console.log(`[BaseAgent.completeWithRetry] ✅ Success on attempt ${attempt}`)

          // Track successful attempt
          aiMetrics.track({
            agentName: this.constructor.name,
            operationType: getOperationType(this.constructor.name),
            reasoningEffort: this.reasoningEffort,
            model: this.model,
            attemptNumber: attempt,
            maxAttempts,
            success: true,
            latencyMs,
            timestamp: new Date().toISOString()
          })

          return result
        }

        // Validation failed, prepare feedback for next attempt
        lastFeedback = validation.feedback
        console.warn(`[BaseAgent.completeWithRetry] ❌ Attempt ${attempt} validation failed:`, {
          attempt,
          feedbackLength: lastFeedback.length,
          feedbackPreview: lastFeedback.substring(0, 200)
        })

        // Track failed attempt
        aiMetrics.track({
          agentName: this.constructor.name,
          operationType: getOperationType(this.constructor.name),
          reasoningEffort: this.reasoningEffort,
          model: this.model,
          attemptNumber: attempt,
          maxAttempts,
          success: false,
          latencyMs,
          failureReason: 'Validation failed',
          validationErrors: [validation.feedback.substring(0, 500)], // Truncate for storage
          timestamp: new Date().toISOString()
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
        const latencyMs = Date.now() - startTime

        // Track error (API failure, timeout, or validation error on last attempt)
        aiMetrics.track({
          agentName: this.constructor.name,
          operationType: getOperationType(this.constructor.name),
          reasoningEffort: this.reasoningEffort,
          model: this.model,
          attemptNumber: attempt,
          maxAttempts,
          success: false,
          latencyMs,
          failureReason: error instanceof Error ? error.message.substring(0, 200) : 'Unknown error',
          timestamp: new Date().toISOString()
        })

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
