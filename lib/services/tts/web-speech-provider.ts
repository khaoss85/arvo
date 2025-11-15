/**
 * WebSpeechProvider
 *
 * TTS provider using the Web Speech API (browser-native, free).
 * Quality is lower than premium services but has zero cost and works offline.
 */

import { TTSProvider, type TTSVoice, type TTSProviderConfig, type TTSPlaybackOptions } from './provider.interface'

export class WebSpeechProvider extends TTSProvider {
  private synth: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null

  constructor(config: TTSProviderConfig) {
    super(config)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
    }
  }

  isSupported(): boolean {
    return this.synth !== null
  }

  async getVoices(): Promise<TTSVoice[]> {
    if (!this.synth) return []

    return new Promise((resolve) => {
      let voices = this.synth!.getVoices()

      if (voices.length > 0) {
        resolve(this.mapVoices(voices))
        return
      }

      // Some browsers load voices asynchronously
      this.synth!.onvoiceschanged = () => {
        voices = this.synth!.getVoices()
        resolve(this.mapVoices(voices))
      }
    })
  }

  private mapVoices(voices: SpeechSynthesisVoice[]): TTSVoice[] {
    return voices
      .filter((v) => v.lang.startsWith(this.config.language))
      .map((v) => ({
        id: v.voiceURI,
        name: v.name,
        language: v.lang,
        quality: this.inferQuality(v),
        provider: 'web-speech',
      }))
  }

  private inferQuality(voice: SpeechSynthesisVoice): 'low' | 'medium' | 'high' {
    const name = voice.name.toLowerCase()

    // Neural/Premium voices
    if (
      name.includes('neural') ||
      name.includes('premium') ||
      name.includes('enhanced')
    ) {
      return 'high'
    }

    // Google/Microsoft voices
    if (name.includes('google') || name.includes('microsoft')) {
      return 'medium'
    }

    // Default/system voices
    return 'low'
  }

  async selectBestVoice(): Promise<TTSVoice | undefined> {
    const voices = await this.getVoices()
    if (voices.length === 0) return undefined

    // Priority 1: High quality voices
    const highQuality = voices.find((v) => v.quality === 'high')
    if (highQuality) return highQuality

    // Priority 2: Medium quality voices
    const mediumQuality = voices.find((v) => v.quality === 'medium')
    if (mediumQuality) return mediumQuality

    // Priority 3: Any voice
    return voices[0]
  }

  speak(
    text: string,
    voice?: TTSVoice,
    options?: TTSPlaybackOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        const error = new Error('Speech synthesis not supported')
        options?.onError?.(error)
        reject(error)
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      this.currentUtterance = utterance

      // Configure voice settings
      utterance.lang = this.config.language === 'it' ? 'it-IT' : 'en-US'
      utterance.rate = this.config.speed
      utterance.volume = this.config.volume
      utterance.pitch = this.config.pitch || 1.0

      // Set voice if provided
      if (voice) {
        const synthVoices = this.synth.getVoices()
        const selectedVoice = synthVoices.find((v) => v.voiceURI === voice.id)
        if (selectedVoice) {
          utterance.voice = selectedVoice
        }
      }

      utterance.onstart = () => {
        options?.onStart?.()
      }

      utterance.onend = () => {
        this.currentUtterance = null
        options?.onEnd?.()
        resolve()
      }

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event)
        this.currentUtterance = null
        const error = new Error(`Speech synthesis failed: ${event.error}`)
        options?.onError?.(error)
        reject(error)
      }

      this.synth.speak(utterance)
    })
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel()
      this.currentUtterance = null
    }
  }

  pause(): void {
    if (this.synth) {
      this.synth.pause()
    }
  }

  resume(): void {
    if (this.synth) {
      this.synth.resume()
    }
  }

  getProviderName(): string {
    return 'Web Speech API'
  }

  estimateCost(): number | null {
    return null // Free
  }
}
