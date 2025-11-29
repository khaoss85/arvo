'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Brain, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { useTranslations } from 'next-intl';

export function AIShowcase() {
  const t = useTranslations('landing.aiShowcase');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section id="ai-showcase" className="py-24 px-4 bg-muted/30">
      <div className="container max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t('title.part1')} <span className="text-primary-600 dark:text-primary-400">{t('title.part2')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Example 1: Exercise Selector */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      {t('exerciseArchitect.title')}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {t('exerciseArchitect.description')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Input */}
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">{t('exerciseArchitect.inputContextLabel')}</div>
                  <div className="bg-muted rounded-md p-3 text-sm font-mono space-y-1">
                    <div><span className="text-primary-600 dark:text-primary-400">weakPoints:</span> ["upper_chest"]</div>
                    <div><span className="text-primary-600 dark:text-primary-400">bodyType:</span> "ectomorph"</div>
                    <div><span className="text-primary-600 dark:text-primary-400">mesocyclePhase:</span> "accumulation"</div>
                    <div><span className="text-primary-600 dark:text-primary-400">caloricPhase:</span> "bulk"</div>
                    <div><span className="text-primary-600 dark:text-primary-400">activeInsights:</span> [{"{"}"severity": "warning", "exercise": "Dips"{"}"}]</div>
                  </div>
                </div>

                {/* Process */}
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-primary-500 animate-pulse" />
                </div>

                {/* Output */}
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">{t('exerciseArchitect.outputLabel')}</div>
                  <div className="bg-background rounded-md p-3 text-sm font-mono space-y-2 border">
                    <div className="text-green-600 dark:text-green-400">{`// ${t('exerciseArchitect.selectedExercises')}`}</div>
                    <div className="pl-2 space-y-1">
                      <div><span className="text-orange-600 dark:text-orange-400">1.</span> Incline DB Press</div>
                      <div className="text-xs text-muted-foreground pl-3">
                        → {t('exerciseArchitect.example.reason1')}
                      </div>
                      <div className="text-xs text-muted-foreground pl-3">
                        → Sets: 3 × 8-12 @ RIR 1-2
                      </div>
                    </div>

                    <div className="pt-2 text-green-600 dark:text-green-400">{`// ${t('exerciseArchitect.insightChanges')}`}</div>
                    <div className="pl-2 text-xs space-y-1">
                      <div className="text-red-400">{t('exerciseArchitect.example.avoided')}</div>
                      <div className="text-muted-foreground pl-3">
                        {t('exerciseArchitect.example.avoidedReason')}
                      </div>
                      <div className="text-green-400">{t('exerciseArchitect.example.substituted')}</div>
                      <div className="text-muted-foreground pl-3">
                        {t('exerciseArchitect.example.substitutedReason')}
                      </div>
                    </div>

                    <div className="pt-2 text-green-600 dark:text-green-400">{`// ${t('exerciseArchitect.technicalCues')}`}</div>
                    <div className="pl-2 text-xs text-muted-foreground">
                      {t('exerciseArchitect.example.cues')}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                  <span>{t('exerciseArchitect.stats.considers')}</span>
                  <span>{t('exerciseArchitect.stats.model')}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Example 2: Progression Calculator */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      {t('loadNavigator.title')}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {t('loadNavigator.description')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Previous Set */}
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">{t('loadNavigator.previousSetLabel')}</div>
                  <div className="bg-muted rounded-md p-3 text-sm font-mono space-y-1">
                    <div><span className="text-primary-600 dark:text-primary-400">exercise:</span> "Barbell Bench Press"</div>
                    <div><span className="text-primary-600 dark:text-primary-400">weight:</span> 100kg</div>
                    <div><span className="text-primary-600 dark:text-primary-400">reps:</span> {t('loadNavigator.example.reps')}</div>
                    <div><span className="text-primary-600 dark:text-primary-400">RIR:</span> {t('loadNavigator.example.rir')}</div>
                    <div><span className="text-primary-600 dark:text-primary-400">mentalReadiness:</span> {t('loadNavigator.example.mentalReadiness')}</div>
                  </div>
                </div>

                {/* AI Decision Process */}
                <div className="flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">{t('loadNavigator.aiReasoning')}</span>
                  </div>
                </div>

                {/* Next Set Suggestion */}
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">{t('loadNavigator.nextSetLabel')}</div>
                  <div className="bg-background rounded-md p-3 text-sm font-mono space-y-2 border border-primary-300 dark:border-primary-700">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">102.5kg</span>
                      <span className="text-muted-foreground">×</span>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">8 reps</span>
                      <span className="text-muted-foreground">@</span>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">RIR 1-2</span>
                    </div>

                    <div className="pt-2 border-t text-xs space-y-1">
                      <div className="text-green-600 dark:text-green-400">{`// ${t('loadNavigator.reasoningLabel')}`}</div>
                      <div className="text-muted-foreground pl-2 space-y-1">
                        <div>{t('loadNavigator.reasoning.point1')}</div>
                        <div>{t('loadNavigator.reasoning.point2')}</div>
                        <div>{t('loadNavigator.reasoning.point3')}</div>
                        <div>{t('loadNavigator.reasoning.point4')}</div>
                        <div>{t('loadNavigator.reasoning.point5')}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t text-xs">
                      <div className="text-green-600 dark:text-green-400">{`// ${t('loadNavigator.technicalFocusLabel')}`}</div>
                      <div className="text-muted-foreground pl-2">
                        {t('loadNavigator.technicalFocus')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                  <span>{t('loadNavigator.stats.factors')}</span>
                  <span>{t('loadNavigator.stats.response')}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Example 3: Real-Time Recalculation */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      {t('realTimeRecalc.title')}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {t('realTimeRecalc.description')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Set 1 Completed */}
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">{t('realTimeRecalc.set1Label')}</div>
                  <div className="bg-muted rounded-md p-3 text-sm font-mono space-y-1">
                    <div><span className="text-primary-600 dark:text-primary-400">weight:</span> 100kg</div>
                    <div><span className="text-primary-600 dark:text-primary-400">reps:</span> 8</div>
                    <div><span className="text-primary-600 dark:text-primary-400">RIR:</span> 3</div>
                    <div><span className="text-primary-600 dark:text-primary-400">mental:</span> 😕 (2/5)</div>
                  </div>
                </div>

                {/* AI Recalculating */}
                <div className="flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">{t('realTimeRecalc.recalculating')}</span>
                  </div>
                </div>

                {/* Set 2 Updated */}
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">{t('realTimeRecalc.set2Label')}</div>
                  <div className="bg-background rounded-md p-3 text-sm font-mono space-y-2 border border-green-300 dark:border-green-700">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">97.5kg</span>
                      <span className="text-muted-foreground">×</span>
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">8-10</span>
                    </div>

                    <div className="pt-2 border-t text-xs space-y-1">
                      <div className="text-green-600 dark:text-green-400">{`// ${t('realTimeRecalc.reasoningLabel')}`}</div>
                      <div className="text-muted-foreground pl-2 space-y-1">
                        <div>{t('realTimeRecalc.reasoning.point1')}</div>
                        <div>{t('realTimeRecalc.reasoning.point2')}</div>
                        <div>{t('realTimeRecalc.reasoning.point3')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                  <span>{t('realTimeRecalc.stats.timing')}</span>
                  <span>{t('realTimeRecalc.stats.frequency')}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Example 4: Cycle Intelligence */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      {t('cycleIntelligence.title')}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {t('cycleIntelligence.description')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Previous Cycle Stats */}
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">{t('cycleIntelligence.previousCycleLabel')}</div>
                  <div className="bg-muted rounded-md p-3 text-sm font-mono space-y-1">
                    <div><span className="text-primary-600 dark:text-primary-400">totalVolume:</span> 28,450 kg</div>
                    <div><span className="text-primary-600 dark:text-primary-400">mentalReadiness:</span> 2.8/5</div>
                    <div><span className="text-primary-600 dark:text-primary-400">workouts:</span> 18</div>
                    <div><span className="text-orange-600 dark:text-orange-400">trend:</span> "declining_readiness"</div>
                  </div>
                </div>

                {/* AI Analyzing */}
                <div className="flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <Brain className="w-5 h-5 text-primary-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">{t('cycleIntelligence.analyzing')}</span>
                  </div>
                </div>

                {/* New Split Suggestion */}
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">{t('cycleIntelligence.newSplitLabel')}</div>
                  <div className="bg-background rounded-md p-3 text-sm font-mono space-y-2 border border-green-300 dark:border-green-700">
                    <div className="text-green-600 dark:text-green-400">{`// ${t('cycleIntelligence.adaptations')}`}</div>
                    <div className="pl-2 space-y-1 text-xs">
                      <div className="text-muted-foreground">{t('cycleIntelligence.reasoning.volume')}</div>
                      <div className="text-muted-foreground">{t('cycleIntelligence.reasoning.recovery')}</div>
                      <div className="text-muted-foreground">{t('cycleIntelligence.reasoning.balance')}</div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                  <span>{t('cycleIntelligence.stats.learns')}</span>
                  <span>{t('cycleIntelligence.stats.compares')}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Example 5: Insights & Safety Integration */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="border-2 border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  {t('safetyFirst.title')}
                </CardTitle>
                <CardDescription>
                  {t('safetyFirst.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Detection */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">{t('safetyFirst.detection.title')}</div>
                    <div className="bg-background rounded-md p-3 text-xs font-mono border">
                      <div className="text-orange-600 dark:text-orange-400 mb-1">insight: {`{`}</div>
                      <div className="pl-2 space-y-0.5 text-muted-foreground">
                        <div>type: "pain",</div>
                        <div>severity: "warning",</div>
                        <div>exercise: "French Press",</div>
                        <div>affected: ["elbow"]</div>
                      </div>
                      <div className="text-orange-600 dark:text-orange-400">{`}`}</div>
                    </div>
                  </div>

                  {/* Learning */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">{t('safetyFirst.learning.title')}</div>
                    <div className="bg-background rounded-md p-3 text-xs font-mono border">
                      <div className="text-green-600 dark:text-green-400 mb-1">memory: {`{`}</div>
                      <div className="pl-2 space-y-0.5 text-muted-foreground">
                        <div>pattern: "substitution",</div>
                        <div>prefers: "Cable Pushdown",</div>
                        <div>over: "French Press",</div>
                        <div>confidence: 0.85,</div>
                        <div>occurrences: 5</div>
                      </div>
                      <div className="text-green-600 dark:text-green-400">{`}`}</div>
                    </div>
                  </div>

                  {/* Application */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">{t('safetyFirst.application.title')}</div>
                    <div className="bg-background rounded-md p-3 text-xs space-y-2 border">
                      <div className="font-mono">
                        <div className="text-blue-600 dark:text-blue-400">ExerciseSelector:</div>
                        <div className="text-muted-foreground pl-2">{t('safetyFirst.application.selector')}</div>
                      </div>
                      <div className="font-mono">
                        <div className="text-blue-600 dark:text-blue-400">ProgressionCalc:</div>
                        <div className="text-muted-foreground pl-2">{t('safetyFirst.application.progression')}</div>
                      </div>
                      <div className="font-mono">
                        <div className="text-blue-600 dark:text-blue-400">SubstitutionAgent:</div>
                        <div className="text-muted-foreground pl-2">{t('safetyFirst.application.substitution')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-950/40 rounded-md text-xs text-orange-900 dark:text-orange-200 border border-orange-300 dark:border-orange-800">
                  <strong>{t('safetyFirst.footer.bold')}</strong> {t('safetyFirst.footer.text')}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
