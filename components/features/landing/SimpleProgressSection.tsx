'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Camera, Activity, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function SimpleProgressSection() {
  const t = useTranslations('landingSimple.simpleProgressSection')

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            {t('title.part1')} <span className="text-primary-600 dark:text-primary-400">{t('title.part2')}</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Progress Photos Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-2 h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  {t('photos.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Simple 2x2 Photo Grid Preview */}
                <div className="bg-muted rounded p-4 mb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {['Front', 'Side', 'Side', 'Back'].map((label, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex flex-col items-center justify-center border border-gray-300 dark:border-gray-600"
                      >
                        <User className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-1" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('photos.description')}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Muscle Progress Chart Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-2 h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  {t('chart.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Simple Muscle Bars Preview */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded p-4 mb-3">
                  <div className="space-y-3">
                    {[
                      { name: 'Chest', percent: 85 },
                      { name: 'Back', percent: 95 },
                      { name: 'Arms', percent: 75 },
                      { name: 'Legs', percent: 90 },
                    ].map((muscle, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{muscle.name}</span>
                          <span className="text-gray-500 dark:text-gray-400">{muscle.percent}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${muscle.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('chart.description')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
