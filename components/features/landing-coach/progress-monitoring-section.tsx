'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Camera, BarChart2, TrendingUp, History } from "lucide-react";
import { useTranslations } from 'next-intl';

export function ProgressMonitoringSection() {
  const t = useTranslations('landing.forTrainers.progressMonitoring');

  const features = [
    {
      icon: Camera,
      title: t('features.checkRoom.title'),
      description: t('features.checkRoom.description'),
      color: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
    },
    {
      icon: BarChart2,
      title: t('features.volumeGraphs.title'),
      description: t('features.volumeGraphs.description'),
      color: "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400",
    },
    {
      icon: TrendingUp,
      title: t('features.overloadTracking.title'),
      description: t('features.overloadTracking.description'),
      color: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400",
    },
    {
      icon: History,
      title: t('features.history.title'),
      description: t('features.history.description'),
      color: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400",
    },
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

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center`}>
                      <feature.icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Visual Preview */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="overflow-hidden border-2 border-primary-200 dark:border-primary-800">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                {/* Check Room Preview */}
                <div className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary-600" />
                    Check Room
                  </h4>
                  <div className="flex gap-2">
                    <div className="flex-1 aspect-[3/4] rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Week 1</span>
                    </div>
                    <div className="flex-1 aspect-[3/4] rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/50 dark:to-primary-900/20 flex items-center justify-center border-2 border-primary-300 dark:border-primary-700">
                      <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Week 8</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Side-by-side comparison</p>
                </div>

                {/* Volume Graph Preview */}
                <div className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-green-600" />
                    Volume Analytics
                  </h4>
                  <div className="h-24 flex items-end justify-between gap-1">
                    {[40, 55, 60, 75, 65, 80, 85, 90].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-green-500 to-green-300 rounded-t-sm"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Weekly sets per muscle</p>
                </div>

                {/* Progressive Overload Preview */}
                <div className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Progress Tracking
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Bench Press</span>
                        <span className="text-green-600">+12.5kg</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '78%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Squat</span>
                        <span className="text-green-600">+20kg</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Deadlift</span>
                        <span className="text-green-600">+15kg</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '68%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
