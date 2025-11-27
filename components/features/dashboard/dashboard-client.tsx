'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { SplitCycleTimeline } from "./split-cycle-timeline"
import { ActivityFeed } from "./activity-feed"
import { CheckRoomCard } from "./check-room-card"
import { CycleCompletionModal } from "./cycle-completion-modal"
import { SplitSelectionDialog } from "./split-selection-dialog"
import { SplitAdaptationProgress } from "./split-adaptation-progress"
import { ModeQuickSwitch } from "@/components/ui/mode-quick-switch"
import type { User } from "@supabase/supabase-js"
import type { MuscleVolumeProgress } from "@/lib/actions/volume-progress-actions"
import type { UserProfile } from "@/lib/types/schemas"
import { getCycleComparisonAction, changeSplitPlanAction, getActiveSplitPlanAction, getAllSplitPlansAction } from "@/app/actions/split-actions"

interface DashboardClientProps {
  user: User
  profile: UserProfile
  workouts: any[]
  volumeProgress: MuscleVolumeProgress[]
}

export function DashboardClient({ user, profile, volumeProgress }: DashboardClientProps) {
  const t = useTranslations("dashboard")
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [showSplitSelection, setShowSplitSelection] = useState(false)
  const [showAdaptationProgress, setShowAdaptationProgress] = useState(false)
  const [cycleStats, setCycleStats] = useState<any>(null)
  const [splitPlanName, setSplitPlanName] = useState<string>("")
  const [availableSplits, setAvailableSplits] = useState<any[]>([])

  // Check if cycle was recently completed (within last 5 minutes)
  useEffect(() => {
    const checkCycleCompletion = async () => {
      if (!profile.last_cycle_completed_at) return

      const completedAt = new Date(profile.last_cycle_completed_at)
      const now = new Date()
      const diffMinutes = (now.getTime() - completedAt.getTime()) / (1000 * 60)

      // Show modal if cycle completed in the last 5 minutes and not dismissed
      const dismissed = sessionStorage.getItem(`cycle-completed-${profile.last_cycle_completed_at}`)
      if (diffMinutes < 5 && !dismissed) {
        // Fetch cycle stats and comparison
        const result = await getCycleComparisonAction(user.id)
        if (result.success && result.data) {
          setCycleStats(result.data)

          // Fetch split plan name
          const splitResult = await getActiveSplitPlanAction(user.id)
          if (splitResult.success && splitResult.data) {
            setSplitPlanName(splitResult.data.split_type.replace(/_/g, ' '))
          }

          setShowCompletionModal(true)
        }
      }
    }

    checkCycleCompletion()
  }, [profile.last_cycle_completed_at, user.id])

  const handleContinue = () => {
    // Mark modal as dismissed
    if (profile.last_cycle_completed_at) {
      sessionStorage.setItem(`cycle-completed-${profile.last_cycle_completed_at}`, 'true')
    }
    setShowCompletionModal(false)
  }

  const handleChangeSplit = async () => {
    // Fetch available splits
    const result = await getAllSplitPlansAction(user.id)
    if (result.success && result.data) {
      setAvailableSplits(result.data)
      setShowCompletionModal(false)
      setShowSplitSelection(true)
    }
  }

  const handleAdaptSplit = () => {
    // Show adaptation progress modal (triggers async API)
    setShowCompletionModal(false)
    setShowAdaptationProgress(true)
  }

  const handleAdaptationComplete = () => {
    // Mark modal as dismissed
    if (profile.last_cycle_completed_at) {
      sessionStorage.setItem(`cycle-completed-${profile.last_cycle_completed_at}`, 'true')
    }
    // Reload page to show adapted split
    window.location.reload()
  }

  const handleAdaptationError = (error: string) => {
    console.error('Adaptation failed:', error)
    setShowAdaptationProgress(false)
    // Optionally show error to user
    alert(error)
  }

  const handleSelectSplit = async (splitId: string) => {
    const result = await changeSplitPlanAction(user.id, splitId)
    if (result.success) {
      setShowSplitSelection(false)
      // Mark modal as dismissed
      if (profile.last_cycle_completed_at) {
        sessionStorage.setItem(`cycle-completed-${profile.last_cycle_completed_at}`, 'true')
      }
      // Reload page to show new split
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-8">
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {t("welcome", { email: user.email || "" })}
              </p>
              {profile.active_split_plan_id && profile.current_cycle_day && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                  {t("cycleProgress", {
                    cycleNumber: (profile.cycles_completed || 0) + 1,
                    currentDay: profile.current_cycle_day
                  })}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Prima riga su mobile: Mode Switch full width */}
              <ModeQuickSwitch className="w-full sm:w-auto" />

              {/* Seconda riga su mobile: Settings + Progress */}
              <div className="flex gap-2 w-full sm:w-auto">
                <Link
                  href="/settings"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t("settings")}
                </Link>
                <Link
                  href="/progress"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {t("viewProgress")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <SplitCycleTimeline userId={user.id} volumeProgress={volumeProgress} />
        </div>

        <section aria-labelledby="recent-activity-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="recent-activity-heading" className="text-2xl font-bold">{t("recentActivity")}</h2>
            <Link
              href="/progress"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              {t("viewAllHistory")}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <ActivityFeed userId={user.id} limit={10} />

          {/* Check Room */}
          <CheckRoomCard userId={user.id} className="mt-6" />
        </section>
      </div>

      {/* Cycle Completion Modal */}
      {showCompletionModal && cycleStats && (
        <CycleCompletionModal
          open={showCompletionModal}
          onOpenChange={setShowCompletionModal}
          cycleNumber={cycleStats.cycleNumber}
          splitPlanName={splitPlanName}
          stats={{
            totalVolume: cycleStats.currentStats.totalVolume,
            totalWorkouts: cycleStats.currentStats.totalWorkoutsCompleted,
            avgMentalReadiness: cycleStats.currentStats.avgMentalReadiness,
            totalSets: cycleStats.currentStats.totalSets,
          }}
          comparison={cycleStats.comparison}
          volumeByMuscleGroup={cycleStats.currentStats.setsByMuscleGroup || cycleStats.currentStats.volumeByMuscleGroup}
          previousVolumeByMuscleGroup={cycleStats.previousVolumeByMuscleGroup}
          onContinue={handleContinue}
          onAdaptSplit={handleAdaptSplit}
          onChangeSplit={handleChangeSplit}
        />
      )}

      {/* Split Selection Dialog */}
      {showSplitSelection && (
        <SplitSelectionDialog
          open={showSplitSelection}
          onOpenChange={setShowSplitSelection}
          splits={availableSplits}
          currentSplitId={profile.active_split_plan_id}
          onSelect={handleSelectSplit}
        />
      )}

      {/* Split Adaptation Progress */}
      {showAdaptationProgress && (
        <SplitAdaptationProgress
          onComplete={handleAdaptationComplete}
          onError={handleAdaptationError}
        />
      )}
    </div>
  )
}
