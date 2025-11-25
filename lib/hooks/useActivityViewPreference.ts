'use client'

import { useState, useEffect, useCallback } from 'react'

export type ActivityView = 'list' | 'calendar'

const STORAGE_KEY = 'activity-view-preference'

export function useActivityViewPreference() {
  const [view, setView] = useState<ActivityView>('list')
  const [isHydrated, setIsHydrated] = useState(false)

  // Read from localStorage on mount (hydration-safe)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'list' || saved === 'calendar') {
      setView(saved)
    }
    setIsHydrated(true)
  }, [])

  const setViewPreference = useCallback((newView: ActivityView) => {
    setView(newView)
    localStorage.setItem(STORAGE_KEY, newView)
  }, [])

  return {
    view,
    setViewPreference,
    isHydrated,
    isListView: view === 'list',
    isCalendarView: view === 'calendar',
  }
}
