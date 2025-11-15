/**
 * HybridTTSProvider
 *
 * Intelligent TTS provider that combines multiple providers with caching and fallback.
 * Strategy:
 * 1. Check cache first (instant playback, zero cost)
 * 2. Try OpenAI TTS if available (premium quality)
 * 3. Fallback to Web Speech API (free, always available)
 * 4. Cache OpenAI responses for future use
 */

import { TTSProvider, type TTSVoice, type TTSProviderConfig, type TTSPlaybackOptions } from './provider.interface'
import { OpenAITTSProvider, type OpenAIVoiceId } from './openai-provider'
import { WebSpeechProvider } from './web-speech-provider'
import { audioCacheService } from './audio-cache.service'

export interface HybridTTSConfig extends TTSProviderConfig {
  // OpenAI settings (optional)
  openai?: {
    apiKey?: string // DEPRECATED: API key is managed server-side
    model?: 'tts-1' | 'tts-1-hd'
    voice?: OpenAIVoiceId
    enabled?: boolean // User preference to use OpenAI (default: true if server has key)
  }
  // Caching settings
  enableCache?: boolean
  // Fallback behavior
  fallbackToWebSpeech?: boolean
}

export class HybridTTSProvider extends TTSProvider {
  private openaiProvider: OpenAITTSProvider | null = null
  private webSpeechProvider: WebSpeechProvider
  private enableCache: boolean
  private fallbackToWebSpeech: boolean
  private activeProvider: 'openai' | 'web-speech' | null = null

  constructor(config: HybridTTSConfig) {
    super(config)

    // Initialize Web Speech provider (always available as fallback)
    this.webSpeechProvider = new WebSpeechProvider(config)

    // Initialize OpenAI provider if enabled
    // NOTE: API key is managed server-side, so we just check if user wants OpenAI enabled
    if (config.openai?.enabled !== false) {
      this.openaiProvider = new OpenAITTSProvider({
        ...config,
        model: config.openai?.model,
        voice: config.openai?.voice,
      })
    }

    this.enableCache = config.enableCache !== false // Default: enabled
    this.fallbackToWebSpeech = config.fallbackToWebSpeech !== false // Default: enabled

    // Initialize cache
    if (this.enableCache) {
      audioCacheService.init().catch((error) => {
        console.warn('Failed to initialize audio cache:', error)
      })
    }
  }

  isSupported(): boolean {
    // At minimum, Web Speech API should be supported
    return this.webSpeechProvider.isSupported()
  }

  async getVoices(): Promise<TTSVoice[]> {
    const voices: TTSVoice[] = []

    // Add OpenAI voices if available
    if (this.openaiProvider?.isSupported()) {
      const openaiVoices = await this.openaiProvider.getVoices()
      voices.push(...openaiVoices)
    }

    // Add Web Speech voices
    const webSpeechVoices = await this.webSpeechProvider.getVoices()
    voices.push(...webSpeechVoices)

    return voices
  }

  async selectBestVoice(): Promise<TTSVoice | undefined> {
    // Prefer OpenAI voices if available (premium quality)
    if (this.openaiProvider?.isSupported()) {
      return await this.openaiProvider.selectBestVoice()
    }

    // Fallback to Web Speech
    return await this.webSpeechProvider.selectBestVoice()
  }

  async speak(
    text: string,
    voice?: TTSVoice,
    options?: TTSPlaybackOptions
  ): Promise<void> {
    // Strategy:
    // 1. Check cache (if enabled)
    // 2. Try OpenAI (if available and voice is OpenAI)
    // 3. Fallback to Web Speech (if enabled)

    const voiceId = voice?.id || (await this.selectBestVoice())?.id || 'unknown'
    const provider = voice?.provider || (this.openaiProvider?.isSupported() ? 'openai' : 'web-speech')

    // Step 1: Check cache
    if (this.enableCache && provider === 'openai') {
      const cachedBlob = await this.getCachedAudio(text, voiceId)
      if (cachedBlob) {
        console.log('[HybridTTS] Using cached audio')
        await this.playAudioBlob(cachedBlob, options)
        this.activeProvider = 'openai'
        return
      }
    }

    // Step 2: Try OpenAI TTS (if configured and requested)
    if (this.openaiProvider?.isSupported() && provider === 'openai') {
      try {
        console.log('[HybridTTS] Using OpenAI TTS')
        this.activeProvider = 'openai'

        // Generate audio
        const audioBlob = await this.generateWithOpenAI(text, voice, options)

        // Cache for future use
        if (this.enableCache && audioBlob) {
          await this.cacheAudio(text, voiceId, audioBlob)
        }

        return // Success!
      } catch (error) {
        console.error('[HybridTTS] OpenAI TTS failed:', error)

        // If fallback is disabled, rethrow error
        if (!this.fallbackToWebSpeech) {
          throw error
        }

        console.log('[HybridTTS] Falling back to Web Speech API')
      }
    }

    // Step 3: Fallback to Web Speech API
    if (this.webSpeechProvider.isSupported()) {
      console.log('[HybridTTS] Using Web Speech API')
      this.activeProvider = 'web-speech'

      // Select appropriate Web Speech voice
      const webSpeechVoice = await this.webSpeechProvider.selectBestVoice()
      await this.webSpeechProvider.speak(text, webSpeechVoice, options)
    } else {
      throw new Error('No TTS provider available')
    }
  }

