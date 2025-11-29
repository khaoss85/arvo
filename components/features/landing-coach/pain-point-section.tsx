'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { X, Check, Clock, AlertTriangle, Zap, Smile, Calendar } from "lucide-react";
import { useTranslations } from 'next-intl';

export function PainPointSection() {
  const t = useTranslations('landing.forTrainers.painPoint');

  const oldWaySteps = [
    { icon: Calendar, text: t('oldWay.friday'), day: "Fri" },
    { icon: Clock, text: t('oldWay.saturday'), day: "Sat" },
    { icon: AlertTriangle, text: t('oldWay.sunday'), day: "Sun" },
    { icon: X, text: t('oldWay.monday'), day: "Mon" },
  ];

  const newWaySteps = [
    { icon: Zap, text: t('newWay.step1') },
    { icon: Check, text: t('newWay.step2') },
    { icon: Smile, text: t('newWay.step3') },
  ];

  return (
    <section id="pain-point" className="py-24 px-4 bg-muted/30">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Old Way */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <X className="w-6 h-6 text-red-500" />
                  <h3 className="text-xl font-bold text-red-700 dark:text-red-400">{t('oldWay.title')}</h3>
                </div>

                <div className="space-y-4 mb-6">
                  {oldWaySteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">{step.day}</span>
                      </div>
                      <div className="flex-1 pt-3">
                        <p className="text-muted-foreground">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-red-200 dark:border-red-900/50">
                  <p className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {t('oldWay.result')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* New Way with Arvo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="h-full border-primary-200 dark:border-primary-900/50 bg-primary-50/50 dark:bg-primary-950/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Check className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-xl font-bold text-primary-700 dark:text-primary-400">{t('newWay.title')}</h3>
                </div>

                <div className="space-y-4 mb-6">
                  {newWaySteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 pt-3">
                        <p className="text-foreground font-medium">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-primary-200 dark:border-primary-900/50">
                  <p className="text-primary-600 dark:text-primary-400 font-semibold flex items-center gap-2">
                    <Smile className="w-4 h-4" />
                    {t('newWay.result')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Comparison Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-background">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Time per Client</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-red-500 line-through text-sm">{t('comparison.time.old')}</span>
                <span className="text-primary-600 dark:text-primary-400 font-bold">{t('comparison.time.new')}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Delivery</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-red-500 line-through text-sm">{t('comparison.delivery.old')}</span>
                <span className="text-primary-600 dark:text-primary-400 font-bold">{t('comparison.delivery.new')}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Tracking</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-red-500 line-through text-sm">{t('comparison.tracking.old')}</span>
                <span className="text-primary-600 dark:text-primary-400 font-bold">{t('comparison.tracking.new')}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
