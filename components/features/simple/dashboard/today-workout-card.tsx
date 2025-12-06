"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Play,
  Moon,
  Sparkles,
  Clock,
  Dumbbell,
  CheckCircle2,
  Loader2,
  Eye,
} from "lucide-react";
import type { TimelineDayData } from "@/lib/services/split-timeline.types";
import { getWorkoutTypeIcon } from "@/lib/services/muscle-groups.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { ProgressFeedback } from "@/components/ui/progress-feedback";

interface TodayWorkoutCardProps {
  dayData: TimelineDayData;
  userId: string;
  isToday: boolean;
}

export function TodayWorkoutCard({
  dayData,
  userId,
  isToday,
}: TodayWorkoutCardProps) {
  const router = useRouter();
  const t = useTranslations('simpleMode.dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const { day, status, session, preGeneratedWorkout } = dayData;

  // Rest day
  if (!session || session.name === "Rest") {
    return (
      <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-2 border-blue-200 dark:border-blue-800">
        <div className="flex flex-col items-center text-center">
          <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
            <Moon className="h-12 w-12 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('restDay')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {t('day', { day })}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('recoveryEssential')}
          </p>
        </div>
      </Card>
    );
  }

  // Filter out 'rest' type which is not in the WorkoutType enum
  const workoutType = session.workoutType === 'rest' ? 'full_body' : session.workoutType;
  const workoutTypeIcon = getWorkoutTypeIcon(workoutType as Parameters<typeof getWorkoutTypeIcon>[0]);
  const exerciseCount = preGeneratedWorkout?.exercises?.length || 0;
  const estimatedDuration = Math.round(exerciseCount * 7); // ~7 min per exercise

  // Status-based styling
  const getStatusBadge = () => {
    // Priority: in_progress > isToday > has workout > default
    if (status === "in_progress") {
      return (
        <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-sm font-semibold animate-pulse">
          {t('inProgress')}
        </span>
      );
    }
    if (isToday) {
      return (
        <span className="px-3 py-1 rounded-full bg-purple-500 text-white text-sm font-semibold">
          {t('today')}
        </span>
      );
    }
    if (preGeneratedWorkout) {
      return (
        <span className="px-3 py-1 rounded-full bg-green-500 text-white text-sm font-semibold">
          {t('ready')}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full bg-gray-400 text-white text-sm font-semibold">
        {t('day', { day })}
      </span>
    );
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setShowProgress(true);
  };

  const handleGenerationComplete = () => {
    setIsGenerating(false);
    setShowProgress(false);
    router.refresh();
  };

  const handleGenerationError = (error: string) => {
    setIsGenerating(false);
    setShowProgress(false);
    console.error("Generation error:", error);
  };

  const handleStartWorkout = () => {
    if (preGeneratedWorkout) {
      router.push(`/simple/workout/${preGeneratedWorkout.id}`);
    }
  };

  const handleContinueWorkout = () => {
    if (preGeneratedWorkout) {
      router.push(`/simple/workout/${preGeneratedWorkout.id}`);
    }
  };

  return (
    <Card
      data-tour={isToday ? "simple-workout" : undefined}
      className={cn(
        "p-6 transition-all duration-300",
        "bg-gradient-to-br",
        isToday
          ? "from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-2 border-purple-300 dark:border-purple-700 shadow-xl"
          : "from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{workoutTypeIcon}</span>
          {getStatusBadge()}
          {/* Coach badge - shown if workout was assigned by a coach */}
          {preGeneratedWorkout?.assignedByCoachId && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
              Coach
            </span>
          )}
        </div>
      </div>

      {/* Workout Name */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {session.name}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {session.workoutType.replace(/_/g, " ")}
        </p>
      </div>

      {/* Stats */}
      {preGeneratedWorkout && (
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Dumbbell className="h-5 w-5" />
            <span className="font-medium">{t('exercises', { count: exerciseCount })}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock className="h-5 w-5" />
            <span className="font-medium">~{estimatedDuration} min</span>
          </div>
        </div>
      )}

      {/* Progress indicator for in_progress */}
      {status === "in_progress" && preGeneratedWorkout && (
        <div className="mb-6">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
              initial={{ width: "30%" }}
              animate={{ width: "60%" }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            {t('workoutInProgress')}
          </p>
        </div>
      )}

      {/* Generation Progress */}
      {showProgress && (
        <div className="mb-6">
          <ProgressFeedback
            variant="inline"
            endpoint="/api/workouts/generate/stream"
            requestBody={{ targetCycleDay: day }}
            cancellable={false}
            onComplete={handleGenerationComplete}
            onError={handleGenerationError}
          />
        </div>
      )}

      {/* ============================================
          CTA LOGIC - Based on isToday first
          ============================================ */}
      <div className="space-y-3">
        {/* TODAY'S ACTIONS */}
        {isToday && (
          <>
            {/* In Progress - Continue */}
            {status === "in_progress" && preGeneratedWorkout && (
              <Button
                onClick={handleContinueWorkout}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700"
              >
                <Play className="h-5 w-5 mr-2" />
                {t('continueWorkout')}
              </Button>
            )}

            {/* Has Workout (not in progress) - Start */}
            {preGeneratedWorkout && status !== "in_progress" && (
              <Button
                onClick={handleStartWorkout}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Play className="h-5 w-5 mr-2" />
                {t('startWorkout')}
              </Button>
            )}

            {/* No Workout - Generate Today */}
            {!preGeneratedWorkout && !showProgress && status !== "in_progress" && (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5 mr-2" />
                )}
                {isGenerating ? t('generating') : t('generateWorkout')}
              </Button>
            )}
          </>
        )}

        {/* OTHER DAYS ACTIONS (not today) */}
        {!isToday && (
          <>
            {/* Has Pre-Generated Workout - Just info, no start button */}
            {preGeneratedWorkout && (
              <div className="text-center py-2">
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✓ {t('workoutReady')}
                </span>
              </div>
            )}

            {/* No Workout - Pre-Generate */}
            {!preGeneratedWorkout && !showProgress && (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="outline"
                className="w-full h-14 text-lg font-semibold border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-950/50"
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5 mr-2" />
                )}
                {isGenerating ? t('generating') : t('preGenerateWorkout')}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Target muscles preview */}
      {session.targetVolume && Object.keys(session.targetVolume).length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            {t('targetMuscles')}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(session.targetVolume)
              .slice(0, 4)
              .map((muscle) => (
                <span
                  key={muscle}
                  className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  {muscle.replace(/_/g, " ")}
                </span>
              ))}
            {Object.keys(session.targetVolume).length > 4 && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                +{Object.keys(session.targetVolume).length - 4}
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
