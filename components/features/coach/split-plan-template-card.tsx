"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutGrid,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Calendar,
  Tag,
  BarChart3,
  Package,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SplitPlanTemplate } from "@/lib/types/schemas";

interface SplitPlanTemplateCardProps {
  template: SplitPlanTemplate;
  isSystem?: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function SplitPlanTemplateCard({
  template,
  isSystem = false,
  onEdit,
  onDuplicate,
  onDelete,
  isDeleting,
}: SplitPlanTemplateCardProps) {
  const t = useTranslations("coach.splitPlanTemplates");
  const [showMenu, setShowMenu] = useState(false);
  const [showStructure, setShowStructure] = useState(false);

  const sessionCount = template.sessions?.length || 0;

  const splitTypeColors: Record<string, string> = {
    push_pull_legs: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    upper_lower: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    full_body: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    bro_split: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    custom: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    weak_point_focus: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  };

  const getSplitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      push_pull_legs: "Push/Pull/Legs",
      upper_lower: "Upper/Lower",
      full_body: "Full Body",
      bro_split: "Bro Split",
      custom: "Custom",
      weak_point_focus: "Weak Point Focus",
    };
    return labels[type] || type.replace("_", " ");
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 relative",
        isDeleting && "opacity-50 pointer-events-none",
        isSystem && "border-blue-200 dark:border-blue-800"
      )}
    >
      {/* System Badge */}
      {isSystem && (
        <div className="absolute -top-2 -right-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Package className="w-3 h-3" />
            {t("systemBadge")}
          </span>
        </div>
      )}

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
                {/* Edit - only for custom templates */}
                {!isSystem && (
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
                )}
                {/* Duplicate - available for all */}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Copy className="w-4 h-4" />
                  {isSystem ? t("duplicateToCustomize") : t("duplicate")}
                </button>
                {/* Delete - only for custom templates */}
                {!isSystem && (
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
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Split Type Badge */}
      {template.split_type && (
        <div className="mb-3">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              splitTypeColors[template.split_type] ||
                "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            )}
          >
            {getSplitTypeLabel(template.split_type)}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <LayoutGrid className="w-4 h-4" />
          <span>
            {sessionCount} {sessionCount === 1 ? t("session") : t("sessions")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>{template.cycle_days} {t("days")}</span>
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

      {/* Session Preview (only for system templates with sessions) */}
      {isSystem && template.sessions && template.sessions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setShowStructure(!showStructure)}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {showStructure ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {showStructure ? t("hideStructure") : t("showStructure")}
          </button>

          {showStructure && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
              {template.sessions.map((session) => (
                <div
                  key={session.day}
                  className={cn(
                    "text-xs rounded-lg p-2 text-center",
                    session.workoutType === "rest"
                      ? "bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                      : "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                  )}
                >
                  <span className="font-semibold">{t("dayPrefix")}{session.day}</span>
                  <span className="mx-1">·</span>
                  <span>{session.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
