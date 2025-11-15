'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Droplet, Volume2, Zap, CheckCircle, Clock, Activity } from "lucide-react";
import { useTranslations } from 'next-intl';

export function AICoachingFeatures() {
  const t = useTranslations('landing.aiCoaching');

  const features = [
    {
      icon: Droplet,
      title: t('hydrationReminders.title'),
      description: t('hydrationReminders.description'),
      detail: t('hydrationReminders.detail'),
      badge: t('hydrationReminders.badge'),
      features: [
        t('hydrationReminders.features.acsm'),
        t('hydrationReminders.features.adaptive'),
        t('hydrationReminders.features.smart'),
      ],
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
    },
    {
      icon: Volume2,
      title: t('audioCoaching.title'),
      description: t('audioCoaching.description'),
      detail: t('audioCoaching.detail'),
      badge: t('audioCoaching.badge'),
      features: [
        t('audioCoaching.features.personalized'),
        t('audioCoaching.features.setBySet'),
        t('audioCoaching.features.tts'),
      ],
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-900",
    },
    {
      icon: Zap,
      title: t('quickActions.title'),
      description: t('quickActions.description'),
      detail: t('quickActions.detail'),
      badge: t('quickActions.badge'),
      features: [
        t('quickActions.features.quickAdd'),
        t('quickActions.features.aiValidated'),
        t('quickActions.features.noFlow'),
      ],
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-900",
    },
  ];

  const timelineEvents = [
    {
      time: t('realExample.timeline.min15.label'),
      event: t('realExample.timeline.min15.event'),
      icon: Droplet,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
    },
    {
      time: t('realExample.timeline.min20.label'),
      event: t('realExample.timeline.min20.event'),
      icon: Volume2,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-900",
    },
    {
      time: t('realExample.timeline.min25.label'),
      event: t('realExample.timeline.min25.event'),
      icon: Droplet,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
    },
    {
      time: t('realExample.timeline.min30.label'),
      event: t('realExample.timeline.min30.event'),
      icon: Zap,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-900",
    },
  ];

  return (
    <section id="ai-coaching" className="py-24 px-4 bg-background">
      <div className="container max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t('title.part1')}{" "}
            <span className="text-primary-600 dark:text-primary-400">{t('title.part2')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className={`h-full border-2 ${feature.borderColor} ${feature.bgColor} hover:shadow-lg transition-shadow`}>
                <CardHeader>
                  <div className={`p-3 rounded-lg ${feature.bgColor} border ${feature.borderColor} w-fit mb-3`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm font-medium">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{feature.detail}</p>

                  {/* Feature bullets */}
                  <ul className="space-y-2">
                    {feature.features.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <CheckCircle className={`w-4 h-4 ${feature.color} flex-shrink-0 mt-0.5`} />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Badge */}
                  <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground italic">{feature.badge}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Real-World Example */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                {t('realExample.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Timeline */}
              <div className="space-y-4">
                {timelineEvents.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full ${item.bgColor} border-2 ${item.borderColor}`}>
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      {index < timelineEvents.length - 1 && (
                        <div className="w-0.5 h-full bg-border mt-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">{item.time}</span>
                      </div>
                      <p className="text-sm">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer note */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            <strong className="text-foreground">{t('footer.bold')}</strong> {t('footer.text')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
