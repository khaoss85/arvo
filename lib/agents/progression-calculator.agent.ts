import { BaseAgent } from './base.agent'

export interface ProgressionInput {
  lastSet: {
    weight: number
    reps: number
    rir: number
  }
  setNumber: number
  exerciseType: 'compound' | 'isolation'
  approachId: string
}

export interface ProgressionOutput {
  suggestion: {
    weight: number
    reps: number
    rirTarget: number
  }
  rationale: string
  alternatives: Array<{
    weight: number
    reps: number
    focus: 'volume' | 'intensity' | 'pump'
    explanation: string
  }>
}

export class ProgressionCalculator extends BaseAgent {
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

  get temperature() {
    return 0.3
  }

  async suggestNextSet(input: ProgressionInput): Promise<ProgressionOutput> {
    const approach = await this.knowledge.loadApproach(input.approachId)
    const context = this.knowledge.formatContextForAI(approach, 'progression')

    const prompt = `
Previous set: ${input.lastSet.weight}kg x ${input.lastSet.reps} reps @ RIR ${input.lastSet.rir}
This is set number: ${input.setNumber}
Exercise type: ${input.exerciseType}

Training approach context:
${context}

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
  ]
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
