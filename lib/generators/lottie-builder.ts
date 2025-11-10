/**
 * Lottie Animation Builder
 * Utilities for creating Lottie JSON programmatically
 */

import type {
  LottieAnimation,
  Layer,
  Transform,
  AnimatableProperty,
  Keyframe,
  Shape,
  StrokeShape,
  FillShape,
  EllipseShape,
  GroupShape,
  PathShape,
} from './lottie-types';

/**
 * Create a new Lottie animation
 */
export function createAnimation(
  width: number,
  height: number,
  framerate: number,
  durationFrames: number,
  name?: string
): LottieAnimation {
  return {
    v: '5.5.2',
    nm: name,
    fr: framerate,
    ip: 0,
    op: durationFrames,
    w: width,
    h: height,
    ddd: 0,
    layers: [],
  };
}

/**
 * Create a static value property
 */
export function staticValue(value: number | number[]): AnimatableProperty {
  const valueArray = Array.isArray(value) ? value : [value];
  return {
    a: 0,
    k: valueArray,
  };
}

/**
 * Create an animated property with keyframes
 */
export function animatedValue(keyframes: Keyframe[]): AnimatableProperty {
  return {
    a: 1,
    k: keyframes,
  };
}

/**
 * Create a keyframe
 */
export function keyframe(
  time: number,
  value: number[],
  easing?: { inX?: number; inY?: number; outX?: number; outY?: number }
): Keyframe {
  const kf: Keyframe = {
    t: time,
    s: value,
  };

  if (easing) {
    kf.i = {
      x: [easing.inX ?? 0.42],
      y: [easing.inY ?? 0],
    };
    kf.o = {
      x: [easing.outX ?? 0.58],
      y: [easing.outY ?? 1],
    };
  }

  return kf;
}

/**
 * Create ease-in-out easing (smooth animation)
 */
export function easeInOut() {
  return { inX: 0.42, inY: 0, outX: 0.58, outY: 1 };
}

/**
 * Create ease-out easing (decelerating)
 */
export function easeOut() {
  return { inX: 0, inY: 0, outX: 0.58, outY: 1 };
}

/**
 * Create ease-in easing (accelerating)
 */
export function easeIn() {
  return { inX: 0.42, inY: 0, outX: 1, outY: 1 };
}

/**
 * Create linear easing (constant speed)
 */
export function linear() {
  return { inX: 0, inY: 0, outX: 1, outY: 1 };
}

/**
 * Create a transform object
 */
export function createTransform(options?: {
  position?: number[];
  anchor?: number[];
  scale?: number[];
  rotation?: number;
  opacity?: number;
}): Transform {
  return {
    p: staticValue(options?.position ?? [0, 0]),
    a: staticValue(options?.anchor ?? [0, 0]),
    s: staticValue(options?.scale ?? [100, 100]),
    r: staticValue(options?.rotation ?? 0),
    o: staticValue(options?.opacity ?? 100),
  };
}

/**
 * Create a shape layer
 */
export function createShapeLayer(
  index: number,
  name: string,
  shapes: Shape[],
  transform?: Transform,
  inPoint: number = 0,
  outPoint?: number
): Layer {
  return {
    ty: 4, // Shape layer
    nm: name,
    ind: index,
    ip: inPoint,
    op: outPoint ?? 999999,
    sr: 1,
    ks: transform ?? createTransform(),
    shapes,
  };
}

/**
 * Create a stroke shape
 */
export function createStroke(
  width: number,
  color: [number, number, number],
  opacity: number = 100,
  lineCap: 1 | 2 | 3 = 2, // 1=butt, 2=round, 3=square
  lineJoin: 1 | 2 | 3 = 2 // 1=miter, 2=round, 3=bevel
): StrokeShape {
  return {
    ty: 'st',
    nm: 'Stroke',
    c: staticValue([color[0] / 255, color[1] / 255, color[2] / 255]),
    o: staticValue(opacity),
    w: staticValue(width),
    lc: lineCap,
    lj: lineJoin,
    ml: 4,
  };
}

/**
 * Create a fill shape
 */
export function createFill(
  color: [number, number, number],
  opacity: number = 100
): FillShape {
  return {
    ty: 'fl',
    nm: 'Fill',
    c: staticValue([color[0] / 255, color[1] / 255, color[2] / 255]),
    o: staticValue(opacity),
  };
}

/**
 * Create an ellipse (circle) shape
 */
export function createEllipse(
  size: [number, number],
  position: [number, number] = [0, 0]
): EllipseShape {
  return {
    ty: 'el',
    nm: 'Ellipse',
    s: staticValue(size),
    p: staticValue(position),
  };
}

/**
 * Create a path shape from points
 */
export function createPath(points: [number, number][], closed: boolean = false): PathShape {
  // Convert points to Lottie path format
  const vertices = points.map((p) => p);
  const inTangents = points.map(() => [0, 0]);
  const outTangents = points.map(() => [0, 0]);

  return {
    ty: 'sh',
    nm: 'Path',
    ks: {
      a: 0,
      k: {
        c: closed,
        v: vertices,
        i: inTangents,
        o: outTangents,
      },
    } as any,
  };
}

/**
 * Create a line (2-point path)
 */
export function createLine(
  start: [number, number],
  end: [number, number]
): PathShape {
  return createPath([start, end], false);
}

/**
 * Create a group shape
 */
export function createGroup(name: string, shapes: Shape[]): GroupShape {
  return {
    ty: 'gr',
    nm: name,
    it: shapes,
    np: shapes.length,
  };
}

/**
 * Helper: Convert hex color to RGB
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

/**
 * Helper: Create white color (for stick figures)
 */
export const WHITE: [number, number, number] = [255, 255, 255];

/**
 * Helper: Create blue color (app accent)
 */
export const BLUE: [number, number, number] = [91, 145, 245]; // #5b91f5
