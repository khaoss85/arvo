import { BaseAgent } from './base.agent'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { ExerciseGenerationService, type ExerciseMetadata } from '@/lib/services/exercise-generation.service'
import { findEquipmentById } from '@/lib/constants/equipment-taxonomy'
import { AnimationService } from '@/lib/services/animation.service'

export interface ExerciseSelectionInput {
  workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body'
  weakPoints: string[]
  equipmentPreferences?: Record<string, string> // DEPRECATED: Use availableEquipment
  availableEquipment?: string[] // New multiselect equipment array
  recentExercises: string[]
  approachId: string
  userId?: string | null // For exercise tracking consistency
  skipSaving?: boolean // Skip saving exercises to database (for onboarding performance)
  // User demographics for personalized exercise selection
  experienceYears?: number | null
  userAge?: number | null
  userGender?: 'male' | 'female' | 'other' | null
  // Split context (optional)
  sessionFocus?: string[] // Muscle groups for this session
  targetVolume?: Record<string, number> // Target sets per muscle
  sessionPrinciples?: string[] // Principles to emphasize
  // Periodization context
  mesocycleWeek?: number | null
  mesocyclePhase?: 'accumulation' | 'intensification' | 'deload' | 'transition' | null
  // Insights and Memories (NEW)
  activeInsights?: Array<{
    id: string
    type: string
    severity: string
    exerciseName?: string
    userNote: string
    metadata?: any
  }>
  activeMemories?: Array<{
    id: string
    category: string
    title: string
    description?: string
    confidenceScore: number
    relatedExercises: string[]
    relatedMuscles: string[]
  }>
}

export interface WarmupSet {
  setNumber: number
  weightPercentage: number  // % of target weight (e.g., 50, 65)
  weight: number            // Calculated weight
  reps: number
  rir: number
  restSeconds: number
  technicalFocus?: string
}

export interface SetGuidance {
  setNumber: number         // Set number (1-based, refers to working sets)
  technicalFocus?: string  // What to focus on technically (e.g., "Full range of motion", "Squeeze at top")
  mentalFocus?: string     // Mindset/mental approach (e.g., "Stay controlled, no rushing", "Push through discomfort")
}

export interface SelectedExercise {
  name: string
  equipmentVariant: string
  sets: number
  repRange: [number, number]
  restSeconds: number
  tempo?: string // Tempo prescription from approach (e.g., "3-1-1-1")
  rationaleForSelection: string
  alternatives: string[]
  // Metadata for exercise generation tracking
  primaryMuscles?: string[]
  secondaryMuscles?: string[]
  movementPattern?: string
  romEmphasis?: 'lengthened' | 'shortened' | 'full_range'
  unilateral?: boolean
  // Technical guidance for execution
  technicalCues?: string[] // 2-4 brief, actionable technical cues for proper form
  warmupSets?: WarmupSet[] // Warm-up progression before working sets (only for compound movements)
  setGuidance?: SetGuidance[] // Per-set technical and mental focus for working sets
  // Visual guidance (populated automatically by AnimationService)
  animationUrl?: string | null
  hasAnimation?: boolean
}

export interface InsightInfluencedChange {
  source: 'insight' | 'memory'
  sourceId: string
  sourceTitle: string
  action: 'avoided' | 'substituted' | 'preferred' | 'adjusted'
  originalExercise?: string
  selectedExercise?: string
  reason: string
}

export interface ExerciseSelectionOutput {
  exercises: SelectedExercise[]
  workoutRationale: string
  weakPointAddress: string
  insightInfluencedChanges?: InsightInfluencedChange[] // NEW: Track changes made due to insights/memories
}

export class ExerciseSelector extends BaseAgent {
  protected supabase: any

  constructor(supabaseClient?: any) {
    super(supabaseClient)
    this.supabase = supabaseClient || getSupabaseBrowserClient()
  }

