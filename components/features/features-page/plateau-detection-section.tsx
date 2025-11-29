'use client';

import { motion } from "framer-motion";
import { Calendar, TrendingDown, RefreshCw, AlertTriangle, Lightbulb } from "lucide-react";
import { useTranslations } from 'next-intl';

export function PlateauDetectionSection() {
  const t = useTranslations('features.plateauDetection');

  const features = [
    { icon: <Calendar className="w-5 h-5" />, key: 'history' },
    { icon: <TrendingDown className="w-5 h-5" />, key: 'detection' },
    { icon: <RefreshCw className="w-5 h-5" />, key: 'rotation' },
  ];

  const timelineWeeks = [
    { week: 1, progress: true, label: 'week1' },
    { week: 4, progress: true, label: 'week4' },
    { week: 8, progress: false, label: 'week8', plateau: true },
  ];

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Timeline Visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-background rounded-2xl p-6 border border-border shadow-sm">
              {/* Exercise Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  <span className="text-lg">🏋️</span>
                </div>
                <div>
                  <h4 className="font-semibold">Bench Press</h4>
                  <p className="text-sm text-muted-foreground">{t('timeline.exerciseHistory')}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4 relative">
                {/* Vertical line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />

                {timelineWeeks.map((item, index) => (
                  <motion.div
                    key={item.week}
                    className="flex items-center gap-4 relative"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.15 }}
                  >
                    {/* Dot */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                      item.plateau
                        ? 'bg-amber-100 dark:bg-amber-900/50 border-2 border-amber-500'
                        : item.progress
                          ? 'bg-green-100 dark:bg-green-900/50 border-2 border-green-500'
                          : 'bg-muted border-2 border-border'
                    }`}>
                      {item.plateau ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <span className="text-sm font-medium">{item.week}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{t(`timeline.${item.label}`)}</span>
                        {item.progress && !item.plateau && (
                          <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                            +2.5kg
                          </span>
                        )}
                        {item.plateau && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                            {t('timeline.plateauAlert')}
                          </span>
                        )}
                      </div>
                      {item.plateau && (
                        <p className="text-sm text-muted-foreground mt-1">
                          100kg × 8 reps → 100kg × 8 reps
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* AI Suggestion */}
              <motion.div
                className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                      {t('timeline.suggestion')}
                    </p>
                    <p className="text-xs text-primary-600/70 dark:text-primary-400/70 mt-1">
                      {t('timeline.suggestionReason')}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Features */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold mb-6">{t('featuresTitle')}</h3>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.key}
                  className="flex items-start gap-4 p-4 rounded-lg bg-background border border-border"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{t(`features.${feature.key}.title`)}</h4>
                    <p className="text-sm text-muted-foreground">{t(`features.${feature.key}.description`)}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <motion.div
              className="mt-8 grid grid-cols-2 gap-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">4+</div>
                <div className="text-xs text-muted-foreground">{t('stats.weeksThreshold')}</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">Auto</div>
                <div className="text-xs text-muted-foreground">{t('stats.detection')}</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
