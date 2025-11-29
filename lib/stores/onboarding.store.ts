import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  currentStep: number
  completedSteps: number[]
  data: {
    approachId?: string
    weakPoints?: string[]
    availableEquipment?: string[] // Equipment IDs available to user
    strengthBaseline?: Record<string, { weight: number; reps: number; rir: number }>
    // Experience level (for adaptive onboarding)
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
    // Goals (for intermediate/advanced users)
    trainingObjective?: 'bulk' | 'cut' | 'maintain' | 'recomp' | null
    injuries?: string | null // Free text field for injuries/limitations
    // Demographic fields
    firstName?: string | null // User's first name for personalization
    gender?: 'male' | 'female' | 'other' | null
    trainingFocus?: 'upper_body' | 'lower_body' | 'balanced' | null // Training emphasis preference
    // Body type (morphotype) for personalized volume distribution
    bodyType?: 'gynoid' | 'android' | 'mixed' | 'ectomorph' | 'mesomorph' | 'endomorph' | null
    age?: number | null
    weight?: number | null // kg
    height?: number | null // cm
    confirmedExperience?: number | null // years - if user overrides AI inference
    // Split selection
    splitType?: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'custom' | 'bro_split' | 'weak_point_focus'
    weeklyFrequency?: number // days per week user can train
    specializationMuscle?: string | null // For weak_point_focus split
    // Sport-specific goal for approach recommendation
    sportGoal?: 'none' | 'running' | 'swimming' | 'cycling' | 'soccer' | 'skiing' | 'hyrox' | 'triathlon' | 'climbing' | 'martial_arts' | 'tennis' | 'basketball' | 'rowing' | 'other'
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
