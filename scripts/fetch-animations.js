#!/usr/bin/env node

/**
 * fetch-animations.js
 *
 * Generates a prioritized checklist of Lottie animations to download from LottieFiles.
 *
 * Since we cannot programmatically download due to licensing/authentication,
 * this script generates a markdown checklist with direct URLs for manual download.
 *
 * Usage:
 *   node scripts/fetch-animations.js
 *
 * Output:
 *   public/animations/exercises/DOWNLOAD_CHECKLIST.md
 */

const fs = require('fs');
const path = require('path');

// Priority tiers from SOURCING_GUIDE.md
const EXERCISE_CATALOG = {
  tier1: {
    name: 'Compound Movements (MUST HAVE)',
    priority: 1,
    exercises: [
      { name: 'Barbell Bench Press', slug: 'barbell-bench-press', keywords: ['bench press', 'barbell press', 'chest press'] },
      { name: 'Barbell Squat', slug: 'barbell-squat', keywords: ['back squat', 'barbell squat', 'squat'] },
      { name: 'Barbell Deadlift', slug: 'barbell-deadlift', keywords: ['deadlift', 'barbell deadlift', 'conventional deadlift'] },
      { name: 'Barbell Row', slug: 'barbell-row', keywords: ['barbell row', 'bent over row', 'bent-over row'] },
      { name: 'Barbell Overhead Press', slug: 'barbell-overhead-press', keywords: ['overhead press', 'military press', 'shoulder press barbell'] },
      { name: 'Pull-up', slug: 'pull-up', keywords: ['pull up', 'pullup', 'chin up'] },
      { name: 'Dumbbell Bench Press', slug: 'dumbbell-bench-press', keywords: ['dumbbell press', 'dumbbell chest press', 'db bench'] },
      { name: 'Dumbbell Squat', slug: 'dumbbell-squat', keywords: ['goblet squat', 'dumbbell squat', 'db squat'] },
      { name: 'Dumbbell Row', slug: 'dumbbell-row', keywords: ['dumbbell row', 'single arm row', 'db row'] },
      { name: 'Dumbbell Shoulder Press', slug: 'dumbbell-shoulder-press', keywords: ['dumbbell press', 'db shoulder press', 'overhead dumbbell'] },
    ]
  },
  tier2: {
    name: 'Common Isolation (SHOULD HAVE)',
    priority: 2,
    exercises: [
      { name: 'Dumbbell Lateral Raise', slug: 'dumbbell-lateral-raise', keywords: ['lateral raise', 'side raise', 'dumbbell raise'] },
      { name: 'Cable Face Pull', slug: 'cable-face-pull', keywords: ['face pull', 'rear delt', 'cable pull'] },
      { name: 'Dumbbell Bicep Curl', slug: 'dumbbell-bicep-curl', keywords: ['bicep curl', 'dumbbell curl', 'arm curl'] },
      { name: 'Dumbbell Hammer Curl', slug: 'dumbbell-hammer-curl', keywords: ['hammer curl', 'neutral grip curl'] },
      { name: 'Cable Tricep Pushdown', slug: 'cable-tricep-pushdown', keywords: ['tricep pushdown', 'rope pushdown', 'tricep extension cable'] },
      { name: 'Dumbbell Tricep Extension', slug: 'dumbbell-tricep-extension', keywords: ['overhead extension', 'tricep extension', 'skull crusher'] },
      { name: 'Cable Chest Fly', slug: 'cable-chest-fly', keywords: ['cable fly', 'cable crossover', 'chest fly'] },
      { name: 'Dumbbell Incline Press', slug: 'dumbbell-incline-press', keywords: ['incline press', 'incline dumbbell', 'upper chest'] },
      { name: 'Machine Pec Deck', slug: 'machine-pec-deck', keywords: ['pec deck', 'chest fly machine', 'pec fly'] },
      { name: 'Machine Chest Press', slug: 'machine-chest-press', keywords: ['chest press machine', 'machine press'] },
      { name: 'Cable Lat Pulldown', slug: 'cable-lat-pulldown', keywords: ['lat pulldown', 'pulldown', 'lat pull'] },
      { name: 'Cable Seated Row', slug: 'cable-seated-row', keywords: ['seated row', 'cable row', 'low row'] },
      { name: 'Dumbbell Romanian Deadlift', slug: 'dumbbell-romanian-deadlift', keywords: ['rdl', 'romanian deadlift', 'stiff leg'] },
      { name: 'Machine Leg Press', slug: 'machine-leg-press', keywords: ['leg press', 'leg press machine', '45 degree press'] },
      { name: 'Machine Leg Curl', slug: 'machine-leg-curl', keywords: ['leg curl', 'hamstring curl', 'lying curl'] },
      { name: 'Machine Leg Extension', slug: 'machine-leg-extension', keywords: ['leg extension', 'quad extension'] },
      { name: 'Dumbbell Lunge', slug: 'dumbbell-lunge', keywords: ['lunge', 'walking lunge', 'forward lunge'] },
      { name: 'Cable Woodchop', slug: 'cable-woodchop', keywords: ['woodchop', 'wood chop', 'cable chop'] },
      { name: 'Bodyweight Plank', slug: 'bodyweight-plank', keywords: ['plank', 'front plank', 'core hold'] },
      { name: 'Cable Crunch', slug: 'cable-crunch', keywords: ['cable crunch', 'kneeling crunch', 'ab crunch'] },
    ]
  },
  tier3: {
    name: 'Equipment Variants (NICE TO HAVE)',
    priority: 3,
    exercises: [
      { name: 'Smith Machine Bench Press', slug: 'smith-machine-bench-press', keywords: ['smith bench', 'smith machine press'] },
      { name: 'Smith Machine Squat', slug: 'smith-machine-squat', keywords: ['smith squat', 'smith machine squat'] },
      { name: 'Bodyweight Push-up', slug: 'bodyweight-push-up', keywords: ['push up', 'pushup', 'press up'] },
      { name: 'Bodyweight Dip', slug: 'bodyweight-dip', keywords: ['dip', 'parallel bar dip', 'chest dip'] },
      { name: 'Bodyweight Squat', slug: 'bodyweight-squat', keywords: ['air squat', 'bodyweight squat', 'squat'] },
      { name: 'Band Pull Apart', slug: 'band-pull-apart', keywords: ['band pull', 'resistance band', 'band rear delt'] },
      { name: 'Band Row', slug: 'band-row', keywords: ['resistance band row', 'band row'] },
      { name: 'Machine Shoulder Press', slug: 'machine-shoulder-press', keywords: ['shoulder press machine', 'overhead press machine'] },
      { name: 'Machine Hack Squat', slug: 'machine-hack-squat', keywords: ['hack squat', 'hack squat machine'] },
    ]
  }
};

