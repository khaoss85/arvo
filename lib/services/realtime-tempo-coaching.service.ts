/**
 * RealtimeTempoCoachingService
 *
 * Generates and manages real-time audio cues for tempo-based set execution.
 * Coordinates with TempoParserService and AudioCoachingService to provide
 * synchronized audio guidance during workout sets.
 */

import { tempoParserService, type TempoPhases } from './tempo-parser.service'
import { audioCoachingService, type AudioScript, type AudioScriptSegment } from './audio-coaching.service'

export interface RealtimeSetConfig {
  tempo: string           // e.g., "3-1-1-1"
  targetReps: number      // e.g., 10
  exerciseName: string    // For encouragement cues
  language: 'en' | 'it'
  setNumber?: number      // Optional set number for context
}

export interface TempoAudioCue {
  text: string
  triggerAtSeconds: number  // When to play this cue (from set start)
  type: 'countdown' | 'phase_change' | 'rep_announce' | 'encouragement'
  phase?: 'eccentric' | 'pause_bottom' | 'concentric' | 'pause_top'
  repNumber?: number
  pauseAfter?: number  // Milliseconds to pause after this cue
}

export interface SetExecutionState {
  isActive: boolean
  isPaused: boolean
  currentRep: number
  currentPhase: 'eccentric' | 'pause_bottom' | 'concentric' | 'pause_top' | 'idle'
  elapsedSeconds: number
  totalDuration: number
  audioQueue: TempoAudioCue[]
  completedReps: number
}

export type SetExecutionCallback = (state: SetExecutionState) => void

export class RealtimeTempoCoachingService {
  private static instance: RealtimeTempoCoachingService

  private state: SetExecutionState = {
    isActive: false,
    isPaused: false,
    currentRep: 0,
    currentPhase: 'idle',
    elapsedSeconds: 0,
    totalDuration: 0,
    audioQueue: [],
    completedReps: 0,
  }

  private config: RealtimeSetConfig | null = null
  private startTime: number = 0
  private pausedTime: number = 0
  private pausedDuration: number = 0
  private intervalId: NodeJS.Timeout | null = null
  private scheduledTimeouts: NodeJS.Timeout[] = []
  private listeners: Set<SetExecutionCallback> = new Set()

  static getInstance(): RealtimeTempoCoachingService {
    if (!RealtimeTempoCoachingService.instance) {
      RealtimeTempoCoachingService.instance = new RealtimeTempoCoachingService()
    }
    return RealtimeTempoCoachingService.instance
  }

  /**
   * Start guided set execution with real-time audio cues
   */
  startSet(config: RealtimeSetConfig): void {
    if (this.state.isActive) {
      console.warn('[RealtimeTempo] Set already in progress, stopping previous set')
      this.stopSet()
    }

    this.config = config
    const tempoData = tempoParserService.parseTempo(config.tempo)

    if (!tempoData) {
      console.error('[RealtimeTempo] Invalid tempo, cannot start set:', config.tempo)
      return
    }

    // Generate all audio cues for the set
    const audioQueue = this.generateSetScript(config, tempoData.phases)
    const totalDuration = tempoData.totalRepDuration * config.targetReps

    this.state = {
      isActive: true,
      isPaused: false,
      currentRep: 1,
      currentPhase: 'eccentric',
      elapsedSeconds: 0,
      totalDuration,
      audioQueue,
      completedReps: 0,
    }

    this.startTime = Date.now()
    this.pausedDuration = 0

    // Schedule all audio cues
    this.scheduleAudioCues(audioQueue)

    // Start tracking progress
    this.startProgressTracking(tempoData.phases, config.targetReps)

    this.notifyListeners()
  }

  /**
   * Pause set execution
   */
  pauseSet(): void {
    if (!this.state.isActive || this.state.isPaused) {
      return
    }

    this.state.isPaused = true
    this.pausedTime = Date.now()

    // Clear all scheduled timeouts
    this.clearScheduledCues()

    // Pause audio
    audioCoachingService.pause()

    // Stop progress tracking
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.notifyListeners()
  }

