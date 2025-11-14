'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Camera, Sparkles, CheckCircle, Zap } from "lucide-react";
import { useTranslations } from 'next-intl';

export function EquipmentVision() {
  const t = useTranslations('landing.equipmentVision');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section id="equipment-vision" className="py-24 px-4 bg-gradient-to-b from-background to-muted/30">
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

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Visual Flow */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Step 1: Take Photo */}
            <motion.div variants={itemVariants}>
              <Card className="border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{t('step1.title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('step1.description')}</p>
                      <div className="mt-3 p-3 bg-muted/50 rounded-md border">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">📸</span>
                          <span>{t('step1.exampleDevice')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step 2: AI Recognition */}
            <motion.div variants={itemVariants}>
              <Card className="border-2 border-primary-300 dark:border-primary-700">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{t('step2.title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('step2.description')}</p>
                      <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-950/30 rounded-md border border-primary-200 dark:border-primary-800">
                        <div className="text-sm font-mono text-primary-900 dark:text-primary-100">
                          <div className="text-green-600 dark:text-green-400 mb-1">{'/\u002F ' + t('step2.detected')}</div>
                          <div className="pl-2 space-y-1">
                            <div><span className="text-primary-600 dark:text-primary-400">name:</span> "{t('step2.exampleEquipment')}"</div>
                            <div><span className="text-primary-600 dark:text-primary-400">confidence:</span> 0.92</div>
                            <div><span className="text-primary-600 dark:text-primary-400">status:</span> "approved"</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step 3: Exercise Suggestions */}
            <motion.div variants={itemVariants}>
              <Card className="border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{t('step3.title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('step3.description')}</p>
                      <div className="mt-3 space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-2 bg-muted/50 rounded-md border text-sm">
                            <div className="font-medium">{t(`step3.exercise${i}`)}</div>
                            <div className="text-xs text-muted-foreground">{t(`step3.exercise${i}Detail`)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Right: Value Props */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <Card className="border-2 border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  {t('benefits.title')}
                </CardTitle>
                <CardDescription>{t('benefits.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{t('benefits.point1')}</div>
                      <div className="text-xs text-muted-foreground">{t('benefits.point1Detail')}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{t('benefits.point2')}</div>
                      <div className="text-xs text-muted-foreground">{t('benefits.point2Detail')}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{t('benefits.point3')}</div>
                      <div className="text-xs text-muted-foreground">{t('benefits.point3Detail')}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t('benefits.techBadge')}</span>
                    <span className="font-mono text-primary-600 dark:text-primary-400">{t('benefits.model')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Use Case Example */}
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="text-sm">
                <div className="font-semibold text-orange-900 dark:text-orange-200 mb-2">
                  {t('useCase.title')}
                </div>
                <p className="text-orange-800 dark:text-orange-300 text-xs leading-relaxed">
                  {t('useCase.description')}
                </p>
              </div>
            </div>

            {/* Bottom Note */}
            <div className="p-3 bg-muted/50 rounded-md border text-xs text-muted-foreground">
              <span className="font-semibold">{t('footer.bold')}</span> {t('footer.text')}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
