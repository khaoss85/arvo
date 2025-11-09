import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { TrainingApproach } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

export class KnowledgeEngine {
  private supabase: any

  constructor(supabaseClient?: any) {
    // Accept optional Supabase client for server-side usage
    this.supabase = supabaseClient || getSupabaseBrowserClient()
  }

  async loadApproach(approachId: string): Promise<TrainingApproach> {
    const { data, error } = await this.supabase
      .from('training_approaches')
      .select('*')
      .eq('id', approachId)
      .single()

    if (error || !data) {
      throw new Error(`Approach not found: ${approachId}`)
    }

    return {
      id: data.id,
      name: data.name,
      creator: data.creator || '',
      philosophy: data.philosophy || '',
      variables: data.variables as TrainingApproach['variables'],
      progression: data.progression_rules as TrainingApproach['progression'],
      exerciseSelection: data.exercise_rules as TrainingApproach['exerciseSelection'],
      rationales: data.rationales as Record<string, string> || {},

      // Optional Kuba methodology fields (approach-agnostic)
      volumeLandmarks: data.volume_landmarks || undefined,
      frequencyGuidelines: data.frequency_guidelines || undefined,
      romEmphasis: data.rom_emphasis || undefined,
      exerciseSelectionPrinciples: data.exercise_selection_principles || undefined,
      stimulusToFatigue: data.stimulus_to_fatigue || undefined,
      advancedTechniques: data.advanced_techniques || undefined,
      splitVariations: data.split_variations || undefined,
      periodization: data.periodization || undefined
    }
  }

  formatContextForAI(approach: TrainingApproach, aspect: string): string {
    // Format specific aspect of approach for AI context
    switch (aspect) {
      case 'progression':
        return `
Training approach: ${approach.name}
Philosophy: ${approach.philosophy}
Progression priority: ${approach.progression.priority}
When to add weight: ${approach.progression.rules.whenToAddWeight}
Set progression strategy: ${approach.progression.setProgression.strategy}
Conditions: ${approach.progression.setProgression.conditions}
        `.trim()

      case 'exercise_selection':
        return `
Approach: ${approach.name}
Exercises per workout: ${approach.exerciseSelection.exercisesPerWorkout.min}-${approach.exerciseSelection.exercisesPerWorkout.max}
Priority rules: ${approach.exerciseSelection.priorityRules.join(', ')}
Distribution: ${approach.exerciseSelection.exercisesPerWorkout.distribution}
        `.trim()

      case 'split_planning':
        return `
Training Approach: ${approach.name} by ${approach.creator}
Philosophy: ${approach.philosophy}

Core Training Variables:
- Sets per exercise: ${approach.variables.setsPerExercise.working} working sets
- Rep ranges: Compounds ${approach.variables.repRanges.compound.join('-')}, Isolation ${approach.variables.repRanges.isolation.join('-')}
- RIR targets: Normal=${approach.variables.rirTarget.normal}, Intense=${approach.variables.rirTarget.intense}, Deload=${approach.variables.rirTarget.deload}
- Training frequency: ${approach.variables.frequency.weeklyPattern}

Exercise Selection Philosophy:
- Priority rules: ${approach.exerciseSelection.priorityRules.join(', ')}
- Exercises per workout: ${approach.exerciseSelection.exercisesPerWorkout.min}-${approach.exerciseSelection.exercisesPerWorkout.max}
- Distribution: ${approach.exerciseSelection.exercisesPerWorkout.distribution}
        `.trim()

      default:
        return JSON.stringify(approach, null, 2)
    }
  }
}
