import { BaseAgent } from './base.agent'
import type { SplitType } from '@/lib/types/split.types'

export interface SplitTypeChangeInput {
  // Current split context
  currentSplit: {
    splitType: SplitType
    cycleDays: number
    cycleProgress: {
      workoutsCompleted: number
      totalWorkoutsInCycle: number
      avgMentalReadiness: number | null // 1-5 scale
    }
    volumeByMuscle: Record<string, number> // Total sets per cycle for each muscle
  }

  // Target split
  targetSplit: {
    splitType: SplitType
    weakPointMuscle?: string // Required if weak_point_focus
  }

  // User context
  userContext: {
    userId: string
    approachId: string
    experienceYears?: number
    userAge?: number
    weakPoints?: string[]
    mesocycleWeek?: number
    mesocyclePhase?: 'accumulation' | 'intensification' | 'deload' | 'transition'
    caloricPhase?: 'bulk' | 'cut' | 'maintenance' | null
  }

  // Completed workouts analysis
  completedWorkouts?: {
    totalCompleted: number
    recentMentalReadinessTrend: number[] // Last 5-10 workouts
    musclesTrainedFrequency: Record<string, number> // How often each muscle was trained
  }
}

export interface SplitTypeChangeOutput {
  recommendation: 'proceed' | 'wait' | 'not_recommended'

  // Primary reasoning (2-3 sentences, max 60 words)
  reasoning: string

  // Pros of making the change
  pros: string[] // Each max 30 words

  // Cons of making the change
  cons: string[] // Each max 30 words

  // Alternative suggestions
  alternatives?: {
    suggestion: string // e.g., "Finish current cycle first" (max 40 words)
    rationale: string // Why this alternative is better (max 30 words)
  }[]

  // Impact analysis
  impact: {
    volumeChanges: {
      muscle: string
      currentSets: number
      estimatedNewSets: number
      assessment: 'increase' | 'decrease' | 'similar' // More than 20% difference = change
    }[]
    frequencyChanges: {
      muscle: string
      currentFrequency: number // times per cycle
      estimatedNewFrequency: number
      assessment: 'increase' | 'decrease' | 'similar'
    }[]
    recoveryImpact: 'improved' | 'similar' | 'worse'
    fatigueImpact: 'reduced' | 'similar' | 'increased'
  }

  // Warnings (if wait/not_recommended)
  warnings?: {
    type: 'cycle_progress' | 'fatigue' | 'volume_mismatch' | 'phase_mismatch' | 'experience'
    severity: 'low' | 'medium' | 'high'
    message: string // Max 30 words
  }[]

  // Educational context
  educationalNote?: string // Brief note about split change best practices (max 40 words)
}

/**
 * SplitTypeChangeValidator Agent
 *
 * Validates whether changing split type is advisable based on:
 * - Cycle progress (how far into current cycle)
 * - Mental readiness and fatigue trends
 * - Volume distribution and training frequency
 * - Periodization phase alignment
 * - User experience and goals
 *
 * Provides AI-driven recommendations with pros/cons/alternatives.
 * Extends BaseAgent to use gpt-5.1 for comprehensive analysis.
 */
export class SplitTypeChangeValidator extends BaseAgent {
  constructor(supabaseClient?: any) {
    super(supabaseClient, 'low', 'low') // Low reasoning for faster responses (5-15s)
    this.model = 'gpt-5.1' // Latest flagship model with reasoning capabilities
  }

