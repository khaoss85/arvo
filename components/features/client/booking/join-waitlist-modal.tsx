'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Loader2, Clock, Calendar, CheckCircle2 } from 'lucide-react'
import { joinWaitlistAction } from '@/app/actions/waitlist-actions'
import { cn } from '@/lib/utils/cn'

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

const TIME_OPTIONS = [
  { value: '06:00:00', label: '06:00' },
  { value: '07:00:00', label: '07:00' },
  { value: '08:00:00', label: '08:00' },
  { value: '09:00:00', label: '09:00' },
  { value: '10:00:00', label: '10:00' },
  { value: '11:00:00', label: '11:00' },
  { value: '12:00:00', label: '12:00' },
  { value: '13:00:00', label: '13:00' },
  { value: '14:00:00', label: '14:00' },
  { value: '15:00:00', label: '15:00' },
  { value: '16:00:00', label: '16:00' },
  { value: '17:00:00', label: '17:00' },
  { value: '18:00:00', label: '18:00' },
  { value: '19:00:00', label: '19:00' },
  { value: '20:00:00', label: '20:00' },
  { value: '21:00:00', label: '21:00' },
]

interface JoinWaitlistModalProps {
  isOpen: boolean
  onClose: () => void
  coachId: string
  packageId?: string
  onJoined?: () => void
}

export function JoinWaitlistModal({
  isOpen,
  onClose,
  coachId,
  packageId,
  onJoined,
}: JoinWaitlistModalProps) {
  const t = useTranslations('coach.calendar.waitlist')

  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [timeStart, setTimeStart] = useState<string>('')
  const [timeEnd, setTimeEnd] = useState<string>('')
  const [urgency, setUrgency] = useState<number>(50)
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await joinWaitlistAction(coachId, {
        preferred_days: selectedDays.length > 0 ? selectedDays : undefined,
        preferred_time_start: timeStart || undefined,
        preferred_time_end: timeEnd || undefined,
        urgency_level: urgency,
        notes: notes || undefined,
        package_id: packageId,
      })

      if (result.error) {
        if (result.error.includes('Already on')) {
          setError(t('alreadyOnWaitlist'))
        } else {
          setError(result.error)
        }
        return
      }

      setIsSuccess(true)
      setTimeout(() => {
        onJoined?.()
        onClose()
        // Reset state
        setIsSuccess(false)
        setSelectedDays([])
        setTimeStart('')
        setTimeEnd('')
        setUrgency(50)
        setNotes('')
      }, 1500)
    } catch (err) {
      console.error('[JoinWaitlistModal] Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('join')}</DialogTitle>
          <DialogDescription>
            {t('preferences')}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <p className="text-lg font-medium text-green-600 dark:text-green-400">
              {t('addedToWaitlist')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Preferred Days */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('preferredDays')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full border transition-colors',
                      selectedDays.includes(day.value)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedDays.length === 0 ? t('anyDay') : `${selectedDays.length} days selected`}
              </p>
            </div>

            {/* Time Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('timeRange')}
              </Label>
              <div className="flex items-center gap-2">
                <select
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Start</option>
                  {TIME_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <span className="text-muted-foreground">-</span>
                <select
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">End</option>
                  {TIME_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                {!timeStart && !timeEnd ? t('anyTime') : ''}
              </p>
            </div>

            {/* Urgency Level */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('urgency')}</Label>
                <span className="text-sm font-medium">{urgency}%</span>
              </div>
              <Slider
                value={[urgency]}
                onValueChange={([value]) => setUrgency(value)}
                max={100}
                min={0}
                step={10}
              />
              <p className="text-xs text-muted-foreground">
                {urgency <= 30 ? 'Low priority' : urgency <= 70 ? 'Medium priority' : 'High priority'}
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional preferences or notes..."
                rows={3}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        {!isSuccess && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                t('join')
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
