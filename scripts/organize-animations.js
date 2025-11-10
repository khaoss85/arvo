#!/usr/bin/env node

/**
 * organize-animations.js
 *
 * Organizes downloaded Lottie animations:
 * - Scans ~/Downloads for .json files
 * - Validates Lottie format
 * - Checks file sizes (warns if > 150KB)
 * - Renames to slug format (if needed)
 * - Moves to public/animations/exercises/
 * - Generates ANIMATIONS_MANIFEST.md
 *
 * Usage:
 *   node scripts/organize-animations.js
 *
 * Options:
 *   --source <path>   Custom source directory (default: ~/Downloads)
 *   --dry-run         Show what would be done without moving files
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Default source is Downloads folder
const DEFAULT_SOURCE = path.join(os.homedir(), 'Downloads');
const TARGET_DIR = path.join(__dirname, '../public/animations/exercises');
const MAX_SIZE_KB = 150;
const WARN_SIZE_KB = 200;

/**
 * Normalize string to slug format
 */
function normalizeToSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if file is a valid Lottie JSON
 */
function isValidLottie(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);

    // Basic Lottie validation: must have 'v' (version) and 'layers'
    return json && json.v && json.layers;
  } catch (err) {
    return false;
  }
}

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
  const stats = fs.statSync(filePath);
  return Math.round(stats.size / 1024);
}

/**
 * Find all .json files in source directory
 */
