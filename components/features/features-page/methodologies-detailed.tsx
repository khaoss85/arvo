'use client';

import { motion } from "framer-motion";
import {
  Flame,
  Zap,
  Target,
  Dumbbell,
  Mountain,
  Repeat,
  TrendingUp,
  Brain,
  CheckCircle2,
  Code
} from "lucide-react";
import { useTranslations } from 'next-intl';

interface MethodologyCardProps {
  icon: React.ReactNode;
  name: string;
  author: string;
  description: string;
  features: string[];
  configLines: number;
  delay: number;
  color: string;
}

function MethodologyCard({
  icon,
  name,
  author,
  description,
  features,
  configLines,
  delay,
  color
}: MethodologyCardProps) {
  return (
    <motion.div
      className="relative p-6 rounded-xl bg-background border border-border hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      {/* Config badge */}
      {configLines > 0 && (
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
          <Code className="w-3 h-3" />
          {configLines}+ lines
        </div>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>

      {/* Name and Author */}
      <h3 className="text-xl font-bold mb-1">{name}</h3>
      <p className="text-sm text-muted-foreground mb-3">{author}</p>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      {/* Features */}
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function MethodologiesDetailed() {
  const t = useTranslations('features.methodologies');

  const methodologies = [
    {
      icon: <Target className="w-6 h-6" />,
      name: 'Kuba Method',
      author: 'Kuba Cielen',
      translationKey: 'kuba',
      configLines: 362,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Flame className="w-6 h-6" />,
      name: 'Heavy Duty / HIT',
      author: 'Mike Mentzer',
      translationKey: 'mentzer',
      configLines: 532,
      color: 'from-red-500 to-orange-500',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      name: 'FST-7',
      author: 'Hany Rambod',
      translationKey: 'fst7',
      configLines: 0,
      color: 'from-amber-500 to-yellow-500',
    },
    {
      icon: <Repeat className="w-6 h-6" />,
      name: 'Y3T',
      author: 'Neil Hill',
      translationKey: 'y3t',
      configLines: 0,
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Mountain className="w-6 h-6" />,
      name: 'Mountain Dog',
      author: 'John Meadows',
      translationKey: 'mountainDog',
      configLines: 0,
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Dumbbell className="w-6 h-6" />,
      name: 'DC Training',
      author: 'Dante Trudel',
      translationKey: 'dc',
      configLines: 0,
      color: 'from-slate-600 to-slate-800',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      name: 'PHAT',
      author: 'Layne Norton',
      translationKey: 'phat',
      configLines: 0,
      color: 'from-indigo-500 to-violet-500',
    },
    {
      icon: <Brain className="w-6 h-6" />,
      name: 'HST',
      author: 'Bryan Haycock',
      translationKey: 'hst',
      configLines: 0,
      color: 'from-teal-500 to-cyan-500',
    },
  ];

  return (
    <section className="py-24 px-4 bg-muted/30">
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

        {/* Methodologies Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {methodologies.map((method, index) => (
            <MethodologyCard
              key={method.name}
              icon={method.icon}
              name={method.name}
              author={method.author}
              description={t(`methods.${method.translationKey}.description`)}
              features={[
                t(`methods.${method.translationKey}.feature1`),
                t(`methods.${method.translationKey}.feature2`),
                t(`methods.${method.translationKey}.feature3`),
              ]}
              configLines={method.configLines}
              delay={index * 0.05}
              color={method.color}
            />
          ))}
        </div>

        {/* Scientific Fidelity Note */}
        <motion.div
          className="mt-16 p-6 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">{t('fidelityTitle')}</h3>
              <p className="text-muted-foreground">{t('fidelityDescription')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
