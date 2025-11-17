'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Timer, Zap, CheckCircle2 } from "lucide-react";
import { useTranslations } from 'next-intl';

export function SmartRestTimer() {
  const t = useTranslations('landing.smartRestTimer');

  return (
    <section id="smart-rest-timer" className="py-24 px-4 bg-muted/30">
      <div className="container max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t('title.part1')} <span className="text-primary-600 dark:text-primary-400">{t('title.part2')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Timer Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-2 border-primary-300 dark:border-primary-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  {t('timerCard.title')}
                </CardTitle>
                <CardDescription>{t('timerCard.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Timer States Visualization */}
                <div className="space-y-4">
                  {/* Optimal */}
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">
                      45s
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-green-900 dark:text-green-100">{t('timerStates.optimal.label')}</div>
                      <div className="text-xs text-green-700 dark:text-green-300">{t('timerStates.optimal.message')}</div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>

                  {/* Acceptable */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      60s
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-blue-900 dark:text-blue-100">{t('timerStates.acceptable.label')}</div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">{t('timerStates.acceptable.message')}</div>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-800">
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-lg">
                      75s
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-yellow-900 dark:text-yellow-100">{t('timerStates.warning.label')}</div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300">{t('timerStates.warning.message')}</div>
                    </div>
                  </div>

                  {/* Critical */}
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-300 dark:border-red-800">
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-lg">
                      90s
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-red-900 dark:text-red-100">{t('timerStates.critical.label')}</div>
                      <div className="text-xs text-red-700 dark:text-red-300">{t('timerStates.critical.message')}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t text-xs text-muted-foreground text-center">
                  {t('timerCard.contextNote')}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Methodology Comparison */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <Card className="border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  {t('methodologies.title')}
                </CardTitle>
                <CardDescription>{t('methodologies.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* FST-7 */}
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-primary-600 dark:text-primary-400">FST-7</div>
                    <div className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/60 rounded-full text-primary-700 dark:text-primary-50">
                      {t('methodologies.fst7.badge')}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">{t('methodologies.fst7.sets')}:</span>
                      <span className="font-mono font-semibold">30-45s</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">{t('methodologies.fst7.compound')}:</span>
                      <span className="font-mono font-semibold">90-180s</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {t('methodologies.fst7.note')}
                    </div>
                  </div>
                </div>

                {/* Y3T */}
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-primary-600 dark:text-primary-400">Y3T</div>
                    <div className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/60 rounded-full text-primary-700 dark:text-primary-50">
                      {t('methodologies.y3t.badge')}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">{t('methodologies.y3t.compound')}:</span>
                      <span className="font-mono font-semibold">90-240s</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">{t('methodologies.y3t.isolation')}:</span>
                      <span className="font-mono font-semibold">30-120s</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {t('methodologies.y3t.note')}
                    </div>
                  </div>
                </div>

                {/* Mountain Dog */}
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-primary-600 dark:text-primary-400">Mountain Dog</div>
                    <div className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/60 rounded-full text-primary-700 dark:text-primary-50">
                      {t('methodologies.mountainDog.badge')}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">{t('methodologies.mountainDog.activation')}:</span>
                      <span className="font-mono font-semibold">45-60s</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">{t('methodologies.mountainDog.explosive')}:</span>
                      <span className="font-mono font-semibold">180-240s</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">{t('methodologies.mountainDog.pump')}:</span>
                      <span className="font-mono font-semibold">30-60s</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {t('methodologies.mountainDog.note')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparison Note */}
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="text-sm">
                <div className="font-semibold text-orange-900 dark:text-orange-200 mb-2">
                  {t('comparison.title')}
                </div>
                <p className="text-orange-800 dark:text-orange-300 text-xs leading-relaxed mb-2">
                  {t('comparison.genericApps')}
                </p>
                <p className="text-orange-900 dark:text-orange-100 text-xs font-semibold">
                  {t('comparison.arvo')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Footer */}
        <motion.div
          className="mt-12 p-6 bg-primary-50 dark:bg-primary-900 rounded-lg border border-primary-200 dark:border-primary-700"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm text-primary-900 dark:text-primary-50">
              <span className="font-bold">{t('footer.bold')}</span> {t('footer.text')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
