/**
 * Animated Stick Figure Layer Generator
 * Creates animated stick figure layers from pose keyframes
 */

import type { Layer, Shape, AnimatableProperty } from './lottie-types';
import {
  createLine,
  createEllipse,
  createStroke,
  createGroup,
  WHITE,
  animatedValue,
  keyframe,
  easeInOut,
} from './lottie-builder';
import { STICK_FIGURE_CONFIG, type StickFigurePose } from './stick-figure';

export interface PoseKeyframe {
  frame: number;
  pose: StickFigurePose;
}

/**
 * Create animated stick figure layers from keyframes
 * Each body part gets its own layer for independent animation
 */
export function createAnimatedStickFigure(
  poseKeyframes: PoseKeyframe[],
  totalFrames: number
): Layer[] {
  const cfg = STICK_FIGURE_CONFIG;
  const stroke = createStroke(cfg.strokeWidth, cfg.strokeColor, 100, 2, 2);

  // Create animated shapes for each body part
  const headShape = createAnimatedHead(poseKeyframes);
  const torsoShape = createAnimatedTorso(poseKeyframes);
  const leftArmShapes = createAnimatedArm(poseKeyframes, 'left');
  const rightArmShapes = createAnimatedArm(poseKeyframes, 'right');
  const leftLegShapes = createAnimatedLeg(poseKeyframes, 'left');
  const rightLegShapes = createAnimatedLeg(poseKeyframes, 'right');

  // Create layers (reverse draw order for proper z-index)
  const layers: Layer[] = [
    createShapeLayer(10, 'Head', [headShape, stroke], totalFrames),
    createShapeLayer(9, 'Torso', [torsoShape, stroke], totalFrames),
    createShapeLayer(8, 'Left Upper Arm', [leftArmShapes.upper, stroke], totalFrames),
    createShapeLayer(7, 'Left Forearm', [leftArmShapes.forearm, stroke], totalFrames),
    createShapeLayer(6, 'Right Upper Arm', [rightArmShapes.upper, stroke], totalFrames),
    createShapeLayer(5, 'Right Forearm', [rightArmShapes.forearm, stroke], totalFrames),
    createShapeLayer(4, 'Left Thigh', [leftLegShapes.thigh, stroke], totalFrames),
    createShapeLayer(3, 'Left Calf', [leftLegShapes.calf, stroke], totalFrames),
    createShapeLayer(2, 'Right Thigh', [rightLegShapes.thigh, stroke], totalFrames),
    createShapeLayer(1, 'Right Calf', [rightLegShapes.calf, stroke], totalFrames),
  ];

  return layers;
}

/**
 * Helper to create a shape layer
 */
function createShapeLayer(
  index: number,
  name: string,
  shapes: Shape[],
  totalFrames: number
): Layer {
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
      r: { a: 0, k: [0] },
      o: { a: 0, k: 100 },
    },
    shapes,
  };
}

/**
 * Create animated head shape
 */
function createAnimatedHead(poseKeyframes: PoseKeyframe[]): Shape {
  const cfg = STICK_FIGURE_CONFIG;
  const size = [cfg.headRadius * 2, cfg.headRadius * 2];

  // Create position keyframes
  const positionKf = poseKeyframes.map((kf) =>
    keyframe(kf.frame, [kf.pose.headX, kf.pose.headY], easeInOut())
  );

  return {
    ty: 'el',
    nm: 'Head',
    s: { a: 0, k: size },
    p: animatedValue(positionKf),
  };
}

/**
 * Create animated torso shape (line from neck to hips)
 */
function createAnimatedTorso(poseKeyframes: PoseKeyframe[]): Shape {
  // Torso is a path from neck to hips
  const pathKf = poseKeyframes.map((kf) => ({
    t: kf.frame,
    s: [
      {
        c: false,
        v: [
          [kf.pose.neckX, kf.pose.neckY],
          [kf.pose.hipsX, kf.pose.hipsY],
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
  }));

  return {
    ty: 'sh',
    nm: 'Torso Path',
    ks: { a: 1, k: pathKf } as any,
  };
}

/**
 * Create animated arm shapes
 */
function createAnimatedArm(
  poseKeyframes: PoseKeyframe[],
  side: 'left' | 'right'
): { upper: Shape; forearm: Shape } {
  const isLeft = side === 'left';

  // Upper arm path (shoulder to elbow)
  const upperKf = poseKeyframes.map((kf) => ({
    t: kf.frame,
    s: [
      {
        c: false,
        v: [
          isLeft
            ? [kf.pose.leftShoulderX, kf.pose.leftShoulderY]
            : [kf.pose.rightShoulderX, kf.pose.rightShoulderY],
          isLeft
            ? [kf.pose.leftElbowX, kf.pose.leftElbowY]
            : [kf.pose.rightElbowX, kf.pose.rightElbowY],
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
  }));

  // Forearm path (elbow to hand)
  const forearmKf = poseKeyframes.map((kf) => ({
    t: kf.frame,
    s: [
      {
        c: false,
        v: [
          isLeft
            ? [kf.pose.leftElbowX, kf.pose.leftElbowY]
            : [kf.pose.rightElbowX, kf.pose.rightElbowY],
          isLeft
            ? [kf.pose.leftHandX, kf.pose.leftHandY]
            : [kf.pose.rightHandX, kf.pose.rightHandY],
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
  }));

  return {
    upper: {
      ty: 'sh',
      nm: `${isLeft ? 'Left' : 'Right'} Upper Arm`,
      ks: { a: 1, k: upperKf } as any,
    },
    forearm: {
      ty: 'sh',
      nm: `${isLeft ? 'Left' : 'Right'} Forearm`,
      ks: { a: 1, k: forearmKf } as any,
    },
  };
}

/**
 * Create animated leg shapes
 */
function createAnimatedLeg(
  poseKeyframes: PoseKeyframe[],
  side: 'left' | 'right'
): { thigh: Shape; calf: Shape } {
  const isLeft = side === 'left';

  // Thigh path (hip to knee)
  const thighKf = poseKeyframes.map((kf) => ({
    t: kf.frame,
    s: [
      {
        c: false,
        v: [
          isLeft
            ? [kf.pose.leftHipX, kf.pose.leftHipY]
            : [kf.pose.rightHipX, kf.pose.rightHipY],
          isLeft
            ? [kf.pose.leftKneeX, kf.pose.leftKneeY]
            : [kf.pose.rightKneeX, kf.pose.rightKneeY],
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
  }));

  // Calf path (knee to foot)
  const calfKf = poseKeyframes.map((kf) => ({
    t: kf.frame,
    s: [
      {
        c: false,
        v: [
          isLeft
            ? [kf.pose.leftKneeX, kf.pose.leftKneeY]
            : [kf.pose.rightKneeX, kf.pose.rightKneeY],
          isLeft
            ? [kf.pose.leftFootX, kf.pose.leftFootY]
            : [kf.pose.rightFootX, kf.pose.rightFootY],
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
  }));

  return {
    thigh: {
      ty: 'sh',
      nm: `${isLeft ? 'Left' : 'Right'} Thigh`,
      ks: { a: 1, k: thighKf } as any,
    },
    calf: {
      ty: 'sh',
      nm: `${isLeft ? 'Left' : 'Right'} Calf`,
      ks: { a: 1, k: calfKf } as any,
    },
  };
}
