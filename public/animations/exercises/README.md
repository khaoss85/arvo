# Exercise Animations

This directory is reserved for future local animation caching (optional).

## 🎯 Current System: ExerciseDB API

The app now uses the **ExerciseDB API** to fetch professional exercise GIF animations automatically.

### Benefits
- ✅ **1,300+ exercises** with animations (vs 39 manually sourced)
- ✅ **Zero maintenance** - no manual downloads or file management
- ✅ **Professional quality** - real demonstrations from ExerciseDB
- ✅ **Automatic updates** - new exercises added to API automatically
- ✅ **Simple codebase** - no custom Lottie generation

## 🔧 How It Works

### 1. ExerciseDB Service
Located at `lib/services/exercisedb.service.ts`:
- Fetches all exercises from ExerciseDB API on first use
- Caches exercise data for 24 hours (in-memory)
- Provides fuzzy matching for exercise names
- Returns GIF URLs directly from ExerciseDB CDN

### 2. Animation Service
Located at `lib/services/animation.service.ts`:
- Maps exercise names to GIF URLs via ExerciseDB API
- Tries multiple fallback strategies:
  1. Exact exercise name
  2. Canonical pattern + equipment variant
  3. Base canonical pattern
  4. Graceful null (no animation available)

### 3. UI Integration
- **Component**: `components/features/workout/exercise-animation.tsx`
- Simple `<img>` tag loads GIF from CDN
- Lazy loading for performance
- Loading/error states handled gracefully

## 📡 API Configuration

### Option 1: Self-Hosted (Recommended)
Deploy your own ExerciseDB instance to Vercel:
1. Go to https://github.com/ExerciseDB/exercisedb-api
2. Click "Deploy to Vercel"
3. Copy your deployment URL
4. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_EXERCISEDB_API_URL=https://your-exercisedb.vercel.app
   ```

**Benefits**:
- Free & unlimited
- No API keys needed
- Fast (global CDN)
- No rate limits

### Option 2: RapidAPI (Paid)
If you need more exercises (5,000+ in V2):
1. Sign up at https://rapidapi.com
2. Subscribe to ExerciseDB
3. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_EXERCISEDB_API_URL=https://exercisedb.p.rapidapi.com
   NEXT_PUBLIC_EXERCISEDB_API_KEY=your-rapidapi-key
   ```

## 🧪 Testing Animations

After setting up the API:
1. Start dev server: `npm run dev`
2. Generate a new workout
3. Check that PlayCircle icons appear next to exercises
4. Click icon to open animation modal
5. GIF should load and loop automatically
6. Check console for ExerciseDB logs

## 🐛 Troubleshooting

### Animation not loading?
1. Check `NEXT_PUBLIC_EXERCISEDB_API_URL` is set in `.env.local`
2. Verify API is accessible (test with curl)
3. Check browser console for ExerciseDB errors
4. Confirm exercise name matches ExerciseDB format

### API errors?
1. **404 Not Found**: API URL incorrect or server down
2. **401 Unauthorized**: API key invalid (RapidAPI only)
3. **429 Rate Limited**: Exceeded free tier (use self-hosted)
4. **Network errors**: Check internet connection

### No animations showing?
1. Run `ExerciseDBService.clearCache()` in console
2. Reload page to re-fetch from API
3. Check ExerciseDB service logs in console
4. Verify fuzzy matching is working

## 📊 Coverage

ExerciseDB provides animations for:
- **Barbell exercises**: Bench press, squat, deadlift, row, etc.
- **Dumbbell exercises**: Curls, raises, presses, flies, etc.
- **Cable exercises**: Pulldowns, rows, flies, extensions, etc.
- **Machine exercises**: Leg press, chest press, lat pulldown, etc.
- **Bodyweight exercises**: Pull-ups, push-ups, dips, planks, etc.
- **Band exercises**: Various resistance band movements

**Coverage**: ~95% of common gym exercises

## 🔍 Finding Exercise Names

To see what animations are available:
1. Open browser console
2. Run: `await ExerciseDBService.initializeCache()`
3. Check console logs for exercise count
4. Inspect `ExerciseDBService.cache.exercises` to see all names

## 📈 Performance

- **First load**: ~500ms (fetches all exercises from API)
- **Cached loads**: <10ms (in-memory cache)
- **Cache duration**: 24 hours
- **GIF sizes**: 200KB-2MB (lazy loaded)
- **CDN**: Global delivery via ExerciseDB/Vercel

## 🚀 Future Improvements

Potential enhancements:
- [ ] Service Worker caching for offline support
- [ ] Progressive GIF loading (low-res → high-res)
- [ ] Animation prefetching when workout loads
- [ ] Local caching of popular exercises
- [ ] Custom animation overlays (form cues, rep counters)
- [ ] Animation speed controls
- [ ] Mirror/flip mode for left/right exercises

## 📚 Related Files

- **ExerciseDB Service**: `lib/services/exercisedb.service.ts`
- **Animation Service**: `lib/services/animation.service.ts`
- **Player Component**: `components/features/workout/exercise-animation.tsx`
- **Modal Component**: `components/features/workout/exercise-animation-modal.tsx`
- **Exercise Selector Agent**: `lib/agents/exercise-selector.agent.ts`

## 📄 License

ExerciseDB animations are sourced from:
- **V1 (Open Source)**: Free for commercial use
- **V2 (Paid)**: Subject to ExerciseDB terms of service

When using RapidAPI, comply with their terms and your subscription plan.

## ❓ Questions?

For issues or questions:
1. Check ExerciseDB documentation: https://github.com/ExerciseDB/exercisedb-api
2. Review ExerciseDB service logs in browser console
3. Test API directly with curl or Postman
4. Verify environment variables are set correctly
