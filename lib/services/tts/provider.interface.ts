/**
 * TTSProvider Interface
 *
 * Abstract interface for Text-to-Speech providers.
 * Allows swapping between Web Speech API, OpenAI TTS, or other providers.
 */

export interface TTSVoice {
  id: string
  name: string
  language: string
  quality?: 'low' | 'medium' | 'high' | 'premium'
  provider: string
}

export interface TTSProviderConfig {
  language: 'en' | 'it'
  speed: number // 0.5 - 2.0
  volume: number // 0.0 - 1.0
  pitch?: number // 0.0 - 2.0 (not all providers support this)
}

export interface TTSPlaybackOptions {
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

/**
 * Abstract TTS Provider Interface
 */
export abstract class TTSProvider {
  protected config: TTSProviderConfig

  constructor(config: TTSProviderConfig) {
    this.config = config
  }

  /**
   * Check if this provider is supported in the current environment
   */
  abstract isSupported(): boolean

  /**
   * Get available voices for the current language
   */
  abstract getVoices(): Promise<TTSVoice[]>

  /**
   * Select the best voice for the current language and preferences
   */
  abstract selectBestVoice(): Promise<TTSVoice | undefined>

  /**
   * Speak a single text segment
   * Returns a promise that resolves when speech is complete
   */
  abstract speak(
    text: string,
    voice?: TTSVoice,
    options?: TTSPlaybackOptions
  ): Promise<void>

  /**
   * Stop current playback
   */
  abstract stop(): void

  /**
   * Pause current playback (if supported)
   */
  abstract pause(): void

  /**
   * Resume paused playback (if supported)
   */
  abstract resume(): void

  /**
   * Update provider configuration
   */
  updateConfig(config: Partial<TTSProviderConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): TTSProviderConfig {
    return { ...this.config }
  }

  /**
   * Get provider name (for debugging/logging)
   */
  abstract getProviderName(): string

  /**
   * Estimate cost for speaking given text (if applicable)
   * Returns cost in USD, or null if free
   */
  estimateCost(text: string): number | null {
    return null // Default: free (override in paid providers)
  }
}
