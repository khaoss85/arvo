"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import type { Workout } from "@/lib/types/schemas";
import {
  useWorkoutExecutionStore,
  type ExerciseExecution,
} from "@/lib/stores/workout-execution.store";
import { Button } from "@/components/ui/button";
import { SimpleExerciseCard } from "./simple-exercise-card";
import { SimpleSetLogger } from "./simple-set-logger";
import { cn } from "@/lib/utils/cn";

interface SimpleWorkoutExecutionProps {
  workout: Workout;
  userId: string;
}

export function SimpleWorkoutExecution({
  workout,
  userId,
}: SimpleWorkoutExecutionProps) {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    exercises,
    currentExerciseIndex,
    startWorkout,
    resumeWorkout,
    nextExercise,
    goToExercise,
  } = useWorkoutExecutionStore();

  // Initialize or resume workout
  useEffect(() => {
    const initWorkout = async () => {
      // Use workout.status from database (passed from server) instead of local isActive state
      // This fixes hydration race condition where isActive is false before Zustand hydrates
      if (workout.status === 'in_progress') {
        // Workout already started - load sets from database
        await resumeWorkout(workout.id);
      } else {
        // New workout - initialize fresh
        await startWorkout(workout);
      }
      setIsInitialized(true);
    };

    initWorkout();
  }, [workout.id]);

  // Check if workout is complete
  const isWorkoutComplete = exercises.every((ex) => {
    const warmupSetsCount = ex.warmupSets?.length || 0;
    const warmupSetsSkipped = ex.warmupSetsSkipped || 0;
    const remainingWarmupSets = warmupSetsCount - warmupSetsSkipped;
    const totalSets = remainingWarmupSets + ex.targetSets;
    return ex.completedSets.length >= totalSets;
  });

  // Navigate to recap when workout is complete
  useEffect(() => {
    if (isInitialized && isWorkoutComplete && exercises.length > 0) {
      router.push(`/simple/workout/${workout.id}/recap`);
    }
  }, [isWorkoutComplete, isInitialized, exercises.length]);

  const handleExit = () => {
    router.push("/simple");
  };

  const currentExercise = exercises[currentExerciseIndex];
  const completedExercisesCount = exercises.filter((ex) => {
    const warmupSetsCount = ex.warmupSets?.length || 0;
    const warmupSetsSkipped = ex.warmupSetsSkipped || 0;
    const totalSets = (warmupSetsCount - warmupSetsSkipped) + ex.targetSets;
    return ex.completedSets.length >= totalSets;
  }).length;

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Esci</span>
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-400">Esercizio</p>
            <p className="font-semibold">
              {currentExerciseIndex + 1} / {exercises.length}
            </p>
          </div>

          <div className="w-16" /> {/* Spacer for alignment */}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-800">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{
              width: `${(completedExercisesCount / exercises.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      {/* Exercise Progress Dots */}
      <div className="flex items-center justify-center gap-2 py-4 px-4 overflow-x-auto">
        {exercises.map((ex, index) => {
          const warmupSetsCount = ex.warmupSets?.length || 0;
          const warmupSetsSkipped = ex.warmupSetsSkipped || 0;
          const totalSets = (warmupSetsCount - warmupSetsSkipped) + ex.targetSets;
          const isComplete = ex.completedSets.length >= totalSets;
          const isCurrent = index === currentExerciseIndex;

          return (
            <button
              key={index}
              onClick={() => goToExercise(index)}
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                isComplete
                  ? "bg-green-500 text-white"
                  : isCurrent
                  ? "bg-primary-500 text-white scale-110"
                  : "bg-gray-800 text-gray-400"
              )}
            >
              {isComplete ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="px-4 pb-8">
        <AnimatePresence mode="wait">
          {currentExercise && (
            <motion.div
              key={currentExerciseIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              style={{ touchAction: "pan-y" }}
              onDragEnd={(_, { offset, velocity }) => {
                const swipe = Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 500;
                if (swipe) {
                  if (offset.x > 0 && currentExerciseIndex > 0) {
                    goToExercise(currentExerciseIndex - 1);
                  } else if (offset.x < 0 && currentExerciseIndex < exercises.length - 1) {
                    goToExercise(currentExerciseIndex + 1);
                  }
                }
              }}
            >
              {/* Exercise Card */}
              <SimpleExerciseCard
                exercise={currentExercise}
                exerciseIndex={currentExerciseIndex}
              />

              {/* Set Logger */}
              <div className="mt-6">
                <SimpleSetLogger
                  exercise={currentExercise}
                  exerciseIndex={currentExerciseIndex}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next Exercise Button */}
        {currentExercise && currentExerciseIndex < exercises.length - 1 && (
          <div className="mt-6">
            <Button
              onClick={nextExercise}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Prossimo esercizio
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
