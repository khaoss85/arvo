/**
 * Barbell Bench Press Animation Generator
 * Creates a Lottie animation of a barbell bench press
 */

/**
 * Generate barbell bench press animation
 * Movement: Arms extended → Lower to chest → Press up → Loop
 */
function generateBarbellBenchPress() {
  const FPS = 30;
  const DURATION_SECONDS = 3;
  const TOTAL_FRAMES = FPS * DURATION_SECONDS;

  // Top position (arms extended)
  const topPose = {
    headX: 200,
    headY: 180,
    neckX: 200,
    neckY: 200,
    hipsX: 200,
    hipsY: 280,
    // Arms extended upward (pressing position)
    leftShoulderX: 160,
    leftShoulderY: 210,
    leftElbowX: 140,
    leftElbowY: 150,
    leftHandX: 130,
    leftHandY: 120,
    rightShoulderX: 240,
    rightShoulderY: 210,
    rightElbowX: 260,
    rightElbowY: 150,
    rightHandX: 270,
    rightHandY: 120,
    // Legs (lying down, knees bent, feet on floor)
    leftHipX: 180,
    leftHipY: 280,
    leftKneeX: 165,
    leftKneeY: 240,
    leftFootX: 150,
    leftFootY: 280,
    rightHipX: 220,
    rightHipY: 280,
    rightKneeX: 235,
    rightKneeY: 240,
    rightFootX: 250,
    rightFootY: 280,
  };

  // Bottom position (barbell at chest)
  const bottomPose = {
    headX: 200,
    headY: 180,
    neckX: 200,
    neckY: 200,
    hipsX: 200,
    hipsY: 280,
    // Arms bent (barbell lowered to chest)
    leftShoulderX: 160,
    leftShoulderY: 210,
    leftElbowX: 120,
    leftElbowY: 220,
    leftHandX: 130,
    leftHandY: 210,
    rightShoulderX: 240,
    rightShoulderY: 210,
    rightElbowX: 280,
    rightElbowY: 220,
    rightHandX: 270,
    rightHandY: 210,
    // Legs (same position)
    leftHipX: 180,
    leftHipY: 280,
    leftKneeX: 165,
    leftKneeY: 240,
    leftFootX: 150,
    leftFootY: 280,
    rightHipX: 220,
    rightHipY: 280,
    rightKneeX: 235,
    rightKneeY: 240,
    rightFootX: 250,
    rightFootY: 280,
  };

  // Frame timings
  const frames = {
    start: 0,
    down: Math.floor(TOTAL_FRAMES * 0.4), // 40% lowering
    bottom: Math.floor(TOTAL_FRAMES * 0.5), // Hold at chest
    up: Math.floor(TOTAL_FRAMES * 0.9), // 40% pressing up
  };

  // Animation structure
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
      // Head layer
      createHeadLayer(1, topPose, bottomPose, frames, TOTAL_FRAMES),
      // Torso layer
      createTorsoLayer(2, topPose, bottomPose, frames, TOTAL_FRAMES),
      // Left arm layers
      createLeftUpperArmLayer(3, topPose, bottomPose, frames, TOTAL_FRAMES),
      createLeftForearmLayer(4, topPose, bottomPose, frames, TOTAL_FRAMES),
      // Right arm layers
      createRightUpperArmLayer(5, topPose, bottomPose, frames, TOTAL_FRAMES),
      createRightForearmLayer(6, topPose, bottomPose, frames, TOTAL_FRAMES),
      // Left leg layers
      createLeftThighLayer(7, topPose, bottomPose, frames, TOTAL_FRAMES),
      createLeftCalfLayer(8, topPose, bottomPose, frames, TOTAL_FRAMES),
      // Right leg layers
      createRightThighLayer(9, topPose, bottomPose, frames, TOTAL_FRAMES),
      createRightCalfLayer(10, topPose, bottomPose, frames, TOTAL_FRAMES),
      // Barbell layer
      createBarbellLayer(11, frames, TOTAL_FRAMES),
      // Bench layer (static)
      createBenchLayer(12, TOTAL_FRAMES),
    ],
  };
}

