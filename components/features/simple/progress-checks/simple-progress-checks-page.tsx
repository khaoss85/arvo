"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Camera, Plus, Calendar, Scale } from "lucide-react";
import { ProgressCheckService } from "@/lib/services/progress-check.service";
import type { ProgressCheckWithPhotos } from "@/lib/types/progress-check.types";
import { cn } from "@/lib/utils/cn";

interface SimpleProgressChecksPageProps {
  userId: string;
}

type FilterType = "all" | "milestones";

export function SimpleProgressChecksPage({ userId }: SimpleProgressChecksPageProps) {
  const t = useTranslations("simpleMode.progressChecks");
  const [checks, setChecks] = useState<ProgressCheckWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    loadChecks();
  }, [userId, filter]);

  async function loadChecks() {
    setLoading(true);
    try {
      const options = {
        includeMilestoneOnly: filter === "milestones",
      };
      const data = await ProgressCheckService.getChecks(userId, options);
      setChecks(data);
    } catch (error) {
      console.error("Failed to load checks:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const getFrontPhoto = (check: ProgressCheckWithPhotos) => {
    return check.photos?.find((p) => p.photo_type === "front");
  };

  const getDaysAgo = (dateString: string) => {
    return Math.floor(
      (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("title")}
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 animate-pulse"
            >
              <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-xl mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t("title")}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("subtitle", { count: checks.length })}
            </p>
          </div>
          <Link
            href="/dashboard/new-check"
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-lg active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
              filter === "all"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}
          >
            {t("filters.all")}
          </button>
          <button
            onClick={() => setFilter("milestones")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
              filter === "milestones"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}
          >
            {t("filters.milestones")}
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      {checks.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Camera className="h-8 w-8 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t("empty.title")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {t("empty.description")}
          </p>
          <Link
            href="/dashboard/new-check"
            className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            <Camera className="h-4 w-4" />
            {t("empty.cta")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {checks.map((check) => {
            const frontPhoto = getFrontPhoto(check);
            const daysAgo = getDaysAgo(check.taken_at);

            return (
              <Link
                key={check.id}
                href={`/simple/progress-checks/${check.id}`}
                className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:shadow-lg active:scale-[0.98]"
              >
                <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                  {frontPhoto ? (
                    <img
                      src={frontPhoto.photo_url}
                      alt={t("photoAlt")}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                    </div>
                  )}
                  {check.is_milestone && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs font-medium">
                      {t("milestone")}
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="backdrop-blur-sm bg-black/50 rounded-lg px-2 py-1">
                      <div className="flex items-center gap-1 text-white">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {daysAgo === 0 ? t("today") : t("daysAgo", { days: daysAgo })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {formatDate(check.taken_at)}
                  </p>
                  {check.weight && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <Scale className="h-3 w-3" />
                      {check.weight} kg
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
