"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { X, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { WorkoutTemplate } from "@/lib/types/schemas";

interface TemplateEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: WorkoutTemplate;
  onSave: (updates: Partial<WorkoutTemplate>) => Promise<void>;
}

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
] as const;

type WorkoutType = (typeof WORKOUT_TYPES)[number];

export function TemplateEditModal({
  open,
  onOpenChange,
  template,
  onSave,
}: TemplateEditModalProps) {
  const t = useTranslations("coach.templates");
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || "");
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>((template.workout_type || []) as WorkoutType[]);
  const [tags, setTags] = useState(template.tags?.join(", ") || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        name,
        description: description || null,
        workout_type: workoutTypes.length > 0 ? workoutTypes : null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
    } finally {
      setIsSaving(false);
    }
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
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/60"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 z-50 m-auto max-w-lg max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("edit")}
              </h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("name")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
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
                  {WORKOUT_TYPES.map((type) => (
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
                      {type.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("tags")}
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={t("tagsPlaceholder")}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t("tagsHint")}
                </p>
              </div>

              {/* Exercise Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("exercises")} ({template.exercises?.length || 0})
                </label>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {template.exercises?.length ? (
                    <ul className="space-y-1">
                      {template.exercises.map((exercise: any, index: number) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 dark:text-gray-400"
                        >
                          {index + 1}. {exercise.exercise_name || exercise.name || "Unknown"}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      {t("noExercises")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                  isSaving || !name.trim()
                    ? "bg-orange-300 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600"
                )}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t("save")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