  /**
   * Resume paused set
   */
  resumeSet(): void {
    if (!this.state.isActive || !this.state.isPaused) {
      return
    }

    // Calculate pause duration
    const pauseDuration = Date.now() - this.pausedTime
    this.pausedDuration += pauseDuration

    this.state.isPaused = false

    // Resume audio
    audioCoachingService.resume()

    // Reschedule remaining audio cues
    const remainingCues = this.state.audioQueue.filter(
      (cue) => cue.triggerAtSeconds > this.state.elapsedSeconds
    )
    this.scheduleAudioCues(remainingCues)

    // Resume progress tracking
    if (this.config) {
      const tempoData = tempoParserService.parseTempo(this.config.tempo)
      if (tempoData) {
        this.startProgressTracking(tempoData.phases, this.config.targetReps)
      }
    }

    this.notifyListeners()
  }

  /**
   * Stop set execution
   */
  stopSet(): void {
    if (!this.state.isActive) {
      return
    }

    // Clear all scheduled timeouts
    this.clearScheduledCues()

    // Stop progress tracking
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    // Stop audio
    audioCoachingService.stop()
    audioCoachingService.clearQueue()

    const completedReps = this.state.completedReps

    this.state = {
      isActive: false,
      isPaused: false,
      currentRep: 0,
      currentPhase: 'idle',
      elapsedSeconds: 0,
      totalDuration: 0,
      audioQueue: [],
      completedReps,
    }

    this.config = null
    this.startTime = 0
    this.pausedTime = 0
    this.pausedDuration = 0

    this.notifyListeners()
  }

  /**
   * Skip to next rep
   */
  skipToNextRep(): void {
    if (!this.state.isActive || this.state.isPaused || !this.config) {
      return
    }

    const tempoData = tempoParserService.parseTempo(this.config.tempo)
    if (!tempoData) {
      return
    }

    // Jump to start of next rep
    const nextRep = this.state.currentRep + 1
    if (nextRep > this.config.targetReps) {
      this.stopSet()
      return
    }

    // Calculate new elapsed time (start of next rep)
    const skipToSecond = (nextRep - 1) * tempoData.totalRepDuration

    // Clear all scheduled audio cues
    this.clearScheduledCues()

    // Stop any currently playing audio
    audioCoachingService.stop()

    // Adjust pausedDuration to jump timeline forward
    // This makes elapsed = (Date.now() - startTime - pausedDuration) / 1000 = skipToSecond
    this.pausedDuration -= (skipToSecond - this.state.elapsedSeconds) * 1000

    // Update state immediately to new position
    this.state.elapsedSeconds = skipToSecond
    this.state.currentRep = nextRep
    this.state.currentPhase = 'eccentric' // Always start rep with eccentric
    this.state.completedReps = nextRep - 1

    // Reschedule remaining audio cues from new position
    const remainingCues = this.state.audioQueue.filter(
      (cue) => cue.triggerAtSeconds >= skipToSecond
    )
    this.scheduleAudioCues(remainingCues)

    this.notifyListeners()
  }

