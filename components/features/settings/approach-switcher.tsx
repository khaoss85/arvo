'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Info, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ApproachDetails } from '@/components/features/onboarding/approach-details'
import { ApproachCategoryTabs } from '@/components/features/onboarding/approach-category-tabs'
import { ApproachRecommendationDialog } from '@/components/features/onboarding/approach-recommendation-dialog'
import {
  getAllApproachesAction,
  switchTrainingApproachAction
} from '@/app/actions/approach-actions'
import type { TrainingApproach, ApproachCategory, SportGoal } from '@/lib/types/schemas'
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
  // Optional props for AI recommendation
  availableEquipment?: string[]
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
  trainingObjective?: 'bulk' | 'cut' | 'maintain' | 'recomp' | null
  weeklyFrequency?: number
  age?: number | null
  gender?: 'male' | 'female' | 'other' | null
  sportGoal?: SportGoal
  onSportGoalChange?: (goal: SportGoal) => void
}

// Get badge styling based on recommended level
function getLevelBadgeStyles(level: string | null | undefined): { bg: string; text: string } {
  switch (level) {
    case 'beginner':
      return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' }
    case 'intermediate':
      return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' }
    case 'advanced':
      return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' }
    case 'all_levels':
    default:
      return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' }
  }
}

export function ApproachSwitcher({
  userId,
  currentApproachId,
  currentApproachName,
  availableEquipment,
  experienceLevel,
  trainingObjective,
  weeklyFrequency,
  age,
  gender,
  sportGoal,
  onSportGoalChange
}: ApproachSwitcherProps) {
  const t = useTranslations('settings.approachSwitcher')
  const tApproach = useTranslations('onboarding.steps.approach')
  const tCard = useTranslations('onboarding.approachCard')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [approaches, setApproaches] = useState<TrainingApproach[]>([])
  const [selectedApproach, setSelectedApproach] = useState<TrainingApproach | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRecommendation, setShowRecommendation] = useState(false)
  const [detailsApproach, setDetailsApproach] = useState<TrainingApproach | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeCategory, setActiveCategory] = useState<ApproachCategory>('bodybuilding')

  // Filter approaches by active category
  const filteredApproaches = useMemo(() => {
    return approaches.filter(
      (approach) => ((approach as any).category || 'bodybuilding') === activeCategory
    )
  }, [approaches, activeCategory])

  // Count approaches per category
  const categoryCounts = useMemo(() => {
    return approaches.reduce(
      (acc, approach) => {
        const cat = ((approach as any).category || 'bodybuilding') as ApproachCategory
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      },
      { bodybuilding: 0, powerlifting: 0 } as Record<ApproachCategory, number>
    )
  }, [approaches])

  // Create approach name map for the recommendation dialog
  const approachNames = useMemo(() => {
    return approaches.reduce(
      (acc, approach) => {
        acc[approach.id] = approach.name
        return acc
      },
      {} as Record<string, string>
    )
  }, [approaches])

  // Check if we have enough data to show the recommendation button
  const canShowRecommendation = Boolean(
    experienceLevel &&
    availableEquipment &&
    availableEquipment.length > 0
  )

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
      setMessage({ type: 'error', text: result.error || t('messages.loadError') })
    }
  }

  const handleSelectApproach = (approach: TrainingApproach) => {
    if (approach.id === currentApproachId) {
      setMessage({ type: 'error', text: t('alreadyUsing') })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setSelectedApproach(approach)
    setShowConfirmModal(true)
  }

  const handleRecommendationSelect = (approachId: string) => {
    const approach = approaches.find(a => a.id === approachId)
    if (approach) {
      handleSelectApproach(approach)
    }
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
          ? t('messages.switchSuccessAuto')
          : t('messages.switchSuccessManual')
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
      setMessage({ type: 'error', text: result.error || t('messages.switchError') })
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
        <h3 className="text-lg font-semibold mb-2">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
        {currentApproachName && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            {t('currentLabel', { name: currentApproachName })}
          </div>
        )}
      </div>

      {/* AI Recommendation Button */}
      {canShowRecommendation && (
        <Button
          variant="outline"
          onClick={() => setShowRecommendation(true)}
          className="w-full sm:w-auto"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {tApproach('getRecommendation')}
        </Button>
      )}

      {/* Category Tabs */}
      <ApproachCategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        counts={categoryCounts}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredApproaches.map((approach) => {
          const variables = approach.variables as any
          const isCurrent = approach.id === currentApproachId

          // Level badge info
          const recommendedLevel = (approach as any).recommended_level || 'all_levels'
          const levelNotes = (approach as any).level_notes as { it?: string; en?: string } | null
          const levelNote = levelNotes?.[locale as 'it' | 'en'] || levelNotes?.en
          const levelStyles = getLevelBadgeStyles(recommendedLevel)

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
                        {tCommon('by')} {approach.creator}
                      </p>
                    )}
                    {/* Level Badge */}
                    <div className="mt-1.5 flex flex-col gap-0.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${levelStyles.bg} ${levelStyles.text}`}>
                        {tCard(`levels.${recommendedLevel}`)}
                      </span>
                      {levelNote && (
                        <p className="text-[10px] text-muted-foreground italic">
                          {levelNote}
                        </p>
                      )}
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium">
                      {t('activeBadge')}
                    </div>
                  )}
                </div>

                {(approach.short_philosophy || approach.philosophy) && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {approach.short_philosophy || approach.philosophy}
                  </p>
                )}

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('workingSets')}</span>
                    <span className="font-medium">{variables?.setsPerExercise?.working || tCommon('notAvailable')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('repRange')}</span>
                    <span className="font-medium">
                      {variables?.repRanges?.compound?.[0]}-{variables?.repRanges?.compound?.[1] || variables?.repRanges?.isolation?.[1] || tCommon('notAvailable')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('rirTarget')}</span>
                    <span className="font-medium">{variables?.rirTarget?.normal ?? tCommon('notAvailable')}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleShowDetails(approach, e)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-2"
                >
                  <Info className="w-3.5 h-3.5" />
                  {t('learnMore')}
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
              {t('switchTitle', { name: selectedApproach?.name || '' })}
            </DialogTitle>
            <DialogDescription>
              {currentApproachName && (
                <span className="block mb-2">
                  {t('currentTo', { current: currentApproachName, new: selectedApproach?.name || '' })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Warning section */}
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                {t('warningTitle')}
              </h4>
              <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                <li>• {t('warningItems.deactivateSplit')}</li>
                <li>• {t('warningItems.archiveApproach')}</li>
                <li>• {t('warningItems.updateMethodology')}</li>
                <li>• {t('warningItems.preserveHistory')}</li>
              </ul>
            </div>

            {/* Split setup option */}
            <div className="space-y-3">
              <label className="text-base font-semibold block">{t('splitSetup.title')}</label>
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
                      {t('splitSetup.auto.label')}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('splitSetup.auto.description', { approachName: selectedApproach?.name || '' })}
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
                      {t('splitSetup.manual.label')}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('splitSetup.manual.description')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Split type selector (only if auto) */}
              {splitSetupType === 'auto' && (
                <div className="ml-7 space-y-2 pt-2">
                  <label className="text-sm block">{t('splitSetup.selectType')}</label>
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
                        {t('splitSetup.pushPullLegs')}
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
                        {t('splitSetup.upperLower')}
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
                        {t('splitSetup.fullBody')}
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Optional reason */}
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm block">
                {t('switchReason.label')}
              </label>
              <textarea
                id="reason"
                value={switchReason}
                onChange={(e) => setSwitchReason(e.target.value)}
                placeholder={t('switchReason.placeholder')}
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
              {t('buttons.cancel')}
            </Button>
            <Button
              onClick={handleConfirmSwitch}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t('buttons.switching')}
                </>
              ) : (
                t('buttons.confirmSwitch')
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
          {tCommon('processing')}
        </div>
      )}

      {/* AI Recommendation Dialog */}
      {canShowRecommendation && (
        <ApproachRecommendationDialog
          open={showRecommendation}
          onOpenChange={setShowRecommendation}
          onSelectApproach={handleRecommendationSelect}
          availableEquipment={availableEquipment || []}
          experienceLevel={experienceLevel || 'intermediate'}
          trainingObjective={trainingObjective || null}
          weeklyFrequency={weeklyFrequency || 4}
          age={age}
          gender={gender}
          approachNames={approachNames}
          initialSportGoal={sportGoal}
          onSportGoalChange={onSportGoalChange}
        />
      )}
    </div>
  )
}
