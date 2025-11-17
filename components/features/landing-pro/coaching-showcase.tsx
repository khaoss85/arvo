'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Target, TrendingUp, Activity, BarChart3 } from "lucide-react";
import { useTranslations } from 'next-intl';

export function CoachingShowcase() {
  const t = useTranslations('landingPro.coachingShowcase');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section id="coaching-showcase" className="py-24 px-4 bg-muted/30">
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

        <motion.div
          className="grid md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Weak Point Targeting */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      {t('weakPointTargeting.title')}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {t('weakPointTargeting.description')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div className="text-sm font-medium text-foreground">
                    {t('weakPointTargeting.scenario.situation')}
                  </div>
                  <div className="text-sm text-muted-foreground pl-4 border-l-2 border-primary-400">
                    {t('weakPointTargeting.scenario.response')}
                  </div>
                </div>

                <div className="bg-primary-50 dark:bg-primary-900/50 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
                  <div className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-2">
                    {t('weakPointTargeting.result.title')}
                  </div>
                  <div className="text-sm text-primary-900 dark:text-primary-50">
                    {t('weakPointTargeting.result.description')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Progressive Overload Automated */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      {t('progressiveOverload.title')}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {t('progressiveOverload.description')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div className="text-sm font-medium text-foreground">
                    {t('progressiveOverload.scenario.situation')}
                  </div>
                  <div className="text-sm text-muted-foreground pl-4 border-l-2 border-green-400">
                    {t('progressiveOverload.scenario.response')}
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div className="text-sm font-medium text-foreground">
                    {t('progressiveOverload.alternative.situation')}
                  </div>
                  <div className="text-sm text-muted-foreground pl-4 border-l-2 border-orange-400">
                    {t('progressiveOverload.alternative.response')}
                  </div>
                </div>

                <div className="bg-primary-50 dark:bg-primary-900/50 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
                  <div className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-2">
                    {t('progressiveOverload.result.title')}
                  </div>
                  <div className="text-sm text-primary-900 dark:text-primary-50">
                    {t('progressiveOverload.result.description')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Set-by-Set Adaptation */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      {t('setAdaptation.title')}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {t('setAdaptation.description')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div className="text-sm font-medium text-foreground">
                    {t('setAdaptation.scenario.situation')}
                  </div>
                  <div className="text-sm text-muted-foreground pl-4 border-l-2 border-orange-400">
                    {t('setAdaptation.scenario.response')}
                  </div>
                </div>

                <div className="bg-primary-50 dark:bg-primary-900/50 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
                  <div className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-2">
                    {t('setAdaptation.result.title')}
                  </div>
                  <div className="text-sm text-primary-900 dark:text-primary-50">
                    {t('setAdaptation.result.description')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Season-to-Season Evolution */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      {t('cycleEvolution.title')}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {t('cycleEvolution.description')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div className="text-sm font-medium text-foreground">
                    {t('cycleEvolution.scenario.situation')}
                  </div>
                  <div className="text-sm text-muted-foreground pl-4 border-l-2 border-red-400">
                    {t('cycleEvolution.scenario.response')}
                  </div>
                </div>

                <div className="bg-primary-50 dark:bg-primary-900/50 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
                  <div className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-2">
                    {t('cycleEvolution.result.title')}
                  </div>
                  <div className="text-sm text-primary-900 dark:text-primary-50">
                    {t('cycleEvolution.result.description')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          className="mt-12 p-6 bg-muted rounded-lg border border-border"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-semibold text-foreground">{t('footer.bold')}</span> {t('footer.text')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
