'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { StickyNote, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CoachNote {
  id: string
  content: string
  created_at: string
  updated_at: string | null
}

interface CoachNotesSectionProps {
  className?: string
}

// Helper function to get relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return "today"
  if (diffDays === 1) return "1d ago"
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString()
}

export function CoachNotesSection({ className }: CoachNotesSectionProps) {
  const t = useTranslations('dashboard.coachNotes')
  const [notes, setNotes] = useState<CoachNote[]>([])
  const [coachName, setCoachName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNotes() {
      try {
        const response = await fetch('/api/client/coach-notes')
        if (response.ok) {
          const data = await response.json()
          setNotes(data.notes || [])
          setCoachName(data.coachName)
        }
      } catch (error) {
        console.error('Failed to fetch coach notes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotes()
  }, [])

  // Don't render if no coach or no notes
  if (!loading && (!coachName || notes.length === 0)) {
    return null
  }

  if (loading) {
    return (
      <div className={cn(
        'rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-900/50 dark:bg-orange-950/20',
        className
      )}>
        <div className="flex items-center gap-2 mb-4">
          <StickyNote className="h-5 w-5 text-orange-500" />
          <div className="h-5 bg-orange-200 dark:bg-orange-800/50 rounded w-32 animate-pulse" />
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-orange-200 dark:bg-orange-800/50 rounded w-full" />
          <div className="h-4 bg-orange-200 dark:bg-orange-800/50 rounded w-3/4" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-900/50 dark:bg-orange-950/20',
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <StickyNote className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('title')}
        </h2>
        {coachName && (
          <span className="flex items-center gap-1 ml-auto text-sm text-gray-500 dark:text-gray-400">
            <User className="h-4 w-4" />
            {coachName}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-orange-100 dark:border-orange-900/30"
          >
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">
              {note.content}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {getRelativeTime(note.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
