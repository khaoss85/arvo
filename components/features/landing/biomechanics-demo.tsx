'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Scale, ArrowRight } from "lucide-react";
import { useTranslations } from 'next-intl';

export function BiomechanicsDemo() {
  const t = useTranslations('landing.biomechanics');

  const conversions = [
    {
      from: t('conversions.benchToDumbbell.from'),
      fromWeight: "100kg",
      to: t('conversions.benchToDumbbell.to'),
      toWeight: t('conversions.benchToDumbbell.toWeight'),
      multiplier: "~40-45%",
      reason: t('conversions.benchToDumbbell.reason')
    },
    {
      from: t('conversions.benchToMachine.from'),
      fromWeight: "100kg",
      to: t('conversions.benchToMachine.to'),
      toWeight: "~80kg",
      multiplier: "~80%",
      reason: t('conversions.benchToMachine.reason')
    },
    {
      from: t('conversions.benchToCable.from'),
      fromWeight: "100kg",
      to: t('conversions.benchToCable.to'),
      toWeight: "~70-75kg",
      multiplier: "~70-75%",
      reason: t('conversions.benchToCable.reason')
    },
    {
      from: t('conversions.squatToBulgarian.from'),
      fromWeight: "140kg",
      to: t('conversions.squatToBulgarian.to'),
      toWeight: t('conversions.squatToBulgarian.toWeight'),
      multiplier: "~45%",
      reason: t('conversions.squatToBulgarian.reason')
    },
  ];

  return (
    <section className="py-24 px-4 bg-background">
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
            <br />
            <span className="text-sm">{t('tagline')}</span>
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {conversions.map((conversion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <Scale className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <div className="text-xs font-mono text-muted-foreground">
                      {conversion.multiplier}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* From */}
                  <div className="bg-muted rounded-md p-3">
                    <div className="text-xs text-muted-foreground mb-1">{t('conversionCard.from')}</div>
                    <div className="font-semibold">{conversion.from}</div>
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                      {conversion.fromWeight}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>

                  {/* To */}
                  <div className="bg-background rounded-md p-3 border-2 border-primary-200 dark:border-primary-800">
                    <div className="text-xs text-muted-foreground mb-1">{t('conversionCard.to')}</div>
                    <div className="font-semibold">{conversion.to}</div>
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                      {conversion.toWeight}
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">{t('conversionCard.why')}</span> {conversion.reason}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Code Example */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">{t('codeExample.title')}</CardTitle>
              <CardDescription>{t('codeExample.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
                <div className="space-y-1">
                  <div className="text-green-600 dark:text-green-400">{t('codeExample.code.inputComment')}</div>
                  <div className="text-muted-foreground">
                    original: <span className="text-primary-600 dark:text-primary-400">"Barbell Bench Press"</span>
                  </div>
                  <div className="text-muted-foreground">
                    originalWeight: <span className="text-primary-600 dark:text-primary-400">100</span>
                  </div>
                  <div className="text-muted-foreground">
                    substitute: <span className="text-primary-600 dark:text-primary-400">"Dumbbell Bench Press"</span>
                  </div>

                  <div className="text-green-600 dark:text-green-400 pt-3">{t('codeExample.code.processingComment')}</div>
                  <div className="text-muted-foreground pl-2">
                    <div>{t('codeExample.code.step1')}</div>
                    <div>{t('codeExample.code.step2')}</div>
                    <div>{t('codeExample.code.step3')}</div>
                    <div>{t('codeExample.code.step4')}</div>
                  </div>

                  <div className="text-green-600 dark:text-green-400 pt-3">{t('codeExample.code.outputComment')}</div>
                  <div className="text-muted-foreground">{`{`}</div>
                  <div className="text-muted-foreground pl-2">
                    suggestedWeight: <span className="text-primary-600 dark:text-primary-400">42.5</span>,
                  </div>
                  <div className="text-muted-foreground pl-2">
                    weightUnit: <span className="text-primary-600 dark:text-primary-400">"kg per hand"</span>,
                  </div>
                  <div className="text-muted-foreground pl-2">
                    adjustmentReason: <span className="text-primary-600 dark:text-primary-400">"Unilateral load distribution"</span>,
                  </div>
                  <div className="text-muted-foreground pl-2">
                    validation: <span className="text-primary-600 dark:text-primary-400">"approved"</span>
                  </div>
                  <div className="text-muted-foreground">{`}`}</div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md text-sm border border-blue-200 dark:border-blue-900">
                <div className="text-blue-600 dark:text-blue-400 font-semibold shrink-0">{t('proTip.label')}</div>
                <div className="text-blue-900 dark:text-blue-200">
                  {t('proTip.text')}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
