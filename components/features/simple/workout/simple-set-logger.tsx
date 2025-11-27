"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Check, Loader2 } from "lucide-react";
import type { ExerciseExecution } from "@/lib/stores/workout-execution.store";
import { useWorkoutExecutionStore } from "@/lib/stores/workout-execution.store";
import { useProgressionSuggestion } from "@/lib/hooks/useAI";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { SimpleRestTimer } from "./simple-rest-timer";
import { SimpleHydration } from "./simple-hydration";

interface SimpleSetLoggerProps {
  exercise: ExerciseExecution;
  exerciseIndex: number;
}

export function SimpleSetLogger({
  exercise,
  exerciseIndex,
}: SimpleSetLoggerProps) {
  const { logSet, workout, startedAt, exercises, setAISuggestion } = useWorkoutExecutionStore();
  const { mutate: getSuggestion, isPending: isSuggestionPending } = useProgressionSuggestion();

  // Get suggestion or use target values
  const suggestion = exercise.currentAISuggestion;
  const lastSet = exercise.completedSets[exercise.completedSets.length - 1];

  const [weight, setWeight] = useState(
    lastSet?.weight || suggestion?.suggestion?.weight || exercise.targetWeight || 20
  );
  const [reps, setReps] = useState(
    lastSet?.reps || suggestion?.suggestion?.reps || exercise.targetReps[0] || 10
  );
  const [isLogging, setIsLogging] = useState(false);
  const [isResting, setIsResting] = useState(false);

  // Calculate total sets completed across all exercises for hydration tracking
  const totalSetsCompleted = exercises.reduce(
    (sum, ex) => sum + ex.completedSets.length,
    0
  );

  // Get workout start time as timestamp
  const workoutStartTime = startedAt ? new Date(startedAt).getTime() : Date.now();

  // Calculate current set number
  const warmupSetsCount = exercise.warmupSets?.length || 0;
  const warmupSetsSkipped = exercise.warmupSetsSkipped || 0;
  const remainingWarmupSets = warmupSetsCount - warmupSetsSkipped;
  const totalSets = remainingWarmupSets + exercise.targetSets;
  const currentSetNumber = exercise.completedSets.length + 1;
  const isExerciseComplete = exercise.completedSets.length >= totalSets;

  // Determine exercise type for AI suggestions and hydration
  const isCompoundExercise =
    exercise.exerciseName.toLowerCase().includes("squat") ||
    exercise.exerciseName.toLowerCase().includes("deadlift") ||
    exercise.exerciseName.toLowerCase().includes("press") ||
    exercise.exerciseName.toLowerCase().includes("row") ||
    exercise.exerciseName.toLowerCase().includes("pull");

  // AI progression suggestion after each completed set
  useEffect(() => {
    // Only fetch if we have a completed set, no current suggestion, and exercise not complete
    if (
      lastSet &&
      !exercise.currentAISuggestion &&
      !isExerciseComplete &&
      workout?.user_id &&
      workout?.approach_id
    ) {
      console.log('[SimpleSetLogger] Fetching AI suggestion for next set', {
        lastSet: { weight: lastSet.weight, reps: lastSet.reps },
        currentSetNumber,
        exerciseName: exercise.exerciseName,
      });
      getSuggestion(
        {
          userId: workout.user_id,
          input: {
            lastSet: {
              weight: lastSet.weight,
              reps: lastSet.reps,
              rir: lastSet.rir || 2, // Default RIR for Simple Mode
            },
            setNumber: currentSetNumber,
            exerciseName: exercise.exerciseName,
            exerciseType: isCompoundExercise ? "compound" : "isolation",
            approachId: workout.approach_id,
          },
        },
        {
          onSuccess: (suggestionResult) => {
            if (suggestionResult) {
              console.log('[SimpleSetLogger] AI suggestion received:', {
                weight: suggestionResult.suggestion.weight,
                reps: suggestionResult.suggestion.reps,
                rationale: suggestionResult.rationale,
              });
              setAISuggestion(suggestionResult);
              // Update weight/reps with AI suggestion
              setWeight(suggestionResult.suggestion.weight);
              setReps(suggestionResult.suggestion.reps);
            }
          },
          onError: (error) => {
            console.error('[SimpleSetLogger] AI suggestion error:', error);
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.completedSets.length]);

  const handleLogSet = async () => {
    if (isLogging || isExerciseComplete) return;

    setIsLogging(true);
    try {
      await logSet({
        weight,
        reps,
        rir: 2, // Default RIR for simple mode (not tracked visually)
      });
      // Start rest timer after successful log (only if not the last set)
      const newCompletedCount = exercise.completedSets.length + 1;
      if (newCompletedCount < totalSets) {
        setIsResting(true);
      }
    } catch (error) {
      console.error("Failed to log set:", error);
    } finally {
      setIsLogging(false);
    }
  };

  const handleRestComplete = () => {
    setIsResting(false);
  };

  const handleRestSkip = () => {
    setIsResting(false);
  };

  const incrementWeight = () => setWeight((w: number) => Math.round((w + 2.5) * 10) / 10);
  const decrementWeight = () => setWeight((w: number) => Math.max(0, Math.round((w - 2.5) * 10) / 10));
  const incrementReps = () => setReps((r: number) => r + 1);
  const decrementReps = () => setReps((r: number) => Math.max(1, r - 1));

  if (isExerciseComplete) {
    return (
      <Card className="bg-green-900/30 border-green-700 p-6">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center"
          >
            <Check className="h-8 w-8 text-white" />
          </motion.div>
          <p className="text-green-400 font-semibold text-lg">
            Esercizio completato!
          </p>
          <p className="text-gray-400 text-sm">
            {exercise.completedSets.length} set totali
          </p>
        </div>
      </Card>
    );
  }

  // If resting, show the rest timer instead of the form
  if (isResting) {
    return (
      <div className="space-y-4">
        {/* Hydration reminder (shows during rest) */}
        {workout?.user_id && (
          <SimpleHydration
            userId={workout.user_id}
            workoutStartTime={workoutStartTime}
            totalSetsCompleted={totalSetsCompleted}
            currentExerciseName={exercise.exerciseName}
            exerciseType={isCompoundExercise ? "compound" : "isolation"}
            primaryMuscles={[]} // Simplified - could be enhanced
            restSeconds={exercise.restSeconds || 90}
            isVisible={true}
          />
        )}

        {/* Rest Timer */}
        <SimpleRestTimer
          totalSeconds={exercise.restSeconds || 90}
          onComplete={handleRestComplete}
          onSkip={handleRestSkip}
        />
      </div>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-400 mb-1">Set corrente</p>
        <p className="text-3xl font-bold text-white">
          {currentSetNumber}{" "}
          <span className="text-gray-500 text-xl">/ {totalSets}</span>
        </p>
      </div>

      {/* Weight input */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2 text-center">
          Peso (kg)
        </label>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={decrementWeight}
            className="w-14 h-14 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <Minus className="h-6 w-6 text-gray-300" />
          </button>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-24 h-14 text-center text-2xl font-bold bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={incrementWeight}
            className="w-14 h-14 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <Plus className="h-6 w-6 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Reps input */}
      <div className="mb-8">
        <label className="block text-sm text-gray-400 mb-2 text-center">
          Ripetizioni
        </label>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={decrementReps}
            className="w-14 h-14 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <Minus className="h-6 w-6 text-gray-300" />
          </button>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
            className="w-24 h-14 text-center text-2xl font-bold bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={incrementReps}
            className="w-14 h-14 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <Plus className="h-6 w-6 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Log button */}
      <Button
        onClick={handleLogSet}
        disabled={isLogging}
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
      >
        {isLogging ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Check className="h-5 w-5 mr-2" />
            Set Completato
          </>
        )}
      </Button>
    </Card>
  );
}
