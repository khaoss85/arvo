'use client';

import { motion } from "framer-motion";
import { Sparkles, Zap, Brain, Target, Clock, Dumbbell } from "lucide-react";
import { useTranslations } from 'next-intl';

interface ModeCardProps {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  forWho: string;
  icon: React.ReactNode;
  highlighted?: boolean;
  delay: number;
}

function ModeCard({
  title,
  subtitle,
  description,
  features,
  forWho,
  icon,
  highlighted = false,
  delay,
}: ModeCardProps) {
  return (
    <motion.div
      className={`relative p-8 rounded-2xl border ${
        highlighted
          ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
          : 'border-border bg-background'
      }`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      {/* Icon */}
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
        highlighted
          ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
          : 'bg-muted text-muted-foreground'
      }`}>
        {icon}
      </div>

      {/* Header */}
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className={`text-sm font-medium mb-4 ${
        highlighted ? 'text-primary-600 dark:text-primary-400' : 'text-muted-foreground'
      }`}>
        {subtitle}
      </p>
      <p className="text-muted-foreground mb-6">{description}</p>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              highlighted
                ? 'bg-primary-100 dark:bg-primary-900/50'
                : 'bg-muted'
            }`}>
              <Zap className={`w-3 h-3 ${
                highlighted
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-muted-foreground'
              }`} />
            </div>
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* For Who */}
      <div className={`pt-6 border-t ${
        highlighted ? 'border-primary-200 dark:border-primary-800' : 'border-border'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Best for: </span>
          <span className="text-muted-foreground">{forWho}</span>
        </p>
      </div>
    </motion.div>
  );
}

export function TrainingModes() {
  const t = useTranslations('pricing.modes');

  const modes = [
    {
      title: t('simple.title'),
      subtitle: t('simple.subtitle'),
      description: t('simple.description'),
      features: [
        t('simple.features.zeroDecisions'),
        t('simple.features.aiHandles'),
        t('simple.features.showUp'),
        t('simple.features.autoProgress'),
      ],
      forWho: t('simple.forWho'),
      icon: <Sparkles className="w-7 h-7" />,
      highlighted: false,
      delay: 0,
    },
    {
      title: t('pro.title'),
      subtitle: t('pro.subtitle'),
      description: t('pro.description'),
      features: [
        t('pro.features.rirRpe'),
        t('pro.features.methodology'),
        t('pro.features.customization'),
        t('pro.features.volumeControl'),
      ],
      forWho: t('pro.forWho'),
      icon: <Brain className="w-7 h-7" />,
      highlighted: true,
      delay: 0.1,
    },
  ];

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-5xl mx-auto">
        {/* Section Title */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Modes Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {modes.map((mode) => (
            <ModeCard key={mode.title} {...mode} />
          ))}
        </div>

        {/* Note */}
        <motion.p
          className="text-center text-sm text-muted-foreground mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {t('switchNote')}
        </motion.p>
      </div>
    </section>
  );
}
