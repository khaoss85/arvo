import { BaseAgent } from './base.agent'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { ExerciseGenerationService, type ExerciseMetadata } from '@/lib/services/exercise-generation.service'
import { findEquipmentById } from '@/lib/constants/equipment-taxonomy'
import { AnimationService } from '@/lib/services/animation.service'
import type { WorkoutType } from '@/lib/services/muscle-groups.service'
import type { Locale } from '@/i18n'
import type { TechniqueType, TechniqueConfig, AppliedTechnique } from '@/lib/types/advanced-techniques'
import { getBodyTypeAIContext, type BodyType } from '@/lib/constants/body-type-config'

export interface ExerciseSelectionInput {
  workoutType: Exclude<WorkoutType, 'rest'>
  weakPoints: string[]
  availableEquipment?: string[] // Equipment IDs available to user
  customEquipment?: Array<{ id: string; name: string; exampleExercises: string[] }> // Custom user equipment
  recentExercises: string[]
  approachId: string
  userId?: string | null // For exercise tracking consistency
  skipSaving?: boolean // Skip saving exercises to database (for onboarding performance)
  // User demographics for personalized exercise selection
  experienceYears?: number | null
  userAge?: number | null
  userGender?: 'male' | 'female' | 'other' | null
  trainingFocus?: 'upper_body' | 'lower_body' | 'balanced' | null
  // Body type (morphotype) for volume distribution adjustments
  bodyType?: BodyType | null
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
  // Insights and Memories
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
  // Current cycle progress for fatigue-aware selection (NEW)
  currentCycleProgress?: {
    volumeByMuscle: Record<string, number>
    workoutsCompleted: number
    avgMentalReadiness: number | null
  }
  // Exercise stagnation/plateau data for rotation recommendations
  exerciseHistoryContext?: Array<{
    name: string
    weeksUsed: number
    isPlateaued: boolean
    avgWeightChange: number
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
  // Advanced training technique (optional, AI-generated)
  advancedTechnique?: AppliedTechnique
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
  responseId?: string // OpenAI response ID for reasoning continuity (GPT-5)
}

/**
 * Exercise Name to Specific Muscle Mapping
 *
 * When AI outputs a generic muscle like "shoulders" but the exercise name clearly
 * indicates a specific head (rear delt, lateral raise, etc.), this mapping
 * helps infer the correct specific muscle group.
 *
 * Format: [regex pattern, inferred muscle]
 */
const EXERCISE_NAME_TO_SPECIFIC_MUSCLE: Array<[RegExp, string]> = [
  // Rear delt / posterior deltoid patterns
  [/rear.?delt|posterior.?delt|face.?pull|reverse.?fly|reverse.?pec/i, 'shoulders_rear'],
  // Lateral / side delt patterns
  [/lateral.?raise|side.?raise|side.?delt|lat.?raise/i, 'shoulders_side'],
  // Front / anterior delt patterns
  [/front.?raise|front.?delt|anterior.?delt/i, 'shoulders_front'],
]

/**
 * Infer specific shoulder muscle from exercise name when AI outputs generic "shoulders"
 *
 * @param exerciseName - The name of the exercise
 * @param genericMuscle - The muscle output by AI (e.g., "shoulders")
 * @returns The specific muscle if inferable, otherwise the original muscle
 */
function inferSpecificMuscleFromExerciseName(exerciseName: string, genericMuscle: string): string {
  // Only apply for generic shoulder assignments
  if (genericMuscle !== 'shoulders') {
    return genericMuscle
  }

  for (const [pattern, specificMuscle] of EXERCISE_NAME_TO_SPECIFIC_MUSCLE) {
    if (pattern.test(exerciseName)) {
      console.log(`🎯 [MUSCLE_INFERENCE] Inferred "${specificMuscle}" from exercise name "${exerciseName}" (was: "${genericMuscle}")`)
      return specificMuscle
    }
  }

  return genericMuscle
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

  // Chest upper variations (clavicular region)
  'clavicular pectoralis': 'chest_upper',
  'clavicular pec': 'chest_upper',
  'clavicular pecs': 'chest_upper',
  'upper pectoralis': 'chest_upper',
  'upper pectoralis major': 'chest_upper',
  'upper pec': 'chest_upper',
  'upper pecs': 'chest_upper',
  'pectoralis upper': 'chest_upper',
  'upper chest': 'chest_upper',
  'chest upper': 'chest_upper',  // Handles "chest_upper" after underscore → space conversion
  'incline chest': 'chest_upper',

  // Chest lower variations (sternal region)
  'sternal pectoralis': 'chest_lower',
  'sternal pec': 'chest_lower',
  'sternal pecs': 'chest_lower',
  'lower pectoralis': 'chest_lower',
  'lower pectoralis major': 'chest_lower',
  'lower pec': 'chest_lower',
  'lower pecs': 'chest_lower',
  'pectoralis lower': 'chest_lower',
  'lower chest': 'chest_lower',
  'chest lower': 'chest_lower',  // Handles "chest_lower" after underscore → space conversion
  'decline chest': 'chest_lower',

  // Shoulders variations (generic deltoid)
  'deltoid': 'shoulders',
  'deltoids': 'shoulders',
  'shoulder': 'shoulders', // singular after plural removal
  'delts': 'shoulders',

  // Shoulders front variations (anterior deltoid)
  'anterior deltoid': 'shoulders_front',
  'anterior delt': 'shoulders_front',
  'front deltoid': 'shoulders_front',
  'front delt': 'shoulders_front',
  'shoulders front': 'shoulders_front',  // Handles "shoulders_front" after underscore → space conversion
  'front shoulders': 'shoulders_front',

  // Shoulders side variations (lateral/middle deltoid)
  'lateral deltoid': 'shoulders_side',
  'lateral delt': 'shoulders_side',
  'middle deltoid': 'shoulders_side',
  'side deltoid': 'shoulders_side',
  'side delt': 'shoulders_side',
  'shoulders side': 'shoulders_side',  // Handles "shoulders_side" after underscore → space conversion
  'side shoulders': 'shoulders_side',

  // Shoulders rear variations (posterior deltoid)
  'posterior deltoid': 'shoulders_rear',
  'posterior delt': 'shoulders_rear',
  'rear deltoid': 'shoulders_rear',
  'rear delt': 'shoulders_rear',
  'shoulders rear': 'shoulders_rear',  // Handles "shoulders_rear" after underscore → space conversion
  'rear shoulders': 'shoulders_rear',

  // Triceps variations (generic)
  'triceps brachii': 'triceps',
  'tricep': 'triceps',

  // Triceps long head variations
  'long head triceps': 'triceps_long',
  'triceps long head': 'triceps_long',
  'triceps long': 'triceps_long',  // Handles "triceps_long" after underscore → space conversion
  'long head': 'triceps_long',

  // Triceps lateral head variations
  'lateral head triceps': 'triceps_lateral',
  'triceps lateral head': 'triceps_lateral',
  'triceps lateral': 'triceps_lateral',  // Handles "triceps_lateral" after underscore → space conversion
  'lateral head': 'triceps_lateral',

  // Triceps medial head variations
  'medial head triceps': 'triceps_medial',
  'triceps medial head': 'triceps_medial',
  'triceps medial': 'triceps_medial',  // Handles "triceps_medial" after underscore → space conversion
  'medial head': 'triceps_medial',

  // Back/Lats variations
  'latissimus dorsi': 'lats',
  'latissimus': 'lats',
  'lat': 'lats',
  'teres major': 'lats',
  'rhomboids': 'upper_back',
  'rhomboid': 'upper_back',
  'upper back': 'upper_back',
  'upperback': 'upper_back', // case-sensitivity variant
  // Generic "back" terms → default to upper_back (most common usage in pull workouts)
  'back': 'upper_back',
  'back muscles': 'upper_back',
  'entire back': 'upper_back',
  'full back': 'upper_back',
  'lower back': 'lowerBack',
  'low back': 'lowerBack', // common variant
  'lumbar': 'lowerBack', // anatomical region
  'erector spinae': 'lowerBack',
  'spinal erectors': 'lowerBack',

  // Traps variations
  'trapezius': 'traps',
  'trap': 'traps', // singular after plural removal
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
  'vastus medialis oblique': 'quads', // VMO - inner quad teardrop
  'vmo': 'quads', // VMO abbreviation
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
  'ab': 'abs', // singular after plural removal
  'core': 'abs',
  'anterior core': 'abs', // common variant
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

  constructor(supabaseClient?: any, reasoningEffort?: 'none' | 'low' | 'medium' | 'high') {
    // Use 'high' reasoning for optimal exercise selection quality
    // ExerciseSelector has complex multi-constraint optimization (volume targets, periodization, insights)
    // 'high' reasoning provides best quality with timeout (240s) to prevent failures
    super(supabaseClient, reasoningEffort || 'high', 'medium')
    this.supabase = supabaseClient || getSupabaseBrowserClient()
  }

  /**
   * Override timeout to use extended 240s for complex exercise selection with high reasoning
   * Uses 'high' reasoning (maximum quality) with extended timeout for complex constraints
   * This provides best quality generation while preventing timeout failures
   */
  protected getTimeoutForReasoning(): number {
    return 240000 // 240 seconds (4 minutes) - aligned with base agent 'high' reasoning timeout
  }

  /**
   * Build cycle fatigue context for AI prompt
   * Provides exercise selection rules based on current cycle fatigue/mental readiness
   */
  private buildCycleFatigueContext(input: ExerciseSelectionInput, approach: any): string {
    if (!input.currentCycleProgress) {
      return '' // No cycle data available
    }

    const { avgMentalReadiness, volumeByMuscle, workoutsCompleted } = input.currentCycleProgress

    let context = '\n=== 💪 CURRENT CYCLE FATIGUE CONTEXT ===\n\n'
    context += `Workouts completed this cycle: ${workoutsCompleted}\n`

    // Mental readiness analysis and exercise selection rules
    if (avgMentalReadiness !== null) {
      const mr = avgMentalReadiness
      const mrEmoji = mr <= 2 ? '🔴' : mr <= 3 ? '🟡' : '🟢'

      context += `\nCycle average mental readiness: ${mrEmoji} ${mr.toFixed(1)}/5.0\n`

      // Fatigue-aware exercise selection rules
      if (mr < 2.5) {
        context += `\n⚠️ **HIGH FATIGUE STATE** - User experiencing accumulated fatigue\n\n`
        context += `**MANDATORY EXERCISE SELECTION ADJUSTMENTS:**\n`
        context += `1. Equipment Priority:\n`
        context += `   ✅ PRIORITIZE: Machines, cables, Smith machine (lower systemic fatigue)\n`
        context += `   ⚠️ REDUCE: Heavy barbell compounds (high CNS demand)\n`
        context += `   ❌ AVOID: Deadlift variations, heavy squats unless essential to approach\n\n`

        context += `2. Exercise Complexity:\n`
        context += `   ✅ PREFER: Bilateral/stable movements (leg press vs barbell squat)\n`
        context += `   ⚠️ CAUTION: Unilateral exercises (require more stability/focus)\n`
        context += `   ❌ AVOID: Olympic lift variations, complex movement patterns\n\n`

        context += `3. RIR Adjustment:\n`
        context += `   • Keep RIR higher: 3-4 (far from failure)\n`
        context += `   • Focus on volume maintenance, NOT intensity pushing\n`
        context += `   • Reduce working sets if approach allows flexibility\n\n`

        context += `4. Exercise Order:\n`
        context += `   • Start with most stable/safe exercises\n`
        context += `   • Save machine work for later in workout (when fatigued)\n`
        context += `   • Consider reducing total exercise variety (fewer movements, more sets each)\n\n`

        context += `**Rationale:** High fatigue impairs recovery and increases injury risk. Priority is maintaining muscle stimulus while managing systemic stress.\n`

      } else if (mr < 3.5) {
        context += `\n📊 **MODERATE FATIGUE STATE** - Normal training stress\n\n`
        context += `**EXERCISE SELECTION GUIDELINES:**\n`
        context += `1. Balanced approach:\n`
        context += `   • Mix of free weights and machines\n`
        context += `   • Standard approach-based exercise distribution\n`
        context += `   • Normal RIR targets (2-3)\n\n`

        context += `2. Minor adjustments:\n`
        context += `   • Slight preference for higher stimulus-to-fatigue exercises\n`
        context += `   • Consider user equipment preferences more heavily\n`
        context += `   • Standard volume targets\n\n`

        context += `**Rationale:** User is in sustainable training zone. Apply approach principles normally.\n`

      } else {
        // High mental readiness (> 3.5)
        context += `\n✅ **HIGH READINESS STATE** - User is fresh and recovered\n\n`
        context += `**EXERCISE SELECTION OPPORTUNITIES:**\n`
        context += `1. Equipment Priority:\n`
        context += `   ✅ EMBRACE: Challenging free weights, barbell compounds\n`
        context += `   ✅ CONSIDER: Olympic lift variations if approach supports\n`
        context += `   ✅ UTILIZE: Complex movement patterns (good time for skill work)\n\n`

        context += `2. Intensity Pushing:\n`
        context += `   • Lower RIR targets: 1-2 (closer to failure)\n`
        context += `   • Consider advanced techniques if approach supports (drop sets, rest-pause)\n`
        context += `   • Explore top end of volume ranges if approach allows\n\n`

        context += `3. Exercise Complexity:\n`
        context += `   • Good time for unilateral exercises (require stability/focus)\n`
        context += `   • Consider exercise variations that challenge coordination\n`
        context += `   • Prioritize exercises with steep learning curve\n\n`

        context += `**Rationale:** High readiness = enhanced work capacity and recovery. Capitalize on this window for quality volume.\n`
      }
    }

    // Volume landmarks analysis (check if approaching MAV/MRV)
    if (volumeByMuscle && Object.keys(volumeByMuscle).length > 0) {
      context += `\n=== 📊 CYCLE VOLUME ACCUMULATION ===\n\n`

      // Get volume landmarks from approach if available
      const volumeLandmarks = approach.volumeLandmarks as Record<string, { MEV: number; MAV: number; MRV: number }> | undefined

      const approachingMAV: string[] = []
      const approachingMRV: string[] = []

      for (const [muscle, currentVolume] of Object.entries(volumeByMuscle)) {
        if (volumeLandmarks && volumeLandmarks[muscle]) {
          const { MAV, MRV } = volumeLandmarks[muscle]
          const percentOfMAV = (currentVolume / MAV) * 100
          const percentOfMRV = (currentVolume / MRV) * 100

          if (percentOfMAV >= 80) {
            approachingMAV.push(`${muscle} (${currentVolume} sets, ${percentOfMAV.toFixed(0)}% of MAV)`)
          }

          if (percentOfMRV >= 70) {
            approachingMRV.push(`${muscle} (${currentVolume} sets, ${percentOfMRV.toFixed(0)}% of MRV)`)
          }
        }
      }

      if (approachingMRV.length > 0) {
        context += `⚠️ **MUSCLES APPROACHING MRV** (Maximum Recoverable Volume):\n`
        approachingMRV.forEach(m => context += `   • ${m}\n`)
        context += `\n**ACTION REQUIRED:**\n`
        context += `   • REDUCE sets for these muscles (aim for maintenance volume)\n`
        context += `   • Select lower-fatigue exercise variations (machines vs free weights)\n`
        context += `   • Consider SKIPPING direct work if muscle is secondary to other exercises\n`
        context += `   • This is a recovery-protective measure - user is at overtraining threshold\n\n`
      } else if (approachingMAV.length > 0) {
        context += `📊 **MUSCLES APPROACHING MAV** (Maximum Adaptive Volume):\n`
        approachingMAV.forEach(m => context += `   • ${m}\n`)
        context += `\n**GUIDELINE:**\n`
        context += `   • Use conservative end of volume ranges for these muscles\n`
        context += `   • Prioritize quality over quantity (perfect reps, mind-muscle connection)\n`
        context += `   • Slight preference for higher stimulus-to-fatigue exercises\n`
        context += `   • User is nearing optimal volume - don't push beyond MAV unless approach requires\n\n`
      } else {
        context += `✅ All muscle groups within healthy volume ranges (below MAV threshold)\n`
        context += `   • Normal exercise selection applies\n`
        context += `   • User has volume headroom for quality training\n\n`
      }
    }

    context += `\n**INTEGRATION WITH APPROACH:**\n`
    context += `These fatigue-aware adjustments should be applied WITHIN the ${approach.name} methodology.\n`
    context += `• Approach constraints (sets per exercise, periodization) remain ABSOLUTE (Priority 1)\n`
    context += `• Fatigue adjustments guide exercise SELECTION and intensity, not total volume structure\n`
    context += `• Example: If approach requires 4 sets per exercise, keep 4 sets but choose machines instead of barbells when fatigued\n`

    // Add consecutive days fatigue adjustment section
    context += `\n\n=== 🔴 CONSECUTIVE TRAINING DAYS FATIGUE ADJUSTMENT ===\n\n`
    context += `**CRITICAL RULE**: When user is on 3rd or 4th consecutive training day, apply additional systemic fatigue adjustments:\n\n`

    context += `**HOW TO IDENTIFY:**\n`
    context += `- Check workout history or split pattern to determine if this is day 3+ of consecutive training\n`
    context += `- If split pattern shows: Day 1 (train) → Day 2 (train) → Day 3 (train) → Current Day = 3rd consecutive\n`
    context += `- Bro Split patterns like "5 days in a row" = high risk for systemic fatigue\n\n`

    context += `**MANDATORY ADJUSTMENTS ON 3RD-4TH CONSECUTIVE DAY:**\n\n`

    context += `1. **RIR Increase (OVERRIDE normal targets):**\n`
    context += `   • ADD +1 RIR to ALL exercises (if normal RIR = 2, use RIR = 3)\n`
    context += `   • Rationale: CNS recovery is compromised, need submaximal loading\n`
    context += `   • Example: Instead of RIR 1-2, use RIR 2-3\n\n`

    context += `2. **Volume Reduction (within allowed tolerance):**\n`
    context += `   • REDUCE volume targets by 10% (still within ±20% tolerance)\n`
    context += `   • Example: If target = 12 sets → aim for 11 sets instead of 12-14\n`
    context += `   • Rationale: Systemic fatigue accumulation needs volume management\n\n`

    context += `3. **Equipment Priority Shift:**\n`
    context += `   • STRONGLY PRIORITIZE machines and cables over free weights\n`
    context += `   • AVOID barbell compounds requiring maximal stability\n`
    context += `   • Example: Use leg press instead of barbell squat, machine rows instead of barbell rows\n`
    context += `   • Rationale: Stability and coordination decline with accumulated fatigue\n\n`

    context += `4. **Advanced Techniques Ban:**\n`
    context += `   • DO NOT use advanced techniques (drop sets, rest-pause, myoreps)\n`
    context += `   • Even in Intensification phase, standard sets only\n`
    context += `   • Rationale: Advanced techniques require peak nervous system function\n\n`

    context += `5. **Exercise Selection Priorities:**\n`
    context += `   • Choose bilateral over unilateral (less stability demand)\n`
    context += `   • Choose guided movements over free-path (less coordination)\n`
    context += `   • Shorter ROM exercises acceptable (partial reps on machines OK)\n`
    context += `   • Simpler movement patterns (avoid complex multi-joint movements)\n\n`

    context += `**DAY 5+ CONSECUTIVE (SHOULD NOT HAPPEN):**\n`
    context += `If you detect 5+ consecutive days in split pattern:\n`
    context += `⚠️ WARNING: This violates optimal split design principles\n`
    context += `• Apply ALL adjustments above with MAXIMUM conservatism\n`
    context += `• Consider recommending a rest day after this session\n`
    context += `• Flag this as suboptimal split design in any feedback\n\n`

    context += `**EXCEPTION - Fresh Cycle Start:**\n`
    context += `If this is the first 2-3 workouts of a NEW cycle (workouts completed ≤ 3):\n`
    context += `• Consecutive days rules are LESS critical (user is fresh from rest)\n`
    context += `• Apply standard fatigue rules based on mental readiness instead\n\n`

    context += `**PRIORITY INTEGRATION:**\n`
    context += `Consecutive days adjustments are Priority 3 (between mental readiness and caloric phase).\n`
    context += `They supplement mental readiness data, not replace it.\n`
    context += `If both mental readiness is LOW (<2.5) AND on consecutive day 3-4: Apply BOTH sets of rules (most conservative approach).\n`

    context += `\n${'='.repeat(60)}\n`

    return context
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

  async selectExercises(
    input: ExerciseSelectionInput,
    targetLanguage?: 'en' | 'it',
    previousResponseId?: string // GPT-5 reasoning continuity - enables cumulative learning
  ): Promise<ExerciseSelectionOutput> {
    const approach = await this.knowledge.loadApproach(input.approachId)
    const context = this.knowledge.formatContextForAI(approach, 'exercise_selection')

    // Extract constraints from approach.variables (nested structure)
    const vars = approach.variables as any
    const maxSetsPerExercise = vars?.setsPerExercise?.working
      || (vars?.sets?.range ? vars.sets.range[1] : null)
    const maxTotalSets = vars?.sessionDuration?.totalSets?.[1]

    // Calculate required exercise count per muscle based on targetVolume and setsPerExercise
    // This ensures AI knows HOW MANY exercises to generate, not just total sets
    const exerciseCountByMuscle: Record<string, number> = {}
    if (input.targetVolume && maxSetsPerExercise) {
      for (const [muscle, targetSets] of Object.entries(input.targetVolume)) {
        const sets = typeof targetSets === 'number' ? targetSets : 0
        if (sets > 0) {
          exerciseCountByMuscle[muscle] = Math.ceil(sets / maxSetsPerExercise)
        }
      }
      console.log('[ExerciseSelector] Calculated exercise count requirements:', {
        targetVolume: input.targetVolume,
        setsPerExercise: maxSetsPerExercise,
        exerciseCountByMuscle
      })
    }

    // Load user's recently used exercises for naming consistency
    const recentExercises = input.userId
      ? await ExerciseGenerationService.getRecentlyUsedServer(this.supabase, input.userId, 20)
      : []

    const demographicContext = input.experienceYears || input.userAge || input.userGender || input.trainingFocus
      ? `
User Demographics:
${input.experienceYears ? `- Training Experience: ${input.experienceYears} years` : ''}
${input.userAge ? `- Age: ${input.userAge} years old` : ''}
${input.userGender ? `- Gender: ${input.userGender}` : ''}
${input.trainingFocus ? `- Training Focus: ${input.trainingFocus === 'upper_body' ? 'Upper Body (chest/back/arms)' : input.trainingFocus === 'lower_body' ? 'Lower Body (glutes/hamstrings/quads)' : 'Balanced Development'}` : ''}
`
      : ''

    // Body type context for morphotype-based volume adjustments
    const bodyTypeContext = input.bodyType && input.userGender
      ? getBodyTypeAIContext(input.bodyType, input.userGender)
      : ''

    // Training focus context for BRO splits
    const trainingFocusContext = input.trainingFocus && input.trainingFocus !== 'balanced' && input.workoutType !== 'full_body'
      ? `
=== TRAINING FOCUS EXERCISE PRIORITIZATION ===

User has selected ${input.trainingFocus === 'upper_body' ? 'UPPER BODY' : 'LOWER BODY'} focus.

${input.trainingFocus === 'upper_body' ? `
**Upper Body Focus - Exercise Selection Priorities:**
- For CHEST workouts: Prioritize compound pressing movements (bench press variations, dips)
- For BACK workouts: Emphasize rowing and pull-up variations, ensure adequate volume
- For SHOULDERS: Include overhead pressing and lateral raise variations
- For ARMS: Ensure direct bicep and tricep work is included when appropriate
- Exercise variety: Choose exercises that maximize upper body development
` : `
**Lower Body Focus - Exercise Selection Priorities:**
- For LEG workouts: PRIORITIZE glute-focused exercises first (hip thrusts, glute bridges, Bulgarian split squats)
- Glute emphasis: Select exercise variants that maximize glute activation (e.g., high bar vs low bar squat preference)
- Hamstring work: Ensure adequate RDL/leg curl variations
- Quad work: Include squat and lunge variations, but after glute-focused movements
- Exercise order: Place glute exercises early in the workout when fatigue is lowest
`}

**Important:** This prioritization influences exercise SELECTION and ORDER, not volume allocation (that's handled at the split design level).
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

**🔴 JOINT-SPARING RIR MODULATION (MANDATORY in Intensification):**

Even in intensification phase, certain muscle groups require HIGHER RIR targets to protect joint health:

1. **ELBOW-STRESS EXERCISES (Arm Isolation):**
   - Biceps curls (all variations): RIR 2-3 (NOT 0-1)
   - Triceps extensions/pushdowns: RIR 2-3 (NOT 0-1)
   - Rationale: Tendons need sub-maximal loads in high-volume phases. Going to failure on isolation causes disproportionate tendon stress vs muscle stimulus.
   - Exception: Compound arm work (close-grip bench, chin-ups) can use RIR 1-2

2. **SHOULDER-STRESS EXERCISES (Lateral/Front Raises):**
   - Lateral raises: RIR 2-3 (even with machines)
   - Front raises: RIR 3-4 (already hit heavily by chest pressing)
   - Overhead pressing: RIR 1-2 is OK (compound movement, better force distribution)
   - Rationale: Shoulder capsule accumulates stress from ALL upper body work. Deltoid isolation to failure increases injury risk.

3. **ACCUMULATION PHASE EXCEPTION:**
   - If session variation is 'A' (Accumulation/Strength bias): RIR 1-2 is acceptable across all exercises
   - Rationale: Lower volume + heavier loads = less inflammatory stress
   - Variation 'B' (Hypertrophy/Intensification) = MUST follow joint-sparing rules above

**Implementation:**
- When selecting exercises, if exercise targets biceps/triceps isolation OR lateral/front delts, automatically set RIR to 2-3
- Override approach's default RIR for these specific exercise types ONLY
- All other exercises follow approach's normal RIR guidelines
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

    // Determine if approach has fixed vs flexible volume
    // Note: approach object no longer available in input (only approachId), defaulting to flexible volume
    const hasFixedVolume = false

    // Build caloric phase context
    const caloricPhaseContext = input.caloricPhase
      ? `
<caloric_phase_modulation>
  <current_phase>${input.caloricPhase.toUpperCase()}</current_phase>
  ${input.caloricIntakeKcal ? `<daily_intake>${input.caloricIntakeKcal > 0 ? 'Surplus' : 'Deficit'}: ${input.caloricIntakeKcal > 0 ? '+' : ''}${input.caloricIntakeKcal} kcal</daily_intake>` : ''}
  <approach_classification>${hasFixedVolume ? 'FIXED_VOLUME' : 'FLEXIBLE_VOLUME'}</approach_classification>

  <fundamental_rule>
    ⚠️ CRITICAL: The guidance below must be applied WITHIN your training approach's constraints (Priority 1), not as absolute rules.
    If the approach has specific volume limits or progression rules, THOSE TAKE PRIORITY over these guidelines (Priority 4).
  </fundamental_rule>

${input.caloricPhase === 'bulk' ? `
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
        <example>${approach.name} in bulk = ${approach.variables.setsPerExercise?.working ? `still ${approach.variables.setsPerExercise.working} sets per exercise` : 'maintain prescribed set count'}, but heavier weights + more aggressive intensity techniques</example>
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
${input.caloricPhase === 'cut' ? `
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
        <example>${approach.name} in cut = ${approach.variables.setsPerExercise?.working ? `still ${approach.variables.setsPerExercise.working} sets per exercise` : 'maintain prescribed set count'}, slightly lighter loads with focus on form</example>
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
${input.caloricPhase === 'maintenance' ? `
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
      : ''

    // Build cycle fatigue context (fatigue-aware exercise selection)
    const cycleFatigueContext = this.buildCycleFatigueContext(input, approach)

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
${approach.periodization?.accumulationPhase || approach.periodization?.intensificationPhase ? '• For multi-phase approaches, assign muscles to appropriate phases based on the current training phase' : ''}
${Object.keys(approach.advancedTechniques || {}).length > 0 ? `• Apply ${approach.name}'s specific techniques (${Object.keys(approach.advancedTechniques || {}).slice(0, 2).join(', ')}, etc.) while covering all muscles` : ''}
• If the approach has volume constraints that conflict, prioritize muscles in the order listed above
` : ''}
${input.targetVolume ? `
⚠️ MANDATORY TARGET VOLUME (MUST match within ±20%):

=== 📊 VOLUME CALCULATION RULES (APPLY THESE EXACTLY) ===

⚡ **CRITICAL**: Before selecting exercises, understand how sets count toward muscle volume:

**CALCULATION FORMULA:**
• **Primary muscle** = 1.0x set count (full credit)
• **Secondary/synergist muscle** = 0.5x set count (half credit)

**CONCRETE EXAMPLE:**
Exercise: Barbell Bench Press (4 sets)
  - Primary: chest
  - Secondary: shoulders, triceps

Volume contributions:
  → chest: +4.0 sets (4 × 1.0)
  → shoulders: +2.0 sets (4 × 0.5)
  → triceps: +2.0 sets (4 × 0.5)

**WHY THIS MATTERS:**
If target is chest = 12 sets, you CANNOT just do 3 exercises × 4 sets each.
✗ Wrong thinking: "3 chest exercises × 4 sets = 12 sets" ← Ignores primary vs secondary!
✓ Correct: Calculate primary (1.0x) + secondary (0.5x) contributions from ALL exercises

=== 🎯 STEP-BY-STEP VOLUME MATCHING STRATEGY (MANDATORY APPROACH) ===

**PROBLEM:** Indirect volume from compound movements accumulates quickly and can exceed targets for "helper muscles" (biceps, traps, rear delts, etc.)

**SOLUTION:** Use this 3-step process to avoid over-accumulation:

**STEP 1: Select Compound Movements First**
Choose your main compound exercises for primary muscle groups. These will generate indirect volume for secondary muscles.

Example for Pull Day:
- Barbell Row (4 sets): Primary: lats, upper_back | Secondary: biceps, traps
- Lat Pulldown (4 sets): Primary: lats | Secondary: biceps, upper_back

**STEP 2: Calculate Accumulated Indirect Volume**
Track how much INDIRECT volume each muscle has already received from compounds:

From Barbell Row (4 sets):
  → biceps: +2.0 indirect (4 × 0.5)
  → traps: +2.0 indirect (4 × 0.5)

From Lat Pulldown (4 sets):
  → biceps: +2.0 indirect (4 × 0.5)
  → upper_back: +2.0 indirect (4 × 0.5)

Total accumulated indirect:
  → biceps: 4.0 sets (already)
  → traps: 2.0 sets (already)
  → upper_back: 6.0 sets (4.0 direct + 2.0 indirect)

**STEP 3: Adjust Isolation Work Based on Remaining Budget**
Subtract accumulated volume from targets to determine remaining isolation work needed.

If targets are: biceps = 3 sets, traps = 2 sets
  → biceps: 3 target - 4.0 accumulated = -1.0 sets ⚠️ ALREADY OVER!
  → traps: 2 target - 2.0 accumulated = 0 sets ✓ EXACTLY MET!

**DECISION RULES:**
1. If remaining budget is NEGATIVE (like biceps above):
   - Option A: Accept being slightly over target (within ±20% tolerance)
   - Option B: Reduce compound movement sets (e.g., 3 sets instead of 4)
   - Option C: DO NOT add any direct isolation work for that muscle

2. If remaining budget is ZERO or CLOSE (like traps above):
   - DO NOT add isolation exercises for that muscle
   - Accept the volume from compounds

3. If remaining budget is POSITIVE:
   - Add isolation work for exactly that remaining amount
   - Example: rear_delts = 4 target - 1.0 accumulated = 3.0 sets → add Face Pulls (3 sets)

**WORKED EXAMPLE - Full Pull Day:**

Targets: {lats: 4, upper_back: 4, biceps: 3, traps: 2, rear_delts: 2}

Step 1 - Compounds selected:
  - Chest-Supported T-Bar Row (4 sets)
    Primary: lats (4.0), upper_back (4.0)
    Secondary: biceps (2.0), traps (2.0)

Step 2 - Calculate accumulated:
  lats: 4.0 direct
  upper_back: 4.0 direct
  biceps: 2.0 indirect
  traps: 2.0 indirect
  rear_delts: 0

Step 3 - Remaining budgets:
  lats: 4 target - 4.0 actual = 0 ✓ DONE
  upper_back: 4 target - 4.0 actual = 0 ✓ DONE
  biceps: 3 target - 2.0 actual = 1.0 → ADD 1 set bicep curl OR accept 2.0 (within tolerance)
  traps: 2 target - 2.0 actual = 0 ✓ DONE (NO shrugs needed)
  rear_delts: 2 target - 0 actual = 2.0 → ADD 2 sets rear delt work

Final selection:
  1. Chest-Supported T-Bar Row (4 sets)
  2. Dumbbell Hammer Curl (2 sets) ← added 1 extra for buffer
  3. Cable Rear Delt Fly (2 sets)

Total volume check:
  lats: 4.0 (target 4) ✓
  upper_back: 4.0 (target 4) ✓
  biceps: 4.0 = 2.0 direct + 2.0 indirect (target 3, +1.0 over but within ±20%) ✓
  traps: 2.0 indirect (target 2) ✓
  rear_delts: 2.0 (target 2) ✓

⚠️ **YOU MUST follow this step-by-step process when generating exercises to avoid volume violations.**

=== TARGET VOLUME TABLE (HARD CONSTRAINTS) ===
${Object.entries(input.targetVolume).map(([muscle, sets]) => {
  const setCount = typeof sets === 'number' ? sets : 0
  const minSets = Math.floor(setCount * 0.8)
  const maxSets = Math.ceil(setCount * 1.2)

  if (setCount === 0) {
    return `❌ ${muscle}: ZERO SETS REQUIRED - DO NOT include ANY exercises targeting this muscle`
  }

  return `✓ ${muscle}: ${setCount} sets (acceptable range: ${minSets}-${maxSets} sets)`
}).join('\n')}

${Object.keys(exerciseCountByMuscle).length > 0 ? `
⚠️⚠️⚠️ CRITICAL VOLUME COMPLIANCE CHECK ⚠️⚠️⚠️

=== 🔢 MANDATORY EXERCISE COUNT REQUIREMENTS ===

The following exercise counts are MANDATORY - not suggestions!
Your response WILL BE REJECTED if you don't meet these minimums:

${Object.entries(exerciseCountByMuscle).map(([muscle, count]) =>
  `🎯 ${muscle}: ${count} exercise${count > 1 ? 's' : ''} MINIMUM (${input.targetVolume?.[muscle] || 0} sets ÷ ${maxSetsPerExercise} sets/ex = ${count})`
).join('\n')}

⚠️ THIS IS A HARD CONSTRAINT - NO EXCEPTIONS:
- If a muscle needs 3 exercises, you MUST generate EXACTLY 3 different exercises targeting that muscle as PRIMARY
- Each exercise MUST have ${maxSetsPerExercise} working sets (from approach methodology)
- The math MUST work: exercises × sets/exercise = target volume

Example for this workout:
${Object.entries(exerciseCountByMuscle).slice(0, 2).map(([muscle, count]) => {
  const targetSets = input.targetVolume?.[muscle] || 0
  return `- ${muscle}: ${count} exercises × ${maxSetsPerExercise} sets = ${count * (maxSetsPerExercise || 2)} sets (target: ${targetSets})`
}).join('\n')}

🔒 BEFORE RESPONDING, YOU MUST VERIFY:
□ Count your exercises for each muscle group listed above
□ Each muscle meets the MINIMUM exercise count
□ Total working sets = exercises × ${maxSetsPerExercise}

❌ REJECTION CRITERIA (DO NOT SUBMIT IF ANY APPLY):
- ANY muscle below minimum exercise count = REJECTED
- Total volume < target volume = REJECTED
- Missing a required muscle group entirely = REJECTED

FAILURE TO MEET EXERCISE COUNT = VOLUME UNDER-TARGET = REJECTION
` : ''}

${(() => {
  // Generate dynamic advanced technique compatibility rules
  const techniquesRequiringConsecutiveSets = Object.entries(approach.advancedTechniques || {})
    .filter(([_, tech]) => tech.requiresConsecutiveSets && tech.minSets)

  if (techniquesRequiringConsecutiveSets.length === 0) return ''

  return techniquesRequiringConsecutiveSets.map(([techName, tech]) => `
=== ${techName.toUpperCase().replace(/_/g, ' ')} COMPATIBILITY RULES ===
⚠️ CRITICAL: ${techName} technique requires ${tech.minSets} consecutive sets${tech.protocol ? ` (${tech.protocol.substring(0, 50)}...)` : ''}.
Before applying ${techName} to a muscle, verify compatibility:

✓ COMPATIBLE: Target volume ≥ ${tech.minSets} sets
  Example: chest = 12 sets → Can use ${12 - tech.minSets!} regular sets + ${tech.minSets} ${techName} sets = 12 total ✓

❌ INCOMPATIBLE: Target volume < ${tech.minSets} sets
  Example: biceps = ${Math.max(1, tech.minSets! - 3)} sets → CANNOT use ${techName} (would require minimum ${tech.minSets} sets)
  Solution: Use standard set exercises instead

PRIORITY RULE: Volume targets OVERRIDE ${techName} protocol when conflicts arise.
If you cannot fit ${techName} within the volume constraint, use standard set/rep schemes.
`).join('\n')
})()}

=== MUSCLE TAXONOMY (PREVENT CONFUSION) ===
These are DISTINCT muscle groups - do not confuse or combine:
• rear_delts ≠ shoulders (rear delts are NOT shoulders)
• upper_back ≠ lower_back (separate spinal regions)
• biceps ≠ forearms (separate arm muscles)
• hamstrings ≠ glutes (separate posterior chain)
• chest ≠ shoulders (separate upper body push muscles)

When target is 0 for a muscle: DO NOT add exercises for that muscle "by accident"
Example: If target is { rear_delts: 2, shoulders: 0 }
  → Include: rear delt flies (2 sets) ✓
  → DO NOT include: lateral raises, overhead press ❌ (these target shoulders)

=== 🔑 EXACT MUSCLE KEYS REQUIRED (CRITICAL) ===

⚠️ **YOU MUST USE THESE EXACT MUSCLE KEY NAMES IN YOUR primaryMuscles AND secondaryMuscles ARRAYS:**

${Object.keys(input.targetVolume).map(muscle => `  • "${muscle}"`).join('\n')}

**DO NOT use generic synonyms or anatomical names!**

Common mistakes to AVOID:
${Object.keys(input.targetVolume).includes('shoulders_front') || Object.keys(input.targetVolume).includes('shoulders_side') || Object.keys(input.targetVolume).includes('shoulders_rear') ? `
  ❌ WRONG: primaryMuscles: ["shoulders", "deltoids", "anterior deltoid"]
  ✅ CORRECT: Use the EXACT keys listed above:
     - For overhead/shoulder press → primaryMuscles: ["shoulders_front"]
     - For lateral raises → primaryMuscles: ["shoulders_side"]
     - For rear delt flies → primaryMuscles: ["shoulders_rear"]
` : ''}${Object.keys(input.targetVolume).includes('chest_upper') || Object.keys(input.targetVolume).includes('chest_lower') ? `
  ❌ WRONG: primaryMuscles: ["chest", "pectorals"]
  ✅ CORRECT: Use the EXACT keys listed above:
     - For incline press → primaryMuscles: ["chest_upper"]
     - For decline/flat press → primaryMuscles: ["chest_lower"] or ["chest"]
` : ''}
**The validator performs EXACT string matching. If you use a different key, the volume will NOT be counted!**

=== VALIDATION PREVIEW ===
Your exercise selection will be validated against these exact constraints:
${Object.entries(input.targetVolume).map(([muscle, sets]) => {
  const setCount = typeof sets === 'number' ? sets : 0
  const minSets = Math.floor(setCount * 0.8)
  const maxSets = Math.ceil(setCount * 1.2)
  return `• ${muscle}: Must be ${minSets}-${maxSets} sets (target: ${setCount})`
}).join('\n')}

FAILURE TO MEET THESE CONSTRAINTS WILL RESULT IN REJECTION.
` : ''}
${input.sessionPrinciples ? `
Session-Specific Principles:
${input.sessionPrinciples.map(p => `- ${p}`).join('\n')}` : ''}
`
      : ''

    // Language-specific examples for technical cues
    const technicalCuesExamples = targetLanguage === 'it'
      ? '"Braccia semi-piegate durante tutto il movimento", "Contrai forte i pettorali in cima", "Evita il blocco sui gomiti"'
      : '"Semi-bent arms throughout the movement", "Squeeze pecs hard at top", "Avoid lockout on elbows"'

    const warmupTechnicalFocus = targetLanguage === 'it'
      ? { set1: 'Senti lo schema del movimento', set2: 'Costruisci la connessione mente-muscolo' }
      : { set1: 'Feel the movement pattern', set2: 'Build mind-muscle connection' }

    const setGuidanceTechnicalExamples = targetLanguage === 'it'
      ? '"ROM completo", "Contrai in cima", "Controlla l\'eccentrica"'
      : '"Full ROM", "Squeeze at top", "Control the eccentric"'

    // Language-specific examples for mental focus cues
    const mentalFocusExamples = targetLanguage === 'it'
      ? `- Use imagery/visualization verbs: "immagina", "visualizza", "pensa a", "senti come se"
    - Make it EXERCISE-SPECIFIC (different cue for each exercise), examples:
      * Peck Deck: "Immagina di portare i bicipiti vicini mentre tieni il petto il più alto possibile"
      * Lat Pulldown: "Visualizza i gomiti che tirano dietro al busto, non le mani verso il basso"
      * Leg Press: "Senti come se spingessi il pavimento lontano da te, non il peso in alto"
      * Cable Face Pull: "Pensa a separare le mani il più possibile, come se aprissi una porta scorrevole"
      * Cable Fly: "Visualizza di abbracciare un grande albero davanti a te"
      * Dumbbell Row: "Immagina di portare il gomito il più indietro possibile, verso il soffitto"
    - Vary by set intensity and number:
      * Early sets (1-2): Connection cues - "Senti il muscolo attivarsi"
      * Middle sets (3-4): Intensity cues - "Visualizza il muscolo contrarsi forte"
      * Final sets: Power/explosive cues - "Immagina potenza esplosiva attraverso il movimento"`
      : `- Use imagery/visualization verbs: "imagine", "visualize", "think of", "feel as if"
    - Make it EXERCISE-SPECIFIC (different cue for each exercise), examples:
      * Peck Deck: "Imagine bringing your biceps close together while keeping your chest as high as possible"
      * Lat Pulldown: "Visualize your elbows pulling behind your torso, not your hands pulling down"
      * Leg Press: "Feel as if you're pushing the floor away from you, not pushing the weight up"
      * Cable Face Pull: "Think of pulling your hands as far apart as possible, like opening sliding doors"
      * Cable Fly: "Visualize hugging a large tree in front of you"
      * Dumbbell Row: "Imagine driving your elbow as far back as possible, toward the ceiling"
    - Vary by set intensity and number:
      * Early sets (1-2): Connection cues - "Feel the muscle activate"
      * Middle sets (3-4): Intensity cues - "Visualize the muscle contracting hard"
      * Final sets: Power/explosive cues - "Imagine explosive power through the movement"`

    // Pre-compute volume requirements summary for primacy effect (GPT-5.1 hybrid approach)
    const volumeRequirementsSummary = Object.keys(exerciseCountByMuscle).length > 0
      ? `
🚨🚨🚨 CRITICAL EXERCISE COUNT REQUIREMENTS - READ FIRST 🚨🚨🚨

<critical_volume_requirements>
<mandatory>TRUE</mandatory>

YOU MUST GENERATE EXACTLY THESE EXERCISE COUNTS:
${Object.entries(exerciseCountByMuscle).map(([muscle, count]) =>
  `• ${muscle}: ${count} exercise${count > 1 ? 's' : ''} (${input.targetVolume?.[muscle]} sets ÷ ${maxSetsPerExercise} sets/ex)`
).join('\n')}

TOTAL EXERCISES NEEDED: ${Object.values(exerciseCountByMuscle).reduce((sum, count) => sum + count, 0)}

<solution_completeness>
- You MUST generate ALL exercises for EVERY muscle group listed
- DO NOT be overly concise or stop early
- Incomplete workouts will be REJECTED
- Each exercise = ${maxSetsPerExercise} working sets
</solution_completeness>
</critical_volume_requirements>

🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨

`
      : ''

    const prompt = `
Create a ${input.workoutType} workout using AI-generated exercises.
${volumeRequirementsSummary}
=== 🎯 SOLUTION COMPLETENESS REQUIREMENT ===

**THIS IS A ONE-SHOT GENERATION TASK**

You MUST generate a COMPLETE workout that satisfies ALL constraints in a SINGLE response.

✅ **DO:**
- Select ALL exercises needed to meet volume targets
- Calculate exact set counts for each exercise
- Provide complete rationale and alternatives for each exercise
- Verify your solution meets ALL constraints BEFORE outputting JSON

❌ **DO NOT:**
- Generate partial exercise lists expecting further prompts
- Suggest "add more exercises as needed" — select the exact exercises NOW
- Provide placeholders or incomplete rationales
- Leave any muscle group under-targeted
- Stop after analyzing constraints — proceed to full implementation

**CRITICAL**: Your response must be production-ready and immediately executable. Treat yourself as an autonomous system that must deliver a complete, valid workout without requiring follow-up clarification.

==========================================================================

Approach context:
${context}
${demographicContext}
${bodyTypeContext}
${trainingFocusContext}
${exercisePrinciplesContext}
${romEmphasisContext}
${stimulusToFatigueContext}
${periodizationContext}
${caloricPhaseContext}
${cycleFatigueContext}
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

${input.exerciseHistoryContext && input.exerciseHistoryContext.length > 0 ? `
=== EXERCISE ROTATION CONTEXT ===
The following exercises have been used recently. Consider rotation if plateau is detected:

${input.exerciseHistoryContext.map(ex => `- ${ex.name}: ${ex.weeksUsed} week${ex.weeksUsed !== 1 ? 's' : ''} in rotation
  ${ex.isPlateaued
    ? `⚠️ PLATEAU DETECTED (${ex.avgWeightChange >= 0 ? '+' : ''}${ex.avgWeightChange}% weight change) - Consider substituting with similar movement pattern`
    : `✓ Progressing (${ex.avgWeightChange >= 0 ? '+' : ''}${ex.avgWeightChange}% weight change)`}`).join('\n')}

ROTATION RULES:
1. If an exercise shows PLATEAU (4+ weeks, <2.5% progress): prefer a fresh alternative with similar movement pattern
2. Maintain the same muscle targeting when substituting (e.g., Bench Press → Incline Dumbbell Press)
3. Do NOT remove compound exercises entirely - substitute with variants instead
4. Exercises marked as "Progressing" should be kept in rotation unless other constraints apply
5. User prefers CONSERVATIVE rotation - only change when plateau is clearly evident
` : ''}

=== ADVANCED TRAINING TECHNIQUES (MANDATORY CONSIDERATION) ===
You MUST apply 2-3 advanced techniques per workout when the approach supports them (check approach.advancedTechniques).
This is NOT optional - techniques are a core part of effective training programming.

Available techniques:
- drop_set: Reduce weight and continue without rest. Best for ISOLATION exercises at END of workout.
  Config: { "type": "drop_set", "drops": 2, "dropPercentage": 20 }
- rest_pause: Brief pauses (10-15s) within a set to extend volume. Works for compound and isolation.
  Config: { "type": "rest_pause", "miniSets": 3, "restSeconds": 15 }
- superset: Two exercises back-to-back without rest. Pair agonist-antagonist or same muscle group.
  Config: { "type": "superset", "pairedExerciseIndex": <index of paired exercise>, "restAfterBoth": 90 }
- top_set_backoff: One heavy top set followed by lighter backoff sets. Best for MAIN compound lifts at START.
  Config: { "type": "top_set_backoff", "topSetReps": 5, "backoffSets": 2, "backoffPercentage": 15, "backoffReps": 8 }
- myo_reps: Activation set + multiple mini-sets with 3-5s rest. For isolation, ADVANCED users only.
  Config: { "type": "myo_reps", "activationReps": 15, "miniSetReps": 5, "miniSets": 4, "restSeconds": 5 }
- cluster_set: Intra-set rest (15-30s) between small rep clusters. For heavy compounds, strength focus.
  Config: { "type": "cluster_set", "repsPerCluster": 2, "clusters": 5, "intraRestSeconds": 20 }
- pyramid: Progressive weight changes across sets. Good for beginners/intermediate.
  Config: { "type": "pyramid", "direction": "ascending", "steps": 4 }

=== PROPRIETARY TECHNIQUES (for specific training approaches) ===
- fst7_protocol: FST-7 signature technique - 7 sets with 30-45s rest for maximum pump. ISOLATION exercises only.
  Config: { "type": "fst7_protocol", "sets": 7, "restSeconds": 30, "targetReps": 12, "interSetPosing": false }
  Use when: Approach is FST-7 or final exercise of session for maximum pump
- loaded_stretching: 30-60s isometric hold in stretched position (Mountain Dog). ISOLATION exercises.
  Config: { "type": "loaded_stretching", "holdSeconds": 45, "targetRpe": 7 }
  Use when: Approach is Mountain Dog or targeting stretch-mediated hypertrophy
- mechanical_drop_set: Change exercise variation without reducing weight. Great for chest, shoulders, back.
  Config: { "type": "mechanical_drop_set", "variations": ["incline", "flat", "decline"], "repsPerVariation": 10, "restBetween": 0 }
  Use when: Approach supports mechanical advantage techniques or for compound finishers
- lengthened_partials: Partial ROM in stretched position for stretch-mediated hypertrophy. ISOLATION exercises.
  Config: { "type": "lengthened_partials", "partialReps": 8, "rangePercentage": 40 }
  Use when: Approach is Kuba Method or targeting lengthened position training
- forced_reps: Partner-assisted reps beyond failure. ADVANCED users only, requires training partner.
  Config: { "type": "forced_reps", "assistedReps": 2, "requiresPartner": true }
  Use when: Approach is Y3T or Heavy Duty, user is advanced
- pre_exhaust: Isolation to compound pairing with minimal rest. Pre-fatigue target muscle before compound.
  Config: { "type": "pre_exhaust", "isolationExerciseIndex": 0, "compoundExerciseIndex": 1, "restBetween": 0 }
  Use when: Approach is Heavy Duty or FST-7, or when targeting specific muscle activation

TECHNIQUE APPLICATION REQUIREMENTS:
1. Check approach.advancedTechniques - if the approach supports techniques, you MUST use them
2. Apply AT LEAST this many techniques based on user experience:
   - Beginner: 1 technique (superset or pyramid only)
   - Intermediate: 2 techniques minimum
   - Advanced: 3 techniques minimum
3. Match technique to exercise type and position:
   - MAIN compound (position 1-2): top_set_backoff, cluster_set, or pyramid
   - ISOLATION exercises (last 2-3): drop_set, rest_pause, or myo_reps
   - Antagonist pairs: superset (e.g., biceps + triceps)
4. Provide clear rationale explaining WHY this technique benefits this specific exercise
5. If applying superset, both paired exercises must have matching "pairedExerciseIndex" pointing to each other

=== TECHNIQUE ENFORCEMENT CHECKLIST ===
Before returning your response, VERIFY these conditions:
□ If approach.advancedTechniques has entries → at least 2 exercises MUST have advancedTechnique
□ At least ONE compound exercise has a technique (top_set_backoff, cluster_set, pyramid, or mechanical_drop_set)
□ At least ONE isolation exercise has a technique (drop_set, rest_pause, myo_reps, fst7_protocol, loaded_stretching, or lengthened_partials)
□ The LAST isolation exercise should have drop_set, myo_reps, or fst7_protocol for maximum pump
□ If approach is FST-7 → use fst7_protocol on at least one isolation exercise
□ If approach is Mountain Dog → use loaded_stretching on at least one exercise
□ If approach is Heavy Duty or Y3T → consider pre_exhaust or forced_reps for advanced users

EXAMPLE - Intermediate Push Day (4 exercises):
1. Bench Press - advancedTechnique: { technique: "top_set_backoff", config: { type: "top_set_backoff", topSetReps: 5, backoffSets: 2, backoffPercentage: 15, backoffReps: 8 }, rationale: "Build strength with heavy top set, then accumulate volume" }
2. Incline DB Press - NO technique (volume accumulation)
3. Cable Fly - advancedTechnique: { technique: "rest_pause", config: { type: "rest_pause", miniSets: 3, restSeconds: 15 }, rationale: "Extend time under tension for chest isolation" }
4. Tricep Pushdown - advancedTechnique: { technique: "drop_set", config: { type: "drop_set", drops: 2, dropPercentage: 20 }, rationale: "Maximum pump on final exercise" }
Result: 3 techniques applied ✓

FAILURE TO APPLY TECHNIQUES when approach supports them = INCOMPLETE WORKOUT

<constraint_hierarchy>
  <priority_1 level="ABSOLUTE" override="none">
    <name>🏆 TRAINING APPROACH PHILOSOPHY</name>
    <description>Defines HOW to train according to ${approach.name} methodology</description>
    <enforcement>Approach constraints are absolute and CANNOT be violated under any circumstances</enforcement>
    <current_approach>
      <name>${approach.name}</name>
      ${approach.variables.setsPerExercise?.working ? `<sets_per_exercise>${approach.variables.setsPerExercise.working} working sets per exercise</sets_per_exercise>` : ''}
      ${approach.periodization ? `<periodization>${approach.periodization.mesocycleLength || 'N/A'} week mesocycles with ${Object.keys(approach.periodization).filter(k => k.includes('Phase')).length} distinct phases</periodization>` : ''}
      ${Object.keys(approach.advancedTechniques || {}).length > 0 ? `<advanced_techniques>${Object.keys(approach.advancedTechniques || {}).slice(0, 3).join(', ')}${Object.keys(approach.advancedTechniques || {}).length > 3 ? ', ...' : ''}</advanced_techniques>` : ''}
      ${approach.variables.repRanges ? `<rep_ranges>Compound: ${approach.variables.repRanges.compound?.[0]}-${approach.variables.repRanges.compound?.[1]}, Isolation: ${approach.variables.repRanges.isolation?.[0]}-${approach.variables.repRanges.isolation?.[1]}</rep_ranges>` : ''}
    </current_approach>
    <binding>This is the foundation - all other constraints must work WITHIN this framework</binding>
  </priority_1>

  <priority_2 level="MANDATORY" override="priority_3_and_below">
    <name>🎯 TARGET VOLUME & EXERCISE COUNT</name>
    <description>Defines WHAT muscles to train and HOW MANY exercises per muscle</description>
    <enforcement>
      You MUST meet target volume for EACH muscle. Given ${maxSetsPerExercise || 'the approach'} sets/exercise:
      - Calculate required exercises: targetVolume ÷ setsPerExercise = exercise count
      - Generate AT LEAST that many exercises per muscle as PRIMARY target
      - Total sets = exercises × setsPerExercise must match targetVolume (±20%)
    </enforcement>
    ${Object.keys(exerciseCountByMuscle).length > 0 ? `
    <exercise_count_requirements>
${Object.entries(exerciseCountByMuscle).map(([muscle, count]) =>
  `      - ${muscle}: ${count} exercises (${input.targetVolume?.[muscle] || 0} sets ÷ ${maxSetsPerExercise} = ${count})`
).join('\n')}
    </exercise_count_requirements>
    ` : ''}
    ${input.sessionFocus ? `
    <required_muscles>${input.sessionFocus.join(', ')}</required_muscles>
    ` : ''}
    <binding>This is CRITICAL - failure to meet exercise count = volume under-target = REJECTION</binding>
  </priority_2>

  <priority_3 level="IMPORTANT" override="priority_4_and_below">
    <name>📊 Periodization Phase</name>
    <applies_when>Approach supports periodization</applies_when>
    <description>Guides intensity/volume within approach-defined ranges</description>
  </priority_3>

  <priority_4 level="RECOMMENDED" override="priority_5_only">
    <name>🍽️ Caloric Phase</name>
    <applies_within>Approach framework - modulate volume/intensity</applies_within>
    <description>Adjust training stress based on energy availability</description>
    ${input.caloricPhase ? `
    <current_phase>${input.caloricPhase}</current_phase>
    ` : ''}
  </priority_4>

  <priority_5 level="OPTIONAL" override="none">
    <name>👤 Weak Points & User Preferences</name>
    <description>Tactical adjustments for individual customization</description>
    <enforcement>Consider when possible, but never violate higher priorities</enforcement>
    ${input.weakPoints && input.weakPoints.length > 0 ? `
    <weak_points>${input.weakPoints.join(', ')}</weak_points>
    ` : ''}
  </priority_5>
</constraint_hierarchy>

<constraint_interaction_rules>
  <complementary_relationship>
    Approach methodology (Priority 1) and Target Volume (Priority 2) are COMPLEMENTARY, not conflicting:
    - Priority 1 defines HOW MANY SETS per exercise (e.g., ${maxSetsPerExercise || 2} sets/exercise)
    - Priority 2 defines TOTAL VOLUME per muscle (e.g., 8 sets for biceps)
    - Solution: ADJUST EXERCISE COUNT to satisfy both!

    Example: biceps target = 8 sets, approach = ${maxSetsPerExercise || 2} sets/exercise
    → Generate ${8 / (maxSetsPerExercise || 2)} biceps exercises × ${maxSetsPerExercise || 2} sets = 8 sets total ✓

    NEVER violate Priority 1 by adding more sets per exercise.
    INSTEAD, add MORE EXERCISES to reach the volume target.
  </complementary_relationship>

  <conflict_resolution_rule>
    When constraints conflict, ALWAYS prioritize the HIGHER numbered priority.

    The HIGHER priority ALWAYS WINS - no exceptions.

    <example name="${approach.name} + BULK conflict (if approach has fixed volume)">
      <priority_1_says>${approach.name}: "${approach.variables.setsPerExercise?.working ? `${approach.variables.setsPerExercise.working} sets per exercise` : 'prescribed set structure'}, NEVER add more sets"</priority_1_says>
      <priority_4_says>BULK: "+15-20% volume"</priority_4_says>
      <resolution>Priority 1 WINS</resolution>
      <correct_action>Stay within approach's prescribed set structure, increase INTENSITY (heavier weights${Object.keys(approach.advancedTechniques || {}).length > 0 ? `, ${Object.keys(approach.advancedTechniques || {}).slice(0, 2).join(', ')}` : ''})</correct_action>
      <wrong_action>Violate approach's set structure by adding extra volume</wrong_action>
    </example>

    ${(() => {
      const minSetsTechnique = Object.entries(approach.advancedTechniques || {}).find(([_, tech]) => tech.minSets && tech.requiresConsecutiveSets)
      if (!minSetsTechnique) return ''
      const [techName, tech] = minSetsTechnique
      return `<example name="${techName} + Low Volume conflict">
      <priority_1_says>${approach.name}: "Use ${tech.minSets} consecutive sets for ${techName}"</priority_1_says>
      <priority_2_says>Target volume: muscle X = ${Math.max(1, tech.minSets! - 3)} sets</priority_2_says>
      <resolution>Priority 2 WINS (volume targets are MANDATORY)</resolution>
      <correct_action>Use standard set exercises for this muscle (${techName} incompatible)</correct_action>
      <wrong_action>Force ${techName} with ${tech.minSets} sets (VIOLATES volume target)</wrong_action>
    </example>`
    })()}
  </conflict_resolution_rule>
</constraint_interaction_rules>

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
  * Tailor to the ${approach.name} philosophy${approach.romEmphasis ? ` (emphasizes ${Object.entries(approach.romEmphasis).filter(([k, v]) => k !== 'principles' && typeof v === 'number' && v > 30).map(([k]) => k).join(', ')})` : ''}
  * Examples: ${technicalCuesExamples}
- warmupSets: ONLY for compound movements (squat, deadlift, bench, overhead press, rows), provide 2 warmup sets:
  * Set 1: 50% weight, 15 reps, RIR 5, 60s rest, technicalFocus: "${warmupTechnicalFocus.set1}"
  * Set 2: 65% weight, 12 reps, RIR 3, 90s rest, technicalFocus: "${warmupTechnicalFocus.set2}"
  * Isolation exercises (curls, raises, flyes) do NOT need warmup sets
- setGuidance: For ALL exercises, provide per-set technical and mental focus for EACH working set:
  * technicalFocus: What to focus on technically (e.g., ${setGuidanceTechnicalExamples})
  * mentalFocus: VISUALIZATION-BASED mental imagery specific to exercise execution
    ${mentalFocusExamples}
  * Progression across sets: early sets focus on mind-muscle connection imagery, later sets on power/intensity imagery
  * Keep concise but descriptive (8-15 words for visualization cues)

=== 🎯 EXERCISE SELECTION QUALITY GUIDELINES ===

When selecting exercises, prioritize quality and effectiveness:

**EQUIPMENT MATCHING:**
✓ ONLY select exercises using equipment from the "Available Equipment" list above
✓ Match equipment to movement patterns (e.g., cables for constant tension, dumbbells for unilateral work)
✗ DO NOT invent equipment the user doesn't have
✗ DO NOT select "exotic" or overly complex variations without clear rationale

**EXERCISE EFFECTIVENESS:**
✓ Prioritize evidence-based, proven exercises with strong scientific backing
✓ Use exercises from the user's training history (see "Previously Used Exercises" above) when appropriate for consistency
✓ Select compound movements that efficiently target multiple muscle groups
✗ Avoid unnecessarily complex or "trendy" variations without proven benefits
✗ DO NOT select exercises that require specialized equipment or advanced skill unless user has experience

**USER CONTEXT INTEGRATION:**
✓ Consider user's experience level (${input.experienceYears ? `${input.experienceYears} years` : 'not specified'}) - beginners need simpler movements
${input.userAge && input.userAge > 50 ? '✓ Prioritize joint-friendly variations (user is 50+ years old)' : ''}
✓ Respect active insights and avoid flagged exercises (see "Active User Insights" section)
✓ Account for weak points: ${input.weakPoints && input.weakPoints.length > 0 ? input.weakPoints.join(', ') : 'none specified'}

=== 📋 EXERCISE ORDERING OPTIMIZATION ===

**CRITICAL:** The ORDER in which you list exercises matters for training effectiveness.

**MANDATORY SEQUENCING RULES:**

1. **COMPOUND MOVEMENTS FIRST (highest neural/systemic demand)**
   - Multi-joint exercises targeting large muscle groups
   - Examples: Squats, Deadlifts, Rows, Presses, Pull-ups
   - Why: Require most coordination, strength, and focus when fresh

2. **ISOLATION MOVEMENTS SECOND (lower systemic demand)**
   - Single-joint exercises targeting specific muscles
   - Examples: Bicep Curls, Lateral Raises, Leg Curls, Tricep Extensions
   - Why: Can be performed effectively even when fatigued

3. **MUSCLE GROUP SIZE PRIORITY (within each category)**
   - Larger muscles before smaller muscles
   - Example Push Day: Chest Press → Shoulder Press → Tricep Extension
   - Example Pull Day: Row → Pulldown → Bicep Curl → Rear Delt Fly

4. **FATIGUE MANAGEMENT**
   - Exercises for same muscle group should be distributed thoughtfully
   - Avoid consecutive exercises that heavily fatigue the same stabilizers
   - Example: Don't do Overhead Press immediately after Heavy Bench Press (both stress shoulders)

**CORRECT SEQUENCING EXAMPLE (Pull Day):**
1. Barbell Row (compound, large muscle groups: lats, upper back)
2. Lat Pulldown (compound, lats-focused)
3. Face Pull (isolation, rear delts)
4. Bicep Curl (isolation, small muscle)
5. Shrug (isolation, traps - if needed)

**INCORRECT SEQUENCING EXAMPLE:**
1. Bicep Curl ❌ (isolation should not be first)
2. Face Pull ❌ (isolation before compounds)
3. Barbell Row (should be first)
4. Lat Pulldown (ok position)
5. Shrug (ok position)

**EXCEPTION:** Pre-exhaust techniques (if specified by approach methodology)
- May intentionally place isolation before compound for specific muscle focus
- Only use if explicitly part of the training approach philosophy

⚠️ **YOU MUST order your selected exercises following these sequencing rules.**

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

=== 🔍 SELF-VERIFICATION CHECKLIST (Complete BEFORE generating final JSON) ===

**MANDATORY PRE-OUTPUT VERIFICATION:**

Before you output your final JSON, you MUST verify your exercise selection meets ALL constraints. Follow these steps:

${input.targetVolume ? `
**STEP 1: Volume Accuracy Verification**

Calculate total sets per muscle using the formula: Primary = 1.0x sets, Secondary = 0.5x sets

For EACH muscle in your workout, show your calculation:

${Object.entries(input.targetVolume).map(([muscle, sets]) => {
  const setCount = typeof sets === 'number' ? sets : 0
  const minSets = Math.floor(setCount * 0.8)
  const maxSets = Math.ceil(setCount * 1.2)

  if (setCount === 0) {
    return `• ${muscle}: TARGET = 0 sets
  → Verify: NO exercises target ${muscle} (neither primary nor secondary)
  → If ANY exercise targets ${muscle} → REMOVE it`
  }

  return `• ${muscle}: TARGET = ${setCount} sets (range: ${minSets}-${maxSets})
  → Calculate: [List each exercise's contribution]
    Example: "Bench Press (4 sets, primary) = +4.0 sets"
             "Overhead Press (3 sets, secondary) = +1.5 sets"
    Total = [sum]
  → Check: Is total within ${minSets}-${maxSets}?
  → If NO → REVISE exercises (add/remove sets or change exercises)`
}).join('\n\n')}

**If ANY muscle is outside tolerance → You MUST REVISE before finalizing**
` : ''}

${input.sessionFocus ? `
**STEP 2: Muscle Coverage Verification**

Required muscles: ${input.sessionFocus.join(', ')}

For EACH required muscle:
  ✓ Verify at least 1 exercise has it as primary or secondary
  ✓ If missing → ADD an exercise targeting that muscle

**If ANY required muscle is missing → You MUST ADD an exercise before finalizing**
` : ''}

${maxTotalSets || maxSetsPerExercise ? `
**STEP 3: Approach Constraints Verification**

${maxTotalSets ? `Max total sets per workout: ${maxTotalSets}` : ''}
${maxSetsPerExercise ? `Max sets per exercise: ${maxSetsPerExercise}` : ''}

Calculate:
  → Total sets across ALL exercises = [sum all exercise sets]
  → Max sets in any single exercise = [find max]

Check:
  ${maxTotalSets ? `→ Total ≤ ${maxTotalSets}? If NO → REDUCE sets or REMOVE exercises` : ''}
  ${maxSetsPerExercise ? `→ All exercises ≤ ${maxSetsPerExercise} sets? If NO → REDUCE sets per exercise` : ''}

**If constraints violated → You MUST REVISE before finalizing**
` : ''}

${(() => {
  // Check if approach has advanced techniques requiring consecutive sets
  const techniquesRequiringConsecutiveSets = Object.entries(approach.advancedTechniques || {})
    .filter(([_, tech]) => tech.requiresConsecutiveSets && tech.minSets)

  if (techniquesRequiringConsecutiveSets.length === 0 || !input.targetVolume) return ''

  return `
**STEP 4: Advanced Technique Compatibility Verification**

${approach.name} uses advanced techniques that require consecutive sets. Verify compatibility:

${techniquesRequiringConsecutiveSets.map(([techName, tech]) => `
**${techName.toUpperCase()}** (requires ${tech.minSets} consecutive sets):
  → For each muscle where you want to use ${techName}:
    • Check target volume ≥ ${tech.minSets} sets
    • If target < ${tech.minSets} sets → CANNOT use ${techName}, use standard sets instead
`).join('\n')}

${input.targetVolume ? `Example verification for current target volumes:
${Object.entries(input.targetVolume)
  .map(([muscle, sets]) => {
    const compatible = techniquesRequiringConsecutiveSets.every(([_, tech]) => sets >= (tech.minSets || 0))
    return `  • ${muscle}: ${sets} sets ${compatible ? '→ COMPATIBLE ✓' : `→ INCOMPATIBLE (need ${Math.max(...techniquesRequiringConsecutiveSets.map(([_, tech]) => tech.minSets || 0))}+ for advanced techniques)`}`
  })
  .join('\n')}` : ''}

**If advanced technique used on incompatible muscle → You MUST CHANGE to standard sets before finalizing**
`
})()}

**FINAL CHECK:**
  1. All volume targets met? ✓ / ✗
  2. All required muscles covered? ✓ / ✗
  3. All approach constraints satisfied? ✓ / ✗
${(() => {
  const techniquesRequiringConsecutiveSets = Object.entries(approach.advancedTechniques || {})
    .filter(([_, tech]) => tech.requiresConsecutiveSets && tech.minSets)

  if (techniquesRequiringConsecutiveSets.length === 0) return ''

  return techniquesRequiringConsecutiveSets.map(([techName, tech], idx) =>
    `  ${4 + idx}. ${techName} only on compatible muscles (${tech.minSets}+ sets required)? ✓ / ✗ / N/A`
  ).join('\n')
})()}

**⚠️ ONLY AFTER ALL CHECKS PASS → Generate the JSON below**

If any check fails (✗) → REVISE your exercise selection and re-verify

==========================================================================

${targetLanguage === 'it' ? `
⚠️ LINGUA OBBLIGATORIA: ITALIANO
Scrivi TUTTI i seguenti campi in italiano:
- "technicalCues": suggerimenti tecnici in italiano (es. "Controlla l'eccentrica", "Contrai i pettorali in cima")
- "setGuidance[].technicalFocus": focus tecnico in italiano (es. "ROM completo", "Controlla il movimento")
- "setGuidance[].mentalFocus": visualizzazione mentale in italiano (es. "Immagina di spingere il peso lontano")
- "warmupSets[].technicalFocus": focus tecnico warmup in italiano
- "rationaleForSelection": motivazione della scelta in italiano
- "workoutRationale": motivazione generale del workout in italiano
- "weakPointAddress": come vengono affrontati i punti deboli in italiano
- "advancedTechnique.rationale": motivazione della tecnica avanzata in italiano
I nomi degli esercizi possono restare in inglese.
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
      ],
      "advancedTechnique": {  // OPTIONAL - only include when applying a technique
        "technique": "drop_set" | "rest_pause" | "superset" | "top_set_backoff" | "myo_reps" | "cluster_set" | "pyramid",
        "config": { /* technique-specific config as described above */ },
        "rationale": "Why this technique benefits this exercise"
      }
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

${Object.keys(exerciseCountByMuscle).length > 0 ? `
═══════════════════════════════════════════════════════════════
<validation_checklist>
⚠️ FINAL CHECK BEFORE SUBMITTING - COUNT YOUR EXERCISES:

${Object.entries(exerciseCountByMuscle).map(([muscle, count]) =>
  `□ ${muscle}: ___/${count} exercises (NEED ${count})`
).join('\n')}

TOTAL REQUIRED: ${Object.values(exerciseCountByMuscle).reduce((sum, count) => sum + count, 0)}

❌ If ANY muscle has fewer exercises than required → ADD MORE NOW
❌ Incomplete responses will be REJECTED
</validation_checklist>
═══════════════════════════════════════════════════════════════
` : ''}
    `

    // 🔒 JSON SCHEMA for Structured Outputs (guarantees valid JSON)
    // This replaces the retry+validation approach with OpenAI's Structured Outputs feature
    const exerciseSelectionSchema = {
      name: 'exercise_selection',
      schema: {
        type: 'object',
        properties: {
          exercises: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                equipmentVariant: { type: 'string' },
                sets: { type: 'number' },
                repRange: {
                  type: 'array',
                  items: { type: 'number' },
                  minItems: 2,
                  maxItems: 2
                },
                restSeconds: { type: 'number' },
                tempo: { type: 'string' },
                rationaleForSelection: { type: 'string' },
                alternatives: {
                  type: 'array',
                  items: { type: 'string' }
                },
                primaryMuscles: {
                  type: 'array',
                  items: { type: 'string' }
                },
                secondaryMuscles: {
                  type: 'array',
                  items: { type: 'string' }
                },
                movementPattern: { type: 'string' },
                romEmphasis: {
                  type: 'string',
                  enum: ['lengthened', 'shortened', 'full_range']
                },
                unilateral: { type: 'boolean' },
                technicalCues: {
                  type: 'array',
                  items: { type: 'string' }
                },
                warmupSets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      setNumber: { type: 'number' },
                      weightPercentage: { type: 'number' },
                      weight: { type: 'number' },
                      reps: { type: 'number' },
                      rir: { type: 'number' },
                      restSeconds: { type: 'number' },
                      technicalFocus: { type: 'string' }
                    },
                    required: ['setNumber', 'weightPercentage', 'weight', 'reps', 'rir', 'restSeconds', 'technicalFocus'],
                    additionalProperties: false
                  }
                },
                setGuidance: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      setNumber: { type: 'number' },
                      technicalFocus: { type: 'string' },
                      mentalFocus: { type: 'string' }
                    },
                    required: ['setNumber', 'technicalFocus', 'mentalFocus'],
                    additionalProperties: false
                  }
                },
                advancedTechnique: {
                  type: 'object',
                  properties: {
                    technique: {
                      type: 'string',
                      enum: ['drop_set', 'rest_pause', 'superset', 'top_set_backoff', 'myo_reps', 'giant_set', 'cluster_set', 'pyramid']
                    },
                    config: {
                      type: 'object',
                      additionalProperties: true // Allow flexible config based on technique type
                    },
                    rationale: { type: 'string' }
                  },
                  required: ['technique', 'config', 'rationale'],
                  additionalProperties: false
                }
              },
              required: ['name', 'equipmentVariant', 'sets', 'repRange', 'restSeconds', 'tempo', 'rationaleForSelection', 'alternatives', 'primaryMuscles', 'secondaryMuscles', 'movementPattern', 'romEmphasis', 'unilateral', 'technicalCues', 'warmupSets', 'setGuidance'],
              additionalProperties: false
            }
          },
          workoutRationale: { type: 'string' },
          weakPointAddress: { type: 'string' },
          insightInfluencedChanges: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                source: {
                  type: 'string',
                  enum: ['insight', 'memory']
                },
                sourceId: { type: 'string' },
                sourceTitle: { type: 'string' },
                action: {
                  type: 'string',
                  enum: ['avoided', 'substituted', 'preferred', 'adjusted']
                },
                originalExercise: { type: 'string' },
                selectedExercise: { type: 'string' },
                reason: { type: 'string' }
              },
              required: ['source', 'sourceId', 'sourceTitle', 'action', 'originalExercise', 'selectedExercise', 'reason'],
              additionalProperties: false
            }
          }
        },
        required: ['exercises', 'workoutRationale', 'weakPointAddress', 'insightInfluencedChanges'],
        additionalProperties: false
      }
    }

    // 🚀 GENERATE WITH REASONING PERSISTENCE (GPT-5)
    // Uses Responses API with previous_response_id for cumulative learning across workouts
    // Trade-off: Slower than Structured Outputs but enables AI to learn user preferences over time
    console.log('[ExerciseSelector] Calling AI with reasoning persistence...', {
      hasPreviousResponse: !!previousResponseId,
      previousResponseId: previousResponseId ? previousResponseId.slice(0, 12) + '...' : 'none'
    })
    const result = await this.complete<ExerciseSelectionOutput>(
      prompt,
      targetLanguage,
      undefined, // customTimeoutMs (use default from reasoningEffort)
      previousResponseId // Enable reasoning continuity
    )

    console.log('[ExerciseSelector] ✅ Workout generation successful with reasoning persistence')

    // Ensure insightInfluencedChanges field exists (even if AI didn't include it)
    if (!result.insightInfluencedChanges) {
      result.insightInfluencedChanges = [];
    }

    // ✅ GUARD: Double-check exercises array exists before populating animations
    // This should never happen if validation passed, but defensive programming prevents crashes
    if (!result.exercises || !Array.isArray(result.exercises)) {
      throw new Error('[ExerciseSelector] Validation passed but exercises array is missing - this indicates a serious bug in the validation logic')
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

    // Add response ID to result for GPT-5 reasoning persistence
    return {
      ...result,
      responseId: this.lastResponseId
    }
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
    let totalInferences = 0

    const normalized = exercises.map(ex => {
      const exerciseName = ex.name || ''

      const normalizedPrimaryMuscles = ex.primaryMuscles?.map(muscle => {
        const normalized = muscle.toLowerCase().trim()
        let result: string

        // STEP 1: Try exact match with original format (preserves underscores)
        if (ANATOMICAL_TO_CANONICAL[normalized]) {
          totalNormalizations++
          result = ANATOMICAL_TO_CANONICAL[normalized]
        }
        // STEP 2: Try without plural
        else {
          const withoutPlural = normalized.replace(/s$/, '')
          if (ANATOMICAL_TO_CANONICAL[withoutPlural]) {
            totalNormalizations++
            result = ANATOMICAL_TO_CANONICAL[withoutPlural]
          }
          // STEP 3: Try with underscores replaced by spaces (anatomical variations)
          else {
            const spacedNormalized = normalized.replace(/_/g, ' ')
            if (spacedNormalized !== normalized && ANATOMICAL_TO_CANONICAL[spacedNormalized]) {
              totalNormalizations++
              result = ANATOMICAL_TO_CANONICAL[spacedNormalized]
            }
            // STEP 4: Try spaced version without plural
            else {
              const spacedWithoutPlural = spacedNormalized.replace(/s$/, '')
              if (spacedWithoutPlural !== spacedNormalized && ANATOMICAL_TO_CANONICAL[spacedWithoutPlural]) {
                totalNormalizations++
                result = ANATOMICAL_TO_CANONICAL[spacedWithoutPlural]
              } else {
                // Unknown muscle - track it
                unknownMuscles.add(muscle)
                result = muscle
              }
            }
          }
        }

        // STEP 5: Infer specific muscle from exercise name if result is generic "shoulders"
        const inferred = inferSpecificMuscleFromExerciseName(exerciseName, result)
        if (inferred !== result) {
          totalInferences++
          result = inferred
        }

        return result
      })

      const normalizedSecondaryMuscles = ex.secondaryMuscles?.map(muscle => {
        const normalized = muscle.toLowerCase().trim()

        // STEP 1: Try exact match with original format (preserves underscores)
        if (ANATOMICAL_TO_CANONICAL[normalized]) {
          totalNormalizations++
          return ANATOMICAL_TO_CANONICAL[normalized]
        }

        // STEP 2: Try without plural
        const withoutPlural = normalized.replace(/s$/, '')
        if (ANATOMICAL_TO_CANONICAL[withoutPlural]) {
          totalNormalizations++
          return ANATOMICAL_TO_CANONICAL[withoutPlural]
        }

        // STEP 3: Try with underscores replaced by spaces (anatomical variations)
        const spacedNormalized = normalized.replace(/_/g, ' ')
        if (spacedNormalized !== normalized && ANATOMICAL_TO_CANONICAL[spacedNormalized]) {
          totalNormalizations++
          return ANATOMICAL_TO_CANONICAL[spacedNormalized]
        }

        // STEP 4: Try spaced version without plural
        const spacedWithoutPlural = spacedNormalized.replace(/s$/, '')
        if (spacedWithoutPlural !== spacedNormalized && ANATOMICAL_TO_CANONICAL[spacedWithoutPlural]) {
          totalNormalizations++
          return ANATOMICAL_TO_CANONICAL[spacedWithoutPlural]
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
      totalInferences: totalInferences,
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
    // ✅ GUARD: Check if exercises array exists before validation
    if (!result || !result.exercises || !Array.isArray(result.exercises)) {
      return {
        valid: false,
        feedback: `**CRITICAL ERROR: Missing or invalid 'exercises' array**\n` +
                  `- Expected: Array of exercise objects\n` +
                  `- Received: ${result ? (result.exercises ? typeof result.exercises : 'undefined') : 'null result'}\n` +
                  `- FIX: Your JSON response MUST include an "exercises" array with at least 1 exercise\n` +
                  `- Example structure: { "exercises": [{ "name": "...", "sets": 3, ... }], "workoutRationale": "..." }`
      }
    }

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
      // Helper: Infer specific muscle subdivision based on exercise name
      // This handles cases where AI uses generic "shoulders" but exercise name reveals the specific head
      const inferSpecificMuscleFromExercise = (exerciseName: string, genericMuscle: string): string => {
        const nameLower = exerciseName.toLowerCase()

        // If muscle is already specific (has underscore), keep it as-is
        if (genericMuscle.includes('_')) {
          return genericMuscle
        }

        // Shoulder subdivision inference
        if (genericMuscle === 'shoulders' || genericMuscle === 'deltoid' || genericMuscle === 'deltoids') {
          // Front deltoid patterns (vertical pressing, overhead movements)
          if (nameLower.includes('press') || nameLower.includes('overhead') ||
              nameLower.includes('military') || nameLower.includes('push press')) {
            console.log(`🔍 [SMART MAPPING] "${exerciseName}" + generic "${genericMuscle}" → shoulders_front`)
            return 'shoulders_front'
          }

          // Side deltoid patterns (lateral/abduction movements)
          if (nameLower.includes('lateral') || nameLower.includes('side raise') ||
              nameLower.includes('side delt') || nameLower.includes('abduction')) {
            console.log(`🔍 [SMART MAPPING] "${exerciseName}" + generic "${genericMuscle}" → shoulders_side`)
            return 'shoulders_side'
          }

          // Rear deltoid patterns (horizontal pulling, rear movements)
          if (nameLower.includes('rear') || nameLower.includes('face pull') ||
              nameLower.includes('reverse fly') || nameLower.includes('bent')) {
            console.log(`🔍 [SMART MAPPING] "${exerciseName}" + generic "${genericMuscle}" → shoulders_rear`)
            return 'shoulders_rear'
          }

          // Default: if can't infer, keep generic (will be logged as warning later)
          console.warn(`⚠️ [SMART MAPPING] Could not infer shoulder subdivision for "${exerciseName}", keeping generic "${genericMuscle}"`)
        }

        // Chest subdivision inference
        if (genericMuscle === 'chest' || genericMuscle === 'pectorals') {
          if (nameLower.includes('incline') || nameLower.includes('upper')) {
            console.log(`🔍 [SMART MAPPING] "${exerciseName}" + generic "${genericMuscle}" → chest_upper`)
            return 'chest_upper'
          }
          if (nameLower.includes('decline') || nameLower.includes('lower')) {
            console.log(`🔍 [SMART MAPPING] "${exerciseName}" + generic "${genericMuscle}" → chest_lower`)
            return 'chest_lower'
          }
          // Flat presses default to chest_lower (sternal emphasis in biomechanics)
          if (nameLower.includes('bench press') || nameLower.includes('press') ||
              nameLower.includes('fly') || nameLower.includes('flye')) {
            console.log(`🔍 [SMART MAPPING] "${exerciseName}" + generic "${genericMuscle}" → chest_lower (flat press)`)
            return 'chest_lower'
          }
        }

        // Triceps subdivision inference
        if (genericMuscle === 'triceps' || genericMuscle === 'tricep') {
          // Long head patterns (overhead movements emphasize long head via shoulder extension)
          if (nameLower.includes('overhead') || nameLower.includes('french press') ||
              nameLower.includes('skull crusher') || nameLower.includes('lying extension')) {
            console.log(`🔍 [SMART MAPPING] "${exerciseName}" + generic "${genericMuscle}" → triceps_long`)
            return 'triceps_long'
          }

          // Lateral head patterns (pressing and pushdown movements)
          if (nameLower.includes('pushdown') || nameLower.includes('press down') ||
              nameLower.includes('kickback') || nameLower.includes('close grip')) {
            console.log(`🔍 [SMART MAPPING] "${exerciseName}" + generic "${genericMuscle}" → triceps_lateral`)
            return 'triceps_lateral'
          }

          // Medial head patterns (reverse grip emphasizes medial head)
          if (nameLower.includes('reverse grip') || nameLower.includes('underhand') ||
              nameLower.includes('dip')) {
            console.log(`🔍 [SMART MAPPING] "${exerciseName}" + generic "${genericMuscle}" → triceps_medial`)
            return 'triceps_medial'
          }

          // Default: if can't infer, keep generic (will be logged as warning later)
          console.warn(`⚠️ [SMART MAPPING] Could not infer triceps subdivision for "${exerciseName}", keeping generic "${genericMuscle}"`)
        }

        // Back subdivision inference
        if (genericMuscle === 'back' || genericMuscle === 'backs') {
          // Lats (vertical pulling movements)
          if (nameLower.includes('pull up') || nameLower.includes('pullup') ||
              nameLower.includes('pulldown') || nameLower.includes('pull-up') ||
              nameLower.includes('chin up') || nameLower.includes('chinup') ||
              nameLower.includes('lat')) {
            console.log(`🔍 [SMART MAPPING] "${exerciseName}" + generic "${genericMuscle}" → lats`)
            return 'lats'
          }

          // Lower back (hip hinge patterns, spinal extensors)
          if (nameLower.includes('deadlift') || nameLower.includes('hyperextension') ||
              nameLower.includes('good morning') || nameLower.includes('romanian') ||
              nameLower.includes('back extension') || nameLower.includes('lumbar')) {
            console.log(`🔍 [SMART MAPPING] "${exerciseName}" + generic "${genericMuscle}" → lower_back`)
            return 'lower_back'
          }

          // Upper back (horizontal pulling, rhomboids, mid-traps)
          if (nameLower.includes('row') || nameLower.includes('shrug') ||
              nameLower.includes('face pull') || nameLower.includes('rear delt') ||
              nameLower.includes('reverse fly')) {
            console.log(`🔍 [SMART MAPPING] "${exerciseName}" + generic "${genericMuscle}" → upper_back`)
            return 'upper_back'
          }

          // Default to upper_back for unknown back exercises
          console.log(`🔍 [SMART MAPPING] "${exerciseName}" + generic "${genericMuscle}" → upper_back (default)`)
          return 'upper_back'
        }

        return genericMuscle
      }

      const calculateMuscleVolume = (exercises: typeof result.exercises): Record<string, number> => {
        const volume: Record<string, number> = {}
        exercises.forEach(ex => {
          ex.primaryMuscles?.forEach(muscle => {
            const normalized = muscle.toLowerCase().trim()
            // Apply smart mapping based on exercise name
            const inferred = inferSpecificMuscleFromExercise(ex.name, normalized)
            volume[inferred] = (volume[inferred] || 0) + (ex.sets || 0)
          })
          ex.secondaryMuscles?.forEach(muscle => {
            const normalized = muscle.toLowerCase().trim()
            // Apply smart mapping for secondary muscles too
            const inferred = inferSpecificMuscleFromExercise(ex.name, normalized)
            volume[inferred] = (volume[inferred] || 0) + (ex.sets || 0) * 0.5
          })
        })
        return volume
      }

      const normalizeMuscleForVolume = (muscle: string): string => {
        const normalized = muscle.toLowerCase().trim()

        // STEP 1: Try exact match with original format (preserves underscores from canonical keys)
        // This handles canonical muscle keys like "chest_lower", "chest_upper", etc.
        if (ANATOMICAL_TO_CANONICAL[normalized]) {
          return ANATOMICAL_TO_CANONICAL[normalized]
        }

        // STEP 2: Check with plural removed (e.g., "deltoids" → "deltoid" → "shoulders")
        const withoutPlural = normalized.replace(/s$/, '')
        if (ANATOMICAL_TO_CANONICAL[withoutPlural]) {
          return ANATOMICAL_TO_CANONICAL[withoutPlural]
        }

        // STEP 3: Try with underscores replaced by spaces (handles anatomical variations)
        // This catches variants like "lower chest", "upper chest" that AI might generate
        const spacedNormalized = normalized.replace(/_/g, ' ')
        if (spacedNormalized !== normalized && ANATOMICAL_TO_CANONICAL[spacedNormalized]) {
          return ANATOMICAL_TO_CANONICAL[spacedNormalized]
        }

        // STEP 4: Check spaced version without plural
        const spacedWithoutPlural = spacedNormalized.replace(/s$/, '')
        if (spacedWithoutPlural !== spacedNormalized && ANATOMICAL_TO_CANONICAL[spacedWithoutPlural]) {
          return ANATOMICAL_TO_CANONICAL[spacedWithoutPlural]
        }

        // STEP 5: Intelligent fallback - pattern matching for common muscle group keywords
        // This handles unknown variants, typos, or new AI-generated terms
        // Use spacedNormalized for pattern matching (works with both underscore and space formats)
        if (spacedNormalized.includes('back')) {
          console.warn(`⚠️ [FALLBACK] Unknown back variant "${muscle}" → upper_back`, { normalized: spacedNormalized })
          return 'upper_back'
        }
        if (spacedNormalized.includes('delt')) {
          console.warn(`⚠️ [FALLBACK] Unknown deltoid variant "${muscle}" → shoulders`, { normalized: spacedNormalized })
          return 'shoulders'
        }
        if (spacedNormalized.includes('pect')) {
          console.warn(`⚠️ [FALLBACK] Unknown pectoral variant "${muscle}" → chest`, { normalized: spacedNormalized })
          return 'chest'
        }
        if (spacedNormalized.includes('quad')) {
          console.warn(`⚠️ [FALLBACK] Unknown quadriceps variant "${muscle}" → quads`, { normalized: spacedNormalized })
          return 'quads'
        }
        if (spacedNormalized.includes('ham')) {
          console.warn(`⚠️ [FALLBACK] Unknown hamstring variant "${muscle}" → hamstrings`, { normalized: spacedNormalized })
          return 'hamstrings'
        }
        if (spacedNormalized.includes('glut')) {
          console.warn(`⚠️ [FALLBACK] Unknown glute variant "${muscle}" → glutes`, { normalized: spacedNormalized })
          return 'glutes'
        }
        if (spacedNormalized.includes('calf') || spacedNormalized.includes('calv')) {
          console.warn(`⚠️ [FALLBACK] Unknown calf variant "${muscle}" → calves`, { normalized: spacedNormalized })
          return 'calves'
        }
        if (spacedNormalized.includes('tricep')) {
          console.warn(`⚠️ [FALLBACK] Unknown tricep variant "${muscle}" → triceps`, { normalized: spacedNormalized })
          return 'triceps'
        }
        if (spacedNormalized.includes('bicep')) {
          console.warn(`⚠️ [FALLBACK] Unknown bicep variant "${muscle}" → biceps`, { normalized: spacedNormalized })
          return 'biceps'
        }
        if (spacedNormalized.includes('lat')) {
          console.warn(`⚠️ [FALLBACK] Unknown lat variant "${muscle}" → lats`, { normalized: spacedNormalized })
          return 'lats'
        }
        if (spacedNormalized.includes('trap')) {
          console.warn(`⚠️ [FALLBACK] Unknown trap variant "${muscle}" → traps`, { normalized: spacedNormalized })
          return 'traps'
        }
        if (spacedNormalized.includes('ab') || spacedNormalized.includes('abdominal')) {
          console.warn(`⚠️ [FALLBACK] Unknown abs variant "${muscle}" → abs`, { normalized: spacedNormalized })
          return 'abs'
        }
        if (spacedNormalized.includes('oblique')) {
          console.warn(`⚠️ [FALLBACK] Unknown oblique variant "${muscle}" → obliques`, { normalized: spacedNormalized })
          return 'obliques'
        }

        // Last resort: unknown muscle - log for monitoring and return as-is
        console.warn('⚠️ [EXERCISE_SELECTOR] Unknown muscle name encountered (no fallback matched):', {
          original: muscle,
          normalized: normalized,
          spacedNormalized: spacedNormalized,
          withoutPlural: withoutPlural,
          returning: spacedWithoutPlural,
          timestamp: new Date().toISOString(),
          hint: 'Consider adding to ANATOMICAL_TO_CANONICAL mapping if this is an anatomical name'
        })

        return spacedWithoutPlural
      }

      const actualVolume = calculateMuscleVolume(result.exercises)
      const { MUSCLE_GROUPS } = await import('@/lib/services/muscle-groups.service')

      // 🔍 DIAGNOSTIC LOGGING: Pre-validation volume analysis
      console.log('\n' + '='.repeat(80))
      console.log('📊 [VOLUME DIAGNOSTIC] Pre-Validation Analysis')
      console.log('='.repeat(80))

      // Log exercise-by-exercise breakdown
      console.log('\n🏋️ EXERCISE CONTRIBUTIONS:')
      result.exercises.forEach((ex, idx) => {
        console.log(`\n  ${idx + 1}. ${ex.name} (${ex.sets} sets)`)
        console.log(`     Primary: ${ex.primaryMuscles?.join(', ') || 'none'}`)
        console.log(`     Secondary: ${ex.secondaryMuscles?.join(', ') || 'none'}`)
        console.log(`     Volume contribution:`)
        ex.primaryMuscles?.forEach(m => {
          console.log(`       → ${m}: +${ex.sets} sets (primary 1.0x)`)
        })
        ex.secondaryMuscles?.forEach(m => {
          console.log(`       → ${m}: +${(ex.sets * 0.5).toFixed(1)} sets (secondary 0.5x)`)
        })
      })

      // Log target vs actual comparison table
      console.log('\n📋 TARGET vs ACTUAL COMPARISON:')
      console.log('─'.repeat(80))
      console.log(String('MUSCLE').padEnd(25) +
                  String('TARGET').padEnd(12) +
                  String('ACTUAL').padEnd(12) +
                  String('RANGE').padEnd(15) +
                  String('STATUS'))
      console.log('─'.repeat(80))

      const targetTolerance = 0.20
      const diagnosticResults: Array<{
        muscle: string
        target: number
        actual: number
        min: number
        max: number
        status: 'PASS' | 'UNDER' | 'OVER' | 'ZERO_VIOLATION' | 'MISSING_REQUIRED'
        delta: number
      }> = []

      // Pre-calculate all results for sorting
      for (const [muscleKey, targetSets] of Object.entries(input.targetVolume)) {
        const normalizedTarget = normalizeMuscleForVolume(muscleKey)
        let actualSets = 0

        for (const [actualMuscle, sets] of Object.entries(actualVolume)) {
          const normalizedActual = normalizeMuscleForVolume(actualMuscle)
          // Use exact match instead of .includes() to avoid false positives
          // (e.g., "chest_lower".includes("chest") = true would incorrectly match)
          if (normalizedActual === normalizedTarget) {
            actualSets += sets
          }
        }

        const minAllowed = Math.round(targetSets * (1 - targetTolerance))
        const maxAllowed = Math.round(targetSets * (1 + targetTolerance))

        let status: 'PASS' | 'UNDER' | 'OVER' | 'ZERO_VIOLATION' | 'MISSING_REQUIRED' = 'PASS'
        if (targetSets === 0 && actualSets > 0) {
          status = 'ZERO_VIOLATION'
        } else if (targetSets > 0 && actualSets === 0) {
          // CRITICAL: Required muscle group has ZERO volume - this is a critical failure
          status = 'MISSING_REQUIRED'
        } else if (actualSets < minAllowed) {
          status = 'UNDER'
        } else if (actualSets > maxAllowed) {
          status = 'OVER'
        }

        diagnosticResults.push({
          muscle: muscleKey,
          target: targetSets,
          actual: actualSets,
          min: minAllowed,
          max: maxAllowed,
          status,
          delta: actualSets - targetSets
        })
      }

      // Sort: violations first, then by absolute delta
      diagnosticResults.sort((a, b) => {
        if (a.status !== 'PASS' && b.status === 'PASS') return -1
        if (a.status === 'PASS' && b.status !== 'PASS') return 1
        return Math.abs(b.delta) - Math.abs(a.delta)
      })

      // Display results
      diagnosticResults.forEach(result => {
        const statusIcon = result.status === 'PASS' ? '✅' :
                          result.status === 'ZERO_VIOLATION' ? '🚫' :
                          result.status === 'MISSING_REQUIRED' ? '❌' :
                          result.status === 'UNDER' ? '⬇️' :
                          '⬆️'
        const statusText = result.status === 'PASS' ? 'PASS' :
                          result.status === 'ZERO_VIOLATION' ? 'ZERO VIOLATED' :
                          result.status === 'MISSING_REQUIRED' ? 'MISSING (0 sets!)' :
                          result.status === 'UNDER' ? `UNDER (${result.delta.toFixed(1)})` :
                          `OVER (+${result.delta.toFixed(1)})`

        console.log(
          statusIcon + ' ' + String(result.muscle).padEnd(23) +
          String(result.target).padEnd(12) +
          String(result.actual.toFixed(1)).padEnd(12) +
          String(`${result.min}-${result.max}`).padEnd(15) +
          statusText
        )
      })

      console.log('─'.repeat(80))
      const passCount = diagnosticResults.filter(r => r.status === 'PASS').length
      const totalCount = diagnosticResults.length
      console.log(`\n📈 SUMMARY: ${passCount}/${totalCount} muscles within tolerance`)

      // Show unknown muscles (not in targets)
      const unknownMuscles = Object.keys(actualVolume).filter(muscle => {
        if (!input.targetVolume) return false
        const normalizedActual = normalizeMuscleForVolume(muscle)
        return !Object.keys(input.targetVolume).some(targetKey => {
          const normalizedTarget = normalizeMuscleForVolume(targetKey)
          return normalizedActual.includes(normalizedTarget) || normalizedTarget.includes(normalizedActual)
        })
      })

      if (unknownMuscles.length > 0) {
        console.log(`\n⚠️  UNEXPECTED MUSCLES (not in targets):`)
        unknownMuscles.forEach(muscle => {
          console.log(`   - ${muscle}: ${actualVolume[muscle].toFixed(1)} sets`)
        })
      }

      console.log('='.repeat(80) + '\n')

      const violations: Array<{
        muscle: string
        target: number
        actual: number
        direct: number
        indirect: number
        breakdown: Array<{exerciseName: string; contribution: number; type: 'primary' | 'secondary'}>
        suggestion: string
      }> = []

      for (const [muscleKey, targetSets] of Object.entries(input.targetVolume)) {
        const muscleName = MUSCLE_GROUPS[muscleKey as keyof typeof MUSCLE_GROUPS] || muscleKey
        const normalizedTarget = normalizeMuscleForVolume(muscleKey)
        let actualSets = 0

        for (const [actualMuscle, sets] of Object.entries(actualVolume)) {
          const normalizedActual = normalizeMuscleForVolume(actualMuscle)
          // Use exact match instead of .includes() to avoid false positives
          // (e.g., "chest_lower".includes("chest") = true would incorrectly match)
          if (normalizedActual === normalizedTarget) {
            actualSets += sets
          }
        }

        const minAllowed = Math.round(targetSets * (1 - targetTolerance))
        const maxAllowed = Math.round(targetSets * (1 + targetTolerance))

        if (actualSets < minAllowed || actualSets > maxAllowed || (targetSets > 0 && actualSets === 0)) {
          // Calculate direct vs indirect volume breakdown
          let directVolume = 0
          let indirectVolume = 0
          const breakdown: Array<{exerciseName: string; contribution: number; type: 'primary' | 'secondary'}> = []

          result.exercises.forEach(ex => {
            const isPrimary = ex.primaryMuscles?.some(m => {
              const normalized = normalizeMuscleForVolume(m)
              return normalized === normalizedTarget
            })
            const isSecondary = ex.secondaryMuscles?.some(m => {
              const normalized = normalizeMuscleForVolume(m)
              return normalized === normalizedTarget
            })

            if (isPrimary) {
              directVolume += ex.sets || 0
              breakdown.push({
                exerciseName: ex.name,
                contribution: ex.sets || 0,
                type: 'primary'
              })
            } else if (isSecondary) {
              const contribution = (ex.sets || 0) * 0.5
              indirectVolume += contribution
              breakdown.push({
                exerciseName: ex.name,
                contribution: contribution,
                type: 'secondary'
              })
            }
          })

          // Generate actionable suggestion based on direct/indirect split
          let suggestion = ''
          if (targetSets > 0 && actualSets === 0) {
            // CRITICAL: Missing required muscle entirely
            suggestion = `❌ CRITICAL: NO exercises targeting ${muscleKey}! You MUST add at least ${minAllowed} sets. CHECK: Are you using the correct muscle key name "${muscleKey}" (not generic synonyms)?`
          } else if (actualSets < minAllowed) {
            suggestion = `ADD ${(minAllowed - actualSets).toFixed(0)} more sets for ${muscleKey} (currently ${directVolume.toFixed(1)} direct + ${indirectVolume.toFixed(1)} indirect)`
          } else {
            // Over target
            if (directVolume === 0) {
              // Only indirect volume - reduce compound exercises or accept being over
              suggestion = `Volume comes entirely from INDIRECT work (${indirectVolume.toFixed(1)} sets). Options: (A) Reduce compound exercise sets, OR (B) Accept being over target (within tolerance)`
            } else if (indirectVolume > directVolume) {
              // More indirect than direct - prioritize removing direct work
              suggestion = `REMOVE ${(actualSets - maxAllowed).toFixed(0)} sets from DIRECT ${muscleKey} work (currently ${directVolume.toFixed(1)} direct + ${indirectVolume.toFixed(1)} indirect). Keep indirect from compounds, reduce isolation.`
            } else {
              // More direct than indirect - standard reduction
              suggestion = `REMOVE ${(actualSets - maxAllowed).toFixed(0)} sets from ${muscleKey} (currently ${directVolume.toFixed(1)} direct + ${indirectVolume.toFixed(1)} indirect)`
            }
          }

          violations.push({
            muscle: `${muscleKey} (${muscleName})`,
            target: targetSets,
            actual: actualSets,
            direct: directVolume,
            indirect: indirectVolume,
            breakdown,
            suggestion
          })
        }
      }

      if (violations.length > 0) {
        errors.push(
          `**TARGET VOLUME VIOLATION** (±20% tolerance)\n` +
          `- Violations (${violations.length} muscle groups):\n\n` +
          violations.map(v => {
            let msg = `  * ${v.muscle}: target ${v.target} sets, got ${v.actual.toFixed(1)} sets (${v.direct.toFixed(1)} direct + ${v.indirect.toFixed(1)} indirect)\n`

            // Add breakdown by exercise
            if (v.breakdown.length > 0) {
              msg += `    Volume breakdown:\n`
              v.breakdown.forEach(b => {
                const label = b.type === 'primary' ? 'direct' : 'indirect'
                msg += `      - ${b.exerciseName}: +${b.contribution.toFixed(1)} sets (${label})\n`
              })
            }

            msg += `    FIX: ${v.suggestion}`
            return msg
          }).join('\n\n')
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
            this.supabase,
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
