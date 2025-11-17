'use client';

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { useTranslations } from 'next-intl';

export function ProblemSolution() {
  const t = useTranslations('landingPro.problemSolution');

  return (
    <section className="py-24 px-4 bg-background">
      <div className="container max-w-6xl mx-auto">
        {/* Problem Statement */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t('problem.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('problem.description')}
          </p>
        </motion.div>

        {/* Pain Points Grid */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">{t('painPoints.excel.title')}</h3>
                <p className="text-sm text-red-800 dark:text-red-200">{t('painPoints.excel.description')}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">{t('painPoints.genericApps.title')}</h3>
                <p className="text-sm text-red-800 dark:text-red-200">{t('painPoints.genericApps.description')}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">{t('painPoints.coaches.title')}</h3>
                <p className="text-sm text-red-800 dark:text-red-200">{t('painPoints.coaches.description')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Solution Statement */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('solution.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('solution.description')}
          </p>
        </motion.div>

        {/* Solution Pillars */}
        <motion.div
          className="grid md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">{t('pillars.methodology.title')}</h3>
                <p className="text-sm text-green-800 dark:text-green-200">{t('pillars.methodology.description')}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">{t('pillars.intelligence.title')}</h3>
                <p className="text-sm text-green-800 dark:text-green-200">{t('pillars.intelligence.description')}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">{t('pillars.learning.title')}</h3>
                <p className="text-sm text-green-800 dark:text-green-200">{t('pillars.learning.description')}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
