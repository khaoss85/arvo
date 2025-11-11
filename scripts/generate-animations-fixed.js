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
 * Create a stroke (cyan with alpha, 5px)
 * Cyan color provides excellent contrast on dark backgrounds
 * RGBA format ensures proper rendering across all Lottie players
 */
function createStroke() {
  return {
    ty: 'st',
    nm: 'Stroke',
    c: { a: 0, k: [0.2, 0.8, 1, 1] }, // cyan RGBA - alpha channel ensures visibility
    o: { a: 0, k: 100 },
    w: { a: 0, k: 5 }, // increased from 3 to 5 for better visibility
    lc: 2,
    lj: 2,
    ml: 4,
  };
}

/**
 * Generate simple test animation - single circle
 * Centered layer with shape at relative [0,0] position
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
          p: { a: 0, k: [200, 200] }, // Center layer in 400x400 canvas
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
        shapes: [
          {
            ty: 'gr',
            nm: 'Circle Group',
            it: [
              {
                ty: 'el',
                nm: 'Circle',
                p: { a: 0, k: [0, 0] }, // Position relative to layer center
                s: { a: 0, k: [80, 80] },
                d: 1,
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
 * Generate barbell bench press with correct structure
 * Figure is horizontal (lying on bench) for proper bench press representation
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
      // Head - static circle (left side, lying down)
      {
        ty: 4,
        nm: 'Head',
        ind: 1,
        ip: 0,
        op: TOTAL_FRAMES,
        sr: 1,
        ks: {
          p: { a: 0, k: [200, 200] }, // Center layer in canvas
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
                p: { a: 0, k: [-100, 0] }, // Left side (horizontal position)
                s: { a: 0, k: [40, 40] },
                d: 1,
              },
              createStroke(),
              createTransform(),
            ],
          },
        ],
      },
      // Torso - horizontal line (neck to hips)
      {
        ty: 4,
        nm: 'Torso',
        ind: 2,
        ip: 0,
        op: TOTAL_FRAMES,
        sr: 1,
        ks: {
          p: { a: 0, k: [200, 200] }, // Center layer
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
                    v: [[-80, 0], [80, 0]], // Horizontal: from neck (left) to hips (right)
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
      // Arms (both together - animated vertically)
      {
        ty: 4,
        nm: 'Arms',
        ind: 3,
        ip: 0,
        op: TOTAL_FRAMES,
        sr: 1,
        ks: {
          p: { a: 0, k: [200, 200] }, // Center layer
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
        shapes: [
          // Left arm (closer to viewer)
          {
            ty: 'gr',
            nm: 'Left Arm Group',
            it: [
              {
                ty: 'sh',
                nm: 'Left Arm',
                ks: {
                  a: 1,
                  k: [
                    {
                      t: frames.start,
                      s: [{
                        c: false,
                        v: [[-20, 0], [-20, -100]],  // Extended up (vertical)
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
                        v: [[-20, 0], [-20, 5]],  // At chest (barbell touches)
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
                        v: [[-20, 0], [-20, -100]],  // Extended up
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
          // Right arm (farther from viewer, slightly offset)
          {
            ty: 'gr',
            nm: 'Right Arm Group',
            it: [
              {
                ty: 'sh',
                nm: 'Right Arm',
                ks: {
                  a: 1,
                  k: [
                    {
                      t: frames.start,
                      s: [{
                        c: false,
                        v: [[20, 0], [20, -100]],  // Extended up (vertical)
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
                        v: [[20, 0], [20, 5]],  // At chest
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
                        v: [[20, 0], [20, -100]],  // Extended up
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
      // Barbell (animated vertically)
      {
        ty: 4,
        nm: 'Barbell',
        ind: 4,
        ip: 0,
        op: TOTAL_FRAMES,
        sr: 1,
        ks: {
          p: { a: 0, k: [200, 200] }, // Center layer
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
                        v: [[-60, -100], [60, -100]],  // Extended up (horizontal bar)
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
                        v: [[-60, 5], [60, 5]],  // At chest (horizontal bar)
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
                        v: [[-60, -100], [60, -100]],  // Extended up
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
      // Bench (static - beneath body)
      {
        ty: 4,
        nm: 'Bench',
        ind: 5,
        ip: 0,
        op: TOTAL_FRAMES,
        sr: 1,
        ks: {
          p: { a: 0, k: [200, 200] }, // Center layer
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
        shapes: [
          {
            ty: 'gr',
            nm: 'Bench Group',
            it: [
              {
                ty: 'sh',
                nm: 'Bench Top',
                ks: {
                  a: 0,
                  k: {
                    c: false,
                    v: [[-90, 20], [90, 20]],  // Horizontal line beneath body
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
      // Legs (bent - feet on floor)
      {
        ty: 4,
        nm: 'Legs',
        ind: 6,
        ip: 0,
        op: TOTAL_FRAMES,
        sr: 1,
        ks: {
          p: { a: 0, k: [200, 200] }, // Center layer
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
        shapes: [
          // Left leg (closer to viewer)
          {
            ty: 'gr',
            nm: 'Left Leg Group',
            it: [
              {
                ty: 'sh',
                nm: 'Left Thigh',
                ks: {
                  a: 0,
                  k: {
                    c: false,
                    v: [[60, 0], [60, 60]],  // From hips down
                    i: [[0, 0], [0, 0]],
                    o: [[0, 0], [0, 0]],
                  },
                },
              },
              createStroke(),
              createTransform(),
            ],
          },
          {
            ty: 'gr',
            nm: 'Left Calf Group',
            it: [
              {
                ty: 'sh',
                nm: 'Left Calf',
                ks: {
                  a: 0,
                  k: {
                    c: false,
                    v: [[60, 60], [60, 100]],  // Knee to floor
                    i: [[0, 0], [0, 0]],
                    o: [[0, 0], [0, 0]],
                  },
                },
              },
              createStroke(),
              createTransform(),
            ],
          },
          // Right leg (farther from viewer, offset)
          {
            ty: 'gr',
            nm: 'Right Leg Group',
            it: [
              {
                ty: 'sh',
                nm: 'Right Thigh',
                ks: {
                  a: 0,
                  k: {
                    c: false,
                    v: [[70, 0], [70, 60]],  // From hips down (offset)
                    i: [[0, 0], [0, 0]],
                    o: [[0, 0], [0, 0]],
                  },
                },
              },
              createStroke(),
              createTransform(),
            ],
          },
          {
            ty: 'gr',
            nm: 'Right Calf Group',
            it: [
              {
                ty: 'sh',
                nm: 'Right Calf',
                ks: {
                  a: 0,
                  k: {
                    c: false,
                    v: [[70, 60], [70, 100]],  // Knee to floor (offset)
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
