import { BaseAgent } from './base.agent'
import type { ProgressionInput, ProgressionOutput } from '@/lib/types/progression'

export type { ProgressionInput, ProgressionOutput }

export class ProgressionCalculator extends BaseAgent {
  constructor(supabaseClient?: any) {
    super(supabaseClient)
  }

  get systemPrompt() {
    return `You are an expert bodybuilding coach specializing in set progression.
Based on the training approach philosophy and the previous set performance,
suggest the optimal next set parameters.

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
        mesocycleWeek: input.mesocycleWeek
      },
      timestamp: new Date().toISOString()
    })

    const approach = await this.knowledge.loadApproach(input.approachId)
    console.log('[ProgressionCalculator] Loaded approach:', {
      name: approach.name,
      hasAdvancedTechniques: !!approach.advancedTechniques,
      hasTempo: !!approach.variables?.tempo,
      hasRestPeriods: !!approach.variables?.restPeriods
    })

    const context = this.knowledge.formatContextForAI(approach, 'progression')

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
Previous set: ${input.lastSet.weight}kg x ${input.lastSet.reps} reps @ RIR ${input.lastSet.rir}
${mentalReadinessContext}
This is set number: ${input.setNumber}
Exercise type: ${input.exerciseType}
${input.exerciseName ? `Exercise name: ${input.exerciseName}` : ''}
${demographicContext}
Training approach context:
${context}
${periodizationContext}
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
      insightsCount: relevantInsights.length
    })

    const result = await this.complete<ProgressionOutput>(prompt, targetLanguage)

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

    return result
  }
}