/**
 * Generate LottieFiles search URL for an exercise
 */
function generateSearchUrl(exercise) {
  const primaryKeyword = exercise.keywords[0];
  const encodedQuery = encodeURIComponent(primaryKeyword);
  return `https://lottiefiles.com/search?q=${encodedQuery}&category=exercise`;
}

/**
 * Generate markdown checklist
 */
function generateChecklist() {
  let markdown = `# Lottie Animation Download Checklist

**Generated:** ${new Date().toISOString()}

This checklist helps you download 40-50 exercise animations from LottieFiles.

## 📋 Instructions

For each exercise below:
1. Click the **Search URL** to find animations on LottieFiles
2. Browse results and select best match (stick figure, clear movement, < 150KB)
3. Click **Download** → **Lottie JSON**
4. Save to \`~/Downloads\` (browser default)
5. Check the box ✅ when done

After downloading all animations, run:
\`\`\`bash
node scripts/organize-animations.js
\`\`\`

This will automatically rename and organize all animations.

---

`;

  // Generate sections for each tier
  Object.entries(EXERCISE_CATALOG).forEach(([tierKey, tier]) => {
    markdown += `## ${tier.name}\n\n`;
    markdown += `**Priority:** ${tier.priority === 1 ? '🔴 HIGH' : tier.priority === 2 ? '🟡 MEDIUM' : '🟢 LOW'}\n\n`;

    tier.exercises.forEach((exercise, index) => {
      const searchUrl = generateSearchUrl(exercise);

      markdown += `### ${index + 1}. ${exercise.name}\n\n`;
      markdown += `- **File name:** \`${exercise.slug}.json\`\n`;
      markdown += `- **Search URL:** [🔍 Find on LottieFiles](${searchUrl})\n`;
      markdown += `- **Keywords:** ${exercise.keywords.join(', ')}\n`;
      markdown += `- **Status:** ☐ Not downloaded\n`;
      markdown += `\n`;
    });

    markdown += `---\n\n`;
  });

  // Add tips section
  markdown += `## 💡 Selection Tips

When browsing LottieFiles animations:

**Look for:**
- ✅ Stick figures or simple characters (consistent style)
- ✅ Clear, recognizable movement
- ✅ Smooth looping
- ✅ File size < 150KB
- ✅ Free license (check before downloading)

**Avoid:**
- ❌ Overly detailed/realistic characters
- ❌ Branded animations
- ❌ Complex backgrounds
- ❌ Files > 200KB
- ❌ Paid/premium animations (unless you have license)

**Quality Check:**
- Preview animation before downloading
- Verify movement matches exercise
- Check if loop is smooth
- Confirm license allows commercial use

## 📊 Progress Tracking

**Total exercises:** ${
  EXERCISE_CATALOG.tier1.exercises.length +
  EXERCISE_CATALOG.tier2.exercises.length +
  EXERCISE_CATALOG.tier3.exercises.length
}

**Completed:** _____ / ${
  EXERCISE_CATALOG.tier1.exercises.length +
  EXERCISE_CATALOG.tier2.exercises.length +
  EXERCISE_CATALOG.tier3.exercises.length
}

**Estimated time:** 1-2 hours (1-2 minutes per animation)

## 🚀 Next Steps

After downloading all animations:

1. Run organization script:
   \`\`\`bash
   node scripts/organize-animations.js
   \`\`\`

2. Verify animations loaded:
   \`\`\`bash
   npm run dev
   # Generate a workout and check PlayCircle icons
   \`\`\`

3. Check animation manifest:
   \`\`\`
   cat public/animations/exercises/ANIMATIONS_MANIFEST.md
   \`\`\`

---

**Questions?** See \`public/animations/exercises/README.md\` for troubleshooting.
`;

  return markdown;
}

/**
 * Main execution
 */
function main() {
  console.log('🎬 Generating animation download checklist...\n');

  const markdown = generateChecklist();

  const outputPath = path.join(__dirname, '../public/animations/exercises/DOWNLOAD_CHECKLIST.md');

  // Ensure directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(outputPath, markdown, 'utf8');

  const totalExercises =
    EXERCISE_CATALOG.tier1.exercises.length +
    EXERCISE_CATALOG.tier2.exercises.length +
    EXERCISE_CATALOG.tier3.exercises.length;

  console.log(`✅ Checklist generated successfully!`);
  console.log(`📄 Output: ${outputPath}`);
  console.log(`📊 Total exercises: ${totalExercises}`);
  console.log(`⏱️  Estimated download time: 1-2 hours\n`);
  console.log(`🚀 Next steps:`);
  console.log(`   1. Open DOWNLOAD_CHECKLIST.md`);
  console.log(`   2. Click through each search URL`);
  console.log(`   3. Download animations to ~/Downloads`);
  console.log(`   4. Run: node scripts/organize-animations.js\n`);
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { EXERCISE_CATALOG, generateSearchUrl, generateChecklist };
