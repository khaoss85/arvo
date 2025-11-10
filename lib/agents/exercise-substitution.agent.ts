import { BaseAgent } from './base.agent'

export interface CurrentExerciseInfo {
  name: string
  equipmentVariant: string
  sets: number
  repRange: [number, number]
  targetWeight?: number
  primaryMuscles?: string[]
  secondaryMuscles?: string[]
  movementPattern?: string
  romEmphasis?: 'lengthened' | 'shortened' | 'full_range'
}

export interface SubstitutionInput {
  currentExercise: CurrentExerciseInfo
  // User context
  userId: string
  approachId: string
  weakPoints: string[]
  availableEquipment: string[]
  experienceYears?: number
  userAge?: number
  userGender?: 'male' | 'female' | 'other'
  // Session context
  mesocycleWeek?: number
  mesocyclePhase?: 'accumulation' | 'intensification' | 'deload' | 'transition'
  // Optional: reason for substitution (for future conversational expansion)
  substitutionReason?: string
}

export interface SubstitutionSuggestion {
  exercise: {
    name: string
    equipmentVariant: string
    sets: number
    repRange: [number, number]
    targetWeight: number
  }
  validation: 'approved' | 'caution' | 'not_recommended'
  rationale: string // Max 10 words: gym-friendly, quick to read
  swapImpact: string // What changes (1 sentence, max 15 words)
  similarityScore: number // 0-100: how similar to original
  rationalePreview?: {   // Preview of how new exercise integrates
    workoutIntegration: string // How new exercise fits into workout flow (1-2 sentences, MAX 40 words)
  }
}

export interface SubstitutionOutput {
  suggestions: SubstitutionSuggestion[]
  reasoning: string // Overall explanation (2-3 sentences)
}

/**
 * ExerciseSubstitutionAgent
 *
 * Provides AI-validated exercise substitution suggestions based on:
 * - Current exercise characteristics (movement, muscles, equipment)
 * - User context (weak points, experience, approach, equipment)
 * - Session context (mesocycle phase, periodization)
 *
 * Optimized for gym use: concise rationales (max 10 words), quick decisions
 */
export class ExerciseSubstitutionAgent extends BaseAgent {
  get systemPrompt() {
    return `You are an expert strength coach helping athletes substitute exercises during workouts.
Your role is to suggest intelligent alternatives that maintain workout quality while accommodating constraints.

Key Principles:
1. Match movement pattern and muscle targets as closely as possible
2. Consider equipment availability and user experience level
3. Respect the training approach philosophy
4. Prioritize weak point development when relevant
5. Adjust difficulty based on mesocycle phase
6. Be concise - gym-friendly explanations (max 10 words per rationale)

Validation Levels:
- "approved": Great substitute, maintains workout intent
- "caution": Works but changes stimulus/emphasis (explain trade-off)
- "not_recommended": Poor substitute, breaks workout logic (explain why)

Always provide 3-5 alternatives with varying equipment and difficulty.`
  }

