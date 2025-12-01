import { BaseAgent } from './base.agent'
import type { ProgressionInput, ProgressionOutput } from '@/lib/types/progression'

export type { ProgressionInput, ProgressionOutput }

export class ProgressionCalculator extends BaseAgent {
  constructor(supabaseClient?: any) {
    // Use GPT-5.1 with reasoning='none' for ultra-low latency during workouts (critical for gym UX)
    super(supabaseClient, 'none', 'low')
  }

  get systemPrompt() {
    return `PREAMBLE INSTRUCTION: Before providing your JSON response, briefly explain your reasoning in natural language. Consider the approach philosophy, last set performance, and periodization context.

You are an expert strength coach specializing in set progression for both BODYBUILDING and POWERLIFTING approaches.

For BODYBUILDING approaches (RIR-based):
- Focus on progressive overload through rep/weight increases
- Use RIR (Reps In Reserve) targets
- Consider volume and pump for hypertrophy

For POWERLIFTING approaches (Percentage/RPE-based):
- Wendler 5/3/1: Use Training Max percentages, AMRAP on final sets
- RTS/DUP: Use RPE targets, autoregulate based on daily readiness
- Sheiko: High volume at moderate intensity, NO grinding reps
- Westside: Max Effort or Dynamic Effort based on session type

ALWAYS provide:
1. Main suggestion based on approach
2. Clear rationale referencing approach principles
3. 2-3 alternatives with different focuses

Output valid JSON with the exact structure requested.`
  }

