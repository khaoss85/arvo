'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Activity, Check, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MuscleRadarChart } from '@/components/features/analytics/muscle-radar-chart'

// Mock data for demo
const mockTargetData = {
  chest: 20,
  back: 22,
  shoulders: 16,
  legs: 24,
  arms: 14,
  abs: 12,
}

const mockActualData = {
  chest: 18,
  back: 24,
  shoulders: 14,
  legs: 22,
  arms: 16,
  abs: 10,
}

const mockPreviousData = {
  chest: 16,
  back: 20,
  shoulders: 12,
  legs: 20,
  arms: 14,
  abs: 8,
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

interface RadarChartSectionProps {
  variant?: 'default' | 'pro'
}

export function RadarChartSection({ variant = 'default' }: RadarChartSectionProps) {
  const t = useTranslations(variant === 'default' ? 'radarChartSection' : 'landingPro.radarChartSection')

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-7xl mx-auto">
        {/* Header - Only for default variant */}
        {variant === 'default' && (
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-primary-600 dark:text-primary-400">
                {t('cardTitle')}
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('cardDescription')}
            </p>
          </motion.div>
        )}

        {/* Main Card */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Card className={`border-2 ${variant === 'pro' ? 'border-primary-200 dark:border-primary-800' : 'hover:border-primary-300 dark:hover:border-primary-700'} transition-colors`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${variant === 'pro' ? 'text-2xl' : 'text-xl'}`}>
                {variant === 'pro' ? (
                  <BarChart3 className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                ) : (
                  <Activity className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                )}
                {t(variant === 'pro' ? 'title' : 'cardTitle')}
              </CardTitle>
              <CardDescription className={`${variant === 'pro' ? 'text-base' : 'text-sm'} mt-2`}>
                {t(variant === 'pro' ? 'description' : 'cardDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Live Radar Chart Component */}
              <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-6 mb-6 border-2 ${variant === 'pro' ? 'border-blue-300 dark:border-blue-700' : 'border-blue-200 dark:border-blue-800'}`}>
                <MuscleRadarChart
                  targetData={mockTargetData}
                  actualData={mockActualData}
                  previousData={mockPreviousData}
                  comparisonMode="target"
                  maxMuscles={6}
                />
              </div>

              {/* Features/Use Cases */}
              {variant === 'default' ? (
                /* Default variant - Simple feature list */
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm">{t('feature1')}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm">{t('feature2')}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm">{t('feature3')}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm">{t('feature4')}</span>
                  </div>
                </div>
              ) : (
                /* Pro variant - Use cases grid */
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-sm">{t('useCase1.title')}</h4>
                    <p className="text-xs text-muted-foreground">{t('useCase1.description')}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-sm">{t('useCase2.title')}</h4>
                    <p className="text-xs text-muted-foreground">{t('useCase2.description')}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-sm">{t('useCase3.title')}</h4>
                    <p className="text-xs text-muted-foreground">{t('useCase3.description')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
