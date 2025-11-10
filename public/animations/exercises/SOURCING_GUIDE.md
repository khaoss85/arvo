# Animation Sourcing Guide

## 🎯 Goal
Source 40-50 free Lottie animations from LottieFiles.com to cover most common exercises.

## 📋 Priority Tiers

### Tier 1: Compound Movements (10 exercises) - MUST HAVE
Essential compound exercises that form the foundation of most workouts.

**Barbell Exercises:**
- [ ] `barbell-bench-press.json` - Flat barbell bench press
- [ ] `barbell-squat.json` - Back squat
- [ ] `barbell-deadlift.json` - Conventional deadlift
- [ ] `barbell-row.json` - Bent-over barbell row
- [ ] `barbell-overhead-press.json` - Standing overhead press

**Bodyweight:**
- [ ] `pull-up.json` or `bodyweight-pull-up.json` - Pull-up/chin-up

**Dumbbell Exercises:**
- [ ] `dumbbell-bench-press.json` - Flat dumbbell press
- [ ] `dumbbell-squat.json` - Goblet squat or dumbbell squat
- [ ] `dumbbell-row.json` - Single-arm or bent-over row
- [ ] `dumbbell-shoulder-press.json` - Seated or standing press

### Tier 2: Common Isolation (20 exercises) - SHOULD HAVE
Popular isolation exercises for specific muscle groups.

**Shoulders:**
- [ ] `dumbbell-lateral-raise.json` - Side lateral raise
- [ ] `cable-face-pull.json` - Face pull for rear delts

**Arms:**
- [ ] `dumbbell-bicep-curl.json` - Standing bicep curl
- [ ] `dumbbell-hammer-curl.json` - Hammer curl
- [ ] `cable-tricep-pushdown.json` - Rope or bar pushdown
- [ ] `dumbbell-tricep-extension.json` - Overhead extension

**Chest:**
- [ ] `cable-chest-fly.json` - Cable crossover or fly
- [ ] `dumbbell-incline-press.json` - Incline dumbbell press
- [ ] `machine-pec-deck.json` - Pec deck fly
- [ ] `machine-chest-press.json` - Machine chest press

**Back:**
- [ ] `cable-lat-pulldown.json` - Wide-grip pulldown
- [ ] `cable-seated-row.json` - Seated cable row
- [ ] `dumbbell-romanian-deadlift.json` - RDL for hamstrings

**Legs:**
- [ ] `machine-leg-press.json` - 45-degree leg press
- [ ] `machine-leg-curl.json` - Lying or seated leg curl
- [ ] `machine-leg-extension.json` - Leg extension
- [ ] `dumbbell-lunge.json` - Forward or reverse lunge
- [ ] `cable-woodchop.json` - Rotational core exercise

**Core:**
- [ ] `bodyweight-plank.json` - Plank hold
- [ ] `cable-crunch.json` - Kneeling cable crunch

### Tier 3: Equipment Variants (10-15 exercises) - NICE TO HAVE
Alternative equipment variations.

**Smith Machine:**
- [ ] `smith-machine-bench-press.json`
- [ ] `smith-machine-squat.json`

**Additional Bodyweight:**
- [ ] `bodyweight-push-up.json`
- [ ] `bodyweight-dip.json`
- [ ] `bodyweight-squat.json`

**Resistance Bands:**
- [ ] `band-pull-apart.json`
- [ ] `band-row.json`

**Additional Machines:**
- [ ] `machine-shoulder-press.json`
- [ ] `machine-hack-squat.json`

## 🔍 How to Source from LottieFiles

### 1. Search Strategy
Visit [LottieFiles.com](https://lottiefiles.com) and search for:
- "workout"
- "exercise"
- "fitness"
- "gym"
- "training"
- Specific exercise names (e.g., "bench press", "squat", "deadlift")

### 2. Selection Criteria
When choosing animations, prioritize:
- ✅ **Free license** (check before downloading)
- ✅ **Clear movement** - easy to understand which exercise it is
- ✅ **Minimal style** - stick figures or simple characters (consistent with app aesthetic)
- ✅ **Small file size** - aim for 50-150KB per file
- ✅ **Loop-friendly** - animation should loop smoothly
- ⚠️ **Avoid** - overly detailed, branded, or complex animations

### 3. Download Process
1. Click animation preview
2. Check license (must be free for commercial use)
3. Click "Download" button
4. Select "Lottie JSON" format
5. Save to local machine

### 4. Naming Convention
Rename downloaded files to match our slug format:
- **Pattern**: `{equipment}-{movement-pattern}.json`
- **Examples**:
  - `barbell-bench-press.json`
  - `dumbbell-lateral-raise.json`
  - `cable-face-pull.json`
  - `bodyweight-pull-up.json`
  - `machine-leg-press.json`

**Important**:
- All lowercase
- Use hyphens (not underscores or spaces)
- Start with equipment type
- End with movement pattern
- Must match AnimationService slug normalization

### 5. Organization
Save all animations in:
```
/public/animations/exercises/
```

## 📊 File Size Guidelines

**Target**: 50-150KB per file

**If file is too large**:
1. Use [LottieFiles Optimizer](https://lottiefiles.com/tools/lottie-optimizer)
2. Options to try:
   - Reduce decimal precision
   - Remove unnecessary metadata
   - Simplify paths
3. Re-export and verify animation still plays correctly

## ✅ Validation Checklist

Before considering an animation "done":
- [ ] File name follows slug convention
- [ ] File size < 150KB (optimize if needed)
- [ ] Animation loads correctly (test in browser)
- [ ] Animation loops smoothly
- [ ] Movement is clearly identifiable
- [ ] License is free/commercial-use allowed

## 📝 Tracking Progress

As you download animations, check them off in the lists above. This helps:
- Track which exercises have animations
- Identify gaps in coverage
- Prioritize remaining work

## 🚀 Quick Start (First 5 Animations)

To test the system quickly, start with these 5:
1. `barbell-bench-press.json` - Most common upper body exercise
2. `barbell-squat.json` - Most common lower body exercise
3. `dumbbell-bicep-curl.json` - Everyone knows this one
4. `cable-lat-pulldown.json` - Common back exercise
5. `machine-leg-press.json` - Popular leg machine

Once these 5 are working, expand to full Tier 1, then Tier 2.

## 🎨 Style Consistency

Try to maintain visual consistency:
- Same color scheme (or colorless stick figures)
- Same line thickness
- Same animation speed (can adjust with Lottie speed prop if needed)
- Same level of detail

If animations from different creators look too different, consider:
- Using only animations from 1-2 creators for consistency
- Commissioning custom set later (Phase 2)
- Using filters/styles in Lottie player to normalize appearance

## ⏱️ Time Estimate

- **Per animation**: 2-3 minutes (search, download, rename, check)
- **Tier 1 (10)**: 20-30 minutes
- **Tier 2 (20)**: 40-60 minutes
- **Tier 3 (10-15)**: 20-45 minutes
- **Total**: 2-3 hours for all 40-50 animations

## 📌 Notes

- Don't worry about perfect matches - close approximations work fine
- Some exercises may not have exact animations - use closest alternative
- If can't find an exercise, skip it - users will see graceful "Animation not available" message
- Can always add more animations later based on user requests/analytics
