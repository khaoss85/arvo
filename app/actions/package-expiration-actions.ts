'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PackageExpirationService } from '@/lib/services/package-expiration.service';
import type { ExpiringPackage } from '@/lib/types/schemas';

export async function getExpiringPackagesAction(withinDays: number = 7): Promise<{
  success: boolean;
  packages?: ExpiringPackage[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const packages = await PackageExpirationService.getExpiringPackages(user.id, withinDays);

    return { success: true, packages };
  } catch (error) {
    console.error('Error getting expiring packages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get expiring packages',
    };
  }
}

export async function getExpiringPackagesGroupedAction(): Promise<{
  success: boolean;
  grouped?: {
    today: ExpiringPackage[];
    threeDays: ExpiringPackage[];
    sevenDays: ExpiringPackage[];
  };
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const grouped = await PackageExpirationService.getExpiringPackagesGrouped(user.id);

    return { success: true, grouped };
  } catch (error) {
    console.error('Error getting grouped expiring packages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get expiring packages',
    };
  }
}

export async function checkPackageExpirationAction(packageId: string): Promise<{
  success: boolean;
  result?: {
    isExpiring: boolean;
    daysRemaining: number | null;
    sessionsRemaining: number;
  };
  error?: string;
}> {
  try {
    const result = await PackageExpirationService.checkPackageExpiration(packageId);

    return { success: true, result };
  } catch (error) {
    console.error('Error checking package expiration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check package expiration',
    };
  }
}
