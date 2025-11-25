"use client";

import { useTranslations } from "next-intl";
import { MuscleRadarChart } from "@/components/features/analytics/muscle-radar-chart";
import { ActivityCalendar } from "./activity-calendar";
import { Card } from "@/components/ui/card";
import type { Workout } from "@/lib/types/schemas";

interface SimpleReportPageProps {
  targetData: Record<string, number>;
  actualData: Record<string, number>;
  completedWorkouts: Workout[];
}

export function SimpleReportPage({
  targetData,
  actualData,
  completedWorkouts,
}: SimpleReportPageProps) {
  const t = useTranslations("simpleMode.report");
  // Calculate streak
  const streak = calculateStreak(completedWorkouts);

  // Check if we have data
  const hasRadarData =
    Object.keys(targetData).length > 0 || Object.keys(actualData).length > 0;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Streak Card */}
      {streak > 0 && (
        <Card className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="text-2xl font-bold text-orange-500">{streak}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {streak === 1 ? t("consecutiveDay") : t("consecutiveDays")}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Radar Chart */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("muscleDistribution")}
        </h2>
        {hasRadarData ? (
          <div className="h-[300px]">
            <MuscleRadarChart
              targetData={targetData}
              actualData={actualData}
              comparisonMode="target"
              maxMuscles={6}
            />
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {t("noDataYet")}
            </p>
          </div>
        )}
      </Card>

      {/* Activity Calendar */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("activity")}
        </h2>
        <ActivityCalendar completedWorkouts={completedWorkouts} />
      </Card>

      {/* Stats Summary */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("summary")}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {completedWorkouts.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("totalWorkouts")}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {getTotalSets(completedWorkouts)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("totalSets")}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Helper functions
function calculateStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;

  // Sort by completion date (most recent first)
  const sortedWorkouts = [...workouts]
    .filter((w) => w.completed_at)
    .sort(
      (a, b) =>
        new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
    );

  if (sortedWorkouts.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if there's a workout today or yesterday
  const lastWorkoutDate = new Date(sortedWorkouts[0].completed_at!);
  lastWorkoutDate.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If last workout was more than 1 day ago, streak is broken
  if (daysDiff > 1) return 0;

  // Count consecutive days with workouts
  const workoutDates = new Set(
    sortedWorkouts.map((w) => {
      const date = new Date(w.completed_at!);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  let currentDate = daysDiff === 0 ? today : lastWorkoutDate;
  while (workoutDates.has(currentDate.getTime())) {
    streak++;
    currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
  }

  return streak;
}

function getTotalSets(workouts: Workout[]): number {
  return workouts.reduce((sum, w) => sum + (w.total_sets || 0), 0);
}
