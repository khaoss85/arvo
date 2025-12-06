import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { ExpiringPackage } from '@/lib/types/schemas';
import { BookingNotificationService } from './booking-notification.service';

export class PackageExpirationService {
  // Alert thresholds in days
  static readonly EXPIRY_WARNING_DAYS = [7, 3, 1];

  /**
   * Get packages expiring within N days for a coach
   */
  static async getExpiringPackages(
    coachId: string,
    withinDays: number = 7
  ): Promise<ExpiringPackage[]> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase.rpc('get_expiring_packages', {
      p_coach_id: coachId,
      p_within_days: withinDays,
    });

    if (error) {
      console.error('Error getting expiring packages:', error);
      throw error;
    }

    return (data || []) as ExpiringPackage[];
  }

  /**
   * Check single package expiration status
   */
  static async checkPackageExpiration(packageId: string): Promise<{
    isExpiring: boolean;
    daysRemaining: number | null;
    sessionsRemaining: number;
  }> {
    const supabase = await getSupabaseServerClient();

    const { data: pkg, error } = await supabase
      .from('booking_packages')
      .select('end_date, total_sessions, sessions_used, status')
      .eq('id', packageId)
      .single();

    if (error || !pkg) {
      return { isExpiring: false, daysRemaining: null, sessionsRemaining: 0 };
    }

    const sessionsRemaining = pkg.total_sessions - (pkg.sessions_used || 0);

    if (!pkg.end_date || pkg.status !== 'active') {
      return { isExpiring: false, daysRemaining: null, sessionsRemaining };
    }

    const endDate = new Date(pkg.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const daysRemaining = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      isExpiring: daysRemaining <= 7 && sessionsRemaining > 0,
      daysRemaining,
      sessionsRemaining,
    };
  }

  /**
   * Process expiration alerts for all packages (called by cron)
   * Returns count of checked packages and queued notifications
   */
  static async processExpirationAlerts(): Promise<{
    checked: number;
    alerted: number;
  }> {
    const supabase = await getSupabaseServerClient();

    // Get all active packages with end_date that might be expiring
    const { data: packages, error } = await supabase
      .from('booking_packages')
      .select('id, coach_id, client_id, name, end_date, total_sessions, sessions_used')
      .eq('status', 'active')
      .not('end_date', 'is', null)
      .gt('total_sessions', supabase.rpc('sessions_used'));

    if (error) {
      console.error('Error fetching packages for expiration check:', error);
      throw error;
    }

    let checked = 0;
    let alerted = 0;

    for (const pkg of packages || []) {
      checked++;

      if (!pkg.end_date) continue;

      const endDate = new Date(pkg.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      const daysRemaining = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      const sessionsRemaining = pkg.total_sessions - (pkg.sessions_used || 0);

      // Only alert if package has remaining sessions
      if (sessionsRemaining <= 0) continue;

      // Check if days match any threshold
      if (!this.EXPIRY_WARNING_DAYS.includes(daysRemaining)) continue;

      // Check if notification already sent for this threshold
      const { data: existingNotif } = await supabase
        .from('booking_notifications')
        .select('id')
        .eq('recipient_id', pkg.client_id)
        .eq('notification_type', 'package_expiring_soon')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (existingNotif) continue;

      // Queue notification
      await BookingNotificationService.queuePackageExpirationAlert({
        coachId: pkg.coach_id,
        clientId: pkg.client_id,
        packageName: pkg.name,
        sessionsRemaining,
        daysUntilExpiry: daysRemaining,
      });

      alerted++;
    }

    return { checked, alerted };
  }

  /**
   * Get packages grouped by urgency for dashboard display
   */
  static async getExpiringPackagesGrouped(coachId: string): Promise<{
    today: ExpiringPackage[];
    threeDays: ExpiringPackage[];
    sevenDays: ExpiringPackage[];
  }> {
    const packages = await this.getExpiringPackages(coachId, 7);

    return {
      today: packages.filter((p) => p.days_until_expiry <= 1),
      threeDays: packages.filter((p) => p.days_until_expiry > 1 && p.days_until_expiry <= 3),
      sevenDays: packages.filter((p) => p.days_until_expiry > 3 && p.days_until_expiry <= 7),
    };
  }
}
