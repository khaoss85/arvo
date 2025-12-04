"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { X, Sparkles, Loader2, Check, AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Muscle focus options (same as workout types)
const MUSCLE_FOCUS_OPTIONS = [
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
] as const;

// Equipment categories
const EQUIPMENT_CATEGORIES = [
  "free_weights",
  "machines",
  "cables",
  "bodyweight",
] as const;

// Experience levels
const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;

// Intensity techniques
const INTENSITY_TECHNIQUES = [
  "drop_set",
  "rest_pause",
  "myo_reps",
  "cluster_set",
  "superset",
] as const;

// Prompt presets
const PROMPT_PRESETS = [
  { id: "compound_focus", key: "compoundFocus" },
  { id: "hypertrophy", key: "hypertrophy" },
  { id: "strength", key: "strength" },
  { id: "time_efficient", key: "timeEfficient" },
  { id: "weak_points", key: "weakPoints" },
] as const;

export interface GeneratedExercise {
  name: string;
  equipment: string;
  sets: number;
  reps: string;
  target: string;
  bodyPart: string;
  rationale: string;
  gifUrl?: string;
}

interface AIExerciseGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExercisesGenerated: (
    exercises: GeneratedExercise[],
    mode: "replace" | "append"
  ) => void;
  existingExerciseCount: number;
}

