'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Brain, BarChart3, UserCheck, Settings2, User, Sparkles, Eye, Send, PersonStanding } from "lucide-react";
import { useTranslations } from 'next-intl';

export function AIGenerationShowcase() {
  const t = useTranslations('landing.forTrainers.aiGeneration');

  const features = [
    {
      icon: Brain,
      title: t('features.methodologies.title'),
      description: t('features.methodologies.description'),
    },
    {
      icon: PersonStanding,
      title: t('features.bodyType.title'),
      description: t('features.bodyType.description'),
    },
    {
      icon: BarChart3,
      title: t('features.volume.title'),
      description: t('features.volume.description'),
    },
    {
      icon: UserCheck,
      title: t('features.humanLoop.title'),
      description: t('features.humanLoop.description'),
    },
    {
      icon: Settings2,
      title: t('features.personalization.title'),
      description: t('features.personalization.description'),
    },
  ];

  const processSteps = [
    { icon: User, title: t('process.step1.title'), description: t('process.step1.description') },
    { icon: Sparkles, title: t('process.step2.title'), description: t('process.step2.description') },
    { icon: Eye, title: t('process.step3.title'), description: t('process.step3.description') },
    { icon: Send, title: t('process.step4.title'), description: t('process.step4.description') },
  ];

  return (
    <section className="py-24 px-4">
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
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2 max-w-2xl mx-auto">
            {t('description')}
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Process Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-950/50 dark:to-primary-900/20 border-primary-200 dark:border-primary-800">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {processSteps.map((step, index) => (
                  <div key={index} className="relative text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center mb-4 shadow-lg">
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <span className="absolute -top-2 -right-2 md:right-auto md:-top-1 md:-left-1 w-6 h-6 rounded-full bg-background border-2 border-primary-600 flex items-center justify-center text-xs font-bold text-primary-600">
                        {index + 1}
                      </span>
                      <h4 className="font-semibold mb-1">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {index < processSteps.length - 1 && (
                      <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-primary-300 dark:bg-primary-700" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
