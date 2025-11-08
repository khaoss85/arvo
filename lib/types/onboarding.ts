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

export type OnboardingData = {
  approachId: string
  weakPoints: string[]
  equipmentPreferences: Record<string, string>
  strengthBaseline: Record<string, { weight: number; reps: number; rir: number }>
  // Demographic fields (optional)
  gender?: 'male' | 'female' | 'other' | null
  age?: number | null
  weight?: number | null
  height?: number | null
  confirmedExperience?: number | null
}
