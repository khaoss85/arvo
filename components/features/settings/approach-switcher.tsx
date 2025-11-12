'use client'

import { useState, useEffect } from 'react'
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ApproachDetails } from '@/components/features/onboarding/approach-details'
import {
  getAllApproachesAction,
  switchTrainingApproachAction
} from '@/app/actions/approach-actions'
import type { TrainingApproach } from '@/lib/types/schemas'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ApproachSwitcherProps {
  userId: string
  currentApproachId?: string | null
  currentApproachName?: string
}

export function ApproachSwitcher({
  userId,
  currentApproachId,
  currentApproachName
}: ApproachSwitcherProps) {
  const [approaches, setApproaches] = useState<TrainingApproach[]>([])
  const [selectedApproach, setSelectedApproach] = useState<TrainingApproach | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsApproach, setDetailsApproach] = useState<TrainingApproach | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Confirm modal state
  const [switchReason, setSwitchReason] = useState('')
  const [splitSetupType, setSplitSetupType] = useState<'auto' | 'manual'>('auto')
  const [selectedSplitType, setSelectedSplitType] = useState<'push_pull_legs' | 'upper_lower' | 'full_body'>('push_pull_legs')

  useEffect(() => {
    loadApproaches()
  }, [])

  const loadApproaches = async () => {
    setIsFetching(true)
    const result = await getAllApproachesAction()
    setIsFetching(false)

    if (result.success && result.data) {
      setApproaches(result.data)
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to load approaches' })
    }
  }

  const handleSelectApproach = (approach: TrainingApproach) => {
    if (approach.id === currentApproachId) {
      setMessage({ type: 'error', text: 'You are already using this approach' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setSelectedApproach(approach)
    setShowConfirmModal(true)
  }

  const handleConfirmSwitch = async () => {
    if (!selectedApproach) return

    setIsLoading(true)
    setShowConfirmModal(false)

    const result = await switchTrainingApproachAction(
      userId,
      selectedApproach.id,
      {
        switchReason: switchReason || undefined,
        generateNewSplit: splitSetupType === 'auto',
        splitType: splitSetupType === 'auto' ? selectedSplitType : undefined
      }
    )

    setIsLoading(false)

    if (result.success) {
      setMessage({
        type: 'success',
        text: splitSetupType === 'auto'
          ? 'Training approach switched successfully! New split plan generated.'
          : 'Training approach switched successfully! Please configure your split plan.'
      })

      // Reload approaches to update UI
      await loadApproaches()

      // If manual setup, redirect to split configuration after delay
      if (splitSetupType === 'manual') {
        setTimeout(() => {
          window.location.href = '/onboarding/split'
        }, 2000)
      } else {
        // Reload page to reflect changes
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to switch approach' })
    }

    // Reset form
    setSwitchReason('')
    setSplitSetupType('auto')
    setSelectedSplitType('push_pull_legs')
  }

  const handleShowDetails = (approach: TrainingApproach, e: React.MouseEvent) => {
    e.stopPropagation()
    setDetailsApproach(approach)
    setShowDetailsModal(true)
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Training Approach</h3>
        <p className="text-sm text-muted-foreground">
          Switch between different training methodologies. Your workout history will be preserved.
        </p>
        {currentApproachName && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Current: {currentApproachName}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {approaches.map((approach) => {
          const variables = approach.variables as any
          const isCurrent = approach.id === currentApproachId

          return (
            <Card
              key={approach.id}
              className={`p-5 cursor-pointer transition-all ${
                isCurrent
                  ? 'ring-2 ring-primary bg-primary/5 cursor-default'
                  : 'hover:bg-accent hover:shadow-md'
              }`}
              onClick={() => !isCurrent && handleSelectApproach(approach)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-base">{approach.name}</h4>
                    {approach.creator && (
                      <p className="text-xs text-muted-foreground">
                        by {approach.creator}
                      </p>
                    )}
                  </div>
                  {isCurrent && (
                    <div className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium">
                      Active
                    </div>
                  )}
                </div>

                {approach.philosophy && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {approach.philosophy}
                  </p>
                )}

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Working Sets:</span>
                    <span className="font-medium">{variables?.setsPerExercise?.working || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rep Range:</span>
                    <span className="font-medium">
                      {variables?.repRanges?.compound?.[0]}-{variables?.repRanges?.compound?.[1] || variables?.repRanges?.isolation?.[1] || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RIR Target:</span>
                    <span className="font-medium">{variables?.rirTarget?.normal ?? 'N/A'}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleShowDetails(approach, e)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-2"
                >
                  <Info className="w-3.5 h-3.5" />
                  Learn more
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Confirm Switch Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Switch to {selectedApproach?.name}?
            </DialogTitle>
            <DialogDescription>
              {currentApproachName && (
                <span className="block mb-2">
                  Current: <strong>{currentApproachName}</strong> → New: <strong>{selectedApproach?.name}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Warning section */}
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                This will:
              </h4>
              <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                <li>• Deactivate your current split plan</li>
                <li>• Archive your current approach in history</li>
                <li>• Update your training methodology</li>
                <li>• Preserve all your workout history for analysis</li>
              </ul>
            </div>

            {/* Split setup option */}
            <div className="space-y-3">
              <label className="text-base font-semibold block">Split Plan Setup</label>
              <div className="space-y-2">
                <div className="flex items-start space-x-3 p-3 rounded-lg border">
                  <input
                    type="radio"
                    id="auto"
                    name="splitSetup"
                    value="auto"
                    checked={splitSetupType === 'auto'}
                    onChange={(e) => setSplitSetupType(e.target.value as 'auto' | 'manual')}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <label htmlFor="auto" className="font-medium cursor-pointer">
                      Auto-generate new split plan
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      AI will create a split compatible with {selectedApproach?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg border">
                  <input
                    type="radio"
                    id="manual"
                    name="splitSetup"
                    value="manual"
                    checked={splitSetupType === 'manual'}
                    onChange={(e) => setSplitSetupType(e.target.value as 'auto' | 'manual')}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <label htmlFor="manual" className="font-medium cursor-pointer">
                      Configure split manually
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll be redirected to split configuration page
                    </p>
                  </div>
                </div>
              </div>

              {/* Split type selector (only if auto) */}
              {splitSetupType === 'auto' && (
                <div className="ml-7 space-y-2 pt-2">
                  <label className="text-sm block">Select split type:</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="ppl"
                        name="splitType"
                        value="push_pull_legs"
                        checked={selectedSplitType === 'push_pull_legs'}
                        onChange={(e) => setSelectedSplitType(e.target.value as any)}
                      />
                      <label htmlFor="ppl" className="text-sm font-normal cursor-pointer">
                        Push / Pull / Legs
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="ul"
                        name="splitType"
                        value="upper_lower"
                        checked={selectedSplitType === 'upper_lower'}
                        onChange={(e) => setSelectedSplitType(e.target.value as any)}
                      />
                      <label htmlFor="ul" className="text-sm font-normal cursor-pointer">
                        Upper / Lower
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="fb"
                        name="splitType"
                        value="full_body"
                        checked={selectedSplitType === 'full_body'}
                        onChange={(e) => setSelectedSplitType(e.target.value as any)}
                      />
                      <label htmlFor="fb" className="text-sm font-normal cursor-pointer">
                        Full Body
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Optional reason */}
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm block">
                Why are you switching? (optional)
              </label>
              <textarea
                id="reason"
                value={switchReason}
                onChange={(e) => setSwitchReason(e.target.value)}
                placeholder="e.g., Want to try high intensity training, Need more recovery time..."
                className="w-full h-20 resize-none p-3 rounded-md border border-input bg-background text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSwitch}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Switching...
                </>
              ) : (
                'Confirm Switch'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      {showDetailsModal && detailsApproach && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <ApproachDetails
              approach={detailsApproach}
              onClose={() => {
                setShowDetailsModal(false)
                setDetailsApproach(null)
              }}
            />
          </div>
        </div>
      )}

      {/* Feedback messages */}
      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Processing approach switch...
        </div>
      )}
    </div>
  )
}
