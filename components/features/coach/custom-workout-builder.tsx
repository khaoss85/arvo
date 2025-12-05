"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Check, Dumbbell, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ExercisePickerModal } from "./exercise-picker-modal";
import { ExerciseConfigRow, type ExerciseConfig } from "./exercise-config-row";
import { ExerciseAnimationModal } from "@/components/features/workout/exercise-animation-modal";
import type { LegacyExercise } from "@/lib/services/musclewiki.service";
import type { UserProfile } from "@/lib/types/schemas";

interface CustomWorkoutBuilderProps {
  coachId: string;
  clientId: string;
  clientProfile: UserProfile;
  initialPlannedDate?: string;
  onBack: () => void;
}

// Workout type options
const WORKOUT_TYPES = [
  "push",
  "pull",
  "legs",
  "upper",
  "lower",
  "full_body",
  "chest",
  "back",
  "shoulders",
  "arms",
  "cardio",
  "custom",
] as const;

export function CustomWorkoutBuilder({
  coachId,
  clientId,
  clientProfile,
  initialPlannedDate,
  onBack,
}: CustomWorkoutBuilderProps) {
  const t = useTranslations("coach.customBuilder");
  const router = useRouter();

  // Use initialPlannedDate or default to today
  const plannedDate = initialPlannedDate || new Date().toISOString().split("T")[0];

  // Builder state
  const [workoutName, setWorkoutName] = useState("");
  const [workoutType, setWorkoutType] = useState<string>("custom");
  const [exercises, setExercises] = useState<ExerciseConfig[]>([]);
  const [coachNotes, setCoachNotes] = useState("");

  // UI state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [animationExercise, setAnimationExercise] = useState<LegacyExercise | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  // Add exercise from picker
  const handleAddExercise = useCallback((exercise: LegacyExercise) => {
    const newConfig: ExerciseConfig = {
      id: crypto.randomUUID(),
      exercise,
      sets: 3,
      reps: "8-12",
      weight: null,
      rir: 2,
      restSeconds: 120,
      notes: "",
    };
    setExercises((prev) => [...prev, newConfig]);
  }, []);

  // Update exercise config
  const handleUpdateExercise = useCallback(
    (id: string, updates: Partial<ExerciseConfig>) => {
      setExercises((prev) =>
        prev.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex))
      );
    },
    []
  );

  // Remove exercise
  const handleRemoveExercise = useCallback((id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  }, []);

  // Submit workout
  const handleSubmit = async () => {
    if (exercises.length === 0) {
      setError(t("errors.noExercises"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Format exercises for API
      const formattedExercises = exercises.map((ex, index) => ({
        id: ex.id,
        exercise_id: ex.exercise.id,
        exercise_name: ex.exercise.name,
        order_index: index,
        sets: ex.sets,
        reps: ex.reps,
        weight_kg: ex.weight,
        rir: ex.rir,
        notes: ex.notes || null,
        equipment: ex.exercise.equipment,
        target_muscle: ex.exercise.target,
        body_part: ex.exercise.bodyPart,
        animation_url: ex.exercise.gifUrl || null,
      }));

      const response = await fetch("/api/coach/create-custom-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          workoutName: workoutName || t("defaultWorkoutName"),
          workoutType,
          exercises: formattedExercises,
          coachNotes: coachNotes || undefined,
          saveAsTemplate,
          plannedDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create workout");
      }

      router.push(`/coach/clients/${clientId}`);
    } catch (err: any) {
      console.error("[CustomWorkoutBuilder] Submit error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const excludedExerciseNames = exercises.map((e) => e.exercise.name);
  const canSubmit = exercises.length > 0 && !isSubmitting;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("title")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {clientProfile.first_name || "Client"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Workout Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {/* Workout Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("workoutName")}
            </label>
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder={t("workoutNamePlaceholder")}
              className={cn(
                "w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-900",
                "text-gray-900 dark:text-white placeholder-gray-400",
                "border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              )}
            />
          </div>

          {/* Workout Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("workoutType")}
            </label>
            <div className="flex flex-wrap gap-2">
              {WORKOUT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setWorkoutType(type)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full border transition-all capitalize",
                    workoutType === type
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  {t(`types.${type}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-orange-500" />
              {t("exercises")}
              {exercises.length > 0 && (
                <span className="text-sm font-normal text-gray-500">
                  ({exercises.length})
                </span>
              )}
            </h2>
          </div>

          {exercises.length === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {t("noExercises")}
              </p>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t("addFirst")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((config, index) => (
                <ExerciseConfigRow
                  key={config.id}
                  config={config}
                  index={index}
                  onChange={handleUpdateExercise}
                  onRemove={handleRemoveExercise}
                  onShowAnimation={setAnimationExercise}
                />
              ))}

              {/* Add More Button */}
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t("addExercise")}
              </button>
            </div>
          )}
        </div>

        {/* Coach Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <label className="block font-medium text-gray-900 dark:text-white mb-2">
            {t("coachNotes")}
          </label>
          <textarea
            value={coachNotes}
            onChange={(e) => setCoachNotes(e.target.value)}
            placeholder={t("coachNotesPlaceholder")}
            rows={3}
            className={cn(
              "w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-900",
              "text-gray-900 dark:text-white placeholder-gray-400",
              "border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500",
              "resize-none"
            )}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t("coachNotesHint")}
          </p>
        </div>

        {/* Save as Template Option */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                {t("saveAsTemplate")}
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("saveAsTemplateHint")}
              </p>
            </div>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors",
            canSubmit
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t("creating")}</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>{t("createWorkout")}</span>
            </>
          )}
        </button>
      </div>

      {/* Exercise Picker Modal */}
      <ExercisePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
        excludeExercises={excludedExerciseNames}
      />

      {/* Animation Modal */}
      {animationExercise && (
        <ExerciseAnimationModal
          isOpen={true}
          onClose={() => setAnimationExercise(null)}
          exerciseName={animationExercise.name}
          animationUrl={animationExercise.gifUrl || null}
        />
      )}
    </div>
  );
}
