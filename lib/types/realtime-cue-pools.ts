/**
 * Type definitions for realtime audio cue pools
 *
 * Separated from agent implementation to allow client-side imports
 * without pulling in server-only dependencies.
 */

export interface RealtimeCuePools {
  starting: string[]
  repAnnouncements: {
    early: string[]
    middle: string[]
    late: string[]
  }
  countdown: { [key: number]: string[] }
  phaseChanges: {
    pauseBottom: string[]
    concentric: string[]
    pauseTop: string[]
  }
  encouragement: {
    early: string[]
    middle: string[]
    late: string[]
    final: string[]
  }
  setComplete: string[]
}

export interface RealtimeCuePoolsInput {
  exerciseName: string
  setNumber: number
  targetReps: number
  tempo: string
  setType: 'warmup' | 'working'
  language: 'en' | 'it'
  previousSetReps?: number
  isFailureSet?: boolean
  exerciseCategory?: string
}
