'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { FileText, Sparkles, Zap } from "lucide-react";
import { useTranslations } from 'next-intl';

export function NotesIntelligence() {
  const t = useTranslations('landing.notesIntelligence');

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
            {t('title.yourNotesBecome')}{" "}
            <span className="text-primary-600 dark:text-primary-400">{t('title.intelligence')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle.main')}
            <br />
            <span className="text-sm">{t('subtitle.tagline')}</span>
          </p>
        </motion.div>

        {/* 3-Step Flow */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Step 1: You Write */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full border-2">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t('step1.title')}</CardTitle>
                    <CardDescription className="text-xs">{t('step1.description')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-md p-4 text-sm space-y-3">
                  <div className="font-mono text-xs text-muted-foreground">{t('step1.exampleLabel')}</div>
                  <div className="italic text-foreground leading-relaxed">
                    {t('step1.exampleNote')}
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {t('step1.footer')}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Step 2: AI Extracts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="h-full border-2 border-primary-200 dark:border-primary-800">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900">
                    <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t('step2.title')}</CardTitle>
                    <CardDescription className="text-xs">{t('step2.description')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-background rounded-md p-4 text-sm font-mono space-y-2 border">
                  <div className="text-green-600 dark:text-green-400">{t('step2.code.insightDetected')}</div>
                  <div className="pl-2 space-y-1 text-xs">
                    <div><span className="text-orange-600 dark:text-orange-400">type:</span> "pain"</div>
                    <div><span className="text-orange-600 dark:text-orange-400">severity:</span> "warning"</div>
                    <div><span className="text-orange-600 dark:text-orange-400">exercise:</span> "Overhead Press"</div>
                    <div><span className="text-orange-600 dark:text-orange-400">affected:</span> ["shoulder"]</div>
                    <div><span className="text-orange-600 dark:text-orange-400">confidence:</span> 0.75</div>
                  </div>

                  <div className="text-green-600 dark:text-green-400 pt-2">{t('step2.code.memoryCreated')}</div>
                  <div className="pl-2 space-y-1 text-xs">
                    <div><span className="text-blue-600 dark:text-blue-400">category:</span> "preference"</div>
                    <div><span className="text-blue-600 dark:text-blue-400">pattern:</span> "{t('step2.code.patternValue')}"</div>
                    <div><span className="text-blue-600 dark:text-blue-400">confidence:</span> 0.70</div>
                    <div><span className="text-blue-600 dark:text-blue-400">occurrences:</span> 1</div>
                  </div>

                  <div className="text-green-600 dark:text-green-400 pt-2">{t('step2.code.alternativeSuggested')}</div>
                  <div className="pl-2 text-xs">
                    <div><span className="text-purple-600 dark:text-purple-400">substitute:</span> "Landmine Press"</div>
                    <div><span className="text-purple-600 dark:text-purple-400">reason:</span> "{t('step2.code.reasonValue')}"</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Step 3: Next Workout Adapts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="h-full border-2 border-green-200 dark:border-green-900/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                    <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t('step3.title')}</CardTitle>
                    <CardDescription className="text-xs">{t('step3.description')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900">
                    <div className="text-red-600 dark:text-red-400 font-bold shrink-0">✗</div>
                    <div className="flex-1">
                      <div className="font-semibold text-red-700 dark:text-red-300">Overhead Press</div>
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">{t('step3.avoided')}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900">
                    <div className="text-green-600 dark:text-green-400 font-bold shrink-0">✓</div>
                    <div className="flex-1">
                      <div className="font-semibold text-green-700 dark:text-green-300">Squats</div>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">{t('step3.boosted')}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-md border border-purple-200 dark:border-purple-900">
                    <div className="text-purple-600 dark:text-purple-400 font-bold shrink-0">→</div>
                    <div className="flex-1">
                      <div className="font-semibold text-purple-700 dark:text-purple-300">Landmine Press</div>
                      <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">{t('step3.suggested')}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Real Example */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">{t('realExample.title')}</CardTitle>
              <CardDescription>{t('realExample.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Input */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-muted-foreground">{t('realExample.inputLabel')}</div>
                  <div className="bg-muted rounded-md p-4 italic text-sm leading-relaxed">
                    {t('realExample.inputNote')}
                  </div>
                </div>

                {/* Output */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-muted-foreground">{t('realExample.outputLabel')}</div>
                  <div className="bg-background rounded-md p-4 text-xs font-mono space-y-3 border">
                    <div>
                      <div className="text-orange-600 dark:text-orange-400">insight_1: {`{`}</div>
                      <div className="pl-2 text-muted-foreground">type: "pain", exercise: "Deadlifts"</div>
                      <div className="pl-2 text-muted-foreground">severity: "caution", affected: ["lower_back"]</div>
                      <div className="text-orange-600 dark:text-orange-400">{`}`}</div>
                    </div>

                    <div>
                      <div className="text-blue-600 dark:text-blue-400">memory_1: {`{`}</div>
                      <div className="pl-2 text-muted-foreground">category: "preference"</div>
                      <div className="pl-2 text-muted-foreground">pattern: "{t('realExample.preferencePattern')}"</div>
                      <div className="text-blue-600 dark:text-blue-400">{`}`}</div>
                    </div>

                    <div>
                      <div className="text-purple-600 dark:text-purple-400">insight_2: {`{`}</div>
                      <div className="pl-2 text-muted-foreground">type: "fatigue", affected: ["shoulders"]</div>
                      <div className="pl-2 text-muted-foreground">action: "{t('realExample.actionValue')}"</div>
                      <div className="text-purple-600 dark:text-purple-400">{`}`}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-950/20 rounded-md text-sm border border-primary-200 dark:border-primary-800">
                <p className="text-primary-900 dark:text-foreground">
                  <strong>{t('realExample.contextBold')}</strong> {t('realExample.contextText')}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="inline-block bg-background border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4 max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{t('footer.noTaggingBold')}</span> {t('footer.text')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
