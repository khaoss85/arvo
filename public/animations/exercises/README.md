# Exercise Animations

This directory contains Lottie JSON animations for exercise demonstrations.

## 🎯 Purpose

Visual animations help users quickly identify which exercise to perform without having to read and mentally visualize the movement. This improves workout flow and reduces cognitive load during training.

## 📁 Structure

```
/public/animations/exercises/
├── README.md                    # This file
├── SOURCING_GUIDE.md           # Guide for finding/downloading animations
├── .gitkeep                     # Ensures directory is tracked by git
├── barbell-bench-press.json    # Barbell bench press animation
├── barbell-squat.json          # Barbell squat animation
└── ...                          # More animations
```

## 🔗 How It Works

### 1. Animation Mapping
The `AnimationService` (`lib/services/animation.service.ts`) maps exercise names to animation files using a 4-level fallback strategy:

1. **Exact match** - Tries exact slug of exercise name
   - Example: "Barbell Bench Press" → `/animations/exercises/barbell-bench-press.json`

2. **Canonical pattern + equipment** - Tries pattern with equipment variant
   - Example: `bench-press` + `barbell` → `/animations/exercises/barbell-bench-press.json`

3. **Base canonical pattern** - Falls back to base pattern (no equipment)
   - Example: `bench-press` → `/animations/exercises/bench-press.json`

4. **Graceful null** - Returns `null` if no animation found
   - No PlayCircle icon shown, or "Animation not available" message

### 2. Slug Normalization
Exercise names are converted to URL-safe slugs:
- Lowercase
- Spaces → hyphens
- Remove special characters
- Remove consecutive hyphens

Examples:
- "Barbell Bench Press" → `barbell-bench-press`
- "DB Lateral Raise" → `db-lateral-raise`
- "Cable Rope Tricep Pushdown" → `cable-rope-tricep-pushdown`

### 3. UI Integration
PlayCircle icons appear next to exercises when animations are available:
- **Workout Progress** list (`components/features/workout/workout-progress.tsx`)
- **Exercise Substitution** modal (`components/features/workout/exercise-substitution.tsx`)

Clicking the icon opens a bottom-drawer modal with the Lottie animation.

## 📝 Naming Convention

**Format**: `{equipment}-{movement-pattern}.json`

**Examples**:
- `barbell-bench-press.json` ✅
- `dumbbell-lateral-raise.json` ✅
- `cable-face-pull.json` ✅
- `machine-leg-press.json` ✅
- `bodyweight-pull-up.json` ✅

**Important**:
- All lowercase
- Use hyphens (not underscores or spaces)
- Start with equipment type
- End with movement pattern
- Match AnimationService slug normalization

## ➕ Adding New Animations

### Option A: Manual Download
1. Find animation on [LottieFiles.com](https://lottiefiles.com)
2. Check license (must be free for commercial use)
3. Download as "Lottie JSON"
4. Rename following naming convention
5. Save to this directory
6. Test in app

### Option B: Optimize Existing Animation
If file is too large (> 150KB):
1. Visit [LottieFiles Optimizer](https://lottiefiles.com/tools/lottie-optimizer)
2. Upload file
3. Apply optimizations (reduce precision, remove metadata)
4. Download optimized version
5. Replace original file

## 🎨 Style Guidelines

For visual consistency, prefer animations with:
- ✅ Simple stick figures or minimal characters
- ✅ Clear movement patterns
- ✅ Neutral colors (or monochrome)
- ✅ Loop-friendly timing
- ✅ 50-150KB file size
- ❌ Avoid overly detailed or branded animations

## 📊 File Size Guidelines

**Target**: 50-150KB per file
**Maximum**: 200KB (use optimizer if exceeding)

Why it matters:
- Faster load times
- Better mobile experience
- Lower bandwidth usage
- More animations fit in browser cache

## 🔍 Finding Missing Animations

If an exercise doesn't have an animation:
1. PlayCircle icon won't appear (or will show "not available" when clicked)
2. Check dev console for AnimationService debug logs
3. Exercise name is logged when animation not found
4. Prioritize most-requested exercises for next batch

## 🧪 Testing New Animations

After adding a new animation:
1. Restart dev server: `npm run dev`
2. Generate a workout with that exercise
3. Verify PlayCircle icon appears
4. Click icon → modal should open
5. Check animation loads and loops correctly
6. Verify no console errors

## 📈 Coverage Tracking

See `SOURCING_GUIDE.md` for priority tiers:
- **Tier 1**: 10 compound movements (MUST HAVE)
- **Tier 2**: 20 common isolation exercises (SHOULD HAVE)
- **Tier 3**: 10-15 equipment variants (NICE TO HAVE)

Target: 40-50 animations for 80%+ coverage

## 🐛 Troubleshooting

### Animation not showing?
1. Check file name matches slug convention
2. Verify file is valid JSON
3. Check file is in `/public/animations/exercises/`
4. Confirm AnimationService mapping logic
5. Look for console errors

### Animation loads but doesn't play?
1. Check Lottie JSON is valid
2. Try opening in [LottieFiles preview](https://lottiefiles.com)
3. Verify `loop: true` in component
4. Check for browser console errors

### Animation too slow/fast?
Adjust speed in `ExerciseAnimation` component:
```tsx
<Lottie
  animationData={animationData}
  loop={true}
  speed={1.5} // Adjust this (default: 1)
/>
```

## 📚 Related Files

- **Service**: `lib/services/animation.service.ts`
- **Player Component**: `components/features/workout/exercise-animation.tsx`
- **Modal Component**: `components/features/workout/exercise-animation-modal.tsx`
- **Workout Progress**: `components/features/workout/workout-progress.tsx`
- **Exercise Substitution**: `components/features/workout/exercise-substitution.tsx`
- **Store**: `lib/stores/workout-execution.store.ts` (animationUrl, hasAnimation fields)

## 🎯 Future Improvements

Potential enhancements:
- [ ] Animation preloading for upcoming exercises
- [ ] In-memory caching of loaded animations
- [ ] Analytics on most-viewed animations
- [ ] Custom animations commissioned for brand consistency
- [ ] Animation speed controls
- [ ] Mirror/flip mode for symmetry visualization
- [ ] Form cue annotations overlaid on animations

## 📄 License

Animations sourced from LottieFiles must comply with their respective licenses. Ensure all animations used are free for commercial use or properly licensed.

## ❓ Questions?

If you need to add animations or encounter issues:
1. Check `SOURCING_GUIDE.md` for detailed instructions
2. Review `AnimationService` code for mapping logic
3. Test in browser dev tools
4. Check console for AnimationService debug logs
