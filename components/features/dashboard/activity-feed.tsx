'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { List, Calendar } from 'lucide-react'
import { ActivityService } from '@/lib/services/activity.service'
import { ActivityCard } from './activity-card'
import { ActivityCalendarView } from './activity-calendar-view'
import { useActivityViewPreference } from '@/lib/hooks/useActivityViewPreference'
import type { Activity, ActivityCategory } from '@/lib/types/activity.types'
import { cn } from '@/lib/utils/cn'

interface ActivityFeedProps {
  userId: string
  limit?: number
  className?: string
}

export function ActivityFeed({ userId, limit = 20, className }: ActivityFeedProps) {
  const t = useTranslations('dashboard.activityFeed')
  const { view, setViewPreference, isHydrated } = useActivityViewPreference()
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('all')

  // Fetch activities when category changes
  useEffect(() => {
    let mounted = true

    async function fetchActivities() {
      setIsLoading(true)
      try {
        const data = await ActivityService.getActivities(userId, {
          category: selectedCategory,
          limit,
        })
        if (mounted) {
          setActivities(data)
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error)
        if (mounted) {
          setActivities([])
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchActivities()

    return () => {
      mounted = false
    }
  }, [userId, selectedCategory, limit])

  return (
    <div className={className}>
      {/* Toolbar: Filters + View Toggle */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {/* Category Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              selectedCategory === 'all'
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {t('filters.all')}
          </button>
          <button
            onClick={() => setSelectedCategory('workouts')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              selectedCategory === 'workouts'
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {t('filters.workouts')}
          </button>
          <button
            onClick={() => setSelectedCategory('milestones')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              selectedCategory === 'milestones'
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {t('filters.milestones')}
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setViewPreference('list')}
            disabled={!isHydrated}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              view === 'list'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
            aria-label={t('viewMode.list')}
            title={t('viewMode.list')}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewPreference('calendar')}
            disabled={!isHydrated}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              view === 'calendar'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
            aria-label={t('viewMode.calendar')}
            title={t('viewMode.calendar')}
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content: List or Calendar View */}
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Activity List */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-2" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedCategory === 'all' && t('emptyState.all')}
                  {selectedCategory === 'workouts' && t('emptyState.workouts')}
                  {selectedCategory === 'milestones' && t('emptyState.milestones')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            <ActivityCalendarView
              userId={userId}
              selectedCategory={selectedCategory}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
