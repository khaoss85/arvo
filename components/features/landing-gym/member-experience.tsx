'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { LayoutDashboard, Dumbbell, Camera, Play, Timer } from "lucide-react";
import { useTranslations } from 'next-intl';

export function MemberExperience() {
  const t = useTranslations('landing.forGyms.memberExperience');

  const features = [
    { icon: LayoutDashboard, text: t('features.dashboard') },
    { icon: Dumbbell, text: t('features.workouts') },
    { icon: Camera, text: t('features.progress') },
    { icon: Play, text: t('features.animations') },
    { icon: Timer, text: t('features.timer') },
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
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 gap-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <p className="font-medium">{feature.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Phone Frame */}
              <div className="w-[280px] h-[560px] bg-gray-900 rounded-[40px] p-3 shadow-2xl">
                <div className="w-full h-full bg-background rounded-[32px] overflow-hidden">
                  {/* Status Bar */}
                  <div className="h-8 bg-primary-600 flex items-center justify-center">
                    <div className="w-20 h-1 bg-white/30 rounded-full" />
                  </div>

                  {/* App Content Mockup */}
                  <div className="p-4 space-y-4">
                    {/* Header with Gym Logo */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">YG</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Your Gym</p>
                        <p className="text-xs text-muted-foreground">Today&apos;s Workout</p>
                      </div>
                    </div>

                    {/* Workout Card */}
                    <Card className="border-primary-200 dark:border-primary-800">
                      <CardContent className="p-3">
                        <p className="font-bold text-sm mb-2">Push Day</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Bench Press</span>
                            <span className="text-muted-foreground">4x8-10</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Incline DB Press</span>
                            <span className="text-muted-foreground">3x10-12</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Cable Flyes</span>
                            <span className="text-muted-foreground">3x12-15</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Progress Preview */}
                    <div className="flex gap-2">
                      <div className="flex-1 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary-500/20 rounded-full blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary-500/20 rounded-full blur-xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
