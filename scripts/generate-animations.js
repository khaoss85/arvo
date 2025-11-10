#!/usr/bin/env node

/**
 * Animation Generator Script
 * Generates Lottie JSON animations programmatically and saves them to disk
 */

const fs = require('fs');
const path = require('path');
const { generateBarbellBenchPress } = require('../lib/generators/exercises/barbell-bench-press');

const OUTPUT_DIR = path.join(__dirname, '../public/animations/exercises');

/**
 * Generate barbell squat animation
 */
function generateBarbellSquat() {
  const FPS = 30;
  const DURATION_SECONDS = 3;
  const TOTAL_FRAMES = FPS * DURATION_SECONDS;

  // Standing pose
  const standingPose = {
    headX: 200,
    headY: 80,
    neckX: 200,
    neckY: 100,
    hipsX: 200,
    hipsY: 180,
    leftShoulderX: 160,
    leftShoulderY: 110,
    leftElbowX: 140,
    leftElbowY: 100,
    leftHandX: 130,
    leftHandY: 95,
    rightShoulderX: 240,
    rightShoulderY: 110,
    rightElbowX: 260,
    rightElbowY: 100,
    rightHandX: 270,
    rightHandY: 95,
    leftHipX: 180,
    leftHipY: 180,
    leftKneeX: 180,
    leftKneeY: 240,
    leftFootX: 175,
    leftFootY: 295,
    rightHipX: 220,
    rightHipY: 180,
    rightKneeX: 220,
    rightKneeY: 240,
    rightFootX: 225,
    rightFootY: 295,
  };

  // Squat bottom pose
  const squatPose = {
    headX: 205,
    headY: 140,
    neckX: 205,
    neckY: 160,
    hipsX: 195,
    hipsY: 240,
    leftShoulderX: 165,
    leftShoulderY: 170,
    leftElbowX: 140,
    leftElbowY: 155,
    leftHandX: 130,
    leftHandY: 150,
    rightShoulderX: 245,
    rightShoulderY: 170,
    rightElbowX: 270,
    rightElbowY: 155,
    rightHandX: 280,
    rightHandY: 150,
    leftHipX: 185,
    leftHipY: 240,
    leftKneeX: 150,
    leftKneeY: 270,
    leftFootX: 175,
    leftFootY: 295,
    rightHipX: 215,
    rightHipY: 240,
    rightKneeX: 260,
    rightKneeY: 270,
    rightFootX: 225,
    rightFootY: 295,
  };

  // Frame timings
  const frames = {
    start: 0,
    down: Math.floor(TOTAL_FRAMES * 0.4),
    bottom: Math.floor(TOTAL_FRAMES * 0.5),
    up: Math.floor(TOTAL_FRAMES * 0.9),
  };

  // Animation structure
  return {
    v: '5.5.2',
    nm: 'Barbell Squat',
    fr: FPS,
    ip: 0,
    op: TOTAL_FRAMES,
    w: 400,
    h: 400,
    ddd: 0,
    layers: [
      // Head layer
      createHeadLayer(1, standingPose, squatPose, frames, TOTAL_FRAMES),
      // Torso layer
      createTorsoLayer(2, standingPose, squatPose, frames, TOTAL_FRAMES),
      // Left arm layers
      createLeftUpperArmLayer(3, standingPose, squatPose, frames, TOTAL_FRAMES),
      createLeftForearmLayer(4, standingPose, squatPose, frames, TOTAL_FRAMES),
      // Right arm layers
      createRightUpperArmLayer(5, standingPose, squatPose, frames, TOTAL_FRAMES),
      createRightForearmLayer(6, standingPose, squatPose, frames, TOTAL_FRAMES),
      // Left leg layers
      createLeftThighLayer(7, standingPose, squatPose, frames, TOTAL_FRAMES),
      createLeftCalfLayer(8, standingPose, squatPose, frames, TOTAL_FRAMES),
      // Right leg layers
      createRightThighLayer(9, standingPose, squatPose, frames, TOTAL_FRAMES),
      createRightCalfLayer(10, standingPose, squatPose, frames, TOTAL_FRAMES),
      // Barbell layer
      createBarbellLayer(11, frames, TOTAL_FRAMES),
    ],
  };
}

