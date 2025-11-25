"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, X, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { getHydrationSuggestionAction } from "@/app/actions/hydration-actions";
import type { HydrationOutput } from "@/lib/types/hydration";
import { cn } from "@/lib/utils/cn";

interface SimpleHydrationProps {
  userId: string;
  workoutStartTime: number; // timestamp
  totalSetsCompleted: number;
  currentExerciseName: string;
  exerciseType: "compound" | "isolation";
  primaryMuscles: string[];
  restSeconds: number;
  isVisible: boolean; // Only show during rest
}

// Constants for hydration triggers
const MIN_MINUTES_BETWEEN_SUGGESTIONS = 15;
const MIN_SETS_BETWEEN_SUGGESTIONS = 6;
const COOLDOWN_AFTER_DISMISS_MINUTES = 10;

export function SimpleHydration({
  userId,
  workoutStartTime,
  totalSetsCompleted,
  currentExerciseName,
  exerciseType,
  primaryMuscles,
  restSeconds,
  isVisible,
}: SimpleHydrationProps) {
  const t = useTranslations("simpleMode.hydration");

  const [suggestion, setSuggestion] = useState<HydrationOutput | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastDismissedAt, setLastDismissedAt] = useState<Date | null>(null);
  const [lastCheckSets, setLastCheckSets] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Check if we should fetch a new suggestion
  const shouldCheckHydration = useCallback(() => {
    // Don't check if dismissed recently
    if (lastDismissedAt) {
      const minutesSinceDismiss =
        (Date.now() - lastDismissedAt.getTime()) / 60000;
      if (minutesSinceDismiss < COOLDOWN_AFTER_DISMISS_MINUTES) {
        return false;
      }
    }

    // Check based on time elapsed
    const workoutMinutes = (Date.now() - workoutStartTime) / 60000;
    const timeTrigger = workoutMinutes >= MIN_MINUTES_BETWEEN_SUGGESTIONS;

    // Check based on sets completed since last check
    const setsTrigger =
      totalSetsCompleted - lastCheckSets >= MIN_SETS_BETWEEN_SUGGESTIONS;

    return timeTrigger || setsTrigger;
  }, [workoutStartTime, totalSetsCompleted, lastCheckSets, lastDismissedAt]);

  // Fetch hydration suggestion
  const checkHydration = useCallback(async () => {
    if (isLoading || !shouldCheckHydration()) return;

    setIsLoading(true);
    try {
      const result = await getHydrationSuggestionAction(userId, {
        workoutDurationMs: Date.now() - workoutStartTime,
        totalSetsCompleted,
        currentSetNumber: totalSetsCompleted + 1,
        exerciseType,
        exerciseName: currentExerciseName,
        muscleGroups: {
          primary: primaryMuscles,
          secondary: [],
        },
        restSeconds,
        lastDismissedAt,
      });

      if (result.success && result.data.shouldSuggest) {
        setSuggestion(result.data);
        setIsDismissed(false);
      }

      setLastCheckSets(totalSetsCompleted);
    } catch (error) {
      console.error("[SimpleHydration] Error checking hydration:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    userId,
    workoutStartTime,
    totalSetsCompleted,
    currentExerciseName,
    exerciseType,
    primaryMuscles,
    restSeconds,
    lastDismissedAt,
    isLoading,
    shouldCheckHydration,
  ]);

  // Check hydration when rest timer starts
  useEffect(() => {
    if (isVisible && !isDismissed) {
      checkHydration();
    }
  }, [isVisible, isDismissed, checkHydration]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setSuggestion(null);
    setLastDismissedAt(new Date());
  };

  // Don't render if not visible, dismissed, or no suggestion
  if (!isVisible || isDismissed || !suggestion) {
    return null;
  }

  const isSmallSips = suggestion.messageType === "smallSipsOnly";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "rounded-xl px-4 py-3 mb-4 flex items-center gap-3",
          isSmallSips
            ? "bg-amber-900/30 border border-amber-700/50"
            : "bg-blue-900/30 border border-blue-700/50"
        )}
      >
        {/* Icon */}
        {isSmallSips ? (
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        ) : (
          <Droplets className="w-5 h-5 text-blue-400 shrink-0" />
        )}

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium",
              isSmallSips ? "text-amber-300" : "text-blue-300"
            )}
          >
            {isSmallSips ? t("smallSips") : t("drinkWater")}
          </p>
          {suggestion.waterAmount && (
            <p className="text-xs text-gray-400 mt-0.5">
              {suggestion.waterAmount}
            </p>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
