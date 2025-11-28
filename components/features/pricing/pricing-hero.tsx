'use client';

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTranslations } from 'next-intl';

export function PricingHero() {
  const t = useTranslations('pricing.hero');

  return (
    <section className="relative py-24 px-4 bg-geometric-pattern">
      <div className="container max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            {t('badge')}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {t('title')}
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            {t('subtitle')}
          </p>

          {/* Price highlight */}
          <div className="inline-flex items-baseline gap-2 mb-4">
            <span className="text-5xl md:text-6xl font-bold text-primary-600 dark:text-primary-400">
              €6
            </span>
            <span className="text-xl text-muted-foreground">
              {t('perMonth')}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('annualNote')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
