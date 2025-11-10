/**
 * Stick Figure Animation Primitives
 * Creates anatomically-proportioned stick figures for exercise animations
 */

import type { Shape, Layer } from './lottie-types';
import {
  createLine,
  createEllipse,
  createStroke,
  createGroup,
  createShapeLayer,
  createTransform,
  WHITE,
  staticValue,
  animatedValue,
  keyframe,
  easeInOut,
} from './lottie-builder';

/**
 * Stick figure body proportions (based on 400x400 canvas)
 * Reference: Average human proportions adapted for clarity
 */
export const STICK_FIGURE_CONFIG = {
  // Canvas center
  centerX: 200,
  centerY: 200,

  // Head
  headRadius: 20,
  headY: 80, // Top of body

  // Torso
  neckY: 100, // Bottom of head
  shouldersY: 110,
  hipsY: 180,
  torsoLength: 70,

  // Arms
  shoulderWidth: 40, // Distance from center to shoulder
  upperArmLength: 40,
  forearmLength: 35,
  armWidth: 3, // Stroke width

  // Legs
  hipWidth: 20, // Distance from center to hip
  thighLength: 60,
  calfLength: 55,
  legWidth: 3, // Stroke width

  // Barbell (when present)
  barbellWidth: 120,
  barbellPlateRadius: 12,
  barbellBarWidth: 4,

  // Colors
  strokeColor: WHITE,
  strokeWidth: 3,
};

export interface StickFigurePose {
  // Head
  headX: number;
  headY: number;

  // Torso
  neckX: number;
  neckY: number;
  hipsX: number;
  hipsY: number;

  // Left arm
  leftShoulderX: number;
  leftShoulderY: number;
  leftElbowX: number;
  leftElbowY: number;
  leftHandX: number;
  leftHandY: number;

  // Right arm
  rightShoulderX: number;
  rightShoulderY: number;
  rightElbowX: number;
  rightElbowY: number;
  rightHandX: number;
  rightHandY: number;

  // Left leg
  leftHipX: number;
  leftHipY: number;
  leftKneeX: number;
  leftKneeY: number;
  leftFootX: number;
  leftFootY: number;

  // Right leg
  rightHipX: number;
  rightHipY: number;
  rightKneeX: number;
  rightKneeY: number;
  rightFootX: number;
  rightFootY: number;
}

/**
 * Create a standing neutral pose
 */
export function createNeutralPose(
  centerX: number = STICK_FIGURE_CONFIG.centerX,
  centerY: number = STICK_FIGURE_CONFIG.centerY
): StickFigurePose {
  const cfg = STICK_FIGURE_CONFIG;

  return {
    // Head
    headX: centerX,
    headY: cfg.headY,

    // Torso
    neckX: centerX,
    neckY: cfg.neckY,
    hipsX: centerX,
    hipsY: cfg.hipsY,

    // Left arm (hanging down)
    leftShoulderX: centerX - cfg.shoulderWidth,
    leftShoulderY: cfg.shouldersY,
    leftElbowX: centerX - cfg.shoulderWidth - 10,
    leftElbowY: cfg.shouldersY + cfg.upperArmLength,
    leftHandX: centerX - cfg.shoulderWidth - 5,
    leftHandY: cfg.shouldersY + cfg.upperArmLength + cfg.forearmLength,

    // Right arm (hanging down)
    rightShoulderX: centerX + cfg.shoulderWidth,
    rightShoulderY: cfg.shouldersY,
    rightElbowX: centerX + cfg.shoulderWidth + 10,
    rightElbowY: cfg.shouldersY + cfg.upperArmLength,
    rightHandX: centerX + cfg.shoulderWidth + 5,
    rightHandY: cfg.shouldersY + cfg.upperArmLength + cfg.forearmLength,

    // Left leg (straight down)
    leftHipX: centerX - cfg.hipWidth,
    leftHipY: cfg.hipsY,
    leftKneeX: centerX - cfg.hipWidth,
    leftKneeY: cfg.hipsY + cfg.thighLength,
    leftFootX: centerX - cfg.hipWidth,
    leftFootY: cfg.hipsY + cfg.thighLength + cfg.calfLength,

    // Right leg (straight down)
    rightHipX: centerX + cfg.hipWidth,
    rightHipY: cfg.hipsY,
    rightKneeX: centerX + cfg.hipWidth,
    rightKneeY: cfg.hipsY + cfg.thighLength,
    rightFootX: centerX + cfg.hipWidth,
    rightFootY: cfg.hipsY + cfg.thighLength + cfg.calfLength,
  };
}

/**
 * Create stick figure shapes from a pose
 */
