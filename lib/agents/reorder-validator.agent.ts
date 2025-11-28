import { BaseAgent } from './base.agent'

export interface ReorderValidationInput {
  originalOrder: string[]        // Exercise names in original order
  newOrder: string[]             // Proposed new order
  workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower'
  approachId: string
}

export interface ReorderValidationOutput {
  isValid: boolean
  recommendation: 'proceed' | 'caution' | 'not_recommended'
  reasoning: string
  warnings: string[]             // Issues to warn user about
  suggestions: string[]          // Better alternatives if invalid
  rationalePreview?: {           // Preview of workout flow with new order
    newSequencingRationale: string  // 1-2 sentences: WHY this new order makes sense
    keyChanges: string[]            // What changes from original order (max 3 items)
  }
}

/**
 * ReorderValidator Agent
 *
 * Validates exercise reordering decisions based on training principles
 * Extends BaseAgent to use gpt-5-nano for cost-optimized validation
 */
export class ReorderValidator extends BaseAgent {
  constructor(supabaseClient?: any) {
    super(supabaseClient, 'none', 'low') // None reasoning for instant validation (15s timeout)
    this.model = 'gpt-5-nano' // Use nano model (-50% cost for simple validation)
  }

  get systemPrompt(): string {
    return `You are a strength training expert validating exercise order changes.

Key principles:
1. Compound movements should typically come before isolation exercises
2. Fresh muscles perform better on heavy compound lifts
3. Pre-exhaustion techniques are intentional and valid in some approaches
4. Muscle fatigue affects subsequent exercise performance
5. Some reorders are for practical gym reasons (equipment busy)

Evaluate reordering based on training approach philosophy.
Provide warnings for suboptimal orders but allow user choice.
Be practical - gym logistics matter too.

CRITICAL: All output text (reasoning, warnings, suggestions, newSequencingRationale, keyChanges)
MUST be in the language specified in the LANGUAGE INSTRUCTION. Do NOT copy English examples
verbatim - adapt the content to the target language naturally.`
  }

  async validateReorder(input: ReorderValidationInput, targetLanguage?: 'en' | 'it'): Promise<ReorderValidationOutput> {
    const approach = await this.knowledge.loadApproach(input.approachId)
    const context = this.knowledge.formatContextForAI(approach, 'exercise_selection')

    // Language-specific example for warnings
    const warningExample = targetLanguage === 'it'
      ? '"Squat pesanti dopo leg extension potrebbero compromettere la forma"'
      : '"Heavy squats after leg extensions may compromise form"'

    // Language-specific example for keyChanges
    const keyChangesExample = targetLanguage === 'it'
      ? '"Isolamento prima del composto", "Catena posteriore prioritizzata"'
      : '"Isolation before compound", "Posterior chain prioritized"'

    // Language-specific example for rationalePreview
    const rationalePreviewExample = targetLanguage === 'it'
      ? `Esempio rationalePreview:
{
  "newSequencingRationale": "RDL prima enfatizza la catena posteriore quando sei fresco, poi squat punta ai quad con femorali pre-affaticati per bilanciamento.",
  "keyChanges": ["Catena posteriore prioritizzata", "Tecnica pre-esaurimento per sviluppo gambe bilanciato"]
}`
      : `Example rationalePreview:
{
  "newSequencingRationale": "RDL first emphasizes posterior chain when fresh, then squats target quads with pre-fatigued hamstrings for balance.",
  "keyChanges": ["Posterior chain prioritized", "Pre-exhaustion technique for balanced leg development"]
}`

    const prompt = `Validate this exercise reordering:

Original Order: ${input.originalOrder.join(' → ')}
New Order: ${input.newOrder.join(' → ')}
Workout Type: ${input.workoutType}

Training Approach Context:
${context}

Evaluate if the new order makes sense. Consider:
- Compound vs isolation sequencing
- Muscle fatigue patterns
- Approach-specific principles
- Safety implications
- Practical gym considerations

Determine:
- isValid: Can the user proceed?
- recommendation: "proceed" (good order), "caution" (works but suboptimal), or "not_recommended" (poor choice)
- reasoning: 2-3 sentences explaining your assessment
- warnings: Array of specific issues (e.g., ${warningExample})
- suggestions: Array of better orderings if not optimal
- rationalePreview: Help user understand the NEW workout flow
  - newSequencingRationale: 1-2 sentences (MAX 40 words) explaining WHY the NEW order makes sense or what it emphasizes
  - keyChanges: Array of 2-3 max changes from original (e.g., ${keyChangesExample})

${rationalePreviewExample}

Required JSON structure:
{
  "isValid": boolean,
  "recommendation": "proceed" | "caution" | "not_recommended",
  "reasoning": "string",
  "warnings": ["string array"],
  "suggestions": ["string array"],
  "rationalePreview": {
    "newSequencingRationale": "string (1-2 sentences, MAX 40 words)",
    "keyChanges": ["string array, max 3 items"]
  }
}
`

    return await this.complete<ReorderValidationOutput>(prompt, targetLanguage)
  }
}
