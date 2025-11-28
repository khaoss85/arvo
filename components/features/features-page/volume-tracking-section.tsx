'use client';

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Activity,
  Target,
  Gauge,
  ArrowRight
} from "lucide-react";
import { useTranslations } from 'next-intl';

export function VolumeTrackingSection() {
  const t = useTranslations('features.volumeTracking');

  const volumeLandmarks = [
    {
      key: 'mev',
      label: 'MEV',
      fullName: 'Minimum Effective Volume',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      icon: <TrendingUp className="w-5 h-5" />,
      position: '20%',
    },
    {
      key: 'mav',
      label: 'MAV',
      fullName: 'Maximum Adaptive Volume',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
      icon: <Target className="w-5 h-5" />,
      position: '50%',
    },
    {
      key: 'mrv',
      label: 'MRV',
      fullName: 'Maximum Recoverable Volume',
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      icon: <AlertTriangle className="w-5 h-5" />,
      position: '80%',
    },
  ];

  const deloadTriggers = [
    { icon: <TrendingDown className="w-5 h-5" />, key: 'performance' },
    { icon: <Activity className="w-5 h-5" />, key: 'fatigue' },
    { icon: <Gauge className="w-5 h-5" />, key: 'volume' },
  ];

  return (
    <section className="py-24 px-4">
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
          {/* Left: Volume Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-muted/50 rounded-2xl p-6 border border-border">
              {/* Volume Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t('volumeLabel')}</span>
                  <span className="text-sm text-muted-foreground">Chest - Week 3</span>
                </div>

                {/* Visual bar */}
                <div className="relative h-12 rounded-lg bg-gradient-to-r from-green-200 via-blue-200 to-red-200 dark:from-green-900/50 dark:via-blue-900/50 dark:to-red-900/50 overflow-hidden">
                  {/* Current volume indicator */}
                  <motion.div
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-green-500 via-blue-500 to-blue-400 rounded-lg"
                    initial={{ width: '0%' }}
                    whileInView={{ width: '55%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />

                  {/* Landmarks */}
                  {volumeLandmarks.map((landmark) => (
                    <div
                      key={landmark.key}
                      className="absolute top-0 bottom-0 w-0.5 bg-background"
                      style={{ left: landmark.position }}
                    >
                      <div className={`absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold ${landmark.textColor}`}>
                        {landmark.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Current value */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold">14 sets</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">MAV: 16 sets</span>
                </div>
              </div>

              {/* Landmark Cards */}
              <div className="grid grid-cols-3 gap-3">
                {volumeLandmarks.map((landmark, index) => (
                  <motion.div
                    key={landmark.key}
                    className={`p-3 rounded-lg ${landmark.bgColor} text-center`}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  >
                    <div className={`text-lg font-bold ${landmark.textColor}`}>
                      {landmark.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t(`landmarks.${landmark.key}.short`)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Explanation */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold mb-6">{t('landmarksTitle')}</h3>

            <div className="space-y-4 mb-8">
              {volumeLandmarks.map((landmark, index) => (
                <motion.div
                  key={landmark.key}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${landmark.color} flex items-center justify-center text-white shrink-0`}>
                    {landmark.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">
                      {landmark.label} - {landmark.fullName}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t(`landmarks.${landmark.key}.description`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Deload Triggers */}
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                {t('deloadTitle')}
              </h4>
              <div className="space-y-2">
                {deloadTriggers.map((trigger, index) => (
                  <div key={trigger.key} className="flex items-center gap-2 text-sm">
                    <span className="text-amber-600 dark:text-amber-400">{trigger.icon}</span>
                    <span>{t(`deloadTriggers.${trigger.key}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Auto-calculation badge */}
        <motion.div
          className="mt-12 flex justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800 text-sm">
            <BarChart3 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span>{t('autoCalculation')}</span>
            <ArrowRight className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-primary-600 dark:text-primary-400">{t('perMuscle')}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
