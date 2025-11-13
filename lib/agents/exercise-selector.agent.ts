import { BaseAgent } from './base.agent'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { ExerciseGenerationService, type ExerciseMetadata } from '@/lib/services/exercise-generation.service'
import { findEquipmentById } from '@/lib/constants/equipment-taxonomy'
import { AnimationService } from '@/lib/services/animation.service'
import type { Locale } from '@/i18n'

export interface ExerciseSelectionInput {
  workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body'
  weakPoints: string[]
  equipmentPreferences?: Record<string, string> // DEPRECATED: Use availableEquipment
  availableEquipment?: string[] // New multiselect equipment array
  customEquipment?: Array<{ id: string; name: string; exampleExercises: string[] }> // Custom user equipment
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
  // Caloric phase context
  caloricPhase?: 'bulk' | 'cut' | 'maintenance' | null
  caloricIntakeKcal?: number | null  // Daily caloric surplus (+) or deficit (-)
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

/**
 * Anatomical to Canonical Muscle Mapping
 *
 * Maps anatomically correct muscle names (which AI tends to generate)
 * to canonical taxonomy keys used throughout the system.
 *
 * This ensures volume validation works even when AI uses Latin/anatomical names
 * instead of the simplified canonical names (chest, shoulders, triceps, etc.)
 */
const ANATOMICAL_TO_CANONICAL: Record<string, string> = {
  // Canonical names (identity mappings to eliminate false positives)
  'chest': 'chest',
  'chest_upper': 'chest_upper',
  'chest_lower': 'chest_lower',
  'shoulders': 'shoulders',
  'shoulders_front': 'shoulders_front',
  'shoulders_side': 'shoulders_side',
  'shoulders_rear': 'shoulders_rear',
  'triceps': 'triceps',
  'triceps_long': 'triceps_long',
  'triceps_lateral': 'triceps_lateral',
  'triceps_medial': 'triceps_medial',
  'lats': 'lats',
  'upper_back': 'upper_back',
  'lower_back': 'lower_back',
  'lowerback': 'lowerBack',
  'traps': 'traps',
  'biceps': 'biceps',
  'forearms': 'forearms',
  'quads': 'quads',
  'hamstrings': 'hamstrings',
  'glutes': 'glutes',
  'calves': 'calves',
  'abs': 'abs',
  'obliques': 'obliques',
  'serratus': 'serratus',
  'adductors': 'adductors',
  'abductors': 'abductors',
  'hipflexors': 'hipFlexors',

  // Chest variations
  'pectoralis major': 'chest',
  'pectoralis minor': 'chest',
  'pectoralis': 'chest',
  'pectorals': 'chest',
  'pecs': 'chest',
  'pec': 'chest',
  'clavicular pectoralis': 'chest_upper',
  'sternal pectoralis': 'chest_lower',
  'upper chest': 'chest_upper',
  'lower chest': 'chest_lower',

  // Shoulders variations
  'deltoid': 'shoulders',
  'deltoids': 'shoulders',
  'anterior deltoid': 'shoulders',
  'lateral deltoid': 'shoulders',
  'posterior deltoid': 'shoulders',
  'front deltoid': 'shoulders',
  'middle deltoid': 'shoulders',
  'rear deltoid': 'shoulders',
  'front delt': 'shoulders',
  'side delt': 'shoulders',
  'rear delt': 'shoulders',
  'delts': 'shoulders',

  // Triceps variations
  'triceps brachii': 'triceps',
  'tricep': 'triceps',
  'long head triceps': 'triceps',
  'lateral head triceps': 'triceps',
  'medial head triceps': 'triceps',

  // Back/Lats variations
  'latissimus dorsi': 'lats',
  'latissimus': 'lats',
  'lat': 'lats',
  'teres major': 'lats',
  'rhomboids': 'upper_back',
  'rhomboid': 'upper_back',
  'upper back': 'upper_back',
  'lower back': 'lowerBack',
  'erector spinae': 'lowerBack',
  'spinal erectors': 'lowerBack',

  // Traps variations
  'trapezius': 'traps',
  'upper trapezius': 'traps',
  'middle trapezius': 'traps',
  'lower trapezius': 'traps',

  // Biceps variations
  'biceps brachii': 'biceps',
  'bicep': 'biceps',
  'brachialis': 'biceps',
  'long head biceps': 'biceps',
  'short head biceps': 'biceps',

  // Forearms variations
  'forearm': 'forearms',
  'brachioradialis': 'forearms',
  'wrist flexors': 'forearms',
  'wrist extensors': 'forearms',

  // Quads variations
  'quadriceps': 'quads',
  'quad': 'quads',
  'quadricep': 'quads',
  'rectus femoris': 'quads',
  'vastus lateralis': 'quads',
  'vastus medialis': 'quads',
  'vastus intermedius': 'quads',

  // Hamstrings variations
  'hamstring': 'hamstrings',
  'biceps femoris': 'hamstrings',
  'semitendinosus': 'hamstrings',
  'semimembranosus': 'hamstrings',

  // Glutes variations
  'gluteus maximus': 'glutes',
  'gluteus medius': 'glutes',
  'gluteus minimus': 'glutes',
  'glute': 'glutes',
  'gluteal': 'glutes',

  // Calves variations
  'gastrocnemius': 'calves',
  'soleus': 'calves',
  'calf': 'calves',

  // Abs variations
  'rectus abdominis': 'abs',
  'abdominals': 'abs',
  'abdominal': 'abs',
  'core': 'abs',
  'six pack': 'abs',

  // Obliques variations
  'oblique': 'obliques',
  'obliqes': 'obliques', // common typo
  'external obliques': 'obliques',
  'internal obliques': 'obliques',
  'external oblique': 'obliques',
  'internal oblique': 'obliques',

  // Serratus
  'serratus anterior': 'serratus',

  // Hip flexors
  'iliopsoas': 'hipFlexors',
  'hip flexor': 'hipFlexors',
  'psoas': 'hipFlexors',
  'iliacus': 'hipFlexors',

  // Adductors
  'adductor': 'adductors',
  'adductor magnus': 'adductors',
  'adductor longus': 'adductors',
  'adductor brevis': 'adductors',
  'gracilis': 'adductors',

  // Abductors
  'abductor': 'abductors',
  'tensor fasciae latae': 'abductors',
  'tfl': 'abductors',

  // Rotator cuff (stabilizers)
  'rotator cuff': 'shoulders',
  'supraspinatus': 'shoulders',
  'infraspinatus': 'shoulders',
  'teres minor': 'shoulders',
  'subscapularis': 'shoulders',

  // Misc stabilizers
  'scapular stabilizers': 'upper_back',
  'scapular': 'upper_back',
  'shoulder stabilizers': 'shoulders',
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

  async selectExercises(input: ExerciseSelectionInput, targetLanguage?: 'en' | 'it'): Promise<ExerciseSelectionOutput> {
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

    // Build caloric phase context
    const caloricPhaseContext = input.caloricPhase
      ? `
=== CALORIC PHASE CONTEXT ===
Current Nutritional Phase: ${input.caloricPhase.toUpperCase()}
${input.caloricIntakeKcal ? `Daily Caloric ${input.caloricIntakeKcal > 0 ? 'Surplus' : 'Deficit'}: ${input.caloricIntakeKcal > 0 ? '+' : ''}${input.caloricIntakeKcal} kcal` : ''}

⚠️ APPROACH-AWARE OPTIMIZATION:
The guidance below must be applied WITHIN your training approach's constraints, not as absolute rules.
If the approach has specific volume limits or progression rules, THOSE TAKE PRIORITY over these general guidelines.

${input.caloricPhase === 'bulk' ? `
Phase Overview: Caloric surplus for muscle building

VOLUME (conditional on approach):
- IF approach allows volume modulation (e.g., flexible volume landmarks, no fixed set limits):
  * Aim for +15-20% higher volume compared to your approach's maintenance baseline
  * Can handle more total sets within approach's framework
  * Example: If approach suggests 12-16 sets for quads, lean toward 15-16 sets

- IF approach has FIXED VOLUME (e.g., Heavy Duty 1-2 sets, DC Training prescribed sets):
  * DO NOT increase set count - respect the approach's set limits
  * INSTEAD increase INTENSITY within approach's guidelines:
    - Use heavier loads (aggressive week-to-week progression)
    - Push closer to/beyond failure (within approach's RIR targets)
    - Apply advanced techniques IF approach supports (rest-pause, drop sets, negatives)
  * Example: Heavy Duty in bulk = still 6-8 total sets, but heavier weights + more aggressive intensity techniques

- IF approach is periodized:
  * Check if current mesocycle phase supports volume increases
  * Defer to periodization context if it conflicts

EXERCISE SELECTION (approach-dependent):
- Compound-focused approaches → prioritize main lifts (squat, bench, deadlift variations)
- Balanced approaches → maintain your approach's typical compound/isolation ratio
- Follow your approach's exercise priority rules
- Use caloric surplus as reason to push harder on approach's key exercises

REP RANGES (within approach's prescribed ranges):
- Stay within approach's prescribed rep ranges for each exercise type
- IF approach allows range flexibility → explore lower end for strength emphasis
- DO NOT change prescribed ranges; progress via LOAD, not by changing rep prescriptions
- Example: If approach says 6-10 reps, use the 6-8 range more often in bulk

PROGRESSION FOCUS:
- Aggressive load progression (this is the prime time for PRs)
- Prioritize strength gains on approach's main movements
- Take advantage of enhanced recovery for progressive overload
- User has nutritional support for strength gains
` : ''}
${input.caloricPhase === 'cut' ? `
Phase Overview: Caloric deficit for fat loss while preserving muscle

VOLUME (conditional on approach):
- IF approach allows volume modulation:
  * Reduce total volume by -15-20% compared to your approach's maintenance baseline
  * QUALITY over QUANTITY - fewer sets, executed with precision
  * Example: If approach suggests 12-16 sets for quads, lean toward 12-13 sets

- IF approach has FIXED VOLUME (e.g., Heavy Duty, DC Training):
  * Maintain the prescribed set count - DO NOT reduce sets
  * INSTEAD manage fatigue and recovery differently:
    - Slightly reduce load if needed to maintain perfect technique (~85-90% of bulk loads)
    - Focus on maintaining strength rather than pushing absolute limits
    - Prioritize quality of contraction over maximum weight
  * Example: Heavy Duty in cut = still 6-8 total sets, slightly lighter loads with focus on form

- IF approach is periodized:
  * Check if current mesocycle phase's volume should be adjusted for deficit
  * Defer to periodization context for volume guidance

EXERCISE SELECTION (within approach's exercise framework):
- Within your approach's exercise priority rules, favor higher stimulus-to-fatigue options when possible:
  * Machines and cables when they fit approach's philosophy
  * Exercise variations that preserve muscle with less systemic fatigue
  * Example: If approach allows squat variations, prefer Safety Bar Squat or Leg Press over Low Bar Back Squat

- IF approach is compound-focused (e.g., Starting Strength, 5/3/1):
  * Maintain compound focus but choose slightly less fatiguing variations
  * Safety Squat Bar, Trap Bar Deadlift, Floor Press = same movement patterns, less CNS demand

- Respect your approach's exercise distribution rules

REP RANGES (within approach's prescribed ranges):
- Stay within approach's prescribed rep ranges
- IF approach allows flexibility → prefer middle-to-upper end (8-12 range) for preservation
- DO NOT arbitrarily change to "hypertrophy ranges" if approach specifies different ranges
- Focus on maintaining technique and muscle engagement over absolute load

PROGRESSION FOCUS:
- Goal: Maintain strength at ~85-90% of bulking performance
- Expect slight strength decrease (normal and acceptable in deficit)
- Prioritize muscle retention over load progression
- This is NOT the time for PRs unless they happen naturally

CRITICAL PRINCIPLE: Minimum effective dose WITHIN approach's framework
- Apply your approach's minimum effective volume
- Every extra set costs recovery you don't have
- Strategic modulation is smart training
` : ''}
${input.caloricPhase === 'maintenance' ? `
Phase Overview: Balanced caloric intake for sustainable training

VOLUME:
- Apply your approach's standard baseline volume guidelines
- No caloric-driven adjustments needed

EXERCISE SELECTION:
- Follow your approach's exercise priority rules
- No special adjustments for caloric phase

REP RANGES:
- Use your approach's prescribed rep ranges
- No modifications needed

PROGRESSION:
- Steady, sustainable progress within approach's progression rules
- Focus on technique refinement and consistency
- Sustainable long-term training

This is your sustainable baseline - apply your approach as designed.
` : ''}
`
      : ''

    // Build session context if provided (for split-based workouts)
    const sessionContext = input.sessionFocus || input.targetVolume || input.sessionPrinciples
      ? `
=== 🎯 SESSION MUSCLE GROUP REQUIREMENTS ===
${input.sessionFocus ? `
⚠️ MANDATORY MUSCLE COVERAGE:
You MUST include exercises that target ALL of the following muscle groups:
${input.sessionFocus.map(m => `- ${m}`).join('\n')}

EXECUTION RULES:
• Each muscle group listed above requires AT LEAST 1 exercise
• Distribute the exercises across the workout according to the approach's structure
• For multi-phase approaches (e.g., Mountain Dog), assign muscles to appropriate phases
• For technique-specific approaches (e.g., FST-7, Y3T), apply the technique while covering all muscles
• If the approach has volume constraints that conflict, prioritize muscles in the order listed above
` : ''}
${input.targetVolume ? `
⚠️ MANDATORY TARGET VOLUME (MUST match within ±20%):
${JSON.stringify(input.targetVolume, null, 2)}

CRITICAL RULE: You MUST generate exercises that result in these EXACT set counts per muscle group.
Each muscle group must receive sets within 20% of its target. This is NON-NEGOTIABLE.
Example: If target is 12 sets for chest, you must generate 10-14 sets (12 ± 20% = 9.6-14.4 → round to 10-14).
` : ''}
${input.sessionPrinciples ? `
Session-Specific Principles:
${input.sessionPrinciples.map(p => `- ${p}`).join('\n')}` : ''}
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
${caloricPhaseContext}
${sessionContext}

User weak points: ${input.weakPoints.join(', ') || 'None specified'}

Available Equipment:
${input.availableEquipment && input.availableEquipment.length > 0
  ? input.availableEquipment.map((id: string) => {
      // First try to find in taxonomy
      const equipment = findEquipmentById(id)
      if (equipment) {
        return `- ${equipment.label} (${equipment.commonFor.join(', ')})`
      }
      // Then check if it's custom equipment
      const customEq = input.customEquipment?.find(eq => eq.id === id)
      if (customEq) {
        return `- ${customEq.name} [CUSTOM] (${customEq.exampleExercises.join(', ')})`
      }
      // Fallback
      return `- ${id}`
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

**HIERARCHY OF CONSTRAINTS:**
1. 🏆 TRAINING APPROACH PHILOSOPHY (non-negotiable - defines the methodology)
   - This defines HOW to train (4 phases, 7 sets, week type, equipment preferences, etc.)
   - Approach constraints are absolute and cannot be violated
2. 🎯 SESSION MUSCLE GROUP COVERAGE (mandatory - ensures complete training)
   - This defines WHAT muscles to train
   - You MUST include at least 1 exercise for EACH muscle group in sessionFocus
   - Distribute exercises across the approach's structure (phases, techniques, progressions)
3. 📊 Periodization phase (if approach supports periodization)
4. 🍽️ Caloric phase (modulate volume/intensity within approach framework)
5. 👤 Weak points and user preferences (tactical adjustments)

⚠️ CRITICAL: Approach + Session Focus are COMPLEMENTARY, not conflicting:
- Approach methodology (priority #1) defines HOW to structure the workout
- Session muscle coverage (priority #2) defines WHAT muscles to include
- Apply the approach's methodology WHILE ensuring all session focus muscles are covered
- If approach volume constraints make it impossible to adequately cover all muscles, prioritize them in the order given

⚠️ CONFLICT RESOLUTION RULE:
If any guidance below conflicts with the approach philosophy or volume constraints, THE APPROACH WINS.

Example: Heavy Duty + BULK scenario
- Heavy Duty says: "1-2 sets per exercise, 6-8 total sets, NEVER add more sets"
- BULK says: "+15-20% volume"
- CORRECT action: Stay within 1-2 sets × 6-8 total, increase intensity (heavier weights, advanced techniques)
- WRONG action: Increase to 10-12 total sets

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

**🔴 CRITICAL: MUSCLE NAME REQUIREMENTS:**
You MUST use these EXACT canonical muscle group keys (not anatomical Latin names):

ALLOWED MUSCLE KEYS (use these ONLY):
${JSON.stringify(['chest', 'chest_upper', 'chest_lower', 'shoulders', 'triceps', 'lats', 'upper_back', 'traps', 'biceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'obliques', 'lowerBack', 'adductors', 'abductors', 'hipFlexors', 'serratus'], null, 2)}

COMMON ANATOMICAL → CANONICAL MAPPINGS (MEMORIZE):
- "pectoralis major/minor" → use "chest"
- "anterior/lateral/posterior deltoid" → use "shoulders"
- "triceps brachii" → use "triceps"
- "latissimus dorsi" → use "lats"
- "biceps brachii" → use "biceps"
- "rectus femoris/vastus" → use "quads"
- "biceps femoris/semitendinosus" → use "hamstrings"
- "gastrocnemius/soleus" → use "calves"
- "gluteus maximus/medius" → use "glutes"
- "rectus abdominis" → use "abs"

✓ CORRECT: "primaryMuscles": ["chest", "shoulders"]
✗ WRONG: "primaryMuscles": ["pectoralis major", "anterior deltoid"]
✗ WRONG: "primaryMuscles": ["Chest", "Shoulders"]  (capitalization matters!)

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

    // 🔒 GENERATE WITH RETRY & VALIDATION: Use retry mechanism with validation feedback
    const result = await this.completeWithRetry<ExerciseSelectionOutput>(
      prompt,
      (result) => this.validateExerciseSelection(result, input, approach, targetLanguage),
      3,  // maxAttempts
      targetLanguage
    )

    // Validation complete - if we reach here, the AI generated a valid workout
    console.log('[ExerciseSelector] Workout generation successful with validation')

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

    // Remove common modifiers BEFORE equipment (order matters!)
    // Examples: "Single-Arm Dumbbell Row" → "Dumbbell Row"
    coreName = coreName
      .replace(/^(single-arm|one-arm|two-arm|alternating)\s+/i, '')

    // Remove equipment that's embedded in the name (it should be in equipmentVariant instead)
    // Examples: "Rope Triceps Pushdown" → "Triceps Pushdown"
    // Examples: "Dumbbell Bulgarian Split Squat" → "Bulgarian Split Squat"
    coreName = coreName
      .replace(/^(rope|band|chain)\s+/i, '')
      .replace(/^(barbell|dumbbell|cable|machine|smith|bodyweight|kettlebell)\s+/i, '')

    // Remove supported/emphasis modifiers at the end
    // Examples: "Row (Knee-Supported)" → "Row", "Curl (deep stretch)" → "Curl"
    coreName = coreName
      .replace(/\s+(knee-?supported|chest-?supported|torso-?supported|bench-?supported)/i, '')
      .replace(/\s+(deep\s+stretch|moderate|slow\s+eccentric|controlled)/i, '')
      .replace(/\s+(single|double|alternating|emphasis)$/i, '')
      .trim()

    return coreName
  }

  /**
   * Normalize muscle names in exercises to canonical taxonomy
   *
   * Converts anatomical names (e.g., "pectoralis major") to canonical keys (e.g., "chest")
   * using the ANATOMICAL_TO_CANONICAL mapping table.
   *
   * This ensures volume validation works correctly regardless of which naming convention
   * the AI uses in its output.
   *
   * @param exercises - Array of exercises with potentially non-canonical muscle names
   * @returns Same exercises with normalized muscle names
   * @private
   */
  private normalizeExerciseMuscles(exercises: SelectedExercise[]): SelectedExercise[] {
    const unknownMuscles = new Set<string>()
    let totalNormalizations = 0

    const normalized = exercises.map(ex => {
      const normalizedPrimaryMuscles = ex.primaryMuscles?.map(muscle => {
        const normalized = muscle.toLowerCase().trim().replace(/_/g, ' ')

        // Try exact match first
        if (ANATOMICAL_TO_CANONICAL[normalized]) {
          totalNormalizations++
          return ANATOMICAL_TO_CANONICAL[normalized]
        }

        // Try without plural
        const withoutPlural = normalized.replace(/s$/, '')
        if (ANATOMICAL_TO_CANONICAL[withoutPlural]) {
          totalNormalizations++
          return ANATOMICAL_TO_CANONICAL[withoutPlural]
        }

        // Unknown muscle - track it
        unknownMuscles.add(muscle)
        return muscle
      })

      const normalizedSecondaryMuscles = ex.secondaryMuscles?.map(muscle => {
        const normalized = muscle.toLowerCase().trim().replace(/_/g, ' ')

        // Try exact match first
        if (ANATOMICAL_TO_CANONICAL[normalized]) {
          totalNormalizations++
          return ANATOMICAL_TO_CANONICAL[normalized]
        }

        // Try without plural
        const withoutPlural = normalized.replace(/s$/, '')
        if (ANATOMICAL_TO_CANONICAL[withoutPlural]) {
          totalNormalizations++
          return ANATOMICAL_TO_CANONICAL[withoutPlural]
        }

        // Unknown muscle - track it
        unknownMuscles.add(muscle)
        return muscle
      })

      return {
        ...ex,
        primaryMuscles: normalizedPrimaryMuscles,
        secondaryMuscles: normalizedSecondaryMuscles
      }
    })

    // Log normalization summary
    console.log('📋 [EXERCISE_SELECTOR] Muscle normalization complete:', {
      totalExercises: exercises.length,
      totalNormalizations: totalNormalizations,
      unknownMusclesCount: unknownMuscles.size,
      unknownMuscles: unknownMuscles.size > 0 ? Array.from(unknownMuscles) : undefined,
      timestamp: new Date().toISOString()
    })

    if (unknownMuscles.size > 0) {
      console.warn('⚠️ [EXERCISE_SELECTOR] Unknown muscles detected during normalization:', {
        muscles: Array.from(unknownMuscles),
        hint: 'These muscles were not found in ANATOMICAL_TO_CANONICAL mapping. If they are anatomical names, consider adding them.',
        timestamp: new Date().toISOString()
      })
    }

    return normalized
  }

  /**
   * Validate exercise selection against all constraints and requirements
   * Returns structured feedback for AI retry mechanism
   * @private
   */
  private async validateExerciseSelection(
    result: ExerciseSelectionOutput,
    input: ExerciseSelectionInput,
    approach: any,
    targetLanguage: Locale = 'en'
  ): Promise<{ valid: boolean; feedback: string }> {
    // Debug: Log what AI actually generated
    console.log('🔍 [VALIDATOR] AI generated exercises (before normalization):', JSON.stringify(result.exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets,
      primaryMuscles: ex.primaryMuscles,
      secondaryMuscles: ex.secondaryMuscles
    })), null, 2))

    // ✨ NORMALIZE MUSCLE NAMES: Convert anatomical → canonical before validation
    result.exercises = this.normalizeExerciseMuscles(result.exercises)

    console.log('✅ [VALIDATOR] After normalization:', JSON.stringify(result.exercises.map(ex => ({
      name: ex.name,
      primaryMuscles: ex.primaryMuscles,
      secondaryMuscles: ex.secondaryMuscles
    })), null, 2))

    const errors: string[] = []

    // Validation 1: Total sets limit (approach constraint)
    const totalSets = result.exercises.reduce((sum, ex) => sum + ex.sets, 0)
    const vars = approach.variables as any
    const maxTotalSets = vars?.sessionDuration?.totalSets?.[1]

    if (maxTotalSets && totalSets > maxTotalSets) {
      errors.push(
        `**TOTAL SETS VIOLATION**\n` +
        `- You generated: ${totalSets} total sets\n` +
        `- Approach limit: ${maxTotalSets} total sets (${approach.name})\n` +
        `- Exceeds by: ${totalSets - maxTotalSets} sets\n` +
        `- FIX: Either REDUCE sets per exercise OR REMOVE ${Math.ceil((totalSets - maxTotalSets) / 3)} exercise(s)\n` +
        `- Current: ${result.exercises.map(e => `${e.name} (${e.sets} sets)`).join(', ')}`
      )
    }

    // Validation 2: Per-exercise sets limit
    const maxSetsPerExercise = vars?.setsPerExercise?.working ||
                               (vars?.sets?.range ? vars.sets.range[1] : null)

    if (maxSetsPerExercise) {
      const violations = result.exercises.filter(ex => ex.sets > maxSetsPerExercise)
      if (violations.length > 0) {
        errors.push(
          `**PER-EXERCISE SETS VIOLATION**\n` +
          `- Approach limit: ${maxSetsPerExercise} sets per exercise maximum\n` +
          `- Violations (${violations.length} exercises):\n` +
          violations.map(v => `  * ${v.name}: ${v.sets} sets (exceeds by ${v.sets - maxSetsPerExercise})`).join('\n') + '\n' +
          `- FIX: REDUCE sets for these exercises to max ${maxSetsPerExercise} sets each`
        )
      }
    }

    // Validation 3: Session focus coverage (AI semantic validation)
    if (input.sessionFocus && input.sessionFocus.length > 0) {
      const coveredMuscles: string[] = []
      result.exercises.forEach(ex => {
        if (ex.primaryMuscles) coveredMuscles.push(...ex.primaryMuscles)
        if (ex.secondaryMuscles) coveredMuscles.push(...ex.secondaryMuscles)
      })

      const { MUSCLE_GROUPS } = await import('@/lib/services/muscle-groups.service')

      const validationPrompt = `You are an exercise physiology expert validating muscle group coverage.

REFERENCE TAXONOMY (canonical muscle names):
${JSON.stringify(MUSCLE_GROUPS, null, 2)}

REQUIRED MUSCLE GROUPS TO TRAIN:
${input.sessionFocus.map(key => `- ${key} (${MUSCLE_GROUPS[key as keyof typeof MUSCLE_GROUPS] || key})`).join('\n')}

ACTUAL MUSCLES TRAINED (from generated exercises):
${coveredMuscles.join(', ')}

TASK: Determine if the actual muscles adequately cover ALL required muscle groups.

RULES:
- Consider anatomical equivalents (e.g., "latissimus dorsi" = "lats" = "back")
- Specific muscles count toward general groups (e.g., "posterior deltoid" covers "rear_delts")
- Accept plural/singular variants and synonyms
- A muscle group is COVERED if ANY exercise targets it (primary or secondary)

Return ONLY valid JSON (no markdown, no code blocks):
{
  "valid": true or false,
  "missing": ["canonical_key1", "canonical_key2"],
  "reasoning": "brief explanation (max 50 words)"
}`

      interface MuscleValidationResult {
        valid: boolean
        missing: string[]
        reasoning: string
      }

      const validation = await this.complete<MuscleValidationResult>(validationPrompt, targetLanguage)

      if (!validation.valid) {
        errors.push(
          `**SESSION FOCUS VIOLATION**\n` +
          `- Required muscles: ${input.sessionFocus.join(', ')}\n` +
          `- Missing coverage: ${validation.missing.join(', ')}\n` +
          `- AI Analysis: ${validation.reasoning}\n` +
          `- FIX: ADD at least one exercise targeting each missing muscle group`
        )
      }
    }

    // Validation 4: Target volume (±20% tolerance)
    if (input.targetVolume && Object.keys(input.targetVolume).length > 0) {
      const calculateMuscleVolume = (exercises: typeof result.exercises): Record<string, number> => {
        const volume: Record<string, number> = {}
        exercises.forEach(ex => {
          ex.primaryMuscles?.forEach(muscle => {
            const normalized = muscle.toLowerCase().trim()
            volume[normalized] = (volume[normalized] || 0) + (ex.sets || 0)
          })
          ex.secondaryMuscles?.forEach(muscle => {
            const normalized = muscle.toLowerCase().trim()
            volume[normalized] = (volume[normalized] || 0) + (ex.sets || 0) * 0.5
          })
        })
        return volume
      }

      const normalizeMuscleForVolume = (muscle: string): string => {
        const normalized = muscle.toLowerCase().trim()
          .replace(/_/g, ' ')  // Replace underscores with spaces first

        // Check mapping table (exact match)
        if (ANATOMICAL_TO_CANONICAL[normalized]) {
          return ANATOMICAL_TO_CANONICAL[normalized]
        }

        // Check with plural removed (e.g., "deltoids" → "deltoid" → "shoulders")
        const withoutPlural = normalized.replace(/s$/, '')
        if (ANATOMICAL_TO_CANONICAL[withoutPlural]) {
          return ANATOMICAL_TO_CANONICAL[withoutPlural]
        }

        // Not in mapping - log for monitoring and return as-is (already normalized, canonical)
        console.warn('⚠️ [EXERCISE_SELECTOR] Unknown muscle name encountered:', {
          original: muscle,
          normalized: normalized,
          withoutPlural: withoutPlural,
          returning: withoutPlural,
          timestamp: new Date().toISOString(),
          hint: 'Consider adding to ANATOMICAL_TO_CANONICAL mapping if this is an anatomical name'
        })

        return withoutPlural
      }

      const actualVolume = calculateMuscleVolume(result.exercises)
      const { MUSCLE_GROUPS } = await import('@/lib/services/muscle-groups.service')
      const violations: Array<{muscle: string; target: number; actual: number; suggestion: string}> = []
      const targetTolerance = 0.20

      for (const [muscleKey, targetSets] of Object.entries(input.targetVolume)) {
        const muscleName = MUSCLE_GROUPS[muscleKey as keyof typeof MUSCLE_GROUPS] || muscleKey
        const normalizedTarget = normalizeMuscleForVolume(muscleKey)
        let actualSets = 0

        for (const [actualMuscle, sets] of Object.entries(actualVolume)) {
          const normalizedActual = normalizeMuscleForVolume(actualMuscle)
          if (normalizedActual.includes(normalizedTarget) || normalizedTarget.includes(normalizedActual)) {
            actualSets += sets
          }
        }

        const minAllowed = Math.floor(targetSets * (1 - targetTolerance))
        const maxAllowed = Math.ceil(targetSets * (1 + targetTolerance))

        if (actualSets < minAllowed || actualSets > maxAllowed) {
          const suggestion = actualSets < minAllowed
            ? `ADD ${(minAllowed - actualSets).toFixed(0)} more sets for ${muscleKey}`
            : `REMOVE ${(actualSets - maxAllowed).toFixed(0)} sets from ${muscleKey}`

          violations.push({
            muscle: `${muscleKey} (${muscleName})`,
            target: targetSets,
            actual: actualSets,
            suggestion
          })
        }
      }

      if (violations.length > 0) {
        errors.push(
          `**TARGET VOLUME VIOLATION** (±20% tolerance)\n` +
          `- Violations (${violations.length} muscle groups):\n` +
          violations.map(v =>
            `  * ${v.muscle}: target ${v.target} sets, got ${v.actual.toFixed(1)} sets\n` +
            `    FIX: ${v.suggestion}`
          ).join('\n')
        )
      }
    }

    // Return validation result
    return {
      valid: errors.length === 0,
      feedback: errors.length > 0
        ? `❌ VALIDATION FAILED - ${errors.length} ERROR(S) FOUND:\n\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n\n')}`
        : ''
    }
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
