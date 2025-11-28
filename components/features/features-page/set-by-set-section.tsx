'use client';

import { motion } from "framer-motion";
import { Zap, Brain, Clock, TrendingUp, Activity, Target } from "lucide-react";
import { useTranslations } from 'next-intl';

export function SetBySetSection() {
  const t = useTranslations('features.setBySet');

  const factors = [
    { icon: <Target className="w-5 h-5" />, key: 'rir' },
    { icon: <Brain className="w-5 h-5" />, key: 'mentalReadiness' },
    { icon: <TrendingUp className="w-5 h-5" />, key: 'performanceTrend' },
    { icon: <Activity className="w-5 h-5" />, key: 'phase' },
    { icon: <Clock className="w-5 h-5" />, key: 'restTime' },
    { icon: <Zap className="w-5 h-5" />, key: 'fatigueAccumulation' },
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
          {/* Left: Visual Demo */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-muted/50 rounded-2xl p-6 border border-border">
              {/* Set 1 */}
              <div className="mb-4 p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Set 1</span>
                  <span className="text-xs text-green-600 dark:text-green-400">Completed</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold">100kg</div>
                    <div className="text-xs text-muted-foreground">Weight</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">12</div>
                    <div className="text-xs text-muted-foreground">Reps</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">RIR 1</div>
                    <div className="text-xs text-muted-foreground">Effort</div>
                  </div>
                </div>
              </div>

              {/* AI Processing */}
              <div className="flex items-center justify-center my-4">
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/50 rounded-full"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Zap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    {t('processing')}
                  </span>
                </motion.div>
              </div>

              {/* Set 2 Suggestion */}
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Set 2</span>
                  <span className="text-xs text-primary-600 dark:text-primary-400">{t('aiSuggested')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-primary-600 dark:text-primary-400">102.5kg</div>
                    <div className="text-xs text-muted-foreground">+2.5kg</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">8-10</div>
                    <div className="text-xs text-muted-foreground">Target</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">RIR 1-2</div>
                    <div className="text-xs text-muted-foreground">Target</div>
                  </div>
                </div>
              </div>

              {/* Response Time Badge */}
              <div className="mt-4 flex justify-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  {t('responseTime')}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right: Factors */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold mb-6">{t('factorsTitle')}</h3>
            <div className="space-y-4">
              {factors.map((factor, index) => (
                <motion.div
                  key={factor.key}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                    {factor.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{t(`factors.${factor.key}.title`)}</h4>
                    <p className="text-sm text-muted-foreground">{t(`factors.${factor.key}.description`)}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quote */}
            <motion.blockquote
              className="mt-8 pl-4 border-l-4 border-primary-500 italic text-muted-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {t('quote')}
            </motion.blockquote>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
