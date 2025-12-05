'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { X, Check, AlertTriangle, Smile, FileSpreadsheet, MessageCircle, Smartphone, ClipboardList, FileText, Sparkles, Cpu, MessageSquare, LineChart, UserPlus } from "lucide-react";
import { useTranslations } from 'next-intl';

export function PainPointGym() {
  const t = useTranslations('landing.forGyms.painPoint');

  const oldWayTools = [
    { icon: FileSpreadsheet, text: t('oldWay.tool1') },
    { icon: Smartphone, text: t('oldWay.tool2') },
    { icon: MessageCircle, text: t('oldWay.tool3') },
    { icon: ClipboardList, text: t('oldWay.tool4') },
    { icon: FileText, text: t('oldWay.tool5') },
  ];

  const newWayFeatures = [
    { icon: Sparkles, text: t('newWay.feature1') },
    { icon: Cpu, text: t('newWay.feature2') },
    { icon: MessageSquare, text: t('newWay.feature3') },
    { icon: LineChart, text: t('newWay.feature4') },
    { icon: UserPlus, text: t('newWay.feature5') },
  ];

  return (
    <section id="pain-point" className="py-24 px-4 bg-muted/30">
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

        <div className="grid md:grid-cols-2 gap-8">
          {/* Old Way - 5+ Tools */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <X className="w-6 h-6 text-red-500" />
                  <h3 className="text-xl font-bold text-red-700 dark:text-red-400">{t('oldWay.title')}</h3>
                </div>

                <div className="space-y-3 mb-6">
                  {oldWayTools.map((tool, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                        <tool.icon className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-muted-foreground text-sm">{tool.text}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-red-200 dark:border-red-900/50">
                  <p className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {t('oldWay.result')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* New Way with Arvo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="h-full border-primary-200 dark:border-primary-900/50 bg-primary-50/50 dark:bg-primary-950/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Check className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-xl font-bold text-primary-700 dark:text-primary-400">{t('newWay.title')}</h3>
                </div>

                <div className="space-y-3 mb-6">
                  {newWayFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <p className="text-foreground font-medium text-sm">{feature.text}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-primary-200 dark:border-primary-900/50">
                  <p className="text-primary-600 dark:text-primary-400 font-semibold flex items-center gap-2 text-sm">
                    <Smile className="w-4 h-4" />
                    {t('newWay.result')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
