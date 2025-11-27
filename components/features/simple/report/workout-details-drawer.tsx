"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { X, Dumbbell, Clock, Flame, Loader2 } from "lucide-react";
import type { Workout } from "@/lib/types/schemas";

// Type for set log data from server action
export interface SetLogData {
  id: string;
  workout_id: string | null;
  exercise_name: string;
  set_number: number | null;
  weight_actual: number | null;
  reps_actual: number | null;
  rir_actual: number | null;
  set_type: string | null;
  skipped: boolean;
}

interface WorkoutDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  workouts: Workout[];
  selectedDate: Date;
  setLogs?: SetLogData[];
  isLoading?: boolean;
}

export function WorkoutDetailsDrawer({
  open,
  onClose,
  workouts,
  selectedDate,
  setLogs = [],
  isLoading = false,
}: WorkoutDetailsDrawerProps) {
  const t = useTranslations("simpleMode.workoutDetails");
  const tCalendar = useTranslations("simpleMode.calendar");

  // Format duration from seconds to "Xh Xm" or "Xm"
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "-";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    const MONTHS = tCalendar.raw("months") as string[];
    return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  };

  // Group set logs by workout and exercise
  const setLogsByWorkout = useMemo(() => {
    const grouped = new Map<string, Map<string, SetLogData[]>>();

    setLogs.forEach((log) => {
      if (!log.workout_id || log.skipped) return;

      if (!grouped.has(log.workout_id)) {
        grouped.set(log.workout_id, new Map());
      }

      const workoutLogs = grouped.get(log.workout_id)!;
      if (!workoutLogs.has(log.exercise_name)) {
        workoutLogs.set(log.exercise_name, []);
      }
      workoutLogs.get(log.exercise_name)!.push(log);
    });

    return grouped;
  }, [setLogs]);

  // Helper to get planned sets from workout exercises
  const getPlannedSets = (workout: Workout): number => {
    if (!workout.exercises) return 0;
    return (workout.exercises as Array<{ sets?: number }>).reduce(
      (sum, ex) => sum + (ex.sets || 0),
      0
    );
  };

  // Calculate total stats from set logs (with fallback to planned data per workout)
  const totalStats = useMemo(() => {
    // Calculate sets per workout (with fallback)
    let totalSets = 0;
    workouts.forEach((workout) => {
      const workoutLogs = setLogs.filter(
        (log) =>
          log.workout_id === workout.id &&
          !log.skipped &&
          log.set_type === "working"
      );
      if (workoutLogs.length > 0) {
        totalSets += workoutLogs.length;
      } else {
        // Fallback to planned sets for this workout
        totalSets += getPlannedSets(workout);
      }
    });

    // Calculate volume from all non-skipped sets (no fallback for volume)
    const nonSkippedLogs = setLogs.filter((log) => !log.skipped);
    const totalVolume = nonSkippedLogs.reduce((sum, log) => {
      const weight = log.weight_actual || 0;
      const reps = log.reps_actual || 0;
      return sum + weight * reps;
    }, 0);

    // Duration from workouts
    const totalDuration = workouts.reduce(
      (sum, w) => sum + (w.duration_seconds || 0),
      0
    );

    return { totalSets, totalVolume, totalDuration };
  }, [setLogs, workouts]);

  // Get exercise stats for a specific workout
  const getExerciseStats = (workoutId: string, exerciseName: string) => {
    const workoutLogs = setLogsByWorkout.get(workoutId);
    if (!workoutLogs) return { sets: 0, weight: "-" };

    const exerciseLogs = workoutLogs.get(exerciseName);
    if (!exerciseLogs || exerciseLogs.length === 0)
      return { sets: 0, weight: "-" };

    // Filter to working sets only for count
    const workingSets = exerciseLogs.filter((log) => log.set_type === "working");
    const sets = workingSets.length;

    // Get weights from all sets (working + warmup have different weights)
    const weights = workingSets
      .map((log) => log.weight_actual)
      .filter((w): w is number => w !== null && w > 0);

    if (weights.length === 0) return { sets, weight: "-" };

    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weight =
      minWeight === maxWeight ? `${minWeight}kg` : `${minWeight}-${maxWeight}kg`;

    return { sets, weight };
  };

  // Get total sets for a workout from set logs (with fallback to planned)
  const getWorkoutTotalSets = (workoutId: string, workout: Workout): number => {
    const logsCount = setLogs.filter(
      (log) =>
        log.workout_id === workoutId &&
        !log.skipped &&
        log.set_type === "working"
    ).length;

    // If we have logs, use them; otherwise fall back to planned sets
    if (logsCount > 0) return logsCount;
    return getPlannedSets(workout);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-xl max-h-[85vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="text-lg font-semibold">
                {t("title", { date: formatDate(selectedDate) })}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-8 space-y-4 overflow-y-auto max-h-[calc(85vh-100px)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                </div>
              ) : workouts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t("noWorkouts")}
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                      <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {Math.round(totalStats.totalVolume).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("volume")}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                      <Dumbbell className="h-5 w-5 mx-auto mb-1 text-primary-500" />
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {totalStats.totalSets}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("sets")}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                      <Clock className="h-5 w-5 mx-auto mb-1 text-green-500" />
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatDuration(totalStats.totalDuration)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("duration")}
                      </p>
                    </div>
                  </div>

                  {/* Workout List */}
                  <div className="space-y-3">
                    {workouts.map((workout) => {
                      const workoutSets = getWorkoutTotalSets(workout.id, workout);

                      return (
                        <motion.div
                          key={workout.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                        >
                          {/* Workout Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {workout.workout_name || t("workout")}
                              </h3>
                              {workout.workout_type && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                  {workout.workout_type.replace(/_/g, " ")}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                              <p>
                                {workoutSets} {t("sets")}
                              </p>
                              <p>{formatDuration(workout.duration_seconds)}</p>
                            </div>
                          </div>

                          {/* Exercise List */}
                          {workout.exercises && workout.exercises.length > 0 && (
                            <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                              {(
                                workout.exercises as Array<{
                                  name?: string;
                                  exerciseName?: string;
                                  sets?: number;
                                }>
                              )
                                .slice(0, 6)
                                .map((exercise, idx) => {
                                  const exerciseName =
                                    exercise.exerciseName ||
                                    exercise.name ||
                                    `Exercise ${idx + 1}`;
                                  const stats = getExerciseStats(
                                    workout.id,
                                    exerciseName
                                  );

                                  return (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span className="text-gray-700 dark:text-gray-300 truncate max-w-[55%]">
                                        {exerciseName}
                                      </span>
                                      <span className="text-gray-500 dark:text-gray-400 text-right">
                                        {stats.sets > 0 ? (
                                          <>
                                            {stats.sets} × {stats.weight}
                                          </>
                                        ) : (
                                          <>
                                            {exercise.sets || "-"} {t("sets")}
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              {workout.exercises.length > 6 && (
                                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                                  +{workout.exercises.length - 6}{" "}
                                  {t("moreExercises")}
                                </p>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Safe area for iOS */}
            <div className="h-safe-area-inset-bottom" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