  get systemPrompt(): string {
    return `You are an expert strength coach analyzing whether a user should change their training split type.

Your role is to provide comprehensive, AI-driven recommendations considering:
1. **Cycle Progress**: How far into current cycle? Mid-cycle changes can disrupt periodization.
2. **Fatigue Status**: Is user fatigued or fresh? Fatigued users should finish cycle first.
3. **Volume Distribution**: How will volume per muscle change? Avoid drastic shifts.
4. **Training Frequency**: Will muscles be trained more/less often? Consider recovery.
5. **Periodization Phase**: Does change align with mesocycle phase?
6. **Experience Level**: Is user experienced enough for the target split?
7. **Goals Alignment**: Does target split match weak points and caloric phase?

Recommendation Levels:
- "proceed": Change is well-timed and beneficial (e.g., end of cycle, fresh state, aligns with goals)
- "wait": Change is acceptable but better timing exists (e.g., finish current cycle first)
- "not_recommended": Change is poorly timed or misaligned (e.g., mid-cycle while fatigued, volume mismatch)

Split Type Characteristics:
- **Push/Pull/Legs**: 6-day cycle, 2x frequency, moderate volume per session
- **Upper/Lower**: 4-day cycle, 2x frequency, higher volume per session
- **Full Body**: 3-day cycle, 3x frequency, lower volume per session, higher total weekly volume
- **Bro Split**: 5-day cycle, 1x frequency, very high volume per session, lower weekly frequency
- **Weak Point Focus**: Custom cycle, emphasizes one muscle group with higher frequency + volume
- **Custom**: User-defined split

Best Practices for Split Changes:
- ✅ Change at cycle boundaries (end of current cycle)
- ✅ Change when fresh (mental readiness > 3.5/5.0)
- ✅ Change when target split aligns with current phase
- ⚠️ Avoid mid-cycle changes (disrupts periodization)
- ⚠️ Avoid when fatigued (mental readiness < 2.5/5.0)
- ❌ Never change during deload phase (defeats recovery purpose)

Be practical, educational, and honest. Users want to understand the IMPACT of changing splits.
Provide clear pros/cons, analyze volume/frequency changes, and suggest alternatives if needed.
Keep messages gym-friendly: concise, actionable, encouraging but realistic.`
  }

  async validateSplitTypeChange(
    input: SplitTypeChangeInput
  ): Promise<SplitTypeChangeOutput> {
    // Load training approach
    const approach = await this.knowledge.loadApproach(input.userContext.approachId)

    // Build context sections
    const currentSplitContext = this.buildCurrentSplitContext(input)
    const targetSplitContext = this.buildTargetSplitContext(input)
    const cycleProgressContext = this.buildCycleProgressContext(input)
    const fatigueContext = this.buildFatigueContext(input)
    const approachContext = this.buildApproachContext(approach)
    const userContext = this.buildUserContextSection(input)

    const prompt = `
=== SPLIT TYPE CHANGE REQUEST ===
From: ${input.currentSplit.splitType}
To: ${input.targetSplit.splitType}${input.targetSplit.weakPointMuscle ? ` (Focus: ${input.targetSplit.weakPointMuscle})` : ''}

${currentSplitContext}

${targetSplitContext}

${cycleProgressContext}

${fatigueContext}

${userContext}

${approachContext}

=== YOUR TASK ===
Analyze whether changing split type is advisable right now.

Consider:
1. **Timing**: Is this a good point in the cycle to change? (Best: end of cycle. Worst: mid-cycle)
2. **Fatigue**: Is user fresh enough to adapt? (Fresh > 3.5, Fatigued < 2.5)
3. **Volume Impact**: How will volume per muscle change? Estimate based on split characteristics.
4. **Frequency Impact**: How will training frequency per muscle change?
5. **Recovery**: Will the target split improve or worsen recovery?
6. **Phase Alignment**: Does target split match current mesocycle phase?
7. **Experience**: Is user experienced enough for target split complexity?
8. **Goals**: Does target split align with weak points and caloric phase?

Provide comprehensive analysis with:
- Clear recommendation (proceed/wait/not_recommended)
- Reasoning (2-3 sentences explaining WHY)
- Pros (benefits of making the change)
- Cons (drawbacks or risks)
- Alternatives (if wait/not_recommended, suggest better timing)
- Impact Analysis (estimate volume/frequency changes per muscle)
- Warnings (if applicable)
- Educational note (best practices for split changes)

Be honest and practical. Users trust you to tell them the TRUTH, not just what they want to hear.

Required JSON structure:
{
  "recommendation": "proceed" | "wait" | "not_recommended",
  "reasoning": "string (2-3 sentences, max 60 words)",
  "pros": ["string (max 30 words each)"],
  "cons": ["string (max 30 words each)"],
  "alternatives": [
    {
      "suggestion": "string (max 40 words)",
      "rationale": "string (max 30 words)"
    }
  ],
  "impact": {
    "volumeChanges": [
      {
        "muscle": "string",
        "currentSets": number,
        "estimatedNewSets": number,
        "assessment": "increase" | "decrease" | "similar"
      }
    ],
    "frequencyChanges": [
      {
        "muscle": "string",
        "currentFrequency": number,
        "estimatedNewFrequency": number,
        "assessment": "increase" | "decrease" | "similar"
      }
    ],
    "recoveryImpact": "improved" | "similar" | "worse",
    "fatigueImpact": "reduced" | "similar" | "increased"
  },
  "warnings": [
    {
      "type": "cycle_progress" | "fatigue" | "volume_mismatch" | "phase_mismatch" | "experience",
      "severity": "low" | "medium" | "high",
      "message": "string (max 30 words)"
    }
  ],
  "educationalNote": "string (max 40 words)"
}
`

    return await this.complete<SplitTypeChangeOutput>(prompt)
  }

