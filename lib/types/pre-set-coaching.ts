/**
 * Pre-Set Coaching Types
 *
 * Types for AI-generated motivational pre-set coaching scripts
 */

import type { AudioScriptSegment } from '@/lib/services/audio-coaching.service'

export interface PreSetCoachingInput {
  // Exercise context
  exerciseName: string
  setNumber: number
  totalSets: number
  isWarmup: boolean

  // Current set plan
  weight: number
  reps: number
  rir: number // 0-5, Reps in Reserve
  tempo?: string // e.g., "3-1-1-1"

  // Set guidance (from AI workout planner)
  technicalFocus?: string
  mentalFocus?: string

  // Previous performance (last 1-2 sets)
  previousSets?: Array<{
    weight: number
    reps: number
    rir: number
    mentalReadiness?: number
  }>

  // User state
  mentalReadiness?: number // 1-5 scale

  // Training context
  approachId?: string
  language: 'en' | 'it'
}

export interface PreSetCoachingScript {
  segments: AudioScriptSegment[]
  metadata: {
    setPosition: 'first' | 'middle' | 'last' | 'warmup'
    intensity: 'heavy' | 'moderate' | 'light'
    scriptType: 'motivational' | 'tactical' | 'recovery'
  }
}

/**
 * Post-Set Recovery Script Types
 */

export interface PostSetRecoveryInput {
  // Exercise context
  exerciseName: string
  setNumber: number // Set just completed
  totalSets: number
  isWarmup: boolean

  // Completed set performance
  weightUsed: number
  repsCompleted: number
  targetReps: number
  rirAchieved: number // 0-5, actual RIR from completed set
  wasSuccessful: boolean // Did they hit target reps?

  // Recovery context
  restPeriodSeconds: number // Prescribed rest time
  nextSetIntensity?: 'higher' | 'same' | 'lower' // Relative to completed set

  // User state after set
  mentalReadinessAfter?: number // 1-5 scale after completing set
  perceivedDifficulty?: number // 1-5, how hard was that set?

  // Training context
  setsRemaining: number
  language: 'en' | 'it'
}

export interface PostSetRecoveryScript {
  segments: AudioScriptSegment[]
  metadata: {
    recoveryType: 'physical' | 'mental' | 'tactical' // What recovery focus?
    setPerformance: 'exceeded' | 'hit' | 'missed' // How did they do?
    urgency: 'relax' | 'prepare' | 'refocus' // What's the priority?
  }
}
