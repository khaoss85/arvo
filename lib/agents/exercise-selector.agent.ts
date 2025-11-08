import { BaseAgent } from './base.agent'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export interface ExerciseSelectionInput {
  workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower'
  weakPoints: string[]
  equipmentPreferences: Record<string, string>
  recentExercises: string[]
  approachId: string
}

export interface SelectedExercise {
  name: string
  equipmentVariant: string
  sets: number
  repRange: [number, number]
  restSeconds: number
  rationaleForSelection: string
  alternatives: string[]
}

export interface ExerciseSelectionOutput {
  exercises: SelectedExercise[]
  workoutRationale: string
  weakPointAddress: string
}

export class ExerciseSelector extends BaseAgent {
  private supabase: any

  constructor(supabaseClient?: any) {
    super(supabaseClient)
    this.supabase = supabaseClient || getSupabaseBrowserClient()
  }

  get systemPrompt() {
    return `You are a bodybuilding coach creating workout plans.
Select exercises based on the training approach, user preferences, and weak points.
Prioritize exercise order based on approach philosophy.
Consider equipment preferences and provide alternatives.`
  }

  get temperature() {
    return 0.5
  }

  async selectExercises(input: ExerciseSelectionInput): Promise<ExerciseSelectionOutput> {
    const approach = await this.knowledge.loadApproach(input.approachId)
    const context = this.knowledge.formatContextForAI(approach, 'exercise_selection')

    // Get available exercises from database
    const { data: exercises } = await this.supabase
      .from('exercises')
      .select('*')
      .ilike('pattern', `%${input.workoutType}%`)

    const prompt = `
Create a ${input.workoutType} workout.

Approach context:
${context}

User weak points: ${input.weakPoints.join(', ')}
Equipment preferences: ${JSON.stringify(input.equipmentPreferences)}
Recent exercises to avoid: ${input.recentExercises.join(', ')}
Available exercises: ${JSON.stringify(exercises)}

Select 4-6 exercises following the approach philosophy.

Required JSON structure:
{
  "exercises": [
    {
      "name": "string",
      "equipmentVariant": "string",
      "sets": number,
      "repRange": [number, number],
      "restSeconds": number,
      "rationaleForSelection": "string",
      "alternatives": ["string"]
    }
  ],
  "workoutRationale": "string",
  "weakPointAddress": "string"
}
    `

    return await this.complete<ExerciseSelectionOutput>(prompt)
  }
}
