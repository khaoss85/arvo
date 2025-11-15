# Audio Coaching Setup Guide

This guide explains how to configure and use the audio coaching feature in Arvo.

## Overview

Arvo's audio coaching uses an intelligent hybrid TTS (Text-to-Speech) system that automatically provides the best voice quality available:

1. **OpenAI TTS** (Premium, optional) - Natural, human-like voices
2. **Web Speech API** (Free, built-in) - Browser-native TTS
3. **IndexedDB Caching** - Minimizes API costs and latency

The system automatically falls back to Web Speech API if OpenAI is not configured.

## Week 1: Segmented Scripts + Improved Voice Selection ✅

- Segmented scripts with strategic pauses (mental digestion, positioning time)
- 4-segment structure: intro → mental (2s pause) → technical (3s pause) → countdown
- Improved Web Speech voice selection (~40-50% quality improvement)

## Week 2: OpenAI TTS Integration ✅

- Premium voice quality using OpenAI's `tts-1` model
- 6 professional voices: Alloy, Echo, Fable, Onyx, Nova, Shimmer
- Automatic caching with IndexedDB (7-day TTL)
- Intelligent fallback to Web Speech API
- Cost: $0.015 per 1,000 characters (~$0.30-0.50 per workout session)

## Configuration

### Option 1: Using OpenAI TTS (Premium Quality)

1. **Get an OpenAI API Key**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key (starts with `sk-...`)

2. **Configure in the app**
   ```typescript
   // In your app, update audio coaching settings:
   audioCoachingService.updateSettings({
     enabled: true,
     language: 'en', // or 'it'
     speed: 0.9,
     volume: 1.0,
     openai: {
       apiKey: 'sk-...your-key-here',
       enabled: true,
       model: 'tts-1', // or 'tts-1-hd' for higher quality
       voice: 'onyx', // alloy, echo, fable, onyx, nova, shimmer
     },
     enableCache: true, // Recommended to minimize costs
   })
   ```

3. **Voice Selection**
   - **Onyx**: Deep, authoritative (recommended for gym coaching)
   - **Nova**: Warm, conversational
   - **Alloy**: Neutral, balanced
   - **Echo**: Clear, male voice
   - **Fable**: British accent, expressive
   - **Shimmer**: Soft, gentle

### Option 2: Using Web Speech API (Free, Built-in)

No configuration needed! The system automatically uses Web Speech API if OpenAI is not configured.

Simply ensure audio coaching is enabled:

```typescript
audioCoachingService.updateSettings({
  enabled: true,
  language: 'en', // or 'it'
  speed: 0.9,
  volume: 1.0,
})
```

## Cost Estimation

### OpenAI TTS Pricing

- **Model**: `tts-1` (standard quality, real-time)
- **Cost**: $0.015 per 1,000 characters
- **Average workout**: ~20,000-30,000 characters
- **Cost per workout**: ~$0.30-0.45

**With caching enabled** (7-day TTL):
- First workout: $0.30-0.45
- Subsequent workouts (same exercises): $0.00 (served from cache)
- Estimated monthly cost: $5-15 (depending on workout variety)

### Web Speech API

- **Cost**: FREE
- **Quality**: Lower than OpenAI, but improved with Week 1 voice selection

## Cache Management

The system automatically caches OpenAI TTS audio in IndexedDB for 7 days.

### View Cache Stats

```typescript
const stats = await audioCoachingService.getCacheStats()
console.log(stats)
// {
//   totalEntries: 120,
//   totalSize: 15728640, // bytes (~15 MB)
//   oldestEntry: 1735689600000,
//   newestEntry: 1736294400000
// }
```

### Clear Cache

```typescript
await audioCoachingService.clearCache()
```

### Cache Cleanup

Old entries (>7 days) are automatically cleaned up on:
- App initialization
- Cache service initialization

## Architecture

```
AudioCoachingService (Public API)
  ↓
HybridTTSProvider (Intelligent Router)
  ├─→ [Check Cache] → Play if found
  ├─→ [Try OpenAI] → Generate + Cache + Play
  └─→ [Fallback] → WebSpeechProvider
```

### Provider Selection Logic

1. **Check cache first** (instant, zero cost)
2. **Try OpenAI** if:
   - API key is configured
   - `openai.enabled = true`
   - Voice is an OpenAI voice
3. **Fallback to Web Speech** if:
   - OpenAI not configured
   - OpenAI request fails
   - `fallbackToWebSpeech = true` (default)

## API Reference

### Update Settings

```typescript
audioCoachingService.updateSettings({
  enabled?: boolean
  autoplay?: boolean
  speed?: number // 0.5 - 2.0
  volume?: number // 0.0 - 1.0
  language?: 'en' | 'it'
  openai?: {
    apiKey?: string
    enabled?: boolean
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
    model?: 'tts-1' | 'tts-1-hd'
  }
  enableCache?: boolean
  fallbackToWebSpeech?: boolean
})
```

### Get Available Voices

```typescript
const voices = await audioCoachingService.getAvailableVoices()
// Returns TTSVoice[] (both OpenAI and Web Speech voices)
```

### Check Provider Status

```typescript
// Check if OpenAI is available
const hasOpenAI = audioCoachingService.isOpenAIAvailable()

// Get current provider name
const provider = audioCoachingService.getProviderName()
// "Hybrid (OpenAI TTS → Web Speech)" or "Hybrid (Web Speech)"
```

### Estimate Cost

```typescript
const text = "Set 1. Tempo is 3 seconds down, pause 1, explode up..."
const cost = audioCoachingService.estimateCost(text)
// Returns: 0.001 (USD) for OpenAI, or null for Web Speech
```

## Troubleshooting

### OpenAI TTS not working

1. **Check API key**: Ensure it starts with `sk-` and is valid
2. **Check billing**: Verify you have credits at https://platform.openai.com/account/billing
3. **Check console**: Look for error messages in browser dev tools
4. **Fallback works**: System should automatically use Web Speech API

### Poor voice quality

1. **Using Web Speech API?**: Consider upgrading to OpenAI TTS
2. **Check speed setting**: Try adjusting `speed` (0.8-1.0 recommended)
3. **Check browser**: Some browsers have better Web Speech voices than others

### High API costs

1. **Enable caching**: Set `enableCache: true` (default)
2. **Check cache stats**: Verify cache is working
3. **Use tts-1**: Use standard model instead of tts-1-hd
4. **Limit usage**: Only enable for important sets/exercises

## Security Notes

- **Never commit API keys** to version control
- **Use environment variables** for production deployments
- **Rate limiting**: OpenAI has rate limits (50 requests/minute for tts-1)
- **CORS**: API calls are made from client-side (browser)

## Future Improvements (Week 3)

- **Real-time counting**: Count tempo phases during set execution
- **Adaptive speed**: Auto-adjust based on actual rep tempo
- **Voice customization UI**: Settings panel for voice selection
- **Usage analytics**: Track costs and cache hit rates