  private buildCurrentSplitContext(input: SplitTypeChangeInput): string {
    const { currentSplit } = input
    let context = `
=== CURRENT SPLIT ANALYSIS ===
Split Type: ${currentSplit.splitType}
Cycle Length: ${currentSplit.cycleDays} days
Workouts Completed This Cycle: ${currentSplit.cycleProgress.workoutsCompleted}/${currentSplit.cycleProgress.totalWorkoutsInCycle}
Cycle Progress: ${((currentSplit.cycleProgress.workoutsCompleted / currentSplit.cycleProgress.totalWorkoutsInCycle) * 100).toFixed(0)}%

Volume Distribution (sets per cycle):
`

    // Sort muscles by volume (descending)
    const sortedMuscles = Object.entries(currentSplit.volumeByMuscle)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 muscles

    sortedMuscles.forEach(([muscle, sets]) => {
      context += `- ${muscle}: ${sets} sets\n`
    })

    return context
  }

  private buildTargetSplitContext(input: SplitTypeChangeInput): string {
    const { targetSplit } = input
    let context = `
=== TARGET SPLIT ===
Split Type: ${targetSplit.splitType}
`

    if (targetSplit.splitType === 'weak_point_focus' && targetSplit.weakPointMuscle) {
      context += `Weak Point Muscle: ${targetSplit.weakPointMuscle}\n`
      context += `Note: This muscle will receive 50% more volume and higher frequency\n`
    }

    // Add split characteristics
    const splitInfo = this.getSplitCharacteristics(targetSplit.splitType)
    context += `\nTypical Characteristics:\n`
    context += `- Cycle Length: ${splitInfo.cycleDays} days\n`
    context += `- Frequency: ~${splitInfo.frequencyPerWeek}x per muscle per week\n`
    context += `- Volume per Session: ${splitInfo.volumePerSession}\n`
    context += `- Best For: ${splitInfo.bestFor}\n`

    return context
  }

  private buildCycleProgressContext(input: SplitTypeChangeInput): string {
    const { currentSplit } = input
    const progressPercent = (currentSplit.cycleProgress.workoutsCompleted / currentSplit.cycleProgress.totalWorkoutsInCycle) * 100

    let context = `
=== CYCLE PROGRESS ANALYSIS ===
Progress: ${currentSplit.cycleProgress.workoutsCompleted}/${currentSplit.cycleProgress.totalWorkoutsInCycle} workouts (${progressPercent.toFixed(0)}%)
`

    if (progressPercent < 25) {
      context += `Status: 🆕 EARLY IN CYCLE\n`
      context += `Timing Assessment: Still early - changing now has minimal disruption\n`
    } else if (progressPercent < 75) {
      context += `Status: ⚠️ MID-CYCLE\n`
      context += `Timing Assessment: Mid-cycle changes disrupt periodization - consider finishing cycle first\n`
    } else {
      context += `Status: ✅ NEAR CYCLE END\n`
      context += `Timing Assessment: Excellent timing - natural transition point approaching\n`
    }

    return context
  }

