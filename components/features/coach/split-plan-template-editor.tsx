"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  X,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SplitPlanTemplate, SessionDefinition, SplitType } from "@/lib/types/schemas";

interface SplitPlanTemplateEditorProps {
  template: SplitPlanTemplate | null;
  isCreating: boolean;
  onSave: (data: Partial<SplitPlanTemplate>) => Promise<void>;
  onCancel: () => void;
}

const SPLIT_TYPES: { value: SplitType; label: string }[] = [
  { value: "push_pull_legs", label: "Push/Pull/Legs" },
  { value: "upper_lower", label: "Upper/Lower" },
  { value: "full_body", label: "Full Body" },
  { value: "bro_split", label: "Bro Split" },
  { value: "custom", label: "Custom" },
  { value: "weak_point_focus", label: "Weak Point Focus" },
];

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
  "rest",
];

const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
  "abs",
  "traps",
];

interface SessionFormData {
  id: string;
  day: number;
  name: string;
  workoutType: string;
  focus: string[];
}

export function SplitPlanTemplateEditor({
  template,
  isCreating,
  onSave,
  onCancel,
}: SplitPlanTemplateEditorProps) {
  const t = useTranslations("coach.splitPlanTemplates");

  // Form state
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [splitType, setSplitType] = useState<SplitType>(
    template?.split_type || "push_pull_legs"
  );
  const [cycleDays, setCycleDays] = useState(template?.cycle_days || 7);
  const [tagsInput, setTagsInput] = useState(template?.tags?.join(", ") || "");
  const [sessions, setSessions] = useState<SessionFormData[]>(() => {
    if (template?.sessions && template.sessions.length > 0) {
      return template.sessions.map((s, i) => ({
        id: `session-${i}`,
        day: s.day,
        name: s.name,
        workoutType: s.workoutType || "",
        focus: s.focus || [],
      }));
    }
    // Default: create sessions for cycle days
    return Array.from({ length: cycleDays }, (_, i) => ({
      id: `session-${i}`,
      day: i + 1,
      name: `Day ${i + 1}`,
      workoutType: "",
      focus: [],
    }));
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Update sessions when cycle days change
  const handleCycleDaysChange = (newDays: number) => {
    setCycleDays(newDays);

    if (newDays > sessions.length) {
      // Add more sessions
      const newSessions = Array.from(
        { length: newDays - sessions.length },
        (_, i) => ({
          id: `session-${sessions.length + i}`,
          day: sessions.length + i + 1,
          name: `Day ${sessions.length + i + 1}`,
          workoutType: "",
          focus: [],
        })
      );
      setSessions([...sessions, ...newSessions]);
    } else if (newDays < sessions.length) {
      // Remove sessions
      setSessions(sessions.slice(0, newDays));
    }
  };

  const updateSession = (id: string, updates: Partial<SessionFormData>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const toggleMuscleGroup = (sessionId: string, muscle: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const has = s.focus.includes(muscle);
        return {
          ...s,
          focus: has
            ? s.focus.filter((m) => m !== muscle)
            : [...s.focus, muscle],
        };
      })
    );
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sessions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update day numbers after reordering
    const updatedItems = items.map((session, index) => ({
      ...session,
      day: index + 1,
    }));

    setSessions(updatedItems);
  };

  // Add a new day/session
  const handleAddDay = () => {
    const newDay = sessions.length + 1;
    if (newDay > 14) return; // Max 14 days

    setSessions([
      ...sessions,
      {
        id: `session-${Date.now()}`,
        day: newDay,
        name: `Day ${newDay}`,
        workoutType: "",
        focus: [],
      },
    ]);
    setCycleDays(newDay);
  };

  // Remove a day/session
  const handleRemoveDay = (sessionId: string) => {
    if (sessions.length <= 1) return; // Keep at least 1 session

    const filtered = sessions.filter((s) => s.id !== sessionId);
    // Renumber days
    const renumbered = filtered.map((s, i) => ({ ...s, day: i + 1 }));
    setSessions(renumbered);
    setCycleDays(renumbered.length);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }

    if (sessions.length === 0) {
      setError(t("sessionsRequired"));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const formattedSessions: SessionDefinition[] = sessions.map((s) => ({
        day: s.day,
        name: s.name,
        workoutType: (s.workoutType || "rest") as SessionDefinition["workoutType"],
        focus: s.focus.length > 0 ? s.focus : [],
      }));

      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        split_type: splitType,
        cycle_days: cycleDays,
        sessions: formattedSessions,
        tags: tags.length > 0 ? tags : null,
      });
    } catch (err: any) {
      setError(err.message || "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isCreating ? t("createTitle") : t("editTitle")}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("templateName")} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("templateNamePlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {/* Split Type & Cycle Days */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("splitType")}
              </label>
              <select
                value={splitType}
                onChange={(e) => setSplitType(e.target.value as SplitType)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {SPLIT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("cycleDays")}
              </label>
              <input
                type="number"
                min={1}
                max={14}
                value={cycleDays}
                onChange={(e) => handleCycleDaysChange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("tags")}
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder={t("tagsPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">{t("tagsHint")}</p>
          </div>

          {/* Sessions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("sessions")} ({sessions.length})
              </label>
              <button
                type="button"
                onClick={handleAddDay}
                disabled={sessions.length >= 14}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors",
                  sessions.length >= 14
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                    : "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50"
                )}
              >
                <Plus className="w-3 h-3" />
                {t("addDay")}
              </button>
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sessions">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "space-y-2 rounded-lg transition-colors",
                      snapshot.isDraggingOver && "bg-orange-50 dark:bg-orange-900/10"
                    )}
                  >
                    {sessions.map((session, index) => (
                      <Draggable
                        key={session.id}
                        draggableId={session.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800",
                              snapshot.isDragging && "shadow-lg ring-2 ring-orange-500"
                            )}
                          >
                            {/* Session Header */}
                            <div className="flex items-center bg-gray-50 dark:bg-gray-900">
                              {/* Drag Handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="px-2 py-3 cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                <GripVertical className="w-4 h-4 text-gray-400" />
                              </div>

                              {/* Session Info Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedSession(
                                    expandedSession === session.id ? null : session.id
                                  )
                                }
                                className="flex-1 flex items-center justify-between px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t("day")} {session.day}:
                                  </span>
                                  <span className="text-sm text-gray-900 dark:text-white">
                                    {session.name}
                                  </span>
                                  {session.workoutType === "rest" && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-full">
                                      REST
                                    </span>
                                  )}
                                </div>
                                {expandedSession === session.id ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </button>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveDay(session.id)}
                                disabled={sessions.length <= 1}
                                className={cn(
                                  "px-2 py-3 transition-colors",
                                  sessions.length <= 1
                                    ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                    : "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                )}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Session Details */}
                            {expandedSession === session.id && (
                              <div className="p-3 space-y-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                {/* Name */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t("sessionName")}
                                  </label>
                                  <input
                                    type="text"
                                    value={session.name}
                                    onChange={(e) =>
                                      updateSession(session.id, { name: e.target.value })
                                    }
                                    className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                  />
                                </div>

                                {/* Rest Day Toggle */}
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`rest-${session.id}`}
                                    checked={session.workoutType === "rest"}
                                    onChange={(e) =>
                                      updateSession(session.id, {
                                        workoutType: e.target.checked ? "rest" : "",
                                      })
                                    }
                                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                  />
                                  <label
                                    htmlFor={`rest-${session.id}`}
                                    className="text-sm text-gray-700 dark:text-gray-300"
                                  >
                                    {t("restDay")}
                                  </label>
                                </div>

                                {session.workoutType !== "rest" && (
                                  <>
                                    {/* Workout Type */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        {t("workoutType")}
                                      </label>
                                      <select
                                        value={session.workoutType}
                                        onChange={(e) =>
                                          updateSession(session.id, {
                                            workoutType: e.target.value,
                                          })
                                        }
                                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                      >
                                        <option value="">{t("selectType")}</option>
                                        {WORKOUT_TYPES.filter(wt => wt !== "rest").map((type) => (
                                          <option key={type} value={type}>
                                            {type.replace("_", " ").charAt(0).toUpperCase() +
                                              type.replace("_", " ").slice(1)}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Target Muscles */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        {t("targetMuscles")}
                                      </label>
                                      <div className="flex flex-wrap gap-1">
                                        {MUSCLE_GROUPS.map((muscle) => (
                                          <button
                                            key={muscle}
                                            type="button"
                                            onClick={() =>
                                              toggleMuscleGroup(session.id, muscle)
                                            }
                                            className={cn(
                                              "px-2 py-0.5 text-xs rounded-full transition-colors",
                                              session.focus.includes(muscle)
                                                ? "bg-orange-500 text-white"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                            )}
                                          >
                                            {muscle}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isCreating ? t("create") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
