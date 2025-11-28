'use client';

import { motion } from "framer-motion";
import {
  Bot,
  Zap,
  Layers,
  Code,
  Brain,
  AlertTriangle,
  Search,
  Gauge,
  TrendingUp
} from "lucide-react";
import { useTranslations } from 'next-intl';

interface SpecCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  delay: number;
}

function SpecCard({ icon, value, label, delay }: SpecCardProps) {
  return (
    <motion.div
      className="p-4 rounded-xl bg-background border border-border hover:border-primary-300 dark:hover:border-primary-700 transition-colors text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="w-10 h-10 mx-auto rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-3">
        {icon}
      </div>
      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
        {value}
      </div>
      <div className="text-sm text-muted-foreground">
        {label}
      </div>
    </motion.div>
  );
}

export function TechnicalSpecs() {
  const t = useTranslations('features.technicalSpecs');

  const specs = [
    { icon: <Bot className="w-5 h-5" />, value: '19', labelKey: 'aiAgents' },
    { icon: <Zap className="w-5 h-5" />, value: '<500ms', labelKey: 'progressionSpeed' },
    { icon: <Layers className="w-5 h-5" />, value: '7', labelKey: 'contextLevels' },
    { icon: <Code className="w-5 h-5" />, value: '362+', labelKey: 'kubaConfig' },
    { icon: <Code className="w-5 h-5" />, value: '532+', labelKey: 'mentzerConfig' },
    { icon: <Brain className="w-5 h-5" />, value: 'MEV/MAV/MRV', labelKey: 'volumeTracking' },
    { icon: <AlertTriangle className="w-5 h-5" />, value: '3', labelKey: 'deloadTriggers' },
    { icon: <Search className="w-5 h-5" />, value: '4', labelKey: 'patternTypes' },
    { icon: <Gauge className="w-5 h-5" />, value: '0.5-1.0', labelKey: 'confidenceScore' },
    { icon: <TrendingUp className="w-5 h-5" />, value: 'Multi-cycle', labelKey: 'trendAnalysis' },
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

        {/* Specs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {specs.map((spec, index) => (
            <SpecCard
              key={spec.labelKey}
              icon={spec.icon}
              value={spec.value}
              label={t(`specs.${spec.labelKey}`)}
              delay={index * 0.05}
            />
          ))}
        </div>

        {/* Quotable Block */}
        <motion.div
          className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-900/10 border border-primary-200 dark:border-primary-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-xl font-bold mb-6 text-center">{t('quotableTitle')}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              t('quotable.agents'),
              t('quotable.progression'),
              t('quotable.context'),
              t('quotable.kuba'),
              t('quotable.mentzer'),
              t('quotable.volume'),
              t('quotable.deload'),
              t('quotable.patterns'),
              t('quotable.confidence'),
              t('quotable.multicycle'),
            ].map((quote, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/80 border border-border"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
              >
                <span className="text-primary-600 dark:text-primary-400 font-mono text-lg">
                  "
                </span>
                <span className="text-sm font-medium">{quote}</span>
                <span className="text-primary-600 dark:text-primary-400 font-mono text-lg">
                  "
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
