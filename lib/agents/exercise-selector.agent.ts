import { BaseAgent } from './base.agent'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export interface ExerciseSelectionInput {
  workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body'
  weakPoints: string[]
  equipmentPreferences: Record<string, string>
  recentExercises: string[]
  approachId: string
  // User demographics for personalized exercise selection
  experienceYears?: number | null
  userAge?: number | null
  userGender?: 'male' | 'female' | 'other' | null
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

  async selectExercises(input: ExerciseSelectionInput): Promise<ExerciseSelectionOutput> {
    const approach = await this.knowledge.loadApproach(input.approachId)
    const context = this.knowledge.formatContextForAI(approach, 'exercise_selection')

    // Get available exercises from database
    const { data: exercises } = await this.supabase
      .from('exercises')
      .select('*')
      .ilike('pattern', `%${input.workoutType}%`)

    const demographicContext = input.experienceYears || input.userAge || input.userGender
      ? `
User Demographics:
${input.experienceYears ? `- Training Experience: ${input.experienceYears} years` : ''}
${input.userAge ? `- Age: ${input.userAge} years old` : ''}
${input.userGender ? `- Gender: ${input.userGender}` : ''}
`
      : ''

    const prompt = `
Create a ${input.workoutType} workout.

Approach context:
${context}
${demographicContext}
User weak points: ${input.weakPoints.join(', ')}
Equipment preferences: ${JSON.stringify(input.equipmentPreferences)}
Recent exercises to avoid: ${input.recentExercises.join(', ')}
Available exercises: ${JSON.stringify(exercises)}

${input.experienceYears ? `Consider that the user has ${input.experienceYears} years of experience - beginners benefit from simpler compound movements, advanced lifters can handle more variation and volume.` : ''}
${input.userAge && input.userAge > 50 ? `Consider that the user is ${input.userAge} years old - prioritize joint-friendly exercise variations when possible.` : ''}

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
