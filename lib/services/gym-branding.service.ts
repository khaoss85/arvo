import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { GymBranding, UpdateGymBrandingInput } from "@/lib/types/gym.types";

// =====================================================
// Gym Branding Service
// Handles file uploads and branding updates
// =====================================================

const BUCKET_NAME = "gym-assets";

// Allowed image types
const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
];

const ALLOWED_FAVICON_TYPES = [
  "image/png",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/svg+xml",
];

// Max file sizes (in bytes)
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_FAVICON_SIZE = 512 * 1024; // 512KB
const MAX_SPLASH_SIZE = 5 * 1024 * 1024; // 5MB

export class GymBrandingService {
  // =====================================================
  // File Upload Methods
  // =====================================================

  /**
   * Upload gym logo
   */
  static async uploadLogo(
    gymId: string,
    file: File,
    variant: "light" | "dark" = "light"
  ): Promise<string> {
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(
        `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`
      );
    }

    // Validate file size
    if (file.size > MAX_LOGO_SIZE) {
      throw new Error(
        `File too large. Maximum size: ${MAX_LOGO_SIZE / 1024 / 1024}MB`
      );
    }

    const supabase = getSupabaseBrowserClient();
    const ext = file.name.split(".").pop() || "png";
    const fileName =
      variant === "dark"
        ? `${gymId}/logo-dark.${ext}`
        : `${gymId}/logo.${ext}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(`Failed to upload logo: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    // Update branding record
    const updateField =
      variant === "dark" ? "logo_dark_url" : "logo_url";
    const { error: updateError } = await supabase
      .from("gym_branding")
      .update({ [updateField]: publicUrl })
      .eq("gym_id", gymId);

    if (updateError) {
      throw new Error(`Failed to update branding: ${updateError.message}`);
    }

