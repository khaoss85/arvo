'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles, Rocket } from "lucide-react";
import { useTranslations } from 'next-intl';

export function SimpleShowcase() {
  const t = useTranslations('landingSimple.simpleShowcase');

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
    <section id="simple-showcase" className="py-24 px-4 bg-muted/30">
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
          className="grid md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Step 1 */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary-600 dark:bg-primary-400 text-white dark:text-black flex items-center justify-center font-bold text-xl shadow-lg">
                1
              </div>
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <MessageSquare className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                </div>
                <CardTitle className="text-center text-2xl">{t('step1.title')}</CardTitle>
                <CardDescription className="text-center text-lg mt-2">
                  {t('step1.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                    ⏱️ {t('step1.duration')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Step 2 */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary-600 dark:bg-primary-400 text-white dark:text-black flex items-center justify-center font-bold text-xl shadow-lg">
                2
              </div>
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <Sparkles className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                </div>
                <CardTitle className="text-center text-2xl">{t('step2.title')}</CardTitle>
                <CardDescription className="text-center text-lg mt-2">
                  {t('step2.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                    ⚡ {t('step2.duration')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Step 3 */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary-600 dark:bg-primary-400 text-white dark:text-black flex items-center justify-center font-bold text-xl shadow-lg">
                3
              </div>
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <Rocket className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                </div>
                <CardTitle className="text-center text-2xl">{t('step3.title')}</CardTitle>
                <CardDescription className="text-center text-lg mt-2">
                  {t('step3.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                    💪 {t('step3.duration')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