  /**
   * Get current execution state
   */
  getExecutionState(): SetExecutionState {
    return { ...this.state }
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: SetExecutionCallback): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Generate complete audio script for set
   */
  private generateSetScript(config: RealtimeSetConfig, phases: TempoPhases): TempoAudioCue[] {
    const cues: TempoAudioCue[] = []
    const repDuration = phases.eccentric + phases.pauseBottom + phases.concentric + phases.pauseTop
    const { language } = config

    // Starting cue
    cues.push({
      text: language === 'it' ? 'Iniziamo' : 'Starting',
      triggerAtSeconds: 0,
      type: 'encouragement',
      pauseAfter: 500,
    })

    // Generate cues for each rep
    for (let rep = 1; rep <= config.targetReps; rep++) {
      const repStartTime = (rep - 1) * repDuration
      let currentTime = repStartTime

      // Rep announcement (except first rep, already announced)
      if (rep > 1) {
        cues.push({
          text: language === 'it' ? `Rep ${rep}` : `Rep ${rep}`,
          triggerAtSeconds: currentTime,
          type: 'rep_announce',
          repNumber: rep,
          pauseAfter: 300,
        })
      }

      // Eccentric countdown
      if (phases.eccentric > 0) {
        for (let i = phases.eccentric; i > 0; i--) {
          cues.push({
            text: `${i}`,
            triggerAtSeconds: currentTime + (phases.eccentric - i),
            type: 'countdown',
            phase: 'eccentric',
            repNumber: rep,
            pauseAfter: 0,
          })
        }
      }
      currentTime += phases.eccentric

      // Pause bottom
      if (phases.pauseBottom > 0) {
        cues.push({
          text: language === 'it' ? 'Tieni' : 'Hold',
          triggerAtSeconds: currentTime,
          type: 'phase_change',
          phase: 'pause_bottom',
          repNumber: rep,
          pauseAfter: 0,
        })
      }
      currentTime += phases.pauseBottom

      // Concentric
      if (phases.concentric > 0) {
        cues.push({
          text: language === 'it' ? 'Su' : 'Up',
          triggerAtSeconds: currentTime,
          type: 'phase_change',
          phase: 'concentric',
          repNumber: rep,
          pauseAfter: 0,
        })
      }
      currentTime += phases.concentric

      // Pause top
      if (phases.pauseTop > 0) {
        cues.push({
          text: language === 'it' ? 'Stringi' : 'Squeeze',
          triggerAtSeconds: currentTime,
          type: 'phase_change',
          phase: 'pause_top',
          repNumber: rep,
          pauseAfter: 0,
        })
      }

      // Encouragement for last rep
      if (rep === config.targetReps) {
        cues.push({
          text: language === 'it' ? 'Ultima rep, spingi!' : 'Last rep, push!',
          triggerAtSeconds: currentTime - 1,
          type: 'encouragement',
          repNumber: rep,
          pauseAfter: 0,
        })
      }
    }

    // Set complete
    cues.push({
      text: language === 'it' ? 'Serie completata!' : 'Set complete!',
      triggerAtSeconds: config.targetReps * repDuration,
      type: 'encouragement',
      pauseAfter: 0,
    })

    return cues
  }

  /**
   * Schedule audio cues to play at specified times
   */
  private scheduleAudioCues(cues: TempoAudioCue[]): void {
    cues.forEach((cue) => {
      const delay = (cue.triggerAtSeconds * 1000) - (Date.now() - this.startTime - this.pausedDuration)

      if (delay < 0) {
        // Cue already passed, skip
        return
      }

      const timeoutId = setTimeout(() => {
        if (!this.state.isActive || this.state.isPaused) {
          return
        }

        // Play audio cue
        const audioScript: AudioScript = {
          id: `realtime-cue-${cue.triggerAtSeconds}`,
          type: 'set_execution',
          segments: [{
            text: cue.text,
            pauseAfter: cue.pauseAfter || 0,
            type: 'realtime_count',
          }],
          priority: 10, // Highest priority
        }

        audioCoachingService.enqueue(audioScript)
      }, delay)

      this.scheduledTimeouts.push(timeoutId)
    })
  }

  /**
   * Clear all scheduled audio cues
   */
  private clearScheduledCues(): void {
    this.scheduledTimeouts.forEach((timeoutId) => clearTimeout(timeoutId))
    this.scheduledTimeouts = []
  }

  /**
   * Start tracking set progress (rep/phase updates)
   */
  private startProgressTracking(phases: TempoPhases, targetReps: number): void {
    const repDuration = phases.eccentric + phases.pauseBottom + phases.concentric + phases.pauseTop

    this.intervalId = setInterval(() => {
      if (!this.state.isActive || this.state.isPaused) {
        return
      }

      const elapsed = (Date.now() - this.startTime - this.pausedDuration) / 1000
      this.state.elapsedSeconds = elapsed

      // Determine current rep and phase
      const currentRep = Math.min(Math.floor(elapsed / repDuration) + 1, targetReps)
      const elapsedInRep = elapsed % repDuration

      const phaseInfo = tempoParserService.getPhaseAtTime(
        this.config!.tempo,
        currentRep,
        targetReps,
        elapsedInRep
      )

      if (phaseInfo) {
        this.state.currentRep = phaseInfo.repNumber
        this.state.currentPhase = phaseInfo.phase

        // Update completed reps
        if (currentRep > this.state.completedReps) {
          this.state.completedReps = currentRep - 1
        }
      }

      // Check if set is complete
      if (elapsed >= this.state.totalDuration) {
        this.state.completedReps = targetReps
        setTimeout(() => this.stopSet(), 1000) // Stop after "Set complete!" plays
      }

      this.notifyListeners()
    }, 100) // Update every 100ms for smooth progress
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getExecutionState()))
  }
}

// Export singleton instance
export const realtimeTempoCoachingService = RealtimeTempoCoachingService.getInstance()
