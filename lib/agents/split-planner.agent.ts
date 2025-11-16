import { BaseAgent } from './base.agent'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export interface CycleCompletionSummary {
  cycleNumber: number
  completedAt: string
  totalVolume: number
  totalWorkoutsCompleted: number
  avgMentalReadiness: number | null
  totalSets: number
  volumeByMuscleGroup: Record<string, number>
  workoutsByType: Record<string, number>
}

export interface CycleComparisonData {
  volumeDelta: number // Percentage change
  workoutsDelta: number // Absolute change
  mentalReadinessDelta: number | null // Absolute change
  setsDelta: number // Absolute change
}

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
  userHeight?: number | null // cm (for work capacity estimation)
  userWeight?: number | null // kg (for recovery capacity estimation)
  // Schedule constraints
  preferredRestDay?: number // 1-7, where 1 = Monday
  // Periodization context
  mesocycleWeek?: number | null // Current week of mesocycle (1-12)
  mesocyclePhase?: 'accumulation' | 'intensification' | 'deload' | 'transition' | null
  // Caloric phase context (NEW - Item 1)
  caloricPhase?: 'bulk' | 'cut' | 'maintenance' | null
  caloricIntakeKcal?: number | null // Daily surplus/deficit (-1500 to +1500)
  // Cycle history context (NEW)
  recentCycleCompletions?: CycleCompletionSummary[]
  cycleComparison?: CycleComparisonData | null
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
    // Use low reasoning for faster split generation (90s vs 240s timeout)
    // Medium reasoning was too slow for onboarding UX (appeared stuck at 60%)
    // Use low verbosity for cleaner, more scannable onboarding output
    super(supabaseClient, 'low', 'low')
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

    // Build cycle history context (NEW)
    const cycleHistoryContext = this.buildCycleHistoryContext(input, approach)

    // Build caloric phase context (NEW - Item 1)
    const hasFixedVolume = approach.variables?.volumePerWeek?.isFixed || false
    const caloricPhaseContext = this.buildCaloricPhaseContext(
      input.caloricPhase,
      input.caloricIntakeKcal,
      hasFixedVolume,
      approach.name,
      approach.variables?.setsPerExercise
    )

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
${cycleHistoryContext}
${caloricPhaseContext}

=== TASK ===
Design a complete training split plan that:

1. **Cycle Structure**:
   - For PPL with 6 days/week: use 8-day cycle (3 on, 1 off, repeat) with A/B variations
     * Day 1-3: Push A, Pull A, Legs A
     * Day 4: **REST DAY**
     * Day 5-7: Push B, Pull B, Legs B
     * Day 8: **REST DAY**
     * cycleDays = 8 (includes rest days)
   - For PPL with 3 days/week: use simple 3-day cycle without variations
   - For Upper/Lower: typically 4-day cycle (2 on, 1 off, repeat)
   - For Bro Split: use 10-day cycle (5 workout types: chest, back, shoulders, arms, legs × 2 variations A/B) with 2 rest days
   - For Weak Point Focus: use frequency-based cycle (typically 7-8 days) with ${input.specializationMuscle || 'target muscle'} trained 3-4× per cycle
   - **CRITICAL**: cycleDays MUST include rest days. For example, 6 training days + 2 rest days = 8 cycleDays

