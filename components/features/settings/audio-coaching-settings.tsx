'use client'

/**
 * AudioCoachingSettings Component
 *
 * Comprehensive settings panel for audio coaching configuration.
 * Allows users to configure OpenAI TTS, Web Speech API, voice selection,
 * playback settings, and cache management.
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Volume2, Zap, Trash2, Play, CheckCircle, AlertCircle } from 'lucide-react'
import { audioCoachingService } from '@/lib/services/audio-coaching.service'
import type { AudioCoachingSettings as Settings } from '@/lib/services/audio-coaching.service'
import type { OpenAIVoiceId } from '@/lib/services/tts/openai-provider'
import { useTranslations } from 'next-intl'

interface VoiceOption {
  id: OpenAIVoiceId
  name: string
  description: string
  language: string
}

const OPENAI_VOICES: VoiceOption[] = [
  { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative - ideal for gym coaching', language: 'en' },
  { id: 'nova', name: 'Nova', description: 'Warm, conversational - friendly and motivating', language: 'en' },
  { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced - versatile for all content', language: 'en' },
  { id: 'echo', name: 'Echo', description: 'Clear, male voice - professional tone', language: 'en' },
  { id: 'fable', name: 'Fable', description: 'British accent, expressive - engaging narration', language: 'en' },
  { id: 'shimmer', name: 'Shimmer', description: 'Soft, gentle - calm and supportive', language: 'en' },
]

export function AudioCoachingSettings() {
  const t = useTranslations('settings.audioCoaching')
  const [settings, setSettings] = useState<Settings>(audioCoachingService.getSettings())
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [isTestingVoice, setIsTestingVoice] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [providerName, setProviderName] = useState<string>('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    // Load initial cache stats and provider name
    loadCacheStats()
    setProviderName(audioCoachingService.getProviderName())
  }, [])

  const loadCacheStats = async () => {
    const stats = await audioCoachingService.getCacheStats()
    setCacheStats(stats)
  }

  const updateSetting = (key: keyof Settings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    audioCoachingService.updateSettings({ [key]: value })
    setProviderName(audioCoachingService.getProviderName())
  }

  const updateOpenAISetting = (key: string, value: any) => {
    const newOpenAISettings = { ...settings.openai, [key]: value }
    const newSettings = { ...settings, openai: newOpenAISettings }
    setSettings(newSettings)
    audioCoachingService.updateSettings({ openai: newOpenAISettings })
    setProviderName(audioCoachingService.getProviderName())
  }

  const handleTestVoice = async () => {
    setIsTestingVoice(true)
    setTestStatus('idle')
    setMessage(null)

    try {
      // Pre-flight diagnostics
      console.log('[Audio Test] Starting voice test...')
      console.log('[Audio Test] Settings:', audioCoachingService.getSettings())
      console.log('[Audio Test] Provider:', audioCoachingService.getProviderName())
      console.log('[Audio Test] Supported:', audioCoachingService.isSupported())

      // Check if audio is supported
      if (!audioCoachingService.isSupported()) {
        throw new Error('Audio is not supported in this browser. Please try a different browser.')
      }

      // Check if audio is enabled
      const currentSettings = audioCoachingService.getSettings()
      if (!currentSettings.enabled) {
        throw new Error('Audio coaching is disabled. Please enable it first.')
      }

      // TEMPORARY: Force enable audio if it's somehow disabled
      if (!currentSettings.enabled) {
        console.log('[Audio Test] Forcing audio to enabled')
        audioCoachingService.updateSettings({ enabled: true })
      }

      // Get provider name for feedback
      const provider = audioCoachingService.getProviderName()
      console.log('[Audio Test] Using provider:', provider)
      console.log('[Audio Test] Volume:', currentSettings.volume)
      console.log('[Audio Test] Speed:', currentSettings.speed)

      // Create a simple test that uses Web Speech API directly to verify it works
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        console.log('[Audio Test] Testing Web Speech API directly...')
        const utterance = new SpeechSynthesisUtterance('Test')
        utterance.volume = currentSettings.volume
        utterance.rate = currentSettings.speed

        // Wait for voices to load
        let voices = window.speechSynthesis.getVoices()
        if (voices.length === 0) {
          console.log('[Audio Test] Waiting for voices to load...')
          await new Promise((resolve) => {
            window.speechSynthesis.onvoiceschanged = () => {
              voices = window.speechSynthesis.getVoices()
              console.log('[Audio Test] Voices loaded:', voices.length)
              resolve(null)
            }
            // Timeout after 2 seconds
            setTimeout(resolve, 2000)
          })
        }

        console.log('[Audio Test] Available voices:', voices.length)
        if (voices.length > 0) {
          const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0]
          utterance.voice = englishVoice
          console.log('[Audio Test] Using voice:', englishVoice.name)
        }

        // Play the test utterance
        console.log('[Audio Test] Speaking test utterance...')
        window.speechSynthesis.speak(utterance)

        // Wait a moment for it to play
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Now try the regular audio coaching service
      console.log('[Audio Test] Testing AudioCoachingService.playImmediate()...')
      await audioCoachingService.playImmediate({
        id: 'test-voice',
        type: 'pre_set',
        segments: [
          { text: 'This is how I will sound during your workout.', pauseAfter: 500, type: 'narration' },
          { text: 'Stay focused, keep pushing, you got this!', pauseAfter: 0, type: 'narration' },
        ],
        priority: 10,
      })

      console.log('[Audio Test] Test completed successfully')
      setTestStatus('success')
      setMessage({
        type: 'success',
        text: `Voice test successful using ${provider}! If you didn't hear audio, check your browser's audio permissions or volume.`
      })
      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      console.error('[Audio Test] Failed:', error)

      // Provide specific error messages
      let errorMessage = 'Voice test failed. '

      if (error instanceof Error) {
        if (error.message.includes('not supported')) {
          errorMessage = error.message
        } else if (error.message.includes('disabled')) {
          errorMessage = error.message
        } else if (error.message.includes('autoplay') || error.message.includes('blocked')) {
          errorMessage += 'Browser blocked audio. Try clicking the button again or check your browser permissions.'
        } else if (error.message.includes('API key') || error.message.includes('OpenAI')) {
          errorMessage += 'OpenAI API issue. Falling back to Web Speech API.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage += 'Network error. Check your internet connection.'
        } else {
          errorMessage += error.message || 'Unknown error occurred.'
        }
      } else {
        errorMessage += 'Unknown error. Check console for details.'
      }

      setTestStatus('error')
      setMessage({ type: 'error', text: errorMessage })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setIsTestingVoice(false)
    }
  }

  const handleClearCache = async () => {
    await audioCoachingService.clearCache()
    await loadCacheStats()
    setMessage({ type: 'success', text: 'Cache cleared successfully!' })
    setTimeout(() => setMessage(null), 3000)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const isOpenAIAvailable = audioCoachingService.isOpenAIAvailable()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audio Coaching</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Get real-time guidance and motivation during your workouts
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="space-y-0.5">
          <label htmlFor="audio-enabled" className="text-base font-semibold text-gray-900 dark:text-white">
            Enable Audio Coaching
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Turn audio coaching on or off
          </p>
        </div>
        <button
          id="audio-enabled"
          onClick={() => updateSetting('enabled', !settings.enabled)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${settings.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {settings.enabled && (
        <>
          {/* Provider Status */}
          <Card className="bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Current Provider</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{providerName}</p>
                </div>
              </div>
              {isOpenAIAvailable ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="h-3 w-3" />
                  OpenAI Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  Web Speech API
                </span>
              )}
            </div>
          </Card>

          {/* OpenAI TTS Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg border-gray-200 dark:border-gray-700">
              <div className="space-y-0.5">
                <label htmlFor="openai-enabled" className="text-sm font-medium text-gray-900 dark:text-white">
                  Premium Voices (OpenAI TTS)
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Natural, human-like voices (~$0.30-0.50 per workout)
                </p>
              </div>
              <button
                id="openai-enabled"
                onClick={() => updateOpenAISetting('enabled', !(settings.openai?.enabled !== false))}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.openai?.enabled !== false ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.openai?.enabled !== false ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {settings.openai?.enabled !== false && (
              <div className="space-y-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                {/* Voice Selection */}
                <div className="space-y-2">
                  <label htmlFor="voice-select" className="block text-sm font-medium text-gray-900 dark:text-white">
                    Voice
                  </label>
                  <select
                    id="voice-select"
                    value={settings.openai?.voice || 'onyx'}
                    onChange={(e) => updateOpenAISetting('voice', e.target.value as OpenAIVoiceId)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {OPENAI_VOICES.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} - {voice.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <label htmlFor="model-select" className="block text-sm font-medium text-gray-900 dark:text-white">
                    Model Quality
                  </label>
                  <select
                    id="model-select"
                    value={settings.openai?.model || 'tts-1'}
                    onChange={(e) => updateOpenAISetting('model', e.target.value as 'tts-1' | 'tts-1-hd')}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="tts-1">Standard (tts-1) - $0.015/1K chars - Real-time, optimized</option>
                    <option value="tts-1-hd">High Quality (tts-1-hd) - $0.030/1K chars - Premium quality</option>
                  </select>
                </div>

                {/* Test Voice Button */}
                <Button
                  onClick={handleTestVoice}
                  disabled={isTestingVoice}
                  className="w-full"
                  variant="outline"
                >
                  {isTestingVoice ? (
                    <>
                      <Zap className="mr-2 h-4 w-4 animate-pulse" />
                      Playing...
                    </>
                  ) : testStatus === 'success' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Test Voice
                    </>
                  ) : testStatus === 'error' ? (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                      Test Voice (Failed)
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Test Voice
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Playback Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Playback Settings</h4>

            {/* Speed Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="speed-slider" className="text-sm text-gray-700 dark:text-gray-300">
                  Speech Speed
                </label>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {settings.speed.toFixed(1)}x
                </span>
              </div>
              <input
                id="speed-slider"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.speed}
                onChange={(e) => updateSetting('speed', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Adjust how fast the coaching voice speaks
              </p>
            </div>

            {/* Volume Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="volume-slider" className="text-sm text-gray-700 dark:text-gray-300">
                  Volume
                </label>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.volume}
                onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Control the coaching voice volume
              </p>
            </div>
          </div>

          {/* Cache Management */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Cache Management</h4>

            <div className="flex items-center justify-between p-4 border rounded-lg border-gray-200 dark:border-gray-700">
              <div className="space-y-0.5">
                <label htmlFor="cache-enabled" className="text-sm font-medium text-gray-900 dark:text-white">
                  Enable Caching
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Store audio locally to reduce API costs (80-90% savings)
                </p>
              </div>
              <button
                id="cache-enabled"
                onClick={() => updateSetting('enableCache', !(settings.enableCache !== false))}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.enableCache !== false ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.enableCache !== false ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {cacheStats && settings.enableCache !== false && (
              <Card className="bg-muted/30 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cached Items:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{cacheStats.totalEntries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Storage Used:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatBytes(cacheStats.totalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Est. Cost Saved:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      ~${((cacheStats.totalEntries * 0.35) || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleClearCache}
                  variant="outline"
                  className="w-full mt-4"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cache
                </Button>
              </Card>
            )}
          </div>

          {/* Info Footer */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>💡 Tip:</strong> OpenAI TTS provides natural, human-like voices that sound like a real coach.
              Web Speech API is free but may sound more robotic. Caching dramatically reduces costs by storing
              frequently used audio clips locally.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
