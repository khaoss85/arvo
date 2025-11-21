'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Camera, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckRoomCardDemo } from './CheckRoomCardDemo'

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

interface CheckRoomSectionProps {
  variant?: 'default' | 'pro'
}

export function CheckRoomSection({ variant = 'default' }: CheckRoomSectionProps) {
  const t = useTranslations(variant === 'default' ? 'checkRoomSection' : 'landingPro.checkRoomSection')

  return (
    <section className="py-24 px-4 bg-background">
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
              {t('sectionTitle.part1')}{' '}
              <span className="text-primary-600 dark:text-primary-400">
                {t('sectionTitle.part2')}
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('sectionSubtitle')}
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
          <Card className="border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Camera className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                {t('cardTitle')}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {t('cardDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Live Demo Component */}
              <div className="mb-6">
                <CheckRoomCardDemo />
              </div>

              {/* Features List */}
              <div className="grid md:grid-cols-2 gap-4">
                {variant === 'default' ? (
                  <>
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
                  </>
                ) : (
                  /* Pro variant - benefits instead of features */
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">📸</span>
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm mb-0.5">{t('benefit1.title')}</h5>
                        <p className="text-xs text-muted-foreground">{t('benefit1.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">📏</span>
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm mb-0.5">{t('benefit2.title')}</h5>
                        <p className="text-xs text-muted-foreground">{t('benefit2.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">🎯</span>
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm mb-0.5">{t('benefit3.title')}</h5>
                        <p className="text-xs text-muted-foreground">{t('benefit3.description')}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Note */}
        {variant === 'default' && (
          <motion.div
            className="mt-12 p-6 bg-muted rounded-lg border max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-center text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{t('footer.bold')}</span>{' '}
              {t('footer.text')}
            </p>
          </motion.div>
        )}

        {/* Pro Tip - Only for pro variant */}
        {variant === 'pro' && (
          <motion.div
            className="mt-8 p-4 bg-primary-50 dark:bg-primary-950/50 rounded-lg border border-primary-200 dark:border-primary-800 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm text-primary-900 dark:text-foreground">
              <strong>{t('proTip.bold')}</strong> {t('proTip.text')}
            </p>
          </motion.div>
        )}
      </div>
    </section>
  )
}
