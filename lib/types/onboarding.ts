import { z } from 'zod'

export const ApproachSelectionSchema = z.object({
  approachId: z.string().uuid()
})

export const WeakPointsSchema = z.object({
  weakPoints: z.array(z.string()).min(0).max(5)
})

export const EquipmentPreferencesSchema = z.object({
  equipmentPreferences: z.record(z.string(), z.string())
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

export type OnboardingData = {
  approachId: string
  weakPoints: string[]
  equipmentPreferences: Record<string, string> // DEPRECATED: Use availableEquipment
  availableEquipment?: string[] // New multiselect equipment array
  strengthBaseline: Record<string, { weight: number; reps: number; rir: number }>
  // Experience level (required for adaptive flow)
  experienceLevel?: ExperienceLevel
  // Goals (optional, for intermediate/advanced users)
  trainingObjective?: TrainingObjective | null
  injuries?: string | null
  // Demographic fields (optional)
  firstName?: string | null
  gender?: 'male' | 'female' | 'other' | null
  age?: number | null
  weight?: number | null
  height?: number | null
  confirmedExperience?: number | null
  // Split selection (optional)
  splitType?: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'custom'
  weeklyFrequency?: number
}
