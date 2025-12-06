"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import ReactConfetti from "react-confetti";
import { Flame, Dumbbell, TrendingUp, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWorkoutExecutionStore } from "@/lib/stores/workout-execution.store";

interface WorkoutRecapProps {
  workoutId: string;
  workoutName: string;
  exerciseCount: number;
  skippedExerciseCount?: number;
  totalSets: number;
  totalVolume: number;
  coachFeedback?: {
    coachNotes: string | null;
    coachName: string | null;
  } | null;
}

export function WorkoutRecap({
  workoutId,
  workoutName,
  exerciseCount,
  skippedExerciseCount = 0,
  totalSets,
  totalVolume,
  coachFeedback,
}: WorkoutRecapProps) {
  const t = useTranslations("simpleMode.recap");
  const tWorkout = useTranslations("simpleMode.workout");
  const router = useRouter();
  const { reset, endWorkout } = useWorkoutExecutionStore();
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Get window size for confetti
  useEffect(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Stop confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Clean up workout state on unmount
  useEffect(() => {
    return () => {
      endWorkout();
      reset();
    };
  }, []);

  const handleGoHome = () => {
    endWorkout();
    reset();
    router.push("/simple");
  };

  // Format volume for display
  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };

  // Mock streak - in a real app this would come from the server
  const streak: number = 5;

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#fbbf24", "#f59e0b"]}
        />
      )}

      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Celebration header */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
            <span className="text-5xl">🎉</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-center mb-2"
        >
          {t("workout")} {t("completed")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 text-center mb-8"
        >
          {workoutName}
        </motion.p>

        {/* Stats card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm"
        >
          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                  <Dumbbell className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{exerciseCount}</p>
                <p className="text-xs text-gray-400">
                  {t("exercisesDone")}
                  {skippedExerciseCount > 0 && (
                    <span className="block text-gray-500">
                      ({skippedExerciseCount} {t("skipped")})
                    </span>
                  )}
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">{totalSets}</p>
                <p className="text-xs text-gray-400">{t("setsCompleted")}</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatVolume(totalVolume)}
                </p>
                <p className="text-xs text-gray-400">kg volume</p>
              </div>
            </div>

            {/* Streak */}
            <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg">
              <Flame className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-white">{streak}</p>
                <p className="text-sm text-orange-400">{streak === 1 ? t("dayStreak") : t("daysStreak")}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Coach Feedback */}
        {coachFeedback?.coachNotes && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-sm mt-4"
          >
            <Card className="bg-orange-950/30 border-orange-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-orange-400" />
                <span className="font-semibold text-orange-200">
                  {t("coachFeedback")}
                </span>
                {coachFeedback.coachName && (
                  <span className="text-sm text-orange-400">
                    — {coachFeedback.coachName}
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                {coachFeedback.coachNotes}
              </p>
            </Card>
          </motion.div>
        )}

        {/* Motivational message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-gray-400 mt-6 mb-8 max-w-xs"
        >
          {t("keepGoing")} 💪
        </motion.p>

        {/* Go home button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full max-w-sm"
        >
          <Button
            onClick={handleGoHome}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            <Home className="h-5 w-5 mr-2" />
            {t("backToHome")}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
