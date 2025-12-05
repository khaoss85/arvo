"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Check, Loader2, AlertTriangle, SkipForward, Undo2, Info, Target } from "lucide-react";
import type { ExerciseExecution } from "@/lib/stores/workout-execution.store";
import { useWorkoutExecutionStore } from "@/lib/stores/workout-execution.store";
import { useProgressionSuggestion } from "@/lib/hooks/useAI";
import { evaluateSkipImpactAction } from "@/app/actions/ai-actions";
import type { SkipImpactOutput } from "@/lib/agents/skip-impact.agent";
import { extractMuscleGroupsFromExercise } from "@/lib/utils/exercise-muscle-mapper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { SimpleRestTimer } from "./simple-rest-timer";
import { SimpleHydration } from "./simple-hydration";
import { expandTechniqueToVirtualSets, type VirtualSet, type TechniqueLabel } from "@/lib/utils/technique-expansion";

interface SimpleSetLoggerProps {
  exercise: ExerciseExecution;
  exerciseIndex: number;
}

export function SimpleSetLogger({
  exercise,
  exerciseIndex,
}: SimpleSetLoggerProps) {
  const { logSet, workout, startedAt, exercises, setAISuggestion, skipExercise, unskipExercise } = useWorkoutExecutionStore();
  const { mutate: getSuggestion, isPending: isSuggestionPending } = useProgressionSuggestion();

  // Get suggestion or use target values
  const suggestion = exercise.currentAISuggestion;
  const lastSet = exercise.completedSets[exercise.completedSets.length - 1];

  // Calculate warmup sets
  const warmupSetsCount = exercise.warmupSets?.length || 0;
  const warmupSetsSkipped = exercise.warmupSetsSkipped || 0;
  const remainingWarmupSets = warmupSetsCount - warmupSetsSkipped;

  // Calculate virtual sets for techniques
  const techniqueExpansion = useMemo(() => {
    if (!exercise.advancedTechnique) {
      return null;
    }
    return expandTechniqueToVirtualSets(
      exercise.advancedTechnique,
      exercise.targetWeight || 20,
      exercise.targetReps[1] || 10,
      exercise.targetSets
    );
  }, [exercise.advancedTechnique, exercise.targetWeight, exercise.targetReps, exercise.targetSets]);

  const virtualSets = techniqueExpansion?.virtualSets || null;

  // Total sets = warmup + (virtual sets if technique, otherwise target sets)
  const workingSetsCount = virtualSets?.length || exercise.targetSets;
  const totalSets = remainingWarmupSets + workingSetsCount;
  const currentSetNumber = exercise.completedSets.length + 1;
  const isExerciseComplete = exercise.completedSets.length >= totalSets;

  // Get current virtual set (if in working sets phase and has technique)
  const workingSetIndex = currentSetNumber - remainingWarmupSets - 1;
  const currentVirtualSet: VirtualSet | null =
    virtualSets && workingSetIndex >= 0 && workingSetIndex < virtualSets.length
      ? virtualSets[workingSetIndex]
      : null;

  // Label for current set (DROP, MYO, etc.)
  const currentSetLabel: TechniqueLabel | undefined = currentVirtualSet?.label;

  // Default weight/reps (without virtual set override)
  const defaultWeight = lastSet?.weight || suggestion?.suggestion?.weight || exercise.targetWeight || 20;
  const defaultReps = lastSet?.reps || suggestion?.suggestion?.reps || exercise.targetReps[0] || 10;

  const [weight, setWeight] = useState(defaultWeight);
  const [reps, setReps] = useState(defaultReps);
  const [isLogging, setIsLogging] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingLogData, setPendingLogData] = useState<{weight: number, reps: number} | null>(null);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [skipImpact, setSkipImpact] = useState<SkipImpactOutput | null>(null);
  const [loadingSkipImpact, setLoadingSkipImpact] = useState(false);

  // Update weight/reps when current virtual set changes (for technique sets)
  useEffect(() => {
    if (currentVirtualSet) {
      setWeight(currentVirtualSet.weight);
      setReps(currentVirtualSet.targetReps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVirtualSet?.setNumber]); // Only update when set number changes, not on every render

  // Calculate total sets completed across all exercises for hydration tracking
  const totalSetsCompleted = exercises.reduce(
    (sum, ex) => sum + ex.completedSets.length,
    0
  );

  // Get workout start time as timestamp
  const workoutStartTime = startedAt ? new Date(startedAt).getTime() : Date.now();

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
            workoutId: workout.id,
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

  // Sanity check: detect unusually high values (5x target)
  const checkSanityValues = (checkWeight: number, checkReps: number): string[] => {
    const targetWeight = exercise.targetWeight || 0;
    const targetRepsMax = exercise.targetReps?.[1] || 12;
    const warnings: string[] = [];

    if (targetWeight > 0 && checkWeight > targetWeight * 5) {
      warnings.push(`${checkWeight}kg è ${Math.round(checkWeight / targetWeight)}x il target (${targetWeight}kg)`);
    }

    if (checkReps > targetRepsMax * 5) {
      warnings.push(`${checkReps} reps è ${Math.round(checkReps / targetRepsMax)}x il target (${targetRepsMax})`);
    }

    return warnings;
  };

  const performLogSet = async (data: {weight: number, reps: number}) => {
    setIsLogging(true);
    try {
      await logSet({
        weight: data.weight,
        reps: data.reps,
        rir: 2, // Default RIR for simple mode (not tracked visually)
      });
      // Start rest timer after successful log (only if not the last set)
      const newCompletedCount = exercise.completedSets.length + 1;
      if (newCompletedCount < totalSets) {
        setIsResting(true);
      }
      setShowConfirmation(false);
      setPendingLogData(null);
    } catch (error) {
      console.error("Failed to log set:", error);
    } finally {
      setIsLogging(false);
    }
  };

  const handleLogSet = async () => {
    if (isLogging || isExerciseComplete) return;

    const warnings = checkSanityValues(weight, reps);

    if (warnings.length > 0) {
      setPendingLogData({ weight, reps });
      setShowConfirmation(true);
      return;
    }

    await performLogSet({ weight, reps });
  };

  const handleRestComplete = () => {
    setIsResting(false);
  };

  const handleRestSkip = () => {
    setIsResting(false);
  };

  const handleSkipExercise = async () => {
    setIsSkipping(true);
    try {
      await skipExercise(exerciseIndex);
      setShowSkipConfirmation(false);
    } catch (error) {
      console.error("Failed to skip exercise:", error);
    } finally {
      setIsSkipping(false);
    }
  };

  const handleUnskipExercise = async () => {
    setIsSkipping(true);
    try {
      await unskipExercise(exerciseIndex);
    } catch (error) {
      console.error("Failed to restore exercise:", error);
    } finally {
      setIsSkipping(false);
    }
  };

  // Fetch AI skip impact when dialog opens
  const fetchSkipImpact = async () => {
    if (loadingSkipImpact || skipImpact) return;

    setLoadingSkipImpact(true);
    try {
      // Build input for the skip impact evaluation
      const completedExercises = exercises
        .slice(0, exerciseIndex)
        .filter(ex => !ex.skipped)
        .map(ex => ({
          name: ex.exerciseName,
          primaryMuscles: extractMuscleGroupsFromExercise(ex.exerciseName, ex.equipmentVariant).primary,
          completedSets: ex.completedSets.length
        }));

      const remainingExercises = exercises
        .slice(exerciseIndex + 1)
        .filter(ex => !ex.skipped)
        .map(ex => ({
          name: ex.exerciseName,
          primaryMuscles: extractMuscleGroupsFromExercise(ex.exerciseName, ex.equipmentVariant).primary,
          targetSets: ex.targetSets
        }));

      const currentExerciseMuscles = extractMuscleGroupsFromExercise(exercise.exerciseName, exercise.equipmentVariant);

      const result = await evaluateSkipImpactAction({
        exerciseName: exercise.exerciseName,
        exerciseIndex,
        totalExercises: exercises.length,
        completedSetsCount: exercise.completedSets.length,
        targetSets: exercise.targetSets,
        targetWeight: exercise.targetWeight,
        targetReps: exercise.targetReps as [number, number],
        primaryMuscles: currentExerciseMuscles.primary,
        workoutType: workout?.workout_type || 'general',
        completedExercises,
        remainingExercises
      });

      if (result.success && result.result) {
        setSkipImpact(result.result);
      }
    } catch (error) {
      console.error('[SimpleSetLogger] Failed to fetch skip impact:', error);
    } finally {
      setLoadingSkipImpact(false);
    }
  };

  // Open skip confirmation and fetch AI impact
  const handleOpenSkipConfirmation = () => {
    setShowSkipConfirmation(true);
    setSkipImpact(null); // Reset previous result
    fetchSkipImpact();
  };

  const incrementWeight = () => setWeight((w: number) => Math.round((w + 2.5) * 10) / 10);
  const decrementWeight = () => setWeight((w: number) => Math.max(0, Math.round((w - 2.5) * 10) / 10));
  const incrementReps = () => setReps((r: number) => r + 1);
  const decrementReps = () => setReps((r: number) => Math.max(1, r - 1));

  // If exercise is skipped, show restore option
  if (exercise.skipped) {
    return (
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center"
          >
            <SkipForward className="h-8 w-8 text-gray-300" />
          </motion.div>
          <p className="text-gray-400 font-semibold text-lg">
            Esercizio saltato
          </p>
          <Button
            variant="outline"
            onClick={handleUnskipExercise}
            disabled={isSkipping}
            className="mt-2 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {isSkipping ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Undo2 className="h-4 w-4 mr-2" />
            )}
            Ripristina esercizio
          </Button>
        </div>
      </Card>
    );
  }

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

        {/* Rest Timer - use virtual set rest if available (shorter for technique mini-sets) */}
        <SimpleRestTimer
          totalSeconds={currentVirtualSet?.restSeconds || exercise.restSeconds || 90}
          onComplete={handleRestComplete}
          onSkip={handleRestSkip}
        />
      </div>
    );
  }

  // Get label color based on technique type
  const getLabelColor = (label: TechniqueLabel) => {
    switch (label) {
      case 'DROP':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MYO':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'CLUSTER':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case '+15s':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'FST-7':
        return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-400 mb-1">Set corrente</p>
        <div className="flex items-center justify-center gap-3">
          <p className="text-3xl font-bold text-white">
            {currentSetNumber}{" "}
            <span className="text-gray-500 text-xl">/ {totalSets}</span>
          </p>
          {currentSetLabel && (
            <span className={cn(
              "px-3 py-1 text-sm font-bold rounded-full border",
              getLabelColor(currentSetLabel)
            )}>
              {currentSetLabel}
            </span>
          )}
        </div>
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

      {/* Skip exercise link - subtle, positioned below log button */}
      <button
        onClick={handleOpenSkipConfirmation}
        className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-400 transition-colors flex items-center justify-center gap-1.5"
      >
        <SkipForward className="h-3.5 w-3.5" />
        Salta esercizio
      </button>

      {/* Skip Confirmation Dialog */}
      <Dialog open={showSkipConfirmation} onOpenChange={(open) => {
        setShowSkipConfirmation(open);
        if (!open) setSkipImpact(null);
      }}>
        <DialogContent className="max-w-sm bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              Saltare questo esercizio?
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              L&apos;esercizio non verrà conteggiato nel volume totale. Potrai ripristinarlo in seguito se cambi idea.
            </DialogDescription>
          </DialogHeader>

          {/* AI Impact Assessment */}
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
            {loadingSkipImpact ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Analisi impatto...
              </div>
            ) : skipImpact ? (
              <div className="space-y-2">
                {/* Recommendation badge */}
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                  skipImpact.recommendation === 'ok_to_skip' && "bg-green-900/50 text-green-400 border border-green-700/50",
                  skipImpact.recommendation === 'consider_completing' && "bg-yellow-900/50 text-yellow-400 border border-yellow-700/50",
                  skipImpact.recommendation === 'not_recommended' && "bg-red-900/50 text-red-400 border border-red-700/50"
                )}>
                  {skipImpact.recommendation === 'ok_to_skip' && <Check className="w-3 h-3" />}
                  {skipImpact.recommendation === 'consider_completing' && <Info className="w-3 h-3" />}
                  {skipImpact.recommendation === 'not_recommended' && <Target className="w-3 h-3" />}
                  {skipImpact.recommendation === 'ok_to_skip' && "OK saltare"}
                  {skipImpact.recommendation === 'consider_completing' && "Considera di completare"}
                  {skipImpact.recommendation === 'not_recommended' && "Non raccomandato"}
                </div>

                {/* Impact summary */}
                <p className="text-sm text-gray-300 leading-relaxed">{skipImpact.impactSummary}</p>

                {/* Volume loss & coverage */}
                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  <span className="bg-gray-700/50 px-2 py-0.5 rounded">
                    -{skipImpact.volumeLossKg}kg volume
                  </span>
                  <span className="bg-gray-700/50 px-2 py-0.5 rounded">
                    {skipImpact.muscleGroupCoverage}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Analisi impatto non disponibile</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => {
              setShowSkipConfirmation(false);
              setSkipImpact(null);
            }}>
              Annulla
            </Button>
            <Button
              onClick={handleSkipExercise}
              disabled={isSkipping}
              variant="outline"
              className="border-gray-600 hover:bg-gray-800"
            >
              {isSkipping ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <SkipForward className="h-4 w-4 mr-2" />
              )}
              Salta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sanity Check Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-sm bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Valori insoliti rilevati
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                <p className="text-gray-400">I valori inseriti sembrano insolitamente alti. Vuoi confermare?</p>
                <ul className="mt-3 space-y-1">
                  {pendingLogData && checkSanityValues(pendingLogData.weight, pendingLogData.reps).map((warning, i) => (
                    <li key={i} className="flex items-start gap-2 text-amber-400">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowConfirmation(false)}>
              Correggo
            </Button>
            <Button
              onClick={() => pendingLogData && performLogSet(pendingLogData)}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Sì, conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
