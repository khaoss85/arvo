"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Dumbbell,
  TrendingUp,
  Plus,
  Calendar,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  StickyNote,
  Lock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ProgressChecksGallery } from "@/components/features/progress-checks/progress-checks-gallery";
import { ClientBookingsTab } from "@/components/features/coach/client-bookings-tab";
import { NoShowAlertBadge } from "@/components/features/coach/booking/no-show-alert-badge";
import type {
  UserProfile,
  CoachClientRelationship,
  Workout,
  CoachWorkoutAssignment,
  CoachProfile,
  CoachClientNote,
} from "@/lib/types/schemas";

interface ClientDetailClientProps {
  coachId: string;
  clientId: string;
  clientProfile: UserProfile;
  relationship: CoachClientRelationship;
  workouts: Workout[];
  assignments: CoachWorkoutAssignment[];
  coachProfile: CoachProfile | null;
}

type TabId = "overview" | "workouts" | "progress" | "bookings";

export function ClientDetailClient({
  coachId,
  clientId,
  clientProfile,
  relationship,
  workouts,
  assignments,
  coachProfile,
}: ClientDetailClientProps) {
  const t = useTranslations("coach.clientDetail");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: t("overview"), icon: User },
    { id: "workouts", label: t("workouts"), icon: Dumbbell },
    { id: "progress", label: t("progress"), icon: TrendingUp },
    { id: "bookings", label: t("bookings"), icon: Calendar },
  ];

  // Calculate stats
  const completedWorkouts = workouts.filter((w) => w.status === "completed").length;
  const thisWeekWorkouts = workouts.filter((w) => {
    if (!w.completed_at) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(w.completed_at) >= weekAgo;
  }).length;

  const autonomyLabels: Record<string, string> = {
    minimal: t("autonomyMinimal"),
    standard: t("autonomyStandard"),
    full: t("autonomyFull"),
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
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {clientProfile.first_name || "Client"}
                </h1>
                <NoShowAlertBadge
                  coachId={coachId}
                  clientId={clientId}
                  clientName={clientProfile.first_name || undefined}
                  size="md"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("memberSince")}{" "}
                {new Date(relationship.created_at || "").toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => router.push(`/coach/clients/${clientId}/assign`)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("assignWorkout")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-orange-500 text-orange-600 dark:text-orange-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {activeTab === "overview" && (
          <OverviewTab
            clientId={clientId}
            clientProfile={clientProfile}
            relationship={relationship}
            completedWorkouts={completedWorkouts}
            thisWeekWorkouts={thisWeekWorkouts}
            autonomyLabels={autonomyLabels}
            t={t}
          />
        )}

        {activeTab === "workouts" && (
          <WorkoutsTab
            workouts={workouts}
            assignments={assignments}
            clientId={clientId}
            router={router}
            t={t}
          />
        )}

        {activeTab === "progress" && (
          <ProgressTab clientId={clientId} workouts={workouts} t={t} />
        )}

        {activeTab === "bookings" && (
          <ClientBookingsTab
            coachId={coachId}
            clientId={clientId}
            clientName={clientProfile.first_name || "Client"}
          />
        )}
      </div>
    </div>
  );
}