2. **Sessions**: Create detailed session definitions for each day in the cycle
   - **TRAINING DAYS**: Assign workout type (push/pull/legs/upper/lower/chest/back/shoulders/arms for bro split)
     * Assign A or B variation (alternate for variety)
     * For Bro Split Variation A: focus on strength & compound movements
     * For Bro Split Variation B: focus on hypertrophy & isolation movements
     * For Weak Point Focus: ensure ${input.specializationMuscle || 'target muscle'} appears 3-4× with increased volume (1.5× normal)
     * Define muscle group focus for each session
     * Set target volume (sets) per muscle group per session
     * Include 2-3 key principles from the approach for each session
   - **REST DAYS**: MUST be included as explicit session objects with:
     * name: "Rest"
     * workoutType: null
     * variation: null
     * focus: []
     * targetVolume: {}
     * principles: ["Active recovery", "Sleep and nutrition focus"]
     * exampleExercises: []

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
  "cycleDays": <number (MUST include rest days, e.g., 8 for PPL)>,
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
    },
    // REST DAY EXAMPLE (REQUIRED for rest days):
    {
      "day": 4,
      "name": "Rest",
      "workoutType": null,
      "variation": null,
      "focus": [],
      "targetVolume": {},
      "principles": ["Active recovery", "Sleep and nutrition focus"],
      "exampleExercises": []
    }
  ],
  "frequencyMap": {<muscle_group>: <times per week>},
  "volumeDistribution": {<muscle_group>: <total sets in cycle>},
  "rationale": <string explaining the split design>,
  "weeklyScheduleExample": [<day-by-day schedule strings including rest days>]
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

    if (input.userHeight) {
      parts.push(`Height: ${input.userHeight} cm`)
    }

    if (input.userWeight) {
      parts.push(`Weight: ${input.userWeight} kg`)
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

  private buildCycleHistoryContext(input: SplitPlannerInput, approach: any): string {
    if (!input.recentCycleCompletions || input.recentCycleCompletions.length === 0) {
      return ''
    }

    const formatDate = (isoString: string) => {
      const date = new Date(isoString)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'today'
      if (diffDays === 1) return 'yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return `${Math.floor(diffDays / 30)} months ago`
    }

    let context = '\n=== USER\'S CYCLE PERFORMANCE HISTORY ===\n'
    context += 'IMPORTANT: Use this historical data to inform your split design. Learn from what worked and what didn\'t.\n\n'

    // Show recent cycles
    input.recentCycleCompletions.forEach((cycle, idx) => {
      const cycleAge = idx === 0 ? '🔵 MOST RECENT CYCLE' : `Cycle ${idx + 1} ago`

      context += `**Cycle #${cycle.cycleNumber} (${cycleAge})**\n`
      context += `Completed: ${formatDate(cycle.completedAt)}\n`
      context += `Total Volume: ${cycle.totalVolume.toFixed(0)}kg\n`
      context += `Workouts Completed: ${Object.values(cycle.workoutsByType).reduce((a, b) => a + b, 0)}\n`
      context += `Average Mental Readiness: ${cycle.avgMentalReadiness?.toFixed(1) || 'N/A'}/5.0 ${
        cycle.avgMentalReadiness
          ? cycle.avgMentalReadiness >= 4 ? '😊 (user was fresh and engaged)'
          : cycle.avgMentalReadiness >= 3 ? '😐 (moderate fatigue)'
          : cycle.avgMentalReadiness >= 2 ? '😓 (high fatigue)'
          : '😰 (very high fatigue - user struggled)'
          : ''
      }\n`
      context += `Total Sets: ${cycle.totalSets}\n\n`

      // Volume distribution
      const sortedMuscles = Object.entries(cycle.volumeByMuscleGroup)
        .sort((a, b) => b[1] - a[1])

      context += `Volume Distribution by Muscle Group:\n`
      sortedMuscles.forEach(([muscle, sets]) => {
        const mev = approach.volumeLandmarks?.muscleGroups?.[muscle]?.mev || 10
        const mav = approach.volumeLandmarks?.muscleGroups?.[muscle]?.mav || 20
        const mrv = approach.volumeLandmarks?.muscleGroups?.[muscle]?.mrv || 26

        let status = ''
        if (sets < mev) status = ' ⚠️ BELOW MEV (under-trained)'
        else if (sets >= mev && sets < mav) status = ' ✓ Maintenance volume'
        else if (sets >= mav && sets < mrv) status = ' ✅ Optimal growth zone (MAV)'
        else status = ' ⚠️ APPROACHING MRV (risk of overtraining)'

        context += `  - ${muscle}: ${sets} sets${status}\n`
      })

      // Workout types
      context += `\nWorkout Types Distribution:\n`
      Object.entries(cycle.workoutsByType).forEach(([type, count]) => {
        context += `  - ${type}: ${count} workouts\n`
      })

      context += '\n---\n\n'
    })

    // Add comparison analysis if available
    if (input.cycleComparison && input.recentCycleCompletions.length >= 2) {
      context += '**📊 PERFORMANCE TREND (Current vs Previous Cycle)**\n'
      context += `- Volume Change: ${input.cycleComparison.volumeDelta > 0 ? '+' : ''}${input.cycleComparison.volumeDelta.toFixed(1)}%\n`
      context += `- Workouts Change: ${input.cycleComparison.workoutsDelta > 0 ? '+' : ''}${input.cycleComparison.workoutsDelta}\n`
      context += `- Mental Readiness Change: ${
        input.cycleComparison.mentalReadinessDelta !== null
          ? `${input.cycleComparison.mentalReadinessDelta > 0 ? '+' : ''}${input.cycleComparison.mentalReadinessDelta.toFixed(1)} points`
          : 'N/A'
      }\n`
      context += `- Sets Change: ${input.cycleComparison.setsDelta > 0 ? '+' : ''}${input.cycleComparison.setsDelta}\n\n`

      // Add AI guidance based on trends
      context += '**🎯 CRITICAL INSTRUCTIONS BASED ON CYCLE HISTORY**\n\n'

      // Scenario 1: Volume declining + Mental readiness declining (overtraining or burnout)
      if (input.cycleComparison.volumeDelta < -10 && input.cycleComparison.mentalReadinessDelta && input.cycleComparison.mentalReadinessDelta < -0.5) {
        context += '⚠️ **ALERT: DECLINING PERFORMANCE DETECTED**\n'
        context += `Volume is DECLINING (-${Math.abs(input.cycleComparison.volumeDelta).toFixed(1)}%) AND mental readiness is DROPPING (-${Math.abs(input.cycleComparison.mentalReadinessDelta).toFixed(1)} points).\n\n`
        context += 'DIAGNOSIS: User is likely experiencing overtraining, burnout, or life stress.\n\n'
        context += 'ACTION FOR NEW SPLIT:\n'
        context += '- Reduce volume by 15-20% from last cycle\'s peak\n'
        context += '- Increase frequency slightly (shorter, more frequent sessions for better recovery)\n'
        context += '- Add explicit strategic deload week every 4-6 weeks\n'
        context += '- Focus on exercise variety and enjoyment to boost mental engagement\n'
        context += '- Consider recommending a full deload week BEFORE starting this new split\n\n'
      }

      // Scenario 2: Volume increasing + Mental readiness declining (overreaching)
      if (input.cycleComparison.volumeDelta > 10 && input.cycleComparison.mentalReadinessDelta && input.cycleComparison.mentalReadinessDelta < -0.5) {
        context += '⚠️ **ALERT: OVERREACHING DETECTED**\n'
        context += `Volume is INCREASING (+${input.cycleComparison.volumeDelta.toFixed(1)}%) but mental readiness is DECLINING (-${Math.abs(input.cycleComparison.mentalReadinessDelta).toFixed(1)} points).\n\n`
        context += 'DIAGNOSIS: User pushed too hard too fast. Poor recovery or excessive volume accumulation.\n\n'
        context += 'ACTION FOR NEW SPLIT:\n'
        context += '- CAP volume at current levels (do NOT increase further)\n'
        context += '- Optimize recovery: redistribute volume across more sessions if possible\n'
        context += '- Prioritize exercise variety to maintain engagement and reduce monotony\n'
        context += '- Consider starting with a strategic deload (50% volume reduction for 1 week)\n\n'
      }

      // Scenario 3: Volume increasing + Mental readiness improving (positive adaptation)
      if (input.cycleComparison.volumeDelta > 5 && input.cycleComparison.mentalReadinessDelta && input.cycleComparison.mentalReadinessDelta > 0.3) {
        context += '✅ **EXCELLENT: POSITIVE ADAPTATION DETECTED**\n'
        context += `Volume is INCREASING (+${input.cycleComparison.volumeDelta.toFixed(1)}%) AND mental readiness is IMPROVING (+${input.cycleComparison.mentalReadinessDelta.toFixed(1)} points).\n\n`
        context += 'DIAGNOSIS: User is responding exceptionally well to training. Recovery is excellent.\n\n'
        context += 'ACTION FOR NEW SPLIT:\n'
        context += '- Continue progressive overload: increase volume by another 5-10% (approaching MAV)\n'
        context += '- Consider introducing advanced techniques (drop sets, myoreps, rest-pause) if appropriate for phase\n'
        context += '- Maintain current split structure as it\'s clearly working well\n'
        context += '- User can handle more challenging exercise variations\n\n'
      }

      // Check for under-trained muscles
      const lastCycle = input.recentCycleCompletions[0]
      const underTrainedMuscles = Object.entries(lastCycle.volumeByMuscleGroup)
        .filter(([muscle, sets]) => {
          const mev = approach.volumeLandmarks?.muscleGroups?.[muscle]?.mev || 10
          return sets < mev
        })
        .map(([muscle]) => muscle)

      if (underTrainedMuscles.length > 0) {
        context += '⚠️ **UNDER-TRAINED MUSCLES DETECTED**\n'
        underTrainedMuscles.forEach(muscle => {
          const sets = lastCycle.volumeByMuscleGroup[muscle]
          const mev = approach.volumeLandmarks?.muscleGroups?.[muscle]?.mev || 10
          context += `- ${muscle}: ${sets} sets (below MEV of ${mev} sets)\n`
        })
        context += '\nACTION: Increase volume for these muscles to at least MEV in the new split.\n\n'
      }

      // Check for over-trained muscles (approaching MRV)
      const overTrainedMuscles = Object.entries(lastCycle.volumeByMuscleGroup)
        .filter(([muscle, sets]) => {
          const mrv = approach.volumeLandmarks?.muscleGroups?.[muscle]?.mrv || 26
          return sets >= mrv * 0.9
        })
        .map(([muscle]) => muscle)

      if (overTrainedMuscles.length > 0) {
        context += '⚠️ **MUSCLES APPROACHING MRV (OVERTRAINING RISK)**\n'
        overTrainedMuscles.forEach(muscle => {
          const sets = lastCycle.volumeByMuscleGroup[muscle]
          const mrv = approach.volumeLandmarks?.muscleGroups?.[muscle]?.mrv || 26
          context += `- ${muscle}: ${sets} sets (approaching MRV of ${mrv} sets)\n`
        })
        context += '\nACTION: Reduce volume for these muscles or schedule a deload to avoid overtraining.\n\n'
      }
    }

    return context
  }
}