function findJsonFiles(sourceDir) {
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source directory not found: ${sourceDir}`);
    return [];
  }

  const files = fs.readdirSync(sourceDir);
  return files
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(sourceDir, file));
}

/**
 * Suggest slug name based on file name
 */
function suggestSlugName(fileName) {
  // Remove extension
  const nameWithoutExt = path.basename(fileName, '.json');

  // Already in slug format?
  if (/^[a-z0-9-]+$/.test(nameWithoutExt)) {
    return nameWithoutExt;
  }

  // Try to normalize
  return normalizeToSlug(nameWithoutExt);
}

/**
 * Process and move animations
 */
function processAnimations(sourceDir, dryRun = false) {
  console.log(`🔍 Scanning for animations in: ${sourceDir}\n`);

  const jsonFiles = findJsonFiles(sourceDir);

  if (jsonFiles.length === 0) {
    console.log('⚠️  No .json files found in source directory.');
    console.log('💡 Tip: Download animations from LottieFiles first.\n');
    return { processed: 0, moved: 0, warnings: [] };
  }

  console.log(`Found ${jsonFiles.length} JSON files\n`);

  const results = {
    processed: 0,
    moved: 0,
    skipped: 0,
    warnings: []
  };

  const movedFiles = [];

  jsonFiles.forEach((filePath, index) => {
    const fileName = path.basename(filePath);
    console.log(`[${index + 1}/${jsonFiles.length}] Processing: ${fileName}`);

    // Validate Lottie format
    if (!isValidLottie(filePath)) {
      console.log(`   ⚠️  SKIP: Not a valid Lottie file\n`);
      results.skipped++;
      results.warnings.push(`${fileName}: Not a valid Lottie file`);
      return;
    }

    // Check file size
    const sizeKB = getFileSizeKB(filePath);
    if (sizeKB > WARN_SIZE_KB) {
      console.log(`   ⚠️  WARNING: File size ${sizeKB}KB (> ${WARN_SIZE_KB}KB recommended)`);
      results.warnings.push(`${fileName}: Large file size (${sizeKB}KB)`);
    } else if (sizeKB > MAX_SIZE_KB) {
      console.log(`   ⚡ File size: ${sizeKB}KB (consider optimizing if > ${MAX_SIZE_KB}KB)`);
    } else {
      console.log(`   ✓ File size: ${sizeKB}KB`);
    }

    // Suggest slug name
    const suggestedSlug = suggestSlugName(fileName);
    const targetFileName = suggestedSlug + '.json';
    const targetPath = path.join(TARGET_DIR, targetFileName);

    // Check if target already exists
    if (fs.existsSync(targetPath)) {
      console.log(`   ⚠️  SKIP: File already exists at target: ${targetFileName}\n`);
      results.skipped++;
      return;
    }

    // Move or simulate move
    if (dryRun) {
      console.log(`   [DRY RUN] Would move to: ${targetFileName}`);
      console.log(`   [DRY RUN] Target: ${targetPath}\n`);
    } else {
      // Ensure target directory exists
      if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
      }

      // Copy file (safer than move)
      fs.copyFileSync(filePath, targetPath);
      console.log(`   ✅ Moved to: ${targetFileName}\n`);

      movedFiles.push({
        original: fileName,
        slug: targetFileName,
        size: sizeKB,
        path: targetPath
      });

      results.moved++;
    }

    results.processed++;
  });

  // Generate manifest
  if (!dryRun && movedFiles.length > 0) {
    generateManifest(movedFiles);
  }

  return results;
}

/**
 * Generate ANIMATIONS_MANIFEST.md
 */
function generateManifest(files) {
  const manifestPath = path.join(TARGET_DIR, 'ANIMATIONS_MANIFEST.md');

  let markdown = `# Animations Manifest

**Generated:** ${new Date().toISOString()}
**Total animations:** ${files.length}

This file lists all available Lottie animations in this directory.

## 📊 Statistics

- **Total files:** ${files.length}
- **Total size:** ${files.reduce((sum, f) => sum + f.size, 0)}KB
- **Average size:** ${Math.round(files.reduce((sum, f) => sum + f.size, 0) / files.length)}KB
- **Largest file:** ${Math.max(...files.map(f => f.size))}KB
- **Smallest file:** ${Math.min(...files.map(f => f.size))}KB

## 📁 Available Animations

| Slug | Original Name | Size | Status |
|------|---------------|------|--------|
`;

  // Sort by slug name
  files.sort((a, b) => a.slug.localeCompare(b.slug));

  files.forEach(file => {
    const status = file.size > 150 ? '⚠️ Large' : '✅ OK';
    markdown += `| \`${file.slug}\` | ${file.original} | ${file.size}KB | ${status} |\n`;
  });

  markdown += `\n## 🎯 Usage

These animations are automatically mapped by \`AnimationService\` based on exercise names.

**Example:**
- Exercise: "Barbell Bench Press"
- Slug: \`barbell-bench-press\`
- Animation file: \`barbell-bench-press.json\`

See \`lib/services/animation.service.ts\` for mapping logic.

## 🔧 File Size Recommendations

- **Target:** 50-150KB per animation
- **Maximum:** 200KB (optimize if larger)
- **Tools:** [LottieFiles Optimizer](https://lottiefiles.com/tools/lottie-optimizer)

## ✅ Quality Checklist

For each animation:
- [ ] File size < 150KB
- [ ] Valid Lottie JSON format
- [ ] Smooth looping
- [ ] Clear movement
- [ ] Free/commercial license

## 📚 Resources

- **LottieFiles:** https://lottiefiles.com
- **Optimizer:** https://lottiefiles.com/tools/lottie-optimizer
- **Documentation:** See \`README.md\` in this directory
`;

  fs.writeFileSync(manifestPath, markdown, 'utf8');
  console.log(`\n📄 Generated manifest: ${manifestPath}`);
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let sourceDir = DEFAULT_SOURCE;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && args[i + 1]) {
      sourceDir = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  console.log('🎬 Organizing Lottie Animations\n');
  console.log(`📂 Source: ${sourceDir}`);
  console.log(`📂 Target: ${TARGET_DIR}`);
  console.log(`🔧 Mode: ${dryRun ? 'DRY RUN (simulation)' : 'LIVE (will move files)'}\n`);

  const results = processAnimations(sourceDir, dryRun);

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Processed: ${results.processed}`);
  console.log(`📦 Moved: ${results.moved}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);

  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }

  if (!dryRun && results.moved > 0) {
    console.log('\n✅ SUCCESS! Animations organized.');
    console.log('\n🚀 Next steps:');
    console.log('   1. Check ANIMATIONS_MANIFEST.md for full list');
    console.log('   2. Run: npm run dev');
    console.log('   3. Generate a workout and test PlayCircle icons');
    console.log('   4. Verify animations load correctly\n');
  } else if (dryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to move files.\n');
  } else if (results.moved === 0) {
    console.log('\n⚠️  No animations were moved.');
    console.log('💡 Make sure you downloaded .json files from LottieFiles first.\n');
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { normalizeToSlug, isValidLottie, getFileSizeKB, processAnimations };
