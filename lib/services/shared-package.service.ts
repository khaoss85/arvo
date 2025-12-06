import { getSupabaseServerClient } from '@/lib/supabase/server';
import type {
  BookingPackage,
  InsertBookingPackage,
  SharedPackageUsage,
} from '@/lib/types/schemas';

export class SharedPackageService {
  /**
   * Create a shared package
   */
  static async createSharedPackage(
    coachId: string,
    primaryClientId: string,
    sharedWithClientIds: string[],
    packageData: Omit<InsertBookingPackage, 'coach_id' | 'client_id' | 'is_shared' | 'shared_with_client_ids' | 'max_shared_users'>
  ): Promise<BookingPackage> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('booking_packages')
      .insert({
        ...packageData,
        coach_id: coachId,
        client_id: primaryClientId,
        is_shared: true,
        shared_with_client_ids: sharedWithClientIds,
        max_shared_users: sharedWithClientIds.length + 1, // Primary + shared
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shared package:', error);
      throw error;
    }

    return data as BookingPackage;
  }

  /**
   * Add a client to an existing shared package
   */
  static async addClientToPackage(
    packageId: string,
    clientId: string
  ): Promise<void> {
    const supabase = await getSupabaseServerClient();

    // Get current package
    const { data: pkg, error: fetchError } = await supabase
      .from('booking_packages')
      .select('shared_with_client_ids, max_shared_users, client_id')
      .eq('id', packageId)
      .single();

    if (fetchError || !pkg) {
      throw new Error('Package not found');
    }

    const currentShared = pkg.shared_with_client_ids || [];
    const totalUsers = currentShared.length + 1; // +1 for primary

    // Check if already at max
    if (totalUsers >= (pkg.max_shared_users || 1)) {
      throw new Error('Package has reached maximum shared users');
    }

    // Check if client already in package
    if (clientId === pkg.client_id || currentShared.includes(clientId)) {
      throw new Error('Client is already part of this package');
    }

    // Add client
    const { error } = await supabase
      .from('booking_packages')
      .update({
        is_shared: true,
        shared_with_client_ids: [...currentShared, clientId],
      })
      .eq('id', packageId);

    if (error) {
      console.error('Error adding client to package:', error);
      throw error;
    }
  }

  /**
   * Remove a client from a shared package
   */
  static async removeClientFromPackage(
    packageId: string,
    clientId: string
  ): Promise<void> {
    const supabase = await getSupabaseServerClient();

    // Get current package
    const { data: pkg, error: fetchError } = await supabase
      .from('booking_packages')
      .select('shared_with_client_ids, client_id')
      .eq('id', packageId)
      .single();

    if (fetchError || !pkg) {
      throw new Error('Package not found');
    }

    // Cannot remove primary client
    if (clientId === pkg.client_id) {
      throw new Error('Cannot remove primary client from package');
    }

    const currentShared = pkg.shared_with_client_ids || [];
    const newShared = currentShared.filter((id: string) => id !== clientId);

    // Update package
    const { error } = await supabase
      .from('booking_packages')
      .update({
        shared_with_client_ids: newShared,
        is_shared: newShared.length > 0,
      })
      .eq('id', packageId);

    if (error) {
      console.error('Error removing client from package:', error);
      throw error;
    }
  }

  /**
   * Get all clients who can use a package (primary + shared)
   */
  static async getPackageUsers(
    packageId: string
  ): Promise<Array<{ id: string; name: string }>> {
    const supabase = await getSupabaseServerClient();

    // Get package with shared clients
    const { data: pkg, error: pkgError } = await supabase
      .from('booking_packages')
      .select('client_id, shared_with_client_ids')
      .eq('id', packageId)
      .single();

    if (pkgError || !pkg) {
      return [];
    }

    const allClientIds = [pkg.client_id, ...(pkg.shared_with_client_ids || [])];

    // Get client names
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name')
      .in('user_id', allClientIds);

    if (profilesError) {
      console.error('Error getting package users:', profilesError);
      return [];
    }

    return (profiles || []).map((p) => ({
      id: p.user_id,
      name: p.first_name || 'Unknown',
    }));
  }

  /**
   * Get packages available to a client (their own + shared)
   */
  static async getClientAvailablePackages(
    coachId: string,
    clientId: string
  ): Promise<BookingPackage[]> {
    const supabase = await getSupabaseServerClient();

    // Get packages where client is primary OR in shared list
    const { data, error } = await supabase
      .from('booking_packages')
      .select('*')
      .eq('coach_id', coachId)
      .eq('status', 'active')
      .or(`client_id.eq.${clientId},shared_with_client_ids.cs.{${clientId}}`);

    if (error) {
      console.error('Error getting client available packages:', error);
      throw error;
    }

    // Filter to only packages with remaining sessions
    return (data || []).filter(
      (p) => (p.sessions_used ?? 0) < p.total_sessions
    ) as BookingPackage[];
  }

  /**
   * Track which client used a session (for shared packages)
   */
  static async trackSessionUsage(
    bookingId: string,
    usedByClientId: string
  ): Promise<void> {
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase
      .from('bookings')
      .update({ session_used_by_client_id: usedByClientId })
      .eq('id', bookingId);

    if (error) {
      console.error('Error tracking session usage:', error);
      throw error;
    }
  }

  /**
   * Get usage breakdown for a shared package
   */
  static async getSharedPackageUsage(
    packageId: string
  ): Promise<SharedPackageUsage[]> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase.rpc('get_shared_package_usage', {
      p_package_id: packageId,
    });

    if (error) {
      console.error('Error getting shared package usage:', error);
      throw error;
    }

    return (data || []) as SharedPackageUsage[];
  }

  /**
   * Check if a client can use a specific package
   */
  static async canClientUsePackage(
    packageId: string,
    clientId: string
  ): Promise<boolean> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase.rpc('can_client_use_package', {
      p_package_id: packageId,
      p_client_id: clientId,
    });

    if (error) {
      console.error('Error checking package usage:', error);
      return false;
    }

    return data === true;
  }

  /**
   * Convert a regular package to shared
   */
  static async convertToSharedPackage(
    packageId: string,
    sharedWithClientIds: string[]
  ): Promise<BookingPackage> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('booking_packages')
      .update({
        is_shared: true,
        shared_with_client_ids: sharedWithClientIds,
        max_shared_users: sharedWithClientIds.length + 1,
      })
      .eq('id', packageId)
      .select()
      .single();

    if (error) {
      console.error('Error converting to shared package:', error);
      throw error;
    }

    return data as BookingPackage;
  }
}
