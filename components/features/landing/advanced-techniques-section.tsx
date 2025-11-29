'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";
import {
  TrendingDown,
  Pause,
  RefreshCw,
  TrendingUp,
  Zap,
  Link2,
  Target,
  Triangle
} from "lucide-react";
import { useTranslations } from 'next-intl';

const techniqueIcons = {
  dropSet: TrendingDown,
  restPause: Pause,
  superset: RefreshCw,
  topSetBackoff: TrendingUp,
  myoReps: Zap,
  giantSet: Link2,
  clusterSet: Target,
  pyramid: Triangle,
};

const techniqueColors = {
  dropSet: {
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
  },
  restPause: {
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  superset: {
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
  },
  topSetBackoff: {
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  myoReps: {
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  giantSet: {
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    borderColor: "border-pink-200 dark:border-pink-800",
  },
  clusterSet: {
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    borderColor: "border-cyan-200 dark:border-cyan-800",
  },
  pyramid: {
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
};

const levelColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

type TechniqueKey = keyof typeof techniqueIcons;

export function AdvancedTechniquesSection() {
  const t = useTranslations('landing.advancedTechniques');

  const techniques: TechniqueKey[] = [
    'dropSet',
    'restPause',
    'superset',
    'topSetBackoff',
    'myoReps',
    'giantSet',
    'clusterSet',
    'pyramid',
  ];

  return (
    <section className="py-24 px-4">
      <div className="container max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block mb-4 px-3 py-1 text-sm border border-primary-500 text-primary-600 dark:text-primary-400 rounded-full">
            {t('badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t('title.part1')}{" "}
            <span className="text-primary-600 dark:text-primary-400">{t('title.part2')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Techniques Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {techniques.map((key, index) => {
            const Icon = techniqueIcons[key];
            const colors = techniqueColors[key];
            const level = t(`techniques.${key}.level`) as keyof typeof levelColors;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Card className={`h-full border-2 ${colors.borderColor} hover:shadow-lg transition-all hover:scale-[1.02]`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`p-2.5 rounded-lg ${colors.bgColor} border ${colors.borderColor} w-fit`}>
                        <Icon className={`w-5 h-5 ${colors.color}`} />
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", levelColors[level])}>
                        {t(`levels.${level}`)}
                      </span>
                    </div>
                    <CardTitle className="text-lg mt-3">{t(`techniques.${key}.name`)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {t(`techniques.${key}.shortDescription`)}
                    </p>
                    <div className={`text-xs font-mono ${colors.color} ${colors.bgColor} px-2 py-1 rounded border ${colors.borderColor} inline-block`}>
                      {t(`techniques.${key}.example`)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            <span className="font-semibold text-foreground">8 techniques</span> • Applied automatically by AI based on exercise type, fatigue level, and training approach
          </p>
        </motion.div>
      </div>
    </section>
  );
}