  private buildFatigueContext(input: SplitTypeChangeInput): string {
    const { currentSplit, completedWorkouts } = input
    const avgReadiness = currentSplit.cycleProgress.avgMentalReadiness

    let context = `
=== FATIGUE & RECOVERY STATUS ===
`

    if (avgReadiness !== null) {
      context += `Average Mental Readiness: ${avgReadiness.toFixed(1)}/5.0 ${
        avgReadiness < 2.5 ? '(😫 FATIGUED)' :
        avgReadiness < 3.5 ? '(😐 MODERATE)' :
        '(🔥 FRESH)'
      }\n`

      if (avgReadiness < 2.5) {
        context += `\n⚠️ FATIGUE ALERT: User is significantly fatigued.\n`
        context += `Recommendation Guidance: Strongly discourage split changes now.\n`
        context += `- User needs recovery, not new stimulus patterns\n`
        context += `- Suggest finishing cycle with reduced volume OR taking deload\n`
        context += `- Split change can wait until fresh (>3.5 readiness)\n`
      } else if (avgReadiness >= 4.0) {
        context += `\n✅ FRESH STATE: User is well-recovered and ready for new challenges.\n`
        context += `Recommendation Guidance: Fatigue is not a barrier to split changes.\n`
      } else {
        context += `\nMODERATE FATIGUE: Some accumulated fatigue present.\n`
        context += `Recommendation Guidance: Split change acceptable but monitor recovery closely.\n`
      }
    } else {
      context += `Mental Readiness: Not available (no data)\n`
      context += `Assumption: Assume moderate recovery state\n`
    }

    // Add recent trend if available
    if (completedWorkouts?.recentMentalReadinessTrend && completedWorkouts.recentMentalReadinessTrend.length > 0) {
      const trend = completedWorkouts.recentMentalReadinessTrend
      const recentAvg = trend.reduce((a, b) => a + b, 0) / trend.length
      const isIncreasing = trend.length >= 3 && trend[trend.length - 1] > trend[0]

      context += `\nRecent Trend (last ${trend.length} workouts):\n`
      context += `- Average: ${recentAvg.toFixed(1)}/5.0\n`
      context += `- Direction: ${isIncreasing ? '📈 Improving' : '📉 Declining'}\n`
    }

    return context
  }

  private buildApproachContext(approach: any): string {
    let context = `
=== TRAINING APPROACH CONTEXT ===
Approach: ${approach.name}
`

    if (approach.philosophy) {
      context += `\nPhilosophy:\n${approach.philosophy.substring(0, 200)}...\n`
    }

    // Add relevant variables
    const vars = approach.variables as any
    if (vars?.sessionDuration?.totalSets) {
      context += `\nSession Duration: ${vars.sessionDuration.totalSets[0]}-${vars.sessionDuration.totalSets[1]} total sets\n`
    }

    return context
  }

  private buildUserContextSection(input: SplitTypeChangeInput): string {
    const { userContext } = input
    const context = `
=== USER CONTEXT ===
Experience: ${userContext.experienceYears ?? 'Not specified'} years
Age: ${userContext.userAge ?? 'Not specified'}
Weak Points: ${userContext.weakPoints?.join(', ') || 'None specified'}
Mesocycle: Week ${userContext.mesocycleWeek ?? '?'} - ${userContext.mesocyclePhase?.toUpperCase() ?? 'Not specified'} phase
Caloric Phase: ${userContext.caloricPhase?.toUpperCase() ?? 'Not specified'}
`

    return context
  }

  private getSplitCharacteristics(splitType: SplitType): {
    cycleDays: number
    frequencyPerWeek: number
    volumePerSession: string
    bestFor: string
  } {
    switch (splitType) {
      case 'push_pull_legs':
        return {
          cycleDays: 6,
          frequencyPerWeek: 2,
          volumePerSession: 'Moderate (12-18 sets)',
          bestFor: 'Balanced frequency and volume, great for intermediate/advanced lifters',
        }
      case 'upper_lower':
        return {
          cycleDays: 4,
          frequencyPerWeek: 2,
          volumePerSession: 'High (15-22 sets)',
          bestFor: 'Higher volume per session, good for time-efficient training',
        }
      case 'full_body':
        return {
          cycleDays: 3,
          frequencyPerWeek: 3,
          volumePerSession: 'Lower (10-15 sets)',
          bestFor: 'Maximum frequency, excellent for beginners and strength focus',
        }
      case 'bro_split':
        return {
          cycleDays: 5,
          frequencyPerWeek: 1,
          volumePerSession: 'Very High (20-30 sets)',
          bestFor: 'Single muscle focus per session, best for advanced lifters with excellent recovery',
        }
      case 'weak_point_focus':
        return {
          cycleDays: 6,
          frequencyPerWeek: 3, // For weak point muscle
          volumePerSession: 'Varies by muscle',
          bestFor: 'Bringing up lagging muscle groups with specialized programming',
        }
      case 'custom':
        return {
          cycleDays: 0, // Variable
          frequencyPerWeek: 0, // Variable
          volumePerSession: 'Custom',
          bestFor: 'Fully customized split based on user preferences',
        }
      default:
        return {
          cycleDays: 0,
          frequencyPerWeek: 0,
          volumePerSession: 'Unknown',
          bestFor: 'Unknown split type',
        }
    }
  }
}