// Helper function to get relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Overview Tab
function OverviewTab({
  clientId,
  clientProfile,
  relationship,
  completedWorkouts,
  thisWeekWorkouts,
  autonomyLabels,
  t,
}: {
  clientId: string;
  clientProfile: UserProfile;
  relationship: CoachClientRelationship;
  completedWorkouts: number;
  thisWeekWorkouts: number;
  autonomyLabels: Record<string, string>;
  t: (key: string, values?: Record<string, any>) => string;
}) {
  const [notes, setNotes] = useState<CoachClientNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteShared, setNewNoteShared] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/coach/clients/${clientId}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Create note
  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    setIsSaving(true);

    try {
      const response = await fetch(`/api/coach/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNoteContent.trim(), isShared: newNoteShared }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotes((prev) => [data.note, ...prev]);
        setNewNoteContent("");
        setNewNoteShared(false);
        setIsAddingNote(false);
      }
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Update note
  const handleUpdateNote = async (noteId: string) => {
    if (!editingContent.trim()) return;
    setIsSaving(true);

    try {
      const response = await fetch(`/api/coach/clients/${clientId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, content: editingContent.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? data.note : n))
        );
        setEditingNoteId(null);
        setEditingContent("");
      }
    } catch (error) {
      console.error("Error updating note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/coach/clients/${clientId}/notes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId }),
      });

      if (response.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
    setOpenMenuId(null);
  };

  // Toggle note visibility
  const handleToggleVisibility = async (note: CoachClientNote) => {
    try {
      const response = await fetch(`/api/coach/clients/${clientId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: note.id, isShared: !note.is_shared }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? data.note : n))
        );
      }
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
    setOpenMenuId(null);
  };

  const startEditing = (note: CoachClientNote) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
    setOpenMenuId(null);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Dumbbell}
          label={t("totalWorkouts")}
          value={completedWorkouts}
          color="text-blue-500"
          bgColor="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          icon={Calendar}
          label={t("thisWeek")}
          value={thisWeekWorkouts}
          color="text-green-500"
          bgColor="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          icon={Target}
          label={t("cyclesCompleted")}
          value={`${clientProfile.cycles_completed || 0}`}
          color="text-purple-500"
          bgColor="bg-purple-100 dark:bg-purple-900/30"
        />
        <StatCard
          icon={Clock}
          label={t("autonomyLevel")}
          value={autonomyLabels[relationship.client_autonomy || "standard"]}
          color="text-orange-500"
          bgColor="bg-orange-100 dark:bg-orange-900/30"
        />
      </div>

      {/* Profile Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("profile")}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoItem label={t("age")} value={clientProfile.age ? `${clientProfile.age} ${t("years")}` : "-"} />
          <InfoItem label={t("gender")} value={clientProfile.gender || "-"} />
          <InfoItem label={t("experience")} value={clientProfile.experience_years ? `${clientProfile.experience_years} ${t("years")}` : "-"} />
          <InfoItem label={t("trainingFocus")} value={clientProfile.training_focus || "-"} />
          <InfoItem label={t("currentSplit")} value={clientProfile.preferred_split || "-"} />
          <InfoItem label={t("goal")} value={clientProfile.sport_goal || "-"} />
        </div>
      </div>

      {/* Coach Notes - Card List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("notes")}
          </h3>
          {!isAddingNote && (
            <button
              onClick={() => setIsAddingNote(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("addNote") || "Add Note"}
            </button>
          )}
        </div>

        {/* Add Note Form */}
        {isAddingNote && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder={t("notesPlaceholder") || "Add notes about this client..."}
              className="w-full h-24 px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newNoteShared}
                  onChange={(e) => setNewNoteShared(e.target.checked)}
                  className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {t("shareWithClient") || "Share with client"}
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNoteContent("");
                    setNewNoteShared(false);
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t("cancel") || "Cancel"}
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={isSaving || !newNoteContent.trim()}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                    newNoteContent.trim()
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {isSaving ? (t("saving") || "Saving...") : (t("saveNotes") || "Save")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t("loading") || "Loading..."}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <StickyNote className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {t("noNotes")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {editingNoteId === note.id ? (
                  // Edit mode
                  <div>
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full h-24 px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingContent("");
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {t("cancel") || "Cancel"}
                      </button>
                      <button
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={isSaving || !editingContent.trim()}
                        className="px-3 py-1.5 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSaving ? (t("saving") || "Saving...") : (t("save") || "Save")}
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {getRelativeTime(note.created_at || "")}
                          {note.updated_at && note.updated_at !== note.created_at && (
                            <span className="ml-2">({t("edited") || "edited"})</span>
                          )}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            note.is_shared
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          )}
                        >
                          {note.is_shared ? (
                            <>
                              <Users className="w-3 h-3" />
                              {t("shared") || "Shared"}
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" />
                              {t("private") || "Private"}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === note.id ? null : note.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      {openMenuId === note.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                            <button
                              onClick={() => startEditing(note)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Pencil className="w-4 h-4" />
                              {t("edit") || "Edit"}
                            </button>
                            <button
                              onClick={() => handleToggleVisibility(note)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              {note.is_shared ? (
                                <>
                                  <Lock className="w-4 h-4" />
                                  {t("makePrivate") || "Make private"}
                                </>
                              ) : (
                                <>
                                  <Users className="w-4 h-4" />
                                  {t("shareWithClient") || "Share with client"}
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                              {t("delete") || "Delete"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Workouts Tab
function WorkoutsTab({
  workouts,
  assignments,
  clientId,
  router,
  t,
}: {
  workouts: Workout[];
  assignments: CoachWorkoutAssignment[];
  clientId: string;
  router: ReturnType<typeof useRouter>;
  t: (key: string, values?: Record<string, any>) => string;
}) {
  // Sort by date, newest first
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const dateA = new Date(a.completed_at || a.created_at || 0);
    const dateB = new Date(b.completed_at || b.created_at || 0);
    return dateB.getTime() - dateA.getTime();
  });

  const assignmentMap = new Map(assignments.map((a) => [a.workout_id, a]));
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (sortedWorkouts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Dumbbell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t("noWorkoutsHeading")}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {t("assignFirstWorkout")}
        </p>
        <button
          onClick={() => router.push(`/coach/clients/${clientId}/assign`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("assignWorkout")}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {sortedWorkouts.map((workout) => {
          const assignment = assignmentMap.get(workout.id);
          const isCompleted = workout.status === "completed";
          const isAssignedByCoach = !!workout.assigned_by_coach_id;

          return (
            <div
              key={workout.id}
              onClick={() => router.push(`/coach/clients/${clientId}/workout/${workout.id}/recap`)}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              {/* Status Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  isCompleted
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-gray-100 dark:bg-gray-700"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Workout Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {workout.workout_name || workout.workout_type || "Workout"}
                  </span>
                  {isAssignedByCoach && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                      {t("coachBadge")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    {workout.completed_at
                      ? new Date(workout.completed_at).toLocaleDateString()
                      : new Date(workout.created_at || "").toLocaleDateString()}
                  </span>
                  {assignment?.coach_notes && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="truncate">{assignment.coach_notes}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === workout.id ? null : workout.id);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>

                {openMenuId === workout.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                      }}
                    />
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          router.push(`/coach/clients/${clientId}/workout/${workout.id}/recap`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                        {t("viewDetails")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Progress Tab
function ProgressTab({
  clientId,
  workouts,
  t,
}: {
  clientId: string;
  workouts: Workout[];
  t: (key: string, values?: Record<string, any>) => string;
}) {
  // Calculate some basic stats from workouts
  const completedWorkouts = workouts.filter((w) => w.status === "completed");
  const totalVolume = completedWorkouts.reduce(
    (sum, w) => sum + ((w as any).total_volume || 0),
    0
  );
  const totalSets = completedWorkouts.reduce(
    (sum, w) => sum + ((w as any).total_sets || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {completedWorkouts.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t("totalWorkouts")}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(totalVolume / 1000)}k
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            kg {t("volume") || "Volume"}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalSets}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t("sets") || "Sets"}
          </div>
        </div>
      </div>

      {/* Progress Photos Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t("progressPhotos") || "Progress Photos"}
          </h3>
        </div>
        <div className="p-4">
          <ProgressChecksGallery userId={clientId} />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        </div>
      </div>
    </div>
  );
}

// Info Item Component
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
        {value}
      </div>
    </div>
  );
}