  async suggestNextSet(input: ProgressionInput, targetLanguage?: 'en' | 'it'): Promise<ProgressionOutput> {
    console.log('[ProgressionCalculator] Starting suggestNextSet', {
      input: {
        lastSet: input.lastSet,
        setNumber: input.setNumber,
        exerciseType: input.exerciseType,
        approachId: input.approachId,
        experienceYears: input.experienceYears,
        userAge: input.userAge,
        mesocyclePhase: input.mesocyclePhase,
        mesocycleWeek: input.mesocycleWeek,
        previousResponseId: input.previousResponseId  // CoT persistence tracking
      },
      timestamp: new Date().toISOString()
    })

    const approach = await this.knowledge.loadApproach(input.approachId)
    const isPowerlifting = approach.category === 'powerlifting'

    console.log('[ProgressionCalculator] Loaded approach:', {
      name: approach.name,
      category: approach.category,
      isPowerlifting,
      hasAdvancedTechniques: !!approach.advancedTechniques,
      hasTempo: !!approach.variables?.tempo,
      hasRestPeriods: !!approach.variables?.restPeriods
    })

    const context = this.knowledge.formatContextForAI(approach, 'progression')

    // Build powerlifting-specific context if applicable
    const powerliftingContext = isPowerlifting ? this.buildPowerliftingContext(input, approach) : ''

    const demographicContext = input.experienceYears || input.userAge
      ? `
User Context:
${input.experienceYears ? `- Training Experience: ${input.experienceYears} years` : ''}
${input.userAge ? `- Age: ${input.userAge} years old` : ''}
`
      : ''

    const mentalReadinessLabels = {
      1: 'Drained (😫)',
      2: 'Struggling (😕)',
      3: 'Neutral (😐)',
      4: 'Engaged (🙂)',
      5: 'Locked In (🔥)'
    }

    const mentalReadinessContext = input.lastSet.mentalReadiness
      ? `- Mental State during last set: ${mentalReadinessLabels[input.lastSet.mentalReadiness as keyof typeof mentalReadinessLabels]} (${input.lastSet.mentalReadiness}/5)`
      : ''

    const periodizationContext = input.mesocyclePhase
      ? `
=== CURRENT MESOCYCLE CONTEXT ===
Week ${input.mesocycleWeek || '?'} - ${input.mesocyclePhase.toUpperCase()} Phase

${input.mesocyclePhase === 'accumulation' ? `
Phase Focus: Volume accumulation and progressive overload
Progression Strategy:
- Standard progressive overload principles
- Focus on adding reps or weight when RIR allows
- Maintain proper form and tempo
` : ''}
${input.mesocyclePhase === 'intensification' ? `
Phase Focus: Intensity and quality - THIS IS WHERE ADVANCED TECHNIQUES SHINE
Progression Strategy:
- Push closer to/beyond failure
- Consider advanced techniques for final sets
- Quality reps over quantity
${approach.advancedTechniques ? `
Available Advanced Techniques (from approach):
${Object.entries(approach.advancedTechniques).map(([name, t]: [string, any]) => `- ${name}: ${t.when || 'N/A'} | Protocol: ${t.protocol || 'N/A'}`).join('\n')}

IMPORTANT: If this is the final set or user is plateauing, suggest one of these techniques.
` : ''}
` : ''}
${input.mesocyclePhase === 'deload' ? `
Phase Focus: Active recovery
Progression Strategy:
- MAINTAIN weight if possible, but reduce volume significantly
- Focus on movement quality and technique refinement
- Do NOT push to failure
` : ''}
`
      : ''

    // Build caloric phase context (NEW - Item 2)
    const hasFixedVolume = false // ProgressionCalculator doesn't change set count
    const caloricPhaseContext = this.buildCaloricPhaseContext(
      input.caloricPhase,
      undefined, // caloricIntakeKcal not needed for progression
      hasFixedVolume,
      approach.name
    )

    // Build cycle fatigue context (NEW - Item 2)
    const cycleFatigueContext = input.currentCycleFatigue
      ? `
=== CURRENT CYCLE FATIGUE STATUS ===
Workouts Completed in Cycle: ${input.currentCycleFatigue.workoutsCompleted}
${input.currentCycleFatigue.avgMentalReadiness !== null ? `
Average Mental Readiness: ${input.currentCycleFatigue.avgMentalReadiness.toFixed(1)}/5.0 ${
  input.currentCycleFatigue.avgMentalReadiness < 2.5 ? '(😫 FATIGUED - High accumulated fatigue)' :
  input.currentCycleFatigue.avgMentalReadiness < 3.5 ? '(😐 MODERATE - Some fatigue present)' :
  '(🔥 FRESH - Good recovery state)'
}

${input.currentCycleFatigue.avgMentalReadiness < 2.5 ? `
⚠️ FATIGUE ALERT: User is experiencing accumulated fatigue from this cycle.
Progression Guidance:
- Be MORE CONSERVATIVE than normal with load increases
- Prioritize maintaining current loads with better form
- Consider suggesting deload if mental readiness continues to decline
- RIR targets should be 2-3 minimum (stay further from failure)
- Smaller weight jumps (2.5kg instead of 5kg for compounds)
` : input.currentCycleFatigue.avgMentalReadiness >= 3.5 ? `
✅ FRESH STATE: User is well-recovered within this cycle.
Progression Guidance:
- Standard or slightly aggressive progression appropriate
- Can push RIR targets as per approach guidelines
- Good state for attempting PRs if form is solid
` : `
MODERATE FATIGUE: User has some accumulated fatigue but manageable.
Progression Guidance:
- Standard progression with attention to form
- Monitor RIR closely - don't push beyond approach targets
- Conservative if form starts breaking down
`}
` : 'Mental readiness data not available for this cycle'}
`
      : ''

    // Check for active insights related to this exercise
    const relevantInsights = input.activeInsights?.filter(
      insight => insight.exerciseName === input.exerciseName &&
                 (insight.type === 'pain' || insight.type === 'technique')
    ) || [];

    const insightsContext = relevantInsights.length > 0
      ? `
=== ⚠️ ACTIVE SAFETY ALERTS FOR THIS EXERCISE ===

The user has reported the following issues with ${input.exerciseName || 'this exercise'}:

${relevantInsights.map(insight => `
**Insight ID: ${insight.id}**
Type: ${insight.type}
Severity: ${insight.severity}
User Note: "${insight.userNote}"
${insight.severity === 'critical' || insight.severity === 'warning' ? `
🚨 IMPORTANT: Be VERY CONSERVATIVE with progression. User safety is the priority.
Suggested actions:
- Maintain or REDUCE weight if discomfort persists
- Increase RIR target (stay further from failure)
- Focus on form and control over load
- Consider suggesting to stop if pain worsens
` : insight.severity === 'caution' ? `
⚠️ CAUTION: Be conservative with progression.
- Smaller weight increments than normal
- Keep RIR higher (2-3 minimum)
- Prioritize technique over load
` : ''}
`).join('\n')}

**MANDATORY OUTPUT:**
Include an "insightWarnings" array in your response with warnings and suggestions for each insight.
`
      : '';

    const prompt = `
Previous set: ${input.lastSet.weight}kg x ${input.lastSet.reps} reps @ RIR ${input.lastSet.rir}${input.lastSet.rpe ? ` (RPE ${input.lastSet.rpe})` : ''}
${mentalReadinessContext}
This is set number: ${input.setNumber}
Exercise type: ${input.exerciseType}
${input.exerciseName ? `Exercise name: ${input.exerciseName}` : ''}
${demographicContext}
Training approach context:
${context}
${powerliftingContext}
${periodizationContext}
${caloricPhaseContext}
${cycleFatigueContext}
${insightsContext}

${approach.variables?.tempo ? `
TEMPO REQUIREMENT: ${approach.variables.tempo}
IMPORTANT: Remind the user to maintain this tempo in your response.
` : ''}
${approach.variables?.restPeriods ? `
REST PERIOD GUIDANCE:
- Compounds: ${approach.variables.restPeriods.compound || 'Not specified'}
- Isolation: ${approach.variables.restPeriods.isolation || 'Not specified'}
${approach.variables.restPeriods.autoRegulation ? `- Autoregulation: ${approach.variables.restPeriods.autoRegulation}` : ''}
IMPORTANT: Include rest period reminder in your response.
` : ''}

${input.experienceYears ? `Consider that the user has ${input.experienceYears} years of training experience when suggesting progression - beginners may need smaller jumps, advanced lifters can handle larger changes.` : ''}
${input.userAge && input.userAge > 40 ? `Consider that the user is ${input.userAge} years old - older athletes may benefit from slightly more conservative progression to manage fatigue.` : ''}
${input.lastSet.mentalReadiness && input.lastSet.mentalReadiness <= 2 ? `IMPORTANT: The user reported low mental readiness (${input.lastSet.mentalReadiness}/5). Even if they hit their physical targets, consider a more conservative progression to avoid burnout. Mental fatigue is a real indicator.` : ''}

Based on this approach, suggest the next set.

${targetLanguage === 'it' ? `
⚠️ LINGUA OBBLIGATORIA: ITALIANO
Scrivi TUTTI i campi di testo in italiano:
- "rationale": spiegazione in italiano
- "alternatives[].explanation": spiegazione in italiano
- "advancedTechniqueSuggestion.when/protocol": in italiano
- "tempoReminder" e "restReminder": in italiano
- "insightWarnings[].warning/suggestion": in italiano
I nomi degli esercizi possono restare in inglese.
` : ''}
Required JSON structure:
{
  "suggestion": {
    "weight": number,
    "reps": number,
    "rirTarget": number
  },
  "rationale": "string explaining based on approach",
  "alternatives": [
    {
      "weight": number,
      "reps": number,
      "focus": "volume" | "intensity" | "pump",
      "explanation": "string"
    }
  ],
  "advancedTechniqueSuggestion": {  // OPTIONAL - only in intensification phase on final sets or plateau
    "technique": "string (e.g., myoreps, drop set, rest-pause)",
    "when": "string (e.g., on last set, if plateau)",
    "protocol": "string (brief how-to execute)"
  },
  "tempoReminder": "${approach.variables?.tempo ? `Maintain ${approach.variables.tempo} tempo` : null}",  // Include if tempo is specified
  "restReminder": "string reminder about rest period",  // Include if rest periods specified
  "insightWarnings": [  // OPTIONAL - only if there are active insights for this exercise
    {
      "insightId": "uuid",
      "warning": "Brief warning message for user",
      "suggestion": "Specific suggestion (e.g., 'Reduce weight by 10%', 'Stop if pain increases')"
    }
  ]
}

${relevantInsights.length > 0 ? `
**REMINDER:** You MUST include the "insightWarnings" array since there are ${relevantInsights.length} active insight(s) for this exercise.
` : ''}
    `

    console.log('[ProgressionCalculator] Sending prompt to AI', {
      promptLength: prompt.length,
      hasMesocycleContext: !!periodizationContext,
      hasDemographicContext: !!demographicContext,
      mentalReadiness: input.lastSet.mentalReadiness,
      hasActiveInsights: relevantInsights.length > 0,
      insightsCount: relevantInsights.length,
      previousResponseId: input.previousResponseId  // Multi-turn CoT persistence
    })

    // Pass previousResponseId for multi-turn CoT persistence (+4.3% accuracy, -30-50% CoT tokens)
    const result = await this.complete<ProgressionOutput>(
      prompt,
      targetLanguage,
      undefined,  // customTimeoutMs (use default)
      input.previousResponseId  // Enable multi-turn reasoning context
    )

    // Ensure insightWarnings field exists if there were relevant insights
    if (relevantInsights.length > 0 && !result.insightWarnings) {
      result.insightWarnings = [];
    }

    console.log('[ProgressionCalculator] AI response received', {
      suggestion: result.suggestion,
      rationalePreview: result.rationale?.substring(0, 100),
      alternativesCount: result.alternatives?.length || 0,
      hasAdvancedTechnique: !!result.advancedTechniqueSuggestion,
      hasTempoReminder: !!result.tempoReminder,
      hasRestReminder: !!result.restReminder
    })

    // Validate result
    if (!result.suggestion || !result.rationale) {
      console.error('[ProgressionCalculator] Invalid AI response - missing suggestion or rationale', {
        hasSuggestion: !!result.suggestion,
        hasRationale: !!result.rationale,
        result
      })
      throw new Error('Invalid progression suggestion')
    }

    // Validate suggestion values
    if (!result.suggestion.weight || !result.suggestion.reps || result.suggestion.rirTarget === undefined) {
      console.error('[ProgressionCalculator] Invalid suggestion values', {
        weight: result.suggestion.weight,
        reps: result.suggestion.reps,
        rirTarget: result.suggestion.rirTarget
      })
      throw new Error('Invalid progression suggestion - missing weight, reps, or RIR target')
    }

    console.log('[ProgressionCalculator] Suggestion validated successfully', {
      previousSet: `${input.lastSet.weight}kg × ${input.lastSet.reps} @ RIR ${input.lastSet.rir}`,
      nextSet: `${result.suggestion.weight}kg × ${result.suggestion.reps} @ RIR ${result.suggestion.rirTarget}`,
      weightChange: result.suggestion.weight - input.lastSet.weight,
      repsChange: result.suggestion.reps - input.lastSet.reps
    })

    // Attach response ID for next set's CoT persistence
    // This enables passing reasoning context between consecutive sets
    const responseId = this.getLastResponseId()
    if (responseId) {
      result.responseId = responseId
      console.log('[ProgressionCalculator] Response ID saved for next set', { responseId })
    }

    return result
  }

