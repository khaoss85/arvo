'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Bell,
  Timer,
} from 'lucide-react'
import { respondToWaitlistOfferAction } from '@/app/actions/waitlist-actions'
import type { BookingWaitlistEntry } from '@/lib/types/schemas'
import { cn } from '@/lib/utils/cn'
import { format, parseISO, differenceInHours, differenceInMinutes, isPast } from 'date-fns'

interface WaitlistOfferResponseProps {
  entry: BookingWaitlistEntry
  onResponse?: (accepted: boolean) => void
  className?: string
}

function parseSlotDetails(aiScoreReason: string | null): { date: string; startTime: string; endTime: string } | null {
  if (!aiScoreReason) return null
  try {
    return JSON.parse(aiScoreReason)
  } catch {
    return null
  }
}

function getTimeRemaining(deadline: string | null): { hours: number; minutes: number; isExpired: boolean } {
  if (!deadline) return { hours: 0, minutes: 0, isExpired: true }

  const deadlineDate = parseISO(deadline)
  if (isPast(deadlineDate)) {
    return { hours: 0, minutes: 0, isExpired: true }
  }

  const hours = differenceInHours(deadlineDate, new Date())
  const minutes = differenceInMinutes(deadlineDate, new Date()) % 60

  return { hours, minutes, isExpired: false }
}

export function WaitlistOfferResponse({
  entry,
  onResponse,
  className,
}: WaitlistOfferResponseProps) {
  const t = useTranslations('coach.waitlist')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [responseType, setResponseType] = useState<'accept' | 'decline' | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(entry.response_deadline))

  // Update time remaining every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(entry.response_deadline))
    }, 60000)

    return () => clearInterval(interval)
  }, [entry.response_deadline])

  const slotDetails = parseSlotDetails(entry.ai_score_reason)

  const handleResponse = async (accept: boolean) => {
    setIsSubmitting(true)
    setResponseType(accept ? 'accept' : 'decline')

    try {
      const result = await respondToWaitlistOfferAction(entry.id, accept)

      if (!result.error) {
        setIsSuccess(true)
        setTimeout(() => {
          onResponse?.(accept)
        }, 1500)
      }
    } catch (error) {
      console.error('[WaitlistOfferResponse] Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // If status is not 'notified', don't render
  if (entry.status !== 'notified') {
    return null
  }

  // If expired
  if (timeRemaining.isExpired) {
    return (
      <Card className={cn('p-4 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20', className)}>
        <div className="flex items-center gap-3">
          <Timer className="w-8 h-8 text-orange-500" />
          <div>
            <p className="font-medium text-orange-900 dark:text-orange-100">
              {t('offerExpired')}
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              The slot offer has expired
            </p>
          </div>
        </div>
      </Card>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <Card className={cn(
        'p-4',
        responseType === 'accept'
          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
          : 'border-muted bg-muted/50',
        className
      )}>
        <div className="flex items-center gap-3">
          {responseType === 'accept' ? (
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          ) : (
            <XCircle className="w-8 h-8 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">
              {responseType === 'accept' ? 'Slot accepted!' : 'Offer declined'}
            </p>
            <p className="text-sm text-muted-foreground">
              {responseType === 'accept'
                ? 'Your booking has been confirmed'
                : 'You remain on the waitlist'}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-4 border-primary/50 bg-primary/5', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <span className="font-semibold">{t('slotAvailable')}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            <Timer className="w-3 h-3 mr-1" />
            {timeRemaining.hours}h {timeRemaining.minutes}m left
          </Badge>
        </div>

        {/* Slot Details */}
        {slotDetails && (
          <div className="p-3 bg-background rounded-lg border">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-medium">
                  {format(parseISO(slotDetails.date), 'EEE, MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-medium">
                  {slotDetails.startTime.slice(0, 5)} - {slotDetails.endTime.slice(0, 5)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Response Deadline */}
        <p className="text-sm text-muted-foreground">
          {t('respondBy')}: {entry.response_deadline
            ? format(parseISO(entry.response_deadline), 'MMM d, HH:mm')
            : 'N/A'}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            className="flex-1"
            onClick={() => handleResponse(true)}
            disabled={isSubmitting}
          >
            {isSubmitting && responseType === 'accept' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {t('accept')}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleResponse(false)}
            disabled={isSubmitting}
          >
            {isSubmitting && responseType === 'decline' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                {t('decline')}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
