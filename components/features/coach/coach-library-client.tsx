"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  FileText,
  CalendarDays,
  X,
  Plus,
  Package,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { TemplateCard } from "./template-card";
import { TemplateBuilder } from "./template-builder";
import { SplitPlanTemplateCard } from "./split-plan-template-card";
import { SplitPlanTemplateEditor } from "./split-plan-template-editor";
import { cn } from "@/lib/utils/cn";
import type { WorkoutTemplate, SplitPlanTemplate } from "@/lib/types/schemas";

type TabType = "workouts" | "programs";

interface CoachLibraryClientProps {
  coachId: string;
  initialWorkoutTemplates: WorkoutTemplate[];
  initialSplitPlanTemplates: SplitPlanTemplate[];
  initialTab?: TabType;
}

export function CoachLibraryClient({
  coachId,
  initialWorkoutTemplates,
  initialSplitPlanTemplates,
  initialTab = "workouts",
}: CoachLibraryClientProps) {
  const t = useTranslations("coach");
  const tTemplates = useTranslations("coach.templates");
  const tSplit = useTranslations("coach.splitPlanTemplates");
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Workout templates state
  const [workoutTemplates, setWorkoutTemplates] = useState(initialWorkoutTemplates);
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false);
  const [editingWorkoutTemplate, setEditingWorkoutTemplate] = useState<WorkoutTemplate | null>(null);
  const [isDeletingWorkout, setIsDeletingWorkout] = useState<string | null>(null);

  // Split plan templates state
  const [splitPlanTemplates, setSplitPlanTemplates] = useState(initialSplitPlanTemplates);
  const [showSplitEditor, setShowSplitEditor] = useState(false);
  const [editingSplitTemplate, setEditingSplitTemplate] = useState<SplitPlanTemplate | null>(null);
  const [isCreatingSplit, setIsCreatingSplit] = useState(false);
  const [isDeletingSplit, setIsDeletingSplit] = useState<string | null>(null);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery(""); // Clear search when switching tabs
    // Update URL without navigation
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/coach/library?${params.toString()}`, { scroll: false });
  };

  // ===== WORKOUT TEMPLATES HANDLERS =====

  const filteredWorkoutTemplates = workoutTemplates.filter((template) => {
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.workout_type?.some((wt) => wt.toLowerCase().includes(query)) ||
      template.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const groupedWorkoutTemplates = filteredWorkoutTemplates.reduce((acc, template) => {
    const type = template.workout_type?.[0] || "other";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(template);
    return acc;
  }, {} as Record<string, WorkoutTemplate[]>);

  const handleEditWorkout = (template: WorkoutTemplate) => {
    setEditingWorkoutTemplate(template);
  };

  const handleDuplicateWorkout = async (template: WorkoutTemplate) => {
    try {
      const response = await fetch("/api/coach/duplicate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          newName: `${template.name} (Copy)`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate template");
      }

      const { template: newTemplate } = await response.json();
      setWorkoutTemplates((prev) => [newTemplate, ...prev]);
    } catch (error) {
      console.error("Error duplicating template:", error);
    }
  };

  const handleDeleteWorkout = async (templateId: string) => {
    if (!confirm(tTemplates("confirmDelete"))) return;

    setIsDeletingWorkout(templateId);
    try {
      const response = await fetch(`/api/coach/templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      setWorkoutTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (error) {
      console.error("Error deleting template:", error);
    } finally {
      setIsDeletingWorkout(null);
    }
  };

  const handleWorkoutEditSuccess = (updatedTemplate: WorkoutTemplate) => {
    setWorkoutTemplates((prev) =>
      prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
    );
    setEditingWorkoutTemplate(null);
  };

  // ===== SPLIT PLAN TEMPLATES HANDLERS =====

  const filteredSplitTemplates = splitPlanTemplates.filter((template) => {
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.split_type?.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const systemSplitTemplates = filteredSplitTemplates.filter((t) => t.is_system);
  const customSplitTemplates = filteredSplitTemplates.filter((t) => !t.is_system);
  const customSplitCount = splitPlanTemplates.filter((t) => !t.is_system).length;

  const handleCreateSplit = () => {
    setEditingSplitTemplate(null);
    setIsCreatingSplit(true);
    setShowSplitEditor(true);
  };

  const handleEditSplit = (template: SplitPlanTemplate) => {
    setEditingSplitTemplate(template);
    setIsCreatingSplit(false);
    setShowSplitEditor(true);
  };

  const handleDuplicateSplit = async (template: SplitPlanTemplate) => {
    try {
      const response = await fetch("/api/coach/split-plan-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          description: template.description,
          split_type: template.split_type,
          cycle_days: template.cycle_days,
          sessions: template.sessions,
          frequency_map: template.frequency_map,
          volume_distribution: template.volume_distribution,
          tags: template.tags,
          is_public: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate template");
      }

      const { template: newTemplate } = await response.json();
      setSplitPlanTemplates((prev) => [newTemplate, ...prev]);
    } catch (error) {
      console.error("Error duplicating template:", error);
    }
  };

  const handleDeleteSplit = async (templateId: string) => {
    if (!confirm(tSplit("confirmDelete"))) return;

    setIsDeletingSplit(templateId);
    try {
      const response = await fetch(`/api/coach/split-plan-templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      setSplitPlanTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (error) {
      console.error("Error deleting template:", error);
    } finally {
      setIsDeletingSplit(null);
    }
  };

  const handleSaveSplit = async (data: Partial<SplitPlanTemplate>) => {
    try {
      if (isCreatingSplit) {
        const response = await fetch("/api/coach/split-plan-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to create template");
        }

        const { template } = await response.json();
        setSplitPlanTemplates((prev) => [template, ...prev]);
      } else if (editingSplitTemplate) {
        const response = await fetch(`/api/coach/split-plan-templates/${editingSplitTemplate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to update template");
        }

        const { template } = await response.json();
        setSplitPlanTemplates((prev) =>
          prev.map((t) => (t.id === template.id ? template : t))
        );
      }

      setShowSplitEditor(false);
      setEditingSplitTemplate(null);
      setIsCreatingSplit(false);
    } catch (error) {
      console.error("Error saving template:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("library.title")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeTab === "workouts"
                  ? `${workoutTemplates.length} ${workoutTemplates.length === 1 ? "template" : "templates"}`
                  : `${customSplitCount} ${tSplit("myTemplatesCount")}`}
              </p>
            </div>
            <button
              onClick={() => activeTab === "workouts" ? setShowWorkoutBuilder(true) : handleCreateSplit()}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">
                {activeTab === "workouts" ? tTemplates("create") : tSplit("create")}
              </span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleTabChange("workouts")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                activeTab === "workouts"
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              )}
            >
              <FileText className="w-4 h-4" />
              {t("library.tabWorkouts")}
            </button>
            <button
              onClick={() => handleTabChange("programs")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                activeTab === "programs"
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              )}
            >
              <CalendarDays className="w-4 h-4" />
              {t("library.tabPrograms")}
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === "workouts" ? tTemplates("searchPlaceholder") : tSplit("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-8 max-w-4xl">
        {activeTab === "workouts" ? (
          // Workout Templates Tab
          <>
            {filteredWorkoutTemplates.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchQuery ? tTemplates("noResults") : tTemplates("empty")}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? tTemplates("noResultsDescription") : tTemplates("emptyDescription")}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedWorkoutTemplates).map(([type, typeTemplates]) => (
                  <div key={type}>
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                      {type === "other" ? tTemplates("otherTemplates") : type.replace("_", " ")}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {typeTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onEdit={() => handleEditWorkout(template)}
                          onDuplicate={() => handleDuplicateWorkout(template)}
                          onDelete={() => handleDeleteWorkout(template.id)}
                          isDeleting={isDeletingWorkout === template.id}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // Split Plan Templates Tab
          <div className="space-y-8">
            {/* Base Templates Section */}
            {systemSplitTemplates.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {tSplit("baseTemplates")}
                  </h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {tSplit("baseTemplatesDescription")}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {systemSplitTemplates.map((template) => (
                    <SplitPlanTemplateCard
                      key={template.id}
                      template={template}
                      isSystem={true}
                      onEdit={() => {}}
                      onDuplicate={() => handleDuplicateSplit(template)}
                      onDelete={() => {}}
                      isDeleting={false}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Custom Templates Section */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tSplit("myTemplates")}
                </h2>
              </div>

              {customSplitTemplates.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                  <LayoutGrid className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchQuery ? tSplit("noResults") : tSplit("emptyCustom")}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchQuery ? tSplit("noResultsDescription") : tSplit("emptyCustomDescription")}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={handleCreateSplit}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {tSplit("createFirst")}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {customSplitTemplates.map((template) => (
                    <SplitPlanTemplateCard
                      key={template.id}
                      template={template}
                      isSystem={false}
                      onEdit={() => handleEditSplit(template)}
                      onDuplicate={() => handleDuplicateSplit(template)}
                      onDelete={() => handleDeleteSplit(template.id)}
                      isDeleting={isDeletingSplit === template.id}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Workout Template Builder - Create Mode */}
      {showWorkoutBuilder && (
        <TemplateBuilder
          coachId={coachId}
          onSuccess={(template) => {
            setWorkoutTemplates((prev) => [template, ...prev]);
            setShowWorkoutBuilder(false);
          }}
          onCancel={() => setShowWorkoutBuilder(false)}
        />
      )}

      {/* Workout Template Builder - Edit Mode */}
      {editingWorkoutTemplate && (
        <TemplateBuilder
          coachId={coachId}
          editMode={{ template: editingWorkoutTemplate }}
          onSuccess={handleWorkoutEditSuccess}
          onCancel={() => setEditingWorkoutTemplate(null)}
        />
      )}

      {/* Split Plan Template Editor */}
      {showSplitEditor && (
        <SplitPlanTemplateEditor
          template={editingSplitTemplate}
          isCreating={isCreatingSplit}
          onSave={handleSaveSplit}
          onCancel={() => {
            setShowSplitEditor(false);
            setEditingSplitTemplate(null);
            setIsCreatingSplit(false);
          }}
        />
      )}
    </div>
  );
}