  async suggestSubstitutions(input: SubstitutionInput): Promise<SubstitutionOutput> {
    // Load user's training approach for context
    const approach = await this.knowledge.loadApproach(input.approachId)
    const approachContext = this.knowledge.formatContextForAI(approach, 'exercise_selection')

    // Build user demographics context
    const demographicContext = input.experienceYears || input.userAge || input.userGender
      ? `User Demographics:
${input.experienceYears ? `- Training Experience: ${input.experienceYears} years` : ''}
${input.userAge ? `- Age: ${input.userAge} years old` : ''}
${input.userGender ? `- Gender: ${input.userGender}` : ''}`
      : ''

    // Build equipment context
    const equipmentContext = input.availableEquipment.length > 0
      ? `Available Equipment: ${input.availableEquipment.join(', ')}`
      : 'All equipment available'

    // Build weak points context
    const weakPointsContext = input.weakPoints.length > 0
      ? `Weak Points to Address: ${input.weakPoints.join(', ')}`
      : 'No specific weak points identified'

    // Build periodization context
    const periodizationContext = input.mesocyclePhase
      ? `Current Phase: ${input.mesocyclePhase} (Week ${input.mesocycleWeek || 'N/A'})`
      : ''

    // Build substitution reason context
    const reasonContext = input.substitutionReason
      ? `Reason for Substitution: ${input.substitutionReason}`
      : ''

    const prompt = `Generate 3-5 alternative exercises for the following substitution request:

CURRENT EXERCISE:
- Name: ${input.currentExercise.name}
- Equipment: ${input.currentExercise.equipmentVariant}
- Sets × Reps: ${input.currentExercise.sets} × ${input.currentExercise.repRange[0]}-${input.currentExercise.repRange[1]}
${input.currentExercise.targetWeight ? `- Target Weight: ${input.currentExercise.targetWeight}kg` : ''}
${input.currentExercise.primaryMuscles ? `- Primary Muscles: ${input.currentExercise.primaryMuscles.join(', ')}` : ''}
${input.currentExercise.secondaryMuscles ? `- Secondary Muscles: ${input.currentExercise.secondaryMuscles.join(', ')}` : ''}
${input.currentExercise.movementPattern ? `- Movement Pattern: ${input.currentExercise.movementPattern}` : ''}
${input.currentExercise.romEmphasis ? `- ROM Emphasis: ${input.currentExercise.romEmphasis}` : ''}

USER CONTEXT:
${equipmentContext}
${weakPointsContext}
${demographicContext}
${periodizationContext}
${reasonContext}

TRAINING APPROACH:
${approachContext}

REQUIREMENTS:
1. Provide 3-5 alternatives that vary in:
   - Equipment type (barbell, dumbbell, cable, machine, bodyweight)
   - Difficulty level (similar, easier, different stimulus)
   - Movement pattern (same vs. complementary)

2. For each alternative, provide:
   - Exercise name and equipment variant
   - Adjusted target weight (considering equipment biomechanics)
   - Validation level: "approved", "caution", or "not_recommended"
   - Brief rationale (MAX 10 words, gym-friendly, specific)
   - Swap impact (1 sentence, MAX 15 words, what changes)
   - Similarity score (0-100: how closely it matches original)
   - Rationale preview: workoutIntegration (1-2 sentences, MAX 40 words, how new exercise integrates into the overall workout flow)

3. Adjust weight recommendations based on equipment:
   - Barbell → Dumbbells: ~40-45% per hand (accounts for stability demand)
   - Barbell → Machine: ~80% (machine assistance)
   - Barbell → Cables: ~70-75% (constant tension vs. gravity)
   - Bilateral → Unilateral: ~45% per limb (bilateral deficit)

4. Consider mesocycle phase:
${input.mesocyclePhase === 'deload' ? '   - Deload: Prefer easier alternatives, lower CNS demand' : ''}
${input.mesocyclePhase === 'intensification' ? '   - Intensification: Maintain intensity, prefer similar stimuli' : ''}
${input.mesocyclePhase === 'accumulation' ? '   - Accumulation: Volume focus, variety acceptable' : ''}

5. Apply approach philosophy:
   - Respect exercise selection principles from approach
   - Prioritize weak point development if relevant
   - Match ROM emphasis when possible

6. Overall reasoning (2-3 sentences): Why these alternatives fit the workout plan

Example rationalePreview for substitution:
{
  "workoutIntegration": "Leg Press maintains quad focus like Squat but reduces lower back fatigue, fitting well after RDL in this workout."
}

Return JSON format:
{
  "suggestions": [
    {
      "exercise": {
        "name": "Exercise Name",
        "equipmentVariant": "Equipment Type",
        "sets": number,
        "repRange": [min, max],
        "targetWeight": number
      },
      "validation": "approved" | "caution" | "not_recommended",
      "rationale": "10 words max",
      "swapImpact": "15 words max",
      "similarityScore": number,
      "rationalePreview": {
        "workoutIntegration": "1-2 sentences (MAX 40 words)"
      }
    }
  ],
  "reasoning": "2-3 sentences"
}`

    return await this.complete<SubstitutionOutput>(prompt)
  }
}