export function createStickFigureShapes(pose: StickFigurePose): Shape[] {
  const cfg = STICK_FIGURE_CONFIG;
  const stroke = createStroke(cfg.strokeWidth, cfg.strokeColor, 100, 2, 2);

  // Head (circle)
  const head = createGroup('Head', [
    createEllipse([cfg.headRadius * 2, cfg.headRadius * 2], [pose.headX, pose.headY]),
    stroke,
  ]);

  // Torso (line from neck to hips)
  const torso = createGroup('Torso', [
    createLine([pose.neckX, pose.neckY], [pose.hipsX, pose.hipsY]),
    stroke,
  ]);

  // Left arm (shoulder → elbow → hand)
  const leftUpperArm = createGroup('Left Upper Arm', [
    createLine([pose.leftShoulderX, pose.leftShoulderY], [pose.leftElbowX, pose.leftElbowY]),
    stroke,
  ]);
  const leftForearm = createGroup('Left Forearm', [
    createLine([pose.leftElbowX, pose.leftElbowY], [pose.leftHandX, pose.leftHandY]),
    stroke,
  ]);

  // Right arm (shoulder → elbow → hand)
  const rightUpperArm = createGroup('Right Upper Arm', [
    createLine([pose.rightShoulderX, pose.rightShoulderY], [pose.rightElbowX, pose.rightElbowY]),
    stroke,
  ]);
  const rightForearm = createGroup('Right Forearm', [
    createLine([pose.rightElbowX, pose.rightElbowY], [pose.rightHandX, pose.rightHandY]),
    stroke,
  ]);

  // Left leg (hip → knee → foot)
  const leftThigh = createGroup('Left Thigh', [
    createLine([pose.leftHipX, pose.leftHipY], [pose.leftKneeX, pose.leftKneeY]),
    stroke,
  ]);
  const leftCalf = createGroup('Left Calf', [
    createLine([pose.leftKneeX, pose.leftKneeY], [pose.leftFootX, pose.leftFootY]),
    stroke,
  ]);

  // Right leg (hip → knee → foot)
  const rightThigh = createGroup('Right Thigh', [
    createLine([pose.rightHipX, pose.rightHipY], [pose.rightKneeX, pose.rightKneeY]),
    stroke,
  ]);
  const rightCalf = createGroup('Right Calf', [
    createLine([pose.rightKneeX, pose.rightKneeY], [pose.rightFootX, pose.rightFootY]),
    stroke,
  ]);

  return [
    // Draw order: back to front
    rightThigh,
    rightCalf,
    leftThigh,
    leftCalf,
    torso,
    rightUpperArm,
    rightForearm,
    leftUpperArm,
    leftForearm,
    head,
  ];
}

/**
 * Create a static stick figure layer
 */
export function createStickFigureLayer(
  index: number,
  pose: StickFigurePose,
  inPoint: number = 0,
  outPoint?: number
): Layer {
  const shapes = createStickFigureShapes(pose);
  return createShapeLayer(index, 'Stick Figure', shapes, createTransform(), inPoint, outPoint);
}

/**
 * Helper: Calculate point at angle and distance from origin
 */
export function pointAtAngle(
  originX: number,
  originY: number,
  angle: number,
  distance: number
): [number, number] {
  const radians = (angle * Math.PI) / 180;
  return [originX + Math.cos(radians) * distance, originY + Math.sin(radians) * distance];
}

/**
 * Helper: Linear interpolation between two poses
 */
export function lerpPose(pose1: StickFigurePose, pose2: StickFigurePose, t: number): StickFigurePose {
  const lerp = (a: number, b: number) => a + (b - a) * t;

  return {
    headX: lerp(pose1.headX, pose2.headX),
    headY: lerp(pose1.headY, pose2.headY),
    neckX: lerp(pose1.neckX, pose2.neckX),
    neckY: lerp(pose1.neckY, pose2.neckY),
    hipsX: lerp(pose1.hipsX, pose2.hipsX),
    hipsY: lerp(pose1.hipsY, pose2.hipsY),
    leftShoulderX: lerp(pose1.leftShoulderX, pose2.leftShoulderX),
    leftShoulderY: lerp(pose1.leftShoulderY, pose2.leftShoulderY),
    leftElbowX: lerp(pose1.leftElbowX, pose2.leftElbowX),
    leftElbowY: lerp(pose1.leftElbowY, pose2.leftElbowY),
    leftHandX: lerp(pose1.leftHandX, pose2.leftHandX),
    leftHandY: lerp(pose1.leftHandY, pose2.leftHandY),
    rightShoulderX: lerp(pose1.rightShoulderX, pose2.rightShoulderX),
    rightShoulderY: lerp(pose1.rightShoulderY, pose2.rightShoulderY),
    rightElbowX: lerp(pose1.rightElbowX, pose2.rightElbowX),
    rightElbowY: lerp(pose1.rightElbowY, pose2.rightElbowY),
    rightHandX: lerp(pose1.rightHandX, pose2.rightHandX),
    rightHandY: lerp(pose1.rightHandY, pose2.rightHandY),
    leftHipX: lerp(pose1.leftHipX, pose2.leftHipX),
    leftHipY: lerp(pose1.leftHipY, pose2.leftHipY),
    leftKneeX: lerp(pose1.leftKneeX, pose2.leftKneeX),
    leftKneeY: lerp(pose1.leftKneeY, pose2.leftKneeY),
    leftFootX: lerp(pose1.leftFootX, pose2.leftFootX),
    leftFootY: lerp(pose1.leftFootY, pose2.leftFootY),
    rightHipX: lerp(pose1.rightHipX, pose2.rightHipX),
    rightHipY: lerp(pose1.rightHipY, pose2.rightHipY),
    rightKneeX: lerp(pose1.rightKneeX, pose2.rightKneeX),
    rightKneeY: lerp(pose1.rightKneeY, pose2.rightKneeY),
    rightFootX: lerp(pose1.rightFootX, pose2.rightFootX),
    rightFootY: lerp(pose1.rightFootY, pose2.rightFootY),
  };
}