    return publicUrl;
  }

  /**
   * Upload favicon
   */
  static async uploadFavicon(gymId: string, file: File): Promise<string> {
    // Validate file type
    if (!ALLOWED_FAVICON_TYPES.includes(file.type)) {
      throw new Error(
        `Invalid file type. Allowed: ${ALLOWED_FAVICON_TYPES.join(", ")}`
      );
    }

    // Validate file size
    if (file.size > MAX_FAVICON_SIZE) {
      throw new Error(
        `File too large. Maximum size: ${MAX_FAVICON_SIZE / 1024}KB`
      );
    }

    const supabase = getSupabaseBrowserClient();
    const ext = file.name.split(".").pop() || "ico";
    const fileName = `${gymId}/favicon.${ext}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(`Failed to upload favicon: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    // Update branding record
    const { error: updateError } = await supabase
      .from("gym_branding")
      .update({ favicon_url: publicUrl })
      .eq("gym_id", gymId);

    if (updateError) {
      throw new Error(`Failed to update branding: ${updateError.message}`);
    }

    return publicUrl;
  }

  /**
   * Upload splash screen image
   */
  static async uploadSplashImage(gymId: string, file: File): Promise<string> {
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(
        `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`
      );
    }

    // Validate file size
    if (file.size > MAX_SPLASH_SIZE) {
      throw new Error(
        `File too large. Maximum size: ${MAX_SPLASH_SIZE / 1024 / 1024}MB`
      );
    }

    const supabase = getSupabaseBrowserClient();
    const ext = file.name.split(".").pop() || "png";
    const fileName = `${gymId}/splash.${ext}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(`Failed to upload splash image: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    // Update branding record
    const { error: updateError } = await supabase
      .from("gym_branding")
      .update({ splash_image_url: publicUrl })
      .eq("gym_id", gymId);

    if (updateError) {
      throw new Error(`Failed to update branding: ${updateError.message}`);
    }

    return publicUrl;
  }

  // =====================================================
  // Delete Methods
  // =====================================================

  /**
   * Delete logo
   */
  static async deleteLogo(
    gymId: string,
    variant: "light" | "dark" = "light"
  ): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    // Get current branding to find file path
    const { data: branding } = await supabase
      .from("gym_branding")
      .select("logo_url, logo_dark_url")
      .eq("gym_id", gymId)
      .single();

    const url =
      variant === "dark" ? branding?.logo_dark_url : branding?.logo_url;

    if (url) {
      // Extract file path from URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const filePath = pathParts.slice(-2).join("/"); // gymId/logo.ext

      // Delete from storage
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    }

    // Update branding record
    const updateField = variant === "dark" ? "logo_dark_url" : "logo_url";
    await supabase
      .from("gym_branding")
      .update({ [updateField]: null })
      .eq("gym_id", gymId);
  }

  /**
   * Delete favicon
   */
  static async deleteFavicon(gymId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    // Get current branding
    const { data: branding } = await supabase
      .from("gym_branding")
      .select("favicon_url")
      .eq("gym_id", gymId)
      .single();

    if (branding?.favicon_url) {
      const urlObj = new URL(branding.favicon_url);
      const pathParts = urlObj.pathname.split("/");
      const filePath = pathParts.slice(-2).join("/");

      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    }

    await supabase
      .from("gym_branding")
      .update({ favicon_url: null })
      .eq("gym_id", gymId);
  }

  /**
   * Delete splash image
   */
  static async deleteSplashImage(gymId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { data: branding } = await supabase
      .from("gym_branding")
      .select("splash_image_url")
      .eq("gym_id", gymId)
      .single();

    if (branding?.splash_image_url) {
      const urlObj = new URL(branding.splash_image_url);
      const pathParts = urlObj.pathname.split("/");
      const filePath = pathParts.slice(-2).join("/");

      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    }

    await supabase
      .from("gym_branding")
      .update({ splash_image_url: null })
      .eq("gym_id", gymId);
  }

  // =====================================================
  // Color Methods
  // =====================================================

  /**
   * Parse HSL color string to components
   * Input: "221 83% 53%" -> { h: 221, s: 83, l: 53 }
   */
  static parseHSL(hslString: string): { h: number; s: number; l: number } | null {
    const match = hslString.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
    if (!match) return null;

    return {
      h: parseInt(match[1], 10),
      s: parseInt(match[2], 10),
      l: parseInt(match[3], 10),
    };
  }

  /**
   * Format HSL components to string
   */
  static formatHSL(h: number, s: number, l: number): string {
    return `${h} ${s}% ${l}%`;
  }

  /**
   * Update colors
   */
  static async updateColors(
    gymId: string,
    colors: {
      primary?: string;
      secondary?: string;
      accent?: string;
    }
  ): Promise<GymBranding> {
    const supabase = getSupabaseBrowserClient();

    const updateData: Record<string, string> = {};
    if (colors.primary) updateData.primary_color = colors.primary;
    if (colors.secondary) updateData.secondary_color = colors.secondary;
    if (colors.accent) updateData.accent_color = colors.accent;

    const { data, error } = await supabase
      .from("gym_branding")
      .update(updateData)
      .eq("gym_id", gymId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update colors: ${error.message}`);
    }

    return data as GymBranding;
  }

  // =====================================================
  // Typography Methods
  // =====================================================

  /**
   * Update font settings
   */
  static async updateFonts(
    gymId: string,
    fonts: {
      font_family?: string | null;
      font_heading?: string | null;
    }
  ): Promise<GymBranding> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("gym_branding")
      .update(fonts)
      .eq("gym_id", gymId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update fonts: ${error.message}`);
    }

    return data as GymBranding;
  }

  // =====================================================
  // Text Methods
  // =====================================================

  /**
   * Update custom texts
   */
  static async updateTexts(
    gymId: string,
    texts: {
      welcome_message?: { en?: string; it?: string } | null;
      tagline?: { en?: string; it?: string } | null;
      footer_text?: { en?: string; it?: string } | null;
    }
  ): Promise<GymBranding> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("gym_branding")
      .update(texts)
      .eq("gym_id", gymId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update texts: ${error.message}`);
    }

    return data as GymBranding;
  }

  // =====================================================
  // Full Branding Update
  // =====================================================

  /**
   * Update all branding settings at once
   */
  static async updateBranding(
    gymId: string,
    input: UpdateGymBrandingInput
  ): Promise<GymBranding> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("gym_branding")
      .update(input)
      .eq("gym_id", gymId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update branding: ${error.message}`);
    }

    return data as GymBranding;
  }

  // =====================================================
  // Branding Preview
  // =====================================================

  /**
   * Get branding for preview (public, by slug)
   */
  static async getBrandingBySlug(slug: string): Promise<{
    gym_id: string;
    gym_name: string;
    gym_description: string | null;
    logo_url: string | null;
    logo_dark_url: string | null;
    splash_image_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    accent_color: string | null;
    font_family: string | null;
    welcome_message: { en?: string; it?: string } | null;
    tagline: { en?: string; it?: string } | null;
    app_name: string | null;
  } | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase.rpc("get_gym_branding_by_slug", {
      p_slug: slug.toLowerCase(),
    });

    if (error) {
      throw new Error(`Failed to get branding: ${error.message}`);
    }

    if (!data || data.length === 0) return null;

    const result = data[0];
    return {
      ...result,
      welcome_message: result.welcome_message as { en?: string; it?: string } | null,
      tagline: result.tagline as { en?: string; it?: string } | null,
    };
  }
}
