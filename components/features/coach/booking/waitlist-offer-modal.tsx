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
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  Package,
  Loader2,
  Send,
  Star,
  CheckCircle2,
} from 'lucide-react'
import { notifyWaitlistCandidateAction } from '@/app/actions/waitlist-actions'
import type { WaitlistCandidate } from '@/lib/types/schemas'
import { cn } from '@/lib/utils/cn'
import { format, parseISO } from 'date-fns'
import { formatDays, formatTimeRange } from '@/lib/utils/waitlist-helpers'

interface SlotDetails {
  date: string
  startTime: string
  endTime: string
}

interface WaitlistOfferModalProps {
  isOpen: boolean
  onClose: () => void
  slot: SlotDetails
  candidates: WaitlistCandidate[]
  onOfferSent: () => void
}

export function WaitlistOfferModal({
  isOpen,
  onClose,
  slot,
  candidates,
  onOfferSent,
}: WaitlistOfferModalProps) {
  const t = useTranslations('coach.waitlist')
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sentId, setSentId] = useState<string | null>(null)

  const handleSendOffer = async () => {
    if (!selectedCandidateId) return

    setIsSending(true)
    try {
      const result = await notifyWaitlistCandidateAction(selectedCandidateId, slot)

      if (!result.error) {
        setSentId(selectedCandidateId)
        setTimeout(() => {
          onOfferSent()
          onClose()
          setSentId(null)
          setSelectedCandidateId(null)
        }, 1500)
      }
    } catch (error) {
      console.error('[WaitlistOfferModal] Error sending offer:', error)
    } finally {
      setIsSending(false)
    }
  }

  const formattedDate = slot.date ? format(parseISO(slot.date), 'EEE, MMM d, yyyy') : ''
  const formattedTime = `${slot.startTime.slice(0, 5)} - ${slot.endTime.slice(0, 5)}`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('offerSlot')}</DialogTitle>
          <DialogDescription>
            {t('selectCandidate')}
          </DialogDescription>
        </DialogHeader>

        {/* Slot Details */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h4 className="text-sm font-medium mb-2">{t('slotDetails')}</h4>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>{formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          <h4 className="text-sm font-medium">{t('candidates')} ({candidates.length})</h4>

          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('empty')}
            </p>
          ) : (
            candidates.map((candidate, index) => {
              const isSelected = selectedCandidateId === candidate.id
              const isSent = sentId === candidate.id

              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => !isSent && setSelectedCandidateId(candidate.id)}
                  disabled={isSent}
                  className={cn(
                    'w-full p-3 rounded-lg border text-left transition-all',
                    isSelected && !isSent
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50',
                    isSent && 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="font-medium">{candidate.client_name}</span>
                        {candidate.has_active_package && (
                          <Badge variant="secondary" className="text-xs">
                            <Package className="w-3 h-3 mr-1" />
                            {t('hasPackage')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDays(candidate.preferred_days)}</span>
                        <span>{formatTimeRange(candidate.preferred_time_start, candidate.preferred_time_end)}</span>
                        <span>{t('daysWaiting', { days: candidate.days_waiting })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {isSent ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-lg font-bold">{candidate.ai_priority_score}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{t('matchScore')}</p>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Note about expiration */}
        <p className="text-xs text-muted-foreground text-center">
          {t('expiresIn', { hours: 4 })}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            onClick={handleSendOffer}
            disabled={!selectedCandidateId || isSending || !!sentId}
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : sentId ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {t('offerSent')}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t('notify')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
