'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { ActivityCalendar } from '@/components/features/simple/report/activity-calendar'
import { ActivityCard } from './activity-card'
import { WorkoutService } from '@/lib/services/workout.service'
import type { Workout } from '@/lib/types/schemas'
import type { Activity, ActivityCategory, WorkoutCompletedActivity } from '@/lib/types/activity.types'
import { formatDisplayDate } from '@/lib/utils/date-helpers'
import { cn } from '@/lib/utils/cn'

interface ActivityCalendarViewProps {
  userId: string
  selectedCategory: ActivityCategory
  className?: string
}

// Convert a Workout to WorkoutCompletedActivity for ActivityCard
function workoutToActivity(workout: Workout): WorkoutCompletedActivity {
  return {
    id: workout.id,
    userId: workout.user_id || '',
    type: 'workout_completed',
    timestamp: workout.completed_at || workout.started_at || new Date().toISOString(),
    category: 'workouts',
    data: {
      workoutId: workout.id,
      workoutName: workout.workout_name || 'Workout',
      workoutType: workout.workout_type,
      totalVolume: workout.total_volume,
      durationSeconds: workout.duration_seconds,
      totalSets: workout.total_sets,
      mentalReadiness: workout.mental_readiness_overall,
    },
  }
}

export function ActivityCalendarView({
  userId,
  selectedCategory,
  className,
}: ActivityCalendarViewProps) {
  const t = useTranslations('dashboard.activityFeed')
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDayWorkouts, setSelectedDayWorkouts] = useState<Workout[]>([])

  // Fetch completed workouts
  useEffect(() => {
    let mounted = true

    async function fetchWorkouts() {
      setIsLoading(true)
      try {
        const data = await WorkoutService.getByUserId(userId)
        if (mounted) {
          // Only keep completed workouts
          const completed = data.filter((w) => w.completed_at)
          setWorkouts(completed)
        }
      } catch (error) {
        console.error('Failed to fetch workouts:', error)
        if (mounted) {
          setWorkouts([])
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchWorkouts()

    return () => {
      mounted = false
    }
  }, [userId])

  // Filter workouts based on selected category
  // Note: For now, calendar only shows workouts. Milestones could be added later.
  const filteredWorkouts = useMemo(() => {
    if (selectedCategory === 'milestones') {
      // If filtering for milestones only, show empty calendar
      return []
    }
    return workouts
  }, [workouts, selectedCategory])

  // Handle day click
  const handleDayClick = (date: Date, dayWorkouts: Workout[]) => {
    // Toggle selection if clicking the same day
    if (
      selectedDate &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    ) {
      setSelectedDate(null)
      setSelectedDayWorkouts([])
    } else {
      setSelectedDate(date)
      setSelectedDayWorkouts(dayWorkouts)
    }
  }

  // Close details panel
  const handleCloseDetails = () => {
    setSelectedDate(null)
    setSelectedDayWorkouts([])
  }

  // Get locale for date formatting
  const locale = t('viewMode.list') === 'Lista' ? 'it' : 'en'

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-900 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <ActivityCalendar
        completedWorkouts={filteredWorkouts}
        onDayClick={handleDayClick}
        selectedDate={selectedDate}
        interactive
      />

      {/* Inline Details Panel */}
      <AnimatePresence>
        {selectedDate && selectedDayWorkouts.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {formatDisplayDate(selectedDate, locale)}
                </p>
                <button
                  onClick={handleCloseDetails}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              <div className="space-y-2">
                {selectedDayWorkouts.map((workout) => (
                  <ActivityCard
                    key={workout.id}
                    activity={workoutToActivity(workout)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state when filtering for milestones */}
      {selectedCategory === 'milestones' && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('calendarView.milestonesNotSupported')}
          </p>
        </div>
      )}
    </div>
  )
}