  get systemPrompt() {
    return `You are a bodybuilding coach creating workout plans.
Select exercises based on the training approach, user preferences, and weak points.
Prioritize exercise order based on approach philosophy.
Consider equipment preferences and provide alternatives.

**IMPORTANT: You must also consider user insights and learned memories:**

When you encounter INSIGHTS (pain, injuries, issues):
- severity: critical → MUST avoid exercise completely
- severity: warning → Strongly avoid, substitute if possible
- severity: caution → Prefer alternative, but can include if necessary with modifications
- severity: info → Informational only, no action needed

When you encounter MEMORIES (learned preferences and patterns):
- confidence ≥ 0.8 → Strong preference, prioritize heavily
- confidence 0.6-0.79 → Moderate preference, consider when appropriate
- confidence < 0.6 → Weak signal, use as tie-breaker

**OUTPUT REQUIREMENT:**
You MUST include an "insightInfluencedChanges" array in your output documenting:
- Every exercise you avoided due to an insight
- Every substitution you made
- Every preference you followed from memories
- The specific insight/memory ID and reason

Format:
{
  "exercises": [...],
  "workoutRationale": "...",
  "weakPointAddress": "...",
  "insightInfluencedChanges": [
    {
      "source": "insight" | "memory",
      "sourceId": "uuid",
      "sourceTitle": "description of the insight/memory",
      "action": "avoided" | "substituted" | "preferred" | "adjusted",
      "originalExercise": "optional - if substituted",
      "selectedExercise": "the exercise selected",
      "reason": "why you made this change"
    }
  ]
}

Make user safety and preferences your top priority.`
  }

