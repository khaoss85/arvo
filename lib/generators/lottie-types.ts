/**
 * TypeScript types for Lottie JSON structure
 * Based on Bodymovin 5.x schema
 */

export interface LottieAnimation {
  v: string; // Bodymovin version (e.g., "5.5.2")
  nm?: string; // Animation name
  fr: number; // Framerate (frames per second)
  ip: number; // In point (start frame, usually 0)
  op: number; // Out point (end frame)
  w: number; // Width
  h: number; // Height
  ddd?: number; // 3D flag (0 = 2D, 1 = 3D)
  layers: Layer[];
  assets?: any[]; // Optional assets
}

export interface Layer {
  ty: number; // Layer type (4 = shape layer, 1 = solid, 0 = precomp)
  nm: string; // Layer name
  ind: number; // Layer index
  ip: number; // In point (visibility start frame)
  op: number; // Out point (visibility end frame)
  sr: number; // Time stretch (1 = normal speed)
  ks: Transform; // Transform properties
  ao?: number; // Auto-orient
  ddd?: number; // 3D flag
  shapes?: Shape[]; // Shape contents (for shape layers)
  st?: number; // Start time
}

export interface Transform {
  p: AnimatableProperty; // Position [x, y]
  a: AnimatableProperty; // Anchor point [x, y]
  s: AnimatableProperty; // Scale [x%, y%]
  r: AnimatableProperty; // Rotation (degrees)
  o: AnimatableProperty; // Opacity (0-100)
  sk?: AnimatableProperty; // Skew
  sa?: AnimatableProperty; // Skew axis
}

export interface AnimatableProperty {
  a: number; // Animated flag (0 = static, 1 = animated)
  k: number[] | Keyframe[]; // Value (static) or keyframes (animated)
}

export interface Keyframe {
  t: number; // Time (frame number)
  s: number[]; // Start value
  e?: number[]; // End value (optional, for next keyframe)
  h?: number; // Hold flag (1 = hold, no interpolation)
  i?: EasingHandle; // In tangent (easing in)
  o?: EasingHandle; // Out tangent (easing out)
}

export interface EasingHandle {
  x: number[]; // X influence
  y: number[]; // Y influence
}

export interface Shape {
  ty: string; // Shape type ("gr" = group, "st" = stroke, "fl" = fill, "el" = ellipse, "rc" = rect, "sh" = path)
  nm: string; // Shape name
  it?: Shape[]; // Shape contents (for groups)
  c?: AnimatableProperty; // Color (for stroke/fill) [r, g, b]
  o?: AnimatableProperty; // Opacity
  w?: AnimatableProperty; // Width (for stroke)
  lc?: number; // Line cap (1 = butt, 2 = round, 3 = square)
  lj?: number; // Line join (1 = miter, 2 = round, 3 = bevel)
  ml?: number; // Miter limit
  s?: AnimatableProperty; // Size (for ellipse) [width, height]
  p?: AnimatableProperty; // Position
  d?: number; // Direction (for shapes)
  hd?: boolean; // Hidden flag
}

export interface StrokeShape extends Shape {
  ty: 'st'; // Stroke type
  c: AnimatableProperty; // Color [r, g, b]
  o: AnimatableProperty; // Opacity
  w: AnimatableProperty; // Width
  lc: number; // Line cap
  lj: number; // Line join
}

export interface FillShape extends Shape {
  ty: 'fl'; // Fill type
  c: AnimatableProperty; // Color [r, g, b]
  o: AnimatableProperty; // Opacity
}

export interface EllipseShape extends Shape {
  ty: 'el'; // Ellipse type
  s: AnimatableProperty; // Size [width, height]
  p: AnimatableProperty; // Position [x, y]
}

export interface RectShape extends Shape {
  ty: 'rc'; // Rectangle type
  s: AnimatableProperty; // Size [width, height]
  p: AnimatableProperty; // Position [x, y]
  r?: AnimatableProperty; // Roundness
}

export interface PathShape extends Shape {
  ty: 'sh'; // Path type
  ks: AnimatableProperty; // Path data
}

export interface GroupShape extends Shape {
  ty: 'gr'; // Group type
  it: Shape[]; // Group contents
  np?: number; // Number of properties
}

export interface TrimShape extends Shape {
  ty: 'tm'; // Trim type
  s: AnimatableProperty; // Start
  e: AnimatableProperty; // End
  o: AnimatableProperty; // Offset
  m?: number; // Multiple shapes
}
