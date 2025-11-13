'use client'

import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Brain, AlertCircle, ArrowRight, CheckCircle, Settings, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface InsightInfluencedChange {
  source: 'insight' | 'memory'
  sourceId: string
  sourceTitle: string
  action: 'avoided' | 'substituted' | 'preferred' | 'adjusted'
  originalExercise?: string
  selectedExercise?: string
  reason: string
}

interface InsightChangesModalProps {
  isOpen: boolean
  onClose: () => void
  changes: InsightInfluencedChange[]
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  avoided: <AlertCircle className="w-5 h-5 text-orange-400" />,
  substituted: <ArrowRight className="w-5 h-5 text-blue-400" />,
  preferred: <CheckCircle className="w-5 h-5 text-green-400" />,
  adjusted: <Settings className="w-5 h-5 text-purple-400" />
}

export function InsightChangesModal({ isOpen, onClose, changes }: InsightChangesModalProps) {
  const t = useTranslations('workout.components.insightChanges')
  const router = useRouter()

  const handleViewMemories = () => {
    router.push('/memory')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-white">
            <Brain className="w-7 h-7 text-purple-400" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <p className="text-gray-300 mb-6">
            {t('description')}
          </p>

          <div className="space-y-4">
            {changes.map((change, idx) => (
              <div
                key={idx}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-700/50 rounded flex-shrink-0">
                    {ACTION_ICONS[change.action]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-purple-400 uppercase">
                        {t(`actions.${change.action}`)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                        {t(`sourceLabels.${change.source}`)}
                      </span>
                    </div>

                    {/* Exercise change visual */}
                    {change.originalExercise && change.selectedExercise && (
                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <span className="text-gray-400">{change.originalExercise}</span>
                        <ArrowRight className="w-4 h-4 text-purple-400" />
                        <span className="text-white font-semibold">{change.selectedExercise}</span>
                      </div>
                    )}

                    {/* Reason */}
                    <p className="text-sm text-gray-300 mb-2">{change.reason}</p>

                    {/* Source title */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{t('basedOn')}</span>
                      <span className="text-purple-400">{change.sourceTitle}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer with action buttons */}
          <div className="mt-6 pt-4 border-t border-gray-700 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewMemories}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300"
            >
              <Brain className="w-4 h-4" />
              {t('viewAllMemories')}
              <ExternalLink className="w-3 h-3" />
            </Button>
            <Button
              onClick={onClose}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {t('understood')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
