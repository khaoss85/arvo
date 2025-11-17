'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useTranslations } from 'next-intl';

export function AutoProgression() {
  const t = useTranslations('landingSimple.autoProgression');

  return (
    <section className="py-24 px-4">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t('title.part1')} <span className="text-primary-600 dark:text-primary-400">{t('title.part2')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-8 items-center"
        >
          <Card className="border-2">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-primary-50 dark:bg-primary-900/50 rounded-lg">
                  <div className="text-3xl font-bold text-primary-700 dark:text-primary-200">1</div>
                  <div className="flex-1">
                    <div className="text-sm text-primary-700 dark:text-primary-200">{t('example.week1')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-primary-100 dark:bg-primary-900/60 rounded-lg">
                  <div className="text-3xl font-bold text-primary-700 dark:text-primary-200">2</div>
                  <div className="flex-1">
                    <div className="text-sm text-primary-700 dark:text-primary-200">{t('example.week2')}</div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-primary-200 dark:bg-primary-900/70 rounded-lg">
                  <div className="text-3xl font-bold text-primary-700 dark:text-primary-200">4</div>
                  <div className="flex-1">
                    <div className="text-sm text-primary-700 dark:text-primary-200">{t('example.week4')}</div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <div className="font-bold text-green-900 dark:text-green-100">{t('example.result')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="p-6 bg-muted rounded-lg">
              <h3 className="font-semibold text-xl mb-2">{t('explanation.what')}</h3>
            </div>
            <div className="p-6 bg-muted rounded-lg">
              <h3 className="font-semibold text-xl mb-2">{t('explanation.why')}</h3>
            </div>
            <div className="p-6 bg-muted rounded-lg">
              <h3 className="font-semibold text-xl mb-2">{t('explanation.how')}</h3>
            </div>
            <div className="text-center p-6 bg-primary-50 dark:bg-primary-900 rounded-lg border border-primary-200 dark:border-primary-700">
              <p className="font-bold text-lg text-primary-900 dark:text-primary-50">{t('cta')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
