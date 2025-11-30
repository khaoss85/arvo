'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { RotateCcw } from 'lucide-react'
import { useTourStore } from '@/lib/stores/tour.store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface RestartTourSectionProps {
  mode?: 'advanced' | 'simple'
}

export function RestartTourSection({ mode = 'advanced' }: RestartTourSectionProps) {
  const t = useTranslations('settings.tour')
  const router = useRouter()
  const { resetDashboardTour, resetSimpleTour } = useTourStore()

  const handleRestartTour = () => {
    if (mode === 'simple') {
      resetSimpleTour()
      router.push('/simple')
    } else {
      resetDashboardTour()
      router.push('/dashboard')
    }
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">{t('title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRestartTour}
          className="w-full sm:w-auto"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {t('restartButton')}
        </Button>
      </div>
    </Card>
  )
}
