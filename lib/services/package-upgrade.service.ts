import { getSupabaseServerClient } from '@/lib/supabase/server';
import type {
  PackageUpgradeSuggestion,
  InsertPackageUpgradeSuggestion,
  UpgradeSuggestionWithDetails,
  PackageUpgradeSuggestionStatus,
} from '@/lib/types/schemas';

export class PackageUpgradeService {
  // If 100% of package used in less than 14 days, suggest upgrade
  static readonly FAST_USAGE_THRESHOLD_DAYS = 14;

  /**
   * Check if a completed package qualifies for upgrade suggestion
   * Called when a package reaches 100% usage
   */
  static async checkForUpgradeSuggestion(
    packageId: string
  ): Promise<PackageUpgradeSuggestion | null> {
    const supabase = await getSupabaseServerClient();

    // Use the database function to check
    const { data, error } = await supabase.rpc('should_suggest_upgrade', {
      p_package_id: packageId,
    });

    if (error) {
      console.error('Error checking upgrade suggestion:', error);
      return null;
    }

    const result = data?.[0];
    if (!result?.should_suggest) {
      return null;
    }

    // Get package details to create suggestion
    const { data: pkg } = await supabase
      .from('booking_packages')
      .select('coach_id, client_id')
      .eq('id', packageId)
      .single();

    if (!pkg) return null;

    // Create the suggestion
    return this.createUpgradeSuggestion(
      packageId,
      pkg.coach_id,
      pkg.client_id,
      result.reason,
      result.suggested_sessions,
      result.days_to_complete
    );
  }

  /**
   * Create an upgrade suggestion
   */
  static async createUpgradeSuggestion(
    packageId: string,
    coachId: string,
    clientId: string,
    reason: string,
    suggestedSessions: number,
    daysToComplete: number
  ): Promise<PackageUpgradeSuggestion | null> {
    const supabase = await getSupabaseServerClient();

    // Get current sessions from package
    const { data: pkg } = await supabase
      .from('booking_packages')
      .select('total_sessions')
      .eq('id', packageId)
      .single();

    if (!pkg) return null;

    const suggestion: InsertPackageUpgradeSuggestion = {
      coach_id: coachId,
      client_id: clientId,
      package_id: packageId,
      reason: reason as 'fast_usage' | 'frequent_rebuy' | 'high_attendance',
      suggested_sessions: suggestedSessions,
      current_sessions: pkg.total_sessions,
      days_to_complete: daysToComplete,
      status: 'pending',
      sent_at: null,
      responded_at: null,
    };

    const { data, error } = await supabase
      .from('package_upgrade_suggestions')
      .insert(suggestion)
      .select()
      .single();

    if (error) {
      // Might be duplicate (UNIQUE constraint on package_id)
      if (error.code === '23505') {
        console.log('Upgrade suggestion already exists for package:', packageId);
        return null;
      }
      console.error('Error creating upgrade suggestion:', error);
      throw error;
    }

    return data as PackageUpgradeSuggestion;
  }

  /**
   * Get pending upgrade suggestions for a coach's dashboard
   */
  static async getPendingUpgradeSuggestions(
    coachId: string
  ): Promise<UpgradeSuggestionWithDetails[]> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('package_upgrade_suggestions')
      .select(`
        *,
        booking_packages!inner (
          name
        ),
        user_profiles:client_id (
          first_name,
          user_id
        )
      `)
      .eq('coach_id', coachId)
      .in('status', ['pending', 'sent'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting pending upgrade suggestions:', error);
      throw error;
    }

    return (data || []).map((s) => ({
      ...s,
      client_name: (s.user_profiles as { first_name?: string })?.first_name || 'Unknown',
      package_name: (s.booking_packages as { name?: string })?.name || 'Package',
    })) as UpgradeSuggestionWithDetails[];
  }

  /**
   * Update suggestion status
   */
  static async updateSuggestionStatus(
    suggestionId: string,
    status: PackageUpgradeSuggestionStatus
  ): Promise<void> {
    const supabase = await getSupabaseServerClient();

    const updates: Record<string, string> = { status };

    if (status === 'sent') {
      updates.sent_at = new Date().toISOString();
    } else if (status === 'accepted' || status === 'dismissed') {
      updates.responded_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('package_upgrade_suggestions')
      .update(updates)
      .eq('id', suggestionId);

    if (error) {
      console.error('Error updating suggestion status:', error);
      throw error;
    }
  }

  /**
   * Dismiss a suggestion
   */
  static async dismissSuggestion(suggestionId: string): Promise<void> {
    await this.updateSuggestionStatus(suggestionId, 'dismissed');
  }

  /**
   * Mark suggestion as sent (when coach contacts client)
   */
  static async markSuggestionSent(suggestionId: string): Promise<void> {
    await this.updateSuggestionStatus(suggestionId, 'sent');
  }

  /**
   * Calculate suggested package size based on usage speed
   * Simple logic: round up to next common tier
   */
  static calculateSuggestedSize(
    currentSessions: number,
    daysToComplete: number
  ): number {
    // Very fast usage (< 7 days): suggest 2x
    // Fast usage (< 14 days): suggest 1.5x
    // Use common package sizes: 5, 10, 15, 20, 30

    const commonSizes = [5, 10, 15, 20, 30];
    const multiplier = daysToComplete < 7 ? 2 : 1.5;
    const targetSize = Math.ceil(currentSessions * multiplier);

    // Find next common size
    return commonSizes.find((size) => size >= targetSize) || targetSize;
  }

  /**
   * Get count of pending suggestions (for badge display)
   */
  static async getPendingSuggestionsCount(coachId: string): Promise<number> {
    const supabase = await getSupabaseServerClient();

    const { count, error } = await supabase
      .from('package_upgrade_suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error getting pending suggestions count:', error);
      return 0;
    }

    return count || 0;
  }
}
