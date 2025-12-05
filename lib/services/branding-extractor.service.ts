/**
 * Branding Extractor Service
 * Extracts branding information from website URLs via AI-driven HTML analysis
 */

import { hexToHSL, formatHSL } from "@/lib/utils/color-scale";
import { getOpenAIClient } from "@/lib/ai/client";
import type {
  WebsiteMetadata,
  ExtractedBranding,
} from "@/lib/types/branding-extraction.types";

// AI extraction response type
interface AIExtractedBranding {
  brand_name: string | null;
  tagline: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  font_family: string | null;
  logo_url: string | null;
}

export class BrandingExtractorService {
  /**
   * Fetch HTML content from a URL
   */
  static async fetchHtml(url: string): Promise<string> {
    // Ensure URL has protocol
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ArvoBot/1.0; +https://arvo.fit)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    return response.text();
  }

  /**
   * Parse HTML content to extract metadata
   */
  static parseMetadata(html: string, baseUrl: string): WebsiteMetadata {
    // Helper to extract content from meta tags
    const getMeta = (
      nameOrProperty: string,
      attribute: "name" | "property" = "name"
    ): string | null => {
      const regex = new RegExp(
        `<meta[^>]+${attribute}=["']${nameOrProperty}["'][^>]+content=["']([^"']+)["']`,
        "i"
      );
      const altRegex = new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+${attribute}=["']${nameOrProperty}["']`,
        "i"
      );
      const match = html.match(regex) || html.match(altRegex);
      return match ? match[1] : null;
    };

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;

    // Extract meta description
    const description = getMeta("description");

    // Extract Open Graph tags
    const ogTitle = getMeta("og:title", "property");
    const ogDescription = getMeta("og:description", "property");
    const ogImage = getMeta("og:image", "property");
    const ogSiteName = getMeta("og:site_name", "property");

    // Extract theme color
    const themeColor = getMeta("theme-color");
    const msApplicationTileColor = getMeta("msapplication-TileColor");

    // Extract favicon
    let favicon: string | null = null;
    const faviconMatch = html.match(
      /<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i
    );
    if (faviconMatch) {
      favicon = this.resolveUrl(faviconMatch[1], baseUrl);
    }

    // Extract Apple touch icon
    let appleTouchIcon: string | null = null;
    const appleIconMatch = html.match(
      /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i
    );
    if (appleIconMatch) {
      appleTouchIcon = this.resolveUrl(appleIconMatch[1], baseUrl);
    }

    // Extract Google Fonts
    const fonts: string[] = [];
    const fontRegex =
      /fonts\.googleapis\.com\/css2?\?[^"']+family=([^"'&]+)/gi;
    let fontMatch;
    while ((fontMatch = fontRegex.exec(html)) !== null) {
      const fontFamily = decodeURIComponent(fontMatch[1])
        .split(":")[0]
        .replace(/\+/g, " ");
      if (!fonts.includes(fontFamily)) {
        fonts.push(fontFamily);
      }
    }

    // Extract CSS colors from inline styles and style tags
    const cssColors = this.extractCssColors(html);

    return {
      title,
      description,
      ogTitle,
      ogDescription,
      ogImage: ogImage ? this.resolveUrl(ogImage, baseUrl) : null,
      ogSiteName,
      themeColor,
      msApplicationTileColor,
      favicon,
      appleTouchIcon,
      fonts,
      cssColors,
    };
  }

  /**
   * Extract CSS color variables and common color patterns
   */
  private static extractCssColors(html: string): WebsiteMetadata["cssColors"] {
    const colors: WebsiteMetadata["cssColors"] = {
      primary: null,
      secondary: null,
      accent: null,
    };

    // Extract all style content (inline and style tags)
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let styleContent = "";
    let styleMatch;
    while ((styleMatch = styleRegex.exec(html)) !== null) {
      styleContent += styleMatch[1] + " ";
    }

    // Also check inline styles for CSS variables
    const inlineStyleRegex = /style=["']([^"']+)["']/gi;
    while ((styleMatch = inlineStyleRegex.exec(html)) !== null) {
      styleContent += styleMatch[1] + " ";
    }

    // Look for CSS custom properties (variables)
    // Common naming patterns: --primary, --color-primary, --brand-primary
    const primaryPatterns = [
      /--(?:color-)?primary(?:-color)?:\s*([^;}\s]+)/i,
      /--brand(?:-color)?:\s*([^;}\s]+)/i,
      /--main(?:-color)?:\s*([^;}\s]+)/i,
    ];

    const secondaryPatterns = [
      /--(?:color-)?secondary(?:-color)?:\s*([^;}\s]+)/i,
      /--(?:color-)?muted(?:-color)?:\s*([^;}\s]+)/i,
    ];

    const accentPatterns = [
      /--(?:color-)?accent(?:-color)?:\s*([^;}\s]+)/i,
      /--(?:color-)?highlight(?:-color)?:\s*([^;}\s]+)/i,
      /--cta(?:-color)?:\s*([^;}\s]+)/i,
    ];

    // Try to find primary color
    for (const pattern of primaryPatterns) {
      const match = styleContent.match(pattern);
      if (match && this.isValidColor(match[1])) {
        colors.primary = match[1];
        break;
      }
    }

    // Try to find secondary color
    for (const pattern of secondaryPatterns) {
      const match = styleContent.match(pattern);
      if (match && this.isValidColor(match[1])) {
        colors.secondary = match[1];
        break;
      }
    }

    // Try to find accent color
    for (const pattern of accentPatterns) {
      const match = styleContent.match(pattern);
      if (match && this.isValidColor(match[1])) {
        colors.accent = match[1];
        break;
      }
    }

    return colors;
  }

  /**
   * Check if a string is a valid color value
   */
  private static isValidColor(color: string): boolean {
    // Check for hex color
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) {
      return true;
    }
    // Check for rgb/rgba
    if (/^rgba?\([^)]+\)$/i.test(color)) {
      return true;
    }
    // Check for hsl/hsla
    if (/^hsla?\([^)]+\)$/i.test(color)) {
      return true;
    }
    return false;
  }

  /**
   * Extract logo URL from HTML using regex patterns
   * Fallback when AI doesn't find the logo
   */
  private static extractLogoFromHtml(html: string, baseUrl: string): string | null {
    // 1. <img> with src containing "logo"
    const logoSrcMatch = html.match(/<img[^>]+src=["']([^"']*logo[^"']+)["']/i);
    if (logoSrcMatch) {
      return this.resolveUrl(logoSrcMatch[1], baseUrl);
    }

    // 2. <img> inside <header>
    const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
    if (headerMatch) {
      const imgMatch = headerMatch[1].match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) {
        return this.resolveUrl(imgMatch[1], baseUrl);
      }
    }

    // 3. <img> with class or alt containing "logo" (different attribute order)
    const logoClassMatch = html.match(
      /<img[^>]+(?:class|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i
    );
    if (logoClassMatch) {
      return this.resolveUrl(logoClassMatch[1], baseUrl);
    }

    // 4. <a class="...logo..."> containing <img>
    const logoLinkMatch = html.match(
      /<a[^>]+class=["'][^"']*logo[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i
    );
    if (logoLinkMatch) {
      return this.resolveUrl(logoLinkMatch[1], baseUrl);
    }

    // 5. Look for brand image in nav
    const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
    if (navMatch) {
      const navImgMatch = navMatch[1].match(/<img[^>]+src=["']([^"']+)["']/i);
      if (navImgMatch) {
        return this.resolveUrl(navImgMatch[1], baseUrl);
      }
    }

    return null;
  }

  /**
   * Resolve a relative URL to absolute
   */
  private static resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    if (url.startsWith("//")) {
      return `https:${url}`;
    }
    try {
      const base = new URL(baseUrl);
      return new URL(url, base).href;
    } catch {
      return url;
    }
  }

  /**
   * Convert any color format to HSL string
   */
  static normalizeColorToHSL(color: string): string | null {
    if (!color) return null;

    // Handle hex colors
    if (color.startsWith("#")) {
      // Expand shorthand hex (#abc -> #aabbcc)
      let hex = color;
      if (hex.length === 4) {
        hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
      }
      const hsl = hexToHSL(hex);
      if (hsl) {
        return formatHSL(hsl.h, hsl.s, hsl.l);
      }
    }

    // Handle rgb/rgba
    const rgbMatch = color.match(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i
    );
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]) / 255;
      const g = parseInt(rgbMatch[2]) / 255;
      const b = parseInt(rgbMatch[3]) / 255;

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

      return formatHSL(
        Math.round(h * 360),
        Math.round(s * 100),
        Math.round(l * 100)
      );
    }

    // Handle hsl/hsla - extract values and format consistently
    const hslMatch = color.match(
      /hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/i
    );
    if (hslMatch) {
      return formatHSL(
        parseInt(hslMatch[1]),
        parseInt(hslMatch[2]),
        parseInt(hslMatch[3])
      );
    }

    return null;
  }

  /**
   * Truncate HTML to a reasonable size for AI processing
   * Keeps head, header, nav, main content, and footer
   */
  private static truncateHtmlForAI(html: string, maxChars: number = 30000): string {
    // Remove scripts and their content
    let cleaned = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    // Remove noscript
    cleaned = cleaned.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
    // Remove SVG content (can be huge)
    cleaned = cleaned.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "<svg/>");
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, " ");
    // Remove comments
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");

    if (cleaned.length <= maxChars) {
      return cleaned;
    }

    // Extract important sections
    const headMatch = cleaned.match(/<head[^>]*>[\s\S]*?<\/head>/i);
    const headerMatch = cleaned.match(/<header[^>]*>[\s\S]*?<\/header>/i);
    const navMatch = cleaned.match(/<nav[^>]*>[\s\S]*?<\/nav>/i);
    const footerMatch = cleaned.match(/<footer[^>]*>[\s\S]*?<\/footer>/i);

    // Combine important sections
    let result = "";
    if (headMatch) result += headMatch[0];
    if (headerMatch) result += headerMatch[0];
    if (navMatch && result.length < maxChars * 0.7) result += navMatch[0];
    if (footerMatch && result.length < maxChars * 0.8) result += footerMatch[0];

    // Add first part of body if we have space
    const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch && result.length < maxChars * 0.9) {
      const bodyContent = bodyMatch[1].substring(0, maxChars - result.length);
      result += bodyContent;
    }

    return result.substring(0, maxChars);
  }

  /**
   * Extract branding using AI analysis
   */
  private static async extractWithAI(
    html: string,
    url: string
  ): Promise<AIExtractedBranding | null> {
    try {
      const openai = getOpenAIClient();
      const truncatedHtml = this.truncateHtmlForAI(html);

      const prompt = `Analyze this website HTML and extract branding information. Return a JSON object with these fields:

- brand_name: The main brand/company name (short, clean - remove taglines or suffixes from title)
- tagline: A short tagline or slogan (max 150 characters, clean and readable)
- primary_color: The main brand color in hex format (e.g., #ffed00) - look in CSS, inline styles, buttons, headers
- secondary_color: A secondary brand color in hex format - look for accent colors, backgrounds
- accent_color: An accent/highlight color in hex format - CTAs, links, highlights
- font_family: The main font family name (e.g., "Roboto", "Open Sans")
- logo_url: The URL of the logo image (look for img tags with "logo" in src/class/alt, or in header)

Important:
- For colors, look at background-color, color properties in styles, and common elements like buttons, headers, links
- Prefer hex colors (#xxx or #xxxxxx format)
- For logo, construct full URL if relative path
- Return null for any field you can't determine

Website URL: ${url}

HTML:
${truncatedHtml}

Return ONLY valid JSON, no markdown or explanation.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a web design analyst. Extract branding information from HTML and return clean JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.warn("[BrandingExtractor] AI returned empty response");
        return null;
      }

      const parsed = JSON.parse(content) as AIExtractedBranding;
      console.log("[BrandingExtractor] AI extraction successful:", parsed);
      return parsed;
    } catch (error) {
      console.error("[BrandingExtractor] AI extraction failed:", error);
      return null;
    }
  }

  /**
   * Main extraction method - fetches URL and extracts branding using AI
   */
  static async extractBranding(url: string): Promise<ExtractedBranding> {
    // Normalize URL
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    // Fetch HTML
    const html = await this.fetchHtml(url);

    // Parse metadata as fallback
    const metadata = this.parseMetadata(html, url);

    // Try AI extraction first
    const aiResult = await this.extractWithAI(html, url);

    // Extract logo with regex fallback
    const regexLogo = this.extractLogoFromHtml(html, url);

    // Debug logging for logo extraction
    console.log("[BrandingExtractor] Logo extraction debug:", {
      aiLogoUrl: aiResult?.logo_url,
      regexLogo,
      appleTouchIcon: metadata.appleTouchIcon,
      ogImage: metadata.ogImage,
      favicon: metadata.favicon,
    });

    // Build extracted branding, preferring AI results
    const branding: ExtractedBranding = {
      // App name: prefer AI, then OG site name, then OG title, then page title
      app_name:
        aiResult?.brand_name ||
        metadata.ogSiteName ||
        metadata.ogTitle ||
        metadata.title,

      // Tagline: prefer AI, then OG description, then meta description
      tagline:
        aiResult?.tagline ||
        this.truncateText(metadata.ogDescription || metadata.description || "", 150),

      // Welcome message: null for now
      welcome_message: null,

      // Primary color: prefer AI, then theme-color, then CSS variable
      primary_color: this.normalizeColorToHSL(
        aiResult?.primary_color ||
          metadata.themeColor ||
          metadata.cssColors.primary ||
          metadata.msApplicationTileColor ||
          ""
      ),

      // Secondary color: prefer AI, then CSS
      secondary_color: this.normalizeColorToHSL(
        aiResult?.secondary_color ||
          metadata.cssColors.secondary ||
          ""
      ),

      // Accent color: prefer AI, then CSS
      accent_color: this.normalizeColorToHSL(
        aiResult?.accent_color ||
          metadata.cssColors.accent ||
          ""
      ),

      // Font family: prefer AI, then Google Fonts
      font_family:
        aiResult?.font_family ||
        (metadata.fonts.length > 0 ? metadata.fonts[0] : null),

      // Logo URL: prefer regex if it found a real logo, then AI (if not favicon), then fallbacks
      // Regex specifically looks for "logo" in the path, so it's more reliable
      logo_url:
        regexLogo ||
        (aiResult?.logo_url && !aiResult.logo_url.toLowerCase().includes('favicon')
          ? this.resolveUrl(aiResult.logo_url, url)
          : null) ||
        metadata.appleTouchIcon ||
        metadata.ogImage ||
        metadata.favicon,
    };

    return branding;
  }

  /**
   * Truncate text to max length, ending at word boundary
   */
  private static truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "...";
  }
}
