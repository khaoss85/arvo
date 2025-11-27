import { z } from 'zod'

export const ApproachSelectionSchema = z.object({
  approachId: z.string().uuid()
})

export const WeakPointsSchema = z.object({
  weakPoints: z.array(z.string()).min(0).max(5)
})

export const AvailableEquipmentSchema = z.object({
  availableEquipment: z.array(z.string())
})

export const StrengthBaselineSchema = z.object({
  strengthBaseline: z.record(z.string(), z.object({
    weight: z.number().positive(),
    reps: z.number().int().positive(),
    rir: z.number().int().min(0).max(5)
  }))
})

export const SplitSelectionSchema = z.object({
  splitType: z.enum(['push_pull_legs', 'upper_lower', 'full_body', 'custom']),
  weeklyFrequency: z.number().int().min(1).max(7)
})

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type TrainingObjective = 'bulk' | 'cut' | 'maintain' | 'recomp'

export type TrainingFocus = 'upper_body' | 'lower_body' | 'balanced'

export type OnboardingData = {
  approachId: string
  weakPoints: string[]
  availableEquipment: string[] // Equipment IDs available to user
  strengthBaseline: Record<string, { weight: number; reps: number; rir: number }>
  // Experience level (required for adaptive flow)
  experienceLevel?: ExperienceLevel
  // Goals (optional, for intermediate/advanced users)
  trainingObjective?: TrainingObjective | null
  injuries?: string | null
  // Demographic fields - gender is required, others optional
  firstName?: string | null
  gender: 'male' | 'female' | 'other' // Required field
  trainingFocus?: TrainingFocus | null // Training emphasis preference
  age?: number | null
  weight?: number | null
  height?: number | null
  confirmedExperience?: number | null
  // Split selection (optional)
  splitType?: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'custom'
  weeklyFrequency?: number
  // Sport-specific goal for approach recommendation
  sportGoal?: 'none' | 'running' | 'swimming' | 'cycling' | 'soccer' | 'skiing' | 'hyrox' | 'triathlon' | 'climbing' | 'martial_arts' | 'other'
}
