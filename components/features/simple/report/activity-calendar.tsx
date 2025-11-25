"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Workout } from "@/lib/types/schemas";
import { cn } from "@/lib/utils/cn";

interface ActivityCalendarProps {
  completedWorkouts: Workout[];
  onDayClick?: (date: Date, workouts: Workout[]) => void;
  selectedDate?: Date | null;
  interactive?: boolean;
}

export function ActivityCalendar({
  completedWorkouts,
  onDayClick,
  selectedDate,
  interactive = false,
}: ActivityCalendarProps) {
  const t = useTranslations("simpleMode.calendar");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get translated months and days
  const MONTHS = t.raw("months") as string[];
  const DAYS_OF_WEEK = t.raw("daysShort") as string[];

  // Get workout dates as Set for quick lookup
  const workoutDates = useMemo(() => {
    const dates = new Map<string, number>(); // date string -> workout count

    completedWorkouts.forEach((w) => {
      if (w.completed_at) {
        const date = new Date(w.completed_at);
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        dates.set(dateKey, (dates.get(dateKey) || 0) + 1);
      }
    });

    return dates;
  }, [completedWorkouts]);

  // Group workouts by date for click handler
  const workoutsByDate = useMemo(() => {
    const grouped = new Map<string, Workout[]>();

    completedWorkouts.forEach((w) => {
      if (w.completed_at) {
        const date = new Date(w.completed_at);
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const existing = grouped.get(dateKey) || [];
        grouped.set(dateKey, [...existing, w]);
      }
    });

    return grouped;
  }, [completedWorkouts]);

  // Check if a date is selected
  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Handle day click
  const handleDayClick = (date: Date) => {
    if (!interactive || !onDayClick) return;
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const dayWorkouts = workoutsByDate.get(dateKey) || [];
    onDayClick(date, dayWorkouts);
  };

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convert to Monday = 0

    const days: Array<{
      date: Date | null;
      workoutCount: number;
      isToday: boolean;
    }> = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, workoutCount: 0, isToday: false });
    }

    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateKey = `${year}-${month}-${day}`;
      const workoutCount = workoutDates.get(dateKey) || 0;
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      days.push({ date, workoutCount, isToday });
    }

    return days;
  }, [currentDate, workoutDates]);

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const monthWorkouts = completedWorkouts.filter((w) => {
    if (!w.completed_at) return false;
    const date = new Date(w.completed_at);
    return (
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  }).length;

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="text-center">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {monthWorkouts} {monthWorkouts !== 1 ? t("workouts") : t("workout")}
          </p>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map((day, idx) => (
          <div
            key={idx}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            className="aspect-square flex items-center justify-center"
          >
            {day.date ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.01 }}
                onClick={() => day.workoutCount > 0 && handleDayClick(day.date!)}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium relative",
                  day.isToday && "ring-2 ring-primary-500",
                  day.workoutCount > 0
                    ? "bg-green-500 text-white"
                    : "text-gray-700 dark:text-gray-300",
                  // Interactive styles
                  interactive && day.workoutCount > 0 && "cursor-pointer hover:ring-2 hover:ring-green-300 hover:scale-105 transition-transform",
                  // Selected day styles
                  day.date && isDateSelected(day.date) && "ring-2 ring-offset-2 ring-primary-600 scale-105"
                )}
              >
                {day.date.getDate()}

                {/* Workout indicator ring animation */}
                {day.workoutCount > 0 && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-green-400"
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.3, opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  />
                )}

                {/* Multiple workouts indicator */}
                {day.workoutCount > 1 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-700 rounded-full text-[10px] flex items-center justify-center">
                    {day.workoutCount}
                  </span>
                )}
              </motion.div>
            ) : (
              <div className="w-9 h-9" />
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t("workoutCompleted")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full ring-2 ring-primary-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{t("today")}</span>
        </div>
      </div>
    </div>
  );
}
