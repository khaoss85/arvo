import { NextResponse } from 'next/server'
import { ActivityService } from '@/lib/services/activity.service'

export async function POST() {
  try {
    console.log('[Backfill Milestones] Starting backfill process...')

    const result = await ActivityService.backfillMilestones()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Milestone backfill completed successfully',
        stats: result.stats,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Milestone backfill failed',
          stats: result.stats,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Backfill Milestones] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