  /**
   * Build powerlifting-specific context for progression suggestions
   * Includes Training Max, RPE targets, cycle week info
   */
  private buildPowerliftingContext(input: ProgressionInput, approach: any): string {
    const name = approach.name?.toLowerCase() || ''

    // Wendler 5/3/1 context
    if (name.includes('wendler') || name.includes('5/3/1')) {
      const cycleWeek = input.cycleWeek || input.mesocycleWeek || 1
      const trainingMax = input.trainingMax

      return `
=== POWERLIFTING CONTEXT (Wendler 5/3/1) ===
Cycle Week: ${cycleWeek} of 4
${trainingMax ? `Training Max: ${trainingMax}kg` : 'Training Max: Not set - suggest based on E1RM'}

Week ${cycleWeek} Protocol:
${cycleWeek === 1 ? '- Sets at 65%, 75%, 85% of TM (5/5/5+ reps)' : ''}
${cycleWeek === 2 ? '- Sets at 70%, 80%, 90% of TM (3/3/3+ reps)' : ''}
${cycleWeek === 3 ? '- Sets at 75%, 85%, 95% of TM (5/3/1+ reps)' : ''}
${cycleWeek === 4 ? '- DELOAD: Sets at 40%, 50%, 60% of TM (5/5/5 reps - no AMRAP)' : ''}

IMPORTANT:
- Weight is FIXED by percentage - don't suggest different weights based on RIR
- Final working set is AMRAP (except deload week)
- Focus on rep quality and number of reps achieved on AMRAP
${trainingMax ? `- Suggested weights: Set 1=${Math.round(trainingMax * (cycleWeek === 1 ? 0.65 : cycleWeek === 2 ? 0.70 : cycleWeek === 3 ? 0.75 : 0.40) / 2.5) * 2.5}kg, Set 2=${Math.round(trainingMax * (cycleWeek === 1 ? 0.75 : cycleWeek === 2 ? 0.80 : cycleWeek === 3 ? 0.85 : 0.50) / 2.5) * 2.5}kg, Set 3=${Math.round(trainingMax * (cycleWeek === 1 ? 0.85 : cycleWeek === 2 ? 0.90 : cycleWeek === 3 ? 0.95 : 0.60) / 2.5) * 2.5}kg` : ''}
`
    }

    // RTS/DUP context
    if (name.includes('rts') || name.includes('dup') || name.includes('autoregulated')) {
      const targetRpe = input.targetRpe || 8

      return `
=== POWERLIFTING CONTEXT (RTS/DUP Autoregulated) ===
Target RPE: ${targetRpe}
${input.lastSet.rpe ? `Last Set RPE: ${input.lastSet.rpe}` : ''}

Autoregulation Guidelines:
- If actual RPE > target: REDUCE weight for next set
- If actual RPE < target: Can INCREASE weight
- If actual RPE = target: Maintain or slight increase

RPE Reference:
- RPE 10 = Failure (0 reps left)
- RPE 9 = 1 rep left
- RPE 8 = 2 reps left
- RPE 7 = 3 reps left

IMPORTANT: Respond with rpeTarget in suggestion, not just rirTarget.
`
    }

    // Sheiko context
    if (name.includes('sheiko')) {
      return `
=== POWERLIFTING CONTEXT (Sheiko) ===
Average Target Intensity: 68-72% of E1RM
Rep Quality: Every rep should be fast and clean - NO grinding

Guidelines:
- Multiple sets at moderate intensity
- High weekly volume accumulation
- Stop set if bar speed significantly slows
- Technical consistency > weight on bar

IMPORTANT: Suggest weight that allows PERFECT technique on ALL reps.
`
    }

    // Westside/Conjugate context
    if (name.includes('westside') || name.includes('conjugate')) {
      const sessionType = input.sessionType || 'max_effort'

      return `
=== POWERLIFTING CONTEXT (Westside/Conjugate) ===
Session Type: ${sessionType.replace('_', ' ').toUpperCase()}

${sessionType === 'max_effort' ? `
MAX EFFORT Guidelines:
- Work up to a heavy single, double, or triple
- Stop when form breaks down or speed significantly drops
- NEVER miss a rep on ME work
- Rotate exercise variation each week
` : ''}
${sessionType === 'dynamic_effort' ? `
DYNAMIC EFFORT Guidelines:
- Use 50-60% of 1RM with bands/chains if available
- Focus on SPEED - bar should move explosively
- If bar slows, weight is too heavy
- Multiple sets with short rest (45-60s)
` : ''}
${sessionType === 'accessory' ? `
ACCESSORY WORK Guidelines:
- Higher rep ranges (8-12+)
- Focus on weak points and muscle building
- Not to failure - leave 2-3 reps in reserve
` : ''}
`
    }

    // Generic powerlifting fallback
    return `
=== POWERLIFTING CONTEXT ===
Focus: Competition lifts (Squat/Bench/Deadlift) are priority
Goal: Strength development with technical consistency
`
  }
}