// Helper functions (same as squat, reused)
function createHeadLayer(index, top, bottom, frames, totalFrames) {
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
        p: { a: 0, k: [top.headX, top.headY] }, // Head stays static
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

function createTorsoLayer(index, top, bottom, frames, totalFrames) {
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
          a: 0, // Static torso
          k: {
            c: false,
            v: [[top.neckX, top.neckY], [top.hipsX, top.hipsY]],
            i: [[0, 0], [0, 0]],
            o: [[0, 0], [0, 0]],
          },
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

function createLeftUpperArmLayer(index, top, bottom, frames, totalFrames) {
  return createLineLayer(
    index,
    'Left Upper Arm',
    [top.leftShoulderX, top.leftShoulderY],
    [top.leftElbowX, top.leftElbowY],
    [bottom.leftShoulderX, bottom.leftShoulderY],
    [bottom.leftElbowX, bottom.leftElbowY],
    frames,
    totalFrames
  );
}

function createLeftForearmLayer(index, top, bottom, frames, totalFrames) {
  return createLineLayer(
    index,
    'Left Forearm',
    [top.leftElbowX, top.leftElbowY],
    [top.leftHandX, top.leftHandY],
    [bottom.leftElbowX, bottom.leftElbowY],
    [bottom.leftHandX, bottom.leftHandY],
    frames,
    totalFrames
  );
}

function createRightUpperArmLayer(index, top, bottom, frames, totalFrames) {
  return createLineLayer(
    index,
    'Right Upper Arm',
    [top.rightShoulderX, top.rightShoulderY],
    [top.rightElbowX, top.rightElbowY],
    [bottom.rightShoulderX, bottom.rightShoulderY],
    [bottom.rightElbowX, bottom.rightElbowY],
    frames,
    totalFrames
  );
}

function createRightForearmLayer(index, top, bottom, frames, totalFrames) {
  return createLineLayer(
    index,
    'Right Forearm',
    [top.rightElbowX, top.rightElbowY],
    [top.rightHandX, top.rightHandY],
    [bottom.rightElbowX, bottom.rightElbowY],
    [bottom.rightHandX, bottom.rightHandY],
    frames,
    totalFrames
  );
}

function createLeftThighLayer(index, top, bottom, frames, totalFrames) {
  return createLineLayer(
    index,
    'Left Thigh',
    [top.leftHipX, top.leftHipY],
    [top.leftKneeX, top.leftKneeY],
    [bottom.leftHipX, bottom.leftHipY],
    [bottom.leftKneeX, bottom.leftKneeY],
    frames,
    totalFrames,
    true // Static
  );
}

function createLeftCalfLayer(index, top, bottom, frames, totalFrames) {
  return createLineLayer(
    index,
    'Left Calf',
    [top.leftKneeX, top.leftKneeY],
    [top.leftFootX, top.leftFootY],
    [bottom.leftKneeX, bottom.leftKneeY],
    [bottom.leftFootX, bottom.leftFootY],
    frames,
    totalFrames,
    true // Static
  );
}

function createRightThighLayer(index, top, bottom, frames, totalFrames) {
  return createLineLayer(
    index,
    'Right Thigh',
    [top.rightHipX, top.rightHipY],
    [top.rightKneeX, top.rightKneeY],
    [bottom.rightHipX, bottom.rightHipY],
    [bottom.rightKneeX, bottom.rightKneeY],
    frames,
    totalFrames,
    true // Static
  );
}

function createRightCalfLayer(index, top, bottom, frames, totalFrames) {
  return createLineLayer(
    index,
    'Right Calf',
    [top.rightKneeX, top.rightKneeY],
    [top.rightFootX, top.rightFootY],
    [bottom.rightKneeX, bottom.rightKneeY],
    [bottom.rightFootX, bottom.rightFootY],
    frames,
    totalFrames,
    true // Static
  );
}

function createLineLayer(index, name, topStart, topEnd, bottomStart, bottomEnd, frames, totalFrames, isStatic = false) {
  if (isStatic) {
    // Static layer (legs don't move in bench press)
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
            a: 0,
            k: {
              c: false,
              v: [topStart, topEnd],
              i: [[0, 0], [0, 0]],
              o: [[0, 0], [0, 0]],
            },
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

  // Animated layer
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
              s: [{ c: false, v: [topStart, topEnd], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
              i: { x: [0.42], y: [0] },
              o: { x: [0.58], y: [1] },
            },
            {
              t: frames.down,
              s: [{ c: false, v: [bottomStart, bottomEnd], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
              i: { x: [0.42], y: [0] },
              o: { x: [0.58], y: [1] },
            },
            {
              t: frames.up,
              s: [{ c: false, v: [topStart, topEnd], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
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
  const topY = 120; // Arms extended
  const bottomY = 210; // At chest level

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
              s: [{ c: false, v: [[120, topY], [280, topY]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
              i: { x: [0.42], y: [0] },
              o: { x: [0.58], y: [1] },
            },
            {
              t: frames.down,
              s: [{ c: false, v: [[120, bottomY], [280, bottomY]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
              i: { x: [0.42], y: [0] },
              o: { x: [0.58], y: [1] },
            },
            {
              t: frames.up,
              s: [{ c: false, v: [[120, topY], [280, topY]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] }],
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

function createBenchLayer(index, totalFrames) {
  // Simple bench representation (horizontal platform)
  return {
    ty: 4,
    nm: 'Bench',
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
        nm: 'Bench Top',
        ks: {
          a: 0,
          k: {
            c: false,
            v: [[130, 290], [270, 290]], // Bench surface
            i: [[0, 0], [0, 0]],
            o: [[0, 0], [0, 0]],
          },
        },
      },
      {
        ty: 'st',
        nm: 'Stroke',
        c: { a: 0, k: [1, 1, 1] },
        o: { a: 0, k: 60 }, // 60% opacity for bench (less prominent)
        w: { a: 0, k: 6 }, // Thicker stroke for bench
        lc: 2,
        lj: 2,
        ml: 4,
      },
    ],
  };
}

module.exports = { generateBarbellBenchPress };
