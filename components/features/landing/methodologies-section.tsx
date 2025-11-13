'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen, Zap } from "lucide-react";
import { useTranslations } from 'next-intl';

export function MethodologiesSection() {
  const t = useTranslations('landing.methodologies');

  return (
    <section className="py-24 px-4 bg-muted/30">
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

        <div className="grid md:grid-cols-2 gap-8">
          {/* Kuba Method */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <CardTitle>{t('kubaMethod.name')}</CardTitle>
                </div>
                <CardDescription>{t('kubaMethod.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Configuration Depth */}
                <div className="bg-primary-50 dark:bg-primary-950/20 rounded-md p-3 border border-primary-200 dark:border-primary-800">
                  <div className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">
                    {t('kubaMethod.implementationDepth')}
                  </div>
                  <div className="font-mono text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {t('kubaMethod.configLines', { count: 362 })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('kubaMethod.configDescription')}
                  </div>
                </div>

                {/* Core Principles */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">{t('kubaMethod.corePrinciples')}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        {t.rich('kubaMethod.principles.workingSets', {
                          mono: (chunks) => <span className="font-mono text-primary-600 dark:text-primary-400">{chunks}</span>
                        })}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        {t.rich('kubaMethod.principles.tempo', {
                          mono: (chunks) => <span className="font-mono text-primary-600 dark:text-primary-400">{chunks}</span>
                        })}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        {t.rich('kubaMethod.principles.lengthenedBiased', {
                          mono: (chunks) => <span className="font-mono text-primary-600 dark:text-primary-400">{chunks}</span>
                        })}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        {t.rich('kubaMethod.principles.rest', {
                          mono: (chunks) => <span className="font-mono text-primary-600 dark:text-primary-400">{chunks}</span>
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Volume Landmarks */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">{t('kubaMethod.volumeLandmarks')}</div>
                  <div className="bg-muted rounded-md p-3 font-mono text-xs space-y-1">
                    <div className="grid grid-cols-4 gap-2 font-semibold text-muted-foreground mb-1">
                      <div>{t('kubaMethod.volumeTable.muscle')}</div>
                      <div>{t('kubaMethod.volumeTable.mev')}</div>
                      <div>{t('kubaMethod.volumeTable.mav')}</div>
                      <div>{t('kubaMethod.volumeTable.mrv')}</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>{t('kubaMethod.volumeTable.chest')}</div>
                      <div className="text-green-600 dark:text-green-400">10</div>
                      <div className="text-primary-600 dark:text-primary-400">18</div>
                      <div className="text-orange-600 dark:text-orange-400">22</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>{t('kubaMethod.volumeTable.back')}</div>
                      <div className="text-green-600 dark:text-green-400">12</div>
                      <div className="text-primary-600 dark:text-primary-400">20</div>
                      <div className="text-orange-600 dark:text-orange-400">25</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>{t('kubaMethod.volumeTable.quads')}</div>
                      <div className="text-green-600 dark:text-green-400">10</div>
                      <div className="text-primary-600 dark:text-primary-400">16</div>
                      <div className="text-orange-600 dark:text-orange-400">20</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('kubaMethod.volumeAcronyms')}
                  </div>
                </div>

                {/* Periodization */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">{t('kubaMethod.periodization')}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded p-2 border border-blue-200 dark:border-blue-900">
                      <div className="font-semibold text-blue-700 dark:text-blue-300">{t('kubaMethod.phases.weeks1to3')}</div>
                      <div className="text-muted-foreground mt-1">{t('kubaMethod.phases.accumulation')}</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950/20 rounded p-2 border border-orange-200 dark:border-orange-900">
                      <div className="font-semibold text-orange-700 dark:text-orange-300">{t('kubaMethod.phases.weeks4to5')}</div>
                      <div className="text-muted-foreground mt-1">{t('kubaMethod.phases.intensification')}</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 rounded p-2 border border-green-200 dark:border-green-900">
                      <div className="font-semibold text-green-700 dark:text-green-300">{t('kubaMethod.phases.week6')}</div>
                      <div className="text-muted-foreground mt-1">{t('kubaMethod.phases.deload')}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mentzer HIT */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <CardTitle>{t('mentzerHIT.name')}</CardTitle>
                </div>
                <CardDescription>{t('mentzerHIT.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Configuration Depth */}
                <div className="bg-primary-50 dark:bg-primary-950/20 rounded-md p-3 border border-primary-200 dark:border-primary-800">
                  <div className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">
                    {t('mentzerHIT.implementationDepth')}
                  </div>
                  <div className="font-mono text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {t('mentzerHIT.configLines', { count: 532 })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('mentzerHIT.configDescription')}
                  </div>
                </div>

                {/* Core Principles */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">{t('mentzerHIT.corePrinciples')}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        {t.rich('mentzerHIT.principles.sets', {
                          mono: (chunks) => <span className="font-mono text-primary-600 dark:text-primary-400">{chunks}</span>
                        })}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        {t.rich('mentzerHIT.principles.intensity', {
                          bold: (chunks) => <span className="font-semibold">{chunks}</span>
                        })}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        {t.rich('mentzerHIT.principles.recovery', {
                          mono: (chunks) => <span className="font-mono text-primary-600 dark:text-primary-400">{chunks}</span>
                        })}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        {t('mentzerHIT.principles.preExhaust')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Techniques */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">{t('mentzerHIT.advancedTechniques')}</div>
                  <div className="bg-muted rounded-md p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>{t('mentzerHIT.techniques.staticHolds')}</span>
                      <span className="font-mono text-primary-600 dark:text-primary-400">{t('mentzerHIT.techniques.staticHoldsValue')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('mentzerHIT.techniques.forcedReps')}</span>
                      <span className="font-mono text-primary-600 dark:text-primary-400">{t('mentzerHIT.techniques.forcedRepsValue')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('mentzerHIT.techniques.restPause')}</span>
                      <span className="font-mono text-primary-600 dark:text-primary-400">{t('mentzerHIT.techniques.restPauseValue')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('mentzerHIT.techniques.negativeEmphasis')}</span>
                      <span className="font-mono text-primary-600 dark:text-primary-400">{t('mentzerHIT.techniques.negativeEmphasisValue')}</span>
                    </div>
                  </div>
                </div>

                {/* Philosophy */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">{t('mentzerHIT.philosophy')}</div>
                  <div className="bg-background rounded-md p-3 text-sm border italic text-muted-foreground">
                    {t('mentzerHIT.philosophyQuote')}
                  </div>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">{t('mentzerHIT.typicalSplit')}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted rounded p-2">
                      <div className="font-semibold">{t('mentzerHIT.split.workoutA')}</div>
                      <div className="text-muted-foreground mt-1">{t('mentzerHIT.split.workoutAMuscles')}</div>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <div className="font-semibold">{t('mentzerHIT.split.workoutB')}</div>
                      <div className="text-muted-foreground mt-1">{t('mentzerHIT.split.workoutBMuscles')}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('mentzerHIT.frequency')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Note */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="inline-block bg-background border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4 max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{t('bottomNote.bold')}</span> {t('bottomNote.text')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
