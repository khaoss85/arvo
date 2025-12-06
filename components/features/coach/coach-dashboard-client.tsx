"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Users,
  UserPlus,
  Dumbbell,
  TrendingUp,
  Clock,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type {
  CoachDashboardStats,
  ClientWithProfile,
} from "@/lib/services/coach.service";
import type { CoachProfile } from "@/lib/types/schemas";
import { ExpiringPackagesPanel, UpgradeSuggestionsPanel } from "./packages";

interface CoachDashboardClientProps {
  user: User;
  coachProfile: CoachProfile | null;
  stats: CoachDashboardStats | null;
  clients: ClientWithProfile[];
}

export function CoachDashboardClient({
  user,
  coachProfile,
  stats,
  clients,
}: CoachDashboardClientProps) {
  const t = useTranslations("coach");
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copyInviteCode = async () => {
    if (!coachProfile?.invite_code) return;

    try {
      await navigator.clipboard.writeText(coachProfile.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Get client status for styling
  const getClientStatus = (client: ClientWithProfile) => {
    if (!client.lastWorkout?.completed_at) return "needs_attention";

    const daysSinceLastWorkout = Math.floor(
      (Date.now() - new Date(client.lastWorkout.completed_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastWorkout <= 2) return "on_track";
    if (daysSinceLastWorkout <= 5) return "needs_attention";
    return "overdue";
  };

  const statusColors = {
    on_track: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    needs_attention: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const statusLabels = {
    on_track: t("clientStatus.onTrack"),
    needs_attention: t("clientStatus.needsAttention"),
    overdue: t("clientStatus.overdue"),
  };

  return (
    <>
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t("dashboard.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {coachProfile?.display_name
                  ? t("dashboard.welcomeBack", { name: coachProfile.display_name })
                  : t("dashboard.welcome")}
              </p>
            </div>

            {/* Invite Code */}
            {coachProfile?.invite_code && (
              <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-4 py-3">
                <div className="text-sm">
                  <div className="text-gray-600 dark:text-gray-400 mb-0.5">
                    {t("dashboard.inviteCode")}
                  </div>
                  <div className="font-mono font-bold text-orange-600 dark:text-orange-400">
                    {coachProfile.invite_code}
                  </div>
                </div>
                <button
                  onClick={copyInviteCode}
                  className="p-2 rounded-md hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  title={t("dashboard.copyCode")}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users}
              label={t("stats.activeClients")}
              value={stats.activeClients}
              color="text-blue-500"
              bgColor="bg-blue-100 dark:bg-blue-900/30"
            />
            <StatCard
              icon={Clock}
              label={t("stats.pendingInvites")}
              value={stats.pendingInvites}
              color="text-yellow-500"
              bgColor="bg-yellow-100 dark:bg-yellow-900/30"
            />
            <StatCard
              icon={Dumbbell}
              label={t("stats.workoutsThisWeek")}
              value={stats.workoutsThisWeek}
              color="text-green-500"
              bgColor="bg-green-100 dark:bg-green-900/30"
            />
            <StatCard
              icon={TrendingUp}
              label={t("stats.completionRate")}
              value={`${stats.avgCompletionRate}%`}
              color="text-purple-500"
              bgColor="bg-purple-100 dark:bg-purple-900/30"
            />
          </div>
        )}

        {/* Package Alerts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <ExpiringPackagesPanel />
          <UpgradeSuggestionsPanel />
        </div>

        {/* Clients Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("clients.title")}
            </h2>
            <button
              onClick={() => router.push("/coach/invite")}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("clients.addClient")}</span>
            </button>
          </div>

          {clients.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t("clients.noClients")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {t("clients.noClientsDescription")}
              </p>
              <button
                onClick={() => router.push("/coach/invite")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                {t("clients.inviteFirst")}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {clients.map((client) => {
                const status = getClientStatus(client);
                return (
                  <button
                    key={client.relationship.id}
                    onClick={() =>
                      router.push(`/coach/clients/${client.relationship.client_id}`)
                    }
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                        {client.profile?.first_name?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {client.profile?.first_name || t("clients.unknownClient")}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded-full",
                            statusColors[status]
                          )}
                        >
                          {statusLabels[status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          {t("clients.workoutsThisWeek", {
                            count: client.workoutsThisWeek,
                          })}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span>
                          {client.lastWorkout?.completed_at
                            ? t("clients.lastWorkout", {
                                date: new Date(
                                  client.lastWorkout.completed_at
                                ).toLocaleDateString(),
                              })
                            : t("clients.noWorkoutsYet")}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
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
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        </div>
      </div>
    </div>
  );
}
