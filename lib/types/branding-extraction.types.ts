/**
 * Types for AI-driven branding extraction from website URLs
 */

/**
 * Raw metadata extracted from website HTML
 */
export interface WebsiteMetadata {
  // Basic meta tags
  title: string | null;
  description: string | null;

  // Open Graph
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogSiteName: string | null;

  // Theme and colors
  themeColor: string | null;
  msApplicationTileColor: string | null;

  // Icons
  favicon: string | null;
  appleTouchIcon: string | null;

  // Typography
  fonts: string[];

  // CSS colors found (hex/rgb values)
  cssColors: {
    primary: string | null;
    secondary: string | null;
    accent: string | null;
  };
}

/**
 * Processed branding data ready to apply to gym branding
 * Colors are in HSL format: "h s% l%"
 */
export interface ExtractedBranding {
  app_name: string | null;
  tagline: string | null;
  welcome_message: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  font_family: string | null;
  logo_url: string | null;
}

/**
 * Result of branding extraction action
 */
export interface BrandingExtractionResult {
  success: boolean;
  data?: ExtractedBranding;
  metadata?: WebsiteMetadata;
  error?: string;
}
