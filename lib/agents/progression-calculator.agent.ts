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

  async suggestNextSet(input: ProgressionInput): Promise<ProgressionOutput> {
    const approach = await this.knowledge.loadApproach(input.approachId)
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

    const prompt = `
Previous set: ${input.lastSet.weight}kg x ${input.lastSet.reps} reps @ RIR ${input.lastSet.rir}
${mentalReadinessContext}
This is set number: ${input.setNumber}
Exercise type: ${input.exerciseType}
${demographicContext}
Training approach context:
${context}
${periodizationContext}

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
  "restReminder": "string reminder about rest period"  // Include if rest periods specified
}
    `

    const result = await this.complete<ProgressionOutput>(prompt)

    // Validate result
    if (!result.suggestion || !result.rationale) {
      throw new Error('Invalid progression suggestion')
    }

    return result
  }
}
