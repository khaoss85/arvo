/**
 * Color scale generation utilities for gym branding
 * Generates a full 50-950 color scale from a base HSL color
 */

export interface HSLColor {
  h: number; // Hue: 0-360
  s: number; // Saturation: 0-100
  l: number; // Lightness: 0-100
}

/**
 * Parse HSL string to components
 * Input format: "221 83% 53%" or "221 83 53"
 */
export function parseHSL(hslString: string): HSLColor | null {
  // Try format with percentages: "221 83% 53%"
  let match = hslString.match(/(\d+)\s+(\d+)%?\s+(\d+)%?/);
  if (!match) {
    // Try CSS format: "hsl(221, 83%, 53%)"
    match = hslString.match(/hsl\(\s*(\d+),?\s*(\d+)%?,?\s*(\d+)%?\s*\)/i);
  }

  if (!match) return null;

  return {
    h: parseInt(match[1], 10),
    s: parseInt(match[2], 10),
    l: parseInt(match[3], 10),
  };
}

/**
 * Format HSL components to string
 * Output format: "221 83% 53%" (Tailwind CSS variable format)
 */
export function formatHSL(h: number, s: number, l: number): string {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Generate a full color scale (50-950) from a base color
 * The base color is used as the 500 value
 *
 * Light mode scale: 50 is lightest, 950 is darkest
 */
export function generateColorScale(
  h: number,
  s: number,
  l: number
): Record<string, string> {
  // Calculate lightness steps
  // 50: very light (~97%), 500: base, 950: very dark (~10%)
  const lightnessMap: Record<string, number> = {
    "50": clamp(l + 44, 90, 98),
    "100": clamp(l + 37, 85, 95),
    "200": clamp(l + 28, 75, 88),
    "300": clamp(l + 18, 60, 78),
    "400": clamp(l + 8, 50, 68),
    "500": l, // Base color
    "600": clamp(l - 8, 35, 55),
    "700": clamp(l - 16, 25, 45),
    "800": clamp(l - 23, 18, 38),
    "900": clamp(l - 28, 12, 32),
    "950": clamp(l - 35, 5, 25),
  };

  // Adjust saturation for lighter/darker shades
  const saturationMap: Record<string, number> = {
    "50": clamp(s - 30, 20, 100),
    "100": clamp(s - 20, 30, 100),
    "200": clamp(s - 10, 40, 100),
    "300": clamp(s - 5, 50, 100),
    "400": s,
    "500": s,
    "600": clamp(s - 5, 50, 100),
    "700": clamp(s - 10, 45, 95),
    "800": clamp(s - 15, 40, 90),
    "900": clamp(s - 20, 35, 85),
    "950": clamp(s - 25, 30, 80),
  };

  const scale: Record<string, string> = {};

  for (const key of Object.keys(lightnessMap)) {
    scale[key] = formatHSL(h, saturationMap[key], lightnessMap[key]);
  }

  return scale;
}

/**
 * Generate dark mode color scale
 * In dark mode, the scale is inverted: 50 is darkest, 950 is lightest
 * This matches how Tailwind handles dark mode colors
 */
export function generateDarkColorScale(
  h: number,
  s: number,
  l: number
): Record<string, string> {
  // For dark mode, invert the lightness values
  // 50 becomes dark, 950 becomes light
  const lightnessMap: Record<string, number> = {
    "50": clamp(100 - l - 44, 15, 30),
    "100": clamp(100 - l - 37, 20, 38),
    "200": clamp(100 - l - 28, 28, 48),
    "300": clamp(100 - l - 18, 40, 58),
    "400": clamp(100 - l - 8, 48, 65),
    "500": clamp(100 - l, 55, 75),
    "600": clamp(100 - l + 8, 65, 82),
    "700": clamp(100 - l + 16, 75, 88),
    "800": clamp(100 - l + 23, 82, 93),
    "900": clamp(100 - l + 28, 88, 96),
    "950": clamp(100 - l + 35, 92, 99),
  };

  // Keep similar saturation adjustments
  const saturationMap: Record<string, number> = {
    "50": clamp(s - 25, 30, 80),
    "100": clamp(s - 20, 35, 85),
    "200": clamp(s - 15, 40, 90),
    "300": clamp(s - 10, 45, 95),
    "400": clamp(s - 5, 50, 100),
    "500": s,
    "600": s,
    "700": clamp(s - 5, 50, 100),
    "800": clamp(s - 10, 40, 100),
    "900": clamp(s - 20, 30, 100),
    "950": clamp(s - 30, 20, 100),
  };

  const scale: Record<string, string> = {};

  for (const key of Object.keys(lightnessMap)) {
    scale[key] = formatHSL(h, saturationMap[key], lightnessMap[key]);
  }

  return scale;
}

/**
 * Apply color scale to CSS variables on an element
 * Uses the --primary-{shade} naming convention
 */
export function applyColorScale(
  element: HTMLElement,
  scale: Record<string, string>,
  prefix: string = "primary"
): void {
  for (const [shade, value] of Object.entries(scale)) {
    element.style.setProperty(`--${prefix}-${shade}`, value);
  }
}

/**
 * Remove color scale CSS variables from an element
 */
export function removeColorScale(
  element: HTMLElement,
  prefix: string = "primary"
): void {
  const shades = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
  for (const shade of shades) {
    element.style.removeProperty(`--${prefix}-${shade}`);
  }
}

/**
 * Generate CSS variables object for inline styles
 * Useful for SSR and isolated preview components
 */
export function generateCSSVariables(
  h: number,
  s: number,
  l: number,
  isDark: boolean = false,
  prefix: string = "primary"
): Record<string, string> {
  const scale = isDark
    ? generateDarkColorScale(h, s, l)
    : generateColorScale(h, s, l);

  const cssVars: Record<string, string> = {};
  for (const [shade, value] of Object.entries(scale)) {
    cssVars[`--${prefix}-${shade}`] = value;
  }

  return cssVars;
}

/**
 * Convert HEX color to HSL
 */
export function hexToHSL(hex: string): HSLColor | null {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  if (hex.length !== 6) return null;

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to HEX color
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}
