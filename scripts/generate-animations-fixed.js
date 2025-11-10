#!/usr/bin/env node

/**
 * Fixed Animation Generator - Correct Lottie Structure
 * Wraps shapes in groups with transforms as required by Lottie spec
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../public/animations/exercises');

/**
 * Create a transform object (required at end of every group)
 */
function createTransform() {
  return {
    ty: 'tr',
    p: { a: 0, k: [0, 0] },
    a: { a: 0, k: [0, 0] },
    s: { a: 0, k: [100, 100] },
    r: { a: 0, k: 0 },
    o: { a: 0, k: 100 },
  };
}

/**
 * Create a stroke (cyan, 5px)
 * Cyan color provides excellent contrast on dark backgrounds
 */
function createStroke() {
  return {
    ty: 'st',
    nm: 'Stroke',
    c: { a: 0, k: [0.2, 0.8, 1] }, // cyan - highly visible on dark backgrounds
    o: { a: 0, k: 100 },
    w: { a: 0, k: 5 }, // increased from 3 to 5 for better visibility
    lc: 2,
    lj: 2,
    ml: 4,
  };
}

/**
 * Generate simple test animation - single circle
 */
function generateSimpleTest() {
  return {
    v: '5.5.2',
    nm: 'Simple Test',
    fr: 30,
    ip: 0,
    op: 90,
    w: 400,
    h: 400,
    ddd: 0,
    layers: [
      {
        ty: 4,
        nm: 'Circle',
        ind: 1,
        ip: 0,
        op: 90,
        sr: 1,
        ks: {
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
        shapes: [
          {
            ty: 'gr',  // ← GROUP (this was missing!)
            nm: 'Circle Group',
            it: [
              {
                ty: 'el',
                nm: 'Circle',
                p: { a: 0, k: [200, 200] },
                s: { a: 0, k: [80, 80] },
                d: 1,  // ← direction flag
              },
              createStroke(),
              createTransform(),  // ← transform at end of group
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Generate barbell bench press with correct structure
 */
function generateBarbellBenchPress() {
  const FPS = 30;
  const DURATION = 3;
  const TOTAL_FRAMES = FPS * DURATION;

  const frames = {
    start: 0,
    down: Math.floor(TOTAL_FRAMES * 0.4),
    up: Math.floor(TOTAL_FRAMES * 0.9),
  };

  return {
    v: '5.5.2',
    nm: 'Barbell Bench Press',
    fr: FPS,
    ip: 0,
    op: TOTAL_FRAMES,
    w: 400,
    h: 400,
    ddd: 0,
    layers: [
      // Head - static circle
      {
        ty: 4,
        nm: 'Head',
        ind: 1,
        ip: 0,
        op: TOTAL_FRAMES,
        sr: 1,
        ks: {
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
        shapes: [
          {
            ty: 'gr',
            nm: 'Head Group',
            it: [
              {
                ty: 'el',
                nm: 'Head Circle',
                p: { a: 0, k: [200, 180] },
                s: { a: 0, k: [40, 40] },
                d: 1,
              },
              createStroke(),
              createTransform(),
            ],
          },
        ],
      },
      // Torso - static line
      {
        ty: 4,
        nm: 'Torso',
        ind: 2,
        ip: 0,
        op: TOTAL_FRAMES,
        sr: 1,
        ks: {
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
        shapes: [
          {
            ty: 'gr',
            nm: 'Torso Group',
            it: [
              {
                ty: 'sh',
                nm: 'Torso Path',
                ks: {
                  a: 0,
                  k: {
                    c: false,
                    v: [[200, 200], [200, 280]],
                    i: [[0, 0], [0, 0]],
                    o: [[0, 0], [0, 0]],
                  },
                },
              },
              createStroke(),
              createTransform(),
            ],
          },
        ],
      },
      // Right arm (animato)
      {
        ty: 4,
        nm: 'Right Arm',
        ind: 3,
        ip: 0,
        op: TOTAL_FRAMES,
        sr: 1,
        ks: {
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
        shapes: [
          {
            ty: 'gr',
            nm: 'Arm Group',
            it: [
              {
                ty: 'sh',
                nm: 'Arm Path',
                ks: {
                  a: 1,
                  k: [
                    {
                      t: frames.start,
                      s: [{
                        c: false,
                        v: [[240, 210], [270, 120]],  // Extended
                        i: [[0, 0], [0, 0]],
                        o: [[0, 0], [0, 0]],
                      }],
                      i: { x: [0.42], y: [0] },
                      o: { x: [0.58], y: [1] },
                    },
                    {
                      t: frames.down,
                      s: [{
                        c: false,
                        v: [[240, 210], [270, 210]],  // At chest
                        i: [[0, 0], [0, 0]],
                        o: [[0, 0], [0, 0]],
                      }],
                      i: { x: [0.42], y: [0] },
                      o: { x: [0.58], y: [1] },
                    },
                    {
                      t: frames.up,
                      s: [{
                        c: false,
                        v: [[240, 210], [270, 120]],  // Extended
                        i: [[0, 0], [0, 0]],
                        o: [[0, 0], [0, 0]],
                      }],
                    },
                  ],
                },
              },
              createStroke(),
              createTransform(),
            ],
          },
        ],
      },
      // Left arm (simmetrico)
      {
        ty: 4,
        nm: 'Left Arm',
        ind: 4,
        ip: 0,
        op: TOTAL_FRAMES,
        sr: 1,
        ks: {
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
        shapes: [
          {
            ty: 'gr',
            nm: 'Arm Group',
            it: [
              {
                ty: 'sh',
                nm: 'Arm Path',
                ks: {
                  a: 1,
                  k: [
                    {
                      t: frames.start,
                      s: [{
                        c: false,
                        v: [[160, 210], [130, 120]],  // Extended
                        i: [[0, 0], [0, 0]],
                        o: [[0, 0], [0, 0]],
                      }],
                      i: { x: [0.42], y: [0] },
                      o: { x: [0.58], y: [1] },
                    },
                    {
                      t: frames.down,
                      s: [{
                        c: false,
                        v: [[160, 210], [130, 210]],  // At chest
                        i: [[0, 0], [0, 0]],
                        o: [[0, 0], [0, 0]],
                      }],
                      i: { x: [0.42], y: [0] },
                      o: { x: [0.58], y: [1] },
                    },
                    {
                      t: frames.up,
                      s: [{
                        c: false,
                        v: [[160, 210], [130, 120]],  // Extended
                        i: [[0, 0], [0, 0]],
                        o: [[0, 0], [0, 0]],
                      }],
                    },
                  ],
                },
              },
              createStroke(),
              createTransform(),
            ],
          },
        ],
      },
      // Barbell (animato)
      {
        ty: 4,
        nm: 'Barbell',
        ind: 5,
        ip: 0,
        op: TOTAL_FRAMES,
        sr: 1,
        ks: {
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
        shapes: [
          {
            ty: 'gr',
            nm: 'Barbell Group',
            it: [
              {
                ty: 'sh',
                nm: 'Barbell Bar',
                ks: {
                  a: 1,
                  k: [
                    {
                      t: frames.start,
                      s: [{
                        c: false,
                        v: [[120, 120], [280, 120]],  // Up
                        i: [[0, 0], [0, 0]],
                        o: [[0, 0], [0, 0]],
                      }],
                      i: { x: [0.42], y: [0] },
                      o: { x: [0.58], y: [1] },
                    },
                    {
                      t: frames.down,
                      s: [{
                        c: false,
                        v: [[120, 210], [280, 210]],  // Down at chest
                        i: [[0, 0], [0, 0]],
                        o: [[0, 0], [0, 0]],
                      }],
                      i: { x: [0.42], y: [0] },
                      o: { x: [0.58], y: [1] },
                    },
                    {
                      t: frames.up,
                      s: [{
                        c: false,
                        v: [[120, 120], [280, 120]],  // Up
                        i: [[0, 0], [0, 0]],
                        o: [[0, 0], [0, 0]],
                      }],
                    },
                  ],
                },
              },
              createStroke(),
              createTransform(),
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Save animation to file
 */
function saveAnimation(filename, animation) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const filePath = path.join(OUTPUT_DIR, filename);
  const json = JSON.stringify(animation, null, 2);
  fs.writeFileSync(filePath, json, 'utf8');
  console.log(`✅ Generated: ${filename} (${(json.length / 1024).toFixed(1)}KB)`);
}

/**
 * Main execution
 */
function main() {
  console.log('🎬 Generating Fixed Lottie Animations\n');

  console.log('[1/2] Simple Test Circle...');
  const testAnim = generateSimpleTest();
  saveAnimation('test-circle.json', testAnim);

  console.log('[2/2] Barbell Bench Press (Fixed)...');
  const benchAnim = generateBarbellBenchPress();
  saveAnimation('barbell-bench-press.json', benchAnim);

  console.log('\n✅ Generation complete!');
  console.log('📂 Output: ' + OUTPUT_DIR);
  console.log('\n🧪 Test on: https://lottiefiles.com/preview');
  console.log('   Upload the JSON file and verify it renders\n');
}

if (require.main === module) {
  main();
}

module.exports = { generateSimpleTest, generateBarbellBenchPress };
