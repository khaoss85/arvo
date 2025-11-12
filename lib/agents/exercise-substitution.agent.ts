import { BaseAgent } from './base.agent'
import { ExerciseGenerationService } from '../services/exercise-generation.service'

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
  caloricPhase?: 'bulk' | 'cut' | 'maintenance'
  caloricIntakeKcal?: number | null  // Daily caloric surplus (+) or deficit (-)
  // Optional: reason for substitution (for future conversational expansion)
  substitutionReason?: string
  // Active insights and memories (NEW)
  activeInsights?: Array<{
    id: string
    exerciseName?: string
    type: string
    severity: string
    userNote: string
  }>
  activeMemories?: Array<{
    id: string
    category: string
    title: string
    confidenceScore: number
    relatedExercises: string[]
  }>
}

export interface CustomSubstitutionInput extends SubstitutionInput {
  customExerciseName: string // User's proposed exercise name or natural language description
  userIntent?: string // Optional: additional context about why they want this specific exercise
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

  async suggestSubstitutions(input: SubstitutionInput, targetLanguage?: 'en' | 'it'): Promise<SubstitutionOutput> {
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

    // Build caloric phase context
    const caloricPhaseContext = input.caloricPhase
      ? `Caloric Phase: ${input.caloricPhase.toUpperCase()}${input.caloricIntakeKcal ? ` (${input.caloricIntakeKcal > 0 ? '+' : ''}${input.caloricIntakeKcal} kcal/day)` : ''}`
      : ''

    // Build substitution reason context
    const reasonContext = input.substitutionReason
      ? `Reason for Substitution: ${input.substitutionReason}`
      : ''

    // Build insights context - filter out exercises with issues
    const insightsContext = input.activeInsights && input.activeInsights.length > 0
      ? `
=== ⚠️ ACTIVE USER INSIGHTS (FILTER SUGGESTIONS) ===

The user has reported the following issues. DO NOT suggest exercises with similar problems:

${input.activeInsights.map(insight => `
- ${insight.exerciseName || 'General'} (${insight.severity}): "${insight.userNote}"
  ${insight.severity === 'critical' || insight.severity === 'warning' ? '🚨 AVOID similar exercises completely' : '⚠️ Be cautious with similar movements'}
`).join('\n')}
`
      : '';

    // Build memories context - prioritize preferences
    const memoriesContext = input.activeMemories && input.activeMemories.length > 0
      ? `
=== 🧠 LEARNED USER PREFERENCES ===

The user has shown these equipment/exercise preferences (PRIORITIZE IN SUGGESTIONS):

${input.activeMemories.filter(m => m.confidenceScore >= 0.6).map(mem => `
- ${mem.title} (${(mem.confidenceScore * 100).toFixed(0)}% confidence)
  ${mem.relatedExercises.length > 0 ? `Related: ${mem.relatedExercises.join(', ')}` : ''}
  ${mem.confidenceScore >= 0.8 ? '🔥 STRONG preference - prioritize highly' : '💪 Moderate preference'}
`).join('\n')}
`
      : '';

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
${caloricPhaseContext}
${reasonContext}
${insightsContext}
${memoriesContext}

TRAINING APPROACH:
${approachContext}

**HIERARCHY OF CONSTRAINTS:**
1. 🏆 TRAINING APPROACH PHILOSOPHY (non-negotiable)
2. 🎯 Periodization phase (if applicable)
3. 🍽️ Caloric phase (modulate within approach's framework)
4. 🎨 User insights and preferences (filter bad options, boost good ones)

⚠️ CONFLICT RESOLUTION:
When suggesting substitutions, if caloric phase or other context conflicts with approach philosophy, THE APPROACH WINS.
Example: Heavy Duty approach + CUT → Don't suggest 3-4 sets when approach says 1-2 max

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

5. Consider caloric phase (APPROACH-AWARE MODULATION):
${input.caloricPhase === 'cut' ? `   - CUT: Within approach constraints, prioritize high stimulus-to-fatigue alternatives:
     * IF approach allows equipment flexibility: Prefer machines > free weights, cables > barbells
     * IF approach mandates specific equipment: Stay within approach's equipment philosophy, adjust intensity
     * Example (flexible approach): Suggest Leg Press over Squat, Machine Press over Barbell Bench
     * Example (barbell-focused approach): Keep barbell variations, suggest reduced volume or lighter intensity` : ''}
${input.caloricPhase === 'bulk' ? `   - BULK: Within approach constraints, favor intensity and progressive overload:
     * IF approach allows equipment variety: Suggest compound free weights when appropriate
     * IF approach has fixed equipment rules: Respect those rules, suggest intensity increases
     * DO NOT suggest adding sets/exercises if approach has fixed volume constraints` : ''}
${input.caloricPhase === 'maintenance' ? '   - MAINTENANCE: Balanced suggestions within approach framework, no special bias' : ''}

6. Apply approach philosophy (PRIMARY CONSTRAINT):
   - Respect exercise selection principles from approach
   - Prioritize weak point development if relevant
   - Match ROM emphasis when possible

7. Overall reasoning (2-3 sentences): Why these alternatives fit the workout plan

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

    return await this.complete<SubstitutionOutput>(prompt, targetLanguage)
  }

  async validateCustomSubstitution(input: CustomSubstitutionInput, targetLanguage?: 'en' | 'it'): Promise<SubstitutionSuggestion> {
    // First, check if a similar exercise already exists in the database
    // This ensures naming consistency and prevents duplicates
    const similarExercises = await ExerciseGenerationService.searchByNameServer(
      this.supabase,
      input.customExerciseName,
      input.userId,
      10
    )

    // If we found a close match (>80% similarity based on fuzzy search),
    // reuse the existing exercise name for consistency
    if (similarExercises.length > 0) {
      const existingExercise = similarExercises[0]

      // Return validation using the existing standardized name
      return {
        exercise: {
          name: existingExercise.name,
          equipmentVariant: (existingExercise.metadata as any)?.equipment_variant || 'Unknown',
          sets: input.currentExercise.sets,
          repRange: input.currentExercise.repRange,
          targetWeight: input.currentExercise.targetWeight || 0
        },
        validation: 'approved',
        rationale: `Using existing exercise: ${existingExercise.name}`,
        swapImpact: 'Reusing established exercise for consistency',
        similarityScore: 95,
        rationalePreview: {
          workoutIntegration: `This exercise maintains your training history and progression tracking.`
        }
      }
    }

    // If no match found, proceed with AI validation to create new exercise
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

    // Build caloric phase context
    const caloricPhaseContext = input.caloricPhase
      ? `Caloric Phase: ${input.caloricPhase.toUpperCase()}${input.caloricIntakeKcal ? ` (${input.caloricIntakeKcal > 0 ? '+' : ''}${input.caloricIntakeKcal} kcal/day)` : ''}`
      : ''

    // Build user intent context
    const intentContext = input.userIntent
      ? `User's Reason: ${input.userIntent}`
      : ''

    const prompt = `Validate a user's custom exercise substitution proposal:

CURRENT EXERCISE:
- Name: ${input.currentExercise.name}
- Equipment: ${input.currentExercise.equipmentVariant}
- Sets × Reps: ${input.currentExercise.sets} × ${input.currentExercise.repRange[0]}-${input.currentExercise.repRange[1]}
${input.currentExercise.targetWeight ? `- Target Weight: ${input.currentExercise.targetWeight}kg` : ''}
${input.currentExercise.primaryMuscles ? `- Primary Muscles: ${input.currentExercise.primaryMuscles.join(', ')}` : ''}
${input.currentExercise.secondaryMuscles ? `- Secondary Muscles: ${input.currentExercise.secondaryMuscles.join(', ')}` : ''}
${input.currentExercise.movementPattern ? `- Movement Pattern: ${input.currentExercise.movementPattern}` : ''}
${input.currentExercise.romEmphasis ? `- ROM Emphasis: ${input.currentExercise.romEmphasis}` : ''}

USER'S PROPOSED EXERCISE:
"${input.customExerciseName}"
${intentContext}

USER CONTEXT:
${equipmentContext}
${weakPointsContext}
${demographicContext}
${periodizationContext}
${caloricPhaseContext}

TRAINING APPROACH:
${approachContext}

YOUR TASK:
1. Interpret user's input (could be exact exercise name OR natural language description)
   - If natural language (e.g., "something easier on my elbows"), infer the specific exercise they likely want
   - If gibberish or unclear, return "not_recommended" with helpful guidance

2. Validate if it's a good substitute:
   - "approved": Excellent choice, maintains or improves workout quality
   - "caution": Works but has trade-offs (explain WHAT changes and WHY it matters - e.g., "Less stabilizer work" or "Changes angle emphasis")
   - "not_recommended": Poor choice (explain why: wrong muscle group, unsafe, equipment missing, etc.)

3. Calculate adjusted weight (considering equipment biomechanics):
   - Barbell → Dumbbells: ~40-45% per hand
   - Barbell → Machine: ~80%
   - Barbell → Cables: ~70-75%
   - Bilateral → Unilateral: ~45% per limb
   - If user's proposed exercise is invalid/gibberish, set weight to 0

4. Provide concise, gym-friendly feedback:
   - Rationale: MAX 10 words, explain why this works or doesn't
     * For "caution": state the specific trade-off (e.g., "Less stabilizer work" or "Changes angle emphasis")
   - Swap Impact: MAX 15 words, what changes compared to original
   - Similarity Score: 0-100 (how close to original exercise)
   - Workout Integration: MAX 40 words, how it fits into the workout flow

5. Handle edge cases:
   - Gibberish → "Invalid exercise name, can't identify movement"
   - Wrong muscle group → "Wrong muscle group, breaks workout plan"
   - Dangerous exercise → "Higher injury risk, consider safer alternative"
   - Equipment unavailable → "Requires X equipment not available, try Y instead"
   - Natural language → Interpret intent and suggest specific exercise

EXAMPLES:

Input: "Incline Dumbbell Press" (for Barbell Bench Press)
Output: {
  "validation": "approved",
  "exercise": { "name": "Incline Dumbbell Press", "equipmentVariant": "Dumbbell", "targetWeight": 35 },
  "rationale": "Better ROM for upper chest development",
  "swapImpact": "Increased stability demand but improved stretch",
  "similarityScore": 85,
  "rationalePreview": { "workoutIntegration": "Maintains pressing volume while emphasizing upper chest weak point with deeper ROM" }
}

Input: "something easier on my shoulders" (for Overhead Press)
Output: {
  "validation": "approved",
  "exercise": { "name": "Cable Shoulder Press", "equipmentVariant": "Cable", "targetWeight": 55 },
  "rationale": "Constant tension, reduced shoulder stress",
  "swapImpact": "Smoother resistance curve, easier on joints",
  "similarityScore": 75,
  "rationalePreview": { "workoutIntegration": "Cable variation provides smooth pressing motion with less joint stress while maintaining shoulder development" }
}

Input: "Smith Machine Bench Press" (for Barbell Bench Press)
Output: {
  "validation": "caution",
  "exercise": { "name": "Smith Machine Bench Press", "equipmentVariant": "Smith Machine", "targetWeight": 75 },
  "rationale": "Fixed bar path reduces stabilizer work",
  "swapImpact": "Easier to control but less functional strength",
  "similarityScore": 65,
  "rationalePreview": { "workoutIntegration": "Smith machine allows heavier load and safer solo training but reduces core and stabilizer engagement compared to free weights" }
}

Input: "asdf" (gibberish)
Output: {
  "validation": "not_recommended",
  "exercise": { "name": "Invalid Input", "equipmentVariant": "Unknown", "targetWeight": 0 },
  "rationale": "Invalid exercise name, can't identify",
  "swapImpact": "Can't validate unknown exercise",
  "similarityScore": 0,
  "rationalePreview": { "workoutIntegration": "Try typing a specific exercise name like 'Dumbbell Press' or select from AI suggestions below" }
}

Input: "Leg Press" (for Bench Press - wrong muscle group)
Output: {
  "validation": "not_recommended",
  "exercise": { "name": "Leg Press", "equipmentVariant": "Machine", "targetWeight": 0 },
  "rationale": "Wrong muscle group for chest workout",
  "swapImpact": "Completely breaks workout plan, targets legs",
  "similarityScore": 0,
  "rationalePreview": { "workoutIntegration": "This would skip chest work entirely. Consider pressing movements instead." }
}

Return JSON format (SINGLE suggestion, not array):
{
  "exercise": {
    "name": "Exercise Name (cleaned/standardized)",
    "equipmentVariant": "Equipment Type",
    "sets": number (keep same as original),
    "repRange": [min, max] (keep same as original),
    "targetWeight": number (adjusted for equipment)
  },
  "validation": "approved" | "caution" | "not_recommended",
  "rationale": "10 words max",
  "swapImpact": "15 words max",
  "similarityScore": number,
  "rationalePreview": {
    "workoutIntegration": "1-2 sentences (MAX 40 words)"
  }
}`

    return await this.complete<SubstitutionSuggestion>(prompt, targetLanguage)
  }
}
