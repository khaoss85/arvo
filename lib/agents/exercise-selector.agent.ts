import { BaseAgent } from './base.agent'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { ExerciseGenerationService, type ExerciseMetadata } from '@/lib/services/exercise-generation.service'
import { findEquipmentById } from '@/lib/constants/equipment-taxonomy'
import { AnimationService } from '@/lib/services/animation.service'
import type { Locale } from '@/i18n'

export interface ExerciseSelectionInput {
  workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body' | 'chest' | 'back' | 'shoulders' | 'arms'
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

  constructor(supabaseClient?: any, reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high') {
    // Use 'low' reasoning for workout generation (90s timeout, basic constraint checking)
    // ExerciseSelector has complex multi-constraint optimization (volume targets, periodization, insights)
    // 'low' reasoning reduces retry failures and improves first-attempt success rate
    super(supabaseClient, reasoningEffort || 'low', 'low')
    this.supabase = supabaseClient || getSupabaseBrowserClient()
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

  async selectExercises(input: ExerciseSelectionInput, targetLanguage?: 'en' | 'it'): Promise<ExerciseSelectionOutput> {
    const approach = await this.knowledge.loadApproach(input.approachId)
    const context = this.knowledge.formatContextForAI(approach, 'exercise_selection')

    // Extract constraints from approach.variables (nested structure)
    const vars = approach.variables as any
    const maxSetsPerExercise = vars?.setsPerExercise?.working
      || (vars?.sets?.range ? vars.sets.range[1] : null)
    const maxTotalSets = vars?.sessionDuration?.totalSets?.[1]

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

⚠️ **YOU MUST apply this calculation when verifying your exercise selection against the targets below.**

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

    const prompt = `
Create a ${input.workoutType} workout using AI-generated exercises.

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
    <name>🎯 SESSION MUSCLE GROUP COVERAGE</name>
    <description>Defines WHAT muscles to train</description>
    <enforcement>You MUST include at least 1 exercise for EACH muscle group in sessionFocus</enforcement>
    <distribution>Distribute exercises across the approach's structure (phases, techniques, progressions)</distribution>
    ${input.sessionFocus ? `
    <required_muscles>${input.sessionFocus.join(', ')}</required_muscles>
    ` : ''}
    <binding>This defines the workout scope - cannot be ignored</binding>
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
    Approach methodology (Priority 1) and Session muscle coverage (Priority 2) are COMPLEMENTARY, not conflicting:
    - Priority 1 defines HOW to structure the workout
    - Priority 2 defines WHAT muscles to include
    - Apply Priority 1's methodology WHILE ensuring all Priority 2 muscles are covered
    - If Priority 1 volume constraints make complete Priority 2 coverage impossible, prioritize muscles in the order given
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
  * Examples: "Semi-bent arms throughout the movement", "Squeeze pecs hard at top", "Avoid lockout on elbows"
- warmupSets: ONLY for compound movements (squat, deadlift, bench, overhead press, rows), provide 2 warmup sets:
  * Set 1: 50% weight, 15 reps, RIR 5, 60s rest, technicalFocus: "Feel the movement pattern"
  * Set 2: 65% weight, 12 reps, RIR 3, 90s rest, technicalFocus: "Build mind-muscle connection"
  * Isolation exercises (curls, raises, flyes) do NOT need warmup sets
- setGuidance: For ALL exercises, provide per-set technical and mental focus for EACH working set:
  * technicalFocus: What to focus on technically (e.g., "Full ROM", "Squeeze at top", "Control the eccentric")
  * mentalFocus: VISUALIZATION-BASED mental imagery specific to exercise execution
    - Use imagery/visualization verbs (IT): "immagina", "visualizza", "pensa a", "senti come se"
    - Use imagery/visualization verbs (EN): "imagine", "visualize", "think of", "feel as if"
    - Make it EXERCISE-SPECIFIC (different cue for each exercise), examples:
      * Peck Deck (IT): "Immagina di portare i bicipiti vicini mentre tieni il petto il più alto possibile"
      * Peck Deck (EN): "Imagine bringing your biceps close together while keeping your chest as high as possible"
      * Lat Pulldown (IT): "Visualizza i gomiti che tirano dietro al busto, non le mani verso il basso"
      * Lat Pulldown (EN): "Visualize your elbows pulling behind your torso, not your hands pulling down"
      * Leg Press (IT): "Senti come se spingessi il pavimento lontano da te, non il peso in alto"
      * Leg Press (EN): "Feel as if you're pushing the floor away from you, not pushing the weight up"
      * Cable Face Pull (IT): "Pensa a separare le mani il più possibile, come se aprissi una porta scorrevole"
      * Cable Fly (IT): "Visualizza di abbracciare un grande albero davanti a te"
      * Dumbbell Row (IT): "Immagina di portare il gomito il più indietro possibile, verso il soffitto"
    - Vary by set intensity and number:
      * Early sets (1-2): Connection cues (IT: "Senti il muscolo attivarsi", EN: "Feel the muscle activate")
      * Middle sets (3-4): Intensity cues (IT: "Visualizza il muscolo contrarsi forte", EN: "Visualize the muscle contracting hard")
      * Final sets: Power/explosive cues (IT: "Immagina potenza esplosiva attraverso il movimento", EN: "Imagine explosive power through the movement")
  * Progression across sets: early sets focus on mind-muscle connection imagery, later sets on power/intensity imagery
  * Keep concise but descriptive (8-15 words for visualization cues)

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
        status: 'PASS' | 'UNDER' | 'OVER' | 'ZERO_VIOLATION'
        delta: number
      }> = []

      // Pre-calculate all results for sorting
      for (const [muscleKey, targetSets] of Object.entries(input.targetVolume)) {
        const normalizedTarget = normalizeMuscleForVolume(muscleKey)
        let actualSets = 0

        for (const [actualMuscle, sets] of Object.entries(actualVolume)) {
          const normalizedActual = normalizeMuscleForVolume(actualMuscle)
          if (normalizedActual.includes(normalizedTarget) || normalizedTarget.includes(normalizedActual)) {
            actualSets += sets
          }
        }

        const minAllowed = Math.round(targetSets * (1 - targetTolerance))
        const maxAllowed = Math.round(targetSets * (1 + targetTolerance))

        let status: 'PASS' | 'UNDER' | 'OVER' | 'ZERO_VIOLATION' = 'PASS'
        if (targetSets === 0 && actualSets > 0) {
          status = 'ZERO_VIOLATION'
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
                          result.status === 'UNDER' ? '⬇️' :
                          '⬆️'
        const statusText = result.status === 'PASS' ? 'PASS' :
                          result.status === 'ZERO_VIOLATION' ? 'ZERO VIOLATED' :
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

      const violations: Array<{muscle: string; target: number; actual: number; suggestion: string}> = []

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

        const minAllowed = Math.round(targetSets * (1 - targetTolerance))
        const maxAllowed = Math.round(targetSets * (1 + targetTolerance))

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
