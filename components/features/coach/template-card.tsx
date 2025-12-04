"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Dumbbell,
  Tag,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { WorkoutTemplate } from "@/lib/types/schemas";

interface TemplateCardProps {
  template: WorkoutTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  isDeleting,
}: TemplateCardProps) {
  const t = useTranslations("coach.templates");
  const [showMenu, setShowMenu] = useState(false);

  const exerciseCount = template.exercises?.length || 0;

  const workoutTypeColors: Record<string, string> = {
    push: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    pull: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    legs: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    upper: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    lower: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    full_body: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    chest: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    back: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    shoulders: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    arms: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 relative",
        isDeleting && "opacity-50 pointer-events-none"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {template.name}
          </h3>
          {template.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
              {template.description}
            </p>
          )}
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit className="w-4 h-4" />
                  {t("edit")}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Copy className="w-4 h-4" />
                  {t("duplicate")}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("delete")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Workout Type Badges */}
      {template.workout_type && template.workout_type.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {template.workout_type.map((type) => (
            <span
              key={type}
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                workoutTypeColors[type] ||
                  "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              )}
            >
              {type.replace("_", " ")}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Dumbbell className="w-4 h-4" />
          <span>
            {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4" />
          <span>{t("usageCount", { count: template.usage_count || 0 })}</span>
        </div>
      </div>

      {/* Tags */}
      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="text-xs text-gray-400">
              +{template.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
