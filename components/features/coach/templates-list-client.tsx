"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  X,
} from "lucide-react";
import { TemplateCard } from "./template-card";
import { TemplateBuilder } from "./template-builder";
import type { WorkoutTemplate } from "@/lib/types/schemas";

interface TemplatesListClientProps {
  coachId: string;
  initialTemplates: WorkoutTemplate[];
}

export function TemplatesListClient({
  coachId,
  initialTemplates,
}: TemplatesListClientProps) {
  const t = useTranslations("coach.templates");
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);

  // Filter templates by search query
  const filteredTemplates = templates.filter((template) => {
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.workout_type?.some((wt) => wt.toLowerCase().includes(query)) ||
      template.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Group templates by workout type (use first type or "other")
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const type = template.workout_type?.[0] || "other";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(template);
    return acc;
  }, {} as Record<string, WorkoutTemplate[]>);

  const handleEdit = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
  };

  const handleDuplicate = async (template: WorkoutTemplate) => {
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
      setTemplates((prev) => [newTemplate, ...prev]);
    } catch (error) {
      console.error("Error duplicating template:", error);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm(t("confirmDelete"))) return;

    setIsDeleting(templateId);
    try {
      const response = await fetch(`/api/coach/templates/${templateId}`, {
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

  const handleEditSuccess = (updatedTemplate: WorkoutTemplate) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
    );
    setEditingTemplate(null);
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
                {templates.length} {templates.length === 1 ? "template" : "templates"}
              </p>
            </div>
            <button
              onClick={() => setShowBuilder(true)}
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
      <div className="container mx-auto px-4 pb-8 max-w-4xl">
        {filteredTemplates.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery ? t("noResults") : t("empty")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery
                ? t("noResultsDescription")
                : t("emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTemplates).map(([type, typeTemplates]) => (
              <div key={type}>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  {type === "other" ? t("otherTemplates") : type.replace("_", " ")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {typeTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onEdit={() => handleEdit(template)}
                      onDuplicate={() => handleDuplicate(template)}
                      onDelete={() => handleDelete(template.id)}
                      isDeleting={isDeleting === template.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Builder - Create Mode */}
      {showBuilder && (
        <TemplateBuilder
          coachId={coachId}
          onSuccess={(template) => {
            setTemplates((prev) => [template, ...prev]);
            setShowBuilder(false);
          }}
          onCancel={() => setShowBuilder(false)}
        />
      )}

      {/* Template Builder - Edit Mode */}
      {editingTemplate && (
        <TemplateBuilder
          coachId={coachId}
          editMode={{ template: editingTemplate }}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}
