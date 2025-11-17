'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SwapDaysForm } from './swap-days-form'
import { ToggleMusclesForm } from './toggle-muscles-form'
import { ChangeVariationForm } from './change-variation-form'
import { ChangeSplitTypeForm } from './change-split-type-form'
import type { SplitType } from '@/lib/types/split.types'

interface CustomizeSplitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  currentSplitType: SplitType
  splitPlanData: {
    cycleDays: number
    sessions: Array<{
      day: number
      name: string
      workoutType: string
      focus: string[]
      variation: 'A' | 'B'
    }>
  }
  completedDays?: number[]
  onModificationComplete?: () => void
}

type Tab = 'swap' | 'toggle' | 'variation' | 'splitType'

export function CustomizeSplitDialog({
  open,
  onOpenChange,
  userId,
  currentSplitType,
  splitPlanData,
  completedDays = [],
  onModificationComplete
}: CustomizeSplitDialogProps) {
  const t = useTranslations('dashboard.splitCustomization')
  const [activeTab, setActiveTab] = useState<Tab>('swap')

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'swap', label: t('tabs.swapDays'), icon: '🔄' },
    { id: 'toggle', label: t('tabs.toggleMuscles'), icon: '💪' },
    { id: 'variation', label: t('tabs.changeVariation'), icon: '🔀' },
    { id: 'splitType', label: t('tabs.changeSplitType'), icon: '🔁' }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {t('title')}
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl">{tab.icon}</span>
                <span className="text-xs font-medium">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === 'swap' && (
            <SwapDaysForm
              userId={userId}
              splitPlanData={splitPlanData}
              completedDays={completedDays}
              onSuccess={() => {
                onModificationComplete?.()
                onOpenChange(false)
              }}
            />
          )}

          {activeTab === 'toggle' && (
            <ToggleMusclesForm
              userId={userId}
              splitPlanData={splitPlanData}
              completedDays={completedDays}
              onSuccess={() => {
                onModificationComplete?.()
                onOpenChange(false)
              }}
            />
          )}

          {activeTab === 'variation' && (
            <ChangeVariationForm
              userId={userId}
              splitPlanData={splitPlanData}
              completedDays={completedDays}
              onSuccess={() => {
                onModificationComplete?.()
                onOpenChange(false)
              }}
            />
          )}

          {activeTab === 'splitType' && (
            <ChangeSplitTypeForm
              userId={userId}
              currentSplitType={currentSplitType}
              onSuccess={() => {
                onModificationComplete?.()
                onOpenChange(false)
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
