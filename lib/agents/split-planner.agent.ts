import { BaseAgent } from './base.agent'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export interface SplitPlannerInput {
  userId: string
  approachId: string
  splitType: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'custom' | 'bro_split' | 'weak_point_focus'
  weeklyFrequency: number // How many days per week user can train
  weakPoints: string[]
  equipmentAvailable: string[]
  specializationMuscle?: string | null // For weak_point_focus: target muscle to emphasize
  // User demographics for personalization
  experienceYears?: number | null
  userAge?: number | null
  userGender?: 'male' | 'female' | 'other' | null
  // Schedule constraints
  preferredRestDay?: number // 1-7, where 1 = Monday
  // Periodization context
  mesocycleWeek?: number | null // Current week of mesocycle (1-12)
  mesocyclePhase?: 'accumulation' | 'intensification' | 'deload' | 'transition' | null
}

export interface SessionDefinition {
  day: number // Position in cycle (1 to cycle_days)
  name: string // e.g., "Push A", "Pull B", "Legs A", "Chest A", "Back B"
  workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body' | 'chest' | 'back' | 'shoulders' | 'arms'
  variation: 'A' | 'B'
  focus: string[] // Muscle groups emphasized, e.g., ["chest", "shoulders", "triceps"]
  targetVolume: Record<string, number> // Sets per muscle group in this session
  principles: string[] // Key principles for this session from approach
  exampleExercises?: string[] // Optional: example exercises for guidance
}

export interface SplitPlanOutput {
  cycleDays: number // Total days in one complete cycle
  sessions: SessionDefinition[]
  frequencyMap: Record<string, number> // Muscle group -> times trained per week
  volumeDistribution: Record<string, number> // Muscle group -> total sets in cycle
  rationale: string // Why this split structure was chosen
  weeklyScheduleExample: string[] // Example of how to schedule in a week
}

export class SplitPlanner extends BaseAgent {
  protected supabase: any

  constructor(supabaseClient?: any) {
    super(supabaseClient)
    this.supabase = supabaseClient || getSupabaseBrowserClient()
  }

  get systemPrompt() {
    return `You are an expert strength coach and periodization specialist creating personalized training split plans.

Your role is to design splits that align with the SPECIFIC training approach provided.
Do NOT impose your own training philosophy - follow the approach's principles exactly.

Important: Training approaches vary widely:
- Some use high frequency (2-4x/week per muscle), others low frequency (1x/week)
- Some use workout variations (A/B), others use identical sessions
- Some emphasize volume, others emphasize intensity to failure
- Some distribute volume evenly, others use undulating patterns

ALWAYS defer to the specific approach provided, never generic training advice.

When creating splits:
1. Use the approach's frequency guidelines if provided
2. Use the approach's volume landmarks if provided
3. Follow the approach's variation strategy if provided
4. Respect user's weekly training frequency and schedule constraints
5. Prioritize weak points within the approach's framework
6. Adjust for age and experience while maintaining approach philosophy

Always output valid JSON matching the exact structure specified.`
  }

