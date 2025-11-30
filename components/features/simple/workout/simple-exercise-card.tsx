"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Info, Check } from "lucide-react";
import type { ExerciseExecution } from "@/lib/stores/workout-execution.store";
import { ExerciseAnimation } from "@/components/features/workout/exercise-animation";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { expandTechniqueToVirtualSets } from "@/lib/utils/technique-expansion";

interface SimpleExerciseCardProps {
  exercise: ExerciseExecution;
  exerciseIndex: number;
}

export function SimpleExerciseCard({
  exercise,
  exerciseIndex,
}: SimpleExerciseCardProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  const warmupSetsCount = exercise.warmupSets?.length || 0;
  const warmupSetsSkipped = exercise.warmupSetsSkipped || 0;
  const remainingWarmupSets = warmupSetsCount - warmupSetsSkipped;

  // Calculate virtual sets for techniques (same logic as simple-set-logger)
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
  const workingSetsCount = virtualSets?.length || exercise.targetSets;
  const totalSets = remainingWarmupSets + workingSetsCount;
  const completedSetsCount = exercise.completedSets.length;
  const progress = (completedSetsCount / totalSets) * 100;

  // Parse tempo if available (e.g., "3-1-1-1" -> Eccentric-Pause-Concentric-Squeeze)
  const parseTempo = (tempo?: string) => {
    if (!tempo) return null;
    const parts = tempo.split("-").map(Number);
    if (parts.length !== 4) return null;
    return {
      down: parts[0],
      pause: parts[1],
      up: parts[2],
      squeeze: parts[3],
    };
  };

  const tempo = parseTempo(exercise.tempo);

  return (
    <Card className="bg-gray-900 border-gray-800 overflow-hidden">
      {/* Exercise Animation/Visual */}
      <div className="relative h-48 bg-gray-800 flex items-center justify-center">
        {exercise.hasAnimation && exercise.animationUrl ? (
          <ExerciseAnimation
            animationUrl={exercise.animationUrl}
            exerciseName={exercise.exerciseName}
            className="w-full h-full"
          />
        ) : (
          <div className="text-6xl">
            {getExerciseEmoji(exercise.exerciseName)}
          </div>
        )}

        {/* Progress overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Exercise Info */}
      <div className="p-4">
        {/* Name and equipment */}
        <h2 className="text-xl font-bold text-white mb-1">
          {exercise.exerciseName}
        </h2>
        {exercise.equipmentVariant && (
          <p className="text-sm text-gray-400 mb-4">
            {exercise.equipmentVariant}
          </p>
        )}

        {/* Target stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-white">{exercise.targetSets}</p>
            <p className="text-xs text-gray-400">Set</p>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-white">
              {exercise.targetReps[0]}-{exercise.targetReps[1]}
            </p>
            <p className="text-xs text-gray-400">Reps</p>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-white">
              {exercise.targetWeight || "-"}
            </p>
            <p className="text-xs text-gray-400">kg</p>
          </div>
        </div>

        {/* Set completion indicators */}
        <div className="flex items-center gap-2 mb-4">
          {Array.from({ length: totalSets }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "flex-1 h-2 rounded-full transition-colors",
                idx < completedSetsCount ? "bg-green-500" : "bg-gray-700"
              )}
            />
          ))}
        </div>

        {/* Completed sets summary */}
        {completedSetsCount > 0 && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Set completati:</p>
            <div className="space-y-1">
              {exercise.completedSets.map((set, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-400">Set {idx + 1}</span>
                  <span className="text-white font-medium">
                    {set.weight}kg x {set.reps} reps
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions toggle */}
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg text-gray-300 hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="text-sm font-medium">Come eseguirlo</span>
          </div>
          {showInstructions ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Instructions content */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                {/* Technical cues */}
                {exercise.technicalCues && exercise.technicalCues.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-300 mb-2">
                      Punti chiave:
                    </p>
                    <ul className="space-y-2">
                      {exercise.technicalCues.map((cue, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-400"
                        >
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {cue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mental Focus / Cue */}
                {exercise.setGuidance &&
                  exercise.setGuidance.length > 0 &&
                  exercise.setGuidance.some((sg) => sg.mentalFocus) && (
                    <div>
                      <p className="text-sm font-semibold text-gray-300 mb-2">
                        🧠 Focus mentale:
                      </p>
                      <p className="text-sm text-gray-400 bg-gray-800 p-3 rounded-lg italic">
                        {exercise.setGuidance.find((sg) => sg.mentalFocus)?.mentalFocus}
                      </p>
                    </div>
                  )}

                {/* Tempo */}
                {tempo && (
                  <div>
                    <p className="text-sm font-semibold text-gray-300 mb-2">
                      Tempo:
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-gray-800 rounded">
                        <p className="text-lg font-bold text-white">{tempo.down}s</p>
                        <p className="text-xs text-gray-400">Discesa</p>
                      </div>
                      <div className="p-2 bg-gray-800 rounded">
                        <p className="text-lg font-bold text-white">{tempo.pause}s</p>
                        <p className="text-xs text-gray-400">Pausa</p>
                      </div>
                      <div className="p-2 bg-gray-800 rounded">
                        <p className="text-lg font-bold text-white">{tempo.up}s</p>
                        <p className="text-xs text-gray-400">Salita</p>
                      </div>
                      <div className="p-2 bg-gray-800 rounded">
                        <p className="text-lg font-bold text-white">{tempo.squeeze}s</p>
                        <p className="text-xs text-gray-400">Contrazione</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Suggestion rationale */}
                {exercise.currentAISuggestion?.rationale && (
                  <div>
                    <p className="text-sm font-semibold text-gray-300 mb-2">
                      🤖 Suggerimento AI:
                    </p>
                    <p className="text-sm text-gray-400 bg-gray-800 p-3 rounded-lg">
                      {exercise.currentAISuggestion.rationale}
                    </p>
                  </div>
                )}

                {/* Rest period */}
                {exercise.restSeconds && (
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <span className="text-sm text-gray-400">Recupero tra i set:</span>
                    <span className="text-white font-semibold">
                      {exercise.restSeconds}s
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

// Helper function to get emoji for exercise type
function getExerciseEmoji(exerciseName: string): string {
  const name = exerciseName.toLowerCase();

  if (name.includes("bench") || name.includes("press")) return "🏋️";
  if (name.includes("squat")) return "🦵";
  if (name.includes("deadlift")) return "💪";
  if (name.includes("row")) return "🚣";
  if (name.includes("curl")) return "💪";
  if (name.includes("extension")) return "🦵";
  if (name.includes("pull")) return "🧗";
  if (name.includes("push")) return "🤸";
  if (name.includes("fly") || name.includes("flye")) return "🦅";
  if (name.includes("raise")) return "🙆";
  if (name.includes("dip")) return "⬇️";

  return "💪";
}
