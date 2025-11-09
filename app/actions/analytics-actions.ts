'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { InsightsGenerator } from '@/lib/agents/insights-generator.agent'
import type { InsightsOutput } from '@/lib/agents/insights-generator.agent'

export async function generateInsightsAction(
  userId: string,
  days: number = 30
): Promise<{ success: boolean; insights?: InsightsOutput; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const generator = new InsightsGenerator(supabase)
    const insights = await generator.generateInsights(userId, days)

    return {
      success: true,
      insights
    }
  } catch (error) {
    console.error('Failed to generate insights:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate insights'
    }
  }
}
