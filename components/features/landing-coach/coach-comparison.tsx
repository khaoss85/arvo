'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { X, Check, ArrowRight } from "lucide-react";
import { useTranslations } from 'next-intl';

export function CoachComparison() {
  const t = useTranslations('landing.forTrainers.comparison');

  const items = [
    { key: 'programming' },
    { key: 'delivery' },
    { key: 'tracking' },
    { key: 'progress' },
    { key: 'time' },
    { key: 'weekends' },
  ];

  return (
    <section className="py-24 px-4">
      <div className="container max-w-4xl mx-auto">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <div className="grid grid-cols-3 bg-muted/50 border-b">
                <div className="p-4 font-semibold text-sm text-muted-foreground">Category</div>
                <div className="p-4 font-semibold text-sm text-center text-red-600 dark:text-red-400 border-x">Old Way</div>
                <div className="p-4 font-semibold text-sm text-center text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/20">With Arvo</div>
              </div>

              {/* Rows */}
              {items.map((item, index) => (
                <div
                  key={item.key}
                  className={`grid grid-cols-3 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'} ${index < items.length - 1 ? 'border-b' : ''}`}
                >
                  <div className="p-4 font-medium text-sm flex items-center">
                    {t(`items.${item.key}.category`)}
                  </div>
                  <div className="p-4 text-sm text-center border-x flex items-center justify-center gap-2">
                    <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{t(`items.${item.key}.old`)}</span>
                  </div>
                  <div className="p-4 text-sm text-center bg-primary-50/50 dark:bg-primary-900/20 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    <span className="font-medium text-primary-700 dark:text-primary-300">{t(`items.${item.key}.new`)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Highlight */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/50 dark:to-primary-900/20 rounded-full border border-primary-200 dark:border-primary-800">
            <span className="text-sm font-medium">Transform your coaching workflow</span>
            <ArrowRight className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
