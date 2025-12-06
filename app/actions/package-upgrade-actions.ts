'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PackageUpgradeService } from '@/lib/services/package-upgrade.service';
import type { UpgradeSuggestionWithDetails } from '@/lib/types/schemas';

export async function getPendingUpgradeSuggestionsAction(): Promise<{
  success: boolean;
  suggestions?: UpgradeSuggestionWithDetails[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const suggestions = await PackageUpgradeService.getPendingUpgradeSuggestions(user.id);

    return { success: true, suggestions };
  } catch (error) {
    console.error('Error getting pending upgrade suggestions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get upgrade suggestions',
    };
  }
}

export async function getPendingSuggestionsCountAction(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const count = await PackageUpgradeService.getPendingSuggestionsCount(user.id);

    return { success: true, count };
  } catch (error) {
    console.error('Error getting pending suggestions count:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get count',
    };
  }
}

export async function dismissUpgradeSuggestionAction(suggestionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await PackageUpgradeService.dismissSuggestion(suggestionId);

    return { success: true };
  } catch (error) {
    console.error('Error dismissing upgrade suggestion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to dismiss suggestion',
    };
  }
}

export async function markSuggestionSentAction(suggestionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await PackageUpgradeService.markSuggestionSent(suggestionId);

    return { success: true };
  } catch (error) {
    console.error('Error marking suggestion as sent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark suggestion as sent',
    };
  }
}

export async function checkForUpgradeSuggestionAction(packageId: string): Promise<{
  success: boolean;
  suggestionCreated?: boolean;
  error?: string;
}> {
  try {
    const suggestion = await PackageUpgradeService.checkForUpgradeSuggestion(packageId);

    return {
      success: true,
      suggestionCreated: suggestion !== null,
    };
  } catch (error) {
    console.error('Error checking for upgrade suggestion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check for upgrade suggestion',
    };
  }
}