// Helper functions to create layers
function createHeadLayer(index, standing, squat, frames, totalFrames) {
  return {
    ty: 4,
    nm: 'Head',
    ind: index,
    ip: 0,
    op: totalFrames,
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
        ty: 'el',
        nm: 'Head Circle',
        p: {
          a: 1,
          k: [
            { t: frames.start, s: [standing.headX, standing.headY], i: { x: [0.42], y: [0] }, o: { x: [0.58], y: [1] } },
            { t: frames.down, s: [squat.headX, squat.headY], i: { x: [0.42], y: [0] }, o: { x: [0.58], y: [1] } },
            { t: frames.up, s: [standing.headX, standing.headY] },
          ],
        },
        s: { a: 0, k: [40, 40] },
      },
      {
        ty: 'st',
        nm: 'Stroke',
        c: { a: 0, k: [1, 1, 1] },
        o: { a: 0, k: 100 },
        w: { a: 0, k: 3 },
        lc: 2,
        lj: 2,
        ml: 4,
      },
    ],
  };
}

function createTorsoLayer(index, standing, squat, frames, totalFrames) {
  return {
    ty: 4,
    nm: 'Torso',
    ind: index,
    ip: 0,
    op: totalFrames,
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
        ty: 'sh',
        nm: 'Torso Path',
        ks: {
          a: 1,
          k: [
            {
              t: frames.start,
              s: [{ c: false, v: [[standing.neckX, standing.neckY], [standing.hipsX, standing.hipsY]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
              i: { x: [0.42], y: [0] },
              o: { x: [0.58], y: [1] },
            },
            {
              t: frames.down,
              s: [{ c: false, v: [[squat.neckX, squat.neckY], [squat.hipsX, squat.hipsY]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
              i: { x: [0.42], y: [0] },
              o: { x: [0.58], y: [1] },
            },
            {
              t: frames.up,
              s: [{ c: false, v: [[standing.neckX, standing.neckY], [standing.hipsX, standing.hipsY]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
            },
          ],
        },
      },
      {
        ty: 'st',
        nm: 'Stroke',
        c: { a: 0, k: [1, 1, 1] },
        o: { a: 0, k: 100 },
        w: { a: 0, k: 3 },
        lc: 2,
        lj: 2,
        ml: 4,
      },
    ],
  };
}

function createLeftUpperArmLayer(index, standing, squat, frames, totalFrames) {
  return createLineLayer(
    index,
    'Left Upper Arm',
    [standing.leftShoulderX, standing.leftShoulderY],
    [standing.leftElbowX, standing.leftElbowY],
    [squat.leftShoulderX, squat.leftShoulderY],
    [squat.leftElbowX, squat.leftElbowY],
    frames,
    totalFrames
  );
}

function createLeftForearmLayer(index, standing, squat, frames, totalFrames) {
  return createLineLayer(
    index,
    'Left Forearm',
    [standing.leftElbowX, standing.leftElbowY],
    [standing.leftHandX, standing.leftHandY],
    [squat.leftElbowX, squat.leftElbowY],
    [squat.leftHandX, squat.leftHandY],
    frames,
    totalFrames
  );
}

function createRightUpperArmLayer(index, standing, squat, frames, totalFrames) {
  return createLineLayer(
    index,
    'Right Upper Arm',
    [standing.rightShoulderX, standing.rightShoulderY],
    [standing.rightElbowX, standing.rightElbowY],
    [squat.rightShoulderX, squat.rightShoulderY],
    [squat.rightElbowX, squat.rightElbowY],
    frames,
    totalFrames
  );
}

function createRightForearmLayer(index, standing, squat, frames, totalFrames) {
  return createLineLayer(
    index,
    'Right Forearm',
    [standing.rightElbowX, standing.rightElbowY],
    [standing.rightHandX, standing.rightHandY],
    [squat.rightElbowX, squat.rightElbowY],
    [squat.rightHandX, squat.rightHandY],
    frames,
    totalFrames
  );
}

function createLeftThighLayer(index, standing, squat, frames, totalFrames) {
  return createLineLayer(
    index,
    'Left Thigh',
    [standing.leftHipX, standing.leftHipY],
    [standing.leftKneeX, standing.leftKneeY],
    [squat.leftHipX, squat.leftHipY],
    [squat.leftKneeX, squat.leftKneeY],
    frames,
    totalFrames
  );
}

function createLeftCalfLayer(index, standing, squat, frames, totalFrames) {
  return createLineLayer(
    index,
    'Left Calf',
    [standing.leftKneeX, standing.leftKneeY],
    [standing.leftFootX, standing.leftFootY],
    [squat.leftKneeX, squat.leftKneeY],
    [squat.leftFootX, squat.leftFootY],
    frames,
    totalFrames
  );
}

function createRightThighLayer(index, standing, squat, frames, totalFrames) {
  return createLineLayer(
    index,
    'Right Thigh',
    [standing.rightHipX, standing.rightHipY],
    [standing.rightKneeX, standing.rightKneeY],
    [squat.rightHipX, squat.rightHipY],
    [squat.rightKneeX, squat.rightKneeY],
    frames,
    totalFrames
  );
}

function createRightCalfLayer(index, standing, squat, frames, totalFrames) {
  return createLineLayer(
    index,
    'Right Calf',
    [standing.rightKneeX, standing.rightKneeY],
    [standing.rightFootX, standing.rightFootY],
    [squat.rightKneeX, squat.rightKneeY],
    [squat.rightFootX, squat.rightFootY],
    frames,
    totalFrames
  );
}

function createLineLayer(index, name, standStart, standEnd, squatStart, squatEnd, frames, totalFrames) {
  return {
    ty: 4,
    nm: name,
    ind: index,
    ip: 0,
    op: totalFrames,
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
        ty: 'sh',
        nm: name + ' Path',
        ks: {
          a: 1,
          k: [
            {
              t: frames.start,
              s: [{ c: false, v: [standStart, standEnd], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
              i: { x: [0.42], y: [0] },
              o: { x: [0.58], y: [1] },
            },
            {
              t: frames.down,
              s: [{ c: false, v: [squatStart, squatEnd], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
              i: { x: [0.42], y: [0] },
              o: { x: [0.58], y: [1] },
            },
            {
              t: frames.up,
              s: [{ c: false, v: [standStart, standEnd], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
            },
          ],
        },
      },
      {
        ty: 'st',
        nm: 'Stroke',
        c: { a: 0, k: [1, 1, 1] },
        o: { a: 0, k: 100 },
        w: { a: 0, k: 3 },
        lc: 2,
        lj: 2,
        ml: 4,
      },
    ],
  };
}

function createBarbellLayer(index, frames, totalFrames) {
  const standingY = 95;
  const squatY = 150;

  return {
    ty: 4,
    nm: 'Barbell',
    ind: index,
    ip: 0,
    op: totalFrames,
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
        ty: 'sh',
        nm: 'Barbell Bar',
        ks: {
          a: 1,
          k: [
            {
              t: frames.start,
              s: [{ c: false, v: [[120, standingY], [280, standingY]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
              i: { x: [0.42], y: [0] },
              o: { x: [0.58], y: [1] },
            },
            {
              t: frames.down,
              s: [{ c: false, v: [[120, squatY], [280, squatY]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
              i: { x: [0.42], y: [0] },
              o: { x: [0.58], y: [1] },
            },
            {
              t: frames.up,
              s: [{ c: false, v: [[120, standingY], [280, standingY]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
            },
          ],
        },
      },
      {
        ty: 'st',
        nm: 'Stroke',
        c: { a: 0, k: [1, 1, 1] },
        o: { a: 0, k: 100 },
        w: { a: 0, k: 4 },
        lc: 2,
        lj: 2,
        ml: 4,
      },
    ],
  };
}

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
function saveAnimation(filename, animation) {
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

  console.log('[1/2] Barbell Squat...');
  const squatAnimation = generateBarbellSquat();
  saveAnimation('barbell-squat.json', squatAnimation);

  console.log('[2/2] Barbell Bench Press...');
  const benchAnimation = generateBarbellBenchPress();
  saveAnimation('barbell-bench-press.json', benchAnimation);

  console.log('\n✅ Animation generation complete!');
  console.log(`📂 Output: ${OUTPUT_DIR}`);
  console.log('📊 Generated: 2 animations');
  console.log('\n🚀 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Generate a workout with squat or bench press');
  console.log('   3. Click the PlayCircle icon to test the animations\n');
}

// Run if executed directly
if (require.main === module) {
  generateTestAnimations();
}

module.exports = { generateTestAnimations, generateBarbellSquat };
