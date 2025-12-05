"use client";

import { useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useGymContextStore } from "@/lib/stores/gym-context.store";
import {
  parseHSL,
  generateColorScale,
  generateDarkColorScale,
  applyColorScale,
  removeColorScale,
} from "@/lib/utils/color-scale";

interface GymBrandingProviderProps {
  children: React.ReactNode;
}

/**
 * GymBrandingProvider
 *
 * This provider handles:
 * 1. Initializing gym context when user is authenticated
 * 2. Injecting custom CSS variables for gym branding colors
 * 3. Handling dark/light mode color scale switching
 */
export function GymBrandingProvider({ children }: GymBrandingProviderProps) {
  const { user } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const {
    branding,
    isInitialized,
    _hasHydrated,
    initialize,
    clear,
  } = useGymContextStore();

  // Initialize gym context when user is authenticated
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!user?.id) {
      clear();
      return;
    }

    // Only initialize if not already done
    if (!isInitialized) {
      initialize(user.id);
    }
  }, [user?.id, _hasHydrated, isInitialized, initialize, clear]);

  // Apply branding colors as CSS variables
  // Wait for isInitialized to prevent applying cached branding before DB validation
  useEffect(() => {
    if (!isInitialized) return;

    if (!branding?.primary_color) {
      // Remove any previously applied custom colors
      removeColorScale(document.documentElement, "primary");
      return;
    }

    const hsl = parseHSL(branding.primary_color);
    if (!hsl) return;

    const isDark = resolvedTheme === "dark";
    const scale = isDark
      ? generateDarkColorScale(hsl.h, hsl.s, hsl.l)
      : generateColorScale(hsl.h, hsl.s, hsl.l);

    applyColorScale(document.documentElement, scale, "primary");

    // Cleanup on unmount or when branding changes
    return () => {
      removeColorScale(document.documentElement, "primary");
    };
  }, [branding?.primary_color, resolvedTheme, isInitialized]);

  // Apply secondary color if present
  useEffect(() => {
    if (!isInitialized) return;
    if (!branding?.secondary_color) return;

    const hsl = parseHSL(branding.secondary_color);
    if (!hsl) return;

    const isDark = resolvedTheme === "dark";
    const scale = isDark
      ? generateDarkColorScale(hsl.h, hsl.s, hsl.l)
      : generateColorScale(hsl.h, hsl.s, hsl.l);

    applyColorScale(document.documentElement, scale, "secondary");

    return () => {
      removeColorScale(document.documentElement, "secondary");
    };
  }, [branding?.secondary_color, resolvedTheme, isInitialized]);

  // Apply accent color if present
  useEffect(() => {
    if (!isInitialized) return;
    if (!branding?.accent_color) return;

    const hsl = parseHSL(branding.accent_color);
    if (!hsl) return;

    const isDark = resolvedTheme === "dark";
    const scale = isDark
      ? generateDarkColorScale(hsl.h, hsl.s, hsl.l)
      : generateColorScale(hsl.h, hsl.s, hsl.l);

    applyColorScale(document.documentElement, scale, "accent");

    return () => {
      removeColorScale(document.documentElement, "accent");
    };
  }, [branding?.accent_color, resolvedTheme, isInitialized]);

  // Apply custom font if present
  useEffect(() => {
    if (!isInitialized) return;

    if (!branding?.font_family) {
      document.documentElement.style.removeProperty("--font-gym-body");
      return;
    }

    // Load Google Font dynamically
    const fontName = branding.font_family;
    const fontLink = document.getElementById("gym-font-link");

    if (!fontLink) {
      const link = document.createElement("link");
      link.id = "gym-font-link";
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
      document.head.appendChild(link);
    } else {
      (fontLink as HTMLLinkElement).href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
    }

    document.documentElement.style.setProperty(
      "--font-gym-body",
      `"${fontName}", var(--font-geist-sans)`
    );

    return () => {
      document.documentElement.style.removeProperty("--font-gym-body");
    };
  }, [branding?.font_family, isInitialized]);

  return <>{children}</>;
}

/**
 * GymBrandingWrapper
 *
 * A wrapper component for SSR-compatible gym branding.
 * Used for public pages (like /join/gym/[slug]) where branding
 * needs to be applied server-side.
 */
interface GymBrandingWrapperProps {
  children: React.ReactNode;
  branding: {
    primary_color?: string | null;
    secondary_color?: string | null;
    accent_color?: string | null;
    font_family?: string | null;
  } | null;
}

export function GymBrandingWrapper({
  children,
  branding,
}: GymBrandingWrapperProps) {
  const { resolvedTheme } = useTheme();

  // Generate CSS variables for inline styles
  const cssVars = useMemo(() => {
    if (!branding?.primary_color) return {};

    const hsl = parseHSL(branding.primary_color);
    if (!hsl) return {};

    const isDark = resolvedTheme === "dark";
    const scale = isDark
      ? generateDarkColorScale(hsl.h, hsl.s, hsl.l)
      : generateColorScale(hsl.h, hsl.s, hsl.l);

    const vars: Record<string, string> = {};
    for (const [shade, value] of Object.entries(scale)) {
      vars[`--primary-${shade}`] = value;
    }

    return vars;
  }, [branding?.primary_color, resolvedTheme]);

  // Apply font if present
  const fontStyle = branding?.font_family
    ? { "--font-gym-body": `"${branding.font_family}", var(--font-geist-sans)` }
    : {};

  return (
    <div style={{ ...cssVars, ...fontStyle } as React.CSSProperties}>
      {children}
    </div>
  );
}