  private async generateWithOpenAI(
    text: string,
    voice?: TTSVoice,
    options?: TTSPlaybackOptions
  ): Promise<Blob | null> {
    if (!this.openaiProvider) return null

    try {
      // Determine voice to use
      const voiceId = (voice?.id as OpenAIVoiceId) || 'onyx'

      // Generate audio blob
      const audioBlob = await this.openaiProvider.generateSpeech(text, voiceId)

      // Play the audio
      await this.playAudioBlob(audioBlob, options)

      return audioBlob
    } catch (error) {
      console.error('[HybridTTS] OpenAI generation failed:', error)
      throw error
    }
  }

  private async getCachedAudio(text: string, voiceId: string): Promise<Blob | null> {
    if (!this.enableCache) return null

    return await audioCacheService.get(
      text,
      voiceId,
      'openai',
      this.config.language,
      this.config.speed
    )
  }

  private async cacheAudio(text: string, voiceId: string, blob: Blob): Promise<void> {
    if (!this.enableCache) return

    await audioCacheService.set(
      text,
      voiceId,
      'openai',
      this.config.language,
      this.config.speed,
      blob
    )
  }

  private playAudioBlob(blob: Blob, options?: TTSPlaybackOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      audio.volume = this.config.volume

      const audioUrl = URL.createObjectURL(blob)
      audio.src = audioUrl

      audio.onplay = () => {
        options?.onStart?.()
      }

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        options?.onEnd?.()
        resolve()
      }

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl)
        const error = new Error(`Audio playback failed: ${audio.error?.message || 'unknown error'}`)
        options?.onError?.(error)
        reject(error)
      }

      audio.play().catch((error) => {
        URL.revokeObjectURL(audioUrl)
        options?.onError?.(error)
        reject(error)
      })
    })
  }

  stop(): void {
    if (this.activeProvider === 'openai' && this.openaiProvider) {
      this.openaiProvider.stop()
    } else if (this.activeProvider === 'web-speech') {
      this.webSpeechProvider.stop()
    }
    this.activeProvider = null
  }

  pause(): void {
    if (this.activeProvider === 'openai' && this.openaiProvider) {
      this.openaiProvider.pause()
    } else if (this.activeProvider === 'web-speech') {
      this.webSpeechProvider.pause()
    }
  }

  resume(): void {
    if (this.activeProvider === 'openai' && this.openaiProvider) {
      this.openaiProvider.resume()
    } else if (this.activeProvider === 'web-speech') {
      this.webSpeechProvider.resume()
    }
  }

  getProviderName(): string {
    const providers = []
    if (this.openaiProvider?.isSupported()) providers.push('OpenAI TTS')
    if (this.webSpeechProvider.isSupported()) providers.push('Web Speech')
    return `Hybrid (${providers.join(' → ')})`
  }

  estimateCost(text: string): number | null {
    // Only OpenAI has cost
    if (this.openaiProvider?.isSupported()) {
      return this.openaiProvider.estimateCost(text)
    }
    return null // Web Speech is free
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.enableCache) {
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null,
      }
    }
    return await audioCacheService.getStats()
  }

  /**
   * Clear audio cache
   */
  async clearCache(): Promise<void> {
    if (this.enableCache) {
      await audioCacheService.clearAll()
    }
  }

  /**
   * Update OpenAI configuration
   */
  updateOpenAIConfig(config: {
    apiKey?: string // DEPRECATED: Ignored (API key is server-side)
    model?: 'tts-1' | 'tts-1-hd'
    voice?: OpenAIVoiceId
    enabled?: boolean
  }): void {
    if (config.apiKey) {
      console.warn('[HybridTTSProvider] apiKey parameter is deprecated. API key should be set in OPENAI_API_KEY environment variable server-side.')
    }

    if (config.enabled !== false) {
      // Enable OpenAI (API key will be validated server-side)
      this.openaiProvider = new OpenAITTSProvider({
        ...this.config,
        model: config.model,
        voice: config.voice,
      })
    } else if (config.enabled === false) {
      // Disable OpenAI
      this.openaiProvider = null
    }
  }

  /**
   * Check if OpenAI is currently available
   */
  isOpenAIAvailable(): boolean {
    return this.openaiProvider?.isSupported() || false
  }
}
