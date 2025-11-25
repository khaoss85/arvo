"use server";

import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { EmailService } from "@/lib/services/email.service";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type SendMagicLinkResult = {
  success: boolean;
  error?: string;
};

export async function sendMagicLinkAction(email: string): Promise<SendMagicLinkResult> {
  try {
    const validated = emailSchema.parse({ email });
    const adminClient = getSupabaseAdmin();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Generate magic link using admin client (same pattern as admin approval)
    // This generates a link with ?token_hash=XXX instead of ?code=XXX
    // which is handled by verifyOtpToken() and doesn't require PKCE
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: validated.email,
      options: {
        redirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (error || !data?.properties?.action_link) {
      console.error('Error generating magic link:', error);
      return { success: false, error: 'Failed to generate magic link' };
    }

    // Try to get first name from waitlist entry
    let firstName = validated.email.split('@')[0];
    try {
      const { data: entry } = await adminClient
        .from('waitlist_entries')
        .select('first_name')
        .eq('email', validated.email)
        .single();
      if (entry?.first_name) firstName = entry.first_name;
    } catch {
      // Use email prefix as fallback
    }

    // Send email with magic link
    const sent = await EmailService.sendLoginMagicLinkEmail(
      validated.email,
      firstName,
      data.properties.action_link
    );

    if (!sent) {
      return { success: false, error: 'Failed to send magic link email' };
    }

    return { success: true };
  } catch (err) {
    console.error('sendMagicLinkAction error:', err);
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}
