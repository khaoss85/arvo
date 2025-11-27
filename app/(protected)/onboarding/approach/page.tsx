'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { TrainingApproachService } from '@/lib/services/training-approach.service'
import { ApproachCard } from '@/components/features/onboarding/approach-card'
import { ApproachCategoryTabs } from '@/components/features/onboarding/approach-category-tabs'
import { ApproachRecommendationDialog } from '@/components/features/onboarding/approach-recommendation-dialog'
import { Button } from '@/components/ui/button'
import type { TrainingApproach, ApproachCategory, SportGoal } from '@/lib/types/schemas'

export default function ApproachSelectionPage() {
  const t = useTranslations('onboarding.steps.approach')
  const tCommon = useTranslations('common.buttons')
  const router = useRouter()
  const [approaches, setApproaches] = useState<TrainingApproach[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<ApproachCategory>('bodybuilding')
  const [showRecommendation, setShowRecommendation] = useState(false)
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()

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

  const handleSportGoalChange = (goal: SportGoal) => {
    setStepData('sportGoal', goal)
  }

  const experienceLevel = data.experienceLevel
  const currentStepNumber = 2 // Step 2 for intermediate/advanced

  useEffect(() => {
    // Redirect beginners - they should skip this step
    if (experienceLevel === 'beginner') {
      router.push('/onboarding/profile')
      return
    }

    setStep(currentStepNumber)
    loadApproaches()
  }, [setStep, experienceLevel, router, currentStepNumber])

  const loadApproaches = async () => {
    try {
      const data = await TrainingApproachService.getAll()
      setApproaches(data)
    } catch (error) {
      console.error('Failed to load approaches:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectApproach = (approachId: string) => {
    setStepData('approachId', approachId)
    completeStep(currentStepNumber)
    router.push('/onboarding/profile')
  }

  const handleBack = () => {
    router.push('/onboarding/level')
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{tCommon('back')}</span>
      </button>

      <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {t('description')}
      </p>

      {/* AI Recommendation Button */}
      <Button
        variant="outline"
        onClick={() => setShowRecommendation(true)}
        className="mb-6 w-full sm:w-auto"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {t('getRecommendation')}
      </Button>

      {/* Category Tabs */}
      <ApproachCategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        counts={categoryCounts}
      />

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      ) : filteredApproaches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {t('noApproachesFound')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApproaches.map((approach) => (
            <ApproachCard
              key={approach.id}
              approach={approach}
              selected={data.approachId === approach.id}
              onSelect={() => selectApproach(approach.id)}
            />
          ))}
        </div>
      )}

      {/* AI Recommendation Dialog */}
      <ApproachRecommendationDialog
        open={showRecommendation}
        onOpenChange={setShowRecommendation}
        onSelectApproach={selectApproach}
        availableEquipment={data.availableEquipment || []}
        experienceLevel={data.experienceLevel || 'intermediate'}
        trainingObjective={data.trainingObjective || null}
        weeklyFrequency={data.weeklyFrequency || 4}
        age={data.age}
        gender={data.gender}
        approachNames={approachNames}
        initialSportGoal={data.sportGoal}
        onSportGoalChange={handleSportGoalChange}
      />
    </div>
  )
}