export function AIExerciseGenerator({
  open,
  onOpenChange,
  onExercisesGenerated,
  existingExerciseCount,
}: AIExerciseGeneratorProps) {
  const t = useTranslations("coach.aiGenerator");
  const tTypes = useTranslations("coach.customBuilder.types");
  const tTechniques = useTranslations("coach.techniques");

  // Form state
  const [muscleFocus, setMuscleFocus] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] =
    useState<(typeof EXPERIENCE_LEVELS)[number]>("intermediate");
  const [equipmentPreference, setEquipmentPreference] = useState<string[]>([
    "free_weights",
    "machines",
  ]);
  const [exerciseCount, setExerciseCount] = useState(6);
  const [intensityTechniques, setIntensityTechniques] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedExercises, setGeneratedExercises] = useState<
    GeneratedExercise[] | null
  >(null);
  const [showModeChoice, setShowModeChoice] = useState(false);

  const handleGenerate = async () => {
    if (muscleFocus.length === 0) {
      setError(t("errors.noFocus"));
      return;
    }

    if (equipmentPreference.length === 0) {
      setError(t("errors.noEquipment"));
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/coach/generate-template-exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          muscleGroups: muscleFocus,
          level: experienceLevel,
          exerciseCount,
          equipmentPreference,
          intensityTechniques:
            intensityTechniques.length > 0 ? intensityTechniques : undefined,
          additionalNotes: additionalNotes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate exercises");
      }

      const { exercises } = await response.json();
      setGeneratedExercises(exercises);

      // If there are existing exercises, ask how to proceed
      if (existingExerciseCount > 0) {
        setShowModeChoice(true);
      } else {
        // No existing exercises, just add them
        onExercisesGenerated(exercises, "replace");
        handleClose();
      }
    } catch (err: any) {
      console.error("[AIExerciseGenerator] Error:", err);
      setError(err.message || t("errors.generic"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModeSelect = (mode: "replace" | "append") => {
    if (generatedExercises) {
      onExercisesGenerated(generatedExercises, mode);
      handleClose();
    }
  };

  const handleClose = () => {
    setMuscleFocus([]);
    setExperienceLevel("intermediate");
    setEquipmentPreference(["free_weights", "machines"]);
    setExerciseCount(6);
    setIntensityTechniques([]);
    setAdditionalNotes("");
    setError(null);
    setGeneratedExercises(null);
    setShowModeChoice(false);
    onOpenChange(false);
  };

  const toggleMuscleFocus = (focus: string) => {
    setMuscleFocus((prev) =>
      prev.includes(focus) ? prev.filter((f) => f !== focus) : [...prev, focus]
    );
  };

  const toggleEquipment = (equipment: string) => {
    setEquipmentPreference((prev) =>
      prev.includes(equipment)
        ? prev.filter((e) => e !== equipment)
        : [...prev, equipment]
    );
  };

  const toggleTechnique = (technique: string) => {
    setIntensityTechniques((prev) =>
      prev.includes(technique)
        ? prev.filter((t) => t !== technique)
        : [...prev, technique]
    );
  };

  const applyPreset = (presetId: string) => {
    const presetText = t(`presets.${presetId}`);
    setAdditionalNotes((prev) =>
      prev ? `${prev}\n${presetText}` : presetText
    );
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60"
          />

          {/* Drawer - Bottom to Top */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t("title")}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("subtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {showModeChoice ? (
                // Mode choice screen
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t("generated", { count: generatedExercises?.length ?? 0 })}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("modeQuestion", { count: existingExerciseCount })}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => handleModeSelect("replace")}
                      className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all text-left"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {t("modeReplace")}
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t("modeReplaceDescription")}
                      </p>
                    </button>

                    <button
                      onClick={() => handleModeSelect("append")}
                      className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all text-left"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {t("modeAppend")}
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t("modeAppendDescription")}
                      </p>
                    </button>
                  </div>
                </div>
              ) : (
                // Form screen
                <>
                  {/* Muscle Focus - Multi-select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("muscleFocus")} *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {MUSCLE_FOCUS_OPTIONS.map((focus) => (
                        <button
                          key={focus}
                          type="button"
                          onClick={() => toggleMuscleFocus(focus)}
                          className={cn(
                            "px-3 py-1.5 text-sm rounded-full border transition-all capitalize",
                            muscleFocus.includes(focus)
                              ? "bg-orange-500 border-orange-500 text-white"
                              : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                          )}
                        >
                          {tTypes(focus)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("experienceLevel")}
                    </label>
                    <div className="flex gap-2">
                      {EXPERIENCE_LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setExperienceLevel(level)}
                          className={cn(
                            "flex-1 px-3 py-2 text-sm rounded-lg border transition-all capitalize",
                            experienceLevel === level
                              ? "bg-orange-500 border-orange-500 text-white"
                              : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                          )}
                        >
                          {t(`levels.${level}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Equipment Preference - Multi-select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("equipmentPreference")} *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {EQUIPMENT_CATEGORIES.map((equipment) => (
                        <button
                          key={equipment}
                          type="button"
                          onClick={() => toggleEquipment(equipment)}
                          className={cn(
                            "px-3 py-2 text-sm rounded-lg border transition-all text-left",
                            equipmentPreference.includes(equipment)
                              ? "bg-orange-500 border-orange-500 text-white"
                              : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                          )}
                        >
                          {t(`equipment.${equipment}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exercise Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("exerciseCount")}: {exerciseCount}
                    </label>
                    <input
                      type="range"
                      min={4}
                      max={10}
                      value={exerciseCount}
                      onChange={(e) =>
                        setExerciseCount(parseInt(e.target.value, 10))
                      }
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>4</span>
                      <span>10</span>
                    </div>
                  </div>

                  {/* Intensity Techniques - Multi-select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        {t("intensityTechniques")}
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {t("intensityTechniquesHint")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {INTENSITY_TECHNIQUES.map((technique) => (
                        <button
                          key={technique}
                          type="button"
                          onClick={() => toggleTechnique(technique)}
                          className={cn(
                            "px-3 py-1.5 text-sm rounded-full border transition-all",
                            intensityTechniques.includes(technique)
                              ? "bg-yellow-500 border-yellow-500 text-white"
                              : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                          )}
                        >
                          {tTechniques(`${technique}.name`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Prompt with Presets */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("aiPrompt")}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {t("aiPromptHint")}
                    </p>

                    {/* Preset chips */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {PROMPT_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPreset(preset.key)}
                          className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-900/30 dark:hover:text-orange-400 transition-colors"
                        >
                          + {t(`presetLabels.${preset.key}`)}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder={t("aiPromptPlaceholder")}
                      rows={3}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-900",
                        "text-gray-900 dark:text-white placeholder-gray-400 text-sm",
                        "border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500",
                        "resize-none"
                      )}
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!showModeChoice && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 pb-safe">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={
                    isGenerating ||
                    muscleFocus.length === 0 ||
                    equipmentPreference.length === 0
                  }
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                    isGenerating ||
                      muscleFocus.length === 0 ||
                      equipmentPreference.length === 0
                      ? "bg-orange-300 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("generating")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {t("generate")}
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
