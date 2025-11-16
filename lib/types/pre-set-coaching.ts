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
