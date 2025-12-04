"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Plus,
  Search,
  LayoutGrid,
  X,
  Package,
  Sparkles,
} from "lucide-react";
import { SplitPlanTemplateCard } from "./split-plan-template-card";
import { SplitPlanTemplateEditor } from "./split-plan-template-editor";
import type { SplitPlanTemplate } from "@/lib/types/schemas";

interface SplitPlanTemplatesListProps {
  coachId: string;
  initialTemplates: SplitPlanTemplate[];
}

export function SplitPlanTemplatesList({
  coachId,
  initialTemplates,
}: SplitPlanTemplatesListProps) {
  const t = useTranslations("coach.splitPlanTemplates");
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<SplitPlanTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Filter templates by search query
  const filteredTemplates = templates.filter((template) => {
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.split_type?.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Separate system (base) templates from custom templates
  const systemTemplates = filteredTemplates.filter((t) => t.is_system);
  const customTemplates = filteredTemplates.filter((t) => !t.is_system);

  // Count only custom templates for header
  const customTemplatesCount = templates.filter((t) => !t.is_system).length;

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsCreating(true);
    setIsEditorOpen(true);
  };

  const handleEdit = (template: SplitPlanTemplate) => {
    setSelectedTemplate(template);
    setIsCreating(false);
    setIsEditorOpen(true);
  };

  const handleDuplicate = async (template: SplitPlanTemplate) => {
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
      setTemplates((prev) => [newTemplate, ...prev]);
    } catch (error) {
      console.error("Error duplicating template:", error);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm(t("confirmDelete"))) return;

    setIsDeleting(templateId);
    try {
      const response = await fetch(`/api/coach/split-plan-templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (error) {
      console.error("Error deleting template:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSave = async (data: Partial<SplitPlanTemplate>) => {
    try {
      if (isCreating) {
        // Create new template
        const response = await fetch("/api/coach/split-plan-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to create template");
        }

        const { template } = await response.json();
        setTemplates((prev) => [template, ...prev]);
      } else if (selectedTemplate) {
        // Update existing template
        const response = await fetch(`/api/coach/split-plan-templates/${selectedTemplate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to update template");
        }

        const { template } = await response.json();
        setTemplates((prev) =>
          prev.map((t) => (t.id === template.id ? template : t))
        );
      }

      setIsEditorOpen(false);
      setSelectedTemplate(null);
      setIsCreating(false);
    } catch (error) {
      console.error("Error saving template:", error);
      throw error;
    }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/coach")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("title")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {customTemplatesCount} {t("myTemplatesCount")}
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("create")}</span>
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
            placeholder={t("searchPlaceholder")}
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

      {/* Templates List */}
      <div className="container mx-auto px-4 pb-8 max-w-4xl space-y-8">
        {/* Base Templates Section */}
        {systemTemplates.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("baseTemplates")}
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t("baseTemplatesDescription")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {systemTemplates.map((template) => (
                <SplitPlanTemplateCard
                  key={template.id}
                  template={template}
                  isSystem={true}
                  onEdit={() => {}} // System templates cannot be edited
                  onDuplicate={() => handleDuplicate(template)}
                  onDelete={() => {}} // System templates cannot be deleted
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
              {t("myTemplates")}
            </h2>
          </div>

          {customTemplates.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <LayoutGrid className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? t("noResults") : t("emptyCustom")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery
                  ? t("noResultsDescription")
                  : t("emptyCustomDescription")}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t("createFirst")}
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {customTemplates.map((template) => (
                <SplitPlanTemplateCard
                  key={template.id}
                  template={template}
                  isSystem={false}
                  onEdit={() => handleEdit(template)}
                  onDuplicate={() => handleDuplicate(template)}
                  onDelete={() => handleDelete(template.id)}
                  isDeleting={isDeleting === template.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <SplitPlanTemplateEditor
          template={selectedTemplate}
          isCreating={isCreating}
          onSave={handleSave}
          onCancel={() => {
            setIsEditorOpen(false);
            setSelectedTemplate(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}
