'use client';

import { motion } from "framer-motion";
import { Flame, Target, Zap, TrendingUp, Layers, RefreshCw, BarChart3, Activity } from "lucide-react";
import { useTranslations } from 'next-intl';

interface MethodologyCardProps {
  name: string;
  description: string;
  configLines: string;
  icon: React.ReactNode;
  color: string;
  delay: number;
}

function MethodologyCard({
  name,
  description,
  configLines,
  icon,
  color,
  delay,
}: MethodologyCardProps) {
  return (
    <motion.div
      className="p-6 rounded-xl border border-border bg-background hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground mb-2">{description}</p>
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground">
            {configLines}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function MethodologyList() {
  const t = useTranslations('pricing.methodologies');

  const methodologies = [
    {
      name: 'Kuba Method',
      description: t('kuba.description'),
      configLines: t('kuba.lines'),
      icon: <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      color: 'bg-blue-100 dark:bg-blue-900/50',
    },
    {
      name: 'Mentzer HIT',
      description: t('mentzer.description'),
      configLines: t('mentzer.lines'),
      icon: <Flame className="w-6 h-6 text-red-600 dark:text-red-400" />,
      color: 'bg-red-100 dark:bg-red-900/50',
    },
    {
      name: 'FST-7',
      description: t('fst7.description'),
      configLines: t('fst7.lines'),
      icon: <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />,
      color: 'bg-yellow-100 dark:bg-yellow-900/50',
    },
    {
      name: 'Y3T',
      description: t('y3t.description'),
      configLines: t('y3t.lines'),
      icon: <RefreshCw className="w-6 h-6 text-green-600 dark:text-green-400" />,
      color: 'bg-green-100 dark:bg-green-900/50',
    },
    {
      name: 'Mountain Dog',
      description: t('mountainDog.description'),
      configLines: t('mountainDog.lines'),
      icon: <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      color: 'bg-purple-100 dark:bg-purple-900/50',
    },
    {
      name: 'Doggcrapp (DC)',
      description: t('dc.description'),
      configLines: t('dc.lines'),
      icon: <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
      color: 'bg-orange-100 dark:bg-orange-900/50',
    },
    {
      name: 'PHAT',
      description: t('phat.description'),
      configLines: t('phat.lines'),
      icon: <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      color: 'bg-indigo-100 dark:bg-indigo-900/50',
    },
    {
      name: 'HST',
      description: t('hst.description'),
      configLines: t('hst.lines'),
      icon: <BarChart3 className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
      color: 'bg-teal-100 dark:bg-teal-900/50',
    },
  ];

  return (
    <section className="py-24 px-4">
      <div className="container max-w-6xl mx-auto">
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

        {/* Methodologies Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {methodologies.map((methodology, index) => (
            <MethodologyCard
              key={methodology.name}
              {...methodology}
              delay={index * 0.05}
            />
          ))}
        </div>

        {/* Pro Feature Note */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-sm text-muted-foreground">
            {t('proNote')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
