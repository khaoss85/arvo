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
  Dumbbell,
  LayoutGrid,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils/cn";
import type { UserProfile, WorkoutTemplate, SplitPlanTemplate } from "@/lib/types/schemas";
import { CustomWorkoutBuilder } from "./custom-workout-builder";
import { SplitPlanTemplateSelector } from "./split-plan-template-selector";

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = () => new Date().toISOString().split("T")[0];

// Helper to get date string for N days from now
const getDateString = (daysFromNow: number) =>
  addDays(new Date(), daysFromNow).toISOString().split("T")[0];

interface WorkoutAssignmentClientProps {
  coachId: string;
  clientId: string;
  clientProfile: UserProfile;
  templates: WorkoutTemplate[];
  splitPlanTemplates?: SplitPlanTemplate[];
}

type AssignmentType = "workout" | "splitPlan";
type AssignmentMode = "ai" | "template" | "custom";

export function WorkoutAssignmentClient({
  coachId,
  clientId,
  clientProfile,
  templates,
  splitPlanTemplates = [],
}: WorkoutAssignmentClientProps) {
  const t = useTranslations("coach.assignment");
  const tScheduling = useTranslations("coach.scheduling");
  const tSplitPlan = useTranslations("coach.splitPlan");
  const router = useRouter();
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("workout");
  const [selectedMode, setSelectedMode] = useState<AssignmentMode | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [coachNotes, setCoachNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [showSplitPlanSelector, setShowSplitPlanSelector] = useState(false);
  const [plannedDate, setPlannedDate] = useState<string>(getTodayString());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Quick date options
  const dateOptions = [
    { label: tScheduling("today"), value: getTodayString() },
    { label: tScheduling("tomorrow"), value: getDateString(1) },
    { label: tScheduling("dayAfterTomorrow"), value: getDateString(2) },
  ];

  // Format the selected date for display
  const formatSelectedDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    // Detect locale from translations
    const locale = tScheduling("today") === "Oggi" ? it : enUS;
    return format(date, "EEEE d MMMM yyyy", { locale });
  };

  const modes: {
    id: AssignmentMode;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }[] = [
    {
      id: "ai",
      name: t("aiAssisted"),
      description: t("aiAssistedDescription"),
      icon: Sparkles,
      color: "text-purple-500",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
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
    },
  ];

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/coach/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: clientId,
          coachNotes: coachNotes || undefined,
          assignmentType: "ai_generated",
          plannedDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate workout");
      }

      router.push(`/coach/clients/${clientId}`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAssignTemplate = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/coach/assign-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachId,
          clientId,
          templateId: selectedTemplate,
          coachNotes: coachNotes || undefined,
          plannedDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to assign template");
      }

      router.push(`/coach/clients/${clientId}`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const canProceed =
    selectedMode === "ai" ||
    (selectedMode === "template" && selectedTemplate) ||
    selectedMode === "custom";

  const handleModeSelect = (mode: AssignmentMode) => {
    if (mode === "custom") {
      setShowCustomBuilder(true);
    } else {
      setSelectedMode(mode);
    }
  };

  // Show custom builder full screen
  if (showCustomBuilder) {
    return (
      <CustomWorkoutBuilder
        coachId={coachId}
        clientId={clientId}
        clientProfile={clientProfile}
        initialPlannedDate={plannedDate}
        onBack={() => setShowCustomBuilder(false)}
      />
    );
  }

  // Show split plan selector full screen
  if (showSplitPlanSelector) {
    return (
      <SplitPlanTemplateSelector
        coachId={coachId}
        clientId={clientId}
        clientProfile={clientProfile}
        templates={splitPlanTemplates}
        onBack={() => setShowSplitPlanSelector(false)}
        onSuccess={() => router.push(`/coach/clients/${clientId}`)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/coach/clients/${clientId}`)}
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
        {/* Assignment Type Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <label className="block font-medium text-gray-900 dark:text-white mb-3">
            {tSplitPlan("whatToAssign")}
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setAssignmentType("workout");
                setSelectedMode(null);
                setSelectedTemplate(null);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
                assignmentType === "workout"
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
              )}
            >
              <Dumbbell className="w-5 h-5" />
              <span className="font-medium">{tSplitPlan("singleWorkout")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAssignmentType("splitPlan");
                setSelectedMode(null);
                setSelectedTemplate(null);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
                assignmentType === "splitPlan"
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
              )}
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="font-medium">{tSplitPlan("fullProgram")}</span>
            </button>
          </div>
        </div>

        {/* Split Plan Mode - Show selector button */}
        {assignmentType === "splitPlan" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tSplitPlan("programDescription")}
            </p>
            <button
              onClick={() => setShowSplitPlanSelector(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
            >
              <LayoutGrid className="w-5 h-5" />
              {tSplitPlan("selectOrCreate")}
            </button>
          </div>
        )}

        {/* Workout Mode Content */}
        {assignmentType === "workout" && (
          <>
            {/* Date Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-orange-500" />
            <label className="font-medium text-gray-900 dark:text-white">
              {tScheduling("when")}
            </label>
          </div>

          {/* Quick date buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {dateOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setPlannedDate(option.value);
                  setShowDatePicker(false);
                }}
                className={cn(
                  "px-4 py-2 text-sm rounded-lg border transition-all",
                  plannedDate === option.value
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-300"
                )}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={cn(
                "px-4 py-2 text-sm rounded-lg border transition-all",
                showDatePicker || !dateOptions.some((o) => o.value === plannedDate)
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-300"
              )}
            >
              {tScheduling("pickDate")}
            </button>
          </div>

          {/* Custom date picker (HTML5 input) */}
          {showDatePicker && (
            <div className="mb-3">
              <input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                min={getTodayString()}
                max={getDateString(90)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {/* Selected date display */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{tScheduling("selectedDate")}:</span>{" "}
            <span className="capitalize">{formatSelectedDate(plannedDate)}</span>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;

            return (
              <button
                key={mode.id}
                onClick={() => handleModeSelect(mode.id)}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all border-2",
                  isSelected
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
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {mode.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Template Selection (when template mode is selected) */}
        {selectedMode === "template" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Select Template
            </h3>
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You don't have any templates yet. Create a workout and save it as a template.
              </p>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all border",
                      selectedTemplate === template.id
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </div>
                      {template.workout_type && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {template.workout_type}
                        </div>
                      )}
                    </div>
                    {selectedTemplate === template.id && (
                      <Check className="w-5 h-5 text-orange-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Coach Notes */}
        {selectedMode && selectedMode !== "custom" && (
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
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              These notes will be visible to your client
            </p>
          </div>
        )}

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Action Button */}
            {selectedMode && selectedMode !== "custom" && (
              <button
                onClick={selectedMode === "ai" ? handleGenerateAI : handleAssignTemplate}
                disabled={!canProceed || isGenerating}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors",
                  canProceed && !isGenerating
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    {selectedMode === "ai" ? (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>{t("generate")}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>{t("assign")}</span>
                      </>
                    )}
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
