/**
 * AudioCoachingService
 *
 * Manages audio coaching playback using intelligent hybrid TTS.
 * Automatically uses OpenAI TTS when available, falls back to Web Speech API.
 * Provides queue system for managing multiple audio scripts during workouts.
 */

import { HybridTTSProvider, type HybridTTSConfig } from './tts/hybrid-provider'
import type { TTSVoice } from './tts/provider.interface'
import type { OpenAIVoiceId } from './tts/openai-provider'

export interface AudioCoachingSettings {
  enabled: boolean
  autoplay: boolean
  speed: number // 0.5 - 2.0
  volume: number // 0.0 - 1.0
  language: 'en' | 'it'
  // OpenAI TTS settings (optional, premium feature)
  openai?: {
    apiKey?: string
    enabled?: boolean
    voice?: OpenAIVoiceId
    model?: 'tts-1' | 'tts-1-hd'
  }
  // Caching and fallback
  enableCache?: boolean
  fallbackToWebSpeech?: boolean
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
  private provider: HybridTTSProvider | null = null
  private queue: AudioScript[] = []
  private state: PlaybackState = 'idle'
  private settings: AudioCoachingSettings = {
    enabled: true,
    autoplay: false,
    speed: 0.9,
    volume: 1.0,
    language: 'en',
    enableCache: true,
    fallbackToWebSpeech: true,
  }
  private listeners: Set<(state: PlaybackState) => void> = new Set()
  private currentScript: AudioScript | null = null
  private selectedVoice: TTSVoice | undefined

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeProvider()
    }
  }

  static getInstance(): AudioCoachingService {
    if (!AudioCoachingService.instance) {
      AudioCoachingService.instance = new AudioCoachingService()
    }
    return AudioCoachingService.instance
  }

  private initializeProvider(): void {
    const config: HybridTTSConfig = {
      language: this.settings.language,
      speed: this.settings.speed,
      volume: this.settings.volume,
      enableCache: this.settings.enableCache,
      fallbackToWebSpeech: this.settings.fallbackToWebSpeech,
    }

    // Add OpenAI config if user wants it enabled
    // NOTE: API key is managed server-side, so we don't check for it here
    if (this.settings.openai && this.settings.openai.enabled !== false) {
      config.openai = {
        enabled: true,
        model: this.settings.openai.model || 'tts-1',
        voice: this.settings.openai.voice,
      }
    }

    this.provider = new HybridTTSProvider(config)

    // Select best voice on init
    this.provider.selectBestVoice().then((voice) => {
      this.selectedVoice = voice
    })
  }

  /**
   * Check if TTS is supported in current browser
   */
  isSupported(): boolean {
    return this.provider?.isSupported() || false
  }

  /**
   * Update coaching settings
   */
  updateSettings(settings: Partial<AudioCoachingSettings>): void {
    this.settings = { ...this.settings, ...settings }

    // Re-initialize provider with new settings
    if (this.provider) {
      this.provider.updateConfig({
        language: this.settings.language,
        speed: this.settings.speed,
        volume: this.settings.volume,
      })

      // Update OpenAI config if changed
      if (settings.openai) {
        this.provider.updateOpenAIConfig({
          enabled: settings.openai.enabled,
          model: settings.openai.model,
          voice: settings.openai.voice,
        })
      }
    }
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
   * Core TTS function using provider
   */
  private speak(text: string): Promise<void> {
    if (!this.provider) {
      return Promise.reject(new Error('TTS provider not initialized'))
    }

    return new Promise((resolve, reject) => {
      this.provider!.speak(text, this.selectedVoice, {
        onStart: () => {
          this.setState('playing')
        },
        onEnd: () => {
          resolve()
          // Automatically play next in queue
          this.playNext()
        },
        onError: (error) => {
          console.error('TTS error:', error)
          this.setState('idle')
          reject(error)
        },
      }).catch(reject)
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

    // After all segments complete, play next in queue
    this.playNext()
  }

  /**
   * Speak a single segment of text
   */
  private speakSingleSegment(text: string): Promise<void> {
    if (!this.provider) {
      return Promise.reject(new Error('TTS provider not initialized'))
    }

    return new Promise((resolve, reject) => {
      this.setState('playing')

      this.provider!.speak(text, this.selectedVoice, {
        onStart: () => {
          this.setState('playing')
        },
        onEnd: () => {
          resolve()
        },
        onError: (error) => {
          console.error('TTS segment error:', error)
          reject(error)
        },
      }).catch(reject)
    })
  }

  /**
   * Delay for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Pause current playback
   */
  pause(): void {
    if (this.provider && this.state === 'playing') {
      this.provider.pause()
      this.setState('paused')
    }
  }

  /**
   * Resume paused playback
   */
  resume(): void {
    if (this.provider && this.state === 'paused') {
      this.provider.resume()
      this.setState('playing')
    }
  }

  /**
   * Stop current playback
   */
  stop(): void {
    if (this.provider) {
      this.provider.stop()
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
   * Get available voices
   */
  async getAvailableVoices(): Promise<TTSVoice[]> {
    if (!this.provider) return []
    return await this.provider.getVoices()
  }

  /**
   * Get current voice
   */
  getCurrentVoice(): TTSVoice | undefined {
    return this.selectedVoice
  }

  /**
   * Set voice manually
   */
  async setVoice(voice: TTSVoice): Promise<void> {
    this.selectedVoice = voice
  }

  /**
   * Preload voices (for browsers that load them asynchronously)
   */
  async preloadVoices(): Promise<TTSVoice[]> {
    if (!this.provider) return []
    return await this.provider.getVoices()
  }

  /**
   * Get provider name (for debugging)
   */
  getProviderName(): string {
    return this.provider?.getProviderName() || 'Not initialized'
  }

  /**
   * Check if OpenAI TTS is available
   */
  isOpenAIAvailable(): boolean {
    return this.provider?.isOpenAIAvailable() || false
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.provider) {
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null,
      }
    }
    return await this.provider.getCacheStats()
  }

  /**
   * Clear audio cache
   */
  async clearCache(): Promise<void> {
    if (this.provider) {
      await this.provider.clearCache()
    }
  }

  /**
   * Estimate cost for speaking given text (if using paid provider)
   */
  estimateCost(text: string): number | null {
    if (!this.provider) return null
    return this.provider.estimateCost(text)
  }
}

// Export singleton instance
export const audioCoachingService = AudioCoachingService.getInstance()
