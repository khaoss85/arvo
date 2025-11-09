import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  currentStep: number
  completedSteps: number[]
  data: {
    approachId?: string
    weakPoints?: string[]
    equipmentPreferences?: Record<string, string>
    strengthBaseline?: Record<string, { weight: number; reps: number; rir: number }>
    // Demographic fields
    gender?: 'male' | 'female' | 'other' | null
    age?: number | null
    weight?: number | null // kg
    height?: number | null // cm
    confirmedExperience?: number | null // years - if user overrides AI inference
    // Split selection
    splitType?: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'custom'
    weeklyFrequency?: number // days per week user can train
  }
  setStep: (step: number) => void
  setStepData: <K extends keyof OnboardingState['data']>(
    key: K,
    value: OnboardingState['data'][K]
  ) => void
  completeStep: (step: number) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      completedSteps: [],
      data: {},
      setStep: (step) => set({ currentStep: step }),
      setStepData: (key, value) =>
        set((state) => ({
          data: { ...state.data, [key]: value }
        })),
      completeStep: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step]
        })),
      reset: () => set({ currentStep: 1, completedSteps: [], data: {} })
    }),
    { name: 'onboarding-storage' }
  )
)
