'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Triangle,
  Brain,
  CheckCircle
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

export function AdvancedTechniquesDetailed() {
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
            {t('title.part1')}{" "}
            <span className="text-primary-600 dark:text-primary-400">{t('title.part2')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* AI Decision Card */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="border-2 border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800">
                  <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                How AI Applies Techniques
              </CardTitle>
              <CardDescription>
                The AI considers multiple factors before suggesting an advanced technique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { label: "Exercise Type", detail: "Compound vs isolation" },
                  { label: "Fatigue Level", detail: "Accumulated session fatigue" },
                  { label: "Training Approach", detail: "Methodology requirements" },
                  { label: "User Experience", detail: "Beginner to advanced" },
                ].map((factor, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{factor.label}</p>
                      <p className="text-xs text-muted-foreground">{factor.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Techniques Grid - 2 columns for detailed view */}
        <div className="grid md:grid-cols-2 gap-6">
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
                <Card className={`h-full border-2 ${colors.borderColor} hover:shadow-lg transition-all`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${colors.bgColor} border ${colors.borderColor}`}>
                          <Icon className={`w-5 h-5 ${colors.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{t(`techniques.${key}.name`)}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {t(`techniques.${key}.shortDescription`)}
                          </p>
                        </div>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", levelColors[level])}>
                        {t(`levels.${level}`)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t(`techniques.${key}.description`)}
                      </p>
                    </div>

                    <div className={`p-3 rounded-lg ${colors.bgColor} border ${colors.borderColor}`}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">When AI applies this:</p>
                      <p className={`text-sm ${colors.color}`}>
                        {t(`techniques.${key}.whenApplied`)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Example config:</span>
                      <code className={`text-xs font-mono ${colors.color} ${colors.bgColor} px-2 py-1 rounded border ${colors.borderColor}`}>
                        {t(`techniques.${key}.example`)}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Stats */}
        <motion.div
          className="mt-12 grid grid-cols-3 gap-4 max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="text-center p-4 bg-background rounded-lg border">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">8</div>
            <div className="text-xs text-muted-foreground">Techniques</div>
          </div>
          <div className="text-center p-4 bg-background rounded-lg border">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">AI</div>
            <div className="text-xs text-muted-foreground">Guided</div>
          </div>
          <div className="text-center p-4 bg-background rounded-lg border">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">Auto</div>
            <div className="text-xs text-muted-foreground">Applied</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
