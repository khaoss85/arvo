import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Locale } from '@/i18n';
import { defaultLocale } from '@/i18n';

/**
 * Retrieves the user's preferred language from their profile.
 * Falls back to default locale (English) if not found or on error.
 *
 * This is a server-side utility to be used in Server Actions.
 *
 * @param userId - The user's UUID
 * @returns The user's preferred language (en or it)
 */
export async function getUserLanguage(userId: string): Promise<Locale> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('preferred_language')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[getUserLanguage] Error fetching user profile:', error);
      return defaultLocale;
    }

    // Validate the language is supported
    const language = profile?.preferred_language;
    if (language === 'en' || language === 'it') {
      return language;
    }

    return defaultLocale;
  } catch (error) {
    console.error('[getUserLanguage] Unexpected error:', error);
    return defaultLocale;
  }
}
