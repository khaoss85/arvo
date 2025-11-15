/**
 * AudioCoachingService
 *
 * Manages audio coaching playback using Web Speech API.
 * Provides a queue system for managing multiple audio scripts during workouts.
 */

export interface AudioCoachingSettings {
  enabled: boolean
  autoplay: boolean
  speed: number // 0.5 - 2.0
  volume: number // 0.0 - 1.0
  language: 'en' | 'it'
}

export interface AudioScriptSegment {
  text: string
  pauseAfter?: number // milliseconds
  type: 'narration' | 'countdown' | 'realtime_count'
}

export interface AudioScript {
  id: string
  type: 'workout_intro' | 'exercise_transition' | 'pre_set' | 'rest_countdown' | 'workout_end' | 'set_execution'
  // Backward compatibility: support both text and segments
  text?: string // Legacy: single text string
  segments?: AudioScriptSegment[] // New: segmented with timing
  priority: number // Higher = more important, can interrupt lower priority
  metadata?: {
    tempo?: string // e.g., "3-1-1-1"
    reps?: number
    setNumber?: number
  }
}

export type PlaybackState = 'idle' | 'playing' | 'paused'

export class AudioCoachingService {
  private static instance: AudioCoachingService
  private synth: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private queue: AudioScript[] = []
  private state: PlaybackState = 'idle'
  private settings: AudioCoachingSettings = {
    enabled: true,
    autoplay: false,
    speed: 0.9,
    volume: 1.0,
    language: 'en',
  }
  private listeners: Set<(state: PlaybackState) => void> = new Set()
  private currentScript: AudioScript | null = null

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
    }
  }

  static getInstance(): AudioCoachingService {
    if (!AudioCoachingService.instance) {
      AudioCoachingService.instance = new AudioCoachingService()
    }
    return AudioCoachingService.instance
  }

  /**
   * Check if Web Speech API is supported in current browser
   */
  isSupported(): boolean {
    return this.synth !== null
  }

  /**
   * Update coaching settings
   */
  updateSettings(settings: Partial<AudioCoachingSettings>): void {
    this.settings = { ...this.settings, ...settings }
  }

  /**
   * Get current settings
   */
  getSettings(): AudioCoachingSettings {
    return { ...this.settings }
  }

  /**
   * Add script to queue
   */
  enqueue(script: AudioScript): void {
    if (!this.settings.enabled) return

    // If higher priority script, clear queue and play immediately
    if (this.currentScript && script.priority > this.currentScript.priority) {
      this.clearQueue()
      this.stop()
      this.queue.unshift(script)
      this.playNext()
    } else {
      this.queue.push(script)
      if (this.state === 'idle') {
        this.playNext()
      }
    }
  }

  /**
   * Add multiple scripts to queue
   */
  enqueueMany(scripts: AudioScript[]): void {
    scripts.forEach((script) => this.queue.push(script))
    if (this.state === 'idle' && this.queue.length > 0) {
      this.playNext()
    }
  }

  /**
   * Play a script immediately (bypasses queue)
   */
  async playImmediate(script: AudioScript): Promise<void> {
    if (!this.settings.enabled || !this.isSupported()) return

    this.stop()
    this.clearQueue()
    this.currentScript = script

    // Support both segmented and legacy text scripts
    if (script.segments && script.segments.length > 0) {
      await this.speakSegments(script.segments)
    } else if (script.text) {
      await this.speak(script.text)
    }
  }

  /**
   * Play next script in queue
   */
  private async playNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.setState('idle')
      this.currentScript = null
      return
    }

    const script = this.queue.shift()!
    this.currentScript = script

    // Support both segmented and legacy text scripts
    if (script.segments && script.segments.length > 0) {
      await this.speakSegments(script.segments)
    } else if (script.text) {
      await this.speak(script.text)
    }
  }

  /**
   * Core TTS function using Web Speech API
   */
  private speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      this.currentUtterance = utterance

      // Configure voice settings
      utterance.lang = this.settings.language === 'it' ? 'it-IT' : 'en-US'
      utterance.rate = this.settings.speed
      utterance.volume = this.settings.volume
      utterance.pitch = 1.0

      // Select best available voice for the language
      const bestVoice = this.selectBestVoice(this.settings.language)
      if (bestVoice) {
        utterance.voice = bestVoice
      }

      utterance.onstart = () => {
        this.setState('playing')
      }

      utterance.onend = () => {
        this.currentUtterance = null
        resolve()
        // Automatically play next in queue
        this.playNext()
      }

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event)
        this.currentUtterance = null
        this.setState('idle')
        reject(new Error(`Speech synthesis failed: ${event.error}`))
      }

      this.synth.speak(utterance)
    })
  }

  /**
   * Play segmented script with pauses between segments
   */
  private async speakSegments(segments: AudioScriptSegment[]): Promise<void> {
    for (const segment of segments) {
      // Check if playback was stopped
      if (this.state === 'idle' || !this.currentScript) {
        break
      }

      // Speak the segment
      await this.speakSingleSegment(segment.text)

      // Add pause if specified
      if (segment.pauseAfter && segment.pauseAfter > 0) {
        await this.delay(segment.pauseAfter)
      }
    }
  }

  /**
   * Speak a single segment of text
   */
  private speakSingleSegment(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      this.currentUtterance = utterance

      // Configure voice settings
      utterance.lang = this.settings.language === 'it' ? 'it-IT' : 'en-US'
      utterance.rate = this.settings.speed
      utterance.volume = this.settings.volume
      utterance.pitch = 1.0

      // Select best available voice for the language
      const bestVoice = this.selectBestVoice(this.settings.language)
      if (bestVoice) {
        utterance.voice = bestVoice
      }

      utterance.onend = () => {
        this.currentUtterance = null
        resolve()
      }

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event)
        this.currentUtterance = null
        reject(new Error(`Speech synthesis failed: ${event.error}`))
      }

      this.synth.speak(utterance)
    })
  }

  /**
   * Delay for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Select best available voice for the given language
   * Prioritizes: Neural/Premium > Google/Microsoft > Standard > System
   */
  private selectBestVoice(lang: string): SpeechSynthesisVoice | undefined {
    if (!this.synth) return undefined

    const voices = this.synth.getVoices()
    const langVoices = voices.filter(v => v.lang.startsWith(lang))

    if (langVoices.length === 0) return undefined

    // Priority 1: Neural voices (best quality)
    const neuralVoice = langVoices.find(v =>
      v.name.toLowerCase().includes('neural') ||
      v.name.toLowerCase().includes('premium') ||
      v.name.toLowerCase().includes('enhanced')
    )
    if (neuralVoice) return neuralVoice

    // Priority 2: Google voices (generally good quality)
    const googleVoice = langVoices.find(v =>
      v.name.toLowerCase().includes('google')
    )
    if (googleVoice) return googleVoice

    // Priority 3: Microsoft voices
    const microsoftVoice = langVoices.find(v =>
      v.name.toLowerCase().includes('microsoft') ||
      v.name.toLowerCase().includes('zira') ||
      v.name.toLowerCase().includes('david')
    )
    if (microsoftVoice) return microsoftVoice

    // Priority 4: Any non-default voice
    const nonDefaultVoice = langVoices.find(v => !v.default)
    if (nonDefaultVoice) return nonDefaultVoice

    // Fallback: First available voice for the language
    return langVoices[0]
  }

  /**
   * Pause current playback
   */
  pause(): void {
    if (this.synth && this.state === 'playing') {
      this.synth.pause()
      this.setState('paused')
    }
  }

  /**
   * Resume paused playback
   */
  resume(): void {
    if (this.synth && this.state === 'paused') {
      this.synth.resume()
      this.setState('playing')
    }
  }

  /**
   * Stop current playback
   */
  stop(): void {
    if (this.synth) {
      this.synth.cancel()
      this.currentUtterance = null
      this.setState('idle')
      this.currentScript = null
    }
  }

  /**
   * Skip current script and play next
   */
  skip(): void {
    this.stop()
    this.playNext()
  }

  /**
   * Clear all queued scripts
   */
  clearQueue(): void {
    this.queue = []
  }

  /**
   * Get current playback state
   */
  getState(): PlaybackState {
    return this.state
  }

  /**
   * Get current script being played
   */
  getCurrentScript(): AudioScript | null {
    return this.currentScript
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: (state: PlaybackState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify listeners of state change
   */
  private setState(newState: PlaybackState): void {
    this.state = newState
    this.listeners.forEach((listener) => listener(newState))
  }

  /**
   * Get available voices for current language
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return []

    const voices = this.synth.getVoices()
    return voices.filter((voice) =>
      voice.lang.startsWith(this.settings.language)
    )
  }

  /**
   * Preload voices (some browsers require this)
   */
  preloadVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve([])
        return
      }

      let voices = this.synth.getVoices()
      if (voices.length > 0) {
        resolve(voices)
        return
      }

      // Some browsers load voices asynchronously
      this.synth.onvoiceschanged = () => {
        voices = this.synth!.getVoices()
        resolve(voices)
      }
    })
  }
}

// Export singleton instance
export const audioCoachingService = AudioCoachingService.getInstance()
