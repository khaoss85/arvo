'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Smartphone, Monitor, Gauge, Check } from "lucide-react";
import { useTranslations } from 'next-intl';

export function InterfaceModesSection() {
  const t = useTranslations('landing.forTrainers.interfaceModes');

  const modes = [
    {
      icon: Smartphone,
      title: t('modes.simple.title'),
      subtitle: t('modes.simple.subtitle'),
      description: t('modes.simple.description'),
      features: [
        t('modes.simple.features.feature1'),
        t('modes.simple.features.feature2'),
        t('modes.simple.features.feature3'),
        t('modes.simple.features.feature4'),
      ],
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      icon: Monitor,
      title: t('modes.coach.title'),
      subtitle: t('modes.coach.subtitle'),
      description: t('modes.coach.description'),
      features: [
        t('modes.coach.features.feature1'),
        t('modes.coach.features.feature2'),
        t('modes.coach.features.feature3'),
        t('modes.coach.features.feature4'),
      ],
      color: "from-primary-500 to-primary-600",
      bgColor: "bg-primary-50 dark:bg-primary-900/20",
      borderColor: "border-primary-200 dark:border-primary-800",
      highlighted: true,
    },
    {
      icon: Gauge,
      title: t('modes.advanced.title'),
      subtitle: t('modes.advanced.subtitle'),
      description: t('modes.advanced.description'),
      features: [
        t('modes.advanced.features.feature1'),
        t('modes.advanced.features.feature2'),
        t('modes.advanced.features.feature3'),
        t('modes.advanced.features.feature4'),
      ],
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
  ];

  return (
    <section className="py-24 px-4 bg-muted/30">
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

        <div className="grid md:grid-cols-3 gap-6">
          {modes.map((mode, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={mode.highlighted ? "md:-mt-4 md:mb-4" : ""}
            >
              <Card className={`h-full ${mode.bgColor} ${mode.borderColor} ${mode.highlighted ? 'border-2 shadow-lg' : ''}`}>
                <CardHeader className="text-center pb-2">
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <mode.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{mode.title}</CardTitle>
                  <span className="inline-block mx-auto mt-2 px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                    {mode.subtitle}
                  </span>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-muted-foreground text-sm text-center mb-6">
                    {mode.description}
                  </p>
                  <ul className="space-y-3">
                    {mode.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
