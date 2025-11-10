/**
 * Barbell Squat Animation Generator
 * Creates a Lottie animation of a barbell back squat
 */

import type { LottieAnimation } from '../lottie-types';
import { createAnimation } from '../lottie-builder';
import {
  STICK_FIGURE_CONFIG,
  createNeutralPose,
  type StickFigurePose,
} from '../stick-figure';
import { createAnimatedStickFigure } from '../animated-stick-figure';

/**
 * Generate barbell squat animation
 * Movement: Standing → Squat down → Stand up → Loop
 */
export function generateBarbellSquat(): LottieAnimation {
  const FPS = 30;
  const DURATION_SECONDS = 3;
  const TOTAL_FRAMES = FPS * DURATION_SECONDS;

  // Create base animation
  const animation = createAnimation(400, 400, FPS, TOTAL_FRAMES, 'Barbell Squat');

  // Define key poses
  const standingPose = createSquatPose('standing');
  const bottomPose = createSquatPose('bottom');

  // Create keyframe times
  const frames = {
    start: 0,
    down: Math.floor(TOTAL_FRAMES * 0.4), // 40% of animation going down
    bottom: Math.floor(TOTAL_FRAMES * 0.5), // Hold at bottom
    up: Math.floor(TOTAL_FRAMES * 0.9), // 40% coming up
    end: TOTAL_FRAMES,
  };

  // Create animated stick figure with barbell
  const poses = [
    { frame: frames.start, pose: standingPose },
    { frame: frames.down, pose: bottomPose },
    { frame: frames.bottom, pose: bottomPose },
    { frame: frames.up, pose: standingPose },
  ];

  const layers = createAnimatedStickFigure(poses, TOTAL_FRAMES);

  // Add barbell layer
  const barbellLayer = createBarbellLayer(frames, TOTAL_FRAMES);

  animation.layers = [...layers, barbellLayer];

  return animation;
}

/**
 * Create squat pose at different positions
 */
function createSquatPose(position: 'standing' | 'bottom'): StickFigurePose {
  const cfg = STICK_FIGURE_CONFIG;
  const centerX = cfg.centerX;

  if (position === 'standing') {
    // Standing position with barbell on back
    return {
      // Head
      headX: centerX,
      headY: 80,

      // Torso (vertical)
      neckX: centerX,
      neckY: 100,
      hipsX: centerX,
      hipsY: 180,

      // Arms holding barbell on shoulders
      leftShoulderX: centerX - 40,
      leftShoulderY: 110,
      leftElbowX: centerX - 60,
      leftElbowY: 100,
      leftHandX: centerX - 70,
      leftHandY: 95,

      rightShoulderX: centerX + 40,
      rightShoulderY: 110,
      rightElbowX: centerX + 60,
      rightElbowY: 100,
      rightHandX: centerX + 70,
      rightHandY: 95,

      // Legs (straight, shoulder-width stance)
      leftHipX: centerX - 20,
      leftHipY: 180,
      leftKneeX: centerX - 20,
      leftKneeY: 240,
      leftFootX: centerX - 25,
      leftFootY: 295,

      rightHipX: centerX + 20,
      rightHipY: 180,
      rightKneeX: centerX + 20,
      rightKneeY: 240,
      rightFootX: centerX + 25,
      rightFootY: 295,
    };
  } else {
    // Bottom squat position
    return {
      // Head (slightly forward)
      headX: centerX + 5,
      headY: 140,

      // Torso (leaning forward, maintaining upright angle)
      neckX: centerX + 5,
      neckY: 160,
      hipsX: centerX - 5,
      hipsY: 240,

      // Arms still holding barbell
      leftShoulderX: centerX - 35,
      leftShoulderY: 170,
      leftElbowX: centerX - 60,
      leftElbowY: 155,
      leftHandX: centerX - 70,
      leftHandY: 150,

      rightShoulderX: centerX + 45,
      rightShoulderY: 170,
      rightElbowX: centerX + 70,
      rightElbowY: 155,
      rightHandX: centerX + 80,
      rightHandY: 150,

      // Legs (bent, knees out)
      leftHipX: centerX - 15,
      leftHipY: 240,
      leftKneeX: centerX - 50,
      leftKneeY: 270,
      leftFootX: centerX - 25,
      leftFootY: 295,

      rightHipX: centerX + 15,
      rightHipY: 240,
      rightKneeX: centerX + 60,
      rightKneeY: 270,
      rightFootX: centerX + 25,
      rightFootY: 295,
    };
  }
}

/**
 * Create animated barbell layer
 */
function createBarbellLayer(frames: any, totalFrames: number): any {
  // Barbell position moves with the squat
  const standingBarbellY = 95;
  const squatBarbellY = 150;

  return {
    ty: 4,
    nm: 'Barbell',
    ind: 0,
    ip: 0,
    op: totalFrames,
    sr: 1,
    ks: {
      p: { a: 0, k: [200, 0] },
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
          // Barbell bar (horizontal line)
          {
            ty: 'sh',
            nm: 'Bar',
            ks: {
              a: 1,
              k: [
                {
                  t: frames.start,
                  s: [
                    {
                      c: false,
                      v: [
                        [-80, standingBarbellY],
                        [80, standingBarbellY],
                      ],
                      i: [
                        [0, 0],
                        [0, 0],
                      ],
                      o: [
                        [0, 0],
                        [0, 0],
                      ],
                    },
                  ],
                  i: { x: [0.42], y: [0] },
                  o: { x: [0.58], y: [1] },
                },
                {
                  t: frames.down,
                  s: [
                    {
                      c: false,
                      v: [
                        [-80, squatBarbellY],
                        [80, squatBarbellY],
                      ],
                      i: [
                        [0, 0],
                        [0, 0],
                      ],
                      o: [
                        [0, 0],
                        [0, 0],
                      ],
                    },
                  ],
                  i: { x: [0.42], y: [0] },
                  o: { x: [0.58], y: [1] },
                },
                {
                  t: frames.up,
                  s: [
                    {
                      c: false,
                      v: [
                        [-80, standingBarbellY],
                        [80, standingBarbellY],
                      ],
                      i: [
                        [0, 0],
                        [0, 0],
                      ],
                      o: [
                        [0, 0],
                        [0, 0],
                      ],
                    },
                  ],
                },
              ],
            },
          },
          // Stroke
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
      },
    ],
  };
}
