# Animation Scripts

Automation scripts for downloading and organizing Lottie animations from LottieFiles.

## 📁 Files

- **`fetch-animations.js`** - Generates download checklist with prioritized URLs
- **`organize-animations.js`** - Organizes downloaded animations (rename, move, validate)

## 🚀 Quick Start

### Step 1: Generate Download Checklist

```bash
node scripts/fetch-animations.js
```

**Output:** `public/animations/exercises/DOWNLOAD_CHECKLIST.md`

This creates a markdown file with:
- 40-50 exercise animations prioritized by importance
- Direct LottieFiles search URLs for each exercise
- Suggested file names (slug format)
- Progress tracking checklist

### Step 2: Download Animations

1. Open `public/animations/exercises/DOWNLOAD_CHECKLIST.md`
2. Click each search URL to find animations on LottieFiles
3. Download animations as "Lottie JSON" format
4. Save to `~/Downloads` (browser default)
5. Check off exercises as you complete them

**Time:** ~1-2 hours for 40-50 animations (~2 min each)

### Step 3: Organize Downloaded Files

```bash
node scripts/organize-animations.js
```

This script will:
- Scan `~/Downloads` for `.json` files
- Validate Lottie format
- Check file sizes (warn if > 150KB)
- Rename to slug format (e.g., `barbell-bench-press.json`)
- Move to `public/animations/exercises/`
- Generate `ANIMATIONS_MANIFEST.md` with stats

### Step 4: Verify in App

```bash
npm run dev
```

1. Generate a workout with exercises
2. Check that PlayCircle icons appear
3. Click icons to verify animations load
4. Test on mobile for responsive modal

---

## 📋 Detailed Usage

### `fetch-animations.js`

Generates a prioritized checklist of animations to download.

**Usage:**
```bash
node scripts/fetch-animations.js
```

**What it does:**
- Reads exercise catalog from SOURCING_GUIDE priority tiers
- Generates LottieFiles search URLs for each exercise
- Creates markdown checklist with checkboxes
- Outputs to `public/animations/exercises/DOWNLOAD_CHECKLIST.md`

**Output Example:**
```markdown
### 1. Barbell Bench Press

- **File name:** `barbell-bench-press.json`
- **Search URL:** [🔍 Find on LottieFiles](https://lottiefiles.com/search?q=bench+press)
- **Keywords:** bench press, barbell press, chest press
- **Status:** ☐ Not downloaded
```

**No configuration needed** - just run it!

---

### `organize-animations.js`

Processes downloaded animations and organizes them.

**Basic Usage:**
```bash
node scripts/organize-animations.js
```

**Options:**
```bash
# Use custom source directory
node scripts/organize-animations.js --source /path/to/animations

# Dry run (simulate without moving files)
node scripts/organize-animations.js --dry-run
```

**What it does:**
1. **Scan** `~/Downloads` (or custom directory) for `.json` files
2. **Validate** each file is a proper Lottie JSON (has `v` and `layers`)
3. **Check file size** and warn if > 150KB
4. **Suggest slug name** based on filename
5. **Copy files** to `public/animations/exercises/`
6. **Generate manifest** (`ANIMATIONS_MANIFEST.md`) with statistics

**File Size Warnings:**
- 0-150KB: ✅ OK
- 150-200KB: ⚡ Consider optimizing
- 200KB+: ⚠️ WARNING - definitely optimize

**Output Example:**
```
[1/45] Processing: bench-press-animation.json
   ✓ File size: 87KB
   ✅ Moved to: barbell-bench-press.json

[2/45] Processing: squat.json
   ⚠️  WARNING: File size 215KB (> 200KB recommended)
   ✅ Moved to: barbell-squat.json
```

**Generates:**
- `ANIMATIONS_MANIFEST.md` - Complete list with stats

---

## 🎯 Exercise Catalog

The scripts work with a 3-tier priority system:

### Tier 1: Compound Movements (10 exercises) 🔴 HIGH PRIORITY
Essential exercises that form workout foundations:
- Barbell: Bench Press, Squat, Deadlift, Row, Overhead Press
- Bodyweight: Pull-up
- Dumbbell: Bench Press, Squat, Row, Shoulder Press

### Tier 2: Common Isolation (20 exercises) 🟡 MEDIUM PRIORITY
Popular single-joint exercises:
- Shoulders: Lateral Raise, Face Pull
- Arms: Bicep Curl, Hammer Curl, Tricep Pushdown, Tricep Extension
- Chest: Cable Fly, Incline Press, Pec Deck, Machine Press
- Back: Lat Pulldown, Seated Row, Romanian Deadlift
- Legs: Leg Press, Leg Curl, Leg Extension, Lunge
- Core: Plank, Cable Crunch, Woodchop

### Tier 3: Equipment Variants (10-15 exercises) 🟢 LOW PRIORITY
Alternative equipment:
- Smith Machine: Bench Press, Squat
- Bodyweight: Push-up, Dip, Squat
- Bands: Pull Apart, Row
- Machines: Shoulder Press, Hack Squat

**Total:** 40-50 animations

---

## 🔧 Troubleshooting

