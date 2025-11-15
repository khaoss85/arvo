/**
 * OpenAITTSProvider
 *
 * TTS provider using OpenAI's TTS-1 API via server-side proxy.
 * Premium quality voices with natural intonation.
 * Cost: $0.015 per 1,000 characters
 *
 * NOTE: API key is managed server-side for security.
 * Client-side code calls /api/tts/generate which proxies to OpenAI.
 */

import { TTSProvider, type TTSVoice, type TTSProviderConfig, type TTSPlaybackOptions } from './provider.interface'

export type OpenAIVoiceId = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'

export interface OpenAITTSConfig extends TTSProviderConfig {
  apiKey?: string // DEPRECATED: No longer used client-side (kept for backward compatibility)
  model?: 'tts-1' | 'tts-1-hd' // Default: tts-1 for real-time
  voice?: OpenAIVoiceId // Default: auto-select based on language
  responseFormat?: 'mp3' | 'opus' | 'aac' | 'flac' // Default: mp3 (not used in API route)
}

export class OpenAITTSProvider extends TTSProvider {
  private model: 'tts-1' | 'tts-1-hd'
  private selectedVoice?: OpenAIVoiceId
  private responseFormat: 'mp3' | 'opus' | 'aac' | 'flac'
  private currentAudio: HTMLAudioElement | null = null

  // Voice characteristics (based on OpenAI documentation)
  private static readonly VOICE_PROFILES: Record<
    OpenAIVoiceId,
    { language: string; description: string; quality: 'premium' }
  > = {
    alloy: { language: 'en', description: 'Neutral, balanced', quality: 'premium' },
    echo: { language: 'en', description: 'Male, clear', quality: 'premium' },
    fable: { language: 'en', description: 'British accent, expressive', quality: 'premium' },
    onyx: { language: 'en', description: 'Deep, authoritative', quality: 'premium' },
    nova: { language: 'en', description: 'Warm, conversational', quality: 'premium' },
    shimmer: { language: 'en', description: 'Soft, gentle', quality: 'premium' },
  }

  constructor(config: OpenAITTSConfig) {
    super(config)
    // API key is no longer stored client-side (handled by server route)
    if (config.apiKey) {
      console.warn('[OpenAITTSProvider] apiKey parameter is deprecated and ignored. API key should be set in OPENAI_API_KEY environment variable server-side.')
    }
    this.model = config.model || 'tts-1'
    this.selectedVoice = config.voice
    this.responseFormat = config.responseFormat || 'mp3'
  }

  isSupported(): boolean {
    // Only requires browser audio support (API key is server-side)
    return (
      typeof window !== 'undefined' &&
      typeof Audio !== 'undefined'
    )
  }

  async getVoices(): Promise<TTSVoice[]> {
    // OpenAI TTS has 6 fixed voices
    return Object.entries(OpenAITTSProvider.VOICE_PROFILES).map(
      ([id, profile]) => ({
        id,
        name: `OpenAI ${id.charAt(0).toUpperCase() + id.slice(1)}`,
        language: profile.language,
        quality: profile.quality,
        provider: 'openai',
      })
    )
  }

  async selectBestVoice(): Promise<TTSVoice | undefined> {
    const voices = await this.getVoices()

    // If voice is pre-selected, use that
    if (this.selectedVoice) {
      return voices.find((v) => v.id === this.selectedVoice)
    }

    // Auto-select based on language and use case (coaching = energetic/motivational)
    if (this.config.language === 'en') {
      // Onyx: Deep, authoritative - good for coaching
      // Nova: Warm, conversational - also good for coaching
      // Try Onyx first (more authoritative for gym coaching)
      return voices.find((v) => v.id === 'onyx') || voices[0]
    } else {
      // For Italian, OpenAI voices are English-native but can handle Italian
      // Use Nova (warm, conversational)
      return voices.find((v) => v.id === 'nova') || voices[0]
    }
  }

  async speak(
    text: string,
    voice?: TTSVoice,
    options?: TTSPlaybackOptions
  ): Promise<void> {
    if (!this.isSupported()) {
      const error = new Error('OpenAI TTS not supported (missing API key or browser audio support)')
      options?.onError?.(error)
      throw error
    }

    try {
      // Determine voice to use
      const voiceId = (voice?.id as OpenAIVoiceId) || this.selectedVoice || 'onyx'

      // Call OpenAI TTS API
      const audioBlob = await this.generateSpeech(text, voiceId)

      // Play the audio
      await this.playAudio(audioBlob, options)
    } catch (error) {
      console.error('OpenAI TTS error:', error)
      const err = error instanceof Error ? error : new Error('Unknown error')
      options?.onError?.(err)
      throw err
    }
  }

  /**
   * Generate speech audio blob without playing it
   * Useful for caching or custom playback logic
   *
   * NOTE: Calls server-side API route for security (API key protected)
   */
  async generateSpeech(
    text: string,
    voice: OpenAIVoiceId
  ): Promise<Blob> {
    // Call server-side API route instead of OpenAI directly
    // This keeps the API key secure server-side
    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice,
        model: this.model,
        speed: this.config.speed,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      // Check if server suggests fallback to Web Speech
      if (errorData.fallbackToWebSpeech) {
        throw new Error(
          `OpenAI TTS unavailable (${errorData.error}): ${errorData.message}. Falling back to Web Speech API.`
        )
      }

      throw new Error(
        `TTS API error: ${response.status} ${response.statusText} - ${errorData.message || JSON.stringify(errorData)}`
      )
    }

    return await response.blob()
  }

  private playAudio(
    audioBlob: Blob,
    options?: TTSPlaybackOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create audio element
      const audio = new Audio()
      this.currentAudio = audio

      // Set volume (speed is already applied in API call)
      audio.volume = this.config.volume

      // Create object URL from blob
      const audioUrl = URL.createObjectURL(audioBlob)
      audio.src = audioUrl

      // Event handlers
      audio.onplay = () => {
        options?.onStart?.()
      }

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        this.currentAudio = null
        options?.onEnd?.()
        resolve()
      }

      audio.onerror = (event) => {
        URL.revokeObjectURL(audioUrl)
        this.currentAudio = null
        const error = new Error(`Audio playback failed: ${audio.error?.message || 'unknown error'}`)
        options?.onError?.(error)
        reject(error)
      }

      // Start playback
      audio.play().catch((error) => {
        URL.revokeObjectURL(audioUrl)
        this.currentAudio = null
        options?.onError?.(error)
        reject(error)
      })
    })
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
  }

  pause(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
    }
  }

  resume(): void {
    if (this.currentAudio) {
      this.currentAudio.play().catch((error) => {
        console.error('Failed to resume audio:', error)
      })
    }
  }

  getProviderName(): string {
    return `OpenAI TTS (${this.model})`
  }

  estimateCost(text: string): number {
    // OpenAI pricing: $0.015 per 1,000 characters (tts-1) or $0.030 per 1,000 characters (tts-1-hd)
    const costPer1000 = this.model === 'tts-1' ? 0.015 : 0.030
    const charCount = text.length
    return (charCount / 1000) * costPer1000
  }

  /**
   * Set the voice to use for future generations
   */
  setVoice(voice: OpenAIVoiceId): void {
    this.selectedVoice = voice
  }

  /**
   * Get current voice setting
   */
  getVoice(): OpenAIVoiceId | undefined {
    return this.selectedVoice
  }
}
