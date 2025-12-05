"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus, Loader2, Check, Dumbbell, ArrowLeft, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ExercisePickerModal } from "./exercise-picker-modal";
import { ExerciseConfigRow, type ExerciseConfig } from "./exercise-config-row";
import { TechniquePickerSimple } from "./technique-picker-simple";
import { ExerciseAnimationModal } from "@/components/features/workout/exercise-animation-modal";
import { AIExerciseGenerator, type GeneratedExercise } from "./ai-exercise-generator";
import type { LegacyExercise } from "@/lib/services/musclewiki.service";
import type { WorkoutTemplate } from "@/lib/types/schemas";
import type { TechniqueType, TechniqueConfig } from "@/lib/types/advanced-techniques";

interface TemplateBuilderProps {
  coachId: string;
  onSuccess: (template: WorkoutTemplate) => void;
  onCancel: () => void;
  /** If provided, the builder will edit this template instead of creating a new one */
  editMode?: {
    template: WorkoutTemplate;
  };
}

// Workout type options (same as CustomWorkoutBuilder)
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

export function TemplateBuilder({
  coachId: _coachId,
  onSuccess,
  onCancel,
  editMode,
}: TemplateBuilderProps) {
  const t = useTranslations("coach.templateBuilder");
  const tTypes = useTranslations("coach.customBuilder.types");

  const isEditing = !!editMode?.template;
  const existingTemplate = editMode?.template;

  // Convert template exercises to ExerciseConfig format for editing
  const getInitialExercises = (): ExerciseConfig[] => {
    if (!existingTemplate?.exercises) return [];
    return (existingTemplate.exercises as any[]).map((ex) => ({
      id: ex.id || crypto.randomUUID(),
      exercise: {
        id: ex.exercise_id || crypto.randomUUID(),
        name: ex.exercise_name,
        gifUrl: ex.animation_url || "",
        bodyPart: ex.body_part || "",
        equipment: ex.equipment || "",
        target: ex.target_muscle || "",
        secondaryMuscles: [],
        instructions: [],
      },
      sets: ex.sets || 3,
      reps: ex.reps || "8-12",
      weight: ex.weight_kg || null,
      rir: ex.rir ?? 2,
      restSeconds: ex.rest_seconds || 120,
      notes: typeof ex.notes === 'string' ? ex.notes : "",
      technique: ex.advancedTechnique ? {
        type: ex.advancedTechnique.technique,
        config: ex.advancedTechnique.config,
      } : undefined,
    }));
  };

  // Builder state - initialize from template if editing
  const [templateName, setTemplateName] = useState(existingTemplate?.name || "");
  const [description, setDescription] = useState(existingTemplate?.description || "");
  const [workoutTypes, setWorkoutTypes] = useState<string[]>(existingTemplate?.workout_type || []);
  const [exercises, setExercises] = useState<ExerciseConfig[]>(getInitialExercises);
  const [tags, setTags] = useState<string[]>(existingTemplate?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(existingTemplate?.ai_suggestions_enabled ?? true);

  // UI state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [animationExercise, setAnimationExercise] = useState<LegacyExercise | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [techniquePickerOpen, setTechniquePickerOpen] = useState(false);
  const [techniquePickerExerciseId, setTechniquePickerExerciseId] = useState<string | null>(null);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [generatingNotesForId, setGeneratingNotesForId] = useState<string | null>(null);

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

  // Add tag
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput("");
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  // Open technique picker for an exercise
  const handleOpenTechniquePicker = useCallback((exerciseId: string) => {
    setTechniquePickerExerciseId(exerciseId);
    setTechniquePickerOpen(true);
  }, []);

  // Apply technique to exercise
  const handleSelectTechnique = useCallback((type: TechniqueType, config: TechniqueConfig) => {
    if (!techniquePickerExerciseId) return;

    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === techniquePickerExerciseId
          ? { ...ex, technique: { type, config } }
          : ex
      )
    );

    setTechniquePickerExerciseId(null);
  }, [techniquePickerExerciseId]);

  // Handle AI-generated exercises
  const handleAIExercisesGenerated = useCallback(
    (generatedExercises: GeneratedExercise[], mode: "replace" | "append") => {
      const newConfigs: ExerciseConfig[] = generatedExercises.map((ex) => ({
        id: crypto.randomUUID(),
        exercise: {
          id: crypto.randomUUID(),
          name: ex.name,
          gifUrl: ex.gifUrl || "",
          bodyPart: ex.bodyPart,
          equipment: ex.equipment,
          target: ex.target,
          secondaryMuscles: [],
          instructions: [],
        },
        sets: ex.sets,
        reps: ex.reps,
        weight: null,
        rir: 2,
        restSeconds: 120,
        notes: ex.rationale || "",
      }));

      if (mode === "replace") {
        setExercises(newConfigs);
      } else {
        setExercises((prev) => [...prev, ...newConfigs]);
      }
    },
    []
  );

  // Generate AI notes for an exercise
  const handleGenerateNotes = useCallback(async (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    setGeneratingNotesForId(exerciseId);
    try {
      const response = await fetch("/api/coach/generate-exercise-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_name: exercise.exercise.name,
          target_muscle: exercise.exercise.target,
          equipment: exercise.exercise.equipment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate notes");
      }

      const { notes } = await response.json();
      setExercises((prev) =>
        prev.map((ex) =>
          ex.id === exerciseId ? { ...ex, notes } : ex
        )
      );
    } catch (err) {
      console.error("[TemplateBuilder] Generate notes error:", err);
    } finally {
      setGeneratingNotesForId(null);
    }
  }, [exercises]);

  // Submit template (create or update)
  const handleSubmit = async () => {
    if (exercises.length === 0) {
      setError(t("errors.noExercises"));
      return;
    }

    if (!templateName.trim()) {
      setError(t("errors.noName"));
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
        rest_seconds: ex.restSeconds,
        notes: ex.notes || null,
        equipment: ex.exercise.equipment,
        target_muscle: ex.exercise.target,
        body_part: ex.exercise.bodyPart,
        animation_url: ex.exercise.gifUrl || null,
        // Include technique if present
        advancedTechnique: ex.technique ? {
          technique: ex.technique.type,
          config: ex.technique.config,
          rationale: "Coach selected",
        } : undefined,
      }));

      const payload = {
        name: templateName.trim(),
        description: description.trim() || null,
        workout_type: workoutTypes.length > 0 ? workoutTypes : null,
        exercises: formattedExercises,
        tags: tags.length > 0 ? tags : null,
        ai_suggestions_enabled: aiSuggestionsEnabled,
      };

      let response: Response;

      if (isEditing && existingTemplate) {
        // Update existing template
        response = await fetch(`/api/coach/templates/${existingTemplate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new template
        response = await fetch("/api/coach/create-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || (isEditing ? "Failed to update template" : "Failed to create template"));
      }

      const { template } = await response.json();
      onSuccess(template);
    } catch (err: any) {
      console.error("[TemplateBuilder] Submit error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const excludedExerciseNames = exercises.map((e) => e.exercise.name);
  const canSubmit = exercises.length > 0 && templateName.trim() && !isSubmitting;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditing ? t("editTitle") : t("title")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEditing ? t("editSubtitle") : t("subtitle")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6 pb-32">
        {/* Template Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("templateName")} *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={t("templateNamePlaceholder")}
              className={cn(
                "w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-900",
                "text-gray-900 dark:text-white placeholder-gray-400",
                "border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              )}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={2}
              className={cn(
                "w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-900",
                "text-gray-900 dark:text-white placeholder-gray-400",
                "border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500",
                "resize-none"
              )}
            />
          </div>

          {/* Workout Type - Multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("workoutType")}
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 font-normal">
                {t("multiSelectHint")}
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {WORKOUT_TYPES.filter(type => type !== "custom").map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setWorkoutTypes((prev) =>
                      prev.includes(type)
                        ? prev.filter((t) => t !== type)
                        : [...prev, type]
                    );
                  }}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full border transition-all capitalize",
                    workoutTypes.includes(type)
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  {tTypes(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("tags")}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder={t("tagPlaceholder")}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-900",
                  "text-gray-900 dark:text-white placeholder-gray-400 text-sm",
                  "border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                )}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("addTag")}
              </button>
            </div>
          </div>

          {/* AI Suggestions Toggle */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("aiSuggestions.title")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("aiSuggestions.description")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiSuggestionsEnabled(!aiSuggestionsEnabled)}
                className={cn(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
                  aiSuggestionsEnabled ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    aiSuggestionsEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
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
            <button
              type="button"
              onClick={() => setAiGeneratorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {t("generateWithAI")}
            </button>
          </div>

          {exercises.length === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {t("noExercises")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  {t("addFirst")}
                </button>
                <span className="text-gray-400 text-sm">{t("or")}</span>
                <button
                  type="button"
                  onClick={() => setAiGeneratorOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-medium rounded-lg transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  {t("generateWithAI")}
                </button>
              </div>
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
                  showTechniqueButton={true}
                  onAddTechnique={handleOpenTechniquePicker}
                  onGenerateNotes={handleGenerateNotes}
                  isGeneratingNotes={generatingNotesForId === config.id}
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

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 pb-safe">
        <div className="container mx-auto max-w-2xl">
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
                <span>{isEditing ? t("saving") : t("creating")}</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>{isEditing ? t("saveTemplate") : t("createTemplate")}</span>
              </>
            )}
          </button>
        </div>
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

      {/* Technique Picker Modal */}
      <TechniquePickerSimple
        isOpen={techniquePickerOpen}
        onClose={() => {
          setTechniquePickerOpen(false);
          setTechniquePickerExerciseId(null);
        }}
        onSelect={(type, config) => {
          handleSelectTechnique(type, config);
          setTechniquePickerOpen(false);
        }}
      />

      {/* AI Exercise Generator Modal */}
      <AIExerciseGenerator
        open={aiGeneratorOpen}
        onOpenChange={setAiGeneratorOpen}
        onExercisesGenerated={handleAIExercisesGenerated}
        existingExerciseCount={exercises.length}
      />
    </div>
  );
}