  async planSplit(input: SplitPlannerInput, targetLanguage?: 'en' | 'it'): Promise<SplitPlanOutput> {
    const approach = await this.knowledge.loadApproach(input.approachId)
    const approachContext = this.knowledge.formatContextForAI(approach, 'split_planning')

    // Build demographic context
    const demographicContext = this.buildDemographicContext(input)

    // Build constraint context
    const constraintContext = this.buildConstraintContext(input)

    const prompt = `
Create a complete training split plan for this user.

=== TRAINING APPROACH CONTEXT ===
${approachContext}

${approach.volumeLandmarks ? `
Volume Landmarks (sets per week):
${JSON.stringify(approach.volumeLandmarks.muscleGroups, null, 2)}
` : ''}

${approach.frequencyGuidelines ? `
Frequency Guidelines:
- Optimal Range: ${approach.frequencyGuidelines.optimalRange?.join('-')} times per week per muscle group
- Muscle-Specific: ${JSON.stringify(approach.frequencyGuidelines.muscleSpecific, null, 2)}
` : ''}

${approach.splitVariations ? `
Split Variation Strategy:
${approach.splitVariations.variationStrategy || 'No variation strategy specified'}
${approach.splitVariations.variationLabels ? `
Variation Labels: ${approach.splitVariations.variationLabels.join(', ')}
` : ''}
${approach.splitVariations.rotationLogic ? `
Rotation Logic:
${approach.splitVariations.rotationLogic}
` : ''}
` : ''}

${approach.periodization ? `
=== PERIODIZATION MODEL ===
Mesocycle Structure:
- Total Length: ${approach.periodization.mesocycleLength || '6 weeks'}
- Phases: Accumulation, Intensification, Deload

${approach.periodization.accumulationPhase ? `
Phase: Accumulation (Weeks ${approach.periodization.accumulationPhase.weeks})
- Volume Multiplier: ${approach.periodization.accumulationPhase.volumeMultiplier || 1.0}x
- Intensity Multiplier: ${approach.periodization.accumulationPhase.intensityMultiplier || 1.0}x
- Focus: ${approach.periodization.accumulationPhase.focus || 'Building volume'}
` : ''}
${approach.periodization.intensificationPhase ? `
Phase: Intensification (Weeks ${approach.periodization.intensificationPhase.weeks})
- Volume Multiplier: ${approach.periodization.intensificationPhase.volumeMultiplier || 1.0}x
- Intensity Multiplier: ${approach.periodization.intensificationPhase.intensityMultiplier || 1.0}x
- Focus: ${approach.periodization.intensificationPhase.focus || 'Increasing intensity'}
` : ''}

Deload Strategy:
${approach.periodization.deloadPhase ? `
- Frequency: ${approach.periodization.deloadPhase.frequency || 'Every 6 weeks'}
- Volume Reduction: ${approach.periodization.deloadPhase.volumeReduction || '50%'}
- Duration: ${approach.periodization.deloadPhase.duration || '1 week'}
` : 'Not specified'}

${input.mesocycleWeek && input.mesocyclePhase ? `
CURRENT MESOCYCLE CONTEXT:
- Week: ${input.mesocycleWeek}
- Phase: ${input.mesocyclePhase.toUpperCase()}
- Adjust volume and intensity according to periodization model above
` : ''}
` : ''}

=== USER PROFILE ===
Split Type: ${input.splitType}
Weekly Training Frequency: ${input.weeklyFrequency} days per week
Weak Points: ${input.weakPoints.join(', ') || 'None specified'}
Equipment Available: ${input.equipmentAvailable.join(', ')}
${demographicContext}
${constraintContext}

=== TASK ===
Design a complete training split plan that:

1. **Cycle Structure**:
   - For PPL with 6 days/week: use 8-day cycle (3 on, 1 off, repeat) with A/B variations
   - For PPL with 3 days/week: use simple 3-day cycle without variations
   - For Upper/Lower: typically 4-day cycle
   - For Bro Split: use 10-day cycle (5 workout types: chest, back, shoulders, arms, legs × 2 variations A/B)
   - For Weak Point Focus: use frequency-based cycle (typically 7-8 days) with ${input.specializationMuscle || 'target muscle'} trained 3-4× per cycle
   - Determine optimal cycle length based on frequency

2. **Sessions**: Create detailed session definitions for each day in the cycle
   - Assign workout type (push/pull/legs/upper/lower/chest/back/shoulders/arms for bro split)
   - Assign A or B variation (alternate for variety)
   - For Bro Split Variation A: focus on strength & compound movements
   - For Bro Split Variation B: focus on hypertrophy & isolation movements
   - For Weak Point Focus: ensure ${input.specializationMuscle || 'target muscle'} appears 3-4× with increased volume (1.5× normal)
   - Define muscle group focus for each session
   - Set target volume (sets) per muscle group per session
   - Include 2-3 key principles from the approach for each session

3. **Frequency Map**: Calculate how many times per week each muscle group is trained
   - Aim for optimal frequency range (typically 2-3x for most muscles)
   - Prioritize weak points with higher frequency if possible

4. **Volume Distribution**: Calculate total sets per muscle group across the full cycle
   - Target MAV (Maximum Adaptive Volume) from approach landmarks
   - Distribute volume evenly across sessions training that muscle
   - Ensure weak points receive adequate volume
   - **CRITICAL**: Only include muscle groups with MORE THAN 0 sets. Never include muscle groups that are not trained (0 sets) in targetVolume, frequencyMap, or volumeDistribution

5. **Weekly Schedule Example**: Provide a clear example of how to map the cycle to calendar days

**🔴 CRITICAL: MUSCLE NAME REQUIREMENTS:**
You MUST use these EXACT canonical muscle group keys (not anatomical Latin names):

ALLOWED MUSCLE KEYS (use these ONLY in focus, targetVolume, frequencyMap, volumeDistribution):
${JSON.stringify([
  'chest', 'chest_upper', 'chest_lower',
  'shoulders', 'shoulders_front', 'shoulders_side', 'shoulders_rear',
  'triceps', 'triceps_long', 'triceps_lateral', 'triceps_medial',
  'lats', 'upper_back', 'lower_back', 'traps',
  'biceps', 'forearms',
  'quads', 'hamstrings', 'glutes', 'calves',
  'abs', 'obliques'
], null, 2)}

COMMON ANATOMICAL → CANONICAL MAPPINGS (MEMORIZE):
- "pectoralis major/minor" → use "chest"
- "anterior/lateral/posterior deltoid" → use "shoulders" (or shoulders_front/side/rear if specific)
- "triceps brachii" → use "triceps"
- "biceps brachii" → use "biceps"
- "latissimus dorsi" → use "lats"
- "trapezius" → use "traps"
- "rectus abdominis" → use "abs"
- "gluteus maximus/medius" → use "glutes"
- "quadriceps femoris" → use "quads"
- "gastrocnemius/soleus" → use "calves"

✓ CORRECT: "focus": ["chest", "shoulders", "triceps"]
✗ WRONG: "focus": ["pectoralis major", "anterior deltoid", "triceps brachii"]

✓ CORRECT: "targetVolume": {"chest": 6, "shoulders": 4, "triceps": 3}
✗ WRONG: "targetVolume": {"pectoralis major": 6, "deltoids": 4}

IMPORTANT CONSIDERATIONS:
${input.experienceYears && input.experienceYears < 2 ? `
- User is a beginner (${input.experienceYears} years) - keep split simple, focus on compounds, moderate volume
- Aim for 2x per week frequency, avoid excessive variation
` : ''}
${input.experienceYears && input.experienceYears >= 3 ? `
- User is experienced (${input.experienceYears} years) - can handle higher frequency, more variation, near-MAV volume
- Implement full A/B variations for stimulus variety
` : ''}
${input.userAge && input.userAge > 50 ? `
- User is ${input.userAge} years old - ensure adequate recovery between sessions
- Consider extra rest day after intense leg sessions
` : ''}
${input.weakPoints.length > 0 ? `
- WEAK POINTS (${input.weakPoints.join(', ')}): Increase frequency or volume for these areas
- Consider adding weak point emphasis in both A and B variations
` : ''}
${input.mesocyclePhase === 'accumulation' ? `
- ACCUMULATION PHASE: Focus on volume accumulation
- Apply volume multiplier from periodization model (typically 100% or higher)
- Intensity at ~85% of maximum
- Prioritize compound movements and progressive overload
` : ''}
${input.mesocyclePhase === 'intensification' ? `
- INTENSIFICATION PHASE: Shift focus to intensity and quality
- Apply intensity multiplier (typically 100%), reduce volume slightly (90-95%)
- This is when advanced techniques (drop sets, myoreps, rest-pause) may be introduced
- Favor high stimulus-to-fatigue exercises (machines/cables)
` : ''}
${input.mesocyclePhase === 'deload' ? `
- DELOAD PHASE: Prioritize recovery
- Reduce volume by ${approach.periodization?.deloadPhase?.volumeReduction || '50%'}
- Maintain exercise selection but reduce sets significantly
- Intensity: ${approach.periodization?.deloadPhase?.intensityMaintenance || 'Reduce both volume and intensity'}
` : ''}

Output the split plan as JSON with this EXACT structure:
{
  "cycleDays": <number>,
  "sessions": [
    {
      "day": <number>,
      "name": <string>,
      "workoutType": <"push"|"pull"|"legs"|"upper"|"lower"|"full_body">,
      "variation": <"A"|"B">,
      "focus": [<muscle groups as strings>],
      "targetVolume": {<muscle_group>: <sets>},
      "principles": [<key principles for this session>],
      "exampleExercises": [<optional example exercises>]
    }
  ],
  "frequencyMap": {<muscle_group>: <times per week>},
  "volumeDistribution": {<muscle_group>: <total sets in cycle>},
  "rationale": <string explaining the split design>,
  "weeklyScheduleExample": [<day-by-day schedule strings>]
}

**⚠️ REMINDER**: Do NOT include muscle groups with 0 sets in targetVolume, frequencyMap, or volumeDistribution. Only include muscles that are actually being trained (sets > 0).
`

    return await this.complete<SplitPlanOutput>(prompt, targetLanguage)
  }

  private buildDemographicContext(input: SplitPlannerInput): string {
    const parts: string[] = []

    if (input.experienceYears !== null && input.experienceYears !== undefined) {
      parts.push(`Training Experience: ${input.experienceYears} years`)
    }

    if (input.userAge) {
      parts.push(`Age: ${input.userAge} years old`)
    }

    if (input.userGender) {
      parts.push(`Gender: ${input.userGender}`)
    }

    return parts.length > 0 ? parts.join('\n') : 'No demographic data provided'
  }

  private buildConstraintContext(input: SplitPlannerInput): string {
    const parts: string[] = []

    if (input.preferredRestDay) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      parts.push(`Preferred Rest Day: ${days[input.preferredRestDay - 1]}`)
    }

    return parts.length > 0 ? `\nSchedule Constraints:\n${parts.join('\n')}` : ''
  }
}
