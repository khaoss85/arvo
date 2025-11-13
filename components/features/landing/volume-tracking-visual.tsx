'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BarChart3, AlertTriangle, TrendingDown } from "lucide-react";
import { useTranslations } from 'next-intl';

export function VolumeTrackingVisual() {
  const t = useTranslations('landing.volumeTracking');

  const muscleGroups = [
    { name: t('muscles.chest'), current: 16, mev: 10, mav: 18, mrv: 22, status: "optimal" },
    { name: t('muscles.back'), current: 19, mev: 12, mav: 20, mrv: 25, status: "optimal" },
    { name: t('muscles.quads'), current: 14, mev: 10, mav: 16, mrv: 20, status: "optimal" },
    { name: t('muscles.shoulders'), current: 21, mev: 12, mav: 20, mrv: 24, status: "pushing" },
  ];

  const deloadTriggers = [
    {
      trigger: t('deloadTriggers.noProgress.trigger'),
      example: t('deloadTriggers.noProgress.example'),
      action: t('deloadTriggers.noProgress.action'),
    },
    {
      trigger: t('deloadTriggers.lowReadiness.trigger'),
      example: t('deloadTriggers.lowReadiness.example'),
      action: t('deloadTriggers.lowReadiness.action'),
    },
    {
      trigger: t('deloadTriggers.exceedMrv.trigger'),
      example: t('deloadTriggers.exceedMrv.example'),
      action: t('deloadTriggers.exceedMrv.action'),
    },
  ];

  const getVolumePercentage = (current: number, mev: number, mrv: number) => {
    return ((current - mev) / (mrv - mev)) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "bg-green-500";
      case "pushing":
        return "bg-orange-500";
      case "overtraining":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <section className="py-24 px-4 bg-background">
      <div className="container max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t('title.part1')}{" "}
            <span className="text-primary-600 dark:text-primary-400">{t('title.part2')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Volume Tracking Cards */}
        <motion.div
          className="grid md:grid-cols-2 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {muscleGroups.map((muscle, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{muscle.name}</CardTitle>
                    <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {muscle.current}/{muscle.mav} sets
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="h-8 bg-muted rounded-md overflow-hidden">
                      {/* MEV to MAV (Optimal zone) */}
                      <div
                        className="h-full bg-green-100 dark:bg-green-950/30 absolute"
                        style={{
                          left: `${((muscle.mev / muscle.mrv) * 100).toFixed(1)}%`,
                          width: `${(((muscle.mav - muscle.mev) / muscle.mrv) * 100).toFixed(1)}%`,
                        }}
                      />
                      {/* MAV to MRV (Pushing zone) */}
                      <div
                        className="h-full bg-orange-100 dark:bg-orange-950/30 absolute"
                        style={{
                          left: `${((muscle.mav / muscle.mrv) * 100).toFixed(1)}%`,
                          width: `${(((muscle.mrv - muscle.mav) / muscle.mrv) * 100).toFixed(1)}%`,
                        }}
                      />
                      {/* Current volume marker */}
                      <div
                        className={`h-full ${getStatusColor(muscle.status)} absolute transition-all duration-500`}
                        style={{
                          width: `${((muscle.current / muscle.mrv) * 100).toFixed(1)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <div className="flex flex-col items-start">
                      <span>MEV</span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">{muscle.mev}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span>MAV</span>
                      <span className="text-primary-600 dark:text-primary-400 font-semibold">{muscle.mav}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span>MRV</span>
                      <span className="text-orange-600 dark:text-orange-400 font-semibold">{muscle.mrv}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className={`text-xs p-2 rounded ${
                    muscle.status === "optimal"
                      ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                      : "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300"
                  }`}>
                    {muscle.status === "optimal" && t('status.optimal')}
                    {muscle.status === "pushing" && t('status.pushing')}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Deload Triggers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="border-2 border-orange-200 dark:border-orange-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                {t('deloadCard.title')}
              </CardTitle>
              <CardDescription>
                {t('deloadCard.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deloadTriggers.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-md">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="font-semibold text-sm">{item.trigger}</div>
                      <div className="text-xs text-muted-foreground">
                        Example: {item.example}
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        → {item.action}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-950/40 rounded-md text-sm border border-orange-300 dark:border-orange-800">
                <p className="text-orange-900 dark:text-orange-200">
                  <strong>{t('intelligentPrevention.title')}</strong> {t('intelligentPrevention.description')}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comparison Note */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="inline-block bg-background border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4 max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{t('comparisonNote.bold')}</span> {t('comparisonNote.text')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
