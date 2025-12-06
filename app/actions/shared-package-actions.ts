'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { SharedPackageService } from '@/lib/services/shared-package.service';
import type { BookingPackage, InsertBookingPackage, SharedPackageUsage } from '@/lib/types/schemas';

export interface CreateSharedPackageInput {
  primaryClientId: string;
  sharedWithClientIds: string[];
  name: string;
  totalSessions: number;
  sessionsPerWeek?: number;
  startDate: string;
  endDate?: string | null;
}

export async function createSharedPackageAction(
  input: CreateSharedPackageInput
): Promise<{
  success: boolean;
  package?: BookingPackage;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const pkg = await SharedPackageService.createSharedPackage(
      user.id,
      input.primaryClientId,
      input.sharedWithClientIds,
      {
        name: input.name,
        total_sessions: input.totalSessions,
        sessions_per_week: input.sessionsPerWeek || 1,
        start_date: input.startDate,
        end_date: input.endDate || null,
        status: 'active',
        ai_suggested_slots: null,
        slots_confirmed: false,
      }
    );

    return { success: true, package: pkg };
  } catch (error) {
    console.error('Error creating shared package:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create shared package',
    };
  }
}

export async function addClientToPackageAction(
  packageId: string,
  clientId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await SharedPackageService.addClientToPackage(packageId, clientId);

    return { success: true };
  } catch (error) {
    console.error('Error adding client to package:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add client to package',
    };
  }
}

export async function removeClientFromPackageAction(
  packageId: string,
  clientId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await SharedPackageService.removeClientFromPackage(packageId, clientId);

    return { success: true };
  } catch (error) {
    console.error('Error removing client from package:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove client from package',
    };
  }
}

export async function getSharedPackageUsageAction(packageId: string): Promise<{
  success: boolean;
  usage?: SharedPackageUsage[];
  error?: string;
}> {
  try {
    const usage = await SharedPackageService.getSharedPackageUsage(packageId);

    return { success: true, usage };
  } catch (error) {
    console.error('Error getting shared package usage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get package usage',
    };
  }
}

export async function getClientAvailablePackagesAction(clientId: string): Promise<{
  success: boolean;
  packages?: BookingPackage[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const packages = await SharedPackageService.getClientAvailablePackages(user.id, clientId);

    return { success: true, packages };
  } catch (error) {
    console.error('Error getting client available packages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get available packages',
    };
  }
}

export async function getPackageUsersAction(packageId: string): Promise<{
  success: boolean;
  users?: Array<{ id: string; name: string }>;
  error?: string;
}> {
  try {
    const users = await SharedPackageService.getPackageUsers(packageId);

    return { success: true, users };
  } catch (error) {
    console.error('Error getting package users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get package users',
    };
  }
}

export async function convertToSharedPackageAction(
  packageId: string,
  sharedWithClientIds: string[]
): Promise<{
  success: boolean;
  package?: BookingPackage;
  error?: string;
}> {
  try {
    const pkg = await SharedPackageService.convertToSharedPackage(packageId, sharedWithClientIds);

    return { success: true, package: pkg };
  } catch (error) {
    console.error('Error converting to shared package:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert package',
    };
  }
}

export async function trackSessionUsageAction(
  bookingId: string,
  usedByClientId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await SharedPackageService.trackSessionUsage(bookingId, usedByClientId);

    return { success: true };
  } catch (error) {
    console.error('Error tracking session usage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to track session usage',
    };
  }
}

export interface CoachClient {
  client_id: string;
  client_name: string;
}

export async function getCoachClientsAction(): Promise<{
  success: boolean;
  clients?: CoachClient[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('coach_client_relationships')
      .select(`
        client_id,
        user_profiles!coach_client_relationships_client_id_fkey(first_name)
      `)
      .eq('coach_id', user.id)
      .eq('status', 'active');

    if (error) {
      throw error;
    }

    const clients = (data || []).map((r: any) => ({
      client_id: r.client_id,
      client_name: r.user_profiles?.first_name || 'Unknown',
    }));

    return { success: true, clients };
  } catch (error) {
    console.error('Error getting coach clients:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get clients',
    };
  }
}