### Problem: No JSON files found in ~/Downloads

**Solution:**
1. Make sure you actually downloaded animations from LottieFiles
2. Check your browser's download location
3. Use `--source` flag if downloads are elsewhere:
   ```bash
   node scripts/organize-animations.js --source /path/to/downloads
   ```

### Problem: File not recognized as valid Lottie

**Causes:**
- Downloaded wrong format (not "Lottie JSON")
- File corrupted during download
- File is not actually a Lottie animation

**Solution:**
1. Re-download as "Lottie JSON" format
2. Open file in text editor - should be valid JSON with `"v"` and `"layers"` fields
3. Try a different animation from LottieFiles

### Problem: File size too large (> 200KB)

**Solution:**
1. Visit [LottieFiles Optimizer](https://lottiefiles.com/tools/lottie-optimizer)
2. Upload the large file
3. Apply optimizations:
   - Reduce decimal precision
   - Remove unnecessary metadata
   - Simplify paths
4. Download optimized version
5. Replace original file

### Problem: Animation already exists at target

**Behavior:** Script skips files that already exist (won't overwrite)

**Solution:**
- If you want to replace: Delete existing file first
- If duplicate: Script will skip (intentional, prevents data loss)

### Problem: Dry run mode - nothing moved

**This is expected!** Dry run shows what *would* happen without actually moving files.

**Solution:** Run without `--dry-run` to actually move files:
```bash
node scripts/organize-animations.js
```

---

## 📊 Example Workflow

### Complete workflow from scratch:

```bash
# Step 1: Generate checklist
node scripts/fetch-animations.js

# Output:
# ✅ Checklist generated successfully!
# 📄 Output: public/animations/exercises/DOWNLOAD_CHECKLIST.md
# 📊 Total exercises: 39
# ⏱️  Estimated download time: 1-2 hours

# Step 2: Download animations (manual)
# Open DOWNLOAD_CHECKLIST.md and click through URLs
# Download 39 animations to ~/Downloads (1-2 hours)

# Step 3: Test organize script (dry run)
node scripts/organize-animations.js --dry-run

# Output:
# 🔍 Scanning for animations in: /Users/you/Downloads
# Found 39 JSON files
# [1/39] Processing: bench-press.json
#    [DRY RUN] Would move to: barbell-bench-press.json
# ...

# Step 4: Actually organize
node scripts/organize-animations.js

# Output:
# 🔍 Scanning for animations in: /Users/you/Downloads
# Found 39 JSON files
# [1/39] Processing: bench-press.json
#    ✓ File size: 87KB
#    ✅ Moved to: barbell-bench-press.json
# ...
# 📄 Generated manifest: public/animations/exercises/ANIMATIONS_MANIFEST.md
# ✅ SUCCESS! Animations organized.

# Step 5: Verify in app
npm run dev
# Generate workout → Check PlayCircle icons → Click to test
```

---

## 🎨 Selection Criteria

When browsing LottieFiles, look for:

**Style:**
- ✅ Stick figures or simple characters
- ✅ Minimal colors (preferably monochrome)
- ✅ Consistent visual style across animations
- ❌ Avoid realistic/detailed characters

**Quality:**
- ✅ Clear, recognizable movement
- ✅ Smooth animation (no jankiness)
- ✅ Proper looping (seamless repeat)
- ✅ Accurate exercise biomechanics

**Technical:**
- ✅ File size < 150KB (check before downloading)
- ✅ Free license (check "License" section)
- ✅ Lottie JSON format available
- ❌ Avoid animations with excessive detail

---

## 📚 Resources

- **LottieFiles Library:** https://lottiefiles.com/free-animations/exercise
- **LottieFiles Optimizer:** https://lottiefiles.com/tools/lottie-optimizer
- **Animation Service Code:** `lib/services/animation.service.ts`
- **Exercise Catalog:** `public/animations/exercises/SOURCING_GUIDE.md`
- **Main Documentation:** `public/animations/exercises/README.md`

---

## 🐛 Reporting Issues

If you encounter bugs or have suggestions:
1. Check troubleshooting section above
2. Verify Node.js version (>= 14.x)
3. Check console output for specific errors
4. Review generated DOWNLOAD_CHECKLIST.md for search URLs

---

## 💡 Tips & Best Practices

1. **Download in batches** - Do Tier 1 first (10 animations), test, then continue
2. **Check licenses** - Always verify animation is free for commercial use
3. **Preview before downloading** - Click animation preview on LottieFiles
4. **Use dry-run first** - Test organize script before moving files
5. **Keep originals** - Script copies (not moves) files, so originals stay in Downloads
6. **Optimize large files** - Use LottieFiles Optimizer for files > 150KB
7. **Verify in app** - Test each batch of animations in your workout app

---

## ⏱️ Time Estimates

- **Generate checklist:** 1 minute
- **Download 40-50 animations:** 1-2 hours (2 min each)
- **Organize animations:** 2 minutes
- **Test in app:** 20 minutes
- **Total:** ~2-3 hours for complete workflow

---

**Questions?** See `public/animations/exercises/README.md` or `SOURCING_GUIDE.md` for more details.
