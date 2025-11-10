#!/usr/bin/env ts-node

/**
 * Animation Generator Script
 * Generates Lottie JSON animations programmatically and saves them to disk
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateBarbellSquat } from '../lib/generators/exercises/barbell-squat';

const OUTPUT_DIR = path.join(__dirname, '../public/animations/exercises');

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created output directory: ${OUTPUT_DIR}`);
  }
}

/**
 * Save animation to file
 */
function saveAnimation(filename: string, animation: any) {
  const filePath = path.join(OUTPUT_DIR, filename);
  const json = JSON.stringify(animation, null, 2);
  fs.writeFileSync(filePath, json, 'utf8');
  console.log(`✅ Generated: ${filename} (${(json.length / 1024).toFixed(1)}KB)`);
}

/**
 * Generate all test animations
 */
function generateTestAnimations() {
  console.log('🎬 Generating Exercise Animations\n');
  ensureOutputDir();

  // Generate squat
  console.log('[1/1] Barbell Squat...');
  const squatAnimation = generateBarbellSquat();
  saveAnimation('barbell-squat.json', squatAnimation);

  console.log('\n✅ Animation generation complete!');
  console.log(`📂 Output: ${OUTPUT_DIR}`);
  console.log('\n🚀 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Generate a workout with squats');
  console.log('   3. Click the PlayCircle icon to test the animation\n');
}

// Run if executed directly
if (require.main === module) {
  generateTestAnimations();
}

export { generateTestAnimations };
