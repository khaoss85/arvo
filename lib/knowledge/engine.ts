import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { TrainingApproach } from './types'

export class KnowledgeEngine {
  private supabase = getSupabaseBrowserClient()

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
      rationales: data.rationales as Record<string, string> || {}
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

      default:
        return JSON.stringify(approach, null, 2)
    }
  }
}