  async selectExercises(input: ExerciseSelectionInput): Promise<ExerciseSelectionOutput> {
    const approach = await this.knowledge.loadApproach(input.approachId)
    const context = this.knowledge.formatContextForAI(approach, 'exercise_selection')

    // Load user's recently used exercises for naming consistency
    const recentExercises = input.userId
      ? await ExerciseGenerationService.getRecentlyUsedServer(this.supabase, input.userId, 20)
      : []

    const demographicContext = input.experienceYears || input.userAge || input.userGender
      ? `
User Demographics:
${input.experienceYears ? `- Training Experience: ${input.experienceYears} years` : ''}
${input.userAge ? `- Age: ${input.userAge} years old` : ''}
${input.userGender ? `- Gender: ${input.userGender}` : ''}
`
      : ''

    // Build exercise selection principles context if available
    const exercisePrinciplesContext = approach.exerciseSelectionPrinciples
      ? `
Exercise Selection Principles:
${approach.exerciseSelectionPrinciples.movementPatterns ? `
Movement Patterns Available:
${JSON.stringify(approach.exerciseSelectionPrinciples.movementPatterns, null, 2)}
` : ''}
${approach.exerciseSelectionPrinciples.unilateralRequirements ? `
Unilateral Requirements:
- Minimum per workout: ${approach.exerciseSelectionPrinciples.unilateralRequirements.minPerWorkout}
- Target muscles: ${approach.exerciseSelectionPrinciples.unilateralRequirements.targetMuscles.join(', ')}
- Rationale: ${approach.exerciseSelectionPrinciples.unilateralRequirements.rationale}
` : ''}
${approach.exerciseSelectionPrinciples.compoundToIsolationRatio ? `
Compound/Isolation Ratio:
- Compound: ${approach.exerciseSelectionPrinciples.compoundToIsolationRatio.compound}%
- Isolation: ${approach.exerciseSelectionPrinciples.compoundToIsolationRatio.isolation}%
- Rationale: ${approach.exerciseSelectionPrinciples.compoundToIsolationRatio.rationale}
` : ''}
`
      : ''

    const romEmphasisContext = approach.romEmphasis
      ? `
ROM Emphasis Guidelines:
- Lengthened-biased exercises: ${approach.romEmphasis.lengthened}%
- Shortened-biased exercises: ${approach.romEmphasis.shortened}%
- Full-range exercises: ${approach.romEmphasis.fullRange}%
Principles:
${approach.romEmphasis.principles.map(p => `- ${p}`).join('\n')}
`
      : ''

    const stimulusToFatigueContext = approach.stimulusToFatigue
      ? `
Stimulus-to-Fatigue Considerations:
${approach.stimulusToFatigue.principles.map(p => `- ${p}`).join('\n')}
${approach.stimulusToFatigue.applicationGuidelines ? `\nApplication: ${approach.stimulusToFatigue.applicationGuidelines}` : ''}
`
      : ''

    // Build periodization context
    const periodizationContext = approach.periodization && input.mesocyclePhase
      ? `
=== PERIODIZATION CONTEXT ===
Current Mesocycle: Week ${input.mesocycleWeek || '?'} - ${input.mesocyclePhase.toUpperCase()} Phase

${input.mesocyclePhase === 'accumulation' ? `
Phase Focus: Volume accumulation and progressive overload
Exercise Selection Strategy:
- Balance of compound and isolation exercises
- Standard exercise variations
- Focus on technical mastery and building work capacity
` : ''}
${input.mesocyclePhase === 'intensification' ? `
Phase Focus: Intensity and quality over volume
Exercise Selection Strategy:
- PRIORITIZE high stimulus-to-fatigue exercises (machines, cables)
- Favor isolation over heavy compounds
- Select exercises that allow pushing to/beyond failure safely
- This is when advanced techniques (drop sets, myoreps, rest-pause) are most appropriate
Advanced Techniques Available (from approach):
${approach.advancedTechniques ? Object.entries(approach.advancedTechniques).map(([name, t]: [string, any]) => `- ${name}: ${t.when || 'N/A'}`).join('\n') : 'None specified'}
` : ''}
${input.mesocyclePhase === 'deload' ? `
Phase Focus: Active recovery and maintenance
Exercise Selection Strategy:
- Maintain same exercises as previous weeks
- Focus on movement quality over load
- User will perform significantly reduced volume
` : ''}
`
      : ''

    // Build session context if provided (for split-based workouts)
    const sessionContext = input.sessionFocus || input.targetVolume || input.sessionPrinciples
      ? `
=== SESSION CONTEXT ===
${input.sessionFocus ? `Muscle Groups Focus: ${input.sessionFocus.join(', ')}` : ''}
${input.targetVolume ? `Target Volume per Muscle: ${JSON.stringify(input.targetVolume, null, 2)}` : ''}
${input.sessionPrinciples ? `Session Principles:\n${input.sessionPrinciples.map(p => `- ${p}`).join('\n')}` : ''}
`
      : ''

    const prompt = `
Create a ${input.workoutType} workout using AI-generated exercises.

Approach context:
${context}
${demographicContext}
${exercisePrinciplesContext}
${romEmphasisContext}
${stimulusToFatigueContext}
${periodizationContext}
${sessionContext}

User weak points: ${input.weakPoints.join(', ') || 'None specified'}

Available Equipment:
${input.availableEquipment && input.availableEquipment.length > 0
  ? input.availableEquipment.map((id: string) => {
      const equipment = findEquipmentById(id)
      return equipment ? `- ${equipment.label} (${equipment.commonFor.join(', ')})` : `- ${id}`
    }).join('\n')
  : input.equipmentPreferences
    ? `DEPRECATED FORMAT: ${JSON.stringify(input.equipmentPreferences)}`
    : 'No equipment specified - use bodyweight exercises or basic equipment'}

When selecting exercises, you may use ANY of the available equipment above. Choose equipment that:
1. Matches the movement pattern requirements
2. Aligns with the training approach philosophy
3. Provides variety across the workout
4. Optimizes stimulus-to-fatigue ratio based on the current phase

Recent exercises to avoid: ${input.recentExercises.join(', ') || 'None'}

${recentExercises.length > 0 ? `
=== PREVIOUSLY USED EXERCISES (for naming consistency) ===
The user has previously performed these exercises. When selecting the SAME exercise for this workout, REUSE THE EXACT NAME to maintain training history and progression tracking:

${recentExercises.map(ex => `- ${ex.name}${ex.metadata?.equipment_variant ? ` (${ex.metadata.equipment_variant})` : ''}`).join('\n')}

IMPORTANT: Only create a new exercise name if the exercise is truly different from the ones listed above. Naming consistency is crucial for tracking progress over time.
` : ''}

${input.experienceYears ? `Consider that the user has ${input.experienceYears} years of experience - beginners benefit from simpler compound movements, advanced lifters can handle more variation and volume.` : ''}
${input.userAge && input.userAge > 50 ? `Consider that the user is ${input.userAge} years old - prioritize joint-friendly exercise variations when possible.` : ''}

IMPORTANT: Generate exercises from first principles based on the approach philosophy above.
Do NOT rely on a pre-existing exercise database. Create exercise names that are:
- Descriptive (e.g., "Incline Dumbbell Press" not "Exercise 1")
- Specific to equipment variant
- Anatomically accurate
- Consistent with standard exercise nomenclature

For each exercise, also provide:
- primaryMuscles: array of primary muscles worked
- secondaryMuscles: array of secondary muscles
- movementPattern: the movement type (e.g., "horizontal_push", "vertical_pull", "squat", "hinge")
- romEmphasis: "lengthened", "shortened", or "full_range"
- unilateral: true if single-limb exercise
- technicalCues: 2-4 brief, actionable technical cues for proper form
  * Keep cues SHORT and CLEAR (max 8-10 words each)
  * Make them ACTIONABLE and easy to remember in the gym
  * Tailor to the approach philosophy (e.g., Kuba Method emphasizes stretch, contraction, ROM)
  * Examples: "Semi-bent arms throughout the movement", "Squeeze pecs hard at top", "Avoid lockout on elbows"
- warmupSets: ONLY for compound movements (squat, deadlift, bench, overhead press, rows), provide 2 warmup sets:
  * Set 1: 50% weight, 15 reps, RIR 5, 60s rest, technicalFocus: "Feel the movement pattern"
  * Set 2: 65% weight, 12 reps, RIR 3, 90s rest, technicalFocus: "Build mind-muscle connection"
  * Isolation exercises (curls, raises, flyes) do NOT need warmup sets
- setGuidance: For ALL exercises, provide per-set technical and mental focus for EACH working set:
  * technicalFocus: What to focus on technically (e.g., "Full ROM", "Squeeze at top", "Control the eccentric")
  * mentalFocus: Mental approach for that set (e.g., "Stay controlled", "Push through fatigue", "Quality over speed")
  * Progression across sets: early sets focus on technique, later sets on intensity and mental toughness
  * Keep VERY brief (max 5-6 words each)

Select 4-6 exercises following the approach philosophy.


${input.activeInsights && input.activeInsights.length > 0 ? `
=== ⚠️ ACTIVE USER INSIGHTS (MUST CONSIDER) ===

The user has reported the following issues that you MUST take into account:

${input.activeInsights.map(insight => {
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
` : ''}

${input.activeMemories && input.activeMemories.length > 0 ? `
=== 🧠 LEARNED USER PREFERENCES & PATTERNS ===

The system has learned the following about this user's preferences:

${(() => {
  // Group memories by category
  const byCategory: Record<string, any[]> = {};
  input.activeMemories!.forEach(mem => {
    if (!byCategory[mem.category]) byCategory[mem.category] = [];
    byCategory[mem.category].push(mem);
  });

  return Object.entries(byCategory).map(([category, memories]) => {
    return `
**${category.toUpperCase()}**
${memories.map(mem => {
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
  }).join('\n');
})()}

**ACTION REQUIRED:**
- When memories have high confidence (≥80%), PRIORITIZE those preferences strongly
- When memories have moderate confidence (60-79%), CONSIDER them as secondary factors
- Document your memory-influenced choices in "insightInfluencedChanges" array
- Include the memory ID, what you chose, and why
` : ''}

Required JSON structure:
{
  "exercises": [
    {
      "name": "string",
      "equipmentVariant": "string",
      "sets": number,
      "repRange": [number, number],
      "restSeconds": number,
      "tempo": "${approach.variables?.tempo || 'not specified'}", // Tempo from approach (e.g., "3-1-1-1")
      "rationaleForSelection": "string",
      "alternatives": ["string"],
      "primaryMuscles": ["string"],
      "secondaryMuscles": ["string"],
      "movementPattern": "string",
      "romEmphasis": "lengthened" | "shortened" | "full_range",
      "unilateral": boolean,
      "technicalCues": ["string"],
      "warmupSets": [  // ONLY if compound movement
        {
          "setNumber": 1,
          "weightPercentage": 50,
          "reps": 15,
          "rir": 5,
          "restSeconds": 60,
          "technicalFocus": "Feel the movement pattern"
        },
        {
          "setNumber": 2,
          "weightPercentage": 65,
          "reps": 12,
          "rir": 3,
          "restSeconds": 90,
          "technicalFocus": "Build mind-muscle connection"
        }
      ],
      "setGuidance": [  // For ALL exercises, for each working set
        {
          "setNumber": 1,
          "technicalFocus": "Full range of motion",
          "mentalFocus": "Stay controlled, no rushing"
        },
        {
          "setNumber": 2,
          "technicalFocus": "Squeeze hard at top",
          "mentalFocus": "Push through discomfort"
        },
        {
          "setNumber": 3,
          "technicalFocus": "Maintain form to failure",
          "mentalFocus": "One more quality rep"
        }
      ]
    }
  ],
  "workoutRationale": "string",
  "weakPointAddress": "string",
  "insightInfluencedChanges": [
    {
      "source": "insight" | "memory",
      "sourceId": "uuid",
      "sourceTitle": "description",
      "action": "avoided" | "substituted" | "preferred" | "adjusted",
      "originalExercise": "optional - if substituted",
      "selectedExercise": "the exercise you selected",
      "reason": "why you made this change"
    }
  ]
}

**REMINDER:** The "insightInfluencedChanges" array is MANDATORY. If you made no changes due to insights/memories, return an empty array [].
    `

    const result = await this.complete<ExerciseSelectionOutput>(prompt)

    // Ensure insightInfluencedChanges field exists (even if AI didn't include it)
    if (!result.insightInfluencedChanges) {
      result.insightInfluencedChanges = [];
    }

    // Populate animation URLs for each exercise using AnimationService (async)
    result.exercises = await Promise.all(
      result.exercises.map(async (exercise) => {
        const animationUrl = await AnimationService.getAnimationUrl({
          name: exercise.name,
          canonicalPattern: this.extractCoreExerciseName(exercise.name),
          equipmentVariant: exercise.equipmentVariant,
        })

        return {
          ...exercise,
          animationUrl,
          hasAnimation: !!animationUrl,
        }
      })
    )

    // Save generated exercises to database for consistency tracking
    // Skip during onboarding for performance (skipSaving flag)
    if (input.userId && !input.skipSaving) {
      await this.saveGeneratedExercises(result.exercises, input.userId)
    }

    return result
  }

  /**
   * Extract core exercise name from full exercise name
   * Removes parenthetical content and extracts the main movement
   * Example: "Single-Arm Dumbbell Row (Torso-Supported)" → "Dumbbell Row"
   * Example: "Optional Finisher — Rope Triceps Pushdown" → "Triceps Pushdown"
   */
  private extractCoreExerciseName(exerciseName: string): string {
    if (!exerciseName) return ''

    // Remove parenthetical content first
    let coreName = exerciseName.replace(/\s*\([^)]*\)/g, '').trim()

    // Remove descriptive prefixes with em dash (—) or regular dash (-)
    // Examples: "Optional Finisher —", "Warm-up —", "Bonus -"
    coreName = coreName
      .replace(/^(optional\s+)?finisher\s*[—\-]\s*/i, '')
      .replace(/^(warm-?up|cool-?down|bonus|activation)\s*[—\-]\s*/i, '')

    // Remove equipment that's embedded in the name (it should be in equipmentVariant instead)
    // Examples: "Rope Triceps Pushdown" → "Triceps Pushdown"
    // Examples: "Dumbbell Bulgarian Split Squat" → "Bulgarian Split Squat"
    coreName = coreName
      .replace(/^(rope|band|chain)\s+/i, '')
      .replace(/^(barbell|dumbbell|cable|machine|smith|bodyweight|kettlebell)\s+/i, '')

    // Remove common modifiers that are too specific for animation matching
    coreName = coreName
      .replace(/^(single-arm|one-arm|two-arm|alternating)\s+/i, '')
      .replace(/\s+(single|double|alternating|emphasis)$/i, '')
      .trim()

    return coreName
  }

  /**
   * Save AI-generated exercises to database for naming consistency
   * Uses findOrCreate to reuse existing exercises with same name
   */
  private async saveGeneratedExercises(
    exercises: SelectedExercise[],
    userId: string | null
  ): Promise<void> {
    try {
      await Promise.all(
        exercises.map(async (exercise) => {
          const metadata: ExerciseMetadata = {
            primaryMuscles: exercise.primaryMuscles,
            secondaryMuscles: exercise.secondaryMuscles,
            movementPattern: exercise.movementPattern,
            romEmphasis: exercise.romEmphasis,
            unilateral: exercise.unilateral,
            equipmentUsed: exercise.equipmentVariant ? [exercise.equipmentVariant] : [],
          }

          await ExerciseGenerationService.findOrCreateServer(
            exercise.name,
            metadata,
            userId
          )
        })
      )
    } catch (error) {
      console.error('Failed to save generated exercises:', error)
      // Don't throw - this is background tracking, not critical
    }
  }
}
