'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  CalendarX2,
  Ban,
  MapPin,
  Package,
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock,
  Users,
  Bell
} from "lucide-react";
import { useTranslations } from 'next-intl';

export function SmartCalendarShowcase() {
  const t = useTranslations('landing.forTrainers.smartCalendar');

  const features = [
    {
      icon: CalendarX2,
      titleKey: 'antiBuchi',
      color: 'from-violet-500 to-purple-500'
    },
    {
      icon: Ban,
      titleKey: 'personalBlocks',
      color: 'from-rose-500 to-red-500'
    },
    {
      icon: MapPin,
      titleKey: 'multiLocation',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Package,
      titleKey: 'packages',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: AlertTriangle,
      titleKey: 'churnAlert',
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: BarChart3,
      titleKey: 'workload',
      color: 'from-indigo-500 to-blue-500'
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
            <Calendar className="w-4 h-4" />
            AI-Native Calendar
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-3 max-w-3xl mx-auto">
            {t('description')}
          </p>
        </motion.div>

        {/* Flow Diagram */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950/50 dark:to-primary-900/30 border-primary-200 dark:border-primary-800">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center mb-2">
                    <Clock className="w-6 h-6 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium">{t('flow.step1')}</span>
                </div>
                <div className="hidden md:block text-2xl text-primary-400">&rarr;</div>
                <div className="block md:hidden text-2xl text-primary-400">&darr;</div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center mb-2">
                    <CalendarX2 className="w-6 h-6 text-violet-600" />
                  </div>
                  <span className="text-sm font-medium">{t('flow.step2')}</span>
                </div>
                <div className="hidden md:block text-2xl text-primary-400">&rarr;</div>
                <div className="block md:hidden text-2xl text-primary-400">&darr;</div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center mb-2">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">{t('flow.step3')}</span>
                </div>
                <div className="hidden md:block text-2xl text-primary-400">&rarr;</div>
                <div className="block md:hidden text-2xl text-primary-400">&darr;</div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center mb-2">
                    <Bell className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium">{t('flow.step4')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {t(`features.${feature.titleKey}.title`)}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t(`features.${feature.titleKey}.description`)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Highlight Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="md:col-span-2 lg:col-span-1"
          >
            <Card className="h-full bg-gradient-to-br from-primary-500 to-primary-700 text-white">
              <CardContent className="p-6 flex flex-col justify-center h-full">
                <div className="text-5xl font-bold mb-2">{t('highlight.value')}</div>
                <p className="text-primary-100">{t('highlight.label')}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
