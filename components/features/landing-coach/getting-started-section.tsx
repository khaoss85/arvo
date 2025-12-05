'use client';

import { motion } from "framer-motion";
import { UserPlus, Sparkles, Dumbbell } from "lucide-react";
import { useTranslations } from 'next-intl';

export function GettingStartedSection() {
  const t = useTranslations('landing.forTrainers.gettingStarted');

  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title: t('steps.invite.title'),
      description: t('steps.invite.description'),
    },
    {
      number: 2,
      icon: Sparkles,
      title: t('steps.generate.title'),
      description: t('steps.generate.description'),
    },
    {
      number: 3,
      icon: Dumbbell,
      title: t('steps.train.title'),
      description: t('steps.train.description'),
    },
  ];

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-5xl mx-auto">
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

        <div className="relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-primary-200 dark:bg-primary-800" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="relative text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                {/* Step circle with icon */}
                <div className="relative inline-flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center mb-6 shadow-lg relative z-10">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  {/* Step number badge */}
                  <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-background border-2 border-primary-600 flex items-center justify-center text-sm font-bold text-primary-600 z-20">
                    {step.number}
                  </span>
                </div>

                {/* Step content */}
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
