"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Wrench,
  Loader2,
  Check,
  Calendar,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { UserProfile, SplitPlanTemplate } from "@/lib/types/schemas";

interface SplitPlanTemplateSelectorProps {
  coachId: string;
  clientId: string;
  clientProfile: UserProfile;
  templates: SplitPlanTemplate[];
  onBack: () => void;
  onSuccess: () => void;
}

type AssignmentMode = "ai" | "template" | "custom";

export function SplitPlanTemplateSelector({
  coachId,
  clientId,
  clientProfile,
  templates,
  onBack,
  onSuccess,
}: SplitPlanTemplateSelectorProps) {
  const t = useTranslations("coach.splitPlan");
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<AssignmentMode | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [coachNotes, setCoachNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modes: {
    id: AssignmentMode;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    disabled?: boolean;
  }[] = [
    {
      id: "ai",
      name: t("aiAssisted"),
      description: t("aiAssistedDescription"),
      icon: Sparkles,
      color: "text-purple-500",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      disabled: true, // Coming soon
    },
    {
      id: "template",
      name: t("fromTemplate"),
      description: t("fromTemplateDescription"),
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      id: "custom",
      name: t("custom"),
      description: t("customDescription"),
      icon: Wrench,
      color: "text-orange-500",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      disabled: true, // Coming soon
    },
  ];

  const handleAssignTemplate = async () => {
    if (!selectedTemplate) return;

    setIsAssigning(true);
    setError(null);

    try {
      const response = await fetch("/api/coach/split-plans/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          templateId: selectedTemplate,
          coachNotes: coachNotes || undefined,
          assignmentType: "template",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to assign split plan");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsAssigning(false);
    }
  };

  const canProceed = selectedMode === "template" && selectedTemplate;

  // Get split type display name
  const getSplitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      push_pull_legs: "Push/Pull/Legs",
      upper_lower: "Upper/Lower",
      full_body: "Full Body",
      bro_split: "Bro Split",
      custom: "Custom",
      weak_point_focus: "Weak Point Focus",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("assignProgram")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {clientProfile.first_name || "Client"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex gap-3">
            <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t("programInfo")}
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            const isDisabled = mode.disabled;

            return (
              <button
                key={mode.id}
                onClick={() => !isDisabled && setSelectedMode(mode.id)}
                disabled={isDisabled}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all border-2",
                  isDisabled
                    ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                    : isSelected
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                )}
              >
                <div className={cn("p-3 rounded-lg flex-shrink-0", mode.bgColor)}>
                  <Icon className={cn("w-5 h-5", mode.color)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {mode.name}
                    </span>
                    {isDisabled && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-full">
                        {t("comingSoon")}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {mode.description}
                  </p>
                </div>
                {isSelected && !isDisabled && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Template Selection */}
        {selectedMode === "template" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              {t("selectTemplate")}
            </h3>
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <LayoutGrid className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t("noTemplates")}
                </p>
                <button
                  onClick={() => router.push("/coach/split-plan-templates")}
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  {t("createTemplateFirst")}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-lg text-left transition-all border",
                      selectedTemplate === template.id
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <LayoutGrid className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {template.name}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{getSplitTypeLabel(template.split_type)}</span>
                        <span>•</span>
                        <span>{template.cycle_days} {t("days")}</span>
                      </div>
                      {template.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                          {template.description}
                        </p>
                      )}
                    </div>
                    {selectedTemplate === template.id ? (
                      <Check className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Coach Notes */}
        {selectedMode === "template" && selectedTemplate && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <label className="block font-medium text-gray-900 dark:text-white mb-2">
              {t("coachNotes")}
            </label>
            <textarea
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder={t("coachNotesPlaceholder")}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Action Button */}
        {selectedMode === "template" && (
          <button
            onClick={handleAssignTemplate}
            disabled={!canProceed || isAssigning}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors",
              canProceed && !isAssigning
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
            )}
          >
            {isAssigning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t("assigning")}</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>{t("assignProgram")}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
