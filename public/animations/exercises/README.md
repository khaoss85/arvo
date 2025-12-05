# Exercise Animations

This directory is reserved for future local animation caching (optional).

## 🎯 Current System: MuscleWiki API

The app uses the **MuscleWiki API** via RapidAPI to fetch professional exercise video animations.

### Benefits
- ✅ **1,700+ exercises** with MP4 videos
- ✅ **Multiple angles** per exercise (front, back, side)
- ✅ **Gender variants** (male/female demonstrations)
- ✅ **Lazy loading** - only fetches exercises when needed
- ✅ **Database caching** - cross-user benefit, 30-day cache
- ✅ **Cost optimized** - one API call per unique exercise

## 🔧 How It Works

### 1. MuscleWiki Service
Located at `lib/services/musclewiki.service.ts`:
- Lazy loading: fetches exercises on-demand (not at startup)
- Two-tier caching: memory + Supabase database
- Cross-user benefit: cached exercises shared across all users
- Request coalescing: prevents duplicate concurrent API calls

### 2. Cache Service
Located at `lib/services/musclewiki-cache.service.ts`:
- Database CRUD for `musclewiki_exercise_cache` table
- 30-day TTL for cached entries
- Automatic cleanup of stale data

### 3. Animation Service
Located at `lib/services/animation.service.ts`:
- Maps exercise names to video URLs via MuscleWiki
- Tries multiple fallback strategies:
  1. Exact exercise name
  2. Canonical pattern + equipment variant
  3. Base canonical pattern
  4. Graceful null (no animation available)

### 4. UI Integration
- **Hook**: `lib/hooks/use-exercise-video.ts`
- Supports angle/gender preferences
- Loading/error states handled gracefully

## 📡 API Configuration

1. Subscribe at: https://rapidapi.com/musclewiki/api/musclewiki-api
2. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_MUSCLEWIKI_API_KEY=your-rapidapi-key
   ```

## 🧪 Testing Animations

After setting up the API:
1. Start dev server: `npm run dev`
2. Generate a new workout
3. Check that PlayCircle icons appear next to exercises
4. Click icon to open animation modal
5. Video should load with angle selector
6. Check console for MuscleWiki logs

## 📊 Coverage

MuscleWiki provides animations for:
- **Barbell exercises**: Bench press, squat, deadlift, row, etc.
- **Dumbbell exercises**: Curls, raises, presses, flies, etc.
- **Cable exercises**: Pulldowns, rows, flies, extensions, etc.
- **Machine exercises**: Leg press, chest press, lat pulldown, etc.
- **Bodyweight exercises**: Pull-ups, push-ups, dips, planks, etc.

**Coverage**: ~90% of common gym exercises

## 📈 Performance

- **First exercise load**: ~200ms (API call)
- **Cached loads**: <10ms (database or memory)
- **Cache duration**: 30 days (database)
- **Video sizes**: 1-5MB (progressive loading)

## 📚 Related Files

- **MuscleWiki Service**: `lib/services/musclewiki.service.ts`
- **Cache Service**: `lib/services/musclewiki-cache.service.ts`
- **Animation Service**: `lib/services/animation.service.ts`
- **Video Hook**: `lib/hooks/use-exercise-video.ts`
- **Modal Component**: `components/features/workout/exercise-animation-modal.tsx`

## 📄 License

MuscleWiki animations are subject to MuscleWiki/RapidAPI terms of service.
Comply with your subscription plan limits.
