"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types/schemas";
import type { TimelineDayData } from "@/lib/services/split-timeline.types";
import { TodayWorkoutCard } from "./today-workout-card";
import { BarChart3, Camera } from "lucide-react";
import Link from "next/link";

interface SimpleDashboardProps {
  user: User;
  profile: UserProfile;
  timelineData: TimelineDayData[];
}

export function SimpleDashboard({
  user,
  profile,
  timelineData,
}: SimpleDashboardProps) {
  const t = useTranslations("simpleMode.dashboard");
  const tNav = useTranslations("simpleMode.navigation");
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get the display name
  const displayName = profile.first_name || user.email?.split("@")[0] || "there";

  // Filter to show only workout days (not completed) starting from current
  const upcomingDays = timelineData.filter(
    (day) =>
      day.status === "current" ||
      day.status === "in_progress" ||
      day.status === "upcoming" ||
      day.status === "pre_generated"
  );

  // Find the current day index in the filtered array (always reset to current day on reload)
  useEffect(() => {
    const currentDayIndex = upcomingDays.findIndex(
      (day) => day.status === "current" || day.status === "in_progress"
    );
    if (currentDayIndex !== -1) {
      setCurrentIndex(currentDayIndex);
    } else {
      setCurrentIndex(0); // Default to first day if not found
    }
  }, [upcomingDays]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] px-4 py-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("greeting")}, {displayName}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {upcomingDays[currentIndex]?.status === "current" ||
          upcomingDays[currentIndex]?.status === "in_progress"
            ? t("subtitle")
            : t("subtitle")}
        </p>
      </motion.div>

      {/* Workout Card Carousel */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {upcomingDays.length > 0 ? (
          <>
            {/* Cards Container */}
            <div
              ref={containerRef}
              className="relative w-full max-w-sm mx-auto overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, { offset, velocity }) => {
                    const swipe = Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 500;
                    if (swipe) {
                      if (offset.x > 0 && currentIndex > 0) {
                        setCurrentIndex(currentIndex - 1);
                      } else if (offset.x < 0 && currentIndex < upcomingDays.length - 1) {
                        setCurrentIndex(currentIndex + 1);
                      }
                    }
                  }}
                >
                  <TodayWorkoutCard
                    dayData={upcomingDays[currentIndex]}
                    userId={user.id}
                    isToday={
                      upcomingDays[currentIndex]?.status === "current" ||
                      upcomingDays[currentIndex]?.status === "in_progress"
                    }
                  />
                </motion.div>
              </AnimatePresence>

              {/* Swipe hint */}
              {upcomingDays.length > 1 && (
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                  {t("swipeHint")}
                </p>
              )}
            </div>

            {/* Dots Indicator */}
            {upcomingDays.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {upcomingDays.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === currentIndex
                        ? "bg-primary-500 w-6"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    aria-label={`Go to day ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {t("noWorkouts")}
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <Link
          href="/simple/progress-checks"
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {tNav("check")}
          </span>
        </Link>

        <Link
          href="/simple/report"
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
            <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {tNav("progress")}
          </span>
        </Link>
      </div>
    </div>
  );
}
