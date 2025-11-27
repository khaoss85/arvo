"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Calendar,
  Scale,
  Ruler,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ProgressCheckWithDetails } from "@/lib/types/progress-check.types";
import { ProgressCheckService } from "@/lib/services/progress-check.service";
import { cn } from "@/lib/utils/cn";

interface SimpleProgressCheckDetailPageProps {
  check: ProgressCheckWithDetails;
  userId: string;
}

export function SimpleProgressCheckDetailPage({
  check,
  userId,
}: SimpleProgressCheckDetailPageProps) {
  const t = useTranslations("simpleMode.progressCheckDetail");
  const router = useRouter();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const photos = check.photos || [];
  const measurements = check.measurements || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const getPhotoTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      front: t("photoTypes.front"),
      side_left: t("photoTypes.sideLeft"),
      side_right: t("photoTypes.sideRight"),
      back: t("photoTypes.back"),
    };
    return labels[type] || type;
  };

  const getMeasurementLabel = (type: string) => {
    const labels: Record<string, string> = {
      chest: t("measurements.chest"),
      waist: t("measurements.waist"),
      hips: t("measurements.hips"),
      arm_left: t("measurements.armLeft"),
      arm_right: t("measurements.armRight"),
      thigh_left: t("measurements.thighLeft"),
      thigh_right: t("measurements.thighRight"),
      calf_left: t("measurements.calfLeft"),
      calf_right: t("measurements.calfRight"),
      shoulders: t("measurements.shoulders"),
    };
    return labels[type] || type;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await ProgressCheckService.deleteCheck(check.id, userId);
      if (success) {
        router.push("/simple/progress-checks");
      } else {
        alert(t("deleteError"));
      }
    } catch (error) {
      console.error("Failed to delete check:", error);
      alert(t("deleteError"));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const nextPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/simple/progress-checks"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToGallery")}
        </Link>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Main Photo */}
      {photos.length > 0 ? (
        <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden">
          <img
            src={photos[selectedPhotoIndex].photo_url}
            alt={getPhotoTypeLabel(photos[selectedPhotoIndex].photo_type)}
            className="w-full h-full object-cover"
          />
          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 backdrop-blur-sm bg-black/50 rounded-full px-4 py-1">
            <span className="text-sm font-medium text-white">
              {getPhotoTypeLabel(photos[selectedPhotoIndex].photo_type)}
            </span>
          </div>
        </div>
      ) : (
        <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">{t("noPhotos")}</p>
        </div>
      )}

      {/* Photo Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setSelectedPhotoIndex(index)}
              className={cn(
                "flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition-all",
                selectedPhotoIndex === index
                  ? "border-primary-600 dark:border-primary-400"
                  : "border-transparent"
              )}
            >
              <img
                src={photo.photo_url}
                alt={getPhotoTypeLabel(photo.photo_type)}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Info Cards */}
      <div className="space-y-4">
        {/* Date and Weight */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("date")}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(check.taken_at)}
                </p>
              </div>
            </div>
            {check.weight && (
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("weight")}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {check.weight} kg
                  </p>
                </div>
              </div>
            )}
          </div>
          {check.is_milestone && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                {t("milestone")}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {check.notes && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t("notes")}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {check.notes}
            </p>
          </div>
        )}

        {/* Measurements */}
        {measurements.length > 0 && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Ruler className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t("measurementsTitle")}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {measurements.map((measurement) => (
                <div
                  key={measurement.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {getMeasurementLabel(measurement.measurement_type)}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {measurement.value} cm
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md animate-in slide-in-from-bottom">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
              {t("deleteConfirm.title")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
              {t("deleteConfirm.message")}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? t("deleteConfirm.deleting") : t("deleteConfirm.confirm")}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t("deleteConfirm.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
