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

export interface AudioScript {
  id: string
  type: 'workout_intro' | 'exercise_transition' | 'pre_set' | 'rest_countdown' | 'workout_end'
  text: string
  priority: number // Higher = more important, can interrupt lower priority
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
    await this.speak(script.text)
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
    await this.speak(script.text)
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

      // Try to find a better voice for the language
      const voices = this.synth.getVoices()
      const preferredVoice = voices.find((voice) =>
        voice.lang.startsWith(this.settings.language)
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
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
