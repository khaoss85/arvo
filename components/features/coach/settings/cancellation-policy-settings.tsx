'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Clock, Ban, Check, Loader2, AlertTriangle } from 'lucide-react'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { useAuthStore } from '@/lib/stores/auth.store'
import {
  getCancellationPolicyAction,
  saveCancellationPolicyAction,
} from '@/app/actions/cancellation-policy-actions'
import type { CoachCancellationPolicy, InsertCoachCancellationPolicy } from '@/lib/types/schemas'

const CANCELLATION_HOURS_OPTIONS = [
  { value: '12', label: '12 ore' },
  { value: '24', label: '24 ore' },
  { value: '48', label: '48 ore' },
  { value: '72', label: '72 ore' },
]

export function CancellationPolicySettings() {
  const t = useTranslations('coach.calendar.cancellation')
  const { isCoach, isGymOwner, isAdmin, isLoading: roleLoading } = useUserRole()
  const { user } = useAuthStore()

  const [policy, setPolicy] = useState<CoachCancellationPolicy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Form state
  const [freeCancellationHours, setFreeCancellationHours] = useState<number>(24)
  const [chargesSession, setChargesSession] = useState<boolean>(true)
  const [refundPercentage, setRefundPercentage] = useState<number>(0)

  // Load existing policy
  const loadPolicy = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const result = await getCancellationPolicyAction(user.id)
      if (result.policy) {
        setPolicy(result.policy)
        setFreeCancellationHours(result.policy.free_cancellation_hours)
        setChargesSession(result.policy.late_cancel_charges_session)
        setRefundPercentage(result.policy.late_cancel_refund_percentage ?? 0)
      }
    } catch (error) {
      console.error('Failed to load cancellation policy:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id && (isCoach || isGymOwner || isAdmin)) {
      loadPolicy()
    }
  }, [user?.id, isCoach, isGymOwner, isAdmin, loadPolicy])

  // Track changes
  useEffect(() => {
    if (!policy) {
      setHasChanges(true)
      return
    }

    const changed =
      freeCancellationHours !== policy.free_cancellation_hours ||
      chargesSession !== policy.late_cancel_charges_session ||
      refundPercentage !== (policy.late_cancel_refund_percentage ?? 0)

    setHasChanges(changed)
    setSaveSuccess(false)
  }, [freeCancellationHours, chargesSession, refundPercentage, policy])

  const handleSave = async () => {
    if (!user?.id) return

    setIsSaving(true)
    try {
      const policyData: InsertCoachCancellationPolicy = {
        coach_id: user.id,
        free_cancellation_hours: freeCancellationHours,
        late_cancel_charges_session: chargesSession,
        late_cancel_refund_percentage: refundPercentage,
        policy_summary_en: null,
        policy_summary_it: null,
      }

      const result = await saveCancellationPolicyAction(policyData)

      if (result.error) {
        console.error('Failed to save policy:', result.error)
        return
      }

      if (result.policy) {
        setPolicy(result.policy)
        setHasChanges(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save cancellation policy:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Don't render for non-coaches
  if (roleLoading) {
    return null
  }

  if (!isCoach && !isGymOwner && !isAdmin) {
    return null
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-semibold">{t('policy')}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('policyNote')}
          </p>
        </div>

        {/* Free Cancellation Hours */}
        <div className="space-y-3">
          <Label htmlFor="cancellation-hours">{t('freeWindow')}</Label>
          <Select
            value={freeCancellationHours.toString()}
            onValueChange={(value: string) => setFreeCancellationHours(parseInt(value, 10))}
          >
            <SelectTrigger id="cancellation-hours" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CANCELLATION_HOURS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t('freeCancel', { hours: freeCancellationHours })}
          </p>
        </div>

        {/* Late Cancellation Charges Session */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-orange-500" />
              <Label htmlFor="charge-session" className="font-medium">
                {t('latePenalty')}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {chargesSession ? t('chargeSession') : t('noCharge')}
            </p>
          </div>
          <Switch
            id="charge-session"
            checked={chargesSession}
            onCheckedChange={setChargesSession}
          />
        </div>

        {/* Refund Percentage (only if not charging full session) */}
        {!chargesSession && (
          <div className="space-y-3">
            <Label>Percentuale rimborso</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[refundPercentage]}
                onValueChange={([value]) => setRefundPercentage(value)}
                max={100}
                min={0}
                step={10}
                className="flex-1"
              />
              <span className="w-12 text-right font-medium">{refundPercentage}%</span>
            </div>
          </div>
        )}

        {/* Late Cancellation Warning Preview */}
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                {t('lateCancel')}
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                {t('warning', { hours: freeCancellationHours })}
                {chargesSession && ` ${t('sessionWillBeCharged')}`}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                Salvato
              </span>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              'Salva Policy'
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
